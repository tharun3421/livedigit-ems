import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
    recipientId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientRole: { type: String, enum: ["ADMIN", "EMPLOYEE"], required: true },
    type: {
        type: String,
        enum: [
            "LEAVE_REQUEST",
            "LEAVE_APPROVED",
            "LEAVE_REJECTED",
            "REGULARIZATION_REQUEST",
            "REGULARIZATION_APPROVED",
            "REGULARIZATION_REJECTED",
            "LATE_REGULARIZATION_REQUEST",
            "LATE_REGULARIZATION_APPROVED",
            "LATE_REGULARIZATION_REJECTED",
        ],
        required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false },
    refId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    refType: { type: String, enum: ["LeaveApplication", "AttendanceRegularization", "LateRegularization", null], default: null },
}, { timestamps: true })

notificationSchema.index({ recipientId: 1, isRead: 1 })
notificationSchema.index({ createdAt: -1 })
// Auto-delete after 12 hours (43200 seconds)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 })

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema)
export default Notification