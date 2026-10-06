# FADS design system

## Overview

The Financial Academy Design System: every visual component both products use,
plus the tokens they are built from. Its visual source of truth is the official
Platforms Code Figma library, not this code — a component is correct when it
matches its Figma node. Products depend on it; it depends on no product.

## Key files

| File                                             | Owns                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `index.ts`                                       | The public surface — everything app code may import through `@ds`                                |
| `primitives/`, `composite/`, `shell/`, `layout/` | The components, one folder each, with a sibling `*.module.css` and a barrel `index.ts` per layer |
| `tokens/tokens.css`                              | The hand-maintained token layer                                                                  |
| `tokens/generated/tokens.css`                    | **Generated** from the Figma export — never hand-edit                                            |
| `tokens/tokens.ts`                               | The typed `token` accessor (`cssVar()`) for TypeScript                                           |
| `registry/figma-component-map.json`              | The single source for each component's Figma file, node id and resolution status                 |
| `providers/`                                     | `DirectionProvider`, `ThemeProvider`                                                             |

## Conventions

- Add a component here only to match a Figma component. Do not invent variants,
  approximate a design, or redesign an existing one.
- Tokens only: no hard-coded colour, spacing, type, radius, shadow or motion —
  `npm run lint:css` (DC-04) fails the build on a hex or `rgb()`.
- Logical CSS properties only, never `left`/`right` (DC-23).
- Every `var(--fads-*)` must resolve: `npm run tokens:check-coverage`.
- Regenerate tokens with `npm run tokens:generate`; validate with
  `npm run tokens:validate`.
- One component per implementation session, and only after live Figma
  verification, Storybook coverage, tests, registry update and documentation —
  the rule in the root `CLAUDE.md`.
- Every component works in RTL and LTR, and Storybook defaults to Arabic/RTL.
- Accessibility is part of the component, not the page: semantic elements,
  `jsx-a11y` clean, Storybook a11y addon at `test: 'error'`, and
  `expectNoA11yViolations` in tests.

## Gotchas

- **This folder may not import `@app`, `@layouts`, `@/pages`, `@/app` or
  `@/layouts`** — ESLint `no-restricted-imports` enforces the one-way dependency
  (`frontend/eslint.config.js:63-78`). A component that needs product knowledge
  is a product component, not a design-system one.
- **A change here touches both products.** It needs its own task and its own
  regression check across every consumer; never fold a design-system change into
  an Expert Hub feature.
- A missing component is a design-system gap to be ticketed, never a local build
  inside a product folder.
- Only the read-only Figma MCP tools may be used, and only with the node already
  recorded in `registry/figma-component-map.json`. If `nodeId` is missing, stop:
  "Manual node registration required." The Figma file is never modified.
- `tokens/` is excluded from the CSS lint, so a raw value added there is not
  caught by it — that is what the coverage check and review are for.
