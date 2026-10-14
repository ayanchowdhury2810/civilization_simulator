import { Router } from "express";
import { runTickManually } from "./tickController.js";

export const tickRouter = Router();

tickRouter.post("/", runTickManually);
