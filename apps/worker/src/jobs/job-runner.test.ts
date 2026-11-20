import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createDb,
  createTestDatabase,
  type Job,
  jobs,
  resources,
  type TestDatabase,
} from "@mini-cloud/db";
import { eq } from "drizzle-orm";
import { pino } from "pino";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { INTERNAL_ERROR_MESSAGE } from "../errors.ts";
import { LogTail } from "../log-tail.ts";
import type { Terraform } from "../terraform/terraform.ts";
import { seedServer } from "../testing.ts";
import { createJobRunner, MAX_ATTEMPTS } from "./job-runner.ts";
import { createJobStore, type JobStore } from "./job-store.ts";

const adminUrl = process.env.DATABASE_URL;
const URL_OUT = "http://web-1.mc.localhost";

/** A Terraform that succeeds, unless told otherwise. */
function fakeTerraform(overrides: Partial<Terraform> = {}): Terraform {
  return {
    init: (_dir, onLine) => {
      onLine("Terraform has been successfully initialized!");
      return Promise.resolve({ ok: true });
    },
    apply: (_dir, onLine) => {
      onLine("Apply complete! Resources: 2 added");
      return Promise.resolve({ ok: true });
    },
    output: () => Promise.resolve({ container_id: "c0ffee", url: URL_OUT }),
    ...overrides,
  };
}

describe("LogTail", () => {
  it("keeps only the last lines", () => {
    const tail = new LogTail(2);
    ["1", "2", "3"].forEach((line) => {
      tail.push(line);
    });
    expect(tail.toString()).toBe("2\n3");
  });
});

