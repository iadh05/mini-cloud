# Tickets

Work is split into small tickets, grouped by phase. Only the current phase and the next two are written in detail. Later phases are listed as epics in [BACKLOG.md](BACKLOG.md) and get detailed tickets when we reach them.

## Board

| File | Phase | Tickets | Status |
|---|---|---|---|
| [PHASE-2.md](PHASE-2.md) | 2 — First version (Milestone 1) | MC-201 → MC-209 | Ready |
| [BACKLOG.md](BACKLOG.md) | 3 → 10 | Epics only | Not detailed |

Each ticket's status is in its own table. Update it when you start or finish a ticket.

## Ticket IDs

`MC-<phase><number>`: the first digit(s) are the phase. MC-201 is Phase 2, MC-1003 would be Phase 10.

## Ticket format

```markdown
### MC-XXX · Short imperative title

| Phase | Type | Size | Status | Depends on | Spec |
|---|---|---|---|---|---|
| 2 | build | S | Todo | MC-201 | FR-10 |

**Why** — one or two sentences: the problem this solves.

**Tasks**
- [ ] Step you do

**Done when** (acceptance criteria — each one checkable)
- [ ] Observable result

**Concepts** — the main technical concepts involved.

**Notes** — commands, links, gotchas. Filled in while working.
```

## Fields

| Field | Values |
|---|---|
| **Type** | `setup` (install/configure) · `spike` (prototype or experiment) · `build` (code for the platform) · `docs` (write-up) · `test` |
| **Size** | `S` ≤ 1 session · `M` 2–3 sessions · `L` 4+ sessions (split it if you can). A session is 1–2 hours. |
| **Status** | `Todo` → `In progress` → `Review` → `Done` (or `Blocked`) |

## Rules

1. One ticket **In progress** at a time.
2. A ticket is **Done** only when every "Done when" box is ticked.
3. `Review` means: the result is demoed and checked against every "Done when" box.
4. Found new work? Add a ticket at the end of the phase file. Don't silently grow an existing ticket.
