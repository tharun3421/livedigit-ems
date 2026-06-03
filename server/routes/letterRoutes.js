// server/routes/letterRoutes.js

import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import {
  sendLetter,
  getAllLetters,
  getMyLetters,
  getUnreadLetterCount,
  markLetterRead,
  deleteLetter,
} from "../controllers/letterController.js";

const letterRouter = Router();

// Admin
letterRouter.post("/",       protect, protectAdmin, sendLetter);
letterRouter.get("/all",     protect, protectAdmin, getAllLetters);
letterRouter.delete("/:id",  protect, protectAdmin, deleteLetter);

// Employee
letterRouter.get("/",        protect, getMyLetters);
letterRouter.get("/unread",  protect, getUnreadLetterCount);
letterRouter.patch("/:id/read", protect, markLetterRead);

export default letterRouter;