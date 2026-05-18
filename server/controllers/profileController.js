// controllers/profileController.js
import Employee from "../models/Employee.js"
import User from "../models/User.js"
import { cloudinary } from "../middleware/avatarUpload.js"

// ── GET /api/profile ─────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id })
    if (!employee) return res.status(404).json({ error: "Profile not found" })

    // Merge avatar from User into the Employee response
    const user = await User.findById(req.user._id).select("avatar role")

    return res.json({
      ...employee.toObject(),
      avatar: user?.avatar || "",   // ← inject avatar so frontend receives it
      user: { role: user?.role },
    })
  } catch (err) {
    console.error("getProfile error:", err)
    return res.status(500).json({ error: err.message })
  }
}

// ── POST /api/profile ────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { userId: req.user._id },
      { $set: req.body },
      { new: true }
    )
    if (!employee) return res.status(404).json({ error: "Profile not found" })
    return res.json(employee)
  } catch (err) {
    console.error("updateProfile error:", err)
    return res.status(500).json({ error: err.message })
  }
}

// ── POST /api/profile/avatar ─────────────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file received" })
    }

    const avatarUrl = req.file.path      // Cloudinary secure URL
    const publicId  = req.file.filename  // Cloudinary public_id

    // Avatar lives on User — find by the auth middleware's req.user._id
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: "User not found" })

    // Delete old Cloudinary image to avoid orphaned files
    if (user.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(user.cloudinaryPublicId).catch((e) => {
        console.warn("Could not delete old avatar:", e.message)
      })
    }

    user.avatar             = avatarUrl
    user.cloudinaryPublicId = publicId
    await user.save()

    return res.json({ avatarUrl })
  } catch (err) {
    console.error("uploadAvatar error:", err)
    return res.status(500).json({ error: err.message })
  }
}