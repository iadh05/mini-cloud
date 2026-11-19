# packages/shared — Schemas and types

Single source of truth for validation and types, used by the API, the worker and the console.

## Status

- `lifecycle.ts`: resource statuses, job actions, job states.
- `services.ts`: the **service catalog**, all 39 services (`SERVICES`, `ServiceId`, `findService`). The `services` table and `resources.type` follow it. Add or change a service here first.
- `resource-name.ts`: `resourceName`, the name rule shared by every resource (a DNS label).
- `server.ts`: `SERVER_IMAGES` allow-list, `serverSpec`, `createServerInput` ([Servers](../../docs/services/servers.md)).

## Rules

- Zod schemas first; TypeScript types are inferred (`z.infer`), never written twice.
- Error messages are written for the console user: plain, specific, no jargon.
- Objects are strict: unknown fields are rejected.
- No runtime dependencies on Node or browser APIs: this code runs in both.
- Depends on no other workspace package (enforced: `shared-is-a-leaf`).
- Every schema has Vitest tests for valid and invalid inputs.

## Docs

- [Services](../../docs/services/README.md): each service doc lists its spec fields and rules
- [ADR-0010 Fastify, Zod, Drizzle](../../docs/adr/0010-fastify-zod-drizzle.md)
