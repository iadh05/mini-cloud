import { type Database, jobs, resources } from "@mini-cloud/db";

/** Test helper: a pending server and its queued create job, as the API writes them. */
export async function seedServer(
  db: Database,
  name: string,
  spec: Record<string, unknown> = { image: "nginx", port: 80 },
  type = "server",
) {
  const [resource] = await db
    .insert(resources)
    .values({ type, name, spec, status: "pending" })
    .returning();
  if (!resource) throw new Error("no resource");
  const [job] = await db
    .insert(jobs)
    .values({ resourceId: resource.id, action: "create", generation: resource.generation })
    .returning();
  if (!job) throw new Error("no job");
  return { resource, job };
}
