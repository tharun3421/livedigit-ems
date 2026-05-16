import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";
import LeaveApplication from "../models/LeaveApplication.js";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

/** Working days in a month excluding weekoff days */
const getWorkingDays = (year, month, weekOffDays = []) => {
    const totalDays = new Date(year, month, 0).getDate()
    let working = 0
    for (let d = 1; d <= totalDays; d++) {
        const dayName = DAYS[new Date(year, month - 1, d).getDay()]
        if (!weekOffDays.includes(dayName)) working++
    }
    return working
}

/** Total approved LOP days for an employee in a specific month — clamped to that month */
const getLopDaysForMonth = async (employeeId, month, year) => {
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd   = new Date(year, month, 0, 23, 59, 59)

    const lopLeaves = await LeaveApplication.find({
        employeeId,
        type:      "LOSS_OF_PAY",
        status:    "APPROVED",
        startDate: { $lte: monthEnd },
        endDate:   { $gte: monthStart },
    })

    let totalDays = 0
    for (const leave of lopLeaves) {
        const start = new Date(Math.max(new Date(leave.startDate), monthStart))
        const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
        totalDays  += Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    }
    return totalDays
}

// ─── Create Payslip ───────────────────────────────────────────────────────────
export const createPayslip = async (req, res) => {
    try {
        const { employeeId, month, year, allowances: customAllowances } = req.body;

        if (!employeeId || !month || !year)
            return res.status(400).json({ error: "employeeId, month and year are required" });

        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const m = Number(month)
        const y = Number(year)

        // Salary components — admin can override allowances, rest comes from employee record
        const basicSalary  = employee.basicSalary || 0
        const allowances   = customAllowances !== undefined
            ? Number(customAllowances)
            : (employee.allowances || 0)

        // Working days
        const weekOffDays  = employee.workSchedule?.weekOff ?? ["Saturday", "Sunday"]
        const totalWorkDays = getWorkingDays(y, m, weekOffDays)

        // LOP
        const lopDays   = await getLopDaysForMonth(employeeId, m, y)
        const lopAmount = parseFloat(((basicSalary / 26) * lopDays).toFixed(2))

        // Deductions = employee base deductions + LOP amount
        const baseDeductions  = employee.deductions || 0
        const totalDeductions = parseFloat((baseDeductions + lopAmount).toFixed(2))

        const daysWorked = totalWorkDays - lopDays
        const netSalary  = parseFloat((basicSalary + allowances - totalDeductions).toFixed(2))

        const payslip = await Payslip.create({
            employeeId,
            month:         m,
            year:          y,
            basicSalary,
            allowances,
            deductions:    totalDeductions,
            lopDays,
            lopAmount,
            totalWorkDays,
            daysWorked,
            netSalary,
        });

        return res.json({ success: true, data: payslip });

    } catch (error) {
        if (error.code === 11000)
            return res.status(400).json({ error: "Payslip for this employee/month/year already exists" });
        console.error("createPayslip error:", error);
        return res.status(500).json({ error: "Failed to create payslip" });
    }
};

// ─── Get Payslips ─────────────────────────────────────────────────────────────
export const getPayslips = async (req, res) => {
    try {
        const isAdmin = req.session.role === "ADMIN";

        if (isAdmin) {
            const payslips = await Payslip.find()
                .populate("employeeId", "firstName lastName email position department joinDate isDeleted")
                .sort({ createdAt: -1 });

            const data = payslips
                .filter((p) => p.employeeId && !p.employeeId.isDeleted)
                .map((p) => {
                    const obj = p.toObject();
                    return {
                        ...obj,
                        id:         obj._id.toString(),
                        employee:   obj.employeeId,
                        employeeId: obj.employeeId?._id?.toString(),
                    };
                });

            return res.json({ data });
        }

        const employee = await Employee.findOne({ userId: req.session.userId });
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const payslips = await Payslip.find({ employeeId: employee._id }).sort({ createdAt: -1 });
        return res.json({ data: payslips });

    } catch (error) {
        console.error("getPayslips error:", error);
        return res.status(500).json({ error: "Failed to fetch payslips" });
    }
};

// ─── Get Payslip By ID ────────────────────────────────────────────────────────
export const getPayslipById = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id)
            .populate("employeeId", "firstName lastName email position department joinDate workSchedule")
            .lean();

        if (!payslip) return res.status(404).json({ error: "Payslip not found" });

        return res.json({
            ...payslip,
            id:       payslip._id.toString(),
            employee: payslip.employeeId,
        });

    } catch (error) {
        console.error("getPayslipById error:", error);
        return res.status(500).json({ error: "Failed to fetch payslip" });
    }
};