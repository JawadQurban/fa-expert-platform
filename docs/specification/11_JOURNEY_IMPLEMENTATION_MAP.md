# 11 — Journey Implementation Map (J-01 → J-24)

> ⚠️ **2026-09-16:** the per-journey status here is stale for J-02, J-03, J-06, J-10, J-11 and J-18–J-22 — see `24_RELEASE_READINESS.md` for the verified end-to-end status and release blockers.


**Status:** 🟢 Live — updated as each journey is built
**Business source of truth:** the 24 journey documents in this folder (`Journeys …md`, `J-01 …md`, `Journey J-02 … J-24 …md`) + `BRD-TRN-001 v1.1`
**Page/UX source of truth:** [`04_PAGE_SPECIFICATIONS.md`](04_PAGE_SPECIFICATIONS.md) · [`05_WIREFRAME_SPECIFICATIONS.md`](05_WIREFRAME_SPECIFICATIONS.md)
**Code scope:** `frontend/src/**` only (see `CLAUDE.md` → *Expert Hub — Deployment & Scope Boundary*)

---

## 0. Why this document exists

The 24 journey documents were added **after** `04_PAGE_SPECIFICATIONS` / `05_WIREFRAME_SPECIFICATIONS` were written. Where the two disagree, **the journey documents win** (owner instruction, 2026-08-13) — they carry the newer, more specific business logic. The page specs remain authoritative for **page structure, Design-System component mapping, states, a11y, and responsive behaviour**.

Known deltas already identified (journey → supersedes page spec):

| # | Page spec says | Journey says | Winner |
|---|---|---|---|
| Δ1 | EH-INT-03 accept → "auto-attach interview slots" (`BR-0205`) | J-05/F5: accept is **per selected service**, and requires **either** (slots **+** committee members together) **or** an **interview exemption** with a reason (J-08) | Journey |
| Δ2 | EH-INT-03 reject = whole application, no reason UI detailed | J-05/F5: reject warns it rejects the **entire application**, requires explicit confirmation **and** a reason from the unified list (`BR-0219`) | Journey |
| Δ3 | EH-INT-05 committee = fixed composition (`Q11` open) | J-09/F2: the **application's creator forms** the committee (members + sequence + mandatory/optional) and may save it as a **reusable template**; only **mandatory** rejections halt (`BR-0211` revised) | Journey |
| Δ4 | Agreement prep = "approver sequence" | J-10/F2: a **signing sequence** distinct from the approval committee, with explicitly designated **e-signer(s)**; **no reject option** — modification only | Journey |
| Δ5 | Bank data not modelled | J-09/F6: bank data is collected **in the trainer profile** after final approval, and gates J-10 | Journey |
| Δ6 | Assignment shortlist = "exactly 3" | J-17/F2: **3 per required slot** (headcount from J-16/F4), so a 2-trainer request → exactly 6 candidates | Journey |
| Δ7 | Offer handling: auto-advance on reject | J-18/F2: **3-day** response window; **silent expiry** behaves like rejection but raises a **distinct** staff notification | Journey |

These deltas are carried into the build; `DECISIONS.md` records them as project decisions as each is implemented.

---

## 1. Coverage audit (as of 2026-08-20)

> **Status column is authoritative here and in `12_JOURNEY_CONFORMANCE_AUDIT.md` §1;
> the two are kept in step.** The *Gap* column carries the detail 12 summarises.

Legend — **✅ Built** · **🟡 Partial** (some features of the journey exist) · **⬜ Not built** · **⚙️ System-only** (no UI surface of its own)

