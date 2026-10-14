import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { BaseAppError } from "../error/baseAppError.js";
import type { ApiFailure } from "../common/utils/apiResponse.js";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof BaseAppError) {
    const body: ApiFailure = {
      success: false,
      error: { message: err.message, code: err.code },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (env.NODE_ENV !== "test") {
    console.error("[unhandled error]", err);
  }

  const message =
    err instanceof Error ? err.message : "Internal server error";
  const body: ApiFailure = {
    success: false,
    error: { message, code: "INTERNAL_ERROR" },
  };
  res.status(500).json(body);
}
