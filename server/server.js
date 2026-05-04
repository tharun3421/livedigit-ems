import express from "express"
import cors from "cors"
import "dotenv/config"
import multer from "multer";
import connectDB from "./config/db.js"
import authRouter from "./routes/authRoutes.js";
import employeeRouter from "./routes/employeeRoutes.js";
import profileRouter from "./routes/profileRoutes.js"
import attendanceRouter from "./routes/attendanceRoutes.js";
import leaveRouter from "./routes/leaveRoutes.js";
import payslipRouter from "./routes/payslipRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import Attendance from "./models/Attendance.js";

const app = express()
const PORT = process.env.PORT || 4000;


// server.js or app.js
const allowedOrigins = [
    "https://livedigit-ems.vercel.app",
    "http://localhost:5173"
]

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true
}))

app.use(express.json())
app.use(multer().none())

app.use("/api/auth",authRouter)
app.use("/api/employees",employeeRouter)
app.use("/api/profile",profileRouter)
app.use("/api/attendance",attendanceRouter)
app.use("/api/leave",leaveRouter)
app.use("/api/payslips",payslipRouter)
app.use("/api/dashboard",dashboardRouter)
app.use("/api/inngest", serve({ client: inngest, functions }));


app.get("/", (req, res) => {
   res.send("Server running successfully");
});




// add this temporarily in your server.js
app.get("/api/debug", async (req, res) => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const all = await Attendance.find({}).sort({ date: -1 }).limit(5).lean()
    const count = await Attendance.countDocuments({ date: { $gte: start, $lte: end } })
    const exactCount = await Attendance.countDocuments({ date: new Date("2026-05-04T00:00:00.000Z") })

    return res.json({
        serverTime: new Date().toISOString(),
        queryStart: start.toISOString(),
        queryEnd: end.toISOString(),
        rangeCount: count,
        exactCount,
        last5Records: all.map(a => ({
            date: a.date,
            checkIn: a.checkIn,
            status: a.status
        }))
    })
})



await connectDB()
app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`);
    
})