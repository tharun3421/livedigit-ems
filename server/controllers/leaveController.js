import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";

// ─── Leave limits ─────────────────────────────────────────────────────────────
export const LEAVE_LIMITS = {
    SICK:        4,
    CASUAL:      2,
    LOSS_OF_PAY: Infinity,
    EARNED:      Infinity,
}

const EL_PER_MONTH = 2

/** Inclusive calendar days between two dates */
const countDays = (startDate, endDate) =>
    Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1

// ─── Working days = calendar days − Sundays − 2 (Earned Leaves) ──────────────
// Working days = calendar days − 4 Sundays − 2 Earned Leaves = calendar days − 6
const getWorkingDays = (month, year) => {
    return new Date(year, month, 0).getDate() - 6
}

// ─── Earned Leave: 2 per month, resets each month ────────────────────────────
const getEarnedLeaveBalance = async (employee) => {
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const accumulated = EL_PER_MONTH  // always 2 for current month

    const approvedEL = await LeaveApplication.find({
        employeeId: employee._id,
        type:       "EARNED",
        status:     "APPROVED",
        startDate:  { $gte: monthStart, $lte: monthEnd },
    })

    const used      = approvedEL.reduce((sum, l) => sum + countDays(l.startDate, l.endDate), 0)
    const remaining = Math.max(0, accumulated - used)

    return { accumulated, used, remaining, perMonth: EL_PER_MONTH }
}

// ─── Sick & Casual: resets every new year ─────────────────────────────────────
const getUsedLeaveCounts = async (employeeId) => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const approved = await LeaveApplication.find({
        employeeId,
        status:    "APPROVED",
        startDate: { $gte: startOfYear },
        type:      { $in: ["SICK", "CASUAL"] },
    })
    const counts = { SICK: 0, CASUAL: 0 }
    for (const leave of approved) {
        const days = countDays(leave.startDate, leave.endDate)
        if (counts[leave.type] !== undefined) counts[leave.type] += days
    }
    return counts
}

// ─── Create Leave ─────────────────────────────────────────────────────────────
export const createLeave = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.session.userId });
        if (!employee)          return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted) return res.status(403).json({ error: "Your account is deactivated." });

        const { type, startDate, endDate, reason } = req.body;

        if (!type || !startDate || !endDate || !reason)
            return res.status(400).json({ error: "Missing required fields" });
        if (!["SICK", "CASUAL", "LOSS_OF_PAY", "EARNED"].includes(type))
            return res.status(400).json({ error: "Invalid leave type" });

        const startDateObj = new Date(startDate)
        const endDateObj   = new Date(endDate)

        if (endDateObj < startDateObj)
            return res.status(400).json({ error: "End date cannot be before start date" });

        const requestedDays = countDays(startDateObj, endDateObj)

        if (type === "SICK" || type === "CASUAL") {
            const used      = await getUsedLeaveCounts(employee._id)
            const limit     = LEAVE_LIMITS[type]
            const remaining = limit - used[type]
            if (requestedDays > remaining) {
                return res.status(400).json({
                    error: `You only have ${remaining} ${type.replace("_", " ")} day(s) remaining (limit: ${limit}).`,
                    remaining, limit,
                });
            }
        }

        if (type === "EARNED") {
            const elBalance = await getEarnedLeaveBalance(employee)
            if (requestedDays > elBalance.remaining) {
                return res.status(400).json({
                    error: `You only have ${elBalance.remaining} Earned Leave day(s) available this month.`,
                    remaining:   elBalance.remaining,
                    accumulated: elBalance.accumulated,
                });
            }
        }

        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type, startDate: startDateObj, endDate: endDateObj, reason, status: "PENDING",
        });

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
        const el     = await getEarnedLeaveBalance(employee)

        // LOP: current month only — resets each month
        const now        = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const lopApproved = await LeaveApplication.find({
            employeeId: employee._id,
            type:       "LOSS_OF_PAY",
            status:     "APPROVED",
            startDate:  { $lte: monthEnd },
            endDate:    { $gte: monthStart },
        })
        const lopUsedDays = lopApproved.reduce((s, l) => {
            const start = new Date(Math.max(new Date(l.startDate), monthStart))
            const end   = new Date(Math.min(new Date(l.endDate),   monthEnd))
            if (end < start) return s
            return s + countDays(start, end)
        }, 0)

        const leaveBalance = {
            SICK:        { used: used.SICK,   remaining: LEAVE_LIMITS.SICK   - used.SICK,   limit: LEAVE_LIMITS.SICK   },
            CASUAL:      { used: used.CASUAL, remaining: LEAVE_LIMITS.CASUAL - used.CASUAL, limit: LEAVE_LIMITS.CASUAL },
            LOSS_OF_PAY: { used: lopUsedDays, remaining: null, limit: null },
            EARNED:      {
                used:        el.used,
                remaining:   el.remaining,
                accumulated: el.accumulated,
                perMonth:    el.perMonth,
                limit:       null,
            },
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

        leave.status = status;
        await leave.save();

        return res.json({ success: true, data: leave });
    } catch (error) {
        console.error("updateLeaveStatus error:", error);
        return res.status(500).json({ error: "Failed to update leave status" });
    }
};

// ─── LOP Summary (admin — used by payslip form) ───────────────────────────────
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

        const lopLeaves = await LeaveApplication.find({
            employeeId:  employee._id,
            type:        "LOSS_OF_PAY",
            status:      "APPROVED",
            startDate:   { $lte: monthEnd },
            endDate:     { $gte: monthStart },
        })

        let totalDays      = 0
        const leaveDetails = []
        for (const leave of lopLeaves) {
            const start = new Date(Math.max(new Date(leave.startDate), monthStart))
            const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
            const days  = countDays(start, end)
            totalDays  += days
            leaveDetails.push({ id: leave._id.toString(), startDate: leave.startDate, endDate: leave.endDate, days })
        }

        // Working days = calendar days in month − Sundays − 2 (Earned Leaves)
        const workingDays = getWorkingDays(m, y)
        const perDayRate  = parseFloat((employee.basicSalary / workingDays).toFixed(2))
        const amount      = parseFloat((perDayRate * totalDays).toFixed(2))

        return res.json({
            days: totalDays, amount,
            basicSalary:  employee.basicSalary,
            workingDays,
            perDayRate,
            leaveDetails,
        });
    } catch (error) {
        console.error("getLopSummary error:", error);
        return res.status(500).json({ error: "Failed to get LOP summary" });
    }
};