# 21 — FAST Reference Data

*Written 2026-09-16. Follows `19_FAST_API_ASSESSMENT.md` and `20_FAST_API_STUDY.md`,
and depends on `fa-portal-api-register.md` for every contract it cites. No live FAST
call was made while writing this. Anything marked "live 200" was already in the
register.*

## 1. The problem

Expert Hub only holds a FAST bearer token **inside a person's sign-in** (`P-215`
discards it afterwards). A required form field can't depend on a list that exists
only after someone signed in and FAST answered. The fix is a copy of each list that
Expert Hub owns:

```
FAST ──(service credential, backend only)──▶ FastReferenceDataSync (worker, daily)
                                                    │  idempotent upsert, deactivate-never-delete
                                                    ▼
                                    REFERENCE_VALUE (source = INT-05, synced_at, attributes)
                                                    │  + INTEGRATION_LOG row per run
                                                    ▼
                    GET /api/v1/reference-data/{list}   ◀── forms, profile, matching
                    GET /api/v1/internal/integration/reference-data   ◀── operations
```

The browser never calls FAST. No token, credential or FAST address appears on any
Expert Hub response.

## 2. Authentication discovery

| Question | Finding | Evidence |
|---|---|---|
| How does FAST authenticate? | A Bearer JWT on every operation. | `fa-portal-api-register.md` (all 325 ops); `19` §4 |
| Issuer | `https://testingauth.fa.gov.sa/identitymanagement.sts`, client `ReactApp`. Expert Hub's own client registration is still pending. | `16_SSO_OIDC_CONFIGURATION.md`, `15` Q38 |
| Client credentials / service account / M2M | **Not documented.** The discovery document was never captured, so the supported grant types are unknown. | `19` §4 option B "undocumented"; `18` §2.7 open; `20` §4 Q1 open |
| Any non-user credential in FAST? | Only `X-Backfill-ApiKey` on `TrainerContracts/backfill/generate`, which is scoped to one vendor backfill. It isn't a general credential and isn't reused here. | register |
| The old "public catalogue reads" claim | `FA-API-Reference.md` says catalogue and overview reads are anonymous, but the register says Bearer on everything. **Unverified.** | see §8, check 1 |
| An existing M2M pattern in Expert Hub | `TeamsMeetingProvider` uses `client_credentials` against Microsoft Graph. It's a different provider, but it's the shape to copy once FAST issues a client. | `ExpertHub.Infrastructure` |

**Classification: F** (no service credential available, contract unknown).
Rather than build a new auth mechanism, the sync goes through the existing
`IFastTokenProvider` seam, whose default `NoFastToken` returns nothing. With no
token a run records `WAITING_FOR_FAST_SERVICE_CREDENTIAL` and calls nothing. It
never uses a user's token.

**What FAST has to provide:** an OAuth client on the STS allowed to use
`client_credentials`, with read scope on `Lookup/*`, `FinancialSkills/*` and
`Program/*`. Its id and secret go in the platform secret store
(`Fast__ClientId`, `Fast__ClientSecret`) and never in `appsettings.json`. The only
code change is an `IFastTokenProvider` that fetches and caches that token.

## 3. Dataset classification

