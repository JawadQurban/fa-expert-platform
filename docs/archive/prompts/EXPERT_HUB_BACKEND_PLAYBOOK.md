# Expert Hub — backend playbook

**State at the time of writing (2026-08-27):** the stack is decided
([`17_STACK_DECISION.md`](../docs/expert-hub/17_STACK_DECISION.md), `P-162`) and
the solution is scaffolded at `backend/expert-hub` — it builds with warnings as
errors and 7 tests pass. Nothing else exists.

This document is the detailed expansion of Phases 3–6 of
[`EXPERT_HUB_PLAYBOOK.md`](EXPERT_HUB_PLAYBOOK.md). Where the two disagree, this
one is newer.

---

## The one thing that makes this different from a normal backend build

**The API specification already exists, in TypeScript, and it is tested.**

Twenty-two service interfaces under `frontend/src/apps/expert-hub/features/*/`
declare every endpoint, payload and semantic the product needs — written against
the journeys and the BRD, reviewed, and covered by **641 passing tests**. They
are not a sketch. `accessService.ts` names `v1/internal/access/matrix` and the
exact shape it returns; `notificationService.ts` names
`v1/internal/notifications/matrix`; and so on.

So the backend is not designing an API. **It is implementing one that a
consumer already depends on**, which changes three things:

1. **Route and payload shapes are not open questions.** Read the
   `createHttp*Provider` function in the service file — it is the endpoint list.
2. **"Done" has a hard definition.** Every service file has a test seam
   (`setXServiceForTesting`) and switches to the HTTP provider when
   `VITE_EXPERT_HUB_API_BASE_URL` is set. An increment is done when **the
   frontend's existing tests pass against the real API**, not when the backend's
   own tests pass.
3. **Structural rules are already encoded and must survive.** The frontend made
   forbidden states unrepresentable — `BR-0801` has no user→permission type
   (`P-137`), `BR-0702` has no channel field (`P-147`), `BR-0701` cannot route a
   draft template (`P-148`). **A backend that permits what the frontend cannot
   express has broken the rule**, because it is the backend that enforces it for
   any other client.

⚠️ Where a service file and this playbook disagree about a route, **the service
file wins and the disagreement is a bug in this document** — say so in the commit.

---

## How to use this

Each entry is a **self-contained prompt**. Paste it into a fresh session:
`CLAUDE.md` loads automatically and carries the standing rules.

Read the **Needs** line first. If an input is missing, either do the prompt that
supplies it or **stop and ask** — never invent it. That is the rule this whole
project has run on, and `TODO.md` is where the unanswered ones live.

**One prompt per session.** They are sized so a session finishes one cleanly.

### Rules every prompt inherits — not repeated below

| | Rule |
|---|---|
| **Secrets** | Never in source. `appsettings.json` names keys and leaves them empty; values come from environment / secret store. A test enforces it — keep it passing, do not weaken it |
| **Build** | Warnings are errors. `dotnet build` clean **and** `dotnet test` green before done |
| **Audit** | `NFR-07` / `BR-0806` — append-only, enforced by database grants, not by application discipline. The app's principal gets INSERT and SELECT on the audit table and nothing else |
| **Config-as-data** | `BR-0807`, `BR-0705` — the role×permission matrix, notification matrix, templates and SLA matrix are **rows**. A permission or deadline change must never require a release |
| **Authority** | `P-J9` — the API decides what a user may do and says so in the payload. The client never infers it from a role string |
| **Fail closed** | A missing authorization check must deny, not allow. Apply data scope at the **query layer**, never in a controller |
| **Bilingual** | Every user-facing string is an AR/EN pair (BRD §10.4). Arabic is primary |
| **One source per entity** | `BR-1201`, `P-129` — the mastership map is data; a replica write to a master-owned field is **rejected**, not silently kept |
| **Errors** | RFC 7807 `ProblemDetails`, always. The frontend's `Result<T, ExpertHubApiError>` expects a status and a message on every error path |
| **Modules** | One module per capability (`D-01`) — capability *folders*, not twelve assemblies |

### The source map every prompt inherits

