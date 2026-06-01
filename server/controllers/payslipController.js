// import Employee from "../models/Employee.js";
// import Payslip from "../models/Payslip.js";
// import LeaveApplication from "../models/LeaveApplication.js";

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const countDays = (start, end) =>
//     Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

// // Working days = calendar days in month − Sundays − 2 (Earned Leaves)
// // Working days = calendar days − 4 Sundays − 2 Earned Leaves = calendar days − 6
// const getWorkingDays = (month, year) => {
//     return new Date(year, month, 0).getDate() - 6
// }

// /** Approved LOP days for an employee clamped to the given month */
// const getLopDaysForMonth = async (employeeId, month, year) => {
//     const monthStart = new Date(year, month - 1, 1)
//     const monthEnd   = new Date(year, month, 0, 23, 59, 59)

//     const lopLeaves = await LeaveApplication.find({
//         employeeId,
//         type:      "LOSS_OF_PAY",
//         status:    "APPROVED",
//         startDate: { $lte: monthEnd },
//         endDate:   { $gte: monthStart },
//     })

//     let totalDays = 0
//     for (const leave of lopLeaves) {
//         const start = new Date(Math.max(new Date(leave.startDate), monthStart))
//         const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
//         totalDays  += countDays(start, end)
//     }
//     return totalDays
// }

// /**
//  * Leave days taken for a specific month/year — used by the payslip print view.
//  * SICK / CASUAL / EARNED: days in that exact month.
//  * LOSS_OF_PAY: days clamped to that month (consistent with LOP deduction logic).
//  */
// const getTakenLeaveCountsForMonth = async (employeeId, month, year) => {
//     const monthStart = new Date(year, month - 1, 1)
//     const monthEnd   = new Date(year, month, 0, 23, 59, 59)

//     const approved = await LeaveApplication.find({
//         employeeId,
//         status:    "APPROVED",
//         startDate: { $lte: monthEnd },
//         endDate:   { $gte: monthStart },
//         type:      { $in: ["SICK", "CASUAL", "EARNED", "LOSS_OF_PAY"] },
//     })

//     const taken = { SICK: 0, CASUAL: 0, EARNED: 0, LOSS_OF_PAY: 0 }
//     for (const leave of approved) {
//         const start = new Date(Math.max(new Date(leave.startDate), monthStart))
//         const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
//         if (end < start) continue
//         const days = countDays(start, end)
//         if (taken[leave.type] !== undefined) taken[leave.type] += days
//     }
//     return taken
// }

// // ─── Create Payslip ───────────────────────────────────────────────────────────
// export const createPayslip = async (req, res) => {
//     try {
//         const { employeeId, month, year, allowances: customAllowances } = req.body

//         if (!employeeId || !month || !year)
//             return res.status(400).json({ error: "employeeId, month and year are required" })

//         const employee = await Employee.findById(employeeId)
//         if (!employee) return res.status(404).json({ error: "Employee not found" })

//         const m = Number(month)
//         const y = Number(year)

//         const basicSalary = employee.basicSalary || 0
//         const allowances  = customAllowances !== undefined
//             ? Number(customAllowances)
//             : (employee.allowances || 0)

//         // Working days = calendar days − Sundays − 2 (Earned Leaves)
//         const workingDays = getWorkingDays(m, y)

//         // LOP deduction = LOP days × (basic ÷ working days)
//         const lopDays   = await getLopDaysForMonth(employeeId, m, y)
//         const lopAmount = parseFloat(((basicSalary / workingDays) * lopDays).toFixed(2))
//         const netSalary = parseFloat((basicSalary + allowances - lopAmount).toFixed(2))

//         const payslip = await Payslip.create({
//             employeeId,
//             month:      m,
//             year:       y,
//             basicSalary,
//             allowances,
//             deductions: lopAmount,
//             lopDays,
//             lopAmount,
//             netSalary,
//             workingDays,
//         })

//         return res.json({ success: true, data: payslip })

//     } catch (error) {
//         if (error.code === 11000)
//             return res.status(400).json({ error: "Payslip for this employee/month/year already exists" })
//         console.error("createPayslip error:", error)
//         return res.status(500).json({ error: "Failed to create payslip" })
//     }
// }

