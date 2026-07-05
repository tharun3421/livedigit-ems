import Employee         from "../models/Employee.js"
import LeaveApplication from "../models/LeaveApplication.js"
import Attendance       from "../models/Attendance.js"
import LateRegularization from "../models/LateRegularization.js"
import { createNotification, getAdminUserIds } from "./notificationController.js"

export const LEAVE_LIMITS = {
    SICK:        6,
    CASUAL:      6,
    LOSS_OF_PAY: Infinity,
}

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

const countDays = (startDate, endDate) =>
    Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1

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

const getWorkingDays = (month, year, weekOff = []) =>
    Math.max(1, getWorkingDatesOfMonth(month, year, weekOff).length)

const toISTDateStr = (utcDate) =>
    new Date(new Date(utcDate).getTime() + IST_OFFSET_MS)
        .toISOString()
        .slice(0, 10)

export const getAttendanceCounts = async (employeeId, month, year, weekOff = []) => {
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


const getUsedLeaveCounts = async (employeeId) => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const approved    = await LeaveApplication.find({
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

export const createLeave = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.session.userId })
        if (!employee)          return res.status(404).json({ error: "Employee not found" })
        if (employee.isDeleted) return res.status(403).json({ error: "Your account is deactivated." })

        const { type, startDate, endDate, reason } = req.body

        if (!type || !startDate || !endDate || !reason)
            return res.status(400).json({ error: "Missing required fields" })
        if (!["SICK", "CASUAL", "LOSS_OF_PAY"].includes(type))
    return res.status(400).json({ error: "Invalid leave type" })

const startDateObj  = new Date(startDate)
const endDateObj    = new Date(endDate)

if (endDateObj < startDateObj)
    return res.status(400).json({ error: "End date cannot be before start date" })

const requestedDays = countDays(startDateObj, endDateObj)

if (type === "SICK" || type === "CASUAL") {
    const used      = await getUsedLeaveCounts(employee._id)
    const limit     = LEAVE_LIMITS[type]
    const remaining = limit - used[type]
    if (requestedDays > remaining)
        return res.status(400).json({
            error: `You only have ${remaining} ${type.replace("_", " ")} day(s) remaining (limit: ${limit}).`,
            remaining, limit,
        })
}

const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type, startDate: startDateObj, endDate: endDateObj, reason, status: "PENDING",
        })

        // Notify all admins
        const adminIds = await getAdminUserIds()
        const empName  = `${employee.firstName} ${employee.lastName}`
        const dateRange = startDate === endDate ? startDate : `${startDate} to ${endDate}`
        await Promise.all(adminIds.map(adminId =>
            createNotification({
                recipientId:   adminId,
                recipientRole: "ADMIN",
                type:          "LEAVE_REQUEST",
                title:         "New Leave Request",
                message:       `${empName} applied for ${type.replace(/_/g, " ")} leave (${dateRange})`,
                refId:         leave._id,
                refType:       "LeaveApplication",
            })
        ))

        return res.json({ success: true, data: leave })
    } catch (error) {
        console.error("createLeave error:", error.message)
        return res.status(500).json({ error: error.message })
    }
}

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
}

        return res.json({ data: leaves, leaveBalance, employee: { ...employee, id: employee._id.toString() } })
    } catch (error) {
        console.error("getLeaves error:", error)
        return res.status(500).json({ error: "Failed to fetch leaves" })
    }
}

// export const updateLeaveStatus = async (req, res) => {
//     try {
//         const { status } = req.body
//         if (!["APPROVED", "REJECTED", "PENDING"].includes(status))
//             return res.status(400).json({ error: "Invalid status" })

//         const leave = await LeaveApplication.findById(req.params.id).populate("employeeId")
//         if (!leave) return res.status(404).json({ error: "Leave application not found" })

//         leave.status = status
//         await leave.save()

//         // Notify employee
//         if (leave.employeeId) {
//             const emp     = leave.employeeId
//             const empUser = await Employee.findById(emp._id || emp).select("userId").lean()
//             const userId  = empUser?.userId || emp.userId
//             if (userId) {
//                 const dateRange = leave.startDate.toISOString().slice(0,10) === leave.endDate.toISOString().slice(0,10)
//                     ? leave.startDate.toISOString().slice(0,10)
//                     : `${leave.startDate.toISOString().slice(0,10)} to ${leave.endDate.toISOString().slice(0,10)}`
//                 await createNotification({
//                     recipientId:   userId,
//                     recipientRole: "EMPLOYEE",
//                     type:          status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
//                     title:         `Leave Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
//                     message:       `Your ${leave.type.replace(/_/g, " ")} leave request (${dateRange}) has been ${status.toLowerCase()}.`,
//                     refId:         leave._id,
//                     refType:       "LeaveApplication",
//                 })
//             }
//         }

//         return res.json({ success: true, data: leave })
//     } catch (error) {
//         console.error("updateLeaveStatus error:", error)
//         return res.status(500).json({ error: "Failed to update leave status" })
//     }
// }

