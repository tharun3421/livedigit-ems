import mongoose from "mongoose"
import { DEPARTMENTS } from "../constants/departments.js"

const employeeSchema = new mongoose.Schema({
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName:        { type: String, required: true },
    lastName:         { type: String, required: true },
    email:            { type: String, required: true },
    phone:            { type: String, required: true },
    position:         { type: String, required: true },
    basicSalary:      { type: Number, default: 0 },
    allowances:       { type: Number, default: 0 },
    deductions:       { type: Number, default: 0 },
    employmentStatus: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    joinDate:         { type: Date, required: true },
    isDeleted:        { type: Boolean, default: false },
    bio:              { type: String, default: "" },
    department:       { type: String, enum: DEPARTMENTS, default: "Technical" },

    bankDetails: {
        accountHolderName: { type: String, default: "" },
        bankName:          { type: String, default: "" },
        accountNumber:     { type: String, default: "" },
        ifscCode:          { type: String, default: "" },
        accountType:       { type: String, default: "" },
    },

    // ── Work Schedule (set by admin) ──────────────────────────────────────────
    workSchedule: {
        shiftStart:  { type: String, default: "" },   // e.g. "09:00"
        shiftEnd:    { type: String, default: "" },   // e.g. "18:00"
        breakStart:  { type: String, default: "" },   // e.g. "13:00"
        breakEnd:    { type: String, default: "" },   // e.g. "13:30"
        lunchStart:  { type: String, default: "" },   // e.g. "13:30"
        lunchEnd:    { type: String, default: "" },   // e.g. "14:00"
        weekOff:     { type: [String], default: ["Saturday", "Sunday"] },
    },

    // ── Geofencing (set by admin) ─────────────────────────────────────────────
    assignedLocation: {
        label:        { type: String, default: "" },
        latitude:     { type: Number, default: null },
        longitude:    { type: Number, default: null },
        radiusMeters: { type: Number, default: 100  },
    },

}, { timestamps: true })

const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema)

export default Employee