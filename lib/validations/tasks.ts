import {z} from "zod";
import { DB_INT_MAX, TASK_DESCRIPTION_MAX, TASK_TITLE_MAX, TASK_TITLE_MIN } from "./limits";

// JV-1: day only as "YYYY-MM-DD" (rejects impossible days like 2026-02-30)
const daySchema = z.iso.date();
// null = no date
const dueDateSchema = daySchema.nullable();
const areaIdSchema = z.number().int().positive().max(DB_INT_MAX);

export const createTaskSchema = z.object({
    title: z.string().trim().min(TASK_TITLE_MIN).max(TASK_TITLE_MAX),
    description: z.string().max(TASK_DESCRIPTION_MAX).optional(),
    completed: z.boolean().optional(),
    // JV-1: every task belongs to an area the user picks
    areaId: areaIdSchema,
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

// JV-1: GET /api/tasks?weekStart=2026-10-26&today=2026-10-31 → that week's tasks + the ones without a date.
// "today" comes from the browser (the person's clock) and adds the overdue tasks of any week.
export const taskWeekQuerySchema = z.object({
    weekStart: daySchema,
    today: daySchema.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
