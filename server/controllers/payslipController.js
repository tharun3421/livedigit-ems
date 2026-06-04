import Employee         from "../models/Employee.js"
import Payslip          from "../models/Payslip.js"
import LeaveApplication from "../models/LeaveApplication.js"
import Attendance       from "../models/Attendance.js"

// ─── Constants ────────────────────────────────────────────────────────────────
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

// ─── Helpers ──────────────────────────────────────────────────────────────────
const countDays = (start, end) =>
    Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

const DAY_INDEX = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
}

const weekOffIndices = (weekOff = []) => {
    if (!weekOff.length) return new Set([0])
    return new Set(weekOff.map((d) => DAY_INDEX[d.toLowerCase()]).filter((n) => n !== undefined))
}

const getWorkingDatesOfMonth = (month, year, weekOff = []) => {
    const offDays     = weekOffIndices(weekOff)
    const daysInMonth = new Date(year, month, 0).getDate()
    const dates       = []
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d)
        if (!offDays.has(date.getDay())) {
            const mm = String(month).padStart(2, "0")
            const dd = String(d).padStart(2, "0")
            dates.push(`${year}-${mm}-${dd}`)
        }
    }
    return dates
}

// Working days = scheduled days (excl. weekoffs) - 2 Earned Leaves per month
const getWorkingDays = (month, year, weekOff = []) =>
    Math.max(1, getWorkingDatesOfMonth(month, year, weekOff).length - 2)

const toISTDateStr = (utcDate) =>
    new Date(new Date(utcDate).getTime() + IST_OFFSET_MS)
        .toISOString()
        .slice(0, 10)

/**
 * Compute attendance breakdown for a month.
 * Returns workingDays, clockInDays, paidLeaveDays, lopWorkedDays, presentDays, absentDays
 */
const getMonthCounts = async (employeeId, month, year, weekOff = []) => {
    const workingDates = getWorkingDatesOfMonth(month, year, weekOff)
    const workingDays  = getWorkingDays(month, year, weekOff)

    const monthStart = new Date(year, month - 1, 1)
    const monthEnd   = new Date(year, month, 0, 23, 59, 59)

    const queryStart = new Date(monthStart.getTime() - IST_OFFSET_MS)
    const queryEnd   = new Date(monthEnd.getTime()   + IST_OFFSET_MS)

    const [records, leaves] = await Promise.all([
        Attendance.find({ employeeId, date: { $gte: queryStart, $lte: queryEnd } }).lean(),
        LeaveApplication.find({
            employeeId,
            status:    "APPROVED",
            startDate: { $lte: monthEnd },
            endDate:   { $gte: monthStart },
        }).lean(),
    ])

    const clockedInDates = new Set(records.map((r) => toISTDateStr(r.date)))

    const lopDates       = new Set()
    const paidLeaveDates = new Set()

    for (const leave of leaves) {
        const start = new Date(Math.max(new Date(leave.startDate), monthStart))
        const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const mm  = String(d.getMonth() + 1).padStart(2, "0")
            const dd  = String(d.getDate()).padStart(2, "0")
            const str = `${d.getFullYear()}-${mm}-${dd}`
            if (leave.type === "LOSS_OF_PAY") lopDates.add(str)
            else                              paidLeaveDates.add(str)
        }
    }

    const clockInDays   = workingDates.filter((d) => clockedInDates.has(d)).length
    const paidLeaveDays = workingDates.filter(
        (d) => !clockedInDates.has(d) && paidLeaveDates.has(d) && !lopDates.has(d)
    ).length
    const lopWorkedDays = workingDates.filter(
        (d) => !clockedInDates.has(d) && lopDates.has(d)
    ).length
    const presentDays   = clockInDays + paidLeaveDays
    const absentDays    = Math.max(0, workingDays - presentDays - lopWorkedDays)

    return { workingDays, clockInDays, paidLeaveDays, lopWorkedDays, presentDays, absentDays }
}

