// server/models/AttendanceRegularization.js

import mongoose from "mongoose";

const attendanceRegularizationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      enum: ["FORGOT_TO_PUNCH", "SYSTEM_ISSUE"],
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    adminRemarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const AttendanceRegularization =
  mongoose.models.AttendanceRegularization ||
  mongoose.model("AttendanceRegularization", attendanceRegularizationSchema);

export default AttendanceRegularization;