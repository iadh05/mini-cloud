import { type Database, type Job, jobs, type Resource, resources } from "@mini-cloud/db";
import { and, asc, eq, inArray, isNull, lt, lte, notExists, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

/** At most one running job per resource (partial unique index in packages/db). */
const ONE_RUNNING_PER_RESOURCE = "jobs_one_running_per_resource_uq";
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown, constraint: string): boolean {
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    const pg = e as Error & { code?: string; constraint?: string };
    if (pg.code === UNIQUE_VIOLATION && pg.constraint === constraint) return true;
  }
  return false;
}

/** Statuses a resource may be in when a create job starts (failed: retried by hand later). */
const STARTABLE = ["pending", "provisioning", "failed"] as const;

export interface JobStoreOptions {
  /** A running job whose heartbeat is older than this is taken over by another worker. */
  heartbeatTimeoutS: number;
}

/**
 * The job queue and the status writes, in SQL. Phase 2: polling with FOR UPDATE SKIP LOCKED.
 *
 * Fencing: a claim increments `attempts`. Every later write checks that `attempts` still
 * matches, so a worker that lost its job (it was too slow and another worker took over)
 * cannot overwrite the result of the new owner.
 */
export function createJobStore(db: Database, options: JobStoreOptions) {
  const running = alias(jobs, "running");
  const staleBefore = sql`now() - make_interval(secs => ${options.heartbeatTimeoutS})`;
  const owned = (job: Job) =>
    and(eq(jobs.id, job.id), eq(jobs.attempts, job.attempts), eq(jobs.state, "running"));

  return {
    /**
     * Takes the next job, or returns undefined. A job is ready when it is queued and its
     * resource has no running job, or when it is running but its worker stopped sending
     * heartbeats (crashed). Locked rows are skipped, so two workers never take the same job.
     */
    async claim(): Promise<Job | undefined> {
      try {
        return await db.transaction(async (tx) => {
          const resourceBusy = tx
            .select({ one: sql`1` })
            .from(running)
            .where(and(eq(running.resourceId, jobs.resourceId), eq(running.state, "running")));

          const [next] = await tx
            .select({ id: jobs.id })
            .from(jobs)
            .where(
              or(
                and(
                  eq(jobs.state, "queued"),
                  lte(jobs.runAfter, sql`now()`),
                  notExists(resourceBusy),
                ),
                and(eq(jobs.state, "running"), lt(jobs.heartbeatAt, staleBefore)),
              ),
            )
            .orderBy(asc(jobs.runAfter), asc(jobs.id))
            .limit(1)
            .for("update", { of: jobs, skipLocked: true });
          if (!next) return undefined;

          const [claimed] = await tx
            .update(jobs)
            .set({
              state: "running",
              startedAt: sql`now()`,
              heartbeatAt: sql`now()`,
              attempts: sql`${jobs.attempts} + 1`,
            })
            .where(eq(jobs.id, next.id))
            .returning();
          return claimed;
        });
      } catch (error) {
        // Two workers took two queued jobs of the same resource at the same moment:
        // the unique index refused the second one. It will be taken later.
        if (isUniqueViolation(error, ONE_RUNNING_PER_RESOURCE)) return undefined;
        throw error;
      }
    },

    /** Says "still working". Returns false if the job now belongs to another worker. */
    async heartbeat(job: Job): Promise<boolean> {
      const rows = await db
        .update(jobs)
        .set({ heartbeatAt: sql`now()` })
        .where(owned(job))
        .returning({ id: jobs.id });
      return rows.length === 1;
    },

    /** Moves the live resource to `provisioning`. Undefined if it was deleted meanwhile. */
    async startResource(job: Job): Promise<Resource | undefined> {
      const [resource] = await db
        .update(resources)
        .set({ status: "provisioning", error: null, updatedAt: sql`now()` })
        .where(
          and(
            eq(resources.id, job.resourceId),
            isNull(resources.deletedAt),
            inArray(resources.status, STARTABLE),
          ),
        )
        .returning();
      return resource;
    },

    /** Job done, resource running with its outputs. False if the job was lost. */
    async succeed(job: Job, outputs: Record<string, unknown>, logTail: string): Promise<boolean> {
      return db.transaction(async (tx) => {
        const done = await tx
          .update(jobs)
          .set({ state: "done", error: null, logTail, finishedAt: sql`now()` })
          .where(owned(job))
          .returning({ id: jobs.id });
        if (done.length === 0) return false;
        await tx
          .update(resources)
          .set({ status: "running", outputs, error: null, updatedAt: sql`now()` })
          .where(eq(resources.id, job.resourceId));
        return true;
      });
    },

    /** Job failed, resource failed with a message a person can read. False if the job was lost. */
    async fail(job: Job, message: string, logTail: string): Promise<boolean> {
      return db.transaction(async (tx) => {
        const failed = await tx
          .update(jobs)
          .set({ state: "failed", error: message, logTail, finishedAt: sql`now()` })
          .where(owned(job))
          .returning({ id: jobs.id });
        if (failed.length === 0) return false;
        await tx
          .update(resources)
          .set({ status: "failed", error: message, updatedAt: sql`now()` })
          .where(and(eq(resources.id, job.resourceId), isNull(resources.deletedAt)));
        return true;
      });
    },
  };
}

export type JobStore = ReturnType<typeof createJobStore>;