/**
 * Leave type counts for the payslip print view.
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

        const weekOff = employee.workSchedule?.weekOff ?? []
        const counts  = await getMonthCounts(employeeId, m, y, weekOff)

        const { workingDays, presentDays, absentDays, lopWorkedDays } = counts

        const perDaySalary = workingDays > 0 ? parseFloat((basicSalary / workingDays).toFixed(2)) : 0
        const earnedBasic  = parseFloat((perDaySalary * presentDays).toFixed(2))
        const lopAmount    = parseFloat((perDaySalary * lopWorkedDays).toFixed(2))
        const netSalary    = parseFloat((earnedBasic + allowances).toFixed(2))

        const payslip = await Payslip.create({
            employeeId,
            month:      m,
            year:       y,
            basicSalary,
            allowances,
            deductions:  lopAmount,
            lopDays:     lopWorkedDays,
            lopAmount,
            netSalary,
            workingDays,
            presentDays,
            absentDays,
        })

        return res.json({ success: true, data: payslip })

    } catch (error) {
        if (error.code === 11000)
            return res.status(400).json({ error: "Payslip for this employee/month/year already exists" })
        console.error("createPayslip error:", error)
        return res.status(500).json({ error: "Failed to create payslip" })
    }
}

// ─── Update Payslip (admin only) ──────────────────────────────────────────────
export const updatePayslip = async (req, res) => {
    try {
        const { basicSalary, allowances, lopDays } = req.body

        const payslip = await Payslip.findById(req.params.id)
        if (!payslip) return res.status(404).json({ error: "Payslip not found" })

        // Apply admin overrides first
        if (basicSalary !== undefined) payslip.basicSalary = Number(basicSalary)
        if (allowances  !== undefined) payslip.allowances  = Number(allowances)

        const employee = await Employee.findById(payslip.employeeId).lean()
        const weekOff  = employee?.workSchedule?.weekOff ?? []
        const counts   = await getMonthCounts(payslip.employeeId, payslip.month, payslip.year, weekOff)

        const { workingDays, presentDays, absentDays, lopWorkedDays } = counts

        // Use admin-supplied lopDays override if provided; else use live attendance lopWorkedDays
        const effectiveLopDays = lopDays !== undefined ? Number(lopDays) : lopWorkedDays
        payslip.lopDays = effectiveLopDays

        // Salary formula — uses the updated payslip.basicSalary and payslip.allowances
        const perDaySalary = workingDays > 0
            ? parseFloat((payslip.basicSalary / workingDays).toFixed(2))
            : 0
        const earnedBasic  = parseFloat((perDaySalary * presentDays).toFixed(2))
        const lopAmount    = parseFloat((perDaySalary * effectiveLopDays).toFixed(2))
        const netSalary    = parseFloat((earnedBasic + payslip.allowances).toFixed(2))

        payslip.lopAmount   = lopAmount
        payslip.deductions  = lopAmount
        payslip.netSalary   = netSalary
        payslip.workingDays = workingDays
        payslip.presentDays = presentDays
        payslip.absentDays  = absentDays

        await payslip.save()
        return res.json({ success: true, data: payslip })

    } catch (error) {
        console.error("updatePayslip error:", error)
        return res.status(500).json({ error: "Failed to update payslip" })
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
                    const obj = p.toObject()
                    return {
                        ...obj,
                        id:         obj._id.toString(),
                        employee:   obj.employeeId,
                        employeeId: obj.employeeId?._id?.toString(),
                    }
                })

            return res.json({ data })
        }

        const employee = await Employee.findOne({ userId: req.session.userId })
        if (!employee) return res.status(404).json({ error: "Employee not found" })

        const raw  = await Payslip.find({ employeeId: employee._id }).sort({ createdAt: -1 }).lean()
        const data = raw.map((p) => ({ ...p, id: p._id.toString() }))

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

        // ── Use STORED values for money fields (admin may have overridden them) ──
        const basicSalary = payslip.basicSalary ?? 0
        const allowances  = payslip.allowances  ?? 0
        // lopDays: prefer stored override; fall back to live attendance count below
        const storedLopDays = payslip.lopDays   // may be an admin override

        const month   = payslip.month
        const year    = payslip.year
        const weekOff = employee.workSchedule?.weekOff ?? []

        // Pull live attendance counts (presentDays, workingDays, absentDays)
        // but DO NOT use lopWorkedDays to override an admin-set lopDays
        const counts = await getMonthCounts(employee._id, month, year, weekOff)
        const taken  = await getTakenLeaveCountsForMonth(employee._id, month, year)

        const { workingDays, presentDays, absentDays, lopWorkedDays } = counts

        // Respect admin lopDays override if it was explicitly set (non-zero or differs from live)
        // Use stored value; it was set by updatePayslip which already resolved the override
        const effectiveLopDays = storedLopDays ?? lopWorkedDays

        // Recompute salary using STORED basicSalary & allowances + live attendance days
        const perDaySalary = workingDays > 0 ? parseFloat((basicSalary / workingDays).toFixed(2)) : 0
        const earnedBasic  = parseFloat((perDaySalary * presentDays).toFixed(2))
        const lopAmount    = parseFloat((perDaySalary * effectiveLopDays).toFixed(2))
        const netSalary    = parseFloat((earnedBasic + allowances).toFixed(2))
        const weekOffLabel = weekOff.length ? weekOff.join(", ") : "Sunday"

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
                lopLeaves:    effectiveLopDays,
                absentDays,
                presentDays,
                weekOff,
                weekOffLabel,
            },
        })

    } catch (error) {
        console.error("getPayslipById error:", error)
        return res.status(500).json({ error: "Failed to fetch payslip" })
    }
}