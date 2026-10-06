# 27 — UAT Test Matrix (J-01 … J-26)

*Prepared 2026-09-17 on `expert-hub/uat-baseline`. The expected results are the
behavior **implemented and covered by automated tests** at this checkpoint. Where
a business decision or an external system changes a result, the row names it
(`25_UAT_BUSINESS_DECISIONS.md`, `26_UAT_EXTERNAL_DEPENDENCIES.md`).*

**Before any row:** `EXPERT_HUB_ENV=uat`, the frontend starts (no configuration
error), `/health/ready` is `Healthy`, and `GET /api/v1/internal/readiness` has
been captured and attached to the UAT run.

Priority: **P0** core path or safety guard · **P1** important variant or negative
case · **P2** secondary.
Status: `NOT_RUN` · `PASS` · `FAIL` · `BLOCKED`.

## 1. Smoke classification

| Journey | Classification | Why |
|---|---|---|
| J-01 Onboarding & application | UAT_READY_WITH_EXTERNAL_DEPENDENCY | Needs SSO (EXT-01). The guest (Yaqeen) path fails closed (EXT-07) |
| J-02 Internal nomination | **NOT_READY** | The nominate action is removed. BD-UAT-01 and EXT-07 |
| J-03 Add service | UAT_READY_WITH_BUSINESS_DECISION | BD-UAT-02 (no active agreement) |
| J-04 Speaker record | **DESCOPED** | Backlog `EXPERT-HUB-J04-SPEAKER` |
| J-05 Screening | UAT_READY_WITH_BUSINESS_DECISION | Screening matrix pending: scores are placeholders |
| J-06 Interview scheduling | UAT_READY_WITH_EXTERNAL_DEPENDENCY | Teams links need EXT-04; internal scheduling works without it |
| J-07 Interview evaluation | UAT_READY | — |
| J-08 Interview exemption | UAT_READY | — |
| J-09 Approval committee | UAT_READY | — |
| J-10 Agreement preparation | UAT_READY_WITH_BUSINESS_DECISION | BD-UAT-03, BD-UAT-07 |
| J-11 Signing & activation | UAT_READY_WITH_BUSINESS_DECISION | BD-UAT-03, BD-UAT-04, BD-UAT-07 |
| J-12 Agreement lifecycle | UAT_READY_WITH_BUSINESS_DECISION | BD-UAT-04 (term dates), BD-UAT-06 (reminder delivery) |
| J-13 Profile creation | UAT_READY | — |
| J-14 Profile self-service | UAT_READY_WITH_EXTERNAL_DEPENDENCY | FAST-owned field changes stay pending (no FAST write API) |
| J-15 Trainer search | UAT_READY | Filters with no data source are removed |
| J-16 Assignment request | UAT_READY_WITH_EXTERNAL_DEPENDENCY | Program/Plan entered by hand until EXT-03 |
| J-17 Matching & nomination | UAT_READY_WITH_BUSINESS_DECISION | BD-UAT-05. Matching weights provisional |
| J-18 Offer response | UAT_READY | — |
| J-19 Re-routing | UAT_READY | — |
| J-20 Material submission | UAT_READY | Material files are recorded by name (no approved file rule) |
| J-21 Execution follow-up | UAT_READY | Evaluations shown as unavailable (Q29) |
| J-22 Withdrawal / de-link | UAT_READY | — |
| J-23 Visibility consent | UAT_READY | — |
| J-24 Public directory | UAT_READY_WITH_BUSINESS_DECISION | Public card matrix pending |
| J-25 Notifications | UAT_READY_WITH_EXTERNAL_DEPENDENCY | Email EXT-05. Routing BD-UAT-06 |
| J-26 Roles & permissions | UAT_READY_WITH_BUSINESS_DECISION | Delegation not specified. Some internal reads use the internal role only |

## 2. Matrix

