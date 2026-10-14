import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { apiResponse } from "../../common/utils/apiResponse.js";
import { BadRequestError } from "../../error/badRequestError.js";
import { getCitizenById } from "./citizenService.js";

export const getCitizen = asyncHandler(async (req, res) => {
  const rawId = req.params.id;
  if (!rawId || Array.isArray(rawId)) {
    throw new BadRequestError("Citizen id is required");
  }
  const citizen = await getCitizenById(rawId);
  apiResponse(res, 200, citizen);
});