// // ─── Get Payslips (list) ──────────────────────────────────────────────────────
// export const getPayslips = async (req, res) => {
//     try {
//         const isAdmin = req.session.role === "ADMIN"

//         if (isAdmin) {
//             const payslips = await Payslip.find()
//                 .populate("employeeId", "firstName lastName email position department joinDate isDeleted employeeId")
//                 .sort({ createdAt: -1 })

//             const data = payslips
//                 .filter((p) => p.employeeId && !p.employeeId.isDeleted)
//                 .map((p) => {
//                     const obj       = p.toObject()
//                     const lopAmount = obj.lopAmount ?? 0
//                     const netSalary = parseFloat(
//                         ((obj.basicSalary ?? 0) + (obj.allowances ?? 0) - lopAmount).toFixed(2)
//                     )
//                     return {
//                         ...obj,
//                         lopAmount,
//                         netSalary,
//                         id:         obj._id.toString(),
//                         employee:   obj.employeeId,
//                         employeeId: obj.employeeId?._id?.toString(),
//                     }
//                 })

//             return res.json({ data })
//         }

//         const employee = await Employee.findOne({ userId: req.session.userId })
//         if (!employee) return res.status(404).json({ error: "Employee not found" })

//         const raw = await Payslip.find({ employeeId: employee._id }).sort({ createdAt: -1 }).lean()
//         const data = raw.map((p) => {
//             const lopAmount = p.lopAmount ?? 0
//             const netSalary = parseFloat(
//                 ((p.basicSalary ?? 0) + (p.allowances ?? 0) - lopAmount).toFixed(2)
//             )
//             return { ...p, lopAmount, netSalary, id: p._id.toString() }
//         })

//         return res.json({ data })

//     } catch (error) {
//         console.error("getPayslips error:", error)
//         return res.status(500).json({ error: "Failed to fetch payslips" })
//     }
// }

// // ─── Get Payslip By ID (print view) ──────────────────────────────────────────
// export const getPayslipById = async (req, res) => {
//     try {
//         const payslip = await Payslip.findById(req.params.id).lean()
//         if (!payslip) return res.status(404).json({ error: "Payslip not found" })

//         const employee = await Employee.findById(payslip.employeeId).lean()
//         if (!employee) return res.status(404).json({ error: "Employee not found" })

//         // Recompute salary — never trust stale stored netSalary
//         const basicSalary = payslip.basicSalary ?? 0
//         const allowances  = payslip.allowances  ?? 0
//         const lopDays     = payslip.lopDays      ?? 0
//         const month       = payslip.month
//         const year        = payslip.year

//         // Use stored workingDays if available, else recompute
//         const workingDays = payslip.workingDays ?? getWorkingDays(month, year)
//         const lopAmount   = parseFloat(((basicSalary / workingDays) * lopDays).toFixed(2))
//         const netSalary   = parseFloat((basicSalary + allowances - lopAmount).toFixed(2))

//         // Leave counts scoped to this payslip's month — so past payslips show
//         // exactly how many days of each type were taken in that month
//         const taken = await getTakenLeaveCountsForMonth(employee._id, month, year)

//         return res.json({
//             ...payslip,
//             id:         payslip._id.toString(),
//             lopAmount,
//             netSalary,
//             workingDays,
//             deductions: lopAmount,
//             employee: {
//                 ...employee,
//                 id:           employee._id.toString(),
//                 casualLeaves: taken.CASUAL,
//                 sickLeaves:   taken.SICK,
//                 earnedLeaves: taken.EARNED,
//                 lopLeaves:    taken.LOSS_OF_PAY,
//             },
//         })

//     } catch (error) {
//         console.error("getPayslipById error:", error)
//         return res.status(500).json({ error: "Failed to fetch payslip" })
//     }
// }



// // ─── Update Payslip (admin only) ──────────────────────────────────────────────
// export const updatePayslip = async (req, res) => {
//     try {
//         const { basicSalary, allowances, lopDays } = req.body

