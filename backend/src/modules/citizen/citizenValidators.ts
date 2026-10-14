import { z } from "zod";

export const citizenIdParamSchema = z.object({
  id: z.string().min(1, "Citizen id is required"),
});
