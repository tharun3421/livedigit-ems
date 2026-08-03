import { Router } from "express"
import { changePassword, login, session } from "../controllers/authController.js"
import { protect } from "../middleware/auth.js"
import { loginLimiter } from "../middleware/rateLimiter.js"

const authRouter = Router()

authRouter.post("/login", loginLimiter, login)
authRouter.get("/session",protect, session)
authRouter.post("/change-password",protect,changePassword)

export default authRouter;