# apps/dashboard — Console

React + Vite web console. Talks to the API only (same origin), never to the database.

## Status

Placeholder. React + Vite app arrives in MC-208.

## Layout

```
src/
├── app/        providers, router, layout
├── api/        fetch client, errors, query keys
├── features/   one folder per service (servers, networks, ...) — each has a CLAUDE.md
├── ui/         design system, atomic design — see ui/CLAUDE.md
└── lib/        small helpers
```

## Rules

- Server data lives in TanStack Query; no global store copy.
- Forms validate with the Zod schemas from `@mini-cloud/shared`.
- A feature never imports another feature. Shared UI moves down into `ui/`.
- Pages are in `features/<service>/pages/` and fill a template from `ui/templates`.
- Status is never color only: badges always have text.

## Adding a feature

1. `src/features/<service>/` with `api.ts`, `pages/`, `components/`.
2. Add `src/features/<service>/CLAUDE.md` with a link to `docs/services/<service>.md` (required, checked by `npm run lint:claude`).
3. `npm run check`.

## Docs

- [Frontend](../../docs/FRONTEND.md)
- [ADR-0012 atomic design](../../docs/adr/0012-atomic-design-console.md)
- [Services](../../docs/services/README.md)
