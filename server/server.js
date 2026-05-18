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
import { serve } from "inngest/express"
import { inngest, functions } from "./inngest/index.js"
import announcementRouter from "./routes/announcementRoutes.js"

const app = express()
const PORT = process.env.PORT || 4000

const allowedOrigins = [
    "https://livedigit-ems.vercel.app",
    "http://localhost:5173"
]

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))

app.use(express.json())

// ── multer().none() removed from global scope ─────────────────────────────────
// Applying it globally causes multer to attempt multipart parsing on every
// request including JSON logins, which throws and causes 500 errors.
// Apply it only on specific routes that receive multipart/form-data text fields.
// ─────────────────────────────────────────────────────────────────────────────

app.use("/api/auth",       authRouter)
app.use("/api/employees",  employeeRouter)
app.use("/api/profile",    profileRouter)
app.use("/api/attendance", attendanceRouter)
app.use("/api/leave",      leaveRouter)
app.use("/api/payslips",   payslipRouter)
app.use("/api/dashboard",  dashboardRouter)
app.use("/api/announcements", announcementRouter)
app.use("/api/inngest",    serve({ client: inngest, functions }))

app.get("/", (req, res) => res.send("Server running successfully"))

connectDB().catch((err) => console.error("DB connection failed:", err))

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

export default app