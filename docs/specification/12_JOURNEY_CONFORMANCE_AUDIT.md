# 12 — Journey Conformance Audit

**Date:** 2026-08-19, **re-audited 2026-09-02** (BE-20) · **Scope:** every
Expert Hub page built to date, audited against the official journey documents
in this folder.

---

# Re-audit — 2026-09-02 (BE-20)

**Why it was re-run.** The audit below was written on 2026-08-19, when every
data provider in the product was a mock. Twelve backend increments have shipped
since (BE-01 → BE-12), and **21 of the 22 modules now run on a real API** — 86
named endpoints across the twelve capabilities, with only the identity resolver
still on demo data. An audit of the mocks was measuring something that no
longer exists.

**What the re-audit asks.** Not "does the page match the journey" — that was
answered and fixed — but **"does the implemented system still behave the way
the audit said the page did"**. Three things can go wrong between a conformant
mock and a conformant system: a rule that was a UI convention loses its
enforcement, a rule that was untestable becomes testable and turns out false,
and a gap that was invisible while everything was fake becomes visible.

## R.1 Rules that got *stronger*, not just re-implemented

The most useful finding is that several acceptance criteria stopped depending
on anyone remembering them. Each of these was a convention on 19 Aug and is now
a property of a type or a schema:

| Rule | Was | Is now |
|---|---|---|
| `BR-0201`/`BR-0202` — AI never touches the official score | A UI that displayed them apart | The scoring function **has no parameter** for an analysis, and INT-06's channel writes `AI_ANALYSIS` and nothing else |
| `BR-0601` — an entitlement is never entered by hand | No form existed | The writable DbSets are `internal` to the infrastructure assembly: **the API project cannot compile a write** |
| `BR-0603` — an unlinked entitlement is hidden from the trainer | A filter | The trainer DTO has a **private constructor** and non-nullable linkage fields, so the record is unconstructible |
| `BR-0505` — exactly three candidates per required person | One validated form | Refused at any other size on **both** the engine and the manual path |
| J-18/F1/AC-1 — the system sends the offer | A button nobody wired | **There is no send-offer endpoint**; an offer is created when a slot has an approved candidate whose turn came |
| §8.9.1 — analytics owns no source data | A read-only page | A test asserts the **change tracker is empty** after a full dashboard read |

Nothing in this table needs re-checking at the next audit, which is the point
of encoding a rule rather than obeying it.

## R.2 Conflicts and gaps the implementation found

Four of these did not exist as findings before the code was written, because a
mock can satisfy a rule it does not really implement.

| | Finding | Journey effect | Status |
|---|---|---|---|
| **1** | **`Q39` — the ERP payload names no programme.** `BR-0602`'s chain is PO → active agreement → *specific engagement*, and the agreed field list has no programme reference at all | **J-28's trainer view can never show a record.** `BR-0603` hides an incomplete chain, so every entitlement stays staff-visible and trainer-invisible — permanently, not temporarily | ⛔ **Conflict.** Raised as `Q39`; no heuristic was invented to fill it |
| **2** | **`Q26` — two of four dashboards have no defined metrics** | `F-0903` and `F-0904` ship **named and empty**. The employee's three tiles are built because §8.9 names them | ⚠️ **Blocked**, deliberately visible |
| **3** | **`Q20` — `plan.PlanTaker` was never supplied** | J-21/F3/AC-3's enrolment list and F4's attendance layer report **unavailable with the gap named** — never as zeroes, which would read as "nobody enrolled" | ⚠️ **Blocked** |
| **4** | **J-16's three service matrices are blank** | Only the trainer path can raise an assignment request. Consultant, content developer and question writer cannot — **and J-20's content route therefore has no reachable origin** | ⚠️ **Blocked** at the source document |
| **5** | **A 403 rendered as "failed to load"** across the internal list and console pages | Journeys refuse a person without permission; the UI told them the system was broken, and sent them to the wrong person for help. It caused one false bug report on the testing server | ✅ **Fixed 2026-09-02** — a denial now says so and drops its retry button |

## R.3 Two journeys are now contradicted by owner rulings

Both were amended in place on 2026-09-02 rather than left to be re-derived:

- **`J-21/F6/AC-2`** says evaluations reach the platform «دون فاست كوسيط».
  Superseded by `P-200`: MTM's data is already on FAST, so **FAST is the
  carrier** and INT-02 is not a separate connection.
