# Expert Hub — UAT Journey Matrix (J-01 … J-26)

*Prepared 2026-09-29 against commits `ca846fd` and `630c02e`; **revised after
Remediation Sprint 1**, which fixed DEF-01 … DEF-06 (each with a reproducing
test that failed first). Journey statuses below are the post-sprint ones.*

*Original basis — every row was verified by reading the page component,
the API handler and the authorization check — not inferred from tests and not
carried over from `24_RELEASE_READINESS.md` (2026-09-16), which this supersedes
for J-05, J-09, J-10, J-11, J-12, J-16, J-17, J-18, J-25 and J-26.*

**Status values** — `READY_FOR_UAT` · `READY_WITH_EXTERNAL_DEPENDENCY` ·
`READY_WITH_BUSINESS_DEPENDENCY` · `NOT_READY`.

All frontend routes are shown base-relative; the deployed prefix is
`EXPERT_HUB_BASE_PATH`, default `/expert-hub` (`app/router/paths.ts:16`).
All API routes are mounted `/api` → `/v1` (`Program.cs:172,186`).

---

## 1. Summary

| Status | Journeys | Count |
|---|---|---|
| `READY_FOR_UAT` | J-05, J-07, J-08, J-18, J-19, J-23 | **6** |
| `READY_WITH_EXTERNAL_DEPENDENCY` | J-01, J-06, J-14, J-16, J-20, J-21, J-22 | **7** |
| `READY_WITH_BUSINESS_DEPENDENCY` | J-03, J-09, J-10, J-11, J-12, J-13, J-15, J-17, J-24, J-26 | **10** |
| `NOT_READY` | J-02, J-04, J-25 | **3** |

**After Remediation Sprint 1**, the only NOT_READY journeys are the two that
were always descoped (J-02, J-04) and J-25, which has no delivery path and no
recipient page (DEF-11 — external + business, not an internal defect). The six
journeys blocked by internal defects — J-05, J-08, J-09, J-16, J-17, J-18 — are
open again.

| Journey | Before the sprint | After | What changed |
|---|---|---|---|
| J-05 | NOT_READY | **READY_FOR_UAT** | DEF-01 — screening reads repeated entries |
| J-08 | NOT_READY | **READY_FOR_UAT** | inherited DEF-01 |
| J-09 | NOT_READY | **READY_WITH_BUSINESS_DEPENDENCY** | DEF-05 — no formation deadlock. `DM-GAP-07` remains |
| J-16 | NOT_READY | **READY_WITH_EXTERNAL_DEPENDENCY** | DEF-02, DEF-03 — headcount > 1 and partial naming work. EXT-03 remains |
| J-17 | READY_WITH_BUSINESS_DEPENDENCY (hc 1 only) | **READY_WITH_BUSINESS_DEPENDENCY** (any headcount) | DEF-02. BD-UAT-05 remains |
| J-18 | NOT_READY | **READY_FOR_UAT** | DEF-02 |
| J-11 · J-13 · J-14 | as before | as before | DEF-06 — the activated trainer's session works immediately |

---

## 2. The matrix

### J-01 — Initial onboarding & application submission

| | |
|---|---|
| **Role** | Guest / any authenticated applicant (no platform role required, by design — `Auth/FeatureAuthorization.cs:23-30`) |
| **Entry point** | Landing CTA · Portal home · "New application" on My Applications |
| **Frontend route** | `applications/new` (public, outside `RequireAuth`) · `applications` · `applications/:applicationId` |
| **Primary APIs** | `GET /v1/applications/schema[?version=]` (anonymous) · `POST /v1/me/applications/draft/start` · `POST /v1/me/applications/draft` · `POST /v1/me/applications/draft/attachments` · `POST /v1/me/applications/submit` · `GET /v1/attachments/{id}` |
| **Persistence** | `APPLICATION`, `APPLICATION_SERVICE`, `APPLICATION_FIELD_VALUE` (incl. `entry_id`/`entry_index`), `APPLICATION_ATTACHMENT`, `ATTACHMENT`, `FORM_SCHEMA`/`FORM_SECTION`/`FORM_FIELD`/`ATTACHMENT_RULE` |
| **Authorization** | Route public; `/me/applications` is `.RequireAuthorization()` and **ownership-scoped** via `FindOwnedAsync` (`ApplicationEndpoints.cs:1154-1171`), not feature-gated |
| **Happy path** | Sign in → start/resume draft → step-per-section wizard → attachments validated server-side → submit re-validates completeness, issues `EH-YYYY-NNNNN`, raises `EV-0101` |
| **Negative paths** | One open application → `open-application` · accredited trainer → routed to J-03 · unknown attachment rule → 400 · wrong format/size/count → 422 · incomplete submit → 400 with `fieldErrors` · unknown schema version → 404 · foreign id → 404 |
| **External dep** | **EXT-01 SSO (blocking)** · EXT-07 Yaqeen (guest path only) · EXT-08 antivirus (`not-scanned`, non-blocking) |
| **Business dep** | None. `DM-GAP-01` closed — schema `dm-gap-01.2026-09-29` |
| **Tests** | `ApplicationTests` (8 methods), `RepeatableSectionTests` (6), `DocumentStoreTests` (4), `MatrixVersioningMigrationTests` (2); frontend `NewApplicationPage.test.tsx` (~32), `applicationValidation.test.ts` (~35) |
| **UAT status** | **READY_WITH_EXTERNAL_DEPENDENCY** |
| **Notes** | The **guest** path is defective — DEF-14. The signed-in path is complete and the most heavily tested journey in the product |

### J-02 — Internal nomination of a new applicant

| | |
|---|---|
| **Role** | Internal staff (intended) |
| **Entry point** | **NONE — removed** (`ApplicationInboxPage.tsx:44-47`, `P-288`) |
| **Frontend route** | None for nomination. `activate/:token` (public) survives |
| **Primary APIs** | **None.** The frontend calls five `v1/identity/*` paths; no identity endpoint group is registered in `Program.cs` — all would 404 |
| **Persistence** | Model exists but is dead: `Application.Origin`, `NominatedBy`, `ApplicationOrigins.InternalNomination`. Feature `F-0102` is seeded and granted but no route uses it |
| **Authorization** | N/A |
| **Happy path** | Does not exist |
| **External dep** | EXT-07 Yaqeen — **blocking** |
| **Business dep** | **BD-UAT-01** — how a nominee record links to an SSO identity. **Blocking**, and a security decision |
| **Tests** | Only negative assertions that the action is absent. **Zero backend tests** |
| **UAT status** | **NOT_READY** — exclude from the UAT scope sheet |

