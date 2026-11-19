# 0009. Monorepo with npm workspaces

- Status: Proposed
- Date: 2026-11-17

## Context
The API, the worker and the dashboard share schemas and types. Separate repositories would mean publishing packages or copying code between them.

## Decision
One git repository, with npm workspaces for `apps/api`, `apps/worker`, `apps/dashboard`, `packages/shared` and `packages/db`. Terraform modules live in `infra/`.

## Consequences
- A schema change and every place that uses it land in one commit.
- npm comes with Node, so there is no extra tool to install.
- npm workspaces are slower and less strict than pnpm. Switching later is easy if that becomes a problem.

## Alternatives considered
- **pnpm workspaces:** faster and stricter, but one more tool to install.
- **Turborepo or Nx:** build caching that a project this size does not need.
- **Several repositories:** extra overhead for one person.
