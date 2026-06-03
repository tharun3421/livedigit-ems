import Employee                from "../models/Employee.js"
import Attendance              from "../models/Attendance.js"
import AttendanceRegularization from "../models/AttendanceRegularization.js"

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

const getISTMidnight = (date) => {
  const ist = new Date(date.getTime() + IST_OFFSET_MS)
  ist.setUTCHours(0, 0, 0, 0)
  return new Date(ist.getTime() - IST_OFFSET_MS)
}

// ─── Employee: get full-month attendance map (for calendar popup) ─────────────
export const getMonthAttendanceMap = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId })
    if (!employee) return res.status(404).json({ error: "Employee not found" })

    const now       = new Date()
    const istNow    = new Date(now.getTime() + IST_OFFSET_MS)
    const year      = parseInt(req.query.year)  || istNow.getUTCFullYear()
    const month     = parseInt(req.query.month) || istNow.getUTCMonth() + 1 // 1-based

    const monthStartUTC = new Date(
      Date.UTC(year, month - 1, 1, 0, 0, 0) - IST_OFFSET_MS
    )
    const monthEndUTC = new Date(
      Date.UTC(year, month, 1, 0, 0, 0) - IST_OFFSET_MS
    )

    const [attendanceRecords, regularizations] = await Promise.all([
      Attendance.find({
        employeeId: employee._id,
        date: { $gte: monthStartUTC, $lt: monthEndUTC },
      }).lean(),
      AttendanceRegularization.find({
        employeeId: employee._id,
        date: { $gte: monthStartUTC, $lt: monthEndUTC },
      }).lean(),
    ])

    // Build a map: "YYYY-MM-DD" → { status, checkIn, checkOut, workingHours, dayType, regularization }
    const attMap = {}
    for (const r of attendanceRecords) {
      const istDate = new Date(r.date.getTime() + IST_OFFSET_MS)
      const key = istDate.toISOString().slice(0, 10)
      attMap[key] = {
        status:       r.status,
        checkIn:      r.checkIn,
        checkOut:     r.checkOut,
        workingHours: r.workingHours,
        dayType:      r.dayType,
      }
    }

    // Attach regularization info
    const regMap = {}
    for (const r of regularizations) {
      const istDate = new Date(r.date.getTime() + IST_OFFSET_MS)
      const key = istDate.toISOString().slice(0, 10)
      regMap[key] = {
        _id:         r._id.toString(),
        status:      r.status,
        reason:      r.reason,
        remarks:     r.remarks,
        adminRemark: r.adminRemark,
      }
    }

    return res.json({ data: { attendance: attMap, regularizations: regMap, year, month } })
  } catch (err) {
    console.error("getMonthAttendanceMap error:", err)
    return res.status(500).json({ error: "Failed to fetch attendance map" })
  }
}

// ─── Employee: submit regularization ─────────────────────────────────────────
export const createRegularization = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId })
    if (!employee)          return res.status(404).json({ error: "Employee not found" })
    if (employee.isDeleted) return res.status(403).json({ error: "Your account is deactivated." })

    const { date, reason, remarks } = req.body
    if (!date || !reason)
      return res.status(400).json({ error: "Date and reason are required" })

    const validReasons = ["FORGOT_TO_CHECKIN", "SYSTEM_ERROR", "WORKED_FROM_HOME", "CLIENT_VISIT", "OTHER"]
    if (!validReasons.includes(reason))
      return res.status(400).json({ error: "Invalid reason" })

    // Convert the date (YYYY-MM-DD in IST) to a UTC midnight as stored in Attendance
    const [y, m, d] = date.split("-").map(Number)
    const istMidnight = new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
    const utcDate     = new Date(istMidnight.getTime() - IST_OFFSET_MS)

    // Must not already have attendance for this day
    const existing = await Attendance.findOne({ employeeId: employee._id, date: utcDate })
    if (existing)
      return res.status(400).json({ error: "You already have attendance recorded for this date." })

    // Check for duplicate regularization
    const dupReg = await AttendanceRegularization.findOne({ employeeId: employee._id, date: utcDate })
    if (dupReg)
      return res.status(400).json({ error: "A regularization request already exists for this date." })

    const reg = await AttendanceRegularization.create({
      employeeId: employee._id,
      date:       utcDate,
      reason,
      remarks:    remarks || "",
    })

    return res.json({ success: true, data: reg })
  } catch (err) {
    console.error("createRegularization error:", err)
    return res.status(500).json({ error: "Failed to submit regularization" })
  }
}

// ─── Admin: get all regularization requests ──────────────────────────────────
export const getRegularizations = async (req, res) => {
  try {
    const { status } = req.query
    const where = status ? { status } : {}

    const regs = await AttendanceRegularization.find(where)
      .populate("employeeId", "firstName lastName department position avatar")
      .sort({ createdAt: -1 })
      .lean()

    const data = regs
      .filter((r) => r.employeeId && !r.employeeId.isDeleted)
      .map((r) => ({
        ...r,
        _id:      r._id.toString(),
        employee: r.employeeId,
      }))

    return res.json({ data })
  } catch (err) {
    console.error("getRegularizations error:", err)
    return res.status(500).json({ error: "Failed to fetch regularizations" })
  }
}

// ─── Admin: approve / reject ──────────────────────────────────────────────────
export const updateRegularizationStatus = async (req, res) => {
  try {
    const { status, adminRemark } = req.body
    if (!["APPROVED", "REJECTED"].includes(status))
      return res.status(400).json({ error: "Invalid status" })

    const reg = await AttendanceRegularization.findById(req.params.id)
    if (!reg) return res.status(404).json({ error: "Request not found" })

    reg.status      = status
    reg.adminRemark = adminRemark || ""
    await reg.save()

    // If approved — create an attendance record for that day
    if (status === "APPROVED") {
      const existingAtt = await Attendance.findOne({
        employeeId: reg.employeeId,
        date:       reg.date,
      })
      if (!existingAtt) {
        // Create a synthetic full-day present record (no real check-in/out times)
        await Attendance.create({
          employeeId:   reg.employeeId,
          date:         reg.date,
          checkIn:      null,
          checkOut:     null,
          status:       "PRESENT",
          workingHours: 9,
          dayType:      "Full Day",
        })
      }
    }

    return res.json({ success: true, data: reg })
  } catch (err) {
    console.error("updateRegularizationStatus error:", err)
    return res.status(500).json({ error: "Failed to update status" })
  }
}