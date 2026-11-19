import { createDb, createTestDatabase, jobs, type TestDatabase } from "@mini-cloud/db";
import { apiErrorBody, page, serverResource } from "@mini-cloud/shared";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type App, buildApp } from "../../app.ts";

const adminUrl = process.env.DATABASE_URL;

describe.skipIf(!adminUrl)("servers API", () => {
  let testDb: TestDatabase;
  let conn: ReturnType<typeof createDb>;
  let app: App;

  beforeAll(async () => {
    testDb = await createTestDatabase(adminUrl ?? "");
    conn = createDb({ url: testDb.url, max: 2 });
    app = buildApp({ db: conn.db });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await conn.close();
    await testDb.drop();
  });

  const create = (body: Record<string, unknown>) =>
    app.inject({ method: "POST", url: "/v1/servers", payload: body });

  describe("POST /v1/servers", () => {
    it("accepts a server: 202, pending, and a create job in the queue", async () => {
      const res = await create({ name: "web-1", image: "nginx", port: 80 });

      expect(res.statusCode).toBe(202);
      const server = serverResource.parse(res.json());
      expect(server).toMatchObject({
        type: "server",
        name: "web-1",
        status: "pending",
        spec: { image: "nginx", port: 80 },
        outputs: {},
        error: null,
      });

      const queued = await conn.db.select().from(jobs).where(eq(jobs.resourceId, server.id));
      expect(queued).toEqual([
        expect.objectContaining({ action: "create", state: "queued", generation: 1 }),
      ]);
    });

    it("returns 409 name_taken for a duplicate name", async () => {
      const res = await create({ name: "web-1", image: "httpd", port: 8080 });

      expect(res.statusCode).toBe(409);
      const body = apiErrorBody.parse(res.json());
      expect(body.error.code).toBe("name_taken");
      expect(body.error.message).toBe('A server named "web-1" already exists');
      expect(body.error.requestId).toBe(res.headers["x-request-id"]);
    });

    it("returns 400 validation_failed with the field that is wrong", async () => {
      const res = await create({ name: "Web", image: "ubuntu", port: 0 });

      expect(res.statusCode).toBe(400);
      const body = apiErrorBody.parse(res.json());
      expect(body.error.code).toBe("validation_failed");
      expect(body.error.details?.map((d) => d.field)).toEqual(
        expect.arrayContaining(["name", "image", "port"]),
      );
    });

    it("rejects unknown fields", async () => {
      const res = await create({ name: "web-2", image: "nginx", port: 80, privileged: true });
      expect(res.statusCode).toBe(400);
    });

    it("writes nothing when the request is invalid", async () => {
      const all = await conn.db.select().from(jobs);
      expect(all).toHaveLength(1);
    });
  });

  describe("GET /v1/servers", () => {
    it("lists servers newest first and pages with a cursor", async () => {
      await create({ name: "web-2", image: "caddy", port: 80 });
      await create({ name: "web-3", image: "whoami", port: 80 });

      const first = await app.inject({ url: "/v1/servers?limit=2" });
      expect(first.statusCode).toBe(200);
      const p1 = page(serverResource).parse(first.json());
      expect(p1.items.map((s) => s.name)).toEqual(["web-3", "web-2"]);
      expect(p1.nextCursor).toBe(p1.items[1]?.id);

      const second = await app.inject({ url: `/v1/servers?limit=2&cursor=${p1.nextCursor ?? ""}` });
      const p2 = page(serverResource).parse(second.json());
      expect(p2.items.map((s) => s.name)).toEqual(["web-1"]);
      expect(p2.nextCursor).toBeNull();
    });

    it("rejects a limit above 100", async () => {
      const res = await app.inject({ url: "/v1/servers?limit=500" });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /v1/servers/:id", () => {
    it("returns one server", async () => {
      const created = serverResource.parse(
        (await create({ name: "web-4", image: "nginx", port: 80 })).json(),
      );
      const res = await app.inject({ url: `/v1/servers/${created.id}` });

      expect(res.statusCode).toBe(200);
      expect(serverResource.parse(res.json())).toEqual(created);
    });

    it("returns 404 not_found for an unknown id", async () => {
      const res = await app.inject({ url: "/v1/servers/0195a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b" });

      expect(res.statusCode).toBe(404);
      expect(apiErrorBody.parse(res.json()).error.code).toBe("not_found");
    });

    it("returns 400 for an id that is not a UUID", async () => {
      const res = await app.inject({ url: "/v1/servers/not-a-uuid" });
      expect(res.statusCode).toBe(400);
    });
  });
});
