import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { apiResponse } from "../../common/utils/apiResponse.js";
import { BadRequestError } from "../../error/badRequestError.js";
import { build, getBuildings, BUILDING_COSTS } from "./buildingService.js";

export const buildBuilding = asyncHandler(async (req, res) => {
  const type = req.body?.type;
  if (!type || !(type in BUILDING_COSTS)) {
    throw new BadRequestError(
      `Invalid building type. Expected one of: ${Object.keys(BUILDING_COSTS).join(", ")}`,
    );
  }
  const result = await build(type as keyof typeof BUILDING_COSTS);
  apiResponse(res, 201, result);
});

export const listBuildings = asyncHandler(async (_req, res) => {
  apiResponse(res, 200, await getBuildings());
});