| Rank | Source | Authority |
|---|---|---|
| **1** | The **frontend service interfaces** + their tests | **The contract.** A consumer already depends on these shapes |
| **2** | The **24 journey documents** | Highest on business logic (`P-20`) |
| **3** | `BRD_Expert_Hub_V1.0.pdf` | The foundation; sole source for CAP-06/07/08/09 |
| **4** | `08_BACKEND_ARCHITECTURE` · `10_DATABASE_DESIGN` (97 entities) | The design being implemented |
| **5** | `09_API_SPECIFICATION` · `02C` | Endpoint conventions, integration boundary |
| **6** | `13_FAST_DATA_DICTIONARY_MAP` + the two `.xlsx` | What FAST actually supplies |

**Always also read** `DECISIONS.md` (`P-01`→`P-163` — much is already settled),
`TODO.md` (the open questions), and the newest `sessions/` record.

---

# Phase A — Foundation

## ✅ BE-00 · Solution scaffold — **DONE 2026-08-27** (`1c27a5b`)

Solution, `ExpertHub.Api` / `Core` / `Infrastructure`, test project booting the
real `Program`, warnings-as-errors, config binding with startup validation, the
committed-secret test, `/health`, and `v1` routing.

---

## ✅ BE-01 · Persistence foundation — **DONE 2026-08-30** (`a245ebd`)

Migration 01 creates the nine tables of `10` §3.1–3.2, named as the document
names them. Append-only `AUDIT_LOG` enforced three ways (context API shape,
`SaveChanges` guard, `scripts/sql/audit-log-append-only.sql` grants);
`REFERENCE_VALUE` deactivates-never-deletes; CHECK constraints close the role
and data-scope unions in the database itself; bilingual pairs NOT NULL; no
user→permission table exists (`BR-0801`). `/health/ready` (database) beside
`/health` (liveness). Verified with integration tests against a real SQL
Server — **LocalDB**, since infrastructure has still not supplied an instance.
⚠️ One EF default was overridden: the `USER_ROLE` unique index drops EF's
`IS NOT NULL` filter, which would have exempted every unscoped assignment
(P-140) — read generated migrations, EF's defaults are decisions.

---

## ✅ BE-02 · INT-01 — the OIDC flow, in the API — **DONE 2026-08-30** (`0d8d842`)

Authorization Code + PKCE in the API via the framework's OpenIdConnect handler
(the non-negotiables — `iss`/`aud`/`exp`/`nbf`, signature vs JWKS, `nonce`,
server-side `state`, PKCE — are what it validates by default). `GET
/api/auth/login` (open-redirect-guarded `returnUrl`, 503 ProblemDetails while
unregistered) · middleware-owned callback at `Oidc:CallbackPath` · `GET
/api/auth/session` returning `ExpertHubSession` exactly · `POST
/api/auth/logout` (always local; names the provider's `end_session` URL with
`id_token_hint` when advertised). HttpOnly/Lax cookie; claim mapping is
configuration and **fails closed** (`Q37` unanswered ⇒ no roles); session
lifetime provisional config (`P-167`). Everything mounts under `/api`
(`P-166`). Frontend: `academySsoAdapter` (BFF client) + `authMode` requiring
both `apiBaseUrl` and a configured client (`P-168`); the dev placeholder
survives untouched. Proven against a **fake IdP with a genuinely signed ID
token** — valid handshake issues a session with mapped roles, unmapped values
grant none, tampered `state` issues nothing. Backend 34/34 · frontend 652/652.
🔴 Still waiting on `Q38` (the real registration) and `Q37` (the claim
contract) — both env edits when they land.

---

## ✅ BE-03 · CAP-08 — authorization, and the matrix the screens are waiting for — **DONE 2026-08-30** (`560c0d0`)

All seven routes of `accessService.ts`, served for real. Migration 02 seeds
the BRD's facts — six roles (with §8.8.5's descriptions) and 58 permissions
(`permissionId` = feature code, `P-169`) — and **no grant**: the grid serves
empty and `unapproved` (`DM-GAP-07`). The structural rules crossed the tier:
no user→permission path exists, no role can be created, audit rides the same
`SaveChanges` as the change, and revoking a grant deletes the row so only the
trail remembers. `v1/internal/*` requires the internal-role session, failing
closed while `Q37` is unmapped (`P-170` — which also fixed BE-02's
challenge-scheme posture: 401, never a 302, for data requests). Actors are
JIT-provisioned from the session (`BR-1205`). ⚠️ The contract forced
`system_administrator` over the design doc's `sysadmin` (`P-171`).

