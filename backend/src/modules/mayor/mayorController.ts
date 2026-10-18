import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { apiResponse } from "../../common/utils/apiResponse.js";
import { approvePolicy, ensureCurrentPolicy, getMayorView } from "./mayorService.js";
import { investigateMayorPolicy } from "./mayorInvestigationService.js";

export const getMayor = asyncHandler(async (_req, res) => {
  apiResponse(res, 200, await getMayorView());
});

export const getMayorInvestigation = asyncHandler(async (_req, res) => {
  const policy = await ensureCurrentPolicy();
  if (!policy) {
    res.status(503).json({
      success: false,
      error: { message: "An unexpected error occurred. Please try again.", code: "INVESTIGATION_UNAVAILABLE" },
    });
    return;
  }
  apiResponse(res, 200, await investigateMayorPolicy(policy));
});

export const approveMayorSuggestion = asyncHandler(async (req, res) => {
  const policyId =
    typeof req.body?.policyId === "string" ? req.body.policyId : undefined;
  const result = await approvePolicy(policyId);
  apiResponse(res, 200, result);
});
