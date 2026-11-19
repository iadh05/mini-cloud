# Servers

| | |
|---|---|
| Resource type | `server` |
| API | `/v1/servers` |
| Terraform module | `infra/modules/server/` |
| Phase | 2 (create, list, get) · 3 (delete, sizes, start/stop/restart) |
| Feature folders | `apps/api/src/features/servers/` · `apps/worker/src/features/servers/` · `apps/dashboard/src/features/servers/` |

## What it does

Runs a container image as a server the user can reach at its own URL. The user chooses the image and the port; the platform runs it isolated, with resource limits, and reports its status.

## Spec (desired state)

| Field | Type | Rules | Default |
|---|---|---|---|
| `name` | string | 3–40 chars, `^[a-z][a-z0-9-]*$`, unique per type among non-deleted resources | — |
| `image` | string | from the allow-list in `@mini-cloud/shared` | — |
| `port` | integer | 1–65535, the port the app listens on inside the container | — |
| `size` | enum | `nano`, `small`, `medium` (Phase 3, from load tests) | `nano` |

## Outputs

| Field | Meaning |
|---|---|
| `containerId` | Docker container ID |
| `url` | `http://<name>.<BASE_DOMAIN>` |

## Status machine

```
pending ──► provisioning ──► running
                        └──► failed
running ──► deleting ──► deleted            (Phase 3)
running ◄─► stopping / stopped / starting   (Phase 3)
```

A resource never stays in `provisioning`: the worker sets `running` or `failed` with the error.

## API

| Method | Path | Result |
|---|---|---|
| `POST` | `/v1/servers` | `202` with the resource in `pending`; resource + `create` job written in one transaction |
| `GET` | `/v1/servers` | List |
| `GET` | `/v1/servers/:id` | One server, `404` if unknown |
| `DELETE` | `/v1/servers/:id` | Phase 3: `202`, status `deleting` |

Errors use the standard shape: `400` validation, `404` not found, `409` name taken.

## How it is provisioned

1. Worker locks the next `create` job (`FOR UPDATE SKIP LOCKED`), sets the resource to `provisioning`.
2. Renders a run folder `RUNS_DIR/<resource-id>/` that calls `infra/modules/server` with `resource_id`, `name`, `image`, `port`, `base_domain`.
3. `terraform init` and `terraform apply`.
4. Writes `containerId` and `url` to `outputs`, status `running`. On error: status `failed` with the message.

Container: named `mc-server-<short-id>`, on network `mc-tenants`, Traefik labels route `<name>.<BASE_DOMAIN>` to `port`, label `mc.resource-id`.

## Console

| Screen | Shows | Actions |
|---|---|---|
| Servers list | Name, image, status badge, URL, created | Create, open |
| Create server | Name, image, port, validated with the shared schema | Create |
| Server detail (Phase 3) | Spec, outputs, job history and logs | Start, stop, restart, delete |

## Limits and security

- All capabilities dropped, `no-new-privileges`, memory limit per size.
- Only images from the allow-list.
- No host ports in Phase 2: traffic only through Traefik.
- Capacity check on create from Phase 3 (`422 insufficient_capacity`).

## Tickets

MC-203 (schema) · MC-204 (API) · MC-205 (Terraform module) · MC-207 (worker) · MC-208 (console) · MC-209 (demo)
