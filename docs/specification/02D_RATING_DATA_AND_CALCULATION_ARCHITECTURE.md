# 02D — Rating Data & Calculation Architecture

**Platform:** Expert & Independent Trainer Management Platform ("Expert Hub") — Financial Academy
**Status:** ✅ Complete (architecture-only — **no frontend/backend code in this session, no Design System changes**)
**Corrects:** `02C_APPLICATION_AND_INTEGRATION_ARCHITECTURE.md` §4 (MTM ownership), §6 (MTM Rating Integration), §7 (Rating Display Rules), §3.1 (Ratings module), §9 (CAP-API-07), §11 (SQL Server logical areas) — see that document's own correction notes at each location.
**Decisions baseline:** `DECISIONS.md` `P-12` (this document)
**Date:** 2026-07-22

> **What changed and why.** The prior session's `02C` documented MTM as authoritative for *both* the raw rating data *and* the final displayed rating values. That was an oversimplification, corrected here: **MTM is authoritative only for the raw rating data it submits. Expert Hub persists that raw data as an integrated business record (not a disposable cache) and is authoritative for every calculated indicator — program rating, overall rating, trends — built from it.** The original MTM value is never overwritten and stays traceable back to source, always distinguishable from any calculated figure derived from it.
>
> **✅ Update, same day:** `TODO.md` `Q15` — whether MTM is a real system distinct from BRD's INT-02 — is now **closed**. Product Owner clarification confirms **MTM is BRD's INT-02**, a real, distinct external system, with no separate evaluation system alongside it (`DECISIONS.md` `P-13`). Every reference below to "MTM" is simultaneously a reference to INT-02 — they are the same integration, not two.

---

## Table of Contents