| UAT ID | Journey | Role | Precondition | Steps | Expected Result | External Dependency | Business Decision Dependency | Priority | Status |
|---|---|---|---|---|---|---|---|---|---|
| UAT-ENV-01 | Environment | Tester | A UAT copy with `EXPERT_HUB_API_BASE_URL` blank | Open `/expert-hub/` | A configuration error page names `EXPERT_HUB_API_BASE_URL`. No demo data or placeholder sign-in is shown | — | — | P0 | NOT_RUN |
| UAT-ENV-02 | Environment | Internal staff / trainer / anonymous | UAT running | `GET /api/v1/internal/readiness` as each | Staff: 8 providers, statuses only, no URL/ID/secret. Trainer: 403. Anonymous: 401 | — | — | P0 | NOT_RUN |
| UAT-J01-01 | J-01 | Applicant (SSO user) | EXT-01 configured | Sign in → start an application → fill the required fields → attach a document → submit | The application is submitted with a reference. The attachment downloads for the applicant | EXT-01 | — | P0 | NOT_RUN |
| UAT-J01-02 | J-01 | Guest | Signed out | Open the guest application path | Sign-in is required. No identity is "verified" and no Yaqeen result is shown | EXT-07 | — | P0 | NOT_RUN |
| UAT-J01-03 | J-01 | Applicant | Draft open | Attach a file of a type or size the form's rule doesn't allow | Refused with the rule's message. Nothing is stored | — | — | P1 | NOT_RUN |
| UAT-J02-01 | J-02 | Staff | — | Look for a "nominate" (ترشيح) action anywhere internal | No such action exists | EXT-07 | BD-UAT-01 | P0 | NOT_RUN |
| UAT-J03-01 | J-03 | Trainer → Staff | Approved trainer with an **active** agreement | Trainer requests a service → staff approve with an uploaded addendum | Approved. The addendum links to the stored file and is attached to the active agreement | — | — | P0 | NOT_RUN |
| UAT-J03-02 | J-03 | Staff | Pending service request | Approve with no addendum file | Refused (`addendum-missing`). A file name alone is never accepted | — | — | P0 | NOT_RUN |
| UAT-J03-03 | J-03 | Staff | Trainer with **no** active agreement | Approve with an addendum | Record the observed behavior only (approval allowed, no agreement changed). Don't file a defect until BD-UAT-02 is decided | — | BD-UAT-02 | P1 | NOT_RUN |
| UAT-J05-01 | J-05 | Staff (screening) | Submitted application | Open screening → record a decision | The decision is saved and the application moves on. The decider becomes the application creator (BR-0215) | — | Screening matrix | P0 | NOT_RUN |
| UAT-J06-01 | J-06 | Staff → Applicant | Screening passed | Staff offer slots → applicant picks one | The interview is scheduled. With no Teams: the ticket shows the meeting as pending, no link | EXT-04 | — | P0 | NOT_RUN |
| UAT-J06-02 | J-06 | Applicant → Staff | Scheduled interview | Applicant requests a reschedule with a note → staff open the interview | Staff see the request and the note | — | — | P0 | NOT_RUN |
| UAT-J06-03 | J-06 | Staff | Reschedule open | Propose a slot in the past, or a malformed one | Refused (`slot-in-past` / `slot-invalid`) | — | — | P1 | NOT_RUN |
| UAT-J07-01 | J-07 | Interview panel | Scheduled interview | Record evaluations → forward | Forwarded to the committee with the passed services | — | — | P0 | NOT_RUN |
| UAT-J07-02 | J-07 | Interview panel | Interview **not** scheduled | Try to record an evaluation | Refused (`interview-not-scheduled`) | — | — | P1 | NOT_RUN |
| UAT-J08-01 | J-08 | Staff | Multi-service application | Exempt one service from interview | The exempted service stays eligible (see §3.3) | — | — | P0 | NOT_RUN |
| UAT-J09-01 | J-09 | Application creator | Forwarded application | Form the committee → members decide | Decision recorded. Only eligible services are listed (§3.3) | — | — | P0 | NOT_RUN |
| UAT-J09-02 | J-09 | Another staff member | Same application | Try to form the committee | Refused (`only-application-creator`). The form is not offered | — | — | P0 | NOT_RUN |
| UAT-J10-01 | J-10 | Application creator | Committee approved | Prepare the agreement → form the signing chain → internal signers accept | Scenario A (§3.1) holds | EXT-06 | BD-UAT-03, BD-UAT-07 | P0 | NOT_RUN |
| UAT-J10-02 | J-10 | Non-creator with F-0301 | Agreement in formation | Try to prepare it or form its chain | Refused (`only-application-creator`). The document can still be read | — | — | P0 | NOT_RUN |
| UAT-J11-01 | J-11 | Applicant | Agreement sent | Read the full document → accept | Acceptance recorded as **internal acceptance** against that version. Never called certified. No signed PDF | EXT-06 | BD-UAT-03, BD-UAT-04 | P0 | NOT_RUN |
| UAT-J11-02 | J-11 | Applicant → Creator | Agreement sent | Request a modification → creator corrects → re-sends | Scenario B (§3.1) holds | — | — | P0 | NOT_RUN |
| UAT-J12-01 | J-12 | System / Staff | Active agreement ending in 90, 30 and 5 days (test data) | Wait for the reminder sweep (hourly) | One occurrence per threshold (EV-0301/0302/0303), raised once. No duplicates on later sweeps | EXT-05 | BD-UAT-06 | P1 | NOT_RUN |
| UAT-J12-02 | J-12 | Staff | Active agreement | Check the start/end dates after activation | The start date is the signature timestamp (the current rule) | — | BD-UAT-04 | P1 | NOT_RUN |
| UAT-J13-01 | J-13 | Trainer | Agreement activated | Open "my profile" | The profile exists with accredited services | — | — | P0 | NOT_RUN |
| UAT-J14-01 | J-14 | Trainer | Active profile | Upload a professional certificate | Stored and listed; downloadable by the trainer and internal staff (§3.6) | — | — | P1 | NOT_RUN |
| UAT-J14-02 | J-14 | Trainer | Active profile | Request a change to a FAST-owned field | Stays pending. Not written to FAST | EXT-02 | — | P2 | NOT_RUN |
| UAT-J15-01 | J-15 | Staff | Several trainers | Search by the available filters → open the unified profile | Results match. No specialty, domain, minimum-evaluation or minimum-years filter is offered | — | — | P1 | NOT_RUN |
| UAT-J16-01 | J-16 | Centre coordinator (F-0501) | — | Create each of the 10 request types (§3.2) | Each is saved with its own required fields | EXT-03 | — | P0 | NOT_RUN |
| UAT-J16-02 | J-16 | Centre coordinator | — | End date before start date / no brochure / no centre | Refused (`dateTo` invalid / `attachmentId` required / centre required) | — | — | P0 | NOT_RUN |
| UAT-J17-01 | J-17 | Staff (F-0502/F-0503) → Manager or Centre coordinator (F-0504) | Request with slots | Run matching → send the pool → approve | Offers go to the approved candidates in rank order | — | BD-UAT-05 | P0 | NOT_RUN |
| UAT-J17-02 | J-17 | Manager or Centre coordinator (F-0504) | Pool sent | Reject every candidate | Recorded as a decision (not an error). The slot can be re-run | — | — | P1 | NOT_RUN |
| UAT-J18-01 | J-18 | Trainer | Offer pending | Accept | Engagement created. Offer shows the price, details and lifecycle | — | — | P0 | NOT_RUN |
| UAT-J18-02 | J-18 | Trainer | Offer past its window | Do nothing; wait for the sweep (≤ 5 min) → then try to answer | Offer `expired`, the next candidate is offered. A late answer is refused. Works with **no email** | — | — | P0 | NOT_RUN |
| UAT-J19-01 | J-19 | Staff | All approved candidates refused or expired (slot exhausted) | Re-run matching → send a new pool | A new cycle is opened. Candidates who refused earlier can be included again | — | — | P0 | NOT_RUN |
| UAT-J19-02 | J-19 | Staff | Slot **not** exhausted | Try to send a new pool | Refused (`slot-not-exhausted`) | — | — | P1 | NOT_RUN |
| UAT-J20-01 | J-20 | Trainer → Staff or Manager (F-0506) | Accepted engagement | Upload material → staff request changes → re-upload → approve | Rounds recorded in order. Statuses match on both sides | — | — | P0 | NOT_RUN |
| UAT-J21-01 | J-21 | Trainer | Engagement in progress (including its last day) | Open the engagement detail | Shows in progress on the last day. Evaluations shown as unavailable | — | — | P1 | NOT_RUN |
| UAT-J22-01 | J-22 | Trainer | Upcoming engagement, > 4 days before start | Withdraw | Withdrawn. The slot is re-routed | — | — | P0 | NOT_RUN |
| UAT-J22-02 | J-22 | Trainer / Staff | Engagement < 4 days before start (trainer) or < 24 h (staff) / completed | Withdraw or de-link | Refused (`termination-deadline-passed` / `engagement-not-upcoming`) | — | — | P0 | NOT_RUN |
| UAT-J22-03 | J-22 | Staff | Upcoming engagement | De-link | Stored as **withdrawn** (not cancelled) | — | — | P1 | NOT_RUN |
| UAT-J23-01 | J-23 | Trainer | Active profile | Turn public visibility on, then off | Appears in, then disappears from, the public directory (§3.4) | — | — | P0 | NOT_RUN |
| UAT-J24-01 | J-24 | Public visitor | Mixed trainers (§3.4) | Browse and filter the directory | Only listable trainers. Only supported filters | — | Public card matrix | P0 | NOT_RUN |
| UAT-J25-01 | J-25 | Staff (F-0705) / Recipient | Any raised event | Open the occurrences list; recipient opens their notifications | Every event recorded (routed or unrouted). The recipient sees only their own in-platform rows (§3.7) | EXT-05 | BD-UAT-06 | P1 | NOT_RUN |
| UAT-J26-01 | J-26 | Staff / Manager / Executive | Default role matrix | Open the screening, committee and access-admin pages as each role | Each role reaches only its features (e.g. Staff: screening yes, committee decision 403) | — | Delegation not specified | P0 | NOT_RUN |

