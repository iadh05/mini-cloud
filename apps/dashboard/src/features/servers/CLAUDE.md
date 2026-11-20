# Console: Servers

Servers list and create form.

| File                              | What                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `api.ts`                          | `useServers` (polls every 2 s while a server is changing), `useCreateServer`              |
| `pages/ServersListPage.tsx`       | `/servers`: loading, error, empty and table states                                        |
| `pages/CreateServerPage.tsx`      | `/servers/new`: form, then back to the list with a notification                           |
| `components/ServersTable.tsx`     | Name, status badge (with the error for failed rows), image, URL, created                  |
| `components/CreateServerForm.tsx` | Validated with `createServerInput` from `@mini-cloud/shared`; API errors mapped to fields |

## Rules

- Never import another feature. Shared UI goes down into `src/ui/`.
- Validation comes from `@mini-cloud/shared`, never rewritten here.
- Server data stays in TanStack Query; no copy in component state.

## Docs

- [Servers service](../../../../../docs/services/servers.md)
- [Frontend](../../../../../docs/FRONTEND.md)