| J | Journey | Interface | Page(s) | Status | What exists today | Gap |
|---|---|---|---|---|---|---|
| J-01 | Initial Onboarding & Application Submission | TP / Public | EH-TP-05, EH-TP-02 | ✅ | `NewApplicationPage` — **six J-01 sections**, sequential step gates (F1/AC-3), union-of-services mandatory logic (`BR-0104`), review gate (`BR-0105`), **approved attachment rules: 1 MB, JPG/PNG or PDF/DOC/DOCX** (F1/AC-5), reference at submission only (`BR-0107`), one-active-application block (`BR-0101`), and the **accredited-trainer block routing to J-03** (F3/AC-4); `MyApplicationsPage` | Field matrix still `DM-GAP-01`; the `G4` SSO contract is still open, but it covers only the Nafath/FA.Auth *integration* — the identity rules themselves are built (P-60) |
| J-02 | Internal Nomination of New Applicant | INT → TP | EH-INT-02 (+ EH-TP-05 reuse) | 🟡 | Inbox "Nominate" button links to the same form (`BR-0109`) | **F3 only** — the activation-invitation email needs `J-25`. F1, F2 and F4 (nominee activation, public route) are built |
| J-03 | Add Service to Approved Trainer | TP → INT | EH-TP-06, EH-INT-03b | ✅ | `AddServicePage` (trainer request side) | AC-6/AC-7 notifications need `J-25`; the rejection-reason list is served as configuration until J-03 open item 2 is settled (P-57) |
| J-04 | Speaker Record Management | INT | EH-INT-11 | ⬜ | — | 🚫 **Blocked** — the Speaker Fields matrix is still *pending upload* per the journey’s own open item 1. Nothing is invented in its place |
| J-05 | Screening & Initial Decision | INT | EH-INT-03 | ✅ | `ScreeningDetailPage` — per-service objective score + criteria breakdown, advisory AI panel, section-by-section form review, attachments, SLA badge, decision panel (per-service accept with slots **+** committee or exemption; whole-application reject with reason), recorded-decision view | Evaluation weights/threshold arrive as config (`DM-GAP-02` still open); attachment preview blocked on storage (`G26`) |
| J-06 | Interview Scheduling & Confirmation | TP (+INT) | EH-TP-03, EH-INT-04 | ✅ | `ApplicationActionPanel` `select-slot` action (trainer); **staff-side reschedule shipped** on EH-INT-04 (new slots + note, same ticket number retained per F4/AC-6); interview ticket + Teams-link surface built | F2 Teams meeting creation is still outside the integration table (CAP-12); the 3-business-day slot SLA is served, not computed (P-51) |
| J-07 | Interview Evaluation & Post-Interview Decision | INT | EH-INT-04 | ✅ | `InterviewEvaluationPage` — ticket card, committee response tracker, per-service axis-scored evaluation form with "did not attend", result withheld until every member responds (`BR-0220`), forward-to-committee / reason-gated direct reject restricted to the screening decision-maker (`BR-0208`) | Axes/weights arrive as config (`DM-GAP-03` still open) |
| J-08 | Interview Exemption | INT | EH-INT-03 (inside J-05 decision) | ✅ | Exemption path per accepted service with the approved 3-reason list (+ free text on "Other"); exempted services route straight to the committee; per-service mix supported (one exempted, one interviewed) | Applicant-facing timeline must render the interview step as **passed** without disclosing the exemption (EH-TP-03, increment 2) |
| J-09 | Approval Committee Decision | INT (+TP) | EH-INT-05, EH-TP-04 §bank | ✅ | `CommitteeDecisionPage` — sequence formation (members/order/mandatory-optional/named templates that **copy** on reuse), combined screening+interview context, sequential approval with auto-advance, obligation-specific rejection (mandatory halts / optional logs a note), modification request + resume-from-requester, and the bank-data gate; `BankDataSection` on the trainer profile with the 8 mandatory fields | Bank-data **permanence** (permanent profile vs collected per agreement) still unconfirmed — flagged in code, affects J-14/J-15 |
| J-10 | Agreement Preparation & Internal Approval | INT | EH-INT-06a | ✅ | `AgreementPreparationPage` — two-condition gate from J-09, editable fields with auto-merged trainer/bank data **after** saving, signing-sequence formation with designated e-signer(s) (shared P-J1), reviewer-vs-signer actions, no reject anywhere, modification + resume, and the send gate requiring a complete sequence **and** an attached signature | Template field list open (`DM-GAP-16`); document preview/download blocked on storage (`G26`); number of signers per sequence unconfirmed |
| J-11 | Applicant Signing & Activation | TP | EH-TP-03 | ✅ | `ApplicationActionPanel` `sign-agreement` action | The signed document itself is blocked on storage (`G26`); the e-signature artefact is the typed full name (P-43) |
| J-12 | Agreement Lifecycle Management | INT (+TP) | EH-INT-06 | ✅ | — | F1’s 90/30/5-day *alerts* need `J-25`; suspend reversibility rests on the page spec pending `Q18` (P-67) |
| J-13 | Trainer Profile Creation | ⚙️ System | — | ⚙️ | — | No UI. Modelled as the mock provider's post-signature transition + the **profile status matrix** (Active/Idle/Suspended/Expired), internal-only visibility |
| J-14 | Trainer Self-Service Profile Update | TP | EH-TP-04 | ✅ | `MyProfilePage` with editable fields, certificates, locked fields | General attachment self-update (F1/AC-2) is still open; the form now shares J-01’s schema outright (P-52) |
| J-15 | Trainer Search & Unified Profile Review | INT | EH-INT-07, EH-INT-08 | ✅ | — | Domain filter needs `Q16`; two Identity Card fields have no source (`Q19`); PDF export needs `G26` + an approved card template |
| J-16 | Assignment Request Creation | INT | EH-INT-09a | ✅ | — | Trainer path only — Consultant, Content Developer and Question Writer have empty request matrices (J-16 open item 1) and report why rather than showing an empty form (P-78) |
| J-17 | Matching & Nomination | INT | EH-INT-09b | ✅ | Matching engine run + manual search, ranked pool (**3 per slot**), candidate cards with identity card + price, requesting-party per-candidate approve/reject + preference ranking (2026-08-20) | Weights + tie-breaking unapproved (`DM-GAP-05`), served as configuration and named on screen; matching for the other three services is undefined until their J-16 matrices exist |
| J-18 | Assignment Offer Handling & Response | TP + INT | EH-TP-07 (+EH-INT-09c) | ✅ | Offer card with the full J-16 plan detail, 3-day P-J4 countdown, accept/reject, "My Engagements", per-slot FAST state, training-material status check. **No send operation** (F1/AC-1) (2026-08-20) | Every notification (offer, rejection, the distinct expiry notice) needs `J-25` |
| J-19 | Re-routing After Offer Rejection | INT | EH-INT-09d | ✅ | Exhausted-slot alert, slot-scoped re-match (never request-scoped), confirmed siblings read-only, prior refusers re-includable, fresh J-17/F4 cycle, **no escalation** (2026-08-20) | The exhausted-slot notification (F1/AC-2) needs `J-25` |
| J-20 | Training Material & Content Submission | TP + INT | EH-TP-08 (+EH-INT-10) | ✅ | Two paths, one shape: upload → pending approval → approve or ask again with a note. Only the material path syncs to FAST (F3 vs F5/AC-5). **No reject**, **no SLA** (open item 1) (2026-08-20) | No approval SLA is defined for either path (open item 1); preview/download needs `G26`; the Content Developer path’s *origin* needs J-16’s empty matrix |
| J-21 | Engagement Execution Follow-up | TP | EH-TP-07c | ✅ | Engagement detail: the J-16 plan payload, Teams link **or** venue (union), live enrolment with names only, attendance as a layer on the same rows, schedule-derived auto-complete → Past Engagements, MTM evaluations independent of completion (2026-08-20) | The FAST field name for attendance is unconfirmed (open item 1); F1/AC-3’s change notification needs `J-25` |
| J-22 | Withdrawal / Cancellation Handling | TP + INT | EH-TP-07c (+EH-INT-09c) | ✅ | Three independent scenarios: trainer withdrawal, staff de-linking, and a plan cancellation received from FAST. Two closed reason lists kept apart by the record’s `by` tag; **no cancel-plan operation exists**; three distinct end-states (2026-08-20) | Notifications on all three scenarios need `J-25` |
| J-23 | Public Visibility Consent Management | TP | EH-TP-10 | ✅ | `VisibilityConsent` inside `MyProfilePage` | All four ACs hold; three of them structurally. A dedicated Account & Visibility page is a presentation choice, not a gap |
| J-24 | Public Trainer Directory Browsing | Public | EH-PUB-02, EH-PUB-03 | ✅ | `TrainerDirectoryPage`, `PublicTrainerProfilePage` | Confirm field set = name, domain, specialization, delivered programs only (`BR-1004` corrected) |

