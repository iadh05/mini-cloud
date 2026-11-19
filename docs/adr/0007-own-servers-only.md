# 0007. Own servers only, no public cloud provider

- Status: Accepted
- Date: 2026-11-17

## Context
The first roadmap ended by adding AWS or Azure as a second provider. Your goal is an independent cloud, and reselling another provider's cloud does not fit that goal.

## Decision
Mini Cloud runs only on infrastructure it controls: your PC (Phases 0 to 6 and 8), a rented VPS (Phase 7 onward), and dedicated servers running real virtual machines (Phase 9 onward). No AWS, Azure or Google Cloud integration.

## Consequences
- The old "real cloud provider" phase becomes **Phase 9: dedicated servers and real VMs**. That is closer to how AWS itself works inside.
- No cloud bills or cloud credentials to protect beyond the VPS and the dedicated servers.
- AWS and Azure names stay in the docs as reference points, because they are the vocabulary of the industry.
- Less direct AWS or Azure experience to show on a CV. This can be revisited with a new ADR.

## Alternatives considered
- **AWS as Phase 9:** the most relevant for jobs. Rejected because it conflicts with the independence goal.
- **Azure as Phase 9:** rejected for the same reason.
- **Both, as an option:** postpones the decision and splits focus.
