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

    // ── Geofencing — assigned by admin ───────────────────────────────────────
    // If null, the employee is not restricted to any location (can clock in from anywhere)
    assignedLocation: {
        label:        { type: String, default: "" },          // e.g. "Head Office", "Warehouse"
        latitude:     { type: Number, default: null },
        longitude:    { type: Number, default: null },
        radiusMeters: { type: Number, default: 100 },         // allowed radius, default 100m
    },

}, { timestamps: true })

const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema)

export default Employee