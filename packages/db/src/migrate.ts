import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { syncServiceCatalog } from "./catalog.ts";
import { createDb } from "./client.ts";

export const MIGRATIONS_DIR = fileURLToPath(new URL("../migrations", import.meta.url));

/** Applies every pending migration, then syncs the service catalog. */
export async function runMigrations(url: string): Promise<void> {
  const { db, close } = createDb({ url, max: 1 });
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    await syncServiceCatalog(db);
  } finally {
    await close();
  }
}
