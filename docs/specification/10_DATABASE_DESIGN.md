# 10 — Database Design & ERD

**Status:** 🟢 Live — first full pass, 2026-08-26.
**Sources of truth, in order:** `BRD-TRN-001 v1.0` §8 (capabilities + owned
entities), §8.12 (integrations + source-of-truth matrix), §9 (preliminary data
model) · the two supplied FAST field files · `02D` (rating ownership, which
corrects `02C`) · the 24 journey documents for operational detail.

> **What this is.** The entities the Expert Hub database owns, their
> relationships, and — the part that decides the architecture — **which data it
> owns versus which it merely holds a copy of, and where every integration
> crosses.**
>
> **Scope.** **Every entity the platform needs, across all twelve capabilities**
> — 90 owned entities plus 7 replicas of externally-mastered ones, 644
> attributes in all. Not physical DDL: types are indicative, and attributes marked
> `⟨gap⟩` are shaped but await the input named in §7. The *entities and
> relationships* do not depend on those inputs.

---

## 1. The four principles

### 1.1 Two zones, from BRD §9.1

§9 splits every entity in the product into exactly two kinds, and the split is
the backbone of this design:

- **§9.3 — operational entities the platform produces.** Expert Hub is the source
  of truth. Twelve are named: join application · initial screening result ·
  interview evaluation result · accreditation decision · trainer profile ·
  candidate list · trainer↔programme engagement · trainer record · public profile
  · notification log · audit log · integration log.
- **§9.2 — reference entities received from existing sources.** Another system is
  authoritative. Eight are named, including identity, the agreement document,
  FAST programme data, ERP disbursement data and trainee evaluations.

`BR-1201` makes the split binding: *each integration relies on **one** source
system, and no alternative source for the same data may be created inside the
platform.* `BR-1202` adds that received data may not be modified except through
its source system.

### 1.2 "Consumed" is three different things

This is the refinement §9.2 does not make and the design needs. All three are
*consumed*, and they behave completely differently:

| Kind | Example | What the database holds | Why |
|---|---|---|---|
| **Referenced** | FAST plan & programme | Foreign id + a display cache, refreshed on read | FAST owns programme execution data (§8.12.4). We show it; we never reason from a stale copy |
| **Integrated business record** | MTM rating submissions | A **permanent** row, original value immutable | `02D` §1: once received it becomes part of Expert Hub's own operational history — queried, referenced by calculation runs, audited, **even if MTM's copy later changes**. Not a disposable cache |
| **Mirrored for tracking** | ERP entitlements | A row per purchase order, never editable | `BR-0601`/`BR-1206` — consumed whole; the platform displays and tracks, calculates nothing |

`BR-1203` then requires all three to survive an outage: *the platform keeps the
**last known state**, logs the error, and notifies.* So every mirrored entity
carries `last_synced_at` and `sync_status` — a copy with standing, not a cache
that may vanish.

### 1.3 Person → services → one agreement

BRD §6.1 fixes the grain of the whole model:

- one person may hold **several services at once**, and **each has its own
  evaluation and accreditation**
- **one unified agreement** covers all of a person's accredited services
- adding a service to an accredited person **does not create a new agreement** —
  it becomes an **addendum** on the existing one
- **Speaker is outside all of it**: internal registration only, no contractual or
  financial obligation, never part of any agreement

So `APPLICATION_SERVICE`, `TRAINER_SERVICE` and `AGREEMENT_SERVICE` all exist as
join entities. Decisions that are "per application" in conversation are almost
always **per application-service** in the schema.

### 1.4 What the platform never stores

- **Authentication data.** `BR-1205` — identity is the Academy site's (INT-01);
  the platform stores a reference, never a credential.
- **Agreement document content.** §9.2 — the document is *prepared outside the
  platform*; Expert Hub uploads, links and tracks status "دون تحرير محتواها داخل
  المنصة".
- **Any calculated entitlement amount.** §8.6.1 — the capability calculates no
  amount and creates no disbursement order.
- **A second source for anything already owned elsewhere** (`BR-1201`).

---

## 2. The integration boundary

Five integrations, from BRD §8.12.3. **Two are bidirectional, and both directions
matter to the schema.**

```mermaid
flowchart LR
  subgraph EXT["External systems"]
    ACA["Academy site<br/>INT-01"]
    MTM["Trainee evaluations MTM<br/>INT-02"]
    ERP["Financial system ERP<br/>INT-03"]
    MAIL["Email gateway<br/>INT-04"]
    FAST["Training programmes FAST<br/>INT-05"]
  end

  subgraph EH["Expert Hub — owns its own operational record"]
    IDN["Identity &amp; access<br/>CAP-08"]
    PRF["Trainer profile<br/>CAP-04"]
    ASG["Assignment &amp; engagement<br/>CAP-05"]
    ENT["Entitlements<br/>CAP-06"]
    COM["Communication<br/>CAP-07"]
    PUB["Public presence<br/>CAP-10"]
    LOG["Integration log<br/>CAP-12"]
  end

  ACA -- "identity, navigation" --> IDN
  ACA --- PUB
  MTM -- "raw rating submissions" --> PRF
  ERP -- "PO no., amount, status, date" --> ENT
  COM -- "recipient, template, status" --> MAIL
  FAST -- "plan, programme, enrolment, attendance" --> ASG
  PRF -- "accredited trainer data" --> FAST

  IDN -.-> LOG
  PRF -.-> LOG
  ASG -.-> LOG
  ENT -.-> LOG
```

### The direction that is easy to miss

§8.12.4's source-of-truth matrix says:

> **بيانات ملف المدرب المعروضة بـFAST → منصة إدارة الخبراء**

**Expert Hub owns the trainer data FAST displays.** INT-05 is bidirectional
because Expert Hub *publishes* accredited trainers into FAST so they can be
scheduled, and *receives* programme execution data back. J-18/F4's write of
`PlanTrainer.TrainerId` is one instance of the outbound half.

Everything else FAST holds — plans, programmes, enrolment, scheduling — is
**FAST's** (§8.12.4, last row). Expert Hub references it.

---

## 3. The complete entity model

**90 owned entities across the twelve capabilities**, plus **7 replicas** of
externally-mastered ones — **97 in total, 644 attributes**. Every entity
the platform needs is here. Entities prefixed `EXT_` are replicas Expert Hub holds
but does not master (§1.1.1).

Attributes marked `⟨gap⟩` in a comment are shaped but not final — the input that
fixes them is named in §7.

### 3.0 Entity index

