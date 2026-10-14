import { z } from "zod";

export const chatRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "question is required")
    .max(500, "question must be 500 characters or fewer"),
});
