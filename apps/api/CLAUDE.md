# apps/api — REST API

Front door of the platform. Validates requests, writes desired state and jobs to Postgres, returns `202 Accepted` for async work. It never runs Terraform or touches Docker.

## Status

Stub. Built in MC-204 (create, list, get servers).

## Design

- Fastify + Zod type provider, Pino logs, `X-Request-Id` on every response.
- Layers: route → service → repository. Routes parse and reply; services hold rules; repositories run SQL (Drizzle from `@mini-cloud/db`).
- A create writes the resource (`pending`) and its job in **one transaction**.
- One error handler, one error shape (see `docs/BACKEND.md`).
- Config read and validated once at startup; crash with a clear message if a variable is missing.

## May import

`@mini-cloud/shared`, `@mini-cloud/db`. Never another app.

## Commands

```bash
npm run dev -w @mini-cloud/api
npm run typecheck -w @mini-cloud/api
```

## Read first

`docs/BACKEND.md`, `docs/ARCHITECTURE.md`.