| Capability | Entities |
|---|---|
| **Shared** | `ATTACHMENT` · `REFERENCE_LIST` · `REFERENCE_VALUE` |
| **CAP-08** Identity & access | `APP_USER` · `ROLE` · `PERMISSION` · `ROLE_PERMISSION` · `USER_ROLE` · `AUDIT_LOG` |
| **CAP-01** Application | `APPLICATION` · `APPLICATION_SERVICE` · `FORM_SCHEMA` · `FORM_SECTION` · `FORM_FIELD` · `ATTACHMENT_RULE` · `APPLICATION_FIELD_VALUE` · `APPLICATION_ATTACHMENT` · `SERVICE_REQUEST` · `SPEAKER_RECORD` |
| **CAP-02** Screening & evaluation | `EVALUATION_MODEL` · `EVALUATION_CRITERION` · `SCREENING_RESULT` · `SCREENING_CRITERION_SCORE` · `AI_ANALYSIS` · `INTERVIEW` · `INTERVIEW_SLOT` · `INTERVIEW_MODEL` · `INTERVIEW_AXIS` · `INTERVIEW_EVALUATION` · `INTERVIEW_AXIS_SCORE` · `COMMITTEE_TEMPLATE` · `COMMITTEE_SEQUENCE` · `COMMITTEE_STEP` · `ACCREDITATION_DECISION` |
| **CAP-03** Agreement | `AGREEMENT` · `AGREEMENT_SERVICE` · `ADDENDUM` · `AGREEMENT_TEMPLATE` · `AGREEMENT_DOCUMENT` · `SIGNING_SEQUENCE` · `SIGNATORY` · `E_SIGNATURE` · `AGREEMENT_EVENT` |
| **CAP-04** Trainer profile | `TRAINER_PROFILE` · `TRAINER_SERVICE` · `EDUCATION` · `PROFESSIONAL_CERTIFICATION` · `PRACTICAL_EXPERIENCE` · `TRAINING_COURSE` · `AREA_OF_TRAINING` · `AREA_OF_COOPERATION` · `AVAILABILITY` · `BANK_DATA` · `PROFILE_CHANGE_REQUEST` · `TRAINER_RECORD` · `RATING_SOURCE_RECORD` · `TRAINER_RATING` |
| **CAP-05** Assignment | `ASSIGNMENT_REQUEST` · `ASSIGNMENT_SLOT` · `MATCHING_MODEL` · `MATCHING_RUN` · `MATCH_CANDIDATE` · `MATCH_EXCLUSION` · `CANDIDATE_POOL` · `POOL_MEMBER` · `SLOT_CYCLE` · `ASSIGNMENT_OFFER` · `ENGAGEMENT` · `ENGAGEMENT_TERMINATION` · `MATERIAL_SUBMISSION` · `SUBMISSION_ROUND` |
| **CAP-06** Entitlement | `ENTITLEMENT` |
| **CAP-07** Communication | `NOTIFICATION_EVENT` · `NOTIFICATION_TEMPLATE` · `NOTIFICATION_MATRIX_ROW` · `NOTIFICATION_LOG` · `SLA_MATRIX_ROW` · `SLA_INSTANCE` |
| **CAP-09** Analytics | `METRIC_DEFINITION` · `DASHBOARD` · `DASHBOARD_METRIC` · `REPORT_DEFINITION` · `REPORT_RUN` |
| **CAP-10** Public presence | `VISIBILITY_CONSENT` · `PUBLIC_PROFILE` · `LANDING_CONTENT` |
| **CAP-12** Integration | `INTEGRATED_SYSTEM` · `DATA_ELEMENT` · `INTEGRATION_LOG` · `REPLICATION_STATE` |
| **Replicas** | `EXT_ACADEMY_IDENTITY` · `EXT_FAST_PROGRAM` · `EXT_FAST_PLAN` · `EXT_FAST_SCHEDULE_DAY` · `EXT_FAST_PLAN_TRAINER` · `EXT_FAST_PLAN_TAKER` · `EXT_ERP_PURCHASE_ORDER` — MTM's records take local form as `RATING_SOURCE_RECORD` (§3.6) |

---

### 3.1 Shared — attachments and reference lists

Every document in the product is one `ATTACHMENT`. Every platform-owned
enumeration is a `REFERENCE_VALUE`, so a System Administrator can add a value
without a release (`BR-0103`).

```mermaid
erDiagram
  REFERENCE_LIST ||--|{ REFERENCE_VALUE : contains
  APP_USER ||--o{ ATTACHMENT : uploads

  ATTACHMENT {
    uuid attachment_id PK
    string file_name
    string mime_type
    int size_bytes
    string storage_ref "G26 - storage mechanism unresolved"
    string checksum
    string scan_status "G27 - antivirus unresolved"
    uuid uploaded_by FK
    datetime uploaded_at
  }
  REFERENCE_LIST {
    string list_code PK "service, rejection_reason, withdrawal_reason, ..."
    string name_ar
    string name_en
    bool is_editable "false for lists fixed by the BRD"
  }
  REFERENCE_VALUE {
    uuid value_id PK
    string list_code FK
    string code
    string label_ar
    string label_en
    int sort_order
    bool is_active "deactivate, never delete - history must still resolve"
  }
```

---

### 3.2 CAP-08 — identity, roles, permissions, audit

Authentication is INT-01's; **authorization is entirely the platform's**
(`P-133`). Six fixed roles (§8.8.5).

```mermaid
erDiagram
  EXT_ACADEMY_IDENTITY ||--|| APP_USER : "authenticates (INT-01)"
  APP_USER ||--o{ USER_ROLE : holds
  ROLE ||--o{ USER_ROLE : "assigned through"
  ROLE ||--o{ ROLE_PERMISSION : bundles
  PERMISSION ||--o{ ROLE_PERMISSION : "granted by"
  APP_USER ||--o{ AUDIT_LOG : performs

  EXT_ACADEMY_IDENTITY {
    string external_identity_id PK "INT-01 master"
    string national_id
    string email
    string status
  }
  APP_USER {
    uuid user_id PK
    string external_identity_id FK "reference only - BR-1205"
    string email
    string phone
    string full_name_ar
    string full_name_en
    string preferred_communication_language
    string preferred_ui_language
    bool is_active
    bool is_employee
    datetime last_login_at
    datetime created_at
  }
  ROLE {
    int role_id PK
    string code "trainer|staff|manager|centre_coordinator|system_administrator|executive"
    string name_ar
    string name_en
    string description_ar "8.8.5's own description of the role"
    string description_en
    bool is_system "the 6 are fixed - BRD 8.8.5"
  }
  PERMISSION {
    int permission_id PK
    string capability_code "CAP-01..CAP-12"
    string feature_code "one feature = one unit - BRD 8.8.4"
    string name_ar
    string name_en
    bool label_needs_verification "P-139 - PDF labels unverified until Q31"
  }
  ROLE_PERMISSION {
    int role_id FK
    int permission_id FK
    string data_scope "all | own | centre - DM-GAP-07"
  }
  USER_ROLE {
    uuid user_role_id PK
    uuid user_id FK
    int role_id FK
    uuid scope_ref "the centre, for منسق مركز"
    uuid assigned_by FK
    datetime assigned_at
  }
  AUDIT_LOG {
    uuid audit_id PK
    uuid user_id FK
    string action
    string entity_type
    uuid entity_id
    json before_state
    json after_state
    string ip_address
    datetime occurred_at "append-only - NFR-07"
  }
```

---

### 3.3 CAP-01 — application, the form schema, and service requests

The form is **schema-driven and versioned** (`BR-0103`): sections, fields and
attachment rules are rows, so the approved `DM-GAP-01` map replaces data rather
than code. A submitted application keeps the `schema_version` it was answered
against, so an old application still renders correctly years later.

