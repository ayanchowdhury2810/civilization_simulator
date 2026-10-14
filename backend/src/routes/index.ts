import { Router } from "express";
import { worldRouter } from "../modules/world/worldRoutes.js";
import { tickRouter } from "../modules/tick/tickRoutes.js";
import { citizenRouter } from "../modules/citizen/citizenRoutes.js";
import { buildingRouter } from "../modules/building/buildingRoutes.js";
import { eventsRouter } from "../modules/events/eventsRoutes.js";
import { chatRouter } from "../modules/chat/chatRoutes.js";
import { mayorRouter } from "../modules/mayor/mayorRoutes.js";

export const router = Router();

router.use("/world", worldRouter);
router.use("/tick", tickRouter);
router.use("/citizen", citizenRouter);
router.use("/building", buildingRouter);
router.use("/build", buildingRouter);
router.use("/events", eventsRouter);
router.use("/chat", chatRouter);
router.use("/mayor", mayorRouter);