//         const payslip = await Payslip.findById(req.params.id)
//         if (!payslip) return res.status(404).json({ error: "Payslip not found" })

//         // Persist overrides — only update fields that were actually sent
//         if (basicSalary !== undefined) payslip.basicSalary = Number(basicSalary)
//         if (allowances  !== undefined) payslip.allowances  = Number(allowances)
//         if (lopDays     !== undefined) payslip.lopDays     = Number(lopDays)

//         // Recompute derived fields
//         const workingDays = payslip.workingDays ?? getWorkingDays(payslip.month, payslip.year)
//         const lopAmount   = parseFloat(((payslip.basicSalary / workingDays) * payslip.lopDays).toFixed(2))
//         const netSalary   = parseFloat((payslip.basicSalary + payslip.allowances - lopAmount).toFixed(2))

//         payslip.lopAmount  = lopAmount
//         payslip.deductions = lopAmount
//         payslip.netSalary  = netSalary
//         payslip.workingDays = workingDays

//         await payslip.save()
//         return res.json({ success: true, data: payslip })

//     } catch (error) {
//         console.error("updatePayslip error:", error)
//         return res.status(500).json({ error: "Failed to update payslip" })
//     }
// }




    // import Employee from "../models/Employee.js";
    // import Payslip from "../models/Payslip.js";
    // import LeaveApplication from "../models/LeaveApplication.js";
    // import Attendance from "../models/Attendance.js";

    // // ─── Helpers ──────────────────────────────────────────────────────────────────

    // const countDays = (start, end) =>
    //     Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

    // // Day name → JS getDay() index
    // const DAY_INDEX = {
    //     sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    //     thursday: 4, friday: 5, saturday: 6,
    // }

    // /**
    //  * Convert weekOff string array to a Set of day indices (0=Sun … 6=Sat).
    //  * Falls back to [0] (Sunday only) if nothing is stored.
    //  */
    // const weekOffIndices = (weekOff = []) => {
    //     if (!weekOff.length) return new Set([0])        // default: Sunday off
    //     return new Set(weekOff.map((d) => DAY_INDEX[d.toLowerCase()]).filter((n) => n !== undefined))
    // }

    // /**
    //  * All working dates in a month for an employee based on their weekOff schedule.
    //  * Returns an array of toDateString() values for easy Set comparison.
    //  */
    // const getWorkingDatesOfMonth = (month, year, weekOff = []) => {
    //     const offDays    = weekOffIndices(weekOff)
    //     const daysInMonth = new Date(year, month, 0).getDate()
    //     const dates = []
    //     for (let d = 1; d <= daysInMonth; d++) {
    //         const date = new Date(year, month - 1, d)
    //         if (!offDays.has(date.getDay())) {
    //             dates.push(date.toDateString())
    //         }
    //     }
    //     return dates
    // }

    // /**
    //  * Working days count for payslip salary calculation.
    //  * Uses employee's actual weekOff schedule.
    //  * Subtracts 2 for the fixed Earned Leave allowance (same as before).
    //  */
    // const getWorkingDays = (month, year, weekOff = []) => {
    //     return getWorkingDatesOfMonth(month, year, weekOff).length - 2
    // }

    // /** Approved LOP days for an employee clamped to the given month */
    // const getLopDaysForMonth = async (employeeId, month, year) => {
    //     const monthStart = new Date(year, month - 1, 1)
    //     const monthEnd   = new Date(year, month, 0, 23, 59, 59)

    //     const lopLeaves = await LeaveApplication.find({
    //         employeeId,
    //         type:      "LOSS_OF_PAY",
    //         status:    "APPROVED",
    //         startDate: { $lte: monthEnd },
    //         endDate:   { $gte: monthStart },
    //     })

    //     let totalDays = 0
    //     for (const leave of lopLeaves) {
    //         const start = new Date(Math.max(new Date(leave.startDate), monthStart))
    //         const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
    //         totalDays  += countDays(start, end)
    //     }
    //     return totalDays
    // }

    // /**
    //  * Leave days taken for a specific month/year — used by the payslip print view.
    //  */
    // const getTakenLeaveCountsForMonth = async (employeeId, month, year) => {
    //     const monthStart = new Date(year, month - 1, 1)
    //     const monthEnd   = new Date(year, month, 0, 23, 59, 59)

    //     const approved = await LeaveApplication.find({
    //         employeeId,
    //         status:    "APPROVED",
    //         startDate: { $lte: monthEnd },
    //         endDate:   { $gte: monthStart },
    //         type:      { $in: ["SICK", "CASUAL", "EARNED", "LOSS_OF_PAY"] },
    //     })

    //     const taken = { SICK: 0, CASUAL: 0, EARNED: 0, LOSS_OF_PAY: 0 }
    //     for (const leave of approved) {
    //         const start = new Date(Math.max(new Date(leave.startDate), monthStart))
    //         const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
    //         if (end < start) continue
    //         const days = countDays(start, end)
    //         if (taken[leave.type] !== undefined) taken[leave.type] += days
    //     }
    //     return taken
    // }

    // /**
    //  * Absent days = employee's working days in the month that have NO attendance record.
    //  *
    //  * - Working days are derived from the employee's weekOff schedule.
    //  * - If there is no attendance document for a working day → absent.
    //  * - Leaves / LOP are not subtracted — absence is purely clock-in based.
    //  */
    // const getAbsentDaysForMonth = async (employeeId, month, year, weekOff = []) => {
    //     const workingDates = getWorkingDatesOfMonth(month, year, weekOff)

    //     const monthStart = new Date(year, month - 1, 1)
    //     const monthEnd   = new Date(year, month, 0, 23, 59, 59)

    //     const records = await Attendance.find({
    //         employeeId,
    //         date: { $gte: monthStart, $lte: monthEnd },
    //     }).lean()

    //     const recordedDates = new Set(
    //         records.map((r) => new Date(r.date).toDateString())
    //     )

    //     return workingDates.filter((d) => !recordedDates.has(d)).length
    // }

    // // ─── Create Payslip ───────────────────────────────────────────────────────────
    // export const createPayslip = async (req, res) => {
    //     try {
    //         const { employeeId, month, year, allowances: customAllowances } = req.body

    //         if (!employeeId || !month || !year)
    //             return res.status(400).json({ error: "employeeId, month and year are required" })

    //         const employee = await Employee.findById(employeeId)
    //         if (!employee) return res.status(404).json({ error: "Employee not found" })

    //         const m = Number(month)
    //         const y = Number(year)

    //         const basicSalary = employee.basicSalary || 0
    //         const allowances  = customAllowances !== undefined
    //             ? Number(customAllowances)
    //             : (employee.allowances || 0)

    //         const weekOff     = employee.workSchedule?.weekOff ?? []
    //         const workingDays = getWorkingDays(m, y, weekOff)

    //         const lopDays   = await getLopDaysForMonth(employeeId, m, y)
    //         const lopAmount = parseFloat(((basicSalary / workingDays) * lopDays).toFixed(2))
    //         const netSalary = parseFloat((basicSalary + allowances - lopAmount).toFixed(2))

    //         const payslip = await Payslip.create({
    //             employeeId,
    //             month:      m,
    //             year:       y,
    //             basicSalary,
    //             allowances,
    //             deductions: lopAmount,
    //             lopDays,
    //             lopAmount,
    //             netSalary,
    //             workingDays,
    //         })

    //         return res.json({ success: true, data: payslip })

    //     } catch (error) {
    //         if (error.code === 11000)
    //             return res.status(400).json({ error: "Payslip for this employee/month/year already exists" })
    //         console.error("createPayslip error:", error)
    //         return res.status(500).json({ error: "Failed to create payslip" })
    //     }
    // }

    // // ─── Update Payslip (admin only) ──────────────────────────────────────────────
    // export const updatePayslip = async (req, res) => {
    //     try {
    //         const { basicSalary, allowances, lopDays } = req.body

    //         const payslip = await Payslip.findById(req.params.id)
    //         if (!payslip) return res.status(404).json({ error: "Payslip not found" })

    //         if (basicSalary !== undefined) payslip.basicSalary = Number(basicSalary)
    //         if (allowances  !== undefined) payslip.allowances  = Number(allowances)
    //         if (lopDays     !== undefined) payslip.lopDays     = Number(lopDays)

    //         const workingDays = payslip.workingDays ?? (() => {
    //             // Fallback: recompute without weekOff (safe default)
    //             return new Date(payslip.year, payslip.month, 0).getDate() - 6
    //         })()
    //         const lopAmount = parseFloat(((payslip.basicSalary / workingDays) * payslip.lopDays).toFixed(2))
    //         const netSalary = parseFloat((payslip.basicSalary + payslip.allowances - lopAmount).toFixed(2))

    //         payslip.lopAmount   = lopAmount
    //         payslip.deductions  = lopAmount
    //         payslip.netSalary   = netSalary
    //         payslip.workingDays = workingDays

    //         await payslip.save()
    //         return res.json({ success: true, data: payslip })

    //     } catch (error) {
    //         console.error("updatePayslip error:", error)
    //         return res.status(500).json({ error: "Failed to update payslip" })
    //     }
    // }

    // // ─── Get Payslips (list) ──────────────────────────────────────────────────────
    // export const getPayslips = async (req, res) => {
    //     try {
    //         const isAdmin = req.session.role === "ADMIN"

    //         if (isAdmin) {
    //             const payslips = await Payslip.find()
    //                 .populate("employeeId", "firstName lastName email position department joinDate isDeleted employeeId")
    //                 .sort({ createdAt: -1 })

    //             const data = payslips
    //                 .filter((p) => p.employeeId && !p.employeeId.isDeleted)
    //                 .map((p) => {
    //                     const obj       = p.toObject()
    //                     const lopAmount = obj.lopAmount ?? 0
    //                     const netSalary = parseFloat(
    //                         ((obj.basicSalary ?? 0) + (obj.allowances ?? 0) - lopAmount).toFixed(2)
    //                     )
    //                     return {
    //                         ...obj,
    //                         lopAmount,
    //                         netSalary,
    //                         id:         obj._id.toString(),
    //                         employee:   obj.employeeId,
    //                         employeeId: obj.employeeId?._id?.toString(),
    //                     }
    //                 })

    //             return res.json({ data })
    //         }

    //         const employee = await Employee.findOne({ userId: req.session.userId })
    //         if (!employee) return res.status(404).json({ error: "Employee not found" })

    //         const raw = await Payslip.find({ employeeId: employee._id }).sort({ createdAt: -1 }).lean()
    //         const data = raw.map((p) => {
    //             const lopAmount = p.lopAmount ?? 0
    //             const netSalary = parseFloat(
    //                 ((p.basicSalary ?? 0) + (p.allowances ?? 0) - lopAmount).toFixed(2)
    //             )
    //             return { ...p, lopAmount, netSalary, id: p._id.toString() }
    //         })

    //         return res.json({ data })

    //     } catch (error) {
    //         console.error("getPayslips error:", error)
    //         return res.status(500).json({ error: "Failed to fetch payslips" })
    //     }
    // }

    // // ─── Get Payslip By ID (print view) ──────────────────────────────────────────
    // export const getPayslipById = async (req, res) => {
    //     try {
    //         const payslip = await Payslip.findById(req.params.id).lean()
    //         if (!payslip) return res.status(404).json({ error: "Payslip not found" })

    //         const employee = await Employee.findById(payslip.employeeId).lean()
    //         if (!employee) return res.status(404).json({ error: "Employee not found" })

    //         const basicSalary = payslip.basicSalary ?? 0
    //         const allowances  = payslip.allowances  ?? 0
    //         const lopDays     = payslip.lopDays      ?? 0
    //         const month       = payslip.month
    //         const year        = payslip.year
    //         const weekOff     = employee.workSchedule?.weekOff ?? []

    //         const workingDays = payslip.workingDays ?? getWorkingDays(month, year, weekOff)
    //         const lopAmount   = parseFloat(((basicSalary / workingDays) * lopDays).toFixed(2))
    //         const netSalary   = parseFloat((basicSalary + allowances - lopAmount).toFixed(2))

    //         // Run leave counts + absent calculation in parallel
    //         const [taken, absentDays] = await Promise.all([
    //             getTakenLeaveCountsForMonth(employee._id, month, year),
    //             getAbsentDaysForMonth(employee._id, month, year, weekOff),
    //         ])

    //         return res.json({
    //             ...payslip,
    //             id:         payslip._id.toString(),
    //             lopAmount,
    //             netSalary,
    //             workingDays,
    //             deductions: lopAmount,
    //             employee: {
    //                 ...employee,
    //                 id:           employee._id.toString(),
    //                 casualLeaves: taken.CASUAL,
    //                 sickLeaves:   taken.SICK,
    //                 earnedLeaves: taken.EARNED,
    //                 lopLeaves:    lopDays,      // stored value — respects admin override
    //                 absentDays,                 // working days with no clock-in record
    //                 weekOff,                    // pass to frontend for display if needed
    //             },
    //         })

    //     } catch (error) {
    //         console.error("getPayslipById error:", error)
    //         return res.status(500).json({ error: "Failed to fetch payslip" })
    //     }
    // }



