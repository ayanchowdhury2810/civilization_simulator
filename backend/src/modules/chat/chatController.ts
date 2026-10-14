import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { apiResponse } from "../../common/utils/apiResponse.js";
import { answerQuestion } from "./chatService.js";

export const chat = asyncHandler(async (req, res) => {
  const { question } = req.body as { question: string };
  const result = await answerQuestion(question);
  apiResponse(res, 200, result);
});
