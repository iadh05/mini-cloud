# Console design system (atomic design)

Components are built in levels. A level may only import from the levels below it.
`npm run lint:deps` fails if an import goes up a level.

| Level        | What it is                              | Examples                                                              | May import               |
| ------------ | --------------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| `tokens/`    | Design values                           | colors, spacing, radius, fonts                                        | nothing                  |
| `atoms/`     | Smallest UI pieces, no business meaning | Button, Input, Badge, Icon, Spinner, Link                             | tokens                   |
| `molecules/` | A few atoms doing one job               | StatusBadge, FormField, CopyField, SearchBox, KeyValue                | atoms, tokens            |
| `organisms/` | A full section of a screen              | ResourceTable, TopBar, SideNav, ConfirmDialog, EmptyState, PageHeader | molecules, atoms, tokens |
| `templates/` | Page layouts with slots, no data        | ConsoleLayout, ListPage, DetailPage, Wizard                           | organisms and below      |

Pages live in `features/<service>/pages/`. They fetch data and fill a template.
Nothing in `ui/` imports from `features/`, `api/` or `app/`.

## Rules for new components

- Pick the lowest level that fits. Move it up only when it needs a higher-level piece.
- No data fetching and no feature names inside `ui/`. Data comes in through props.
- Colors, spacing, radius and fonts come from `tokens/`, never hard-coded.
- Every interactive element is keyboard reachable and has an accessible name.
