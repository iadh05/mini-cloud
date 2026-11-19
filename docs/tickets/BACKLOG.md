# Backlog — Phases 3 to 10

Epics only. Each becomes detailed tickets (`MC-3xx`, `MC-4xx`…) when its phase starts, using the results of the phases before.

---

## Phase 3 — Make it solid

| Epic | Spec |
|---|---|
| Switch the job loop to pg-boss: retries with backoff, dead jobs | FR-5, ADR-0006 |
| Delete servers: `deleting → deleted`, `terraform destroy`, clean the run folder, in the order of [INFRA §12.5](../INFRA.md#125-create-and-destroy-in-order) | FR-13 |
| Orphan sweep: remove Docker objects labelled `mc.resource-id` whose resource is gone | INFRA §12.5 |
| Terraform state in Postgres (`pg` backend), one schema per resource | ARCH §8 |
| Server sizes (nano, small, medium) from load-test measurements, recorded in an ADR | FR-14, CAPACITY §2 |
| `hosts` table and the capacity check on create (`422 insufficient_capacity`) | CAPACITY §5 |
| Start, stop, restart (Docker API from the worker) | FR-15 |
| Live status with server-sent events instead of polling | FR-21 |
| Job history and logs per resource in the dashboard | FR-4 |
| Cursor pagination on list endpoints | FR-32 |
| Load test: create and delete 10 servers, nothing left behind | — |
| Decide: Terraform as child process or in a container per job | ARCH §12 |

## Phase 4 — More services (Milestone 2)

| Epic | Service |
|---|---|
| Generic resource API: `/v1/{type}` routes driven by registered schemas | all |
| Private networks per project | 2 |
| Volumes: create, attach, detach | 3 |
| Databases: Postgres container + volume + generated password + daily backup | 4 |
| Buckets with MinIO and per-bucket access keys | 5 |
| TCP/UDP exposure: port pool 30000–32767, `port_allocations` table, warn that changing ports recreates the container | 1, INFRA §12.2 |
| Firewall rules as a resource, default deny from outside the project (decide Docker Desktop vs Docker Engine in WSL2 first) | 6, INFRA §12.3 |
| Load balancers: Traefik file provider, health checks | 7 |
| Internal DNS with CoreDNS | 8 |
| Tags on every resource | — |

## Phase 5 — Users, projects, permissions

| Epic | Service |
|---|---|
| Sign-up, login, sessions (argon2id, secure cookies) | 9 |
| Projects and memberships; `project_id` on resources | 9 |
| Roles (owner, viewer) checked on every route | 9 |
| API keys (prefix + hash) | 9 |
| Quotas per project | 9 |
| Audit log (append-only) | 11 |
| Secrets with envelope encryption | 10 |
| Rate limits | — |

## Phase 6 — Monitoring and metering

| Epic | Service |
|---|---|
| Prometheus + cAdvisor in Compose | 12 |
| CPU/memory graphs per server | 12 |
| Log viewer (last N lines) | 12 |
| Alarms and notifications (email or webhook) | 12 |
| Usage events, price list, invoice page | 13 |
| **Measure the platform's real CPU, memory and disk use** → input for Phase 7 sizing | NFR-4/5 |

## Phase 7 — Move to a rented server (Milestone 3)

| Epic | Service |
|---|---|
| Choose and rent a VPS from Phase 6 measurements | — |
| Host configuration as code in `infra/host/`, tested on a throwaway VM first | CAPACITY §6 |
| Hardening: SSH keys only, firewall (22, 80, 443), automatic security updates | CAPACITY §6 |
| Same Compose file on the server, production `.env` | NFR-8 |
| Domain, wildcard DNS, HTTPS with Let's Encrypt | 8, 14 |
| Custom domains: CNAME + TXT ownership check, certificate per domain | 8, 14, INFRA §12.4 |
| Backups of Postgres (including Terraform state) and a tested restore | NFR-10 |
| CI/CD with GitHub Actions: test, build, deploy on push | — |
| Status page for the platform | — |

## Phase 8 — Application services

| Epic | Service |
|---|---|
| Container registry | 15 |
| App platform (image → URL) | 16 |
| Functions | 17 |
| Queues and events (NATS) | 18 |
| Cache (Redis-compatible) | 19 |
| Auto scaling groups | 20 |
| Stacks (template format) and the CLI | 21 |
| Key service | 22 |

## Phase 9 — Dedicated servers and real VMs (Milestone 4)

| Epic | Notes |
|---|---|
| Choose: Proxmox or plain KVM/libvirt | Decide at the end of Phase 8 |
| Rent a dedicated server with virtualization support | — |
| VM server type: Terraform libvirt/Proxmox provider, cloud-init images | — |
| Several compute hosts and a scheduler that picks one per resource | — |
| Host agent: reports capacity and health | — |
| Reconciliation loop: detect and repair drift | — |

## Phase 10 — Scale and choose a direction

Pick one or more: a second host as a second zone, managed Kubernetes, CDN, API gateway, web application firewall, policy rules, document database, file shares, VPN and network peering, tracing, threat detection.
