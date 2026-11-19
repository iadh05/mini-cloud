# 0004. Terraform CLI as the provisioning engine

- Status: Accepted
- Date: 2026-11-17

## Context
The worker must create, change and delete real infrastructure, reliably and repeatably. Writing direct Docker API calls for every resource type would mean rebuilding planning, diffing and state tracking by hand.

## Decision
For each resource, the worker generates a small `main.tf` that calls a module from `infra/modules/<type>`, then runs the Terraform CLI (`init`, `apply -json`, `output -json`, `destroy`). Each resource has its own working directory and its own state.

## Consequences
- Terraform handles diffing, ordering and idempotency, so the worker stays small.
- Terraform is the industry standard for provisioning, so the platform uses the same model as real clouds.
- Adding a service means adding a module, a Zod schema, API routes and a form.
- Each run costs a few seconds of overhead to start the process and load providers. A shared plugin cache reduces it.
- Things Terraform does badly (live logs, start and stop actions, reading metrics) go through the Docker API directly, still only from the worker.
- Terraform's license is the BSL. OpenTofu is an open-source drop-in replacement if that ever matters.

## Alternatives considered
- **The Docker API directly (dockerode):** simpler for containers, but no plan, diff or state, and it does not carry over to virtual machines in Phase 9.
- **Pulumi Automation API (TypeScript):** elegant, but it hides the HCL and state concepts we want to keep explicit.
- **Ansible:** good for configuring machines, weaker at tracking the lifecycle of resources.