### J-03 — Add service to an approved trainer

| | |
|---|---|
| **Role** | Approved trainer (request) → internal holder of `F-0305` (decision) |
| **Frontend route** | `applications/:applicationId/add-service` · `internal/service-requests` · `internal/service-requests/:requestId` |
| **Primary APIs** | `GET /v1/me/applications/{id}/services/context` · `POST /v1/me/applications/{id}/services` · `GET /v1/internal/service-requests` · `POST /v1/internal/service-requests/{id}/decision` · `POST /v1/internal/attachments` |
| **Persistence** | `SERVICE_REQUEST`, `ADDENDUM`, `AGREEMENT_SERVICE`, `TRAINER_SERVICE`, `APPLICATION_SERVICE`, `ATTACHMENT` |
| **Authorization** | Trainer: ownership + status `Approved|Active`. Internal: `InternalPolicy` + `F-0305` |
| **Negative paths** | Non-selectable service → 400 · already approved → 409 · duplicate pending → 409 · already decided → 409 · **addendum document required → 400 `addendum-missing`** (RB-03 fix) · rejection reason required → 400 |
| **External dep** | None blocking |
| **Business dep** | **BD-UAT-02** — approval with **no active agreement** still accredits the service while writing no addendum and no `AGREEMENT_SERVICE` row (`ServiceRequestEndpoints.cs:180-214`). **Blocking** |
| **Tests** | `ApplicationTests` (2), `Cap03Tests`, `Cap04Tests`; frontend `AddServicePage.test.tsx` (9), `ServiceRequests.test.tsx` (20) |
| **UAT status** | **READY_WITH_BUSINESS_DEPENDENCY** |
| **Notes** | DEF-17 (add-service attachments are name-only) · DEF-18 (route not behind `RequireTrainer`) |

### J-04 — Speaker record management

| | |
|---|---|
| **Everything** | **Not built.** No route, no API, no persistence. `speaker` exists only as a service code, explicitly excluded from the public form (`BR-0113`) and from agreements |
| **Business dep** | The Speaker Fields matrix has never been supplied. **Blocking** |
| **UAT status** | **NOT_READY — DESCOPED** (`EXPERT-HUB-J04-SPEAKER`). Exclude from the UAT scope sheet |

### J-05 — Screening & initial decision

| | |
|---|---|
| **Role** | Internal screening decision-maker holding `F-0201` |
| **Entry point** | Application Inbox row "Open" · dashboard work queue |
| **Frontend route** | `internal/applications/:id` · inbox at `internal/applications` |
| **Primary APIs** | `GET /v1/internal/applications/{id}/screening` · `POST /v1/internal/applications/{id}/screening/decision` · inbox `GET /v1/internal/applications` (`F-0407`) |
| **Persistence** | `SCREENING_RESULT` (pins `model_id`), `APPLICATION_SERVICE.Outcome`, `APPLICATION.Status`, `INTERVIEW`+`INTERVIEW_SLOT`+`INTERVIEW_EVALUATION`, `AI_ANALYSIS`, `EVALUATION_*` |
| **Authorization** | `InternalPolicy` + `F-0201`. **No creator check and no self-decision check** — DEF-15 |
| **Negative paths** | Not found/draft → 404 · already decided → 409 · reject without listed reason → 400 · interview path missing slots or committee → 400 · exemption without approved reason → 400 · **slot in the past → 422** |
| **External dep** | AI advisory only, non-blocking |
| **Business dep** | `SLA-0202` ships `undefined-duration` so no screening countdown renders (`DM-GAP-10`). Non-blocking |
| **Tests** | `Cap02Tests` (4+), `EvaluationMatrixCalculationTests` (38), `ScreeningPlaceholderScoreTests`, `FeaturePermissionTests`; frontend `ScreeningDetailPage.test.tsx` (12), `screeningValidation.test.ts` (10) |
| **UAT status** | **READY_FOR_UAT** — DEF-01 fixed; the detail now carries per-entry groups for every repeatable section. ⚠️ DEF-15 (no self-decision guard) is MEDIUM and remains open |
| **Notes** | `DM-GAP-02` is genuinely closed. Everything else on this journey is complete and well covered |

### J-06 — Interview scheduling & confirmation

| | |
|---|---|
| **Role** | Applicant (slot choice, reschedule request) + internal holder of `F-0202` |
| **Frontend route** | `applications/:applicationId` (applicant) · `internal/applications/:id/interview` (staff) |
| **Primary APIs** | `POST /v1/me/applications/{id}/interview-slot` · `POST /v1/me/applications/{id}/interview-reschedule` · `POST /v1/internal/applications/{id}/interview/reschedule` · `GET /v1/internal/applications/{id}/interview` |
| **Persistence** | `INTERVIEW` (ticket, meeting URL, reschedule fields), `INTERVIEW_SLOT` (`IsSuperseded`), `APPLICATION.Status` |
| **Authorization** | Applicant: ownership. Staff: `InternalPolicy` + `F-0202` |
| **Negative paths** | No interview at this stage → 409 · unknown/superseded slot → 400 · second pending reschedule → 409 · reschedule on a completed interview → 409 · empty/malformed/past slot → 400 |
| **External dep** | **EXT-04 Teams — non-blocking.** RB-04 is genuinely fixed: the invite reads the J-05 interview panel, and the applicant's reschedule request is surfaced to staff |
| **Business dep** | `SLA-0201` has no defined expiry behaviour. Under **EXT-05** the applicant is never *told* slots are available (J-06/F1/AC-1 unmet) |
| **Tests** | `Cap02Tests` (3), `MeetingProviderTests` (6 — all cover the *unconfigured* provider; **no successful-booking test**) |
| **UAT status** | **READY_WITH_EXTERNAL_DEPENDENCY** |
| **Notes** | Staff cannot *decline* a reschedule request; the only response is to reschedule. Worth a UAT note |

