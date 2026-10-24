import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../utils/env";
import { AppError } from "../utils/app-error";
import type {
  AiTestOrder,
  ChatMessage,
  ChatRole,
  Order,
  OrderItem,
  Product,
  User,
} from "../types";

export const supabase: SupabaseClient = createClient(
  env.supabaseUrl,
  env.supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const throwIfError = (error: { message: string } | null, fallback: string): void => {
  if (error) {
    console.error(error.message);
    throw new AppError(fallback, 500);
  }
};

const mapUser = (row: User): User => ({
  ...row,
  telegram_id: String(row.telegram_id),
});

export const findUserByTelegramId = async (telegramId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("id, telegram_id, first_name, role")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  throwIfError(error, "Failed to look up user");
  return data ? mapUser(data as User) : null;
};

export const createUser = async (telegramId: string, firstName: string): Promise<User> => {
  const { data, error } = await supabase
    .from("users")
    .insert({
      telegram_id: telegramId,
      first_name: firstName,
      role: "customer",
    })
    .select("id, telegram_id, first_name, role")
    .single();

  throwIfError(error, "Failed to create user");
  if (!data) {
    throw new AppError("Failed to create user", 500);
  }
  return mapUser(data as User);
};

export const listProducts = async (filters: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<Product[]> => {
  let query = supabase.from("products").select(
    "id, name, description, price, category, images, stock, seller_id"
  );

  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.search) {
    const search = filters.search.replace(/[%_,.()]/g, " ").trim();
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
  }
  if (typeof filters.minPrice === "number") {
    query = query.gte("price", filters.minPrice);
  }
  if (typeof filters.maxPrice === "number") {
    query = query.lte("price", filters.maxPrice);
  }

  const { data, error } = await query.order("name", { ascending: true });
  throwIfError(error, "Failed to fetch products");
  return (data ?? []) as Product[];
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, category, images, stock, seller_id")
    .eq("id", id)
    .maybeSingle();

  throwIfError(error, "Failed to fetch product");
  return data as Product | null;
};

export const getProductsByIds = async (ids: string[]): Promise<Product[]> => {
  if (ids.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, category, images, stock, seller_id")
    .in("id", ids);

  throwIfError(error, "Failed to fetch products");
  return (data ?? []) as Product[];
};

export const getProductsByCategories = async (
  categories: string[],
  excludeIds: string[],
  limit = 8
): Promise<Product[]> => {
  if (categories.length === 0) {
    return [];
  }

  let query = supabase
    .from("products")
    .select("id, name, description, price, category, images, stock, seller_id")
    .in("category", categories)
    .gt("stock", 0)
    .order("name", { ascending: true })
    .limit(limit);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data, error } = await query;
  throwIfError(error, "Failed to fetch recommended products");
  return (data ?? []) as Product[];
};

export const getFeaturedProducts = async (limit = 8): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, category, images, stock, seller_id")
    .gt("stock", 0)
    .order("name", { ascending: true })
    .limit(limit);

  throwIfError(error, "Failed to fetch products");
  return (data ?? []) as Product[];
};

export const createOrder = async (order: {
  user_id: string;
  items: OrderItem[];
  total: number;
  address: Order["address"];
}): Promise<Order> => {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: order.user_id,
      items: order.items,
      total: order.total,
      status: "pending",
      address: order.address,
    })
    .select("id, user_id, items, total, status, address")
    .single();

  throwIfError(error, "Failed to create order");
  if (!data) {
    throw new AppError("Failed to create order", 500);
  }
  return data as Order;
};

export const decrementStock = async (productId: string, quantity: number): Promise<void> => {
  const product = await getProductById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  if (product.stock < quantity) {
    throw new AppError(`Insufficient stock for ${product.name}`, 400);
  }

  const { error } = await supabase
    .from("products")
    .update({ stock: product.stock - quantity })
    .eq("id", productId);

  throwIfError(error, "Failed to update stock");
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("id, user_id, items, total, status, address")
    .eq("user_id", userId)
    .order("id", { ascending: false });

  throwIfError(error, "Failed to fetch orders");
  return (data ?? []) as Order[];
};

export const saveChatMessage = async (
  sessionId: string,
  role: ChatRole,
  content: string
): Promise<void> => {
  const { error } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role,
    content,
  });
  throwIfError(error, "Failed to save chat message");
};

export const getRecentChatMessages = async (
  sessionId: string,
  limit = 10
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, session_id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  throwIfError(error, "Failed to fetch chat history");
  return ((data ?? []) as ChatMessage[]).reverse();
};

export const getTestOrdersByEmail = async (email: string): Promise<AiTestOrder[]> => {
  const { data, error } = await supabase
    .from("ai_test_orders")
    .select("order_id, customer_email, status, tracking_number, expected_delivery")
    .ilike("customer_email", email);

  throwIfError(error, "Failed to look up test orders");
  return (data ?? []) as AiTestOrder[];
};