```mermaid
erDiagram
  APP_USER ||--o{ APPLICATION : submits
  APPLICATION ||--|{ APPLICATION_SERVICE : "requests 1..n"
  FORM_SCHEMA ||--|{ FORM_SECTION : "organised into"
  FORM_SECTION ||--|{ FORM_FIELD : contains
  FORM_SCHEMA ||--o{ ATTACHMENT_RULE : requires
  FORM_SCHEMA ||--o{ APPLICATION : "answered against"
  APPLICATION ||--o{ APPLICATION_FIELD_VALUE : answers
  FORM_FIELD ||--o{ APPLICATION_FIELD_VALUE : "answered by"
  APPLICATION ||--o{ APPLICATION_ATTACHMENT : carries
  ATTACHMENT ||--o| APPLICATION_ATTACHMENT : "stored as"
  TRAINER_PROFILE ||--o{ SERVICE_REQUEST : "requests more"
  APP_USER ||--o{ SPEAKER_RECORD : registers

  APPLICATION {
    uuid application_id PK
    uuid applicant_user_id FK
    string schema_version FK "the form it was answered against"
    string reference "issued at submission only - BR-0107"
    string status
    string presentation_status "aggregated for the trainer - BR-0108"
    string origin "self_service | internal_nomination"
    uuid nominated_by FK "J-02"
    string activation_token "J-02/F4, nominee has no account yet"
    datetime created_at
    datetime submitted_at
    datetime updated_at
  }
  APPLICATION_SERVICE {
    uuid application_service_id PK
    uuid application_id FK
    string service "trainer|consultant|content_developer|question_writer"
    string outcome "independent per service - BR-0403"
    datetime decided_at
  }
  FORM_SCHEMA {
    string schema_version PK
    string status "draft | published"
    datetime published_at
    uuid published_by FK
  }
  FORM_SECTION {
    uuid section_id PK
    string schema_version FK
    string title_ar
    string title_en
    int order_index
  }
  FORM_FIELD {
    uuid field_id PK
    uuid section_id FK
    string field_code
    string label_ar
    string label_en
    string input_type
    string reference_list_code FK "for select fields"
    json required_for_services "union rule - BR-0104"
    json validation "max length, pattern - DM-GAP-01"
    int order_index
    bool is_locked "FAST-owned, read-only in the profile"
  }
  ATTACHMENT_RULE {
    uuid rule_id PK
    string schema_version FK
    string rule_code
    string label_ar
    string label_en
    json accepted_formats "BR-0106"
    int max_size_mb
    int max_count
    json required_for_services
  }
  APPLICATION_FIELD_VALUE {
    uuid value_id PK
    uuid application_id FK
    uuid field_id FK
    text value
  }
  APPLICATION_ATTACHMENT {
    uuid application_attachment_id PK
    uuid application_id FK
    uuid rule_id FK
    uuid attachment_id FK
  }
  SERVICE_REQUEST {
    uuid service_request_id PK
    uuid trainer_id FK
    string requested_service "excludes already-approved - BR-0110"
    json delta_field_values "only mandatory missing fields - BR-0111"
    string status
    string decision "approve | reject - no screening path, BR-0112"
    string rejection_reason
    uuid addendum_id FK "mandatory before approval - BR-0305"
    datetime submitted_at
    datetime decided_at
  }
  SPEAKER_RECORD {
    uuid speaker_record_id PK
    uuid user_id FK
    string full_name_ar
    string full_name_en
    string organisation
    text bio "⟨gap⟩ Speaker Fields matrix pending - J-04"
    uuid created_by FK
    datetime created_at
  }
```

---

### 3.4 CAP-02 — screening, AI, interview, committee, decision

Everything hangs off `APPLICATION_SERVICE`, never `APPLICATION` — each service is
evaluated and accredited independently (§6.1, `BR-0403`).

> **Implementation notes (2026-08-31, `P-187`):** migration 06 deviates from
> this ERD in three recorded places, each forced by the built wire contracts:
> `INTERVIEW` references `APPLICATION` (one ticket, one slot set, one
> committee — J-06/J-07's shape; the per-service independence lives in
> `INTERVIEW_AXIS_SCORE.service`); `EVALUATION_CRITERION.source_field_id` is
> `source_section_code` (the J-05 matrix scores the form's sections 2–6, not
> single fields); and the J-07/F3 post-interview decision columns live on
> `INTERVIEW`. The member assignment is an `INTERVIEW_EVALUATION` row with
> `submitted_at IS NULL`, which makes `BR-0220` a query rather than a flag.

**`AI_ANALYSIS` is a sibling of `SCREENING_RESULT`, never a column on it**
(`BR-0201`/`BR-0202`, §2.2).

```mermaid
erDiagram
  EVALUATION_MODEL ||--|{ EVALUATION_CRITERION : "weighted by"
  APPLICATION_SERVICE ||--o| SCREENING_RESULT : screened
  EVALUATION_MODEL ||--o{ SCREENING_RESULT : "scored with"
  SCREENING_RESULT ||--|{ SCREENING_CRITERION_SCORE : "broken down into"
  APPLICATION ||--o| AI_ANALYSIS : "advisory only - BR-0202"
  APPLICATION_SERVICE ||--o| INTERVIEW : "may require"
  INTERVIEW ||--|{ INTERVIEW_SLOT : proposes
  INTERVIEW_MODEL ||--|{ INTERVIEW_AXIS : "measured on"
  INTERVIEW ||--o{ INTERVIEW_EVALUATION : "evaluated by"
  INTERVIEW_EVALUATION ||--|{ INTERVIEW_AXIS_SCORE : scores
  APP_USER ||--o{ INTERVIEW_EVALUATION : conducts
  COMMITTEE_TEMPLATE ||--o{ COMMITTEE_SEQUENCE : "copied into"
  APPLICATION ||--o| COMMITTEE_SEQUENCE : "reviewed by"
  COMMITTEE_SEQUENCE ||--|{ COMMITTEE_STEP : "ordered 1..n"
  APP_USER ||--o{ COMMITTEE_STEP : "acts in"
  APPLICATION_SERVICE ||--o| ACCREDITATION_DECISION : concludes

  EVALUATION_MODEL {
    uuid model_id PK
    string service
    string version
    decimal pass_threshold "⟨gap⟩ DM-GAP-02"
    bool is_active "editable by sysadmin, no deploy - BR-0203"
    datetime effective_from
  }
  EVALUATION_CRITERION {
    uuid criterion_id PK
    uuid model_id FK
    string label_ar
    string label_en
    uuid source_field_id FK "tied to a form field - DM-GAP-02"
    decimal weight
    int order_index
  }
  SCREENING_RESULT {
    uuid screening_result_id PK
    uuid application_service_id FK
    uuid model_id FK
    decimal objective_score "fixed formula, NO AI input - BR-0201"
    string decision "accept | reject | exempt_interview"
    string rejection_reason FK
    string exemption_reason "3 approved reasons + other - J-08"
    uuid decided_by FK
    datetime decided_at
    datetime sla_due_at
  }
  SCREENING_CRITERION_SCORE {
    uuid score_id PK
    uuid screening_result_id FK
    uuid criterion_id FK
    decimal raw_score
    decimal weighted_score
  }
  AI_ANALYSIS {
    uuid analysis_id PK
    uuid application_id FK
    text summary_ar "qualitative questions ONLY - BR-0202"
    decimal advisory_score "SEPARATE - never merged into the official score"
    string provider "INT-06, provider-agnostic port - P-132"
    string model_version "stored so the analysis stays explainable"
    string prompt_version
    string status "produced | unavailable - degrades without blocking"
    datetime produced_at
  }
  INTERVIEW {
    uuid interview_id PK
    uuid application_service_id FK
    string ticket_number "survives reschedules - J-06/F4/AC-6"
    string status
    uuid confirmed_slot_id FK
    bool can_request_reschedule "server-decided"
    text reschedule_note
    string meeting_url "Teams - integration not in CAP-12"
    datetime sla_due_at "3 business days - J-06/F1/AC-4"
  }
  INTERVIEW_SLOT {
    uuid slot_id PK
    uuid interview_id FK
    datetime starts_at
    datetime ends_at
    bool is_superseded "kept, so a reschedule history exists"
  }
  INTERVIEW_MODEL {
    uuid interview_model_id PK
    string service
    string version
    string aggregation_rule "⟨gap⟩ DM-GAP-03"
    bool is_active
  }
  INTERVIEW_AXIS {
    uuid axis_id PK
    uuid interview_model_id FK
    string label_ar
    string label_en
    decimal weight
    decimal max_score
  }
  INTERVIEW_EVALUATION {
    uuid interview_evaluation_id PK
    uuid interview_id FK
    uuid evaluator_user_id FK
    uuid interview_model_id FK
    bool did_not_attend
    decimal total_score
    text note
    datetime submitted_at "result withheld until all respond - BR-0220"
  }
  INTERVIEW_AXIS_SCORE {
    uuid axis_score_id PK
    uuid interview_evaluation_id FK
    uuid axis_id FK
    decimal score
  }
  COMMITTEE_TEMPLATE {
    uuid template_id PK
    string name
    json members "COPIED on reuse, never referenced - J-09"
    uuid created_by FK
  }
  COMMITTEE_SEQUENCE {
    uuid sequence_id PK
    uuid application_id FK
    uuid created_from_template_id FK
    string status
    int current_step_index "sequential, auto-advance - J-09"
  }
  COMMITTEE_STEP {
    uuid step_id PK
    uuid sequence_id FK
    uuid member_user_id FK
    int order_index
    bool is_mandatory "mandatory rejection halts; optional logs a note"
    string decision "approve | reject | request_modification"
    text note
    datetime acted_at
  }
  ACCREDITATION_DECISION {
    uuid decision_id PK
    uuid application_service_id FK
    string outcome "accredited | rejected"
    string classification "⟨gap⟩ per service - BR-0403"
    uuid decided_by FK
    datetime decided_at
  }
```

