import { ErrorCode, FieldErrorCode } from "../errors/codes";
import { es } from "./es";

export const translateError = (error: ErrorCode | undefined): string => {
  if(!error) {
    return es.errors.ERROR_UNEXPECTED;
  }
  if (Object.hasOwn(es.errors, error)) {
    return es.errors[error];
  }

  return es.errors.ERROR_UNEXPECTED;
};

type TranslationParams = Record<string, string | number>;

export const translateText = (
  template: string,
  params: TranslationParams = {},
): string => {
  let text = template;

  for (const [key, value] of Object.entries(params)) {
    text = text.split(`{${key}}`).join(String(value));
  }

  return text;
};

// Field codes are translated with the field's limits,
// e.g. TOO_SHORT + { min: 8 } → "Mínimo 8 caracteres". No code → no message.
export const translateFieldError = (
  code: FieldErrorCode | undefined,
  limits: TranslationParams = {},
): string | undefined => {
  if (!code) {
    return undefined;
  }

  return translateText(es.fieldErrors[code], limits);
};
