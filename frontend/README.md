# Expert Hub — web client

The React SPA for Expert Hub: the trainer portal, the staff workspace and the
public trainer directory. It is Arabic-first and RTL by default, built on FADS
(the Financial Academy Design System, in `src/design-system/`), and follows the
DGA Platforms Code.

## Commands

```bash
npm ci
npm run dev              # http://localhost:5173/expert-hub/ (mock data unless apiBaseUrl is set)
npm run validate         # typecheck · lint (+ CSS token rules) · format · tests
npm run build            # → dist/  (served by the frontend container)
npm run storybook        # the design-system workshop
npm run tokens:generate  # regenerate tokens from references/figma/foundations/
```

## Stack

React 19 · TypeScript (strict, no `any`) · Vite 6 · React Router 7 · i18next ·
CSS Modules on design tokens (no CSS framework) · Vitest + Testing Library +
axe-core · Storybook 8.6 · ESLint 9 + Prettier 3.

Conventions and the folder map are in [`AGENTS.md`](AGENTS.md); the design
system's own rules are in [`src/design-system/AGENTS.md`](src/design-system/AGENTS.md).
