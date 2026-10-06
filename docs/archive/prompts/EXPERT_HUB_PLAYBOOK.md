# Expert Hub — sequential prompt playbook

**State at the time of writing (2026-08-27):** frontend 22/24 documented journeys
complete, 562 tests green, released as `expert-hub-v1.3.0`.

> **Progress since:** PB-02 (CAP-08), PB-03 (CAP-07) and PB-04 (the central SLA
> matrix) are done — 641 tests. The **OIDC configuration layer** is built
> (`16_SSO_OIDC_CONFIGURATION.md`) and the **stack is decided**
> (`17_STACK_DECISION.md`, `P-162`), so Phases 3–5 are unblocked. **PB-19
> (INT-01) is the recommended first backend increment** — see §5 of the stack
> decision: the OIDC flow moves into the API, which answers `Q36`. Backend fully
designed ([`08`](../docs/expert-hub/08_BACKEND_ARCHITECTURE.md) +
[`10`](../docs/expert-hub/10_DATABASE_DESIGN.md)), **nothing implemented**.

> **This playbook is not BRD-led.** The **24 journey documents outrank the BRD on
> business logic** (`P-20`), and every prompt below carries a **Sources** line
> naming the journeys, the BRD section, the Expert Hub documents and the settled
> decisions that apply to it. The BRD is the only source for the four
> capabilities that have no journey — CAP-06, CAP-07, CAP-08, CAP-09.

---

## How to use this

Each entry is a **self-contained prompt**. Paste it into a fresh session and it
works — `CLAUDE.md` loads automatically and carries the standing rules (read the
repo first, never rely on chat history, journeys outrank page specs, encode rules
structurally, `validate:expert-hub` + `build:expert-hub` before done, document and
commit).

Read each entry's **Needs** line first. If the input is not there, either do the
prompt that supplies it or **stop and ask** — do not invent the input. That is the
single rule this whole project has been run on.

**One prompt per session.** They are sized so a session finishes one cleanly.

### Every prompt inherits this source map

No prompt below repeats it. **Read the whole set that applies to your task, in
this precedence order** — do not work from the BRD alone.

| Rank | Source | Authority |
|---|---|---|
| **1** | **The 24 journey documents** `J-01`…`J-24` + `Journey Catalog` | **Highest on business logic.** They were written after the BRD and carry the specific rules — `P-20` |
| **2** | **`BRD_Expert_Hub_V1.0.pdf`** (BRD-TRN-001 v1.0) | The foundation the journeys were derived from. Authoritative where the journeys are **silent**, and the only source for the four capabilities that have no journey (CAP-06/07/08/09) |
| **3** | `04_PAGE_SPECIFICATIONS` · `05_WIREFRAME_SPECIFICATIONS` · `06_UI_SPECIFICATIONS` | Page structure, DS component mapping, states, a11y, responsive. **Not** business logic (`P-20`) |
| **4** | `02C` application & integration architecture · **`02D` rating architecture** | `02D` **corrects `02C`** on MTM ownership — read it second |
| **5** | `01_PRODUCT_DISCOVERY` · `02_INFORMATION_ARCHITECTURE` · `03_USER_FLOWS` | Capability map, personas, IA, flows |

**Always also read, whatever the task:**

| Document | Why |
|---|---|
| [`DECISIONS.md`](../docs/expert-hub/DECISIONS.md) | `P-01`→`P-153`. **Every rule already settled**, and the reasoning. Read before deciding anything — much of it is already decided |
| [`TODO.md`](../docs/expert-hub/TODO.md) | The open questions. If your task hits one, it is a known gap — flag it, do not resolve it yourself |
| [`11_JOURNEY_IMPLEMENTATION_MAP`](../docs/expert-hub/11_JOURNEY_IMPLEMENTATION_MAP.md) | Coverage per journey + **§0 journey-vs-page-spec deltas** |
| [`12_JOURNEY_CONFORMANCE_AUDIT`](../docs/expert-hub/12_JOURNEY_CONFORMANCE_AUDIT.md) | Current state of every built page against every journey |
| [`13_FAST_DATA_DICTIONARY_MAP`](../docs/expert-hub/13_FAST_DATA_DICTIONARY_MAP.md) + the two `.xlsx` | What FAST actually supplies — 15 tables, 406 columns |
| [`14_INTERNAL_DASHBOARD_BRD_REVIEW`](../docs/expert-hub/14_INTERNAL_DASHBOARD_BRD_REVIEW.md) | The internal employee's 18 BRD services vs what is built |
| [`08_BACKEND_ARCHITECTURE`](../docs/expert-hub/08_BACKEND_ARCHITECTURE.md) + [`10_DATABASE_DESIGN`](../docs/expert-hub/10_DATABASE_DESIGN.md) | Ownership model, the bidirectional contract, and all 97 entities |
| [`sessions/`](../docs/expert-hub/sessions/) | The newest record's *Resume here* block, and its **corrections** — claims already found to be wrong |
| `CHANGELOG.md` | What shipped, and why it was built that way |

