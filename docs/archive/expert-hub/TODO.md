# TODO — Expert Hub

Outstanding work, blockers, and BRD gaps to close. Seeded from [01_PRODUCT_DISCOVERY](01_PRODUCT_DISCOVERY.md) §11.

> 📮 **To *ask* for any of these, use [`15_INPUTS_REGISTER.md`](15_INPUTS_REGISTER.md)** —
> the same items grouped by **who can answer**, with what each blocks and how big
> the ask is. This file stays the working list; the register is what you send.
>
> **Four are on the critical path:** `DM-GAP-07` · `Q30` · `Q20` · `Q17`. See the
> register §0. *(The stack decision closed 2026-08-27 — ASP.NET Core + EF Core +
> SQL Server, `P-162`; its hosting/CI/.NET-LTS remainder lives in register §6.)*

Legend: 🔴 blocker · 🟠 needed soon · 🟢 normal · ✅ done

---

## 🔴 Blockers — must be resolved before data model / screens can be finalized

### Missing BRD inputs (`DM-GAP`)
- [x] ~~`DM-GAP-01` Application form: mandatory/optional fields per service, attachments, validation~~ · **Supplied 2026-08-30** (`New_Trainer_Application_Form_Bilingual_(1).xlsx`) and served by `applicationSchema.ts` (`P-172`). **Residuals, from the workbook's own notes:** the unsupplied dropdown value lists (nationality, general specialization, ready-materials, delivery mode, annual availability, engagements/year — provisional in code), the ID-type routing mechanism, `DateTo`/`YearsOfExperience`, the 3-year qualification rule, availability rows 5–6, attachment formats/sizes for the new form, **and repeatable education/certification/experience entries** (`P-173`)
- [ ] `DM-GAP-02` Initial screening criteria: criteria, weights, scores, min acceptance per service
- [ ] `DM-GAP-03` Interview evaluation model: axes, scores, final-score computation
- [ ] `DM-GAP-05` Matching matrix: factors, weights, tie-breaking
- [x] ~~`DM-GAP-06` Assignment request form: fields to keep/remove/add~~ · **Supplied 2026-08-30** («نموذج طلب الخبير او المدرب المستقل من المراكز») and built as the centre request form — owner ruled it **replaces** J-16's FAST-pull capture (`P-174`). **Residuals (`P-175`):** the unsupplied dropdown values, the real centre/employee/nominee lookups, the request-type→service mapping ruling (content-development spans question writing), and whether a headcount belongs on the form
- [ ] `DM-GAP-07` Roles & permissions matrix: per-role function + data scope
- [ ] `DM-GAP-08` Notification matrix: event, recipient, channel, template, timing
- [ ] `DM-GAP-09` KPIs & reports: metrics, sources, aggregation, consumer
- [ ] `DM-GAP-10` Operational values: SLAs/deadlines, validity periods
- [ ] `DM-GAP-14` Trainee evaluation system: level, calculation, program/trainer relation
- [ ] `DM-GAP-15` Data retention policy: retention, archival/hiding rules

