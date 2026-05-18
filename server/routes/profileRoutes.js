import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getProfile, updateProfile, uploadAvatar } from "../controllers/profileController.js";
import { avatarUpload } from "../middleware/avatarUpload.js";

const profileRouter = Router();

profileRouter.get("/", protect, getProfile);
profileRouter.post("/", protect, updateProfile);
profileRouter.post("/avatar", protect, avatarUpload.single("avatar"), uploadAvatar);

export default profileRouter;