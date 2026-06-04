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

app.get("/", (req, res) => res.send("Server running successfully"))

startAutoCheckoutJob()

connectDB().catch((err) => console.error("DB connection failed:", err))

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

export default app