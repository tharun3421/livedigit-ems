
import Employee         from "../models/Employee.js"
import LeaveApplication from "../models/LeaveApplication.js"
import Attendance       from "../models/Attendance.js"

// ─── Leave limits ─────────────────────────────────────────────────────────────
export const LEAVE_LIMITS = {
    SICK:        4,
    CASUAL:      2,
    LOSS_OF_PAY: Infinity,
    EARNED:      Infinity,
}

const EL_PER_MONTH   = 2
const IST_OFFSET_MS  = (5 * 60 + 30) * 60 * 1000

/** Inclusive calendar days between two dates */
const countDays = (startDate, endDate) =>
    Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1

// ─── Day name → JS getDay() index ─────────────────────────────────────────────
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
// e.g. typical month: 30 cal days - 4 Sundays - 2 EL = 24 working days
const getWorkingDays = (month, year, weekOff = []) =>
    Math.max(1, getWorkingDatesOfMonth(month, year, weekOff).length - 2)

const toISTDateStr = (utcDate) =>
    new Date(new Date(utcDate).getTime() + IST_OFFSET_MS)
        .toISOString()
        .slice(0, 10)

/**
 * Shared helper — returns clockInDays and leaveDays for a given employee/month.
 * presentDays = clockInDays + leaveDays
 * absentDays  = workingDays - presentDays  (computed by caller)
 */
const getAttendanceCounts = async (employeeId, month, year, weekOff = []) => {
    const workingDates = getWorkingDatesOfMonth(month, year, weekOff)

    const monthStart = new Date(year, month - 1, 1)
    const monthEnd   = new Date(year, month, 0, 23, 59, 59)

    const queryStart = new Date(monthStart.getTime() - IST_OFFSET_MS)
    const queryEnd   = new Date(monthEnd.getTime()   + IST_OFFSET_MS)

    const records = await Attendance.find({
        employeeId,
        date: { $gte: queryStart, $lte: queryEnd },
    }).lean()

    const clockedInDates = new Set(records.map((r) => toISTDateStr(r.date)))

    const leaves = await LeaveApplication.find({
        employeeId,
        status:    "APPROVED",
        startDate: { $lte: monthEnd },
        endDate:   { $gte: monthStart },
    }).lean()

    const leaveDates = new Set()
    for (const leave of leaves) {
        const start = new Date(Math.max(new Date(leave.startDate), monthStart))
        const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const mm = String(d.getMonth() + 1).padStart(2, "0")
            const dd = String(d.getDate()).padStart(2, "0")
            leaveDates.add(`${d.getFullYear()}-${mm}-${dd}`)
        }
    }

    const clockInDays = workingDates.filter((d) =>  clockedInDates.has(d)).length
    const leaveDays   = workingDates.filter((d) => !clockedInDates.has(d) && leaveDates.has(d)).length

    return { clockInDays, leaveDays }
}

// ─── Earned Leave: 2 per month, resets each month ────────────────────────────
const getEarnedLeaveBalance = async (employee) => {
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const accumulated = EL_PER_MONTH

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

// ─── Sick & Casual: resets every new year ────────────────────────────────────
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
        const employee = await Employee.findOne({ userId: req.session.userId })
        if (!employee)          return res.status(404).json({ error: "Employee not found" })
        if (employee.isDeleted) return res.status(403).json({ error: "Your account is deactivated." })

        const { type, startDate, endDate, reason } = req.body

        if (!type || !startDate || !endDate || !reason)
            return res.status(400).json({ error: "Missing required fields" })
        if (!["SICK", "CASUAL", "LOSS_OF_PAY", "EARNED"].includes(type))
            return res.status(400).json({ error: "Invalid leave type" })

        const startDateObj = new Date(startDate)
        const endDateObj   = new Date(endDate)

        if (endDateObj < startDateObj)
            return res.status(400).json({ error: "End date cannot be before start date" })

        const requestedDays = countDays(startDateObj, endDateObj)

        if (type === "SICK" || type === "CASUAL") {
            const used      = await getUsedLeaveCounts(employee._id)
            const limit     = LEAVE_LIMITS[type]
            const remaining = limit - used[type]
            if (requestedDays > remaining) {
                return res.status(400).json({
                    error: `You only have ${remaining} ${type.replace("_", " ")} day(s) remaining (limit: ${limit}).`,
                    remaining, limit,
                })
            }
        }

        if (type === "EARNED") {
            const elBalance = await getEarnedLeaveBalance(employee)
            if (requestedDays > elBalance.remaining) {
                return res.status(400).json({
                    error: `You only have ${elBalance.remaining} Earned Leave day(s) available this month.`,
                    remaining:   elBalance.remaining,
                    accumulated: elBalance.accumulated,
                })
            }
        }

        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type, startDate: startDateObj, endDate: endDateObj, reason, status: "PENDING",
        })

        return res.json({ success: true, data: leave })
    } catch (error) {
        console.error("createLeave error:", error.message)
        return res.status(500).json({ error: error.message })
    }
}

