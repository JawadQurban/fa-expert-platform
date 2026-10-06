# 05 — Wireframe Specifications

**Platform:** Expert & Independent Trainer Management Platform ("Expert Hub") — Financial Academy
**Status:** ✅ Complete (wireframe specifications only — **no visual mockups, no images, no Figma, no frontend code, no Design System changes**)
**Sources (only approved docs used):** `BRD-TRN-001 v1.0`, `01_PRODUCT_DISCOVERY.md`, `02_INFORMATION_ARCHITECTURE.md`, `02C_APPLICATION_AND_INTEGRATION_ARCHITECTURE.md`, `02D_RATING_DATA_AND_CALCULATION_ARCHITECTURE.md`, `03_USER_FLOWS.md`, `04_PAGE_SPECIFICATIONS.md`, `DECISIONS.md`, `TODO.md`
**Date:** 2026-07-22

> This is the master UX wireframe specification for **every** page in `02_INFORMATION_ARCHITECTURE.md` §6 (all 30 pages). It describes **WHAT** appears, **WHEN**, **WHY**, and **HOW** users interact — **without deciding visual styling** (no colors, no spacing, no typography sizing, no positioning beyond region ordering/priority). It is the direct input to Figma wireframes → high-fidelity UI → React pages. Every element traces to `04_PAGE_SPECIFICATIONS.md` (behavior), `03_USER_FLOWS.md` (interaction order), and `02_IA`/`02C`/`02D` (structure/ownership). No requirement is invented.

---

## How to read this document

Regions, interaction order, states, responsive priority, and accessibility rules that are **identical across most pages** are defined **once** in §0 (Global UX Rules) and §1 (Cross-Page UX Patterns). Each page spec (§3–§7) contains all 19 required sections, stating page-specific content and referencing §0/§1 for inherited baselines rather than repeating them. "Inherits §0.x / uses Pattern P-nn" means: apply that global rule or pattern plus the page-specific deltas listed.

**Depth calibration:** R1/MVP pages (`EH-PUB-01`, `EH-TP-02`, `EH-TP-03`, `EH-TP-04`, `EH-*-00`) are specified at full depth. R2/R3 pages carry every section but defer to the pattern library (§1) and to `04_PAGE_SPECIFICATIONS.md` where content would merely restate.

**Non-negotiable UX invariants (from `DECISIONS.md`, enforced on every page):**
1. **Business approval state is always visually separated from technical synchronization state** — never one combined indicator (`02C` §5.4, `P-08`). See Pattern **P-08 Synchronization Banner**.
2. **FAST-owned values always display source + last-sync time + sync status where relevant**, and are read-only or change-request only — never presented as locally editable/authoritative (`P-11`, `04` §0.1). See Pattern **P-16 FAST Field Group**.
3. **MTM calculated ratings are visually distinguished from raw MTM values**; the raw value is never shown as editable (`P-12`/`02D`). See Pattern **P-06 Rating Summary**.
4. **Only existing Approved Design System components are used**; application-specific combinations are **Application Patterns** (§1), never new DS components (`P-07`).

---

## Table of Contents

