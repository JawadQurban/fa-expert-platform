# Expert Hub — Product & Repository Implementation Plan

**Document type:** Product + Technical Implementation Plan (audit → plan; **no application code in this session**)
**Business source of truth:** `BRD-TRN-001 v1.0` (Expert & Independent Trainer Management Platform)
**Design source of truth:** Existing FADS Design System (DGA "كود المنصات" / Platforms Code) under `frontend/src/design-system/` — **fixed and authoritative**
**Repo:** `financial-academy-hackathon` · **Frontend workspace:** `frontend/`
**Date:** 2026-07-19

> ⚠️ **Critical framing finding.** The repository currently hosts a **Hackathon** consumer product (innovation-idea submissions) built on the FADS Design System. The **Expert Hub** (BRD) is a **separate product** that will live on the **same** Design System and the **same** app conventions, but in its **own feature namespace and its own routes**. It must **not** reuse the Hackathon domain types, and it must **not** overwrite the existing Hackathon landing page (`frontend/src/pages/HomePage.tsx`) or the existing `/applications/*` Hackathon feature. See §2, §7, §10.

---

## 1. Repository Audit

Every finding below is anchored to an exact path (relative to repo root).

### 1.1 Framework & build tooling
- **React 19.1** + **React DOM 19.1** — `frontend/package.json`
- **TypeScript 5.7**, strict, no `any`, `noUnusedLocals/Parameters`, bundler resolution — `frontend/tsconfig.app.json`
- **Vite 6** build + dev; `tsc -b && vite build` — `frontend/package.json`, `frontend/vite.config.ts`
- **Path aliases:** `@`, `@app`, `@ds`, `@i18n`, `@lib`, `@hooks`, `@utils`, `@layouts` — mirrored in `frontend/vite.config.ts` and `frontend/tsconfig.app.json`
- **Manual vendor chunking** (`react`, `i18n`) + route-level code splitting — `frontend/vite.config.ts`
- **Node ≥ 20** — `frontend/package.json` `engines`
- **Tooling:** ESLint 9 (flat config) + `eslint-plugin-jsx-a11y` + `eslint-plugin-react-hooks` + `eslint-plugin-storybook`, Prettier 3, Husky + lint-staged — `frontend/eslint.config.js`, `frontend/.prettierrc.json`, `frontend/.husky/`
- **Custom guard scripts:** `scripts/verify-css-rules.mjs` (CSS lint), `scripts/generate-tokens.mjs`, `scripts/verify-tokens.mjs` — `frontend/scripts/`

### 1.2 Folder structure (frontend `src/`)
```
src/
  app/            cross-cutting composition: ErrorBoundary, providers/, router/
  design-system/  DS (primitives, composite, layout, shell, providers, tokens, registry)
  features/       product feature modules (currently: applications = Hackathon)
  layouts/        RootLayout (shared app frame)
  pages/          top-level routed pages (HomePage = Hackathon landing, NotFound)
  components/     app-level compositions (AppFooter)
  content/        static content data (branding, footer, hackathonLanding)
  i18n/           i18next config, LocaleProvider, ar/en resources
  lib/api/        transport adapter (mock/http, Result-typed)
  hooks/          useFocusTrap, useMediaQuery, usePrefersReducedMotion
  utils/          cn, env, format, mergeRefs
  types/          shared TS types (Locale, Direction, Result)
  test/           setup + test-utils
  assets/         icons (categorized), branding, social
```

### 1.3 Application entry points
- `frontend/src/main.tsx` — mounts `#root`, imports `@ds/tokens/global.css`, renders `<App/>` in `StrictMode`
- `frontend/src/App.tsx` — `<AppProviders><AppRouter/></AppProviders>` (no product UI at root)

### 1.4 Routing approach
- **`react-router-dom` 7.1**, data router via `createBrowserRouter` — `frontend/src/app/router/router.tsx`
- **Central route table** as `RouteObject[]`, lazy-loaded screens + `Suspense` fallback — `frontend/src/app/router/routes.tsx`
- **Central path registry** (single source of truth for links/breadcrumbs), incl. dynamic path builders — `frontend/src/app/router/paths.ts`
- **Barrel** re-exports `AppRouter`, `router`, `routes`, `paths` — `frontend/src/app/router/index.ts`
- **Feature sub-tree pattern:** a feature mounts a layout with nested children (see `applications` sub-tree in `routes.tsx`)

### 1.5 Layouts & shells
- **`RootLayout`** — minimal a11y frame: skip link + `<main id="main">` landmark; deliberately renders **no** Header/Footer (products compose the shell around `<Outlet/>`) — `frontend/src/layouts/RootLayout.tsx`
- **Feature layout pattern** — `frontend/src/features/applications/ApplicationsFeatureLayout.tsx` mounts feature providers (state + toast) once around `<Outlet/>`
- **DS shell components available** (not yet wired into RootLayout): `Header`, `Footer`, `Breadcrumbs`, `NavDrawer` — `frontend/src/design-system/shell/`
- **App-level footer composition** — `frontend/src/components/AppFooter.tsx`

### 1.6 Design System location & architecture
- Root: `frontend/src/design-system/`, single public barrel `frontend/src/design-system/index.ts` (import via `@ds` only — product code must not reach internal files)
- **Layers:** `primitives/` (L2) → `composite/` → `layout/` → `shell/`; plus `providers/`, `tokens/`, `registry/`
- **README / contract:** `frontend/src/design-system/README.md`

### 1.7 Token structure
- Authoring: `frontend/src/design-system/tokens/tokens.ts`, `tokens.css`
- **Generated** (do not hand-edit): `frontend/src/design-system/tokens/generated/` → `token-map.json`, `tokens.css`, `tokens.ts`
- Global + reset: `frontend/src/design-system/tokens/global.css`, `reset.css` (global.css imported in `main.tsx`)
- Pipeline: `npm run tokens:generate` / `tokens:check-coverage` / `tokens:validate` — `frontend/scripts/generate-tokens.mjs`, `verify-tokens.mjs`; test `tokens.test.ts`
- ⚠️ DS barrels flag **"Pending final DGA token values (Q3/Q20)"** — visual fidelity not finalized; structure/behavior/a11y are final

### 1.8 Component registry
- `frontend/src/design-system/registry/figma-component-map.json` — **82 entries** mapping components → Figma nodes, with `status`, `implemented`, `visualComplianceStatus`, `nodeResolutionStatus`, duplicate flags
- Node-resolution policy governs Figma MCP usage — `CLAUDE.md`

### 1.9 Approved / implemented components (by DS layer, from barrels + registry)
- **Primitives** (`frontend/src/design-system/primitives/index.ts`): Typography, Icon, Button, Link, Tag, Field, TextInput, NumberInput, InputPrefixSuffix, ButtonClose, FloatingButton, TrailingIcon, DropdownListItem, SearchBox, Textarea, Select, Checkbox, Radio+RadioGroup, Switch, Tooltip, Avatar, Divider
- **Composite** (`frontend/src/design-system/composite/index.ts`): Card, Accordion, Tabs, Alert, Notification, Loading, Pagination, Steps, EmptyState, ErrorState, Toast(+Provider/useToast), Modal, Table, FileUploader, DatePicker, ContentSwitcher, MenuListItem, Menu(+MenuSection), Rating
- **Layout** (`frontend/src/design-system/layout/index.ts`): Container, Section
- **Shell** (`frontend/src/design-system/shell/index.ts`): Header, Footer, Breadcrumbs, NavDrawer
- **Registry status snapshot:** ~50 Approved/Implemented; notable **Missing/NeedsConfirmation** items relevant to Expert Hub: `Table Header Cell - Sort`, `Table Header Cell - Filter`, `Structured List`, `List/List item`, `Metric`, `Second Nav Header`, `Nav Header Sub-Menu`, `Vertical Tab`, `TOC`, `Skeleton`, `Avatar Group`, `Digital Stamp`. (See §2 for BRD impact.)

