# Expert Hub ↔ FAST Integration Requirements

*For the FAST / API team. Prepared 2026-09-16 by the Expert Hub team.
Operation paths are from the FAST portal API register (`/fa-api`, 325 operations).
Every field named below is a **requested capability**, not an assumption about
what FAST exposes. Please confirm, correct, or point to the right endpoint.*

## Purpose

Expert Hub is the Financial Academy's platform for recruiting, accrediting and
assigning trainers, consultants, content developers and question writers. It needs
**backend-to-backend** access to FAST's authoritative reference and operational
data, so that:

- application and profile forms offer FAST's own lists (countries/nationalities,
  sectors → job families, education types) instead of local copies;
- an assignment request (journey J-16) can select a FAST **Program + Plan** and
  take its operational details from FAST instead of re-typing them.

Today the only FAST token Expert Hub holds is the **signed-in user's**, and only
during the sign-in handshake. That token is discarded afterwards and is never
used for service work. Expert Hub keeps a scheduled, persisted copy of each
reference list (idempotent, deactivate-never-delete, last good copy kept when
FAST is unavailable), so forms never depend on FAST being online. That copy stays
empty until a service credential exists.

The browser never calls FAST. Credentials stay in the Expert Hub API's secret
store and are never logged, returned by an API, or placed in frontend
configuration.

## 1. Authentication required

We request **OAuth 2.0 Client Credentials**, or FAST's approved equivalent
machine-to-machine mechanism, for the Expert Hub API.

