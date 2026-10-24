import { Router } from "express";
import rateLimit from "express-rate-limit";
import { chat } from "../controllers/chat.controller";
import { optionalAuth } from "../middleware/auth.middleware";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Something went wrong" },
});

router.post("/", chatLimiter, optionalAuth, chat);

export default router;