**On this prompt's definition of done:** `Access.test.tsx` pins the mock
through its own seam, so “run it against the real API” cannot be executed
literally — this document overpromised. The equivalent was executed instead:
full-stack tests that sign in through the real OIDC handshake, carry the
cookie, and exercise every route against real SQL Server, asserting the exact
wire shapes `access.types.ts` declares. Backend **41/41**, 0 warnings.

---

# Phase B — Cross-cutting capabilities

## ✅ BE-04 · CAP-12 — the integration hub, before any real integration — **DONE 2026-08-30**

> Build the registry, the integration log, the **transactional outbox** and the
> replication engine per `08` §4.2 — **before** any capability needs one, so that
> none of them grows an ad-hoc `HttpClient` call of its own.
>
> The mechanism: ownership check → idempotency key → write to the outbox **in the
> same transaction as the business change** → publish from the outbox → record
> the crossing → reconcile drift.
>
> - **`BR-1204` — every crossing is logged**, in both directions, success or
>   failure, with enough to replay it.
> - **`BR-1203` — last known state survives an outage.** An unreachable system
>   means stale data clearly marked stale; it never means an empty screen or a
>   silently reverted business decision.
> - **`P-129` mastership is data, not code.** The map of which system masters
>   which entity is a table. A write to a field this system does not master is
>   **rejected with a reason**, never accepted and lost at the next sync.
> - **`P-135` write-through**: a change to a FAST-mastered field is forwarded and
>   only shown as saved once FAST accepts it. If FAST is unreachable it is
>   **queued and shown as pending** — never applied locally and hoped for.
>
> Outbox-then-publish rather than publish-then-write: a crash between the two
> must leave a message to retry, not a business change nobody was told about.

**Sources:** BRD §8.12 · `08` §1.1 (mastership), §4.2 (outbox, idempotency),
§4.3 · `10` §3.12 · `13` (what actually crosses) · `P-129`, `P-135`.
**Needs:** BE-03.

**Done as specified (`P-183`):** migration 03 — the four §3.12 tables plus
`OUTBOX_MESSAGE` (the table §4.2 rule 3 mandates), registry seeded from §4.1
and the §1.1.1 mastership register ("not shared" entities have no row on
purpose). `IntegrationHub` stages both directions in the caller's transaction
and rejects mastership violations with a reason — both ways. `OutboxPublisher`
retries forever with capped backoff; no configured channel means messages
queue `pending` with zero burnt attempts (`P-135`) behind `IIntegrationChannel`
— the seam each real contract (`G41`–`G44`, `Q28`, `Q33`/`Q34`) plugs into.
`INTEGRATION_LOG` got the audit trail's append-only guard. Registry read:
`GET v1/internal/integration/systems`. Backend **54/54**, 0 warnings.

---

## ✅ BE-05 · CAP-07 — events, templates, SLA, dispatch — **DONE 2026-08-31**

> Implement `notificationService.ts`: the event catalogue, the matrix resolver,
> bilingual template rendering, the SLA matrix, the log, and the dispatcher.
>
> The frontend already catalogued **twenty events from ten journeys, each with
> its citation** (`P-146`) — that list is the seed, and each event's `source`
> field must survive into the database. An event with no citation is an invented
> event.
>
> Carry the four structural rules:
>
> - **`BR-0703`** — a capability **emits an event and knows nothing about
>   recipients**. CAP-07 alone resolves audience, template and channel. No
>   capability may call the dispatcher with a recipient.
> - **`BR-0702`** — email and in-platform fire **together**. There is no channel
>   parameter on a matrix row (`P-147`); one event produces one log entry per
>   channel, and one may fail while the other succeeds.
> - **`BR-0701`** — no free-form wording reaches a notification. Only an
>   **approved** bilingual template can be routed (`P-148`); editing an approved
>   template returns it to draft and unroutes its rows.
> - **`BR-0707`** — the actual send is in **one** language, from the recipient's
>   primary-language field. The template is bilingual; the send is not (`P-149`).
>
> The **SLA matrix is the single source for every deadline** (`BR-0705`,
> `P-155`). The frontend already reads its four countdowns from it — screening,
> interview slot, offer response, agreement expiry — so the API must serve them
> from one table, including the `record-derived` case where only reminders are
> central (`P-151`) and the `undefined-duration` case where no countdown can be
> produced (`P-156`).
>
> ⚠️ Do **not** build a resend on the log. `US-0705` asks for failures to be
> handled, and §8.7 never defines what a resend does — `Q32` is that question.

