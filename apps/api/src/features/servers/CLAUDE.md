# apps/api · features/servers

HTTP routes for the Servers service: `POST /v1/servers`, `GET /v1/servers`, `GET /v1/servers/:id`.

## Rules

- Routes stay thin: Zod schemas from `@mini-cloud/shared` (`createServerInput`, `serverResource`, `pageQuery`, `idParams`), one call to the generic resources service with `type: "server"`, reply.
- `POST` answers `202 Accepted` with the resource in `pending`; the worker does the real work later.
- No SQL and no business rules here; they live in `src/resources/`.
- Every error goes through the shared error handler; never build an error body by hand.
- Tests in `servers.routes.test.ts` run against a real throwaway Postgres database.

## Docs

- [Servers service](../../../../../docs/services/servers.md): spec, API, status machine
- [Backend, API layers and errors](../../../../../docs/BACKEND.md)
