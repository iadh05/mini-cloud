# packages/db — Database

Drizzle schema, SQL migrations and the database client. Used by the API and the worker, never by the console.

## Status

Stub. `resources` and `jobs` tables arrive in MC-202.

## Rules

- One generic `resources` table with `spec` and `outputs` as JSONB (ADR-0008).
- Every schema change is a generated migration; read the `.sql` before committing it.
- Never edit an applied migration; add a new one.
- Unique names per type only among rows that are not deleted (partial unique index).

## Commands

```bash
npm run db:up        # from the repo root
```

## Docs

- [Architecture, data model](../../docs/ARCHITECTURE.md)
- [ADR-0006 Postgres for everything](../../docs/adr/0006-postgres-for-everything.md)
- [ADR-0008 generic resources table](../../docs/adr/0008-generic-resources-table.md)
