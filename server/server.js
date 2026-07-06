import express from "express"
import cors from "cors"
import "dotenv/config"
import multer from "multer"
import connectDB from "./config/db.js"
import authRouter from "./routes/authRoutes.js"
import employeeRouter from "./routes/employeeRoutes.js"
import profileRouter from "./routes/profileRoutes.js"
import attendanceRouter from "./routes/attendanceRoutes.js"
import leaveRouter from "./routes/leaveRoutes.js"
import payslipRouter from "./routes/payslipRoutes.js"
import dashboardRouter from "./routes/dashboardRoutes.js"
import announcementRouter from "./routes/announcementRoutes.js"
import holidayRouter from "./routes/holidayRoutes.js"
import { serve } from "inngest/express"
import regularizationRouter from "./routes/regularizationRoutes.js"
import letterRouter from "./routes/letterRoutes.js"
import { startAutoCheckoutJob } from './jobs/autoCheckout.js'
import { startBirthdayAnnouncementJob } from './jobs/birthdayAnnouncement.js'
import notificationRouter from "./routes/notificationRoutes.js"
import exportRouter       from "./routes/exportRoutes.js"
import internalRouter     from "./routes/internalRoutes.js"


const app = express()
const PORT = process.env.PORT || 4000

const allowedOrigins = [
    "https://livedigit-ems.vercel.app",
    "http://localhost:5173"
]

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}

app.use(cors(corsOptions))
app.options("/{*path}", cors(corsOptions))

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))

// ── Ensure DB is connected before every request (critical for Vercel serverless) ──
app.use(async (req, res, next) => {
    try {
        await connectDB()
        next()
    } catch (err) {
        console.error("DB connection failed:", err)
        res.status(503).json({ error: "Database unavailable. Please try again." })
    }
})

app.use("/api/auth",           authRouter)
app.use("/api/employees",      employeeRouter)
app.use("/api/profile",        profileRouter)
app.use("/api/attendance",     attendanceRouter)
app.use("/api/leave",          leaveRouter)
app.use("/api/payslips",       payslipRouter)
app.use("/api/dashboard",      dashboardRouter)
app.use("/api/announcements",  announcementRouter)
app.use("/api/holidays",       holidayRouter)
app.use("/api/regularization", regularizationRouter)
app.use("/api/letters",        letterRouter)
app.use("/api/notifications", notificationRouter)
app.use("/api/export",        exportRouter)
app.use("/api/internal",      internalRouter)

app.get("/", (req, res) => res.send("Server running successfully"))

startAutoCheckoutJob()

// On Vercel, serverless functions don't keep a Node process running in the
// background, so an in-process node-cron schedule can't be relied on to
// fire. There, a Vercel Cron Job (see vercel.json) hits
// /api/internal/run-birthday-check once a day instead. Locally / on a
// persistent server, the in-process schedule below still works fine.
if (!process.env.VERCEL) {
    startBirthdayAnnouncementJob()
}

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

export default app