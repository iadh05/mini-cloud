import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

export interface DbOptions {
  /** Postgres connection string, usually `DATABASE_URL`. */
  url: string;
  max?: number;
}

export function createDb({ url, max = 10 }: DbOptions) {
  const pool = new pg.Pool({ connectionString: url, max });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  return { db, pool, close: () => pool.end() };
}

export type Database = ReturnType<typeof createDb>["db"];
