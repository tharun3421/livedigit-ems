// import Employee from "../models/Employee.js"
// import bcrypt from "bcrypt"
// import User from "../models/User.js"
// import Attendance from "../models/Attendance.js"
// import LeaveApplication from "../models/LeaveApplication.js"
// import { OFFICE_LOCATIONS } from "../constants/offices.js"

// // ─── HELPERS ──────────────────────────────────────────────────────────────────

// const getOfficeLocation = (office) => {
//     if (!office) return { office: null, label: "", latitude: null, longitude: null, radiusMeters: 200 }
//     return OFFICE_LOCATIONS[office] || { office: null, label: "", latitude: null, longitude: null, radiusMeters: 200 }
// }

// /** Inclusive day count between two dates */
// const countDays = (start, end) =>
//     Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

// // ─── GET ALL EMPLOYEES ────────────────────────────────────────────────────────
// export const getEmployee = async (req, res) => {
//     try {
//         const { department } = req.query
//         const where = { isDeleted: false }
//         if (department) where.department = department

//         const employees = await Employee.find(where)
//             .sort({ createdAt: -1 })
//             .populate("userId", "email role avatar")
//             .lean()

//         const result = employees.map((emp) => ({
//             ...emp,
//             id:     emp._id.toString(),
//             avatar: emp.userId?.avatar || "",
//             user:   emp.userId ? { email: emp.userId.email, role: emp.userId.role } : null,
//         }))

//         return res.json(result)
//     } catch (error) {
//         console.error("Get employees error:", error)
//         return res.status(500).json({ error: "Failed to fetch employees" })
//     }
// }

// // ─── GET EMPLOYEE DETAIL ──────────────────────────────────────────────────────
// export const getEmployeeDetail = async (req, res) => {
//     try {
//         const { id } = req.params

//         const employee = await Employee.findById(id)
//             .populate("userId", "email role avatar")
//             .lean()

//         if (!employee) return res.status(404).json({ error: "Employee not found" })

//         // ── Attendance summary (all time) ─────────────────────────────────────
//         const attendanceRaw = await Attendance.aggregate([
//             { $match: { employeeId: employee._id } },
//             { $group: { _id: "$status", count: { $sum: 1 } } },
//         ])
//         const attendanceSummary = { PRESENT: 0, ABSENT: 0, LATE: 0 }
//         attendanceRaw.forEach(({ _id, count }) => {
//             if (_id in attendanceSummary) attendanceSummary[_id] = count
//         })

//         // ── Leave summary ─────────────────────────────────────────────────────
//         // SICK / CASUAL / EARNED: sum actual days (all time)
//         // LOSS_OF_PAY: sum days clamped to current month only (resets each month)
//         const now        = new Date()
//         const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
//         const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

//         const allApprovedLeaves = await LeaveApplication.find({
//             employeeId: employee._id,
//             status:     "APPROVED",
//         }).lean()

//         const leaveSummary = { SICK: 0, CASUAL: 0, EARNED: 0, LOSS_OF_PAY: 0 }

//         for (const leave of allApprovedLeaves) {
//             if (leave.type === "LOSS_OF_PAY") {
//                 // Clamp to current month — LOP resets each month
//                 const start = new Date(Math.max(new Date(leave.startDate), monthStart))
//                 const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
//                 if (end >= start) leaveSummary.LOSS_OF_PAY += countDays(start, end)
//             } else if (leave.type in leaveSummary) {
//                 // SICK / CASUAL / EARNED: total days across all time
//                 leaveSummary[leave.type] += countDays(leave.startDate, leave.endDate)
//             }
//         }

//         return res.json({
//             ...employee,
//             id:     employee._id.toString(),
//             avatar: employee.userId?.avatar || "",
//             user:   employee.userId ? { email: employee.userId.email, role: employee.userId.role } : null,
//             attendanceSummary,
//             leaveSummary,
//         })
//     } catch (error) {
//         console.error("getEmployeeDetail error:", error.message)
//         return res.status(500).json({ error: error.message })
//     }
// }

// // ─── CREATE EMPLOYEE ──────────────────────────────────────────────────────────
// export const createEmployee = async (req, res) => {
//     try {
//         const {
//             employeeId, bloodGroup,
//             firstName, lastName, email, phone, position, department,
//             basicSalary, allowances, deductions, joinDate, password, role, bio,
//             accountHolderName, bankName, accountNumber, ifscCode, accountType,
//             workSchedule, assignedLocation,
//         } = req.body

//         if (!email || !password || !firstName || !lastName)
//             return res.status(400).json({ error: "Missing required fields" })

