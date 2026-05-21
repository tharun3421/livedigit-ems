import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";
import LeaveApplication from "../models/LeaveApplication.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const SICK_LIMIT   = 6
const CASUAL_LIMIT = 6
const EL_PER_MONTH = 2

// ─── Helpers ──────────────────────────────────────────────────────────────────

const countDays = (start, end) =>
    Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

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

/** Remaining leave balances — mirrors leaveController logic */
const getLeaveBalances = async (employee) => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)

    const approved = await LeaveApplication.find({
        employeeId: employee._id,
        status:     "APPROVED",
        startDate:  { $gte: startOfYear },
        type:       { $in: ["SICK", "CASUAL", "EARNED"] },
    })

    const used = { SICK: 0, CASUAL: 0, EARNED: 0 }
    for (const leave of approved) {
        const days = countDays(leave.startDate, leave.endDate)
        if (used[leave.type] !== undefined) used[leave.type] += days
    }

    // Earned leave accrual: EL_PER_MONTH per complete month since joining
    const joinDate     = new Date(employee.joinDate)
    const now          = new Date()
    const monthsWorked = Math.max(0,
        (now.getFullYear() - joinDate.getFullYear()) * 12 +
        (now.getMonth()    - joinDate.getMonth())
    )
    const elAccumulated = monthsWorked * EL_PER_MONTH
    const elRemaining   = Math.max(0, elAccumulated - used.EARNED)

    return {
        casualLeaves: Math.max(0, CASUAL_LIMIT - used.CASUAL),
        sickLeaves:   Math.max(0, SICK_LIMIT   - used.SICK),
        earnedLeaves: elRemaining,
    }
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

        // Always calculate LOP fresh — never read employee.deductions
        const lopDays   = await getLopDaysForMonth(employeeId, m, y)
        const lopAmount = parseFloat(((basicSalary / 26) * lopDays).toFixed(2))
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
        const lopAmount   = parseFloat(((basicSalary / 26) * lopDays).toFixed(2))
        const netSalary   = parseFloat((basicSalary + allowances - lopAmount).toFixed(2))

        // Live remaining leave balances from LeaveApplication records
        const leaveBalances = await getLeaveBalances(employee)

        return res.json({
            ...payslip,
            id:         payslip._id.toString(),
            lopAmount,
            netSalary,
            deductions: lopAmount,
            employee: {
                ...employee,
                id: employee._id.toString(),
                ...leaveBalances,   // casualLeaves, sickLeaves, earnedLeaves
            },
        })

    } catch (error) {
        console.error("getPayslipById error:", error)
        return res.status(500).json({ error: "Failed to fetch payslip" })
    }
}