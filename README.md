# keltafa-ai-backend

Express + TypeScript backend for a full-stack AI e-commerce platform. It exposes product, cart, and order APIs, Telegram JWT auth, and a Gemini-powered assistant that looks up live order data in Supabase.

## Stack

- Node.js, Express, TypeScript
- Supabase (PostgreSQL)
- Google Gemini (`gemini-1.5-flash` via `@google/generative-ai`)
- Zod validation
- JWT auth
- Helmet, CORS, and per-IP rate limiting on `/api/chat`

## Prerequisites

- Node.js 18+
- A Supabase project with the tables below already created
- A Google Gemini API key
- A Next.js frontend origin for CORS (local or deployed)

## Environment

Copy `.env.example` to `.env` and fill in the values:

```
PORT=5000
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GEMINI_API_KEY=
JWT_SECRET=
FRONTEND_URL=http://localhost:3000
```

Use the Supabase **service role** key only on this server. Never expose it to the frontend.

`JWT_SECRET` must be at least 16 characters.

## Expected Supabase tables

These tables are assumed to already exist:

- `users`: `id`, `telegram_id`, `first_name`, `role` (`customer` / `seller` / `admin`)
- `products`: `id`, `name`, `description`, `price`, `category`, `images` (`text[]`), `stock`, `seller_id`
- `orders`: `id`, `user_id`, `items` (`jsonb`), `total`, `status`, `address` (`jsonb`)
- `chat_messages`: `id`, `session_id`, `role` (`user` / `assistant`), `content`, `created_at`
- `ai_test_orders`: `order_id`, `customer_email`, `status`, `tracking_number`, `expected_delivery`

`orders.items` should look like:

```json
[{ "productId": "uuid", "name": "Shirt", "price": 29.99, "quantity": 1 }]
```

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

The API listens on `PORT` (default `5000`).

```bash
npm run build
npm start
```

`npm run build` compiles TypeScript into `dist/`. `npm start` runs `node dist/index.js` (Render/Railway).

## API

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | Deployment health check |
| `POST` | `/api/auth/telegram` | No | Login/register with Telegram id |
| `GET` | `/api/products` | No | List products (`category`, `search`, `minPrice`, `maxPrice`) |
| `GET` | `/api/products/:id` | No | Single product |
| `GET` | `/api/products/recommendations?userId=` | No | Category-based recommendations from past orders |
| `POST` | `/api/cart` | JWT | Add item `{ productId, quantity }` |
| `GET` | `/api/cart` | JWT | Current cart |
| `POST` | `/api/orders` | JWT | Checkout (`items` optional if cart is populated) |
| `GET` | `/api/orders` | JWT | Current user's order history |
| `POST` | `/api/chat` | Optional JWT | AI assistant |

Send protected requests with:

```
Authorization: Bearer <token>
```

### Telegram auth

`POST /api/auth/telegram`

```json
{ "telegram_id": "123456789", "first_name": "Amina" }
```

Creates the user if needed and returns `{ success: true, data: { token, user } }`.

### Checkout

`POST /api/orders`

```json
{
  "items": [{ "productId": "uuid", "quantity": 2 }],
  "address": {
    "street": "12 Market St",
    "city": "Nairobi",
    "postalCode": "00100",
    "country": "KE"
  }
}
```

If `items` is omitted, the server uses the authenticated user's cart, then clears it after a successful order.

Cart storage is in-memory (fine for a single instance). Use a database table if you run multiple instances.

### Chat

`POST /api/chat` is limited to **15 requests per minute per IP**.

```json
{ "sessionId": "browser-or-user-session", "message": "Where is my order?", "email": "guest@example.com" }
```

Flow:

1. Validate with Zod
2. Save the user message to `chat_messages`
3. Load the last 10 messages for that `sessionId`
4. If an email is in the body, current message, or earlier session messages, query `ai_test_orders`
5. If a JWT user (or `userId`) is present, also query `orders`
6. Inject a string such as `User's Order Data: ORD-1001 is Shipped, tracking 1Z999, expected Oct 28.`
7. Call Gemini with system prompt + history + order context
8. Save the assistant reply and return `{ success: true, reply }`

Guests can chat without a JWT if they provide an email. Logged-in users get account order context automatically.

## Deployment (Render / Railway)

1. Push this repo (`keltafa-ai-backend`) to GitHub.
2. Create a new web service from the repo.
3. Set the environment variables from `.env.example`.
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Health check path: `/api/health`
7. Set `FRONTEND_URL` to the deployed Next.js origin (no trailing slash unless that is the real origin).

The server trusts one proxy hop (`trust proxy`) so rate limiting works behind Render/Railway.

## Project structure

```
src/
  index.ts
  routes/
  controllers/
  services/
  middleware/
  utils/
  types/
```
