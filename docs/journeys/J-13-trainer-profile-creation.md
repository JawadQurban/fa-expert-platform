# Journey J-13 — Trainer Profile Creation

**Journey Name (AR):** إنشاء ملف المدرب

**Interface:** System (automatic, no user-facing action)

---

### Journey Scope

Covers the automatic creation of the Trainer Profile the moment an applicant's approval is fully finalized (agreement signed in J-11). This is the single source of truth for the approved trainer going forward. Ends once the profile exists, is populated, linked to its related entities, and its status is determined. Ongoing profile updates, full display, and derived view/export features are covered in later journeys (J-14, J-15).

---

## User Flow

1. The applicant completes signing in J-11, and the agreement becomes active
2. The system automatically creates the Trainer Profile at this exact moment — no manual trigger, no staff action
3. The profile is populated from the finalized application: approved service(s), specialization, and identifying data
4. The active agreement, related requests (starting empty), and financial/entitlement data are linked to the profile — each from its own original source
5. The profile's status is calculated automatically per the Trainer Profile Status matrix
6. From this point on, the Trainer Profile becomes the single source of truth consumed by all other capabilities

---

### Supporting Matrix: Trainer Profile Status & Conditions

| # | Status | Condition |
| --- | --- | --- |
| 1 | Active | Agreement in effect, and at least one engagement executed within the last 6 months |
| 2 | Idle | Agreement in effect (contractually active), but no engagement executed within the last 6 months — for monitoring purposes only, with no effect on matching eligibility *(BR-0408)* |
| 3 | Suspended | Agreement suspended by staff (J-12/F3) |
| 4 | Expired | Agreement ended without renewal |

---

### Key Features & Functionality

**F1. Automatic Trainer Profile Creation**
Description: The moment a trainer's signature completes the agreement in J-11, the system creates their Trainer Profile automatically, with no manual step involved.

| AC ID | Acceptance Criteria |
| --- | --- |
| AC-1 | Given the applicant's signature is completed and the agreement becomes active (J-11), then the Trainer Profile is created automatically at that exact moment *(BR-0401)* |
| AC-2 | Given profile creation, then it is never created manually under any circumstance — the trigger is exclusively the finalized agreement signature *(BR-0401)* |
| AC-3 | Given the profile is created, then it is populated with the approved service(s), specialization, classification, and core identifying data carried over from the finalized application, including the applicant's bank data collected in J-09 — stored as part of the same profile entity, not a separate linked record |
| AC-4 | Given the profile is created, then the active agreement from J-11 is linked to it — its actual source of truth remains CAP-03, and the profile displays it as a direct reference |
| AC-5 | Given the profile is created, then related requests are linked to it — every assignment/engagement request executed via CAP-05 — starting empty and accumulating with each new request |
| AC-6 | Given the profile is created, then the trainer's financial/entitlement data is linked to it — its actual source remains CAP-06 (fully consumed from ERP), displayed as a direct reference with no internal calculation |
| AC-7 | Given the profile exists, then it becomes the single source of truth for this trainer, consumed by all downstream capabilities (CAP-05 matching, CAP-09 reporting, CAP-10 public directory, etc.) |
| AC-8 | Given a trainer holds more than one approved service, then a single, unified profile covers all their services — their core data is never duplicated across services within the same profile |
| AC-9 | Given the profile is created, then its status is determined per the **Trainer Profile Status matrix** below — calculated and updated automatically based on agreement status and engagement activity, never set manually |
| AC-10 | Given the profile status is calculated, then it is **visible to internal Trainer Management staff only** — never displayed to the trainer themselves or on any public-facing view *(BR-0408)* |

---

### Supporting Matrix: Trainer Profile Status & Conditions

| # | Status | Condition |
| --- | --- | --- |
| 1 | Active | Agreement in effect, and at least one engagement executed within the last 6 months |
| 2 | Idle | Agreement in effect (contractually active), but no engagement executed within the last 6 months — for monitoring purposes only, with no effect on matching eligibility *(BR-0408)* |
| 3 | Suspended | Agreement suspended by staff (J-12/F3) |
| 4 | Expired | Agreement ended without renewal |