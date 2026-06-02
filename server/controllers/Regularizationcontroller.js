// server/controllers/regularizationController.js

import AttendanceRegularization from "../models/AttendanceRegularization.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

const toIST = (date) => new Date(date.getTime() + IST_OFFSET_MS);

const getISTMidnight = (date) => {
  const ist = toIST(date);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS);
};

// ─── Employee: Submit Regularization Request ──────────────────────────────────
export const submitRegularization = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const { date, reason, remarks } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ error: "Date and reason are required" });
    }

    const allowedReasons = ["FORGOT_TO_PUNCH", "SYSTEM_ISSUE"];
    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({ error: "Invalid reason" });
    }

    // Parse the date as IST midnight UTC
    const targetDate = getISTMidnight(new Date(date));

    // Check if attendance record shows ABSENT (or no record) for that day
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: targetDate,
    });

    if (attendance && attendance.status !== "ABSENT") {
      return res
        .status(400)
        .json({ error: "Regularization can only be applied for absent days" });
    }

    // Check if a request already exists
    const existing = await AttendanceRegularization.findOne({
      employeeId: employee._id,
      date: targetDate,
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "A regularization request for this date already exists" });
    }

    const request = await AttendanceRegularization.create({
      employeeId: employee._id,
      date: targetDate,
      reason,
      remarks: remarks || "",
    });

    return res.json({ success: true, data: request });
  } catch (err) {
    console.error("submitRegularization error:", err);
    return res.status(500).json({ error: "Failed to submit regularization request" });
  }
};

// ─── Employee: Get My Regularization Requests ─────────────────────────────────
export const getMyRegularizations = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const requests = await AttendanceRegularization.find({
      employeeId: employee._id,
    }).sort({ date: -1 });

    return res.json({ data: requests });
  } catch (err) {
    console.error("getMyRegularizations error:", err);
    return res.status(500).json({ error: "Failed to fetch regularization requests" });
  }
};

// ─── Admin: Get All Pending Regularization Requests ──────────────────────────
export const getAllRegularizations = async (req, res) => {
  try {
    const requests = await AttendanceRegularization.find()
      .populate("employeeId", "firstName lastName department position")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ data: requests });
  } catch (err) {
    console.error("getAllRegularizations error:", err);
    return res.status(500).json({ error: "Failed to fetch regularization requests" });
  }
};

// ─── Admin: Approve or Reject ─────────────────────────────────────────────────
export const reviewRegularization = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminRemarks } = req.body;

    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({ error: "Action must be APPROVED or REJECTED" });
    }

    const request = await AttendanceRegularization.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Request has already been reviewed" });
    }

    request.status = action;
    request.adminRemarks = adminRemarks || "";
    await request.save();

    // If approved, update or create the Attendance record to PRESENT
    if (action === "APPROVED") {
      const existing = await Attendance.findOne({
        employeeId: request.employeeId,
        date: request.date,
      });

      if (existing) {
        existing.status = "PRESENT";
        await existing.save();
      } else {
        await Attendance.create({
          employeeId: request.employeeId,
          date: request.date,
          status: "PRESENT",
        });
      }
    }

    return res.json({ success: true, data: request });
  } catch (err) {
    console.error("reviewRegularization error:", err);
    return res.status(500).json({ error: "Failed to review regularization request" });
  }
};