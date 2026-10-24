import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import { createOrderSchema } from "../utils/validators";
import {
  createOrder,
  decrementStock,
  getOrdersByUserId,
  getProductsByIds,
} from "../services/supabase.service";
import { clearCart, getCart } from "../services/cart.service";
import type { OrderItem } from "../types";

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const body = createOrderSchema.parse(req.body);
  const requestedItems = body.items ?? getCart(req.user.id);

  if (requestedItems.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const products = await getProductsByIds(requestedItems.map((item) => item.productId));
  const productMap = new Map(products.map((product) => [product.id, product]));

  const orderItems: OrderItem[] = requestedItems.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new AppError(`Product ${item.productId} not found`, 404);
    }
    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}`, 400);
    }
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await createOrder({
    user_id: req.user.id,
    items: orderItems,
    total,
    address: body.address,
  });

  for (const item of orderItems) {
    await decrementStock(item.productId, item.quantity);
  }

  clearCart(req.user.id);

  res.status(201).json({ success: true, data: order });
});

export const getOrderHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  const orders = await getOrdersByUserId(req.user.id);
  res.json({ success: true, data: orders });
});
