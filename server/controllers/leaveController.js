import { inngest } from "../inngest/index.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";

// ─── Leave limits ─────────────────────────────────────────────────────────────
export const LEAVE_LIMITS = {
    SICK:        6,
    CASUAL:      6,
    LOSS_OF_PAY: Infinity,   // unlimited — deducted from salary on approval
}

/** Inclusive calendar days between two dates */
const countDays = (startDate, endDate) =>
    Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1

/** Approved leave DAYS used per type, current calendar year */
const getUsedLeaveCounts = async (employeeId) => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const approved = await LeaveApplication.find({
        employeeId, status: "APPROVED", startDate: { $gte: startOfYear },
    })
    const counts = { SICK: 0, CASUAL: 0, LOSS_OF_PAY: 0 }
    for (const leave of approved) {
        const days = countDays(leave.startDate, leave.endDate)
        if (counts[leave.type] !== undefined) counts[leave.type] += days
    }
    return counts
}

/**
 * LOP deduction = basicSalary / 26 × lopDays
 */
const calcLopDeduction = (basicSalary, lopDays) =>
    parseFloat(((basicSalary / 26) * lopDays).toFixed(2))

// ─── Create Leave ─────────────────────────────────────────────────────────────
export const createLeave = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.session.userId });
        if (!employee)          return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted) return res.status(403).json({ error: "Your account is deactivated. You cannot apply for leave." });

        const { type, startDate, endDate, reason } = req.body;
        if (!type || !startDate || !endDate || !reason)
            return res.status(400).json({ error: "Missing required fields" });
        if (!["SICK", "CASUAL", "LOSS_OF_PAY"].includes(type))
            return res.status(400).json({ error: "Invalid leave type" });

        const today        = new Date(); today.setHours(0, 0, 0, 0)
        const startDateObj = new Date(startDate)
        const endDateObj   = new Date(endDate)

        if (startDateObj < today || endDateObj < today)
            return res.status(400).json({ error: "Leave dates must be in the future" });
        if (endDateObj < startDateObj)
            return res.status(400).json({ error: "End date cannot be before start date" });

        // Enforce limit for SICK / CASUAL only (LOP is unlimited)
        if (type !== "LOSS_OF_PAY") {
            const requestedDays = countDays(startDateObj, endDateObj)
            const used          = await getUsedLeaveCounts(employee._id)
            const limit         = LEAVE_LIMITS[type]
            const remaining     = limit - used[type]
            if (requestedDays > remaining) {
                return res.status(400).json({
                    error: `You only have ${remaining} ${type.replace("_", " ")} day(s) remaining (limit: ${limit}).`,
                    remaining, limit,
                });
            }
        }

        const leave = await LeaveApplication.create({
            employeeId: employee._id, type,
            startDate: startDateObj, endDate: endDateObj, reason, status: "PENDING",
        });

        try {
            await inngest.send({ name: "leave/pending", data: { leaveApplicationId: leave._id.toString() } });
        } catch (inngestError) {
            console.error("Inngest send failed:", inngestError.message);
        }

        return res.json({ success: true, data: leave });
    } catch (error) {
        console.error("createLeave error:", error.message);
        return res.status(500).json({ error: error.message });
    }
};

// ─── Get Leaves ───────────────────────────────────────────────────────────────
export const getLeaves = async (req, res) => {
    try {
        const isAdmin = req.session.role === "ADMIN";

        if (isAdmin) {
            const where  = req.query.status ? { status: req.query.status } : {};
            const leaves = await LeaveApplication.find(where).populate("employeeId").sort({ createdAt: -1 });
            const data   = leaves
                .filter((l) => l.employeeId && !l.employeeId.isDeleted)
                .map((l) => {
                    const obj = l.toObject();
                    return { ...obj, id: obj._id.toString(), employee: obj.employeeId, employeeId: obj.employeeId?._id?.toString() };
                });
            return res.json({ data });
        }

        const employee = await Employee.findOne({ userId: req.session.userId }).lean();
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const leaves = await LeaveApplication.find({ employeeId: employee._id }).sort({ createdAt: -1 });
        const used   = await getUsedLeaveCounts(employee._id)

        const leaveBalance = {
            SICK:        { used: used.SICK,        remaining: LEAVE_LIMITS.SICK - used.SICK,        limit: LEAVE_LIMITS.SICK   },
            CASUAL:      { used: used.CASUAL,      remaining: LEAVE_LIMITS.CASUAL - used.CASUAL,    limit: LEAVE_LIMITS.CASUAL },
            LOSS_OF_PAY: { used: used.LOSS_OF_PAY, remaining: null, limit: null },  // unlimited
        }

        return res.json({ data: leaves, leaveBalance, employee: { ...employee, id: employee._id.toString() } });
    } catch (error) {
        console.error("getLeaves error:", error);
        return res.status(500).json({ error: "Failed to fetch leaves" });
    }
};