## 3. Scenario checklists

### 3.1 Agreements (J-10 / J-11)

- **A: one version for everyone.** The creator, each internal signer, a reviewer
  and the applicant all open the document. Every one of them sees the **same
  version number and the same SHA-256 hash**, and the full text with the entered
  terms.
- **B: modification.** The applicant requests a modification.
  - [ ] The old document version is still readable.
  - [ ] The old chain and its signatures still exist and are marked **void** (not deleted).
  - [ ] The creator corrects and re-prepares, which creates a **new version** and a **new chain**.
  - [ ] New acceptances reference the new version only.
- **C: legacy.** An agreement prepared before this release (no frozen version) is
  still readable. It is identified as a live rendering, never presented as a
  frozen record.
- [ ] Editing the template afterwards changes none of the documents above.

### 3.2 Assignment requests and offers (J-16 … J-19)

- **10 request types:** `general-program`, `private-program`, `training-workshop`,
  `meeting`, `seminar`, `content-development-request`, `question-writing`,
  `technical-presentations`, `consultations`, `other`. Each shows and requires its
  own form's fields.
- **5 centres:** البنوك والتمويل، الأوراق المالية، التامين، البرامج الخاصة،
  القيادات. [ ] Choosing a centre grants **no access** (operational list only).
- [ ] Required fields missing → `required-field-missing` lists them.
- [ ] Brochure: required, stored as a document, downloadable by internal staff.
- [ ] Dates: the end date can't be before the start date.
- [ ] Named trainer / matching: ranked candidates appear with scores (weights provisional).
- [ ] Offer: the trainer sees the price and details. Expiry after the window (sweep ≤ 5 min).
- [ ] Re-routing: a new cycle on exhaustion; earlier refusers can be re-included.
- [ ] Exhaustion: when no candidate is left, the slot shows as exhausted (EV-0504 recorded).
- [ ] Acceptance creates an engagement. Withdrawal follows UAT-J22-01/02.

