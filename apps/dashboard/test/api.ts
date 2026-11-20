import type { ApiErrorBody, ErrorCode, ServerResource } from "@mini-cloud/shared";
import { HttpResponse } from "msw";
import { setupServer } from "msw/node";

/** Fake API for component tests (MSW). Tests add handlers with `api.use(...)`. */
export const api = setupServer();

let counter = 0;

/** A server as the API returns it; running with a URL unless told otherwise. */
export function aServer(overrides: Partial<ServerResource> = {}): ServerResource {
  counter += 1;
  const name = overrides.name ?? `web-${String(counter)}`;
  const now = new Date().toISOString();
  return {
    id: `0193a6f2-0000-7000-8000-${String(counter).padStart(12, "0")}`,
    type: "server",
    name,
    status: "running",
    spec: { image: "nginx", port: 80 },
    outputs: { url: `http://${name}.mc.localhost`, containerId: "c0ffee" },
    error: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function aPage(items: ServerResource[], nextCursor: string | null = null) {
  return HttpResponse.json({ items, nextCursor });
}

export function anError(status: number, code: ErrorCode, message: string, extra = {}) {
  const body: ApiErrorBody = { error: { code, message, requestId: "req-42", ...extra } };
  return HttpResponse.json(body, { status });
}
