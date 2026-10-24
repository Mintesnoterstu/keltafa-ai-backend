import { Router } from "express";
import { addItemToCart, getCurrentCart } from "../controllers/cart.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, addItemToCart);
router.get("/", requireAuth, getCurrentCart);

export default router;
