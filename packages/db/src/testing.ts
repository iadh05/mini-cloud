import { randomBytes } from "node:crypto";
import { createDb } from "./client.ts";
import { runMigrations } from "./migrate.ts";

export interface TestDatabase {
  /** Connection string of the new, migrated database. */
  url: string;
  /** Drops the database. */
  drop: () => Promise<void>;
}

/**
 * Creates a throwaway database next to the one at `adminUrl`, migrated and seeded.
 * For integration tests: every test file gets its own clean database.
 */
export async function createTestDatabase(adminUrl: string): Promise<TestDatabase> {
  const name = `minicloud_test_${randomBytes(4).toString("hex")}`;
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;

  const admin = createDb({ url: adminUrl, max: 1 });
  try {
    await admin.pool.query(`CREATE DATABASE ${name}`);
  } finally {
    await admin.close();
  }
  await runMigrations(url.toString());

  return {
    url: url.toString(),
    drop: async () => {
      const a = createDb({ url: adminUrl, max: 1 });
      try {
        await a.pool.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      } finally {
        await a.close();
      }
    },
  };
}