**Sources:** BRD §8.7 · `notificationService.ts` + `notification.types.ts` +
`Notifications.test.tsx` (**the contract**) · `shared/types/sla.ts` +
`shared/sla/mockSlaMatrix.ts` (the seeded matrix and its citations) · `10` §3.9 ·
`P-146`→`P-157`.
**Needs:** BE-04 (the outbox carries the send). ⚠️ `DM-GAP-08` (`Q34`) is the
routing and `Q33` the message wording — ship the tables empty, as the screens do.

---

# Phase C — Capability services, in dependency order

Each follows the same shape: **migration from `10` → module → endpoints matching
the frontend service file → flip that feature's tests onto the HTTP provider**.

## ✅ BE-06 · CAP-01 — applications and add-service — **DONE 2026-08-31**

> Schema-driven form (`FORM_SCHEMA`, versioned so an old application still
> renders as submitted), per-service grain, one active application (`BR-0101`),
> reference number issued **at submission only** (`BR-0107`), and the guest path
> that provisions an account at submission (J-01 §3B).
>
> Add-service (`BR-0112`) **bypasses screening entirely** and goes to a single
> administrative decision — and approval is not final until the addendum is
> attached (J-03/F3). The rejection is notified **without the reason**
> (J-03/F3/AC-7), which is a rule about what the notification may contain.

**Sources:** **J-01, J-02, J-03** · BRD §8.1 · `applicationsService.ts`,
`serviceRequestService.ts`, `identityService.ts` · `10` §3.3 · `P-52`,
`P-56`→`P-63`, `P-68`, `P-69`.
**Needs:** BE-05. ⚠️ `DM-GAP-01` (the field map) — ship the schema tables and
seed from the current mock, marked unapproved.

**Done (`P-186`)** — and better than this prompt asked: `DM-GAP-01` closed in
the meantime (P-172), so the seeded schema is the owner's APPROVED workbook,
not an unapproved mock. Residue, recorded not hidden: the J-01 §3A identity
endpoints stay unbuilt (`G4`; FAST SSO is the live identity), J-02
nomination/activation waits for its internal UI (columns ready), uploads wait
on `G26`/`G27` (required attachments gate live submission honestly), and the
interview/agreement actions 409 until BE-07/BE-08 add their states.

## ✅ BE-07 · CAP-02 — screening, interview, committee — **DONE 2026-08-31**

> Config-as-data evaluation models (`BR-0203` — weights are rows; changing one
> must not need a release), the sequential committee with auto-advance, and the
> interview exemption that is **invisible to the applicant** (`P-45` — the
> timeline reads "passed" and carries no exemption field at all).
>
> **The AI boundary is structural** (`BR-0201`/`BR-0202`): `AI_ANALYSIS` is a
> sibling entity, and the scoring function **does not take it as a parameter**.
> The advisory result cannot be merged into the official score because the code
> that computes the score cannot see it.
>
> `BR-0220` — an interview result is `null` until every assigned member has
> responded. A half-formed average must not be representable.

**Sources:** **J-05→J-09** · BRD §8.2 · `screeningService.ts`,
`interviewService.ts`, `committeeService.ts` · `10` §3.4 · `08` §2.1–2.2 ·
`P-24`→`P-34`, `P-45`, `P-49`→`P-51`, `P-132`.
**Needs:** BE-06. ⚠️ `DM-GAP-02`, `DM-GAP-03` (the models) — tables ship, weights
stay unapproved. `Q35` is the screening SLA duration.