// ─── Update Leave Status ──────────────────────────────────────────────────────
export const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["APPROVED", "REJECTED", "PENDING"].includes(status))
            return res.status(400).json({ error: "Invalid status" });

        const leave = await LeaveApplication.findById(req.params.id);
        if (!leave) return res.status(404).json({ error: "Leave application not found" });

        const previousStatus = leave.status;
        leave.status         = status;
        await leave.save();

        // ── LOP salary deduction / reversal ───────────────────────────────────
        if (leave.type === "LOSS_OF_PAY") {
            const employee = await Employee.findById(leave.employeeId);
            if (employee) {
                const lopDays   = countDays(leave.startDate, leave.endDate)
                const deduction = calcLopDeduction(employee.basicSalary, lopDays)

                if (status === "APPROVED" && previousStatus !== "APPROVED") {
                    employee.deductions = parseFloat((employee.deductions + deduction).toFixed(2))
                    await employee.save()
                    console.log(`✅ LOP approved: ${lopDays} day(s), ₹${deduction} deducted from ${employee.firstName} ${employee.lastName}`)
                } else if (previousStatus === "APPROVED" && status !== "APPROVED") {
                    employee.deductions = parseFloat(Math.max(0, employee.deductions - deduction).toFixed(2))
                    await employee.save()
                    console.log(`↩️  LOP reversed: ₹${deduction} refunded to ${employee.firstName} ${employee.lastName}`)
                }
            }
        }

        return res.json({ success: true, data: leave });
    } catch (error) {
        console.error("updateLeaveStatus error:", error);
        return res.status(500).json({ error: "Failed to update leave status" });
    }
};

// ─── GET LOP Summary for a specific employee + month/year ─────────────────────
// Used by GeneratePayslipForm to preview LOP deduction before generating
// GET /api/leave/lop-summary?employeeId=xxx&month=5&year=2026
export const getLopSummary = async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;

        if (!employeeId || !month || !year)
            return res.status(400).json({ error: "employeeId, month and year are required" });

        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const m          = parseInt(month)
        const y          = parseInt(year)
        const monthStart = new Date(y, m - 1, 1)
        const monthEnd   = new Date(y, m, 0, 23, 59, 59)

        // Find approved LOP leaves overlapping this month
        const lopLeaves = await LeaveApplication.find({
            employeeId: employee._id,
            type:       "LOSS_OF_PAY",
            status:     "APPROVED",
            startDate:  { $lte: monthEnd },
            endDate:    { $gte: monthStart },
        })

        let totalDays = 0
        const leaveDetails = []

        for (const leave of lopLeaves) {
            // Clamp to this month's boundaries
            const start = new Date(Math.max(new Date(leave.startDate), monthStart))
            const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
            const days  = countDays(start, end)
            totalDays  += days
            leaveDetails.push({
                id:        leave._id.toString(),
                startDate: leave.startDate,
                endDate:   leave.endDate,
                days,
            })
        }

        const amount = calcLopDeduction(employee.basicSalary, totalDays)

        return res.json({
            days:         totalDays,
            amount,
            basicSalary:  employee.basicSalary,
            perDayRate:   parseFloat((employee.basicSalary / 26).toFixed(2)),
            leaveDetails,
        });

    } catch (error) {
        console.error("getLopSummary error:", error);
        return res.status(500).json({ error: "Failed to get LOP summary" });
    }
};