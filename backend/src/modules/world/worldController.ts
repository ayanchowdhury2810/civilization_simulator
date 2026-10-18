import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { apiResponse } from "../../common/utils/apiResponse.js";
import { getWorldSnapshot } from "./worldService.js";

export const getWorld = asyncHandler(async (_req, res) => {
  apiResponse(res, 200, await getWorldSnapshot());
});
