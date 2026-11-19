# Mini Cloud — Product Specification

| | |
|---|---|
| Status | Draft v1 |
| Last updated | 2026-11-17 |
| Owner | [iadh05](https://github.com/iadh05) |
| Related | [Architecture](ARCHITECTURE.md) · [Tech stack](TECH-STACK.md) · [Decisions](adr/) · [Tickets](tickets/README.md) |

---

## 1. Summary

Mini Cloud is a small, self-hosted cloud platform. A user opens a web dashboard, clicks **Create server** (or bucket, database, load balancer…), and the platform creates the real resource on infrastructure it controls.

It reproduces, at small scale, how a public cloud works. It starts on a Windows PC (WSL2 + Docker), moves to a rented Linux server (VPS), and finally runs real virtual machines on dedicated servers. It never depends on AWS, Azure or Google Cloud ([ADR-0007](adr/0007-own-servers-only.md)).

## 2. Goals

### 2.1 Technical goals

The platform implements:

- How a cloud turns an API request into a running resource (control plane vs data plane).
- Desired state vs actual state, and why provisioning is asynchronous.
- Linux containers, virtual machines, networks, storage and DNS from the inside.
- Infrastructure as Code with Terraform: providers, modules, state, drift.
- Multi-tenant security: identity, permissions, isolation, secrets, audit.
- Operating a real server: SSH, firewalls, TLS, backups, monitoring.

### 2.2 Product goals

- A working dashboard, REST API and command-line tool.
- 22 services, each built in three levels.
- Multiple users and projects that cannot see each other's resources.
- Runs on a single 4 vCPU / 8 GB server with room for 20–30 small resources.

### 2.3 Non-goals

- Selling to real customers or taking payments.
- Production-grade uptime (no SLA, no 24/7 on-call).
- Building a hypervisor, a file system or a database engine from scratch.
- Matching the hundreds of services AWS offers.
- Integrating with any public cloud provider.

## 3. Users

| Persona | Who | What they do |
|---|---|---|
| **Operator** | You | Installs and runs the platform, sets limits and prices, watches health |
| **Tenant owner** | A developer using the platform | Creates projects, resources and API keys, invites viewers |
| **Tenant viewer** | A teammate of a tenant owner | Sees resources and graphs, cannot change anything |
| **Automation** | A script or CI job holding an API key | Calls the API or CLI with limited permissions |

Until Phase 5, there is one implicit user (you) with full access.

## 4. Glossary

| Term | Meaning in this project |
|---|---|
| **Control plane** | The software you write: dashboard, API, worker, app database. Decides what should exist. |
| **Data plane** | The infrastructure that actually runs resources: Docker, MinIO, Traefik, later VMs. |
| **Resource** | Anything a user can create: a server, bucket, database, network… |
| **Desired state** | What the user asked for, stored as a row in the app database. |
| **Actual state** | What really exists on the data plane, observed by the worker. |
| **Job** | A unit of background work: create, update or delete one resource. |
| **Provisioner / worker** | The process that turns jobs into Terraform runs. |
| **Project** | A container for resources owned by one tenant. The unit of isolation, quota and billing. |
| **Host** | A machine that runs data-plane workloads (your PC, the VPS, a dedicated server). |
| **Drift** | When actual state no longer matches desired state. |

## 5. Service catalog

Summary:

| # | Service | Comparable to | Backed by (first version) | Phase |
|---|---|---|---|---|
| 1 | Servers | EC2 | Docker containers with CPU/memory limits | 2–3 |
| 2 | Private networks | VPC | Docker bridge networks, one per project | 4 |
| 3 | Volumes | EBS | Docker volumes | 4 |
| 4 | Databases | RDS | Postgres container + volume + backups | 4 |
| 5 | Buckets | S3 | MinIO | 4 |
| 6 | Firewall rules | Security groups | nftables rules on the host | 4 |
| 7 | Load balancers | ELB | Traefik (file provider) | 4 |
| 8 | DNS | Route 53 | CoreDNS | 4, 7 |
| 9 | Identity and access | IAM | Users, roles, API keys in the API | 5 |
| 10 | Secrets | Secrets Manager | Encrypted table + master key | 5 |
| 11 | Audit log | CloudTrail | Append-only table | 5 |
| 12 | Monitoring and logs | CloudWatch | Prometheus + cAdvisor + container logs | 6 |
| 13 | Metering and billing | Billing | Usage events + price list | 6 |
| 14 | Certificates | ACM | Local CA, then Let's Encrypt | 7 |
| 15 | Container registry | ECR | Distribution registry on a bucket | 8 |
| 16 | App platform | App Runner | Composition of 1, 7, 8, 14 | 8 |
| 17 | Functions | Lambda | Short-lived containers | 8 |
| 18 | Queues and events | SQS / SNS | NATS | 8 |
| 19 | Cache | ElastiCache | Redis-compatible container | 8 |
| 20 | Auto scaling groups | EC2 Auto Scaling | Control loop in the worker | 8 |
| 21 | Stacks and CLI | CloudFormation / AWS CLI | Own template format + CLI | 8 |
| 22 | Keys | KMS | Small key service | 8 |

## 6. Functional requirements

Requirements are numbered so tickets can reference them. Only Phases 2–3 are detailed now; later phases get detailed when they start.

### 6.1 Resource lifecycle (all services)

- **FR-1** Every resource has: `id`, `type`, `name`, `project_id`, `spec`, `status`, `outputs`, `created_at`, `updated_at`.
- **FR-2** Creating, updating or deleting a resource returns immediately (HTTP `202 Accepted`) and creates a job. The real work happens in the background.
- **FR-3** A resource moves through the statuses `pending → provisioning → running`, or to `failed`. Deletion goes `deleting → deleted`. See the state machine in [ARCHITECTURE.md §5](ARCHITECTURE.md#5-resource-model-and-state-machine).
- **FR-4** A failed job stores a human-readable error on the resource.
- **FR-5** Running the same job twice gives the same result (idempotency). A crashed worker can be restarted without losing or duplicating work.
- **FR-6** Resource names are unique per project and type, 3–40 characters, lowercase letters, digits and hyphens.

### 6.2 Servers (Phases 2–3)

- **FR-10** A user can create a server with a name, an image (from an allowed list) and an internal port.
- **FR-11** The platform exposes the server at `http://<name>.mc.localhost` (local) and returns that URL in `outputs`.
- **FR-12** A user can list servers and see each server's status and URL.
- **FR-13** A user can delete a server; the container and its Terraform state are removed.
- **FR-14** (Phase 3) A user can choose a size: `nano` (0.25 vCPU, 128 MB), `small` (0.5 vCPU, 256 MB), `medium` (1 vCPU, 512 MB).
- **FR-15** (Phase 3) A user can start, stop and restart a server.

### 6.3 Dashboard

- **FR-20** The dashboard lists resources with name, type, status and created date.
- **FR-21** Status changes appear without a manual page refresh (polling in Phase 2, server-sent events in Phase 3).
- **FR-22** Create forms validate input with the same rules as the API.
- **FR-23** Failed resources show their error message.

### 6.4 API

- **FR-30** The API is REST over JSON, versioned under `/v1`.
- **FR-31** Errors use one shape: `{ "error": { "code": "string", "message": "string", "details": {} } }`.
- **FR-32** List endpoints support `?limit=` and cursor pagination from Phase 3.
- **FR-33** Every request gets a request ID, returned in the `X-Request-Id` header and written to logs.

### 6.5 Later phases (summary only)

| Phase | Adds |
|---|---|
| 4 | Networks, volumes, databases, buckets, firewall rules, load balancers, DNS; one Terraform module per type |
| 5 | Sign-up/login, projects, roles (owner, viewer), API keys, quotas, audit log, secrets, rate limits |
| 6 | Metrics, logs, alarms, usage metering, invoices; a measured resource budget for the platform |
| 7 | Deployment to a VPS, HTTPS, real domain, backups, CI/CD |
| 8 | Registry, app platform, functions, queues, cache, auto scaling, stacks, CLI, keys |
| 9 | Dedicated servers, real VMs (KVM/libvirt), several compute hosts, a scheduler |
| 10 | Your choice: zones, Kubernetes, CDN, API gateway, WAF, policy rules… |

## 7. Non-functional requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-1 | Create/update/delete API calls return quickly | < 1 s |
| NFR-2 | A server is running after creation (local, image cached) | < 30 s |
| NFR-3 | Read endpoints are fast (local) | p95 < 300 ms |
| NFR-4 | Platform memory footprint, idle, without monitoring | < 1.5 GB |
| NFR-5 | Platform memory footprint, idle, with monitoring | < 3 GB |
| NFR-6 | No secrets in git; all config from environment variables | Always |
| NFR-7 | Logs are structured JSON with request ID and resource ID | Always |
| NFR-8 | Every part runs in a container started by Docker Compose | From Phase 2 |
| NFR-9 | Tenant workloads cannot reach the platform network or the Docker socket | From Phase 4 |
| NFR-10 | Database and Terraform state are backed up daily, restore is tested | From Phase 7 |

## 8. Milestones

| Milestone | After phase | Demo |
|---|---|---|
| **M1 — It works** | 2 | One click on the dashboard creates a real container you can open in a browser |
| **M2 — It looks like a cloud** | 4 | Four services (servers, networks, databases, buckets) in one console |
| **M3 — It is online** | 7 | The platform runs on a VPS at your own domain, over HTTPS |
| **M4 — It runs real machines** | 9 | A click creates a real virtual machine on a dedicated server |

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Planning forever, building nothing | High | Small tickets; finish level 1 before level 2; a demo at each milestone |
| Docker on Windows behaves differently from Linux | Medium | Develop inside Ubuntu on WSL2 from day one |
| The worker controls Docker, so a bug or attack can take over the host | High | Worker never exposed to the internet; strict input validation; tenant containers hardened (see ARCHITECTURE §9) |
| Terraform state gets corrupted or lost | Medium | One state per resource; state in Postgres from Phase 3; backups |
| Scope grows (22 services + extras) | High | Phases are gates; extras only in Phase 10 |
| A VPS cannot run real VMs | Medium | Real VMs only in Phase 9, on a dedicated server |

## 10. Open questions

- Which VPS provider and region for Phase 7? (Decide at Phase 6 using measured needs.)
- Proxmox or plain libvirt for Phase 9? (Decide at Phase 8.)
- Do we need a CLI before Phase 8, for testing? (Decide at Phase 3.)
