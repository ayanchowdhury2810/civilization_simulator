import { BaseAppError } from "./baseAppError.js";

export class ForbiddenError extends BaseAppError {
  readonly statusCode = 403;
  readonly code = "FORBIDDEN";
}