- **`J-01`** names **نفاذ / Nafath** throughout. Superseded by `P-201`:
  verification is **يقين / Yaqeen**, reached through FAST. The product's
  identity screens were renamed the same day.

## R.4 Deviations from the design documents, recorded rather than built

Two sets of tables in `10_DATABASE_DESIGN` are deliberately **not** built, and
both are named at the point of deviation so a future reader does not think they
were forgotten:

- **`EXT_FAST_*`** (PROGRAM, PLAN, SCHEDULE_DAY, PLAN_TAKER, PLAN_TRAINER) —
  there is no FAST plan read, so an assignment request carries the centre's own
  entered form and `pulled` serves null.
- **`REPORT_DEFINITION` / `REPORT_RUN`** — CAP-09's export half (`F-0905`) has
  no service contract, no screen and no report definitions. A table with no
  reader and no writer is the dead entry `P-123` warns about.

## R.5 The verdict

**No conformance regression was introduced by the backend build.** Every
finding above is either a rule that got stronger, a gap whose source document
is blank, or an input nobody has supplied — and one UI defect, now fixed.

The conclusion that matters for planning is the same one the open-items review
reached from the other direction: **conformance is no longer limited by the
code.** Of the five findings in R.2, four are waiting on a document or a
dataset from outside the team, and the fifth was a two-hour fix.

**Next re-audit:** after the first real integration lands (INT-03 or INT-05),
because that is the next event that can change behaviour without changing a
line of Expert Hub code.

---

*The original 2026-08-19 audit follows, unchanged.*

---

This is the **complete** picture. `11_JOURNEY_IMPLEMENTATION_MAP` §3b tracked the
conformance *fixes* already applied; this document audits everything, including
the pages built directly from journeys, and states what is still missing.

Terminology, used strictly:

| Term | Meaning |
|---|---|
| **Conflict** | Shipped behaviour that **contradicts** an approved acceptance criterion. Fix first. |
| **Gap** | Required behaviour that is **absent**. Build it. |
| **Blocked** | Required, but a named input (`DM-GAP-*` / `G*`) is missing. Structure built, rule not invented. |
| **Clean** | Audited against the ACs and conformant. |

---

## 0. The headline

**The catalogue has 28 journeys. Only 24 have documents.**

`Journey Catalog` lists **J-01 → J-28**. This folder contains journey documents
for **J-01 → J-24 only**. Four catalogued journeys have no specification at all:

| ID | Journey | Interface | Status |
|---|---|---|---|
| **J-25** | Operational Notifications (`CAP-07`) | All interfaces | **No document** |
| **J-26** | Roles, Permissions & Delegation | Internal Dashboard | **No document** |
| **J-27** | Reporting & Dashboards | Internal Dashboard | **No document** |
| **J-28** | Entitlements Viewing (from ERP) | Trainer Portal / Internal | **No document** |

This matters beyond bookkeeping. **J-25 is referenced by name inside the
journeys we do have** — J-06/F1/AC-4 ("reminders sent per the Notification
Matrix (CAP-07)"), J-03/F3/AC-6 and AC-7 (notify on approval; notify on
rejection *without the reason*), J-11/F1/AC-1 (the applicant is notified the
agreement arrived). Every one of those is currently a dangling reference: the
journey says "notify", and no document says what the notification contains, in
which language, or on what schedule.

**Recommendation:** request J-25 → J-28 before the next build increment. J-25 in
particular blocks a correct implementation of at least five journeys already
built or planned. → tracked as `Q17` in `TODO.md`.

---

## 1. Coverage by journey

24 documented journeys. Interface key: **TP** = Trainer Portal, **INT** =
Internal Dashboard, **PUB** = Public, **SYS** = automatic.