| # | Please confirm | Our current understanding |
|---|---|---|
| A1 | Is client-credentials (or an equivalent) supported for the portal API? | **The STS supports it** — the testing discovery document (read 2026-10-05) lists `client_credentials` in `grant_types_supported`. Still to confirm: that a client may be issued it for the portal API. |
| A2 | Token endpoint URL, per environment | Testing: `https://testingauth.fa.gov.sa/identitymanagement.sts/connect/token` (from discovery; Expert Hub discovers it, so nothing is hard-coded). Auth methods: `client_secret_basic`, `client_secret_post`. Production authority still to confirm. |
| A3 | How a client ID is provisioned, and who requests it | — |
| A4 | How the client secret (or certificate / private-key JWT) is issued, delivered and rotated | — (please deliver out-of-band, **not** in documents or email threads) |
| A5 | Required scope(s) or audience for read access to `Lookup/*`, `FinancialSkills/*`, `Program/*` | The STS advertises a `fast_integration` scope; we assume it is this one. Please confirm. |
| A6 | Token lifetime, and whether refresh tokens are issued (we expect to re-request) | — |
| A7 | Environments where the client is valid (testing / UAT / production), and whether each needs its own client | — |
| A8 | IP allow-listing or network restrictions (the API runs in a container behind the server's Nginx) | — |
| A9 | Rate limits or quotas (we expect about one full reference refresh per day per list, plus per-request Program/Plan reads in J-16) | — |
| A10 | Do these endpoints accept a **service principal** token, or only a user token? | The register shows Bearer on every operation. |

**The service token provider is built** (2026-10-05, `ClientCredentialsFastTokenProvider`). Setting
`Fast__ClientId` and `Fast__ClientSecret` (secret store) and `Fast__Scope` switches
server-to-server calls on with no release. What we still need from FAST is the
client itself (A3, A4) and A10.

## 2. Required reference APIs

For each endpoint, please confirm the **request contract** (query or body),
**response contract** (field names and types), **pagination**, **localization**
(one language per call via `Accept-Language`, or both in one response), and
**active/inactive behaviour** (are retired values omitted or flagged?).

| Endpoint | What we use it for | What the register shows today |
|---|---|---|
| `GET Lookup/GetCountries` | nationality, bank country | typed `CountryRegistrationLookupDto`: `id, nameAr, nameEn, nationalityAr, nationalityEn, countryCode, nafathMappingCode, isRestricted` |
| `GET Lookup/GetSectors` | sector dropdown | `200 OK`, **no schema** |
| `GET Lookup/GetAllEducationType` | qualification type | `200 OK`, **no schema** |
| `GET Lookup/GetTopics` | topic (programme classification) | `200 OK`, **no schema** |
| `GET Lookup/GetCompetencyLevels` | competency / trainee level | `200 OK`, **no schema** |
| `POST FinancialSkills/GetFrameworkStructure` | Sector → Department → Job Family | response typed; **request `FrameworkStructureRequestDto` undocumented** |
| `GET FinancialSkills/GetJobFamilyDetails?familyId&sectorId` | job-family detail | typed `JobFamilyDetailsResponseDto` |
| `GET FinancialSkills/GetJobFamilyPrograms?familyId&sectorId` | programmes per job family | typed `ProgramDto[]` |
| `POST Program/Search` | programme catalogue | request `FilterProgramDto` and response **both undocumented** |
| `GET Program/GetProgramDetails?programId` | one programme | typed `ProgramDetailsDto` |
| `GET Program/GetPlansByProgramId?programId` | plans of a programme | `200 OK`, **no schema** (see §4) |

If FAST has **better authoritative endpoints** (for example a dedicated reference
or integration API, or delta/changed-since feeds), we would rather use those.

**Countries question — `isRestricted`:** what does `isRestricted = true` mean
(registration, exams, payment, sanctions…)? Expert Hub stores the flag and does
nothing with it until FAST defines it (status `PENDING_FAST_DEFINITION`).

## 3. Programme catalogue

**Q-P1. Which endpoint returns the COMPLETE catalogue of active Financial Academy
programmes?** We found these, and none is clearly authoritative:

| Endpoint | Why it's not enough on its own |
|---|---|
| `GET Home/TopMenu` | Menu trees (`programs`, `excutivePrograms`, `digitalPrograms`). Unclear whether they're complete. |
| `POST Program/Search` | Contract undocumented |
| `GET Program/Overview` | Landing-page subsets (featured, of the month, self-learning) |
| `GET Program/GetProgramDetails` | One programme at a time |

**Q-P2. Does `Home/TopMenu` return every active programme, or only programmes
configured to appear in the menu?**

**Q-P3. Please confirm which of these fields a catalogue item exposes, and under
what names:**

| Requested field | Notes |
|---|---|
| Program ID | stable across languages and time? |
| Program Code | if one exists |
| Program Name (Arabic) | |
| Program Name (English) | both in one response, or one per `Accept-Language`? |
| Status | active / inactive / archived; are inactive programmes returned? |
| Program Type | e.g. executive, digital, public, private |
| Sector | ID + name |
| Job Family | ID + name |
| Topic | ID + name |
| Training Method | in-person / remote / blended |
| Language | |

## 4. Plan contract (HIGH PRIORITY)

**Q-L1. Please provide the complete response contract of
`GET Program/GetPlansByProgramId?programId=`.** The register records only `200 OK`.

**Q-L2. Does a Plan expose the following?** If not, which API is authoritative for
each field?

| Requested field | Assignment Matrix reference (FA DB, for orientation only) |
|---|---|
| Plan ID | |
| Plan Code | |
| Program ID | |
| Plan Status (incl. "Final Closed") | J-16 excludes closed or ended plans |
| Centre | |
| Start Date / End Date | `plan.PlanScheduleDay.StartDate/EndDate` |
| Training Days | `plan.Plan.NumberOfDays` |
| Training Hours | |
| Delivery Method | `plan.Plan.PlanLocationId → lookup.PlanLocation` (best guess) |
| Location (country / city) | `plan.Plan.CountryId / CityId` (best guess) |
| Teams URL | `plan.Plan.TeamsUrl` (best guess) |
| Period (morning / evening) | "field not identified yet — needs FAST confirmation" |
| Language | `plan.Plan.LanguageId` |
| Trainee Level | `program.Program.ProgramParticipantLevelId` |
| Prospectus / brochure | `program.Program.ProspectusAttachmentId` (best guess) |
| Client / organisation (private programmes) | "Organization list — needs FAST" |
| Trainer / Instructor | |
| Training Material Status | |

**Q-L3.** Forms 3 (workshop / meeting / seminar) and 5 (question writing) are
also FAST-driven in the approved Assignment Matrix, sourced from events and exams.
Are `Event/Search` + `Event/GetEventDetails` and `Exam/Search` +
`Exam/GetExamDetailsById` the right sources, and are they contract-complete?

## 5. Why: J-16 Assignment Request Creation

A centre employee creates an assignment request, and Expert Hub matches and offers
it to accredited experts. The approved Assignment Matrix says that for forms 1, 2
and 4 the employee **selects a FAST Plan** and the operational fields below
**auto-fill** from FAST.

Because no Program/Plan contract is confirmed, **all of these are typed by hand
today** (`CreateRequestInputWire`, `AssignmentEndpoints.cs`). The request never
creates or changes anything in FAST.

| J-16 field (wire name) | Arabic label | Matrix says it should come from |
|---|---|---|
| `programName` | اسم البرنامج / اسم الفعالية / اسم الاختبار | Program / Event / Exam name |
| `daysCount` (+ `daysCountOther`) | عدد الأيام | `Plan.NumberOfDays` |
| `dateFrom`, `dateTo` | التاريخ المقرر (من–إلى) | Plan schedule start/end |
| `period` | الفترة | unidentified (FAST to confirm) |
| `deliveryMechanism` | آلية التنفيذ | Plan location type |
| `city` | المدينة / الموقع | Plan country/city or Teams URL |
| `language` | لغة التدريب / المحتوى | `Plan.LanguageId` |
| `traineeLevel` | مستوى المتدربين | Program participant level |
| `clientName` | اسم العميل | FAST organisation |
| `attachmentName` | النشرة التعريفية | Program prospectus |
| `specializationDomain` | مجال التخصص | Sector → Job Family (§6) |

Form 6 (consultations / other) is manual by design and isn't part of this request.
Nothing is identified today as a **FAST Plan ID** on the request, so a request can't
be traced back to its FAST plan.

## 6. Sector → Job Family contract

For `POST FinancialSkills/GetFrameworkStructure` please provide:

1. the **request body** (`FrameworkStructureRequestDto`): filters, paging
   parameters, and how to request the full structure;
2. the **response body**, confirming `items[] {jobFamilyId, sectorId, sector,
   department, jobFamily, detailsUrl}` and `filters.sectors[] / jobFamilies[]
   {id, text, value, isSelected}`;
3. **pagination**: page size limits and total count;
4. **localization**: names per `Accept-Language`, or both languages at once;
5. **active/inactive** behaviour for retired sectors or job families;
6. whether IDs are stable, and how Sector → Department (sub-sector) → Job Family
   relates to `cmpt.Sector`, `cmpt.JobFamilySector` and `cmpt.JobFamily`.

Expert Hub currently uses its own 147-value domain list. It won't migrate to FAST's
taxonomy until this contract is confirmed and a business mapping is approved.

## 7. Summary of what we need from FAST

| # | Item | Blocks |
|---|---|---|
| 1 | Service credential (client credentials or equivalent) plus answers A1–A10 | every reference sync |
| 2 | `GetPlansByProgramId` contract, plus the Plan fields in §4 | J-16 Program/Plan auto-fill |
| 3 | Authoritative complete programme catalogue (§3) | J-16 programme selection |
| 4 | `FrameworkStructureRequestDto`, plus §6 answers | Sector → Job Family lists |
| 5 | Schemas for `GetSectors`, `GetAllEducationType`, `GetTopics`, `GetCompetencyLevels` | those dropdowns |
| 6 | Meaning of `isRestricted` | any behaviour on restricted countries |
| 7 | City, specialization and university lists: does FAST own any? (none found among the 325 operations) | those dropdowns stay free text |

## 8. Status — FAST's Training API (2026-10-20)

FAST answered with a new service, the **Training API** (testing:
`https://testingadminapi.fa.gov.sa/training`, OAuth client credentials, scope
`ims_training_api`). Its 27 operations (14 lookups, 6 plan, 5 programme, 1 survey,
1 trainer) are saved in `tools/fast-api/training-swagger-v1.json` and listed in
`docs/integrations/fast-training-api-register.md`. Every response is typed, so the
"no schema" gaps of §2–§4 are closed for what it covers. The blocked items of the
FAST contract document (B-01…B-17) against it:

| Item | Training API operation | Status in Expert Hub |
|---|---|---|
| B-01 permission | client credentials, scope `ims_training_api` | **Needs Confirmation (FAST):** the Expert Hub client is granted the scope in each environment; the production host |
| B-02 Yaqeen account creation | — | still blocked: no operation |
| B-03 programme list | `POST Program/Search` | built — request form programme dropdown (RUN-030, BUG-004, `P-357`) |
| B-04 programme details | `GET Program/GetProgramDetails`, `Program/{id}/Prospectus/File` | built — name, trainee level, prospectus as brochure (`P-357`, `P-361`) |
| B-05 plans of a programme | `GET Program/GetPlansByProgramId` | built — open plans only (`P-357`) |
| B-06 plan details | `GET Program/GetPlanDetails` | built — pulled fields; closed and ended plans refused (`P-357`) |
| B-07 assign trainer | `POST Plan/AssignTrainer` | built — outbox channel on confirmation (`P-358`) |
| B-08 remove trainer | `POST Plan/UnassignTrainer` | built — on withdrawal or de-link (`P-358`) |
| B-09 training material | `POST Plan/TrainingMaterial` | built — the approved material file (`P-358`); status code Needs Confirmation |
| B-10 trainees and attendance | `GET Plan/GetPlanTakers` | built — engagement view (`P-359`) |
| B-11 status, schedule, cancellation | `GET Plan/GetPlanStatus` | built — Teams link; worker for date changes and cancellation (`P-359`) |
| B-12 evaluations | `GET Survey/GetTrainerEvaluations` | built — engagement view (`P-359`); the answers are plan-level |
| B-13 profile by FAST user id | — | still blocked: no operation |
| B-14 delivered programmes | `GET Trainer/GetDeliveredPlans` | built — `TRAINER_RECORD` (`P-360`) |
| B-15 reference lists | `GET Lookup/Get*` (14) | built — synchronized daily (`P-356`); countries still from the portal API; no cities list |
| B-16 speaker account and email | — | still blocked: no operation (`P-347`) |
| B-17 speaker history | — | still blocked: no operation (`P-349`) |

Still open beyond the B-items: events and exams for forms 3 and 5 (§4 Q-L3); a
Saudi cities list (UAT BUG-005); the format of the portal's `countryCode` that the
bank-country IBAN check reads (RUN-026); foreign and GCC applicants and incomplete
prefill (BUG-016, BUG-018), which need B-02 or B-13; the meaning of `isRestricted` (§2).
