import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";
import LeaveApplication from "../models/LeaveApplication.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const countDays = (start, end) =>
    Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

// Working days = calendar days in month − Sundays − 2 (Earned Leaves)
const getWorkingDays = (month, year) => {
    const calendarDays = new Date(year, month, 0).getDate()
    let sundays = 0
    for (let d = 1; d <= calendarDays; d++) {
        if (new Date(year, month - 1, d).getDay() === 0) sundays++
    }
    return calendarDays - sundays - 2
}

/** Approved LOP days for an employee clamped to the given month */
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
        totalDays  += countDays(start, end)
    }
    return totalDays
}

/**
 * Leave days taken for a specific month/year — used by the payslip print view.
 * SICK / CASUAL / EARNED: days in that exact month.
 * LOSS_OF_PAY: days clamped to that month (consistent with LOP deduction logic).
 */
const getTakenLeaveCountsForMonth = async (employeeId, month, year) => {
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd   = new Date(year, month, 0, 23, 59, 59)

    const approved = await LeaveApplication.find({
        employeeId,
        status:    "APPROVED",
        startDate: { $lte: monthEnd },
        endDate:   { $gte: monthStart },
        type:      { $in: ["SICK", "CASUAL", "EARNED", "LOSS_OF_PAY"] },
    })

    const taken = { SICK: 0, CASUAL: 0, EARNED: 0, LOSS_OF_PAY: 0 }
    for (const leave of approved) {
        const start = new Date(Math.max(new Date(leave.startDate), monthStart))
        const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
        if (end < start) continue
        const days = countDays(start, end)
        if (taken[leave.type] !== undefined) taken[leave.type] += days
    }
    return taken
}

// ─── Create Payslip ───────────────────────────────────────────────────────────
export const createPayslip = async (req, res) => {
    try {
        const { employeeId, month, year, allowances: customAllowances } = req.body

        if (!employeeId || !month || !year)
            return res.status(400).json({ error: "employeeId, month and year are required" })

        const employee = await Employee.findById(employeeId)
        if (!employee) return res.status(404).json({ error: "Employee not found" })

        const m = Number(month)
        const y = Number(year)

        const basicSalary = employee.basicSalary || 0
        const allowances  = customAllowances !== undefined
            ? Number(customAllowances)
            : (employee.allowances || 0)

        // Working days = calendar days − Sundays − 2 (Earned Leaves)
        const workingDays = getWorkingDays(m, y)

        // LOP deduction = LOP days × (basic ÷ working days)
        const lopDays   = await getLopDaysForMonth(employeeId, m, y)
        const lopAmount = parseFloat(((basicSalary / workingDays) * lopDays).toFixed(2))
        const netSalary = parseFloat((basicSalary + allowances - lopAmount).toFixed(2))

        const payslip = await Payslip.create({
            employeeId,
            month:      m,
            year:       y,
            basicSalary,
            allowances,
            deductions: lopAmount,
            lopDays,
            lopAmount,
            netSalary,
            workingDays,
        })

        return res.json({ success: true, data: payslip })

    } catch (error) {
        if (error.code === 11000)
            return res.status(400).json({ error: "Payslip for this employee/month/year already exists" })
        console.error("createPayslip error:", error)
        return res.status(500).json({ error: "Failed to create payslip" })
    }
}

// ─── Get Payslips (list) ──────────────────────────────────────────────────────
export const getPayslips = async (req, res) => {
    try {
        const isAdmin = req.session.role === "ADMIN"

        if (isAdmin) {
            const payslips = await Payslip.find()
                .populate("employeeId", "firstName lastName email position department joinDate isDeleted employeeId")
                .sort({ createdAt: -1 })

            const data = payslips
                .filter((p) => p.employeeId && !p.employeeId.isDeleted)
                .map((p) => {
                    const obj       = p.toObject()
                    const lopAmount = obj.lopAmount ?? 0
                    const netSalary = parseFloat(
                        ((obj.basicSalary ?? 0) + (obj.allowances ?? 0) - lopAmount).toFixed(2)
                    )
                    return {
                        ...obj,
                        lopAmount,
                        netSalary,
                        id:         obj._id.toString(),
                        employee:   obj.employeeId,
                        employeeId: obj.employeeId?._id?.toString(),
                    }
                })

            return res.json({ data })
        }

        const employee = await Employee.findOne({ userId: req.session.userId })
        if (!employee) return res.status(404).json({ error: "Employee not found" })

        const raw = await Payslip.find({ employeeId: employee._id }).sort({ createdAt: -1 }).lean()
        const data = raw.map((p) => {
            const lopAmount = p.lopAmount ?? 0
            const netSalary = parseFloat(
                ((p.basicSalary ?? 0) + (p.allowances ?? 0) - lopAmount).toFixed(2)
            )
            return { ...p, lopAmount, netSalary, id: p._id.toString() }
        })

        return res.json({ data })

    } catch (error) {
        console.error("getPayslips error:", error)
        return res.status(500).json({ error: "Failed to fetch payslips" })
    }
}

// ─── Get Payslip By ID (print view) ──────────────────────────────────────────
export const getPayslipById = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id).lean()
        if (!payslip) return res.status(404).json({ error: "Payslip not found" })

        const employee = await Employee.findById(payslip.employeeId).lean()
        if (!employee) return res.status(404).json({ error: "Employee not found" })

        // Recompute salary — never trust stale stored netSalary
        const basicSalary = payslip.basicSalary ?? 0
        const allowances  = payslip.allowances  ?? 0
        const lopDays     = payslip.lopDays      ?? 0
        const month       = payslip.month
        const year        = payslip.year

        // Use stored workingDays if available, else recompute
        const workingDays = payslip.workingDays ?? getWorkingDays(month, year)
        const lopAmount   = parseFloat(((basicSalary / workingDays) * lopDays).toFixed(2))
        const netSalary   = parseFloat((basicSalary + allowances - lopAmount).toFixed(2))

        // Leave counts scoped to this payslip's month — so past payslips show
        // exactly how many days of each type were taken in that month
        const taken = await getTakenLeaveCountsForMonth(employee._id, month, year)

        return res.json({
            ...payslip,
            id:         payslip._id.toString(),
            lopAmount,
            netSalary,
            workingDays,
            deductions: lopAmount,
            employee: {
                ...employee,
                id:           employee._id.toString(),
                casualLeaves: taken.CASUAL,
                sickLeaves:   taken.SICK,
                earnedLeaves: taken.EARNED,
                lopLeaves:    taken.LOSS_OF_PAY,
            },
        })

    } catch (error) {
        console.error("getPayslipById error:", error)
        return res.status(500).json({ error: "Failed to fetch payslip" })
    }
}