**Summary (updated 2026-08-20):** **22 of 24 documented journeys complete** · 1 partial (J-02/F3, needs `J-25`) · 1 blocked (J-04, needs the Speaker Fields matrix) · J-13 is system-only and verified. J-25–J-28 have no documents at all (`Q17`).

---

## 2. Build order (dependency-ordered)

Each increment is a self-contained, separately validated unit: types → service (mock provider behind the versioned contract) → content (AR authoritative / EN) → components → page → route → tests → docs. Every increment runs `npm run validate` + `npm run build`.

| # | Increment | Journeys | Page(s) | Why here |
|---|---|---|---|---|
| ~~**1**~~ ✅ | ~~**Screening & Initial Decision**~~ **— shipped 2026-08-16** | **J-05 + J-08** | EH-INT-03 | The next unbuilt link after the inbox; everything downstream (interview, committee, agreement) starts from its decision |
| ~~2~~ ✅ | ~~Interview Evaluation & Post-Interview Decision~~ **— shipped 2026-08-16** | J-07 (+ J-06 staff side) | EH-INT-04 | Consumes the committee + slots produced by increment 1 |
| ~~3~~ ✅ | ~~Approval Committee + Bank Data~~ **— shipped 2026-08-16** | J-09 | EH-INT-05, EH-TP-04 §bank | Consumes the J-07 forward decision; introduces the reusable **sequence-formation** pattern |
| ~~4~~ ✅ | ~~Agreement Preparation & Internal Signing~~ **— shipped 2026-08-17** | J-10 | EH-INT-06a | Reuses increment 3's sequence-formation pattern; gated on bank data |
| 5 | Applicant Signing (3-way) + Agreement Lifecycle | J-11, J-12, J-13 | EH-TP-03, EH-INT-06 | Completes the accreditation spine → trainer profile exists |
| 6 | Trainer Search & Unified Profile + Identity Card | J-15 | EH-INT-07, EH-INT-08 | Needs profiles from increment 5; feeds matching |
| 7 | Assignment Request + Matching & Nomination | J-16, J-17, J-19 | EH-INT-09 | Needs trainer profiles + identity cards |
| 8 | Offer Handling, Engagements, Material, Withdrawal | J-18, J-20, J-21, J-22 | EH-TP-07 | Needs nominated candidates |
| 9 | Internal Nomination, Add-Service decision, Speakers, Consent page | J-02, J-03, J-04, J-23 | EH-INT-02/03b/11, EH-TP-10 | Independent side journeys; no downstream blockers |
| 10 | Identity Linking layer | J-01 | EH-TP-05 pre-form | Depends on the SSO/Nafath contract (`G4`) — mockable, but best done once the auth contract is settled |

