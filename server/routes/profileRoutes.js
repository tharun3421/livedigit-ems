import { Router } from "express"
import { protect } from "../middleware/auth.js"
import { getProfile, updateProfile, uploadAvatar } from "../controllers/profileController.js"

const profileRouter = Router()

profileRouter.get("/",      protect, getProfile)
profileRouter.post("/",     protect, updateProfile)

// ── Avatar upload — lazy-load avatarUpload middleware ─────────────────────────
// Importing avatarUpload.js at the top level crashes this module when
// CLOUDINARY_* env vars are missing, which makes GET /profile return 500.
// Instead we dynamically import it only when the avatar route is actually hit.
profileRouter.post("/avatar", protect, async (req, res, next) => {
    try {
        const { avatarUpload } = await import("../middleware/avatarUpload.js")
        avatarUpload.single("avatar")(req, res, next)
    } catch (err) {
        console.error("avatarUpload middleware load failed:", err.message)
        return res.status(500).json({ error: "Avatar upload is not configured" })
    }
}, uploadAvatar)

export default profileRouter