**Where two sources disagree**, the ranking above decides — and say so in the
commit. **Where all of them are silent, stop and ask.** Never invent a rule; that
is what `TODO.md` exists for.

| Legend | |
|---|---|
| 🟢 | Ready — every input exists |
| 🟡 | Buildable, but ships with a named gap |
| 🔴 | Blocked — the Needs line must be satisfied first |

---

## Phase 0 — Make the asks answerable

### 🟢 PB-01 · One document with everything we need from stakeholders

> `TODO.md` has 46 open items, of which roughly a third are stale or already
> answered elsewhere. Produce `docs/expert-hub/15_INPUTS_REGISTER.md`: every open
> input the project is waiting on, grouped by **who can answer it** — Product
> Owner · FAST/IMS team · MTM team · ERP team · Information Security & data
> protection · Business Analyst. For each: what exactly is being asked for, what
> is blocked until it arrives, and how much (one ruling / a matrix / a table
> definition / an API). Mark the three or four that unblock the most.
>
> Then reconcile `TODO.md` against it: close what is answered (`Q6` is answered
> by `P-132`; the documentation-workstream checkboxes for 08 and 10 are done),
> and mark what is superseded. Do not delete history — strike through and say
> what replaced it.
>
> Done when: the register exists, `TODO.md` no longer contradicts it, and both
> are committed.

**Sources:** `TODO.md` · `DECISIONS.md` · `12`, `13`, `14` · the 24 journeys'
own "open items" sections · BRD §9.4 (`DM-GAP-01`…`DM-GAP-15`).
**Needs:** nothing. **Why first:** everything below is gated on inputs, and
nobody can supply them from 46 scattered bullets.

---

## Phase 1 — Build the screens that capture the missing matrices

The two largest missing inputs are *matrices*. Building their admin screens turns
"send us a spreadsheet" into "type it in", which is the faster route.

### ✅ PB-02 · CAP-08 — roles & permissions administration — **DONE 2026-08-27** (`6cba30d`)

> Build the System Administrator's roles and permissions screens, BRD §8.8
> (`F-0801` permission matrix, `F-0802` role assignment) as EH-INT-12.
>
> §8.8.5 fixes **six roles** — مدرب · موظف إدارة المدربين · مدير إدارة المدربين ·
> منسق مركز · مشرف النظام · الإدارة العليا. §8.8.4 fixes the three-layer model:
> permission (one per capability feature) → role (a bundle) → user (one or more
> roles). `P-133`: authentication is INT-01's, **authorization is entirely the
> platform's**.
>
> Encode structurally: a permission is never granted to a user directly, only
> through a role (§8.8.3) — so no contract may express a user→permission link.
> The matrix is **data, not code** (`BR-0807`): a permission change must not need
> a release.
>
> `USER_ROLE.scope_ref` carries the **منسق مركز** restriction — that role sees
> only its own centre's assignment requests. Model it; J-17's "requesting party"
> is the consumer.
>
> ⚠️ `DM-GAP-07` — the approved role×permission *contents* do not exist. Build
> the screen so they can be entered, seed the six roles and the permission list
> derived from the twelve capabilities' features, and mark the grid as
> unapproved on screen.
>
> Done when: `validate:expert-hub` + `build:expert-hub` green, decisions
> recorded, committed.

