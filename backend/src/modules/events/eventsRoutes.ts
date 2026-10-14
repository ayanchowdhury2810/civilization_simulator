import { Router } from "express";
import { listEvents } from "./eventsController.js";

export const eventsRouter = Router();

eventsRouter.get("/", listEvents);