describe.skipIf(!adminUrl)("job runner", () => {
  let testDb: TestDatabase;
  let conn: ReturnType<typeof createDb>;
  let store: JobStore;
  let runsDir: string;
  const log = pino({ level: "silent" });

  beforeAll(async () => {
    testDb = await createTestDatabase(adminUrl ?? "");
    conn = createDb({ url: testDb.url, max: 2 });
    store = createJobStore(conn.db, { heartbeatTimeoutS: 30 });
    runsDir = await mkdtemp(join(tmpdir(), "mc-runs-"));
  });

  beforeEach(async () => {
    await conn.db.delete(resources);
  });

  afterAll(async () => {
    await conn.close();
    await testDb.drop();
    await rm(runsDir, { recursive: true, force: true });
  });

  const runner = (terraform: Terraform, heartbeatMs = 60_000) =>
    createJobRunner({
      store,
      terraform,
      runsDir,
      modulesDir: "/repo/infra/modules",
      baseDomain: "mc.localhost",
      log,
      heartbeatMs,
    });

  async function claimed(): Promise<Job> {
    const job = await store.claim();
    if (!job) throw new Error("nothing to claim");
    return job;
  }

  const rows = async (job: Job) => {
    const [resource] = await conn.db
      .select()
      .from(resources)
      .where(eq(resources.id, job.resourceId));
    const [jobRow] = await conn.db.select().from(jobs).where(eq(jobs.id, job.id));
    return { resource, job: jobRow };
  };

  it("creates a server: run folder written, outputs saved, running, job done", async () => {
    const { resource } = await seedServer(conn.db, "web-1");
    const job = await claimed();

    await runner(fakeTerraform())(job);

    const after = await rows(job);
    expect(after.resource).toMatchObject({
      status: "running",
      error: null,
      outputs: { containerId: "c0ffee", url: URL_OUT },
    });
    expect(after.job).toMatchObject({
      state: "done",
      logTail: "Terraform has been successfully initialized!\nApply complete! Resources: 2 added",
    });
    const tfvars = JSON.parse(
      await readFile(join(runsDir, resource.id, "terraform.tfvars.json"), "utf8"),
    ) as Record<string, unknown>;
    expect(tfvars).toMatchObject({ name: "web-1", image: "nginx:1.29-alpine" });
  });

  it("apply failure: resource failed with the Terraform message, log tail kept", async () => {
    await seedServer(conn.db, "web-1");
    const job = await claimed();
    const terraform = fakeTerraform({
      apply: (_dir, onLine) => {
        onLine("Error: Unable to pull image");
        return Promise.resolve({ ok: false, error: "Unable to pull image: manifest unknown" });
      },
    });

    await runner(terraform)(job);

    const after = await rows(job);
    expect(after.resource).toMatchObject({
      status: "failed",
      error: "Unable to pull image: manifest unknown",
    });
    expect(after.job).toMatchObject({ state: "failed" });
    expect(after.job?.logTail).toContain("Error: Unable to pull image");
  });

  it("init failure: resource failed", async () => {
    await seedServer(conn.db, "web-1");
    const job = await claimed();

    await runner(fakeTerraform({ init: () => Promise.resolve({ ok: false }) }))(job);

    expect((await rows(job)).resource).toMatchObject({
      status: "failed",
      error: "terraform init failed",
    });
  });

  it("invalid image in the stored spec: failed with a readable message, Terraform never runs", async () => {
    await seedServer(conn.db, "web-1", { image: "ubuntu:latest", port: 80 });
    const job = await claimed();
    const init = vi.fn();

    await runner(fakeTerraform({ init }))(job);

    expect(init).not.toHaveBeenCalled();
    expect((await rows(job)).resource).toMatchObject({
      status: "failed",
      error: "The server spec is invalid: Image must be one of: nginx, httpd, caddy, whoami",
    });
  });

  it("a type without a handler fails clearly", async () => {
    await seedServer(conn.db, "bucket-1", {}, "bucket");
    const job = await claimed();

    await runner(fakeTerraform())(job);

    expect((await rows(job)).resource).toMatchObject({
      status: "failed",
      error: 'The worker cannot provision "bucket" yet',
    });
  });

  it("an unexpected error shows a generic message, never the internals", async () => {
    await seedServer(conn.db, "web-1");
    const job = await claimed();

    await runner(fakeTerraform({ output: () => Promise.reject(new Error("ECONNRESET")) }))(job);

    expect((await rows(job)).resource).toMatchObject({
      status: "failed",
      error: INTERNAL_ERROR_MESSAGE,
    });
  });

  it("refuses unsupported actions and jobs retried too often", async () => {
    await seedServer(conn.db, "web-1");
    const job = await claimed();

    await runner(fakeTerraform())({ ...job, action: "stop" });
    expect((await rows(job)).job).toMatchObject({
      state: "failed",
      error: 'The worker cannot run "stop" jobs yet',
    });

    await seedServer(conn.db, "web-2");
    const retried = await claimed();
    await conn.db
      .update(jobs)
      .set({ attempts: MAX_ATTEMPTS + 1 })
      .where(eq(jobs.id, retried.id));
    await runner(fakeTerraform())({ ...retried, attempts: MAX_ATTEMPTS + 1 });
    expect((await rows(retried)).job).toMatchObject({
      state: "failed",
      error: "Gave up after 3 attempts",
    });
  });

  it("fails the job when the resource was deleted", async () => {
    const { resource } = await seedServer(conn.db, "web-1");
    const job = await claimed();
    await conn.db
      .update(resources)
      .set({ deletedAt: new Date() })
      .where(eq(resources.id, resource.id));

    await runner(fakeTerraform())(job);

    expect((await rows(job)).job).toMatchObject({
      state: "failed",
      error: "The resource was deleted or is not in a state to create",
    });
  });

  it("sends heartbeats while Terraform runs", async () => {
    await seedServer(conn.db, "web-1");
    const job = await claimed();
    const heartbeat = vi.spyOn(store, "heartbeat");
    const slowApply: Terraform["apply"] = async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
      return { ok: true };
    };

    await runner(fakeTerraform({ apply: slowApply }), 10)(job);

    expect(heartbeat).toHaveBeenCalled();
    heartbeat.mockRestore();
  });

  it("discards its result when another worker took the job over", async () => {
    await seedServer(conn.db, "web-1");
    const job = await claimed();
    // Someone else owns attempt 2 now.
    await conn.db.update(jobs).set({ attempts: 2 }).where(eq(jobs.id, job.id));

    await runner(fakeTerraform())(job);

    expect((await rows(job)).job).toMatchObject({ state: "running", attempts: 2 });
  });
});