### J-07 — Interview evaluation & post-interview decision

| | |
|---|---|
| **Role** | Assigned committee members holding `F-0203`; the J-05 decision-maker decides (`BR-0208`) |
| **Frontend route** | `internal/applications/:id/interview` |
| **Primary APIs** | `GET /v1/internal/applications/{id}/interview` · `POST …/interview/evaluations` · `POST …/interview/decision` |
| **Authorization** | `InternalPolicy` + `F-0203`, **plus** per-actor: only an assigned member may evaluate (403), only the screening decision-maker may decide (403) |
| **Negative paths** | Not an assigned member → 403 · already responded → 409 · **interview not scheduled → 409** · out-of-scale axis score → 400 · nothing passed and nothing exempted → 409 · result withheld until every member responds |
| **External dep** | None |
| **Business dep** | None — the 1–5 scale and 70% pass mark are approved and seeded; superseded models stay pinned per interview |
| **Tests** | `Cap02Tests` (5), `MatrixVersioningMigrationTests`; frontend `InterviewEvaluationPage.test.tsx` (21) |
| **UAT status** | **READY_FOR_UAT** |
| **Notes** | Reached naturally through the J-05 page, which DEF-01 blocks; direct URL still works. DEF-19 is an edge case |

### J-08 — Interview exemption

| | |
|---|---|
| **Role** | The J-05 screening decision-maker (`F-0201`) |
| **Frontend route** | `internal/applications/:id` — no screen of its own |
| **Primary APIs** | `POST /v1/internal/applications/{id}/screening/decision` with `services[].path == "exemption"` |
| **Negative paths** | Reason missing / not in the approved list / `other` without free text → 400. The approved 3-reason list agrees across journey doc, backend and frontend |
| **Business dep** | None — matrix approved and implemented |
| **Tests** | `Cap02Tests` (2), `Cap03Tests`; frontend `screeningValidation.test.ts` (3), `ScreeningDetailPage.test.tsx` |
| **UAT status** | **READY_FOR_UAT** — DEF-01 fixed |
| **Notes** | F2/AC-3 verified: an exempted interview reads as "passed" to the applicant and the exemption is never disclosed |

### J-09 — Approval committee decision

| | |
|---|---|
| **Role** | Application creator forms; committee members hold `F-0204` (**Manager only** in the default matrix) |
| **Frontend route** | `internal/applications/:id/committee` |
| **Primary APIs** | `GET /v1/internal/applications/{id}/committee` · `POST …/formation` · `POST …/decisions` · `POST …/resubmit` |
| **Persistence** | `COMMITTEE_SEQUENCE`, `COMMITTEE_STEP`, `COMMITTEE_TEMPLATE`, `ACCREDITATION_DECISION`, `BANK_DATA` |
| **Authorization** | `InternalPolicy` + `F-0204` on the whole group; creator-only formation and resubmit; turn check |
| **Negative paths** | Already formed → 409 · non-creator → 403 · empty/all-optional/duplicate/unknown member → 400 · not your turn → 403 · missing rejection reason → 400. Mandatory rejection halts; optional is logged |
| **External dep** | None. ⚠️ **No notification event exists for any committee outcome or for the bank-data request** — the applicant discovers it by opening their own page |
| **Business dep** | Unapproved access matrix (`DM-GAP-07`) · `BR-0403` classification rules missing · bank-data permanence open |
| **Tests** | `Cap02Tests` (6); frontend `CommitteeDecisionPage.test.tsx` (18), `committeeValidation.test.ts` (17) |
| **UAT status** | **READY_WITH_BUSINESS_DEPENDENCY** — DEF-05 fixed: the pool offers only `F-0204` holders and formation re-checks it. `DM-GAP-07` (unapproved matrix) and `BR-0403` remain |

### J-10 — Agreement preparation & internal approval

| | |
|---|---|
| **Role** | Creator prepares and forms; internal reviewers/signers hold `F-0301` |
| **Frontend route** | `internal/applications/:id/agreement` |
| **Primary APIs** | `GET /v1/internal/applications/{id}/agreement` · `GET …/document` · `POST …/preparation` · `POST …/signing-sequence` · `POST …/decisions` · `POST …/resubmit` |
| **Persistence** | `AGREEMENT`, `AGREEMENT_SERVICE`, `AGREEMENT_TEMPLATE`, `SIGNING_SEQUENCE`, `SIGNATORY`, `E_SIGNATURE`, `AGREEMENT_DOCUMENT_VERSION`, `AGREEMENT_EVENT` |
| **Authorization** | `InternalPolicy` + `F-0301`; creator-only preparation and formation; turn check; **403 "Not a designated signer"**; **400 `signature-required`** — a designated signer may not merely approve |
| **External dep** | **EXT-06 e-signature absent** — acceptance is `internal-acceptance`, labelled as such, no PDF fabricated. Non-blocking for UAT |
| **Business dep** | **BD-UAT-03** and **BD-UAT-07** |
| **Tests** | `Cap03Tests` (5); frontend `AgreementPreparationPage.test.tsx` (15), `Agreements.contract.test.tsx` (5), `agreementValidation.test.ts` (18) |
| **UAT status** | **READY_WITH_BUSINESS_DEPENDENCY** (DEF-05 also applies to signatory selection) |
| **Notes** | **RB-05 verified resolved**: every internal reader gets the frozen document; re-preparation **voids** and keeps signatures (nothing anywhere removes a sequence, signatory or signature); the creator may correct during a modification request. SHA-256 over template version + body + fields + merged data, append-only and idempotent |

### J-11 — Applicant signing & activation

