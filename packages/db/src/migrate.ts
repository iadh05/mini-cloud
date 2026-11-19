import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "./client.ts";

export const MIGRATIONS_DIR = fileURLToPath(new URL("../migrations", import.meta.url));

/** Applies every pending migration to the database at `url`. */
export async function runMigrations(url: string): Promise<void> {
  const { db, close } = createDb({ url, max: 1 });
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  } finally {
    await close();
  }
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set (copy .env.example to .env)");
    process.exit(1);
  }
  await runMigrations(url);
  console.warn("migrations applied");
}
