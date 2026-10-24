import { z } from "zod";

export const telegramAuthSchema = z.object({
  telegram_id: z.union([z.string().min(1), z.number()]).transform((value) => String(value)),
  first_name: z.string().min(1).max(100),
});

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});

export const recommendationsQuerySchema = z.object({
  userId: z.string().min(1),
});

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
});

export const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1)
    .optional(),
  address: addressSchema,
});

export const chatSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
  email: z.string().email().optional(),
  userId: z.string().min(1).optional(),
});

export const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
