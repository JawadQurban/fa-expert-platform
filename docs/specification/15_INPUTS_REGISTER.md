# 15 — Inputs register: everything the project is waiting on

**Status:** 🟢 Live — first pass 2026-08-27, revised the same day after CAP-07
and CAP-08 shipped. Both now have **screens waiting for their contents**, which
changes what asks 1 and 5 are for: the place to enter the answer exists. Supersedes `TODO.md` as the place to
*ask* for things; `TODO.md` remains the working list.

> **Why this exists.** The project's binding constraint is no longer engineering.
> 22 of 24 documented journeys are built and the backend is fully designed —
> what is left waits on inputs that were scattered across 46 bullets, addressed
> to nobody in particular. This register asks each one **of a named party**, says
> what it blocks, and how big the ask is.

**How to read a row.** *Ask* = what to request, in the form it is useful.
*Blocks* = what cannot proceed. *Size* = ⚡ one ruling · 📋 a matrix or table ·
🔌 an API or dataset · 📄 a document.

---

## 0. The five that unblock the most

Chase these before anything else. Each one releases work that is otherwise
completely stopped.

| | Ask | Party | Releases |
|---|---|---|---|
| **1** | **`DM-GAP-07`** — the role × permission matrix: for each of the **6 roles**, which of the **58 feature permissions** it holds and at which data scope (كل البيانات / بياناته فقط / نطاق مركزه) | Business Analyst + PO | CAP-08 service, every authorization check, the *منسق مركز* scoping J-17 already implies, and the four role-scoped dashboards. ✅ **The screen now exists** (EH-INT-14, 2026-08-27) — the grid ships empty and marked unapproved, so the answer can be entered rather than filed |
| **2** | **`Q30`** — does FAST expose a **write API**, and can it notify on change? | FAST / IMS team | Whether "dual change" on the trainer profile is deliverable **at all** (`P-135`). A *no* is fine — it makes those fields read-only in Expert Hub — but it must be decided, not discovered |
| **3** | ~~Stack decision~~ → **hosting topology, CI/CD path, and which .NET LTS the Academy hosts** | Infrastructure + PO | ✅ **The stack itself was decided 2026-08-27** — ASP.NET Core + EF Core + SQL Server (`P-162`, [17_STACK_DECISION.md](17_STACK_DECISION.md)) — and the backend is scaffolded and building, so Phases 3–5 can proceed. The remainder blocks **deployment and BE-21** (the `net9.0` → LTS retarget), not implementation |
| **4** | **`Q20`** — the `plan.PlanTaker` table | FAST / IMS team | J-21's enrolment list **and** its attendance layer — two open items, one table |
| **5** | **`DM-GAP-08` + the message wording** — for each of the **20 catalogued events**: which audience receives it, and the **approved bilingual body** of its template | Business Analyst + PO + whoever owns official Academy wording | Every notification in the product. ✅ **The screens now exist** (EH-INT-12, 2026-08-27): the 20 events are catalogued with their journey citation and each row shows what that journey says about who is notified — so this is now *confirm and enter*, not *derive from scratch*. `Q17`'s original ask (J-25 as a journey) is **no longer blocking**: §8.7 proved sufficient to build from |

---

### What shipping CAP-07 and CAP-08 changed about this register

Three asks moved from *blocking* to *fill in the blank*, and two are new:

| Ask | Was | Now |
|---|---|---|
| `DM-GAP-07` role×permission contents | No screen; the answer had nowhere to go | Grid built and marked unapproved — **enter it** |
| `DM-GAP-08` notification routing | No screen, no event list | 20 events catalogued **with citations**; routing empty — **confirm and enter** |
| `DM-GAP-10` SLA durations | Assumed entirely missing | **3 of 6 were already approved in journeys** and are seeded; 3 remain open |
| `Q32` **new** | — | What does `US-0705`'s «أعالجها» require? A resend needs three answers before it can be built |
| `Q33` **new** | — | The template **placeholder vocabulary**, and the approved bilingual message wording |

