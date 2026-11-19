import type { Database } from "@mini-cloud/db";
import { sql } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { AppError } from "../lib/errors.ts";

/** `/healthz`: the process is up. `/readyz`: the database answers. */
export function healthRoutes(db: Database): FastifyPluginCallbackZod {
  return (app, _options, done) => {
    app.get("/healthz", () => ({ status: "ok" }));

    app.get("/readyz", async () => {
      try {
        await db.execute(sql`select 1`);
      } catch (error) {
        app.log.warn({ err: error }, "database not reachable");
        throw new AppError(503, "unavailable", "The database is not reachable");
      }
      return { status: "ready" };
    });

    done();
  };
}