| | |
|---|---|
| **Role** | The applicant (ownership, no feature gate) |
| **Frontend route** | `applications/:applicationId` |
| **Primary APIs** | `POST /v1/me/applications/{id}/agreement-decision` · `POST /v1/me/profile/bank-data` |
| **Happy path** | Applicant reads the complete frozen document → signs with a typed name → version + method recorded → `Active`, term starts **at the signature timestamp** → trainer profile + trainer role created → application `Active` |
| **Negative paths** | No agreement awaiting decision → 409 · signature missing → 400 · note missing on modification → 400. Reject → permanently closed. Modification → back to formation, active chain **voided and kept** |
| **External dep** | EXT-06 — non-blocking |
| **Business dep** | **BD-UAT-03**, **BD-UAT-07**, **BD-UAT-04** (which date starts the term — today it is the signature timestamp) |
| **Tests** | `Cap03Tests` (3), `Cap04Tests`; frontend `Agreements.contract.test.tsx` (2) |
| **UAT status** | **READY_WITH_BUSINESS_DEPENDENCY** |
| **Notes** | DEF-06 fixed — signing re-issues the session with the trainer role, so the trainer areas work immediately. BD-UAT-03/04/07 remain |

### J-12 — Agreement lifecycle management

| | |
|---|---|
| **Role** | List/detail `F-0302`; renew `F-0303`; suspend/reactivate/end `F-0304` (Manager only); template save = System Administrator |
| **Frontend route** | `internal/agreements` · `internal/agreements/template` · `internal/agreements/:agreementId` |
| **Primary APIs** | `GET /v1/internal/agreements` · `GET /{id}` · `POST /{id}/lifecycle` · `GET|POST /template` |
| **Negative paths** | Non-lifecycle agreement → 404 · missing feature → 403 · action not allowed in this state → 409 (closed state machine; `ended` → no actions) · non-admin template save → 403 |
| **External dep** | EXT-05 email for the 90/30/5-day alerts. **The sweeper exists and is registered** (`AgreementExpiryReminders.cs`, `Program.cs:66`) — the "seeded and never raised" note in `24_RELEASE_READINESS.md` is **stale**. Occurrences are recorded; delivery is blocked |
| **Business dep** | BD-UAT-04, BD-UAT-06 |
| **Tests** | `Cap03Tests` (2); frontend `AgreementLifecycle.test.tsx` (19) |
| **UAT status** | **READY_WITH_BUSINESS_DEPENDENCY** |
| **Notes** | ⚠️ `GET /template` carries **no** feature gate — any internal session reads the legal text. DEF-20 (demo provider encodes the wrong renewal term) |

### J-13 — Trainer profile creation

| | |
|---|---|
| **Role** | The applicant, by signing. **No screen and no route** — a server-side consequence of J-11 |
| **Persistence** | `TRAINER_PROFILE`, `TRAINER_SERVICE`, `TRAINER_FIELD_VALUE`, `USER_ROLE`, `AUDIT_LOG` |
| **Happy path** | Profile created `active`, consent `false` → trainer role granted with an audit entry → **every** application field value copied including `EntryId`/`EntryIndex`, so all qualifications survive → accepted services become `TRAINER_SERVICE` rows |
| **Negative paths** | Idempotent on re-entry; role grant skipped if already held |
| **Business dep** | `BR-0403` classification rules missing — every `TRAINER_SERVICE.Classification` is null |
| **Tests** | `Cap04Tests` (5, incl. the three-qualification check), `TrainerFileStatusTests` (6) |
| **UAT status** | **READY_WITH_BUSINESS_DEPENDENCY** |
| **Notes** | `file_status` is derived at read time from the governing agreement (`D-24` resolved). Degraded by DEF-06 |

### J-14 — Trainer self-service profile update

| | |
|---|---|
| **Role** | Trainer, own record only |
| **Frontend route** | `profile` (behind `RequireTrainer`) |
| **Primary APIs** | `GET /v1/me/profile` · `POST /fields` · `POST /change-request` · `POST /visibility` · `POST /certificates` · `POST /certificates/remove` · `POST /v1/me/profile/bank-data` |
| **Authorization** | **Ownership, not features** (deliberate). Per-field editability decided server-side from the schema's `ownership` marker and **re-checked on write** |
| **Negative paths** | Non-editable field id → **403, named** · field not FAST-owned → 400 · change already pending → 409 · non-multipart → 415 · bank data IBAN/SWIFT/account validation → 400 with `invalidFields` |
| **External dep** | FAST write API for `request-change` fields — `DEGRADED`. **Non-blocking**: the request stays queued and the UI says so |
| **Business dep** | Whether FAST will ever accept a write (`Q30`) |
| **Tests** | `Cap04Tests` (4); frontend `MyProfilePage.test.tsx` (31, incl. the three-qualification case), `bankDataValidation.test.ts` (5) |
| **UAT status** | **READY_WITH_EXTERNAL_DEPENDENCY** |
| **Notes** | **DEF-13** — self-service can edit only entry 0; entries 2..n are read-only with no add or remove |

### J-15 — Trainer search & unified profile (incl. Identity Card)

| | |
|---|---|
| **Role** | Internal staff holding `F-0410` (search) and `F-0402` (profile) |
| **Frontend route** | `internal/trainers` · `internal/trainers/:trainerId` |
| **Primary APIs** | `GET /v1/internal/trainers` (`F-0410`) · `GET /v1/internal/trainers/{trainerId}` (`F-0402`) |
| **Negative paths** | Filters with no data behind them are **refused with a named code** rather than silently matching nobody: `min-years-experience-unavailable`, `specialty-filter-unavailable`, `domain-filter-unavailable`, `min-evaluation-unavailable` |
| **External dep** | MTM ratings (`DM-GAP-14`) — non-blocking, the page says "never synced" |
| **Business dep** | `Q16`/`G12` — no specialty/domain taxonomy, so `Specialties()` returns `[]` · `BR-0403` |
| **Tests** | `Cap04Tests` (3); frontend `TrainerSearch.test.tsx` (23) |
| **UAT status** | **READY_WITH_BUSINESS_DEPENDENCY** |
| **Identity Card** | **Implemented and correct**: rank doctorate 4 > master 3 > bachelor 2 > diploma 1, unknown → 0 so it can never win by accident; ties broken by most recent date; rendered as the Arabic option label. **But untested with more than one qualification** — DEF-21 |
| **Notes** | **DEF-12** — the detailed profile shows only the highest qualification too, though the code comment says the full list stays there. DEF-22 (list and detail can disagree about file status) |

### J-16 — Assignment request creation

