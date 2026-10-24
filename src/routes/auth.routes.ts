import { Router } from "express";
import { telegramAuth } from "../controllers/auth.controller";

const router = Router();

router.post("/telegram", telegramAuth);

export default router;
