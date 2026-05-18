// controllers/profileController.js
import Employee from "../models/Employee.js"
import User from "../models/User.js"
// ✅ cloudinary is NOT imported at the top level.
//    avatarUpload.js calls cloudinary.config() the moment it is imported.
//    If CLOUDINARY_* env vars are missing on Vercel that import throws,
//    which crashes this entire module — making GET /profile 500 too.
//    Lazy import inside uploadAvatar() keeps the two concerns separate.

// ── GET /api/profile ─────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id }).lean()
    if (!employee) {
      return res.status(404).json({ error: "Employee profile not found" })
    }

    const user = await User.findById(req.user._id)
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
      { userId: req.user._id },
      { $set: req.body },
      { new: true }
    ).lean()
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

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: "User not found" })

    // ✅ Only import cloudinary here, when it is actually needed
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