## 🟠 Open questions needing stakeholder answers
- [ ] Q1 — Define **Success Metrics** (BRD §9 is empty)
- [ ] Q2 — **Data migration** strategy (Excel/manual → platform); deferred to annex
- [ ] Q4 — **CAP-11** scope & timeline (deferred)
- [ ] ~~Q5 — Source of the **public trainer rating** (`BR-1006`)~~ — **closed 2026-08-19.** J-24's open item removes public evaluation display from the journey entirely ("needs a separate decision later if you want to add it"). The owner confirmed the journey supersedes the earlier instruction to surface it, so the field is gone from the public contract (`DECISIONS.md` P-40). Re-open only if that separate decision is taken.
- [x] ~~Q6 — **AI service** for qualitative analysis: model, bounds, governance~~ · **Answered 2026-08-26 (`P-132`)**: an external LLM API — OpenAI or Claude — behind a provider-agnostic port, registered as INT-06, with only qualitative answer text sent. **The governance half survives as `Q28`**, which is a data-protection ruling rather than a technical choice.
- [ ] Q7 — **Entitlement objection** process (none in-platform this version)
- [ ] Q8 — Confirm **provisional (*) SLA/NFR values** (screening 5d, interview 2d, committee/approval 3d, signature 10d, uptime 99.5%, response 3s, dormancy 6mo, peak load)
- [ ] Q9 — Clarify **numbering gaps** in BR/US/DM-GAP IDs (intentional vs. missing)
- [ ] Q10 — **Primary language** field: captured at application? default/fallback?
- [ ] Q11 — **Committee & internal-approver** composition/ordering (fixed vs per-request)
- [ ] Q12 — Matching **weighting ownership & tie-breaking**
- [ ] Q13 — **Speaker data governance** under KSA data-protection (`NFR-05`)
- [ ] **Q28 — the AI provider needs a data-protection ruling.** *(narrowed 2026-08-26: the provider is decided — an external LLM API, OpenAI or Claude, `P-132`.)* What remains is not technical: this sends **applicant free-text outside the Academy's boundary** to a third-party API, and for a DGA-registered government platform holding personal data, whether that is permitted — and on what terms (data residency, retention at the provider, no-training guarantees, PDPL/SDAIA obligations) — is a **data-protection and procurement decision**. The design degrades safely: `BR-0202` makes AI advisory, so screening works unchanged with it switched off, and the provider-agnostic port makes an in-Kingdom model a config change. **Blocks go-live of the feature, not the build.** Original framing: `BR-0202` has AI analyse the qualitative questions and produce a separate advisory score/summary, but BRD §8.12.3 lists INT-01→INT-05 and **the AI provider is not among them**. It needs an `INT-` code, its data elements in the source-of-truth matrix, and — the part that is not a technical decision — **a ruling on where applicant free-text may be sent**, since qualitative answers leaving the Academy's boundary is a data-protection question. See `08_BACKEND_ARCHITECTURE.md` §2.2.
- [ ] **Q29 — does «دون فاست كوسيط» survive MTM being hosted in the IMS estate?** The owner ruled that MTM records sit on FAST and replicate the same way (`P-131`), and the supplied schema agrees — `ImsCommon.Survey.*` arrived inside the FAST history file. But **J-21/F6/AC-2 says evaluations reach the platform «عبر تكامل مباشر بين المنصة وMTM — دون فاست كوسيط»**. The reading that holds both: the records are *stored* in the shared estate and read **directly from `ImsCommon.Survey`**, so FAST is a neighbour rather than an intermediary. **Confirm that reading** — if instead FAST's application layer is meant to serve the ratings onward, the journey is contradicted outright and needs amending rather than reinterpreting. See `08_BACKEND_ARCHITECTURE.md` §4.4.
- [ ] **Q30 — does FAST expose a write API for the trainer profile?** The owner requires that a profile change be possible from either system (`P-134`), and write-through is what makes that safe without two masters (`P-135`). It needs FAST to **accept writes from Expert Hub** on the base-profile fields. **If it cannot**, dual change on those fields is not deliverable and they become read-only in Expert Hub — which is a product decision to take deliberately, not a technical workaround to discover during build. Also needed: whether FAST can **notify** on change (webhook/CDC) or only be polled, since that decides how quickly a FAST-side edit appears in Expert Hub.
- [ ] **Q20 — `plan.PlanTaker` was not supplied, and it closes two open items at once.** J-21/F3/AC-3 names it as the enrollee source and J-21's own open item 1 leaves the attendance/absence field pending. Neither is answerable without that one table. **Highest-value single ask on the data side.** See `13_FAST_DATA_DICTIONARY_MAP.md` §3.1.
- [ ] **Q21 — Nineteen `lookup.*` tables are referenced by the supplied schema and none of their rows arrived.** Four are load-bearing for code already written: `TrainingMaterialStatus` (J-20/F5's value list, currently an unconfirmed union), `TrainingType` (likely the in-class/online source), `PlanLocation` (J-21/F2/AC-2's inside/outside the Academy), `PlanCancelReason` (J-22/F3/AC-1, currently rendered as an opaque code). See `13_FAST_DATA_DICTIONARY_MAP.md` §3.2.
- [ ] **Q22 — FAST's three `Expert*` flags do not match Expert Hub's four services.** `profile.UserProfile` carries `ExpertCorrector`, `ExpertReviewer`, `ExpertQuestionAuthor`; we accredit trainer, consultant, content developer and question writer. Only *question writer* lines up. How is service accreditation represented? See `13_FAST_DATA_DICTIONARY_MAP.md` §4.2.
- [ ] **Q23 — MTM ratings exist pre-aggregated at three levels in FAST** (`AspNetUsers`, `PlanTrainer`, `Plan`) **plus raw in `Survey.SurveyResponse`.** `02D` splits ownership two ways — MTM owns raw, Expert Hub owns calculated — and J-21/F6/AC-2 routes evaluations from MTM *without FAST as an intermediary*. Which is the source of record for the displayed rating? Needs settling before the rating module is built. See `13_FAST_DATA_DICTIONARY_MAP.md` §4.1.
- [x] ~~**Q24 — CAP-06 (المستحقات المالية) is fully specified in the BRD but has no journey.**~~ · **Answered 2026-08-26 by building it from the BRD** (P-124): EH-TP-09 for the trainer (`F-0601`) and EH-INT-11 for staff (`F-0602`), both in the header. All four rules encoded structurally. Original question: §8.6 gives the entity, three features (`F-0601` trainer view, `F-0602` staff view, `F-0603` the PO→agreement→programme link) and four business rules including `BR-0601` (never entered by hand) and `BR-0603` (an incompletely-linked entitlement stays hidden from the trainer). **Missing from both headers**, not just the internal one. Build it from the BRD, or wait for J-28? See `14_INTERNAL_DASHBOARD_BRD_REVIEW.md` §2.1.
- [ ] **Q27 — the ERP disbursement status list is not defined.** §8.6 names «حالة الصرف» as a field consumed from ERP but never enumerates its values. `DisbursementStatusDto` therefore carries an opaque code plus a bilingual label and the UI tones every status the same (P-128) — so *Disbursed* and *On hold* look alike, which is honest but not helpful. **The list of ERP statuses, and which of them mean the money has actually moved,** would let the badge carry meaning. Also open: §8.6.5 numbers its rules 0601, 0602, 0603, **0605** — `BR-0604` does not exist in the document. Deliberate, or a gap?
- [x] ~~**Q36 — is Expert Hub a public or a confidential OIDC client?**~~ · **Answered 2026-08-27 by deciding the backend** (`P-163`): the flow moves into the API, so **either client type works** — register whichever FAST prefers, and a client secret is now something we can hold properly. ⚠️ The **redirect URI becomes an API route** and must be settled before FAST registers the client. Original question: The FAST team uses OpenID Connect and will issue a client id. **If they also issue a client secret**, the client is *confidential* — and a confidential client cannot run in a browser, because everything the frontend holds is downloadable. The token exchange would then belong in the Expert Hub API (which holds the secret and hands the browser an HttpOnly cookie), which is also what `02C` already prescribes. The frontend config layer is built either way (P-158) and refuses to hold a secret (P-159), but **the adapter that performs the flow cannot be finished until this is settled**: a public client puts the exchange in the browser, a confidential one puts it in the API. Ask FAST which client type they registered. See `16_SSO_OIDC_CONFIGURATION.md` §3.
- [ ] **Q37 — the SSO claim contract, mostly closed.** *(2026-08-30 — `P-181`: the owner ruled the token carries only `sub` + `email`; roles are Expert Hub's own `USER_ROLE` data with a configured bootstrap administrator, so the role-claim half is CLOSED.)* **Remains:** session lifetime / refresh / logout arrangements, and whether FAST can add a human display-name claim (the header currently shows the email or user number). Original question: Which claim carries the user's role or group, and what are its values for Academy staff versus external trainers? Also: is the stable identifier `sub`, which claim is the display name (and is there an Arabic form), is the role claim in the ID token or only from userinfo, and what are the session lifetime / refresh / logout arrangements? Claim **names and values are both configuration** now (`EXPERT_HUB_OIDC_ROLE_CLAIM` and friends), so the answers are an env-file edit rather than a release. See `16_SSO_OIDC_CONFIGURATION.md` §5.
- [ ] **Q38 — the re-registration ask.** *(narrowed 2026-08-30 — `P-176`/`P-178`: details arrived, and the flow is portal-first + silent handshake.)* Received: authority `https://testingauth.fa.gov.sa/identitymanagement.sts`, client id `ReactApp`, and the registered redirect URI `https://testingdashboard.fa.gov.sa/callback` — **a host this product does not serve**. What remains: ask FAST to register **`https://experts.fa.gov.sa/api/auth/callback`** (and a localhost callback for development), and confirm the **client type** (no secret was mentioned ⇒ presumed public/PKCE). The authority and client id are wired; the handshake cannot complete until this lands. See `16_SSO_OIDC_CONFIGURATION.md` §1–§2.
- [ ] **Q35 — the screening SLA duration, now that the invented one is gone.** The screening screen showed **5 business days** from a constant in its own mock; J-05 states no duration, so the countdown is now absent and the page says the deadline is unconfigured (P-156). **The ask is one number**: how long does a screening decision have, and in calendar or business days? It is entered on the deadline console and the badge returns immediately. Same for J-11's applicant no-response SLA and J-20's material-review SLA — both journeys explicitly defer theirs → `DM-GAP-10`.
- [ ] **Q34 — `DM-GAP-08`: the notification routing now has a screen and no contents.** EH-INT-13 was built 2026-08-27 with all twenty events **unrouted** and the matrix marked *unapproved* on screen. The events themselves are real — taken from ten approved journeys, each carrying its citation (P-146) — and each row shows the journey's own words about who is notified. **What is needed is the approved routing**: for each event, which audience receives it and from which template. Owner: Business Analyst + PO. Blocked behind it: the **message wording itself** — no template is seeded, because `BR-0701` allows only approved bilingual templates and inventing bodies would put words in the Academy's mouth.
- [ ] **Q32 — what does «أعالجها» mean in `US-0705`?** The notification log shows every failed send with its reason, and **has no resend button**. The user story asks for the failed notifications to be followed up *and handled*, so the need is real — but §8.7 never defines what a resend does: does it render the template's **current** version or the one that was sent, does it write a **second** log entry or amend the first, and is the recipient's language re-resolved at resend time? Those are business answers. If a resend is wanted, those three questions are what it needs (P-152).
- [ ] **Q33 — the template placeholder vocabulary is not defined.** `BR-0701` requires approved bilingual templates, and a template body needs variables («تم تجديد اتفاقيتك لمدة {{agreementDuration}}»). §8.7 never enumerates them, so the served list is derived from the events the journeys describe — twelve names, flagged as mock. **The approved vocabulary per event** is what makes a template writable; it belongs with `Q34`'s routing decision.
- [ ] **Q31 — `DM-GAP-07`: the approved role × permission matrix now has a screen and no contents.** EH-INT-12 was built 2026-08-27 with all 348 cells ungranted and the grid marked *unapproved* on screen (P-138) — seeding plausible defaults would have shipped invented policy in the one area where being quietly wrong grants access. **What is needed is the approved model**: for each of the six roles, which of the 58 feature permissions it holds, and at which data scope (كل البيانات / بياناته فقط / نطاق مركزه) per §8.8.3. Owner: Business Analyst + PO (`15_INPUTS_REGISTER.md` input 1). Secondary: the **labels** of the 58 permissions were extracted from the BRD PDF's wrapped tables and many are truncated (P-139) — the codes are verified, the wording needs a pass.
- [ ] **Q25 — CAP-08 names six roles; the app has two personas.** *(2026-08-27: the roles and the matrix are now real entities managed in EH-INT-12; what is still collapsed is the **session persona**, not the data model.)* §8.8.5: مدرب · موظف إدارة المدربين · مدير إدارة المدربين · منسق مركز · مشرف النظام · الإدارة العليا. Four distinct internal roles are collapsed into one `internal` persona. P-J9 keeps this additive rather than a refactor, but **منسق مركز is a real scoping rule we do not honour** — J-17 already has a requesting-party actor who should see only their own centre's requests. Which roles are in scope for this release? See §2.3.
- [ ] **Q26 — CAP-09's metrics have no definitions.** §8.9 names four role-scoped dashboards (`F-0901`–`F-0904`) and lists the employee's three tiles by name — طلبات قيد الفرز، مقابلات مجدولة، مواد بانتظار الاعتماد. Are those the approved set, and what are the manager / centre-coordinator / senior-management ones? See §2.4.
- [ ] **Q17 — Four catalogued journeys have no document: J-25 (Operational Notifications), J-26 (Roles/Permissions/Delegation), J-27 (Reporting & Dashboards), J-28 (Entitlements Viewing).** ⚠️ **Corrected 2026-08-26:** this was described as *blocked*, which is true of the journeys and misleading about the work — **the BRD specifies all four at capability level** (CAP-07, CAP-08, CAP-09, CAP-06), and several are buildable today from it. What is missing is the journey/AC layer, not the requirement. See `14_INTERNAL_DASHBOARD_BRD_REVIEW.md` §0 and `Q24`–`Q26`. `Journey Catalog` lists J-01→J-28; this folder holds J-01→J-24. **J-25 is the blocker**: J-03/F3/AC-6+AC-7, J-06/F1/AC-4, J-11/F1/AC-1, J-18 and J-22 all say "the applicant is notified" and point at the Notification Matrix (CAP-07) that does not exist here. One rule is already visible and non-obvious — J-03/F3/AC-7 notifies a rejection **without** its reason, the opposite of EH-TP-03's application-rejection behaviour. Requesting these four is the highest-leverage action open, and it is not an engineering task. See `12_JOURNEY_CONFORMANCE_AUDIT.md` §0.
- [ ] **Q19 — Identity Card: one field now has a source, one still does not.** *(narrowed 2026-08-23)* **Social Media Accounts** → `profile.UserProfile.SocialMediaUrl nvarchar(500)` exists, but it holds **one** URL while the matrix says *accounts* (plural) — decide which is intended. **Related Fields** most plausibly resolves to `profile.AreasOfTraining` (its column is literally named `Feild`), but that is an inference and needs confirming. See `13_FAST_DATA_DICTIONARY_MAP.md` §2.2. Original question: J-15's Identity Card Template matrix lists seven fields; **Related Fields** and **Social Media Accounts** do not exist anywhere on the trainer record, and neither J-01's application form nor J-13's profile creation collects them. EH-INT-08 renders them as explicitly unavailable rather than dropping them (`DECISIONS.md` P-73). Either add them to the profile/application field set, or amend the matrix. Also needed before PDF export can be built: the **approved design template** for the card, and document generation (`G26`).
- [ ] **Q18 — Can a suspended agreement be reactivated?** J-12/F3/AC-1 says staff "can suspend it or end it" and says nothing about lifting a suspension. `04` EH-INT-06 §7 calls suspend "reversible" and terminate "terminal", so EH-INT-06 offers reactivation on the page spec's authority (`DECISIONS.md` P-67) — without it a suspended agreement would have no way back, which no document asks for. Confirm the rule and whether reactivation is restricted to a role.
- [ ] Q16 — **"Domain" vs "specialization"** *(candidates supplied 2026-08-23, ruling still needed)*: three candidate vocabularies now exist — `Education.Specialization` + `GeneralSpecialization`, `AreasOfTraining.FeildId → lookup.TrainingAreasFeild`, and `AreasOfCooperation.CooperationAreaId`. J-24 needs exactly two public values; which pair? See `13_FAST_DATA_DICTIONARY_MAP.md` §3.3. Original question: J-24/F2/AC-1 and J-15 list them as two distinct public fields, but only *specialization* exists in the taxonomy today, and no domain vocabulary is defined anywhere in the BRD or the journeys. The public profile therefore renders specialization only — no domain has been invented. Needs the authoritative domain taxonomy (related to the still-open public whitelist `G12`).
- [x] ~~Q14 — **Bank-data permanence**~~ · **Answered 2026-08-23 by `Trainer_Profile_Fields.xlsx`**: all eight J-09/F6/AC-3 fields sit on `profile.UserProfile` — the permanent profile, not a per-agreement table — which is where Expert Hub already modelled them. FAST carries a ninth, `IbanAttachmentId`, that J-09 does not mention; decide whether we collect it. See `13_FAST_DATA_DICTIONARY_MAP.md` §2.1. Original question: (J-09/F6 open item): is the bank data collected after preliminary approval part of the trainer's *permanent* profile (reused for renewals and future agreements), or collected fresh per agreement? Affects J-14 (self-service update scope) and J-15 (unified profile view). Modelled on the profile today because F6/AC-2 says the fields "open in their profile" — flagged, not assumed.

## 🟢 Backlog — new capabilities (not matrix alignment)

*Added 2026-09-16 by the matrix-alignment phase 2. Each is a capability of its
own, deliberately not built as part of aligning an existing matrix.*

- [ ] **`EXPERT-HUB-J04-SPEAKER` — the Speaker journey (J-04).** Notion's «Speaker
  Record» matrix defines 11 fields (J-04's own page still says 13 — reconcile
  first). Expected scope:
  - **Record & profile** — the speaker entity (picture, title/role, the eight
    Arabic/English name parts, bio), internal-only and never self-service
    (`BR-0113`); data governance under KSA data protection (`Q13`).
  - **Database** — a new table and migration; no change to the trainer file,
    which a speaker does not have.
  - **APIs** — create / read / update / list, and the lookup assignment uses.
  - **Frontend** — the internal record screens (no public or applicant surface).
  - **Assignment routing** — «ورشة عمل / لقاء / ندوة» route to Speaker in the
    Assignment Matrix. `CentreRequestMatrix.RequestTypes` is the one table to
    change; until J-04 exists they route to Trainer.
  - **Notifications** — E-009 and any speaker events, once the notification
    matrices are approved (`DM-GAP-08`).
  - **FAST** — none identified in the portal API register; confirm whether a
    speaker must exist in FAST at all.
  - **Access** — which roles create and see speakers (`DM-GAP-07`).
  - **Migration** — existing requests of the three event types keep their
    Trainer routing; only new requests would route to Speaker.
- [ ] **`EXPERT-HUB-FAST-REFERENCE-DATA` — FAST lookups available outside a
  sign-in.** FAST already serves the authoritative lists the application form
  wants — countries/nationalities (`Lookup/GetCountries`, consumed today), and
  sectors → job families (`FinancialSkills/GetFrameworkStructure`, declared, not
  called) — but every FAST call needs a bearer token and Expert Hub only holds
  one inside the sign-in handshake (`P-215`). A **required** form field cannot
  depend on a list that exists only after somebody signed in and FAST answered.
  Needs the service credential (`G28`, `20_FAST_API_STUDY.md` §4 Q1) and then a
  persisted, dated copy of each list. Unlocks: nationality from FAST, the
  Sector → Field/Job Family cascade, bank country.
  - [x] *2026-09-16* Foundation built (`21_FAST_REFERENCE_DATA.md`): the
    persisted copy (`REFERENCE_VALUE` + `M27`), the idempotent daily sync for
    countries, the lookup `GET /api/v1/reference-data/{list}`, and sync status on
    the integration surface. The sync is idle and records
    `WAITING_FOR_FAST_SERVICE_CREDENTIAL` until an `IFastTokenProvider` for a
    service client exists.
  - [x] *2026-09-16* `Fast__ClientId`/`Fast__ClientSecret` named (empty) in
    appsettings, compose and `api.secrets.env.example`; the request to FAST is
    `22_FAST_INTEGRATION_REQUEST.md` (P-274).
  - [ ] **FAST:** an STS client with `client_credentials` → then implement the
    token provider (secret store only).
  - [ ] **FAST:** `FrameworkStructureRequestDto`, the `GetSectors` and
    `GetPlansByProgramId` response shapes, and whether `Home/TopMenu` lists every
    program → then sync those lists.
  - [ ] **Business:** the 147 domains ↔ job families
    (`domain-job-family-mapping.csv`). *(«البرامج المفضلة» closed — P-268;
    `isRestricted` is FAST's to define — P-270.)*
  - [ ] Switch nationality/bank country to the lookup once the list is filled.

## 🟢 Documentation workstream (this folder)

*Reconciled against the files 2026-08-27 — several were complete and still ticked
open, and three documents were written that this list never knew about.*

- [x] 01 — Product Discovery
- [x] **02C** — Application & Integration Architecture · **02D** — Rating Architecture *(02D corrects 02C on MTM ownership)*
- [ ] 02 — Information Architecture · *skeleton (32 lines)*
- [ ] 03 — User Flows · *skeleton (36 lines)* — superseded in practice by the 24 journey documents
- [x] **04 — Page Specifications** *(1,169 lines)* · [ ] 04 — Screen Inventory *(skeleton)*
- [x] **05 — Wireframe Specifications** *(698 lines)* · [ ] 05 — Wireframes *(skeleton)*
- [ ] 06 — UI Specifications · *skeleton* — the built Design System is the de-facto source
- [ ] 07 — Frontend Architecture · *skeleton* — the built app is the de-facto source
- [x] **08 — Backend Architecture** — ✅ **written 2026-08-26**, the foundational proposal
- [ ] 09 — API Specification · *skeleton* — next after the stack decision
- [x] **10 — Database Design & ERD** — ✅ **written 2026-08-26**, 97 entities
- [x] **11** Journey Implementation Map · **12** Journey Conformance Audit · **13** FAST Data Dictionary Map · **14** Internal Dashboard BRD Review · **15** Inputs Register — *none of these existed when this list was written*

## Notes
- Keep decisions in [DECISIONS.md](DECISIONS.md); keep gaps here; **ask via
  [15_INPUTS_REGISTER.md](15_INPUTS_REGISTER.md)**.
- Sequenced work lives in [`prompts/EXPERT_HUB_PLAYBOOK.md`](../../prompts/EXPERT_HUB_PLAYBOOK.md) — 27 prompts in dependency order.
- Nothing downstream (assignment, entitlements, public, analytics) has real data until the accreditation→profile spine exists — sequence work accordingly (Discovery §8/§9).
