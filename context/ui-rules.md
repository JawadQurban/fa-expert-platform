# UI Rules

**Function:** Describes the design system this project uses and the UI rules
every screen must satisfy. Loaded every session; `/fa:imprint` verifies new UI
against this file. Present-tense only.

---

## Design system

**FADS** — the Financial Academy Design System, in this repository at
`frontend/src/design-system/`, imported by app code through the **`@ds`** alias.
It is not an npm package: it is versioned with the repo, and its visual source of
truth is the official Platforms Code Figma component library, resolved through
`frontend/src/design-system/registry/figma-component-map.json`.

Layers, each with a barrel `index.ts`: **primitives** (~23 — Button, Icon, Field,
TextInput, Select, Checkbox, Radio, Switch, Tag, Tooltip, Avatar, Typography, …),
**composite** (~30 — Card, Table, Modal, Tabs, Accordion, Alert, Notification,
Toast, Steps, Pagination, EmptyState, ErrorState, FileUploader, DatePicker,
Rating, …), **shell** (Header, Footer, Breadcrumbs, NavDrawer), **layout**
(Container, Section), and the `DirectionProvider` / `ThemeProvider` providers.

**Tokens** live in `frontend/src/design-system/tokens/`. `generated/tokens.css`
is produced by `npm run tokens:generate` from the Figma export at
`references/figma/foundations/Values.tokens.json` — two tiers, `--fads-ref-*`
(the raw scale) and `--fads-sys-*` (semantic), reached from TypeScript through
the typed `token` object. Never hand-edit the generated file.

**How the rules below are enforced**

| Rule | Enforced by |
|---|---|
| Tokens only, no hard-coded colour | `npm run lint:css` — DC-04 |
| Logical CSS properties only | `npm run lint:css` — DC-23 |
| Every `var(--fads-*)` actually exists | `npm run tokens:check-coverage` |
| Design system never imports product code | ESLint `no-restricted-imports` (`eslint.config.js:63-78`) |
| Accessibility | `eslint-plugin-jsx-a11y`, Storybook's a11y addon with `test: 'error'`, and `expectNoA11yViolations` (axe-core) in tests |
| RTL | `LocaleProvider` sets `<html dir>` and `lang` together; Storybook defaults to Arabic/RTL with a toolbar toggle |

Arabic/RTL is the default everywhere, including Storybook; English/LTR is the
toggle, not the baseline.

## Rules

Edit to match the project. These are the FA defaults.

- Everything visual comes from the design system package. No local component
  that duplicates one it has; no raw element doing a component's job (a
  `<button>`, a `<table>`, a hand-built empty state).
- A missing component is a design-system gap: ticket to the design-system
  owner, never a local build.
- No hard-coded colors, spacing, type, radius, shadow or motion, including
  inline styles and computed values.
- Logical CSS properties only; no `left`/`right`.
- No hard-coded user-facing strings. Every string goes through the translation
  layer, Arabic and English both present.
- Order, icons and directionality behave in RTL and LTR.
- The right component for the job per `context/ui-patterns.md`: `Alert` vs
  `Notification` vs `Toast`, `Modal` vs page, `Tag` vs text.

## Consistency enforcement

Run `/fa:imprint` after building any UI. It verifies the screen against the
rules above and records its composition in `context/ui-patterns.md`.