export const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body
        if (!["APPROVED", "REJECTED", "PENDING"].includes(status))
            return res.status(400).json({ error: "Invalid status" })

        const leave = await LeaveApplication.findById(req.params.id).populate("employeeId")
        if (!leave) return res.status(404).json({ error: "Leave application not found" })

        // Re-check the annual balance at approval time — the check in
        // createLeave only guards against already-APPROVED usage at the
        // moment of submission, so multiple PENDING requests (each within
        // the limit individually) can still add up to more than the annual
        // limit if an admin approves several of them. This is the actual
        // point where days get spent, so it's the right place to enforce it.
        if (status === "APPROVED" && leave.status !== "APPROVED" && (leave.type === "SICK" || leave.type === "CASUAL")) {
            const limit      = LEAVE_LIMITS[leave.type]
            const employeeId = leave.employeeId._id || leave.employeeId
            const used       = await getUsedLeaveCounts(employeeId)
            const requestedDays = countDays(leave.startDate, leave.endDate)
            if (used[leave.type] + requestedDays > limit) {
                return res.status(400).json({
                    error: `Approving this would exceed the employee's ${limit}-day ${leave.type.replace("_", " ")} limit for the year (already used: ${used[leave.type]} day(s)). Reject or ask them to adjust the request.`,
                    used: used[leave.type], limit,
                })
            }
        }

        leave.status = status
        await leave.save()

        // Notify employee
        if (leave.employeeId) {
            const emp     = leave.employeeId
            const empUser = await Employee.findById(emp._id || emp).select("userId").lean()
            const userId  = empUser?.userId || emp.userId
            if (userId) {
                const dateRange = leave.startDate.toISOString().slice(0,10) === leave.endDate.toISOString().slice(0,10)
                    ? leave.startDate.toISOString().slice(0,10)
                    : `${leave.startDate.toISOString().slice(0,10)} to ${leave.endDate.toISOString().slice(0,10)}`
                await createNotification({
                    recipientId:   userId,
                    recipientRole: "EMPLOYEE",
                    type:          status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
                    title:         `Leave Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
                    message:       `Your ${leave.type.replace(/_/g, " ")} leave request (${dateRange}) has been ${status.toLowerCase()}.`,
                    refId:         leave._id,
                    refType:       "LeaveApplication",
                })
            }
        }

        return res.json({ success: true, data: leave })
    } catch (error) {
        console.error("updateLeaveStatus error:", error)
        return res.status(500).json({ error: "Failed to update leave status" })
    }
}

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
        const queryStart = new Date(monthStart.getTime() - IST_OFFSET_MS)
        const queryEnd   = new Date(monthEnd.getTime()   + IST_OFFSET_MS)

        const weekOff      = employee.workSchedule?.weekOff ?? []
        const workingDates = getWorkingDatesOfMonth(m, y, weekOff)
        const workingDays  = getWorkingDays(m, y, weekOff)
        const weekOffLabel = weekOff.length ? weekOff.join(", ") : "Sunday"

        // ── LOP leaves ────────────────────────────────────────────────────────
        const lopLeaves = await LeaveApplication.find({
            employeeId: employee._id,
            type:       "LOSS_OF_PAY",
            status:     "APPROVED",
            startDate:  { $lte: monthEnd },
            endDate:    { $gte: monthStart },
        })

        let totalLopDays   = 0
        const leaveDetails = []
        for (const leave of lopLeaves) {
            const start = new Date(Math.max(new Date(leave.startDate), monthStart))
            const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
            const days  = countDays(start, end)
            totalLopDays += days
            leaveDetails.push({ id: leave._id.toString(), startDate: leave.startDate, endDate: leave.endDate, days })
        }

        // ── Attendance records ────────────────────────────────────────────────
        const [records, allLeaves, approvedLateRegs] = await Promise.all([
            Attendance.find({ employeeId: employee._id, date: { $gte: queryStart, $lte: queryEnd } }).lean(),
            LeaveApplication.find({
                employeeId: employee._id,
                status:     "APPROVED",
                startDate:  { $lte: monthEnd },
                endDate:    { $gte: monthStart },
            }).lean(),
            LateRegularization.find({
                employeeId: employee._id, status: "APPROVED",
                date: { $gte: queryStart, $lte: queryEnd },
            }).lean(),
        ])

        const clockedInDates = new Set(records.map((r) => toISTDateStr(r.date)))

        // Same rule as payslipController: an approved late regularization
        // always excludes that day from the late count, regardless of what
        // Attendance.status currently says.
        const approvedLateDates = new Set(approvedLateRegs.map(r => toISTDateStr(r.date)))
        const lateDates         = new Set(
            records
                .filter(r => r.status === "LATE" && !approvedLateDates.has(toISTDateStr(r.date)))
                .map(r => toISTDateStr(r.date))
        )

        // ── Late counts ───────────────────────────────────────────────────────
        const lateCount         = workingDates.filter((d) => lateDates.has(d)).length
        const lateDeductionDays = Math.floor(lateCount / 3)

        // ── Present days ──────────────────────────────────────────────────────
        const lopDates       = new Set()
        const paidLeaveDates = new Set()
        for (const leave of allLeaves) {
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
        const presentDays   = clockInDays + paidLeaveDays
        const absentDays    = Math.max(0, workingDays - presentDays - totalLopDays)

        const perDayRate = workingDays > 0
            ? parseFloat((employee.basicSalary / workingDays).toFixed(2))
            : 0

        // amount is informational only — no longer used as a deduction
        const amount = parseFloat((perDayRate * totalLopDays).toFixed(2))

        return res.json({
            days:               totalLopDays,
            amount,
            basicSalary:        employee.basicSalary,
            workingDays,
            presentDays,
            absentDays,
            weekOffLabel,
            perDayRate,
            leaveDetails,
            lateCount,              // ← used by GeneratePayslipForm
            lateDeductionDays,      // ← used by GeneratePayslipForm
        })
    } catch (error) {
        console.error("getLopSummary error:", error)
        return res.status(500).json({ error: "Failed to get LOP summary" })
    }
}