| | |
|---|---|
| **Role** | Centre coordinator (`F-0501`, granted to that role alone) |
| **Frontend route** | `internal/assignments/new` |
| **Primary APIs** | `POST /v1/internal/assignment-requests/` · `GET …/lookups/centres` · `…/lookups/nominees?service=` · `POST /v1/internal/attachments` |
| **Persistence** | `ASSIGNMENT_REQUEST` (+ `FormValues`), `ASSIGNMENT_SLOT` × headcount, `CANDIDATE_POOL`/`POOL_MEMBER` when nominees are named |
| **Authorization** | `InternalPolicy` + `F-0501`. **No centre scope is enforced** (per `P-276`, centres are an operational list, not access scope) |
| **Negative paths** | Unknown/inactive centre → 400 · unknown request type → 400 · `dateTo < dateFrom` → 400 · brochure missing/unknown → 400 · headcount < 1 → 400 · **duplicate nominee → 400** · **nominees > headcount → 400** · **per-expert eligibility, each checked separately, whole request refused on first failure → 400** |
| **External dep** | EXT-03 FAST Programme/Plan — non-blocking, fields typed by hand |
| **Business dep** | None outstanding. **RB-07 verified resolved** — the five approved centres are seeded via `M31` |
| **Tests** | `Cap05Tests` (6); frontend `Assignments.test.tsx` (8 named-expert cases). **No backend test ever sets `requiredHeadcount > 1`** |
| **UAT status** | **READY_WITH_EXTERNAL_DEPENDENCY** — DEF-02 and DEF-03 fixed: headcount > 1 offers distinct people, and naming fewer than the headcount leaves the rest to matching. EXT-03 (Programme/Plan) remains manual |

### J-17 — Matching & nomination

| | |
|---|---|
| **Role** | `F-0502`/`F-0503` → Staff, Manager; `F-0504` (approve) → Manager, Centre coordinator |
| **Frontend route** | `internal/assignments/:requestId` |
| **Primary APIs** | `GET …/{requestId}/matching` · `POST …/matching/run` · `GET …/matching/candidates?q=` · `POST …/pool` · `POST …/pool/decision` |
| **Negative paths** | Pool size ≠ 3 × headcount → 400 with `requiredPoolSize`/`received` · excluded trainer in a manual pool → 400 · already-decided pool → 409 · `preferenceOrder` not exactly the approved set → 400 · nothing approved while candidates remain → 400 |
| **External dep** | None blocking. Prices served `null` by design (`DM-GAP-16`) |
| **Business dep** | **BD-UAT-05** — nominate/approve segregation is not enforced; a Manager holds both. Plus: automatic new pool vs staff re-run |
| **Tests** | `Cap05Tests` (3); frontend `Matching.test.tsx` (17) + contract fixture verified against the live response |
| **UAT status** | **READY_WITH_BUSINESS_DEPENDENCY** at any headcount — DEF-02 fixed. BD-UAT-05 (segregation) remains |
| **Notes** | **DEF-16** — the coordinator who raised the request cannot load the slot-tracking panel (needs `F-0505`, which that role does not hold) |

### J-18 — Assignment offer handling & response

| | |
|---|---|
| **Role** | Trainer (respond, ownership-guarded); Staff/Manager (track, `F-0505`) |
| **Frontend route** | `engagements` (behind `RequireTrainer`) |
| **Primary APIs** | `GET /v1/me/assignment-offers` · `POST /v1/me/assignment-offers/{offerId}/response` · `GET /v1/me/engagements` · `GET /v1/internal/assignment-requests/{requestId}/slots` |
| **Negative paths** | Someone else's offer → 404 · already answered → 409 · unknown verb → 400 · **answering after the window closed → the server expires it and returns 409** · concurrent claim → 409 |
| **Expiry** | **Worker exists and is registered** (`OfferExpiryWorker.cs`, `Program.cs:64`); idle without a connection string; **concurrency-safe** via a conditional `ExecuteUpdateAsync` claim |
| **External dep** | EXT-05 — non-blocking: expiry is state, not delivery |
| **Business dep** | None |
| **Tests** | `Cap05Tests` (3); frontend `Engagements.test.tsx` (21) + **`Engagements.contract.test.tsx`** against fixtures generated from live API responses. **RB-08 verified resolved** |
| **UAT status** | **READY_FOR_UAT** — DEF-02 fixed |

### J-19 — Re-routing after offer rejection

| | |
|---|---|
| **Role** | Staff/Manager (`F-0502`, `F-0503`); Centre coordinator approves (`F-0504`) |
| **Frontend route** | `internal/assignments/:requestId/slots/:slotNumber` |
| **Primary APIs** | `GET …/slots/{n}/cycle` · `POST …/slots/{n}/matching/run` · `POST …/slots/{n}/pool` · `POST …/slots/{n}/pool/decision` |
| **Persistence** | `SLOT_CYCLE` (unique `(SlotId, CycleNumber)`), slot-scoped pools |
| **Negative paths** | Unknown slot → 404 · re-routing a slot that is not exhausted → 409 · pool size ≠ 3 · exclusions still applied on the manual path |
| **Business dep** | Open, non-blocking: automatic new pool vs staff re-run |
| **Tests** | `Cap05Tests` (3); frontend `ReRouting.test.tsx` (15) + **`ReRouting.contract.test.tsx`** (9). **RB-09 verified resolved** — cycles persist, repeat without limit, and an earlier refuser may be re-included |
| **UAT status** | **READY_FOR_UAT** |

### J-20 — Training material submission & approval

| | |
|---|---|
| **Role** | Trainer (upload, ownership); Staff/Manager (`F-0506`) |
| **Frontend route** | `submissions` (trainer) · `internal/submissions` · `internal/submissions/:submissionId` |
| **Primary APIs** | `GET /v1/me/submissions` · `POST /v1/me/submissions/{id}/upload` · `GET /v1/internal/submissions` · `POST /v1/internal/submissions/{id}/decision` |
| **Negative paths** | Not yours → 404 · wrong status → 409 · missing file name → 400 · decision with nothing pending → 409 · `changes-requested` without a note → 400 · any third decision → 400 |
| **External dep** | **EXT-08 + no document store for this path**: uploads are **file names only**, no bytes kept — DEF-11. Reviewers cannot open the file |
| **Business dep** | No approved format/size rule for material files; no approval deadline |
| **Tests** | `Cap05Tests`; frontend `Submissions.test.tsx` (16) + **`Submissions.contract.test.tsx`** (10). **RB-10 verified resolved** |
| **UAT status** | **READY_WITH_EXTERNAL_DEPENDENCY** for the training-material path; the **service-content path cannot occur at all** in live mode — DEF-23 |

