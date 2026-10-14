import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { chatRequestSchema } from "./chatValidators.js";
import { chat } from "./chatController.js";

export const chatRouter = Router();

chatRouter.post("/", validateRequest(chatRequestSchema), chat);