---

### 3.5 CAP-03 — agreement, addenda, signing, lifecycle

One unified agreement per person covering every accredited service; an added
service becomes an **addendum**, never a second agreement (§6.1). The document is
authored **outside** the platform (§9.2) — uploaded, linked, tracked, never
edited here.

> **Implementation notes (2026-08-31, `P-188`):** migration 07 deviates in four
> recorded places. The party is `APP_USER` (`TRAINER_PROFILE` arrives with
> BE-09). **`AGREEMENT_DOCUMENT` is not built** — `G26` means nothing can store
> a file, so `ADDENDUM.document_file_name` stands in and every `documentUrl`
> serves null rather than a dead link. The applicant's J-11 decision lives on
> `AGREEMENT` (they are not an internal `SIGNATORY`). And **`expired` is
> derived** from `ends_at` on read, never stored: a lapse is a fact about the
> calendar, not an act someone performed. `BANK_DATA` (J-09/F6) is added here
> too — one row per user, requested by the committee's final approval.

```mermaid
erDiagram
  TRAINER_PROFILE ||--o{ AGREEMENT : "party to"
  AGREEMENT ||--|{ AGREEMENT_SERVICE : covers
  AGREEMENT ||--o{ ADDENDUM : "extended by"
  AGREEMENT_TEMPLATE ||--o{ AGREEMENT : "prepared from"
  AGREEMENT ||--o| AGREEMENT_DOCUMENT : "evidenced by"
  ADDENDUM ||--o| AGREEMENT_DOCUMENT : "evidenced by"
  ATTACHMENT ||--o| AGREEMENT_DOCUMENT : stores
  AGREEMENT ||--o| SIGNING_SEQUENCE : "signed through"
  SIGNING_SEQUENCE ||--|{ SIGNATORY : "ordered 1..n"
  SIGNATORY ||--o| E_SIGNATURE : produces
  AGREEMENT ||--o{ AGREEMENT_EVENT : "lifecycle history"
  SERVICE_REQUEST ||--o| ADDENDUM : creates

  AGREEMENT {
    uuid agreement_id PK
    uuid trainer_id FK
    uuid template_id FK
    string reference
    string status "active|suspended|expired|ended"
    date starts_at
    date ends_at
    int term_years "1 first, 3 on renewal - BR-0302"
    int renewal_count
    int next_term_years "server-derived, no input exists"
    string expiry_milestone "90|30|5 days - BR-0303"
    datetime created_at
  }
  AGREEMENT_SERVICE {
    uuid agreement_service_id PK
    uuid agreement_id FK
    string service "Speaker never appears here - BRD 6.1"
    uuid accreditation_decision_id FK
  }
  ADDENDUM {
    uuid addendum_id PK
    uuid agreement_id FK
    string service "the added service"
    uuid document_id FK "MANDATORY before approval - BR-0305"
    uuid approved_by FK
    datetime approved_at
  }
  AGREEMENT_TEMPLATE {
    uuid template_id PK
    string name
    string version
    json field_map "⟨gap⟩ DM-GAP-16"
    bool is_active "System Administrator owns it - J-12/F4"
  }
  AGREEMENT_DOCUMENT {
    uuid document_id PK
    uuid attachment_id FK
    string origin "prepared OUTSIDE the platform - BRD 9.2"
    string kind "agreement | addendum | signed_copy"
    int version
  }
  SIGNING_SEQUENCE {
    uuid sequence_id PK
    uuid agreement_id FK
    string status
    int current_step_index
    bool is_complete "send gate needs this AND a signature - BR-0213"
  }
  SIGNATORY {
    uuid signatory_id PK
    uuid sequence_id FK
    uuid user_id FK
    int order_index
    string party "internal_reviewer | internal_signer | applicant"
    string decision "sign | reject | request_modification"
    text note
    datetime acted_at
  }
  E_SIGNATURE {
    uuid signature_id PK
    uuid signatory_id FK
    string signature_name "the typed full name - G26 keeps it minimal"
    string ip_address
    datetime signed_at
  }
  AGREEMENT_EVENT {
    uuid event_id PK
    uuid agreement_id FK
    string kind "prepared|sent|signed|activated|renewed|suspended|reactivated|ended"
    int term_years
    text note
    uuid actor_user_id FK
    datetime occurred_at
  }
```

---

### 3.6 CAP-04 — the trainer profile and everything under it

⚠️ **Split mastership** (`P-134`, corrects `P-130`). The **base profile is
FAST's** — it already exists there as `dbo.AspNetUsers` + `profile.*`, which is
what the supplied files describe. Expert Hub masters only the **accreditation
layer**: `TRAINER_SERVICE`, `file_status`, `VISIBILITY_CONSENT`, `TRAINER_RATING`
and `TRAINER_RECORD`.

