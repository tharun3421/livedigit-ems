import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema({
    employeeId:      { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    month:           { type: Number, required: true },
    year:            { type: Number, required: true },
    basicSalary:     { type: Number, required: true },
    allowances:      { type: Number, default: 0 },
    deductions:      { type: Number, default: 0 },   // fixed typo from original "deducations"
    lopDays:         { type: Number, default: 0 },   // LOP days this month
    lopAmount:       { type: Number, default: 0 },   // deduction from LOP
    totalWorkDays:   { type: Number, default: 0 },   // working days in month (excl. weekoffs)
    daysWorked:      { type: Number, default: 0 },   // totalWorkDays - lopDays
    netSalary:       { type: Number, required: true },
}, { timestamps: true })

payslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true })

const Payslip = mongoose.models.Payslip || mongoose.model("Payslip", payslipSchema)

export default Payslip