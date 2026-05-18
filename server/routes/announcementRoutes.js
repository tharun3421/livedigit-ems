import { Router } from "express"
import { protect, protectAdmin } from "../middleware/auth.js"
import {
    createAnnouncement,
    getAnnouncements,
    getUnreadCount,
    deleteAnnouncement,
} from "../controllers/announcementController.js"

const announcementRouter = Router()

announcementRouter.post("/",              protect, protectAdmin, createAnnouncement)
announcementRouter.get("/",               protect,               getAnnouncements)
announcementRouter.get("/unread",         protect,               getUnreadCount)
announcementRouter.delete("/:id",         protect, protectAdmin, deleteAnnouncement)

export default announcementRouter