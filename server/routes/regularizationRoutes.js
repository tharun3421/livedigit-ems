import { Router } from "express"
import { protect, protectAdmin } from "../middleware/auth.js"
import {
    getMonthAttendanceMap,
    createRegularization,
    createLateRegularization,
    getRegularizations,
    updateRegularizationStatus,
    updateLateRegularizationStatus,
} from "../controllers/regularizationController.js"

const regularizationRouter = Router()

// Employee
regularizationRouter.get("/month-map", protect,              getMonthAttendanceMap)
regularizationRouter.post("/",         protect,              createRegularization)
regularizationRouter.post("/late",     protect,              createLateRegularization)

// Admin
regularizationRouter.get("/",          protect, protectAdmin, getRegularizations)
regularizationRouter.patch("/:id",     protect, protectAdmin, updateRegularizationStatus)
regularizationRouter.patch("/late/:id",protect, protectAdmin, updateLateRegularizationStatus)

export default regularizationRouter