> **Implementation note (2026-08-31, `P-192`):** migration 09 builds
> `TRAINER_PROFILE`, `TRAINER_SERVICE`, `TRAINER_FIELD_VALUE`,
> `PROFILE_CHANGE_REQUEST`, `TRAINER_RECORD`, `RATING_SOURCE_RECORD` and
> `TRAINER_RATING`. The **FAST-mastered sub-entities below — `EDUCATION`,
> `PROFESSIONAL_CERTIFICATION`, `PRACTICAL_EXPERIENCE`, `TRAINING_COURSE`,
> `AREA_OF_*`, `AVAILABILITY` — are deliberately NOT built.** They are FAST's
> own tables, and what the built contract renders is a flat `fieldValues` map
> over the shared application schema (`BR-0404`: the same fields, no separate
> update form) — so `TRAINER_FIELD_VALUE` holds it, and the replicas arrive
> with the INT-05a inbound feed that would populate them (no agreed
> contract; `G41`–`G44` are MTM's, not INT-05a's — corrected 2026-09-02).
> `BANK_DATA` shipped with BE-08 keyed by **user**, not trainer: J-09/F6
> collects it before the trainer record exists.

Changes are **dual via write-through**: an edit to a FAST-mastered field made in
Expert Hub is forwarded to FAST and shown as saved only once FAST accepts it, so
the two copies cannot diverge. See
[`08_BACKEND_ARCHITECTURE.md`](08_BACKEND_ARCHITECTURE.md) §1.2.2.

```mermaid
erDiagram
  APP_USER ||--|| TRAINER_PROFILE : becomes
  TRAINER_PROFILE ||--|{ TRAINER_SERVICE : "accredited for"
  TRAINER_PROFILE ||--o{ EDUCATION : holds
  TRAINER_PROFILE ||--o{ PROFESSIONAL_CERTIFICATION : holds
  TRAINER_PROFILE ||--o{ PRACTICAL_EXPERIENCE : holds
  TRAINER_PROFILE ||--o{ TRAINING_COURSE : attended
  TRAINER_PROFILE ||--o{ AREA_OF_TRAINING : declares
  TRAINER_PROFILE ||--o{ AREA_OF_COOPERATION : declares
  TRAINER_PROFILE ||--o{ AVAILABILITY : declares
  TRAINER_PROFILE ||--o| BANK_DATA : holds
  TRAINER_PROFILE ||--o{ PROFILE_CHANGE_REQUEST : requests
  TRAINER_PROFILE ||--o{ TRAINER_RECORD : accumulates
  TRAINER_PROFILE ||--o{ RATING_SOURCE_RECORD : receives
  TRAINER_PROFILE ||--o{ TRAINER_RATING : "calculated into"

  TRAINER_PROFILE {
    uuid trainer_id PK
    uuid user_id FK
    string fast_user_profile_id FK "FAST masters the base profile - P-134"
    string file_status "EXPERT HUB masters this - INTERNAL ONLY, BR-0408"
    date date_of_birth
    string gender
    string nationality
    string id_type "national|iqama|gcc|passport"
    string id_number
    string address_ar
    string address_en
    string city
    string country
    string job_title_ar
    string job_title_en
    string organisation
    string social_media_url "one URL - Q19 says the card wants several"
    uuid photo_attachment_id FK
    uuid cv_attachment_id FK
    datetime created_at "after signature - J-13"
  }
  TRAINER_SERVICE {
    uuid trainer_service_id PK
    uuid trainer_id FK
    string service
    string classification "independent per service - BR-0403"
    date accredited_at
    string status
  }
  EDUCATION {
    uuid education_id PK
    uuid trainer_id FK
    string qualification_type FK
    string specialization "Q16 - which is the public one"
    string general_specialization
    date date_obtained
    string awarding_body
    uuid attachment_id FK
    string request_status
  }
  PROFESSIONAL_CERTIFICATION {
    uuid certification_id PK
    uuid trainer_id FK
    string certificate_name
    date date_obtained
    string awarding_body
    uuid attachment_id FK
    string request_status
  }
  PRACTICAL_EXPERIENCE {
    uuid experience_id PK
    uuid trainer_id FK
    string job_title
    string organisation
    date date_from
    date date_to
    bool still_employed
    bool is_part_time
    text main_task
    string request_status
  }
  TRAINING_COURSE {
    uuid course_id PK
    uuid trainer_id FK
    string course_name
    string field
    date date_from
    date date_to
    int number_of_days
    string course_level FK
    string organisation
    bool is_provided "attended vs delivered"
    uuid attachment_id FK
  }
  AREA_OF_TRAINING {
    uuid area_id PK
    uuid trainer_id FK
    string field_code FK "Q19 - likely the card's Related Fields"
    string training_level FK
  }
  AREA_OF_COOPERATION {
    uuid cooperation_id PK
    uuid trainer_id FK
    string cooperation_area FK
    string language FK
    string event_type
  }
  AVAILABILITY {
    uuid availability_id PK
    uuid trainer_id FK
    string working_type "matching criterion - in class | online"
    string week_availability
    string day_availability
  }
  BANK_DATA {
    uuid bank_data_id PK
    uuid trainer_id FK
    string bank_country
    string bank_city
    string bank_name
    string branch
    string iban
    string swift_code
    string name_on_card
    string account_number "8 mandatory - J-09/F6/AC-3"
    uuid iban_attachment_id FK "FAST has it, J-09 does not mention it"
    datetime completed_at
  }
  PROFILE_CHANGE_REQUEST {
    uuid change_request_id PK
    uuid trainer_id FK
    string target_entity
    uuid target_id
    json proposed_value
    string status "request-change fields need approval - J-14"
    uuid decided_by FK
    text decision_note
  }
  TRAINER_RECORD {
    uuid record_id PK
    uuid trainer_id FK
    uuid engagement_id FK
    string program_name_ar
    string program_name_en
    date delivered_from
    date delivered_to
    decimal program_rating "the Academy record - J-13/F1/AC-5, J-15/F1"
    string entitlement_status
  }
  RATING_SOURCE_RECORD {
    uuid record_id PK
    uuid trainer_id FK
    string mtm_record_id "INT-02 master"
    uuid engagement_id FK
    decimal raw_value "IMMUTABLE original - 02D"
    int scale_low
    int scale_high
    int response_count
    date source_date
    string sync_status
    datetime received_at
  }
  TRAINER_RATING {
    uuid rating_id PK
    uuid trainer_id FK
    string scope "overall | per_program"
    uuid engagement_id FK
    decimal calculated_value "Expert Hub owns every calculated figure - 02D"
    string calculation_version "⟨gap⟩ DM-GAP-14"
    datetime calculated_at
  }
```

---

### 3.7 CAP-05 — assignment, matching, offer, engagement, material

The longest chain in the product: a centre's need becomes a pool, a pool becomes
an offer, an offer becomes an engagement, an engagement may need material — or
may end early.

> **Implementation note (2026-09-01, `P-194`):** migration 10 builds the
> fourteen Expert-Hub tables below. The **`EXT_FAST_*` mirrors — PROGRAM,
> PLAN, SCHEDULE_DAY, PLAN_TAKER, PLAN_TRAINER — are NOT built.** There is no
> FAST plan read (`G41`–`G44`), and `Q20` leaves `PlanTaker` unsupplied, so an
> `ASSIGNMENT_REQUEST` carries the centre's own entered form (`DM-GAP-06`,
> `P-174`) in `form_values`, the wire's `pulled` payload serves null, and the
> execution view reports enrolment and attendance as unavailable with the gap
> named. `MATCHING_MODEL.weights` is seeded evenly (`DM-GAP-05` approves no
> distribution) and `tie_break_rule` is null rather than authored.

