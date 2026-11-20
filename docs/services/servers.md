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

Schemas: `createServerInput` (API body, console form) and `serverSpec` (stored in `resources.spec`) in `packages/shared/src/server.ts`. Unknown fields are rejected.

| Field | Type | Rules | Default |
|---|---|---|---|
| `name` | string | 3–40 chars, lowercase letters, digits and `-`, starts with a letter, does not end with `-` (it is a DNS label); unique per type among live resources | — |
| `image` | enum | `nginx`, `httpd`, `caddy`, `whoami`; each maps to a pinned image (`SERVER_IMAGES`) | — |
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
2. Writes a run folder `RUNS_DIR/<resource-id>/`: `main.tf.json` calls `infra/modules/server`, `terraform.tfvars.json` holds `resource_id`, `name`, `image` (pinned ref), `port`, `base_domain`, `cap_add` (from `SERVER_IMAGES`). User values only go into tfvars, never into configuration.
3. `terraform init` and `terraform apply`.
4. Writes `containerId` and `url` to `outputs`, status `running`. On error: status `failed` with the message.

Container (module `infra/modules/server`):

- Name `mc-server-<last 12 hex digits of the id>` (UUIDv7 starts with a timestamp, so the end is the unique part).
- Network `mc-tenants` (created by the platform). Traefik labels route `<name>.<BASE_DOMAIN>` to `port`.
- Labels `mc.resource-id`, `mc.service=server`, `mc.name`.
- Restart policy `unless-stopped`: Docker restarts a crashed server by itself.

## Console

| Screen | Shows | Actions |
|---|---|---|
| Servers list | Name, image, status badge, URL, created | Create, open |
| Create server | Name, image, port, validated with the shared schema | Create |
| Server detail (Phase 3) | Spec, outputs, job history and logs | Start, stop, restart, delete |

## Limits and security

- All Linux capabilities dropped, then only what the image needs added back (measured per image, in `SERVER_IMAGES`): nginx `CHOWN SETUID SETGID`, caddy `NET_BIND_SERVICE`, httpd and whoami none.
- `no-new-privileges`, memory limit (128 MiB by default) with swap disabled.
- Only images from the allow-list.
- No host ports: traffic only through Traefik (`mc-traefik`, port 80 on 127.0.0.1). Only containers labelled `traefik.enable=true` are routed; everything else on `mc-tenants` gets a 404.
- Capacity check on create from Phase 3 (`422 insufficient_capacity`).

## Tickets

MC-203 (schema) · MC-204 (API) · MC-205 (Terraform module) · MC-207 (worker) · MC-208 (console) · MC-209 (demo)
