# 13 — FAST Data Dictionary: what arrived, and what it settles

**Status:** analysis of the two field files supplied 2026-08-23.
**Sources:** `fast-trainer-profile-fields.xlsx` (155 rows) · `fast-trainer-history-fields.xlsx` (253 rows).
**Scope note from the owner:** *"this is the data needed so far and it should be
extended further; we will build our own database after we finalise the
architecture."* This document therefore records what the files **settle**, what
they **leave open**, and what they **newly raise** — it is not a database design.

---

## 0. What arrived

**15 tables, 406 fields**, across two systems:

| System | Table | Fields | What it is |
|---|---|---:|---|
| Identity | `dbo.AspNetUsers` | 38 | Login, names (AR/EN, 4 parts each), contact, activity, **MTM rating rollups** |
| Profile | `profile.UserProfile` | 60 | Personal, job, address, **bank data**, consents, attachments |
| Profile | `profile.Education` | 9 | Qualifications, `Specialization` + `GeneralSpecialization` |
| Profile | `profile.ProfessionalCertification` | 8 | Certificates |
| Profile | `profile.PracticalExperience` | 11 | Employment history |
| Profile | `profile.TrainingCourse` | 14 | Courses attended |
| Profile | `profile.AreasOfTraining` | 4 | Training field + level |
| Profile | `profile.AreasOfCooperation` | 5 | Cooperation area + language + event type |
| Profile | `profile.UserAvailabilityWorkingType` | 5 | Working type + weekly/daily availability |
| Training | `plan.PlanTrainer` | 13 | **The trainer↔plan link**, plus per-plan MTM ratings |
| Training | `plan.Plan` | 94 | The offering: schedule, location, costs, status, cancellation, Teams URL |
| Training | `plan.PlanScheduleDay` | 8 | Per-day start/end date and time, `IsLatestSchedule` |
| Training | `program.Program` | 111 | The programme: names, briefs, marketing copy, fees, versioning |
| Survey | `Survey.Instructor` | 9 | The instructor record MTM evaluations attach to |
| Survey | `Survey.SurveyResponse` | 17 | Raw responses: `AnswerData`, `QuestionID`, `ScaleLow`/`ScaleHigh` |

---

## 1. Built contracts that now have a verified FAST source

Everything below was built against the journeys' *named* fields. All of them
exist, with the names the journeys used. Nothing built has to change.

| Journey / AC | Field the journey named | Confirmed in the files |
|---|---|---|
| J-18/F4/AC-1 | `PlanTrainer.TrainerId` | `plan.PlanTrainer.TrainerId` (+ `PlanId`, `IsFreelance`) |
| J-21/F5/AC-1 | "last `PlanScheduleDay.EndDate`" | `plan.PlanScheduleDay.EndDate` — **and `IsLatestSchedule`**, which is how "last" is identified |
| J-20/F5/AC-1 | `Plan.TrainingMaterialStatusId` | present, `int → lookup.TrainingMaterialStatus` |
| J-20/F5/AC-2 | `Plan.TrainingMaterialAttachmentId` | present |
| J-22/F3/AC-1 | `PlanCancelReasonId` / `CancelReasonOther` | both present, plus `CanceledBy` / `CanceledOn` |
| J-16 row 11 · J-21/F2/AC-1 | the Teams URL | `plan.Plan.TeamsUrl` |
| J-16/F2/AC-2 | Final-Closed exclusion | `PlanStatusId`, `FinalClosedOn`, `FinalClosedBy`, `ClosedOn` |
| J-16/F3/AC-2 | programme-level identity brief | `program.Program.BriefAr` / `BriefEn` |
| J-16 rows 4–10 | days, hours, fee, language, country, city, dates | `NumberOfDays`, `NumberOfHours`, `ProgramFees`, `LanguageId`, `CountryId`, `CityId`, `PlanScheduleDay.*` |

Two small deltas worth noting, neither of which breaks anything:

- **`Plan.NumberOfHours` is `float`, not `int`.** Half-hours are representable.
  Our `hours: number` already carries that.
- **Language, country and city are `int` ids**, not strings. The Expert Hub API
  resolves them before they reach the browser — which is the arrangement `02C` §5
  already mandates.

---

## 2. What these files settle

### 2.1 `Q14` — bank-data permanence · **answered**

J-09/F6/AC-3 lists eight mandatory bank fields. All eight exist, and **all eight
sit on `profile.UserProfile` — the permanent profile, not a per-agreement table**:

| J-09/F6/AC-3 | `profile.UserProfile` |
|---|---|
| bank's country | `BankCountry` |
| bank's city | `BankCity` |
| bank name | `BankName` |
| branch name | `BankBranch` |
| IBAN | `BankIBAN` |
| SWIFT code | `BankSwiftCode` |
| name on the bank card | `NameInBankCard` |
| account number | `BankAccount` |

Modelled on the profile since J-09 was built (flagged, not assumed) — this
confirms it. FAST also carries a ninth field the journey does not mention:
**`IbanAttachmentId`**, an IBAN document. Worth deciding whether Expert Hub
collects it too.