---

## 1. Product Owner — business rulings

Each is a decision, not a document. Most take minutes once the right person
looks at them.

| | Ask | Blocks | Size |
|---|---|---|---|
| `Q16` | **Which pair is the public "domain" and "specialization"?** Three candidates exist: `Education.Specialization` + `GeneralSpecialization`; `AreasOfTraining.FeildId`; `AreasOfCooperation.CooperationAreaId`. J-24 needs exactly two public values | The public profile renders specialization only — no domain has been invented | ⚡ |
| `Q18` | **Can a suspended agreement be reactivated, and by which role?** J-12/F3 says staff "can suspend it or end it" and is silent on lifting it | Reactivation ships today on the page spec's authority (`P-67`), flagged as unconfirmed | ⚡ |
| `Q19` | **Identity Card, two rows.** Is one `SocialMediaUrl` the intended field where the matrix says "accounts" (plural)? Is *Related Fields* = `AreasOfTraining`? | Both rows render as explicitly unavailable on EH-INT-08 | ⚡ |
| `Q25` | **Which of CAP-08's six roles are in scope for this release?** The app has two personas; four internal roles are collapsed into one | Role scoping, and whether *منسق مركز* is enforced now | ⚡ |
| `Q22` | **How is service accreditation represented in FAST?** It has three `Expert*` flags; we accredit four services and only *question writer* lines up | The outbound half of INT-05 | ⚡ *(with FAST)* |
| `Q7` | **Confirm there is no in-platform entitlement objection path** in this release (`BR-0605` says so — confirm it is intended, not an omission) | Nothing — built as specified. Confirmation only | ⚡ |
| `Q10` | **Primary language** — captured at application? What is the default/fallback? | A field on the application form | ⚡ |
| `Q11` | **Committee and internal-approver composition** — fixed, or per request? | J-09/J-10 sequence formation ships as per-request with reusable templates | ⚡ |
| `Q12` | **Who owns the matching weights, and what is the tie-break rule?** | `DM-GAP-05`; the model is served as unapproved configuration today | ⚡ |
| `Q1` | **Success metrics** — BRD §9's own section is empty | Nothing technical. Needed to judge whether the platform worked | ⚡ |
| `Q4` | **CAP-11 (professional community)** — scope and timeline | Nothing. Deferred in the BRD with no approved entities | ⚡ |
| `Q2` | **Data migration** — is there existing trainer data to bring in, and from where? | Cutover (playbook PB-25) | 📄 |

---

## 2. Business Analyst — matrices and documents

These are the `DM-GAP` inputs BRD §9.4 itself lists as required to complete the
data model, plus the three matrices the journeys leave pending.

