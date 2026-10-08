# 24 — Release Readiness Review (J-01 … J-26)

*2026-09-16. A static end-to-end review of every journey: UI action → service →
API route → persistence → state change → hand-off → tests. The main findings
behind each blocker were re-checked in code before being recorded. Supersedes the
✅ marks in `11_JOURNEY_IMPLEMENTATION_MAP.md` and `12_JOURNEY_CONFORMANCE_AUDIT.md`,
which are stale for J-02, J-03, J-06, J-10, J-11 and J-18 … J-22.*

**Blocker rule.** A blocker is one of these:

- a core journey can't complete;
- authentication is unsafe;
- data can be corrupted or lost;
- governance can be bypassed;
- a mandatory integration makes the journey impossible;
- an approved requirement is fundamentally missing.

A pending lookup list, an inactive FAST sync with a safe fallback, wording or an
optional feature is **not** a blocker.

**The pattern behind most blockers.** Deployments run `EXPERT_HUB_DATA_MODE=api`,
so every module uses its real HTTP provider. All frontend tests run against mock
providers, and no test sends a real API payload through a page. Several pages
(J-18 … J-22) were built against mock shapes the API doesn't send, and they fail
at runtime. A contract test per feature would have caught each one.

## Journey status

| Journey | Status | Blocker |
|---|---|---|
| J-01 Onboarding & application submission | READY_WITH_EXTERNAL_DEPENDENCY | NO |
| J-02 Internal nomination | NOT_IMPLEMENTED | **YES** (RB-02) |
| J-03 Add service to approved trainer | PARTIALLY_IMPLEMENTED | **YES** (RB-03) |
| J-04 Speaker record | NOT_IMPLEMENTED (descoped, `EXPERT-HUB-J04-SPEAKER`) | NO |
| J-05 Screening & initial decision | READY_WITH_BUSINESS_DECISION_PENDING | NO |
| J-06 Interview scheduling | PARTIALLY_IMPLEMENTED | **YES** (RB-04) |
| J-07 Interview evaluation & decision | READY_WITH_BUSINESS_DECISION_PENDING | NO |
| J-08 Interview exemption | READY | NO |
| J-09 Approval committee | READY_WITH_BUSINESS_DECISION_PENDING | NO |
| J-10 Agreement preparation & internal approval | PARTIALLY_IMPLEMENTED | **YES** (RB-05) |
| J-11 Applicant signing & activation | PARTIALLY_IMPLEMENTED | **YES** (RB-06) |
| J-12 Agreement lifecycle | PARTIALLY_IMPLEMENTED | NO |
| J-13 Trainer profile creation | READY_WITH_BUSINESS_DECISION_PENDING | NO |
| J-14 Trainer self-service profile update | PARTIALLY_IMPLEMENTED | NO |
| J-15 Trainer search & unified profile | PARTIALLY_IMPLEMENTED | NO |
| J-16 Assignment request creation | READY_WITH_EXTERNAL_DEPENDENCY | **YES** (RB-07, data) |
| J-17 Matching & nomination | PARTIALLY_IMPLEMENTED | NO (YES if more than one centre goes live) |
| J-18 Offer handling & response | PARTIALLY_IMPLEMENTED | **YES** (RB-08) |
| J-19 Re-routing after rejection | PARTIALLY_IMPLEMENTED | **YES** (RB-09) |
| J-20 Training material submission & approval | PARTIALLY_IMPLEMENTED | **YES** (RB-10) |
| J-21 Engagement execution follow-up | PARTIALLY_IMPLEMENTED | **YES** (RB-11) |
| J-22 Withdrawal / cancellation | PARTIALLY_IMPLEMENTED | **YES** (RB-12) |
| J-23 Public visibility consent | READY_WITH_EXTERNAL_DEPENDENCY | NO |
| J-24 Public trainer directory | READY_WITH_BUSINESS_DECISION_PENDING | NO |
| J-25 Operational notifications | PARTIALLY_IMPLEMENTED | **YES** (RB-13) |
| J-26 Roles, permissions & delegation | PARTIALLY_IMPLEMENTED | NO |

## Release blockers

