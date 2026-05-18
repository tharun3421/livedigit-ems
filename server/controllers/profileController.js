// controllers/profileController.js
import Employee from "../models/Employee.js"
import User from "../models/User.js"
// NO top-level cloudinary import — if CLOUDINARY_* env vars are missing on
// Vercel, importing avatarUpload.js here would crash this entire module and
// make GET /profile return 500 even though it doesn't use Cloudinary at all.

// ── GET /api/profile ─────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.session.userId }).lean()
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" })
    }

    const user = await User.findById(req.session.userId)
      .select("avatar cloudinaryPublicId role")
      .lean()

    return res.json({
      ...employee,
      avatar:             user?.avatar             ?? "",
      cloudinaryPublicId: user?.cloudinaryPublicId ?? "",
      user: { role: user?.role ?? "" },
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
      { userId: req.session.userId },
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

    const avatarUrl = req.file.path
    const publicId  = req.file.filename

    const user = await User.findById(req.session.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    // Lazy import — only loads when this route is actually called
    if (user.cloudinaryPublicId) {
      const { cloudinary } = await import("../middleware/avatarUpload.js")
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