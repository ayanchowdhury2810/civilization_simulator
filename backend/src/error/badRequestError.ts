import { BaseAppError } from "./baseAppError.js";

export class BadRequestError extends BaseAppError {
  readonly statusCode = 400;
  readonly code = "BAD_REQUEST";
}
