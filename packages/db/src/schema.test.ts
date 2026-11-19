import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "./client.ts";
import { runMigrations } from "./migrate.ts";
import { jobs, resources } from "./schema.ts";

const url = process.env.DATABASE_URL;

/** Runs against real Postgres in a throwaway database, dropped at the end. */
describe.skipIf(!url)("resources and jobs tables", () => {
  const dbName = `minicloud_test_${randomBytes(4).toString("hex")}`;
  const testUrl = (() => {
    const u = new URL(url ?? "postgres://localhost/x");
    u.pathname = `/${dbName}`;
    return u.toString();
  })();
  const admin = () => createDb({ url: url ?? "", max: 1 });
  let conn: ReturnType<typeof createDb>;

  beforeAll(async () => {
    const a = admin();
    await a.pool.query(`CREATE DATABASE ${dbName}`);
    await a.close();
    await runMigrations(testUrl);
    conn = createDb({ url: testUrl, max: 2 });
  });

  afterAll(async () => {
    await conn.close();
    const a = admin();
    await a.pool.query(`DROP DATABASE ${dbName} WITH (FORCE)`);
    await a.close();
  });

  const server = (name: string) => ({
    type: "server",
    name,
    spec: { image: "nginx", port: 80 },
  });

  it("creates a resource with defaults", async () => {
    const [row] = await conn.db.insert(resources).values(server("web-1")).returning();
    expect(row).toMatchObject({
      status: "pending",
      generation: 1,
      outputs: {},
      deletionProtection: false,
      deletedAt: null,
    });
    expect(row?.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects a second live resource with the same type and name", async () => {
    await expect(conn.db.insert(resources).values(server("web-1"))).rejects.toThrow();
  });

  it("allows the name again once the first one is soft-deleted", async () => {
    await conn.db
      .update(resources)
      .set({ deletedAt: new Date(), status: "deleted" })
      .where(eq(resources.name, "web-1"));
    await expect(conn.db.insert(resources).values(server("web-1"))).resolves.toBeDefined();
  });

  it("allows the same name for a different type", async () => {
    await expect(
      conn.db.insert(resources).values({ ...server("web-1"), type: "database" }),
    ).resolves.toBeDefined();
  });

  it("rejects an unknown status", async () => {
    await expect(
      conn.pool.query(
        `INSERT INTO resources (type, name, spec, status) VALUES ('server', 'x-1', '{}', 'flying')`,
      ),
    ).rejects.toThrow(/resources_status_ck/);
  });

  it("queues a job and allows only one running job per resource", async () => {
    const [res] = await conn.db.insert(resources).values(server("web-2")).returning();
    const resourceId = res?.id ?? "";
    const [job] = await conn.db
      .insert(jobs)
      .values({ resourceId, action: "create", generation: 1 })
      .returning();
    expect(job).toMatchObject({ state: "queued", attempts: 0 });

    await conn.db
      .insert(jobs)
      .values({ resourceId, action: "create", generation: 1, state: "running" });
    await expect(
      conn.db
        .insert(jobs)
        .values({ resourceId, action: "update", generation: 2, state: "running" }),
    ).rejects.toThrow();
  });

  it("deletes jobs with their resource", async () => {
    await conn.db.delete(resources).where(eq(resources.name, "web-2"));
    const left = await conn.db.select().from(jobs);
    expect(left).toHaveLength(0);
  });
});