```mermaid
erDiagram
  EXT_FAST_PROGRAM ||--o{ EXT_FAST_PLAN : "scheduled as"
  EXT_FAST_PLAN ||--|{ EXT_FAST_SCHEDULE_DAY : "runs over"
  EXT_FAST_PLAN ||--o{ EXT_FAST_PLAN_TAKER : "enrols (Q20)"
  EXT_FAST_PLAN ||--o{ EXT_FAST_PLAN_TRAINER : "staffed by"
  EXT_FAST_PLAN ||--o{ ASSIGNMENT_REQUEST : "requested for"
  ASSIGNMENT_REQUEST ||--|{ ASSIGNMENT_SLOT : "needs 1..n"
  ASSIGNMENT_REQUEST ||--o{ MATCHING_RUN : "matched by"
  MATCHING_MODEL ||--o{ MATCHING_RUN : "ranked with"
  MATCHING_RUN ||--o{ MATCH_CANDIDATE : ranks
  MATCHING_RUN ||--o{ MATCH_EXCLUSION : excludes
  TRAINER_PROFILE ||--o{ MATCH_CANDIDATE : "considered as"
  TRAINER_PROFILE ||--o{ MATCH_EXCLUSION : "ruled out as"
  ASSIGNMENT_REQUEST ||--o{ CANDIDATE_POOL : "sent as"
  CANDIDATE_POOL ||--|{ POOL_MEMBER : "exactly 3 per slot - BR-0505"
  TRAINER_PROFILE ||--o{ POOL_MEMBER : "nominated as"
  ASSIGNMENT_SLOT ||--o{ SLOT_CYCLE : "re-routed through"
  ASSIGNMENT_SLOT ||--o{ ASSIGNMENT_OFFER : "one live at a time"
  ASSIGNMENT_OFFER ||--o| ENGAGEMENT : "accepted becomes"
  ENGAGEMENT ||--o| ENGAGEMENT_TERMINATION : "may end early"
  ENGAGEMENT ||--o| EXT_FAST_PLAN_TRAINER : "syncs into"
  ENGAGEMENT ||--o{ MATERIAL_SUBMISSION : "may require"
  MATERIAL_SUBMISSION ||--|{ SUBMISSION_ROUND : "reviewed over"
  ATTACHMENT ||--o| SUBMISSION_ROUND : carries

  ASSIGNMENT_REQUEST {
    uuid request_id PK
    string reference
    string service_type "⟨gap⟩ only trainer defined - J-16 open item 1"
    uuid fast_plan_id FK
    int required_headcount
    uuid requesting_centre_id "منسق مركز scope"
    uuid created_by FK
    string status "matching | nominated | closed"
    datetime created_at
  }
  ASSIGNMENT_SLOT {
    uuid slot_id PK
    uuid request_id FK
    int slot_number
    uuid confirmed_engagement_id FK
    string fast_sync_state "per slot, never per request - J-18/F4/AC-1"
    bool exhausted "J-19 trigger"
  }
  MATCHING_MODEL {
    uuid matching_model_id PK
    string version
    json weights "⟨gap⟩ DM-GAP-05 - language, delivery mode, evaluation"
    text tie_break_rule
    bool is_active
  }
  MATCHING_RUN {
    uuid run_id PK
    uuid request_id FK
    uuid matching_model_id FK
    int required_pool_size "headcount x 3"
    uuid run_by FK
    datetime run_at
  }
  MATCH_CANDIDATE {
    uuid match_candidate_id PK
    uuid run_id FK
    uuid trainer_id FK
    json weighted_scores "the breakdown behind the rank"
    decimal total_score
    int rank
  }
  MATCH_EXCLUSION {
    uuid exclusion_id PK
    uuid run_id FK
    uuid trainer_id FK
    json reasons "specialization|location|schedule_conflict|file_status"
  }
  CANDIDATE_POOL {
    uuid pool_id PK
    uuid request_id FK
    string status "not_built | sent | decided"
    string path "engine | manual - exclusions apply either way"
    datetime sent_at
  }
  POOL_MEMBER {
    uuid pool_member_id PK
    uuid pool_id FK
    uuid trainer_id FK
    decimal price_in_class "from their active agreement - BR-0515"
    decimal price_online
    string currency
    string decision "per candidate, never a group verdict - J-17/F4/AC-1"
    int preference_rank
    datetime decided_at
  }
  SLOT_CYCLE {
    uuid cycle_id PK
    uuid slot_id FK
    int cycle_number "counted, never capped - J-19/F3/AC-3"
    string status "exhausted | awaiting_approval | decided"
    uuid pool_id FK
  }
  ASSIGNMENT_OFFER {
    uuid offer_id PK
    uuid slot_id FK
    uuid trainer_id FK
    string status "awaiting_response|accepted|rejected|expired"
    decimal price
    string currency
    datetime sent_at "system-sent, no manual action - J-18/F1/AC-1"
    datetime response_due_at "3 days - J-18/F2/AC-1"
    datetime responded_at
  }
  ENGAGEMENT {
    uuid engagement_id PK
    uuid offer_id FK
    uuid trainer_id FK
    uuid fast_plan_id FK
    string status "upcoming|in_progress|completed|withdrawn|cancelled"
    datetime confirmed_at
    datetime schedule_changed_at "FAST moved the dates - J-21/F1/AC-3"
  }
  ENGAGEMENT_TERMINATION {
    uuid termination_id PK
    uuid engagement_id FK
    string kind "withdrawn | cancelled"
    string actor "trainer | staff | fast"
    string reason "two closed lists, kept apart - J-22"
    text note "required when reason is other"
    string fast_cancel_reason_code "PlanCancelReasonId, when actor is fast"
    uuid acted_by FK
    datetime occurred_at
  }
  MATERIAL_SUBMISSION {
    uuid submission_id PK
    uuid engagement_id FK
    string kind "training_material | service_content"
    string status "awaiting_upload|pending_approval|changes_requested|approved"
    uuid attachment_rule_id FK "the J-01 rules apply - J-20/F1/AC-2"
    string fast_sync_state "material path only - J-20/F3"
    datetime opened_at
  }
  SUBMISSION_ROUND {
    uuid round_id PK
    uuid submission_id FK
    int round_number
    uuid attachment_id FK
    string decision "approved | changes_requested - NO rejection exists"
    text note "mandatory on changes_requested - J-20/F2/AC-3"
    uuid decided_by FK
    datetime decided_at
  }
```

---

### 3.8 CAP-06 — entitlements

> **Implementation note (2026-09-01, `P-196`):** migration 11 builds both
> tables below **except `ENTITLEMENT.linkage_complete`**, which is annotated
> DERIVED here and is therefore not a column: it is computed from the three
> ids by `EntitlementLinkage.Resolve` on every read, so a chain that changes
> after the row was written cannot leave a stale `true` behind. Two further
> notes. `EXT_ERP_PURCHASE_ORDER` also carries **`currency`** — the block
> below omits it while `ENTITLEMENT` requires one, and an amount without its
> currency is not a fact; read the omission as a transcription gap. And
> `agreement_id`/`engagement_id` are **nullable**, because that is exactly
> what `BR-0603` is about: hop 2 resolves from the trainer's active agreement,
> hop 3 only from an engagement ERP names — which, per `Q39`, it currently
> never does.

