# Architecture Decision Records

Each file records one decision: the situation, what we chose, and what it costs us. Accepted decisions are never edited. A new ADR **supersedes** an old one instead.

| # | Decision | Status | Date |
|---|---|---|---|
| [0001](0001-record-decisions.md) | Record architecture decisions as ADRs | Accepted | 2026-11-17 |
| [0002](0002-typescript-node-control-plane.md) | TypeScript on Node.js for the control plane | Accepted | 2026-11-17 |
| [0003](0003-react-dashboard.md) | React + Vite for the dashboard | Accepted | 2026-11-17 |
| [0004](0004-terraform-provisioning.md) | Terraform CLI as the provisioning engine | Accepted | 2026-11-17 |
| [0005](0005-docker-first-data-plane.md) | Docker as the first data plane | Accepted | 2026-11-17 |
| [0006](0006-postgres-for-everything.md) | PostgreSQL for app state, job queue and Terraform state | Proposed | 2026-11-17 |
| [0007](0007-own-servers-only.md) | Own servers only, no public cloud provider | Accepted | 2026-11-17 |
| [0008](0008-generic-resources-table.md) | One generic resources table with a typed spec | Proposed | 2026-11-17 |
| [0009](0009-monorepo-npm-workspaces.md) | Monorepo with npm workspaces | Accepted | 2026-11-17 |
| [0010](0010-fastify-zod-drizzle.md) | Fastify, Zod and Drizzle for the API | Proposed | 2026-11-17 |
| [0011](0011-same-origin-console-and-api.md) | Serve the dashboard and the API from the same origin | Proposed | 2026-11-17 |
| [0012](0012-atomic-design-console.md) | Atomic design for the console UI | Accepted | 2026-11-19 |

**Statuses:** Proposed → Accepted → Superseded by NNNN, or Deprecated.

## Template

```markdown
# NNNN. Title

- Status: Proposed
- Date: YYYY-MM-DD

## Context
What situation forces a decision? What constraints matter?

## Decision
What we chose, in one or two sentences.

## Consequences
What gets easier, what gets harder, what we must now do.

## Alternatives considered
Each option and why it lost.
```