import Employee          from "../models/Employee.js"
import Payslip           from "../models/Payslip.js"
import LeaveApplication  from "../models/LeaveApplication.js"
import Attendance        from "../models/Attendance.js"

// ─── Config ───────────────────────────────────────────────────────────────────

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

// ─── Helpers ──────────────────────────────────────────────────────────────────

const countDays = (start, end) =>
    Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

// Day name → JS getDay() index
const DAY_INDEX = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
}

/**
 * Convert weekOff string array to a Set of day indices (0=Sun … 6=Sat).
 * Falls back to [0] (Sunday only) if nothing is stored.
 */
const weekOffIndices = (weekOff = []) => {
    if (!weekOff.length) return new Set([0])
    return new Set(weekOff.map((d) => DAY_INDEX[d.toLowerCase()]).filter((n) => n !== undefined))
}

/**
 * All working dates in a month for an employee based on their weekOff schedule.
 * Returns an array of ISO date strings "YYYY-MM-DD" for reliable comparison
 * regardless of timezone — we always work in IST.
 */
const getWorkingDatesOfMonth = (month, year, weekOff = []) => {
    const offDays     = weekOffIndices(weekOff)
    const daysInMonth = new Date(year, month, 0).getDate()
    const dates       = []
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d)
        if (!offDays.has(date.getDay())) {
            // Store as "YYYY-MM-DD" — timezone-neutral
            const mm  = String(month).padStart(2, "0")
            const dd  = String(d).padStart(2, "0")
            dates.push(`${year}-${mm}-${dd}`)
        }
    }
    return dates
}

