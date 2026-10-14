import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { apiResponse } from "../../common/utils/apiResponse.js";
import { runSingleTick } from "./tickService.js";

export const runTickManually = asyncHandler(async (_req, res) => {
  const result = await runSingleTick();
  apiResponse(res, 200, result);
});