**Sources:** BRD §8.8 (no journey exists — CAP-08 is J-26, undocumented) ·
`14` §2.3 · `10` §3.2 · `P-133` · `Q25`. J-17/F4 shows what the *منسق مركز*
scope has to serve.
**Needs:** nothing to build; `DM-GAP-07` to populate.

### ✅ PB-03 · CAP-07 — notification matrix, templates, SLA console, log — **DONE 2026-08-27**

> Build the four System Administrator screens of BRD §8.7 as EH-INT-13:
> `F-0702` the notification matrix (event → template → audience → channel),
> `F-0703` bilingual template management, `F-0704` the central SLA console
> covering **all twelve capabilities**, `F-0705` the notification log.
>
> Two rules are structural. `BR-0701`: every official notification comes from an
> **approved bilingual template** — no free-form text may reach a system
> notification, so no contract should carry a raw body. `BR-0702`: a matrix event
> fires email **and** in-platform **together** — one action, not two toggles.
>
> The **event catalogue is derivable now**: eight built journeys already name
> their notification points (J-03/F3/AC-6+AC-7, J-06/F1, J-11/F1/AC-1, J-12/F1,
> J-18/F2, J-19/F1/AC-2, J-21/F1/AC-3, J-22 all three scenarios). Seed it from
> them and cite each.
>
> ⚠️ `DM-GAP-08` and `DM-GAP-10` — the matrix and SLA **rows** are unapproved.
> Ship the tables empty and say so on screen.
>
> Done when: validation green, decisions recorded, committed.

**Sources:** BRD §8.7 (no journey — CAP-07 is J-25, undocumented) · **the ten
journeys that name notification points**: J-01, J-02/F3, J-03/F3, J-06/F1,
J-11/F1, J-12/F1, J-18/F1+F2, J-19/F1, J-21/F1, J-22 · `10` §3.9 · `14` §2.2.
**Needs:** nothing to build; `DM-GAP-08`/`DM-GAP-10` to populate.

> **⚠️ Two corrections this prompt earned when it was run.**
>
> 1. It said **eight** journeys name notification points. It is **ten** — J-01's
>    submission confirmation (user flow 7) and J-02/F3's activation invitation
>    were missed. Twenty events were catalogued, each with its citation (P-146).
> 2. It said to **ship the SLA table empty**. That was wrong in one direction:
>    J-06/F1/AC-4, J-18/F2 and J-12/F1/AC-2–AC-4 **state** their deadlines, and
>    the product already runs those countdowns — blanking them would have
>    discarded approved rules rather than avoided inventing any. Three are seeded
>    with their citation; three that a journey leaves open ship with no duration
>    (P-150). The rule the prompt was reaching for is narrower: **ship the
>    unapproved parts empty, not the approved ones.**

### ✅ PB-04 · Wire the SLA console to the badges already in the product — **DONE 2026-08-27**

> Every SLA countdown in the frontend is currently served per feature. Now that
> `SLA_MATRIX_ROW` and `SLA_INSTANCE` exist (`10` §3.9), make the screening,
> interview, offer and agreement-expiry deadlines read from the one central
> source — that is what §8.7 means by "a single screen for all deadlines across
> the twelve capabilities".
>
> Keep the P-J4 contract: the state is **server-decided**, never computed in the
> browser (`P-51`). This is a re-wiring, not a redesign — no badge should look
> different afterwards.

**Sources:** BRD §8.7 (`F-0704`) · `10` §3.9 · `P-51` (the P-J4 contract) ·
J-05/F1+F2, J-06/F1/AC-4, J-18/F2/AC-1, J-12/F1 — the four live countdowns.
**Needs:** PB-03.

> **⚠️ What this prompt found.** It called itself "a re-wiring, not a redesign —
> no badge should look different afterwards", and one badge had to. The
> screening screen was showing a **five-business-day** SLA that appears in no
> approved document; J-05 states no duration at all. Wiring it to the console
> made the two disagree out loud, and the invented number lost (P-156). The
> instruction was right about *redesign* and wrong to assume every existing
> badge was correct.

---

