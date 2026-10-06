# 04 — Page Specifications

**Platform:** Expert & Independent Trainer Management Platform ("Expert Hub") — Financial Academy
**Status:** ✅ Complete (specifications only — **no wireframes, no layouts, no UI mockups, no frontend/backend code, no Design System changes**)
**Sources (only approved docs used):** `BRD-TRN-001 v1.0`, `EXPERT_HUB_PRODUCT_AND_REPOSITORY_PLAN.md`, `02_INFORMATION_ARCHITECTURE.md`, `02C_APPLICATION_AND_INTEGRATION_ARCHITECTURE.md`, `02D_RATING_DATA_AND_CALCULATION_ARCHITECTURE.md`, `03_USER_FLOWS.md`, `DECISIONS.md`, `TODO.md`
**Date:** 2026-07-22

> This document is the master, implementation-ready specification for **every** page in `02_INFORMATION_ARCHITECTURE.md` §6 (all 30 screens, MVP through deferred). It describes **WHAT** each page must do, never **HOW** it looks. It is consumed by UX designers, UI designers, frontend and backend developers, and QA. No requirement here is invented — every rule traces to the BRD or a logged decision (`P-xx`)/gap (`G-xx`).

---

## How to read this document

Because 30 pages share large amounts of identical behavior (auth, sync-status handling, accessibility baseline, Design-System reuse discipline), the rules that apply to **all or most** pages are stated **once** in §0 (Global Conventions). Each page spec (§2–§5) then contains all 17 required sections, stating page-specific content and referencing §0 for inherited baselines rather than repeating them. "Inherits §0.x" in a page section means: apply that global baseline plus any page-specific deltas listed. This is deliberate — repeating identical accessibility/permission boilerplate 30 times would be less implementation-ready, not more, and would hide the page-specific deltas that actually matter.

**Depth calibration:** R1/MVP pages (`EH-PUB-01`, `EH-TP-02`, `EH-TP-03`, `EH-TP-04`, `EH-*-00`) are specified at full depth. R2/R3 pages carry every section but are more concise, deferring detail to the flow/architecture docs already written where the content would merely restate them.

---

## Table of Contents

