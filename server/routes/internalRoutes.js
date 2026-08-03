import { Router } from "express"
import { runBirthdayAnnouncements } from "../jobs/birthdayAnnouncement.js"
import { internalLimiter } from "../middleware/rateLimiter.js"

const internalRouter = Router()
internalRouter.use(internalLimiter)

const isAuthorized = (req) => {
    const secret = process.env.CRON_SECRET
    if (!secret) return false

    const authHeader = req.headers.authorization || ""
    if (authHeader === `Bearer ${secret}`) return true
    if (req.query.secret === secret)       return true
    return false
}

internalRouter.get("/run-birthday-check", async (req, res) => {
    if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" })

    try {
        await runBirthdayAnnouncements()
        return res.json({ success: true })
    } catch (err) {
        console.error("run-birthday-check error:", err)
        return res.status(500).json({ error: "Failed to run birthday check" })
    }
})

export default internalRouter