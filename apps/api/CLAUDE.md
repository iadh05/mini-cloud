# apps/api — REST API

Front door of the platform. Validates requests, writes desired state and jobs to Postgres, returns `202 Accepted` for async work. It never runs Terraform or touches Docker.

## Status

Servers: create, list, get (MC-204). Delete, update and actions come in Phase 3.

## Layout

```
src/
├── index.ts                 entry: config → db → buildApp → listen; SIGINT/SIGTERM close cleanly
├── app.ts                   buildApp({ db }): plugins, routes; tests use app.inject()
├── config.ts                env vars parsed once with Zod; readable error and exit if wrong
├── plugins/error-handler.ts every error → { error: { code, message, requestId, details? } }
├── lib/errors.ts            AppError, NotFoundError, ConflictError, isUniqueViolation
├── routes/health.ts         GET /healthz, GET /readyz (503 when the database is down)
├── resources/               generic lifecycle shared by every service
│   ├── resources.service.ts create (resource + job in one transaction), get, list
│   ├── resources.repo.ts    SQL only
│   └── resources.mapper.ts  row → response, spec/outputs parsed with the service schemas
└── features/<service>/      thin routes per service, each with a CLAUDE.md
```

## Rules

- Layers: route → service → repository. Routes parse and reply; services hold rules and transactions; repositories run SQL.
- Schemas for bodies, params, queries and responses come from `@mini-cloud/shared`.
- Never build an error body by hand: throw an `AppError` subclass, the handler does the rest.
- Every response has `X-Request-Id` (the caller's if it is safe, otherwise a new UUID); logs carry it as `reqId`.
- Lists are newest first with a cursor (the last id; UUIDv7 sorts by time), `limit` 1–100.

## May import

`@mini-cloud/shared`, `@mini-cloud/db`. Never another app.

## Commands

```bash
npm run api:dev            # from the repo root, reloads on change, reads .env
npm test                   # includes API integration tests against a throwaway database
```

## Features

One folder per service: `src/features/<service>/`. Each has a `CLAUDE.md` linking to `docs/services/<service>.md`.

## Docs

- [Backend](../../docs/BACKEND.md)
- [Architecture](../../docs/ARCHITECTURE.md)
- [Services](../../docs/services/README.md)
