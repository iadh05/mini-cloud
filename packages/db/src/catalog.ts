import { SERVICES } from "@mini-cloud/shared";
import { sql } from "drizzle-orm";
import type { Database } from "./client.ts";
import { services } from "./schema.ts";

/**
 * Upserts every service of the catalog into the `services` table.
 * Updates names, paths, phases and statuses; keeps the operator's `enabled` choice.
 */
export async function syncServiceCatalog(db: Database): Promise<number> {
  const rows = SERVICES.map((service) => ({ ...service }));
  await db
    .insert(services)
    .values(rows)
    .onConflictDoUpdate({
      target: services.id,
      set: {
        number: sql`excluded.number`,
        name: sql`excluded.name`,
        category: sql`excluded.category`,
        path: sql`excluded.path`,
        aws: sql`excluded.aws`,
        engine: sql`excluded.engine`,
        phase: sql`excluded.phase`,
        status: sql`excluded.status`,
        updatedAt: sql`now()`,
      },
    });
  return rows.length;
}
