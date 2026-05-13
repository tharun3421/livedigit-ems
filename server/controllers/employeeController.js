import Employee from "../models/Employee.js"
import bcrypt from "bcrypt"
import User from "../models/User.js"
import Attendance from "../models/Attendance.js"
import LeaveApplication from "../models/LeaveApplication.js"

// ─── GET ALL EMPLOYEES ────────────────────────────────────────────────────────
export const getEmployee = async (req, res) => {
    try {
        const { department } = req.query
        const where = { isDeleted: false }
        if (department) where.department = department

        const employees = await Employee.find(where)
            .sort({ createdAt: -1 })
            .populate("userId", "email role")
            .lean()

        const result = employees.map((emp) => ({
            ...emp,
            id: emp._id.toString(),
            user: emp.userId
                ? { email: emp.userId.email, role: emp.userId.role }
                : null,
        }))

        return res.json(result)
    } catch (error) {
        console.error("Get employees error:", error)
        return res.status(500).json({ error: "Failed to fetch employees" })
    }
}

// ─── GET EMPLOYEE DETAIL ──────────────────────────────────────────────────────
export const getEmployeeDetail = async (req, res) => {
    try {
        const { id } = req.params

        const employee = await Employee.findById(id)
            .populate("userId", "email role")
            .lean()

        if (!employee) return res.status(404).json({ error: "Employee not found" })

        const attendanceRaw = await Attendance.aggregate([
            { $match: { employeeId: employee._id } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ])

        const attendanceSummary = { PRESENT: 0, ABSENT: 0, LATE: 0 }
        attendanceRaw.forEach(({ _id, count }) => {
            if (_id in attendanceSummary) attendanceSummary[_id] = count
        })

        const leavesRaw = await LeaveApplication.aggregate([
            { $match: { employeeId: employee._id, status: "APPROVED" } },
            { $group: { _id: "$type", count: { $sum: 1 } } },
        ])

        const leaveSummary = { SICK: 0, CASUAL: 0, LOSS_OF_PAY: 0 }
        leavesRaw.forEach(({ _id, count }) => {
            if (_id in leaveSummary) leaveSummary[_id] = count
        })

        return res.json({
            ...employee,
            id: employee._id.toString(),
            user: employee.userId
                ? { email: employee.userId.email, role: employee.userId.role }
                : null,
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
            firstName, lastName, email, phone, position, department,
            basicSalary, allowances, deductions, joinDate, password, role, bio,
            accountHolderName, bankName, accountNumber, ifscCode, accountType,
        } = req.body

        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: "Missing required fields" })
        }

        const hashed = await bcrypt.hash(password, 10)
        const user = await User.create({ email, password: hashed, role: role || "EMPLOYEE" })

        const employee = await Employee.create({
            userId:      user._id,
            firstName,
            lastName,
            email,
            phone,
            position,
            department:  department || "Technical",
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
        })

        return res.status(201).json({ success: true, employee: employee.toObject() })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Email already exists" })
        }
        console.error("❌ Create employee error:", error.message)
        return res.status(500).json({ error: error.message })
    }
}

// ─── UPDATE EMPLOYEE ──────────────────────────────────────────────────────────
export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params
        const {
            firstName, lastName, email, phone, position, department,
            basicSalary, allowances, deductions, employmentStatus, password, role, bio,
            accountHolderName, bankName, accountNumber, ifscCode, accountType,
        } = req.body

        const employee = await Employee.findById(id)
        if (!employee) return res.status(404).json({ error: "Employee not found" })

        await Employee.findByIdAndUpdate(id, {
            firstName,
            lastName,
            email,
            phone,
            position,
            department:       department       || "Technical",
            basicSalary:      Number(basicSalary) || 0,
            allowances:       Number(allowances)  || 0,
            deductions:       Number(deductions)  || 0,
            employmentStatus: employmentStatus || "ACTIVE",
            bio:              bio || "",
            bankDetails: {
                accountHolderName: accountHolderName || "",
                bankName:          bankName          || "",
                accountNumber:     accountNumber     || "",
                ifscCode:          ifscCode          || "",
                accountType:       accountType       || "",
            },
        })

        const userUpdate = { email }
        if (role)     userUpdate.role     = role
        if (password) userUpdate.password = await bcrypt.hash(password, 10)
        await User.findByIdAndUpdate(employee.userId, userUpdate)

        return res.json({ success: true })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Email already exists" })
        }
        console.error("❌ Update employee error:", error.message)
        return res.status(500).json({ error: error.message })
    }
}

// ─── DELETE EMPLOYEE ──────────────────────────────────────────────────────────
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params
        const employee = await Employee.findById(id)
        if (!employee) return res.status(404).json({ error: "Employee not found" })

        employee.isDeleted        = true
        employee.employmentStatus = "INACTIVE"
        await employee.save()

        return res.json({ success: true })

    } catch (error) {
        console.error("❌ Delete employee error:", error.message)
        return res.status(500).json({ error: error.message })
    }
}