| Journey | Interface | Built? | Where | Conformance |
|---|---|---|---|---|
| **J-01** Onboarding & Application Submission | TP/INT | **Yes** | EH-TP-05 + `features/identity` | ✅ Form conformed · ✅ Identity layer + guest path built 2026-08-19 (P-60–P-63) |
| **J-02** Internal Nomination | INT | Partial | EH-INT-02 inbox + `features/identity` | ✅ F1, F2, **F4** (activation, built 2026-08-20) · ❌ F3 invitation email needs J-25 |
| **J-03** Add Service to Approved Trainer | TP/INT | **Yes** | EH-TP-06 + EH-INT-02b `ServiceRequests*` | ✅ F1 conformed, F2+F3 built 2026-08-19 (P-56–P-59) · AC-6/AC-7 notifications need J-25 |
| **J-04** Speaker Record Management | INT | **No** | — | 🚫 Blocked — Speaker Fields matrix not supplied |
| **J-05** Screening & Initial Decision | INT | **Yes** | EH-INT-03 `ScreeningDetailPage` | ✅ Built from the journey |
| **J-06** Interview Scheduling & Confirmation | INT/TP | **Yes** | Staff half in `features/interviews`; applicant half in EH-TP-03 | ✅ Applicant half built 2026-08-19 (P-49–P-51) · F2 Teams blocked |
| **J-07** Interview Evaluation | INT | **Yes** | EH-INT-04 `InterviewEvaluationPage` | ✅ Built from the journey |
| **J-08** Interview Exemption | INT | **Yes** | EH-INT-03 + EH-TP-03 timeline | ✅ Conformed 2026-08-19 (P-45) |
| **J-09** Approval Committee Decision | INT | **Yes** | EH-INT-05 `CommitteeDecisionPage` | ✅ Built from the journey |
| **J-10** Agreement Preparation | INT | **Yes** | EH-INT-06a `AgreementPreparationPage` | ✅ Built from the journey |
| **J-11** Applicant Signing & Activation | TP | **Yes** | EH-TP-03 detail page | ✅ Conformed 2026-08-19 (P-42–P-44) |
| **J-12** Agreement Lifecycle Management | INT/TP | **Yes** | EH-INT-06 `features/agreementLifecycle` | ✅ Built 2026-08-20 (P-64–P-67) · F1's *alerts* need J-25 |
| **J-13** Trainer Profile Creation | SYS | N/A (server) | — | ✅ AC-10 verified on EH-TP-04 (P-48) |
| **J-14** Trainer Self-Service Profile Update | TP | **Yes** | EH-TP-04 `MyProfilePage` | ✅ Conformed 2026-08-19 (P-52–P-55) · attachments open |
| **J-15** Trainer Search & Unified Profile Review | INT | **Yes** | EH-INT-07/08 `features/trainerSearch` | ✅ Built 2026-08-20 (P-70–P-73) · domain filter needs `Q16`; card fields need `Q19` |
| **J-16** Assignment Request Creation | INT | **Yes** | EH-INT-09 `features/assignments` | ✅ Trainer path built 2026-08-20 (P-74–P-78) · the other 3 services blocked on their matrices |
| **J-17** Matching & Nomination | INT | **Yes** | EH-INT-09 matching workspace | ✅ Built 2026-08-20 (P-79–P-83) · weights are `DM-GAP-05`; non-Trainer matching undefined |
| **J-18** Assignment Offer Handling | TP/INT | **Yes** | EH-TP-07 + the tracking panel on EH-INT-09 | ✅ Built 2026-08-20 (P-84–P-90) · notifications are `J-25` |
| **J-19** Re-routing After Offer Rejection | INT | **Yes** | EH-INT-09d | ✅ Built 2026-08-20 (P-91–P-95) · notifications are `J-25` |
| **J-20** Training Material Submission | TP/INT | **Yes** | EH-TP-08 + EH-INT-10 | ✅ Built 2026-08-20 (P-96–P-101) · no SLA exists (open item 1); the content path's origin needs J-16 |
| **J-21** Engagement Execution Follow-up | TP | **Yes** | EH-TP-07c | ✅ Built 2026-08-20 (P-102–P-107) · attendance FAST field name pending (open item 1) |
| **J-22** Withdrawal / Cancellation | TP/INT | **Yes** | EH-TP-07c + EH-INT-09c | ✅ Built 2026-08-20 (P-108–P-113) · notifications are `J-25` |
| **J-23** Public Visibility Consent | TP | **Yes** | EH-TP-04 consent toggle | ✅ See §3 |
| **J-24** Public Directory Browsing | PUB | **Yes** | EH-PUB-02/03 | ✅ Conformed 2026-08-19 (P-40/P-41) |

