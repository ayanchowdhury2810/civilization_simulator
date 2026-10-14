import type { Response } from "express";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

export function apiResponse<T>(
  res: Response,
  statusCode: number,
  data: T,
): void {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(statusCode).json(body);
}
