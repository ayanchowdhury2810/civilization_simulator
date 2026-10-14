import { BaseAppError } from "./baseAppError.js";

export class ConflictError extends BaseAppError {
  readonly statusCode = 409;
  readonly code = "CONFLICT";
}
