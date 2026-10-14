import { z } from "zod";
import { BUILDING_TYPES } from "../../common/constants/index.js";

export const buildBuildingSchema = z.object({
  type: z.enum(BUILDING_TYPES),
});
