import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../utils/env";
import { AppError } from "../utils/app-error";
import type { AuthUser } from "../types";

const isAuthUser = (value: unknown): value is AuthUser => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.telegram_id === "string" &&
    typeof candidate.first_name === "string" &&
    (candidate.role === "customer" ||
      candidate.role === "seller" ||
      candidate.role === "admin")
  );
};

const readBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7).trim() || null;
};

const decodeUser = (token: string): AuthUser => {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (!isAuthUser(decoded)) {
    throw new AppError("Invalid token payload", 401);
  }
  return decoded;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = readBearerToken(req);
    if (!token) {
      throw new AppError("Authentication required", 401);
    }
    req.user = decodeUser(token);
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Invalid or expired token", 401));
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = readBearerToken(req);
    if (token) {
      req.user = decodeUser(token);
    }
    next();
  } catch {
    next();
  }
};
