import { Router } from "express"
import { runBirthdayAnnouncements } from "../jobs/birthdayAnnouncement.js"

const internalRouter = Router()

// Vercel automatically sends "Authorization: Bearer <CRON_SECRET>" when it
// invokes a scheduled Cron Job, as long as a CRON_SECRET env var is set on
// the project. We also accept a ?secret= query param so this can be tested
// manually (e.g. with curl) without needing to fake that header.
const isAuthorized = (req) => {
    const secret = process.env.CRON_SECRET
    if (!secret) return false // refuse everything if no secret is configured — never run this open

    const authHeader = req.headers.authorization || ""
    if (authHeader === `Bearer ${secret}`) return true
    if (req.query.secret === secret)       return true
    return false
}

// GET /api/internal/run-birthday-check
// Triggered once a day by the Vercel Cron Job defined in vercel.json.
// Safe to call more than once — runBirthdayAnnouncements() already skips
// anyone who's already been wished today.
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