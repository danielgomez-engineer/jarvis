// Single source of truth for text limits (spec section 6).
// Shared by the zod schemas (server) and the inputs (client).
//**Limit users */
export const USER_EMAIL_MAX = 254
export const USER_NAME_MAX = 60;
export const USER_PASSWORD_MAX = 72;
export const USER_PASSWORD_MIN = 8;

//limit task
export const TASK_TITLE_MAX = 120;
export const TASK_TITLE_MIN = 1;
export const TASK_DESCRIPTION_MAX = 1000;

// JV-1: area limits
export const AREA_NAME_MAX = 40;
export const AREA_NAME_MIN = 1;
// Number of area identity colors (tokens area-1…area-6 in globals.css)
export const AREA_COLOR_COUNT = 6;