---

## 3. Cross-journey patterns to build once and reuse

| Pattern | First needed | Reused by |
|---|---|---|
| **P-J1 Sequence formation** (members + order + mandatory/optional + saved templates) — **shared**: `shared/components/SequenceFormation.tsx` + `shared/types/sequence.ts`, copy injected per journey, optional e-signer designation | J-09/F2 | J-10/F2 (signing sequence — same mechanism, distinct record). Each feature supplies a copy adapter and enables only the formation rules it needs |
| **P-J2 Reason-required decision** (unified rejection reason list, `BR-0219`) | J-05/F5 | J-07/F3, J-09/F8, J-03/F3, J-22/F1-F2 |
| **P-J3 Modification request** (mandatory note visible to the whole sequence) | J-09/F7 | J-10/F4, J-11/F1 |
| **P-J4 SLA countdown** (remaining / approaching / breached) — **shared**: `shared/types/sla.ts` + `shared/components/SlaBadge.tsx` + **`shared/sla/mockSlaMatrix.ts`** (the one central matrix, 2026-08-27 — P-155), copy injected per journey | J-05/F2 | J-06/F1/AC-4 (applicant, 3 business days — built), J-18/F2 (3 days), J-12/F1 (90/30/5 days). Server-decided state; the UI renders it, never computes it |
| **P-J8 Proposed interview slots** (`InterviewSlotsField`, built in `features/interviews`) | J-05/F5 (screening) | J-06/F4 (staff reschedule) — one editor, injected copy per journey |
| **P-J9 Server-decided viewer capabilities** (`canEvaluate` / `canDecide` / `canReschedule`) | J-07/F3 (`BR-0208`) | J-09/F4 (committee turn), J-10/F3 (signer vs reviewer), J-11/F1 |
| **P-J5 Per-service decision** (one application, independent per-service outcomes) | J-05/F5 | J-07/F1, J-08/F1 |
| **P-J6 Upload → review → approve/re-upload** | J-20/F1-F2 | J-20/F4-F5, J-03/F3 (addendum) |
| **P-J7 External-source field group** (read-only + source + last-sync) | J-16/F3 (FAST) | J-21/F3-F4 (FAST), J-21/F6 (MTM), entitlements (ERP) |
| **P-J10 In-platform e-signature** — **shared**: `shared/types/eSignature.ts` + `shared/components/ESignatureField.tsx`, copy injected per journey | J-10/F3/AC-4 (internal signer) | J-11/F1/AC-3 (applicant) — the journey requires "the same e-signature mechanism", so both inputs extend `ESignatureInput` rather than each declaring their own field |

---

