import express from "express"
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "../controllers/holidayController.js"
import { protect, protectAdmin } from "../middleware/auth.js"

const router = express.Router()

router.get("/",       protect,                getHolidays)
router.post("/",      protect, protectAdmin,  createHoliday)
router.put("/:id",    protect, protectAdmin,  updateHoliday)
router.delete("/:id", protect, protectAdmin,  deleteHoliday)

export default router