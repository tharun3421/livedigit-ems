import { Router } from "express"
import { protect, protectAdmin } from "../middleware/auth.js"
import {
  getMonthAttendanceMap,
  createRegularization,
  getRegularizations,
  updateRegularizationStatus,
} from "../controllers/regularizationController.js"

const regularizationRouter = Router()

// Employee routes
regularizationRouter.get("/month-map",  protect,              getMonthAttendanceMap)
regularizationRouter.post("/",          protect,              createRegularization)

// Admin routes
regularizationRouter.get("/",           protect, protectAdmin, getRegularizations)
regularizationRouter.patch("/:id",      protect, protectAdmin, updateRegularizationStatus)

export default regularizationRouter