//         const hashed = await bcrypt.hash(password, 10)
//         const user   = await User.create({ email, password: hashed, role: role || "EMPLOYEE" })

//         const employee = await Employee.create({
//             userId:      user._id,
//             employeeId:  employeeId  || "",
//             bloodGroup:  bloodGroup  || "",
//             firstName,   lastName,   email,  phone,
//             position,
//             department:  department  || "Technical",
//             basicSalary: Number(basicSalary) || 0,
//             allowances:  Number(allowances)  || 0,
//             deductions:  Number(deductions)  || 0,
//             joinDate:    new Date(joinDate),
//             bio:         bio || "",
//             bankDetails: {
//                 accountHolderName: accountHolderName || "",
//                 bankName:          bankName          || "",
//                 accountNumber:     accountNumber     || "",
//                 ifscCode:          ifscCode          || "",
//                 accountType:       accountType       || "",
//             },
//             workSchedule: {
//                 shiftStart: workSchedule?.shiftStart || "",
//                 shiftEnd:   workSchedule?.shiftEnd   || "",
//                 breakStart: workSchedule?.breakStart || "",
//                 breakEnd:   workSchedule?.breakEnd   || "",
//                 lunchStart: workSchedule?.lunchStart || "",
//                 lunchEnd:   workSchedule?.lunchEnd   || "",
//                 weekOff:    workSchedule?.weekOff    || ["Saturday", "Sunday"],
//             },
//             assignedLocation: {
//                 label:        assignedLocation?.label        || "",
//                 latitude:     assignedLocation?.latitude     ?? null,
//                 longitude:    assignedLocation?.longitude    ?? null,
//                 radiusMeters: assignedLocation?.radiusMeters ?? 100,
//             },
//         })

//         return res.status(201).json({ success: true, employee: employee.toObject() })
//     } catch (error) {
//         if (error.code === 11000) {
//             const field = error.keyPattern?.employeeId ? "Employee ID" : "Email"
//             return res.status(400).json({ error: `${field} already exists` })
//         }
//         console.error("Create employee error:", error.message)
//         return res.status(500).json({ error: error.message })
//     }
// }

// // ─── UPDATE EMPLOYEE ──────────────────────────────────────────────────────────
// export const updateEmployee = async (req, res) => {
//     try {
//         const { id } = req.params
//         const {
//             employeeId, bloodGroup,
//             firstName, lastName, email, phone, position, department,
//             basicSalary, allowances, deductions, employmentStatus, password, role, bio,
//             accountHolderName, bankName, accountNumber, ifscCode, accountType,
//             workSchedule, assignedLocation,
//         } = req.body

//         const employee = await Employee.findById(id)
//         if (!employee) return res.status(404).json({ error: "Employee not found" })

//         await Employee.findByIdAndUpdate(id, {
//             employeeId:  employeeId  || "",
//             bloodGroup:  bloodGroup  || "",
//             firstName,   lastName,   email,  phone,  position,
//             department:       department       || "Technical",
//             basicSalary:      Number(basicSalary) || 0,
//             allowances:       Number(allowances)  || 0,
//             deductions:       Number(deductions)  || 0,
//             employmentStatus: employmentStatus || "ACTIVE",
//             bio:              bio || "",
//             bankDetails: {
//                 accountHolderName: accountHolderName || "",
//                 bankName:          bankName          || "",
//                 accountNumber:     accountNumber     || "",
//                 ifscCode:          ifscCode          || "",
//                 accountType:       accountType       || "",
//             },
//             workSchedule: {
//                 shiftStart: workSchedule?.shiftStart || "",
//                 shiftEnd:   workSchedule?.shiftEnd   || "",
//                 breakStart: workSchedule?.breakStart || "",
//                 breakEnd:   workSchedule?.breakEnd   || "",
//                 lunchStart: workSchedule?.lunchStart || "",
//                 lunchEnd:   workSchedule?.lunchEnd   || "",
//                 weekOff:    workSchedule?.weekOff    || ["Saturday", "Sunday"],
//             },
//             assignedLocation: {
//                 label:        assignedLocation?.label        || "",
//                 latitude:     assignedLocation?.latitude     ?? null,
//                 longitude:    assignedLocation?.longitude    ?? null,
//                 radiusMeters: assignedLocation?.radiusMeters ?? 100,
//             },
//         })

//         const userUpdate = { email }
//         if (role)     userUpdate.role     = role
//         if (password) userUpdate.password = await bcrypt.hash(password, 10)
//         await User.findByIdAndUpdate(employee.userId, userUpdate)

