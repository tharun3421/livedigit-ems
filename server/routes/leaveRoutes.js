import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import { createLeave, getLeaves, updateLeaveStatus, getLopSummary } from "../controllers/leaveController.js";

const leaveRouter = Router();

leaveRouter.post("/",                protect,              createLeave)
leaveRouter.get("/",                 protect,              getLeaves)
leaveRouter.get("/lop-summary",      protect, protectAdmin, getLopSummary)  // ← fixed
leaveRouter.patch("/:id",            protect, protectAdmin, updateLeaveStatus)

export default leaveRouter