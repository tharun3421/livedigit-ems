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

const app = express()
const PORT = process.env.PORT || 4000;

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
    credentials: true
}

app.use(cors(corsOptions))
app.options('/{*any}', cors(corsOptions))

app.use(express.json())
app.use(multer().none())

app.use("/api/auth", authRouter)
app.use("/api/employees", employeeRouter)
app.use("/api/profile", profileRouter)
app.use("/api/attendance", attendanceRouter)
app.use("/api/leave", leaveRouter)
app.use("/api/payslips", payslipRouter)
app.use("/api/dashboard", dashboardRouter)
app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/", (req, res) => {
    res.send("Server running successfully");
});

// ✅ Connect DB without blocking the export
connectDB().catch((err) => console.error("DB connection failed:", err));

// ✅ Only listen locally, not on Vercel
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    })
}

// ✅ This is what Vercel actually needs
export default app;