### 1.10 Existing patterns
- Composite **state patterns already exist**: `EmptyState`, `ErrorState`, `Loading` — `frontend/src/design-system/composite/{EmptyState,ErrorState,Loading}/`
- Feature-level composition patterns live under the feature, not the DS (e.g. `ApplicationsTable`, `ApplicationStatusTag`, `ApplicationStatusHistory`, `ApplicationReviewSection`) — `frontend/src/features/applications/components/`

### 1.11 Form architecture
- DS provides form **primitives** (`Field` label/description/error wrapper, `TextInput`, `NumberInput`, `Select`, `Checkbox`, `Radio`, `Switch`, `Textarea`) and composites (`DatePicker`, `FileUploader`)
- **No form library** (react-hook-form / formik are **not** dependencies) — forms are hand-composed at the feature level. Reference implementation: `frontend/src/features/applications/pages/ApplicationFormPage.tsx` + feature `DropdownField.tsx`
- **Needs Verification:** exact validation wiring in `ApplicationFormPage.tsx` (manual vs. reducer-driven)

### 1.12 Validation approach
- **No schema/validation library** (zod / yup / valibot absent from `frontend/package.json`) — validation is manual/imperative at the feature layer
- **Needs Verification** — read `ApplicationFormPage.tsx` and `state/applications.reducer.ts` before standardizing an Expert Hub validation pattern

### 1.13 State management
- **No global store library** (no Redux/Zustand/Jotai/React-Query). Pattern = **React Context + `useReducer` per feature**
- Reference: `frontend/src/features/applications/state/ApplicationsProvider.tsx` + `applications.reducer.ts`, consumed via a `useApplications()` hook
- Cross-cutting providers composed in `frontend/src/app/providers/AppProviders.tsx`

### 1.14 Data-fetching approach
- **Transport abstraction** `ApiAdapter` returning `Result<T, ApiError>` (never throws to UI) — `frontend/src/lib/api/types.ts`
- **Mock/HTTP swap** via `VITE_API_BASE_URL` with **zero UI change** — `frontend/src/lib/api/index.ts` (`createMockAdapter` default, `createHttpAdapter` when base URL set)
- Feature currently bypasses the adapter with a **localStorage mock-service** — `frontend/src/features/applications/services/applications.mock-service.ts` (namespaced key `fads-hackathon:applications:v1`, latency simulation, shape validation)

### 1.15 Internationalization
- **i18next + react-i18next + browser language detector** — `frontend/src/i18n/config.ts`, `index.ts`, `locales.ts`, typing `i18next.d.ts`
- **`LocaleProvider`** owns active locale, sets `<html lang>`, drives direction on AR⇄EN flip — `frontend/src/i18n/LocaleProvider.tsx`
- Resources: `frontend/src/i18n/resources/ar/common.json`, `resources/en/common.json` (single `common` namespace today — will need per-feature namespaces)

### 1.16 RTL support
- **RTL is the default** via `DirectionProvider` (`defaultDirection = 'rtl'`, applies `dir` to `<html>`) — `frontend/src/design-system/providers/DirectionProvider.tsx`
- Hooks `useDirection`, `useIsRtl`; DS components use **CSS logical properties** (per barrel notes)

### 1.17 Accessibility approach
- Skip link + `<main>` landmark in `RootLayout`; `a11y.*` i18n keys
- **WCAG 2.2 AA** target — `CLAUDE.md`
- Lint: `eslint-plugin-jsx-a11y`; runtime audit: `axe-core` in tests; focus management hook `frontend/src/hooks/useFocusTrap.ts`; reduced-motion hook `usePrefersReducedMotion.ts`
- Storybook a11y addon `@storybook/addon-a11y`

### 1.18 Testing setup
- **Vitest 3** (jsdom) + **Testing Library** (react/dom/user-event) + `jest-dom` + `axe-core` — `frontend/vite.config.ts` (`test` block), `frontend/src/test/setup.ts`, `test-utils.tsx`
- Tests **colocated** (`*.test.tsx`), incl. router (`router.test.tsx`), providers, tokens, feature flow (`hackathonFlow.test.tsx`)
- Coverage v8; `npm run validate` = typecheck + lint + format:check + test

### 1.19 Storybook setup
- **Storybook 8.6 (react-vite)** with essentials/a11y/interactions — `frontend/.storybook/`, built output `frontend/storybook-static/`
- **DS components only** (`*.stories.tsx` under `design-system/`); intro `frontend/src/Introduction.mdx`. **Application pages are not Storybook subjects** (per session rule 16)

### 1.20 Existing application pages (must be preserved — rule 18)
- **Hackathon landing** — `frontend/src/pages/HomePage.tsx` (+ `.module.css`, content in `frontend/src/content/hackathonLanding.ts`)
- **404** — `frontend/src/pages/NotFound.tsx`
- **Hackathon Applications feature** (idea-submission domain) — `frontend/src/features/applications/` (routes `/applications`, `/applications/new`, `/applications/:id`, `/applications/:id/edit`)

### 1.21 Reusable utilities
- `frontend/src/utils/`: `cn.ts` (class merge), `env.ts` (typed env incl. `apiBaseUrl`), `format.ts` (formatting), `mergeRefs.ts`
- `frontend/src/hooks/`: `useFocusTrap`, `useMediaQuery`, `usePrefersReducedMotion`
- `frontend/src/lib/api/`: transport adapter + `Result`/`ApiError`
- `frontend/src/content/`: content-data separation (`branding.ts`, `footer.ts`)

---

## 2. Design System Reuse Assessment

**Rule:** treat the DS as fixed; do not create a second DS, duplicate, or modify approved components this session. Application-specific compositions belong to a **feature** or a **shared application pattern** layer — **not** the DS — unless truly reusable across products.

Status legend: **Ready to Reuse** · **Reusable with Composition** · **Needs Application Pattern** · **Missing Design System Component** · **Needs Verification**

