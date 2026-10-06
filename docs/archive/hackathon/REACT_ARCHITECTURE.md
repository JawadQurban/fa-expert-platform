# React Architecture (FADS Engineering)

> How the Financial Academy Design System and its consuming products are structured in **React 18 + TypeScript**. **Planning only — no code is written this phase** `[PROJ: TASK.md]`. Expands `DESIGN_SYSTEM_PLAN.md §2` to a full architecture for a **multi-product** system (Hackathon = consumer #1).

---

## 1. Guiding constraints `[S3]` `[PROJ]`
- TypeScript everywhere, strict mode, **no `any`** (`DESIGN_CONSTRAINTS.md DC-15`).
- Semantic HTML; accessibility first (DC-11).
- Tokens-only styling; no hard-coded values (DC-03).
- One-way dependency: **products → patterns → components → tokens** (never reverse).
- RTL/Arabic-first as a platform default, not a feature (DC-10/DC-23).

## 2. Package / directory boundaries

```
root/
  design-system/               ← FADS (reusable, product-agnostic)
    tokens/                     ← L1: CSS custom props + typed token map
    primitives/                 ← L2: Button, Link, Input, … (COMPONENT_INVENTORY §2)
    composite/                  ← L2: Card, Accordion, Modal, Table, …
    shell/                      ← L2: NavHeader, NavDrawer, Footer, Breadcrumbs, Search
    patterns/                   ← L3: MultiStepForm, EntityListFilter, FeedbackBlock, AppShell
    providers/                  ← Direction/Locale/Theme/Toast providers
    hooks/                      ← useDirection, useLocale, useMediaQuery, useFocusTrap
    i18n/                       ← catalog loader, ar/ en resources
    types/                      ← shared TS types (entities, tokens)
    testing/                    ← test utils, a11y helpers
  apps/ (or features/)          ← L4 product consumers
    hackathon/
      routes/                   ← route definitions (INFORMATION_ARCHITECTURE.md)
      pages/                    ← Landing, Submit, Requests, Feedback, FAQ, …
      features/                 ← submit-flow, manage-requests (compose patterns)
      content/                  ← hackathon message catalog + static content
```

- **Enforced rule (DC-20/DC-21):** `apps/*` imports from `design-system/*`; `design-system/*` never imports from `apps/*`. Verified by architecture tests / import-boundary lint.
- ⚠ Monorepo (workspaces) vs single-repo folder split vs published internal package — **Q24**.

## 3. Component design patterns
- **Composition over configuration:** small primitives → composite → patterns. Avoid mega-props.
- **Controlled + uncontrolled** support for form primitives; controlled default in forms.
- **Compound components** for structured widgets (e.g., `Accordion` + `Accordion.Item`, `Tabs` + `Tabs.Tab`, `Table` parts) for semantic + a11y clarity.
- **Polymorphic `as` sparingly**, only where it preserves semantics.
- **Slots** for flexible content regions in patterns (header/footer/actions).
- **Variants/states as typed unions**, mapped to component tokens (`cmp.*`) and DGA state names (`COMPONENT_INVENTORY §6`).
- **No inline styles** for design values; styling via token-driven CSS (CSS Modules or a zero-runtime CSS-in-JS — ⚠Q28), logical properties only (DC-23).

## 4. Providers & cross-cutting context

| Provider | Responsibility | Notes |
|---|---|---|
| `DirectionProvider` | sets `dir` (rtl default), exposes `useDirection` | drives icon mirroring (DC-25) |
| `LocaleProvider` | active locale + catalog, `lang`, formatters | ar primary (DC-10) |
| `ThemeProvider` | applies token theme (DGA light + On-Color) | single theme (Q22) |
| `ToastProvider` | app-level toast queue (CMP-22) | aria-live region |
| `A11yProvider` (optional) | skip-link, focus-visible policy, announce | — |

Providers are thin; heavy state lives per `STATE_MANAGEMENT.md`.

## 5. Routing
- **React Router** (SPA). Route inventory from `INFORMATION_ARCHITECTURE.md §5`.
- Route-level **code splitting** (lazy) per page (`PERFORMANCE_STRATEGY.md`).
- Breadcrumbs derive from the route tree → consistency with sitemap `[S3: E12]`.
- ⚠ Auth-guarded routes depend on the auth model — **Q4**.

## 6. Forms architecture (pattern PAT-01)
- **React Hook Form** (or equivalent) + schema validation (Zod/Yup) — ⚠Q29.
- Validation messages resolve from the catalog (Validation family, `CONTENT_MODEL §3`); consistent placement (DC-33 / `[S3: E16]`).
- Multi-step state persisted in the pattern; **Modal only for final confirm** (DC-13).
- Draft-save behavior ⚠Q16.

## 7. Data layer / API boundary
- A typed **service layer** abstracts data access; UI never calls fetch directly.
- Default to a **mock/stub adapter** until a backend is confirmed — **Q2**; the adapter interface is stable so swapping to a real API needs no UI change.
- Server-state handling in `STATE_MANAGEMENT.md`.

## 8. Internationalization wiring `[S3: F15, F16]`
- `react-i18next`/`react-intl` (⚠Q21) loaded via `LocaleProvider`.
- Catalog split by product; shared families in `design-system/i18n`.
- Direction flips with locale; number/date formatting per locale (`CONTENT_MODEL §5`).

## 9. Accessibility architecture `[G1]`
- Reusable a11y hooks: `useFocusTrap` (Modal/Drawer), `useId`, `useAnnouncer` (aria-live).
- Skip-to-content in `AppShell` (PAT-05).
- Focus management on route change and dialog open/close.
- Automated axe checks in component tests (`TESTING_STRATEGY.md`).

## 10. Build & tooling
- **Vite** (dev/build), TypeScript strict, ESLint + Prettier, import-boundary + design-constraint lint rules (DC enforcement).
- Component state showcase (Storybook or equivalent) — ⚠Q23.
- Testing: Vitest + Testing Library + axe + Playwright (`TESTING_STRATEGY.md`).
- Path aliases for `design-system/*` to keep imports clean and boundaries visible.

## 11. Coding conventions
- Function components + hooks only.
- Named exports for components; one component per file; colocated types/tests/stories.
- Props typed with explicit unions for variants/states; no boolean-prop explosion (prefer a `variant` union).
- No business logic in shell/presentational components; logic in hooks/services.

## 12. Open items
Q2 (API), Q4 (auth/routing), Q16 (drafts), Q21 (i18n lib), Q23 (showcase tool), Q24 (repo/distribution), Q28 (styling tech), Q29 (form/validation libs). See `QUESTIONS.md`.