**Done (`P-187`).** The AI boundary is the scorer's signature; the draft
models seed under their `mock-…-draft.1` labels; the criterion raw score is a
documented section-completeness placeholder until `DM-GAP-02` maps answers to
points. The full journey — submission → screening → slot confirmation →
per-member evaluations → forward → sequential committee → accreditation rows
— runs as one test with distinct OIDC identities per actor. Residue: EV-0202
(the selection reminder) needs a scheduler; bank-data readiness (J-09/F6)
serves `not-requested` until BE-08's J-10 gate; the EH-INT-02 inbox
(`internalService.ts`) is not in this increment's sources and stays on mock.

## ✅ BE-08 · CAP-03 — agreements — **DONE 2026-08-31**

> One agreement per person covering all approved services (`D-05`); a new service
> is an **annex**, never a second agreement. 1 year first, 3 years each renewal
> (`BR-0302`, `P-64`). The signing sequence needs **at least one e-signer**
> (`P-36`), and sending requires a complete sequence **and** an attached
> signature — two separate conditions (`BR-0213`, `P-38`).
>
> The agreement document is **authored outside the platform** (BRD §9.2): the
> platform links and tracks it, never edits it.

**Sources:** **J-10, J-11, J-12** · BRD §8.3, §6.1 · `agreementService.ts`,
`agreementLifecycleService.ts` · `10` §3.5 · `P-36`→`P-44`, `P-64`→`P-67`,
`P-157`.
**Needs:** BE-07. ⚠️ `G26` (document storage).

**Done (`P-188`)**, and it closed two things this prompt did not name:
J-09/F6's bank data (the other half of the J-10 gate) and `BR-0305`'s
addendum, which J-03's approval now writes against the existing agreement.
`G26` shapes what is absent: no `AGREEMENT_DOCUMENT` table, file names stand
in for stored files, and `documentUrl` is null everywhere rather than a dead
link. `expired` is derived from the calendar, never stored.

## ✅ BE-09 · CAP-04 — trainer profile, and the split mastership — **DONE 2026-08-31**

> **`P-134`: FAST masters the base profile, Expert Hub masters the accreditation
> layer.** Identity, personal, job, education, certifications, experience,
> courses, areas, availability and bank data are FAST's; accredited services and
> their classification, file status, visibility consent, calculated ratings and
> the Academy record are ours.
>
> Implement **write-through** (`P-135`) for FAST-mastered fields through BE-04's
> engine. `BR-0408`: file status is internal-only and never shown to the trainer
> (`P-48` — the DTO has no such field).
>
> `BR-1004`/J-24: the public profile carries name, domain, specialization and
> delivered programmes — **and no rating** (`P-40`, `P-41`). Enforce it in the
> projection, not the view.

**Sources:** **J-13, J-14, J-15, J-23, J-24** · BRD §8.4, §8.12.4 ·
`profileService.ts`, `trainerSearchService.ts`, `directoryService.ts` · `10` §3.6 ·
`13` + the two `.xlsx` · `P-40`, `P-41`, `P-48`, `P-52`→`P-54`, `P-134`, `P-135`.
**Needs:** BE-08. ⚠️ `Q30` — without a FAST write API, dual change is not
deliverable and those fields become read-only in Expert Hub. Decide it, do not
discover it. `Q16` (the domain taxonomy) blocks one public field.

**Done (`P-192`), and this prompt's warning about `Q30` proved milder than it
reads.** The contract's `request-change` editability already IS write-through:
queued, displayed as pending, never applied locally. So `Q30` decides whether a
pending change ever resolves — and if the answer is "no write API", those
fields are served `locked` instead, which is one map, not an architecture. The
sub-entity replica tables of `10` §3.6 are deliberately unbuilt: the contract
renders a flat `fieldValues` map (`BR-0404`), and the replicas belong with the
INT-05a feed that would fill them. `Q16` did block a public field exactly as
predicted — specialties serve empty rather than guessed.

## ✅ BE-10 · CAP-05 — assignment through engagement — **DONE 2026-09-01**

