# 0001. Record architecture decisions as ADRs

- Status: Accepted
- Date: 2026-11-17

## Context
This is a long-running project. Months from now, "why did we pick X?" will matter to anyone reading the repository.

## Decision
Every significant technical choice gets a short Architecture Decision Record in `docs/adr/`, numbered in order.

## Consequences
- Decisions are visible and reviewable.
- Changing a decision means writing a new ADR that supersedes the old one, so history is kept.
- Small cost: a few minutes per decision.

## Alternatives considered
- **Comments in code or the README only:** context gets lost and scattered.
- **No records:** fine for a weekend project, not for a project that runs for months.
