import {z} from "zod";
import { DB_INT_MAX, TASK_DESCRIPTION_MAX, TASK_TITLE_MAX, TASK_TITLE_MIN } from "./limits";

// JV-1: day only as "YYYY-MM-DD" (rejects impossible days like 2026-02-30); null = no date
const dueDateSchema = z.iso.date().nullable();
const areaIdSchema = z.number().int().positive().max(DB_INT_MAX);

export const createTaskSchema = z.object({
    title: z.string().trim().min(TASK_TITLE_MIN).max(TASK_TITLE_MAX),
    description: z.string().max(TASK_DESCRIPTION_MAX).optional(),
    completed: z.boolean().optional(),
    // JV-1: optional only while the old dashboard doesn't send it (removed in U2.4.1)
    areaId: areaIdSchema.optional(),
    dueDate: dueDateSchema.optional(),
    urgent: z.boolean().optional(),
});

// JV-1: PATCH sends only the fields that change, but at least one
export const updateTaskSchema = z.object({
    completed: z.boolean(),
    dueDate: dueDateSchema,
    urgent: z.boolean(),
    areaId: areaIdSchema,
    position: z.number().int().min(0).max(DB_INT_MAX),
}).partial().refine((data) => Object.keys(data).length > 0);

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