| Dataset | Endpoint | Classification | Contract | Used by Expert Hub | Syncable now |
|---|---|---|---|---|---|
| Countries / nationalities | `GET Lookup/GetCountries` | REFERENCE_DATA | typed `CountryRegistrationLookupDto[]`, live 200 | nationality, bank country | ✅ **implemented** |
| Sectors | `GET Lookup/GetSectors` | REFERENCE_DATA | "200 OK", untyped | sector field | ❌ response shape unknown |
| Sector → Job family | `POST FinancialSkills/GetFrameworkStructure` | REFERENCE_DATA | response typed; **request `FrameworkStructureRequestDto` undocumented** | domain cascade | ❌ can't build a request |
| Programs of a job family | `GET FinancialSkills/GetJobFamilyPrograms` | LEARNER_CATALOGUE | typed `ProgramDto[]` | — | depends on the row above |
| Programs | see §4 | LEARNER_CATALOGUE | partial | J-16 service, preferred programmes | ❌ |
| Plans | `GET Program/GetPlansByProgramId` | TRAINER_OPERATIONAL | "200 OK", untyped | J-16 | ❌ `FAST_PLAN_CONTRACT_PENDING` |
| Topics | `GET Lookup/GetTopics` | REFERENCE_DATA | untyped | — | ❌ |
| Qualification / education types | `GET Lookup/GetAllEducationType` | REFERENCE_DATA | untyped | qualification | ❌ |
| Competency levels | `GET Lookup/GetCompetencyLevels` | REFERENCE_DATA | untyped | — | ❌ |
| Cancellation reasons | `GET Lookup/GetCancellationReasons` | REFERENCE_DATA | untyped (AR+EN) | — | not needed |
| Calendar | `GET Home/Calendar` | LEARNER_CATALOGUE | typed, top items only | — | no |
| User info, qualifications, contracts | `Users/Info`, … | USER_SPECIFIC | typed | sign-in import (existing) | not reference data |
| Registrations, payments, exams | … | TRANSACTIONAL | — | — | NOT_RELEVANT |
| Cities, specializations, universities | **none among the 325 ops** | — | — | form fields | no source |

"Untyped" means the register records only `200 OK` and no schema. Writing a DTO for
one of these would be guessing, so none was written.

## 4. Programs

| Source | Complete? | Id | Localization | Active flag | Type / category | Verdict |
|---|---|---|---|---|---|---|
| `POST Program/Search` | presumably, via paging | — | — | — | — | request `FilterProgramDto` and response both **undocumented** |
| `GET Program/Overview` | **no**: featured, of-the-month and self-learning subsets | `ProgramDto.id` | one language per call | none | `mainCategories` | a landing page, not a catalogue |
| `GET Program/GetProgramDetails`, `GetProgramType` | a single program | ✅ | one language | — | ✅ | per-id enrichment only |
| `GET Home/TopMenu` | unknown: the `programs`, `excutivePrograms` and `digitalPrograms` menu trees, live 11 KB | `id` | one language | none | menu grouping | the **most promising** full list, but menus can be curated |
| `GET FinancialSkills/GetJobFamilyPrograms` | per job family | ✅ | one language | none | `trainingType`, `isExecutiveProgram` | complete only across all families, which needs §6 first |
| `GET Catalog/search` v1/v2 | keyword search | untyped | — | — | `CatalogItemType` | no schema |

**Recommendation:** `Home/TopMenu` as the list and `GetProgramDetails` for per-id
detail. Before relying on it, FAST needs to confirm that `TopMenu.programMenu`
lists **every** active program and not a curated menu. `ProgramDto` has no
`isActive`, so "active" would mean "present in the latest successful read". That
is exactly what the sync's deactivate-when-missing rule already does.

**Localization (design, not built):** labels come back in one language per call
(`Accept-Language`). A programs sync would make an AR call and an EN call, join them
on `id`, and fall back to the other language when one is missing. It would never translate. Countries don't need this:
`GetCountries` carries `nameAr` and `nameEn` together.

## 5. Plans

`GET Program/GetPlansByProgramId?programId=` exists and is described as "Retrieves
plans associated with a given program ID". **Its response has no schema** in either
reference, and nothing has ever consumed it. `ProgramDto` carries only `planId`,
`planNumberOfDays`, `planFees` and `startDate`, which describe the nearest plan and
not the plan list. **Status: `FAST_PLAN_CONTRACT_PENDING`.** J-16 is
unchanged.

## 6. Sector → Job family

**FAST structure** (response of `GetFrameworkStructure`): items
`{jobFamilyId, sectorId, sector, department, jobFamily, detailsUrl}`, plus filters
`sectors[]` and `jobFamilies[]` as `{id, text, value, isSelected}`, and paging. That
gives three levels, Sector → Department → Job Family, with localized names. It was
never called because its request body isn't documented.

**Expert Hub structure:** one flat list of 147 free-text Arabic values
(`dom-001`…`dom-147`, `shared/content/specializationDomains.ts`) taken from the
owner's workbook. There's no hierarchy and no English.