### J-21 — Engagement execution follow-up

| | |
|---|---|
| **Role** | Trainer (own engagement). `F-0507` is seeded but **attached to no route** — there is no internal J-21 surface |
| **Frontend route** | `engagements/:engagementId` (behind `RequireTrainer`) |
| **Primary APIs** | `GET /v1/me/engagements/{engagementId}` |
| **Negative paths** | Not yours / unknown → 404. Missing FAST data is **named, never zeroed**: `enrolment {available:false, reason:"Q20"}`, `evaluations {…reason:"Q29"}` |
| **External dep** | FAST `PlanTaker` (Q20) and MTM (Q29) — surfaced as explicit "unavailable, reason X". Non-blocking |
| **Business dep** | Q20/Q29 data sources |
| **Tests** | `Cap05Tests`; frontend `Execution.test.tsx` (14) + **`Execution.contract.test.tsx`** (5). **RB-11 verified resolved** |
| **UAT status** | **READY_WITH_EXTERNAL_DEPENDENCY** |
| **Notes** | `ScheduleChangedAt` is served but **never written by any code**, so J-21/F1/AC-3 cannot fire in UAT |

### J-22 — Withdrawal / cancellation

| | |
|---|---|
| **Role** | Trainer (withdraw, ownership); `F-0508` de-link → Staff, Manager **and (anomalously) Trainer** — DEF-24 |
| **Frontend route** | `engagements/:engagementId` (trainer) · de-link is a panel on `internal/assignments/:requestId` |
| **Primary APIs** | `POST /v1/me/engagements/{id}/withdrawal` · `POST /v1/internal/engagements/{id}/delink` |
| **Negative paths — all server-side** | Already ended → 409 · **lifecycle guard: anything but `upcoming` → 409** · **date guard `D-10`: 4 days trainer / 24 h staff → 409 with the deadline** · reason outside the actor's closed list → 400 · `other` without a note → 400 |
| **External dep** | J-22/F3 (cancellation originating in FAST) is **not implemented** — `Cancelled` is read but never written; there is no inbound FAST plan feed |
| **Business dep** | None |
| **Tests** | `Cap05Tests` (3); frontend `Withdrawal.test.tsx` (20) + `Withdrawal.contract.test.tsx` (3). **RB-12 verified resolved** — de-link records `withdrawn`, distinguished by `Actor = "staff"` |
| **UAT status** | **READY_WITH_EXTERNAL_DEPENDENCY** (F1 + F2 are READY_FOR_UAT; F3 cannot be exercised) |

### J-23 — Public visibility consent

| | |
|---|---|
| **Role** | Trainer with a `TRAINER_PROFILE` row. **Ownership-gated, not feature-gated** |
| **Frontend route** | `profile` → tab `visibility` |
| **Primary APIs** | `POST /v1/me/profile/visibility` |
| **Persistence** | `TRAINER_PROFILE.visibility_consent` + `visibility_consent_decided_at` (`M19`) |
| **Authorization** | The profile is resolved from the session — no id is accepted, so cross-trainer writes are structurally impossible |
| **Negative paths** | No trainer file → 404 · unauthenticated → 401 · cancel in the dialog → no call |
| **Business dep** | None — `D-44` implemented |
| **Tests** | `Cap04Tests` (2); frontend `MyProfilePage.test.tsx` |
| **UAT status** | **READY_FOR_UAT** |
| **Notes** | Feature `F-1003` is seeded and granted but enforced nowhere — harmless, since ownership is the stronger rule |

### J-24 — Public trainer directory

| | |
|---|---|
| **Role** | **Anonymous** |
| **Frontend route** | `directory` · `directory/:trainerId` — both outside `RequireAuth` |
| **Primary APIs** | `GET /v1/directory?page=&pageSize=&search=&specialty=` · `GET /v1/directory/{id}` |
| **Authorization** | Deliberately anonymous. Protection is the projection plus two gates |
| **Suspended/expired** | **CONFIRMED HIDDEN — not consent alone.** `ListableAsync` keeps only `Active` or `Idle`; applied to the list, the single profile **and** the stat tiles, so counts cannot leak hidden trainers. `Idle` stays listed by design (J-13/AC-9) |
| **Negative paths** | Non-consented / non-listable / unknown → **404, never 403** · non-GUID → 404 · `specialty=` → **400 `specialty-filter-unavailable`** · page/pageSize clamped |
| **Business dep** | **Q16/G12** — no taxonomy, so every card's specialties list is empty and `specialtiesRepresented` is always 0 — DEF-25 |
| **Tests** | `Cap04Tests` (2, incl. a suspended trainer), `TrainerFileStatusTests` (6); frontend `TrainerDirectoryPage.test.tsx` (9), `PublicTrainerProfilePage.test.tsx` (5). **Gap: no end-to-end test for an EXPIRED file** |
| **UAT status** | **READY_WITH_BUSINESS_DEPENDENCY** |

### J-25 — Operational notifications

