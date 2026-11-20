import type { z } from "zod";
import { ApiError } from "./errors.ts";

/**
 * Calls the API on the same origin (ADR-0011) and checks the answer with the shared schema,
 * so a change in the API's response shows up as a clear error instead of a broken screen.
 */
export async function apiFetch<S extends z.ZodType>(
  path: string,
  schema: S,
  init: { method?: string; body?: unknown } = {},
): Promise<z.output<S>> {
  const url = new URL(path, window.location.origin);
  const hasBody = init.body !== undefined;
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: init.method ?? "GET",
      credentials: "same-origin",
      headers: hasBody ? { "Content-Type": "application/json" } : {},
      body: hasBody ? JSON.stringify(init.body) : null,
    });
  } catch {
    throw ApiError.noResponse();
  }
  if (!response.ok) throw await ApiError.fromResponse(response);

  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new ApiError({
      status: response.status,
      code: "internal",
      message: `Unexpected response from ${url.pathname}: ${parsed.error.issues[0]?.message ?? "invalid"}`,
    });
  }
  return parsed.data;
}
