# Mini Cloud

A small self-hosted cloud: a REST API stores desired state, a worker turns jobs into Terraform runs, a React console shows everything. Tenant resources are Docker containers on our own servers.

## Map

| Path                    | What                                                                  | Guide                                                  |
| ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| `apps/api`              | Fastify REST API                                                      | [apps/api/CLAUDE.md](apps/api/CLAUDE.md)               |
| `apps/worker`           | Provisioner: job loop + Terraform runner                              | [apps/worker/CLAUDE.md](apps/worker/CLAUDE.md)         |
| `apps/dashboard`        | React console                                                         | [apps/dashboard/CLAUDE.md](apps/dashboard/CLAUDE.md)   |
| `apps/dashboard/src/ui` | Design system (atomic design)                                         | [ui/CLAUDE.md](apps/dashboard/src/ui/CLAUDE.md)        |
| `packages/shared`       | Zod schemas, types, constants                                         | [packages/shared/CLAUDE.md](packages/shared/CLAUDE.md) |
| `packages/db`           | Drizzle schema, migrations, client                                    | [packages/db/CLAUDE.md](packages/db/CLAUDE.md)         |
| `docs/`                 | Architecture, backend, frontend, infra, ADRs                          | read before changing a design                          |
| `docs/services/`        | One doc per service: spec, API, status machine, console, provisioning | [docs/services/README.md](docs/services/README.md)     |

## Commands

```bash
npm install          # also installs the git hooks
npm run check        # format, lint, architecture rules, typecheck, tests (must pass)
npm run format       # fix formatting
npm run platform:up  # Postgres + Traefik in Docker, waits until healthy
npm run db:migrate   # tables and the service catalog
npm run worker:dev   # provisioner: takes jobs, runs Terraform (needs terraform on PATH)
npm run infra:check  # Terraform fmt, validate, test
```

## Rules

- Follow [CONTRIBUTING.md](CONTRIBUTING.md): one ticket per branch `mc-<n>-<name>`, commits `type(scope): subject (MC-123)`.
- `npm run check` must pass before every commit. Never skip hooks (`--no-verify`).
- Boundaries are enforced by dependency-cruiser (`.dependency-cruiser.cjs`). Fix the design, never weaken a rule to pass.
- TypeScript strict; no `any`, no non-null `!` without a comment saying why.
- Pin exact versions. No `latest` image tags.
- Secrets only in `.env` (git-ignored). Never log them.
- Every workspace and every feature folder has its own `CLAUDE.md` that links to its docs. A feature folder (`apps/*/src/features/<service>/`) must link to [docs/services/\<service\>.md](docs/services/README.md). `npm run lint:claude` fails when the file, the link or the linked doc is missing.
- New service: write `docs/services/<service>.md` from the [template](docs/services/_template.md) first, then the code.
