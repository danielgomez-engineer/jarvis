import { z } from "zod";
import { AREA_COLOR_COUNT, AREA_NAME_MAX, AREA_NAME_MIN, DB_INT_MAX } from "./limits";

// JV-1: create area. Color is optional: the API picks one when it's missing.
export const createAreaSchema = z.object({
  name: z.string().trim().min(AREA_NAME_MIN).max(AREA_NAME_MAX),
  color: z.number().int().min(1).max(AREA_COLOR_COUNT).optional(),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;

// JV-1: reorder areas. "ids" is the user's full list of area ids in the new order.
// Ownership, duplicates and completeness are checked in the route (they need the DB).
export const reorderAreasSchema = z.object({
  ids: z.array(z.number().int().positive().max(DB_INT_MAX)).min(1),
});

export type ReorderAreasInput = z.infer<typeof reorderAreasSchema>;
