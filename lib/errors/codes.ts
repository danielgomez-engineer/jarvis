// API/ERROR CODES
export const API_ERROR_CODES = {
  INVALID_JSON: "INVALID_JSON",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_TASK_ID: "INVALID_TASK_ID",
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  // JV-1: areas
  AREA_ALREADY_EXISTS: "AREA_ALREADY_EXISTS",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
//===========================================================================================================================

// FIELD/ERRORS
export const FIELD_ERROR_CODES = {
  TOO_SHORT: "TOO_SHORT",
  TOO_LONG: "TOO_LONG",
  INVALID_FORMAT: "INVALID_FORMAT",
  REQUIRED: "REQUIRED",
} as const;

export type FieldErrorCode = (typeof FIELD_ERROR_CODES) [keyof typeof FIELD_ERROR_CODES];

//===========================================================================================================================

// UI/ ERROR CODES
export const UI_ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  UNEXPECTED_RESPONSE: "UNEXPECTED_RESPONSE",
} as const;

export type UiErrorCode = (typeof UI_ERROR_CODES)[keyof typeof UI_ERROR_CODES];

//===========================================================================================================================
// every code the UI can translate: the ones the API sends + the ones UI creates itself
export type ErrorCode = ApiErrorCode | UiErrorCode;
