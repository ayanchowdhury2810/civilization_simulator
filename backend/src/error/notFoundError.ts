import { BaseAppError } from "./baseAppError.js";

export class NotFoundError extends BaseAppError {
  readonly statusCode = 404;
  readonly code = "NOT_FOUND";
}