- [§0 Global Conventions](#0-global-conventions)
- [§1 Page Index](#1-page-index)
- [§2 Public Pages](#2-public-pages) — EH-PUB-01/02/03
- [§3 Trainer Portal Pages](#3-trainer-portal-pages) — EH-TP-01…10
- [§4 Internal Portal Pages](#4-internal-portal-pages) — EH-INT-01…11, 15, 16
- [§5 Administration Pages](#5-administration-pages) — EH-INT-12/13/14
- [§6 Cross-cutting Page](#6-cross-cutting-page) — EH-*-00
- [§7 Cross-Page Matrices](#7-cross-page-matrices)
- [§8 Traceability](#8-traceability)
- [§9 Final Validation](#9-final-validation)
- [§10 Readiness for Next Phase](#10-readiness-for-next-phase)

---

## 0. Global Conventions

These apply to every page unless a page explicitly overrides them.

### 0.1 Data ownership (authoritative — never contradicted by any page)

Per `DECISIONS.md` `P-08`/`P-11`/`P-12`/`P-13`, every data item on every page has exactly **one** authoritative owner. Owner values used throughout: **Expert Hub · FAST · MTM · ERP · SSO · Notification Service**.

| Owner | Authoritative for | Expert Hub may |
|---|---|---|
| **SSO** | Identity, authentication, session, role claims | Read only (never store credentials, `NFR-06`) |
| **FAST** | Trainer core profile, experience, roles/services, specializations, classification, official trainer-plan relationship, Plan ID, Plan Date, Program Name, schedule, participants (`P-11`) | Read; submit approved changes via API; cache a **non-authoritative** projection with last-sync timestamp |
| **MTM** | Raw expert rating submissions/values, rating criteria, original timestamps, MTM record IDs (`P-12`/`P-13` = INT-02) | Read; persist as an **immutable, traceable** `RatingSourceRecord` — **never edit the raw value** |
| **ERP** | Purchase order, entitlement amount, payment status, payment date (`BR-0601`) | Read only; never edit locally |
| **Expert Hub** | Applications, screening/interview/approval workflow, agreements workflow, assignment/matching workflow, **calculated** program & overall rating indicators, notifications, SLA config, consent, audit, integration logs, RBAC config, sync metadata | Full CRUD within its own scope |

**Two rules every page must honor and none may violate:**
1. **A FAST-owned or MTM-owned value is never presented as locally authoritative.** Cached external values always show their source + last-sync timestamp (internal/trainer views) or are omitted when stale (public views).
2. **Business approval status and technical synchronization status are always two separate fields** (`02C` §5.4). No page merges "Approved" (business) with "Synchronized"/"Synchronization Failed" (technical). A sync failure never erases or reverts a completed business decision.

### 0.2 Rating display rule (from `02D`)

MTM raw ratings are **read-only, never editable** on any page. What users see is Expert Hub's **calculated** program rating / overall rating, always distinguishable from the raw MTM value, always carrying calculation version + last-refresh timestamp on internal views. Public rating display is **deferred** (`BR-1006`, `G60`) — no page shows a public rating until that policy is approved.

### 0.3 Design System reuse rule (from `P-07`)

> **⚠️ 2026-07-23 (`DECISIONS.md` `P-14`):** Expert Hub is a **standalone app** (own shell/router/layouts/auth at `frontend/src/`), co-located only to reuse the Design System. Everywhere this document says "`features/expert-hub/`", read "the Expert Hub app boundary at `frontend/src/`". Every page still composes **only** Approved DS components — that rule is unchanged and reinforced.

Every page composes **only** existing, Approved Design System components (`frontend/src/design-system/`, via `@ds`). No page duplicates a DS component or creates a page-local variant of one. Where a needed DS component is still **Missing** (`Metric`, `Skeleton`, `Structured List`, `Table Header Cell - Sort/Filter`), the page composes the behavior from Approved primitives at the feature layer (`02_INFORMATION_ARCHITECTURE.md` §9) and the gap is noted — it does **not** get a bespoke replacement this phase. Application-specific compositions (status timeline, rating display, etc.) live in `features/expert-hub/`, never in the DS.

### 0.4 Baseline page states (every page has these unless noted)

Loading · Empty · No Permission (403) · Validation Error · System Error · Partial Data · Synchronization Pending · Synchronization Failed · Offline External Service · Success. Each page's §11 lists only the **page-specific meaning** of these plus any additional states. The generic behavior of each is defined in `03_USER_FLOWS.md` §5 (Error & Recovery Catalogue) and is not re-derived per page.

### 0.5 Baseline accessibility (every page inherits; §13 lists deltas only)

WCAG 2.2 AA (`CLAUDE.md`, `NFR`). Full keyboard operability; visible focus; logical focus order; focus moves to the primary heading / first error on navigation and to dialogs on open (returning on close); all status conveyed by **text + shape/icon, never color alone**; screen-reader landmarks via the shared shell (skip link + `<main>`); `dir`-aware RTL-first layout with CSS logical properties; live regions announce async status changes (submit success, sync state changes, validation errors); fully responsive/touch (`NFR-26/29`); AR/EN bilingual with per-recipient language.

### 0.6 Baseline analytics (every page inherits; §14 lists page-specific events only)

`Page Viewed` (with page ID + resolved role) on every page. Plus each page's own domain events. No PII beyond the pseudonymous identifiers already governed by CAP-08; analytics stores no source data (consistent with `BR-0904`).

### 0.7 Baseline permissions model (from `02_IA` §7, `BR-0801`)

RBAC only, six fixed roles + two non-role actors. Permissions granted **only** via role, never direct-to-user. Every page's §10 states the per-role matrix (View/Create/Update/Delete/Approve/Reject/Export/Synchronize). "Synchronize" = ability to trigger a manual sync/recalculation, not automatic background sync (which is system-driven, not a user permission). Data-scope is enforced server-side on every request (Coordinator = own center only, Trainer = own data only) — never UI-only (`02C` §12, direct-object-reference protection).

### 0.8 Baseline confirmation/audit rules

Every destructive or state-changing action (suspend, terminate, reject, cancel, consent-withdraw, manual recalculation) requires an explicit confirmation step and writes an immutable audit entry (`NFR-07`, `02C` §3.1 Audit module). Read actions are not audited unless security-relevant (repeated unauthorized access, `03` §2.2).

### 0.9 Shared application patterns referenced by pages (from `02_IA` §9)

`ApplicationList`, `ApplicationDetail`, `StatusTimeline`, `StatusBadge`, `AssignmentCard`, `ApprovalHistory`, `ProfileSections`, `DocumentViewer`, `NotificationCenter`, plus infrastructure: `RouteGuard`, role-aware page wrapper. Pages reference these by name; they are not DS components.

---

## 1. Page Index

30 pages. "Route (role)" reflects the flat `/expert-hub/*` namespace with role-aware rendering (`P-02`/`P-03`) — the same route can be two Page IDs for two roles.

| # | Page ID | Name | Route | Group | Roles | Priority | Release |
|---|---|---|---|---|---|---|---|
| 1 | EH-PUB-01 | Expert Hub Landing | `/expert-hub` (visitor) | Public | Visitor | P0 | R1 |
| 2 | EH-PUB-02 | Trainer Directory | `/expert-hub/directory` | Public | Visitor | P1 | R2 |
| 3 | EH-PUB-03 | Public Trainer Profile | `/expert-hub/directory/:trainerId` | Public | Visitor | P1 | R2 |
| 4 | EH-TP-01 | Portal Home | `/expert-hub` (trainer) | Trainer | Trainer | P1 | R2 |
| 5 | EH-TP-02 | My Applications | `/expert-hub/applications` (trainer) | Trainer | Trainer | **P0** | R1 |
| 6 | EH-TP-03 | Application Details | `/expert-hub/applications/:id` (trainer) | Trainer | Trainer | **P0** | R1 |
| 7 | EH-TP-04 | My Profile | `/expert-hub/profile` (trainer) | Trainer | Trainer | **P0** | R1 |
| 8 | EH-TP-05 | New Application | `/expert-hub/applications/new` | Trainer | Applicant/Trainer | P1 | R2 |
| 9 | EH-TP-06 | Add Service | `/expert-hub/applications/:id/add-service` | Trainer | Trainer | P1 | R2 |
| 10 | EH-TP-07 | My Assignments / Offers | `/expert-hub/assignments` (trainer) | Trainer | Trainer | P1 | R2 |
| 11 | EH-TP-08 | My Entitlements | `/expert-hub/payments` (trainer) | Trainer | Trainer | P2 | R3 |
| 12 | EH-TP-09 | Notifications | `/expert-hub/notifications` | Trainer | Trainer | P2 | R3 |
| 13 | EH-TP-10 | Account & Visibility | `/expert-hub/account` | Trainer | Trainer | P2 | R3 |
| 14 | EH-INT-01 | Internal Dashboard | `/expert-hub` (staff) | Internal | Employee/Manager | P1 | R2 |
| 15 | EH-INT-02 | Application Inbox | `/expert-hub/applications` (staff) | Internal | Employee/Manager | P1 | R2 |
| 16 | EH-INT-03 | Screening Detail | `/expert-hub/applications/:id` (screening) | Internal | Screening Mgr | P1 | R2 |
| 17 | EH-INT-04 | Interview Evaluation | `/expert-hub/applications/:id` (interview) | Internal | Employee | P1 | R2 |
| 18 | EH-INT-05 | Committee Decision | `/expert-hub/applications/:id` (committee) | Internal | Committee member | P1 | R2 |
| 19 | EH-INT-06 | Agreement Management | `/expert-hub/agreements` | Internal | Manager | P1 | R2 |
| 20 | EH-INT-07 | Trainer Profiles (search) | `/expert-hub/profile` (staff) | Internal | Employee/Manager | P1 | R2 |
| 21 | EH-INT-08 | Trainer Profile (comprehensive) | `/expert-hub/profile/:trainerId` | Internal | Employee/Manager | P1 | R2 |
| 22 | EH-INT-09 | Assignment Request + Matching | `/expert-hub/assignments` (staff) | Internal | Coordinator/Employee | P1 | R2 |
| 23 | EH-INT-10 | Entitlements Ledger | `/expert-hub/payments` (staff) | Internal | Employee/Manager | P2 | R3 |
| 24 | EH-INT-11 | Speaker Records | `/expert-hub/speakers` | Internal | Employee | P2 | R3 |
| 25 | EH-INT-15 | Analytics Dashboards | `/expert-hub/analytics` | Internal | Manager/Senior Mgmt | P2 | R3 |
| 26 | EH-INT-16 | Integration Registry / Logs | `/expert-hub/integrations` | Internal | Admin | P2 | R3 |
| 27 | EH-INT-12 | Notification Matrix / Templates | `/expert-hub/comms/notifications` | Admin | Admin | P2 | R3 |
| 28 | EH-INT-13 | Deadlines / SLA Console | `/expert-hub/comms/deadlines` | Admin | Admin | P2 | R3 |
| 29 | EH-INT-14 | Roles & Permissions | `/expert-hub/access` | Admin | Admin | P1 | R2 |
| 30 | EH-*-00 | Not Found / Unauthorized | `*`, `/expert-hub/403` | Cross-cutting | All | P0 | R1 |

---

## 2. Public Pages

### EH-PUB-01 — Expert Hub Landing

**1. Page Information** — ID EH-PUB-01 · Landing · Route `/expert-hub` (visitor render) · Parent none (root) · Roles Visitor (unauthenticated) + any authenticated role sees their role-home instead per `P-03` · Module Public Directory & Consent · BRD CAP-10 · Flows J8 (landing portion), J1 (entry) · Priority P0 · MVP R1.

**2. Purpose** — Business: introduce the platform and drive qualified applications; establish trusted institutional presence (BRD driver "حضور مؤسسي موثوق"). User goal: understand what Expert Hub is, who it's for, how to join, in under a minute. Success: visitor proceeds to Apply (→J1) or Directory (→EH-PUB-02).

**3. Entry Conditions** — Public; no auth. Reachable directly or via Academy-site entry points (`BR-1001`). If an authenticated trainer/staff hits `/expert-hub`, they are role-rendered to their home (EH-TP-01/EH-INT-01), not this page.

**4. Exit Conditions** — Visitor navigates to New Application (triggers SSO if unauthenticated), or to Directory, or leaves. No state is created by this page.

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Landing marketing content (hero, value prop, 5 service types, how-it-works, CTAs) | Expert Hub | Y | Y (admin) | Y (admin) | N | none | none (static, `BR-1008`) | `G10` resolved (static for MVP, CMS-ready) — content source is Expert-Hub-owned static config |

Content is **static and admin-updated**, independent of any trainer's data (`BR-1008`). No FAST/MTM/ERP data.

**6. Sections** — Hero + value proposition; Who it's for (the 5 service types per BRD §6); How it works (journey overview); Primary CTA "Apply / Join"; Secondary link "Browse Directory"; Footer. Each section: purpose = orient/convert; business rule = `BR-1001`/`BR-1008` (static, entry-point routed); visibility = all visitors; permissions = public; no per-section actions beyond the CTAs; dependency = shared shell + i18n.

**7. User Actions**

| Action | Trigger | Validation | System response | Integration | Navigation | Audit | Notify |
|---|---|---|---|---|---|---|---|
| Apply / Join | CTA click | none | route to `/expert-hub/applications/new`; SSO if unauthenticated | SSO (on the next page) | → EH-TP-05 (or SSO→back) | no | no |
| Browse Directory | link click | none | route | none | → EH-PUB-02 | no | no |
| Language toggle | control | none | switch AR/EN, persist (`NFR-28`) | none | stay | no | no |

**8. Business Rules** — `BR-1001` (landing is part of Expert Hub itself, entry-point routed from Academy site, no external data), `BR-1008` (static, admin-updated, no lifecycle/accreditation state).

**9. Integrations** — None on this page. (SSO fires only when the Apply CTA leads into an authenticated flow.)

**10. Permissions** — Visitor: View ✓, all other verbs ✗ (nothing to create/edit here). Authenticated roles never see this page (role-rendered away).

**11. Page States** — Loading (near-instant, static); Success (rendered). Empty/Partial/Sync/Offline **N/A** (no data dependency). System Error only if the static content bundle fails to load → generic ErrorState.

**12. Messages** — None transactional. (No confirmations/validations — nothing is submitted here.)

**13. Accessibility** — Inherits §0.5. Delta: hero heading is the page's H1 and initial focus target; CTAs are real buttons/links with discernible names; landmark structure for a marketing page (banner/main/contentinfo).

**14. Analytics** — Inherits §0.6 `Page Viewed`. Plus: `Landing CTA Clicked` (which CTA), `Directory Link Clicked`, `Language Toggled`.

**15. Future Enhancements** — CMS-managed content (architecture already allows, `G10`); localized hero imagery; A/B-testable CTAs. None in MVP.

**16. Dependencies** — Flow J8/J1; API none; DB static content config; Integration none; Background job none; Config landing content (Expert-Hub-owned); Blocking gap none for MVP.

**17. Wireframe Inputs** — Required sections: hero, value prop, service-type cards, how-it-works steps, CTA band, footer. Important actions: Apply, Browse Directory, language toggle. Components implied: Section, Container, Card, Button, Typography, Header, Footer, Divider (all Approved). No tables/lists/dialogs/filters/timeline/stepper/rating/notification area.

---

### EH-PUB-02 — Trainer Directory

**1. Page Information** — ID EH-PUB-02 · Trainer Directory · `/expert-hub/directory` · parent `/expert-hub` · Roles Visitor · Module Public Directory & Consent · CAP-10 · Flow J8 · P1 · R2.

**2. Purpose** — Business: showcase the accredited expert base publicly and transparently. User goal: find consented trainers by specialty. Success: visitor opens a public profile (→EH-PUB-03).

**3. Entry Conditions** — Public.

**4. Exit Conditions** — Visitor opens a profile or refines filters; no state created.

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Consent-visible trainer projection (whitelisted: brief bio, specialty, general classification) | Expert Hub (derived from CAP-04 whitelist) | Y | N | N | N | auto from CAP-04 (`BR-1005`) | directory query | none |
| Consent flag | Expert Hub | Y | N | N | N | — | filter | none |
| Specialty taxonomy (filter values) | Expert Hub | Y | N | N | N | — | — | none |

Only trainers with consent = true appear (`BR-1002`). Whitelisted fields only (`BR-1004`) — never financial/sensitive. **No rating shown** (deferred, `BR-1006`/`G60`). FAST-sourced whitelisted fields, if unavailable, are **omitted** not stale-shown (§0.1 rule 1, public variant).

**6. Sections** — Search/filter bar (by specialty); results grid of consented trainers; pagination. Business rule `BR-1002`/`BR-1004`. Visibility: public. No write actions.

**7. User Actions** — Filter by specialty (client+server query, no auth, no audit); open a profile (→EH-PUB-03); paginate. None create state or fire notifications.

**8. Business Rules** — `BR-1002` (consent required), `BR-1004` (whitelist), `BR-1005` (auto-sync from CAP-04), `BR-1006` (no public rating yet).

**9. Integrations** — Reads a whitelisted projection of CAP-04 (Expert-Hub-owned; underlying core fields FAST-owned but only the projection is exposed). No direct external call from this public page. Fallback: unavailable field omitted.

**10. Permissions** — Visitor: View ✓ only. No other verbs. Trainers manage their own presence via consent on EH-TP-04/EH-TP-10, not here.

**11. Page States** — Loading; Empty ("no trainers match"); Success. Partial (a whitelisted field missing → omitted). Offline external service → if projection source unreachable, generic unavailable. No Sync states (read-only public).

**12. Messages** — Empty-results message (purpose: guide to broaden filter). No confirmations/validations.

**13. Accessibility** — Inherits §0.5. Delta: filter controls labeled; results announced as a list with count; each card keyboard-focusable with a discernible link name.

**14. Analytics** — `Page Viewed`; `Directory Filtered` (specialty); `Public Profile Opened`.

**15. Future Enhancements** — Public rating display once `G60` resolves; additional filters (city, classification) subject to whitelist; sorting. Not MVP.

**16. Dependencies** — Flow J8; API directory query; DB consent + public projection; Integration none direct; Job the CAP-04→projection sync (`BR-1005`); Config specialty taxonomy; Blocking gap `G60` (rating display, deferred — does not block the directory itself).

**17. Wireframe Inputs** — Sections: filter/search bar, results grid, pagination. Actions: filter, open profile. Components: Card, SearchBox, Select, Tag, Pagination, Avatar (Approved). Filters: specialty. Search: yes. No timeline/stepper/rating/dialogs.

---

### EH-PUB-03 — Public Trainer Profile

**1. Page Information** — ID EH-PUB-03 · Public Trainer Profile · `/expert-hub/directory/:trainerId` · parent `/expert-hub/directory` · Roles Visitor · Module Public Directory & Consent · CAP-10 · Flow J8 · P1 · R2.

**2. Purpose** — Business: present one accredited expert publicly. User goal: read a trainer's public profile. Success: visitor understands the trainer's scope; may proceed to Apply themselves.

**3. Entry Conditions** — Public; the `:trainerId` must resolve to a **consented** trainer. If consent is false/withdrawn, the page resolves to not-found/hidden (not an error, `BR-1007`).

**4. Exit Conditions** — Visitor reads and leaves, or returns to directory. No state created.

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Whitelisted public profile (bio, specialty, general classification) | Expert Hub (derived from CAP-04) | Y | N | N | N | auto (`BR-1005`) | get-by-id | none |
| Consent state | Expert Hub | Y | N | N | N | — | gate | none |

**6. Sections** — Identity/summary (name, general classification, specialty); public bio. All read-only, whitelist only. No rating section (deferred). Business rule `BR-1004`/`BR-1007`.

**7. User Actions** — View only; back to directory. No writes.

**8. Business Rules** — `BR-1004`, `BR-1005`, `BR-1006` (no rating), `BR-1007` (withdrawal hides immediately).

**9. Integrations** — Same as EH-PUB-02 (whitelisted projection). Fallback: missing field omitted; withdrawn consent → hidden.

**10. Permissions** — Visitor View ✓ only.

**11. Page States** — Loading; Success; Not-found/Hidden (consent false/withdrawn — treated as 404-equivalent, not error); Partial (field omitted). No Sync states.

**12. Messages** — Not-found/hidden message when the profile isn't publicly visible (purpose: neutral "not available," never reveals whether the trainer exists but withheld consent — privacy).

**13. Accessibility** — Inherits §0.5. Delta: profile name is H1; sections use heading structure; no color-only classification indicator.

**14. Analytics** — `Page Viewed` (trainerId pseudonymous); `Public Profile Viewed`.

**15. Future Enhancements** — Public rating (post-`G60`); contact/enquiry CTA (needs business decision). Not MVP.

**16. Dependencies** — Flow J8; API get-by-id (public); DB public projection + consent; Integration none direct; Job CAP-04 sync; Config whitelist definition (`G12` governs the exact field list, still open for exact whitelist); Blocking gap `G12` (public field whitelist — affects exactly which fields render).

**17. Wireframe Inputs** — Sections: identity/summary, bio. Components: Card, Avatar, Tag, Typography. No rating display (deferred), no tables/filters/timeline.

---

## 3. Trainer Portal Pages

> All trainer pages inherit: auth = SSO session + `trainer` role (§0.7); data scope = own data only, enforced server-side; the shared shell renders the trainer nav set (`02_IA` §7). Sections 3/4/9/13 repeat this baseline only where a page adds a delta.

### EH-TP-01 — Portal Home

**1. Page Information** — ID EH-TP-01 · Portal Home · `/expert-hub` (trainer render) · parent none (root, role-resolved) · Roles Trainer · Module Reporting (CAP-09, personal) · CAP-09 (`US-0906`) · Flows all (entry surface) · P1 · R2.

**2. Purpose** — Business: give the trainer a single personal overview to reduce status inquiries. User goal: see my applications/assignments/entitlements/rating at a glance and navigate. Success: trainer reaches the right sub-area in one click.

**3. Entry Conditions** — Authenticated trainer. (Applicant-only users with no approved profile land on My Applications instead — no personal metrics exist yet.)

**4. Exit Conditions** — Navigates to a sub-area. No state created.

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Personal metric tiles (program count, avg rating, entitlement summary) | Expert Hub (computed, `BR-0904`) | Y | N | N | N | live read | metrics API | `G9` (charting/metric approach), `G13` (metric definitions) |
| Overall rating (calculated) | Expert Hub (calculated from MTM raw, `02D`) | Y | N | N | N | see MTM sync | rating API | `G41`/`G42` (MTM contract), `G53`+ (formula) |
| Application/assignment status summaries | Expert Hub | Y | N | N | N | — | summary API | — |

**6. Sections** — Metric tiles (programs, avg rating, entitlement status — `US-0906`); shortcuts to My Applications / My Profile / My Assignments / My Entitlements; recent notifications preview. Business rule `BR-0902` (role-scoped — trainer sees only own), `BR-0904` (no stored source data). Rating tile shows the **calculated** value with last-refresh; "no rating yet" if none.

**7. User Actions** — Navigate to sub-areas; open a metric for detail. Read-only, no writes/notifications/audit.

**8. Business Rules** — `BR-0902` (own scope), `BR-0904` (live read), `BR-0906`-analog (`US-0906` personal metrics).

**9. Integrations** — MTM indirectly (via the calculated rating, already persisted — no live MTM call on page load; refresh is event-driven per `02D` §7). No FAST/ERP direct call. Fallback: rating tile shows "unavailable"/"pending" per §0.2.

**10. Permissions** — Trainer: View ✓ (own only). No other verbs. `Metric` DS component is Missing → compose from Card/Typography/Tag (§0.3).

**11. Page States** — Loading (Skeleton Missing → Loading spinner, §0.3); Empty (new trainer, no programs → "no activity yet"); Partial (rating pending); Success. Sync-Pending/Failed surface only on the rating tile as "pending"/"unavailable," never a raw error to the trainer (§0.2).

**12. Messages** — Empty-state ("no activity yet"); rating-pending. No confirmations.

**13. Accessibility** — Inherits §0.5. Delta: metric tiles are readable as labeled figures, not color-coded alone; live region announces when a pending rating resolves.

**14. Analytics** — `Page Viewed`; `Portal Home Tile Clicked`; `Rating Viewed` (calculated, on home).

**15. Future Enhancements** — Personalized insights, trend sparklines (needs `Metric`/charting, `G9`). Not MVP.

**16. Dependencies** — Flows (entry); API metrics + rating + summaries; DB calculated ratings, application/assignment state; Integration MTM (indirect); Job rating recalculation (`02D` §7); Config metric definitions; Blocking gaps `G9`, `G13`, `G41`/`G42`, `G53`+.

**17. Wireframe Inputs** — Sections: metric tiles, shortcuts, notifications preview. Status indicators: rating state, application/assignment counts. Rating display: calculated overall (with pending/unavailable states). Notification area: preview. Components: Card, Table, Divider, Tag, Loading. Metric tile = Missing DS component, composed. No forms/filters.

---

### EH-TP-02 — My Applications (MVP, full depth)

**1. Page Information** — ID EH-TP-02 · My Applications · `/expert-hub/applications` (trainer render) · parent `/expert-hub` · Roles Trainer/Applicant · Module Applications · CAP-01/04 (`US-0104`, `US-0410`) · Flow J1 (tracking portion) · **P0** · **R1**.

**2. Purpose** — Business: trainer self-service; reduce manual status inquiries (BRD driver "تحسين تجربة المدرب"). User goal: track all my join/add-service applications and their live status in one place; start a new one. Success: trainer sees accurate aggregated status and opens the right application or starts a compliant new one.

**3. Entry Conditions** — Authenticated (SSO). Any authenticated person may have applications (an applicant becomes a trainer only after approval). No approved-trainer requirement to view this page.

**4. Exit Conditions** — Opens an application (→EH-TP-03), or starts a new application (→EH-TP-05, guarded by one-active-application rule `BR-0101`).

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Application list (id, reference, services[], aggregated status, createdAt, submittedAt, updatedAt) | Expert Hub | Y | N (created on EH-TP-05) | N | N | none (own data) | list-my-applications | — |
| Aggregated presentation status | Expert Hub (aggregates CAP-02/03 live, `BR-0108`) | Y | N | N | N | derived | list API | `G8` **resolved** — 11-status vocab (`P-05`) |
| One-active-application flag | Expert Hub | Y | N | N | N | — | list API | — (`BR-0101`) |

**Status shown is the aggregated, trainer-visible presentation vocabulary only** (`P-05`, §3.1 of `03`): Draft, Submitted, Under Review, Interview Scheduled, Interview Completed, Approval in Progress, Approved, Agreement Pending, Active, Rejected, Closed. Never internal technical states, never FAST-sync state.

**6. Sections**

| Section | Purpose | Business rule | Required info | Primary action | Secondary | Visibility | Permissions | Deps |
|---|---|---|---|---|---|---|---|---|
| Applications list | show all my applications + live status | `BR-0108` aggregation, `BR-0107` ref only after submit | reference, services, status Tag, dates | Open application | — | trainer, own only | View | list API |
| New-application CTA | start a compliant new application | `BR-0101` one active only | enabled/disabled per active-application rule | New Application | — | trainer | Create | EH-TP-05, `BR-0101` |
| Empty state | first-time guidance | — | "no applications yet" + Apply CTA | Apply | — | trainer | — | — |

Drafts (not yet submitted) appear without a reference number (`BR-0107`) — visually distinct from submitted items.

**7. User Actions**

| Action | Trigger | Validation | System response | Integration | Navigation | Audit | Notify |
|---|---|---|---|---|---|---|---|
| Open application | row click | ownership check (server) | load detail | none | → EH-TP-03/:id | no | no |
| Start New Application | CTA | **`BR-0101`**: no existing un-decided application | if allowed route; else block with reason | none | → EH-TP-05 | no (creation audited on submit) | no |
| Resume draft | draft row | ownership | load draft in New Application | none | → EH-TP-05 (draft) | no | no |

**8. Business Rules** — `BR-0101` (one active application; blocks new-application CTA), `BR-0107` (reference only at submit — drafts have none), `BR-0108` (status is a live aggregation of CAP-02/03, this page holds no independent status copy), `US-0104`/`US-0410` (track applications and program requests from one place).

**9. Integrations** — None direct (status aggregation is internal to Expert Hub across CAP-01/02/03). No FAST/MTM/ERP call on this page.

**10. Permissions**

| Role | View | Create | Update | Delete | Approve | Reject | Export | Synchronize |
|---|---|---|---|---|---|---|---|---|
| Trainer/Applicant | ✓ own | ✓ (new, per `BR-0101`) | ✓ (own draft) | ✓ (own draft only) | ✗ | ✗ | ✗ | ✗ |
| Staff roles | — (this route renders EH-INT-02 for staff) | | | | | | | |

**11. Page States** — Loading (Loading spinner; Skeleton Missing §0.3); Empty ("no applications yet" + Apply CTA); Success (populated list); System Error (list load fails → ErrorState + retry); Partial (a single row's aggregation temporarily incomplete → that row shows a neutral "updating" status, never a wrong status). No-Permission (403 if somehow reached without trainer role). Sync-Pending/Failed **N/A to the trainer view** (FAST-sync state is never shown here). Offline external service N/A.

**12. Messages** — New-application blocked (purpose: explain the one-active-application rule and point to the existing application). Empty state (purpose: encourage first application). Error/retry (purpose: recover from load failure). No success message (viewing isn't a transaction).

**13. Accessibility** — Inherits §0.5. Delta: list is a proper table/list with row headers; status conveyed by text + Tag shape (not color alone); "New Application" disabled state has an accessible explanation (not a silent grey button); focus lands on the list heading on load.

**14. Analytics** — `Page Viewed`; `Applications List Viewed` (count); `New Application Started`; `New Application Blocked` (reason = active-application); `Application Opened`.

**15. Future Enhancements** — Filters/sort (needs `Table Header Cell - Sort/Filter`, Missing, `G15`); search; bulk actions. Not MVP.

**16. Dependencies** — Flow J1; API list-my-applications (+ aggregated status); DB Applications + status aggregation over CAP-02/03; Integration none; Job none; Config status vocabulary (`P-05`, resolved); Blocking gap none for MVP (sort/filter deferred, not blocking the list itself).

**17. Wireframe Inputs** — Required sections: applications list, new-application CTA, empty state. Important actions: Open, New Application (with disabled/blocked state), resume draft. Status indicators: 11-state `StatusBadge` (application). Tables: applications list (stacks to cards on mobile). Lists: yes. Empty state: yes. No dialogs/timeline/stepper/rating/search/filters in MVP. Components: Table, Tag (StatusBadge pattern), Button, EmptyState, ErrorState, Loading, Card, Pagination.

---

### EH-TP-03 — Application Details (MVP, full depth)

**1. Page Information** — ID EH-TP-03 · Application Details · `/expert-hub/applications/:id` (trainer render) · parent `/expert-hub/applications` · Roles Trainer/Applicant · Module Applications (+ Screening/Interview/Agreement read) · CAP-01/02/03 (`US-0104`, `US-0205`, `US-0215`) · Flow J1 (tracking + action portion) · **P0** · **R1**.

**2. Purpose** — Business: move applicants through the funnel with minimal manual coordination. User goal: see one application's full state/history and take the next required action (pick an interview slot; sign + upload the agreement). Success: the applicant completes each stage's action from the portal without offline coordination.

**3. Entry Conditions** — Authenticated; `:id` resolves to an application **owned by** the requester (server-enforced; otherwise 403/404 per §0.7, `03` §2.16). The available actions depend on the application's current lifecycle stage.

**4. Exit Conditions** — Applicant selects/confirms an interview slot; or signs the agreement + uploads the signed copy (→ business status Approved, `BR-0214`); or simply reviews (read-only stages).

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Application (full) + aggregated status | Expert Hub | Y | N | N | N | derived (`BR-0108`) | get-by-id | `G8` resolved |
| Status history / timeline | Expert Hub | Y | N | N | N | — | history API | — |
| Interview slots | Expert Hub (scheduling, CAP-02) | Y | N | U (confirm one) | N | — | slots API | `G6` (interview model affects upstream, not the slot pick) |
| Agreement document + signature state | Expert Hub (record) / file storage (file) | Y | N | U (upload signed) | N | — | agreement API | `G26` (file storage location) |
| Attachments | Expert Hub (refs) | Y | N | Y (signed copy) | N | — | upload API | `G26`, `G27` (AV/validation) |

Note: the signed agreement **file** storage location is `G26` (open); the agreement **record/status** is Expert-Hub-owned.

**6. Sections**

| Section | Purpose | Business rule | Required info | Primary action | Secondary | Visibility | Permissions | Deps |
|---|---|---|---|---|---|---|---|---|
| Header | identify the application + current status | `BR-0107`/`BR-0108` | reference, services, aggregated status | — | — | owner | View | — |
| Status timeline/history | show progress + past decisions | `BR-0108` | ordered stage history, current stage emphasized | — | — | owner | View | StatusTimeline pattern |
| Per-service outcome | show accept/reject per service where applicable | `BR-0207` (per-service note) | service → outcome | — | — | owner | View | — |
| Contextual action panel | enable the one next action for the current stage | stage-driven | slot options OR agreement to sign OR nothing | Select slot / Sign+upload | view attachments | owner, stage-gated | Update (own) | slots/agreement API |
| Attachments | view own docs + agreement | `BR-0106` | file list, download | Upload signed copy (agreement stage) | download | owner | Update | file storage (`G26`) |

The action panel is **stage-driven, not audience-driven** (`03` §J5 risk R2 / plan §6.3): one action per stage — interview-slot selection when awaiting confirmation (`BR-0206`), agreement view/sign when sent (`BR-0214`), read-only otherwise.

**7. User Actions**

| Action | Trigger | Validation | System response | Integration | Navigation | Audit | Notify |
|---|---|---|---|---|---|---|---|
| Select interview slot | panel, when stage = awaiting-confirmation | slot within selection window (SLA `BR-0206`); a slot chosen | confirm slot; status → Interview Scheduled | none | stay (panel updates) | yes | yes (mgmt, per matrix) |
| Sign agreement + upload | panel, when stage = agreement sent | file valid (`BR-0106`); signature step complete | store signed copy; business status → Approved (`BR-0214`); agreement → CAP-03 Active; **FAST sync requested separately** | file storage (`G26`); FAST sync (async, separate status) | stay | yes | yes |
| View/download attachment | list | ownership | serve file | file storage | — | no (download may be logged if sensitive) | no |
| Retry on error | error state | — | reload | none | stay | no | no |

**Explicit rule honored:** signing does not depend on FAST; FAST synchronization runs afterward on a **separate status track**; a FAST failure never reverts the Approved business status (`02C` §5.4, `03` J1).

**8. Business Rules** — `BR-0108` (live aggregated status), `BR-0206` (slot selection in portal; email is notify-only), `BR-0214` (applicant signs + uploads in portal → auto Approved, agreement handed to CAP-03), `BR-0106` (attachment validation), `US-0104`/`US-0205`/`US-0215`.

**9. Integrations**

| Integration | Purpose | Direction | Trigger | Blocking dep | Fallback |
|---|---|---|---|---|---|
| File storage | store signed agreement + read attachments | EH ↔ storage | upload/view | `G26` (location undecided), `G27` (AV/validation) | upload retry (`03` err #14); read → unavailable |
| FAST (post-sign) | sync approved trainer to FAST | EH → FAST | after signature | `G36` (trainer API) | separate sync status; retry; **business status unaffected** |
| Notification | notify mgmt on slot pick / status change | EH → gateway | actions | none | in-platform copy still shows (`BR-0701`) |

**10. Permissions**

| Role | View | Create | Update | Delete | Approve | Reject | Export | Synchronize |
|---|---|---|---|---|---|---|---|---|
| Trainer/Applicant (owner) | ✓ | ✗ | ✓ (slot, signed copy) | ✗ | ✗ (applicant "approval" = own signature, not a decision verb) | ✗ | ✗ | ✗ (FAST sync is system-driven) |
| Non-owner | ✗ (403) | | | | | | | |
| Staff | this route renders EH-INT-03/04/05 for staff | | | | | | | |

**11. Page States** — Loading; Success (rendered at whatever stage); Not-found/403 (bad/foreign id); System Error + retry; Partial (a sub-section like slots temporarily unavailable → that panel shows unavailable, rest renders); **Sync-Pending** (agreement signed, FAST sync in flight → shown to the trainer, per §J5 this is the one FAST-status trainers do see, as a neutral "processing" indicator — never "Synchronization Failed" raw); Sync-Failed → shown to trainer as "still processing," internal alert raised. Offline external service (file storage down → upload disabled with message). Validation Error (invalid file / no slot chosen).

**12. Messages** — Slot-selection confirmation (purpose: confirm the chosen time); signature/upload confirmation (purpose: confirm submission + that they're now approved); invalid-file validation (format/size); upload-failure (retry); status-change live announcement; agreement-processing (post-sign, neutral). Not-found/forbidden (neutral). No final UX copy — purposes only.

**13. Accessibility** — Inherits §0.5. Delta: timeline is a semantic ordered structure with the current step programmatically indicated; action panel receives focus when a new action becomes available; live region announces status transitions; slot options are a labeled radio group; file upload has clear labeling + error association.

**14. Analytics** — `Page Viewed`; `Application Details Viewed` (stage); `Interview Slot Selected`; `Agreement Signed`; `Agreement Upload Failed`; `Attachment Downloaded`.

**15. Future Enhancements** — In-page messaging with the review team; downloadable status certificate. Not MVP.

**16. Dependencies** — Flow J1; API get-by-id, history, slots, agreement, upload; DB Application + StatusHistory + InterviewSlot + Agreement; Integration file storage, FAST (post-sign), notification; Job FAST sync; Config SLA windows; Blocking gaps `G26`/`G27` (file storage/AV — affect the upload step), `G36` (FAST sync — affects only the post-sign sync, not the sign itself), `G6` (upstream interview model, not this page's slot pick).

**17. Wireframe Inputs** — Required sections: header, status timeline, per-service outcome, contextual action panel, attachments. Important actions: select interview slot, sign+upload agreement, download. Status indicators: 11-state `StatusBadge` + FAST "processing" (post-sign only). Timeline: yes (StatusTimeline pattern, `Steps`-based). Stepper: the timeline doubles as stage progress. Attachments: yes (DocumentViewer pattern). Dialogs: sign-agreement confirmation, slot-selection confirmation. No search/filters/rating. Components: Card, Tag, Steps, Alert, Button, Modal, DatePicker, FileUploader, Divider.

---

### EH-TP-04 — My Profile (MVP, full depth)

**1. Page Information** — ID EH-TP-04 · My Profile · `/expert-hub/profile` (trainer render) · parent `/expert-hub` · Roles Trainer · Module Trainer Profile Integration · CAP-04 (`US-0403/0405/0406/0408`) · Flow J5 · **P0** · **R1**.

**2. Purpose** — Business: keep the trainer's authoritative record current for matching/decisions. User goal: view my full profile and update the fields I'm allowed to; see my approved scope, programs, and rating. Success: trainer updates permitted fields; FAST-owned change requests route correctly; locked data is clearly non-editable.

**3. Entry Conditions** — Authenticated approved **trainer** (profile exists only post-accreditation, `BR-0401`). An applicant without an approved profile does not have this page populated.

**4. Exit Conditions** — Trainer saves an Expert-Hub-owned field; or submits a FAST-owned field **change request**; or toggles consent; nothing else changes authoritative state directly.

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Core profile, experience, roles/services, specializations, classification | **FAST** | Y | N | via **change request** only | N | FAST-01 read / FAST-02 write | FAST trainer API | `G36` |
| Editable personal/professional fields, certificates | Expert Hub | Y | N | Y | Y (own certs) | none | profile API | `G27` (cert AV) |
| Notification preferences, visibility consent | Expert Hub | Y | Y | Y | N | none | prefs API | — |
| Program history | FAST (execution) | Y | N | N | N | FAST-01 | programs API | `G36` |
| Ratings (calculated program + overall) | Expert Hub (calculated) / MTM (raw source) | Y | N | N (raw never editable, `02D`) | N | MTM sync + calc | rating API | `G41`/`G42`, `G53`+ |
| Locked fields (classification, evaluations, contract status) | FAST / Expert Hub (read-only, `BR-0411`) | Y | N | N | N | — | — | — |

**Field-ownership is displayed field-by-field** (§0.1): FAST-owned fields are locked with source + last-sync; Expert-Hub-owned fields are directly editable; permanently-locked fields (classification/evaluations/contract) are read-only regardless of role (`BR-0411`). Ratings are the **calculated** indicator, never the raw MTM value, never editable.

**6. Sections** — (uses the `ProfileSections` pattern, tabbed/stacked)

| Section | Purpose | Business rule | Required info | Primary action | Secondary | Visibility | Permissions | Deps |
|---|---|---|---|---|---|---|---|---|
| Identity/summary | who I am + overall rating | `US-0403` | avatar, name, contact, calculated overall rating | Edit contact (EH-owned) | — | owner | Update (EH-owned) | rating API |
| Services & Specialties | show approved scope (read-only) | `BR-0403` (per-service independent), `US-0405` | approved services/specialties/classification | — | — | owner | View | FAST-01 |
| Editable fields + certificates | self-update permitted data | `BR-0404` (same fields, no new form), `BR-0411` | editable personal/professional + cert uploads | Save / Upload cert | request FAST-field change | owner | Update / Create | profile + FAST-02 |
| Programs history | track accumulated experience | `US-0406` | program list (FAST-sourced) | — | — | owner | View | FAST-01 |
| Ratings | see my performance | `US-0408`, `02D` | calculated program + overall rating, last-refresh | — | — | owner | View | rating API |
| Visibility consent | control public presence | `BR-1002/1007`, `US-1003` | consent toggle state | Toggle consent | — | owner | Update | consent API |

**7. User Actions**

| Action | Trigger | Validation | System response | Integration | Navigation | Audit | Notify |
|---|---|---|---|---|---|---|---|
| Save EH-owned field | Save | field validation | persist directly | none | stay | yes | no |
| Request FAST-owned change | submit change request | validation; same original fields (`BR-0404`) | create change-request record; route for approval if required; then FAST-02; **old value stays displayed until FAST confirms** | FAST-02 | stay | yes | yes (on decision) |
| Upload certificate | upload | format/size (`BR-0106`), AV (`G27`) | store cert | file storage | stay | yes | no |
| Toggle visibility consent | toggle | none | update consent; directory reflects immediately (`BR-1007`) | none (affects EH-PUB-02/03) | stay | yes | no |

**Explicit rule honored (`03` J5):** a FAST-owned value is **never shown as changed** until FAST confirms — between submission and confirmation the pre-existing value is displayed with a "change pending" indicator.

**8. Business Rules** — `BR-0401` (profile auto-created on accreditation), `BR-0403` (per-service independent classification/evaluation), `BR-0404` (self-update via same fields, no separate form), `BR-0411` (classification/evaluations/contract locked, system-updated only), `BR-1002/1007` (consent + immediate withdrawal), `US-0403/0405/0406/0408`.

**9. Integrations**

| Integration | Purpose | Direction | Trigger | Blocking dep | Fallback |
|---|---|---|---|---|---|
| FAST | read core profile/experience/programs; submit approved changes | EH ↔ FAST | page load; change-request approval | `G36` | show last-known + last-sync; change stays "pending" if FAST down |
| MTM (indirect) | source of raw ratings → calculated display | EH ← MTM | event-driven refresh (`02D` §7) | `G41`/`G42` | rating "unavailable"/"pending" |
| File storage | certificate uploads | EH ↔ storage | upload | `G26`/`G27` | upload retry |

**10. Permissions**

| Role | View | Create | Update | Delete | Approve | Reject | Export | Synchronize |
|---|---|---|---|---|---|---|---|---|
| Trainer (owner) | ✓ | ✓ (cert, prefs) | ✓ EH-owned; **request-only** FAST-owned | ✓ own cert | ✗ | ✗ | ✗ | ✗ (sync system-driven) |
| Staff | this route renders EH-INT-07/08 for staff | | | | | | | |

**11. Page States** — Loading; Success (view mode); Edit (form mode); Saving; Partial (a FAST section unavailable → that section shows last-known + timestamp, rest renders); **Sync-Pending** (FAST change submitted, awaiting confirm → "change pending" on that field, old value shown); Sync-Failed (FAST down → field stays "pending," internal retry); Validation Error (inline); System Error + retry; Empty sub-sections (no programs/evals yet → inline empty). Offline external service (FAST/file storage down → relevant section degraded, not whole page).

**12. Messages** — Save success (EH-owned); change-request submitted (FAST-owned, purpose: clarify it's pending FAST, not yet official); change-request rejected; field-pending indicator; cert upload success/failure; consent toggle confirmation (purpose: clarify immediate public effect); locked-field explanation (purpose: why a field can't be edited). No final copy.

**13. Accessibility** — Inherits §0.5. Delta: locked fields are programmatically disabled **with an accessible reason** (not silent); edit/view mode change announced; FAST "change pending" state is text, not color-only; tab structure (`ProfileSections`) is a proper tablist; save feedback via live region + Toast.

**14. Analytics** — `Page Viewed`; `Profile Viewed`; `Profile Updated` (EH-owned); `FAST Change Requested`; `Certificate Uploaded`; `Consent Toggled`; `Rating Viewed` (calculated).

**15. Future Enhancements** — Profile completeness meter; richer experience timeline; export CV. Not MVP.

**16. Dependencies** — Flow J5; API profile, FAST-01/02, rating, prefs, consent, cert-upload; DB EH-owned profile fields + consent + prefs + calculated ratings; Integration FAST, MTM (indirect), file storage; Job rating recalculation, FAST change sync; Config editable-field whitelist (tied to `G22`/`G23` — **resolved** by `P-11`, so which fields are FAST vs EH is settled; the exact per-field list is a `06`-era detail); Blocking gaps `G36`, `G41`/`G42`, `G53`+, `G26`/`G27`.

**17. Wireframe Inputs** — Required sections: identity/summary + rating, services & specialties (read-only), editable fields + certs, programs history, ratings, visibility consent. Important actions: save EH-owned, request FAST change, upload cert, toggle consent. Status indicators: FAST "change pending" per field, rating pending/unavailable, locked-field markers. Rating display: calculated program + overall (never raw MTM). Tabs: ProfileSections. Attachments: certificates (DocumentViewer). Dialogs: change-request confirm, consent-toggle confirm. Forms: editable-field form (Field-based). No search/filters. Components: Card, Tabs, Avatar, Tag, Rating, Field, TextInput, Textarea, Select, FileUploader, Switch, Divider.

---

### EH-TP-05 — New Application

**1. Page Information** — ID EH-TP-05 · New Application · `/expert-hub/applications/new` · parent `/expert-hub/applications` · Roles Applicant/Trainer · Module Applications · CAP-01 (`US-0101/0102/0103`) · Flow J1 (submission portion) · P1 · R2.

**2. Purpose** — Business: standardized, complete join applications. User goal: select service(s), fill only the fields that apply, attach docs, submit. Success: a complete, validated application is submitted with a reference number.

**3. Entry Conditions** — Authenticated; **no existing un-decided application** (`BR-0101`). Draft may be resumed.

**4. Exit Conditions** — Application submitted (reference issued, `BR-0107`) → EH-TP-02; or saved as draft.

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Service catalogue (4 contractual services; Speaker excluded, `BR-0113`) | Expert Hub | Y | N | N | N | — | catalogue | — |
| **Field-mandatory map per service** | Expert Hub (admin config, `BR-0103`) | Y | N | N | N | — | field-map API | **`G5`/`DM-GAP-01`** |
| Application draft + field values + attachments | Expert Hub | Y | Y | Y | Y (draft) | — | draft/submit API | `G27` (AV) |

**6. Sections** — Service selection (multi-select, `BR-0104`); dynamic field form (union of mandatory fields across selected services, `BR-0104`); attachments (`BR-0106`); review + submit. Business rules `BR-0103/0104/0105`. **The exact dynamic field set is a placeholder until `G5` closes** — this page's structure is specified, its field list is not.

**7. User Actions** — Select services (drives which fields render); fill fields; upload attachments (validated on upload); save draft (no reference); submit (validates completeness `BR-0105`, issues reference `BR-0107`, notifies). Submit audited; confirmation notification sent.

**8. Business Rules** — `BR-0101` (gate to reach page), `BR-0103` (central field-map config), `BR-0104` (field mandatory if mandatory for ≥1 selected service), `BR-0105` (no submit until complete), `BR-0106` (attachment validation on upload), `BR-0107` (reference at submit only), `BR-0113` (Speaker not selectable here).

**9. Integrations** — File storage (attachments; `G26`/`G27`). No FAST/MTM/ERP.

**10. Permissions** — Applicant/Trainer: View ✓, Create ✓, Update ✓ (own draft), Delete ✓ (own draft). No approve/reject/export/sync.

**11. Page States** — Loading; Draft (in progress); Validation Error (missing mandatory / invalid file); Saving; Submitted/Success; System Error; **Field-map-unavailable** (if `G5` config missing → page can render the shell but not the real fields — explicit blocked state until `G5`). No sync states.

**12. Messages** — Missing-fields validation (points to gaps, `BR-0105`); invalid-attachment; draft-saved; submission success + reference (`BR-0107`); one-active-application block (if reached improperly).

**13. Accessibility** — Inherits §0.5. Delta: dynamic fields announced when they appear/disappear on service change; multi-step (if stepped) uses `Steps` with position announced; errors summarized and linked to fields.

**14. Analytics** — `Page Viewed`; `Application Draft Started`; `Services Selected`; `Application Submitted`; `Application Validation Failed`.

**15. Future Enhancements** — Save-and-resume across devices; inline eligibility hints. Not MVP.

**16. Dependencies** — Flow J1; API catalogue, field-map, draft, submit; DB Application draft; Integration file storage; Job none; Config **field-mandatory map (`BR-0103`)**; **Blocking gap `G5`/`DM-GAP-01`** (the whole dynamic-field section is placeholder until this closes).

**17. Wireframe Inputs** — Sections: service selection, dynamic field form, attachments, review/submit. Actions: select services, fill, upload, save draft, submit. Stepper: likely (`Steps`). Forms: dynamic (Field/Select/Checkbox/Textarea). Attachments: FileUploader. No tables/rating/timeline. Components: Field, Select, Checkbox, Textarea, FileUploader, Steps, Button.

---

### EH-TP-06 — Add Service

**1. Page Information** — ID EH-TP-06 · Add Service · `/expert-hub/applications/:id/add-service` · parent `/expert-hub/applications/:id` · Roles Trainer · Module Applications · CAP-01 (`US-0106`) · Flow J3 · P1 · R2.

**2. Purpose** — Business: let an approved trainer widen their scope with minimal friction. User goal: request a new service without re-doing a full application. Success: request submitted → routed to admin decision (bypasses screening/interview, `BR-0112`).

**3. Entry Conditions** — Authenticated approved trainer with an active agreement; the target service must not already be approved (`BR-0110`).

**4. Exit Conditions** — Add-service request submitted → admin decision path (J3).

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Currently approved services | **FAST** | Y | N | N | N | FAST-01 | FAST | `G36` |
| Delta field map (fields not already in file, `BR-0111`) | Expert Hub | Y | N | N | N | — | field-map | `G5` (partial) |
| Add-service request | Expert Hub | Y | Y | Y | N | FAST-05 (on approval) | request API | `G39` (FAST role/service sync) |

**6. Sections** — Current approved services (read-only, FAST-sourced, for duplicate prevention); new-service selection (excludes already-approved, `BR-0110`); delta fields only (`BR-0111`); submit. Business rules `BR-0110/0111/0112`.

**7. User Actions** — Select new service (duplicate blocked inline); fill delta fields; submit → routes directly to authorized admin (`BR-0112`), no screening. Submit audited + notifies admin.

**8. Business Rules** — `BR-0110` (no already-approved service), `BR-0111` (only missing fields), `BR-0112` (direct admin decision, bypass screening), `BR-0305` (approval → annex, not new agreement).

**9. Integrations** — FAST read (current services, FAST-01); FAST write on approval (role/service sync, FAST-05, `G39`). Fallback: if FAST read down, block with "cannot verify current services."

**10. Permissions** — Trainer: View ✓, Create ✓ (request). No approve/reject (that's admin, in the internal review path). No sync (system-driven).

**11. Page States** — Loading; Duplicate-service block (validation, `BR-0110`); Submitting; Submitted/Success; FAST-unavailable (can't read current services → blocked with reason); System Error.

**12. Messages** — Duplicate-service block; delta-fields prompt; submission success (routed to admin); FAST-unavailable.

**13. Accessibility** — Inherits §0.5. Delta: already-approved services clearly marked unselectable with reason.

**14. Analytics** — `Page Viewed`; `Add Service Requested`; `Duplicate Service Blocked`.

**15. Future Enhancements** — Bulk add multiple services. Not MVP.

**16. Dependencies** — Flow J3; API FAST-01, field-map, request; DB request + approval history; Integration FAST; Job FAST-05 on approval; Config delta field map; Blocking gaps `G36`, `G39`, `G5` (partial).

**17. Wireframe Inputs** — Sections: current services (read-only), new-service selection, delta form, submit. Actions: select, fill, submit. Forms: delta (Field/Select). No tables/timeline/rating. Components: Field, Select, FileUploader, Button.

---

### EH-TP-07 — My Assignments / Offers

**1. Page Information** — ID EH-TP-07 · My Assignments / Offers · `/expert-hub/assignments` (trainer render) · parent `/expert-hub` · Roles Trainer · Module Assignment & Matching · CAP-05 (`US-0505/0509/0510`) · Flow J4 (trainer portion) · P1 · R2.

**2. Purpose** — Business: trainers respond to offers and follow confirmed engagements from one place. User goal: accept/reject offers, follow confirmed programs, apologize if needed, upload training material. Success: offers get timely responses; confirmed engagements are visible with execution data.

**3. Entry Conditions** — Authenticated approved trainer; at least one offer or engagement exists (else empty).

**4. Exit Conditions** — Offer accepted/rejected; apology submitted; material uploaded.

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Offers + engagements (own) | Expert Hub | Y | N | U (respond) | N | — | assignments API | — |
| Plan/program detail (name, date) | FAST | Y | N | N | N | FAST-03 | FAST | `G36`/`G37` |
| Execution data (registrant count/names) | FAST | Y | N | N | N | FAST-05/link (`BR-0513`) | FAST | `G38` |
| Training material | Expert Hub (record) / file storage (file) | Y | Y (upload) | N | N | — | upload | `G26`/`G27` |
| Assignment sync status (separate) | Expert Hub | Y | N | N | N | FAST-04 | — | `G38` |

**6. Sections** — Offers (pending response); confirmed engagements (with execution data near date, `BR-0513`); material upload (training only, `BR-0506`/`US-0507`); apology control (`BR-0511`). Business rules `BR-0505/0507/0510/0511/0513`.

**7. User Actions** — Accept offer (→ confirmed, or material step for training); reject offer (→ auto-advance to next candidate, `BR-0507`, mgmt notified); apologize ≤4 days before (`BR-0511`, auto-advance to next candidate); upload material (training). All audited; mgmt notified on reject/apology (`US-0506/0511`).

**8. Business Rules** — `BR-0505` (3-candidate context), `BR-0507` (reject auto-advances), `BR-0510` (non-training confirms directly), `BR-0511` (apology window 4 days), `BR-0513` (execution data display), `US-0505/0507/0509/0510`.

**9. Integrations** — FAST read (plan/execution data); FAST-04 assignment sync status (display); file storage (material). Fallback: execution data unavailable → "not yet available."

**10. Permissions** — Trainer: View ✓ (own), Update ✓ (respond, upload). No create (requests are staff-created). No approve/reject of others. No sync.

**11. Page States** — Loading; Empty ("no assignments yet"); Success; Offer-response; Sync-Pending/Failed (assignment→FAST, shown neutrally); Partial (execution data pending); System Error; Offline external service (FAST down → plan detail unavailable).

**12. Messages** — Offer accept/reject confirmation; apology confirmation (purpose: clarify it advances to another candidate + notifies mgmt); material upload success/failure; execution-data-pending.

**13. Accessibility** — Inherits §0.5. Delta: offers are actionable cards with clear accept/reject; apology is a confirmed, clearly-labeled destructive-ish action.

**14. Analytics** — `Page Viewed`; `Offer Accepted`; `Offer Rejected`; `Assignment Apology Submitted`; `Training Material Uploaded`.

**15. Future Enhancements** — Calendar sync; in-app messaging with center. Not MVP.

**16. Dependencies** — Flow J4; API assignments, FAST-03, upload; DB offers/engagements; Integration FAST, file storage, notification; Job FAST-04 sync; Config apology window; Blocking gaps `G36`/`G37`/`G38`, `G26`/`G27`.

**17. Wireframe Inputs** — Sections: offers, confirmed engagements, material upload, apology. Actions: accept, reject, apologize, upload. Cards: AssignmentCard. Status indicators: offer status, assignment/FAST-sync (neutral), execution-data availability. Attachments: material (DocumentViewer). Dialogs: accept/reject/apology confirm. Components: Card, Alert, Modal, Button, FileUploader, Tag, Avatar.

---

### EH-TP-08 — My Entitlements

**1. Page Information** — ID EH-TP-08 · My Entitlements · `/expert-hub/payments` (trainer render) · parent `/expert-hub` · Roles Trainer · Module Financial Entitlements · CAP-06 (`US-0601`) · Flow J7 · P2 · R3.

**2. Purpose** — Business: transparent disbursement tracking, self-service. User goal: see my entitlement status/amount/date per program. Success: trainer tracks entitlements without contacting staff.

**3. Entry Conditions** — Authenticated approved trainer. Only fully-linked entitlements appear (`BR-0603`).

**4. Exit Conditions** — Read-only; no state created.

**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Entitlements (PO, amount, status, date) | **ERP** | Y | N | N | N | ERP read | ERP API | INT-03 contract (well-specified by BRD) |
| PO→Agreement→Program linkage | Expert Hub | Y | N | N | N | — | linkage API | — |

**Never edited locally** (`BR-0601`). Unlinked entitlements are **hidden** (`BR-0603`). ERP data is never presented stale — unavailable shown as unavailable (§J7, stricter for financial data).

**6. Sections** — Entitlement list (linked only), per program: status/amount/date. Business rules `BR-0601/0603/0605`.

**7. User Actions** — View only. No writes. No dispute workflow this release (`BR-0605`).

**8. Business Rules** — `BR-0601` (ERP-sourced, no local edit), `BR-0603` (hidden until full linkage), `BR-0605` (no dispute in-platform), `US-0601`.

**9. Integrations** — ERP read only. Fallback: unavailable (no stale amount).

**10. Permissions** — Trainer: View ✓ (own) only. No edit ever.

**11. Page States** — Loading; Empty (no linked entitlements); Success; Offline external service (ERP down → unavailable, no stale); Partial (some linked, some hidden — hidden ones simply absent). No sync-write states.

**12. Messages** — Empty ("no entitlements yet"); ERP-unavailable. No confirmations (read-only).

**13. Accessibility** — Inherits §0.5. Delta: amounts/statuses in a labeled table; status not color-only.

**14. Analytics** — `Page Viewed`; `Entitlements Viewed`.

**15. Future Enhancements** — Dispute/enquiry workflow (`G62`, deferred); export. Not MVP.

**16. Dependencies** — Flow J7; API ERP read, linkage; DB linkage records only (no amounts stored authoritative); Integration ERP; Job none; Config none; Blocking gap none blocking (ERP contract largely pre-specified).

**17. Wireframe Inputs** — Sections: entitlement list. Tables: entitlements (status/amount/date). Status indicators: disbursement status, unavailable state. No edit/dialogs/rating. Components: Table, Tag, Card.

---

### EH-TP-09 — Notifications

**1. Page Information** — ID EH-TP-09 · Notifications · `/expert-hub/notifications` · parent `/expert-hub` · Roles Trainer · Module Notifications · CAP-07 (`US-0701`) · Flow §2.4 · P2 · R3.

**2. Purpose** — Business: no missed events regardless of channel. User goal: read my in-platform notifications. Success: trainer sees all relevant events.

**3. Entry Conditions** — Authenticated. **4. Exit Conditions** — Read; no downstream state beyond read-state.

**5. Required Data** — Notification log (own), Expert Hub-owned; read/update-read-state; delivery status is Notification-Service-owned but the in-platform copy is Expert-Hub-owned (`BR-0702`).

**6. Sections** — Notification feed (`NotificationCenter` pattern); read/unread. Business rule `BR-0701` (multi-channel), `BR-0707` (single language per recipient).

**7. User Actions** — View; mark read. No destructive actions. Read-state update audited only if needed.

**8. Business Rules** — `BR-0701/0702/0707`.

**9. Integrations** — Notification Service (delivery status only; content is template-sourced, `BR-0701`). Fallback: in-platform copy always available even if email failed.

**10. Permissions** — Trainer: View ✓ (own), Update ✓ (read-state). No others.

**11. Page States** — Loading; Empty ("no notifications"); Success. No sync-write.

**12. Messages** — Empty state. No confirmations.

**13. Accessibility** — Inherits §0.5. Delta: unread conveyed by text/shape not color; feed is a labeled list; new items announced via live region.

**14. Analytics** — `Page Viewed`; `Notification Read`.

**15. Future Enhancements** — Per-category preferences, digest. Not MVP.

**16. Dependencies** — Flow §2.4; API notification log; DB Notification Log; Integration Notification Service (delivery); Job delivery; Config notification matrix (`G17` language source); Blocking gap `G17` (language source, seeded direction).

**17. Wireframe Inputs** — Sections: notification feed. Notification area: yes (NotificationCenter). Lists: yes. Status: read/unread. Components: Notification, Toast, EmptyState.

---

### EH-TP-10 — Account & Visibility

**1. Page Information** — ID EH-TP-10 · Account & Visibility · `/expert-hub/account` · parent `/expert-hub` · Roles Trainer · Module Public Directory & Consent + Identity · CAP-08/10 (`US-0806`, `US-1003`) · Flows J5/J8 · P2 · R3.

**2. Purpose** — Business: self-service account management + directory consent control. User goal: manage my account data (what's mine to manage) and control public visibility. Success: trainer controls consent and account preferences.

**3. Entry Conditions** — Authenticated. **4. Exit Conditions** — Consent toggled; account preference updated.

**5. Required Data** — Account data (identity from SSO, read-only; Expert-Hub-owned preferences editable); visibility consent (Expert Hub). Identity is **SSO-owned, never edited here** (`BR-0808`, `NFR-06`).

**6. Sections** — Account overview (SSO identity, read-only); preferences (EH-owned); visibility consent toggle (`BR-1002/1007`, `US-1003`); self-data scope (`US-0806`). Business rules `BR-0801` (RBAC), `BR-0808` (auth external), `BR-1007` (withdrawal immediate).

**7. User Actions** — Update preference (EH-owned); toggle consent (immediate directory effect). Audited. No identity edit.

**8. Business Rules** — `BR-0801`, `BR-0808`, `BR-1002/1007`, `US-0806/1003`.

**9. Integrations** — SSO (identity read only). No write to SSO. Consent affects EH-PUB-02/03.

**10. Permissions** — Trainer: View ✓ (own), Update ✓ (own prefs + consent). Never edits identity (SSO-owned).

**11. Page States** — Loading; Success; Saving; Validation Error; System Error. No external sync-write.

**12. Messages** — Consent-toggle confirmation (purpose: immediate public effect); preference-saved; identity-read-only explanation.

**13. Accessibility** — Inherits §0.5. Delta: consent toggle is a labeled switch with clear on/off state (not color-only); identity fields clearly read-only.

**14. Analytics** — `Page Viewed`; `Consent Toggled`; `Account Preference Updated`.

**15. Future Enhancements** — Notification-channel preferences, language default management. Not MVP.

**16. Dependencies** — Flows J5/J8; API account/prefs/consent; DB EH-owned prefs + consent; Integration SSO (read); Job none; Config none; Blocking gap none.

**17. Wireframe Inputs** — Sections: account overview (read-only), preferences, consent. Actions: toggle consent, save prefs. Components: Switch, Field, Card. Dialogs: consent-toggle confirm. No tables/rating.

---

## 4. Internal Portal Pages

> All internal pages inherit: auth = SSO + a staff role; data-scope enforced server-side (Coordinator = own center only, `US-0903`); shared shell renders the staff nav set filtered by exact role (`02_IA` §7). The "Application Inbox / Screening / Interview / Committee" internal pages (EH-INT-02/03/04/05) all render on the **same** `/expert-hub/applications` and `/expert-hub/applications/:id` routes as staff-role sections/stages (`02_IA` §4) — they are distinct Page IDs but share routing.

### EH-INT-01 — Internal Dashboard

**1.** ID EH-INT-01 · Internal Dashboard · `/expert-hub` (staff render) · parent none (role-resolved) · Roles Employee/Manager (role-scoped) · Module Reporting · CAP-09 (`US-0901/0902`) · Flows all (entry) · P1 · R2.
**2.** Business: operational overview per role. User goal: see my day's priorities (queues, pending items) or management KPIs. Success: staff reach the right work item fast. **3.** Auth + staff role; role determines which KPIs show (`BR-0902`). **4.** Navigate to a work area. No state created.
**5. Required Data** — Cross-capability KPIs (Expert Hub, computed live, `BR-0904`), role-scoped (`BR-0902`). Blocking gaps `G9` (charting), `G13` (metric definitions).
**6. Sections** — Role-scoped KPI tiles (employee: screening queue, scheduled interviews, materials awaiting approval — `US-0902`; manager: management dashboard — `US-0901`); shortcuts to queues. `BR-0902` (no data beyond role scope).
**7. Actions** — View KPIs; navigate. Read-only.
**8. Rules** — `BR-0901/0902/0904`.
**9. Integrations** — None direct (live read of other modules). **10. Permissions** — Employee/Manager View ✓ (role-scoped); Coordinator sees own-center dashboard (EH-INT-01 variant, `US-0903`); Senior Mgmt read/export only. No writes.
**11. States** — Loading; Empty (quiet queues); Success; Partial (a metric source pending). No sync-write. **12. Messages** — Empty-queue states. **13. A11y** — inherits; metric tiles labeled, not color-only. **14. Analytics** — `Page Viewed`; `Dashboard Tile Clicked`. **15. Future** — configurable dashboards, drill-downs (needs `G9`). **16. Deps** — Flows (entry); API metrics; DB none stored (live); Job none; Config metric defs; Blocking `G9`/`G13`. **17. Wireframe Inputs** — KPI tiles (Metric = Missing, composed), queue shortcuts. Components: Card, Table, Tabs.

### EH-INT-02 — Application Inbox

**1.** ID EH-INT-02 · Application Inbox · `/expert-hub/applications` (staff render) · parent `/expert-hub` · Roles Employee/Manager · Module Applications · CAP-01 (`US-0105`) · Flows J1/J2 · P1 · R2.
**2.** Business: manage incoming applications + internal nomination. User goal: triage, nominate a recruit (J2), open an application to review. Success: applications move to screening without delay. **3.** Staff role. **4.** Open an application (→EH-INT-03), or submit a nomination (→ same lifecycle as J1).
**5. Required Data** — Applications (all, role-scoped) — Expert Hub; nomination uses the same application form/validation as EH-TP-05 (`BR-0109`).
**6. Sections** — Inbox list (filterable — needs `Table sort/filter`, Missing, `G15`); Nominate action (opens the shared application form, `US-0105`); open. `BR-0109` (internal = same rules).
**7. Actions** — Nominate (creates application on behalf, same validation, audited to employee's ID per J2); open; (filter/sort — deferred, `G15`). Notifies both creator and applicant (`BR-0215`).
**8. Rules** — `BR-0105/0109/0215`, `US-0105`.
**9. Integrations** — None direct (application intake is EH-internal). **10. Permissions** — Employee/Manager: View ✓, Create ✓ (nominate). Not Coordinator/Senior. No sync.
**11. States** — Loading; Empty; Success; Validation (nomination form). **12. Messages** — Nomination submitted; validation. **13. A11y** — inherits; list semantics. **14. Analytics** — `Page Viewed`; `Applicant Nominated`; `Application Opened`. **15. Future** — sort/filter/bulk (`G15`). **16. Deps** — Flows J1/J2; API list, create-nomination; DB Applications; Config field-map (`G5`); Blocking `G5` (for the nomination form), `G15` (sort/filter). **17. Wireframe Inputs** — Inbox table, Nominate action, open. Filters/search (deferred). Components: Table, Tag, Button, SearchBox.

### EH-INT-03 — Screening Detail

**1.** ID EH-INT-03 · Screening Detail · `/expert-hub/applications/:id` (screening section, staff) · parent `/expert-hub/applications` · Roles Screening Manager · Module Screening & Interviews · CAP-02 (`US-0201/0203/0204`) · Flow J1 · P1 · R2.
**2.** Business: objective, defensible screening decisions. User goal: review the computed score + applicant data, accept (attach interview slots) or reject. Success: a decision is recorded with slots auto-attached on accept. **3.** Staff (screening manager); application in screening stage. **4.** Screening decision recorded (accept → slots attached, `BR-0205`; or reject).
**5. Required Data** — CTQ score (Expert Hub, per CTQ matrix, `BR-0201`), AI qualitative analysis (Expert Hub, **separate, never merged**, `BR-0202`), applicant file + attachments (Expert Hub). **Blocking gap `G6`/`DM-GAP-02`** (scoring model).
**6. Sections** — Unified review screen (scores + files + filters, `US-0203`); AI-assist panel (advisory only, `BR-0202`); decision (accept/reject, `BR-0204`); interview-slot attach on accept (`BR-0205`). 
**7. Actions** — Accept (record + auto-attach slots, notifies applicant); reject (record + notify). Audited. `BR-0204` decision at whole-application level.
**8. Rules** — `BR-0201` (weighted score, no AI in official score), `BR-0202` (AI advisory, separate), `BR-0204` (manager-level decision), `BR-0205` (slots auto-attached on accept).
**9. Integrations** — None direct (AI service internal, `Q6` open). **10. Permissions** — Screening Manager: View ✓, Approve ✓ (accept), Reject ✓. Others per role. No sync.
**11. States** — Loading; Success; Decision-pending; System Error; **Scoring-model-unavailable** (blocked until `G6`). **12. Messages** — Accept/reject confirmation; AI-advisory disclaimer (purpose: clarify it's not the official score). **13. A11y** — inherits; score + AI panels clearly distinguished; decision controls labeled. **14. Analytics** — `Page Viewed`; `Screening Accepted`; `Screening Rejected`. **15. Future** — configurable scoring UI. **16. Deps** — Flow J1; API get, score, decide; DB Evaluation Result; Integration none; Config CTQ matrix; **Blocking `G6`/`DM-GAP-02`**, `Q6`. **17. Wireframe Inputs** — Sections: score, AI-assist, files, decision, slot-attach. Status: score, decision. Components: Card, Table, Tag, Alert, Modal.

### EH-INT-04 — Interview Evaluation

**1.** ID EH-INT-04 · Interview Evaluation · `/expert-hub/applications/:id` (interview section, staff) · parent `/expert-hub/applications` · Roles Employee (evaluator) · Module Screening & Interviews · CAP-02 (`US-0206/0207`) · Flow J1 · P1 · R2.
**2.** Business: document a defensible interview outcome. User goal: fill one interview form for the whole application (per-service notes inside), route to committee or reject. Success: result recorded + routed. **3.** Staff; application at interview stage. **4.** Interview result recorded → committee or direct reject.
**5. Required Data** — Interview evaluation model/form (Expert Hub, admin config), result (Expert Hub). **Blocking gap `G6`/`DM-GAP-03`.**
**6. Sections** — One interview form for whole application (`BR-0207`); per-service note fields; route/reject decision (`BR-0208`). 
**7. Actions** — Fill form; route to committee OR direct reject (`BR-0208`). Audited; notifies.
**8. Rules** — `BR-0207` (one form, per-service notes, no separate approval paths), `BR-0208` (route or direct reject).
**9. Integrations** — None. **10. Permissions** — Employee: View ✓, Update ✓ (fill), Approve ✓ (route), Reject ✓. No sync. **11. States** — Loading; Draft; Submitted; **Model-unavailable** (`G6`). **12. Messages** — Route/reject confirmation; validation. **13. A11y** — inherits; single-form structure with per-service subsections. **14. Analytics** — `Page Viewed`; `Interview Evaluated`; `Routed to Committee`; `Interview Rejected`. **15. Future** — structured scoring rubric UI. **16. Deps** — Flow J1; API form, submit; DB Interview Result; Config interview model; **Blocking `G6`/`DM-GAP-03`**. **17. Wireframe Inputs** — One evaluation form, per-service notes, route/reject. Components: Field, Select, Textarea, Steps.

### EH-INT-05 — Committee Decision

**1.** ID EH-INT-05 · Committee Decision · `/expert-hub/applications/:id` (committee section, staff) · parent `/expert-hub/applications` · Roles Committee member · Module Approval Workflows · CAP-02 (`US-0208/0209/0210`) · Flow J1 · P1 · R2.
**2.** Business: sequential, accountable accreditation approval. User goal: review combined screening+interview results, approve (advance) or reject (halt). Success: sequential approval completes or halts immediately on any reject. **3.** Staff (committee member); application at committee stage; it's this member's turn. **4.** Member decision → advances to next (`BR-0209`) or halts (`BR-0210`).
**5. Required Data** — Combined screening + interview results (Expert Hub), approval sequence/history (Expert Hub). Config: committee composition/ordering (`Q11`, open).
**6. Sections** — Combined-results view (`US-0208`); sequential approval status (ApprovalHistory pattern); approve/reject. `BR-0209` (whole-application, sequential), `BR-0210` (any reject halts), `BR-0211` (all must approve).
**7. Actions** — Approve (advance to next, auto, `BR-0209`); reject (halt immediately, final, `BR-0210`). Audited; notifies next member / creator.
**8. Rules** — `BR-0209/0210/0211`, `US-0208/0209/0210`.
**9. Integrations** — None. **10. Permissions** — Committee member: View ✓, Approve ✓, Reject ✓ (only on their turn). No sync. **11. States** — Loading; Awaiting-my-turn; My-turn; Decided; Halted. **12. Messages** — Approve/reject confirmation; halt notice. **13. A11y** — inherits; sequence position clear; decision controls labeled. **14. Analytics** — `Page Viewed`; `Committee Approved`; `Committee Rejected`. **15. Future** — parallel committee modes (out of scope). **16. Deps** — Flow J1; API results, decide; DB Approval sequence; Config committee (`Q11`); Blocking `Q11` (composition/ordering). **17. Wireframe Inputs** — Combined results, approval sequence/history, approve/reject. Timeline: ApprovalHistory. Components: Steps, Alert, Card, Button.

### EH-INT-06 — Agreement Management

**1.** ID EH-INT-06 · Agreement Management · `/expert-hub/agreements` · parent `/expert-hub` · Roles Manager · Module Agreements · CAP-03 (`US-0301–0306`) · Flow J6 · P1 · R2.
**2.** Business: govern the contractual relationship post-signature. User goal: renew/suspend/terminate agreements, add annexes, view history. Success: lifecycle managed with minimal friction, full history retained. **3.** Staff (manager). **4.** Agreement renewed/suspended/terminated/amended.
**5. Required Data** — Agreement + annex (Expert Hub), approver sequence (Expert Hub), agreement file (storage, `G26`). Expiry computed (`BR-0302`).
**6. Sections** — Agreement list + status; lifecycle actions (renew/suspend/terminate); annex (add approved service, `BR-0305`); history (ApprovalHistory). `BR-0301–0305`.
**7. Actions** — Renew (direct, no re-screening, `BR-0304`, new 3-year term `BR-0302`); suspend (reversible); terminate (terminal); add annex (`BR-0305`, no new signature). All confirmed + audited + notify (90/30-day handled by job, `BR-0303`).
**8. Rules** — `BR-0301` (auto-activate), `BR-0302` (1yr first / 3yr renewal), `BR-0303` (90/30-day alerts), `BR-0304` (direct renewal), `BR-0305` (annex not new agreement).
**9. Integrations** — File storage (agreement docs, `G26`). Notification (alerts). No FAST/MTM/ERP. **10. Permissions** — Manager: View ✓, Update ✓ (suspend), Approve ✓ (renew), (terminate = Update terminal); Employee View only. No sync. **11. States** — Loading; Success; Action-confirm; System Error. **12. Messages** — Renew/suspend/terminate/annex confirmations (destructive ones need explicit confirm); expiry-approaching (informational). **13. A11y** — inherits; destructive actions clearly labeled + confirmed. **14. Analytics** — `Page Viewed`; `Agreement Renewed/Suspended/Terminated/Amended`. **15. Future** — e-sign integration for renewals. **16. Deps** — Flow J6; API agreements, lifecycle; DB Agreement + Annex; Integration file storage, notification; Job 90/30-day reminders; Config term lengths; Blocking `G26`. **17. Wireframe Inputs** — Agreement list, lifecycle actions, annex, history. Tables: agreements. Dialogs: renew/suspend/terminate confirm. Timeline: history. Components: Table, Tag, Modal, Alert.

### EH-INT-07 — Trainer Profiles (search)

**1.** ID EH-INT-07 · Trainer Profiles (search) · `/expert-hub/profile` (staff render) · parent `/expert-hub` · Roles Employee/Manager · Module Trainer Profile Integration · CAP-04 (`US-0402/0414/0415`) · Flow J5 · P1 · R2.
**2.** Business: find/inspect trainers for decisions. User goal: search/filter the trainer base, open a full profile. Success: staff reach the right trainer quickly. **3.** Staff. **4.** Open a comprehensive profile (→EH-INT-08).
**5. Required Data** — Searchable trainer base (Expert Hub record + FAST-sourced core fields), filter facets (service, specialty, city, classification, rating, accreditation status, conflict status, `US-0414`). Ratings are **calculated** (`02D`).
**6. Sections** — Search/filter bar (`US-0414`); results (with accreditation + conflict status, `US-0415`); open. `BR-0402` (matching eligibility gating context).
**7. Actions** — Search/filter; open profile. Read-only list.
**8. Rules** — `BR-0402/0415`, `US-0402/0414/0415`.
**9. Integrations** — FAST read (core fields, FAST-01). Fallback: last-known + timestamp. **10. Permissions** — Employee/Manager View ✓. Coordinator limited (own-center context). No writes here. **11. States** — Loading; Empty; Success; Partial (FAST field unavailable → last-known). **12. Messages** — Empty results. **13. A11y** — inherits; filter/results semantics. **14. Analytics** — `Page Viewed`; `Trainer Search`; `Trainer Profile Opened`. **15. Future** — saved searches, sort (`G15`). **16. Deps** — Flow J5; API search; DB EH profile + FAST projection; Integration FAST; Config facets; Blocking `G36`, `G15`. **17. Wireframe Inputs** — Search/filter, results table, open. Filters/search: yes. Status: accreditation, conflict, rating. Components: Table, SearchBox, Select, Tag, Pagination.

### EH-INT-08 — Trainer Profile (comprehensive)

**1.** ID EH-INT-08 · Trainer Profile (comprehensive) · `/expert-hub/profile/:trainerId` · parent `/expert-hub/profile` · Roles Employee/Manager · Module Trainer Profile Integration · CAP-04 (`US-0402/0404/0407/0409`) · Flow J5 · P1 · R2.
**2.** Business: single complete view of an accredited trainer. User goal: review all data (profile, services, agreements, programs, ratings, conflict) from one screen. Success: staff make matching/decision calls with full context. **3.** Staff; `:trainerId` resolves. **4.** Review; may feed into assignment (J4).
**5. Required Data** — Core profile/experience/roles/specialties/classification (**FAST**, `P-11`), agreements (Expert Hub), program history (FAST), **calculated** ratings + trend if MTM exposes history (Expert Hub/`02D`), conflict status (Expert Hub, `US-0412`), last-sync timestamps. Ratings: **calculated indicators, raw MTM never editable**, calculation version + last-refresh shown.
**6. Sections** — Identity; approved services & specialties (`US-0404`); agreements; programs history (`US-0407`); ratings (overall + per-program + trend if available, calculation date/version, sync status — `US-0409`, `02D` §9 internal view); conflict status. `BR-0403` (per-service independent), `BR-0409/0410` (consumed data).
**7. Actions** — View; (authorized recalculation — `G61`, if enabled); export (Manager). Recalculation audited (`02D` §10).
**8. Rules** — `BR-0402/0403/0407/0409/0410/0411`, `US-0402/0404/0407/0409`.
**9. Integrations** — FAST read (profile/programs, FAST-01); MTM indirect (calculated ratings, refreshed per `02D`). Fallback: last-known + timestamp; rating "unavailable"/"pending." **10. Permissions** — Employee/Manager: View ✓, Export ✓ (Manager), **Synchronize** ✓ (manual recalculation, if `G61` grants — Manager/Admin only). No edit of FAST/MTM data. **11. States** — Loading; Success; Partial (a source pending); Sync-Pending/Failed (rating, shown internally with timestamp/status per `02D` §9); Offline external service. **12. Messages** — Rating sync/failure status (internal, detailed — unlike trainer view); recalculation confirmation. **13. A11y** — inherits; tabbed sections; rating states as text; last-sync visible. **14. Analytics** — `Page Viewed`; `Comprehensive Profile Viewed`; `Rating Viewed`; `Rating Recalculation Requested`; `Profile Exported`. **15. Future** — rating trend charts (needs `Metric`/charting + MTM history, `G9`/`MTM-04`). **16. Deps** — Flow J5; API profile, programs, ratings, recalc; DB EH profile + calculated ratings + RatingSourceRecord; Integration FAST, MTM; Job rating recalc; Config recalculation permission (`G61`); Blocking `G36`, `G41`/`G42`, `G53`+, `G61`. **17. Wireframe Inputs** — Sections: identity, services, agreements, programs, ratings (overall + per-program + trend + sync status + calc version), conflict. Tabs: comprehensive. Rating display: calculated, internal detail (sync status, last-refresh, version). Status: accreditation, conflict, rating sync. Actions: recalculate (if enabled), export. Components: Card, Tabs, Table, Rating, Tag.

### EH-INT-09 — Assignment Request + Matching

**1.** ID EH-INT-09 · Assignment Request + Matching · `/expert-hub/assignments` (staff render) · parent `/expert-hub` · Roles Coordinator/Employee · Module Assignment & Matching · CAP-05 (`US-0501–0504`) · Flow J4 (staff portion) · P1 · R2.
**2.** Business: match center needs to accredited trainers efficiently and objectively. User goal: create a request from a FAST plan, auto/manual match, send exactly 3 candidates, manage responses. Success: a suitable trainer is confirmed and synced to FAST. **3.** Staff (Coordinator own-center only, `US-0903`); a FAST plan exists. **4.** Assignment confirmed → FAST sync (separate status) → (post-completion) rating refresh.
**5. Required Data**

| Data | Owner | R | C | U | D | Sync | API dep | Blocking gap |
|---|---|---|---|---|---|---|---|---|
| Plan ID / Plan Date / Program Name / schedule | **FAST** | Y | N | N | N | FAST-03 | FAST plan API | `G37` |
| Assignment request | Expert Hub | Y | Y | Y | N | — | request API | — |
| Matching matrix + snapshot + shortlist (exactly 3) | Expert Hub | Y | Y | N | N | — | matching API | **`G7`/`DM-GAP-05`** |
| Candidate profiles (incl. conflict) | Expert Hub / FAST | Y | N | N | N | FAST-01 | — | `G36` |
| Confirmed relationship → FAST | FAST | N | Y (sync) | Y | N | **FAST-04** | assignment API | **`G38`** |
| Assignment sync status (separate) | Expert Hub | Y | N | N | N | — | — | `G38` |

**6. Sections** — Plan selection (FAST, `BR-0501` — **selected/retrieved from FAST, never re-keyed**, `02C` §5.3); auto-match (weighted, conflict-excluded, exactly 3, `BR-0502/0504/0505`); manual search (`US-0503`); shortlist review + send; response tracking (auto-advance, re-match, `BR-0507/0508`); FAST sync status (separate). 
**7. Actions** — Create request; auto-match / manual-select 3; send to center; (center selects/rejects — happens on their view); track offer responses (auto-advance on trainer reject, `BR-0507`; re-match if all 3 reject, `BR-0508`); on confirmation → **FAST-04 sync on a separate status track** (`BR-0505`, `02C` §5.4). Audited; notifies.
**8. Rules** — `BR-0501/0502/0504/0505/0506/0507/0508/0509/0510`, `US-0501–0504`.
**9. Integrations** — FAST read (plan, FAST-03); FAST write (confirmed assignment, FAST-04); post-completion MTM rating refresh (J4 tail). Fallback: plan unavailable → block create; sync failure → separate status, retry, **business status unaffected**. **10. Permissions** — Coordinator: View ✓/Create ✓ (own center only); Employee: View/Create; **Synchronize** = system-driven (not a manual verb here). No edit of FAST plan data. **11. States** — Loading; Empty; Matching; Shortlist; Offer-tracking; Sync-Pending/Failed (assignment→FAST, separate); **Matching-model-unavailable** (`G7`); Plan-unavailable (FAST down). **12. Messages** — Plan-required; exactly-3 enforced; all-rejected re-match; sync status/failure. **13. A11y** — inherits; shortlist as labeled cards; conflict exclusions explained. **14. Analytics** — `Page Viewed`; `Assignment Request Created`; `Matching Run`; `Shortlist Sent`; `Assignment Confirmed`; `Assignment FAST Sync Failed`. **15. Future** — matching explainability UI. **16. Deps** — Flow J4; API FAST-03/04, matching, request; DB Assignment request + matching snapshot + shortlist + sync status; Integration FAST, MTM (post); Job FAST-04 sync, rating refresh; Config matching weights; **Blocking `G7`/`DM-GAP-05`, `G37`, `G38`, `G36`**. **17. Wireframe Inputs** — Sections: plan selection (FAST), matching, manual search, shortlist (exactly 3), offer tracking, sync status. Cards: AssignmentCard (candidates). Status: matching, offer, FAST-sync (separate). Filters/search: manual match. Components: Card, Table, Tag, Avatar, Button.

### EH-INT-10 — Entitlements Ledger

**1.** ID EH-INT-10 · Entitlements Ledger · `/expert-hub/payments` (staff render) · parent `/expert-hub` · Roles Employee/Manager · Module Financial Entitlements · CAP-06 (`US-0602`) · Flow J7 · P2 · R3.
**2.** Business: staff can answer trainer entitlement queries without separate files. User goal: view entitlements linked to agreements/programs across trainers. Success: staff resolve queries in-platform. **3.** Staff. **4.** Read-only; feeds support conversations.
**5. Required Data** — Entitlements (ERP), linkage (Expert Hub). Never edited (`BR-0601`). **6. Sections** — Ledger (linked entitlements per trainer, `US-0602`). **7. Actions** — View/link inspection. No edit. **8. Rules** — `BR-0601/0602/0603`. **9. Integrations** — ERP read. Fallback: unavailable. **10. Permissions** — Employee/Manager View ✓; no edit. **11. States** — Loading; Empty; Success; Offline (ERP). **12. Messages** — ERP-unavailable. **13. A11y** — inherits; ledger table. **14. Analytics** — `Page Viewed`; `Entitlements Ledger Viewed`. **15. Future** — dispute workflow (`G62`). **16. Deps** — Flow J7; API ERP, linkage; DB linkage; Integration ERP; Blocking none blocking. **17. Wireframe Inputs** — Ledger table (per trainer, linkage). Components: Table, Tag, Card.

### EH-INT-11 — Speaker Records

**1.** ID EH-INT-11 · Speaker Records · `/expert-hub/speakers` · parent `/expert-hub` · Roles Employee · Module Trainer Profile Integration (Speaker sub-domain) · CAP-04 (`US-0417/0418/0419`) · Flow §2.11 · P2 · R3.
**2.** Business: manage limited-relationship speakers internally. User goal: create/update/search speaker records, view a speaker's event history. Success: speaker data current for re-hosting. **3.** Staff (Employee); **internal-only, no portal, no self-service** (`BR-0113/0412/0413`). **4.** Speaker record created/updated.
**5. Required Data** — Speaker record (Expert Hub; bio, specialty, contact, event history). **No classification, no evaluation, no agreement, no entitlement** (`BR-0413`).
**6. Sections** — Speaker search/filter (by specialty, `US-0419`); create/update (`US-0417`); event history (`US-0418`). 
**7. Actions** — Create; update; search. All internal, audited. No downstream accreditation/agreement/entitlement.
**8. Rules** — `BR-0113` (internal creation only), `BR-0412` (internal-only management, no portal), `BR-0413` (no classification/evaluation/agreement/entitlement).
**9. Integrations** — None. **10. Permissions** — Employee: View ✓, Create ✓, Update ✓. No trainer/public access ever. **11. States** — Loading; Empty; Success; Validation. **12. Messages** — Create/update confirmation; validation. **13. A11y** — inherits; form + list. **14. Analytics** — `Page Viewed`; `Speaker Created/Updated`; `Speaker Searched`. **15. Future** — speaker directory (only if a future decision grants it — currently no public surface). **16. Deps** — Flow §2.11; API speaker CRUD; DB Speaker Record; Integration none; Blocking none. **17. Wireframe Inputs** — Search/filter, create/update form, event history. Tables/lists: speakers. Components: Table, Field, SearchBox, Modal.

### EH-INT-15 — Analytics Dashboards

**1.** ID EH-INT-15 · Analytics Dashboards · `/expert-hub/analytics` · parent `/expert-hub` · Roles Manager/Senior Mgmt · Module Reporting · CAP-09 (`US-0901/0903/0904/0905`) · Flow (reads all) · P2 · R3.
**2.** Business: leadership decisions on unified data. User goal: view KPIs/dashboards, export periodic reports. Success: management measures performance/needs. **3.** Staff (Manager full; Senior Mgmt **read/export only**, `BR-0903`). **4.** Read/export.
**5. Required Data** — Metrics/dashboards/reports (Expert Hub, **computed live, no independent storage**, `BR-0904`), role-scoped (`BR-0902`). **Blocking `G9` (no charting lib), `G13` (success metrics undefined, BRD §9 empty).**
**6. Sections** — Role-scoped dashboards (management `US-0901`, center `US-0903`, senior overview `US-0904`); exportable reports (`US-0905`). 
**7. Actions** — View; export (Senior/Manager). Export audited. No writes to source.
**8. Rules** — `BR-0901/0902/0903/0904/0905`.
**9. Integrations** — None direct (live read of all modules). **10. Permissions** — Manager: View ✓/Export ✓; Senior Mgmt: View ✓/Export ✓ **only** (no operational action, `BR-0903`); Coordinator: own-center dashboard only. No writes. **11. States** — Loading; Empty; Success; Partial (a source pending). **12. Messages** — Export confirmation; no-data. **13. A11y** — inherits; charts need text/table equivalents (color-independence); export accessible. **14. Analytics** — `Page Viewed`; `Dashboard Viewed`; `Report Exported`. **15. Future** — the entire richer-analytics scope is gated on `G9`/`G13`; keep to BRD §8.9 text only. **16. Deps** — Flows (read); API metrics/reports; DB none stored (live); Integration none; Job none; Config metric catalogue; **Blocking `G9`, `G13`**. **17. Wireframe Inputs** — Role-scoped dashboards, KPI tiles (Metric = Missing, composed), reports/export. Components: Card, Table, Tabs. No charting library committed (`G9`).

### EH-INT-16 — Integration Registry / Logs

**1.** ID EH-INT-16 · Integration Registry / Logs · `/expert-hub/integrations` · parent `/expert-hub` · Roles Admin · Module Integration Management · CAP-12 · Flows §2.7/§2.8 · P2 · R3.
**2.** Business: govern all integrations, monitor sync health, drive reconciliation. User goal: view the integration registry + logs, spot failures/mismatches. Success: admins detect and resolve sync/reconciliation issues. **3.** Admin. **4.** Read/monitor; trigger reconciliation review.
**5. Required Data** — Integration registry, exchanged-data-element catalogue, integration logs (Expert Hub), sync/reconciliation status across FAST/MTM/ERP/SSO/Notification (Expert Hub). 
**6. Sections** — Registry (systems, direction, importance, `BR-1204`); logs (success/failure, `BR-1203`); reconciliation flags (§2.8). 
**7. Actions** — View registry/logs; review reconciliation mismatches (not silent auto-correct, §2.8). Audited.
**8. Rules** — `BR-1201–1206` (source-of-truth, last-known-state, traceability).
**9. Integrations** — Monitors all (FAST/MTM/ERP/SSO/Notification). Fallback: this page **is** the fallback-monitoring surface. **10. Permissions** — Admin: View ✓; reconciliation review = Admin. No editing of external data. **11. States** — Loading; Success; Failure-highlighted; Reconciliation-required. **12. Messages** — Reconciliation-mismatch alerts; sync-failure summaries. **13. A11y** — inherits; log tables; status not color-only. **14. Analytics** — `Page Viewed`; `Integration Log Viewed`; `Reconciliation Reviewed`. **15. Future** — automated reconciliation actions. **16. Deps** — Flows §2.7/§2.8; API registry/logs; DB Integration Registry + Log; Integration all; Job reconciliation; Config; Blocking `G19`–`G30` (contracts inform what's monitored). **17. Wireframe Inputs** — Registry table, logs table, reconciliation flags. Status: per-integration health, sync status. Components: Table, Tag, Alert.

---

## 5. Administration Pages

### EH-INT-12 — Notification Matrix / Templates

**1.** ID EH-INT-12 · Notification Matrix / Templates · `/expert-hub/comms/notifications` · parent `/expert-hub` · Roles Admin · Module Notifications · CAP-07 (`US-0702/0703/0705`) · Flow §2.4 · P2 · R3.
**2.** Business: centrally control who is notified of what, in which language, via which channel. User goal: edit the event→template→audience→channel matrix, manage bilingual templates, review the notification log. Success: all official comms are governed centrally. **3.** Admin (`BR-0704`). **4.** Matrix/template/log changes saved.
**5. Required Data** — Notification matrix, bilingual templates (AR/EN), notification log (all Expert Hub). Templates bilingual, single-language send per recipient (`BR-0701/0707`).
**6. Sections** — Matrix editor (event→template→audience→channel, `US-0702`); template editor (bilingual, `US-0703`); log viewer (`US-0705`). `BR-0701–0705/0707`.
**7. Actions** — Edit matrix; create/edit templates (bilingual, `BR-0704` admin-only); view log; **no code deploy needed** (`BR-0203`-style config). Audited.
**8. Rules** — `BR-0701` (approved bilingual templates only, no free text), `BR-0702` (each event → auto email + in-platform), `BR-0703` (matrix covers all 12 capabilities' events), `BR-0704` (admin-only), `BR-0707` (single-language send).
**9. Integrations** — Notification Service (delivery); this page configures, doesn't send. **10. Permissions** — Admin: View ✓/Create ✓/Update ✓ (matrix/templates); others none. **11. States** — Loading; Editing; Saved; Validation (both languages required). **12. Messages** — Save confirmation; bilingual-required validation; template-in-use warning. **13. A11y** — inherits; bilingual editor labeled per language; matrix table navigable. **14. Analytics** — `Page Viewed`; `Notification Matrix Updated`; `Template Saved`. **15. Future** — template versioning/preview. **16. Deps** — Flow §2.4; API matrix/template/log; DB Notification Matrix/Template/Log; Integration Notification Service; Config; Blocking `G17` (language source), `DM-GAP-08` (notification matrix content). **17. Wireframe Inputs** — Matrix editor, bilingual template editor, log viewer. Tables: matrix, log. Forms: templates (bilingual). Components: Table, Select, Modal, Switch.

### EH-INT-13 — Deadlines / SLA Console

**1.** ID EH-INT-13 · Deadlines / SLA Console · `/expert-hub/comms/deadlines` · parent `/expert-hub` · Roles Admin · Module Notifications · CAP-07 (`US-0704`) · Flow §2.5 · P2 · R3.
**2.** Business: manage every SLA/deadline across all 12 capabilities from one screen. User goal: edit deadlines/reminders centrally. Success: SLAs adjusted without touching each capability. **3.** Admin. **4.** Deadline config saved.
**5. Required Data** — Deadline/SLA matrix (Expert Hub, `BR-0705`), covering all capabilities' timers. Provisional values (`Q8`) flagged.
**6. Sections** — Central deadline editor (all SLAs + reminders, `US-0704`). `BR-0705`.
**7. Actions** — Edit deadline/reminder; save (no deploy). Audited.
**8. Rules** — `BR-0705` (all SLAs managed centrally here).
**9. Integrations** — Feeds the SLA-reminder job (§2.5). **10. Permissions** — Admin View ✓/Update ✓; others none. **11. States** — Loading; Editing; Saved; Validation. **12. Messages** — Save confirmation; provisional-value note (`Q8`). **13. A11y** — inherits; editable table. **14. Analytics** — `Page Viewed`; `SLA Updated`. **15. Future** — per-service SLA overrides. **16. Deps** — Flow §2.5; API deadline config; DB Deadline Matrix; Job SLA reminders; Config; Blocking `Q8` (provisional SLA values), `DM-GAP-10` (operational values). **17. Wireframe Inputs** — Central deadline table (editable). Components: Table, Field, Switch.

### EH-INT-14 — Roles & Permissions

**1.** ID EH-INT-14 · Roles & Permissions · `/expert-hub/access` · parent `/expert-hub` · Roles Admin · Module Identity & Access · CAP-08 (`US-0801/0802/0805`) · Flows §2.1/§2.6 · P1 · R2.
**2.** Business: govern access centrally with one model. User goal: edit the role×permission matrix, assign roles to users, view the audit log. Success: access controlled from one place, all changes audited. **3.** Admin. **4.** Role/permission/user-assignment changes saved (audited).
**5. Required Data** — Role×domain×permission matrix, user-role assignments, audit log (all Expert Hub config); identity from SSO (read-only). RBAC only, no direct-to-user (`BR-0801`).
**6. Sections** — Permission matrix editor (`US-0801`); user-role assignment (`US-0802`); audit log viewer (`US-0805`). `BR-0801/0806/0807/0808`.
**7. Actions** — Edit matrix (`BR-0807`, no deploy); assign roles (`BR-0801`, only via role); view audit (`BR-0806`, immutable). All changes audited (`BR-0806`). **No login/SSO management here** (`BR-0808`).
**8. Rules** — `BR-0801` (RBAC only), `BR-0806` (all changes audited, immutable), `BR-0807` (matrix editable without deploy), `BR-0808` (auth external, not managed here).
**9. Integrations** — SSO (identity read only; **auth never managed here**, `BR-0808`). **10. Permissions** — Admin: View ✓/Create ✓/Update ✓ (roles/permissions/assignments); audit is read-only for all incl. Admin (immutable). No delete of audit. **11. States** — Loading; Editing; Saved; Validation. **12. Messages** — Save confirmation; audit-immutable note. **13. A11y** — inherits; matrix grid navigable; role assignment clear. **14. Analytics** — `Page Viewed`; `Permission Matrix Updated`; `Role Assigned`; `Audit Viewed`. **15. Future** — permission simulation/preview. **16. Deps** — Flows §2.1/§2.6; API matrix/assignment/audit; DB Role/Permission/User-role/Audit; Integration SSO; Config RBAC model; Blocking `DM-GAP-07` (roles×permissions matrix content), `G16`/`G28` (SSO claim contract for identity resolution). **17. Wireframe Inputs** — Permission matrix grid, user-role assignment, audit log. Tables: matrix, audit. Components: Table, Checkbox, Switch, Modal.

---

## 6. Cross-cutting Page

### EH-*-00 — Not Found / Unauthorized (MVP, full depth)

**1. Page Information** — ID EH-*-00 · Not Found / Unauthorized · Routes `*` (not-found) and `/expert-hub/403` (unauthorized) · parent none · Roles All (incl. Visitor) · Module Identity & Access (routing) · CAP-08 · Flows §2.2/§2.16 · **P0** · **R1**.

**2. Purpose** — Business: safe, non-leaking error routing. User goal: understand something went wrong and get back to a valid place. Success: user recovers without confusion or data leakage. **Two distinct cases**, never conflated (`02C` §12): **404** (route/entity doesn't exist) vs **403** (authenticated but not permitted).

**3. Entry Conditions** — 404: any unmatched route or a valid-pattern route to a non-existent/foreign entity ID. 403: an authenticated user reaching a route/action their role can't access (`03` §2.2). A withdrawn-consent public profile resolves to the 404/hidden variant (privacy — never reveals the trainer withheld consent).

**4. Exit Conditions** — User navigates home (role-appropriate) or back. No state created.

**5. Required Data** — None (the resolved role, from SSO, only drives which "home" link to show). Owner: SSO (role, read-only).

**6. Sections** — Error explanation (which case, neutrally); recovery navigation (home per role). `02C` §12 (403≠404), `BR-1007` (consent-hidden privacy).

**7. User Actions** — Navigate home / back. No writes. A repeated-403 **pattern** may be logged (security, §0.8) though a single 403 is not audited.

**8. Business Rules** — `BR-0801/0808` (access governed externally + RBAC), `02C` §12 (distinct 401/403/404, direct-object-reference protection), `BR-1007` (consent privacy for hidden profiles).

**9. Integrations** — SSO (role read, to pick the home link). No other.

**10. Permissions** — All roles/visitors: View ✓. Nothing to create/edit.

**11. Page States** — Not-Found (404); Unauthorized (403); (both are themselves "states" of this page). No loading/data states.

**12. Messages** — 404 message (neutral: not found, doesn't confirm/deny existence for privacy); 403 message (neutral: no access, doesn't reveal what's behind it). Purposes only — must not leak whether a resource exists or who owns it.

**13. Accessibility** — Inherits §0.5. Delta: error heading is H1 and focus target; recovery link clearly labeled; message readable by screen reader immediately (assertive live region on arrival).

**14. Analytics** — `Page Viewed` (with 403/404 variant); `Error Recovery Clicked`. (Repeated 403 may feed a security signal per §0.8.)

**15. Future Enhancements** — Contextual "did you mean" suggestions. Not MVP.

**16. Dependencies** — Flows §2.2/§2.16; API none; DB none; Integration SSO (role); Job none; Config none; Blocking gap none.

**17. Wireframe Inputs** — Sections: error message, recovery action. Two variants (404/403). Components: ErrorState, Button. No tables/forms/rating/timeline.

---

## 7. Cross-Page Matrices

### 7.1 FAST data usage

| Page | FAST read | FAST write | Touchpoint | Blocking gap |
|---|---|---|---|---|
| EH-TP-04 My Profile | core profile/experience/programs | approved change (FAST-02) | FAST-01/02 | `G36` |
| EH-TP-06 Add Service | current approved services | role/service (FAST-05) | FAST-01/05 | `G36`/`G39` |
| EH-TP-07 My Assignments | plan/execution data | — | FAST-03 (+ FAST-04 status display) | `G36`/`G37`/`G38` |
| EH-INT-07 Trainer Search | core fields | — | FAST-01 | `G36` |
| EH-INT-08 Comprehensive Profile | profile/programs | — | FAST-01 | `G36` |
| EH-INT-09 Assignment+Matching | Plan ID/Date/Name/schedule | confirmed relationship (FAST-04) | FAST-03/04 | `G37`/`G38` |
| EH-PUB-02/03 Directory/Profile | whitelisted core fields (projected) | — | (via projection) | `G12` (whitelist) |
| EH-TP-03 Application Details | — | trainer sync post-sign (FAST-04-equiv) | (J1 tail) | `G36` |

### 7.2 Expert Hub data usage (authoritative-owned)

Every page reads/writes Expert-Hub-owned data (applications, workflows, agreements, assignments, calculated ratings, notifications, consent, config, audit). The **authoritative-write** pages: EH-TP-05 (create application), EH-TP-06 (add-service request), EH-INT-03/04/05 (screening/interview/committee decisions), EH-INT-06 (agreement lifecycle), EH-INT-09 (assignment/matching), EH-TP-04 (EH-owned profile fields, consent), EH-INT-11 (speaker records), EH-INT-12/13/14 (config), EH-TP-03 (interview-slot confirm, signed-copy). All others are read-only over Expert-Hub data.

### 7.3 MTM data usage

| Page | MTM raw (read, never editable) | EH calculated rating (display) | Touchpoint | Blocking gap |
|---|---|---|---|---|
| EH-TP-01 Portal Home | via calculated | overall | (persisted, refreshed `02D` §7) | `G41`/`G42`, `G53`+ |
| EH-TP-04 My Profile | via calculated | overall + per-program | rating API | `G41`/`G42`, `G53`+ |
| EH-INT-08 Comprehensive Profile | via calculated (source records visible internally) | overall + per-program + trend + calc version/sync | MTM-01/02, rating API | `G41`/`G42`, `G53`+ |
| EH-INT-09 (post-completion) | triggers refresh | — | MTM-03 (J4 tail) | `G41`/`G42` |
| EH-INT-16 Integration Logs | sync/reconciliation status | — | MTM-08 | `G43`/`G44` |

**Rule reaffirmed:** no page edits an MTM raw rating; every displayed rating is the Expert-Hub **calculated** indicator.

### 7.4 ERP usage

| Page | ERP read | Editable | Touchpoint | Note |
|---|---|---|---|---|
| EH-TP-08 My Entitlements | amount/status/date/PO | **never** (`BR-0601`) | INT-03 | hidden until full linkage (`BR-0603`) |
| EH-INT-10 Entitlements Ledger | same | never | INT-03 | staff support view |

### 7.5 SSO usage

Every authenticated page depends on SSO for session + role claim (§0.7). Pages that **display** SSO identity read-only: EH-TP-10 (account), EH-INT-14 (user identity in role assignment). No page writes to SSO (`BR-0808`, `NFR-06`). Blocking: `G16`/`G28` (claim contract + service-to-service auth).

### 7.6 Notification usage

| Page | Triggers notifications | Notification-Service dep |
|---|---|---|
| EH-TP-03 (slot/sign) | yes | delivery |
| EH-TP-06 (add-service) | yes (admin) | delivery |
| EH-TP-07 (reject/apology) | yes (mgmt) | delivery |
| EH-INT-03/04/05 (decisions) | yes | delivery |
| EH-INT-06 (lifecycle + 90/30-day) | yes | delivery |
| EH-INT-09 (offer/apology/cancel) | yes | delivery |
| EH-TP-09 Notifications | consumes (read) | delivery status |
| EH-INT-12 Matrix | configures | — (config, not send) |
| EH-INT-13 SLA | configures reminders | — |

All notifications are bilingual-template-sourced, single-language send (`BR-0701/0707`).

### 7.7 Shared application patterns (per `02_IA` §9)

| Pattern | Pages |
|---|---|
| ApplicationList | EH-TP-02, EH-INT-02 |
| ApplicationDetail | EH-TP-03, EH-INT-03/04/05 |
| StatusTimeline | EH-TP-03, EH-INT-03/04/05/06 |
| StatusBadge (application/agreement/assignment variants) | EH-TP-02/03/07, EH-INT-02/06/09 |
| AssignmentCard | EH-TP-07, EH-INT-09 |
| ApprovalHistory | EH-INT-05, EH-INT-06 |
| ProfileSections | EH-TP-04, EH-INT-08 |
| DocumentViewer | EH-TP-03/04/07, EH-INT-06 |
| NotificationCenter | EH-TP-09, shell-wide preview (EH-TP-01) |
| RouteGuard + role-aware page wrapper | all `/expert-hub/*` pages |

### 7.8 Shared dialogs

| Dialog | Pages |
|---|---|
| Confirm destructive (suspend/terminate/cancel/reject/withdraw) | EH-INT-06, EH-INT-09, EH-TP-07, EH-TP-04/10 |
| Sign-agreement confirm | EH-TP-03 |
| Slot-selection confirm | EH-TP-03 |
| Change-request confirm (FAST field) | EH-TP-04 |
| Consent-toggle confirm | EH-TP-04, EH-TP-10 |
| Recalculation confirm | EH-INT-08 |

### 7.9 Shared tables

| Table | Pages |
|---|---|
| Applications list | EH-TP-02, EH-INT-02 |
| Agreements | EH-INT-06 |
| Trainer search results | EH-INT-07 |
| Entitlements | EH-TP-08, EH-INT-10 |
| Speakers | EH-INT-11 |
| Config matrices (notification/SLA/permissions) | EH-INT-12/13/14 |
| Integration/audit logs | EH-INT-16, EH-INT-14 |

All would benefit from `Table Header Cell - Sort/Filter` (Missing, `G15`) — client-side meanwhile, per §0.3.

### 7.10 Shared forms

| Form | Pages |
|---|---|
| Dynamic application form (field-map driven) | EH-TP-05, EH-INT-02 (nomination), EH-TP-06 (delta) |
| Profile edit / change-request | EH-TP-04 |
| Screening/interview/committee decision forms | EH-INT-03/04/05 |
| Config editors | EH-INT-12/13/14 |
| Speaker create/update | EH-INT-11 |

All compose DS `Field` + inputs; none introduce a form library or a DS component (§0.3).

---

## 8. Traceability

BRD Capability → User Flow → Page → Integration → Future API → Future Wireframe. (Full flow-level traceability is in `03_USER_FLOWS.md` §7; this adds the **page** and **future-wireframe** columns.)

| Capability | User Flow | Page(s) | Integration | Future API (`02C` §9) | Future Wireframe (`05`) |
|---|---|---|---|---|---|
| CAP-01 | J1, J2, J3 | EH-TP-02/03/05/06, EH-INT-02 | none direct / FAST (add-service) | CAP-API-01/02/04 | per each page's §17 |
| CAP-02 | J1 | EH-INT-03/04/05 | none (AI internal) | *Open* (`G6`) | per §17 |
| CAP-03 | J6 | EH-INT-06, EH-TP-03 (agreement) | file storage | *Open* (`G26`) | per §17 |
| CAP-04 | J5 | EH-TP-04, EH-INT-07/08, EH-INT-11 (speaker) | FAST, MTM (indirect) | CAP-API-03 / *Open* (`G36`) | per §17 |
| CAP-05 | J4 | EH-INT-09, EH-TP-07 | FAST-03/04, MTM (post) | CAP-API-05/06 / *Open* (`G38`, `G7`) | per §17 |
| CAP-06 | J7 | EH-TP-08, EH-INT-10 | ERP | CAP-API-08 | per §17 |
| CAP-07 | §2.4/§2.5 | EH-TP-09, EH-INT-12/13 | Notification Service | Ready | per §17 |
| CAP-08 | §2.1/§2.2/§2.6 | EH-INT-14, EH-TP-10, EH-*-00 | SSO | *Open* (`G16`/`G28`) | per §17 |
| CAP-09 | (reads all) | EH-TP-01, EH-INT-01/15 | none direct | *Deferred* (`G9`/`G13`) | per §17 |
| CAP-10 | J8 | EH-PUB-01/02/03, EH-TP-10 | none (projection) | Ready | per §17 |
| CAP-12 | §2.7/§2.8 | EH-INT-16 | all INT-* | *Open* (contracts) | per §17 |

*(CAP-11 Professional Community: no flow, no page, no row — deferred `D-19`.)*

---

## 9. Final Validation

| Check | Result |
|---|---|
| Every IA page (30) has a specification | ✅ All 30 (`02_IA` §6) specified: 3 Public, 10 Trainer, 13 Internal, 3 Admin, 1 cross-cutting — total 30 |
| Every User Flow references ≥1 page | ✅ J1→EH-TP-02/03/05 + EH-INT-02/03/04/05/06; J2→EH-INT-02; J3→EH-TP-06; J4→EH-INT-09/EH-TP-07; J5→EH-TP-04/EH-INT-07/08; J6→EH-INT-06/EH-TP-03; J7→EH-TP-08/EH-INT-10; J8→EH-PUB-01/02/03; supporting flows §2.x→shell/EH-INT-14/16/EH-TP-09/EH-INT-11/EH-*-00 |
| Every integration touchpoint assigned to a page | ✅ FAST-01→TP-04/06/INT-07/08; FAST-02→TP-04; FAST-03→TP-07/INT-09; FAST-04→INT-09/TP-03; FAST-05→TP-06; MTM-01/02→TP-01/04/INT-08; MTM-03→INT-09; MTM-08→INT-16; ERP→TP-08/INT-10; SSO→all auth pages; Notification→§7.6; File storage→TP-03/04/07/INT-06 |
| Every page identifies authoritative data owners | ✅ §5 of each page + §7.1–7.5 matrices; owner values constrained to the six approved values (§0.1) |
| FAST-owned data never marked locally authoritative | ✅ §0.1 rule 1; FAST fields always shown as read/change-request with source+timestamp; never a local authoritative copy |
| MTM raw ratings never editable | ✅ §0.2; every rating page (TP-01/04, INT-08) displays the **calculated** indicator only; raw = read-only immutable `RatingSourceRecord` |
| Expert Hub calculated ratings clearly identified | ✅ §0.2 + §7.3; "calculated" labeled everywhere, distinct from raw MTM, with calc version/last-refresh on internal views |
| Business approval vs technical sync status always separated | ✅ §0.1 rule 2; J1 (TP-03), J3 (TP-06), J4 (INT-09) each specify the separate FAST-sync status track; sync failure never reverts business status |
| No DS components duplicated | ✅ §0.3; every §17 references Approved DS components + named app patterns; Missing components (`Metric`/`Skeleton`/`Structured List`/`Table sort-filter`) composed at feature layer, not replaced |
| No UI layout or wireframes created | ✅ This document specifies WHAT, not HOW; §17 lists wireframe **inputs** only, explicitly "do not draw" |

---

## 10. Readiness for Next Phase

**Ready.** All 30 pages are specified to an implementation-ready depth (full detail for the R1 spine; complete-but-concise for R2/R3), with every data owner, integration, permission, state, and gap identified and every page's §17 providing the exact inputs a wireframe pass needs. No page invented a requirement; no page contradicts the ownership/sync-separation/DS-reuse rules; no layout was drawn.

**Blocked *steps* within pages (not blocked pages):** the New Application dynamic-field section (`G5`), screening/interview decision content (`G6`), matching output (`G7`), FAST/MTM live integration (`G36`–`G44`), rating math (`G53`–`G56`/`G63`), agreement file storage (`G26`/`G27`), analytics scope (`G9`/`G13`). Each is marked at the exact section it affects — none blocks producing the page's specification or, subsequently, its wireframe with placeholder data (the precedent set in `02D` §13 and `03` §11).

**Recommended next phase:** **`docs/specification/05_WIREFRAME_SPECIFICATIONS.md`** — one wireframe spec per Page ID, taking each page's §17 Wireframe Inputs as its brief and honoring the placeholder-data rule for every gap-affected section. **Not created this session**, per instruction.