> ## ➡️ Phases 3–6 have moved
>
> The backend prompts below (PB-08→PB-27) were written before the stack was
> decided and are kept for their **Sources** lines. The detailed, current
> version is **[`EXPERT_HUB_BACKEND_PLAYBOOK.md`](EXPERT_HUB_BACKEND_PLAYBOOK.md)**
> (BE-00→BE-21), which reflects `P-162` (ASP.NET Core + EF Core + SQL Server),
> `P-163` (the OIDC flow lives in the API), the scaffold that now exists, and
> the CAP-07/CAP-08 contracts the frontend shipped.
>
> **Where the two disagree, the backend playbook is newer.**

---

## Phase 2 — Finish the remaining internal capabilities

### 🔴 PB-05 · J-04 — speaker records

> Build the speaker record (CAP-01/CAP-04, EH-INT-11). Internal registration
> only: BRD §6 makes it the one relationship with **no contractual or financial
> obligation** and it is **never part of any agreement** (§6.1) — encode that as
> the absence of any path from a speaker record to `AGREEMENT`, not as a guard.
> J-04/F1/AC-2: the record is independent of any occasion, so no event need exist
> at creation.

**Sources:** **J-04** (primary) · BRD §6 + §8.1 · `10` §3.3 · `P-78` (how the
other undefined services were handled — report why, never show an empty form).
**Needs:** 🔴 the **Speaker Fields matrix** — marked *pending upload* in J-04
itself. Do not invent fields.

### 🟡 PB-06 · CAP-09 — role-scoped dashboards and exportable reports

> Build EH-INT-15 per BRD §8.9 (**not** `EH-INT-14`, which is CAP-08's access
> screens — see P-154): four role-scoped dashboards (`F-0901` manager,
> `F-0902` employee, `F-0903` centre coordinator, `F-0904` executive read-only)
> and exportable reports.
>
> §8.9.1: this capability **owns no source data** — it reads from the other
> eleven and stores only metric *definitions*. Encode it: the contract has no
> write path to any operational entity.
>
> `F-0902` names the employee's tiles — طلبات قيد الفرز · مقابلات مجدولة · مواد
> بانتظار الاعتماد — so start there. Data scope follows CAP-08, so the executive
> dashboard is **read and export only** and the coordinator sees only their own
> centre.
>
> ⚠️ `DM-GAP-09` — the other dashboards' metrics are undefined. Ship what
> `F-0902` names, and leave the rest as named-but-empty.

**Sources:** BRD §8.9 (no journey — CAP-09 is J-27, undocumented) · §8.8.5 for
the four roles the dashboards are scoped to · `10` §3.10 · `14` §2.4 · `Q26`.
**Needs:** PB-02 (role scoping). `DM-GAP-09` for the full metric set.

### 🟢 PB-07 · CAP-12 — integration registry and replication monitor

> Build EH-INT-15 per BRD §8.12: the integrated-systems registry, the
> data-element source-of-truth matrix, the integration log, and a
> **replication-state monitor** showing drift per shared entity (`10` §3.12).
>
> Seed INT-01…INT-06 from §8.12.3 plus `P-132`'s AI provider. `BR-1201` — one
> source per element — should be enforced by the model: a data element cannot
> carry two owning systems.
>
> This screen is where `P-129`'s mastership and `P-135`'s write-through become
> observable to staff, so make **pending write-throughs and drift** first-class,
> not a debug view.

**Sources:** BRD §8.12 (registry, source-of-truth matrix, `BR-1201`→`BR-1206`) ·
`08` §1.1 + §4 · `10` §3.12 · `13` · `P-129`, `P-132`, `P-134`, `P-135`.
**Needs:** nothing.

---

## Phase 3 — Backend foundation

### ✅ PB-08 · Choose the stack, and record why — **DECIDED 2026-08-27**

> Decide runtime, framework, database engine, hosting and CI for the Expert Hub
> backend, and write `docs/expert-hub/17_STACK_DECISION.md` (**17, not 16** — 16 was taken
> by `16_SSO_OIDC_CONFIGURATION.md`).
>
> Constraints that actually narrow it: the platform must run inside the Academy's
> environment; it integrates with a **SQL Server** estate (the supplied schema is
> T-SQL); `BR-1205` means no local auth; every capability needs config-as-data;
> `NFR-07` needs an immutable audit log. Weigh those, do not just state a
> preference.

