# Product Discovery Document
### Expert & Independent Trainer Management Platform — Financial Academy

**Source of truth:** `BRD-TRN-001 v1.0` (Initial draft, pending formal approval)
**Status:** ✅ Complete — foundation for design & architecture
**Scope note:** Every statement traces to the BRD. Recommendations (MVP, phasing, risks) are marked as analysis, not stated requirements. Where the BRD is silent, items are flagged as assumptions or open questions — no requirements are invented.

---

## 1. Executive Summary

The Financial Academy engages independent individuals across five service types — **Trainer, Consultant, Content Developer, Question Writer, and Speaker** — but today manages that relationship across scattered files and disconnected systems. This platform consolidates the *entire* lifecycle of that relationship into a single operational reference: from join application, screening, and accreditation, through contracting and assignment, to execution and entitlement tracking.

The platform is **independent in structure but integrated by design**. It owns its own pages, administration, and data model, but it does not manage authentication (that stays with the Academy's identity system) and it does not recreate data that authoritative systems already own — it consumes financial data from ERP, trainee evaluations from the evaluation system, and program/scheduling data from FAST, while feeding approved-trainer data back to those systems.

It is delivered through **three interfaces over one shared core**: a self-service **Trainer Portal**, an operational **Internal Dashboard**, and a **Public Interface** (marketing landing + trainer directory). The architecture is organized around **12 business capabilities**, deliberately structured by capability (stable business domains) rather than by role or screen flow.

---

## 2. Product Vision

**The problem it solves.** The Academy's relationship with independent experts is fragmented — data lives in Excel and manual records, evaluation is inconsistent, coordination is repetitive and manual, and there is no single reliable view of the accredited expert base. This creates operational drag, inconsistent decisions, and a weak, hard-to-showcase institutional presence.

**Why it exists.** To become the *single unified reference* through which every dealing with independent individuals is managed — standardizing accreditation, accelerating movement between lifecycle stages, and turning a scattered manual process into a governed, measurable operation.

**Who uses it.**
- The **Trainer Management team** (the primary operator)
- **Independent experts/trainers** (self-service)
- **Academy center coordinators** (who raise assignment needs)
- **System administrators** (configuration and governance)
- **Senior/CEO-office leadership** (oversight, read-only analytics)
- **Public visitors** (browsing the accredited-expert directory)

**What success looks like** (per the BRD's drivers, since a formal Success Metrics section was left empty):
- One consolidated system replacing files/multiple systems for trainer data and operations
- Faster, lower-friction transitions across onboarding → accreditation → assignment → execution
- Standardized, defensible, measurable accreditation decisions
- Trainers self-managing their profile, assignments, and entitlements from one place
- Unified reporting that lets leadership measure performance and needs
- A trustworthy public presence for the accredited expert base

> **Gap:** The BRD's Section 9 "Success Metrics" is a header with no content. There are no quantified success targets. (See §11 Open Questions.)

---

## 3. Product Goals

**Business goals**
- Unify management of the Academy's relationship with all independent experts into one platform.
- Standardize evaluation and accreditation criteria to raise fairness and reliability of decisions.
- Support leadership decision-making with unified data and reporting.
- Establish a trusted, transparent public presence for accredited experts.

**Operational goals**
- Reduce manual steps and repetitive coordination across the trainer lifecycle.
- Move applications automatically between stages (screening → interview → committee → agreement → activation) with minimal manual handoffs.
- Centralize SLAs, deadlines, and reminders across all capabilities in one control screen.
- Consume authoritative data from existing systems instead of re-entering it.

**User goals**
- *Trainers:* track application status, keep their profile current, receive and respond to assignments, and follow entitlements from one portal.
- *Trainer Management staff:* efficiently manage applications, evaluations, accreditations, profiles, and assignments.
- *Center coordinators:* quickly reach suitable candidates and track assignment status within their own scope.
- *Leadership:* see reliable KPIs and the full picture without operational noise.

---

## 4. Personas

The BRD defines **6 fixed roles** (CAP-08). Below, each is expanded; "Speaker" and "Public Visitor" are also treated as distinct actors even though they are not among the six permission roles.

### 4.1 Trainer Management Employee (موظف إدارة المدربين)
- **Responsibilities:** Executes daily operations across the trainer lifecycle — screening, evaluation, accreditation support, profile management, assignment, entitlement follow-up (within granted permissions).
- **Goals:** Move applications through the pipeline efficiently; nominate the right candidates; keep operations flowing without bottlenecks.
- **Permissions:** Operational execution across CAP-01/02/04/05/06 per role matrix; no higher approval authority.
- **Primary workflows:** Internal nomination; initial screening; interview scheduling/evaluation; manual candidate search & nomination; monitoring assignments, apologies, cancellations.
- **Pain points addressed:** Manual coordination, scattered data, inconsistent scoring.

### 4.2 Trainer Management Manager (مدير إدارة المدربين)
- **Responsibilities:** Supervises the Trainer Management team; holds all employee permissions plus approvals and higher-authority operational decisions.
- **Goals:** Govern quality and throughput; approve accreditations, renewals, cancellations; lead by data.
- **Permissions:** Employee permissions + accreditation/approval/supervisory decisions; direct assignment cancellation (until 24h before execution); management dashboard.
- **Primary workflows:** Committee decisions; agreement approval; administrative renewal; contract status control (suspend/terminate); service annex; direct assignment cancellation.
- **Pain points addressed:** No governed approval chain today; hard to oversee the base.

### 4.3 Center Coordinator (منسق مركز)
- **Responsibilities:** Creates and tracks assignment requests for **their own center only**; reviews request/assignment status within their scope.
- **Goals:** Quickly source suitable candidates and track assignment status.
- **Permissions:** Create assignment requests; select/reject the 3 candidates; approve uploaded training material; view metrics for their own requests only.
- **Primary workflows:** Create assignment request; approve/reject candidate shortlist; approve training material before execution.
- **Pain points addressed:** No fast, reliable route to matched trainers; no visibility into assignment state.

### 4.4 System Administrator (مشرف النظام)
- **Responsibilities:** Manages platform configuration, roles, permissions, routing lists, and operational settings; governs the platform.
- **Goals:** Governed, extensible configuration without technical redeployment.
- **Permissions:** Manage role×domain×permission matrix; users & role assignment; notification matrix; templates (bilingual); deadline/SLA matrix; field-mandatory maps; evaluation/interview models; audit log.
- **Primary workflows:** Configure permissions and roles; manage notification matrix and templates; manage central deadlines; maintain scoring models and field configurations.
- **Pain points addressed:** Hard-coded rules and inconsistent configuration.

### 4.5 Senior Management (الإدارة العليا)
- **Responsibilities:** Oversight of platform-level performance.
- **Goals:** See the complete picture without operational detail.
- **Permissions:** **Read and export only** across analytics; no operational actions.
- **Primary workflows:** View cross-capability dashboards and periodic reports.
- **Pain points addressed:** No unified, trustworthy KPIs today.

### 4.6 Trainer / Expert (مدرب) — self-service persona
- **Responsibilities:** Manages own profile; tracks applications, assignments, and entitlements; uses services assigned to them.
- **Goals:** One place to apply, follow status, keep profile current, receive assignments, and follow entitlements.
- **Permissions:** Edit only self-editable profile fields (classification, evaluations, contract status are locked/system-fed); submit applications and additional-service requests; accept/reject assignment offers; apologize (until 4 days before); manage visibility consent; view own entitlements and personal metrics.
- **Primary workflows:** Submit join application; add a service; confirm interview slot; sign agreement; self-update profile; respond to assignment offers; upload training material; manage directory visibility.
- **Pain points addressed:** No self-service; opaque status; scattered entitlement info.

### 4.7 Speaker (متحدث) — actor, not a permission role
- **Nature:** Participates in a single, specific event; **no continuous contractual or financial relationship**; **no portal or self-account**.
- **Managed entirely** from the Internal Dashboard by the Trainer Management team (create/update/archive). Not subject to classification, trainer-evaluation entity, agreements, or entitlements.
- **Note:** A Speaker is *not* one of the 6 permission roles and has no login. Managed as a data record only.

### 4.8 Public Visitor (زائر) — unauthenticated actor
- **Responsibilities:** Browses the marketing landing page and the trainer directory (filter by specialty).
- **Goals:** Understand the platform's value; discover Academy expertise.
- **Permissions:** View public landing + directory + consented public profiles only. No sensitive data.

---

## 5. Business Capabilities

The BRD defines 12 capabilities (CAP-01 → CAP-12). CAP-11 is explicitly deferred.

### CAP-01 — Application Management (إدارة طلبات الانضمام)
- **Purpose:** Receive join applications (self-service or internal registration) via one unified form; validate completeness; hand a complete application to screening. Does **not** evaluate or decide.
- **Owner:** Trainer Management (operator); applicant/self-service on portal.
- **Input:** Applicant data, service selection, attachments; add-service requests from approved trainers; speaker data (internal).
- **Output:** Submitted application (with reference number) delivered to CAP-02; Speaker Record; Basic Profile.
- **Owned entities:** Basic Profile, Join Application, Speaker Record.
- **Dependencies:** Status shown to applicant is aggregated live from CAP-02/CAP-03 (`BR-0108`); relies on CAP-08 for who can enter internal records; CAP-07 for confirmations.
- **Related:** CAP-02 (next stage), CAP-03 (add-service annex context), CAP-04 (speaker record later managed there).

### CAP-02 — Screening & Evaluation (إدارة الفرز والتقييم)
- **Purpose:** Own the **complete accreditation decision**: initial screening → interview → interview evaluation → committee → agreement preparation → internal approval → applicant signature. Hands a signed agreement to CAP-03.
- **Owner:** Screening Manager, Trainer Management, Accreditation Committee.
- **Input:** Complete applications from CAP-01; scoring/interview models (admin-configured).
- **Output:** Signed agreement (active) to CAP-03; final accept/reject decisions; approved trainer to CAP-04.
- **Owned entities:** CTQ Matrix (scoring model), Evaluation Result, Interview Evaluation Form, Interview Result. (Agreement is owned by CAP-03 but *prepared* here.)
- **Dependencies:** CAP-01 (source), CAP-07 (notifications, SLAs), CAP-08 (roles/committee), AI service for qualitative-question analysis (helper only, never merged into official score — `BR-0202`).
- **Related:** CAP-03, CAP-04.

### CAP-03 — Agreement & Contract Management (إدارة الاتفاقيات والعقود)
- **Purpose:** Own agreement state **after** signature — activation, expiry calculation, alerts, administrative renewal, service annexes, status history.
- **Owner:** Trainer Management.
- **Input:** Signed agreement from CAP-02; renewal/suspend/terminate actions; approved add-service.
- **Output:** Active/renewed/expired agreement state; contract status read by CAP-04/CAP-05/CAP-06.
- **Owned entities:** Agreement, Annex (ملحق).
- **Dependencies:** CAP-02 (activation trigger), CAP-07 (90/30-day alerts).
- **Related:** CAP-04, CAP-05, CAP-06.

### CAP-04 — Trainer Profile Management (إدارة ملفات المدربين)
- **Purpose:** The **single source of truth** for the approved trainer — data, availability, history, aggregated metrics. Auto-created on accreditation. Feeds the matching engine ("knowledge core").
- **Owner:** Trainer Management (internal), Trainer (self-update).
- **Input:** Approved trainer from CAP-02; self-updates; evaluations from evaluation system (via CAP-12); program/execution data (FAST); disbursement (CAP-06); program requests (CAP-05).
- **Output:** Profile data to CAP-05 matching engine; public-profile source to CAP-10; comprehensive internal profile view.
- **Owned entities:** Trainer Profile, Trainer Evaluations, Speaker Record management.
- **Dependencies:** CAP-02, CAP-03 (contract status gate — appears in matching only with a complete profile + active contract, `BR-0402`), CAP-05, CAP-06, CAP-12 (INT-02, INT-05).
- **Related:** all downstream operational capabilities.

### CAP-05 — Assignment & Matching (إدارة الإسناد والمطابقة)
- **Purpose:** Match center needs to accredited trainers for the **four contractual services** (not Speaker) via rule-based weighted matching — from assignment request to confirmed, executed engagement.
- **Owner:** Center Coordinator (request), Trainer Management (nomination).
- **Input:** Assignment request; trainer profile data + conflict status from CAP-04.
- **Output:** 3-candidate shortlist; assignment offer; confirmed engagement; execution documentation to trainer record; program/registration data (FAST).
- **Owned entities:** Assignment Request, Matching Matrix, Engagement/Link (ارتباط).
- **Dependencies:** CAP-04 (candidate data), CAP-07 (offers/alerts), FAST (INT-05, execution data), CAP-08 (coordinator scope).
- **Related:** CAP-04, CAP-06.

### CAP-06 — Entitlement Management / ERP (إدارة المستحقات المالية)
- **Purpose:** Display and track financial entitlement status per accredited trainer. **Consumes** disbursement status/amount/date from ERP. Performs **no calculation** and creates no disbursement order.
- **Owner:** Trainer Management (view); Trainer (portal view).
- **Input:** Disbursement status/amount/date per purchase order from ERP (INT-03).
- **Output:** Entitlement record display (portal + internal), linked PO → agreement → program.
- **Owned entity:** Entitlement (fully consumed from ERP).
- **Dependencies:** ERP (INT-03), CAP-03 (agreement link), CAP-05 (program/engagement link).
- **Related:** CAP-04, CAP-05.

### CAP-07 — Communication Management (إدارة التواصل والإشعارات)
- **Purpose:** Horizontal capability owning all official channels (email + in-platform), bilingual templates, the central notification matrix (event → template → audience → channel), and the **central deadline/SLA screen** spanning all 12 capabilities.
- **Owner:** System Administrator (config); all capabilities emit events.
- **Input:** Events from any capability; templates and matrices.
- **Output:** Sent notifications; notification log; managed SLAs/reminders.
- **Owned entities:** Notification Matrix, Template, Notification Log, Deadline Matrix.
- **Dependencies:** Email gateway (INT-04); recipient "primary language" field (Basic Profile) — one language per message (`BR-0707`).
- **Related:** every capability (each emits events).

### CAP-08 — Access & Permissions Management (إدارة الصلاحيات والوصول)
- **Purpose:** RBAC across the platform — permissions, **6 fixed roles**, user-role assignment, immutable audit.
- **Owner:** System Administrator.
- **Input:** Role/permission matrix config; user-role assignments; authenticated identity from Academy.
- **Output:** Access enforcement; audit log.
- **Owned entities:** Permission, Role (6 fixed), User, Audit Log.
- **Dependencies:** Academy identity/SSO (INT-01) — authentication is **not** managed in-platform (`BR-0808`).
- **Related:** all capabilities (access enforcement), CAP-09 (data scope), CAP-12.

### CAP-09 — Analytics & Reporting (التحليلات والتقارير)
- **Purpose:** Cross-cutting read layer over all 12 capabilities — role-scoped dashboards and exportable reports. **No own operational entity; stores no source data.**
- **Owner:** All roles (scoped); Senior Management (read/export only).
- **Input:** Live data from all capabilities.
- **Output:** Dashboards (per role), exportable periodic reports.
- **Owned entities:** Metric, Dashboard, Report (definitions only).
- **Dependencies:** All capabilities; CAP-08 (data-scope strategy).
- **Related:** all.

### CAP-10 — Public Presence Management (إدارة الواجهة العامة)
- **Purpose:** The public interface — marketing landing page, trainer directory (filter by specialty), and trainer visibility consent.
- **Owner:** Trainer Management/Admin (landing content); Trainer (consent).
- **Input:** Public-safe fields from CAP-04; consent decisions.
- **Output:** Landing page; directory of consented public profiles.
- **Owned entities:** Marketing Landing Page, Public Profile, Visibility Consent.
- **Dependencies:** CAP-04 (profile data), Academy site entry points (INT-01).
- **Related:** CAP-04.

### CAP-11 — Professional Community Management (إدارة المجتمع المهني)
- **Purpose:** **Undecided / deferred** — preliminary framework only, no approved entities yet.
- **Status:** Out of current scope; placeholder.

### CAP-12 — Integration Management (إدارة التكاملات)
- **Purpose:** Govern external integrations at the business level — integrated-systems registry, exchanged data elements, source-of-truth matrix, integration logs.
- **Owner:** Platform governance.
- **Input:** Integration definitions; sync events.
- **Output:** Governed data exchange; single source of truth per element; integration logs.
- **Owned entities:** Integrated Systems Registry, Exchanged Data Element, Integration Log.
- **Integrations (all "high" importance):**
  - **INT-01** Academy site — SSO/identity + entry-point routing, bidirectional → CAP-08, CAP-10
  - **INT-02** Trainee Evaluation System — inbound → CAP-04
  - **INT-03** ERP (financial) — inbound → CAP-06
  - **INT-04** Email gateway — outbound → CAP-07
  - **INT-05** FAST (training program management) — bidirectional → CAP-04, CAP-05
- **Source-of-truth matrix:** user identity → Academy site (INT-01); trainee evaluation → INT-02; disbursement status/amount → ERP (INT-03); trainer-profile data shown in FAST → Expert Hub platform; program execution data (registrants, scheduling) → FAST (INT-05).
- **Related:** all integrated capabilities.

---

## 6. Product Modules

Mapping the 12 capabilities into implementable modules (some collapse into shared platform services):

**A. Foundation / Platform Services**
1. **Identity & Access Module** (CAP-08 + INT-01) — RBAC, 6 roles, user-role assignment, audit log; auth delegated to Academy SSO.
2. **Integration Hub** (CAP-12) — systems registry, source-of-truth matrix, sync logging, failure/last-known-state handling.
3. **Communication & Notifications Module** (CAP-07 + INT-04) — event→template→audience matrix, bilingual templates, notification log, central SLA/deadline console.

**B. Onboarding & Accreditation**
4. **Application Module** (CAP-01) — unified dynamic form, basic profile, draft→submitted, add-service, speaker record entry.
5. **Screening & Accreditation Module** (CAP-02) — scoring (CTQ), AI qualitative helper, interview scheduling/evaluation, committee workflow, agreement preparation & internal approval, applicant signature.

**C. Relationship Lifecycle**
6. **Agreement Module** (CAP-03) — activation, expiry/alerts, renewal, annexes, status history.
7. **Trainer Profile Module** (CAP-04 + INT-02/INT-05 inbound) — single source of truth, self-update, comprehensive internal profile, matching feed, speaker record management.

**D. Operations**
8. **Assignment & Matching Module** (CAP-05 + INT-05) — request intake, weighted matching engine + manual search, 3-candidate shortlist, offer flow, material approval, engagement lifecycle, apology/cancellation.
9. **Entitlements Module** (CAP-06 + INT-03) — read-only ERP-sourced entitlement display, PO→agreement→program linkage.

**E. Presentation & Insight**
10. **Public Presence Module** (CAP-10) — landing page, directory, consent.
11. **Analytics & Reporting Module** (CAP-09) — role-scoped live dashboards, exportable reports.

**Deferred:** Professional Community (CAP-11).

---

## 7. User Journeys

### J1 — Join & Accreditation (self-service or internal nomination)
Applicant (or staff, internally) opens the unified form → selects one or more services → form shows required/optional fields based on selected services → uploads attachments (validated on upload) → submits (reference number issued **only** at submission) → application delivered to Screening. Screening Manager sees an auto-computed objective score per service plus a **separate** AI qualitative note → issues initial accept (interview slots auto-attached) or direct reject. Applicant selects an interview slot from their portal → interview held → evaluator fills one interview form covering the whole request (per-service accept/reject notes) → either direct reject or route to Committee → committee members approve sequentially (any rejection stops the request; all must approve to finalize) → request creator prepares one detailed agreement specifying approved services and internal approver sequence → internal approvers sign sequentially → agreement auto-sent to applicant → applicant signs & uploads from portal → status becomes **Approved**, active agreement handed to CAP-03, profile created in CAP-04.

### J2 — Add a Service (already-accredited trainer)
Trainer requests an additional (not-yet-approved) service from their portal → only the new service's missing mandatory fields are requested → request goes **directly to an administrative accept/reject decision** (bypasses screening, `BR-0112`) → on approval it becomes an **annex on the existing agreement** (no new agreement, no e-signature, `BR-0305`).

### J3 — Agreement Lifecycle
Signed agreement auto-activates; expiry computed (1 year first, 3 years on renewal, `BR-0302`). 90-day and 30-day alerts to trainer and management → administrative direct renewal (no re-screening) → renewed/active, or → expired if not renewed. Managers may suspend/terminate; new approved service attaches as annex.

### J4 — Assignment & Execution
Center Coordinator creates an assignment request (training includes the full brief) → nomination via weighted matching engine **or** manual search → **exactly 3 candidates** (no scheduling conflicts) sent together to the center → center picks one or rejects all (re-nominate) → offer sent to chosen candidate → if rejected, auto-advances to next candidate in the same shortlist (no return to center); if all three reject, re-nominate → on acceptance: **training** requires material upload → approval by request creator; **other services** confirm immediately → confirmed engagement documented instantly in trainer record → near execution, registrant count/names shown to trainer → executed. Trainer may apologize until **4 days** before (auto-advance to next candidate); manager may cancel until **24 hours** before.

### J5 — Entitlements
ERP posts disbursement status/amount/date per purchase order → platform links PO → active agreement → program → entitlement becomes visible to trainer (portal) and management (dashboard) **only after full linkage** (`BR-0603`). No in-platform objection path in this version (`BR-0605`).

### J6 — Public Discovery & Visibility
Visitor arrives at the platform's public landing page (via entry points on the Academy site) → browses the trainer directory, filtering by specialty → sees only consented public profiles (bio, specialties, simplified general classification; no sensitive data). Trainer controls and can withdraw visibility consent at any time (immediate hide, no data deletion, `BR-1007`).

### J7 — Speaker (limited, internal-only)
Trainer Management creates a Speaker Record from the Internal Dashboard for a specific event → no application path, no agreement, no entitlement, no portal → history of a speaker's events kept for future re-invitation; searchable by specialty.

### J8 — Administration & Governance (cross-cutting)
Admin manages roles/permissions matrix, users, notification matrix, bilingual templates, central deadlines/SLAs, and scoring/field configurations — all as editable config without technical redeployment; every change is audited. Leadership consumes role-scoped live dashboards and exportable reports.

---

## 8. Dependencies

**Foundational layer (must exist first):**
1. **Identity & Access (CAP-08)** + **Integration Hub with Academy SSO (CAP-12 / INT-01)** — nothing is usable without authenticated, authorized users. Auth is external (`BR-0808`), so INT-01 is a hard prerequisite (also `NFR-13`: no alternative auth path).
2. **Communication (CAP-07)** — a horizontal service the whole lifecycle emits events into; its notification matrix and central deadline screen span all capabilities.

**Onboarding chain (strict order):**
3. **Application (CAP-01)** → produces complete applications.
4. **Screening & Accreditation (CAP-02)** → consumes CAP-01 output; owns the decision; produces the signed agreement.
5. **Agreement (CAP-03)** → receives signed agreement from CAP-02; owns post-signature state.
6. **Trainer Profile (CAP-04)** → auto-created only after CAP-02 accreditation; gated by CAP-03 contract status.

**Operations layer (depend on CAP-04 + integrations):**
7. **Assignment & Matching (CAP-05)** → requires a populated CAP-04 and FAST (INT-05).
8. **Entitlements (CAP-06)** → requires CAP-03 (agreement), CAP-05 (program/engagement), and ERP (INT-03).

**Presentation/insight layer (depend on everything above):**
9. **Public Presence (CAP-10)** → depends on CAP-04 + consent.
10. **Analytics (CAP-09)** → reads live from all capabilities; depends on CAP-08 for data scope; should come last.

**Ordering summary:**
`CAP-08 / CAP-12 (INT-01) → CAP-07 → CAP-01 → CAP-02 → CAP-03 → CAP-04 → CAP-05 → CAP-06 → CAP-10 → CAP-09`. CAP-11 deferred.

---

## 9. MVP Recommendation

**Recommended MVP: the end-to-end accreditation-to-profile spine, plus the foundations it cannot run without.**

**In MVP:**
- CAP-08 Access + INT-01 Academy SSO (mandatory — no alternative auth exists)
- CAP-12 Integration Hub (at least INT-01; scaffolding for others)
- CAP-07 Communication (notification matrix, bilingual templates, central deadlines) — the lifecycle is event- and SLA-driven from the start
- CAP-01 Application (unified form, basic profile, self + internal, submission)
- CAP-02 Screening & Accreditation (scoring, interview, committee, agreement prep & signature)
- CAP-03 Agreement (activation, expiry/alerts, renewal, annex)
- CAP-04 Trainer Profile (auto-creation, self-update, comprehensive view)

**Why:** This is the platform's *reason to exist* — "the single unified reference for managing the relationship." The onboarding→accreditation→profile chain is a strict, non-optional dependency line (§8), and CAP-04 is described as the "knowledge core" every downstream capability feeds from. Nothing downstream (assignment, entitlements, public directory, analytics) has meaningful data until this spine produces accredited trainers. It also delivers standardized, governed accreditation — the BRD's central differentiator — in one coherent release.

**Fast-follow (Release 2):**
- CAP-05 Assignment & Matching + INT-05 FAST (first operational payoff once a trainer base exists)
- CAP-06 Entitlements + INT-03 ERP (read-only; low build risk, high trainer-experience value)
- CAP-10 Public Presence (depends only on CAP-04 + consent; can ship early if a public presence is a priority)

**Later:**
- CAP-09 Analytics (best once upstream data volume exists)
- CAP-11 Professional Community (explicitly deferred)

**Deliberately excluded from MVP:** matching engine, ERP entitlements, public directory, and analytics — each depends on the spine and adds integration risk without changing whether the core value is proven.

> The BRD does not prescribe an MVP or phasing; the above is a recommendation derived from its stated dependencies and drivers.

---

## 10. Risks

**Business risks**
- **No defined success metrics** (Section 9 empty) — the program can't prove value or prioritize objectively.
- **Data migration undefined** (Section 12 deferred) — current Excel/manual records' quality and scope are unassessed; onboarding an existing trainer base at launch is unplanned.
- **Governance of accreditation config** — scoring models, weights, and thresholds are admin-editable "without technical redeployment"; without change controls this can undermine the fairness the platform promises.
- **CAP-11 ambiguity** — a named capability with no scope creates stakeholder expectation risk.

**Technical risks**
- **Hard dependency on external identity (INT-01)** — `BR-0808` + `NFR-13` make Academy SSO a single point of failure with *no alternative auth path*; its availability directly caps platform availability (99.5% target).
- **Multiple bidirectional integrations** (INT-01, INT-05) and inbound feeds (INT-02, INT-03) — source-of-truth discipline (`BR-1201/1202`) and last-known-state handling (`BR-1203`) must be robust; sync failures degrade profile, matching, and entitlement accuracy.
- **Live analytics with no stored source data** (`BR-0904`) — near-real-time dashboards over 12 live sources is a performance/consistency challenge (`NFR-02`).
- **Data-model incompleteness** — 11 `DM-GAP` inputs are still required before entities/fields/relations can be fixed.

**UX risks**
- **Dynamic multi-service form complexity** — required/optional fields vary by combined service selection (`BR-0104`); legible conditional logic is non-trivial.
- **Aggregated status display** (`BR-0108`) — the trainer's status is a live roll-up of CAP-02/03 states the module doesn't own; risk of confusing or stale-looking status.
- **Single-language notifications** (`BR-0707`) despite bilingual templates — correct per-recipient language selection is essential; errors are user-visible.
- **RTL + full localization + mobile responsiveness** (`NFR-26`–`29`) on a mandated external design system ("كود المنصات") — flexibility constraints may collide with complex operational screens.

**Integration risks**
- **ERP entitlement visibility gated on full linkage** (`BR-0603`) — any PO→agreement→program mismatch silently hides entitlements from trainers, generating support load (no in-platform objection path, `BR-0605`).
- **FAST bidirectional coupling** (INT-05) — feeds trainer/program data and receives approved trainers; contract mismatches affect scheduling and execution display.
- **Evaluation feed dependency** (INT-02) — classification and matching quality depend on an external system the platform cannot edit.

---

## 11. Open Questions

*(Listed, not answered.)*

1. **Success Metrics** — Section 9 has no content. What are the quantified success criteria and their measurement method/baseline?
2. **Data migration** — What is the migration strategy, scope, timeframe, and handling of incomplete/conflicting legacy records (deferred to a separate annex)?
3. **DM-GAP inputs** — All still required to finalize the data model:
   - `DM-GAP-01` Application form: mandatory/optional fields per service, attachments, validation rules
   - `DM-GAP-02` Initial screening criteria: criteria, weights, scores, minimum acceptance per service
   - `DM-GAP-03` Interview evaluation model: axes, scores, final-score computation
   - `DM-GAP-05` Matching matrix: matching factors, weights, tie-breaking
   - `DM-GAP-06` Assignment request form: which fields continue/removed/added
   - `DM-GAP-07` Roles & permissions matrix: per-role function and data-scope authorities
   - `DM-GAP-08` Notification matrix: event, recipient, channel, template, timing
   - `DM-GAP-09` KPIs & reports: required metrics, data sources, aggregation level, consumer
   - `DM-GAP-10` Operational values: SLAs/deadlines, validity periods
   - `DM-GAP-14` Trainee evaluation system: evaluation level, calculation, relation to program/trainer
   - `DM-GAP-15` Data retention policy: retention durations, archival/hiding rules
4. **CAP-11 Professional Community** — What is its scope, entities, and timeline? (Explicitly undecided.)
5. **Public trainer rating** — `BR-1006/1008`: a public rating is withheld "until its source is decided." What will it be and where does it come from?
6. **AI qualitative analysis** — What model/service performs qualitative-question analysis (CAP-02), and what are its bounds/governance? (`BR-0202` states it is helper-only.)
7. **Entitlement objection** — `BR-0605` states no in-platform objection path "in this version"; is an out-of-platform process defined, and is it planned later?
8. **SLA values marked "(*)"** — Several SLA durations and NFR figures (screening 5 days, interview result 2 days, committee/approval 3 days, signature 10 days, 99.5% uptime, 3-sec response, 6-month dormancy, peak load) carry "(*)", implying provisional values. What are the final confirmed figures?
9. **Numbering gaps in business rules** — Several BR/US IDs are absent (e.g., `BR-0406`, `BR-0503`, `BR-0603/0604`, `BR-0706`, `BR-0803–0805`, `US-0803/0804`, `DM-GAP-04/11/12/13`). Intentional omissions, or missing rules/requirements?
10. **"Primary language" field** — `BR-0707` relies on a "primary language" field in the Basic Profile; is it captured at application, and what is the default/fallback?
11. **Committee & approver composition** — How are accreditation-committee members and internal agreement approvers defined, ordered, and configured (fixed vs. per-request)?
12. **Matching tie-breaking & weighting authority** — Who owns and can change matching weights, and how are ties resolved (tied to `DM-GAP-05`)?
13. **Speaker data governance** — Retention, privacy, and consent handling for Speaker Records (no portal, no agreement) — how do KSA data-protection controls (`NFR-05`) apply?

---

## Appendix A — Non-Functional Requirements (from BRD §10–11)

| Category | Ref | Requirement |
|----------|-----|-------------|
| Performance | NFR-01 | Core screens respond within 3s under normal load (*) |
| Performance | NFR-02 | Near-real-time dashboard updates, no manual refresh |
| Performance | NFR-03 | Handle expected peak load without noticeable degradation |
| Security | NFR-04 | Encrypt all bank/sensitive financial data at rest and in transit |
| Security | NFR-05 | Comply with KSA personal-data-protection controls |
| Security | NFR-06 | Store no credentials in-platform; rely fully on Academy identity delegation |
| Security | NFR-07 | Immutable audit log for every sensitive action across all capabilities |
| Availability | NFR-08 | Uptime SLA ≥ 99.5% (*) |
| Availability | NFR-09 | Automated daily backup + full weekly backup |
| Availability | NFR-13 | Academy site integration (INT-01) availability is critical — no alternative auth path |
| Availability | NFR-14 | Backups cover only platform-produced data; consumed data owned by source systems |
| Localization | NFR-26 | RTL support — correct layout for all Arabic interfaces |
| Localization | NFR-27 | Local date/number formatting per interface language |
| Localization | NFR-28 | Language preference persists across sessions |
| Localization | NFR-29 | Mobile accessibility — touch-friendly, fully responsive |
| Branding | NFR-34 | All interfaces conform to DGA "كود المنصات" design system; no separate identity |
| Branding | NFR-35 | Future design-system updates propagate without per-screen redesign |

*(*) = value marked provisional in the BRD.*

---

## Appendix B — Integration Summary (from BRD §8.12)

| Ref | System | Direction | Data | Consuming Capabilities |
|-----|--------|-----------|------|------------------------|
| INT-01 | Academy Financial Site | Bidirectional | User identity, navigation links | CAP-08, CAP-10 |
| INT-02 | Trainee Evaluation System | Inbound | Evaluation results, program, trainer, date | CAP-04 |
| INT-03 | ERP (Academy financial system) | Inbound | PO number, amount, disbursement status/date, trainer | CAP-06 |
| INT-04 | Email Gateway | Outbound | Recipient, template content, message/send status | CAP-07 |
| INT-05 | FAST (Training Program Mgmt) | Bidirectional | Trainer data, program data, registrant data | CAP-04, CAP-05 |

**Source-of-truth ownership:** identity → INT-01 · trainee evaluation → INT-02 · disbursement/amount → ERP (INT-03) · trainer-profile-in-FAST → Expert Hub · program execution (registrants, scheduling) → FAST (INT-05).

---

*Prepared from BRD-TRN-001 v1.0. Intended as the foundation for subsequent design and architecture work (docs 02–10).*
