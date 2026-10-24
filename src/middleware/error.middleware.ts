import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";
import { env } from "../utils/env";

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: "Something went wrong" });
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);

  if (err instanceof ZodError) {
    res.status(400).json({ success: false, message: "Something went wrong" });
    return;
  }

  if (err instanceof AppError) {
    const message = env.nodeEnv === "production" && err.statusCode >= 500
      ? "Something went wrong"
      : err.message;
    res.status(err.statusCode).json({ success: false, message });
    return;
  }

  res.status(500).json({ success: false, message: "Something went wrong" });
};