| | Ask | Blocks | Size |
|---|---|---|---|
| **`DM-GAP-07`** | **Role × permission matrix** — per role: which functions, and what data scope (all / own / centre) | ⭐ See §0. The single highest-value document | 📋 |
| **`DM-GAP-08`** | **Notification matrix** — event → recipient → channel → template → timing. The event list can be seeded from eight built journeys; what is missing is who and when | Every "the applicant is notified" clause in J-03, J-06, J-11, J-12, J-18, J-19, J-21, J-22 | 📋 |
| **`DM-GAP-10`** | **Operational values** — SLAs, deadlines, validity periods, across all twelve capabilities | The central SLA console; today every countdown is served per feature with provisional values | 📋 |
| ~~`DM-GAP-01`~~ | ✅ **Supplied 2026-08-30** and served (`P-172`). What remains is narrower: the unsupplied dropdown value lists, the ID-type routing, the workbook's own needs-confirmation rows, and repeatable entries (`P-173`) | The form serves the owner's map; residual lists are edits to `applicationSchema.ts` | 📋 |
| **`DM-GAP-02`** | **Screening criteria** — criteria, weights, scores, minimum acceptance per service | Screening scores are computed from a served, unapproved model | 📋 |
| **`DM-GAP-03`** | **Interview evaluation model** — axes, scores, final-score computation | Same, for interviews | 📋 |
| **`DM-GAP-05`** | **Matching matrix** — factors, weights, tie-breaking | Ranking is real; the weights are not approved | 📋 |
| ~~`DM-GAP-06`~~ | ✅ **Supplied 2026-08-30** and built (`P-174`) — the centre form replaced J-16's capture. Remaining (`P-175`): dropdown values, real lookups, the request-type→service mapping ruling, headcount | The five request types are live; residuals are data/config | 📋 |
| **`DM-GAP-09`** | **KPIs and reports** — metrics, sources, aggregation, consumer | Three of four role dashboards. `F-0902` names the employee's three tiles; the rest are undefined | 📋 |
| **`DM-GAP-14`** | **Trainee evaluation** — level, calculation method, programme/trainer relation | The calculated rating indicators Expert Hub owns (`02D`) | 📋 |
| **`DM-GAP-15`** | **Data retention** — retention periods, archival and hiding rules | Retention across every entity; nothing is assumed today | 📋 |
| **`Q17`** | **J-25, J-26, J-27, J-28** as journey documents — **or** a ruling that BRD §8.7/§8.8/§8.9/§8.6 suffices. ⚠️ Corrected: these were called *blocked*; the BRD specifies all four at capability level and CAP-06 has already been built from it | J-02/F3 and every notification clause | 📄 |
| **J-04** | **Speaker Fields matrix** — marked *pending upload* in the journey itself | J-04 entirely. Nothing is invented in its place | 📋 |
| **J-16** | **Request matrices for Consultant, Content Developer, Question Writer** — all three are blank and marked pending | Those three services cannot have assignment requests, which is also why J-20's content path has no reachable origin | 📋 |
| `Q8` | **Confirm the provisional (\*) SLA/NFR values** — screening 5d, interview 2d, committee 3d, signature 10d, uptime 99.5%, response 3s, dormancy 6mo | They ship as provisional and are marked as such | ⚡ |
| `Q9` | **Numbering gaps** — are they intentional? `BR-0604` does not exist in §8.6.5 (0601, 0602, 0603, **0605**); the same pattern appears in US and DM-GAP ids | Nothing. But a missing rule and a skipped number look identical | ⚡ |
| `Q26` | **CAP-09's metric definitions** for manager, centre coordinator and executive dashboards | Three of the four dashboards | 📋 |

---

## 3. FAST / IMS team — data and interfaces

**The largest single dependency, and after the rulings of 2026-09-02 it is larger
still:** one connection now carries the trainer base profile, the whole plan chain,
**MTM's trainee evaluations** (`P-200` — the data is already on FAST) and **Yaqeen
identity verification** (`P-201`). Ask for one read contract, not three.

> **The schema is not the ask.** 15 tables and 406 fields arrived 2026-08-23 and
> every field the journeys named was found in them (`13` §1). What is missing is a
> way to read them, one absent table, and the lookup rows.

