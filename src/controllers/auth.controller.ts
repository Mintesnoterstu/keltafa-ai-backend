import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { telegramAuthSchema } from "../utils/validators";
import { createUser, findUserByTelegramId } from "../services/supabase.service";
import { env } from "../utils/env";
import { asyncHandler } from "../utils/async-handler";
import type { AuthUser } from "../types";

const signToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      telegram_id: user.telegram_id,
      first_name: user.first_name,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
};

export const telegramAuth = asyncHandler(async (req: Request, res: Response) => {
  const body = telegramAuthSchema.parse(req.body);
  const existing = await findUserByTelegramId(body.telegram_id);
  const user = existing ?? (await createUser(body.telegram_id, body.first_name));

  const token = signToken(user);

  res.status(existing ? 200 : 201).json({
    success: true,
    data: {
      token,
      user,
    },
  });
});
