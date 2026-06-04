import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema({
    employeeId:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    month:       { type: Number, required: true },
    year:        { type: Number, required: true },

    // ── Salary inputs (admin-editable) ────────────────────────────────────────
    basicSalary: { type: Number, default: 0 },   // full monthly basic (not prorated)
    allowances:  { type: Number, default: 0 },   // fixed monthly allowance

    // ── Attendance counts (recomputed from live data on every save) ───────────
    workingDays: { type: Number, default: 0 },   // calendar days − weekoff days − 2 EL
    presentDays: { type: Number, default: 0 },   // clock-in days + approved SL/CL/EL days
    absentDays:  { type: Number, default: 0 },   // workingDays − presentDays − lopDays

    // ── LOP (Loss of Pay) ─────────────────────────────────────────────────────
    lopDays:     { type: Number, default: 0 },   // approved LOP days (or admin override)
    lopAmount:   { type: Number, default: 0 },   // perDaySalary × lopDays
    deductions:  { type: Number, default: 0 },   // = lopAmount (alias kept for API compat)

    // ── Computed salary fields ────────────────────────────────────────────────
    // earnedBasic = (basicSalary / workingDays) × (presentDays + lopDays)
    earnedBasic: { type: Number, default: 0 },

    // netSalary = earnedBasic − lopAmount + allowances
    //           = (basicSalary / workingDays) × presentDays + allowances
    netSalary:   { type: Number, default: 0 },

}, { timestamps: true })

payslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true })

const Payslip = mongoose.models.Payslip || mongoose.model("Payslip", payslipSchema)

export default Payslip