> **Full audit:** `12_JOURNEY_CONFORMANCE_AUDIT.md` (2026-08-19) covers **every**
> page against **all** journeys, including the ones built from journeys and the
> four catalogued journeys (J-25→J-28) that have no document. §3b below is the
> narrower record of conformance *fixes* applied to the pre-journey pages.

## 3b. Conformance audit of pre-journey pages

Pages built **before** the 24 journeys arrived were written against
`04_PAGE_SPECIFICATIONS`, now superseded (P-20). A gap is missing work; a
**conflict** is shipped behaviour that contradicts an approved rule. Conflicts
are fixed first.

| Page | Finding | Type | Status |
|---|---|---|---|
| EH-TP-05 | Attachment limits were 5–10 MB with `pptx`; J-01's **approved** table says 1 MB and JPG/PNG or PDF/DOC/DOCX | **Conflict** | ✅ Fixed 2026-08-19 |
| EH-TP-05 | Three ad-hoc sections instead of J-01's six named ones | **Conflict** | ✅ Fixed 2026-08-19 |
| EH-TP-05 | No block for an account already holding an approved Trainer role (F3/AC-4) — it must route to J-03, not to "track your application" | **Conflict** | ✅ Fixed 2026-08-19 |
| EH-TP-05 | Identity Linking layer entirely absent; guest cannot fill the form at all (route is behind `RequireAuth`) | Gap (architectural) | ✅ Built 2026-08-19 — `features/identity`, route opened, guard moved into the page (P-60–P-63). Only `G4`'s *integration contract* was ever blocked, not the rules |
| EH-PUB-03 | Public profile showed `bio`, `rating`, `ratingBreakdown`, `classification`, `yearsExperience`, `traineesTrained`; J-24/F2/AC-1 (`BR-1004` **corrected**) allows only name, domain, specialization, delivered programs — and the journey **removed public evaluation display entirely** | **Conflict (privacy)** | ✅ Fixed 2026-08-19 — removed from the DTOs, not just the layout (P-40/P-41) |
| EH-PUB-02 | Result cards carried a rating + bio, and the hero aggregated `classification` into an "expert-level" count | **Conflict (privacy)** | ✅ Fixed 2026-08-19 — cards are identity + specialization; the hero aggregate is now `programsDelivered` |
| EH-PUB-03 | J-24/F2/AC-1 lists *domain* **and** *specialization*; only specialization is modelled and no domain taxonomy exists in any source | Gap (missing input) | ⬜ `Q16` — no domain invented |
| EH-TP-03 | Timeline had no exemption handling; J-08/F2/AC-3 requires the interview step to read **passed** without disclosing the exemption | Gap | ✅ Closed 2026-08-19 — guaranteed by omission: `TimelineStageDto` has no exemption field (P-45). Labelled mock scenario + test |
| EH-TP-03 | Single `sign-agreement` action that **uploaded a signed PDF**; J-11/F1 requires **three** decisions (e-sign in-platform / reject-and-close / request modification) | **Conflict** | ✅ Fixed 2026-08-19 — `decide-agreement` + `AgreementDecisionPanel`; e-signature shared with J-10 (P-42/P-43/P-44) |
| EH-TP-03 | The applicant could not read the agreement before deciding; J-11/F1/AC-2 requires preview or download "showing all agreement data without exception" | Gap | ✅ Closed 2026-08-19 — `AgreementPreviewCard` renders the full data; the PDF download stays honest-blocked on `G26` |
| EH-TP-04 | Profile status must never be shown to the trainer (J-13/AC-10 — internal-only) | Unverified → **clean** | ✅ Verified 2026-08-19 — `MyProfileDto` has no status field; guarantee documented (P-48) + regression test added |
| EH-TP-04 | The profile was a **separate** update form; J-14/F1/AC-1 requires the *exact same* fields and sections as the application form | **Conflict** | ✅ Fixed 2026-08-19 — renders `profile.formSchema` (P-52/P-53) |
| EH-TP-04 | J-14/F2's locked matrix wants the **agreement status** visible read-only; it was not shown at all | Gap | ✅ Fixed 2026-08-19 — `LockedFactsSection` (P-54) |
| EH-TP-05 | The mock schema invented a `bio` field that `BR-1004` (corrected) says does not exist | **Conflict** | ✅ Fixed 2026-08-19 — removed (P-55) |
| EH-TP-06 | Already-approved services were shown **disabled**; J-03/F1/AC-1 says they are **excluded** | **Conflict** | ✅ Fixed 2026-08-19 — the selection control lists only requestable services (P-46) |
| EH-TP-06 | Delta fields included *optional* service-specific fields; J-03/F1/AC-2 says "only the **mandatory** fields" | **Conflict** | ✅ Fixed 2026-08-19 — rules moved to `addService.types.ts` + unit-tested (P-47) |
| **EH-INT-02b** | J-03/F2 (review with trainer context) and F3 (direct decision + mandatory addendum) had **no screen at all**, and none in `04_PAGE_SPECIFICATIONS` either | Gap | ✅ Built 2026-08-19 from the journey (P-56–P-59) |
| **EH-INT-06** | `04` §7 says renewal grants "a new 3-year term"; J-12/F2/AC-2 is **1 year first, 3 years subsequent** — the page spec collapsed `BR-0302` | **Conflict** | ✅ Journey followed 2026-08-20; term is server-derived with no input (P-64) |
| **EH-INT-06** | `04` §7 lists "add annex" as an action here; **J-12's scope defers it** to J-03/F3, "referenced here, not rebuilt" | **Conflict** | ✅ Absent by design 2026-08-20 — EH-INT-02b owns it (P-66) |

