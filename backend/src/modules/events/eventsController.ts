import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { apiResponse } from "../../common/utils/apiResponse.js";
import { getRecentEvents } from "./eventsService.js";

export const listEvents = asyncHandler(async (req, res) => {
  const rawLimit = req.query.limit;
  const parsed = Number(rawLimit ?? 50);
  const limit =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : 50;
  apiResponse(res, 200, await getRecentEvents(limit));
});