⚠️ This is *FAST's* answer. Expert Hub's own database is not yet designed, so
confirm the rule is being adopted rather than merely observed.

### 2.2 `Q19` — Identity Card row 7 (Social Media) · **source found, shape disputed**

`profile.UserProfile.SocialMediaUrl nvarchar(500)` exists. But J-15's matrix row
says "Social Media **Accounts**" — plural — and the schema offers **one URL**.

EH-INT-08 currently renders the row as explicitly unavailable (P-73). It can now
render one link. **Decide:** is a single URL the intended field, or does the card
need several (which FAST cannot currently hold)?

### 2.3 `DM-GAP-01` — Application Fields matrix · **narrowed, not closed**

J-01's Application Fields matrix cells are literally `?`. These files do not
supply that matrix — but they supply **the field universe it must draw from**.
The eight profile tables are, structurally, the application form: basic info,
personal/job, education, certifications, experience, courses, training areas,
cooperation areas, availability. That is six of J-01's sections with real column
names behind them.

What is still missing is the *business* layer: which fields are asked, which are
mandatory **per service**, and which are read-only. That remains `DM-GAP-01`.

---

## 3. What these files do **not** settle

### 3.1 `plan.PlanTaker` is absent — J-21's biggest open item

J-21/F3/AC-3 names **`PlanTaker`** as the enrollee source, and F4/AC-1 leaves the
attendance/absence field explicitly pending. `PlanTaker` is **not in either
file**, so both remain open:

- the enrollee list source (names only, per F3/AC-2)
- the attendance/absence field name (J-21 open item 1)

**This is the single most actionable ask.** One table would close both.

### 3.2 Nineteen lookup tables are referenced, none supplied

Every `lookup.*` target is named and none of their rows arrived:

`CooperationArea` · `CourseLevel` · `EducationType` · `FoodServicePeriod` ·
`Language` · `MaritalStatus` · `PlanCancelReason` · `PlanLocation` ·
`PlanStatus` · `ProgramParticipantLevel` · `ProgramPurpose` · `ProgramSkillType`
· `ProgramType` · `TargetGender` · `TrainingAreasFeild` · `TrainingLevel` ·
`TrainingMaterialStatus` · `TrainingType` · plus `program.ProgramMedia`.

Four of them are load-bearing for code already written:

| Lookup | Why it matters | What is coded today |
|---|---|---|
| `TrainingMaterialStatus` | J-20/F5/AC-1's "New/Current/Book/Not Available/**etc.**" | `TRAINING_MATERIAL_STATUSES` union — **unconfirmed**; `enablesTrainerUpload` is deliberately written as "not `not-available`" so an unseen value behaves as material-carrying |
| `TrainingType` | Most likely the source of in-class vs online | `deliveryMode: 'in-class' \| 'online'` |
| `PlanLocation` | J-21/F2/AC-2's "inside the Academy or outside it" | `VenueScope` union — plus `RoomId` vs `ExternalLocationId` may be the real discriminator |
| `PlanCancelReason` | J-22/F3/AC-1's cancellation reasons | Rendered as an opaque code + text, never translated — correct until the list exists |

### 3.3 `Q16` — domain vs specialization · **candidates now exist, the ruling does not**

Three candidate vocabularies arrived, and J-24/F2/AC-1 needs exactly two public
values ("domain" and "specialization"):

- `profile.Education.Specialization` **and** `GeneralSpecialization` — a two-level
  pair, but scoped to an *education record*, not to the trainer
- `profile.AreasOfTraining.FeildId → lookup.TrainingAreasFeild` (+ `TrainingLevelId`)
- `profile.AreasOfCooperation.CooperationAreaId → lookup.CooperationArea`

**Needs a ruling on which pair is the public domain/specialization.** The public
profile still renders specialization only; no domain has been invented.

`Q19` row 5 ("Related Fields") most plausibly resolves to
**`profile.AreasOfTraining`** — the column is literally named `Feild` — but that
is an inference, not a confirmation.

---

## 4. New questions these files raise

### 4.1 MTM ratings exist at **three** levels, pre-aggregated

| Where | Fields |
|---|---|
| `AspNetUsers` | `MTMInstructorRating`, `MTMInstructorResponceCount`, `MTMOneRating`…`MTMFiveRating` |
| `PlanTrainer` | `MTMInstructorRating`, `MTMInstructorResponceCount`, `MTMInstructorOneRating`…`FiveRating` |
| `Plan` | `MTMOverAllRating`, `MTMInstructorRating`, `MTMOneRating`…`MTMFiveRating`, `MTMResponceCount` |
| `Survey.SurveyResponse` | the **raw** answers: `AnswerData`, `QuestionID`, `ScaleLow`, `ScaleHigh` |

