import { z } from "zod";

export const approvePolicySchema = z
  .object({
    policyId: z.string().trim().min(1).optional(),
  })
  .default({});
