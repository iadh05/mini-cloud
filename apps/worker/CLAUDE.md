# apps/worker — Provisioner

Takes jobs from Postgres, writes a Terraform run folder per resource, runs `terraform init` and `terraform apply`, and writes the outputs and the new status back. The only component that touches Docker.

## Layout

```
src/
├── index.ts              Entry: config, logger, loop, SIGTERM/SIGINT
├── config.ts             Environment → Config (paths resolved from the repo root)
├── loop.ts               One job at a time; waits POLL_INTERVAL_MS when the queue is empty
├── jobs/
│   ├── job-store.ts      SQL: claim (FOR UPDATE SKIP LOCKED), heartbeat, succeed, fail
│   └── job-runner.ts     One job end to end; never throws, always records a result
├── terraform/
│   ├── workspace.ts      Writes RUNS_DIR/<resource-id>/main.tf.json + terraform.tfvars.json
│   └── terraform.ts      Terraform CLI as child processes; parses `apply -json`
└── features/
    ├── registry.ts       resource type → handler
    └── servers/          Servers handler (spec → module inputs, outputs → serverOutputs)
```

## Rules

- **One running job per resource.** The claim query skips busy resources; the partial unique index `jobs_one_running_per_resource_uq` is the real guard.
- **Heartbeats and fencing.** A running job sends a heartbeat every `HEARTBEAT_TIMEOUT_S / 3`. A job whose heartbeat is older than `HEARTBEAT_TIMEOUT_S` is taken over by any worker (`attempts + 1`). Every write checks `attempts`, so a worker that lost its job cannot overwrite the new owner's result.
- **Never leave `provisioning`.** Every failure ends as `failed`. `UserError` messages are shown to the user; any other error shows a generic message and goes to the logs.
- **No HCL built from strings.** The run folder is JSON; user values go only into `terraform.tfvars.json`, which Terraform reads literally.
- **Each resource has its own run folder and state.** Never share state between resources. Never edit a run folder by hand.
- Terraform runs in its own process group, so Ctrl+C on the worker lets the current apply finish.
- Tests use a fake `Terraform` (job runner) or a fake binary (CLI runner), never real Docker.

## May import

`@mini-cloud/shared`, `@mini-cloud/db`. Never another app.

## Commands

```bash
npm run worker:dev        # needs the platform (npm run platform:up) and Terraform on PATH
```

Environment: `DATABASE_URL`, `BASE_DOMAIN`, `RUNS_DIR`, `TF_PLUGIN_CACHE_DIR`, `MODULES_DIR`, `TERRAFORM_BIN`, `POLL_INTERVAL_MS`, `HEARTBEAT_TIMEOUT_S`, `LOG_LEVEL` (see `src/config.ts`).

## Features

One handler per service: `src/features/<service>/`. Each has a `CLAUDE.md` linking to `docs/services/<service>.md`.

## Docs

- [Backend, worker section](../../docs/BACKEND.md)
- [Infra](../../docs/INFRA.md)
- [Services](../../docs/services/README.md)