```mermaid
erDiagram
  EXT_ERP_PURCHASE_ORDER ||--|| ENTITLEMENT : "one record per PO"
  TRAINER_PROFILE ||--o{ ENTITLEMENT : receives
  AGREEMENT ||--o{ ENTITLEMENT : "linked through the PO"
  ENGAGEMENT ||--o{ ENTITLEMENT : "linked to the programme"

  EXT_ERP_PURCHASE_ORDER {
    string po_number PK "ERP master - INT-03"
    string trainer_ref
    decimal amount
    string disbursement_status
    date disbursement_date
  }
  ENTITLEMENT {
    uuid entitlement_id PK
    uuid trainer_id FK
    string purchase_order_number FK
    uuid agreement_id FK "BR-0602 hop 2"
    uuid engagement_id FK "BR-0602 hop 3"
    string disbursement_status_code "⟨gap⟩ Q27 - ERP values undefined"
    string disbursement_status_label_ar
    string disbursement_status_label_en
    decimal amount "consumed whole - BR-0601"
    string currency
    date disbursement_date
    bool linkage_complete "DERIVED - false hides it from the trainer, BR-0603"
    datetime last_synced_at
    string sync_status "BR-1203 last known state"
  }
```

---

### 3.9 CAP-07 — notifications and deadlines

The matrix and SLA **tables** are buildable now; their **rows** are `DM-GAP-08`
and `DM-GAP-10`. `SLA_INSTANCE` is the live countdown on one specific record —
what every P-J4 badge in the frontend renders.

⚠️ **Corrected 2026-08-27 (P-147):** `NOTIFICATION_MATRIX_ROW` previously carried
a `channel` column annotated *"email AND in-platform together"*. A column whose
only legal value is "both" is not a column — `BR-0702` leaves nothing to choose,
so it is removed. Channel lives on `NOTIFICATION_LOG`, where it records what
actually happened, and where one channel can fail while the other succeeds.

⚠️ **`SLA_MATRIX_ROW.duration` is nullable in two distinct ways** (P-150/P-151),
and the frontend contract models both: a deadline may be **record-derived** —
J-12's agreement expiry follows the agreement's own term, and only the 90/30/5
reminder schedule is central — or its duration may simply be **undefined**,
which is `DM-GAP-10` for that row. A single nullable number cannot tell those
apart, and treating them alike would either invent a duration or discard an
approved rule.

```mermaid
erDiagram
  NOTIFICATION_EVENT ||--o{ NOTIFICATION_MATRIX_ROW : "routed by"
  NOTIFICATION_TEMPLATE ||--o{ NOTIFICATION_MATRIX_ROW : renders
  NOTIFICATION_MATRIX_ROW ||--o{ NOTIFICATION_LOG : produces
  APP_USER ||--o{ NOTIFICATION_LOG : receives
  NOTIFICATION_EVENT ||--o{ SLA_MATRIX_ROW : "deadlined by"
  SLA_MATRIX_ROW ||--o{ SLA_INSTANCE : instantiates

  NOTIFICATION_EVENT {
    string event_code PK
    string capability_code "any of the twelve"
    string name_ar
    string name_en
  }
  NOTIFICATION_TEMPLATE {
    uuid template_id PK
    string code
    string subject_ar
    string subject_en
    text body_ar
    text body_en "approved bilingual only - BR-0701"
    json placeholders
    int version
  }
  NOTIFICATION_MATRIX_ROW {
    uuid row_id PK
    string event_code FK
    string audience "⟨gap⟩ DM-GAP-08"
    uuid template_id FK
    bool is_active
  }
  NOTIFICATION_LOG {
    uuid log_id PK
    string event_code FK
    uuid recipient_user_id FK
    string channel
    string send_status "success | failure"
    text failure_reason
    uuid source_entity_id
    datetime sent_at
  }
  SLA_MATRIX_ROW {
    uuid sla_id PK
    string capability_code
    string action_code
    int duration "⟨gap⟩ DM-GAP-10"
    string unit "business_days | days"
    json reminder_offsets "90/30/5 for agreements - BR-0303"
  }
  SLA_INSTANCE {
    uuid instance_id PK
    uuid sla_id FK
    string entity_type
    uuid entity_id
    datetime started_at
    datetime due_at
    string state "within | approaching | breached - server-decided"
    datetime resolved_at
  }
```

---

### 3.10 CAP-09 — analytics

**Owns no source data** (§8.9.1). It stores definitions and reads everything else.

> **Implementation note (2026-09-02, `P-198`):** migration 12 builds
> `METRIC_DEFINITION`, `DASHBOARD` and `DASHBOARD_METRIC`. **`REPORT_DEFINITION`
> and `REPORT_RUN` are NOT built** — `F-0905`'s export half has no service
> contract, no screen and no definitions (`Q26` supplies neither reports nor
> parameters), so a table with no reader and no writer would be the dead entry
> `P-123` warns about; same handling as CAP-05's `EXT_FAST_*` mirrors.
> `DASHBOARD` also carries **`feature_code`**, so the row and the gate that
> opens it agree. ⚠️ **`METRIC_DEFINITION.formula` is null on every seeded
> row** and the computation lives in `MetricRegistry`, keyed by `code`: §8.9
> writes no formulas, so there is nothing to interpret — that column is where
> they go when `Q26` answers.

```mermaid
erDiagram
  METRIC_DEFINITION ||--o{ DASHBOARD_METRIC : "placed on"
  DASHBOARD ||--|{ DASHBOARD_METRIC : arranges
  ROLE ||--o{ DASHBOARD : "scoped to"
  REPORT_DEFINITION ||--o{ REPORT_RUN : produces
  APP_USER ||--o{ REPORT_RUN : requests

  METRIC_DEFINITION {
    uuid metric_id PK
    string code
    string name_ar
    string name_en
    string source_capability
    text formula "⟨gap⟩ DM-GAP-09"
    string aggregation_level
  }
  DASHBOARD {
    uuid dashboard_id PK
    int role_id FK "one per role - F-0901..F-0904"
    string name_ar
    string name_en
  }
  DASHBOARD_METRIC {
    uuid dashboard_id FK
    uuid metric_id FK
    int order_index
  }
  REPORT_DEFINITION {
    uuid report_id PK
    string name_ar
    string name_en
    json parameters
    string data_scope "follows CAP-08 - BRD 8.9.1"
  }
  REPORT_RUN {
    uuid run_id PK
    uuid report_id FK
    uuid requested_by FK
    json parameter_values
    string export_format
    uuid attachment_id FK
    datetime run_at
  }
```

---

### 3.11 CAP-10 — public presence

`PUBLIC_PROFILE` is a **projection gated by consent**, and its field list is
exhaustive (J-24/F2/AC-1) — there is nowhere to put a field the journey does not
name.

```mermaid
erDiagram
  TRAINER_PROFILE ||--o| VISIBILITY_CONSENT : controls
  VISIBILITY_CONSENT ||--o| PUBLIC_PROFILE : gates

  VISIBILITY_CONSENT {
    uuid consent_id PK
    uuid trainer_id FK
    bool is_granted "withdrawable at any time - BR-1002"
    uuid changed_by FK
    datetime changed_at
  }
  PUBLIC_PROFILE {
    uuid trainer_id PK
    string name
    string domain "⟨gap⟩ Q16 - vocabulary unresolved"
    json specializations
    int programs_delivered "EXHAUSTIVE list - BR-1004 corrected"
    datetime projected_at "automatic update - BR-1005"
  }
  LANDING_CONTENT {
    uuid block_id PK
    string block_code
    string title_ar
    string title_en
    text body_ar
    text body_en
    int order_index
  }
```

