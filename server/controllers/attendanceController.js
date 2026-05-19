import { inngest } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const LATE_HOUR      = 10;
const LATE_MINUTE    = 30;
const EXPECTED_HOURS = 9;
const IST_OFFSET_MS  = (5 * 60 + 30) * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R     = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat  = toRad(lat2 - lat1);
  const dLon  = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toIST = (date) => new Date(date.getTime() + IST_OFFSET_MS);

const getISTMidnight = (date) => {
  const ist = toIST(date);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS);
};

const getDayType = (workingHours) => {
  if (workingHours >= EXPECTED_HOURS)        return "Full Day";
  if (workingHours >= EXPECTED_HOURS * 0.75) return "Three Quarter Day";
  if (workingHours >= EXPECTED_HOURS * 0.5)  return "Half Day";
  return "Short Day";
};

const parseCoords = (body) => {
  const lat = parseFloat(body?.latitude);
  const lng = parseFloat(body?.longitude);
  return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
};

// ─── Clock In / Out ───────────────────────────────────────────────────────────

export const clockInOut = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId });

    if (!employee)          return res.status(404).json({ error: "Employee not found" });
    if (employee.isDeleted) return res.status(403).json({ error: "Your account is deactivated. You cannot clock in/out." });

    const coords = parseCoords(req.body);
    const loc    = employee.assignedLocation;
    const hasAssignedLocation = loc?.latitude != null && loc?.longitude != null;

    if (hasAssignedLocation) {
      if (!coords)
        return res.status(400).json({ error: "Location data is required to clock in/out." });

      const distance = getDistanceMeters(coords.lat, coords.lng, loc.latitude, loc.longitude);

      if (distance > loc.radiusMeters) {
        return res.status(403).json({
          error:    `You are ${Math.round(distance)}m away from ${loc.label || "your assigned location"}. You must be within ${loc.radiusMeters}m to clock in/out.`,
          distance: Math.round(distance),
          allowed:  loc.radiusMeters,
        });
      }
    }

    const now      = new Date();
    const istNow   = toIST(now);
    const todayIST = getISTMidnight(now);

    const existing = await Attendance.findOne({ employeeId: employee._id, date: todayIST });

    // ── Check In ──────────────────────────────────────────────────────────────
    if (!existing) {
      const isLate =
        istNow.getUTCHours() > LATE_HOUR ||
        (istNow.getUTCHours() === LATE_HOUR && istNow.getUTCMinutes() > LATE_MINUTE);

      const attendance = await Attendance.create({
        employeeId: employee._id,
        date:       todayIST,
        checkIn:    now,
        status:     isLate ? "LATE" : "PRESENT",
        ...(coords && { checkInLocation: { latitude: coords.lat, longitude: coords.lng } }),
      });

      await inngest.send({
        name: "employee/check-out",
        data: { employeeId: employee._id.toString(), attendanceId: attendance._id.toString() },
      });

      return res.json({ success: true, type: "CHECK_IN", data: attendance });
    }

    // ── Check Out ─────────────────────────────────────────────────────────────
    if (!existing.checkOut) {
      const diffMs       = now.getTime() - new Date(existing.checkIn).getTime();
      const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

      existing.checkOut     = now;
      existing.workingHours = workingHours;
      existing.dayType      = getDayType(workingHours);

      if (existing.status !== "LATE") {
        existing.status = workingHours >= EXPECTED_HOURS * 0.5 ? "PRESENT" : "LATE";
      }

      if (coords) {
        existing.checkOutLocation = { latitude: coords.lat, longitude: coords.lng };
      }

      await existing.save();
      return res.json({ success: true, type: "CHECK_OUT", data: existing });
    }

    return res.status(400).json({ error: "Already checked out for today" });

  } catch (error) {
    console.error("clockInOut error:", error);
    return res.status(500).json({ error: "Operation failed" });
  }
};

// ─── Get Attendance ───────────────────────────────────────────────────────────

export const getAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const now          = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const history = await Attendance.find({
      employeeId: employee._id,
      date: { $gte: startOfMonth },
    }).sort({ date: -1 });

    return res.json({ data: history, employee: { isDeleted: employee.isDeleted } });

  } catch (error) {
    console.error("getAttendance error:", error);
    return res.status(500).json({ error: "Failed to fetch attendance" });
  }
};

// ─── Attendance Summary (admin) ───────────────────────────────────────────────

export const getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    if (!employeeId || !month || !year)
      return res.status(400).json({ error: "employeeId, month and year are required" });

    const m          = Number(month);
    const y          = Number(year);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd   = new Date(y, m, 0, 23, 59, 59);

    const records = await Attendance.find({
      employeeId,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    const present = records.filter((r) => r.status === "PRESENT").length;
    const late    = records.filter((r) => r.status === "LATE").length;
    const absent  = records.filter((r) => r.status === "ABSENT").length;

    return res.json({ daysWorked: present + late, present, late, absent, total: records.length });

  } catch (error) {
    console.error("getAttendanceSummary error:", error);
    return res.status(500).json({ error: "Failed to fetch attendance summary" });
  }
};

// ─── Today's Attendance (admin dashboard) ────────────────────────────────────

export const getTodayAttendance = async (req, res) => {
  try {
    const now      = new Date();
    const todayIST    = getISTMidnight(now);
    const tomorrowIST = new Date(todayIST.getTime() + 24 * 60 * 60 * 1000);

    const records = await Attendance.find({ date: { $gte: todayIST, $lt: tomorrowIST } })
      .populate("employeeId", "firstName lastName position department")
      .sort({ checkIn: 1 })
      .lean();

    const data = records
      .filter((r) => r.employeeId)
      .map((r) => ({ ...r, _id: r._id.toString(), employee: r.employeeId }));

    return res.json({ data });

  } catch (error) {
    console.error("getTodayAttendance error:", error);
    return res.status(500).json({ error: "Failed to fetch today's attendance" });
  }
};