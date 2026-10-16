import {z} from "zod";
import { TASK_DESCRIPTION_MAX, TASK_TITLE_MAX, TASK_TITLE_MIN } from "./limits";

export const createTaskSchema = z.object({
    title: z.string().trim().min(TASK_TITLE_MIN).max(TASK_TITLE_MAX),
    description: z.string().max(TASK_DESCRIPTION_MAX).optional(),
    completed: z.boolean().optional(),
});

export const updatedCompletedTaskSchema = z.object({
    completed: z.boolean(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export type  UpdatedCompletedTaskInput = z.infer<typeof updatedCompletedTaskSchema>;