| ID | Journey | Problem (evidence) | Why blocking | Required action | Owner |
|---|---|---|---|---|---|
| RB-01 | all signed-in journeys | Expert Hub's STS client and redirect URI aren't registered (`Q38`; `18_SSO_INTEGRATION.md` "blocks the real handshake"). `uat.env`/`production.env` leave `EXPERT_HUB_OIDC_CLIENT_ID` and `EXPERT_HUB_API_BASE_URL` empty. The API refuses sign-in safely (503) | Mandatory integration: nobody can sign in outside testing | FAST registers the client and redirect URI; DevOps fills UAT/production env | FAST IAM · DevOps |
| RB-02 | J-02 | No nomination backend (P-186). The live «ترشيح» button opens the self-service form, so a staff member creates an application **in their own name**, which enters screening | Wrong records; screening doesn't stop a staff member deciding their own application | Formally descope J-02 and remove the button, **or** build it | Business (scope) · Expert Hub |
| RB-03 | J-03 | Approval's addendum gate accepts any **file name**, and no document is stored (`ServiceRequestEndpoints.cs:157-167`). With no active agreement, approval still accredits and skips the addendum (`:170-175`) | `BR-0305` governance bypass | Store the addendum through the existing document store; refuse (or rule on) approval without an active agreement | Expert Hub · Business |
| RB-04 | J-06 | An applicant's reschedule request is saved and never shown to staff. The Teams invitation reads approval-committee tables that don't exist until J-09 (`MeetingBooking.cs:60-66`), so the interview committee isn't invited | Core journey dead end | Surface reschedule requests internally; invite the J-05 interview panel | Expert Hub |
| RB-05 | J-10 | Non-creator reviewers and signers can't view the document (`AgreementPreparationPage.tsx:264-279`, `DocumentUrl: null`). Re-preparation **deletes the signing sequence and cascades to signatures** (`AgreementEndpoints.cs:178-183`, `AgreementConfigurations.cs` cascade). The creator can't edit after an internal modification request (`:170-173`) | Signing blind; audit evidence lost | Generate and serve the document; void signatures instead of deleting them; allow correction before resubmit | Expert Hub · Legal |
| RB-06 | J-11 | Applicant decides on a preview without the creator-entered terms or legal text. No signed artefact exists; the template is edited in place with no text snapshot | Approved requirement (F1/AC-2, F2/AC-1) missing; legal record not retained | Full terms preview; signed document stored; template versioned or text snapshotted | Expert Hub · Legal |
| RB-07 | J-16 | `REFERENCE_LIST centre` ships with **no values** and no product path can add any (`SharedConfigurations.cs:55-58`; only the FAST sync writes `REFERENCE_VALUE`). `centre-required` refuses every request | Core journey can't complete in a fresh deployment | Business approves the operational centre list (the Assignment Matrix names five), then a controlled additive load. Kept separate from access scope (P-276) | Business · Expert Hub |
| RB-08 | J-18 | `OfferCard` reads `offer.price.amount` / `details.program.name`; the API sends neither, so the page throws. No job expires an offer: expiry only happens when a late answer arrives (only three hosted services exist) | Trainer can't answer; a silent candidate stalls the slot forever | Align the offer contract; add an expiry sweep | Expert Hub |
| RB-09 | J-19 | Page reads `siblingSlots`/`previouslyOffered`; API sends `siblings`. `SlotCycles` never written; a second re-route on a slot returns 409 | Core journey can't complete | Align the contract; persist cycles; allow repeated cycles | Expert Hub |
| RB-10 | J-20 | Statuses `awaiting_upload`/`pending_approval` vs `awaiting-upload`/`pending-approval`; page sends `{kind}`, API expects `{decision}` → 400 | Trainer can't upload; coordinator can't decide | Align status and decision contracts | Expert Hub |
| RB-11 | J-21 | Detail page reads `location.mode`, `enrolment.count/enrollees`, `evaluations`; API sends none. `in_progress` vs `in-progress` | Page throws on live data | Align the contract; render the named gaps (`Q20`) | Expert Hub |
| RB-12 | J-22 | No server-side state/date guard on withdrawal: a completed engagement can be withdrawn and its slot re-offered (`EngagementEndpoints.cs` `TerminateAsync` checks only withdrawn/cancelled). De-link stores `cancelled`, not `withdrawn` (P-111) | Data corruption | Guard by lifecycle/date on the server; correct de-link status | Expert Hub |
| RB-13 | J-25 | Nothing reaches a recipient: `NullEmailGateway`, no recipient inbox, no reminder or deadline job, and routing (`DM-GAP-08`) unapproved | Time-bound steps (offer windows, signing turns, interview slots) rely on people checking pages unprompted | Configure the email gateway; approve routing; add the reminder job (or an inbox) | Business · Infrastructure · Expert Hub |

## Non-blocking findings to schedule

- **J-07 / J-08 (contradicts P-271).** In an application with an interview-exempted
  service where every interviewed service fails, forwarding returns
  `no-service-passed`. The only way out is a whole-application rejection, which
  also rejects the exempted service. The fix needs the interview wire to carry
  exempted services, so the gate and the panel can forward them.
- **J-07.** Evaluations aren't server-gated on the interview being scheduled. All
  members "did not attend" leaves only rejection.
- **J-01.** On a live deployment the guest path shows the **mock** identity check
  (`identity` has no backend), then fails with 401 at draft start. Hide the guest
  path or require sign-in first.
- **J-09.** Formation isn't restricted to the application's creator. The committee
  context lists interview-failed services under "accepted" (display only).
- **J-12.** 90/30/5-day expiry alerts are seeded and never raised.
- **J-14.** Certificate self-upload returns 501 although storage exists.
  FAST-owned change requests stay pending (no FAST write API). `/fields` accepts
  any value.
- **J-15.** Specialty (`Specialties()` is always empty) and minimum-evaluation
  (evaluation always null) filters exclude **everyone**. This is the same defect
  class as the disabled minimum-years filter (P-275). Identity-card PDF not built.
