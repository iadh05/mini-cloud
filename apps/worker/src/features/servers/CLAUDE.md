# apps/worker · features/servers

Provisions servers: maps a stored `serverSpec` to the inputs of `infra/modules/server`, and the module outputs back to `serverOutputs`.

## Rules

- Parse the spec again with `serverSpec` before using it; an invalid spec is a `UserError` with a readable message.
- The image reference and its capabilities come from `SERVER_IMAGES` in `@mini-cloud/shared`, never from the spec directly.
- No SQL, no process spawning here: the job runner does that. A handler only maps data.
- Tests in `servers.handler.test.ts` need nothing external.

## Docs

- [Servers service](../../../../../docs/services/servers.md): spec, outputs, how it is provisioned
- [Backend, worker section](../../../../../docs/BACKEND.md)
- [Terraform module](../../../../../infra/modules/server/CLAUDE.md)
