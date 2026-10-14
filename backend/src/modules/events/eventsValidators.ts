import { z } from "zod";

export const eventsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
});
