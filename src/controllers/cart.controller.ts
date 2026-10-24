import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { addToCartSchema } from "../utils/validators";
import { addToCart, getCart } from "../services/cart.service";
import { getProductById } from "../services/supabase.service";

export const addItemToCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const body = addToCartSchema.parse(req.body);
  const product = await getProductById(body.productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const existingQty =
    getCart(req.user.id).find((item) => item.productId === body.productId)?.quantity ?? 0;

  if (product.stock < existingQty + body.quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  const cart = addToCart(req.user.id, body.productId, body.quantity);
  res.status(201).json({ success: true, data: cart });
});

export const getCurrentCart = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  res.json({ success: true, data: getCart(req.user.id) });
});
