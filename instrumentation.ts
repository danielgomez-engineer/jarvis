import { getJwtSecret } from "./lib/auth/token";

export function register() {
    getJwtSecret();
}