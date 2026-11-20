# infra/modules/server — Server Terraform module

Creates one tenant server: a hardened Docker container routed by Traefik. The worker calls it once per server resource, in its own run folder.

## Inputs → outputs

| Input          | Notes                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `resource_id`  | UUID from `resources.id`                                                                         |
| `name`         | DNS label; same rule as `resourceName` in `@mini-cloud/shared`                                   |
| `image`        | Pinned reference from `SERVER_IMAGES` (never `latest`)                                           |
| `port`         | Port inside the container                                                                        |
| `base_domain`  | URL becomes `http://<name>.<base_domain>`                                                        |
| `network_name` | Existing network, default `mc-tenants` (created by the platform, never here)                     |
| `memory_mb`    | Default 128, swap disabled                                                                       |
| `cap_add`      | Capabilities given back after dropping ALL; only `CHOWN`, `SETUID`, `SETGID`, `NET_BIND_SERVICE` |

Outputs: `container_id`, `container_name`, `url`.

## Rules

- Hardening is not optional: `capabilities.drop = ["ALL"]`, `no-new-privileges`, memory limit.
- Capability names are sent as `CAP_<NAME>` because Docker stores them that way; without the prefix every plan would replace the container.
- `keep_locally = true` on the image: many servers share it.
- Variable validations repeat the API rules so the module is safe on its own.
- A second `terraform plan` after apply must say "No changes".

## Commands

```bash
npm run infra:check     # fmt, validate, terraform test (applies a real container, then destroys it)
```

## Docs

- [Servers service](../../../docs/services/servers.md)
- [Infra](../../../docs/INFRA.md)
- [ADR-0004 Terraform provisioning](../../../docs/adr/0004-terraform-provisioning.md)
