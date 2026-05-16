import { Router } from "express"
import { protect, protectAdmin } from "../middleware/auth.js"
import { clockInOut, getAttendance, getAttendanceSummary } from "../controllers/attendanceController.js"

const attendanceRouter = Router()

attendanceRouter.post("/",         protect,               clockInOut)
attendanceRouter.get("/",          protect,               getAttendance)
attendanceRouter.get("/summary",   protect, protectAdmin, getAttendanceSummary)  // ← new
console.log("✅ attendance/summary route registered")

export default attendanceRouter