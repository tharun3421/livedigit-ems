import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

await mongoose.connect(process.env.MONGODB_URI)
const db = mongoose.connection.db

// Fix all payslips: recompute deductions and netSalary from lopAmount
const payslipResult = await db.collection("payslips").updateMany(
  {},
  [{ $set: {
      deductions: "$lopAmount",
      netSalary:  { $subtract: [{ $add: ["$basicSalary", "$allowances"] }, "$lopAmount"] }
  }}]
)
console.log(`✅ Fixed ${payslipResult.modifiedCount} payslip(s)`)

// Remove unused fields from payslips
await db.collection("payslips").updateMany(
  {},
  { $unset: { totalWorkDays: "", daysWorked: "" } }
)
console.log("✅ Removed totalWorkDays and daysWorked from payslips")

// Clear stale deductions on ALL employees
const empResult = await db.collection("employees").updateMany(
  {},
  { $set: { deductions: 0 } }
)
console.log(`✅ Cleared deductions on ${empResult.modifiedCount} employee(s)`)

await mongoose.disconnect()
console.log("🎉 All done")
