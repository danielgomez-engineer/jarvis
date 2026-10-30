import { z } from "zod";
import { AREA_COLOR_COUNT, AREA_NAME_MAX, AREA_NAME_MIN } from "./limits";

// JV-1: create area. Color is optional: the API picks one when it's missing.
export const createAreaSchema = z.object({
  name: z.string().trim().min(AREA_NAME_MIN).max(AREA_NAME_MAX),
  color: z.number().int().min(1).max(AREA_COLOR_COUNT).optional(),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
