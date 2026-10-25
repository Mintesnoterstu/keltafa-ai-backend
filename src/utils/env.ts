import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  FRONTEND_URL: z.string().url(),
  NODE_ENV: z.string().optional(),
  DEBUG_ERRORS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Missing or invalid environment variables. Check .env against .env.example.");
}

export const env = {
  port: Number(parsed.data.PORT),
  supabaseUrl: parsed.data.SUPABASE_URL,
  supabaseServiceKey: parsed.data.SUPABASE_SERVICE_KEY,
  geminiApiKey: parsed.data.GEMINI_API_KEY,
  jwtSecret: parsed.data.JWT_SECRET,
  frontendUrl: parsed.data.FRONTEND_URL,
  nodeEnv: parsed.data.NODE_ENV ?? "development",
  debugErrors: parsed.data.DEBUG_ERRORS === "true",
};