| | |
|---|---|
| **Role** | System administrator (matrix/templates/SLA) · internal holder of `F-0705` (log) · any authenticated user (own inbox) |
| **Frontend route** | `internal/notifications/matrix` · `/templates` · `/log` · `internal/sla`. **No route exists for a recipient inbox** |
| **Primary APIs** | `GET /v1/me/notifications` · `GET /v1/internal/notifications/occurrences` · matrix/templates/log/SLA administration |
| **Occurrence recording** | **CONFIRMED CORRECT.** The occurrence is written **before** routing is consulted, status `Unrouted`; unrouted, paused or draft-template → `(Routed:false, RecipientCount:0)` with the occurrence kept. Idempotent reminders via `DedupeKey` |
| **No recipient invented** | **CONFIRMED.** Only `record_subject` / `acting_staff` from the raise context (and only if supplied) plus role audiences from `USER_ROLE`; empty set → `[]`; final query requires `IsActive` |
| **Application vs delivery** | **Application behaviour works** — an in-platform `NOTIFICATION_LOG` row is written per recipient in their own language and is readable at `/v1/me/notifications`. **External delivery does not exist** — the only `IEmailGateway` is `NullEmailGateway`, and **no configuration key can turn email on**; it needs code |
| **Business dep** | **BD-UAT-06** / `DM-GAP-08` — no routing seeded, `modelStatus` hard-coded `"unapproved"`, so **every raise is unrouted out of the box**. Also `Q17`/`Q33` — J-25 has no business document at all |
| **Tests** | `NotificationTests` (9), `NotificationFoundationTests` (2), `IntegrationHubTests` (5), `Cap09Tests`; frontend `Notifications.test.tsx` (30) |
| **UAT status** | **NOT_READY** — DEF-11: no gateway, no approved routing, and no recipient-inbox page, so a tester cannot observe a notification arriving anywhere |

### J-26 — Roles, permissions & delegation

| | |
|---|---|
| **Role** | System administrator (`F-0801` matrix, `F-0802` users); Manager/Executive (`F-0805` audit) |
| **Frontend route** | `internal/access/permissions` · `internal/access/users` |
| **Primary APIs** | `GET /v1/internal/access/matrix` · `POST …/matrix/grants` · `GET …/users` · `POST …/users/{userId}/roles` · `POST …/users/{userId}/roles/{role}/revoke` · `GET …/audit` |
| **Authorization** | `InternalPolicy` → per-route feature filter. The **only** path person→permission is `USER_ROLE → ROLE_PERMISSION → PERMISSION`; there is no user→permission table (`BR-0801`). Every mutation writes its audit row in the **same** `SaveChanges` |
| **Negative paths** | Unknown role/permission/scope → 400/404 · duplicate role → 400 · `centre_coordinator` without `scopeRef` → 400 · any other role **with** a `scopeRef` → 400 · **revoking the last system administrator → 409** · no role-create/delete endpoint exists |
| **Delegation** | **NOT IMPLEMENTED AND NOT SPECIFIED.** J-26 has no business document |
| **Business dep** | **DM-GAP-07** — the matrix is served `ModelStatus: "unapproved"`; the seeded grants are an explicitly provisional draft. No feature code assigned for `/internal/centres`, the agreement-template read, integration status or reference data |
| **Tests** | `AccessEndpointsTests` (13), `FeaturePermissionTests` (5), `FastTrainerGrantTests` (8), `PersistenceFoundationTests` (3); frontend `Access.test.tsx` (30). **Gap: the last-system-administrator 409 guard has zero tests** |
| **UAT status** | **READY_WITH_BUSINESS_DEPENDENCY** for roles + permissions; delegation **NOT_READY** (does not exist) |
| **Notes** | **DEF-26** — the internal nav offers the access and notification pages to every internal session, but the API 403s for anyone but a system administrator |

---

## 3. Business dependency matrix

*Separate from external integrations (`UAT_EXTERNAL_DEPENDENCIES.md`). Verified
in code on 2026-09-29 — not assumed from the 2026-09-17 register.*

| ID | Item | Journey(s) | Current state in code | Blocks UAT? | Owner |
|---|---|---|---|---|---|
| BD-UAT-01 | Nominee → SSO identity linking | J-02 | Nominate action removed everywhere; no identity backend exists | **YES** (J-02 only) | Business + InfoSec |
| BD-UAT-02 | Approve a service request with no active agreement | J-03 | Approval proceeds and accredits the service while writing **no** addendum and **no** `AGREEMENT_SERVICE` row | YES for that path | Business (Accreditation) + Legal |
| BD-UAT-03 | Is internal acceptance legally sufficient? | J-10, J-11, J-12 | `internal-acceptance` recorded against the frozen version + SHA-256; never called certified | No (UAT) · **YES** (production) | Legal |
| BD-UAT-04 | Which date starts an agreement's term | J-11, J-12 | Signature timestamp, not the entered start date | No — testers must be told | Legal + Business |
| BD-UAT-05 | Nominate/approve segregation | J-17 | Not enforced; a Manager holds both `F-0503` and `F-0504` | No · **YES** (production governance) | Business + Internal Audit |
| BD-UAT-06 | Who receives each event, on which channel | J-25 + every notifying journey | No matrix row seeded; `modelStatus` hard-coded `"unapproved"`; every raise is unrouted | **YES** if UAT must verify a person is notified | Business (Operations) |
| BD-UAT-07 | The approved legal text | J-10, J-11 | Served, frozen, hashed — but not legally approved | No (mark UAT agreements as test data) | Legal |
| **BD-NEW-01** | `EXPERT-HUB-DOMAIN-MASTER-CLEANUP` | J-01, J-05 | Backlog raised 2026-09-28. **Not started**, as instructed | No | Data owner |
| **BD-NEW-02** | 13 `MASTER_DATA_REVIEW_REQUIRED` domain values | J-01, J-05 | Omitted from the current dropdown (134 offered); report UNRESOLVED if scored; all 147 kept in every earlier schema version | No — behaviour is defined and safe | Data owner |
| **BD-NEW-03** | 3 duplicate domain pairs | J-01, J-05 | Both sides RELATED, so scoring is unaffected; flagged only | No | Data owner |
| **BD-NEW-04** | `spec-025` — a footnote row in the specialization list | J-05 | Unclassified → reported UNRESOLVED, never scored | No — behaviour is defined and safe | Data owner |
| **BD-NEW-05** | `DM-GAP-07` — the role × permission matrix is unapproved | J-09, J-10, J-26, all internal | Served `ModelStatus: "unapproved"`; seeded grants are a self-described draft | **YES** — DEF-05 is a direct consequence | Business |
| **BD-NEW-06** | `Q16`/`G12` — no specialty/domain taxonomy | J-15, J-24 | `Specialties()` returns `[]`; facets and stats are permanently empty | No — cosmetic, but visible | Business |
| **BD-NEW-07** | `BR-0403` — per-service classification rules | J-09, J-13, J-15, J-17 | Every `Classification` is null / placeholder tier | No | Business |
| **BD-NEW-08** | `DM-GAP-10` — screening SLA duration | J-05 | `SLA-0202` ships `undefined-duration`, so no countdown renders | No | Business |
| **BD-NEW-09** | Material file format/size rule + approval deadline | J-20 | No rule; files are names only | No | Business |
| **BD-NEW-10** | J-25 has **no business document at all** (`Q17`/`Q33`) | J-25 | No template wording seeded | **YES** for J-25 | Business |

