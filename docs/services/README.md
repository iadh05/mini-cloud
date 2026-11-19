# Services

One document per service. It is the reference for everything about that service: the API, the console screens, the Terraform module and the worker handler.

**Rule:** every feature folder that implements a service (`apps/api/src/features/<service>/`, `apps/worker/src/features/<service>/`, `apps/dashboard/src/features/<service>/`) has a `CLAUDE.md` that links to `docs/services/<service>.md`. `npm run lint:claude` fails otherwise.

The full list of 39 services, with their API path, AWS name, engine, phase and status, is the constant `SERVICES` in `packages/shared/src/services.ts`. It is synced into the `services` table on every migration.

| Service | Doc | Phase |
|---|---|---|
| Servers | [servers.md](servers.md) | 2 |

New service: copy [_template.md](_template.md) to `<service>.md`, fill it in, add a row here.
