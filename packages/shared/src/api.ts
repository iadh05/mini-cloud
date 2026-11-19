import { z } from "zod";
import { RESOURCE_STATUSES } from "./lifecycle.ts";

/** Error codes the API can return (docs/BACKEND.md §3.5). */
export const ERROR_CODES = [
  "validation_failed",
  "not_found",
  "name_taken",
  "invalid_state",
  "unavailable",
  "internal",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

/** Every error response has this body. */
export const apiErrorBody = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    requestId: z.string(),
    details: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorBody>;

export const PAGE_LIMIT_DEFAULT = 20;
export const PAGE_LIMIT_MAX = 100;

/** Query string of every list endpoint. */
export const pageQuery = z.strictObject({
  limit: z.coerce.number().int().min(1).max(PAGE_LIMIT_MAX).default(PAGE_LIMIT_DEFAULT),
  cursor: z.uuid().optional(),
});
export type PageQuery = z.infer<typeof pageQuery>;

/** A page of results; `nextCursor` is null on the last page. */
export function page<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.uuid().nullable() });
}

export const idParams = z.strictObject({ id: z.uuid() });

/** Fields every resource response has; `spec` and `outputs` are typed per service. */
export function resourceResponse<S extends z.ZodType, O extends z.ZodType>(spec: S, outputs: O) {
  return z.object({
    id: z.uuid(),
    type: z.string(),
    name: z.string(),
    status: z.enum(RESOURCE_STATUSES),
    spec,
    outputs,
    error: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  });
}
