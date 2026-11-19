# packages/shared — Schemas and types

Single source of truth for validation and types, used by the API, the worker and the console.

## Status

Only `PLATFORM_NAME` so far. Server schema arrives in MC-203.

## Rules

- Zod schemas first; TypeScript types are inferred (`z.infer`), never written twice.
- No runtime dependencies on Node or browser APIs: this code runs in both.
- Depends on no other workspace package (enforced: `shared-is-a-leaf`).
- Every schema has Vitest tests for valid and invalid inputs.

## Docs

- [Services](../../docs/services/README.md): each service doc lists its spec fields and rules
- [ADR-0010 Fastify, Zod, Drizzle](../../docs/adr/0010-fastify-zod-drizzle.md)
