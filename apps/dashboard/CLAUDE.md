# apps/dashboard — Console

React + Vite web console. Talks to the API only (same origin), never to the database.

## Status

Servers list and create form (MC-208). Status updates by polling every 2 s while a server is changing.

## Layout

```
src/
├── main.tsx    entry: mounts the router inside the providers
├── app/        providers, routes, query client, layout (shell, not found, crash panel)
├── api/        fetch client (checks answers with the shared schemas), ApiError, query keys
├── features/   one folder per service (servers, networks, ...) — each has a CLAUDE.md
├── ui/         design system, atomic design — see ui/CLAUDE.md
└── lib/        small helpers: dates, Zod → Mantine form validation
test/           test setup, fake API (MSW), render helpers
```

## Rules

- Server data lives in TanStack Query; no global store copy.
- Forms validate with the Zod schemas from `@mini-cloud/shared`.
- A feature never imports another feature. Shared UI moves down into `ui/`.
- Pages are in `features/<service>/pages/` and fill a template from `ui/templates`.
- Status is never color only: badges always have text.

## Commands

```bash
npm run dashboard:dev     # http://localhost:5173, forwards /v1 to the API on :3000 (API_URL to change it)
npm run dashboard:build   # production build in dist/
```

Tests run with the rest (`npm test`) in the `dashboard` Vitest project: jsdom, React Testing Library, MSW for the API.

## Adding a feature

1. `src/features/<service>/` with `api.ts`, `pages/`, `components/`.
2. Add `src/features/<service>/CLAUDE.md` with a link to `docs/services/<service>.md` (required, checked by `npm run lint:claude`).
3. `npm run check`.

## Docs

- [Frontend](../../docs/FRONTEND.md)
- [ADR-0012 atomic design](../../docs/adr/0012-atomic-design-console.md)
- [Services](../../docs/services/README.md)
