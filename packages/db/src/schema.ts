import {
  JOB_ACTIONS,
  JOB_STATES,
  RESOURCE_STATUSES,
  SERVICE_CATEGORIES,
  SERVICE_STATUSES,
} from "@mini-cloud/shared";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** `'a', 'b', 'c'` for a CHECK constraint, from a list of allowed values. */
const sqlList = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(", "));

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/**
 * The service catalog, synced from `SERVICES` in `@mini-cloud/shared` on every migration.
 * Operators can switch a service off with `enabled`; the sync never touches that column.
 */
export const services = pgTable(
  "services",
  {
    id: text("id").primaryKey(),
    number: integer("number").notNull().unique(),
    name: text("name").notNull(),
    category: text("category", { enum: SERVICE_CATEGORIES }).notNull(),
    path: text("path").notNull().unique(),
    aws: text("aws").notNull(),
    engine: text("engine").notNull(),
    phase: integer("phase").notNull(),
    status: text("status", { enum: SERVICE_STATUSES }).notNull().default("planned"),
    enabled: boolean("enabled").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    check("services_category_ck", sql`${t.category} IN (${sqlList(SERVICE_CATEGORIES)})`),
    check("services_status_ck", sql`${t.status} IN (${sqlList(SERVICE_STATUSES)})`),
  ],
);

/**
 * Every resource of every type (ADR-0008). Common columns are typed;
 * `spec` (desired state) and `outputs` (results) are JSONB validated by the type's Zod schema.
 */
export const resources = pgTable(
  "resources",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    type: text("type")
      .notNull()
      .references(() => services.id),
    name: text("name").notNull(),
    spec: jsonb("spec").$type<Record<string, unknown>>().notNull(),
    status: text("status", { enum: RESOURCE_STATUSES }).notNull().default("pending"),
    outputs: jsonb("outputs").$type<Record<string, unknown>>().notNull().default({}),
    error: text("error"),
    generation: integer("generation").notNull().default(1),
    deletionProtection: boolean("deletion_protection").notNull().default(false),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    purgeAt: timestamp("purge_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("resources_type_name_live_uq")
      .on(t.type, t.name)
      .where(sql`${t.deletedAt} IS NULL`),
    index("resources_status_idx").on(t.status),
    check("resources_status_ck", sql`${t.status} IN (${sqlList(RESOURCE_STATUSES)})`),
    check("resources_generation_ck", sql`${t.generation} >= 1`),
  ],
);

/** Work for the worker. Taken with `FOR UPDATE SKIP LOCKED` in Phase 2. */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuidv7()`),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    action: text("action", { enum: JOB_ACTIONS }).notNull(),
    state: text("state", { enum: JOB_STATES }).notNull().default("queued"),
    /** The resource generation this job was created for. */
    generation: integer("generation").notNull(),
    attempts: integer("attempts").notNull().default(0),
    error: text("error"),
    logTail: text("log_tail"),
    runAfter: timestamp("run_after", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [
    index("jobs_queue_idx")
      .on(t.runAfter)
      .where(sql`${t.state} = 'queued'`),
    index("jobs_resource_idx").on(t.resourceId),
    uniqueIndex("jobs_one_running_per_resource_uq")
      .on(t.resourceId)
      .where(sql`${t.state} = 'running'`),
    check("jobs_action_ck", sql`${t.action} IN (${sqlList(JOB_ACTIONS)})`),
    check("jobs_state_ck", sql`${t.state} IN (${sqlList(JOB_STATES)})`),
  ],
);

export type Service = typeof services.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