| | Ask | Blocks | Size |
|---|---|---|---|
| **`Q20`** | **`plan.PlanTaker`** — the enrollee table, **and the attendance/absence column** J-21/F4 leaves pending | ⭐ J-21's enrolment list and its attendance layer. One table, two open items | 🔌 |
| **`Q30`** | **A write API for the trainer base profile**, and whether FAST can **notify** on change (webhook/CDC) or must be polled | ⭐ Whether "dual change" is deliverable (`P-135`). A *no* is an acceptable answer with a product consequence | 🔌 |
| **`Q21`** | **The 19 `lookup.*` value lists.** Four are load-bearing now: `TrainingMaterialStatus`, `TrainingType`, `PlanLocation`, `PlanCancelReason` | Four unions in shipped code are unconfirmed guesses; every status badge is toned identically | 📋 |
| ~~`Q29`~~ | ✅ **Answered 2026-09-02 by owner ruling** (`P-200`): «MTM the data is on FAST already so we don't need it». FAST is neither neighbour nor intermediary — it is the **carrier**. INT-02 is not a separate connection, and `G41`–`G44`, `G28`, `G57`/`G58` are cancelled with it. ⚠️ `J-21/F6/AC-2` still says otherwise and needs amending | — | ✅ |
| **Yaqeen** | **The identity-verification contract, through FAST** — endpoints and token exchange. ⚠️ Owner ruling 2026-09-02 (`P-201`): verification is **Yaqeen (يقين), not Nafath**, and it comes from FAST. Replaces the `G4` infrastructure ask | The last screen still on demo data. The product's copy still says «نفاذ» and needs renaming | 🔌 |
| **`Q23`** | **Which MTM rating level is the source of record?** Pre-aggregated on `AspNetUsers`, on `PlanTrainer`, on `Plan`, **and** raw in `SurveyResponse` — four candidates | The rating module | ⚡ |
| **`Q38`** | **One re-registration** — details received 2026-08-30 (`P-176`: authority + `ReactApp`), but the registered redirect URI is `testingdashboard.fa.gov.sa/callback`, a host we do not serve. Ask: register **`https://experts.fa.gov.sa/api/auth/callback`** (+ a localhost callback for dev), and confirm the client type | The real-IdP handshake — everything else is wired and waiting. ⚠️ **Closing this also re-enables PAR**: `EXPERT_HUB_OIDC_USE_PAR` is `false` on the testing server only because a pushed request dies against an unregistered URI | ⚡ |
| — | **The replication contract**, agreed in writing: a write to a field the other side masters is **silently lost** unless it goes through write-through (`P-129`, `08` §1.1) | Not a blocker — a **risk**. This is the most likely way the design fails in practice | 📄 |
| — | **Extended field files** — the owner has said the two supplied files will grow | Nothing today. `13` and the generated snapshot regenerate from them | 📋 |

---

## 4. ERP team

| | Ask | Blocks | Size |
|---|---|---|---|
| **`Q27`** | **The disbursement status list** — the values `حالة الصرف` can take, and **which of them mean the money has actually moved** | Every status renders identically today, so *Disbursed* and *On hold* look the same. Honest, not helpful | 📋 |
| **`Q39`** | **Which key `trainer_ref` quotes, and how a purchase order identifies the PROGRAMME it pays for** | ⚠️ **The biggest open item in CAP-06, found by building it** (`P-197`). `BR-0602`'s chain is PO → active agreement → *specific engagement*, and `BR-0603` hides anything short of it from the trainer — but the ask below lists no programme reference at all. As specified, **every entitlement stays staff-visible and trainer-invisible forever**. The screens are live and correct and will read empty until this is answered; no heuristic was invented to fill it, because a wrong link attaches real money to the wrong programme | ⚡ |
| — | **The entitlement endpoint** — how Expert Hub receives PO number, amount, status, date and trainer | INT-03. The *fields* are settled (§8.6, `10` §3.8) and built as `ErpPurchaseOrderMessage`; only the transport is missing, so an adapter is the whole remaining job | 🔌 |

---

## 5. Information Security, data protection & legal

