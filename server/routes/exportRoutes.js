import { Router } from "express"
import { protect, protectAdmin } from "../middleware/auth.js"
import { exportReport } from "../controllers/exportController.js"

const exportRouter = Router()

exportRouter.get("/", protect, protectAdmin, exportReport)

export default exportRouter