// ─── Get Leaves ───────────────────────────────────────────────────────────────
export const getLeaves = async (req, res) => {
    try {
        const isAdmin = req.session.role === "ADMIN"

        if (isAdmin) {
            const where  = req.query.status ? { status: req.query.status } : {}
            const leaves = await LeaveApplication.find(where).populate("employeeId").sort({ createdAt: -1 })
            const data   = leaves
                .filter((l) => l.employeeId && !l.employeeId.isDeleted)
                .map((l) => {
                    const obj = l.toObject()
                    return { ...obj, id: obj._id.toString(), employee: obj.employeeId, employeeId: obj.employeeId?._id?.toString() }
                })
            return res.json({ data })
        }

        const employee = await Employee.findOne({ userId: req.session.userId }).lean()
        if (!employee) return res.status(404).json({ error: "Employee not found" })

        const leaves = await LeaveApplication.find({ employeeId: employee._id }).sort({ createdAt: -1 })
        const used   = await getUsedLeaveCounts(employee._id)
        const el     = await getEarnedLeaveBalance(employee)

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

        return res.json({ data: leaves, leaveBalance, employee: { ...employee, id: employee._id.toString() } })
    } catch (error) {
        console.error("getLeaves error:", error)
        return res.status(500).json({ error: "Failed to fetch leaves" })
    }
}

// ─── Update Leave Status ──────────────────────────────────────────────────────
export const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body
        if (!["APPROVED", "REJECTED", "PENDING"].includes(status))
            return res.status(400).json({ error: "Invalid status" })

        const leave = await LeaveApplication.findById(req.params.id)
        if (!leave) return res.status(404).json({ error: "Leave application not found" })

        leave.status = status
        await leave.save()

        return res.json({ success: true, data: leave })
    } catch (error) {
        console.error("updateLeaveStatus error:", error)
        return res.status(500).json({ error: "Failed to update leave status" })
    }
}

// ─── LOP Summary (admin — used by payslip form) ───────────────────────────────
export const getLopSummary = async (req, res) => {
    try {
        const { employeeId, month, year } = req.query
        if (!employeeId || !month || !year)
            return res.status(400).json({ error: "employeeId, month and year are required" })

        const employee = await Employee.findById(employeeId)
        if (!employee) return res.status(404).json({ error: "Employee not found" })

        const m          = parseInt(month)
        const y          = parseInt(year)
        const monthStart = new Date(y, m - 1, 1)
        const monthEnd   = new Date(y, m, 0, 23, 59, 59)

        const weekOff      = employee.workSchedule?.weekOff ?? []
        const workingDays  = getWorkingDays(m, y, weekOff)
        const weekOffLabel = weekOff.length ? weekOff.join(", ") : "Sunday"

        // ── LOP days ─────────────────────────────────────────────────────────
        const lopLeaves = await LeaveApplication.find({
            employeeId: employee._id,
            type:       "LOSS_OF_PAY",
            status:     "APPROVED",
            startDate:  { $lte: monthEnd },
            endDate:    { $gte: monthStart },
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

        // ── Attendance counts ─────────────────────────────────────────────────
        // LOP days are NOT counted as present — they reduce salary like absence.
        const { clockInDays, leaveDays: rawLeaveDays } = await getAttendanceCounts(employee._id, m, y, weekOff)
        const lopWorkedDays = totalDays
        const paidLeaveDays = Math.max(0, rawLeaveDays - lopWorkedDays)
        const presentDays   = clockInDays + paidLeaveDays
        const absentDays    = Math.max(0, workingDays - presentDays - lopWorkedDays)

        const perDayRate = workingDays > 0
            ? parseFloat((employee.basicSalary / workingDays).toFixed(2))
            : 0
        const amount     = parseFloat((perDayRate * totalDays).toFixed(2))

        return res.json({
            days:         totalDays,
            amount,
            basicSalary:  employee.basicSalary,
            workingDays,
            presentDays,
            absentDays,
            weekOffLabel,
            perDayRate,
            leaveDetails,
        })
    } catch (error) {
        console.error("getLopSummary error:", error)
        return res.status(500).json({ error: "Failed to get LOP summary" })
    }
}