**Sources:** BRD §10 (non-functional: performance, security, availability,
localization) · `02C` · `07_FRONTEND_ARCHITECTURE` for what the client already
assumes · `13` (the estate is SQL Server) · `08` §3 + §7.
**Needs:** ~~🔴 an owner/infrastructure decision~~ — **answered 2026-08-27**:
ASP.NET Core + EF Core + SQL Server (`P-162`, `17_STACK_DECISION.md`). ⚠️ The
**runtime version and hosting topology** are still an infrastructure question
(§4 of that document) and should be settled before PB-09 writes a migration.
**No longer blocks Phases 3–5.**

### 🟢 PB-09 · Schema migration 01 — foundation

> From `10` §3.1–3.2, generate the first migration: `ATTACHMENT`,
> `REFERENCE_LIST`, `REFERENCE_VALUE`, `APP_USER`, `ROLE`, `PERMISSION`,
> `ROLE_PERMISSION`, `USER_ROLE`, `AUDIT_LOG`.
>
> `AUDIT_LOG` is **append-only** — no update or delete grant (`NFR-07`).
> `REFERENCE_VALUE` deactivates, never deletes, so history still resolves.
> Bilingual pairs everywhere.

**Sources:** `10` §3.1–3.2 · BRD §8.8.2, §9.3 · `NFR-07` (audit immutability) · BRD §10.4 (localization → every user-facing string is an AR/EN pair).
**Needs:** PB-08.

### 🟢 PB-10 · CAP-08 service

> Implement identity & access: INT-01 token validation, role resolution,
> permission checks, audit writes. **No credential is ever stored** (`BR-1205`).
> Permission checks resolve through roles only. Data scope (`all` / `own` /
> `centre`) is applied at the query layer, not in controllers — a missing check
> should fail closed.

**Sources:** BRD §8.8 in full · `08` §2.3 · `10` §3.2 · `P-133` · `BR-1205` · `P-J9` (server-decided capabilities — the frontend already assumes it).
**Needs:** PB-09.

### 🟢 PB-11 · CAP-12 service — the integration hub

> Implement the registry, the integration log, the **transactional outbox**, and
> the replication engine per `08` §4.2: ownership check, idempotency key,
> outbox-then-publish, per-entity mastership, drift reconciliation.
>
> This is built **before** any real integration so no capability grows its own
> ad-hoc HTTP call. `BR-1204`: every crossing is logged. `BR-1203`: last known
> state survives an outage.

**Sources:** BRD §8.12 · `08` §1.1 (mastership), §4.2 (outbox, idempotency), §4.3 · `10` §3.12 · `P-129`, `P-135` · `13` for what actually crosses.
**Needs:** PB-10.

### 🟢 PB-12 · CAP-07 service — events, templates, dispatch

> Implement the event bus consumer, template rendering, the matrix resolver and
> the dispatcher. Capabilities **emit events and know nothing about recipients**
> (`BR-0703`) — CAP-07 alone resolves audience, channel and template.

**Sources:** BRD §8.7 · `10` §3.9 · the eight journeys that name notification points (see PB-03) · `BR-0701`→`BR-0703`.
**Needs:** PB-11.

---

## Phase 4 — Capability services, in dependency order

Each of these follows the same shape: migration from `10`, service, API per
`09`, swap the frontend's mock provider for the HTTP provider (the versioned
contract seam already exists), keep every structural rule the frontend encodes.

### 🟡 PB-13 · CAP-01 — applications
> Schema-driven form (`FORM_SCHEMA` versioned), per-service grain, one active
> application (`BR-0101`), reference at submission only (`BR-0107`), guest path
> with provisioning at submission (J-01 §3B).

**Sources:** **J-01** and **J-02** (primary) · BRD §8.1 · `04` EH-TP-05 for page structure only · `10` §3.3 · `P-52`, `P-60`→`P-63`, `P-68`, `P-69` · `DM-GAP-01`.
**Needs:** PB-12. ⚠️ `DM-GAP-01` for the field map — ship the schema tables and
seed them from the current mock, marked unapproved.

