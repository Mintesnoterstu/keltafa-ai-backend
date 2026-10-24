import type { CartItem } from "../types";

const carts = new Map<string, CartItem[]>();

export const getCart = (userId: string): CartItem[] => {
  return carts.get(userId) ?? [];
};

export const addToCart = (userId: string, productId: string, quantity: number): CartItem[] => {
  const current = getCart(userId);
  const existing = current.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    current.push({ productId, quantity });
  }

  carts.set(userId, current);
  return current;
};

export const clearCart = (userId: string): void => {
  carts.delete(userId);
};
