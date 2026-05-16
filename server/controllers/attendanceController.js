import { inngest } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// ─── Config ───────────────────────────────────────────────────────────────────
const LATE_HOUR        = 10   // after 10:30 AM = LATE
const LATE_MINUTE      = 30
const EXPECTED_HOURS   = 9    // full working day = 9 hours

// ─── Haversine formula ────────────────────────────────────────────────────────
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R     = 6371000
    const toRad = (deg) => (deg * Math.PI) / 180
    const dLat  = toRad(lat2 - lat1)
    const dLon  = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Clock In / Out ───────────────────────────────────────────────────────────
export const clockInOut = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.session.userId });

        if (!employee)          return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted) return res.status(403).json({ error: "Your account is deactivated. You cannot clock in/out." });

        // ── Geofencing ────────────────────────────────────────────────────────
        const loc = employee.assignedLocation;
        const hasAssignedLocation = loc?.latitude != null && loc?.longitude != null;

        if (hasAssignedLocation) {
            const { latitude, longitude } = req.body;

            if (latitude == null || longitude == null)
                return res.status(400).json({ error: "Location data is required to clock in/out." });

            const parsedLat = parseFloat(latitude);
            const parsedLng = parseFloat(longitude);

            if (isNaN(parsedLat) || isNaN(parsedLng))
                return res.status(400).json({ error: "Invalid location coordinates." });

            const distance = getDistanceMeters(parsedLat, parsedLng, loc.latitude, loc.longitude);

            if (distance > loc.radiusMeters) {
                return res.status(403).json({
                    error:    `You are ${Math.round(distance)}m away from ${loc.label || "your assigned location"}. You must be within ${loc.radiusMeters}m to clock in/out.`,
                    distance: Math.round(distance),
                    allowed:  loc.radiusMeters,
                });
            }
        }

        const now   = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const parsedLat = parseFloat(req.body.latitude);
        const parsedLng = parseFloat(req.body.longitude);
        const hasCoords = !isNaN(parsedLat) && !isNaN(parsedLng);

        const existing = await Attendance.findOne({ employeeId: employee._id, date: today });

        // ── Check In ──────────────────────────────────────────────────────────
        if (!existing) {
            // Late if clock-in is after 10:30 AM
            const isLate =
                now.getHours() > LATE_HOUR ||
                (now.getHours() === LATE_HOUR && now.getMinutes() > LATE_MINUTE)

            const attendance = await Attendance.create({
                employeeId: employee._id,
                date:       today,
                checkIn:    now,
                status:     isLate ? "LATE" : "PRESENT",
                ...(hasCoords && {
                    checkInLocation: { latitude: parsedLat, longitude: parsedLng },
                }),
            });

            await inngest.send({
                name: "employee/check-out",
                data: {
                    employeeId:   employee._id.toString(),
                    attendanceId: attendance._id.toString(),
                },
            });

            return res.json({ success: true, type: "CHECK_IN", data: attendance });
        }

        // ── Check Out ─────────────────────────────────────────────────────────
        if (!existing.checkOut) {
            const diffMs       = now.getTime() - new Date(existing.checkIn).getTime();
            const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

            // Day type based on 9-hour expected working day
            let dayType;
            if      (workingHours >= EXPECTED_HOURS)           dayType = "Full Day";           // 9h+
            else if (workingHours >= EXPECTED_HOURS * 0.75)    dayType = "Three Quarter Day";  // 6h45m+
            else if (workingHours >= EXPECTED_HOURS * 0.5)     dayType = "Half Day";           // 4h30m+
            else                                               dayType = "Short Day";

            existing.checkOut     = now;
            existing.workingHours = workingHours;
            existing.dayType      = dayType;

            // Keep LATE if checked in late; otherwise judge by hours worked
            if (existing.status !== "LATE") {
                existing.status = workingHours >= EXPECTED_HOURS * 0.5 ? "PRESENT" : "LATE";
            }

            if (hasCoords) {
                existing.checkOutLocation = { latitude: parsedLat, longitude: parsedLng };
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

        return res.json({
            data:     history,
            employee: { isDeleted: employee.isDeleted },
        });

    } catch (error) {
        console.error("getAttendance error:", error);
        return res.status(500).json({ error: "Failed to fetch attendance" });
    }
};

// ─── Attendance Summary (admin) — used by GeneratePayslipForm ────────────────
// GET /attendance/summary?employeeId=xxx&month=5&year=2026
export const getAttendanceSummary = async (req, res) => {
    try {
        const { employeeId, month, year } = req.query
        if (!employeeId || !month || !year)
            return res.status(400).json({ error: "employeeId, month and year are required" })

        const m          = Number(month)
        const y          = Number(year)
        const monthStart = new Date(y, m - 1, 1)
        const monthEnd   = new Date(y, m, 0, 23, 59, 59)

        const records = await Attendance.find({
            employeeId,
            date: { $gte: monthStart, $lte: monthEnd },
        })

        const present = records.filter((r) => r.status === "PRESENT").length
        const late    = records.filter((r) => r.status === "LATE").length
        const absent  = records.filter((r) => r.status === "ABSENT").length

        return res.json({
            daysWorked: present + late,
            present,
            late,
            absent,
            total: records.length,
        })
    } catch (error) {
        console.error("getAttendanceSummary error:", error)
        return res.status(500).json({ error: "Failed to fetch attendance summary" })
    }
}