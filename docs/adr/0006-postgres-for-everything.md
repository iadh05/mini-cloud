# 0006. PostgreSQL for app state, job queue and Terraform state

- Status: Proposed
- Date: 2026-11-17

## Context
The platform needs a database for desired state, a queue for jobs, and a safe place for Terraform state. Every extra system costs memory on the VPS and is one more thing to back up.

## Decision
Use one PostgreSQL instance for:
1. Application data: resources, users, audit log and so on.
2. The job queue: a plain `jobs` table read with `SELECT … FOR UPDATE SKIP LOCKED` in Phase 2, then **pg-boss**, a queue library built on Postgres, from Phase 3.
3. Terraform state, through Terraform's built-in `pg` backend, from Phase 3.

## Consequences
- One thing to run, monitor and back up. One `pg_dump` captures everything.
- A resource and its job are created in one transaction, so no job is lost or left without its resource.
- The queue mechanism (locking, retries) stays explicit before a library takes it over.
- Postgres becomes a single point of failure for the control plane. Acceptable for this project.
- It is not built for very high job rates. Thousands of jobs a day is fine.

## Alternatives considered
- **Redis + BullMQ:** popular and fast, but one more service, and no shared transaction with the resource row.
- **RabbitMQ or NATS for jobs:** too much for now. NATS appears in Phase 8 as a tenant service.
- **Terraform state on local disk:** fine for Phase 2, but no locking and no easy backup afterwards.
- **Terraform state in MinIO (S3 backend):** works, but MinIO is not added until Phase 4.
