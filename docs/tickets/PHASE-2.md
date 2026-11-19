# Phase 2 — First version: one button, one server

**Goal:** the thinnest slice of the whole system, end to end, for one resource type. Click **Create server** → a real container runs → the dashboard shows it.

**Milestone 1 — It works** is reached when MC-209 is Done.

**Out of scope for this phase** (comes in Phase 3): delete, sizes, start/stop, retries, a real queue library, live updates without polling, auth.

**Spec coverage:** FR-1, FR-2, FR-3 (create path), FR-4, FR-6, FR-10, FR-11, FR-12, FR-20, FR-21 (polling), FR-22, FR-23, FR-30, FR-31, FR-33.

---

### MC-201 · Monorepo skeleton

| Phase | Type | Size | Status | Depends on | ADR |
|---|---|---|---|---|---|
| 2 | build | M | Todo | — | [0009](../adr/0009-monorepo-npm-workspaces.md) |

**Why** — A clean structure now saves pain for 20 more services.

**Tasks**
- [ ] Root `package.json` with workspaces: `apps/*`, `packages/*`
- [ ] Empty packages: `apps/api`, `apps/worker`, `apps/dashboard`, `packages/shared`, `packages/db`
- [ ] Shared `tsconfig.base.json` (strict mode on)
- [ ] Biome for lint + format; root scripts `lint`, `format`, `typecheck`, `test`
- [ ] `docker-compose.yml` with **Postgres only** for now (pinned tag, volume, healthcheck)
- [ ] `.env.example` with `DATABASE_URL`, `BASE_DOMAIN=mc.localhost`, `RUNS_DIR=./var/runs`

**Done when**
- [ ] `npm install` at the root installs everything
- [ ] `npm run typecheck` and `npm run lint` pass
- [ ] `docker compose up -d` starts Postgres and it reports healthy

**Concepts** — workspaces, strict TypeScript, Compose healthchecks.

---

### MC-202 · Resources and jobs tables

| Phase | Type | Size | Status | Depends on | ADR / Spec |
|---|---|---|---|---|---|
| 2 | build | S | Todo | MC-201 | [0008](../adr/0008-generic-resources-table.md), FR-1 |

**Why** — Desired state needs a home.

