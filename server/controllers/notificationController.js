import Notification from "../models/Notification.js"
import User from "../models/User.js"

export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientId: req.session.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()

        const unreadCount = notifications.filter(n => !n.isRead).length

        return res.json({
            data: notifications.map(n => ({ ...n, id: n._id.toString() })),
            unreadCount,
        })
    } catch (err) {
        console.error("getNotifications error:", err)
        return res.status(500).json({ error: "Failed to fetch notifications" })
    }
}

export const markRead = async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: req.session.userId },
            { isRead: true }
        )
        return res.json({ success: true })
    } catch (err) {
        return res.status(500).json({ error: "Failed to mark notification" })
    }
}

export const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientId: req.session.userId, isRead: false },
            { isRead: true }
        )
        return res.json({ success: true })
    } catch (err) {
        return res.status(500).json({ error: "Failed to mark all notifications" })
    }
}

// Helper used by other controllers
export const createNotification = async ({ recipientId, recipientRole, type, title, message, refId, refType }) => {
    try {
        await Notification.create({
            recipientId, recipientRole, type, title, message,
            refId: refId || null,
            refType: refType || null,
        })
    } catch (err) {
        console.error("createNotification error:", err)
    }
}

// Helper: get all admin user IDs
export const getAdminUserIds = async () => {
    const admins = await User.find({ role: "ADMIN" }).select("_id").lean()
    return admins.map(a => a._id)
}

// Helper: get every user ID (admins + employees) — used to broadcast
// announcements to everyone
export const getAllUserIds = async () => {
    const users = await User.find({}).select("_id role").lean()
    return users.map(u => ({ id: u._id, role: u.role }))
}