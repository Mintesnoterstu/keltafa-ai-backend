import { Router } from "express";
import {
  getProduct,
  getProducts,
  getRecommendations,
} from "../controllers/product.controller";

const router = Router();

router.get("/", getProducts);
router.get("/recommendations", getRecommendations);
router.get("/:id", getProduct);

export default router;
