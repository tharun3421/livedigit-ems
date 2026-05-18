import mongoose from "mongoose"

const announcementSchema = new mongoose.Schema({
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    imageUrl:  { type: String, default: "" },        // Cloudinary / base64 URL
    priority:  { type: String, enum: ["NORMAL", "IMPORTANT", "URGENT"], default: "NORMAL" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true })

const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema)

export default Announcement