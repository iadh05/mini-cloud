# 0003. React + Vite for the dashboard

- Status: Accepted for the framework and build tool. Proposed for the libraries.
- Date: 2026-11-17

## Context
The dashboard is a console: tables, forms, status badges, graphs and live updates. It holds no business logic.

## Decision
- **Accepted:** React with TypeScript, built with Vite, as a single-page app served as static files.
- **Proposed:** TanStack Query for server state and polling, React Router for pages, Mantine as the UI kit, and Zod schemas from `packages/shared` for form validation.

## Consequences
- The largest choice of ready-made dashboard components.
- It builds to static files. In production Traefik or a small static server serves them, so the UI needs no Node server.
- The same Zod schemas validate on the client and the server, so the rules cannot drift apart.

## Alternatives considered
- **Angular:** everything built in, but heavier, and nothing here needs it.
- **Vue:** simpler, with fewer ready-made admin components.
- **Next.js:** server rendering is not needed for a logged-in console and adds a server to run.
