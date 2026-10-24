import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";
import {
  productIdParamSchema,
  productQuerySchema,
  recommendationsQuerySchema,
} from "../utils/validators";
import {
  getFeaturedProducts,
  getOrdersByUserId,
  getProductById,
  getProductsByCategories,
  getProductsByIds,
  listProducts,
} from "../services/supabase.service";
import type { OrderItem } from "../types";

const asOrderItems = (items: unknown): OrderItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.filter((item): item is OrderItem => {
    if (typeof item !== "object" || item === null) {
      return false;
    }
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.productId === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.price === "number" &&
      typeof candidate.quantity === "number"
    );
  });
};

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const filters = productQuerySchema.parse(req.query);
  const products = await listProducts(filters);
  res.json({ success: true, data: products });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = productIdParamSchema.parse(req.params);
  const product = await getProductById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  res.json({ success: true, data: product });
});

export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = recommendationsQuerySchema.parse(req.query);
  const orders = await getOrdersByUserId(userId);
  const purchasedItems = orders.flatMap((order) => asOrderItems(order.items));
  const purchasedIds = [...new Set(purchasedItems.map((item) => item.productId))];
  const purchasedProducts = await getProductsByIds(purchasedIds);
  const categories = [...new Set(purchasedProducts.map((product) => product.category))];

  const recommended =
    categories.length > 0
      ? await getProductsByCategories(categories, purchasedIds)
      : await getFeaturedProducts();

  res.json({ success: true, data: recommended });
});
