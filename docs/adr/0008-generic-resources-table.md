# 0008. One generic resources table with a typed spec

- Status: Proposed
- Date: 2026-11-17

## Context
The platform will have 22 resource types. They share a lifecycle (status, jobs, ownership, audit, billing), but each type has different settings.

## Decision
Store every resource in one `resources` table. Common columns: `id`, `type`, `name`, `project_id`, `status`, `generation` and timestamps. Two JSONB columns: `spec` for the desired settings and `outputs` for results such as URLs. Each type has a Zod schema in `packages/shared` that validates `spec` on every write.

## Consequences
- Adding a type needs no database migration: a new schema, a module and a form.
- One code path for lifecycle, jobs, permissions, audit and billing.
- It mirrors real clouds (resource IDs with typed properties) and Kubernetes (`spec` and `status`).
- The database does not enforce the fields inside `spec`. Validation must always happen in code, and queries on spec fields need JSONB indexes.

## Alternatives considered
- **One table per type (`servers`, `buckets` and so on):** strong database constraints, but 22 near-identical tables and repeated lifecycle code.
- **Entity-attribute-value tables:** flexible, but painful to query.
