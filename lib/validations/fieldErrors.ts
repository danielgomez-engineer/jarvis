import { z } from "zod";
import { FIELD_ERROR_CODES, FieldErrorCode } from "../errors/codes";

// Translation table: zod issue code → our field code.
// zod's "custom" only comes from the password bytes refine, so it means "too long".
const ZOD_TO_FIELD_CODE: Record<string, FieldErrorCode> = {
  too_small: FIELD_ERROR_CODES.TOO_SHORT,
  too_big: FIELD_ERROR_CODES.TOO_LONG,
  invalid_format: FIELD_ERROR_CODES.INVALID_FORMAT,
  invalid_type: FIELD_ERROR_CODES.REQUIRED,
  custom: FIELD_ERROR_CODES.TOO_LONG,
};

// Turns zod issues into { field: code }, e.g. { password: "TOO_SHORT" }.
// Zod messages are never sent: they are in English and the UI translates our codes.
export function getFieldErrors(error: z.ZodError): Record<string, FieldErrorCode> {
  const fields: Record<string, FieldErrorCode> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    // Skip issues that are not tied to a field, and keep only the first issue per field
    if (field === undefined || fields[String(field)]) {
      continue;
    }

    // A minimum of 1 means "empty", so "Completa este campo" reads better than "Mínimo 1 caracteres"
    if (issue.code === "too_small" && issue.minimum === 1) {
      fields[String(field)] = FIELD_ERROR_CODES.REQUIRED;
      continue;
    }

    fields[String(field)] = ZOD_TO_FIELD_CODE[issue.code] || FIELD_ERROR_CODES.INVALID_FORMAT;
  }

  return fields;
}
