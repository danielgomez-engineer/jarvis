import {z} from "zod";
import { USER_EMAIL_MAX, USER_NAME_MAX, USER_PASSWORD_MAX, USER_PASSWORD_MIN } from "./limits";


// JV-1: trim BEFORE checking the format (z.email().trim() checked first, so "a@b.com " failed)
const emailSchema = z.string().trim().pipe(z.email().max(USER_EMAIL_MAX));

export const registerSchema = z.object({
    // JV-1: saved in lowercase, so "Ana@x.com" and "ana@x.com" are the same account
    email: emailSchema.transform((email) => email.toLowerCase()),
    password: z.string().min(USER_PASSWORD_MIN).refine(
        (value) => new TextEncoder().encode(value).length <= USER_PASSWORD_MAX,
        { message: "Password must be at most 72 bytes "},
    ),
    name: z.string().trim().min(1).max(USER_NAME_MAX).optional(),
});

// Login only checks that the password is present (min 1), never the register rules:
// a short wrong password must answer "invalid credentials", not "minimum 8".
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).refine(
        (value) => new TextEncoder().encode(value).length <= USER_PASSWORD_MAX,
        { message: "Password must be at most 72 bytes "},
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;