### 3.3 Multi-service applications (J-07 … J-09)

| Services | Forward allowed? | Committee receives |
|---|---|---|
| Passed + failed | Yes | The passed service only |
| Exempt + failed | Yes | The exempted service only |
| All failed | No (`no-service-passed`). Only rejection | — |
| Passed + exempt + failed | Yes | The passed and exempted services |

### 3.4 Directory (J-23 / J-24)

| Trainer file | Consent | Publicly visible? |
|---|---|---|
| Active | On | Yes |
| Idle | On | Yes |
| Suspended | On | **No** (list and profile) |
| Expired / ended | On | **No** |
| Active | Off | **No** |

- [ ] The specialty, domain, minimum-evaluation and minimum-years filters are **not
  shown**. Calling them directly returns 400 (`specialty-filter-unavailable`,
  `domain-filter-unavailable`, `min-evaluation-unavailable`,
  `min-years-experience-unavailable`). Don't re-add them in UAT feedback builds.

### 3.5 Offer expiry is independent of email

- [ ] With email `NOT_CONFIGURED`, an expired offer still expires and advances to the next candidate.

### 3.6 Upload security

| Upload | Who may upload | Who may download | Check |
|---|---|---|---|
| Application attachment (J-01) | The applicant, own draft | The applicant and internal staff | Type/size rule, owner only |
| Service addendum (J-03) | Staff with F-0305 | Internal staff (and the owner) | A file name alone is refused |
| Professional certificate (J-14) | The trainer, own profile | The trainer and internal staff | The certificate rule of the trainer's application form |
| Assignment brochure (J-16) | Centre coordinator (F-0501) | Internal staff | Required on the request |

For each upload:
- [ ] Another user's document id returns 403/404.
- [ ] Metadata (name, size, type) is shown correctly.
- [ ] The scan status is recorded as **`not-scanned`** (EXT-08).
- [ ] Historical records holding only a file name still show the name, with no broken link.

J-20 material files are recorded by name only (no approved file rule yet) and are
outside this checklist.

### 3.7 Notifications (J-25)

- [ ] Every raised event appears in the occurrences list, `routed` or `unrouted`. None is invented or dropped.
- [ ] 90/30/5-day expiry reminders: one occurrence per agreement per threshold (idempotent across sweeps).
- [ ] A recipient sees only their own in-platform notifications.
- [ ] Routing: nothing is sent to anyone the approved matrix doesn't name (BD-UAT-06).
- [ ] Email: no message is ever shown as sent while EXT-05 is `NOT_CONFIGURED`.