//         return res.json({ success: true })
//     } catch (error) {
//         if (error.code === 11000) {
//             const field = error.keyPattern?.employeeId ? "Employee ID" : "Email"
//             return res.status(400).json({ error: `${field} already exists` })
//         }
//         console.error("Update employee error:", error.message)
//         return res.status(500).json({ error: error.message })
//     }
// }

// // ─── DELETE EMPLOYEE ──────────────────────────────────────────────────────────
// export const deleteEmployee = async (req, res) => {
//     try {
//         const { id } = req.params
//         const employee = await Employee.findById(id)
//         if (!employee) return res.status(404).json({ error: "Employee not found" })

//         employee.isDeleted        = true
//         employee.employmentStatus = "INACTIVE"
//         await employee.save()

//         return res.json({ success: true })
//     } catch (error) {
//         console.error("Delete employee error:", error.message)
//         return res.status(500).json({ error: error.message })
//     }
// }



import bcrypt            from "bcrypt"
import Attendance        from "../models/Attendance.js"
import Employee          from "../models/Employee.js"
import LeaveApplication  from "../models/LeaveApplication.js"
import User              from "../models/User.js"
import { OFFICE_LOCATIONS } from "../constants/offices.js"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Inclusive day count between two dates */
const countDays = (start, end) =>
    Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

/**
 * Resolve assignedLocation from the request body.
 * Only the office key is persisted — coordinates live in constants/offices.js.
 */
const resolveAssignedLocation = (assignedLocation) => {
    const office = assignedLocation?.office || null
    if (!office || !OFFICE_LOCATIONS[office]) {
        return { office: null, label: "" }
    }
    return {
        office,
        label: OFFICE_LOCATIONS[office].label,
    }
}

// ─── GET ALL EMPLOYEES ────────────────────────────────────────────────────────

export const getEmployee = async (req, res) => {
    try {
        const where = { isDeleted: false }
        if (req.query.department) where.department = req.query.department

        const employees = await Employee.find(where)
            .sort({ createdAt: -1 })
            .populate("userId", "email role avatar")
            .lean()

        const result = employees.map((emp) => ({
            ...emp,
            id:     emp._id.toString(),
            avatar: emp.userId?.avatar || "",
            user:   emp.userId ? { email: emp.userId.email, role: emp.userId.role } : null,
        }))

        return res.json(result)
    } catch (error) {
        console.error("getEmployee error:", error)
        return res.status(500).json({ error: "Failed to fetch employees" })
    }
}

// ─── GET EMPLOYEE DETAIL ──────────────────────────────────────────────────────

export const getEmployeeDetail = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate("userId", "email role avatar")
            .lean()

        if (!employee) return res.status(404).json({ error: "Employee not found" })

        // Attendance summary (all time)
        const attendanceRaw = await Attendance.aggregate([
            { $match: { employeeId: employee._id } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ])
        const attendanceSummary = { PRESENT: 0, ABSENT: 0, LATE: 0 }
        attendanceRaw.forEach(({ _id, count }) => {
            if (_id in attendanceSummary) attendanceSummary[_id] = count
        })

        // Leave summary
        const now        = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const allApprovedLeaves = await LeaveApplication.find({
            employeeId: employee._id,
            status:     "APPROVED",
        }).lean()

        const leaveSummary = { SICK: 0, CASUAL: 0, EARNED: 0, LOSS_OF_PAY: 0 }
        for (const leave of allApprovedLeaves) {
            if (leave.type === "LOSS_OF_PAY") {
                const start = new Date(Math.max(new Date(leave.startDate), monthStart))
                const end   = new Date(Math.min(new Date(leave.endDate),   monthEnd))
                if (end >= start) leaveSummary.LOSS_OF_PAY += countDays(start, end)
            } else if (leave.type in leaveSummary) {
                leaveSummary[leave.type] += countDays(leave.startDate, leave.endDate)
            }
        }

        return res.json({
            ...employee,
            id:     employee._id.toString(),
            avatar: employee.userId?.avatar || "",
            user:   employee.userId ? { email: employee.userId.email, role: employee.userId.role } : null,
            attendanceSummary,
            leaveSummary,
        })
    } catch (error) {
        console.error("getEmployeeDetail error:", error.message)
        return res.status(500).json({ error: error.message })
    }
}

// ─── CREATE EMPLOYEE ──────────────────────────────────────────────────────────

