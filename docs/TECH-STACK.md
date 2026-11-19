# Mini Cloud — Tech Stack

| | |
|---|---|
| Last updated | 2026-11-17 |
| Status key | **Accepted** = decided · **Proposed** = suggested, waiting for your OK · **Later** = decided when that phase starts |

**Version policy:** pin exact versions at install time (in `package.json`, `.terraform.lock.hcl`, and image tags in Compose). Never use `latest`. Record the pinned version in this table when a ticket installs it.

## Development environment

| Tool | Purpose | Pinned version | Status |
|---|---|---|---|
| Windows 11 Pro + WSL2 | Host OS; Linux runs inside WSL2 | — | Accepted |
| Ubuntu (LTS) in WSL2 | Where all code is written and run | 24.04.5 LTS (WSL 3.0.5, kernel 6.18) | Accepted |
| Docker Desktop (WSL integration) | Container engine for the local data plane | 29.8.2 | Accepted |
| Node.js (LTS) inside Ubuntu | Runs API, worker, tooling | 26.13.1 LTS via fnm 1.39.0 (npm 11.20) | Accepted |
| Terraform | Provisioning engine | 1.17.2 (HashiCorp apt repo) | Accepted |
| Git + GitHub | Version control | 2.55 (Windows), 2.43 (Ubuntu) | Accepted |
| VS Code + WSL extension | Editor connected to Ubuntu | — | Proposed |

## Control plane

| Layer | Choice | Why | Alternatives considered | Status | ADR |
|---|---|---|---|---|---|
| Language | **TypeScript on Node.js** | Already installed; one language end to end | Go, Java/Spring, Python | Accepted | [0002](adr/0002-typescript-node-control-plane.md) |
| Repo | **npm workspaces monorepo** | Shared types across apps, no extra tool | pnpm, Turborepo, Nx | Proposed | [0009](adr/0009-monorepo-npm-workspaces.md) |
| API framework | **Fastify** | Fast, typed, built-in schema hooks, light | Express, NestJS, Hono | Proposed | [0010](adr/0010-fastify-zod-drizzle.md) |
| Validation | **Zod** | One schema → API validation, form validation, TS types | Joi, Yup, TypeBox | Proposed | [0010](adr/0010-fastify-zod-drizzle.md) |
| Database | **PostgreSQL** | One database for state, jobs and Terraform state | MySQL, SQLite | Proposed | [0006](adr/0006-postgres-for-everything.md) |
| DB access | **Drizzle ORM** | SQL-shaped, light, plain SQL migrations you can read | Prisma, Knex, raw `pg` | Proposed | [0010](adr/0010-fastify-zod-drizzle.md) |
| Job queue | Phase 2: table + `SKIP LOCKED`; Phase 3: **pg-boss** | No Redis needed; the locking mechanism stays visible | BullMQ (Redis), RabbitMQ | Proposed | [0006](adr/0006-postgres-for-everything.md) |
| Logging | **Pino** | Fastify's default, JSON logs | Winston | Proposed | — |
| Docker access (worker) | **dockerode** | Start, stop, logs and stats, where Terraform is a poor fit | Docker CLI via child process | Proposed | — |
| Testing | **Vitest**; Playwright later | Fast, TypeScript-native | Jest | Proposed | — |
| Lint + format | **Biome** | One fast tool instead of ESLint + Prettier | ESLint + Prettier | Proposed | — |
| Auth (Phase 5) | Own sessions + **argon2id**, hashed API keys | Built in-house to control the whole auth flow | Auth.js, Keycloak | Later | — |

## Dashboard

