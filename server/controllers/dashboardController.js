import { DEPARTMENTS } from "../constants/departments.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";

export const getDashboard = async (req, res) => {
    try {
        const session = req.session;

        if (session.role === "ADMIN") {
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const todayEnd = new Date()
            todayEnd.setHours(23, 59, 59, 999)

            const [totalEmployees, totalAttendance, pendingLeaves] = await Promise.all([
                Employee.countDocuments({ isDeleted: { $ne: true } }),
                Attendance.countDocuments({
                    date: { $gte: todayStart, $lte: todayEnd }
                }),
                LeaveApplication.countDocuments({ status: "PENDING" })
            ])

            return res.json({
                role: "ADMIN",
                totalEmployees,
                totalDepartments: DEPARTMENTS.length,
                totalAttendance,
                pendingLeaves
            })

        } else {
            const employee = await Employee.findOne({ userId: session.userId }).lean()
            if (!employee) return res.status(404).json({ error: "Employee not found" })

            const today = new Date()
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)

            const [currentMonthAttendance, pendingLeaves, latestPayslip] = await Promise.all([
                Attendance.countDocuments({
                    employeeId: employee._id,
                    date: { $gte: monthStart, $lt: monthEnd }
                }),
                LeaveApplication.countDocuments({
                    employeeId: employee._id,
                    status: "PENDING"
                }),
                Payslip.findOne({ employeeId: employee._id }).sort({ createdAt: -1 }).lean()
            ])

            return res.json({
                role: "EMPLOYEE",
                employee: { ...employee, id: employee._id.toString() },
                currentMonthAttendance,
                pendingLeaves,
                latestPayslip: latestPayslip
                    ? { ...latestPayslip, id: latestPayslip._id.toString() }
                    : null
            })
        }

    } catch (error) {
        console.error("Dashboard error:", error)
        return res.status(500).json({ error: "Failed to load dashboard" })
    }
}