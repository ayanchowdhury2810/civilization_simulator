import { Router } from "express";
import { getWorld } from "./worldController.js";

export const worldRouter = Router();

worldRouter.get("/", getWorld);