**Score:** 22 journeys complete · 1 partial (J-02/F3 only, blocked on J-25) · 1 blocked on inputs (J-04, Speaker Fields matrix).

**Every documented journey that can be built, is built.** J-01–J-24 are complete except J-02/F3 (needs `J-25`'s Notification Matrix) and J-04 (needs the Speaker Fields matrix). J-25–J-28 remain undocumented — `Q17`.
The **accreditation spine** (J-01 → J-11) and the **assignment half** (J-12,
J-15 → J-22) are both continuous and walkable end to end. What stops the product
being whole is not code: it is `J-25`'s Notification Matrix, J-04's Speaker
Fields matrix, and J-16's three empty service matrices.

---

## 2. Open findings

### 2.1 ~~EH-TP-03 — the applicant's half of J-06 is incomplete~~ · ✅ **Closed 2026-08-19**

The staff side of J-06 (propose slots, reschedule, interview ticket) was built
with J-07. The **applicant** side was one action wide — "confirm a slot" — which
left an applicant whom no proposed time suited with no way forward. Built out
2026-08-19; the row is kept for the record and for the two items still blocked.

| AC | Requirement | Status |
|---|---|---|
| F1/AC-2 | The applicant confirms their slot from the portal | ✅ Built |
| **F1/AC-3** / F4/AC-1 | Request a reschedule *instead of* selecting | ✅ **Fixed 2026-08-19** — offered alongside the slot picker, not behind it |
| F4/AC-2 | Request a reschedule *after* confirming | ✅ Built |
| F4/AC-6 | The interview ticket number survives a reschedule | ✅ Built + tested |
| **F1/AC-4** | 3 business days to select, with reminders | ⚠️ **Half** — the deadline is now shown (P-J4 promoted to `shared/`, P-51). **Reminders belong to the missing J-25.** |
| F2 | Teams meeting auto-created on confirmation; ticket issued | 🚫 Blocked — the Teams API is not in the `CAP-12` integration table. Surfaced as data, never called from the frontend. |
| F3/AC-2 | A committee RSVP never affects whether the interview happens | ✅ Structural — no RSVP field exists in the trainer contract |

**Verdict:** closed 2026-08-19, except the two items that depend on inputs we do
not have — the Teams integration (absent from `CAP-12`) and the notification
matrix (the missing J-25).

### 2.2 ~~EH-TP-04 — the profile is a separate form~~ · ✅ **Closed 2026-08-19**

J-14/F1/AC-1 (`BR-0404`): *"editing uses the **exact same fields/sections** as
the original application form — **no separate update form is created**."*

EH-TP-04 had its own hand-built model: `EditableProfileFields` with three fields
(`bio`, `phone`, `city`) plus a `FastFieldDto[]` list. It now carries the *same*
`ApplicationFormSchemaDto` EH-TP-05 renders, through the same
`DynamicFieldRenderer` and the same validation (P-52/P-53).

| AC | Requirement | Status |
|---|---|---|
| **F1/AC-1** | Same fields/sections as the application form; no separate form | ✅ **Fixed 2026-08-19** — the profile renders `profile.formSchema`, which *is* the application schema |
| F1/AC-2 | Personal, professional, certificates, attachments self-updatable | ⚠️ **Partial** — personal/professional ✅, certificates ✅; **general attachments still ❌** |
| F1/AC-3 | Attachment rules from J-01 apply (1 MB; PDF/DOC/DOCX or JPG/PNG) | ⬜ Open with AC-2's attachments |
| F1/AC-4 | Saves reflect immediately, no re-application | ✅ |
| F2/AC-1 | Locked fields **visible** but read-only: Classification, Evaluations, **Contract/Agreement Status** | ✅ **Fixed** — all three render together in `LockedFactsSection`; the agreement status is now shown (P-54) |

Two notes on F2:

- The matrix is marked *"pending final confirmation"*, so the third row is a
  soft requirement — but it is currently *absent*, not *deliberately withheld*.
- **"Contract/Agreement Status" is not "Trainer Profile Status".** J-13/AC-10
  makes the *profile* status internal-only (verified clean, P-48). The agreement
  status is a different field and J-14/F2 says the trainer should see it,
  read-only. Do not conflate them when closing this.

**Verdict:** closed 2026-08-19 apart from **general attachment self-update**
(F1/AC-2 + AC-3), which is the one remaining piece. Certificates already upload
and remove; the rest of the J-01 attachment rules need the same treatment, and
production upload stays blocked on `G26`/`G27` either way.

The agreement status is served by the mock until **J-12** is built. When it
lands, it must produce the union already declared in `profile.types.ts` — not a
new one.

### 2.3 ~~The mock application schema invents a `bio` field~~ · ✅ **Closed 2026-08-19**

`BR-1004` **corrected** (quoted in J-24) says the public profile has *"no
free-text bio field, **since none exists**"*. That clause is a statement about
the underlying trainer record: there is no bio anywhere.

`mockApplicationSchema.ts` nevertheless defines a `bio` field, and
`EditableProfileFields.bio` carries it into the profile. This was invented to
fill `DM-GAP-01` (the Application Fields by Service matrix, whose cells in J-01
are still literally `?`), and it was invented into a field the business has since
said does not exist.

The public leak was already closed (P-40) — the bio no longer reaches
EH-PUB-03. What remains is that the *form* still asks for it.

**Closed 2026-08-19** (P-55): `bio` is gone from the schema, and
`EditableProfileFields` no longer exists. The mock draft that demonstrated
resume-with-values now carries a real content-developer field instead, so the
walkthrough still proves service-scoped values are restored.

### 2.4 ~~J-03 is only one third built~~ · ✅ **Closed 2026-08-19**

EH-TP-06 covered **F1** only; the request routed into a mock that returned a
reference number and nothing received it. **F2** (review with trainer context)
and **F3** (the direct administrative decision + mandatory addendum) are now
built as **EH-INT-02b** — a new screen, since `04_PAGE_SPECIFICATIONS` never
modelled the internal side of J-03 (P-58).

| AC | Requirement | Status |
|---|---|---|
| F2/AC-1 | The request viewed **with** the trainer's full approved profile | ✅ `TrainerContextCard` renders exactly the five things the AC enumerates |
| F2/AC-2 | Search/filter by trainer name, requested service, status | ✅ Exactly those three dimensions |
| F3/AC-1 | Routes straight to a decision-maker — no screening, no interview | ✅ Structural (two-member union) **and stated on the page** (P-59) |
| F3/AC-2 | Approve or reject | ✅ |
| F3/AC-3 | Rejection needs a reason from the list, or free text under "Other" | ✅ Reasons **served as configuration**, not imported (P-57) |
| **F3/AC-4** | Approval **cannot be finalized** until the addendum is uploaded | ✅ The addendum is a *required field* of the approve input — the impossible state cannot be constructed (P-56) |
| F3/AC-5 | Approval reflects everywhere the trainer's services are shown | ✅ The service joins the trainer's scope in the same write |
| F3/AC-6 · AC-7 | The trainer is notified — **without** the reason on rejection | 🚫 **Blocked on the missing J-25.** The reason is marked internal-only on the contract and labelled as such in the UI, so whatever surface is built cannot claim it was unmarked |

### 2.5 J-02 — F3 remains, and it needs J-25 · **Blocked**

**F1** works and always did: the inbox nominates through the *same* J-01 form
(`BR-0109`), correct by construction because both consume one schema.

**F2** says the "same Identity Linking rules from J-01 apply, triggered by staff
submission instead of applicant self-entry" — so it is satisfied by the same
`identityService` and the same five outcomes built for J-01 (P-60), applied at a
different trigger point. Nothing separate to model.

**F4** (nominee account activation and portal access) was **missing from earlier
versions of this audit** — J-02 has four features and only three were ever
tracked. Built 2026-08-20 (P-68/P-69): a public activation route with the three
routes AC-1/AC-3 define, reusing J-01's Nafath verification so AC-2 holds by
construction, and granting access without consulting the screening stage (AC-4).

**F3** (the invitation email that carries the activation link) is a notification,
i.e. the **missing J-25**. It is now the only part of J-02 outstanding.

⚠️ J-02/F3/AC-2 cites "the Notification Matrix (**J-26**)", but J-26 in the
catalogue is *Roles, Permissions & Delegation*; the Notification Matrix is
**J-25**. The journey cites the wrong ID — worth confirming when requesting them
(`Q17`).

### 2.6 Notifications are referenced but unspecified · **Blocked**

Every "the applicant is notified" clause across J-03, J-06, J-11, J-18, J-22
points at `CAP-07` / the Notification Matrix, i.e. the **missing J-25**. One rule
is already visible and non-obvious: **J-03/F3/AC-7 — the trainer is notified of a
rejection *without* the reason**, which is the opposite of EH-TP-03's behaviour
for an application rejection (where the reason is shown deliberately). These are
different rejections at different stages, but the contrast is exactly the kind of
detail J-25 needs to settle rather than each page guessing.

---

## 3. Pages audited clean

| Page | Journeys | Notes |
|---|---|---|
| **EH-PUB-01** Landing | — | Public entry point. No journey governs it; marketing composition only. |
| **EH-PUB-02/03** Directory + Profile | J-24 | Conformed 2026-08-19. Public field list is exhaustive and enforced by the DTO shape (P-40/P-41). |
| **EH-TP-01** Portal Home | — | Portal shell + navigation. No journey governs it. |
| **EH-TP-02** My Applications | J-01 (tracking), J-11/F1/AC-1 | The applicant finds the agreement under "My Applications" as AC-1 requires. |
| **EH-TP-03** Application Details | J-11, J-08, J-06 (partial) | J-11 + J-08 conformed 2026-08-19. J-06 applicant half open — §2.1. |
| **EH-TP-04** My Profile | J-13/AC-10, J-23 | AC-10 verified clean (P-48). J-23 clean — see below. J-14 open — §2.2. |
| **EH-TP-05** New Application | J-01/F1 | Six sections, approved attachment table, approved-trainer block. Identity layer open. |
| **EH-TP-06** Add Service | J-03/F1 | Conformed 2026-08-19 (P-46/P-47). |
| **EH-INT-01** Dashboard | — | Derived metric tiles. J-27 (reporting) has no document. |
| **EH-INT-06** Agreements | J-12 | Expiry milestones, direct renewal, suspend/reactivate/end, template management. Built 2026-08-20. |
| **EH-INT-07/08** Trainer database + unified profile | J-15 | Seven-dimension search, the whole profile in one screen, identity card. Built 2026-08-20. |
| **EH-INT-09** Assignment requests | J-16 | Service-type branch, FAST plan selection (pull only), auto-pulled data, headcount. Built 2026-08-20. |
| **EH-INT-09** Matching workspace | J-17 | Engine + manual path, exclusions with reasons, pool of exactly 3/slot sent as one batch, per-candidate decision and ranking. Built 2026-08-20. |
| **EH-TP-07** My Engagements | J-18 | Offers awaiting an answer with the full J-16 plan detail and the 3-day countdown, accept/reject, confirmed engagements with the training-material status. Built 2026-08-20. |
| **EH-INT-09** Offer tracking | J-18 | Per-slot live offer, ranked backups, response history distinguishing rejection from expiry, per-slot FAST state, exhausted-slot call-out (J-19's trigger). Built 2026-08-20. |
| **EH-INT-09d** Slot re-routing | J-19 | Slot-scoped re-match (engine + manual), the confirmed sibling shown and untouchable, prior refusers listed and re-includable, fresh J-17/F4 approval cycle, no escalation. Built 2026-08-20. |
| **EH-TP-08** Material & content | J-20 | Both submission paths on one page, each stating why its slot is open; J-01's own attachment validation; the coordinator's note shown beside the reopened upload. Built 2026-08-20. |
| **EH-INT-10** Material & content review | J-20 | One queue for both paths, approve-or-ask-again with a mandatory note, the FAST sync block only on the path that has one. Built 2026-08-20. |
| **EH-TP-07c** Engagement follow-up | J-21 | Schedule-derived lifecycle with no way to complete or reopen one, session link *or* venue, names-only enrolment with the attendance layer on the same rows, MTM evaluations independent of completion. Built 2026-08-20. |
| **EH-TP-07c / EH-INT-09c** Withdrawal & de-linking | J-22 | Trainer withdrawal on the engagement page and staff de-linking on the confirmed slot, each with its own closed reason list; a plan cancellation arrives already terminated because nothing here can cause one. Built 2026-08-20. |
| **EH-INT-02** Inbox | J-02/F1, J-05 entry | Nominates through the same J-01 form (`BR-0109`). |
| **EH-INT-03/04/05/06a** | J-05, J-08, J-07, J-09, J-10 | Built directly from the journeys. |

**J-23 in detail** — all four ACs hold, and three of them hold *structurally*
rather than by UI convention:

| AC | Requirement | Where it is guaranteed |
|---|---|---|
| AC-1 | No trainer appears without recorded consent | `mockDirectoryProvider` filters on consent before the projection is built; the flag never leaves that module |
| AC-2 | Grant or withdraw at any time | EH-TP-04 consent toggle, both directions, with a confirmation dialog |
| AC-3 | Withdrawal removes them immediately, **deleting no core data** | Consent is a boolean on the profile; the directory reads a projection. Nothing is deleted because nothing is copied. |
| AC-4 | Re-granting restores them immediately | Same mechanism, inverted — no separate re-publish path exists to go wrong |

---

## 4. What to do next, in order

1. **Request J-25 → J-28.** Four catalogued journeys with no document, one of
   which (J-25) is a dangling dependency of five built journeys. Cheapest,
   highest-leverage action available, and it is not an engineering task.
2. ~~J-06/F1/AC-3 — the applicant's reschedule request~~ — ✅ **done 2026-08-19**.
3. ~~J-14 profile refactor onto the J-01 schema, folding in the `bio` removal~~ —
   ✅ **done 2026-08-19**. Remaining: general attachment self-update (F1/AC-2).
4. ~~J-03/F2+F3 — the internal side of add-service~~ — ✅ **done 2026-08-19**.
5. ~~J-01/J-02 identity linking + guest path~~ — ✅ **done 2026-08-19**. J-02/F3
   (the activation invitation) is all that remains, and it needs J-25.
6. ~~J-12 Agreement Lifecycle~~ — ✅ **done 2026-08-20**. EH-TP-04's agreement
   status now has a real producer; the two share one union (P-65).
7. ~~J-15 Trainer Search & Unified Profile~~ — ✅ **done 2026-08-20**.
8. ~~J-16 Assignment Request Creation~~ — ✅ **done 2026-08-20** (Trainer path;
   the other three services are blocked on their own matrices).
9. ~~J-17 Matching & Nomination~~ — ✅ **done 2026-08-20**.
10. ~~J-18 Assignment Offer Handling & Response Management~~ — ✅ **done
    2026-08-20**. The exhausted-slot state it produces is J-19's trigger.
11. ~~J-19 Re-routing After Offer Rejection~~ — ✅ **done 2026-08-20**.
12. ~~J-20 Training Material & Content Submission~~ — ✅ **done 2026-08-20**.
13. ~~J-21 Engagement Execution Follow-up~~ — ✅ **done 2026-08-20**. J-16's
    `meetingUrl`, carried since row 11 and deliberately unsurfaced, finally has
    a page that may read it.
14. ~~J-22 Withdrawal / Cancellation~~ — ✅ **done 2026-08-20**. The last documented journey.

**The journey programme is finished.** What remains is not implementation but inputs: `J-25`–`J-28` have no documents (`Q17`), J-04 has no Speaker Fields matrix, J-16's three non-Trainer service matrices are empty, and `DM-GAP-01`, `Q16`, `Q19`, `G26`/`G27` and the Teams API are open. Each is named at the point it bites, in code and on screen.

**Every partial journey is now closed except for work that genuinely depends on
a missing document.** What remains outstanding across the whole product is
`Q17`'s four undocumented journeys (J-25–J-28), the Speaker Fields matrix
(J-04), the Teams integration (J-06/F2), `DM-GAP-01`, `Q16`'s domain taxonomy,
and general attachment self-update on EH-TP-04.

Items blocked on external inputs, unchanged: `G4` (SSO contract → J-01/J-02
identity layer), `DM-GAP-01` (Application Fields matrix), Speaker Fields matrix
(J-04), Teams API (J-06/F2), `G26`/`G27` (document storage + antivirus).

---

## 5. How this audit was produced

Every row was checked by reading the journey document and the implementing code,
not from memory or from earlier summaries. Where a rule is satisfied
**structurally** — because the contract has no shape for the forbidden data —
that is stated explicitly, because it is a stronger guarantee than a UI check and
it is what makes several of these rows durable rather than momentary.

Findings that were *verified clean* are listed alongside findings that were not.
An audit that reports only problems gives no evidence it looked at anything else.