export const createEmployee = async (req, res) => {
    try {
        const {
            employeeId, bloodGroup,
            firstName, lastName, email, phone, position, department,
            basicSalary, allowances, deductions, joinDate, password, role, bio,
            accountHolderName, bankName, accountNumber, ifscCode, accountType,
            workSchedule, assignedLocation,
        } = req.body

        if (!email || !password || !firstName || !lastName)
            return res.status(400).json({ error: "Missing required fields" })

        const hashed = await bcrypt.hash(password, 10)
        const user   = await User.create({ email, password: hashed, role: role || "EMPLOYEE" })

        const employee = await Employee.create({
            userId:      user._id,
            employeeId:  employeeId || "",
            bloodGroup:  bloodGroup || "",
            firstName,   lastName,  email,  phone,
            position,
            department:  department  || "Technical",
            basicSalary: Number(basicSalary) || 0,
            allowances:  Number(allowances)  || 0,
            deductions:  Number(deductions)  || 0,
            joinDate:    new Date(joinDate),
            bio:         bio || "",
            bankDetails: {
                accountHolderName: accountHolderName || "",
                bankName:          bankName          || "",
                accountNumber:     accountNumber     || "",
                ifscCode:          ifscCode          || "",
                accountType:       accountType       || "",
            },
            workSchedule: {
                shiftStart: workSchedule?.shiftStart || "",
                shiftEnd:   workSchedule?.shiftEnd   || "",
                breakStart: workSchedule?.breakStart || "",
                breakEnd:   workSchedule?.breakEnd   || "",
                lunchStart: workSchedule?.lunchStart || "",
                lunchEnd:   workSchedule?.lunchEnd   || "",
                weekOff:    workSchedule?.weekOff    || ["Saturday", "Sunday"],
            },
            assignedLocation: resolveAssignedLocation(assignedLocation),
        })

        return res.status(201).json({ success: true, employee: employee.toObject() })
    } catch (error) {
        if (error.code === 11000) {
            const field = error.keyPattern?.employeeId ? "Employee ID" : "Email"
            return res.status(400).json({ error: `${field} already exists` })
        }
        console.error("createEmployee error:", error.message)
        return res.status(500).json({ error: error.message })
    }
}

// ─── UPDATE EMPLOYEE ──────────────────────────────────────────────────────────

export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params
        const {
            employeeId, bloodGroup,
            firstName, lastName, email, phone, position, department,
            basicSalary, allowances, deductions, employmentStatus, password, role, bio,
            accountHolderName, bankName, accountNumber, ifscCode, accountType,
            workSchedule, assignedLocation,
        } = req.body

        const employee = await Employee.findById(id)
        if (!employee) return res.status(404).json({ error: "Employee not found" })

        await Employee.findByIdAndUpdate(id, {
            employeeId:       employeeId       || "",
            bloodGroup:       bloodGroup       || "",
            firstName,        lastName,        email,  phone,  position,
            department:       department       || "Technical",
            basicSalary:      Number(basicSalary) || 0,
            allowances:       Number(allowances)  || 0,
            deductions:       Number(deductions)  || 0,
            employmentStatus: employmentStatus || "ACTIVE",
            bio:              bio              || "",
            bankDetails: {
                accountHolderName: accountHolderName || "",
                bankName:          bankName          || "",
                accountNumber:     accountNumber     || "",
                ifscCode:          ifscCode          || "",
                accountType:       accountType       || "",
            },
            workSchedule: {
                shiftStart: workSchedule?.shiftStart || "",
                shiftEnd:   workSchedule?.shiftEnd   || "",
                breakStart: workSchedule?.breakStart || "",
                breakEnd:   workSchedule?.breakEnd   || "",
                lunchStart: workSchedule?.lunchStart || "",
                lunchEnd:   workSchedule?.lunchEnd   || "",
                weekOff:    workSchedule?.weekOff    || ["Saturday", "Sunday"],
            },
            assignedLocation: resolveAssignedLocation(assignedLocation),
        })

        const userUpdate = { email }
        if (role)     userUpdate.role     = role
        if (password) userUpdate.password = await bcrypt.hash(password, 10)
        await User.findByIdAndUpdate(employee.userId, userUpdate)

        return res.json({ success: true })
    } catch (error) {
        if (error.code === 11000) {
            const field = error.keyPattern?.employeeId ? "Employee ID" : "Email"
            return res.status(400).json({ error: `${field} already exists` })
        }
        console.error("updateEmployee error:", error.message)
        return res.status(500).json({ error: error.message })
    }
}

// ─── DELETE EMPLOYEE ──────────────────────────────────────────────────────────

export const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
        if (!employee) return res.status(404).json({ error: "Employee not found" })

        employee.isDeleted        = true
        employee.employmentStatus = "INACTIVE"
        await employee.save()

        return res.json({ success: true })
    } catch (error) {
        console.error("deleteEmployee error:", error.message)
        return res.status(500).json({ error: error.message })
    }
}