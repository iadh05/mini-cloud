import { createDb, createTestDatabase, type TestDatabase } from "@mini-cloud/db";
import { apiErrorBody } from "@mini-cloud/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type App, buildApp } from "./app.ts";

const adminUrl = process.env.DATABASE_URL;

describe.skipIf(!adminUrl)("app", () => {
  let testDb: TestDatabase;
  let conn: ReturnType<typeof createDb>;
  let app: App;

  beforeAll(async () => {
    testDb = await createTestDatabase(adminUrl ?? "");
    conn = createDb({ url: testDb.url, max: 2 });
    app = buildApp({ db: conn.db });
    // A route that fails unexpectedly, to test the 500 path.
    app.get("/test/boom", () => {
      throw new Error("secret detail");
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await conn.close();
    await testDb.drop();
  });

  it("answers /healthz and /readyz", async () => {
    expect((await app.inject({ url: "/healthz" })).json()).toEqual({ status: "ok" });
    const ready = await app.inject({ url: "/readyz" });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toEqual({ status: "ready" });
  });

  it("creates an X-Request-Id on every response", async () => {
    const res = await app.inject({ url: "/healthz" });
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("keeps the caller's X-Request-Id when it is safe", async () => {
    const res = await app.inject({ url: "/healthz", headers: { "x-request-id": "trace-123" } });
    expect(res.headers["x-request-id"]).toBe("trace-123");
  });

  it("replaces an unsafe X-Request-Id", async () => {
    const res = await app.inject({
      url: "/healthz",
      headers: { "x-request-id": "bad id\twith spaces" },
    });
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("hides unexpected errors behind 500 internal", async () => {
    const res = await app.inject({ url: "/test/boom" });
    expect(res.statusCode).toBe(500);
    const body = apiErrorBody.parse(res.json());
    expect(body.error.code).toBe("internal");
    expect(JSON.stringify(body)).not.toContain("secret detail");
  });

  it("answers unknown routes with 404 not_found", async () => {
    const res = await app.inject({ url: "/v1/nope" });
    expect(res.statusCode).toBe(404);
    expect(apiErrorBody.parse(res.json()).error.code).toBe("not_found");
  });

  it("reports 503 on /readyz when the database is down", async () => {
    const down = createDb({ url: "postgres://nobody:x@127.0.0.1:1/none", max: 1 });
    const broken = buildApp({ db: down.db });
    const res = await broken.inject({ url: "/readyz" });
    expect(res.statusCode).toBe(503);
    expect(apiErrorBody.parse(res.json()).error.code).toBe("unavailable");
    await broken.close();
    await down.close();
  });
});
