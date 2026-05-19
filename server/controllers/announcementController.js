import Announcement from "../models/Announcement.js"
import { v2 as cloudinary } from "cloudinary"



cloudinary.config({
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    api_key:     process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET,
})


// ─── Create Announcement (admin) ──────────────────────────────────────────────
export const createAnnouncement = async (req, res) => {
    try {
        const { title, message, priority, imageBase64 } = req.body

        if (!title || !message)
            return res.status(400).json({ error: "Title and message are required" })

        let imageUrl = ""

        if (imageBase64) {
            try {
                const result = await cloudinary.uploader.upload(imageBase64, {
                    folder:         "ems/announcements",
                    resource_type:  "image",
                    transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
                })
                imageUrl = result.secure_url
                // ✅ Log the URL so you can confirm Cloudinary is working
                console.log("Cloudinary upload success:", imageUrl)
            } catch (uploadErr) {
                // ✅ Log the FULL error so you can diagnose missing credentials etc.
                console.error("Cloudinary upload failed:", uploadErr)
                // Continue without image rather than failing the whole request
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

        // ✅ FIX: extract the correct public_id from the full Cloudinary URL
        // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123456789/ems/announcements/<publicId>.jpg
        if (announcement.imageUrl) {
            try {
                const urlParts  = announcement.imageUrl.split("/")
                const uploadIdx = urlParts.indexOf("upload")

                if (uploadIdx !== -1) {
                    // Everything after "upload/v<version>/" is the public_id (without extension)
                    const afterUpload = urlParts.slice(uploadIdx + 2).join("/")   // skip "upload" + version segment
                    const publicId    = afterUpload.replace(/\.[^/.]+$/, "")      // strip file extension

                    await cloudinary.uploader.destroy(publicId)
                    console.log("Cloudinary delete success:", publicId)
                }
            } catch (deleteErr) {
                console.error("Cloudinary delete failed (non-critical):", deleteErr.message)
            }
        }

        return res.json({ success: true })
    } catch (error) {
        console.error("deleteAnnouncement error:", error)
        return res.status(500).json({ error: "Failed to delete announcement" })
    }
}