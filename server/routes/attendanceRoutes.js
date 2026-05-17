import { Router } from "express"
import { protect, protectAdmin } from "../middleware/auth.js"
import {
    clockInOut,
    getAttendance,
    getAttendanceSummary,
    getTodayAttendance,
} from "../controllers/attendanceController.js"

const attendanceRouter = Router()

attendanceRouter.post("/",        protect,                clockInOut)
attendanceRouter.get("/",         protect,                getAttendance)
attendanceRouter.get("/today",    protect, protectAdmin,  getTodayAttendance)    // ← admin dashboard
attendanceRouter.get("/summary",  protect, protectAdmin,  getAttendanceSummary)  // ← payslip form

export default attendanceRouter