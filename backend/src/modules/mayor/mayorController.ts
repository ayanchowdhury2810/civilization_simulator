import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { apiResponse } from "../../common/utils/apiResponse.js";
import { approvePolicy, getMayorView } from "./mayorService.js";

export const getMayor = asyncHandler(async (_req, res) => {
  apiResponse(res, 200, getMayorView());
});

export const approveMayorSuggestion = asyncHandler(async (req, res) => {
  const policyId =
    typeof req.body?.policyId === "string" ? req.body.policyId : undefined;
  const result = await approvePolicy(policyId);
  apiResponse(res, 200, result);
});