**Mapping:** there are no FAST job-family values in the repository, so **nothing
can be MATCH yet**. The table below is a structural pre-classification. It says
which values *could* map to a single job family once FAST's list is in hand.

- **NO_MATCH:** tools, exams, certifications and named programmes, audiences,
  service types, soft skills.
- **AMBIGUOUS:** one value spans several areas and would map to more than one job
  family.
- **POSSIBLE_MATCH:** one functional or sector area.

| Class | Count |
|---|---|
| MATCH | 0 |
| POSSIBLE_MATCH | 63 |
| AMBIGUOUS | 57 |
| NO_MATCH | 27 |

The per-value table is the business mapping artifact
[`domain-job-family-mapping.csv`](../inputs/domain-job-family-mapping.csv). It has one row
per `dom-NNN`, empty FAST Sector/Department/Job Family columns, and
`Mapping Status = PENDING_FAST_DATA` until FAST values are synchronized. The
structural class above sits in its own column. No POSSIBLE_MATCH becomes MATCH
without real FAST data and a business decision.

Near-duplicates the business may want to merge whatever FAST says: `dom-013` البنوك
/ `dom-118` المصرفية · `dom-125` الوعي المالي / `dom-141` وعي مالي · `dom-068`,
`dom-112` and `dom-134` (AML/CFT) · `dom-111` التقنية المالية / `dom-144` الفنتك ·
`dom-139` إدارة مشاريع (PMP) / `dom-145` إدارة المشاريع.

**Recommendation:** don't replace the 147 values yet. Once the sync can read the
framework, list FAST's job families beside this table and have the business pick
a target per value. Keep every `dom-NNN` code resolvable, because historical
answers carry it.

## 7. What was implemented

| Piece | Where |
|---|---|
| `REFERENCE_VALUE.source`, `.attributes`, `.synced_at` (additive, nullable) plus list `fast-country` (not editable) | migration `M27FastReferenceData` |
| Sync: idempotent upsert on FAST id, deactivate-never-delete, empty or failed read keeps the last copy, one `INTEGRATION_LOG` row per run (`INT-05`, `reference-sync`) | `Infrastructure/Fast/FastReferenceDataSync.cs` |
| Worker: runs at start-up and then every `Fast:ReferenceSyncIntervalHours` (24); idle without a DB or `Fast:BaseUrl` | same file |
| Lookup provider: `GET /api/v1/reference-data/{listCode}[?includeInactive=true]`, authenticated | `Api/ReferenceData/ReferenceDataEndpoints.cs` |
| Status: `GET /api/v1/internal/integration/reference-data` (counts, last attempt, outcome, error, last success) | `Api/Integration/IntegrationEndpoints.cs` |
| Tests with FAST mocked at the HTTP layer | `tests/ExpertHub.Api.Tests/FastReferenceDataTests.cs` |

**Countries:** the code is FAST's `id`, and the labels are `nameAr`/`nameEn`.
`nationalityAr`, `nationalityEn`, `countryCode`, `nafathMappingCode` and
`isRestricted` travel in `attributes`. **`isRestricted` is carried with no
behaviour**, because nothing documents what a restricted country means to the
Academy. `FastCountryReader` typed `nafathMappingCode` as a string where the DTO
says integer. That would have failed a real read, and it's fixed.

There is no manual "sync now" endpoint. The CAP-12 integration surface is
read-only by design, so the worker schedules the runs.

**No form field reads this list yet.** Until a credential exists the table is
empty, and switching nationality to it would empty a required dropdown. When it
switches, `nationality = gcc` and other old answers stay readable, because they're
stored as given and resolved against `includeInactive=true`.

## 8. Checks the owner can run

1. **Is `GetCountries` actually anonymous?**
   `curl -s -o /dev/null -w "%{http_code}" https://<fast-host>/fa-api/api/v1/Lookup/GetCountries`
   run with no `Authorization` header. A `200` means the countries sync needs no
   credential, and `IFastTokenProvider` could skip it for that one list. A `401`
   confirms classification F.
2. **What grants does the STS allow?** Fetch
   `https://testingauth.fa.gov.sa/identitymanagement.sts/.well-known/openid-configuration`
   and look for `client_credentials` in `grant_types_supported`.