---

## 4. Blocking inputs carried from the journeys

These are **pending matrices** the journeys themselves flag. Where a matrix is missing, the UI is built to the journey's *structure* with a clearly-labelled mock configuration, never an invented business rule.

| Ref | Missing input | Blocks | Handling |
|---|---|---|---|
| `DM-GAP-01` | Application Fields by Service matrix (J-01) | J-01, J-02 | Mock schema already in `mockApplicationSchema.ts`, labelled |
| `DM-GAP-02` | Evaluation Matrix weights (J-05) | J-05 score display | Structure built; weights come from a labelled mock config |
| — | Insight-page score threshold (J-05/F2/AC-5) | Threshold indicator | Indicator built, threshold from mock config |
| — | "Qualitative questions" field list (J-05/F4) | AI panel scope | Panel built over the mock schema's free-text fields |
| `DM-GAP-03` | Interview Evaluation Model (J-07) | J-07 form | Structure built; axes from mock config |
| `DM-GAP-16` | Editable agreement template fields (J-10) | J-10 prep form | Only confirmed fields (start/end date) + labelled placeholder |
| — | Speaker Fields matrix (J-04) | J-04 form | Blocked until uploaded |
| `DM-GAP-05` | Matching weights + tie-breaking (J-17) | J-17 ranking | Structure built; weights from mock config |
| `DM-GAP-08` | The approved notification routing: which event notifies whom, from which template (CAP-07) | Every notification in the product | EH-INT-12 built 2026-08-27 with all twenty events **unrouted** and the matrix marked *unapproved on screen* (P-146). The events are real and cited; only the routing and the message wording are missing → `Q34` |
| `DM-GAP-10` | Deadline durations across the twelve capabilities (CAP-07 / `F-0704`) | Every SLA countdown, and PB-04's re-wiring | The three deadlines journeys **state** are seeded with their citation; the three a journey leaves open show **no duration** (P-150). The gap is a count on screen, not a blank table |
| `DM-GAP-07` | The approved role × permission matrix contents (CAP-08) | Every authorization decision, and the *منسق مركز* scoping J-17 implies | EH-INT-12 built 2026-08-27 with all 348 cells **ungranted** and the grid marked *unapproved on screen* (P-138). The six roles and the 58 permissions are the BRD's own; only the grants are missing → `Q31` |
| — | Consultant / Content Developer / Question Writer request data (J-16) | Non-trainer assignment paths | Trainer path built first; others flagged in-page |
| — | Teams API integration (J-06) | Meeting creation | Not in the integration table (CAP-12) — surfaced as data, never called from the frontend |

---

## 5. Invariants every increment must honour

1. **Arabic-primary, RTL-default, WCAG 2.2 AA** (`CLAUDE.md`).
2. **Design System only** — compose `@ds`; never add DS components, tokens, colors, or type rules from a feature.
3. **No direct integration calls** — the React app talks only to the Expert Hub API base URL; FAST / MTM / ERP / SSO data arrives through it (`02C`).
4. **Business status ≠ sync status** — a failed sync never reverts or masks a business decision.
5. **Mock providers implement the same versioned contract as the future HTTP provider** — swapping is configuration, not a UI change.
6. **Scope boundary** — only `frontend/src/**` + `deploy/**` change; shared DS/util changes require their own task.

---

*Maintained alongside [`TODO.md`](../archive/expert-hub/TODO.md) (open gaps) and [`DECISIONS.md`](../DECISIONS.md) (locked calls).*
