import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { buildBuildingSchema } from "./buildingValidators.js";
import { buildBuilding, listBuildings } from "./buildingController.js";

export const buildingRouter = Router();

buildingRouter.get("/", listBuildings);
buildingRouter.post("/", validateRequest(buildBuildingSchema), buildBuilding);