| BRD capability | Required UI pattern | Existing component / pattern (`@ds`) | Reuse status | Missing / gap | Recommendation |
|---|---|---|---|---|---|
| CAP-01 Application | Multi-service dynamic form | Field, TextInput, Select, Checkbox, Radio, Textarea, FileUploader, DatePicker, Steps | Reusable with Composition | Conditional field-visibility engine; no form lib | Build **application form pattern** at feature level (schema-driven fields), reuse DS inputs |
| CAP-01 Application | Attachment upload + validation | FileUploader (single/multiple) | Ready to Reuse | — | Reuse; wire size/type validation in feature |
| CAP-01/04 | Application status tag | Tag | Ready to Reuse | Status→variant mapping | Feature-level `StatusTag` mapping (exists for Hackathon; build Expert Hub equivalent) |
| CAP-01/02 | Application status timeline | — (Hackathon `ApplicationStatusHistory` at feature level) | Needs Application Pattern | No DS timeline | Feature-level timeline pattern; consider `Steps` (vertical) as base |
| CAP-02 Screening | Scoring review screen | Card, Table, Tag, Divider, Typography | Reusable with Composition | `Metric` (registry: Missing) | Compose from Card/Table; treat metric tiles as feature pattern until DS `Metric` approved |
| CAP-02 Screening | Sequential approval / committee flow | Steps, Alert, Modal, Notification | Reusable with Composition | — | Feature workflow pattern over DS primitives |
| CAP-02 | Interview scheduling (slot pick) | DatePicker, Radio, Card, Button | Reusable with Composition | — | Feature pattern |
| CAP-03 Agreement | Agreement list + status + history | Table, Tag, Card, Alert | Reusable with Composition | Table sort/filter cells (registry: Missing) | Reuse Table; defer server sort/filter until cells approved or do client-side |
| CAP-04 Profile | Comprehensive profile view | Card, Tabs, Avatar, Tag, Rating, Divider, Table | Reusable with Composition | Avatar Group (Missing) | Feature **Profile pattern**; single avatar fine |
| CAP-04 Profile | Self-update editable fields | Field + inputs, Switch, Modal | Reusable with Composition | Locked-field affordance | Feature pattern; lock via disabled + helper text |
| CAP-04 Profile | Trainer evaluations (read) | Rating, Table, Tag | Ready to Reuse | — | Reuse; read-only |
| CAP-05 Assignment | Assignment request form | Field, Select, DatePicker, Textarea | Reusable with Composition | — | Feature form pattern |
| CAP-05 Assignment | 3-candidate shortlist / matching results | Card, Table, Tag, Avatar, Button | Reusable with Composition | — | Feature pattern |
| CAP-05 Assignment | Offer accept/reject | Alert, Modal, Button, Notification | Ready to Reuse | — | Reuse |
| CAP-06 Entitlements | Entitlement list (read-only, ERP) | Table, Tag, Card | Ready to Reuse | — | Reuse; read-only |
| CAP-07 Comms | In-platform notifications | Notification, Toast(+Provider), Alert | Ready to Reuse | — | Reuse |
| CAP-07 Comms | Notification/deadline admin matrices | Table, Select, Switch, Modal | Reusable with Composition | Table sort/filter cells (Missing) | Feature admin pattern; client-side sort meanwhile |
| CAP-08 Access | Role×permission matrix, user mgmt | Table, Checkbox, Switch, Modal, Tag | Reusable with Composition | Table sort/filter cells (Missing) | Feature admin pattern |
| CAP-09 Analytics | Dashboards, KPI tiles, reports | Card, Table, Tabs, Divider | Needs Application Pattern | `Metric` (Missing); **no charting lib** | Decide charting approach (Blocking §10); `Metric` may warrant DS proposal (cross-product) |
| CAP-10 Public | Marketing landing | Section, Container, Card, Button, Typography, Header, Footer | Ready to Reuse | — | Compose Expert Hub landing at page level (new route, do not touch HomePage) |
| CAP-10 Public | Trainer directory + specialty filter | Card, SearchBox, Select, Tag, Pagination, Avatar | Reusable with Composition | — | Feature directory pattern |
| CAP-10 Public | Public profile (read) | Card, Avatar, Tag, Typography | Ready to Reuse | — | Reuse |
| All | App shell (header/nav/footer/breadcrumbs) | Header, NavDrawer, Footer, Breadcrumbs | Reusable with Composition | Second Nav Header / sub-menu (Missing) | Build **Expert Hub shell layout** composing DS shell; multi-level nav may need DS additions later |
| All | Loading / empty / error states | Loading, EmptyState, ErrorState | Ready to Reuse | Skeleton (Missing) | Reuse; use Loading spinner until Skeleton approved |
| All | Role-based routing/guards | — | Needs Application Pattern | No auth/guard util | App-level route-guard pattern (consumes Academy SSO, Q-auth) |

**DS-component proposals worth escalating (cross-product, not this session):** `Metric` tile, `Skeleton`, `Table Header Cell - Sort/Filter`, `Structured List`, multi-level `Nav Header Sub-Menu`. These are **candidates** for the DS backlog because they recur across Expert Hub *and* the Hackathon product — but they require the DS/Figma approval workflow (`CLAUDE.md`), not ad-hoc creation.

---

## 3. BRD Product Structure

*(Full detail in `01_PRODUCT_DISCOVERY.md`; summarized here for traceability.)*

- **Actors** (BRD §4, §8.8): Trainer Management Employee; Trainer Management Manager; Center Coordinator; System Administrator; Senior Management; Trainer/Expert (self-service). Non-role actors: Speaker (internal record, no login), Public Visitor. **6 fixed roles** (CAP-08).
- **Business capabilities** (BRD §7.2): CAP-01 Application · CAP-02 Screening & Evaluation · CAP-03 Agreement & Contract · CAP-04 Trainer Profile · CAP-05 Assignment & Matching · CAP-06 Entitlement (ERP) · CAP-07 Communication · CAP-08 Access & Permissions · CAP-09 Analytics · CAP-10 Public Presence · CAP-11 Professional Community *(deferred)* · CAP-12 Integration.
- **Product modules** (see `01_PRODUCT_DISCOVERY.md` §6): Identity & Access; Integration Hub; Communication; Application; Screening & Accreditation; Agreement; Trainer Profile; Assignment & Matching; Entitlements; Public Presence; Analytics.
- **Main journeys** (BRD §7 of Discovery): J1 Join & Accreditation · J2 Add-Service · J3 Agreement Lifecycle · J4 Assignment & Execution · J5 Entitlements · J6 Public Discovery/Visibility · J7 Speaker · J8 Admin & Governance.
- **Core entities** (BRD §8/§9): Basic Profile, Join Application, Speaker Record; CTQ Matrix, Evaluation Result, Interview Form/Result; Agreement, Annex; Trainer Profile, Trainer Evaluations; Assignment Request, Matching Matrix, Engagement; Entitlement; Notification Matrix/Template/Log, Deadline Matrix; Permission/Role/User/Audit Log; Metric/Dashboard/Report; Public Profile, Visibility Consent; Integration registry/log.
- **Business rules:** ~70 `BR-xxxx` across capabilities (e.g. one active application `BR-0101`; ref number at submit only `BR-0107`; unified agreement + annex `BR-0305`; exactly 3 candidates `BR-0505`; entitlement fully ERP-sourced `BR-0601`; single primary-language notifications `BR-0707`; RBAC-only `BR-0801`; single source of truth `BR-1201`). Locked decisions catalogued in `DECISIONS.md`.
- **Integrations** (BRD §8.12): INT-01 Academy Site/SSO (bidirectional → CAP-08/10) · INT-02 Trainee Evaluation (inbound → CAP-04) · INT-03 ERP (inbound → CAP-06) · INT-04 Email Gateway (outbound → CAP-07) · INT-05 FAST (bidirectional → CAP-04/05).
- **NFRs** (BRD §10–11): 3s response (*), near-real-time dashboards, peak load; encryption, KSA data protection, no stored credentials, immutable audit; 99.5% uptime (*), daily backup; RTL, localization, language persistence, mobile; DGA design system. *(Full table in `01_PRODUCT_DISCOVERY.md` Appendix A.)*

---

## 4. Full Platform Information Architecture

Proposed IA for the three interfaces (**full platform**, not just Release 1). Routes proposed in §7. This is a proposal; it does not alter existing Hackathon IA.

### 4.1 Public Interface (unauthenticated — CAP-10)
- **Primary nav:** Home (Expert Hub landing) · Trainer Directory · About/Join CTA · Language toggle (AR/EN)
- **Pages:** Expert Hub Marketing Landing; Trainer Directory (filter by specialty); Public Trainer Profile (detail); Join/Apply entry (routes to portal application)
- **Detail pages:** Public Trainer Profile `/:trainerId`
- **Forms:** none (directory is read-only; apply hands off to authenticated flow)
- **Settings:** none

### 4.2 Trainer Portal (authenticated trainer — CAP-01/03/04/05/06/10-consent)
- **Primary nav:** Dashboard/Home · My Applications · My Profile · My Assignments · My Entitlements · Notifications
- **Secondary nav:** within Profile (Overview · Services & Specialties · Programs History · Evaluations · Visibility) ; within Applications (list · detail · new/add-service)
- **Pages:** Portal Home (personal metrics); My Applications (list); My Profile; My Assignments (offers + confirmed); My Entitlements; Notifications
- **Detail pages:** Application Details `/:applicationId`; Assignment/Offer Details `/:engagementId`
- **Forms:** New Application (multi-service); Add-Service request; Profile self-update; Interview slot selection; Agreement signature; Assignment accept/reject/apology; Material upload (training)
- **Settings:** Account (self data — CAP-08 `US0806`); Visibility consent; Language/notification preferences
- **Role-specific areas:** all under `trainer` role

