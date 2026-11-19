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
npm run check      # format, lint, architecture rules, typecheck, tests with coverage
```

| Check           | Tool                                                        | Catches                                                                                                                                               |
| --------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format:check`  | Prettier                                                    | Formatting differences                                                                                                                                |
| `lint`          | ESLint + typescript-eslint (strict, type-checked) + SonarJS | Bugs, unsafe code, code smells, cognitive complexity above 15                                                                                         |
| `lint:claude`   | script                                                      | A workspace or feature without a `CLAUDE.md`, a `CLAUDE.md` without a docs link, a feature not linking to `docs/services/<service>.md`, a broken link |
| `lint:deps`     | dependency-cruiser                                          | Broken boundaries: app → app, console → database, atomic levels going up, cycles                                                                      |
| `typecheck`     | TypeScript (strict)                                         | Type errors in every workspace                                                                                                                        |
| `test`          | Vitest                                                      | Failing tests                                                                                                                                         |
| `test:coverage` | Vitest + V8 coverage                                        | Lines, statements, functions or branches below 80%                                                                                                    |

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

## Git hooks (installed by `npm install`)

| Hook         | Runs                                                     | Blocks the commit or push when                     |
| ------------ | -------------------------------------------------------- | -------------------------------------------------- |
| `pre-commit` | lint-staged: ESLint `--fix` and Prettier on staged files | A staged file has a lint error or warning          |
| `commit-msg` | commitlint                                               | The message is not `type(scope): subject (MC-123)` |
| `pre-push`   | architecture rules, typecheck, tests                     | Any of them fails                                  |

Allowed scopes: `api`, `worker`, `dashboard`, `shared`, `db`, `infra`, `repo`, `ci`, `deps`, `docs`.

## CI pipeline (GitHub Actions)

Runs on every pull request and on every push to `main`. All jobs must be green to merge.

| Job                               | Checks                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Commit messages                   | Every commit in the pull request, and the pull request title (it becomes the squash commit)                 |
| Format, lint, architecture, types | Prettier, ESLint (zero warnings), dependency-cruiser, CLAUDE.md check, TypeScript                           |
| Tests                             | Vitest with coverage (80% minimum, report attached to the run), Postgres 18.7 service for integration tests |
| Platform starts                   | `docker compose up --wait` brings Postgres up healthy                                                       |

## Local setup

```bash
cp .env.example .env       # then change the passwords
npm install
npm run db:up              # Postgres, waits until healthy
npm run check
```

Requirements: Node 26 (see `.node-version`), Docker, Terraform.
