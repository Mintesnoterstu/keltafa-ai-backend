import { Router } from "express";
import { getOrderHistory, placeOrder } from "../controllers/order.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, placeOrder);
router.get("/", requireAuth, getOrderHistory);

export default router;