### 4.3 Internal Portal (staff — CAP-01→09)
- **Primary nav (role-filtered):** Dashboard · Applications & Screening · Committee · Agreements · Trainer Profiles · Assignments · Entitlements · Speakers · Communications · Access & Roles · Analytics · Integrations · Settings
- **Secondary nav:** per module (e.g. Applications: Inbox · Screening queue · Interview eval · Committee queue · Agreement prep)
- **Pages:** Operational dashboards (per role); Application inbox; Screening detail; Interview evaluation; Committee decision; Agreement management; Trainer profile (comprehensive) + search/filter; Assignment request + matching; Entitlements ledger; Speaker records; Notification matrix / templates / deadlines console; Role×permission matrix + user management; Analytics dashboards + reports; Integration registry + logs
- **Detail pages:** Application detail (internal); Trainer profile detail; Assignment detail; Agreement detail; Speaker detail; User detail
- **Forms:** Internal nomination; screening decision; interview evaluation; committee approval; agreement prep + approver sequence; renewal/suspend/terminate; annex; assignment request; manual candidate selection; cancellation; speaker create/update; template/matrix/deadline editors; role/permission editors
- **Settings (admin):** field-mandatory maps; scoring/interview models; notification matrix; deadlines/SLAs; roles & permissions; integration config
- **Role-specific areas:** Employee (operational) · Manager (+approvals) · Coordinator (own-center assignments only) · Admin (config) · Senior Mgmt (read/export analytics only)

---

## 5. Full Screen Inventory (master)

**Priorities:** P0 (Release-1 spine + must-have foundations) · P1 · P2 · Deferred.
**Interface:** PUB (Public) · TP (Trainer Portal) · INT (Internal).
**Components** column lists the primary `@ds` reuse (compose at feature level).

| ID | Name | Iface | Persona | Capability | User stories | Purpose | Main actions | DS components | Dependencies | Priority | Release |
|---|---|---|---|---|---|---|---|---|---|---|---|
| EH-PUB-01 | Expert Hub Landing | PUB | Visitor | CAP-10 | US1001 | Introduce platform | Explore, CTA to apply | Section, Container, Card, Button, Header, Footer, Typography | Shell layout, i18n | **P0** | R1 |
| EH-PUB-02 | Trainer Directory | PUB | Visitor | CAP-10 | US1002 | Browse consented trainers | Filter by specialty, open profile | Card, SearchBox, Select, Tag, Pagination, Avatar | CAP-04 public projection | P1 | R2 |
| EH-PUB-03 | Public Trainer Profile | PUB | Visitor | CAP-10 | US1004 | Read public profile | View | Card, Avatar, Tag, Typography | CAP-04, consent | P1 | R2 |
| EH-TP-01 | Portal Home | TP | Trainer | CAP-09 | US0906 | Personal overview | View metrics, navigate | Card, Table, Divider | Auth, CAP-04/06 | P1 | R2 |
| EH-TP-02 | My Applications | TP | Trainer | CAP-01/04 | US0104, US0410 | Track applications | View list, open, start new | Table, Tag, Button, EmptyState, Loading | Auth, CAP-01 data | **P0** | R1 |
| EH-TP-03 | Application Details | TP | Trainer | CAP-01/02/03 | US0104, US0205, US0215 | Track one application end-to-end | View status/history, pick interview slot, sign agreement | Card, Tag, Steps, Alert, Button, Modal, DatePicker | Aggregated CAP-02/03 status | **P0** | R1 |
| EH-TP-04 | My Profile | TP | Trainer | CAP-04 | US0403/0405/0406/0408 | View + self-update profile | Edit allowed fields, view services/evals | Card, Tabs, Avatar, Tag, Rating, Field, inputs | Auth, CAP-04 | **P0** | R1 |
| EH-TP-05 | New Application (multi-service) | TP | Applicant/Trainer | CAP-01 | US0101/0102/0103 | Submit join application | Select services, fill dynamic fields, upload, submit | Field, Select, Checkbox, Textarea, FileUploader, Steps | Field-map config (DM-GAP-01) | P1 | R2 |
| EH-TP-06 | Add Service | TP | Trainer | CAP-01 | US0106 | Request extra service | Fill delta fields, submit | Field, Select, FileUploader | CAP-04, CAP-03 | P1 | R2 |
| EH-TP-07 | My Assignments / Offers | TP | Trainer | CAP-05 | US0505/0509/0510 | Respond to offers, follow confirmed | Accept/reject, apologize, upload material | Card, Alert, Modal, Button, FileUploader | CAP-05, FAST | P1 | R2 |
| EH-TP-08 | My Entitlements | TP | Trainer | CAP-06 | US0601 | View disbursements | View list | Table, Tag, Card | ERP (INT-03) | P2 | R3 |
| EH-TP-09 | Notifications | TP | Trainer | CAP-07 | US0701 | See notifications | Read | Notification, Toast | CAP-07 | P2 | R3 |
| EH-TP-10 | Account & Visibility | TP | Trainer | CAP-08/10 | US0806, US1003 | Manage account + directory consent | Toggle consent, edit account | Switch, Field, Card | Auth, CAP-10 | P2 | R3 |
| EH-INT-01 | Internal Dashboard | INT | Employee/Mgr | CAP-09 | US0901/0902 | Operational overview | View KPIs | Card, Table, Tabs | Analytics | P1 | R2 |
| EH-INT-02 | Application Inbox | INT | Employee | CAP-01 | US0105 | Manage incoming apps | Nominate, open | Table, Tag, Button, SearchBox | CAP-01 | P1 | R2 |
| EH-INT-03 | Screening Detail | INT | Screening Mgr | CAP-02 | US0201/0203/0204 | Score + decide | View score, accept/reject, attach slots | Card, Table, Tag, Alert, Modal | Scoring model (DM-GAP-02) | P1 | R2 |
| EH-INT-04 | Interview Evaluation | INT | Employee | CAP-02 | US0206/0207 | Record interview result | Fill form, route/reject | Field, Select, Textarea, Steps | Interview model (DM-GAP-03) | P1 | R2 |
| EH-INT-05 | Committee Decision | INT | Committee | CAP-02 | US0208/0209/0210 | Sequential approval | Approve/reject | Steps, Alert, Card, Button | Approver config | P1 | R2 |
| EH-INT-06 | Agreement Management | INT | Manager | CAP-03 | US0301–0306 | Manage lifecycle | Renew/suspend/terminate/annex | Table, Tag, Modal, Alert | CAP-03 | P1 | R2 |
| EH-INT-07 | Trainer Profiles (search) | INT | Employee | CAP-04 | US0402/0414/0415 | Find/inspect trainers | Search, filter, open | Table, SearchBox, Select, Tag, Pagination | CAP-04 | P1 | R2 |
| EH-INT-08 | Trainer Profile (comprehensive) | INT | Employee | CAP-04 | US0402/0404/0407/0409 | Full trainer view | Review all data | Card, Tabs, Table, Rating, Tag | CAP-04, INT-02/05 | P1 | R2 |
| EH-INT-09 | Assignment Request + Matching | INT | Coordinator/Employee | CAP-05 | US0501/0502/0503/0504 | Create request, nominate | Auto/manual nominate, send 3 | Card, Table, Tag, Avatar, Button | CAP-04, matching (DM-GAP-05) | P1 | R2 |
| EH-INT-10 | Entitlements Ledger | INT | Employee | CAP-06 | US0602 | View disbursements | View/link | Table, Tag, Card | ERP (INT-03) | P2 | R3 |
| EH-INT-11 | Speaker Records | INT | Employee | CAP-04 | US0417/0418/0419 | Manage speakers | Create/update/search | Table, Field, SearchBox, Modal | CAP-04 | P2 | R3 |
| EH-INT-12 | Notification Matrix / Templates | INT | Admin | CAP-07 | US0702/0703/0705 | Configure comms | Edit matrix/templates/log | Table, Select, Modal, Switch | CAP-07 | P2 | R3 |
| EH-INT-13 | Deadlines / SLA Console | INT | Admin | CAP-07 | US0704 | Manage SLAs centrally | Edit deadlines | Table, Field, Switch | CAP-07 | P2 | R3 |
| EH-INT-14 | Roles & Permissions | INT | Admin | CAP-08 | US0801/0802/0805 | RBAC config + audit | Edit matrix, assign roles, view audit | Table, Checkbox, Switch, Modal | CAP-08 | P1 | R2 |
| EH-INT-15 | Analytics Dashboards | INT | Mgr/Senior | CAP-09 | US0901/0903/0904/0905 | KPIs + reports | View, export | Card, Table, Tabs | All caps | P2 | R3 |
| EH-INT-16 | Integration Registry / Logs | INT | Admin | CAP-12 | — | Govern integrations | View registry/logs | Table, Tag, Alert | CAP-12 | P2 | R3 |
| EH-*-00 | Not Found / Unauthorized | All | All | CAP-08 | — | Error routing | Navigate home | ErrorState, Button | Router | **P0** | R1 |

