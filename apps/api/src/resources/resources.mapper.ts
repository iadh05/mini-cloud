import type { Resource } from "@mini-cloud/db";
import type { z } from "zod";

export interface ResponseSchemas<S, O> {
  spec: z.ZodType<S>;
  outputs: z.ZodType<O>;
}

/**
 * Database row → API response (camelCase, ISO dates, no internal columns).
 * `spec` and `outputs` are parsed with the service's schemas, so a bad stored value
 * fails loudly here instead of reaching a client.
 */
export function toResponse<S, O>(row: Resource, schemas: ResponseSchemas<S, O>) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    status: row.status,
    spec: schemas.spec.parse(row.spec),
    outputs: schemas.outputs.parse(row.outputs),
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