| | Ask | Blocks | Size |
|---|---|---|---|
| **`Q28`** | **May applicant free-text leave the Academy's boundary** to an external LLM API (OpenAI / Claude), and on what terms — data residency, retention at the provider, no-training guarantees, PDPL and SDAIA obligations? | **Go-live of the AI feature, not the build.** `BR-0202` makes it advisory, so screening works unchanged with it off, and the provider-agnostic port makes an in-Kingdom model a config change | ⚡ |
| `Q13` | **Speaker data governance** under KSA data protection (`NFR-05`) | J-04, alongside its missing field matrix | ⚡ |
| **`G26`** | **The CDN configuration** — the final home for uploaded documents, and how they are served | ⚠️ **Answered for now by owner ruling** (2026-09-03, `P-208`): documents are written to the **server's own disk** until the CDN is configured, on a mounted volume that must be backed up with the database. Every storage ref carries its scheme, so the CDN store drops in later with nothing to migrate. What remains is the CDN itself | 🔌 |
| **`G27`** | **Antivirus scanning** for uploads | ⚠️ **Live risk, not a blocker**: uploads now work and every stored file records `not-scanned`. The seam is `IUploadScanner` — one adapter. Until then the platform holds files from outside the Academy that nobody has checked | 🔌 |

---

## 6. Infrastructure & platform

| | Ask | Blocks | Size |
|---|---|---|---|
| — | **Hosting & CI** — hosting topology, CI/CD path, and which .NET LTS the Academy hosts. *(The runtime, framework and database were decided 2026-08-27: ASP.NET Core + EF Core + SQL Server — `P-162`, [17_STACK_DECISION.md](17_STACK_DECISION.md) §4.)* | Deployment, and **BE-21** — the backend targets `net9.0`, already out of support. No longer blocks implementation | ⚡ |
| ~~`G4`~~ | ➡️ **Moved to the FAST team 2026-09-02** (`P-201`): verification is **Yaqeen**, not Nafath, and it is reached through FAST — see §3. The identity *rules* are already built (`P-60`); only the wire contract is missing | — | ➡️ |
| — | **Teams API** for interview meeting creation (J-06/F2) — not in the BRD's integration table at all | Meeting links are surfaced as data, never created | 🔌 |
| — | **Email gateway** credentials and sending domain | INT-04 | 🔌 |

---

## 7. Closed since the last pass

| | Answered by |
|---|---|
| `Q5` public trainer rating | J-24's own open item removed it from the journey — `P-40` |
| `Q14` bank-data permanence | The supplied FAST schema — all eight fields sit on the permanent profile — `P-134` context |
| `Q24` build CAP-06 from the BRD? | Yes, and it is built — `P-124` |
| `Q6` AI service model and bounds | The provider is decided (external LLM API, OpenAI or Claude) — `P-132`. **The governance half survives as `Q28`** |
| `Q15` is MTM a real system distinct from INT-02? | Confirmed the same system — `P-13` |
| The **stack decision** (runtime, framework, database) | ASP.NET Core + EF Core + SQL Server — `P-162`, [17_STACK_DECISION.md](17_STACK_DECISION.md), backend scaffolded 2026-08-27. **The hosting/CI/.NET-LTS half stays open** in §6 |

---

## 8. Scoreboard

| | Count |
|---|---|
| Product Owner rulings | 12 |
| Business Analyst documents | 17 |
| FAST / IMS | 6 |
| ERP | 3 |
| InfoSec / legal | 4 |
| Infrastructure | 3 |
| **Open total** | **41** |
| Closed since last pass | 6 |

⚠️ **`Q39` (ERP, added 2026-09-01) belongs in §0 and is not yet listed there**
— it is the only ask whose absence leaves a *shipped, live, correct* screen
permanently empty for the audience it was built for (`P-197`).

**Six asks closed or re-homed on 2026-09-02** by the two integration rulings:
`Q29`, `G41`, `G42`, `G43`, `G44` and `G28` are cancelled outright (`P-200` —
there is no separate MTM endpoint to contract or authenticate), and `G4` moved
from Infrastructure to the FAST team as the Yaqeen contract (`P-201`).

**Of the 41, five are on the critical path (§0)** — §0's row 3 is decided for
implementation and only its hosting/CI remainder stays open. The rest shape or
complete work that can otherwise proceed — which is why the playbook marks
prompts 🟡 *buildable with a named gap* rather than blocked.
