import {z} from "zod";
import { USER_EMAIL_MAX, USER_NAME_MAX, USER_PASSWORD_MAX, USER_PASSWORD_MIN } from "./limits";


export const registerSchema = z.object({
    email: z.email().trim().max(USER_EMAIL_MAX),
    password: z.string().min(USER_PASSWORD_MIN).refine(
        (value) => new TextEncoder().encode(value).length <= USER_PASSWORD_MAX,
        { message: "Password must be at most 72 bytes "},
    ),
    name: z.string().trim().min(1).max(USER_NAME_MAX).optional(),
});

export const loginSchema = z.object({
    email: z.email().trim().max(USER_EMAIL_MAX),
    password: z.string().min(USER_PASSWORD_MIN).refine(
        (value) => new TextEncoder().encode(value).length <= USER_PASSWORD_MAX,
        { message: "Password must be at most 72 bytes "},
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;