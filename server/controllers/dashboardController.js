import { DEPARTMENTS } from "../constants/departments.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";
import connectDB from "../config/db.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

const getISTDay = () => {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  istNow.setUTCHours(0, 0, 0, 0);
  const start = new Date(istNow.getTime() - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
};

const getISTMonth = () => {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const start = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1));
  const end = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() + 1, 1));
  return { start, end };
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = async (req, res) => {
  try {
    await connectDB(); // 

    const { role, userId } = req.session;

    // ── Admin ─────────────────────────────────────────────────────────────────
    if (role === "ADMIN") {
      const { start, end } = getISTDay();

      const [totalEmployees, totalAttendance, pendingLeaves] = await Promise.all([
        Employee.countDocuments({ isDeleted: { $ne: true } }),
        Attendance.countDocuments({ date: { $gte: start, $lte: end } }),
        LeaveApplication.countDocuments({ status: "PENDING" }),
      ]);

      return res.json({
        role: "ADMIN",
        totalEmployees,
        totalDepartments: DEPARTMENTS.length,
        totalAttendance,
        pendingLeaves,
      });
    }

    // ── Employee ──────────────────────────────────────────────────────────────
    const employee = await Employee.findOne({ userId }).lean();
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const { start: monthStart, end: monthEnd } = getISTMonth();

    const [currentMonthAttendance, pendingLeaves, latestPayslip] = await Promise.all([
      Attendance.countDocuments({
        employeeId: employee._id,
        date: { $gte: monthStart, $lt: monthEnd },
      }),
      LeaveApplication.countDocuments({
        employeeId: employee._id,
        status: "PENDING",
      }),
      Payslip.findOne({ employeeId: employee._id }).sort({ createdAt: -1 }).lean(),
    ]);

    return res.json({
      role: "EMPLOYEE",
      employee: { ...employee, id: employee._id.toString() },
      currentMonthAttendance,
      pendingLeaves,
      latestPayslip: latestPayslip
        ? { ...latestPayslip, id: latestPayslip._id.toString() }
        : null,
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    return res.status(500).json({ error: "Failed to load dashboard" });
  }
};