| Layer | Choice | Why | Status | ADR |
|---|---|---|---|---|
| Framework | **React + TypeScript** | Largest ecosystem for dashboards | Accepted | [0003](adr/0003-react-dashboard.md) |
| Build tool | **Vite** | Fast dev server, simple config | Accepted | [0003](adr/0003-react-dashboard.md) |
| Server state | **TanStack Query** | Caching, polling, refetch on focus | Proposed | [0003](adr/0003-react-dashboard.md) |
| Routing | **React Router** | Standard, simple | Proposed | [0003](adr/0003-react-dashboard.md) |
| UI kit | **Mantine** | Tables, forms, notifications, charts in one kit | Proposed | [0003](adr/0003-react-dashboard.md) |
| Forms | Mantine Form + Zod | Same validation as the API | Proposed | — |
| Live updates | Polling (Phase 2) → SSE (Phase 3) | Start simple | Proposed | — |
| Component tests | **Vitest + React Testing Library + MSW** | Test components against a fake API | Proposed | — |
| Serving | Same origin as the API: Vite proxy in dev, Traefik in Compose | No CORS, simple cookies | Proposed | [0011](adr/0011-same-origin-console-and-api.md) |

## Data plane and infrastructure

| Service | Tool | Terraform provider | Phase | Status |
|---|---|---|---|---|
| Servers, databases, caches | Docker | `kreuzwerker/docker` | 1–2 | Accepted ([0005](adr/0005-docker-first-data-plane.md)) |
| Provisioning engine | Terraform CLI | — | 1–2 | Accepted ([0004](adr/0004-terraform-provisioning.md)) |
| Routing, load balancers | Traefik (file provider) | — (worker writes files) | 2, 4 | Proposed |
| Buckets | MinIO | `aminueza/minio` | 4 | Proposed |
| DNS | CoreDNS | — (worker writes zone files) | 4 | Proposed |
| Firewall | nftables | — (worker applies rules) | 4 | Later |
| Monitoring | Prometheus + cAdvisor | — | 6 | Later |
| Logs | Docker logs → maybe Loki | — | 6 | Later |
| Certificates | Local CA (mkcert/step-ca) → Let's Encrypt | — | 7 | Later |
| CI/CD | GitHub Actions | — | 7 | Later |
| Registry | CNCF Distribution | — | 8 | Later |
| Queues | NATS | — | 8 | Later |
| Real VMs | KVM + libvirt (or Proxmox) | `dmacvicar/libvirt` or `bpg/proxmox` | 9 | Later |
| Host agent on each compute server | **Go** (optional; small static binary, strong infra ecosystem) | — | 9 | Later |

## Linux command-line tools for debugging

Installed in Ubuntu (`sudo apt install …`). They show what the platform actually does.

| Tool | Package | Shows | Area |
|---|---|---|---|
| `ip` | iproute2 (preinstalled) | Interfaces, bridges, routes, network namespaces | Networks |
| `ss` | iproute2 | Which process listens on which port | Exposure |
| `curl` | curl | HTTP requests from the terminal, headers with `-v` | Exposure |
| `dig` | dnsutils | DNS answers | DNS |
| `nft` | nftables | Firewall rules | Firewall |
| `tcpdump` | tcpdump | The actual packets on an interface | Networks |
| `jq` | jq | Reading JSON output (`terraform output -json`, `docker inspect`) | Provisioning |
| `hey` | hey | Load testing an HTTP endpoint | Sizing |
| `htop` | htop | CPU and memory per process | Limits |
| `psql` | postgresql-client | Talking to Postgres directly | Databases |

## Hosting

| Stage | Where | Status |
|---|---|---|
| Phases 0–6 | Your PC (16 GB RAM) | Accepted |
| Phase 7+ | VPS, 4 vCPU / 8 GB / 80 GB SSD, Ubuntu Server LTS (size confirmed by Phase 6 measurements) | Accepted ([0007](adr/0007-own-servers-only.md)) |
| Phase 9+ | Dedicated server(s) with KVM support | Accepted ([0007](adr/0007-own-servers-only.md)) |
| Public clouds (AWS, Azure, GCP) | Not used | Accepted ([0007](adr/0007-own-servers-only.md)) |
