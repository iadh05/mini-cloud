# packages/db — Database

Drizzle schema, SQL migrations and the database client. Used by the API and the worker, never by the console.

## What is here

| File                 | Purpose                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `src/schema.ts`      | `services`, `resources` and `jobs` tables (types, defaults, indexes, CHECK constraints) |
| `src/client.ts`      | `createDb({ url })` → Drizzle + pg pool                                                 |
| `src/migrate.ts`     | `runMigrations(url)`: migrations, then the service catalog sync                         |
| `src/catalog.ts`     | `syncServiceCatalog(db)`: upserts `SERVICES` into `services`, keeps `enabled`           |
| `src/bin/migrate.ts` | CLI entry point for `npm run db:migrate`                                                |
| `migrations/`        | Generated SQL. Committed. Never edited after it is applied.                             |
| `src/schema.test.ts` | Integration tests in a throwaway Postgres database                                      |

## Rules

- One generic `resources` table with `spec` and `outputs` as JSONB (ADR-0008).
- `resources.type` is a foreign key to `services.id`: a resource can only be of a catalog type.
- The `services` rows come from `SERVICES` in `@mini-cloud/shared`; never insert them by hand.
- Allowed values (statuses, job actions, job states) come from `@mini-cloud/shared` and are enforced twice: TypeScript types and SQL CHECK constraints.
- IDs are UUIDv7 (`uuidv7()`, Postgres 18): unique and sortable by creation time.
- Names are unique per type among live rows only (partial unique index); soft-deleted rows free the name.
- At most one `running` job per resource (partial unique index).
- Change the schema → `npm run db:generate` → read the new `.sql` → commit both.

## Commands

```bash
npm run db:up          # Postgres in Docker
npm run db:generate    # new migration from schema changes
npm run db:migrate     # apply migrations to DATABASE_URL
npm test               # includes the integration tests when DATABASE_URL is set
```

## Docs

- [Architecture, data model](../../docs/ARCHITECTURE.md)
- [Backend, job loop and generations](../../docs/BACKEND.md)
- [ADR-0006 Postgres for everything](../../docs/adr/0006-postgres-for-everything.md)
- [ADR-0008 generic resources table](../../docs/adr/0008-generic-resources-table.md)