`02D` establishes a two-way split — MTM owns raw values, Expert Hub owns every
calculated indicator. **FAST holds pre-calculated MTM figures too**, which makes
it three-way. J-21/F6/AC-2 says evaluations reach the platform "directly from
MTM, **without FAST as an intermediary**" — so which of these is the source of
record for the trainer's displayed rating needs settling before the rating module
is built. `TraineeEvaluationDto` currently carries a raw value + scale and is
labelled as MTM's own, never as a calculated figure — which stays correct either
way, but the aggregation story does not exist yet.

### 4.2 FAST has three "Expert" flags, and they are not our four services

`profile.UserProfile` carries `ExpertCorrector`, `ExpertReviewer`,
`ExpertQuestionAuthor` — three booleans. Expert Hub accredits **four** services:
trainer, consultant, content developer, question writer.

Only *question writer* lines up (`ExpertQuestionAuthor`). There is no
`ExpertTrainer` or `ExpertConsultant` bit, and `Corrector` / `Reviewer` are roles
Expert Hub does not model at all. **How is service accreditation represented?**

### 4.3 Two consent booleans already exist

`MandatoryExpertDeclaration` and `OptionalPhotoConsent` on `profile.UserProfile`.
J-23 governs public-visibility consent, and J-01 has a declaration step. Are
these the same two consents, or different ones?

### 4.4 Two cells in the supplied file are notes, not lookups

In `fast-trainer-history-fields.xlsx`, the **Lookup Table** column holds Arabic prose
on two rows:

| Row | Field | Cell contents |
|---|---|---|
| 232 | `Survey.Instructor.InstructorEmail` | «تقييم المدرب للمتدربين - فاست» |
| 233 | `Survey.Instructor.CertificationDetails` | «مب مربوط فعليا الا في شرط اغلاق البرنامج» |

They read as comments that landed in the wrong column. The second is
significant — it says the field *is not actually wired except in the
programme-closing condition*. Worth moving to a Notes column so it is not parsed
as a foreign key.

---

## 5. What changed in the code · **done 2026-08-23**

### 5.1 Provenance became data, and the data is checked

`frontend/src/shared/fast/` now holds three files:

| File | What it is |
|---|---|
| `fastSchema.ts` | **Generated** from the two field files — 15 tables, 406 columns, nothing inferred. Regenerate with `tools/data/extract-fast-schema.py` from the repo root after either file grows |
| `fastSources.ts` | Every FAST-sourced Expert Hub field → its `Table.Column`, with the journey/AC that requires it — plus `PENDING_FAST_SOURCES`, the fields we render that have **no** supplied column |
| `fastSources.test.ts` | Asserts every claim against the snapshot |

The test is the point (P-116). **A FAST column nobody supplied cannot be claimed
without failing the build** — the same discipline the journeys get, applied to
the data dictionary. It also asserts the gaps *as gaps*: that `PlanTaker` is
still absent, that no lookup table arrived, and that every pending entry names
the question that would settle it.

The map is also the shopping list for the Academy's own database: FAST supplied
**406 columns; the frontend consumes about 50.**

### 5.2 Two models were thinner than reality, and are now not

Both were pre-existing defects the schema exposed rather than caused:

- **The identity brief is bilingual** (P-114). `Program.BriefAr` *and* `BriefEn`
  exist; we carried one `string`. In an Arabic-primary product with an English
  toggle, an English reader saw Arabic prose inside an otherwise translated
  panel. Now `LocalizedText` — the type `name` already used.
- **An MTM evaluation has a scale *range*** (P-115). `SurveyResponse` holds
  `ScaleLow` **and** `ScaleHigh`; we carried `scale: number`, which assumed every
  survey starts at 1. A 0–10 instrument would have rendered as "7 out of 10".
  Now `scaleLow` + `scaleHigh`, and the copy says "on a scale of X to Y".

### 5.3 What deliberately did **not** change

**No DTO was renamed to match a FAST row** (P-118). `02C` §5 keeps FAST out of
the browser — the API resolves `LanguageId`, `CountryId` and `CityId` into labels
before they arrive. Renaming DTO fields to FAST's columns would leak one system's
schema into another's contract, and would have to be undone the moment the
Academy's own database replaces FAST as the immediate source. Provenance is
recorded *about* the fields, not *in* their names.

Unapproved enumerations still arrive as **served configuration** (P-24, P-83), so
`TRAINING_MATERIAL_STATUSES` and `VenueScope` absorb the real lookup rows when
they come without a refactor — both are single-file unions written so an unseen
value degrades safely.

---

## 6. The ask, in priority order

1. **`plan.PlanTaker`** — closes the enrollee source *and* J-21's attendance
   field in one table.
2. **The 19 lookup tables' rows** — four are load-bearing today
   (`TrainingMaterialStatus`, `TrainingType`, `PlanLocation`, `PlanCancelReason`).
3. **A ruling on `Q16`** — which pair is the public domain/specialization.
4. **`Q19` row 7** — is one `SocialMediaUrl` the intended field, or several?
5. **Service accreditation** — how the four Expert Hub services are represented,
   given FAST's three `Expert*` bits.
6. **The MTM three-level question** (§4.1) — before the rating module is built.
