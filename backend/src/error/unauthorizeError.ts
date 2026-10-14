import { BaseAppError } from "./baseAppError.js";

export class UnauthorizedError extends BaseAppError {
  readonly statusCode = 401;
  readonly code = "UNAUTHORIZED";
}