**Tasks**
- [ ] Drizzle schema in `packages/db`: `resources` and `jobs` as in [ARCHITECTURE §6](../ARCHITECTURE.md#6-data-model) (skip `project_id` for now)
- [ ] Unique index on `(type, name)` where `deleted_at IS NULL`
- [ ] Generate and run the first migration
- [ ] Read the generated `.sql` file and understand every line

**Done when**
- [ ] `psql` → `\d resources` shows the table with the right columns
- [ ] Inserting two resources with the same type and name fails

**Concepts** — migrations, JSONB, partial unique indexes.

---

### MC-203 · Shared server schema

| Phase | Type | Size | Status | Depends on | Spec |
|---|---|---|---|---|---|
| 2 | build | S | Todo | MC-201 | FR-6, FR-10 |

**Why** — One source of truth for validation in the API and the dashboard.

**Tasks**
- [ ] In `packages/shared`: `resourceName` (3–40 chars, `^[a-z][a-z0-9-]*$`), `serverSpec` (`image` from an allow-list, `port` 1–65535), `ResourceStatus` enum
- [ ] Unit tests with Vitest for valid and invalid inputs

**Done when**
- [ ] Tests pass and cover: name too short, uppercase, bad image, port 0
- [ ] Both `apps/api` and `apps/dashboard` can import the schema

**Concepts** — schema-first design, inferred types.

---

### MC-204 · API: create, list and get servers

| Phase | Type | Size | Status | Depends on | Spec |
|---|---|---|---|---|---|
| 2 | build | M | Todo | MC-202, MC-203 | FR-2, FR-12, FR-30, FR-31, FR-33 |

**Why** — The front door of your cloud.

**Tasks**
- [ ] Fastify app with Zod type provider, Pino logging, request IDs
- [ ] Config module: read and validate env vars at startup; crash with a clear message if missing
- [ ] `POST /v1/servers` → validate → **in one transaction** insert resource (`pending`) + job (`create`) → `202` with the resource
- [ ] `GET /v1/servers` and `GET /v1/servers/:id`
- [ ] One error handler producing the FR-31 error shape (`400` validation, `404` not found, `409` name taken)
- [ ] Integration tests against a test database

**Done when**
- [ ] `curl -X POST .../v1/servers -d '{"name":"web-1","image":"nginx","port":80}'` returns `202` and `status: "pending"`
- [ ] A duplicate name returns `409` in the standard error shape
- [ ] Every response has an `X-Request-Id` header

**Concepts** — REST, `202 Accepted` for async work, transactions, structured logs.

---

### MC-205 · Server Terraform module (platform version)

| Phase | Type | Size | Status | Depends on |
|---|---|---|---|---|
| 2 | build | S | Todo | — |

**Why** — The worker needs a module it can call for every server.

**Tasks**
- [ ] `infra/modules/server/` with inputs `resource_id`, `name`, `image`, `port`, `base_domain`
- [ ] Container named `mc-server-<short-id>`, attached to network `mc-tenants`
- [ ] Traefik labels so `http://<name>.<base_domain>` routes to the container's port
- [ ] Hardening: `capabilities { drop = ["ALL"] }`, `security_opts = ["no-new-privileges"]`, a memory limit
- [ ] Outputs: `container_id`, `url`

**Done when**
- [ ] Applying the module by hand from a test folder creates a working container
- [ ] `docker inspect` shows dropped capabilities and the memory limit

**Concepts** — module interfaces, labels as configuration, container hardening.

---

### MC-206 · Traefik in Compose

| Phase | Type | Size | Status | Depends on |
|---|---|---|---|---|
| 2 | build | S | Todo | MC-201 |

**Why** — Gives every server its own URL without managing host ports ([FR-11](../SPEC.md#62-servers-phases-23)).

**Tasks**
- [ ] Add Traefik (pinned tag) to `docker-compose.yml` with the Docker provider, port 80, and networks `mc-platform` + `mc-tenants`
- [ ] Only route containers with `traefik.enable=true`
- [ ] Enable the Traefik dashboard on a local-only port

**Done when**
- [ ] A test container with the right labels answers at `http://test.mc.localhost`
- [ ] A container without the label is not reachable through Traefik

**Concepts** — reverse proxies, host-based routing, why `*.localhost` works without DNS.

**Notes** — Phase 2 uses Traefik's Docker provider (labels) for simplicity. Phase 4 moves to the file provider when load balancers need config that isn't attached to one container.

---

### MC-207 · Provisioner worker v0

| Phase | Type | Size | Status | Depends on | Spec / ADR |
|---|---|---|---|---|---|
| 2 | build | L | Todo | MC-202, MC-205 | FR-3, FR-4, FR-5, [0004](../adr/0004-terraform-provisioning.md), [0006](../adr/0006-postgres-for-everything.md) |

**Why** — The heart of the cloud: desired state in, real infrastructure out.

**Tasks**
- [ ] Loop every 2 s: take one `queued` job with `SELECT … FOR UPDATE SKIP LOCKED`, mark it `running`
- [ ] Set resource `status = provisioning`
- [ ] Create `var/runs/<resource-id>/main.tf` from a template that calls `infra/modules/server` with the spec
- [ ] Run `terraform init` then `terraform apply -auto-approve -json` as child processes; stream output to logs; keep the last 200 lines
- [ ] On success: `terraform output -json` → `outputs`, status `running`, job `done`
- [ ] On failure: status `failed`, readable `error`, job `failed` with `log_tail`
- [ ] Shared `TF_PLUGIN_CACHE_DIR` so providers download once
- [ ] Graceful shutdown: finish the current job on `SIGTERM`

**Done when**
- [ ] A row inserted by the API becomes a running container without manual steps
- [ ] An invalid image makes the resource `failed` with a message a person can read
- [ ] Two workers running at once never take the same job (test it)
- [ ] Killing the worker mid-apply and restarting it ends with the resource `running`, not duplicated

**Concepts** — job queues and row locking, child processes, idempotency, failure handling.

---

### MC-208 · Dashboard: list and create servers

| Phase | Type | Size | Status | Depends on | Spec |
|---|---|---|---|---|---|
| 2 | build | M | Todo | MC-203, MC-204 | FR-20, FR-21, FR-22, FR-23 |

**Why** — The button that makes it feel like a cloud.

**Tasks**
- [ ] Vite + React + TypeScript app; Mantine; TanStack Query; React Router
- [ ] Servers page: table with name, status badge, URL link, created date
- [ ] Poll the list every 2 s while any server is `pending` or `provisioning`
- [ ] Create form using the shared Zod schema; show API errors inline
- [ ] Failed rows show the error message

**Done when**
- [ ] Creating a server from the form shows `pending → provisioning → running` without refreshing
- [ ] Invalid names are rejected in the form before any request is sent
- [ ] The URL link opens the running server

**Concepts** — server state vs UI state, polling, sharing validation.

---

### MC-209 · Milestone 1 demo and write-up

| Phase | Type | Size | Status | Depends on |
|---|---|---|---|---|
| 2 | test | S | Todo | MC-201 → MC-208 |

**Why** — Prove it works end to end, from a clean start.

**Tasks**
- [ ] From a fresh clone: `docker compose up -d`, migrate, start api, worker, dashboard
- [ ] Create 3 servers from the dashboard
- [ ] Compare `docker ps` with the dashboard list
- [ ] Restart the API and worker; confirm everything is still listed and running
- [ ] Update the README "Quick start"
- [ ] Record a short screen capture or screenshots for the README

**Done when**
- [ ] Every Phase 2 ticket above is Done
- [ ] The request lifecycle in [ARCHITECTURE §3](../ARCHITECTURE.md#3-request-lifecycle) matches the code
- [ ] **Milestone 1 reached**