### 🟡 PB-14 · CAP-02 — screening, interview, committee
> Config-as-data evaluation models (`BR-0203`), the AI boundary (`BR-0201`/`0202`
> — `AI_ANALYSIS` is a sibling entity and the scoring function does not take it
> as a parameter), sequential committee with auto-advance, exemption invisible to
> the applicant (`P-45`).

**Sources:** **J-05, J-06, J-07, J-08, J-09** (primary) · BRD §8.2 · `10` §3.4 · `08` §2.1–2.2 (the AI boundary) · `P-24`, `P-45`, `P-49`→`P-51`, `P-132` · `DM-GAP-02`, `DM-GAP-03`.
**Needs:** PB-13. ⚠️ `DM-GAP-02` and `DM-GAP-03` for the scoring models — the
models are config-as-data, so ship the tables and leave the weights unapproved.

### 🟢 PB-15 · CAP-03 — agreements
> One agreement per person, addenda for added services, document authored
> **outside** the platform, signing sequence, the two-condition send gate
> (`BR-0213`), lifecycle events. ⚠️ `G26` for document storage.

**Sources:** **J-10, J-11, J-12** (primary) · BRD §8.3 + §6.1 (one agreement, addenda) · `10` §3.5 · `P-37`, `P-38`, `P-42`→`P-44`, `P-56`, `P-64`→`P-67` · `G26`.
**Needs:** PB-14. ⚠️ `G26` for document storage — the agreement document is *authored outside the platform* (BRD §9.2), so the platform links and tracks it, never edits it.

### 🟢 PB-16 · CAP-04 — trainer profile
> **Split mastership** (`P-134`): FAST masters the base profile, Expert Hub the
> accreditation layer. Implement **write-through** (`P-135`) for FAST-mastered
> fields — an edit is queued and shown pending if FAST is unreachable, never
> applied locally. `BR-0408`: file status is internal-only.

**Sources:** **J-13, J-14, J-15, J-23** (primary) · BRD §8.4 + §8.12.4 · `10` §3.6 · `13` + the two `.xlsx` (the base profile already exists in FAST) · `08` §1.2.1–1.2.2 · `P-48`, `P-52`→`P-54`, `P-70`→`P-73`, `P-134`, `P-135`.
**Needs:** PB-15. ⚠️ `Q30` decides whether write-through is deliverable; without a FAST write API the base-profile fields become read-only in Expert Hub.

### 🟢 PB-17 · CAP-05 — assignment through engagement
> Matching, exactly 3 per slot (`BR-0505`), one live offer per slot, the 3-day
> window, per-slot FAST sync, re-routing without limit, material submission with
> no rejection path, withdrawal/cancellation with three distinct end states.

**Sources:** **J-16→J-22** (primary — seven journeys) · BRD §8.5 · `10` §3.7 · `P-74`→`P-113` · `DM-GAP-05`, `DM-GAP-06`.
**Needs:** PB-16. ⚠️ `Q20` (`plan.PlanTaker`) for J-21's enrolment and attendance.

### 🟢 PB-18 · CAP-06 — entitlements
> Read-only. No write operation anywhere (`BR-0601`). `linkage_complete` derived,
> and it gates trainer visibility (`BR-0603`). No totals (§8.6.1).

---

## Phase 5 — Real integrations

**Sources:** BRD §8.6 (no journey — CAP-06 is J-28, undocumented) · `10` §3.8 · `P-124`→`P-128` · `Q27`.
**Needs:** PB-15 (entitlements link through the agreement) and PB-17 (and through the engagement) — `BR-0602`.

### 🔴 PB-19 · INT-01 — Academy identity
**Sources:** BRD §8.12.3 (INT-01), §8.8, `BR-1205` · `02C` §5 · `08` §4.1 · the Expert Hub auth seam already in `app/auth/`.
**Needs:** 🔴 `G4`, the SSO contract.