---

### 3.12 CAP-12 — integration governance and replication

`REPLICATION_STATE` is what makes entity-level mastership (§1.1) operable: one
row per shared entity instance, recording which side is master and when the two
last agreed.

> **Implementation note (2026-08-30, `P-183`):** migration 03 builds these four
> tables **plus `OUTBOX_MESSAGE`** — the transactional outbox `08` §4.2 rule 3
> mandates, which this ERD never drew: `(system_code, element_name, entity_type,
> entity_id, entity_version, operation, payload, idempotency_key UNIQUE, status
> pending|published, attempt_count, next_attempt_at, last_error, created_at,
> published_at)`. `INTEGRATION_LOG` is append-only, enforced the same way as
> `AUDIT_LOG`.

```mermaid
erDiagram
  INTEGRATED_SYSTEM ||--o{ DATA_ELEMENT : exchanges
  INTEGRATED_SYSTEM ||--o{ INTEGRATION_LOG : "traced by"
  INTEGRATED_SYSTEM ||--o{ REPLICATION_STATE : replicates

  INTEGRATED_SYSTEM {
    string system_code PK "INT-01..INT-06"
    string name_ar
    string name_en
    string direction "inbound|outbound|bidirectional"
    json benefiting_capabilities
    string importance
    bool is_active
  }
  DATA_ELEMENT {
    uuid element_id PK
    string system_code FK
    string element_name
    string owning_system "the source-of-truth matrix - BR-1201"
    string entity_name
    string direction
  }
  INTEGRATION_LOG {
    uuid log_id PK
    string system_code FK
    string operation
    string entity_type
    uuid entity_id
    string idempotency_key "a retry must not duplicate"
    string outcome "success | failure - BR-1204"
    text error_detail
    int attempt_number
    datetime occurred_at
  }
  REPLICATION_STATE {
    uuid state_id PK
    string entity_type
    uuid local_entity_id
    string remote_entity_id
    string system_code FK
    string master_side "expert_hub | remote - P-129"
    int local_version
    int remote_version
    datetime last_synced_at
    string drift_status "in_sync | pending | drifted"
  }
```

---

## 4. Source-of-truth matrix

From §8.12.4, extended to every entity group. **This table decides what the
database may author.**

| Data | Owner | Expert Hub holds | Rule |
|---|---|---|---|
| User identity | **Academy site** (INT-01) | A reference. No credential | `BR-1205` |
| Trainee evaluation (raw) | **MTM** (INT-02) | A permanent, immutable record | `02D` §1 |
| Calculated rating indicators | **Expert Hub** | Owned outright | `02D` §1 |
| Disbursement status / amount / date | **ERP** (INT-03) | A mirror per PO, never editable | `BR-0601`, `BR-1206` |
| Programme execution (enrolment, scheduling) | **FAST** (INT-05) | A reference + display cache | §8.12.4 |
| **Trainer profile data shown in FAST** | **Expert Hub** | Owned, **published outbound to FAST** | §8.12.4 |
| Agreement document content | **Prepared outside the platform** | Upload + link + status only | §9.2 |
| Everything in §9.3 | **Expert Hub** | Owned outright | §9.3 |

---

## 5. Integration points — where each one crosses

| | System | Direction | Trigger | Data | Writes / reads |
|---|---|---|---|---|---|
| **INT-01** | Academy site | ⇄ | Login; entry links | Identity, navigation | Reads → `APP_USER`. `BR-1205`: no credential stored |
| **INT-02** | MTM | ← in | Evaluation submitted | Raw ratings, scale, instructor, programme | Writes `RATING_SOURCE_RECORD`; **never FAST-mediated** (J-21/F6/AC-2) |
| **INT-03** | ERP | ← in | Disbursement processed | PO no., amount, status, date, trainer | Writes `ENTITLEMENT`; recomputes `linkage_complete` |
| **INT-04** | Email gateway | → out | Any matrix event | Recipient, rendered template, status | Reads `NOTIFICATION_MATRIX_ROW`; writes `NOTIFICATION_LOG` |
| **INT-05a** | FAST | ← in | Plan/programme read; execution updates | Plan, programme, schedule, **enrolment + attendance** | Populates `EXT_FAST_*` references. ⚠️ `PlanTaker` **not supplied** (`Q20`) |
| **INT-05b** | FAST | → out | Engagement confirmed | Accredited trainer, `PlanTrainer.TrainerId` | Expert Hub is the owner here (§8.12.4) |

Every one of the six writes `INTEGRATION_LOG` (`BR-1204`), and every one must
survive failure by keeping the last known state (`BR-1203`).

---

## 6. Cross-cutting requirements

- **Audit immutability** — `AUDIT_LOG` is append-only; §8.8.2 calls it «غير قابل
  للتعديل». No update or delete path exists.
- **Bilingual by default** — every user-facing name/label is a pair
  (`*_ar` / `*_en`). FAST already models it this way (`NameAr`/`NameEn`,
  `BriefAr`/`BriefEn`).
- **Soft-delete / retention** — blocked on `DM-GAP-15`; no archival strategy is
  assumed here.
- **Last-known-state** — `last_synced_at` + `sync_status` on every mirrored
  entity (`BR-1203`).

---

## 7. What still blocks the field lists

The entities and relationships above stand. **Columns cannot be finalised** for
these until the input arrives:

| Input | Blocks |
|---|---|
| `DM-GAP-01` | `APPLICATION_FIELD_VALUE`, `ATTACHMENT` rules |
| `DM-GAP-02` | `SCREENING_RESULT` scoring columns |
| `DM-GAP-03` | `INTERVIEW_EVALUATION.axis_scores` |
| `DM-GAP-05` | `POOL_MEMBER` weights and tie-breaking |
| `DM-GAP-06` | `ASSIGNMENT_REQUEST` field set |
| `DM-GAP-07` | `PERMISSION`, `ROLE_PERMISSION`, `USER_ROLE.scope_ref` |
| `DM-GAP-08` | `NOTIFICATION_MATRIX_ROW` rows |
| `DM-GAP-09` | CAP-09 metric definitions (no storage of its own) |
| `DM-GAP-10` | `SLA_MATRIX_ROW` rows |
| `DM-GAP-14` | `TRAINER_RATING` calculation rules |
| `DM-GAP-15` | Retention / archival across every entity |
| `Q20` | `EXT_FAST_PLAN_TAKER` — enrolment **and** attendance |
| `Q21` | 19 `lookup.*` value lists |
| `Q27` | `ENTITLEMENT.disbursement_status` values |
| `Q28` | `AI_ANALYSIS.provider_ref` — the AI provider is not a registered integration |

---

## 8. Next steps

1. **Confirm the two ownership calls in §1.2 and §4** — especially that Expert
   Hub owns the trainer data FAST displays, and that MTM records are permanent
   rather than cache. Both change the schema materially.
2. **Settle `DM-GAP-07`** (roles/permissions) — it gates `USER_ROLE.scope_ref`,
   which the *منسق مركز* restriction depends on, and CAP-08 is the recommended
   next build.
3. **Ask FAST for `PlanTaker`** (`Q20`) — the only entity in §3.5 with no
   definition at all.
4. Then: physical schema per capability, in the build order in
   [`14_INTERNAL_DASHBOARD_BRD_REVIEW.md`](14_INTERNAL_DASHBOARD_BRD_REVIEW.md) §3.