1. [Rating Data Ownership](#1-rating-data-ownership)
2. [Two Rating Types](#2-two-rating-types)
3. [Calculation Model](#3-calculation-model)
4. [Expert Hub Database Areas](#4-expert-hub-database-areas)
5. [Immutability and History](#5-immutability-and-history)
6. [Synchronization Flow](#6-synchronization-flow)
7. [Calculation Triggers](#7-calculation-triggers)
8. [Rating API Capabilities](#8-rating-api-capabilities)
9. [Rating Display Rules](#9-rating-display-rules)
10. [Security and Audit](#10-security-and-audit)
11. [Database Governance](#11-database-governance)
12. [Open Business Decisions](#12-open-business-decisions)
13. [Readiness](#13-readiness)

---

## 1. Rating Data Ownership

### MTM owns
Raw expert rating submissions; raw program-level rating values; rating question/criterion results where exposed; rating source identifiers; rating submission date; the rating scale MTM supplies; MTM's own original calculation result, if MTM provides one; MTM rating record identifiers.

### Expert Hub owns
The local persisted copy of MTM rating records required for platform use; normalized rating records; rating calculation rules configured for Expert Hub; calculated program rating; calculated overall expert rating; weighted rating results; aggregate values; rating trends; calculation history; calculation version; synchronization status; data-quality status; last refresh timestamp; reconciliation status; the displayed rating indicators used throughout Expert Hub.

**The stored MTM data is an integrated business record, not merely a technical cache.** This is the key distinction this document exists to establish: `02C`'s original framing treated persisted MTM data as disposable/refreshable cache with no independent standing; that undercounts its importance. Once a rating record is received from MTM, it becomes part of Expert Hub's own operational history — it is queried, referenced by calculation runs, and audited, even if MTM's own copy later changes. **The original MTM value must remain immutable or historically traceable** — never silently overwritten by a later correction or a calculated figure. See §5.

---

## 2. Two Rating Types

Kept as two separate entities, never combined into one field or one record — this mirrors the same discipline `02_INFORMATION_ARCHITECTURE.md` §9 already applies to other shared patterns (one concept, one owner, no collapsing distinct things into a shared shape for convenience).

### A. Expert Rating by Program
Linkage and fields: Expert Hub expert identifier · FAST trainer identifier · FAST Plan ID · FAST relationship/assignment identifier (where available) · Program Name · Plan Date · Expert Hub assignment identifier · MTM rating record identifier · raw rating value · normalized rating value · calculated program rating · rating scale · rating status · rating date · calculation version · last synchronization timestamp.

### B. Expert Overall Rating
Calculated by Expert Hub from the expert's eligible program ratings. Fields: Expert Hub expert identifier · FAST trainer identifier · calculated overall rating · number of included program ratings · calculation period · weighting method · calculation version · calculated date · last source-data date · data-quality status.

---

## 3. Calculation Model

Expert Hub must support **configurable** calculation logic — **the final formula is not hardcoded and is an explicit open business decision** (§12, `G53`). The architecture must be able to express, once approved:

- Simple average
- Weighted average
- Weighting by program type
- Weighting by number of respondents
- Weighting by recency
- Minimum response threshold
- Exclusion of incomplete ratings
- Exclusion of cancelled programs
- Exclusion of invalid or disputed ratings
- Recalculation after source correction
- Versioned calculation rules

**Every calculation result must record:** calculation rule version; calculation date; source rating records included; source rating records excluded; exclusion reason; resulting value; precision and rounding rule; calculation status. This is what makes a calculated figure defensible after the fact — "why is my overall rating 4.2" must always be answerable by pointing at exactly this record, never by re-running an ambiguous, undocumented computation.

---

## 4. Expert Hub Database Areas

Logical entities only — **no final physical schema this session**, consistent with `02C` §11's discipline.

| Entity | Responsibility | Classification (per `02C` §11's scheme) |
|---|---|---|
| **RatingSourceRecord** | Stores the original, normalized MTM rating record: MTM record ID, expert reference, FAST trainer ID, Plan ID, assignment reference, rating value, rating scale, source date, raw payload reference, synchronization status, received timestamp, source hash/version | **Integrated business record** (not "cached projection" — see §1) |
| **ProgramRating** | Stores the calculated rating for one expert and one program | Authoritative Expert Hub data |
| **ExpertOverallRating** | Stores the current calculated overall rating | Authoritative Expert Hub data |
| **RatingCalculationRun** | Stores each calculation execution: rule version, date, included/excluded source records, exclusion reasons, result, status | Authoritative Expert Hub data (audit-adjacent) |
| **RatingCalculationRule** | Stores versioned calculation configuration | Authoritative Expert Hub data (admin-managed config) |
| **RatingCalculationInput** | Links a calculation run to its included and excluded source records | Authoritative Expert Hub data (join/detail table) |
| **RatingSyncLog** | Stores MTM integration and reconciliation history | Audit/technical data |

**Relationships (conceptual, not physical):** one `RatingSourceRecord` may feed multiple `RatingCalculationRun`s over time (e.g. recalculated after a rule-version change); one `RatingCalculationRun` produces one `ProgramRating` or contributes to one `ExpertOverallRating`; `RatingCalculationInput` is the many-to-many join between a run and the source records it did/didn't use, carrying the exclusion reason where applicable.

This extends `02C` §11's logical-areas table — "MTM Rating Projections or Cache Metadata" (that document's original single line item) is now these seven entities, with the classification correction that `RatingSourceRecord` is a business record, and `ProgramRating`/`ExpertOverallRating` are **authoritative**, not cached.

---

## 5. Immutability and History

| Rule |
|---|
| Raw MTM source records are never silently overwritten. |
| Corrected MTM data creates a new version or an explicit reconciliation event — never an in-place edit of the original `RatingSourceRecord` row. |
| Every recalculation is traceable (`RatingCalculationRun` + `RatingCalculationInput`, §4). |
| Historical calculated ratings remain available where required — do not physically delete a superseded `ProgramRating`/`ExpertOverallRating`; supersede it, keep the trail. |
| The current overall rating is always distinguishable from prior values (a "current" flag or highest-version lookup, not ambiguity about which row is live). |
| Calculation rules are versioned (`RatingCalculationRule`) — changing a formula never destroys historical results computed under the old rule. |
| **Manual rating edits are prohibited** unless a separate, explicitly approved correction workflow is defined (§12, `G62`) — this mirrors `02C` §2's database governance rule that production data is never hand-edited, applied specifically to rating values. |

---

## 6. Synchronization Flow

1. MTM exposes or sends rating data.
2. Expert Hub authenticates to MTM (service-to-service — `02C` §12).
3. Expert Hub retrieves rating records.
4. Expert Hub validates required identifiers.
5. Expert Hub maps: MTM expert ID → FAST trainer ID → Plan ID → Expert Hub assignment ID.
6. Expert Hub stores the normalized source record (`RatingSourceRecord`).
7. Expert Hub checks idempotency using the MTM record ID and source version.
8. Expert Hub triggers program-rating calculation.
9. Expert Hub recalculates the overall expert rating where required.
10. Expert Hub stores the calculation result and version (`RatingCalculationRun` → `ProgramRating`/`ExpertOverallRating`).
11. Expert Hub exposes the calculated values to the frontend (§8 — never the raw MTM payload).
12. Expert Hub logs failures and reconciliation issues (`RatingSyncLog`).

### Failure states

| State | Meaning |
|---|---|
| Missing trainer mapping | MTM record can't be linked to a known FAST trainer ID |
| Missing Plan ID | Program-level rating can't be linked to a plan |
| Missing assignment mapping | Can't be linked to an Expert Hub assignment record |
| Invalid rating scale | MTM scale doesn't match an expected/normalizable format |
| Duplicate source record | Same MTM record ID received again (idempotency check catches this — not itself an error, but logged) |
| Corrected source record | MTM record ID matches an existing one but with a new version/hash — triggers §5's versioning rule, not an overwrite |
| MTM unavailable | Integration call failed/timed out |
| Calculation failed | Source stored successfully, but the calculation step errored |
| Partial synchronization | Some records in a batch succeeded, others didn't |
| Reconciliation mismatch | Scheduled reconciliation (`02C` §6.1 MTM-08) finds a discrepancy between Expert Hub's stored state and MTM's |

---

## 7. Calculation Triggers

- New MTM rating received
- Existing MTM rating corrected
- Program completed (`ProgramCompleted` event, `02C` §10)
- Manual authorized recalculation (§12, `G61`)
- Calculation rule version changed
- Scheduled reconciliation
- Missing mapping resolved (e.g. a previously-unmapped trainer ID gets mapped, unblocking a queued record)

**Recommended MVP approach — background, not synchronous:** persist the source record first (step 6 above always succeeds independently of calculation success); process calculations through a background job; use the same database-backed outbox/job-queue pattern already established in `02C` §10 (no new infrastructure concept introduced for ratings specifically); expose calculation status **separately** from sync status (a record can be `Synchronized` from MTM's side while still `Calculating` on Expert Hub's side).

### Suggested statuses
`Source Received` → `Validation Pending` → `Ready for Calculation` → `Calculating` → `Calculated` | `Calculation Failed` | `Reconciliation Required`

---

## 8. Rating API Capabilities

New/updated capabilities, extending `02C` §9's API capability inventory (`CAP-API-07` is superseded by these, split into its constituent operations):

| Capability | Frontend consumer | Notes |
|---|---|---|
| Retrieve expert overall rating | `EH-TP-04`, `EH-INT-08` | Returns Expert Hub's calculated `ExpertOverallRating`, never the raw MTM value directly |
| Retrieve program ratings (list) | `EH-TP-04` (program history), `EH-INT-08` | Returns calculated `ProgramRating` records |
| Retrieve rating detail for one program | `EH-TP-03`/`EH-INT-*` (assignment/application detail context) | Includes calculation metadata (version, date) for internal users only (§9) |
| Retrieve rating history | `EH-INT-08` (trend, if approved) | Contingent on `G59` (retention policy) and whether trend display is in scope |
| Retrieve calculation metadata | `EH-INT-08` (internal only) | Rule version, calculation date, included/excluded record counts |
| Request authorized recalculation | `EH-INT-08` or an admin surface (TBD screen) | Gated by `G61` (who may trigger this) |
| Retrieve synchronization status | `EH-INT-08`, `EH-INT-16` (Integration Registry) | Distinct from calculation status per §7 |
| Retrieve data-quality/reconciliation issues | Internal only (`EH-INT-08`/`EH-INT-16`) | Never surfaced to the trainer-facing view (§9) |

**Raw MTM payloads are never exposed to the frontend** — every one of the above returns a stable Expert Hub DTO, mapped from the internal `ProgramRating`/`ExpertOverallRating`/`RatingCalculationRun` entities, per `02C` §9's three-layer contract separation.

---

## 9. Rating Display Rules

**Trainer Portal (`EH-TP-04`):** current overall expert rating; program rating within program history; last-updated date; no-data state; pending-calculation state. **Never expose internal reconciliation errors** to the trainer — a sync/reconciliation failure surfaces as "rating temporarily unavailable," not as a technical error detail.

**Internal Portal (`EH-INT-08`):** overall rating; program-level ratings; included rating count; calculation date; calculation version (where appropriate); synchronization and reconciliation status; authorized recalculation action (if `G61` approves it); data-quality warnings.

**Public Profile:** **do not display ratings until the public-rating policy is approved** — kept deferred under the existing privacy/public-profile gaps (`02_INFORMATION_ARCHITECTURE.md` §11's `G12`; tracked here as `G60`).

All eight UI states from `02C` §7 still apply (loading/available/no-rating/partial/stale/sync-failed/unauthorized/service-unavailable) — extended with the calculation-specific states from §7 above (`Calculating`, `Calculation Failed`) where the internal view needs that distinction. The DS `Metric` component is still Missing — same discipline as `02C` §7: compose from Approved primitives, don't invent a substitute.

---

## 10. Security and Audit

- MTM service-to-service authentication — same open question as `02C` §12/`G28`, not duplicated here.
- Authorization for rating retrieval — role-scoped: trainer sees own, staff per `02_INFORMATION_ARCHITECTURE.md` §7's Navigation Matrix.
- **Authorization for manual recalculation** — a new, narrower permission than general rating-read; almost certainly Admin/Manager-only, exact scope is `G61`.
- **Audit of recalculation requests** — every manual trigger writes to the Audit and Operational Logging module (`02C` §3.1), same as any other sensitive action (`NFR-07`).
- Protection of source payloads — raw MTM payload references stored, but the payload itself is treated with the same sensitivity as any external system's business data (not publicly exposed, §8).
- Sensitive-data handling — rating data isn't financial (`NFR-04`'s narrower scope) but is still personal-performance data; treat with the same access discipline as evaluations (`BR-1202`-style: never edited in-platform).
- Correlation IDs, structured logging — reuse `02C` §8's cross-cutting adapter concerns, no new mechanism.
- Retention rules — `G59`, open.
- Database encryption requirements — at rest, consistent with `02C` §12's general standard; no evidence ratings need a higher bar than other trainer data.
- **No direct manual database editing of rating values** — reinforces §5's immutability rule and `02C` §2's governance rule, stated here specifically for ratings because this is the domain most likely to tempt a "just fix this one number in SSMS" shortcut.

---

## 11. Database Governance

Confirmed, no new rule beyond `02C` §2: rating tables (§4) are created and changed exclusively through ASP.NET Core + EF Core Code First + version-controlled migrations + CI/CD deployment. SSMS is administration/support/troubleshooting/approved-inspection only. **Rating records and calculation results are not manually created or edited directly in the database during normal operations** — the one narrow exception is the same "approved emergency remediation, reconciled back into code/migrations" path `02C` §2 already defines, not a rating-specific carve-out.

---

## 12. Open Business Decisions

New gaps this document introduces (numbered continuing from `EXPERT_HUB_PRODUCT_AND_REPOSITORY_PLAN.md` §10.4's `G52`) — full classification legend (`BW`/`BF`/`BB`/`BI`/`Def`) defined there.

| # | Gap | Class |
|---|---|---|
| G53 | Final rating calculation formula (simple avg / weighted / etc.) | **BB** — module design can proceed with a pluggable rule engine; the *specific* formula cannot ship until approved |
| G54 | Weighting rules (by program type, respondent count, recency) | **BB** |
| G55 | Rating scale normalization (MTM scale → Expert Hub normalized scale) | **BB** |
| G56 | Minimum response threshold for a valid program rating | **BB** |
| G57 | Handling corrected/re-submitted MTM ratings (exact versioning/reconciliation behavior) | **BI** |
| G58 | MTM record identity & versioning contract (does MTM expose a version/hash Expert Hub can rely on for idempotency, §6 step 7?) | **BI** |
| G59 | Rating history retention policy | Def |
| G60 | Public rating policy (whether/how ratings ever appear on the public profile) | Def — overlaps existing `G12` |
| G61 | Manual recalculation permission (who, and under what audit trail) | **BF/BB** |
| G62 | Dispute/correction workflow for ratings | Def |
| G63 | Calculation precision & rounding rule | **BB** |
| G64 | Refresh frequency / reconciliation cadence for ratings specifically | **BI** — overlaps `02C` `G47` (general cache-freshness policy), narrowed to ratings |

`G41`–`G44` (MTM API contract, identifier/Plan-ID mapping) from `02C`/Plan §10.4 are **unchanged and still open** — this document doesn't resolve them, it defines what happens once they are.

---

## 13. Readiness

| Item | Can proceed? | Reasoning |
|---|---|---|
| General `03_USER_FLOWS.md` and wireframes | ✅ Yes | Unaffected by rating-calculation internals |
| **Rating screens/wireframes specifically** | ✅ Yes, with clearly labeled placeholder metrics and states | The eight (now ten, with calculation states) UI states are defined (§9); exact numbers shown are mock/placeholder until `G53`–`G56` close |
| Frontend implementation with mocked rating contracts | ✅ Yes | §8's API capabilities are stable enough to mock against |
| Backend rating module design | ✅ Yes | §4's logical entities and §6's flow are defined; implementation can proceed against a pluggable calculation-rule interface |
| **Final calculation implementation (the actual formula running in production)** | ❌ No | Blocked on `G53`–`G56`, `G63` — approving the module's *shape* is not the same as approving its *math* |
| MTM integration implementation | ❌ No | Identity resolved (`P-13` — MTM is INT-02); still blocked on `G41`/`G42` (API contract), `G28` (authentication), and `G57`/`G58` (correction/versioning contract) |

---

*Cross-references: `02C_APPLICATION_AND_INTEGRATION_ARCHITECTURE.md` §3.1 (Ratings module, corrected), §4 (ownership, corrected), §6/§7 (MTM integration/display, corrected), §9 (API boundaries), §11 (SQL Server areas, extended by this document's §4); `EXPERT_HUB_PRODUCT_AND_REPOSITORY_PLAN.md` §10.5 (gap tracker entry for `G53`–`G64`); `DECISIONS.md` `P-12`/`P-13`; `TODO.md` `Q15` (closed).*
