export type UserRole = "customer" | "seller" | "admin";
export type ChatRole = "user" | "assistant";
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface User {
  id: string;
  telegram_id: string;
  first_name: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  telegram_id: string;
  first_name: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  seller_id: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  address: Address;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface AiTestOrder {
  order_id: string;
  customer_email: string;
  status: string;
  tracking_number: string | null;
  expected_delivery: string | null;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export interface ChatSuccessResponse {
  success: true;
  reply: string;
}
