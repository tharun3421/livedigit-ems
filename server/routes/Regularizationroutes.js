// server/routes/regularizationRoutes.js

import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import {
  submitRegularization,
  getMyRegularizations,
  getAllRegularizations,
  reviewRegularization,
} from "../controllers/regularizationController.js";

const regularizationRouter = Router();

// Employee routes
regularizationRouter.post("/", protect, submitRegularization);
regularizationRouter.get("/my", protect, getMyRegularizations);

// Admin routes
regularizationRouter.get("/all", protect, protectAdmin, getAllRegularizations);
regularizationRouter.patch("/:id/review", protect, protectAdmin, reviewRegularization);

export default regularizationRouter;