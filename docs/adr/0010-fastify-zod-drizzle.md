# 0010. Fastify, Zod and Drizzle for the API

- Status: Proposed
- Date: 2026-11-17

## Context
The API needs routing, input validation, database access and migrations. It must stay small enough to understand all of it.

## Decision
- **Fastify** for HTTP: fast, good TypeScript support, a plugin system, and built-in logging with Pino.
- **Zod** for validation, with `fastify-type-provider-zod` so route schemas produce typed handlers. The same schemas validate dashboard forms.
- **Drizzle ORM** for queries and migrations: TypeScript that reads like SQL, and plain `.sql` migration files you can read.

## Consequences
- One schema per resource type drives API validation, TypeScript types and forms.
- You still write and read real SQL, which matters for understanding the job queue and locking.
- Less hidden behavior than NestJS or Prisma, so more wiring by hand. Here that is acceptable: every piece stays visible.

## Alternatives considered
- **Express:** familiar, but older, untyped by default, and without built-in validation.
- **NestJS:** structured, but its decorators and dependency injection hide what is going on.
- **Hono:** excellent and light. Fastify has the more mature set of Node plugins.
- **Prisma:** great tooling, but a separate schema language and a heavier runtime.
