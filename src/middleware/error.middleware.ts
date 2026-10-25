import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";
import { env } from "../utils/env";

const exposeInternalErrors = env.nodeEnv !== "production" || env.debugErrors;

const clientMessage = (err: unknown, fallback = "Something went wrong"): string => {
  if (!exposeInternalErrors) {
    return fallback;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: exposeInternalErrors ? "Route not found" : "Something went wrong",
  });
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: exposeInternalErrors
        ? err.issues.map((issue) => issue.message).join("; ")
        : "Something went wrong",
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: clientMessage(err, "Something went wrong"),
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: clientMessage(err, "Something went wrong"),
  });
};
