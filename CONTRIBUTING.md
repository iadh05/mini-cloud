# How work flows

Every change follows the same path, from ticket to `main`.

```
Ticket ──► Branch ──► Commits ──► Checks ──► Pull request ──► Review ──► Merge ──► Done
 Todo     In progress                          Review                            Done
```

## 1. Pick one ticket

- Tickets are named `MC-<phase><number>` (MC-201 is Phase 2, ticket 01).
- Only one ticket is **In progress** at a time.
- Move it to **In progress** when you start.

## 2. Branch

One branch per ticket, from an up-to-date `main`:

```bash
git switch main && git pull
git switch -c mc-201-monorepo-skeleton
```

Format: `mc-<number>-<short-name>`, lowercase, words joined by `-`.

## 3. Commit

[Conventional Commits](https://www.conventionalcommits.org/), ending with the ticket ID:

```
feat(api): create servers endpoint (MC-204)
fix(worker): release the job lock on failure (MC-207)
chore(repo): monorepo skeleton (MC-201)
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`. Scope: `api`, `worker`, `dashboard`, `shared`, `db`, `infra`, `repo`.

Small commits that each still pass the checks.

## 4. Run the checks

```bash
npm run check      # format, lint, architecture rules, typecheck, tests
```

| Check          | Tool                                              | Catches                                                                          |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `format:check` | Prettier                                          | Formatting differences                                                           |
| `lint`         | ESLint + typescript-eslint (strict, type-checked) | Bugs and unsafe code                                                             |
| `lint:deps`    | dependency-cruiser                                | Broken boundaries: app → app, console → database, atomic levels going up, cycles |
| `typecheck`    | TypeScript (strict)                               | Type errors in every workspace                                                   |
| `test`         | Vitest                                            | Failing tests                                                                    |

The same checks run in CI on every pull request. A red CI blocks the merge.

Run `npm run format` to fix formatting.

## 5. Open a pull request

- Title = the main commit message.
- Fill in the template: ticket, what changed, the ticket's **Done when** list, and how you demoed it.
- Move the ticket to **Review**.

## 6. Review and merge

- Go through each **Done when** item and tick it only after checking it.
- **Squash and merge**, then delete the branch.
- Move the ticket to **Done**.

## Local setup

```bash
cp .env.example .env       # then change the passwords
npm install
npm run db:up              # Postgres, waits until healthy
npm run check
```

Requirements: Node 26 (see `.node-version`), Docker, Terraform.
