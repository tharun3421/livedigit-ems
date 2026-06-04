
import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema({
    employeeId:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    month:       { type: Number, required: true },
    year:        { type: Number, required: true },
    basicSalary: { type: Number, default: 0 },
    allowances:  { type: Number, default: 0 },
    deductions:  { type: Number, default: 0 },  // = lopAmount
    lopDays:     { type: Number, default: 0 },
    lopAmount:   { type: Number, default: 0 },
    netSalary:   { type: Number, default: 0 },  // = earnedBasic + allowances
    workingDays: { type: Number, default: 0 },  // scheduled working days in the month
    presentDays: { type: Number, default: 0 },  // clock-in days + approved leave days
    absentDays:  { type: Number, default: 0 },  // workingDays - presentDays
}, { timestamps: true })

payslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true })

const Payslip = mongoose.models.Payslip || mongoose.model("Payslip", payslipSchema)

export default Payslip