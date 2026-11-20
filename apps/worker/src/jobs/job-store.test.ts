import { createDb, createTestDatabase, jobs, resources, type TestDatabase } from "@mini-cloud/db";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedServer } from "../testing.ts";
import { createJobStore, type JobStore } from "./job-store.ts";

const adminUrl = process.env.DATABASE_URL;
const STALE_URL = "http://stale.mc.localhost";
const WEB_URL = "http://web-1.mc.localhost";

describe.skipIf(!adminUrl)("job store", () => {
  let testDb: TestDatabase;
  // Two connection pools = two independent workers.
  let a: ReturnType<typeof createDb>;
  let b: ReturnType<typeof createDb>;
  let workerA: JobStore;
  let workerB: JobStore;

  beforeAll(async () => {
    testDb = await createTestDatabase(adminUrl ?? "");
    a = createDb({ url: testDb.url, max: 4 });
    b = createDb({ url: testDb.url, max: 4 });
    workerA = createJobStore(a.db, { heartbeatTimeoutS: 30 });
    workerB = createJobStore(b.db, { heartbeatTimeoutS: 30 });
  });

  beforeEach(async () => {
    await a.db.delete(resources);
  });

  afterAll(async () => {
    await a.close();
    await b.close();
    await testDb.drop();
  });

  it("returns undefined when there is nothing to do", async () => {
    expect(await workerA.claim()).toBeUndefined();
  });

  it("claims a queued job: running, attempt 1, heartbeat set", async () => {
    const { job } = await seedServer(a.db, "web-1");

    const claimed = await workerA.claim();

    expect(claimed).toMatchObject({ id: job.id, state: "running", attempts: 1 });
    expect(claimed?.startedAt).toBeInstanceOf(Date);
    expect(claimed?.heartbeatAt).toBeInstanceOf(Date);
    expect(await workerA.claim()).toBeUndefined();
  });

  it("two workers claiming at the same time never take the same job", async () => {
    const seeded = await Promise.all(
      Array.from({ length: 20 }, (_, i) => seedServer(a.db, `web-${String(i)}`)),
    );

    const taken: string[] = [];
    for (;;) {
      const round = await Promise.all([
        workerA.claim(),
        workerB.claim(),
        workerA.claim(),
        workerB.claim(),
      ]);
      const ids = round.flatMap((job) => (job ? [job.id] : []));
      if (ids.length === 0) break;
      taken.push(...ids);
    }

    expect(taken).toHaveLength(20);
    expect(new Set(taken).size).toBe(20);
    expect(new Set(taken)).toEqual(new Set(seeded.map((s) => s.job.id)));
  });

  it("runs one job per resource at a time", async () => {
    const { resource, job: first } = await seedServer(a.db, "web-1");
    const [second] = await a.db
      .insert(jobs)
      .values({ resourceId: resource.id, action: "update", generation: 2 })
      .returning();

    const round = await Promise.all([workerA.claim(), workerB.claim()]);
    const claimed = round.filter((job) => job !== undefined);
    expect(claimed.map((job) => job.id)).toEqual([first.id]);

    const owner = claimed[0];
    if (!owner) throw new Error("no job claimed");
    await workerA.succeed(owner, {}, "");
    expect((await workerB.claim())?.id).toBe(second?.id);
  });

  it("takes over a job whose worker stopped sending heartbeats, and fences the old worker", async () => {
    const { job } = await seedServer(a.db, "web-1");
    const lost = await workerA.claim();
    if (!lost) throw new Error("no job claimed");

    // Fresh heartbeat: nobody else may take it.
    expect(await workerA.heartbeat(lost)).toBe(true);
    expect(await workerB.claim()).toBeUndefined();

    // Worker A "crashes": its heartbeat gets old.
    await a.db
      .update(jobs)
      .set({ heartbeatAt: sql`now() - interval '1 hour'` })
      .where(eq(jobs.id, job.id));
    const taken = await workerB.claim();
    expect(taken).toMatchObject({ id: job.id, state: "running", attempts: 2 });

    // Worker A wakes up: every write it tries is refused.
    expect(await workerA.heartbeat(lost)).toBe(false);
    expect(await workerA.succeed(lost, { url: STALE_URL }, "")).toBe(false);
    expect(await workerA.fail(lost, "stale", "")).toBe(false);

    if (!taken) throw new Error("no job claimed");
    expect(await workerB.succeed(taken, { url: WEB_URL }, "ok")).toBe(true);
    const [row] = await a.db.select().from(resources).where(eq(resources.id, job.resourceId));
    expect(row).toMatchObject({ status: "running", outputs: { url: WEB_URL } });
  });

  it("moves the resource to provisioning, but not a deleted one", async () => {
    const { job } = await seedServer(a.db, "web-1");
    const claimed = await workerA.claim();
    if (!claimed) throw new Error("no job claimed");

    expect(await workerA.startResource(claimed)).toMatchObject({ status: "provisioning" });

    await a.db
      .update(resources)
      .set({ deletedAt: sql`now()` })
      .where(eq(resources.id, job.resourceId));
    expect(await workerA.startResource(claimed)).toBeUndefined();
  });

  it("records a failure on the job and the resource", async () => {
    const { job } = await seedServer(a.db, "web-1");
    const claimed = await workerA.claim();
    if (!claimed) throw new Error("no job claimed");

    expect(await workerA.fail(claimed, "Image not found", "line 1\nline 2")).toBe(true);

    const [jobRow] = await a.db.select().from(jobs).where(eq(jobs.id, job.id));
    expect(jobRow).toMatchObject({
      state: "failed",
      error: "Image not found",
      logTail: "line 1\nline 2",
    });
    expect(jobRow?.finishedAt).toBeInstanceOf(Date);
    const [resource] = await a.db.select().from(resources).where(eq(resources.id, job.resourceId));
    expect(resource).toMatchObject({ status: "failed", error: "Image not found" });
  });
});