> Seven journeys, one capability. Matching with **exactly 3 candidates per slot**
> (`BR-0505`), **one live offer per slot** at a time, the 3-day response window
> from the central SLA matrix, per-slot FAST sync, re-routing with no limit, and
> withdrawal/cancellation with **three distinct end states** (`P-113`).
>
> Structural rules the frontend already encodes and the API must too:
> **there is no send-offer operation** (J-18/F1/AC-1 — the system creates it, no
> one sends it); **there is no cancel-plan operation** (J-22/F3/AC-2 —
> cancellation originates only in FAST); re-routing is **slot-scoped, never
> request-scoped** (`P-95`).

**Sources:** **J-16→J-22** · BRD §8.5 · `assignmentService.ts`,
`engagementService.ts`, `executionService.ts`, `reRoutingService.ts`,
`submissionService.ts`, `withdrawalService.ts` · `10` §3.7 · `P-74`→`P-113`.
**Needs:** BE-09. ⚠️ `Q20` (`plan.PlanTaker`) for enrolment and attendance;
`DM-GAP-05` (matching weights).

**Done (`P-194`).** Both warnings landed as predicted and are served as gaps
rather than filled: `Q20` leaves enrolment and attendance `available:false`
with the gap NAMED (never zeroes, which would read as "nobody enrolled"), and
`DM-GAP-05`'s weights are seeded evenly because an even split is the only
distribution that claims nothing. The `EXT_FAST_*` mirrors are unbuilt for
the same reason CAP-04's sub-entities are: no plan read exists, so a request
carries the centre's own `DM-GAP-06` form and `pulled` serves null.

## ✅ BE-11 · CAP-06 — entitlements, read-only — **DONE 2026-09-01**

> **No write operation anywhere** (`BR-0601`, `P-127`) — the contract has two
> operations and both are reads. `linkage_complete` is **derived** from the
> PO→agreement→programme chain and gates trainer visibility (`BR-0603`,
> `P-126`): a record with an incomplete chain **cannot be constructed in the
> trainer's DTO shape**.
>
> **No totals** (§8.6.1, `P-125`) — the capability calculates no amount.

**Sources:** BRD §8.6 · `entitlementService.ts` + `entitlement.types.ts` ·
`10` §3.8 · `P-124`→`P-128`.
**Needs:** BE-08 and BE-10 (`BR-0602`'s chain runs through both). ⚠️ `Q27` (the
ERP disbursement status list).

**Done (`P-196`, `P-197`).** Both prescriptions held, and one turned out to be
enforceable rather than merely observed: `BR-0601`'s «no write operation
anywhere» is the **compiler's** now — the writable DbSets are internal to
`ExpertHub.Infrastructure`, so the API assembly cannot express a change to an
entitlement. `linkage_complete` is not a column. ⚠️ **A gap the increment
found:** the ERP payload names no programme, so `BR-0602`'s third hop has no
source and `BR-0603` hides every record from every trainer — the screens are
live, correct and empty until `Q39` is answered. No heuristic was invented to
fill it.

## ✅ BE-12 · CAP-09 — dashboards and exports — **DONE 2026-09-02**

> Read-only across the other eleven capabilities. §8.9.1: this capability
> **owns no source data** — encode it as the module having **no write path to any
> operational entity**, only metric definitions.
>
> Data scope follows CAP-08: the executive dashboard is read-and-export only, and
> the centre coordinator sees only their own centre.

**Sources:** BRD §8.9 · `homeService.ts`, `internalService.ts` · `10` §3.10 ·
§8.8.5 for scoping.
**Needs:** BE-11. ⚠️ `DM-GAP-09` (`Q26`) — `F-0902` names three employee tiles;
build those and leave the rest named-but-empty.

**Done (`P-198`, `P-199`).** Both instructions taken literally: `F-0902`'s
three tiles are built — the third, «مواد بانتظار الاعتماد», for the first time
— and the coordinator's and executive's dashboards are rows with **no
placements**, which is what named-but-empty means when the naming is all §8.9
supplies. "No write path to any operational entity" is enforced by shape and
asserted by a test that the change tracker is empty after a dashboard read.
⚠️ Two recorded deviations: `METRIC_DEFINITION.formula` is null on every row
(`Q26` writes none, so none is stored), and `REPORT_DEFINITION`/`REPORT_RUN`
are **not built** — the export half has no contract, no screen and no
definitions.

