import { ApiErrorCode, ErrorCode, UI_ERROR_CODES } from "@/lib/errors/codes";

//=====JV-1: ONE PLACE TO CALL THE API FROM THE UI=====
// Replaces the "fetch → read JSON → turn the error into a code" block that the old
// dashboard repeated in every action. The caller only decides what to show.

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: ErrorCode | undefined };

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
};

export async function apiRequest<T>(url: string, { method = "GET", body }: RequestOptions = {}): Promise<ApiResult<T>> {
  let res: Response;

  try {
    // No auth header: the httpOnly "token" cookie travels on its own
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // status 0 = the request never reached the server
    return { ok: false, status: 0, code: UI_ERROR_CODES.NETWORK_ERROR };
  }

  let data: unknown;

  try {
    data = await res.json();
  } catch {
    return { ok: false, status: res.status, code: UI_ERROR_CODES.UNEXPECTED_RESPONSE };
  }

  if (!res.ok) {
    return { ok: false, status: res.status, code: (data as { code?: ApiErrorCode }).code };
  }

  return { ok: true, data: data as T };
}
