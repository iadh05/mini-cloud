# 0012. Atomic design for the console UI

- Status: Accepted
- Date: 2026-11-19

## Context

The console will cover 39 services with the same patterns: resource tables, status badges, create wizards, detail pages, confirm dialogs. Without a structure, each service would copy and drift its own versions.

## Decision

Build the console UI with atomic design in `apps/dashboard/src/ui/`:

- **tokens**: colors, spacing, radius, fonts from the console design
- **atoms**: smallest pieces (Button, Input, Badge)
- **molecules**: a few atoms with one job (StatusBadge, FormField)
- **organisms**: full sections (ResourceTable, SideNav, ConfirmDialog)
- **templates**: page layouts with slots (ListPage, DetailPage, Wizard)

Pages live in `features/<service>/pages/`, fetch data and fill a template. A level only imports from levels below it, and `ui/` never imports features or the API layer. dependency-cruiser enforces these rules in `npm run check` and CI.

## Consequences

- A new service is mostly a page that fills existing templates.
- One change to an atom or organism updates every screen.
- Deciding the level of a new component takes a moment; when unsure, start lower and move it up.
