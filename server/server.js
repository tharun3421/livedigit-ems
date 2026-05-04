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




await connectDB()
app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`);
    
})