import { Router } from "express";
import { getCitizen } from "./citizenController.js";

export const citizenRouter = Router();

citizenRouter.get("/:id", getCitizen);
