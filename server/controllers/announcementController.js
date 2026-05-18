import Announcement from "../models/Announcement.js"
import { v2 as cloudinary } from "cloudinary"

// ─── Create Announcement (admin) ──────────────────────────────────────────────
export const createAnnouncement = async (req, res) => {
    try {
        const { title, message, priority, imageBase64 } = req.body

        if (!title || !message)
            return res.status(400).json({ error: "Title and message are required" })

        let imageUrl = ""

        // Upload image to Cloudinary if provided
        if (imageBase64) {
            try {
                const result = await cloudinary.uploader.upload(imageBase64, {
                    folder:         "ems/announcements",
                    resource_type:  "image",
                    transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
                })
                imageUrl = result.secure_url
            } catch (uploadErr) {
                console.error("Cloudinary upload failed:", uploadErr.message)
                // Continue without image rather than failing
            }
        }

        const announcement = await Announcement.create({
            title,
            message,
            imageUrl,
            priority: priority || "NORMAL",
            createdBy: req.session.userId,
        })

        return res.status(201).json({ success: true, data: announcement })
    } catch (error) {
        console.error("createAnnouncement error:", error)
        return res.status(500).json({ error: "Failed to create announcement" })
    }
}

// ─── Get All Announcements (everyone) ────────────────────────────────────────
export const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()

        return res.json({ data: announcements })
    } catch (error) {
        console.error("getAnnouncements error:", error)
        return res.status(500).json({ error: "Failed to fetch announcements" })
    }
}

// ─── Get Announcement Count since timestamp (for unread badge) ────────────────
// GET /announcements/unread?since=ISO_DATE
export const getUnreadCount = async (req, res) => {
    try {
        const { since } = req.query
        const filter = since ? { createdAt: { $gt: new Date(since) } } : {}
        const count  = await Announcement.countDocuments(filter)
        return res.json({ count })
    } catch (error) {
        console.error("getUnreadCount error:", error)
        return res.status(500).json({ error: "Failed to get unread count" })
    }
}

// ─── Delete Announcement (admin) ──────────────────────────────────────────────
export const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id)
        if (!announcement)
            return res.status(404).json({ error: "Announcement not found" })

        // Delete from Cloudinary if image exists
        if (announcement.imageUrl) {
            try {
                const publicId = announcement.imageUrl.split("/").slice(-1)[0].split(".")[0]
                await cloudinary.uploader.destroy(`ems/announcements/${publicId}`)
            } catch { /* non-critical */ }
        }

        return res.json({ success: true })
    } catch (error) {
        console.error("deleteAnnouncement error:", error)
        return res.status(500).json({ error: "Failed to delete announcement" })
    }
}