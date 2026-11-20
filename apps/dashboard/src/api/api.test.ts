import { serverResource } from "@mini-cloud/shared";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { aServer, anError, api } from "../../test/api.ts";
import { shouldRetry } from "../app/query-client.ts";
import { apiFetch } from "./client.ts";
import { ApiError, NO_RESPONSE } from "./errors.ts";

const PATH = "/v1/servers/x";

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("expected an ApiError");
}

describe("apiFetch", () => {
  it("returns the response checked by the schema", async () => {
    const server = aServer({ name: "web-1" });
    api.use(http.get(PATH, () => HttpResponse.json(server)));
    await expect(apiFetch(PATH, serverResource)).resolves.toEqual(server);
  });

  it("sends a JSON body", async () => {
    let received: unknown;
    let contentType: string | null = null;
    api.use(
      http.post("/v1/servers", async ({ request }) => {
        received = await request.json();
        contentType = request.headers.get("content-type");
        return HttpResponse.json(aServer(), { status: 202 });
      }),
    );
    await apiFetch("/v1/servers", serverResource, { method: "POST", body: { name: "web-1" } });
    expect(received).toEqual({ name: "web-1" });
    expect(contentType).toBe("application/json");
  });

  it("turns the standard error body into an ApiError", async () => {
    api.use(http.get(PATH, () => anError(409, "name_taken", "A server named web-1 exists")));
    const error = await failure(apiFetch(PATH, serverResource));
    expect(error).toMatchObject({
      status: 409,
      code: "name_taken",
      message: "A server named web-1 exists",
      requestId: "req-42",
      details: [],
    });
  });

  it("explains a server error without a body", async () => {
    api.use(http.get(PATH, () => new HttpResponse("Bad Gateway", { status: 502 })));
    const error = await failure(apiFetch(PATH, serverResource));
    expect(error).toMatchObject({ status: 502, code: "unavailable" });
    expect(error.message).toContain("502");
  });

  it("explains a client error without a body", async () => {
    api.use(http.get(PATH, () => new HttpResponse(null, { status: 418 })));
    expect(await failure(apiFetch(PATH, serverResource))).toMatchObject({ code: "internal" });
  });

  it("says when the API can't be reached", async () => {
    api.use(http.get(PATH, () => HttpResponse.error()));
    const error = await failure(apiFetch(PATH, serverResource));
    expect(error.status).toBe(NO_RESPONSE);
    expect(error.message).toBe("Can't reach the API. Check that it is running.");
  });

  it("rejects a response that does not match the shared schema", async () => {
    api.use(http.get(PATH, () => HttpResponse.json({ id: "nope" })));
    const error = await failure(apiFetch(PATH, serverResource));
    expect(error.message).toContain("Unexpected response from /v1/servers/x");
  });
});

describe("shouldRetry", () => {
  const clientError = new ApiError({ status: 404, code: "not_found", message: "gone" });
  const serverError = new ApiError({ status: 503, code: "unavailable", message: "down" });

  it("retries network and server errors twice, never a 4xx", () => {
    expect(shouldRetry(0, clientError)).toBe(false);
    expect(shouldRetry(0, serverError)).toBe(true);
    expect(shouldRetry(0, ApiError.noResponse())).toBe(true);
    expect(shouldRetry(2, serverError)).toBe(false);
  });
});