### 🔴 PB-20 · INT-05 — FAST, both directions
> Inbound plan/programme/schedule/enrolment; outbound accredited trainers,
> `PlanTrainer.TrainerId`, approved material; plus **write-through for the base
> profile**.
>
**Sources:** BRD §8.12.3 (INT-05) + §8.12.4 · **J-16, J-18/F4, J-20/F3, J-21, J-22/F3** · `08` §1.1, §4.2–4.4 · `13` · `frontend/src/apps/expert-hub/shared/fast/` (the provenance map and its test) · `P-129`, `P-134`, `P-135`.
**Needs:** 🔴 `Q30` (a FAST write API), `Q20` (`PlanTaker`), `Q21` (the 19 lookup
value lists), and the replication contract agreed with the FAST team.

### 🔴 PB-21 · INT-02 — MTM ratings
**Sources:** BRD §8.12.3 (INT-02) · **`02D` (authoritative on rating ownership — corrects `02C`)** · **J-21/F6** · `13` (`ImsCommon.Survey.*`) · `10` §3.6 · `P-131` · `DM-GAP-14`.
**Needs:** 🔴 `Q29` (does "without FAST as an intermediary" mean reading
`ImsCommon.Survey` directly?), `DM-GAP-14` (calculation rules).

### 🔴 PB-22 · INT-03 — ERP entitlements
**Sources:** BRD §8.6 + §8.12.3 (INT-03) · `10` §3.8 · `P-127` · `BR-0601`→`BR-0605`, `BR-1206`.
**Needs:** 🔴 `Q27` (the disbursement status list) and an ERP endpoint.

### 🔴 PB-23 · INT-04 — email gateway
**Sources:** BRD §8.7 + §8.12.3 (INT-04) · `10` §3.9 · `BR-0701`, `BR-0702`.
**Needs:** 🔴 gateway credentials and `DM-GAP-08` (so there is something to send).

### 🔴 PB-24 · INT-06 — AI provider
> Provider-agnostic port (`P-132`), OpenAI or Claude behind it, prompt and model
> version stored with each result, **only qualitative answer text sent — no name,
> no national ID, no contact detail, no reference**. Degrades to unavailable
> without blocking a screening decision.
>
**Sources:** BRD §8.2 (`BR-0201`, `BR-0202`) · `08` §2.2 · `10` §3.4 (`AI_ANALYSIS`) · **J-05/F1** (the advisory panel as the applicant-facing behaviour) · `P-132` · `Q6`, `Q28`.
**Needs:** 🔴 `Q28` — the data-protection ruling on sending applicant free-text
outside the Academy's boundary. This blocks **go-live of the feature, not the
build**.

---

## Phase 6 — Cutover

### 🔴 PB-25 · Data migration
**Sources:** BRD §12 (migration strategy) + §9 · `10` in full · `13` · `Q2`, `DM-GAP-15`.
**Needs:** 🔴 `Q2` (the migration strategy) and `DM-GAP-15` (retention).

### 🟢 PB-26 · Backend deployment
> Extend `deploy/expert-hub/` for the API alongside the existing frontend
> container. Same rules: **only Expert Hub is rebuilt**, never a repo-wide
> `docker compose down`, never `docker system prune`.

**Sources:** `DEPLOYMENT.md` · `deploy/expert-hub/` · `CLAUDE.md` deployment scope rules · BRD §10.3 (availability).
**Needs:** PB-08 (the stack decides what is deployed), and at least PB-10–PB-12 running.

### 🟢 PB-27 · End-to-end conformance re-audit
> Re-run `12_JOURNEY_CONFORMANCE_AUDIT.md` against the *implemented* system
> rather than the mocks, and update the score.

---

## The critical path

Everything else waits on these four:

| | Unblocks |
|---|---|
| **PB-08** the stack decision | all of Phase 3–6 |
| **`Q30`** a FAST write API | PB-16, PB-20 — and whether "dual change" is deliverable at all |
| **`DM-GAP-07`** role×permission contents | PB-02's data, PB-06's scoping, PB-10's checks |
| **`Q20`** `plan.PlanTaker` | J-21's enrolment *and* attendance, PB-20 |

**Recommended start: PB-01, then PB-02 and PB-03 in parallel with chasing the
four above.**

**Sources:** **All 24 journeys** · `12` (the audit to re-run) · `11` · `14` · `DECISIONS.md`.
**Needs:** Phases 3–5 complete enough that a journey can be walked end to end against real services.

