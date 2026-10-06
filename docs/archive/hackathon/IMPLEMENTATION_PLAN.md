# Implementation Plan

> Phased build plan for the implementation phase (**not started** — begins only after approval of `PROJECT_READINESS_REPORT.md`) `[PROJ: TASK.md]`. Follows the `CLAUDE.md` workflow (analyze → spec → compliance → UX → IA → wireframe → components → React → a11y → final audit) `[PROJ]`.

---

## 1. Tech stack `[PROJ: CLAUDE.md]` + team defaults
| Concern | Choice | Rationale / source |
|---|---|---|
| Language | **TypeScript** | `[PROJ]` mandate |
| UI lib | **React 18** | `[PROJ]` mandate |
| Build | Vite | team default (DD-13) |
| Routing | React Router | SPA routes (`INFORMATION_ARCHITECTURE.md`) |
| i18n | react-i18next / react-intl | ⚠Q21 |
| Styling | CSS with DGA tokens (CSS vars) + logical properties | `[S3]` tokens, RTL |
| Forms | React Hook Form (or controlled) + schema validation | minimal-steps UX `[S3: E3]` |
| Data | Mock API / stub layer | ⚠Q2 (no confirmed backend) |
| Testing | Vitest + Testing Library + axe + Playwright | `TESTING_STRATEGY.md` |
| Component workshop | Storybook | ⚠Q23 |

## 2. Phase breakdown

### Phase 0 — Planning ✅ (this phase)
17 docs produced; readiness report pending approval.

### Phase 1 — Foundations & tooling
- Scaffold React+TS+Vite, ESLint/Prettier, routing shell.
- Implement **token layer** (CSS vars + typed map) from official values (**blocked on Q3/Q20**; use marked placeholders until then).
- RTL baseline (`dir="rtl"`, logical properties), font loading (Q7), i18n scaffold.
- **Exit:** app renders RTL Arabic shell with tokens wired.

### Phase 2 — Design-system components (build order per `COMPONENT_MAPPING.md §5`)
1. Shell: NavHeader, NavDrawer, Footer, Breadcrumbs.
2. Primitives: Button, Link, Text Input, Textarea, Dropdown, Checkbox, Radio, Switch, Tag, Tooltip, Avatar.
3. Composite: Card, Accordion, Tabs, Content Switcher, Table, Steps, File Uploader, Modal, Notification (Toast/Inline/banner), Rating, Pagination, Date Picker, Loading.
- Each with **all DGA states** + Storybook stories + unit + axe tests.
- **Exit:** component library complete, states verified vs Figma.

### Phase 3 — Pages / features
- Landing (hero + sections) → Submit flow (Steps) → Manage Requests (Table/detail) → FAQ → Feedback → Policies/Sitemap/Accessibility → 404.
- Wire mock data/API; message catalog from `CONTENT_STRUCTURE.md §4`.
- **Exit:** all flows in `USER_FLOW.md` operable end-to-end.

### Phase 4 — Accessibility audit
- Run `ACCESSIBILITY_CHECKLIST.md`: keyboard, screen reader (Arabic), contrast (real tokens), reflow, focus.
- **Exit:** WCAG 2.2 AA pass (G1).

### Phase 5 — Final DGA audit
- Verify `COMPLIANCE_MATRIX.md` fully; every applicable `[S3]` criterion satisfied; component states complete.
- **Exit:** sign-off; SC1 met.

## 3. Milestones & sequencing
```
M1 Foundations (Phase 1)        → shell renders RTL + tokens
M2 Component library (Phase 2)  → all DGA components + states
M3 Landing + Submit (Phase 3a)  → primary action works
M4 Manage + secondary (Phase 3b)→ secondary action + support pages
M5 A11y audit (Phase 4)         → WCAG 2.2 AA
M6 DGA audit + release (Phase 5)→ compliance sign-off
```

## 4. Dependencies & critical path
- **Critical blocker:** official token values (Q3/Q20) gate faithful Foundations; component structure can proceed with placeholders but final visual compliance cannot close until resolved.
- Template choice (Q1/Q6) gates landing structure.
- Backend decision (Q2) gates data layer (mock vs real).

## 5. Definition of Done (per feature)
- [ ] Uses only design-system components (no forks) `[G2]`
- [ ] All DGA states present `[S3]`
- [ ] Arabic-first + RTL correct `[S3]`
- [ ] Responsive at all tiers `[S3: F13]`
- [ ] WCAG 2.2 AA passes for the feature `[G1]`
- [ ] Consistent copy/terminology/errors `[S3: E15,E16]`
- [ ] Compliance-matrix rows updated

## 6. Risks feeding into `PROJECT_READINESS_REPORT.md`
Token unavailability, template ambiguity, backend undefined, evaluator/auth scope, English parity scope. All tracked in `QUESTIONS.md`.