*(Deferred: CAP-11 Professional Community — no screens until scoped.)*

---

## 6. Initial Four-Page Scope

These four are the **beginning of the full Expert Hub Trainer Portal + Public interface**, not demos. They must use the existing shell/routing conventions (§7) and reuse `@ds` only (§2). **Do not design or build them this session.**

> **Route/namespace note:** `/applications/*` is already the Hackathon feature. Expert Hub pages need their own namespace (§7 proposes `/expert-hub/...` with a portal sub-tree). "My Applications" = Expert Hub join-applications, **not** Hackathon idea-applications.

### 6.1 Landing Page (EH-PUB-01)
- **User goal:** Understand Expert Hub and how to join.
- **Business goal:** Drive qualified applications; trusted public presence (BRD driver "حضور مؤسسي موثوق").
- **BRD traceability:** CAP-10, `US1001`, `BR-1001`, `BR-1008` (static, admin-updated, independent of any trainer's data).
- **Sections:** Hero + value proposition; who it's for (5 service types, BRD §6); how it works (journey overview); CTA to apply; link to Trainer Directory; footer.
- **Main actions:** "Apply / Join", "Browse Directory", language toggle.
- **States:** static content → primarily **default**; **loading** minimal (content is local/CMS-less per `BR-1008`); **error** only if content source fails (future).
- **Empty:** n/a (static). **Loading:** none/instant. **Error:** generic ErrorState if wrapped in future CMS.
- **Responsive:** mobile-first, RTL-first (`NFR-26/29`).
- **Accessibility:** landmark structure, heading order, skip link (RootLayout), AA contrast.
- **Reuse:** `Section`, `Container`, `Card`, `Button`, `Typography`, `Header`, `Footer`, `Divider`.
- **App-specific patterns:** Expert Hub **shell layout** (compose DS Header/Footer); landing content module in `content/`.
- **Backend deps:** none for R1 (static). Later: CAP-10 landing content if CMS-managed.

### 6.2 My Applications (EH-TP-02)
- **User goal:** Track all my join applications and their status in one place.
- **Business goal:** Trainer self-service; reduce manual status inquiries (BRD driver "تحسين تجربة المدرب").
- **BRD traceability:** CAP-01/CAP-04, `US0104`, `US0410`; status is **aggregated live** from CAP-02/03 (`BR-0108`); one active application (`BR-0101`); reference number only after submission (`BR-0107`).
- **Sections:** list/table of applications (reference, services, status, dates); primary CTA "New Application" (respecting one-active-application rule); filters (later).
- **Main actions:** open an application; start new (guarded by `BR-0101`).
- **States:** **populated** (list); **empty** (no applications → EmptyState + CTA); **loading** (Loading); **error** (ErrorState + retry).
- **Empty:** "No applications yet" + Apply CTA. **Loading:** skeleton/spinner (Loading; Skeleton is Missing in DS). **Error:** ErrorState with retry.
- **Responsive:** table → stacked cards on mobile; RTL.
- **Accessibility:** table semantics, row focus, status conveyed by text + Tag (not color alone).
- **Reuse:** `Table`, `Tag`, `Button`, `EmptyState`, `ErrorState`, `Loading`, `Card`, `Pagination`.
- **App-specific patterns:** Expert Hub `ApplicationStatusTag` mapping (status→variant); applications list pattern (model after Hackathon `ApplicationsTable` but **new types**).
- **Backend deps:** list endpoint; aggregated status source (CAP-02/03); per-service metadata.

### 6.3 Application Details (EH-TP-03)
- **User goal:** See one application's full state and take the next required action.
- **Business goal:** Move applicants through the funnel with minimal manual coordination.
- **BRD traceability:** CAP-01/02/03; `US0104` (reference/track), `US0205` (pick interview slot from portal), `US0215` (sign agreement + upload); status aggregation `BR-0108`; interview-slot selection in portal `BR-0206`; applicant signature → Approved `BR-0214`.
- **Sections:** header (reference, services, current status); status timeline/history; per-service outcome; contextual action panel (interview slot selection when applicable; agreement view/sign when applicable); attachments.
- **Main actions:** select interview slot; sign agreement + upload signed copy; view attachments; (read-only otherwise).
- **States:** varies by lifecycle stage — Draft, Submitted, Screening, Awaiting interview confirmation, Interview eval, Committee, Approved/Rejected, Agreement stages.
- **Empty:** n/a (detail always has a record) — handle **not-found** application → ErrorState/redirect. **Loading:** Loading. **Error:** ErrorState + retry.
- **Responsive:** two-column → single column; RTL.
- **Accessibility:** step/timeline semantics, focus on action panel, live region for status changes.
- **Reuse:** `Card`, `Tag`, `Steps`, `Alert`, `Button`, `Modal`, `DatePicker`, `FileUploader`, `Divider`.
- **App-specific patterns:** status timeline pattern; stage-driven action panel.
- **Backend deps:** get-by-id; interview slots; agreement document + signature upload; aggregated status.

### 6.4 My Profile (EH-TP-04)
- **User goal:** View my full profile and update the fields I'm allowed to.
- **Business goal:** Keep the single source of truth (CAP-04) current for matching/decisions.
- **BRD traceability:** CAP-04; `US0403` (self-update allowed fields), `US0405` (approved services/specialties), `US0406` (programs history), `US0408` (my evaluations); locked fields (classification/evaluations/contract) `BR-0411`; self-update via same fields, no new form `BR-0404`.
- **Sections:** identity/summary (Avatar, name, contact); Services & Specialties (read-only approved scope); editable personal/professional fields + certificates/attachments; Programs history; Evaluations (read-only Rating); (Visibility consent link → CAP-10).
- **Main actions:** edit allowed fields; upload certificates; save.
- **States:** **view** (default); **edit** (form); **saving** (Loading); **success** (Toast); **error** (ErrorState/inline).
- **Empty:** empty sub-sections (no programs/evals yet) → inline EmptyState. **Loading:** Loading. **Error:** ErrorState + retry; inline field errors.
- **Responsive:** tabbed/stacked; RTL.
- **Accessibility:** locked fields clearly disabled + explained; form labels via `Field`; save feedback via Toast + live region.
- **Reuse:** `Card`, `Tabs`, `Avatar`, `Tag`, `Rating`, `Field`, `TextInput`, `Textarea`, `Select`, `FileUploader`, `Divider`.
- **App-specific patterns:** profile section pattern; locked-field affordance.
- **Backend deps:** get profile; update-allowed-fields; certificates upload; services/specialties (CAP-02 source); evaluations (INT-02); programs (FAST/INT-05).

---

## 7. Routing Plan

Follows existing conventions: central `RouteObject[]` table (`routes.tsx`), lazy screens + `Suspense`, path registry (`paths.ts`), feature layout sub-trees. **Preserves** existing Hackathon routes.

**Namespace recommendation:** mount Expert Hub under its own segment to avoid collision with the Hackathon `/applications/*`. Two viable options — decision needed (§10):
- **Option A (recommended):** dedicated product base `/expert-hub` (public) + `/expert-hub/portal` (trainer) + `/expert-hub/internal` (staff).
- **Option B:** top-level `/portal` and `/internal`, with Expert Hub landing at a public route (e.g. `/experts`).

Proposed structure (Option A shown):

```
/                             → Hackathon landing (EXISTING — unchanged)
/applications/*               → Hackathon feature (EXISTING — unchanged)

# ── Expert Hub (NEW) ───────────────────────────────
/expert-hub                   → Expert Hub public landing (EH-PUB-01)        [public]
/expert-hub/directory         → Trainer directory (EH-PUB-02)                [public]
/expert-hub/directory/:trainerId → Public trainer profile (EH-PUB-03)        [public]

/expert-hub/portal            → ExpertHubPortalLayout (auth: trainer)
  index                       → Portal home (EH-TP-01)
  applications                → My Applications (EH-TP-02)
  applications/new            → New Application (EH-TP-05)
  applications/:applicationId → Application Details (EH-TP-03)
  applications/:applicationId/add-service → Add Service (EH-TP-06)
  profile                     → My Profile (EH-TP-04)
  assignments                 → My Assignments (EH-TP-07)
  assignments/:engagementId   → Assignment detail
  entitlements                → My Entitlements (EH-TP-08)
  notifications               → Notifications (EH-TP-09)
  account                     → Account & Visibility (EH-TP-10)

/expert-hub/internal          → ExpertHubInternalLayout (auth: staff roles)
  index                       → Internal dashboard (EH-INT-01)
  applications                → Application inbox (EH-INT-02)
  applications/:id/screening  → Screening detail (EH-INT-03)
  applications/:id/interview  → Interview evaluation (EH-INT-04)
  applications/:id/committee  → Committee decision (EH-INT-05)
  agreements                  → Agreement management (EH-INT-06)
  trainers                    → Trainer profiles search (EH-INT-07)
  trainers/:trainerId         → Comprehensive profile (EH-INT-08)
  assignments                 → Assignment + matching (EH-INT-09)
  entitlements                → Entitlements ledger (EH-INT-10)
  speakers                    → Speaker records (EH-INT-11)
  comms/notifications         → Notification matrix (EH-INT-12)
  comms/deadlines             → SLA console (EH-INT-13)
  access                      → Roles & permissions (EH-INT-14)
  analytics                   → Analytics (EH-INT-15)
  integrations                → Integration registry (EH-INT-16)
  settings/*                  → Admin config editors

*                             → NotFound (EXISTING)
```

- **Public routes:** `/expert-hub`, `/expert-hub/directory/*` — no auth.
- **Authenticated trainer routes:** `/expert-hub/portal/*` behind a trainer guard.
- **Internal routes:** `/expert-hub/internal/*` behind staff-role guards (role-scoped nav; Coordinator limited to own-center assignments per `US0903`).
- **Nested routes:** portal/internal layouts own providers + shell + `<Outlet/>` (mirror `ApplicationsFeatureLayout`).
- **Dynamic detail routes:** `:applicationId`, `:trainerId`, `:engagementId` (use `paths.ts` builder functions like existing `applicationDetail(id)`).
- **Unauthorized behavior:** new **route-guard pattern** → redirect to Academy SSO (INT-01) or an in-app 403 (needs auth decision, §10). No auth logic exists yet.
- **Not-found behavior:** reuse existing `NotFound` (`paths.notFound = '*'`).
- **Future scalability:** capability-aligned sub-trees; add modules without touching unrelated routes; extend `paths.ts` centrally.

---

## 8. Application Architecture Recommendation

**Goal:** add Expert Hub pages without contaminating the DS. Enforce the existing boundary: **product imports from `@ds` only**; feature-specific compositions live under `features/`.

**Layer boundaries (existing → proposed):**

| Layer | Owns | Location | Rule |
|---|---|---|---|
| DS primitives | DGA elements (Button, Field, …) | `frontend/src/design-system/primitives/` | Fixed; do not modify this session |
| DS composites | Reusable compositions (Table, Modal, EmptyState…) | `frontend/src/design-system/composite/` | Fixed |
| DS layout/shell | Container/Section, Header/Footer/NavDrawer/Breadcrumbs | `frontend/src/design-system/{layout,shell}/` | Fixed; compose, don't fork |
| **Shared application patterns** | Cross-feature app compositions (app shell layout, status timeline, route guard, form-field renderer) | **`frontend/src/components/`** (existing app-composition home, e.g. `AppFooter`) or a new `frontend/src/patterns/` | Only if reused across ≥2 features; otherwise keep in the feature |
| Feature modules | Expert Hub capabilities | **`frontend/src/features/expert-hub/`** (or per-capability features) | Self-contained: components/, pages/, services/, state/, types/, data/ |
| Pages | Routed screens | `features/expert-hub/**/pages/` (portal/internal) and `frontend/src/pages/` (public landing) | Lazy-loaded in `routes.tsx` |
| Data services | Transport per capability | `features/expert-hub/**/services/` on top of `frontend/src/lib/api` | Use `ApiAdapter`/`Result`; mock until backend (Q2) |
| Domain models | Expert Hub TS types | `features/expert-hub/**/types/` | **New** types (never reuse Hackathon `HackathonApplication`) |
| Route config | Path registry + table | `frontend/src/app/router/paths.ts`, `routes.tsx` | Extend centrally |

**Proposed feature folder (mirrors the established `features/applications` template):**
```
frontend/src/features/expert-hub/
  ExpertHubPortalLayout.tsx        # providers + trainer shell + <Outlet/>
  ExpertHubInternalLayout.tsx      # providers + internal shell + <Outlet/>
  shell/                           # Expert Hub shell composition over @ds/shell
  applications/  {components,pages,services,state,types,data}
  profile/       {components,pages,services,state,types,data}
  ...            (agreements, assignments, entitlements, admin, analytics, public)
  shared/                          # cross-capability Expert Hub helpers/types
```
- **Public landing** may live at `frontend/src/pages/ExpertHubLandingPage.tsx` (top-level page) or inside `features/expert-hub/public/` — decide with the namespace decision (§10). Either way, **do not touch `HomePage.tsx`**.
- **Providers:** reuse global `AppProviders`; add feature providers (state, toast) in the Expert Hub layouts exactly like `ApplicationsFeatureLayout`.
- **Design-system additions** (Metric, Skeleton, Table sort/filter, multi-level nav) go through the **DS approval workflow** (`CLAUDE.md`), not the feature — and not this session.

---

## 9. Backend Readiness Assumptions

No backend is built now. The frontend depends on `frontend/src/lib/api` (`ApiAdapter`, `Result`), mockable until `VITE_API_BASE_URL` is set (Q2). Data contracts the **initial four pages** will eventually need (not full API specs — see `09_API_SPECIFICATION.md` later):

### Landing (EH-PUB-01)
- **Entities:** none (static `BR-1008`) · **Endpoints:** none for R1 · **Statuses:** n/a · **Permissions:** public · **Validation:** n/a · **Integration:** none.

### My Applications (EH-TP-02)
- **Entities:** `Application` (id, reference, services[], status, createdAt, submittedAt, updatedAt) · **Endpoints:** list my applications · **Statuses:** aggregated from CAP-02/03 (`BR-0108`) — Draft/Submitted/Screening/Awaiting-interview/Interview-eval/Committee/Approved/Rejected · **Permissions:** trainer (own only) · **Validation:** one active application (`BR-0101`) enforced server-side · **Integration:** none directly.

### Application Details (EH-TP-03)
- **Entities:** `Application` (full), `StatusHistory[]`, `InterviewSlot[]`, `Agreement` (doc ref, signature state) · **Endpoints:** get application by id; list interview slots; confirm slot; get agreement; upload signed agreement · **Statuses:** full lifecycle incl. agreement stages · **Permissions:** trainer (own) · **Validation:** slot selection window (SLA `US0205`/`BR-0206`), signature upload rules (`BR-0214`) · **Integration:** none directly (agreement doc prepared outside platform per BRD §9.2).

### My Profile (EH-TP-04)
- **Entities:** `TrainerProfile` (basic data, services[], specialties[], classification, availability), `Certificate[]`, `Evaluation[]`, `ProgramHistory[]` · **Endpoints:** get my profile; update allowed fields; upload certificate · **Statuses:** profile status (active/suspended/expired) read-only · **Permissions:** trainer; **locked** fields (classification/evaluations/contract) read-only (`BR-0411`) · **Validation:** editable-field whitelist (`BR-0404`), attachment size/type · **Integration:** evaluations ← INT-02; program history ← FAST/INT-05 (read-only).

**Cross-cutting (all authenticated pages):** identity/session from Academy SSO (INT-01); role resolution (CAP-08); `Result`-typed responses; no credentials stored (`NFR-06`).

---

## 10. Gaps & Blocking Decisions

Classification: **BW** = Blocking before wireframe · **BF** = Blocking before frontend impl · **BB** = Blocking before backend impl · **Def** = Can be deferred.

| # | Area | Gap / decision | Class |
|---|---|---|---|
| G1 | Workflow/Product | **Is Expert Hub a new product alongside Hackathon in this repo, or does it replace it?** (affects namespace, shell, landing) | **BW** |
| G2 | Routing/UX | Confirm route namespace (Option A `/expert-hub/*` vs B) — `/applications` already used | **BW** |
| G3 | UX | Expert Hub **shell/nav model** (single app w/ role shells vs. separate portal/internal shells); multi-level nav (DS `Nav Header Sub-Menu` Missing) | **BW** |
| G4 | Permissions/Auth | **Academy SSO (INT-01) contract** — session shape, role claims, redirect/guard behavior; unauthorized UX | **BF/BB** |
| G5 | Data | **DM-GAP-01** application field-mandatory map per service (drives New Application + My Applications) | BF (for form pages) / **BW** for form pages |
| G6 | Data | **DM-GAP-02/03** scoring + interview models (internal screens) | BF (internal) |
| G7 | Data | **DM-GAP-05** matching matrix + tie-breaking (assignment) | BF (assignment) |
| G8 | Data | Aggregated application **status vocabulary** exposed to trainer (`BR-0108`) — confirm the exact display states | **BW** |
| G9 | Reporting | **No charting library**; CAP-09 dashboards approach (DS `Metric`/`Skeleton` Missing) | Def (until R3) |
| G10 | Content | Landing page copy/content source (static vs CMS) (`BR-1008`) | BW (for landing content) |
| G11 | Localization | i18n **namespace strategy** (currently single `common`); per-feature namespaces + AR/EN copy ownership | BF |
| G12 | Privacy | Public profile field whitelist + consent behavior (`BR-1004/1007`); Speaker data governance (`NFR-05`) | Def (R2 for public) |
| G13 | Data | **Success Metrics** undefined (BRD §9 empty) — affects analytics scope | Def |
| G14 | Migration | Legacy Excel/manual migration undefined (BRD §12) | BB (later) |
| G15 | DS | Approval path for candidate DS additions (Metric, Skeleton, Table sort/filter, multi-level nav) | Def (backlog) |
| G16 | Integration | INT-02/03/05 payload contracts (evaluations, ERP, FAST) | BB |
| G17 | i18n/UX | Notification single-language rule + "primary language" capture (`BR-0707`) | BF (comms) |

**Open questions Q1–Q13 + the 11 `DM-GAP` items** are tracked in `TODO.md`; product decisions locked by the BRD are in `DECISIONS.md`.

---

## 11. Dependency-Ordered Delivery Plan

Each phase lists **Scope · Dependencies · Deliverables · Validation · Exit**. Phases 0–3 cover foundations + the four initial pages; 4+ cover the rest in dependency order.

### Phase 0 — Repository & Design System readiness *(confirm, don't build)*
- **Scope:** Confirm DS as authoritative; resolve G1/G2 (product framing + namespace); confirm token/visual "Pending DGA (Q3/Q20)" impact on go/no-go.
- **Dependencies:** Stakeholder answers G1, G2.
- **Deliverables:** Approved namespace + shell decision; this plan accepted.
- **Validation:** No DS duplication; conventions catalogued.
- **Exit:** G1/G2 resolved; §7 route namespace chosen.

### Phase 1 — Information Architecture & shared application patterns
- **Scope:** Finalize IA (§4) into `02_INFORMATION_ARCHITECTURE.md`; define Expert Hub **shell layout** (compose `@ds/shell`), **route-guard** pattern, **status-tag/timeline** patterns, i18n namespace strategy (G11).
- **Dependencies:** Phase 0; G3, G4 (guard behavior), G8, G11.
- **Deliverables:** IA doc; `paths.ts` extension plan; shell + guard pattern specs (no page code).
- **Validation:** IA covers full platform; patterns map to DS reuse (§2).
- **Exit:** Shell + routing + i18n conventions agreed.

### Phase 2 — Landing Page (EH-PUB-01)
- **Scope:** Expert Hub public landing on new route; static content module.
- **Dependencies:** Phase 1; G10 (content).
- **Deliverables:** Landing page + content; route registered; tests.
- **Validation:** RTL/AA, responsive, reuses `@ds` only, `HomePage` untouched.
- **Exit:** Landing live at chosen public route; no DS changes.

### Phase 3 — Trainer Portal spine: My Applications · Application Details · My Profile
- **Scope:** Portal layout + guard; three pages; mock services on `lib/api`; Expert Hub application/profile types.
- **Dependencies:** Phase 2; G4 (auth/session — can mock), G5/G8 (status vocab), profile field rules (`BR-0411`).
- **Deliverables:** `features/expert-hub/{applications,profile}` modules; pages EH-TP-02/03/04; mock data; tests (Testing Library + axe).
- **Validation:** All states (empty/loading/error) present; RTL/AA; one-active-application + locked-field rules honored; `Result`-typed data flow.
- **Exit:** Three portal pages navigable end-to-end on mock data; no DS contamination.

### Phase 4 — Application intake + accreditation (CAP-01/02/03)
- **Scope:** New Application (dynamic form), internal inbox/screening/interview/committee, agreement management.
- **Dependencies:** DM-GAP-01/02/03; approver config; auth roles (G4).
- **Deliverables:** Application + screening + agreement modules & internal pages.
- **Validation:** Lifecycle transitions match BRD §8.2.4; SLAs surfaced; RBAC-scoped.
- **Exit:** Full accreditation flow demoable on mock.

### Phase 5 — Trainer Profile (CAP-04) internal + matching feed
- **Scope:** Comprehensive profile, search/filter, profile→matching feed.
- **Dependencies:** Phase 4; INT-02/05 contracts (G16) — mock first.
- **Deliverables:** Internal profile pages; search.
- **Validation:** Complete-profile + active-contract gate (`BR-0402`).
- **Exit:** Internal profile + search operational.

### Phase 6 — Assignment & Matching (CAP-05)
- **Scope:** Assignment request, matching (auto/manual), 3-candidate flow, offers, engagement lifecycle.
- **Dependencies:** Phase 5; DM-GAP-05; FAST (INT-05) — mock.
- **Deliverables:** Assignment module + portal offers.
- **Validation:** Exactly-3 rule (`BR-0505`), auto-advance (`BR-0507`), apology/cancel windows.
- **Exit:** Assignment flow demoable.

### Phase 7 — Public Presence (CAP-10) directory + Entitlements (CAP-06)
- **Scope:** Directory + public profile + consent; entitlements ledger (read-only ERP).
- **Dependencies:** Phase 5 (profile), consent rules, ERP (INT-03) — mock.
- **Deliverables:** Directory pages; entitlements pages.
- **Validation:** Consent gating (`BR-1002/1007`), full-linkage entitlement visibility (`BR-0603`).
- **Exit:** Public directory + entitlements live on mock.

### Phase 8 — Communication & Admin (CAP-07/08) + Analytics (CAP-09)
- **Scope:** Notification matrix/templates/deadlines; roles & permissions + audit; analytics dashboards/reports.
- **Dependencies:** All prior; charting decision (G9); DS Metric/Skeleton (G15).
- **Deliverables:** Admin + analytics modules.
- **Validation:** RBAC-only (`BR-0801`), audit immutable (`NFR-07`), role-scoped dashboards (`BR-0902`).
- **Exit:** Governance + analytics operational.

### Phase 9 — Integrations hardening (CAP-12) + backend swap
- **Scope:** Replace mocks with real endpoints (`VITE_API_BASE_URL`); wire INT-01..05; integration registry/logs.
- **Dependencies:** Backend + integration contracts (G16); Academy SSO (G4).
- **Deliverables:** Live data; integration monitoring.
- **Validation:** Source-of-truth rules (`BR-1201/1202`), last-known-state (`BR-1203`), NFR perf/availability.
- **Exit:** Platform on real backend.

*(CAP-11 Professional Community remains deferred.)*

---

## 12. Files to Create or Update Later *(not this session)*

**Docs (`docs/expert-hub/`):**
- Fill `02_INFORMATION_ARCHITECTURE.md`, `03_USER_FLOWS.md`, `04_SCREEN_INVENTORY.md`, `05_WIREFRAMES.md`, `06_UI_SPECIFICATIONS.md`, `07_FRONTEND_ARCHITECTURE.md`, `08_BACKEND_ARCHITECTURE.md`, `09_API_SPECIFICATION.md`, `10_DATABASE_DESIGN.md`
- Keep `DECISIONS.md` / `TODO.md` current (add G1–G17 resolutions)
- Housekeeping: remove stray empty `docs/Expert_Hub/Discovery_report.md` (case-variant folder)

**Code (future phases only — paths proposed):**
- `frontend/src/app/router/paths.ts` — add Expert Hub paths (extend, don't rewrite)
- `frontend/src/app/router/routes.tsx` — register Expert Hub sub-trees (lazy)
- `frontend/src/features/expert-hub/` — new feature namespace (layouts, capability modules, shell composition, types, services, state, mock data, tests)
- `frontend/src/pages/ExpertHubLandingPage.tsx` (+ content in `frontend/src/content/`) — **if** landing kept as top-level page
- `frontend/src/i18n/resources/{ar,en}/expert-hub.json` — new namespace + AR/EN copy
- `frontend/src/lib/api` — reuse as-is; add per-capability service typings under features
- **DS backlog (separate approval workflow, not here):** proposals for `Metric`, `Skeleton`, `Table Header Cell - Sort/Filter`, multi-level `Nav Header Sub-Menu`

---

## 13. Final Readiness Assessment

**What is ready**
- Mature, production-grade frontend foundation: React 19 + Vite 6 + TS strict; central lazy router + path registry; RTL-default i18n; cross-cutting providers; error boundary; `Result`-typed swappable data adapter; colocated tests + axe; Storybook for DS.
- A broad, mostly-approved DS (24 primitives, ~22 composites, layout, shell) with EmptyState/ErrorState/Loading patterns already present.
- A proven **feature template** (`features/applications`) — module shape, feature layout, provider/reducer, mock service, status tag/table/timeline compositions — directly reusable as the Expert Hub blueprint.

**What is missing**
- Expert Hub feature namespace, routes, shell layout, and **new domain types** (current `applications` is Hackathon-specific).
- Auth/SSO integration + route guards (none exist).
- Several data inputs (`DM-GAP-01/02/03/05`), status vocabulary, i18n namespaces, charting decision.
- A few DS components for later phases (Metric, Skeleton, Table sort/filter, multi-level nav) — via approval workflow.
- Final DGA token values (DS flagged "Pending Q3/Q20").

**What can start immediately (after G1/G2)**
- Phase 1 IA + shared patterns (shell/guard/status), Phase 2 Landing (static), and the Phase 3 portal spine on **mock data** — all reuse `@ds` only and don't touch existing Hackathon pages.

**What must be decided before wireframing**
- G1 (product framing: new vs replace), G2 (route namespace), G3 (shell/nav model), G8 (trainer-facing status vocabulary), G10 (landing content source), plus G5 for the New Application form specifically.

**Recommended next task**
> **"Resolve G1–G3 and G8, then produce `02_INFORMATION_ARCHITECTURE.md` and the Expert Hub shell + routing pattern spec (no page code)."**
> This unblocks the Landing page and the three-page portal spine while keeping the Design System and the existing Hackathon app untouched.

---

## Session Summary

**Files inspected (repo):**
`CLAUDE.md`, `TASK.md`, `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.app.json`, `frontend/src/main.tsx`, `App.tsx`, `app/router/{routes,router,paths,index}.tsx/ts`, `app/providers/AppProviders.tsx`, `layouts/RootLayout.tsx`, `design-system/{index.ts,README.md}`, `design-system/{primitives,composite,layout,shell,providers}/index.ts`, `design-system/registry/figma-component-map.json` (82 components), `design-system/tokens/*`, `design-system/providers/DirectionProvider.tsx`, `features/applications/*` (types, layout, service, provider/reducer, components, pages), `i18n/{index,config,locales,LocaleProvider}.ts(x)` + resources, `lib/api/{index,types}.ts`, `hooks/*`, `utils/*`, `components/AppFooter.*`, `content/*`, `pages/{HomePage,NotFound}.tsx`.

**Main findings:**
1. The repo is a **Hackathon** product on the FADS DS; **Expert Hub is a distinct product** to add in its own namespace — do not reuse Hackathon types or overwrite `HomePage`.
2. Conventions are strong and reusable: capability-aligned features, lazy central router + `paths.ts`, RTL-default i18n, `Result`-typed mock/HTTP adapter, colocated tests, DS-only Storybook.
3. The DS covers most Expert Hub UI needs via **composition**; a handful of components are Missing (Metric, Skeleton, Table sort/filter, multi-level nav) and belong to the DS approval backlog, not this session.
4. `/applications/*` is taken → Expert Hub needs a route namespace (recommended `/expert-hub/*`).

**Major risks:**
- Route/product-framing ambiguity (G1/G2) could cause rework if decided late.
- Hard dependency on Academy SSO (INT-01) with no auth layer yet (`NFR-13`).
- Unfinalized DGA token values (DS "Pending Q3/Q20") may affect visual sign-off.
- Missing data inputs (`DM-GAP-*`) block form-heavy internal screens.

**Blocking questions:** G1 (new vs replace), G2 (namespace), G3 (shell/nav), G4 (SSO/guard contract), G8 (trainer status vocabulary), G10 (landing content).

**Recommended next prompt:**
> *"Confirm Expert Hub is a new product under `/expert-hub/*` (keeping the Hackathon app intact). Then write `docs/expert-hub/02_INFORMATION_ARCHITECTURE.md` and a shell + routing pattern spec that composes the existing `@ds/shell` — no application page code yet."*