⚠️ **`25_UAT_BUSINESS_DECISIONS.md` is now stale in one row.** Its "Related open
items" table still says *"Screening weights, threshold, filters —
`PENDING_APPROVED_SCREENING_MATRIX` … scores are placeholder values, so don't
judge them."* `DM-GAP-02` closed on 2026-09-21 (`P-293`) and the marker appears
in **no code file**. `27_UAT_TEST_MATRIX.md` carries the same stale note on J-05.
UAT testers **should** judge the scores now.

---

## 4. Defect register

Full detail, evidence and recommended corrections are in the UAT Readiness
Report. Nothing here was fixed — this audit changed no source file.

| ID | Journey | Sev | One line | Status |
|---|---|---|---|---|
| **DEF-01** | J-05, J-08 | **HIGH** | Screening detail 500s for any applicant with two entries in a repeatable section | **FIXED · VERIFIED** — `Cap02Tests.Screening_reads_an_application_that_carries_several_qualifications` |
| **DEF-02** | J-16, J-17, J-18 | **HIGH** | Headcount > 1 sends the same trainer a simultaneous offer on every slot | **FIXED · VERIFIED** — `Cap05Tests.Two_slots_of_one_request_never_offer_the_same_person_at_once` · `A_refused_offer_frees_the_person_to_be_offered_another_slot` |
| **DEF-03** | J-16 | **HIGH** | Partial named nomination never reaches J-17, and the J-17 pool deletes the named approvals | **FIXED · VERIFIED** — `Cap05Tests.Naming_one_expert_of_three_leaves_two_slots_for_matching` · `Naming_every_expert_leaves_nothing_for_matching` |
| **DEF-04** | J-05, J-09, J-10, J-17 | **HIGH** | `IsEmployee` is never refreshed after user creation → staff cannot open attachments and every committee/panel/signer picker is empty | **FIXED · VERIFIED** — `EmployeeReconciliationTests` (7 tests) |
| **DEF-05** | J-09, J-10 | **HIGH** | A committee member or signatory without the required feature deadlocks the sequence permanently | **FIXED · VERIFIED** — `ApproverEligibilityTests` (4 tests) |
| **DEF-06** | J-11 → J-13, J-14 | **HIGH** | A newly activated trainer cannot reach their own file until they sign out and back in | **FIXED · VERIFIED** — `Cap03Tests.Signing_the_agreement_makes_the_trainer_role_usable_in_the_same_session` |
| **cross** | J-01/05/09 | — | The combination the old suite never made | **VERIFIED** — `Cap02Tests.Two_qualifications_a_reconciled_reader_and_an_eligible_committee` |
| **DEF-07** | deployment | MED | `Cors:AllowedOrigins` has no compose or env wiring |
| **DEF-08** | all | MED | `apiClient` never sends `credentials` |
| **DEF-09** | deployment | MED | The deploy scripts forward only 4 runtime keys |
| **DEF-10** | deployment | MED | `env/uat.env` is incomplete and ships `REPLACE-WITH-UAT-HOST` placeholders |
| **DEF-11** | J-25 | **HIGH** | No delivery path and no recipient-inbox page |
| **DEF-12** | J-15 | MED | The detailed profile shows only the highest qualification |
| **DEF-13** | J-14 | MED | Self-service cannot edit, add or remove any qualification beyond the first |
| **DEF-14** | J-01 | **HIGH** | The guest application path is non-functional against a live API |
| **DEF-15** | J-05 | MED | No self-decision guard — a staff member can screen their own application |
| **DEF-16** | J-17 | MED | The coordinator who raised the request cannot load the slot-tracking panel |
| **DEF-17** | J-03 | MED | Add-service supporting documents are name-only and the delta is unvalidated |
| **DEF-18** | J-03 | LOW | Trainer-only page reachable by any authenticated session |
| **DEF-19** | J-07 | LOW | An all-absent committee leaves rejection as the only outcome |
| **DEF-20** | J-12 | MED | The demo provider encodes a renewal term that contradicts the API |
| **DEF-21** | J-15 | LOW | The highest-qualification rule has no test with more than one qualification |
| **DEF-22** | J-15 | MED | The trainer list and detail can disagree about file status |
| **DEF-23** | J-20 | MED | The service-content path cannot occur in live mode |
| **DEF-24** | J-22 | LOW | The Trainer role is seeded with internal CAP-05 features |
| **DEF-25** | J-24 | MED | The public directory advertises an always-empty specialty facet |
| **DEF-26** | J-25, J-26 | MED | Internal nav offers pages the API will 403 |
| **DEF-27** | J-24 | LOW | Public profile hides fields the API deliberately publishes |
| **DEF-28** | J-12 | MED | A refused agreement-template save is silent |
| **DEF-29** | all | LOW | No language control exists — English is unreachable |
| **DEF-30** | docs | LOW | `25_` and `27_` still call the screening matrix pending |

---

Related: [`UAT_ACCEPTANCE_PLAN.md`](UAT_ACCEPTANCE_PLAN.md) ·
[`UAT_EXTERNAL_DEPENDENCIES.md`](UAT_EXTERNAL_DEPENDENCIES.md) ·
[`UAT_TRACEABILITY_MATRIX.md`](UAT_TRACEABILITY_MATRIX.md) ·
[`24_RELEASE_READINESS.md`](../specification/24_RELEASE_READINESS.md) (superseded in part) ·
[`25_UAT_BUSINESS_DECISIONS.md`](../specification/25_UAT_BUSINESS_DECISIONS.md)
