import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { chatSchema, EMAIL_REGEX } from "../utils/validators";
import {
  getOrdersByUserId,
  getRecentChatMessages,
  getTestOrdersByEmail,
  saveChatMessage,
} from "../services/supabase.service";
import { generateChatReply } from "../services/gemini.service";
import type { AiTestOrder, ChatMessage, Order, OrderItem } from "../types";

const extractEmail = (text: string): string | null => {
  const match = text.match(EMAIL_REGEX);
  return match ? match[0] : null;
};

const findEmailFromHistory = (messages: ChatMessage[], provided?: string): string | null => {
  if (provided) {
    return provided;
  }
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const email = extractEmail(messages[index].content);
    if (email) {
      return email;
    }
  }
  return null;
};

const asOrderItems = (items: unknown): OrderItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.filter((item): item is OrderItem => {
    if (typeof item !== "object" || item === null) {
      return false;
    }
    const candidate = item as Record<string, unknown>;
    return typeof candidate.productId === "string" && typeof candidate.quantity === "number";
  });
};

const formatAccountOrders = (orders: Order[]): string => {
  if (orders.length === 0) {
    return "";
  }
  return orders
    .map((order) => {
      const itemSummary = asOrderItems(order.items)
        .map((item) => `${item.quantity}x ${item.name ?? item.productId}`)
        .join(", ");
      return `Order ${order.id} is ${order.status}, total ${order.total}${
        itemSummary ? `, items: ${itemSummary}` : ""
      }.`;
    })
    .join(" ");
};

const formatTestOrders = (orders: AiTestOrder[]): string => {
  return orders
    .map((order) => {
      const tracking = order.tracking_number ? `, tracking ${order.tracking_number}` : "";
      const delivery = order.expected_delivery ? `, expected ${order.expected_delivery}` : "";
      return `${order.order_id} is ${order.status}${tracking}${delivery}.`;
    })
    .join(" ");
};

const buildOrderContext = async (
  email: string | null,
  userId: string | null
): Promise<string> => {
  const sections: string[] = [];

  if (userId) {
    const accountOrders = await getOrdersByUserId(userId);
    if (accountOrders.length > 0) {
      sections.push(`User's Order Data: ${formatAccountOrders(accountOrders)}`);
    }
  }

  if (email) {
    const testOrders = await getTestOrdersByEmail(email);
    if (testOrders.length > 0) {
      sections.push(`User's Order Data: ${formatTestOrders(testOrders)}`);
    } else if (sections.length === 0) {
      sections.push("No orders found for this email.");
    }
  }

  return sections.join(" ");
};

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const body = chatSchema.parse(req.body);

  await saveChatMessage(body.sessionId, "user", body.message);

  const history = await getRecentChatMessages(body.sessionId, 10);
  const previousMessages = history.slice(0, -1);
  const email = findEmailFromHistory(history, body.email);
  const userId = req.user?.id ?? body.userId ?? null;
  const orderData = await buildOrderContext(email, userId);
  const reply = await generateChatReply(previousMessages, body.message, orderData);

  await saveChatMessage(body.sessionId, "assistant", reply);

  res.json({ success: true, reply });
});
