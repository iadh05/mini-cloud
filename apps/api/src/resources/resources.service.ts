import type { Database, Resource } from "@mini-cloud/db";
import { findService, type PageQuery, type ServiceId } from "@mini-cloud/shared";
import { ConflictError, isUniqueViolation, NotFoundError } from "../lib/errors.ts";
import { jobsRepo, resourcesRepo } from "./resources.repo.ts";

const NAME_UNIQUE = "resources_type_name_live_uq";

export interface CreateResource {
  type: ServiceId;
  name: string;
  spec: Record<string, unknown>;
}

export interface ResourcePage {
  items: Resource[];
  nextCursor: string | null;
}

/** The generic lifecycle shared by every resource type. Knows nothing about HTTP. */
export function createResourcesService(db: Database) {
  const label = (type: ServiceId) => findService(type)?.name ?? type;

  return {
    /** Writes the resource (`pending`) and its `create` job in one transaction. */
    async create(input: CreateResource): Promise<Resource> {
      try {
        return await db.transaction(async (tx) => {
          const resource = await resourcesRepo.insert(tx, { ...input, status: "pending" });
          await jobsRepo.enqueue(tx, {
            resourceId: resource.id,
            action: "create",
            generation: resource.generation,
          });
          return resource;
        });
      } catch (error) {
        if (isUniqueViolation(error, NAME_UNIQUE)) {
          throw new ConflictError(`A ${input.type} named "${input.name}" already exists`);
        }
        throw error;
      }
    },

    async get(type: ServiceId, id: string): Promise<Resource> {
      const resource = await resourcesRepo.findLive(db, type, id);
      if (!resource) throw new NotFoundError(label(type), id);
      return resource;
    },

    async list(type: ServiceId, query: PageQuery): Promise<ResourcePage> {
      const rows = await resourcesRepo.listLive(db, type, query.limit + 1, query.cursor);
      const items = rows.slice(0, query.limit);
      const last = items.at(-1);
      return { items, nextCursor: rows.length > query.limit && last ? last.id : null };
    },
  };
}

export type ResourcesService = ReturnType<typeof createResourcesService>;
