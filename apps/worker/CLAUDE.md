# apps/worker — Provisioner

Takes jobs from Postgres (`FOR UPDATE SKIP LOCKED`), renders a Terraform run folder per resource, runs `terraform init/apply`, writes outputs and the new status back.

## Status

Stub. Built in MC-207.

## Design

- One job at a time per resource; jobs carry a `generation` so stale jobs are skipped.
- Every Terraform run gets its own folder under `RUNS_DIR`; never share state between resources.
- Terraform modules live in `infra/modules/<type>/`. The worker passes variables, it does not build HCL strings by hand.
- A failed step sets the resource to `failed` with the error message; it never leaves `provisioning` forever.
- Tests use a fake Terraform runner, never real Docker.

## May import

`@mini-cloud/shared`, `@mini-cloud/db`. Never another app.

## Commands

```bash
npm run dev -w @mini-cloud/worker
```

## Read first

`docs/BACKEND.md` (worker section), `docs/INFRA.md`.