---

# Phase D — Real integrations

Each of these replaces a mock with a real system. **All of them go through
BE-04's hub** — none opens its own HTTP client.

| | Integration | Needs |
|---|---|---|
| 🔴 **BE-13** | **INT-05 — FAST, both directions.** Inbound plan/programme/schedule/enrolment; outbound accredited trainers, `PlanTrainer.TrainerId`, approved material; plus base-profile write-through | 🔴 `Q30` (write API), `Q20`, `Q21` (19 lookup lists), and a replication contract agreed with the FAST team |
| 🔴 **BE-14** | **INT-02 — MTM ratings.** `02D` is authoritative and corrects `02C` on ownership | 🔴 `Q29` — does «دون فاست كوسيط» mean reading `ImsCommon.Survey` directly? `DM-GAP-14` |
| 🔴 **BE-15** | **INT-03 — ERP entitlements.** Consumed whole; never calculated | 🔴 `Q27` and an ERP endpoint |
| 🔴 **BE-16** | **INT-04 — email gateway.** The only outbound channel besides in-platform | 🔴 gateway credentials, and `Q34` so there is something to send |
| ✅ **BE-17** | **INT-06 — AI provider — DONE 2026-09-02** (`P-202`, `P-203`). Built and shipped **dark**: the port takes no application id, so the no-identity rule cannot be broken; the provider is off unless a key AND a model are set; an unavailable provider records `unavailable` rather than retrying. Forced per-system channel routing into existence | ⚠️ `Q28` still blocks **go-live**, as designed — nothing else |

---

# Phase E — Cutover

| | Prompt | Needs |
|---|---|---|
| 🔴 **BE-18** | **Data migration.** BRD §12 | 🔴 `Q2` (strategy), `DM-GAP-15` (retention) |
| 🟢 **BE-19** | **Deploy the API** beside the existing frontend container. Same scope rules: only Expert Hub is rebuilt, **never** a repo-wide `docker compose down`, **never** `docker system prune` (it deletes the rollback image) | BE-03 running |
| ✅ **BE-20** | **Re-audit — DONE 2026-09-02.** `12_JOURNEY_CONFORMANCE_AUDIT.md` now opens with the re-audit: six rules that became structural, five findings (four blocked on outside inputs, one fixed), two journeys amended. **No regression from the backend build** | BE-12 |
| 🟢 **BE-21** | **Upgrade the runtime off .NET 9.** One line in `Directory.Build.props` — but do it deliberately, with the LTS the Academy hosts | 🔴 `17_STACK_DECISION.md` §4 |

---

## The critical path

```
BE-01 ─ BE-02 ─ BE-03 ─ BE-04 ─ BE-05 ─ BE-06 ─ BE-07 ─ BE-08 ─┬─ BE-09 ─ BE-10 ─ BE-11
 db      auth    authz   hub     notify   apps   screen  agree  │
                                                               └─ BE-12 dashboards
```

**BE-01 → BE-05 is the whole foundation and depends on no unanswered question**
except a SQL Server instance. Everything after BE-06 starts meeting the gaps in
`TODO.md`.

## What is actually blocked, and on whom

| Blocked | On | Who answers |
|---|---|---|
| BE-02 finishing | The FAST client registration + `Q37` claims | FAST team |
| BE-09's dual change | `Q30` — a FAST write API | FAST / IMS team |
| BE-13 | `Q20`, `Q21`, `Q30` | FAST / IMS team |
| BE-17 go-live | `Q28` — data-protection ruling | Data protection + procurement |
| The matrices' **contents** | `Q31`, `Q33`, `Q34` | Business Analyst + PO |

Everything else can start now.

---

*Maintained beside [`EXPERT_HUB_PLAYBOOK.md`](EXPERT_HUB_PLAYBOOK.md) (the
frontend and the phase overview) · `docs/expert-hub/17_STACK_DECISION.md` ·
`docs/expert-hub/15_INPUTS_REGISTER.md` (who to chase for each gap).*
