# 0002. TypeScript on Node.js for the control plane

- Status: Accepted
- Date: 2026-11-17

## Context
The API and worker are the core of the platform. The author already works in TypeScript and Node. The hard part of the project is the cloud, not the language.

## Decision
Write the API, the worker and the shared packages in TypeScript on Node.js (LTS).

## Consequences
- One language for API, worker and dashboard. Types are shared through `packages/shared`.
- The worker calls the Terraform CLI as a child process. Node is good at managing processes and streaming their output.
- Less exposure to Go, the language most cloud tools are written in. Reading Go source (Docker, Terraform) stays possible later.
- Node runs your code on one thread, so CPU-heavy work must stay out of the API process. It does: Terraform runs in its own process.

## Alternatives considered
- **Go:** best fit for cloud tooling and careers. Rejected for now: one language end to end keeps the control plane simple. Go may return for the host agent (Phase 9).
- **Java / Spring Boot:** mature, but uses more memory on a small VPS and needs more boilerplate.
- **Python / FastAPI:** quick to write, but no shared types with a React dashboard.