- [§0 Global UX Rules](#0-global-ux-rules)
- [§1 Cross-Page UX Patterns](#1-cross-page-ux-patterns)
- [§2 Page Index](#2-page-index)
- [§3 Public Pages](#3-public-pages)
- [§4 Trainer Portal Pages](#4-trainer-portal-pages)
- [§5 Internal Portal Pages](#5-internal-portal-pages)
- [§6 Administration Pages](#6-administration-pages)
- [§7 Cross-cutting Page](#7-cross-cutting-page)
- [§8 State Mapping](#8-state-mapping)
- [§9 FAST Touchpoints (per page)](#9-fast-touchpoints-per-page)
- [§10 MTM Touchpoints (per page)](#10-mtm-touchpoints-per-page)
- [§11 Final Validation](#11-final-validation)
- [§12 Readiness for High-Fidelity Design](#12-readiness-for-high-fidelity-design)

---

## 0. Global UX Rules

Applied to every page unless a page explicitly overrides.

### 0.1 Layout & shell (from `02_IA` §8)
> **⚠️ 2026-07-23 (`DECISIONS.md` `P-14`):** the "shared shell" is **Expert Hub's own** shell (a standalone app at `frontend/src/`), **not** the Hackathon shell. Public/Portal/Internal layouts share a common `ExpertHubShell` composition of Approved DS components (own header with Login + Apply, own neutral footer) — never the Hackathon `AppFooter`/`HomePage` header. The DS components below are unchanged.
>
> **⚠️ 2026-07-23 (`DECISIONS.md` `P-15`):** the `ExpertHubShell` header is now the approved **three-level Academy/Government structure** (Government utility bar → Service information bar → Main navigation header), an Expert-Hub-owned composition of Approved DS components (`Header`, `Button`, `Link`, `Icon`, `Typography`, `Container`) — Level 3 (the DS `Header`) is the single `banner`; Levels 1+2 are one labelled `region`. The public navigation is Home / About the Platform / Expert Directory / Services / FAQ; the visible **Login** is the green primary action (via the auth abstraction). The **footer** is the **product-neutral shared `AcademyFooter`** (`frontend/src/shared/footer/`) fed Expert Hub content — the same reusable Footer composition the Hackathon product renders, **not** a duplicated Expert Hub footer and **not** the Hackathon *content*. (The government "verify" URL, the service-bar values, and the search route are tracked placeholders — `TODO.md` `G65`–`G67`.)

Every authenticated `/expert-hub/*` page renders inside the **one shared shell** (role-aware nav), composed of `Header` + `NavDrawer` (+ `Second Nav Header`/`Nav Header Sub-Menu` for internal multi-level nav) + `Breadcrumbs` + `Footer`, wrapping a `<main>` content region. Public pages use the marketing shell configuration (Header + Footer, no nav drawer). The error page uses the minimal error configuration. Wireframes reuse these layouts — no page invents a layout.

### 0.2 Navigation consistency
Same capability is reached the same way everywhere (`02_IA` §3.8). Global nav item set is role-resolved; its position/interaction never changes by page. A given capability route (`/expert-hub/applications`, `/profile`, `/assignments`, `/payments`) is always the same nav entry regardless of whether it renders the trainer or staff view.

### 0.3 Breadcrumb rules
`Breadcrumbs` appear on every route **at or below a detail route** (`:id`/`:trainerId`/`:engagementId`): pattern = capability → list → detail (e.g. `Expert Hub / Applications / EH-2026-00142`). Omitted on top-level list routes and on landing/home. Breadcrumb labels use the entity's reference/name, never a raw ID.

### 0.4 Action placement
Primary page action(s) sit in a consistent **Primary Action Bar** region (top of content, after the page title). Row/item-level actions sit with their item. Destructive actions are visually secondary to constructive ones and never the default focus target. Contextual (stage-driven) actions render in a dedicated action panel region, not scattered.

### 0.5 Confirmation strategy
Every **state-changing or destructive** action (submit, sign, reject, suspend, terminate, cancel, apologize, withdraw consent, recalculate) requires an explicit confirmation step — a `Modal` **Confirmation Dialog** (Pattern P-14) for irreversible/high-impact actions, an inline confirm for low-impact. Read actions never confirm. (Rule from `04` §0.8.)

### 0.6 Dangerous actions
Destructive actions (terminate, cancel, reject, withdraw) always: (a) are visually de-emphasized relative to safe actions, (b) require a confirmation dialog naming the specific consequence, (c) write an audit entry (`NFR-07`). They are never one-click and never the primary/auto-focused control.

### 0.7 Success feedback
Transient success = `Toast` (non-blocking, auto-dismiss, also announced to screen readers via live region). Persistent success that changes the page's meaning (e.g. application submitted → now shows reference number) = the page re-renders into its success state, not just a toast. Both, for high-value actions (sign agreement).

### 0.8 Error recovery
Load errors = `ErrorState` with a retry action in the affected region (whole page if the page can't load; the region only if a sub-section failed — the rest still renders). Validation errors = inline, field-associated, with a summary at the form top linking to each field. Integration errors = Pattern P-08/P-17 (unavailable state), never a raw stack/technical error to end users.

### 0.9 Synchronization indicators (the invariant)
Business status and sync status are **two separate visual elements**. Business status = a `Tag`-based **Status Badge** (Pattern P-02) using the 11-value trainer vocabulary (`P-05`) or the internal equivalent. Sync status = a separate **Synchronization Banner/chip** (Pattern P-08) with values Pending / Synchronized / Failed. A sync failure never changes the business status badge. Trainers see sync state only where `04` permits (e.g. the post-sign "processing" indicator on EH-TP-03); internal users see full sync detail.

### 0.10 Background processing indicators
Async work triggered by the user (submit→sync, rating recalculation) shows a non-blocking "processing" affordance (Pattern P-08) and, where relevant, keeps the page usable. A background job the user didn't trigger (SLA reminder, reconciliation) is never surfaced as a blocking indicator on a normal page — it appears only on the relevant admin/monitoring surface (EH-INT-16) and via notifications.

### 0.11 Notification behaviour
In-platform notifications appear in a shell-level notification affordance (Pattern P-09, `NotificationCenter`) plus a dedicated page (EH-TP-09). New items announce via live region. Multi-channel (email + in-platform) per `BR-0701`; single-language per recipient per `BR-0707` — the wireframe shows one language, never a bilingual dual-copy.

### 0.12 Search behaviour
`SearchBox` (Approved) for free-text search (directory, trainer search, speaker search). Search is scoped to the page's data set; results replace the list region; empty results show Pattern-P-13's empty state. Server-side for large sets, client-side otherwise.

### 0.13 Filtering behaviour
Filter Bar (Pattern P-11) composed of `Select`/`Tag`/`SearchBox`. Active filters are visible and individually clearable. Filtering updates the list region without full navigation. (Sort/filter table-header controls are **Missing** DS components, `G15` — until Approved, filtering is via the Filter Bar, not in-table header controls.)

### 0.14 Sorting behaviour
Where sorting is needed (lists, tables), it is offered via the Filter Bar's sort control (a `Select`), **not** in-table header cells (that DS component is Missing, `G15`). Default sort per page stated in the page spec.

### 0.15 Pagination behaviour
`Pagination` (Approved) below list/table regions when the set exceeds one page. Page size is a fixed default per page. On mobile, lists become stacked cards with the same pagination.

### 0.16 Attachment behaviour (Pattern P-15)
`FileUploader` (Approved). Validate format/size on selection (`BR-0106`), show inline per-file status, block submit until valid. Uploaded files appear in an attachments region (Pattern-P-15 / DocumentViewer) with view/download and, where permitted, remove. Signed-agreement upload is a specialized instance (EH-TP-03). File storage location is `G26` (open) — does not change the wireframe, only the backend binding.

### 0.17 Baseline responsive priority (§17 of each page states deltas only)
Mobile-first, RTL-first (`NFR-26/29`). **Desktop:** multi-column where the page has a sidebar/timeline + content. **Tablet:** sidebar collapses under content or into a drawer; two-column content becomes one. **Mobile:** single column; tables → stacked cards; nav → `NavDrawer`; primary action may become a sticky/footer action. Layout **priority** (what stays visible first) is stated per page; no page hides content on mobile — only reflows.

### 0.18 Baseline accessibility (§18 of each page states deltas only)
WCAG 2.2 AA. Full keyboard operability; visible focus; logical reading/DOM order matching visual order; focus moves to the H1/first-error on load and into dialogs on open (returning on close); all status by text + shape/icon (never color alone); ARIA landmarks via the shell; live regions announce async status/validation/success; labelled controls; `dir`-aware. Each page adds only its specific focus-management and ARIA deltas.

### 0.19 Baseline state coverage (§12–16 of each page state deltas only)
Every page supports: Loading (Pattern P-18; `Skeleton` Missing → `Loading` spinner/placeholder, `G15`), Empty (Pattern P-13, `EmptyState`), Error (Pattern P-17, `ErrorState`/`Alert`), Confirmation (Pattern P-14, `Modal`), Success (Pattern via `Toast` + re-render). Page specs list only the page-specific *meaning* and any additional states (No-Permission → routes to EH-*-00; Sync-Pending/Failed; Partial; Offline-External).

---

## 1. Cross-Page UX Patterns

**All of these are Application Patterns, not Design System components** (`P-07`). Each lists the Approved DS components it composes from and where it's used. They live in `features/expert-hub/` (`02_IA` §9), never in the DS. New pages reuse these — no page re-invents an equivalent.

| ID | Pattern | What / When / Why | Composed from (Approved DS) | Used on |
|---|---|---|---|---|
| P-01 | **Application List** | Tabular list of applications with status; scoped "mine" or "all". Appears on list routes. Lets users triage/open. | Table, Tag, Pagination, EmptyState, Loading | EH-TP-02, EH-INT-02 |
| P-02 | **Status Badge** | Single status indicator mapping internal state → the 11-value trainer vocabulary (`P-05`) or internal equivalent; text + shape, never color-only. | Tag | EH-TP-02/03/07, EH-INT-02/06/09 |
| P-03 | **Application Summary** | Compact header block for one application: reference, services, current status, key dates. Top of any application detail. | Card, Typography, Tag, Divider | EH-TP-03, EH-INT-03/04/05 |
| P-04 | **Status Timeline** | Vertical stage-by-stage history; current stage emphasized; past decisions visible on demand (progressive disclosure). | Steps (vertical) | EH-TP-03, EH-INT-03/04/05 |
| P-05 | **Approval Timeline** | Sequential approver chain (committee, agreement approvers): who / when / decision; pending vs done. | Steps or Table, Tag | EH-INT-05, EH-INT-06 |
| P-06 | **Rating Summary** | Displays Expert Hub's **calculated** program/overall rating, visually distinct from any raw MTM value, with last-refresh + (internal) calculation version. Never editable. | Card, Rating, Typography, Tag | EH-TP-01/04, EH-INT-08 |
| P-06b | **Rating History** | Per-program rating list / trend over time (internal only; trend only if MTM exposes history, `MTM-04` unverified). | Table, Rating, Tag | EH-INT-08 |
| P-07p | **Assignment Card** | One candidate/offer/engagement: name, plan, status, actions (accept/reject/apologize). | Card, Avatar, Tag, Button | EH-TP-07, EH-INT-09 |
| P-08 | **Synchronization Banner** | Separate indicator for technical sync state (Pending/Synchronized/Failed) — **never merged with the business Status Badge**. Retry affordance for staff. | Alert or Tag, Button | EH-TP-03 (processing), EH-INT-06/09, EH-INT-16 |
| P-09 | **Notification Panel** | Feed of in-platform notifications; read/unread; shell affordance + full page. | Notification, Toast, EmptyState | EH-TP-09, shell-wide, EH-TP-01 preview |
| P-10 | **Profile Header** | Identity summary block: avatar, name, key attributes, overall rating (calculated). | Card, Avatar, Tag, Rating, Typography | EH-TP-04, EH-INT-08, EH-PUB-03 |
| P-11 | **Filter Bar** | Row of filter controls above a list; active filters visible + clearable. | Select, Tag, SearchBox, Button | EH-PUB-02, EH-INT-02/07/09/11, EH-TP lists |
| P-12 | **Search** / **Advanced Search** | Free-text search (simple) or multi-facet (advanced, internal). | SearchBox, Select, Field | EH-PUB-02, EH-INT-07/11 |
| P-13 | **Data Table** | Sortable/paginated tabular data; stacks to cards on mobile. (In-header sort/filter is Missing DS, `G15` → sort via Filter Bar.) | Table, Pagination, Tag | most list/ledger/log pages |
| P-14 | **Confirmation Dialog** | Modal confirming a state-changing/destructive action, naming its consequence. | Modal, Button, Alert | all pages with destructive/irreversible actions |
| P-15 | **File Upload Flow** | Select → validate → per-file status → view/download/remove attachments. | FileUploader, Card, Button | EH-TP-03/04/05/07, EH-INT-06 |
| P-16 | **FAST Field Group** | A group of FAST-owned fields shown read-only with source + last-sync time + (where relevant) sync status; edits go via change-request, showing the **old** value until FAST confirms. | Field (read-only), Tag, Tooltip, Alert | EH-TP-04, EH-INT-07/08, EH-TP-06/07 |
| P-17 | **Integration Unavailable State** | Region-level "service unavailable / showing last-known" (internal) or field-omitted (public), with last-sync time; never a raw error. | Alert, EmptyState, Tag | any page reading FAST/MTM/ERP |
| P-18 | **Loading Placeholder** | Region-level loading affordance. `Skeleton` is Missing (`G15`) → use `Loading` spinner/placeholder until Approved. | Loading | every page |
| P-19 | **Audit History** | Read-only immutable log of who/what/when (`NFR-07`); never editable. | Table, Tag | EH-INT-14, EH-INT-06/16 |
| P-20 | **Stepper Form** | Multi-step form with position/back-forward (application submission). | Steps, Field, Button | EH-TP-05 |
| P-21 | **Contextual Action Panel** | Stage-driven single-next-action panel on a detail page (pick slot / sign agreement / none). | Card, Alert, Button, Modal, DatePicker | EH-TP-03 |
| P-22 | **Metric Tile** | Small labeled figure (count / rating / status). **`Metric` DS component is Missing** (`G15`) → composed from Card/Typography/Tag until Approved. | Card, Typography, Tag (composed) | EH-TP-01, EH-INT-01/15 |

---

## 2. Page Index

30 pages, grouped as required (Public / Trainer / Internal / Administration + cross-cutting). Priority/release per `02_IA` §6.

| # | Page ID | Name | Route (role) | Group | Priority | Release |
|---|---|---|---|---|---|---|
| 1 | EH-PUB-01 | Landing | `/expert-hub` (visitor) | Public | P0 | R1 |
| 2 | EH-PUB-02 | Trainer Directory | `/expert-hub/directory` | Public | P1 | R2 |
| 3 | EH-PUB-03 | Public Trainer Profile | `/expert-hub/directory/:trainerId` | Public | P1 | R2 |
| 4 | EH-TP-01 | Portal Home | `/expert-hub` (trainer) | Trainer | P1 | R2 |
| 5 | EH-TP-02 | My Applications | `/expert-hub/applications` (trainer) | Trainer | **P0** | R1 |
| 6 | EH-TP-03 | Application Details | `/expert-hub/applications/:id` (trainer) | Trainer | **P0** | R1 |
| 7 | EH-TP-04 | My Profile | `/expert-hub/profile` (trainer) | Trainer | **P0** | R1 |
| 8 | EH-TP-05 | New Application | `/expert-hub/applications/new` | Trainer | P1 | R2 |
| 9 | EH-TP-06 | Add Service | `/expert-hub/applications/:id/add-service` | Trainer | P1 | R2 |
| 10 | EH-TP-07 | My Assignments / Offers | `/expert-hub/assignments` (trainer) | Trainer | P1 | R2 |
| 11 | EH-TP-08 | My Entitlements | `/expert-hub/payments` (trainer) | Trainer | P2 | R3 |
| 12 | EH-TP-09 | Notifications | `/expert-hub/notifications` | Trainer | P2 | R3 |
| 13 | EH-TP-10 | Account & Visibility | `/expert-hub/account` | Trainer | P2 | R3 |
| 14 | EH-INT-01 | Internal Dashboard | `/expert-hub` (staff) | Internal | P1 | R2 |
| 15 | EH-INT-02 | Application Inbox | `/expert-hub/applications` (staff) | Internal | P1 | R2 |
| 16 | EH-INT-03 | Screening Detail | `/expert-hub/applications/:id` (screening) | Internal | P1 | R2 |
| 17 | EH-INT-04 | Interview Evaluation | `/expert-hub/applications/:id` (interview) | Internal | P1 | R2 |
| 18 | EH-INT-05 | Committee Decision | `/expert-hub/applications/:id` (committee) | Internal | P1 | R2 |
| 19 | EH-INT-06 | Agreement Management | `/expert-hub/agreements` | Internal | P1 | R2 |
| 20 | EH-INT-07 | Trainer Profiles (search) | `/expert-hub/profile` (staff) | Internal | P1 | R2 |
| 21 | EH-INT-08 | Trainer Profile (comprehensive) | `/expert-hub/profile/:trainerId` | Internal | P1 | R2 |
| 22 | EH-INT-09 | Assignment Request + Matching | `/expert-hub/assignments` (staff) | Internal | P1 | R2 |
| 23 | EH-INT-10 | Entitlements Ledger | `/expert-hub/payments` (staff) | Internal | P2 | R3 |
| 24 | EH-INT-11 | Speaker Records | `/expert-hub/speakers` | Internal | P2 | R3 |
| 25 | EH-INT-15 | Analytics Dashboards | `/expert-hub/analytics` | Internal | P2 | R3 |
| 26 | EH-INT-16 | Integration Registry / Logs | `/expert-hub/integrations` | Internal | P2 | R3 |
| 27 | EH-INT-12 | Notification Matrix / Templates | `/expert-hub/comms/notifications` | Admin | P2 | R3 |
| 28 | EH-INT-13 | Deadlines / SLA Console | `/expert-hub/comms/deadlines` | Admin | P2 | R3 |
| 29 | EH-INT-14 | Roles & Permissions | `/expert-hub/access` | Admin | P1 | R2 |
| 30 | EH-*-00 | Not Found / Unauthorized | `*`, `/expert-hub/403` | Cross-cutting | P0 | R1 |

---

## 3. Public Pages

### EH-PUB-01 — Landing (R1, full depth)

**1. Purpose** — Introduce Expert Hub, convey who it's for and how to join, drive qualified applications (CAP-10, `BR-1001/1008`).
**2. User** — Public visitor (unauthenticated). Authenticated users are role-routed away (`P-03`).
**3. Entry Conditions** — Public; direct or via Academy-site entry points.
**4. Exit Conditions** — Visitor proceeds to Apply (→ SSO/New Application) or Directory.
**5. Primary Goal** — Understand the platform and click a CTA within one screen's worth of scanning.

**6. Page Regions** — Public shell Header → Hero → Value Proposition → Who-It's-For (5 service types) → How-It-Works → Primary CTA Band → Secondary link (Directory) → Footer. (No breadcrumb — landing.)

**7. Region Specification**

| Region | Purpose | Information | Actions | Visibility | Permissions | Data owner | Integration |
|---|---|---|---|---|---|---|---|
| Header (3 levels, `P-15`) | gov utility bar + service info bar + main nav | gov indicator + verify (`G65`), service placeholders (`G66`), brand, public nav (Home/About/Directory/Services/FAQ), search (`G67`), AR/EN toggle, **Login** (green primary) | verify, search, toggle language, log in | all | public | Expert Hub (static / config) | none |
| Hero | one-line value + primary CTA | headline, subhead, "Apply/Join" | Apply | all | public | Expert Hub (static) | none |
| Value proposition | why the platform | short benefit statements | — | all | public | Expert Hub (static) | none |
| Who-it's-for | the 5 service types (BRD §6) | service-type cards | — | all | public | Expert Hub (static) | none |
| How-it-works | journey overview | ordered steps | — | all | public | Expert Hub (static) | none |
| CTA band | convert | "Apply/Join", "Browse Directory" | Apply, Directory | all | public | Expert Hub (static) | none |
| Footer (shared `AcademyFooter`, `P-15`) | institutional links | footer content (reused shared composition, EH content) | links | all | public | Expert Hub (static) | none |

**8. Information Hierarchy** — Primary: headline + Apply CTA. Secondary: who-it's-for, how-it-works. Supporting: value statements, directory link. Technical: none (static page, no sync/data indicators).

**9. User Interaction Flow** — Page opens → (near-instant, static) → hero + CTA visible → user scans sections → clicks Apply (→ SSO if unauthenticated → New Application) or Directory. No forms, no validation on this page.

**10. Components Required** — Header, Footer, Container, Section, Card, Button, Link, Icon, Typography, Divider (all Approved). The three-level header (`P-15`) and the shared `AcademyFooter` are application/shared compositions of these Approved DS components — no DS component or token is created or modified.

**11. Conditional Rendering** — By auth: unauthenticated → this page; authenticated trainer/staff → role home (never this page). By language: AR/EN content swap, RTL/LTR direction. No application/agreement/assignment/sync/rating/integration conditionals (none apply).

**12. Loading States** — Near-instant static render; if the content bundle fails → Pattern P-17 (generic unavailable). No skeleton needed.
**13. Empty States** — N/A (static content always present).
**14. Error States** — Only content-bundle failure → ErrorState.
**15. Confirmation States** — None (nothing submitted here).
**16. Success States** — N/A (navigation, not a transaction).

**17. Responsive Behaviour** — Desktop: multi-column service-type/how-it-works. Tablet: two-column. Mobile: single column, CTA prominent/sticky; sections stack in the §8 hierarchy order.
**18. Accessibility** — Hero headline = H1 + initial focus; CTAs are real buttons/links with discernible names; banner/main/contentinfo landmarks; language toggle labelled and announces the change.
**19. Wireframe Notes** — This is the platform's front door; keep it scannable — one clear primary CTA. Content is static/admin-managed (`BR-1008`); CMS-ready but static for MVP (`G10`). No trainer data, no ratings, no sync anywhere on this page.

**Implementation notes** — *Frontend:* compose from Section/Container/Card; content from an Expert-Hub-owned static config (not `HomePage.tsx`, which is the Hackathon landing — do not touch). *Backend:* none for R1. *Integration:* none (SSO fires only when the Apply CTA enters an authenticated flow). *Future:* CMS-managed content, localized hero media, A/B CTAs.

---

### EH-PUB-02 — Trainer Directory

**1. Purpose** — Browse consented trainers by specialty (CAP-10, `BR-1002/1004`).
**2. User** — Visitor. **3. Entry** — Public. **4. Exit** — Open a public profile (→EH-PUB-03). **5. Primary Goal** — Find a relevant trainer and open their profile.

**6. Page Regions** — Public shell → Page Title → Filter Bar (P-11) → Results Grid → Pagination → Footer.
**7. Region Specification** — Filter Bar: specialty filter (Select/SearchBox), active filters clearable; owner Expert Hub (projection). Results Grid: consent-visible trainer cards (whitelisted fields only, `BR-1004`); action = open profile; **no rating shown** (`BR-1006`/`G60`). Pagination: below grid.
**8. Information Hierarchy** — Primary: results. Secondary: filters. Supporting: pagination. Technical: none public-facing.
**9. Interaction Flow** — Opens → Loading (P-18) → results + filters → user filters → grid updates → opens a card.
**10. Components** — Card, SearchBox, Select, Tag, Pagination, Avatar (Approved); Patterns P-11 Filter Bar, P-12 Search, P-13 Data Table (as grid).
**11. Conditional Rendering** — Only consent=true trainers appear (`BR-1002`). A FAST-sourced whitelisted field that's unavailable is **omitted**, not stale-shown (P-17 public variant). No role/agreement/assignment/sync/rating conditionals (public, no rating).
**12–16. States** — Loading: grid placeholder. Empty: "no trainers match this filter" (P-13). Error: directory load failure → ErrorState + retry. Confirmation: none. Success: N/A (browse).
**17. Responsive** — Desktop grid → tablet fewer columns → mobile single-column cards; filters collapse into a control that opens a filter panel.
**18. Accessibility** — Filters labelled; results announced as a list with count; each card keyboard-focusable with a discernible link name.
**19. Wireframe Notes** — No ratings (deferred). Whitelist governs which fields show (`G12`). Public data has no "stale but shown" tolerance.
**Implementation notes** — *Frontend:* grid of Cards + Filter Bar. *Backend:* directory query over the consent-gated public projection. *Integration:* none direct (projection). *Future:* rating display post-`G60`; more facets.

---

### EH-PUB-03 — Public Trainer Profile

**1. Purpose** — Present one consented trainer publicly (CAP-10). **2. User** — Visitor. **3. Entry** — Public; `:trainerId` must be consented (else hidden/not-found, `BR-1007`). **4. Exit** — Read; back to directory. **5. Primary Goal** — Understand a trainer's public scope.

**6. Page Regions** — Public shell → Breadcrumb (Directory / Trainer) → Profile Header (P-10, public variant) → Public bio/specialty section → Footer.
**7. Region Specification** — Profile Header: name, general classification, specialty (whitelisted only, `BR-1004`); no financial/sensitive data; **no rating** (deferred). Bio section: read-only public bio.
**8. Information Hierarchy** — Primary: identity + specialty. Secondary: bio. Supporting/Technical: none.
**9. Interaction Flow** — Opens → Loading → profile (or hidden/not-found if consent false).
**10. Components** — Card, Avatar, Tag, Typography; Pattern P-10 Profile Header.
**11. Conditional Rendering** — Consent false/withdrawn → resolves to hidden/not-found (privacy — never reveals the trainer exists but withheld, `BR-1007`). Unavailable whitelisted field → omitted.
**12–16. States** — Loading; Empty→N/A; Not-found/Hidden (neutral, privacy-preserving); Error; Confirmation/Success N/A.
**17. Responsive** — Header + bio single column on mobile; identity stays primary.
**18. Accessibility** — Profile name = H1; sections use heading structure; classification not color-only.
**19. Wireframe Notes** — Hidden state must be indistinguishable from genuinely-nonexistent for privacy. No rating.
**Implementation notes** — *Frontend:* Profile Header + read-only sections. *Backend:* get-by-id public projection + consent gate. *Integration:* none direct. *Future:* public rating (post-`G60`), enquiry CTA (needs decision).

---

## 4. Trainer Portal Pages

> Inherit: shared shell, trainer nav set, own-data scope, breadcrumb rules. Sections 2/3/18 repeat baseline only where a page adds a delta.

### EH-TP-01 — Portal Home

**1. Purpose** — Personal overview to reduce status inquiries (`US-0906`). **2. User** — Trainer. **3. Entry** — Authenticated trainer (applicant with no profile → My Applications instead). **4. Exit** — Navigate to a sub-area. **5. Primary Goal** — See my status at a glance, jump to the right area.
**6. Page Regions** — Shell → Page Title → Metric Tiles row (P-22) → Shortcuts → Recent Notifications preview (P-09) .
**7. Region Spec** — Metric Tiles: programs count, calculated overall rating (P-06, with pending/unavailable), entitlement summary; owner Expert Hub (computed, `BR-0904`); rating owner Expert Hub-calculated. Shortcuts: to Applications/Profile/Assignments/Payments. Notifications preview: latest few (P-09).
**8. Info Hierarchy** — Primary: metric tiles + next actions. Secondary: shortcuts. Supporting: notifications preview. Technical: rating sync/pending state on the rating tile only.
**9. Interaction Flow** — Opens → Loading (tiles show P-18) → tiles resolve (rating may resolve later → live-region announce) → user clicks a tile/shortcut.
**10. Components** — Card, Table, Divider, Tag, Loading, Rating; Patterns P-22 Metric Tile, P-06 Rating Summary, P-09 Notification Panel.
**11. Conditional Rendering** — New trainer with no activity → empty tiles ("no activity yet"). Rating: calculated value / "pending" / "unavailable" (P-06, never raw MTM, never editable). Role: trainer only (staff get EH-INT-01 on this route).
**12–16. States** — Loading: P-18 tiles. Empty: "no activity yet." Error: tile-level errors don't break the page. Confirmation: none. Success: N/A (read).
**17. Responsive** — Desktop: tiles in a row + shortcuts. Mobile: tiles stack (rating + entitlement prioritized), shortcuts as a list.
**18. Accessibility** — Tiles are labelled figures (not color-only); rating-resolved announced; shortcuts are labelled links.
**19. Wireframe Notes** — `Metric` is Missing (`G15`) — compose tiles from Card/Typography/Tag; do not build a bespoke Metric component. Rating tile must read as **calculated**.
**Implementation notes** — *Frontend:* composed metric tiles. *Backend:* live metrics read (`BR-0904`), rating from persisted calc. *Integration:* MTM indirect (rating already persisted; refresh event-driven). *Future:* trends/sparklines (needs `G9`).

### EH-TP-02 — My Applications (R1, full depth)

**1. Purpose** — Track all my applications and their live status in one place; start a compliant new one (`US-0104/0410`, `BR-0101/0107/0108`).
**2. User** — Trainer/Applicant (own data). **3. Entry** — Authenticated. **4. Exit** — Open an application (→EH-TP-03) or start new (→EH-TP-05, guarded by `BR-0101`). **5. Primary Goal** — See accurate aggregated status and act.

**6. Page Regions** — Shell → Page Title → Primary Action Bar ("New Application") → Application List (P-01) → Pagination → (Empty state region when none).

**7. Region Specification**

| Region | Purpose | Information | Actions | Visibility | Permissions | Owner | Integration |
|---|---|---|---|---|---|---|---|
| Primary Action Bar | start a new application | "New Application" (enabled/disabled per `BR-0101`) | New Application | trainer | Create | Expert Hub | none |
| Application List | show my applications + status | reference (or "draft" if none, `BR-0107`), services, Status Badge (P-02, 11-value), dates | Open, resume draft | trainer, own | View | Expert Hub | none |
| Empty state | first-time guidance | "no applications yet" + Apply CTA | Apply | trainer | — | — | none |

**8. Information Hierarchy** — Primary: each application's status + reference. Secondary: services, dates. Supporting: the New-Application CTA (and its blocked reason). Technical: none shown to trainer (no FAST-sync state here).
**9. User Interaction Flow** — Opens → Loading (P-18) → list renders (or empty state) → user opens a row (→detail) OR clicks New Application → if `BR-0101` blocks, an inline explanation + link to the existing application; else → New Application.
**10. Components Required** — Table, Tag, Button, EmptyState, ErrorState, Loading, Card, Pagination (Approved); Patterns P-01 Application List, P-02 Status Badge, P-13 Data Table.
**11. Conditional Rendering** — Drafts (no reference, `BR-0107`) visually distinct from submitted. New-Application CTA disabled when an un-decided application exists (`BR-0101`), with an accessible reason. Status Badge value driven by the aggregated presentation state (`P-05`) — never internal or FAST-sync state. Role: trainer (staff → EH-INT-02).
**12. Loading States** — List region shows P-18 placeholder; action bar renders immediately.
**13. Empty States** — "No applications yet" + Apply CTA (P-13/EmptyState).
**14. Error States** — List load failure → ErrorState + retry (whole list region). A single row whose aggregation is momentarily incomplete shows a neutral "updating" status, never a wrong status.
**15. Confirmation States** — New-Application block is an inline explanation, not a modal (low-impact). No destructive actions here.
**16. Success States** — N/A on this page (viewing); success belongs to New Application / detail.
**17. Responsive Behaviour** — Desktop: table (reference, services, status, dates). Tablet: fewer columns. Mobile: stacked cards, each showing status + reference prominently; same pagination; New-Application becomes a prominent/sticky action.
**18. Accessibility** — List is a semantic table/list with row headers; status via text + Tag shape; New-Application disabled state has an accessible explanation (not a silent grey button); focus lands on the list heading on load; row open is keyboard-operable.
**19. Wireframe Notes** — Sort/filter deferred (`G15`, `Table Header Cell` Missing) — MVP list is unsorted/unfiltered or uses a simple Filter Bar later. Do not show FAST sync anywhere on this trainer page. Status is a live aggregation — the page holds no independent status copy (`BR-0108`).
**Implementation notes** — *Frontend:* Application List pattern; model after Hackathon `ApplicationsTable` but with **new Expert Hub types**. *Backend:* list-my-applications + aggregated status over CAP-02/03. *Integration:* none. *Future:* filters/sort/search once `G15` DS components ship.

### EH-TP-03 — Application Details (R1, full depth)

**1. Purpose** — See one application's full state/history and take the next required action (pick slot; sign+upload agreement) (`US-0104/0205/0215`, `BR-0108/0206/0214`).
**2. User** — Trainer/Applicant (owner). **3. Entry** — Authenticated; `:id` owned by requester (else 403/404). Available action depends on lifecycle stage. **4. Exit** — Slot selected; or agreement signed+uploaded (→ Approved, `BR-0214`); or review only. **5. Primary Goal** — Complete the current stage's action from the portal.

**6. Page Regions** — Shell → Breadcrumb (Applications / reference) → Application Summary (P-03) → Business Status Badge (P-02) + **separate** Synchronization Banner (P-08, only post-sign) → Status Timeline (P-04) → Per-service outcome → Contextual Action Panel (P-21) → Attachments (P-15).

**7. Region Specification**

| Region | Purpose | Information | Actions | Visibility | Permissions | Owner | Integration |
|---|---|---|---|---|---|---|---|
| Application Summary | identify + current status | reference, services, Status Badge | — | owner | View | Expert Hub | — |
| Sync Banner (P-08) | **separate** technical status, post-sign only | "processing"/synchronized (neutral to trainer) | — | owner, post-sign | View | Expert Hub (sync meta) | FAST (post-sign) |
| Status Timeline | progress + past decisions | ordered stages, current emphasized | expand history | owner | View | Expert Hub | — |
| Per-service outcome | accept/reject per service | service → outcome | — | owner | View | Expert Hub | — |
| Action Panel (P-21) | the one next action | slot options OR agreement to sign OR none | Select slot / Sign+upload | owner, stage-gated | Update | Expert Hub | file storage; FAST (post-sign) |
| Attachments (P-15) | view docs + agreement | file list | view/download; upload signed copy | owner | Update | Expert Hub (record)/storage (file) | file storage (`G26`) |

**8. Information Hierarchy** — Primary: current status + the one available action (action panel). Secondary: status timeline. Supporting: per-service outcome, attachments. Technical: the sync banner (post-sign only, and neutral to the trainer).
**9. User Interaction Flow** — Opens → Loading → summary + status + timeline visible → action panel shows the stage's action → user acts (select slot [validate window `BR-0206`] → confirm → success; OR sign+upload [validate file `BR-0106`] → confirm → Approved → sync banner shows "processing" separately) → live-region announces status change.
**10. Components Required** — Card, Tag, Steps, Alert, Button, Modal, DatePicker, FileUploader, Divider (Approved); Patterns P-03 Application Summary, P-02 Status Badge, P-04 Status Timeline, P-08 Sync Banner, P-21 Action Panel, P-15 File Upload, P-14 Confirmation Dialog.
**11. Conditional Rendering** — **By application state:** the action panel content is stage-driven — Draft/Submitted/Under-Review → read-only; Interview stage → slot picker (`BR-0206`); Agreement Pending → sign+upload (`BR-0214`); Approved/Active → read-only + (post-sign) sync banner. **By sync state:** the sync banner appears only after signing and shows Pending/Synchronized (neutral to trainer); **never merged with the business Status Badge**; a sync failure shows "still processing," never a raw failure, and never reverts the Approved badge. Role: trainer (staff → EH-INT-03/04/05 sections on this route).
**12. Loading States** — Whole-page P-18; sub-regions (slots) can load independently — a pending slot region shows its own placeholder while the rest renders.
**13. Empty States** — N/A (a detail always has a record); a not-found/foreign id → EH-*-00.
**14. Error States** — Page load fail → ErrorState + retry. Slot region fail → region-level unavailable, rest renders. File upload fail → inline retry (P-15). Sync fail (post-sign) → "still processing" (never raw), internal alert raised.
**15. Confirmation States** — Slot-selection confirm (Modal, P-14). Sign-agreement confirm (Modal, P-14) — high-impact, names the consequence (you become approved).
**16. Success States** — Slot confirmed → Toast + panel updates. Signed+uploaded → page re-renders to Approved state + Toast + the separate sync banner appears.
**17. Responsive Behaviour** — Desktop: two-column (timeline/summary + action panel/attachments). Tablet: single column, action panel prioritized after summary. Mobile: single column in §8 hierarchy order; action panel prominent; timeline collapsible.
**18. Accessibility** — Timeline is a semantic ordered structure with current step programmatically indicated; action panel receives focus when a new action becomes available; live region announces status transitions; slot options are a labelled radio group; upload labelled with error association; confirmation dialogs trap focus and return it on close.
**19. Wireframe Notes** — **The action panel is stage-driven, not audience-driven** (one action per stage, `03` risk R2). The sync banner is the canonical example of the business-vs-sync separation invariant — keep it visually distinct from the Status Badge. Signing does not depend on FAST; FAST sync runs afterward separately.
**Implementation notes** — *Frontend:* ApplicationDetail + StatusTimeline + Action Panel patterns. *Backend:* get-by-id, history, slots, agreement, upload; business status set on sign, FAST sync queued separately. *Integration:* file storage (`G26`/`G27`), FAST post-sign (`G36`). *Future:* in-page messaging with reviewers.

### EH-TP-04 — My Profile (R1, full depth)

**1. Purpose** — View my full profile and update permitted fields; see approved scope, programs, calculated rating; keep the authoritative record current (`US-0403/0405/0406/0408`, `BR-0404/0411`).
**2. User** — Approved trainer (own). **3. Entry** — Authenticated approved trainer (profile exists post-accreditation, `BR-0401`). **4. Exit** — Save an EH-owned field; submit a FAST-owned change request; toggle consent. **5. Primary Goal** — Update what I'm allowed to; understand what's locked and why.

**6. Page Regions** — Shell → Breadcrumb → Profile Header (P-10) → Tabs/Sections (ProfileSections): Overview · Services & Specialties · Programs · Ratings · Visibility → within Overview: editable fields + FAST Field Group (P-16) + certificates (P-15).

**7. Region Specification**

| Region | Purpose | Information | Actions | Visibility | Permissions | Owner | Integration |
|---|---|---|---|---|---|---|---|
| Profile Header (P-10) | identity + overall rating | avatar, name, contact, calculated overall rating | edit contact (EH-owned) | owner | Update (EH-owned) | Expert Hub / rating calculated | MTM (indirect) |
| Editable fields | self-update permitted data | EH-owned personal/professional fields | Save | owner | Update | Expert Hub | — |
| FAST Field Group (P-16) | show FAST-owned data correctly | core profile/experience/roles/specialties/classification, each with source + last-sync + (pending) status | request change | owner | request-only | **FAST** | FAST-01/02 |
| Certificates (P-15) | manage cert attachments | cert list | upload/remove | owner | Create/Delete | Expert Hub (record)/storage | file storage |
| Services & Specialties | show approved scope (read-only) | approved services/specialties/classification (per-service independent, `BR-0403`) | — | owner | View | FAST | FAST-01 |
| Programs | accumulated experience | program history | — | owner | View | FAST | FAST-01 |
| Ratings (P-06) | my performance | calculated program + overall rating, last-refresh | — | owner | View | Expert Hub calculated | MTM (indirect) |
| Visibility | control public presence | consent toggle | toggle consent | owner | Update | Expert Hub | affects EH-PUB-02/03 |

**8. Information Hierarchy** — Primary: identity + editable fields. Secondary: approved services, programs, ratings. Supporting: certificates, consent. Technical: per-field FAST "change pending" indicators + rating refresh state.
**9. User Interaction Flow** — Opens → Loading → view mode → user edits an EH-owned field → validate → save → Toast; OR requests a FAST-owned change → confirm (P-14) → change-request created, **old value stays shown with "change pending"** until FAST confirms → on confirm, value updates; OR toggles consent → confirm (immediate public effect) → Toast.
**10. Components Required** — Card, Tabs, Avatar, Tag, Rating, Field, TextInput, Textarea, Select, FileUploader, Switch, Divider (Approved); Patterns P-10 Profile Header, P-16 FAST Field Group, P-06 Rating Summary, P-15 File Upload, P-14 Confirmation Dialog.
**11. Conditional Rendering** — **Field ownership drives editability** (P-16): EH-owned = editable; FAST-owned = read-only + change-request (shows old value until FAST confirms); permanently-locked (classification/evaluations/contract, `BR-0411`) = read-only regardless of role, with an accessible reason. **Rating state:** calculated / pending / unavailable (P-06) — never raw MTM, never editable. **Sync state:** per-FAST-field "change pending." Integration availability: FAST section unavailable → P-17 (last-known + timestamp), rest renders.
**12. Loading States** — Whole-page P-18; FAST-sourced sections can resolve independently.
**13. Empty States** — Empty sub-sections (no programs/evals yet) → inline empty per section.
**14. Error States** — Save validation → inline field errors + summary. FAST down → change stays "pending"; section shows last-known (P-17). Cert upload fail → inline retry.
**15. Confirmation States** — FAST change-request confirm (clarifies it's pending FAST, not yet official). Consent-toggle confirm (clarifies immediate public effect).
**16. Success States** — EH-owned save → Toast. Change-request submitted → Toast ("submitted, pending"). Cert uploaded → Toast.
**17. Responsive Behaviour** — Desktop: tabbed sections. Tablet: tabs or stacked. Mobile: sections stack (identity + editable first); tabs become a select or accordion; save is prominent.
**18. Accessibility** — Locked fields programmatically disabled **with an accessible reason** (not silent); edit/view mode change announced; FAST "change pending" is text (not color-only); ProfileSections is a proper tablist; save feedback via live region + Toast.
**19. Wireframe Notes** — The FAST Field Group (P-16) is the canonical example of "FAST-owned displays source + last-sync + never-shown-as-changed-before-confirm." Ratings must read as **calculated** (P-06), distinct from any raw value. Locked-field affordance must explain *why* it's locked.
**Implementation notes** — *Frontend:* ProfileSections + FAST Field Group + Rating Summary. *Backend:* profile read (EH + FAST-01), change-request→FAST-02, rating from persisted calc, prefs/consent. *Integration:* FAST (`G36`), MTM indirect (`G41/42`), file storage (`G26/27`). *Future:* completeness meter, CV export.

### EH-TP-05 — New Application

**1. Purpose** — Submit a complete, validated join application (`US-0101/0102/0103`, `BR-0101/0104/0105/0107`). **2. User** — Applicant/Trainer. **3. Entry** — Authenticated; no un-decided application (`BR-0101`); draft resumable. **4. Exit** — Submitted (reference issued) → EH-TP-02; or saved draft. **5. Primary Goal** — Fill only what applies and submit successfully.
**6. Page Regions** — Shell → Breadcrumb → Stepper (P-20): Service Selection → Dynamic Fields → Attachments → Review & Submit.
**7. Region Spec** — Service Selection: multi-select of the 4 contractual services (Speaker excluded, `BR-0113`). Dynamic Fields: union of mandatory fields across selected services (`BR-0104`) — **field set is a placeholder until `G5`**. Attachments (P-15): validated on upload (`BR-0106`). Review & Submit: completeness gate (`BR-0105`), reference issued at submit (`BR-0107`).
**8. Info Hierarchy** — Primary: current step + its fields. Secondary: step progress. Supporting: attachments, review. Technical: validation summary.
**9. Interaction Flow** — Opens → select services (drives which fields render) → fill (validate) → upload (validate) → review → submit → validate completeness → reference issued → success → EH-TP-02. Save draft at any point (no reference).
**10. Components** — Field, Select, Checkbox, Textarea, FileUploader, Steps, Button; Patterns P-20 Stepper Form, P-15 File Upload.
**11. Conditional Rendering** — Fields appear/disappear with service selection (announce). One-active-application block if reached improperly. `G5` field-map unavailable → shell renders but real fields can't (explicit blocked state).
**12–16. States** — Loading; Draft (in progress); Empty→N/A; Error (missing mandatory / invalid file, inline + summary); Confirmation (submit confirm); Success (reference + Toast → EH-TP-02); plus **Field-map-unavailable** (blocked until `G5`).
**17. Responsive** — Desktop: stepper + form. Mobile: one step per screen, sticky next/back.
**18. Accessibility** — Dynamic field appearance announced; stepper position announced; errors summarized + linked to fields.
**19. Wireframe Notes** — The whole dynamic-field section is **placeholder until `G5`/`DM-GAP-01`** — structure specified, field list not. Speaker not selectable (`BR-0113`).
**Implementation notes** — *Frontend:* Stepper Form driven by a field-map config. *Backend:* catalogue, field-map, draft, submit. *Integration:* file storage. *Future:* cross-device resume, eligibility hints.

### EH-TP-06 — Add Service

**1. Purpose** — Approved trainer requests a new service with minimal friction (`US-0106`, `BR-0110/0111/0112`). **2. User** — Trainer. **3. Entry** — Approved trainer, active agreement; target service not already approved (`BR-0110`). **4. Exit** — Request submitted → admin decision (bypasses screening, `BR-0112`). **5. Primary Goal** — Widen scope without re-doing a full application.
**6. Page Regions** — Shell → Breadcrumb → Current Approved Services (read-only, FAST Field Group P-16) → New Service Selection → Delta Fields → Submit.
**7. Region Spec** — Current services: FAST-sourced read-only, for duplicate prevention (`BR-0110`). New-service selection: excludes already-approved. Delta fields only (`BR-0111`).
**8. Info Hierarchy** — Primary: new-service selection + delta fields. Secondary: current services. Supporting/Technical: FAST availability.
**9. Interaction Flow** — Opens → read current services (FAST-01) → select new (duplicate blocked inline) → fill delta → submit → routes to admin (`BR-0112`).
**10. Components** — Field, Select, FileUploader, Button; Patterns P-16 FAST Field Group, P-15.
**11. Conditional Rendering** — Already-approved services marked unselectable (reason shown). FAST read down → block with "can't verify current services" (P-17).
**12–16. States** — Loading; Duplicate-service block (inline validation); Submitting; Success (routed to admin); FAST-unavailable (blocked); Error.
**17. Responsive** — Single column; current services collapsible.
**18. Accessibility** — Unselectable services clearly marked with reason.
**19. Wireframe Notes** — Current-services list is FAST-owned (P-16, read-only + source/sync). Bypasses screening entirely.
**Implementation notes** — *Frontend:* delta form + FAST read. *Backend:* FAST-01 read, field-map, request. *Integration:* FAST-01/05 (`G36/G39`). *Future:* multi-service add.

### EH-TP-07 — My Assignments / Offers

**1. Purpose** — Respond to offers, follow confirmed engagements (`US-0505/0509/0510`, `BR-0507/0511/0513`). **2. User** — Trainer. **3. Entry** — Approved trainer with ≥1 offer/engagement. **4. Exit** — Offer accepted/rejected; apology submitted; material uploaded. **5. Primary Goal** — Respond timely; follow confirmed programs.
**6. Page Regions** — Shell → Page Title → Offers section (Assignment Cards P-07p) → Confirmed Engagements section (cards + execution data) → per-card actions.
**7. Region Spec** — Offers: pending-response cards (plan name/date from FAST-03, accept/reject). Confirmed: engagements with execution data near date (`BR-0513`), material upload (training only, `BR-0506`), apology control (`BR-0511`). Assignment sync status shown **separately** (P-08).
**8. Info Hierarchy** — Primary: pending offers + their actions. Secondary: confirmed engagements. Supporting: execution data, material upload. Technical: FAST-sync status (separate), execution-data availability.
**9. Interaction Flow** — Opens → Loading → offers + engagements → accept (→ confirmed or material step for training) / reject (→ auto-advance, mgmt notified) / apologize ≤4 days (confirm, auto-advance) / upload material.
**10. Components** — Card, Alert, Modal, Button, FileUploader, Tag, Avatar; Patterns P-07p Assignment Card, P-08 Sync Banner, P-14 Confirmation, P-15.
**11. Conditional Rendering** — Material step only for training service (`BR-0510` others confirm directly). Apology available only ≤4 days before (`BR-0511`). Execution data appears only near date (`BR-0513`). Sync (assignment→FAST) shown as a **separate** neutral status. FAST plan detail unavailable → P-17.
**12–16. States** — Loading; Empty ("no assignments yet"); Offer-response; Sync-Pending/Failed (separate, neutral); Partial (execution data pending); Confirmation (accept/reject/apology); Success (Toast). 
**17. Responsive** — Cards stack on mobile; actions accessible per card.
**18. Accessibility** — Offer cards actionable with clear accept/reject; apology is a confirmed, clearly-labelled destructive-ish action.
**19. Wireframe Notes** — Apology and reject both auto-advance to another candidate — the confirmation must state this. Assignment sync is separate from the offer/engagement business status.
**Implementation notes** — *Frontend:* Assignment Cards + Sync Banner. *Backend:* assignments, FAST-03 read, upload. *Integration:* FAST (`G36/37/38`), file storage. *Future:* calendar sync, in-app messaging.

### EH-TP-08 — My Entitlements

**1. Purpose** — Track disbursement status per program (`US-0601`, `BR-0601/0603`). **2. User** — Trainer. **3. Entry** — Approved trainer; only fully-linked entitlements shown (`BR-0603`). **4. Exit** — Read-only. **5. Primary Goal** — See my entitlements transparently.
**6. Page Regions** — Shell → Page Title → Entitlements Table (P-13, linked only).
**7. Region Spec** — Table: per-program status/amount/date (ERP-owned, `BR-0601`); unlinked entries hidden (`BR-0603`); never editable; ERP-unavailable → unavailable (no stale, stricter for financial, `NFR-04`).
**8. Info Hierarchy** — Primary: entitlement rows. Secondary/Supporting: none. Technical: ERP availability.
**9. Interaction Flow** — Opens → Loading → table (or empty) → read.
**10. Components** — Table, Tag, Card; Patterns P-13 Data Table, P-17 Unavailable State.
**11. Conditional Rendering** — Hidden until full PO→Agreement→Program linkage. ERP down → unavailable (no stale amount). Read-only always (`BR-0601`).
**12–16. States** — Loading; Empty ("no entitlements yet"); Offline-External (ERP unavailable); no confirm/success (read-only).
**17. Responsive** — Table → stacked cards on mobile.
**18. Accessibility** — Amounts/status in a labelled table; status not color-only.
**19. Wireframe Notes** — No edit, no dispute this release (`BR-0605`/`G62`). Financial data never shown stale.
**Implementation notes** — *Frontend:* read-only table. *Backend:* ERP read + linkage. *Integration:* ERP (INT-03). *Future:* dispute/enquiry (`G62`), export.

### EH-TP-09 — Notifications

**1. Purpose** — Read in-platform notifications (`US-0701`, `BR-0701/0707`). **2. User** — Trainer. **3. Entry** — Authenticated. **4. Exit** — Read. **5. Primary Goal** — Miss nothing.
**6. Page Regions** — Shell → Page Title → Notification Feed (P-09) with read/unread.
**7. Region Spec** — Feed: chronological notifications, read/unread state, single-language per recipient (`BR-0707`).
**8. Info Hierarchy** — Primary: unread items. Secondary: read items. Supporting/Technical: delivery status (in-platform copy always present, `BR-0701`).
**9. Interaction Flow** — Opens → Loading → feed → mark read.
**10. Components** — Notification, Toast, EmptyState; Pattern P-09 Notification Panel.
**11. Conditional Rendering** — Unread by text/shape not color. New items announced. Single language (no bilingual dual-copy).
**12–16. States** — Loading; Empty ("no notifications"); read-state update (no confirm needed).
**17. Responsive** — Single-column feed on all sizes.
**18. Accessibility** — Feed is a labelled list; unread conveyed by text/shape; new items via live region.
**19. Wireframe Notes** — In-platform copy always available even if email failed. Language source is `G17` (seeded direction).
**Implementation notes** — *Frontend:* NotificationCenter. *Backend:* notification log. *Integration:* Notification Service (delivery). *Future:* per-category prefs, digest.

### EH-TP-10 — Account & Visibility

**1. Purpose** — Manage account (what's mine) + directory consent (`US-0806/1003`, `BR-0808/1007`). **2. User** — Trainer. **3. Entry** — Authenticated. **4. Exit** — Consent toggled / preference updated. **5. Primary Goal** — Control my visibility and preferences.
**6. Page Regions** — Shell → Page Title → Account Overview (SSO identity, read-only) → Preferences (EH-owned) → Visibility Consent (toggle).
**7. Region Spec** — Account overview: SSO identity read-only (`BR-0808`, never edited). Preferences: EH-owned, editable. Visibility consent: toggle with immediate directory effect (`BR-1007`).
**8. Info Hierarchy** — Primary: consent toggle. Secondary: preferences. Supporting: account overview. Technical: none.
**9. Interaction Flow** — Opens → view → toggle consent (confirm immediate public effect) → Toast; or update preference → save → Toast.
**10. Components** — Switch, Field, Card; Patterns P-14 Confirmation.
**11. Conditional Rendering** — Identity read-only (SSO-owned). Consent affects EH-PUB-02/03 immediately.
**12–16. States** — Loading; Saving; Validation; Confirmation (consent toggle); Success (Toast).
**17. Responsive** — Single column; consent prominent.
**18. Accessibility** — Consent = labelled switch with clear on/off (not color-only); identity clearly read-only.
**19. Wireframe Notes** — Identity is SSO-owned — never editable here. Consent withdrawal hides the public profile immediately.
**Implementation notes** — *Frontend:* Switch + read-only identity. *Backend:* prefs + consent. *Integration:* SSO (read). *Future:* channel prefs, language default.

---

## 5. Internal Portal Pages

> Inherit: shared shell, staff nav (role-filtered), server-side data scope (Coordinator = own center, `US-0903`). Internal application pages (EH-INT-02/03/04/05) render on the same `/expert-hub/applications[/:id]` routes as staff sections/stages.

### EH-INT-01 — Internal Dashboard
**1.** Operational overview per role (`US-0901/0902`). **2.** Employee/Manager (role-scoped); Coordinator own-center; Senior read-only. **3.** Staff auth. **4.** Navigate to a work area. **5.** Reach the right work item fast.
**6. Regions** — Shell → Page Title → Role-scoped Metric Tiles (P-22) → Queue Shortcuts.
**7. Region Spec** — Tiles: role-scoped KPIs (employee: screening queue / scheduled interviews / materials awaiting; manager: management KPIs) — Expert Hub computed, `BR-0902/0904`. **8.** Primary: my queues/priorities. Secondary: KPIs. Technical: metric source availability. **9.** Opens → Loading → tiles → navigate. **10.** Card, Table, Tabs; Patterns P-22, P-13. **11.** Role determines which KPIs show (`BR-0902`); Coordinator own-center only; Senior read/export only. **12–16.** Loading (P-18); Empty (quiet queues); no confirm/success (read). **17.** Tiles row → stack on mobile. **18.** Tiles labelled, not color-only. **19.** `Metric` Missing → composed (`G15`); scope strictly to BRD §8.9 (`G9/G13` open).
*Impl:* live metrics read; no stored source (`BR-0904`); blocked scope-expansion on `G9/G13`.

### EH-INT-02 — Application Inbox
**1.** Manage incoming applications + internal nomination (`US-0105`). **2.** Employee/Manager. **3.** Staff. **4.** Open an application (→EH-INT-03) / submit nomination (→ J1 path). **5.** Triage + nominate fast.
**6. Regions** — Shell → Page Title → Primary Action Bar ("Nominate") → Filter Bar (P-11) → Application List (P-01) → Pagination.
**7. Region Spec** — Nominate: opens the **same** application form as EH-TP-05 (`BR-0109`). List: all applications role-scoped, Status Badge. **8.** Primary: inbox queue + status. Secondary: filters. Supporting: nominate. **9.** Opens → list → nominate (same form/validation) OR open a row. **10.** Table, Tag, Button, SearchBox; Patterns P-01, P-11, P-20 (nomination form). **11.** Nomination audited to employee ID (`03` J2); sort/filter deferred (`G15`). **12–16.** Loading; Empty; Validation (nomination); Success (submitted). **17.** Table → cards. **18.** List semantics; nominate form accessible. **19.** Same rules as self-service (`BR-0109`); shares P-01/P-20 with trainer pages.
*Impl:* list + reuse the application form; blocked on `G5` (form), `G15` (sort/filter).

### EH-INT-03 — Screening Detail
**1.** Score + decide (`US-0201/0203/0204`, `BR-0201/0202/0204/0205`). **2.** Screening Manager. **3.** Application in screening stage. **4.** Decision recorded (accept→slots attached; reject). **5.** Objective, defensible decision.
**6. Regions** — Shell → Breadcrumb → Application Summary (P-03) → Unified Review (scores + files + Filter, `US-0203`) → AI-Assist Panel (advisory, separate) → Decision Panel (accept/reject).
**7. Region Spec** — Review: CTQ score (`BR-0201`) + applicant files. AI-Assist: qualitative analysis, **clearly advisory, separate, never merged** (`BR-0202`). Decision: accept (auto-attach slots, `BR-0205`) / reject, whole-application (`BR-0204`). **8.** Primary: score + decision. Secondary: files. Supporting: AI-assist (advisory). Technical: none. **9.** Opens → review scores/files → (AI advisory visible, not binding) → decide → confirm → recorded + notify. **10.** Card, Table, Tag, Alert, Modal; Patterns P-03, P-14, P-13. **11.** AI panel labelled advisory (never part of the official score); `G6` scoring-model unavailable → blocked. **12–16.** Loading; Decision-pending; Confirmation (accept/reject); Success; **Scoring-model-unavailable** (`G6`). **17.** Two-column → single on mobile. **18.** Score and AI panels clearly distinguished; decision controls labelled. **19.** AI is advisory only — the wireframe must make the separation obvious. Blocked on `G6/DM-GAP-02`.
*Impl:* score + AI display + decision; blocked on `G6`, `Q6` (AI).

### EH-INT-04 — Interview Evaluation
**1.** Record interview result (`US-0206/0207`, `BR-0207/0208`). **2.** Employee (evaluator). **3.** Application at interview stage. **4.** Result recorded → committee / direct reject. **5.** One documented outcome.
**6. Regions** — Shell → Breadcrumb → Application Summary (P-03) → One Interview Form (per-service notes inside, `BR-0207`) → Route/Reject Decision.
**7. Region Spec** — Single form for the whole application with per-service note fields; decision = route to committee or direct reject (`BR-0208`). **8.** Primary: the form + decision. Secondary: per-service notes. **9.** Opens → fill one form → route or reject → confirm → recorded + notify. **10.** Field, Select, Textarea, Steps; Patterns P-03, P-14. **11.** One form (no separate per-service approval paths, `BR-0207`); `G6` model unavailable → blocked. **12–16.** Loading; Draft; Submitted; Confirmation; **Model-unavailable** (`G6`). **17.** Form single-column on mobile. **18.** Single-form structure with per-service subsections. **19.** Blocked on `G6/DM-GAP-03`.
*Impl:* one evaluation form; blocked on `G6`.

### EH-INT-05 — Committee Decision
**1.** Sequential approval (`US-0208/0209/0210`, `BR-0209/0210/0211`). **2.** Committee member. **3.** Application at committee stage; my turn. **4.** Approve (advance) / reject (halt). **5.** Accountable sequential decision.
**6. Regions** — Shell → Breadcrumb → Combined Results (screening + interview, `US-0208`) → Approval Timeline (P-05) → Approve/Reject Panel.
**7. Region Spec** — Combined results view; approval sequence status (P-05); approve (advance auto, `BR-0209`) / reject (halt immediately, final, `BR-0210`). **8.** Primary: my decision + combined results. Secondary: approval sequence. **9.** Opens → review combined results → approve/reject → confirm → advance/halt + notify. **10.** Steps, Alert, Card, Button; Patterns P-05 Approval Timeline, P-14. **11.** Approve/reject only on my turn; any reject halts (`BR-0210`); all must approve (`BR-0211`); committee composition `Q11`. **12–16.** Loading; Awaiting-my-turn; My-turn; Decided; Halted; Confirmation. **17.** Single column on mobile. **18.** Sequence position clear; decision controls labelled. **19.** Reject is final and halts the chain — confirmation must state this. Committee config `Q11`.
*Impl:* combined results + approval timeline; blocked on `Q11`.

### EH-INT-06 — Agreement Management
**1.** Manage lifecycle: renew/suspend/terminate/annex (`US-0301–0306`, `BR-0301–0305`). **2.** Manager. **3.** Staff. **4.** Agreement renewed/suspended/terminated/amended. **5.** Govern the relationship with minimal friction, full history.
**6. Regions** — Shell → Page Title → Filter Bar → Agreements Table (P-13) → per-agreement: Lifecycle Actions + Agreement Timeline (P-05/Audit P-19) + Annex.
**7. Region Spec** — Table: agreements + status + expiry countdown. Actions: renew (direct, `BR-0304`, new 3-yr term `BR-0302`), suspend (reversible), terminate (terminal), annex (add service, `BR-0305`). Timeline/history retained. 90/30-day alerts by job (`BR-0303`). **8.** Primary: agreements + expiry. Secondary: lifecycle actions. Supporting: history/annex. Technical: none external. **9.** Opens → table → open an agreement → act (confirm) → history updates + notify. **10.** Table, Tag, Modal, Alert; Patterns P-13, P-14, P-05 (agreement timeline), P-19 Audit. **11.** Destructive actions (terminate/suspend) confirmed + audited; annex ≠ new agreement/signature (`BR-0305`). **12–16.** Loading; Action-confirm; Success; Error. **17.** Table → cards; actions accessible per row. **18.** Destructive actions clearly labelled + confirmed. **19.** Renewal needs no re-screening (`BR-0304`); annex is not a new signature. File storage `G26`.
*Impl:* table + lifecycle actions + history; file storage `G26`.

### EH-INT-07 — Trainer Profiles (search)
**1.** Find/inspect trainers (`US-0402/0414/0415`). **2.** Employee/Manager. **3.** Staff. **4.** Open a comprehensive profile (→EH-INT-08). **5.** Reach the right trainer fast.
**6. Regions** — Shell → Page Title → Advanced Search / Filter Bar (P-11/P-12) → Results Table (P-13) → Pagination.
**7. Region Spec** — Search/filter by service/specialty/city/classification/rating/accreditation/conflict (`US-0414`); results show accreditation + conflict status (`US-0415`); ratings **calculated** (P-06). **8.** Primary: results. Secondary: filters. Technical: FAST field availability. **9.** Opens → search/filter → results → open. **10.** Table, SearchBox, Select, Tag, Pagination; Patterns P-11, P-12, P-13, P-16 (FAST fields). **11.** FAST fields read-only w/ last-sync (P-16); FAST down → last-known (P-17). **12–16.** Loading; Empty; Partial. **17.** Table → cards. **18.** Filter/results semantics. **19.** Ratings shown are calculated; conflict status drives eligibility context (`BR-0402`). Sort/filter partly `G15`.
*Impl:* search + results; FAST (`G36`), sort/filter `G15`.

### EH-INT-08 — Trainer Profile (comprehensive)
**1.** Single complete view of a trainer (`US-0402/0404/0407/0409`). **2.** Employee/Manager. **3.** Staff; `:trainerId` resolves. **4.** Review; feed into assignment. **5.** Full context for decisions.
**6. Regions** — Shell → Breadcrumb → Profile Header (P-10) → Tabs: Identity · Services & Specialties · Agreements · Programs · Ratings (P-06 + P-06b) · Conflict.
**7. Region Spec** — FAST-owned core/experience/programs (P-16, source + last-sync); agreements (EH); ratings = **calculated** overall + per-program + trend (if MTM exposes history) + calc version + sync status (P-06/P-06b, `02D` §9 internal view); conflict status. **8.** Primary: identity + ratings + conflict. Secondary: services/agreements/programs. Technical: FAST/MTM sync status + last-refresh + calc version. **9.** Opens → Loading → sections resolve (some independently) → review → (recalc if `G61` enabled) / export (Manager). **10.** Card, Tabs, Table, Rating, Tag; Patterns P-10, P-16, P-06, P-06b, P-19. **11.** **Rating state:** calculated/pending/unavailable/failed/reconciliation-required (P-06, internal detail incl. version/last-refresh); raw MTM never editable. FAST section unavailable → last-known (P-17). Recalculation visible only if `G61` grants (Manager/Admin). **12–16.** Loading; Partial; Sync-Pending/Failed (rating, internal detail); Offline-External; Confirmation (recalc); Success. **17.** Tabs → accordion/stack on mobile. **18.** Tabs = tablist; rating states as text; last-sync visible. **19.** This is the fullest rating surface — show calculated vs raw distinction, calc version, last-refresh, sync status. Trend only if MTM history exists (`MTM-04` unverified).
*Impl:* comprehensive tabs + rating detail + recalc; FAST (`G36`), MTM (`G41/42`), formula (`G53+`), recalc perm (`G61`).

### EH-INT-09 — Assignment Request + Matching
**1.** Create request from a FAST plan, match, send 3, manage responses (`US-0501–0504`, `BR-0502/0504/0505/0507/0508`). **2.** Coordinator (own center) / Employee. **3.** Staff; a FAST plan exists. **4.** Assignment confirmed → FAST sync (separate) → (post-completion) rating refresh. **5.** Confirm a suitable trainer efficiently and objectively.
**6. Regions** — Shell → Page Title → Plan Selection (FAST Field Group P-16, `BR-0501`) → Matching Controls (auto/manual) → Shortlist (exactly 3, Assignment Cards P-07p) → Response Tracking → Synchronization Banner (P-08, separate).
**7. Region Spec** — Plan: **selected/retrieved from FAST, never re-keyed** (`02C` §5.3); Plan ID/Date/Name/schedule (FAST-03). Matching: weighted auto (conflict-excluded, exactly 3, `BR-0502/0504/0505`) or manual (`US-0503`). Shortlist: exactly 3, send to center. Tracking: auto-advance on trainer reject (`BR-0507`), re-match if all 3 reject (`BR-0508`). Sync: on confirmation, FAST-04 on a **separate status track** (`02C` §5.4). **8.** Primary: plan + shortlist + responses. Secondary: matching controls. Technical: FAST-sync status (separate), matching availability. **9.** Opens → select FAST plan → match (auto/manual) → shortlist of 3 → send → track responses → on confirm → FAST sync (separate banner). **10.** Card, Table, Tag, Avatar, Button; Patterns P-16, P-07p, P-08, P-14, P-11. **11.** Exactly-3 enforced; conflict exclusions shown; all-3-rejected → re-match; **FAST-sync separate from business status** (sync failure doesn't revert confirmation); `G7` matching-model unavailable → blocked; FAST plan unavailable → block create (P-17). **12–16.** Loading; Empty; Matching; Shortlist; Offer-tracking; Sync-Pending/Failed (separate); **Matching-model-unavailable** (`G7`); Plan-unavailable. **17.** Multi-region desktop → stacked mobile; shortlist cards stack. **18.** Shortlist = labelled cards; conflict exclusions explained; sync banner distinct from status. **19.** Plan fields are FAST-owned (never re-entered). Exactly 3. Sync separate from confirmation. Blocked on `G7/G37/G38`.
*Impl:* plan read + matching + shortlist + FAST sync (separate) + rating trigger; blocked on `G7`, `G37`, `G38`, `G36`.

### EH-INT-10 — Entitlements Ledger
**1.** Staff view of entitlements for support (`US-0602`). **2.** Employee/Manager. **3.** Staff. **4.** Read-only. **5.** Answer entitlement queries in-platform.
**6. Regions** — Shell → Page Title → Filter Bar → Ledger Table (P-13, per trainer, linkage). **7.** ERP-owned, never edited (`BR-0601`); linkage visible (`BR-0602`). **8.** Primary: ledger rows. Technical: ERP availability. **9.** Opens → table → inspect linkage. **10.** Table, Tag, Card; Patterns P-13, P-17. **11.** ERP down → unavailable; read-only. **12–16.** Loading; Empty; Offline-External. **17.** Table → cards. **18.** Ledger table labelled. **19.** No edit; dispute deferred (`G62`).
*Impl:* read-only ledger; ERP (INT-03).

### EH-INT-11 — Speaker Records
**1.** Manage internal-only speakers (`US-0417/0418/0419`, `BR-0113/0412/0413`). **2.** Employee. **3.** Staff; internal-only, no portal. **4.** Speaker created/updated. **5.** Keep speaker data current.
**6. Regions** — Shell → Page Title → Search/Filter (P-11/P-12) → Speaker Table (P-13) → Create/Update Form (Modal) → Event History (P-19).
**7.** Speaker record (EH); no classification/evaluation/agreement/entitlement (`BR-0413`). **8.** Primary: search + records. Secondary: event history. **9.** Opens → search → create/update (form) → save. **10.** Table, Field, SearchBox, Modal; Patterns P-11, P-13, P-14. **11.** No trainer/public surface ever; internal-only. **12–16.** Loading; Empty; Validation; Success. **17.** Table → cards; form → full-screen on mobile. **18.** Form + list accessible. **19.** No downstream accreditation/agreement/entitlement — keep the form minimal per `BR-0413`.
*Impl:* speaker CRUD; internal-only.

### EH-INT-15 — Analytics Dashboards
**1.** KPIs + exportable reports (`US-0901/0903/0904/0905`). **2.** Manager (full) / Senior Mgmt (read/export only, `BR-0903`). **3.** Staff. **4.** Read/export. **5.** Measure performance/needs.
**6. Regions** — Shell → Page Title → Role-scoped Dashboards (P-22 tiles) → Reports/Export. **7.** Computed live, no storage (`BR-0904`), role-scoped (`BR-0902`). **8.** Primary: KPIs. Secondary: reports. Technical: metric availability. **9.** Opens → dashboards → export. **10.** Card, Table, Tabs; Pattern P-22. **11.** Senior = read/export only (`BR-0903`); Coordinator own-center; scope strictly BRD §8.9 (`G9/G13`). **12–16.** Loading; Empty; Partial; Export confirmation. **17.** Tiles/charts stack on mobile with table equivalents. **18.** Charts need text/table equivalents (color-independence); export accessible. **19.** No charting library committed (`G9`); success metrics undefined (`G13`) — do not expand scope by inference.
*Impl:* live read + export; blocked scope on `G9/G13`.

### EH-INT-16 — Integration Registry / Logs
**1.** Govern integrations, monitor sync/reconciliation (CAP-12, `BR-1201–1206`). **2.** Admin. **3.** Admin. **4.** Monitor; review reconciliation. **5.** Detect/resolve sync issues.
**6. Regions** — Shell → Page Title → Registry Table (P-13) → Logs Table (P-13) → Reconciliation Flags (P-08/P-17) → Audit (P-19).
**7.** Registry (systems/direction/importance, `BR-1204`); logs (success/failure, `BR-1203`); reconciliation flags (`03` §2.8). **8.** Primary: failures/mismatches. Secondary: registry. Supporting: full logs. Technical: this **is** the technical surface. **9.** Opens → registry + logs → review reconciliation (not silent auto-correct). **10.** Table, Tag, Alert; Patterns P-13, P-08, P-17, P-19. **11.** Per-integration health; reconciliation-required highlighted; no editing of external data. **12–16.** Loading; Failure-highlighted; Reconciliation-required. **17.** Tables → cards. **18.** Log tables labelled; status not color-only. **19.** This is the monitoring/fallback surface for every integration; it's where sync failures and mismatches surface (not on normal pages).
*Impl:* registry + logs + reconciliation; informed by contracts `G19–G30`.

---

## 6. Administration Pages

### EH-INT-12 — Notification Matrix / Templates
**1.** Configure event→template→audience→channel + bilingual templates + log (`US-0702/0703/0705`, `BR-0701–0705/0707`). **2.** Admin. **3.** Admin. **4.** Config saved. **5.** Govern all official comms centrally.
**6. Regions** — Shell → Page Title → Matrix Editor (P-13) → Template Editor (bilingual form) → Log Viewer (P-13/P-19).
**7.** Matrix (event→template→audience→channel, `US-0702`); templates bilingual AR/EN (`US-0703`, `BR-0701`); log (`US-0705`). **8.** Primary: matrix + templates. Secondary: log. **9.** Opens → edit matrix / templates (both languages required) → save (no deploy) → log viewable. **10.** Table, Select, Modal, Switch, Field, Textarea; Patterns P-13, P-14. **11.** Admin-only (`BR-0704`); bilingual required; single-language send configured (`BR-0707`). **12–16.** Loading; Editing; Saved; Validation (both languages). **17.** Matrix table → cards; editor full-screen on mobile. **18.** Bilingual editor labelled per language; matrix navigable. **19.** Single-language *send* but bilingual *authoring* — the editor shows both languages, not the recipient view. Content depends on `DM-GAP-08`; language source `G17`.
*Impl:* matrix/template/log editors; blocked on `DM-GAP-08`, `G17`.

### EH-INT-13 — Deadlines / SLA Console
**1.** Manage every SLA/deadline centrally (`US-0704`, `BR-0705`). **2.** Admin. **3.** Admin. **4.** Deadline config saved. **5.** Adjust SLAs without touching each capability.
**6. Regions** — Shell → Page Title → Central Deadline Table (editable, P-13). **7.** All SLAs + reminders across capabilities (`BR-0705`); provisional values flagged (`Q8`). **8.** Primary: the editable deadline grid. **9.** Opens → edit a deadline/reminder → save (no deploy). **10.** Table, Field, Switch; Patterns P-13. **11.** Admin-only; provisional values noted (`Q8`). **12–16.** Loading; Editing; Saved; Validation. **17.** Editable table → cards on mobile. **18.** Editable table accessible. **19.** Provisional SLA values (`Q8`), operational values `DM-GAP-10`.
*Impl:* central deadline editor; blocked on `Q8`, `DM-GAP-10`.

### EH-INT-14 — Roles & Permissions
**1.** Govern access; edit matrix, assign roles, view audit (`US-0801/0802/0805`, `BR-0801/0806/0807/0808`). **2.** Admin. **3.** Admin. **4.** Config saved (audited). **5.** Control access from one place, all changes audited.
**6. Regions** — Shell → Page Title → Permission Matrix Editor (P-13 grid) → User-Role Assignment → Audit Log Viewer (P-19).
**7.** Role×domain×permission matrix (`US-0801`); user-role assignment (`US-0802`, RBAC only `BR-0801`); audit (`US-0805`, immutable `BR-0806`). Identity from SSO read-only (`BR-0808`). **8.** Primary: matrix + assignments. Secondary: audit. Technical: SSO identity (read-only). **9.** Opens → edit matrix / assign roles (no deploy, `BR-0807`) → save (audited) → audit viewable. **10.** Table, Checkbox, Switch, Modal; Patterns P-13, P-14, P-19 Audit. **11.** RBAC only (no direct-to-user, `BR-0801`); audit read-only/immutable for everyone incl. Admin; **no login/SSO management here** (`BR-0808`). **12–16.** Loading; Editing; Saved; Validation. **17.** Matrix grid scrolls/reflows on mobile; audit table → cards. **18.** Matrix grid navigable; role assignment clear; audit read-only. **19.** Audit is immutable — no edit/delete affordance anywhere. Matrix editable without deploy. Content `DM-GAP-07`; SSO claim `G16/G28`.
*Impl:* matrix + assignment + audit; blocked on `DM-GAP-07`, `G16/G28`.

---

## 7. Cross-cutting Page

### EH-*-00 — Not Found / Unauthorized (R1, full depth)

**1. Purpose** — Safe, non-leaking error routing; two distinct cases (404 vs 403) never conflated (`02C` §12). **2. User** — Any (incl. visitor). **3. Entry** — 404: unmatched route / non-existent or foreign entity id; 403: authenticated but not permitted; consent-hidden public profile → 404-variant (privacy). **4. Exit** — Navigate home (role-appropriate) / back. **5. Primary Goal** — Recover without confusion or data leakage.

**6. Page Regions** — Minimal error shell → Error Message region → Recovery Action region.
**7. Region Specification** — Error Message: neutral explanation of the case (404: not found — doesn't confirm/deny existence; 403: no access — doesn't reveal what's behind it); owner SSO (role, only to pick the home link). Recovery: home link (role-appropriate) / back.
**8. Information Hierarchy** — Primary: what happened + how to recover. Secondary/Supporting/Technical: none.
**9. User Interaction Flow** — Route resolves to 404/403 → error message rendered → user clicks home/back.
**10. Components Required** — ErrorState, Button (Approved). No application patterns beyond the error layout.
**11. Conditional Rendering** — 404 vs 403 variant (distinct messages, never merged). Home link target depends on resolved role (visitor → landing; trainer → portal home; staff → dashboard). Consent-hidden profile uses the 404-variant (privacy).
**12. Loading States** — None (no data). **13. Empty States** — N/A. **14. Error States** — This page **is** the error state (two variants). **15. Confirmation States** — None. **16. Success States** — N/A.
**17. Responsive Behaviour** — Single centered column at all sizes; message + recovery action stay visible.
**18. Accessibility** — Error heading = H1 + focus target; message announced assertively on arrival; recovery link clearly labelled.
**19. Wireframe Notes** — The 404/403 distinction and the privacy-preserving neutrality of messages are the whole point — the wireframe must not leak whether a resource exists or who owns it. Reuse the existing `NotFound` for true 404s; `/expert-hub/403` is the in-app unauthorized case.
**Implementation notes** — *Frontend:* ErrorState + role-aware home link. *Backend:* none. *Integration:* SSO (role read). *Future:* "did you mean" suggestions.

---

## 8. State Mapping

Every page mapped to the state dimensions it reflects. "—" = not applicable to that page. (State machines are defined in `03_USER_FLOWS.md` §3; this maps pages to them.)

| Page | Application State | Workflow State | Agreement State | Assignment State | Rating State | Sync State |
|---|---|---|---|---|---|---|
| EH-PUB-01 | — | — | — | — | — | — |
| EH-PUB-02 | — | — | — | — | — (deferred) | — |
| EH-PUB-03 | — | — | — | — | — (deferred) | — |
| EH-TP-01 | summary | — | — | summary | calculated (overall) | rating sync (tile) |
| EH-TP-02 | ✓ (11-value) | — | — | — | — | — (hidden from trainer) |
| EH-TP-03 | ✓ (11-value) | screening/interview/committee/agreement (read) | Pending/Active (read) | — | — | FAST post-sign (separate, neutral) |
| EH-TP-04 | — | — | — | — | calculated (overall+program) | FAST per-field change-pending |
| EH-TP-05 | Draft→Submitted | — | — | — | — | — |
| EH-TP-06 | (add-service req) | admin-decision | annex (result) | — | — | FAST role/service (separate) |
| EH-TP-07 | — | — | — | ✓ (offer/engagement) | — | FAST assignment (separate) |
| EH-TP-08 | — | — | — | — | — | ERP read (unavailable/ok) |
| EH-TP-09 | — | — | — | — | — | notification delivery |
| EH-TP-10 | — | — | — | — | — | — |
| EH-INT-01 | queue counts | queue states | expiry counts | request counts | — | — |
| EH-INT-02 | ✓ (all) | intake | — | — | — | — |
| EH-INT-03 | ✓ | screening | — | — | — | — |
| EH-INT-04 | ✓ | interview | — | — | — | — |
| EH-INT-05 | ✓ | committee (sequential) | — | — | — | — |
| EH-INT-06 | — | — | ✓ (Active/Suspended/Terminated/Expired/Renewed) | — | — | — |
| EH-INT-07 | — | — | contract-status (read) | conflict (read) | calculated (read) | FAST field sync |
| EH-INT-08 | — | — | agreements (read) | conflict (read) | calculated + per-program + trend + sync/version | FAST + rating sync (full detail) |
| EH-INT-09 | — | — | eligibility (read) | ✓ (request→matching→shortlist→offer→confirmed) | triggers refresh (post-completion) | FAST assignment (separate) |
| EH-INT-10 | — | — | linkage (read) | linkage (read) | — | ERP read |
| EH-INT-11 | — | — | — | — | — | — |
| EH-INT-15 | aggregate | aggregate | aggregate | aggregate | aggregate (calculated) | — |
| EH-INT-16 | — | — | — | — | reconciliation | ✓ (all integrations) |
| EH-INT-12 | — | — | — | — | — | — |
| EH-INT-13 | — | — | — | — | — | — |
| EH-INT-14 | — | — | — | — | — | SSO identity (read) |
| EH-*-00 | — | — | — | — | — | — |

---

## 9. FAST Touchpoints (per page)

Per the required per-page FAST breakdown. "Read-only indicator" = the FAST Field Group (P-16) source + last-sync display. Sync failure/retry indicators appear only where a FAST **write** occurs.

| Page | FAST data displayed | FAST actions | Pending-sync indicator | Sync-failure indicator | Retry indicator | Read-only indicator |
|---|---|---|---|---|---|---|
| EH-TP-03 | — (post-sign only) | trainer sync (write, post-sign) | ✓ (neutral "processing") | ✓ internal (neutral to trainer) | background | — |
| EH-TP-04 | core profile/experience/roles/specialties/classification/programs | change-request (write) | ✓ per-field "change pending" | ✓ (field stays pending) | background | ✓ P-16 |
| EH-TP-06 | current approved services | role/service (write, on approval) | ✓ (separate) | ✓ | background | ✓ P-16 |
| EH-TP-07 | plan/execution data | assignment status (read) | ✓ (assignment, separate) | ✓ | background | ✓ |
| EH-INT-07 | core fields (search) | — | — | — | — | ✓ P-16 |
| EH-INT-08 | profile/programs | — | — | — | — | ✓ P-16 (+ last-sync) |
| EH-INT-09 | Plan ID/Date/Name/schedule | confirmed relationship (write) | ✓ (separate banner P-08) | ✓ (separate; business status unaffected) | ✓ (staff retry) | ✓ P-16 (plan) |
| EH-PUB-02/03 | whitelisted core fields (projected) | — | — | — | — | omitted-if-unavailable (public) |
| EH-INT-16 | all FAST sync/reconciliation status | reconciliation review | ✓ | ✓ | ✓ | — |

All others: no FAST touchpoint.

---

## 10. MTM Touchpoints (per page)

Per the required per-page MTM breakdown. Every displayed rating is Expert Hub's **calculated** indicator (P-06), distinct from raw MTM; raw is never editable.

| Page | Program Rating | Overall Rating | Rating refresh | Calculation pending | Calculation failed | Reconciliation required |
|---|---|---|---|---|---|---|
| EH-TP-01 | — | ✓ (calculated, tile) | event-driven | ✓ ("pending") | ✓ ("unavailable", neutral) | — |
| EH-TP-04 | ✓ (calculated) | ✓ (calculated) | event-driven | ✓ | ✓ (neutral to trainer) | — |
| EH-INT-08 | ✓ (calculated, per-program) | ✓ (calculated) | event-driven + manual recalc (`G61`) | ✓ (internal detail) | ✓ (internal detail) | ✓ (internal) |
| EH-INT-09 | — (triggers refresh post-completion) | — | triggers `ProgramCompleted`→refresh | — | — | — |
| EH-INT-15 | aggregate (calculated) | aggregate (calculated) | — | — | — | — |
| EH-INT-16 | — | — | — | — | ✓ (sync/calc failures surface here) | ✓ |
| EH-PUB-02/03 | — (deferred, `G60`) | — (deferred) | — | — | — | — |

All others: no MTM touchpoint. **Rule:** no page ever renders an editable raw MTM value; public rating display is deferred (`G60`).

---

## 11. Final Validation

| Check | Result |
|---|---|
| Every page spec (04) has a matching wireframe spec (05) | ✅ All 30 pages from `04_PAGE_SPECIFICATIONS.md` §1 are specified here (§3–§7): 3 Public, 10 Trainer, 13 Internal, 3 Admin, 1 cross-cutting |
| Every User Flow is represented | ✅ J1→EH-PUB-01/TP-02/03/05 + INT-02/03/04/05/06; J2→INT-02; J3→TP-06; J4→INT-09/TP-07; J5→TP-04/INT-07/08; J6→INT-06/TP-03; J7→TP-08/INT-10; J8→PUB-01/02/03; supporting flows §2.x→shell/INT-14/16/TP-09/INT-11/EH-*-00 |
| Every integration touchpoint is visible | ✅ FAST §9, MTM §10, ERP (TP-08/INT-10), SSO (all auth + TP-10/INT-14/EH-*-00), Notification (§0.11 + TP-09/INT-12), File storage (TP-03/04/05/07/INT-06) — each surfaced on its page's regions/states |
| No page invents new requirements | ✅ Every element cites a `BR-`/`US-`/`P-`/`G-` source; nothing beyond `04`/`03`/`02*` |
| No Design System duplication | ✅ §1 patterns are all classified Application Patterns composed from Approved DS components; Missing components (`Metric`/`Skeleton`/`Structured List`/`Table sort-filter`) are composed, not replaced (`G15`) |
| Every application pattern is identified | ✅ §1 defines 22 patterns (P-01…P-22); each page's §10 references them by ID |
| Business and technical states are always separated | ✅ §0.9 invariant + Pattern P-08; enforced on EH-TP-03 (post-sign), EH-TP-04 (per-field), EH-TP-06/07 (assignment/service sync), EH-INT-09 (assignment); §8 state-mapping keeps Application/Workflow/Agreement/Assignment/Rating/Sync as separate columns |
| No visual styling / mockups / images / Figma | ✅ Regions described by purpose/priority/order only; no colors, sizing, or positioning beyond ordering; no images generated |

---

## 12. Readiness for High-Fidelity Design

**Ready.** All 30 pages have a wireframe specification (full depth for the R1 spine; complete for R2/R3), 22 reusable application patterns are defined and mapped, global UX rules and the business-vs-sync / FAST-display / MTM-calculated invariants are stated and enforced, and the state-mapping / FAST / MTM matrices give designers a per-page checklist. No page invents a requirement or a DS component; no layout was drawn.

**Shared UX patterns identified:** 22 (§1) — Application List, Status Badge, Application Summary, Status Timeline, Approval Timeline, Rating Summary, Rating History, Assignment Card, Synchronization Banner, Notification Panel, Profile Header, Filter Bar, Search/Advanced Search, Data Table, Confirmation Dialog, File Upload Flow, FAST Field Group, Integration Unavailable State, Loading Placeholder, Audit History, Stepper Form, Contextual Action Panel, Metric Tile — all Application Patterns, none DS components.

**FAST touchpoints covered:** §9 — 9 pages (TP-03/04/06/07, INT-07/08/09, PUB-02/03, INT-16), covering FAST-01…05 reads/writes with the separate-sync-status and read-only/last-sync display rules.

**MTM touchpoints covered:** §10 — 6 pages (TP-01/04, INT-08/09/15/16), all showing the **calculated** indicator distinct from raw, with pending/failed/reconciliation states; public deferred (`G60`).

**Remaining blockers (step/section-level, not page-level):** `G5` (New Application field set — EH-TP-05/INT-02), `G6` (screening/interview content — INT-03/04), `G7` (matching output — INT-09), `G26`/`G27` (agreement/cert storage+AV — TP-03/04, INT-06), `G36`–`G44` (FAST/MTM live integration — the FAST/MTM pages), `G53`–`G56`/`G63` (rating math — rating pages), `G9`/`G13` (analytics scope — INT-01/15), `G16`/`G28` (SSO claim/service auth — auth pages/INT-14), `Q8`/`Q11` (SLA values/committee — INT-13/05), `G15` (Missing DS components — composed meanwhile), `DM-GAP-*` (form/matrix content). Each is marked at the exact page section it affects; none blocks producing the wireframe (placeholder data per the `02D` §13 / `03` §11 precedent).

**Recommended next task:** create the **high-fidelity design for one page at a time, beginning with `EH-PUB-01` Landing Page** — it is P0/R1, has zero open blockers (static content, no integration, no rating, no sync), and exercises the shared shell + core DS components, making it the ideal first high-fidelity page. **Not created this session**, per instruction.
