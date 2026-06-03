
// server/controllers/dashboardController.js
// Replace your existing dashboardController.js with this file.

import { DEPARTMENTS } from "../constants/departments.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";
import connectDB from "../config/db.js";

// ─── IST helpers ──────────────────────────────────────────────────────────────
// Attendance dates are stored as UTC instants that equal midnight IST,
// e.g. June 1 00:00 IST = May 31 18:30:00 UTC.
// All range queries must use the same convention.

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Returns the UTC instant for IST midnight on the current day.
const getISTDay = () => {
  const now    = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  istNow.setUTCHours(0, 0, 0, 0);
  const start = new Date(istNow.getTime() - IST_OFFSET_MS);         // today 00:00 IST in UTC
  const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1); // today 23:59:59.999 IST in UTC
  return { start, end };
};

// Returns the UTC range covering the entire current IST month.
// start = 1st of month 00:00 IST → e.g. May 31 18:30 UTC
// end   = 1st of next month 00:00 IST (exclusive)
const getISTMonth = () => {
  const now    = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);

  // First instant of this month in IST, converted back to UTC
  const startIST = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1, 0, 0, 0, 0));
  const start    = new Date(startIST.getTime() - IST_OFFSET_MS);

  // First instant of next month in IST, converted back to UTC (exclusive upper bound)
  const endIST = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  const end    = new Date(endIST.getTime() - IST_OFFSET_MS);

  return { start, end };
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboard = async (req, res) => {
  try {
    await connectDB();

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
      // Count only PRESENT and LATE records — ABSENT must NOT be counted
      Attendance.countDocuments({
        employeeId: employee._id,
        date:   { $gte: monthStart, $lt: monthEnd },
        status: { $in: ["PRESENT", "LATE"] },
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