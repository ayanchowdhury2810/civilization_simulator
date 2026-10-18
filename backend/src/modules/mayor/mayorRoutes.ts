import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { approvePolicySchema } from "./mayorValidators.js";
import { approveMayorSuggestion, getMayor, getMayorInvestigation } from "./mayorController.js";

export const mayorRouter = Router();

mayorRouter.get("/", getMayor);
mayorRouter.get("/investigation", getMayorInvestigation);
mayorRouter.post(
  "/approve",
  validateRequest(approvePolicySchema),
  approveMayorSuggestion,
);