- **J-16.** Brochure stored as a file name only; no end ≥ start date check.
  Program/Plan typed by hand (`22_FAST_INTEGRATION_REQUEST.md` §5).
- **J-17.** Centre scope isn't enforced on requests or decisions; a manager holds
  both nominate and approve. A full rejection returns 400 instead of a decided
  state.
- **J-23 / J-24.** The directory checks consent only, not whether the file is
  suspended or expired. Specialty chips always return nothing; "domain" missing.
- **J-26.** Delegation is not specified or built. A few internal reads check only
  the internal role (centres, agreement template, integration status, reference
  data), which is fixed at sign-in.

## Recommended next step

Before any UAT: add one HTTP-provider contract test per feature, fed with a real
API response, and fix RB-08 … RB-12 against it. Resolve RB-02, RB-03 and RB-07
with the business. RB-01 and RB-13 are external or configuration work that can run
in parallel.

---

## Remediation — 2026-09-17

Decisions P-277 … P-290 (`DECISIONS.md`). Migrations M29 … M33, all additive.

| ID | Journey | Status | What changed | What remains |
|---|---|---|---|---|
| RB-01 | SSO / J-01 guest | PARTIALLY_RESOLVED_EXTERNAL | Identity fails CLOSED outside explicit mock mode (no API base URL, or `EXPERT_HUB_DATA_MODE=mock`): no fake Yaqeen result; guest and activation screens say sign-in is required | FAST STS client + redirect URI (Q38); UAT/production `EXPERT_HUB_API_BASE_URL` + OIDC client; a real identity (Yaqeen) backend |
| RB-02 | J-02 | PARTIALLY_RESOLVED_BUSINESS | The «ترشيح» action that created an application under the staff member's identity is removed everywhere | How an unverified nominee account links to the SSO identity at activation (security) + Yaqeen |
| RB-03 | J-03 | RESOLVED (2026-10-08, `P-345`) | The addendum is an uploaded, stored document (id); a name alone is refused; the decision links to it. With no active agreement the request is rejected automatically (`no-active-agreement`), on submission or on review, and the decision-maker cannot approve it | — |
| RB-04 | J-06 | RESOLVED | Staff see the applicant's reschedule request (+ note); malformed/past slots refused; the Teams invite goes to the J-05 interview panel | Teams credentials (booking is best-effort; internal state works without them) |
| RB-05 | J-10 | PARTIALLY_RESOLVED_BUSINESS | Every reader sees the complete, versioned document; re-preparation voids and keeps signatures; creator can correct during an internal modification request; only the creator prepares | Legal approval of the legal text and of internal acceptance, or an e-signature provider |
| RB-06 | J-11 | PARTIALLY_RESOLVED_BUSINESS | Applicant sees the complete document; acceptance records the exact version and method `internal-acceptance`; template edits never alter it; no fake PDF | Same as RB-05; signed-PDF generation; activation still starts the term at signature, not the entered dates |
| RB-07 | J-16 | RESOLVED | The Assignment Matrix's five centres as an operational list (not access scope); dates cannot run backwards; brochure is a stored document | — |
| RB-08 | J-18 | RESOLVED | Contract aligned (offer price/details/lifecycle); automatic, concurrency-safe expiry worker | — |
| RB-09 | J-19 | RESOLVED | Contract aligned; persisted cycles, unlimited, refusers re-includable; full rejection opens a cycle | Whether a new pool should be generated automatically (J-17 vs J-19 wording) |
| RB-10 | J-20 | RESOLVED | Status/decision/round contracts aligned | Material files are still name-only (no approved format/size rule) |
| RB-11 | J-21 | RESOLVED | Detail contract aligned; one status module; last day counts as in progress | Q20/Q29 data sources |
| RB-12 | J-22 | RESOLVED | Server-side lifecycle + `D-10` notice guards; de-link → withdrawn | — |
| RB-13 | J-25 | PARTIALLY_RESOLVED_EXTERNAL | Every raised event recorded (routed/unrouted); 90/30/5 expiry reminders, idempotent; recipient inbox API | Routing approval (DM-GAP-08); email gateway; a recipient inbox PAGE |

**Also fixed:** J-07/J-08 exempted services stay eligible; evaluation needs a scheduled interview · J-09 and J-10 creator-only formation/preparation (BR-0215) · J-14 certificate upload · J-15/J-24 filters with no data refused and removed · J-17 full rejection is a decision · J-23/J-24 suspended/expired trainers hidden publicly.

**Business decisions required:** J-17 nominate/approve segregation (none defined) · J-02 identity linking · J-03 approval without an active agreement · J-17 automatic new pool vs staff re-run · J-26 feature codes for the centre list, agreement-template read, integration status and reference data (reads remain internal-role only).

RELEASE_READY: **NO** — the remaining items above are external or business/legal, not code.


**UAT baseline (2026-09-17):** the decisions, external dependencies, test matrix and contract inventory for UAT are in `25_UAT_BUSINESS_DECISIONS.md`, `26_UAT_EXTERNAL_DEPENDENCIES.md`, `27_UAT_TEST_MATRIX.md` and `28_API_CONTRACT_INVENTORY.md`.
