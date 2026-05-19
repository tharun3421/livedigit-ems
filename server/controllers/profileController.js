import Employee from "../models/Employee.js"
import User from "../models/User.js"

// ── GET /api/profile ──────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        const userId = req.session.userId

        let employee = await Employee.findOne({ userId }).lean()

        // Auto-create a minimal profile if none exists (e.g. admin account
        // seeded directly into Users without a matching Employee document)
        if (!employee) {
            const user = await User.findById(userId).lean()
            if (!user) return res.status(404).json({ error: "User not found" })

            const created = await Employee.create({
                userId,
                firstName:        user.email.split("@")[0],
                lastName:         "",
                email:            user.email,
                employmentStatus: "ACTIVE",
                isDeleted:        false,
                department:       "Technical",
                position:         user.role === "ADMIN" ? "Administrator" : "Employee",
                basicSalary:      0,
                allowances:       0,
                deductions:       0,
                joinDate:         new Date(),
            })
            employee = created.toObject()
        }

        const user = await User.findById(userId)
            .select("avatar cloudinaryPublicId role email")
            .lean()

        return res.json({
            ...employee,
            avatar:             user?.avatar             ?? "",
            cloudinaryPublicId: user?.cloudinaryPublicId ?? "",
            user: {
                role:  user?.role  ?? "",
                email: user?.email ?? "",
            },
        })
    } catch (err) {
        console.error("getProfile error:", err)
        return res.status(500).json({ error: err.message })
    }
}

// ── PUT /api/profile ──────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
    try {
        const userId = req.session.userId

        const employee = await Employee.findOneAndUpdate(
            { userId },
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

// ── POST /api/profile/avatar ──────────────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file received" })
        }

        const userId    = req.session.userId
        const avatarUrl = req.file.path
        const publicId  = req.file.filename

        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ error: "User not found" })

        // Delete old avatar from Cloudinary if it exists
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