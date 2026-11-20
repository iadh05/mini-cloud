import { type Database, jobs, type NewJob, type NewResource, resources } from "@mini-cloud/db";
import { and, desc, eq, isNull, lt } from "drizzle-orm";

/** Anything that can run a query: the database or an open transaction. */
export type Executor = Pick<Database, "insert" | "select">;

/** SQL only. No rules, no HTTP. */
export const resourcesRepo = {
  async insert(db: Executor, row: NewResource) {
    const [created] = await db.insert(resources).values(row).returning();
    if (!created) throw new Error("insert returned no row");
    return created;
  },

  async findLive(db: Executor, type: string, id: string) {
    const [row] = await db
      .select()
      .from(resources)
      .where(and(eq(resources.id, id), eq(resources.type, type), isNull(resources.deletedAt)));
    return row;
  },

  /** Newest first. UUIDv7 ids sort by creation time, so the cursor is the last id seen. */
  async listLive(db: Executor, type: string, limit: number, cursor?: string) {
    return db
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.type, type),
          isNull(resources.deletedAt),
          cursor ? lt(resources.id, cursor) : undefined,
        ),
      )
      .orderBy(desc(resources.id))
      .limit(limit);
  },
};

export const jobsRepo = {
  async enqueue(db: Executor, job: NewJob) {
    const [created] = await db.insert(jobs).values(job).returning();
    if (!created) throw new Error("insert returned no row");
    return created;
  },
};