/**
 * Working days count for payslip salary calculation.
 * Uses employee's actual weekOff schedule.
 * ✅ No longer subtracts 2 EL — EL is a leave type, not a scheduled-day deduction.
 */
const getWorkingDays = (month, year, weekOff = []) => {
    return getWorkingDatesOfMonth(month, year, weekOff).length - 2  // subtract 2 Earned Leaves
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

/**
 * Convert a DB `date` field (stored as IST midnight in UTC) to "YYYY-MM-DD" IST string.
 * e.g. "2026-05-31T18:30:00.000Z"  →  "2026-06-01"
 */
const toISTDateStr = (utcDate) =>
    new Date(new Date(utcDate).getTime() + IST_OFFSET_MS)
        .toISOString()
        .slice(0, 10)

/**
 * Absent days = working days in the month that have NO attendance record AND
 * no approved leave.
 *
 * Definition:
 *   present    = clock-in days + approved leave days
 *   absent     = scheduledDays - present
 *   (LOP/CL/SL/EL do NOT reduce absent — they are leaves, not absences)
 *
 * ✅ Uses IST date strings for comparison so midnight-IST records match correctly.
 */
const getAbsentDaysForMonth = async (employeeId, month, year, weekOff = []) => {
    const workingDates = getWorkingDatesOfMonth(month, year, weekOff) // ["2026-06-01", ...]

    const monthStart = new Date(year, month - 1, 1)
    const monthEnd   = new Date(year, month, 0, 23, 59, 59)

    // ── Clock-in records ──────────────────────────────────────────────────────
    // Widen the query by ±1 day in UTC to catch IST-midnight boundary records
    const queryStart = new Date(monthStart.getTime() - IST_OFFSET_MS)
    const queryEnd   = new Date(monthEnd.getTime()   + IST_OFFSET_MS)

    const records = await Attendance.find({
        employeeId,
        date: { $gte: queryStart, $lte: queryEnd },
    }).lean()

    // Convert each record's date to IST "YYYY-MM-DD" for reliable comparison
    const clockedInDates = new Set(records.map((r) => toISTDateStr(r.date)))

    // ── Approved leave records (any type) ────────────────────────────────────
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

    // clockInDays = working days that have a clock-in record
    const clockInDays = workingDates.filter((d) =>  clockedInDates.has(d)).length

    // leaveDays = working days covered by approved leave (no clock-in)
    const leaveDays   = workingDates.filter((d) => !clockedInDates.has(d) &&  leaveDates.has(d)).length

    // absentDays = working days with no clock-in AND no approved leave
    const absentDays  = workingDates.filter((d) => !clockedInDates.has(d) && !leaveDates.has(d)).length

    return { clockInDays, leaveDays, absentDays }
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

        const weekOff     = employee.workSchedule?.weekOff ?? []
        const workingDays = getWorkingDays(m, y, weekOff)

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

// ─── Update Payslip (admin only) ──────────────────────────────────────────────
export const updatePayslip = async (req, res) => {
    try {
        const { basicSalary, allowances, lopDays } = req.body

        const payslip = await Payslip.findById(req.params.id)
        if (!payslip) return res.status(404).json({ error: "Payslip not found" })

        if (basicSalary !== undefined) payslip.basicSalary = Number(basicSalary)
        if (allowances  !== undefined) payslip.allowances  = Number(allowances)
        if (lopDays     !== undefined) payslip.lopDays     = Number(lopDays)

        const employee    = await Employee.findById(payslip.employeeId).lean()
        const weekOff     = employee?.workSchedule?.weekOff ?? []
        const workingDays = getWorkingDays(payslip.month, payslip.year, weekOff)

        const lopAmount = parseFloat(((payslip.basicSalary / workingDays) * payslip.lopDays).toFixed(2))
        const netSalary = parseFloat((payslip.basicSalary + payslip.allowances - lopAmount).toFixed(2))

        payslip.lopAmount   = lopAmount
        payslip.deductions  = lopAmount
        payslip.netSalary   = netSalary
        payslip.workingDays = workingDays

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

        const basicSalary = payslip.basicSalary ?? 0
        const allowances  = payslip.allowances  ?? 0
        const lopDays     = payslip.lopDays      ?? 0
        const month       = payslip.month
        const year        = payslip.year
        const weekOff     = employee.workSchedule?.weekOff ?? []

        const workingDays = payslip.workingDays ?? getWorkingDays(month, year, weekOff)
        const lopAmount   = parseFloat(((basicSalary / workingDays) * lopDays).toFixed(2))
        const netSalary   = parseFloat((basicSalary + allowances - lopAmount).toFixed(2))

        const [taken, counts] = await Promise.all([
            getTakenLeaveCountsForMonth(employee._id, month, year),
            getAbsentDaysForMonth(employee._id, month, year, weekOff),
        ])

        const { clockInDays, leaveDays, absentDays } = counts

        // presentDays = clock-in days + approved leave days
        // e.g. 1 clock-in + 4 leaves = 5; absentDays = scheduledDays - presentDays
        const presentDays = clockInDays + leaveDays

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
                lopLeaves:    lopDays,
                absentDays,
                presentDays,
                weekOff,
            },
        })

    } catch (error) {
        console.error("getPayslipById error:", error)
        return res.status(500).json({ error: "Failed to fetch payslip" })
    }
}