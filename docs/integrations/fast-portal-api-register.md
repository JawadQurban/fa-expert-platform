# FA Portal API Register

Every operation published by `Ims.Portal.Api` on the Financial Academy testing portal — the parameters it takes, the payload it declares in return, and the fields inside that payload. Read straight from the OpenAPI 3.0 definitions at `/fa-api/swagger/v1/swagger.json` and `/fa-api/swagger/v2/swagger.json`.

| | |
|---|---|
| **Host** | `testingportal.fa.gov.sa` |
| **Base path** | `/fa-api` |
| **Auth** | Bearer JWT (`Authorization: Bearer <token>`) |
| **Required header** | `Accept-Language` on every operation |
| **Operations** | 325 across 44 controllers |
| **By method** | 160 GET · 163 POST · 1 PUT · 1 DELETE |
| **Schemas documented** | 226 objects + 12 enums |
| **Captured** | 8 September 2026 |

**Contents** — [1. Response envelopes](#1-response-envelopes) · [2. Live call results](#2-live-call-results) · [3. Reading the tables](#3-reading-the-tables) · [4. Endpoint reference](#4-endpoint-reference) · [5. Return bodies](#5-return-bodies) · [6. Schema dictionary](#6-schema-dictionary)

---

## 1. Response envelopes

Almost nothing is returned bare. Two envelopes wrap nearly every payload, and the object you actually want sits in `value`.

**`ReturnResult`** — used by the newer public-page controllers

```
{
  "isValid": true,
  "value":   { ...the payload... },
  "errors":  [ { "name": "...", "value": "...", "count": 0 } ],
  "message": "localized text"
}
```

**`ApiResponse`** — used by the dashboard, qualifications and mobile controllers, and it carries paging

```
{
  "success": true,
  "confirm": false,
  "value":   { ...the payload... },
  "message": "localized text",
  "modelStateErrors": [ ... ],
  "totalItems": 0, "pageSize": 0, "pageNumber": 0
}
```

So `GET /api/v1/Program/Overview` returns `ProgramsOverviewDtoReturnResult`, and the fields you care about are under `value` → `ProgramsOverviewDto`. Section 5 expands each of these for you.

> **Coverage note.** 78 of 325 operations declare a typed response schema in the OpenAPI definition — those are fully expanded below. The other 247 declare a bare `200 OK`, meaning the controller returns `IActionResult` without a `ProducesResponseType` attribute. Their response body is **not** described in the spec at all; the only way to document those fields is to call each one and read the JSON back. That requires a valid bearer token.

---

## 2. Live call results

136 read-only GET operations were called against the testing portal with a valid bearer token. Nothing was posted, cancelled or purchased.

| Result | Calls | Reading |
|---|---:|---|
| `200` OK | 90 | Returned a payload |
| `400` Bad Request | 20 | Substituted identifier rejected by validation |
| `500` Server Error | 11 | Unhandled — worth raising with the vendor |
| `404` Not Found | 10 | No record for the identifier used |
| `401` Unauthorized | 4 | Token valid — the account lacks the role |
| `403` Forbidden | 1 | Explicitly denied to this account |

**Two findings worth acting on**

- `GET /api/v1/Home/Trending` returns **283 KB in a single response** — the `TrendingHomeDto` holds every trending programme, exam, event, banner, initiative and report at once, each a full card DTO. That is a real cost on a mobile client and a candidate for pagination or a slimmer card.
- **11 endpoints returned `500`**, including `GET /api/v1/Exam/GetExamProfiles`. Unhandled exceptions, not validation failures — a defect list for the vendor.

| Endpoint measured live | Status | Payload |
|---|---|---:|
| `/api/v1/Home/Trending` | `200` | 283 KB |
| `/api/v1/Program/Overview` | `200` | 52 KB |
| `/api/v1/Lookup/GetCountries` | `200` | 49 KB |
| `/api/v1/Mursion/GetDetails` | `200` | 42 KB |
| `/api/v1/Home/FinancialSectorGateway` | `200` | 33 KB |
| `/api/v1/Exam/Overview` | `200` | 28 KB |
| `/api/v1/Program/GetTrendingPrograms` | `200` | 21 KB |
| `/api/v1/Program/TrainingTopics` | `200` | 18 KB |
| `/api/v1/Home/EventsOverview` | `200` | 17 KB |
| `/api/v1/Lookup/GetAllCountries` | `200` | 15 KB |
| `/api/v1/Catalog/search` | `200` | 13 KB |
| `/api/v1/Home/TopMenu` | `200` | 11 KB |
| `/api/v1/Home/report-and-study` | `200` | 6.7 KB |
| `/api/v1/Exam/GetCfaCertificates` | `200` | 5.4 KB |
| `/api/v1/Users/Info` | `200` | 5.2 KB |
| `/api/v1/ExecuseRequest/Service/filter-excuse-request` | `200` | 3.8 KB |
| `/api/v1/Exam/TestingCenters` | `200` | 2.4 KB |
| `/api/v1/Event/GetEventTypes` | `200` | 791 B |
| `/api/v1/DashBoard/ProgramEndWithExam` | `200` | 378 B |
| `/api/v1/DashBoard/MyCoupon` | `200` | 312 B |
| `/api/v1/AlmentorCourseCatalogue/GetTimeLineChartData` | `200` | 279 B |
| `/api/v1/Event/GetEventPeriods` | `200` | 278 B |
| `/api/v1/Exam/ValidateCertificate` | `400` | 267 B |
| `/api/v1/Exam/GetExamDetailsById` | `200` | 259 B |
| `/api/v1/AlmentorCourseCatalogue/GetAllLearnsProgress` | `200` | 241 B |
| `/api/v1/Exam/GetCenterAvailableTimes` | `400` | 241 B |
| `/api/v1/Exam/generate-exam-report` | `200` | 227 B |
| `/api/v1/Exam/GetExamProfiles` | `500` | 179 B |
| `/api/v1/Eligibility/status` | `200` | 164 B |
| `/api/v1/Cart/GetShoppingCartWithDetails` | `200` | 82 B |
| `/api/v1/Exam/GetExamTestCenters` | `400` | 40 B |
| `/api/v1/Exam/GetCenterAvailableDates` | `400` | 36 B |
| `/api/v1/Event/GetEventDetails` | `404` | 30 B |

---

## 3. Reading the tables

- **Parameters** — `name` *type*, annotated `required`, `path` or `header`. Anything unannotated is a query parameter.
- **Accepts** — the DTO expected in the request body.
- **Returns** — the schema declared per status code. Linked entries jump to the [schema dictionary](#6-schema-dictionary); `OK` means untyped in the spec.
- **Live** — actual status and payload size from the authorized run, where measured.
- In field listings, `?` is not shown; `**required**` marks a field the spec declares required. `[]` marks an array.

---

## 4. Endpoint reference

| Controller | Ops | Controller | Ops |
|---|---:|---|---:|
| [AlmentorCourseCatalogue](#almentorcoursecatalogue) | 5 | [Lookup](#lookup) | 10 |
| [Announcements](#announcements) | 8 | [MobileConfiguration](#mobileconfiguration) | 2 |
| [Cart](#cart) | 2 | [Mursion](#mursion) | 3 |
| [Catalog](#catalog) | 2 | [Notification](#notification) | 2 |
| [Certificate](#certificate) | 3 | [Orgnization](#orgnization) | 9 |
| [DashBoard](#dashboard) | 9 | [Payment](#payment) | 6 |
| [Eligibility](#eligibility) | 4 | [PaymentProcess](#paymentprocess) | 1 |
| [Event](#event) | 7 | [Player](#player) | 12 |
| [Exam](#exam) | 16 | [PrePostAssesment](#prepostassesment) | 2 |
| [ExecuseRequest](#execuserequest) | 4 | [Program](#program) | 26 |
| [FinancialSkills](#financialskills) | 7 | [QualificationsEducation](#qualificationseducation) | 4 |
| [Home](#home) | 12 | [QualificationsPracticalExperience](#qualificationspracticalexperience) | 4 |
| [IdentityCheckupDiagnostic](#identitycheckupdiagnostic) | 1 | [QualificationsProfessional](#qualificationsprofessional) | 4 |
| [IdentityNafath](#identitynafath) | 5 | [QualificationsTrainingCourses](#qualificationstrainingcourses) | 8 |
| [IdentityPublicRegistration](#identitypublicregistration) | 5 | [Reports](#reports) | 27 |
| [IdentityRecovery](#identityrecovery) | 5 | [Search](#search) | 1 |
| [IdentityRegistration](#identityregistration) | 5 | [TrackingRequest](#trackingrequest) | 5 |
| [IdentityRegistrationEmail](#identityregistrationemail) | 3 | [TrainerContracts](#trainercontracts) | 5 |
| [IndividualLearningPath](#individuallearningpath) | 10 | [UserCertificate](#usercertificate) | 1 |
| [Invitation](#invitation) | 7 | [Users](#users) | 9 |
| [LearningGroup](#learninggroup) | 6 | [WorkSpace](#workspace) | 27 |
| [LearningPath](#learningpath) | 29 | [WorkSpaces](#workspaces) | 2 |

### AlmentorCourseCatalogue

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/AlmentorCourseCatalogue/GetAllPrograms` | — | `WorkSpaceProgramsFilterViewModel` | `200` OK |  |
| `GET` | `/api/v1/AlmentorCourseCatalogue/GetAllLearnsProgress` | — | — | `200` [ApiResponse](#apiresponse) | `200` 241 B |
| `POST` | `/api/v1/AlmentorCourseCatalogue/MyPrograms` | — | `SearchMyProgramsDto` | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/v1/AlmentorCourseCatalogue/GetTimeLineChartData` | `programId` *integer* | — | `200` OK | `200` 279 B |
| `POST` | `/api/v1/AlmentorCourseCatalogue/GetProgramDetails` | — | `ProgramDetailDto` | `200` [ProgramDetailsDtoReturnResult](#programdetailsdtoreturnresult)<br>`404` ProblemDetails<br>`500` Internal Server Error |  |

- **`/api/v1/AlmentorCourseCatalogue/GetProgramDetails`** — Full program details as rendered on the program details page: descriptive content, topics, location, lessons count, pricing, nearest plan, registration requirements, related progra

### Announcements

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Announcements/GetAll` | — | `AnnouncementGetAllQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Announcements/Details` | — | `AnnouncementGetByIdQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Announcements/create` | — | `CreateOrUpdateAnnouncementDto` | `200` OK |  |
| `POST` | `/api/v1/Announcements/edit` | — | `CreateOrUpdateAnnouncementDto` | `200` OK |  |
| `POST` | `/api/v1/Announcements/SetStatus` | — | `AnnouncementSetStatusCommandModel` | `200` OK |  |
| `POST` | `/api/v1/Announcements/Remove` | — | `AnnouncementGetByIdQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Announcements/GetNotification` | — | `NotificationGetByOrganizationQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Announcements/SendNotification` | — | `NotificationCategoryModel` | `200` OK |  |

### Cart

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Cart/delete/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Cart/GetShoppingCartWithDetails` | — | — | `200` [CartPaymentViewModelReturnResult](#cartpaymentviewmodelreturnresult)<br>`500` Internal Server Error | `200` 82 B |

- **`/api/v1/Cart/delete/{id}`** — Deletes a cart item and its related records based on the given ID.

### Catalog

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Catalog/search` | `Keyword` *string*<br>`Type` *CatalogItemType* | — | `200` OK | `200` 13 KB |
| `GET` | `/api/v2/Catalog/search` | `Keyword` *string*<br>`Type` *CatalogItemType* | — | `200` OK |  |

- **`/api/v2/Catalog/search`** — Version 2 of the unified catalog search (Ims.Portal.Api v2 definition).

### Certificate

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Certificate/CurrentCertificates` | — | `UserCertificateFilterRequest` | `200` OK |  |
| `GET` | `/api/v1/Certificate/Generate` | `id` *string*<br>`asBase64` *boolean* | — | `200` OK |  |
| `GET` | `/api/v1/Certificate/Download` | `id` *string* | — | `200` OK |  |

### DashBoard

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/DashBoard/MyPrograms` | — | `SearchMyProgramsDto` | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/v1/DashBoard/MySelfLearningPrograms` | — | `MySelfLearningViewModel` | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/v1/DashBoard/MyExams` | — | `SearchMyExamDto` | `200` [ApiResponse](#apiresponse)<br>`400` ProblemDetails |  |
| `POST` | `/api/v1/DashBoard/MyEvents` | — | `SearchMyEventsDto` | `200` [ApiResponse](#apiresponse)<br>`400` ProblemDetails |  |
| `GET` | `/api/v1/DashBoard/ReservationInfo/{id}/{type}` | `id` *string* (required, path)<br>`type` *ModuleType* (required, path) | — | `200` [ReservationInfoResponseDtoApiResponse](#reservationinforesponsedtoapiresponse)<br>`403` [ApiResponse](#apiresponse)<br>`404` [ApiResponse](#apiresponse)<br>`500` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/v1/DashBoard/AddUserRate` | `reservationId` *string*<br>`type` *ModuleType*<br>`rate` *number*<br>`comment` *string* | — | `200` [ApiResponse](#apiresponse)<br>`400` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/v1/DashBoard/GetSubmittedRate/{reservationId}/{type}` | `reservationId` *string* (required, path)<br>`type` *ModuleType* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/DashBoard/MyCoupon` | — | — | `200` OK | `200` 312 B |
| `GET` | `/api/v1/DashBoard/ProgramEndWithExam` | — | — | `200` [ApiResponse](#apiresponse) | `200` 378 B |

- **`/api/v1/DashBoard/MyExams`** — Retrieves a list of exams for the currently logged-in user based on search criteria.
- **`/api/v1/DashBoard/MyEvents`** — Retrieves a list of events for the currently logged-in user based on search criteria.
- **`/api/v1/DashBoard/ReservationInfo/{id}/{type}`** — Retrieves reservation information based on ID and module type.
- **`/api/v1/DashBoard/AddUserRate`** — Submits a user rating for a specific module (Training, Exams, Events).
- **`/api/v1/DashBoard/MyCoupon`** — Retrieves a Coupon for the currently logged-in user.
- **`/api/v1/DashBoard/ProgramEndWithExam`** — Retrieves program that ends with an exam along with coupon details for the currently logged-in user dashboard.

### Eligibility

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Eligibility/check` | — | `CheckEligibilityRequestDto` | `200` OK |  |
| `GET` | `/api/v1/Eligibility/status` | — | — | `200` OK | `200` 164 B |
| `POST` | `/api/v1/Eligibility/send-code` | — | `SendVerificationCodeRequestDto` | `200` OK |  |
| `POST` | `/api/v1/Eligibility/verify-code` | — | `VerifyVerificationCodeRequestDto` | `200` OK |  |

- **`/api/v1/Eligibility/check`** — Checks whether the supplied email belongs to a recognized university domain. Anonymous: no authentication required (mirrors the source MVC endpoint).
- **`/api/v1/Eligibility/status`** — Returns the current user's university email and whether it is verified. Business equivalent of the MVC "Prompt" action (no view rendering / redirect).
- **`/api/v1/Eligibility/send-code`** — Generates a verification code for the supplied university email, caches it (10 min) and emails it to the user. Business equivalent of the MVC "SendCode" action.
- **`/api/v1/Eligibility/verify-code`** — Verifies the code previously sent and confirms the user's university email. Business equivalent of the MVC "VerifyCode" action (pending email is supplied in the request body instea

### Event

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Event/Search` | — | `FilterEventDto` | `200` OK |  |
| `GET` | `/api/v1/Event/GetEventTypes` | — | — | `200` OK | `200` 791 B |
| `GET` | `/api/v1/Event/GetEventPeriods` | — | — | `200` OK | `200` 278 B |
| `GET` | `/api/v1/Event/GetEventDetails` | `eventId` *string* | — | `200` OK | `404` 30 B |
| `POST` | `/api/v1/Event/AddToCart` | — | `EventRegisterationApiViewModel` | `500` Internal Server Error |  |
| `POST` | `/api/v1/Event/CancelReservation` | — | `CancelReservationViewModel` | `200` [BooleanReturnResult](#booleanreturnresult) |  |
| `POST` | `/api/v1/Event/RegisterUser` | — | `object` | `200` OK |  |

- **`/api/v1/Event/CancelReservation`** — Cancels an event registration and processes refund if needed.

### Exam

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Exam/GetCfaCertificates` | — | — | `200` [CfaCertificatesSectionDtoApiResponse](#cfacertificatessectiondtoapiresponse) | `200` 5.4 KB |
| `POST` | `/api/v1/Exam/Search` | — | `FilterExamDto` | `200` OK |  |
| `GET` | `/api/v1/Exam/GetExamDetailsById` | `examId` *string* | — | `200` OK | `200` 259 B |
| `GET` | `/api/v1/Exam/ValidateCertificate` | `certificateNumber` *string* | — | `200` [UserCertificateApiModelApiResponse](#usercertificateapimodelapiresponse) | `400` 267 B |
| `GET` | `/api/v1/Exam/GetExamProfiles` | `examId` *string* | — | `200` OK | `500` 179 B |
| `GET` | `/api/v1/Exam/GetExamTestCenters` | `examId` *string* | — | `200` [TestCenterViewModelReturnResult](#testcenterviewmodelreturnresult)<br>`400` ProblemDetails<br>`404` ProblemDetails<br>`500` If there is an internal server error. | `400` 40 B |
| `GET` | `/api/v1/Exam/TestingCenters` | — | — | `200` Returns a list of testing centers.<br>`404` Returns a message indicating no testing centers were found.<br>`500` Returns a message indicating an internal server error. | `200` 2.4 KB |
| `GET` | `/api/v1/Exam/GetCenterAvailableDates` | `centerId` *string*<br>`profileId` *string* | — | `200` OK | `400` 36 B |
| `GET` | `/api/v1/Exam/GetCenterAvailableTimes` | `centerId` *string*<br>`date` *string*<br>`profileId` *string* | — | `200` OK | `400` 241 B |
| `POST` | `/api/v1/Exam/AddToCart` | — | `ExamAddToCartApiDto` | `200` [BooleanReturnResult](#booleanreturnresult)<br>`500` Internal Server Error |  |
| `POST` | `/api/v1/Exam/External/AddToCart` | `code` *string* | — | `200` [BooleanReturnResult](#booleanreturnresult)<br>`400` ProblemDetails<br>`500` If an unexpected server error occurs. |  |
| `POST` | `/api/v1/Exam/ChangeProfile` | `reservationId` *string*<br>`profileId` *string* | — | `200` [BooleanApiResponse](#booleanapiresponse)<br>`400` ProblemDetails<br>`500` Internal server error. |  |
| `POST` | `/api/v1/Exam/cancel-reservation` | — | `CancelReservationViewModel` | `200` [BooleanReturnResult](#booleanreturnresult) |  |
| `POST` | `/api/v1/Exam/exam-reschedule` | — | `RescheduleExamDto` | `200` [RescheduleExamResponseDtoApiResponse](#rescheduleexamresponsedtoapiresponse) |  |
| `GET` | `/api/v1/Exam/generate-exam-report` | `regId` *string*<br>`isExport` *boolean* | — | `200` OK | `200` 227 B |
| `GET` | `/api/v1/Exam/Overview` | `count` *integer* | — | `200` [CertificatesOverviewDtoReturnResult](#certificatesoverviewdtoreturnresult) | `200` 28 KB |

- **`/api/v1/Exam/GetCfaCertificates`** — Gets the CFA certificates section displayed on the Self Learning page.
- **`/api/v1/Exam/GetExamDetailsById`** — Retrieves exam details for the given exam ID.
- **`/api/v1/Exam/ValidateCertificate`** — Validates a certificate by its issue number and, when valid, returns the certificate information shown on the public "Validate Certificate" web page. This endpoint exposes the exac
- **`/api/v1/Exam/GetExamProfiles`** — Gets exam profiles for a given exam ID.
- **`/api/v1/Exam/GetExamTestCenters`** — Retrieves a list of available exam centers for a given exam. This endpoint fetches available exam centers based on the user's profile and exam-specific restrictions.
- **`/api/v1/Exam/TestingCenters`** — Gets the list of testing centers.
- **`/api/v1/Exam/GetCenterAvailableDates`** — Gets available center dates based on center ID and profile ID.
- **`/api/v1/Exam/GetCenterAvailableTimes`** — Gets available center times based on center ID, date, and profile ID.
- **`/api/v1/Exam/External/AddToCart`** — Add an external exam to the shopping cart.
- **`/api/v1/Exam/ChangeProfile`** — Changes the exam profile for a reservation if it meets eligibility conditions.
- **`/api/v1/Exam/cancel-reservation`** — Cancels an exam reservation and processes refund if applicable.
- **`/api/v1/Exam/exam-reschedule`** — Reschedules an exam for the user.
- **`/api/v1/Exam/Overview`** — Returns the Certificates (Exams) Overview: most requested certificates, new certificates, main categories, policies and the explore-certificates call-to-action, in a single respons

### ExecuseRequest

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/ExecuseRequest/Service/filter-excuse-request` | `SelectedExcuseTypeId` *integer*<br>`StatusId` *integer*<br>`CreatedDateFrom` *string*<br>`CreatedDateTo` *string*<br>`PageNumber` *integer*<br>`PageSize` *integer* | — | `200` OK | `200` 3.8 KB |
| `POST` | `/api/v1/ExecuseRequest/Service/can-submit-excuse` | `reservationId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/ExecuseRequest/Service/excuse-types` | — | — | `200` OK |  |
| `POST` | `/api/v1/ExecuseRequest/Service/submit-excuse` | — | `object` | `200` OK |  |

### FinancialSkills

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/FinancialSkills/GetFrameworkStructure` | — | `FrameworkStructureRequestDto` | `200` [FrameworkStructureResponseDtoApiResponse](#frameworkstructureresponsedtoapiresponse) |  |
| `GET` | `/api/v1/FinancialSkills/GetJobFamilyDetails` | `familyId` *string*<br>`sectorId` *string* | — | `200` [JobFamilyDetailsResponseDtoApiResponse](#jobfamilydetailsresponsedtoapiresponse)<br>`404` ProblemDetails |  |
| `GET` | `/api/v1/FinancialSkills/GetJobFamilyPrograms` | `familyId` *string*<br>`sectorId` *string* | — | `200` [ProgramDtoListApiResponse](#programdtolistapiresponse) |  |
| `GET` | `/api/v1/FinancialSkills/GetFrameworkOverview` | — | — | `200` [FinancialSkillsFrameworkOverviewDtoApiResponse](#financialskillsframeworkoverviewdtoapiresponse) |  |
| `GET` | `/api/v1/FinancialSkills/GetCompetencies` | `competencyTypeId` *integer*<br>`pageNumber` *integer*<br>`pageSize` *integer* | — | `200` OK |  |
| `GET` | `/api/v1/FinancialSkills/GetCompetencyDetails` | `id` *string* | — | `200` [CompetencyDetailsDtoReturnResult](#competencydetailsdtoreturnresult)<br>`404` ProblemDetails |  |
| `GET` | `/api/v1/FinancialSkills/GetCompetencyLevelDetails` | `competencyId` *string*<br>`levelOrder` *integer*<br>`pageNumber` *integer*<br>`pageSize` *integer* | — | `200` [CompetencyLevelDetailsDtoReturnResult](#competencyleveldetailsdtoreturnresult)<br>`404` ProblemDetails |  |

- **`/api/v1/FinancialSkills/GetJobFamilyDetails`** — Job family details plus every job role under it, matching the MVC FrameworkStructure/JobRoles page. All roles are returned with full detail (responsibilities/skills).
- **`/api/v1/FinancialSkills/GetJobFamilyPrograms`** — Programs related to a job family, matching the MVC GetJobFamilyProgram action. Reuses IProgramService.GetAllProgramsAsync and the same program-card DTO/mapping.
- **`/api/v1/FinancialSkills/GetCompetencies`** — Paged list of competencies for a given competency type, matching the MVC GetCompetencyByType action but as structured JSON.
- **`/api/v1/FinancialSkills/GetCompetencyDetails`** — Full competency details, matching the MVC FinancialSkillCard/{id} action but as structured JSON, including its level ordering.
- **`/api/v1/FinancialSkills/GetCompetencyLevelDetails`** — Training programs and certificates related to a single competency level, matching the MVC level-expand AJAX call.

### Home

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Home/Trending` | — | — | `200` [TrendingHomeDtoReturnResult](#trendinghomedtoreturnresult) | `200` 283 KB |
| `GET` | `/api/v1/Home/EventsOverview` | — | — | `200` [EventsOverviewDtoReturnResult](#eventsoverviewdtoreturnresult) | `200` 17 KB |
| `GET` | `/api/v1/Home/Calendar` | `startDate` *string* | — | `200` [CalendarUnifiedItemDtoListReturnResult](#calendarunifieditemdtolistreturnresult) |  |
| `GET` | `/api/v1/Home/Calendar-Guest` | `startDate` *string* | — | `200` [CalendarUnifiedItemDtoReturnResult](#calendarunifieditemdtoreturnresult) |  |
| `GET` | `/api/v1/Home/InitiativeMenu` | — | — | `200` [InitiativeMenuDtoReturnResult](#initiativemenudtoreturnresult) |  |
| `GET` | `/api/v1/Home/TopMenu` | — | — | `200` [TopMenuDtoReturnResult](#topmenudtoreturnresult) | `200` 11 KB |
| `POST` | `/api/v1/Home/contactus` | — | `ContactUsDto` | `200` OK |  |
| `GET` | `/api/v1/Home/force-update` | — | — | `200` OK |  |
| `GET` | `/api/v1/Home/about-us` | — | — | `200` OK |  |
| `GET` | `/api/v1/Home/report-and-study` | — | — | `200` OK | `200` 6.7 KB |
| `GET` | `/api/v1/Home/Experts` | — | — | `200` [HomeExpertDtoListReturnResult](#homeexpertdtolistreturnresult) |  |
| `GET` | `/api/v1/Home/FinancialSectorGateway` | — | — | `200` [FinancialSectorGatewayDtoReturnResult](#financialsectorgatewaydtoreturnresult) | `200` 33 KB |

- **`/api/v1/Home/Trending`** — Retrieves a collection of trending programs, exams, events, banners and initiatives. DGA-204: returns every matching item for each category.
- **`/api/v1/Home/EventsOverview`** — Retrieves everything needed to render the public Events Overview page. Aggregates, and caches per culture, the sections shown on the page.
- **`/api/v1/Home/Calendar`** — Retrieves a list of scheduled programs and exams for display in a calendar view. Returns the top scheduled programs and the top 10 scheduled exams from the start date.
- **`/api/v1/Home/Calendar-Guest`** — Retrieves a list of scheduled events for display in a calendar view. Returns scheduled events starting from the current date if no date is provided.
- **`/api/v1/Home/InitiativeMenu`** — Retrieves the initiative menu including active and opening soon items.
- **`/api/v1/Home/TopMenu`** — Retrieves the complete website top-menu tree (the same business data the MVC application renders), including programs, financial-sector programs, exams, events, reports and studies.
- **`/api/v1/Home/contactus`** — Submits a contact request.
- **`/api/v1/Home/force-update`** — Checks if a force update is required and returns the app version from configuration.
- **`/api/v1/Home/about-us`** — Retrieves the About Us information, including contact details, social media links, and working hours.
- **`/api/v1/Home/report-and-study`** — Returns all reports and studies with language-based fields.
- **`/api/v1/Home/Experts`** — Returns the experts shown in the Home page Experts Platform section: this month's freelance trainers, in the same order the website renders them.
- **`/api/v1/Home/FinancialSectorGateway`** — Retrieves the Financial Sector Gateway content as four categories: Training Programs, Self Learning Programs, Knowledge Seminars, and Sector Experts Meetings.

### IdentityCheckupDiagnostic

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity-test/registration/checkup/status` | — | — | `200` OK<br>`401` ProblemDetails<br>`404` ProblemDetails<br>`502` Bad Gateway<br>`503` Service Unavailable<br>`504` Gateway Timeout |  |

### IdentityNafath

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/nafath/create-request` | — | `NafathCreateRequest` | `200` OK |  |
| `POST` | `/api/v1/identity/nafath/check-status` | — | `NafathChallengeRequest` | `200` OK |  |
| `POST` | `/api/v1/identity/nafath/get-person-data` | — | `NafathChallengeRequest` | `200` OK |  |
| `POST` | `/api/v1/identity/nafath/token` | — | `NafathTokenRequest` | `200` OK |  |
| `POST` | `/api/v1/identity/nafath/is-nafath-login` | — | `IsNafathLoginRequest` | `200` OK |  |

- **`/api/v1/identity/nafath/create-request`** — Creates a generic Nafath challenge for the current Mobile compatibility flow.
- **`/api/v1/identity/nafath/check-status`** — Polls a generic Nafath login challenge and preserves the current Identity response.
- **`/api/v1/identity/nafath/get-person-data`** — Gets the current Identity registration model mapped from Nafath person data.
- **`/api/v1/identity/nafath/token`** — Preserves the current Identity Nafath token compatibility response.
- **`/api/v1/identity/nafath/is-nafath-login`** — Checks whether the current Identity account is eligible for Nafath login.

### IdentityPublicRegistration

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/registration/check-identity` | — | `RegistrationCheckIdentityRequest` | `200` OK<br>`400` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/nafath/status` | — | `NafathRecoveryStatusRequest` | `200` OK<br>`400` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration` | — | `IndividualRegistrationRequest` | `200` OK<br>`400` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/confirm-email` | — | `ConfirmRegistrationEmailRequest` | `200` OK<br>`400` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `GET` | `/api/v1/identity/registration/terms` | — | — | `200` OK<br>`404` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |

- **`/api/v1/identity/registration/check-identity`** — Checks registration identity format and required journey. Anonymous privacy-preserving operation.
- **`/api/v1/identity/registration/nafath/status`** — Polls the registration-specific Nafath challenge status. Returns Pending, Completed, Rejected, Expired, or Failed unchanged.
- **`/api/v1/identity/registration`** — Creates an individual registration account. IdentityManagement owns all normalization, conditional validation, duplicate checks and policy.
- **`/api/v1/identity/registration/confirm-email`** — Confirms a newly registered account's email address.
- **`/api/v1/identity/registration/terms`** — Gets localized Terms and Conditions for registration. Read-only registration content with Arabic fallback.

### IdentityRecovery

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/recovery/forgot-password` | — | `ForgotPasswordRequest` | `200` OK<br>`400` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/recovery/forgot-password/reset` | — | `ResetPasswordRequest` | `200` OK<br>`400` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/recovery/forgot-password/nafath/status` | — | `NafathRecoveryStatusRequest` | `200` OK<br>`400` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/recovery/forgot-password/reset/nafath` | — | `ResetPasswordNafathRequest` | `200` OK<br>`400` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/recovery/forgot-username` | — | `ForgotUsernameRequest` | `200` OK<br>`400` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |

- **`/api/v1/identity/recovery/forgot-password`** — Starts the email-based forgot-password flow. Anonymous anti-enumeration endpoint.
- **`/api/v1/identity/recovery/forgot-password/reset`** — Completes an email-link password reset.
- **`/api/v1/identity/recovery/forgot-password/nafath/status`** — Polls a Nafath challenge for password recovery. One poll per request.
- **`/api/v1/identity/recovery/forgot-password/reset/nafath`** — Completes a Nafath-verified password reset.
- **`/api/v1/identity/recovery/forgot-username`** — Requests username recovery by registered email address. Anonymous anti-enumeration endpoint.

### IdentityRegistration

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/registration/checkup/status` | — | — | `200` OK<br>`400` ProblemDetails<br>`401` ProblemDetails<br>`404` ProblemDetails<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/checkup/username/update-to-identity` | — | — | `200` OK<br>`400` ProblemDetails<br>`401` ProblemDetails<br>`403` ProblemDetails<br>`404` ProblemDetails<br>`409` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/checkup/identity/nafath/initiate` | — | — | `200` OK<br>`400` ProblemDetails<br>`401` ProblemDetails<br>`403` ProblemDetails<br>`404` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/checkup/identity/nafath/status` | — | `NafathIdentityVerificationPollRequest` | `200` OK<br>`400` ProblemDetails<br>`401` ProblemDetails<br>`403` ProblemDetails<br>`404` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/checkup/identity/change` | — | `ChangeRegistrationIdentityRequest` | `200` OK<br>`400` ProblemDetails<br>`401` ProblemDetails<br>`403` ProblemDetails<br>`404` ProblemDetails<br>`409` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |

- **`/api/v1/identity/registration/checkup/status`** — Gets IdentityManagement's registration checkup status for the authenticated account.
- **`/api/v1/identity/registration/checkup/username/update-to-identity`** — Updates the authenticated account username to its verified identity number.
- **`/api/v1/identity/registration/checkup/identity/nafath/initiate`** — Initiates Nafath verification for the authenticated account's current identity.
- **`/api/v1/identity/registration/checkup/identity/nafath/status`** — Polls and, when approved, completes Nafath identity verification.
- **`/api/v1/identity/registration/checkup/identity/change`** — Changes the registration identity for the authenticated account.

### IdentityRegistrationEmail

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/registration/resend-confirmation-email` | — | — | `200` OK<br>`400` ProblemDetails<br>`401` ProblemDetails<br>`403` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/change-email` | — | `ChangeRegistrationEmailRequest` | `200` OK<br>`400` ProblemDetails<br>`401` ProblemDetails<br>`403` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/confirm-change-email` | — | `ConfirmRegistrationEmailChangeRequest` | `200` OK<br>`400` ProblemDetails<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |

- **`/api/v1/identity/registration/resend-confirmation-email`** — Resends the authenticated account's registration confirmation email.
- **`/api/v1/identity/registration/change-email`** — Starts changing the authenticated account's email address; current email stays until confirmation succeeds.
- **`/api/v1/identity/registration/confirm-change-email`** — Confirms a pending registration email change. Anonymous deep-link completion operation.

### IndividualLearningPath

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/IndividualLearningPath/Search` | — | `LearningPathFilterViewModel` | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/Details/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/{id}/competencies` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/{id}/certificates` | `id` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/IndividualLearningPath/chart/Cards` | — | — | `200` OK |  |
| `POST` | `/api/v1/IndividualLearningPath/chart/CardData` | — | `LearningPathDashboardCardFilter` | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/chart/Timeline` | `userId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/chart/completion-rate` | `userId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/chart/status-summary` | — | — | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/chart/program-status-summary` | — | — | `200` OK |  |

### Invitation

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Invitation/Invite` | — | `InviteUserViewModel[]` | `200` OK |  |
| `POST` | `/api/v1/Invitation/Resend` | — | `InviteUserViewModel` | `200` OK |  |
| `POST` | `/api/v1/Invitation/Revoke` | — | `InviteUserViewModel` | `200` OK |  |
| `POST` | `/api/v1/Invitation/User/Invites` | — | — | `200` OK |  |
| `POST` | `/api/v1/Invitation/Search` | — | `SearchInviteViewModel` | `200` OK |  |
| `POST` | `/api/v1/Invitation/Accept/{key}` | `key` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Invitation/Reject/{key}` | `key` *string* (required, path) | — | `200` OK |  |

### LearningGroup

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/LearningGroup/GetAll` | — | `LearningGroupFilterViewModel` | `200` OK |  |
| `GET` | `/api/v1/LearningGroup/Detail` | `Id` *string*<br>`OrganizationId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/LearningGroup/ChangeStatus` | — | `UpdateLearningGroupStatusViewModel` | `200` OK |  |
| `POST` | `/api/v1/LearningGroup/Remove` | `organizationId` *string* | `string[]` | `200` OK |  |
| `POST` | `/api/v1/LearningGroup/Create` | — | `object` | `200` OK |  |
| `POST` | `/api/v1/LearningGroup/Edit/{id}` | `id` *string* (required, path) | `object` | `200` OK |  |

### LearningPath

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/LearningPath/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/Details/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath` | `orgId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath` | — | `CreateLearningPathViewModel` | `200` OK |  |
| `DELETE` | `/api/v1/LearningPath` | `id` *string* | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/Cards` | `orgId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath/OverDueAssignments` | — | `OverDueAssignmentRequestViewModel` | `200` OK |  |
| `POST` | `/api/v1/LearningPath/Search` | — | `OrgLearningPathFilterViewModel` | `200` OK |  |
| `POST` | `/api/v1/LearningPath/User/{userId}/Search` | `userId` *string* (required, path) | `OrgLearningPathFilterViewModel` | `200` OK |  |
| `POST` | `/api/v1/LearningPath/draft` | `id` *string* | `LearningPathViewModel` | `200` OK |  |
| `POST` | `/api/v1/LearningPath/Clone/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath/ValidateBulkAssign/{learningPathId}/{orgId}` | `learningPathId` *string* (required, path)<br>`orgId` *string* (required, path) | `object` | `200` OK |  |
| `POST` | `/api/v1/LearningPath/{learningPathId}/assignlearners` | `learningPathId` *string* (required, path) | `AssignLearnersToLearningPathRequestModel` | `200` OK |  |
| `POST` | `/api/v1/LearningPath/{learningPathId}/UnAssign/{userId}` | `learningPathId` *string* (required, path)<br>`userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/OrganizationUsers` | `term` *string*<br>`organizationId` *string*<br>`LearningPathId` *string*<br>`pageNumber` *integer*<br>`pageSize` *integer* | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/assignees` | `name` *string*<br>`IsActive` *boolean*<br>`learningPathId` *string* (required, path)<br>`pageNumber` *integer*<br>`pageSize` *integer* | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/chart/completion-rate` | `orgId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/chart/activity` | `period` *ActivityPeriod*<br>`orgId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/chart/status-summary` | `orgId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath/update/{id}` | `id` *string* (required, path) | `LearningPathViewModel` | `200` OK |  |
| `POST` | `/api/v1/LearningPath/{id}/status/{status}` | `id` *string* (required, path)<br>`status` *LearningPathStatus* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath/{learningPathId}/items/links/{itemId}/completed` | `learningPathId` *string* (required, path)<br>`itemId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/overall` | `learningPathId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/items/next` | `learningPathId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/countdown` | `learningPathId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/overdue` | `learningPathId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/averagetimetocomplete` | `learningPathId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath/Assignee/Update` | — | `LearningPathAssigneeStatusViewModel` | `200` OK |  |
| `POST` | `/api/v1/LearningPath/Assignee/History` | — | `LearningPathAssigneeHistoryRequestViewModel` | `200` OK |  |

### Lookup

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Lookup/GetSectors` | — | — | `200` OK |  |
| `GET` | `/api/v1/Lookup/GetTopics` | — | — | `200` OK |  |
| `GET` | `/api/v1/Lookup/GetCompetencyLevels` | — | — | `200` Returns the list of competency levels. |  |
| `GET` | `/api/v1/Lookup/GetAllEducationType` | — | — | `200` OK |  |
| `GET` | `/api/v1/Lookup/GetAllCountries` | — | — | `200` OK | `200` 15 KB |
| `GET` | `/api/v1/Lookup/GetCountries` | — | — | `200` [CountryRegistrationLookupDto[]](#countryregistrationlookupdto) | `200` 49 KB |
| `GET` | `/api/v1/Lookup/GetCountryById/{countryId}` | `countryId` *integer* (required, path) | — | `200` [CountryRegistrationLookupDto](#countryregistrationlookupdto)<br>`404` ProblemDetails |  |
| `GET` | `/api/v1/Lookup/GetCountryByNafathMappingId/{nafathCountryId}` | `nafathCountryId` *integer* (required, path) | — | `200` [CountryRegistrationLookupDto](#countryregistrationlookupdto)<br>`404` ProblemDetails |  |
| `GET` | `/api/v1/Lookup/GetCancellationReasons` | — | — | `200` Returns the list of cancellation reasons |  |
| `GET` | `/api/v1/Lookup/GetCancellationPolicy` | `type` *CancellationPolicyType* | — | `200` Returns the cancellation policy URL wrapped in the standard response envelope. |  |

- **`/api/v1/Lookup/GetCompetencyLevels`** — Retrieves the list of program competency levels used to populate the Competency Level search filter.
- **`/api/v1/Lookup/GetCountries`** — Returns the native FAST country and nationality data used by registration clients.
- **`/api/v1/Lookup/GetCountryById/{countryId}`** — Returns a native FAST country by its FAST identifier.
- **`/api/v1/Lookup/GetCountryByNafathMappingId/{nafathCountryId}`** — Returns a native FAST country by its IAM/Nafath mapping identifier.
- **`/api/v1/Lookup/GetCancellationReasons`** — Retrieves a list of cancellation reasons with both Arabic and English names, from the ReasonsList enum.
- **`/api/v1/Lookup/GetCancellationPolicy`** — Returns the cancellation policy URL for the requested policy type.

### MobileConfiguration

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/MobileConfiguration/is-mobile-nafath-enabled` | — | — | `200` OK |  |
| `GET` | `/api/v1/MobileConfiguration/mobile-force-update` | — | — | `200` OK |  |

- **`/api/v1/MobileConfiguration/is-mobile-nafath-enabled`** — Get current mobile configuration flag.
- **`/api/v1/MobileConfiguration/mobile-force-update`** — Checks if a force update is required and returns the app version from configuration.

### Mursion

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Mursion/GetDetails` | — | — | `200` [MursionDetailsDtoReturnResult](#mursiondetailsdtoreturnresult)<br>`404` ProblemDetails | `200` 42 KB |
| `POST` | `/api/v1/Mursion/AddToCart` | — | — | `200` [MursionAddToCartResponseDtoReturnResult](#mursionaddtocartresponsedtoreturnresult)<br>`401` ProblemDetails<br>`403` ProblemDetails<br>`404` ProblemDetails |  |
| `GET` | `/api/v1/Mursion/GetPostPaymentAction` | `billNumber` *string* | — | `200` [MursionPostPaymentActionDtoReturnResult](#mursionpostpaymentactiondtoreturnresult)<br>`400` ProblemDetails<br>`401` ProblemDetails<br>`404` ProblemDetails |  |

### Notification

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/org/{orgId}` | `orgId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/org/{orgId}` | `orgId` *string* (required, path) | `NotificationPreferencesDto` | `200` OK |  |

### Orgnization

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Orgnization/RegisterOrganizationMembers` | — | `object` | `200` OK |  |
| `POST` | `/api/v1/Orgnization/BulkRegisterOrganizationMembers` | — | `OrgUserViewModel[]` | `200` OK |  |
| `POST` | `/api/v1/Orgnization/RemoveMember` | — | `string[]` | `200` OK |  |
| `POST` | `/api/v1/Orgnization/UpdateMember` | — | `UpdateUserRoleViewModel` | `200` OK |  |
| `GET` | `/api/v1/Orgnization/GetOrganizationUsers` | `term` *string*<br>`pageNumber` *integer*<br>`pageSize` *integer*<br>`organizationId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Orgnization/Roles` | — | — | `200` OK |  |
| `GET` | `/api/v1/Orgnization/Roles/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Orgnization/GetOrganisationsPartners` | `pageSize` *integer*<br>`pageNumber` *integer* | — | `200` [OrganizationPartnerModelIPagedListReturnResult](#organizationpartnermodelipagedlistreturnresult) |  |
| `POST` | `/api/v1/Orgnization/EnableDisablePartnerOrg` | — | `OrganizationPartnerModel` | `200` [BooleanReturnResult](#booleanreturnresult) |  |

### Payment

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Payment/CheckPaymentComplish` | `billNumber` *string* | — | `200` [BooleanReturnResult](#booleanreturnresult)<br>`500` Internal Server Error |  |
| `POST` | `/api/v1/Payment/Checkout` | `couponCode` *string* | — | `200` [CheckoutResponseApiDtoReturnResult](#checkoutresponseapidtoreturnresult)<br>`500` Internal Server Error |  |
| `GET` | `/api/v1/Payment/Bills` | — | — | `200` [UserBillsListDtoListReturnResult](#userbillslistdtolistreturnresult)<br>`500` Internal Server Error |  |
| `POST` | `/api/v1/Payment/Search/Bills` | — | `BillsRequestDto` | `200` [UserBillsListDtoListReturnResult](#userbillslistdtolistreturnresult)<br>`500` Internal Server Error |  |
| `GET` | `/api/v1/Payment/GetCouponValue` | `couponCode` *string* | — | `200` [CouponResponseDtoApiResponse](#couponresponsedtoapiresponse)<br>`400` ProblemDetails |  |
| `GET` | `/api/v1/Payment/export-invoice-pdf/{trxId}` | `trxId` *string* (required, path) | — | `200` PDF file<br>`400` ProblemDetails<br>`404` Invoice data not found for the transaction ID<br>`500` Internal server error during export |  |

- **`/api/v1/Payment/GetCouponValue`** — Retrieves the discount value associated with a given coupon code.
- **`/api/v1/Payment/export-invoice-pdf/{trxId}`** — Exports the invoice associated with the specified transaction ID to a PDF file.

### PaymentProcess

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/PaymentProcess` | `billNumber` *string* | — | `200` OK |  |

### Player

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Player/Player/Header/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Player/SelfLearning/{programId}` | `programId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Player/SelfLearning/status/{programId}` | `programId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Player/SelfLearning/GetQuestions` | `evalutionCode` *string* | — | `200` OK |  |
| `POST` | `/api/v1/Player/SelfLearning/SaveQuestionAnswer` | — | `AddEvalutionSelfLearningViewModel` | `200` OK |  |
| `GET` | `/api/v1/Player/Training/SelfLearning/PreExam/StartExam/{programId}` | `programId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Player/Training/SelfLearning/PreExam/PreExam/FinishExam/{programId}` | `programId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Player/Training/SelfLearning/PreExam/SaveQuestionAnswer` | — | `SavePrePostQuestionAnswer` | `200` OK |  |
| `GET` | `/api/v1/Player/Training/SelfLearning/PostExam/StartExam/{programId}` | `programId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Player/Training/SelfLearning/PostExam/FinishExam/{programId}` | `programId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Player/Training/SelfLearning/PostExam/SaveQuestionAnswer` | — | `SavePrePostQuestionAnswer` | `200` OK |  |
| `POST` | `/api/v1/Player/Training/EnableAdaptiveLearning` | — | `EnableAdaptiveLearningViewModel` | `200` OK |  |

### PrePostAssesment

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/PrePostAssesment/GetPrePost` | — | — | `200` OK |  |
| `GET` | `/api/v1/PrePostAssesment/DeltaScore` | — | — | `200` OK |  |

### Program

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Program/Search` | — | `FilterProgramDto` | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramType` | `programId` *string* | — | `200` [ProgramDtoReturnResult](#programdtoreturnresult) |  |
| `GET` | `/api/v1/Program/GetTrendingPrograms` | — | — | `200` OK | `200` 21 KB |
| `GET` | `/api/v1/Program/GetDigitalInteractiveTools` | — | — | `200` OK |  |
| `GET` | `/api/v1/Program/TrainingTopics` | `pageNumber` *integer*<br>`pageSize` *integer* | — | `200` [TrainingTopicsPageDtoReturnResult](#trainingtopicspagedtoreturnresult) | `200` 18 KB |
| `GET` | `/api/v1/Program/GetAttendaceTypes` | — | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramParticipantLevels` | — | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramDetails` | `programId` *string* | — | `200` [ProgramDetailsDtoReturnResult](#programdetailsdtoreturnresult)<br>`404` ProblemDetails<br>`500` Internal Server Error |  |
| `GET` | `/api/v1/Program/GetProgramDetailsHeader` | `programId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramAgenda` | `programId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetPlansByProgramId` | `programId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetLanguages` | — | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramPeriods` | — | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramPrice` | — | — | `200` OK |  |
| `POST` | `/api/v1/Program/AddToCart` | — | `RegistrationSubmitApiDto` | `200` OK |  |
| `POST` | `/api/v1/Program/cancel-reservation` | — | `CancelReservationViewModel` | `200` [BooleanReturnResult](#booleanreturnresult) |  |
| `POST` | `/api/v1/Program/program-reschedule` | — | `RescheduleDto` | `200` [RescheduleResponseDtoReturnResult](#rescheduleresponsedtoreturnresult) |  |
| `POST` | `/api/v1/Program/AddUserInterestInProgram` | `programId` *string* | — | `200` [ObjectReturnResultApiResponse](#objectreturnresultapiresponse)<br>`400` ProblemDetails |  |
| `GET` | `/api/v1/Program/GetProgramPlanTakers` | — | — | `200` OK |  |
| `POST` | `/api/v1/Program/MyPrograms` | — | `MyProgramSearchCriteria` | `200` OK |  |
| `POST` | `/api/v1/Program/chart/Cards` | — | — | `200` OK |  |
| `POST` | `/api/v1/Program/chart/CardData` | — | `LearningPathDashboardCardFilter` | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramCardInfo` | `programId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetTimeLineChartData` | `programId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Program/{id}/competencies` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Program/Overview` | — | — | `200` [ProgramsOverviewDtoReturnResult](#programsoverviewdtoreturnresult) | `200` 52 KB |

- **`/api/v1/Program/TrainingTopics`** — Returns the complete data rendered by the public Training Topics page, including each topic's displayed programs, image URLs and website navigation URLs.
- **`/api/v1/Program/GetProgramParticipantLevels`** — Lookup for the Participant Level (target audience) search filter. Returns the values accepted by FilterProgramDto.ProgramParticipantLevelIds on POST Search.
- **`/api/v1/Program/GetProgramDetails`** — Full program details as rendered on the program details page: descriptive content, topics, location, lessons count, pricing, nearest plan, registration requirements, related programs.
- **`/api/v1/Program/GetPlansByProgramId`** — Retrieves plans associated with a given program ID.
- **`/api/v1/Program/AddToCart`** — Adds a registration to the cart after processing requirements.
- **`/api/v1/Program/cancel-reservation`** — Cancels a reservation and triggers refund process.
- **`/api/v1/Program/program-reschedule`** — Reschedules a reservation to a new plan.
- **`/api/v1/Program/AddUserInterestInProgram`** — Adds the current user's interest in a specific training program.
- **`/api/v1/Program/Overview`** — Returns the domain data required to render the public Programs Overview page in a single response: main categories, featured programs, programs of the month, self-learning programs, experts platform.

### QualificationsEducation

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-education` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/qualifications-education` | — | `object` | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-education/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-education/delete/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |

- **`/api/qualifications-education`** — Retrieves a list of educational qualifications for the currently logged-in user.
- **`/api/qualifications-education`** — Saves a new or existing qualification education record for the current user. Supports file upload.
- **`/api/qualifications-education/{id}`** — Retrieves a specific qualification by ID, or returns an empty record for new entry.
- **`/api/qualifications-education/delete/{id}`** — Deletes a qualification education record by its ID.

### QualificationsPracticalExperience

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-practical-experience` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/qualifications-practical-experience` | — | `CreateOrUpdatePracticalExperienceDto` | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-practical-experience/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-practical-experience/delete/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |

- **`/api/qualifications-practical-experience`** — Retrieves a list of practical experience qualifications for the current user.
- **`/api/qualifications-practical-experience`** — Saves a new or existing qualification practical experience record for the current user.
- **`/api/qualifications-practical-experience/{id}`** — Retrieves a specific practical experience qualification by ID, or returns an empty record for new entry.
- **`/api/qualifications-practical-experience/delete/{id}`** — Deletes a qualifications practical experience record by its ID.

### QualificationsProfessional

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-professional` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/qualifications-professional` | — | `object` | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-professional/{id}` | `professionalCertificationId` *string*<br>`id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/qualifications-professional/delete/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |

- **`/api/qualifications-professional`** — Gets all professional certifications for the current user.
- **`/api/qualifications-professional`** — Saves a new or existing professional certification for the current user.
- **`/api/qualifications-professional/{id}`** — Retrieves a specific professional certification by ID for the current user. If no ID is provided, returns an empty initialized object for form population.
- **`/api/qualifications-professional/delete/{id}`** — Deletes a professional certification by its ID for the current user.

### QualificationsTrainingCourses

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-training-courses` | `isInSideFA` *boolean* | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/qualifications-training-courses` | — | `CreateTrainingCourseApiDto` | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-training-courses/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-training-courses/delete/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/training-courses/programs` | `title` *string* | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/training-courses/sectors` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/training-courses/levels` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/training-courses/location-types` | — | — | `200` [ApiResponse](#apiresponse) |  |

- **`/api/qualifications-training-courses`** — Retrieves a list of training courses for the currently authenticated user.
- **`/api/qualifications-training-courses`** — Creates or updates a training course qualification for the current user.
- **`/api/qualifications-training-courses/{id}`** — Retrieves a specific training course qualification for the current user. If the ID is null, returns an empty record for creation.
- **`/api/qualifications-training-courses/delete/{id}`** — Deletes a training course qualification record.
- **`/api/training-courses/programs`** — Searches programs used for dropdown selection.
- **`/api/training-courses/sectors`** — Retrieves the list of sectors used for dropdown selection when creating or editing training courses.
- **`/api/training-courses/levels`** — Retrieves the list of training course levels.
- **`/api/training-courses/location-types`** — Retrieves the location options for training courses (Inside FA or Outside FA).

### Reports

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Reports/GetAll` | — | `ReportGetAllQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Reports/GetMicroLearningOrgAdmin` | — | `GetMicroLearningOrgAdminQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Reports/GetMicroLearningLearner` | — | `GetTimeLineQueryModel` | `200` OK |  |
| `GET` | `/api/v1/Reports/GetPerformanceLearner/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/GetPerformanceOrgAdmin/{OrgId}` | `OrgId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Reports/GetRegulators` | — | `GetRegulatorQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Reports/GetLearningTimeLinePerProgram` | — | `GetTimeLineQueryModel` | `200` OK |  |
| `GET` | `/api/v1/Reports/GetLearningDeltaScore/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/GetOrgDeltaScore/{OrgId}` | `OrgId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/GetLearnerHeapMap` | — | — | `200` OK |  |
| `GET` | `/api/v1/Reports/GetOrgHeapMap` | — | — | `200` OK |  |
| `POST` | `/api/v1/Reports/AvailablePrograms` | — | `GetOrganizationProgramQuertFilter` | `200` OK |  |
| `POST` | `/api/v1/Reports/AvailableLearnersProgram` | — | `GetOrganizationProgramUsersQueryFilter` | `200` OK |  |
| `POST` | `/api/v1/Reports/OrgCharts` | — | `BuildOrgChartQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Reports/GetMicroLearningOrgAdminEngagedRate` | — | `GetMicroLearningOrgAdminEngagedRateQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Reports/LearnerCharts` | — | `BuildLearnerChartQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Reports/GetMicroLearningUserEngagedRate` | — | `GetTimeLineQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Reports/GetDeltaScoreUserEngagedRate/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/OrgAdminEvents/{OrgId}` | `OrgId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/LearnerEvents/{UserId}` | `UserId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/OrganizationPrograms/{OrgId}` | `OrgId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/LearnerPrograms/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/LearnerPreAssesmentVsPostAssesment/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/OrgPreAssesmentVsPostAssesment/{OrgId}` | `OrgId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Reports/ValidateOrganizationProgramData` | — | `ValidateOrganizationProgramDataQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Reports/GetOrganizationUserLearningReportData` | — | `UserLearningReportQueryModel` | `200` OK |  |
| `POST` | `/api/v1/Reports/GetOrganizationExecutiveSummaryReportData` | — | `OrganizationExecutiveSummaryReportQueryModel` | `200` OK |  |

### Search

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Search` | `searchText` *string*<br>`pageSize` *integer* | — | `200` [SearchResultsDtoReturnResult](#searchresultsdtoreturnresult) |  |

- **`/api/v1/Search`** — Searches Programs, Exams, and Events by searchText and returns all three collections plus their counts in one response, for the All/Programs/Exams/Events tabs.

### TrackingRequest

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/TrackingRequest/Search` | — | `FilterUserRequestDto` | `200` OK |  |
| `GET` | `/api/v1/TrackingRequest/Lookups` | — | — | `200` OK |  |
| `GET` | `/api/v1/TrackingRequest/Details` | `userRequestId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/TrackingRequest/ExamException` | — | `object` | `200` OK |  |
| `PUT` | `/api/v1/TrackingRequest/ExamException/Cancel` | `userRequestId` *string* | — | `200` OK |  |

- **`/api/v1/TrackingRequest/Search`** — Paged list of the current user's requests (same data as Dashboard MyRequests).
- **`/api/v1/TrackingRequest/Lookups`** — Request-type and status options for filters (replaces ViewBag on the MVC MyRequests page).
- **`/api/v1/TrackingRequest/Details`** — Details for a single user request (e.g. Order line items), scoped to the current user.

### TrainerContracts

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/TrainerContracts/trainer-contracts` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/v1/TrainerContracts/trainer-contracts/Download` | `contractId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/TrainerContracts/trainer-contracts/backfill/generate` | `contractId` *string*<br>`X-Backfill-ApiKey` *string* (header) | — | `200` OK |  |
| `POST` | `/api/v1/TrainerContracts/trainer-contracts/Approve` | — | `UpdateContractViewModel` | `200` OK |  |
| `POST` | `/api/v1/TrainerContracts/trainer-contracts/Refuse` | — | `UpdateContractViewModel` | `200` OK |  |

- **`/api/v1/TrainerContracts/trainer-contracts`** — Retrieves all trainer contracts associated with the currently authenticated user, filtered by the current user's profile identifier.
- **`/api/v1/TrainerContracts/trainer-contracts/Download`** — Generates the trainer contract PDF, stores it on CDN when missing, and returns the file for download.
- **`/api/v1/TrainerContracts/trainer-contracts/backfill/generate`** — Generates and persists a trainer contract agreement for system backfill (no JWT; API key required).

### UserCertificate

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/UserCertificate/{userCertificateId}/GetOrGenerateUserCertificateCdnUrl` | `userCertificateId` *string* (required, path) | — | `200` OK |  |

### Users

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Users/Info` | — | — | `200` OK | `200` 5.2 KB |
| `GET` | `/api/v1/Users/GetOrganizationUsers` | `term` *string*<br>`page` *integer*<br>`organizationId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Users/{userId}/Info` | `userId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Users/User/LeaveOrg` | `id` *string* | — | `200` OK |  |
| `POST` | `/api/v1/Users/ChangeTheme` | — | `ChangeUserProfileThemeCommand` | `200` OK |  |
| `POST` | `/api/v1/Users/Photo` | — | `object` | `200` [StringApiResponse](#stringapiresponse)<br>`400` Missing file or the file is not a supported image. |  |
| `POST` | `/api/v1/Users/AddUserFavorite` | — | `AddUserFavoriteRequest` | `200` OK |  |
| `GET` | `/api/v1/Users/GetUserFavorites` | — | — | `200` OK |  |
| `POST` | `/api/v1/Users/RemoveFavorite/{id}` | `id` *string* (required, path)<br>`paymentModuleId` *integer* | — | `200` OK |  |

- **`/api/v1/Users/Photo`** — Updates the profile photo of the currently logged-in user.
- **`/api/v1/Users/AddUserFavorite`** — Adds a new item to user favorites.
- **`/api/v1/Users/GetUserFavorites`** — Retrieves the current user's favorite items.
- **`/api/v1/Users/RemoveFavorite/{id}`** — Removes an item from user favorites.

### WorkSpace

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/WorkSpace/ReceiveWebhook` | — | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/Organization/{id}` | `X-Provider` *WorkSpaceProvider* (header)<br>`id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/workspace-courses` | `provider` *WorkSpaceProvider* (required)<br>`userId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/workspace-cards/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/workspace-cards-learner/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/workspace-learners` | — | `WorkSpaceLearnerRequestModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/SearchPrograms` | — | `WorkSpaceProgramsFilterViewModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/WorkSpaceProgramCount` | — | `WorkSpaceProgramsFilterViewModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/Users` | — | `WorkSpaceAssignedUsersFilterViewModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Users/SearchPrograms` | — | `WorkSpaceUserProgramsFilterViewModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/MyPrograms` | — | `WorkSpaceUserProgramsFilterViewModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/Update/Status` | — | `WorkSpaceEnrollementStatusViewModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/Status/SearchUsers` | — | `OrgUsersProgramEnrollementFilterViewModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/Users/program/Validate` | — | `EnrollUserToProgramViewModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/Users/Program` | — | `EnrollUserToProgramViewModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/BulkUsers/Program/{Provider}/{OrgId}/{ProgramId}/{EnrollementStatus}/{DueDate}` | `Provider` *WorkSpaceProvider* (required, path)<br>`OrgId` *string* (required, path)<br>`ProgramId` *string* (required, path)<br>`EnrollementStatus` *EnrollementStatus* (required, path)<br>`DueDate` *string* (required, path) | `object` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/ValidateBulkUsers/Program/{Provider}/{OrgId}/{ProgramId}` | `Provider` *WorkSpaceProvider* (required, path)<br>`OrgId` *string* (required, path)<br>`ProgramId` *string* (required, path)<br>`EnrollementStatus` *EnrollementStatus* (required, path)<br>`DueDate` *string* (required, path) | `object` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/activate-deActivate-license` | — | `ManageLicenceRequest` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/OrgAdmin/GetRequestAccess` | — | `WorkSpaceLicenseFilterRequestsViewModel` | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/OrgAdmin/GetPendingRequestCount/{organizationId}/{status}` | `organizationId` *string* (required, path)<br>`status` *LicenceRequestStatus* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/OrgAdmin/GetRequestAccessHistory/{requestId}` | `requestId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/OrgAdmin/ApproveRejectRequestAccess/{requestId}/{isApproved}` | `requestId` *string* (required, path)<br>`isApproved` *boolean* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/individual/RequestAccessLicense` | `workSpaceProvider` *WorkSpaceProvider* | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/individual/RequestAccessLicenseReminder` | `requestId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/WorkSpaceUserProgress` | — | `WorkSpaceLearnerProgressRequestModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/WorkSpaceUserProgress/{userId}` | `userId` *string* (required, path) | `WorkSpaceUserProgressRequestModel` | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Users/Courses` | — | `WorkSpaceUserCoursesFilterViewModel` | `200` OK |  |

### WorkSpaces

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/WorkSpaces` | — | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpaces/Classification/FA` | — | — | `200` OK |  |

---

## 5. Return bodies

The response payload of every operation that declares one, expanded field by field. Each heading lists the operations that return it.

### ApiResponse — full response body

Returned by: `GET /api/v1/AlmentorCourseCatalogue/GetAllLearnsProgress`, `POST /api/v1/AlmentorCourseCatalogue/MyPrograms`, `POST /api/v1/DashBoard/MyPrograms`, `POST /api/v1/DashBoard/MySelfLearningPrograms`, `POST /api/v1/DashBoard/MyExams`, `POST /api/v1/DashBoard/MyEvents`, `POST /api/v1/DashBoard/AddUserRate`, `GET /api/v1/DashBoard/ProgramEndWithExam`, `GET /api/qualifications-education`, `POST /api/qualifications-education`, `GET /api/qualifications-education/{id}`, `GET /api/qualifications-education/delete/{id}` *and 17 more*

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — object

### BooleanApiResponse — full response body

Returned by: `POST /api/v1/Exam/ChangeProfile`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — boolean
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### BooleanReturnResult — full response body

Returned by: `POST /api/v1/Event/CancelReservation`, `POST /api/v1/Exam/AddToCart`, `POST /api/v1/Exam/External/AddToCart`, `POST /api/v1/Exam/cancel-reservation`, `POST /api/v1/Orgnization/EnableDisablePartnerOrg`, `GET /api/v1/Payment/CheckPaymentComplish`, `POST /api/v1/Program/cancel-reservation`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — boolean
- `message` — string

### CalendarUnifiedItemDtoListReturnResult — full response body

Returned by: `GET /api/v1/Home/Calendar`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — CalendarUnifiedItemDto[]
  - `id` — string
  - `name` — string
  - `description` — string
  - `startDate` — string
  - `endDate` — string
  - `startTime` — string
  - `endTime` — string
  - `itemType` — string
- `message` — string

### CalendarUnifiedItemDtoReturnResult — full response body

Returned by: `GET /api/v1/Home/Calendar-Guest`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — CalendarUnifiedItemDto
  - `id` — string
  - `name` — string
  - `description` — string
  - `startDate` — string
  - `endDate` — string
  - `startTime` — string
  - `endTime` — string
  - `itemType` — string
- `message` — string

### CartPaymentViewModelReturnResult — full response body

Returned by: `GET /api/v1/Cart/GetShoppingCartWithDetails`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — CartPaymentViewModel
  - `id` — string
  - `amount` — number
  - `totalAmount` — number
  - `vat` — number
  - `discount` — number
  - `shoppingCartList` — CartDetailsViewModel[]
    - `id` — string
    - `requestId` — string
    - `centerId` — string
    - `amount` — number
    - `totalAmount` — number
    - `vat` — number
    - `discount` — number
    - `userName` — string
    - `descrition` — string
    - `descritionAr` — string
    - `descritionEn` — string
    - `isPricesChanged` — boolean
    - `transactionTypeId` — integer
    - `paymentModuleId` — integer
    - `moduleName` — string
    - `userFullName` — string
    - `userId` — string
    - `description` — string
    - `descriptionAr` — string
    - `descriptionEn` — string
    - `refId` — string
    - `periodId` — string
    - `penaltyDiscountTypeId` — integer
    - `couponId` — string
    - `couponCode` — string
    - `autoApply` — boolean
    - `bundleId` — string
    - `parentCartDetailsId` — string
    - `enableDelete` — boolean
    - `startDate` — datetime
    - `cartDetailMetaData` — CartDetailMetaData
      - `language` — integer
      - `location` — string
      - `itemDate` — string
      - `itemTime` — string
      - `duration` — string
      - `imageAttachmentId` — string
      - `imageUrl` — string
      - `programId` — string
      - `thumbnailImageId` — string
      - `isExecutive` — boolean
      - `isSelfLearning` — boolean
    - `voucherNumber` — string
    - `quantity` — integer
  - `refUrl` — string
  - `billNumber` — string
  - `invoiceId` — string
  - `url` — string
  - `callbackUrl` — string
  - `isPricesChanged` — boolean
  - `couponCode` — string
  - `allowCouponDiscount` — boolean
  - `isValidCoupon` — boolean
  - `viewPaymentSummary` — boolean
  - `isAlreadyPaid` — boolean
  - `isUsedZatkaLayout` — boolean
  - `refCode` — string
  - `issueDate` — datetime
  - `organizationCart` — object
  - `walletCartInfo` — WalletCartInfo
    - `balance` — number
    - `enable` — boolean
    - `show` — boolean
  - `hasIndividualRegistration` — boolean
  - `cartItems` — MoEngagePurchaseItemDto[]
    - `request_id` — string
    - `item_id` — string
    - `is_executive` — boolean
    - `item_type` — integer
  - `numberOfItems` — integer
  - `currentUserId` — string
  - `allowedTaxInvoices` — boolean
- `message` — string

### CertificatesOverviewDtoReturnResult — full response body

Returned by: `GET /api/v1/Exam/Overview`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — CertificatesOverviewDto
  - `mostRequestedCertificates` — ExamCardDtoOverviewSectionDto
    - `title` — string
    - `subtitle` — string
    - `items` — ExamCardDto[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `marketingDescription` — string
      - `userRate` — number
      - `imageUrl` — string
      - `examFees` — string
      - `fees` — number
      - `examProfiles` — StringLookupViewModelAPI[] → *see [StringLookupViewModelAPI](#stringlookupviewmodelapi)*
      - `profiles` — Profile[] → *see [Profile](#profile)*
      - `priceAfterDiscount` — number
      - `isPercentage` — boolean
      - `hasDiscount` — boolean
      - `discountMarketDescription` — string
      - `discountAmount` — number
      - `discountAmountDescription` — string
      - `userFavoritId` — string
      - `isHrdfSupported` — boolean
      - `hrdfTagText` — string
      - `hrdfLogoUrl` — string
  - `newCertificates` — ExamCardDtoOverviewSectionDto
    - `title` — string
    - `subtitle` — string
    - `items` — ExamCardDto[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `marketingDescription` — string
      - `userRate` — number
      - `imageUrl` — string
      - `examFees` — string
      - `fees` — number
      - `examProfiles` — StringLookupViewModelAPI[] → *see [StringLookupViewModelAPI](#stringlookupviewmodelapi)*
      - `profiles` — Profile[] → *see [Profile](#profile)*
      - `priceAfterDiscount` — number
      - `isPercentage` — boolean
      - `hasDiscount` — boolean
      - `discountMarketDescription` — string
      - `discountAmount` — number
      - `discountAmountDescription` — string
      - `userFavoritId` — string
      - `isHrdfSupported` — boolean
      - `hrdfTagText` — string
      - `hrdfLogoUrl` — string
  - `mainCategories` — CertificateCategoryDtoOverviewSectionDto
    - `title` — string
    - `subtitle` — string
    - `items` — CertificateCategoryDto[]
      - `id` — string
      - `name` — string
      - `numberOfExams` — integer
      - `icon` — string
      - `url` — string
  - `policies` — CertificatePolicyDtoOverviewSectionDto
    - `title` — string
    - `subtitle` — string
    - `items` — CertificatePolicyDto[]
      - `title` — string
      - `url` — string
      - `displayOrder` — integer
      - `icon` — string
  - `exploreCertificates` — ExploreCertificatesDto
    - `title` — string
    - `url` — string
- `message` — string

### CfaCertificatesSectionDtoApiResponse — full response body

Returned by: `GET /api/v1/Exam/GetCfaCertificates`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — CfaCertificatesSectionDto
  - `title` — string
  - `description` — string
  - `viewAllText` — string
  - `viewAllUrl` — string
  - `items` — CfaCertificateDto[]
    - `name` — string
    - `nameAr` — string
    - `nameEn` — string
    - `imageUrl` — string
    - `certificateIconUrl` — string
    - `language` — string
    - `learningType` — string
    - `isNew` — boolean
    - `status` — string
    - `price` — string
    - `duration` — string
    - `registrationText` — string
    - `registrationUrl` — string
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### CheckoutResponseApiDtoReturnResult — full response body

Returned by: `POST /api/v1/Payment/Checkout`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — CheckoutResponseApiDto
  - `isalreadyPaid` — boolean
  - `isFreePayment` — boolean
  - `checkoutUrl` — string
  - `paymentType` — PaymentGatewayType
    *(enum: 1,2,3,4,5,6)*
  - `expriyDate` — string
  - `billNumber` — string
- `message` — string

### CompetencyDetailsDtoReturnResult — full response body

Returned by: `GET /api/v1/FinancialSkills/GetCompetencyDetails`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — CompetencyDetailsDto
  - `id` — string
  - `code` — string
  - `name` — string
  - `typeId` — integer
  - `typeName` — string
  - `description` — string
  - `levels` — CompetencyDetailsLevelDto[]
    - `level` — integer
    - `title` — string
    - `elements` — CompetencyDetailsLevelElementDto[]
      - `description` — string
- `message` — string

### CompetencyLevelDetailsDtoReturnResult — full response body

Returned by: `GET /api/v1/FinancialSkills/GetCompetencyLevelDetails`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — CompetencyLevelDetailsDto
  - `programs` — ProgramDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `location` — string
    - `imageAttachmentPath` — string
    - `isPublishedForOrganizations` — boolean
    - `programTopicName` — string
    - `planNumberOfDays` — integer
    - `isNew` — boolean
    - `isEndingSoon` — boolean
    - `endingSoonText` — string
    - `examId` — string
    - `endsWithExam` — boolean
    - `endsWithExamText` — string
    - `appointmentDateText` — string
    - `isExecutiveProgram` — boolean
    - `userRate` — number
    - `ratingUsersCount` — integer
    - `isForStudent` — boolean
    - `isForIndividuals` — boolean
    - `audienceType` — string
    - `userFavoritId` — string
    - `isFavorite` — boolean
    - `trainingTypeCssClass` — string
    - `externalRegistrationURL` — string
    - `hasExternalRegistrationURL` — boolean
    - `startDate` — string
    - `trainingTypeId` — integer
    - `trainingType` — string
    - `allTrainingTypes` — string
    - `programFees` — number
    - `fees` — string
    - `planId` — string
    - `language` — string
    - `date` — datetime
    - `planFees` — number
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `isAvailable` — boolean
    - `isFree` — boolean
    - `freeMessage` — string
    - `isFullySupported` — boolean
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
    - `formattedPrice` — string
    - `isBundle` — boolean
    - `bundleText` — string
  - `certificates` — ExamCardDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `marketingDescription` — string
    - `userRate` — number
    - `imageUrl` — string
    - `examFees` — string
    - `fees` — number
    - `examProfiles` — StringLookupViewModelAPI[]
      - `key` — string
      - `text` — string
      - `itemId` — string
      - `id` — integer
      - `value` — string
    - `profiles` — Profile[]
      - `id` — string
      - `examId` — string
      - `code` — string
      - `nameAr` — string
      - `nameEn` — string
      - `titleAr` — string
      - `titleEn` — string
      - `confidentialInformationText` — string
      - `guidelinesText` — string
      - `isSuccessGradeByPercentage` — boolean
      - `successGrade` — number
      - `totalScore` — number
      - `isTrainingMaterialLink` — boolean
      - `trainingMaterialLink` — string
      - `trainingMaterialAttachmentId` — string
      - `noOfQuestions` — integer
      - `noOfTrialQuestions` — integer
      - `durationInMinutes` — integer
      - `languageId` — integer
      - `isQuestionsSelectionRandom` — boolean
      - `targetAudienceId` — integer
      - `isFolderWeightByPercentage` — boolean
      - `isOrganizedByInstitute` — boolean
      - `isActive` — boolean
      - `isPublished` — boolean
      - `versionNum` — integer
      - `versioningRelatedCode` — string
      - `isLastVersion` — boolean
      - `isOriginalVersion` — boolean
      - `createdBy` — string
      - `createdOn` — datetime
      - `updatedBy` — string
      - `updatedOn` — datetime
      - `statusId` — integer
      - `integrationExamId` — string
      - `isExternalRegistration` — boolean
      - `isCollectedInDynamics` — boolean
      - `externalRegistrationUrl` — string
      - `isHoldInsideAcademy` — boolean
      - `registrationEndDate` — datetime
      - `registrationStartDate` — datetime
      - `projectId` — string
      - `exam` — Exam → *see [Exam](#exam)*
      - `targetAudience` — TargetAudienceType → *see [TargetAudienceType](#targetaudiencetype)*
      - `profileSetting` — ProfileSetting → *see [ProfileSetting](#profilesetting)*
      - `attemptConfiscationProfiles` — AttemptConfiscationProfile[] → *see [AttemptConfiscationProfile](#attemptconfiscationprofile)*
      - `attemptObjections` — AttemptObjection[] → *see [AttemptObjection](#attemptobjection)*
      - `attemptSuspensions` — AttemptSuspension[] → *see [AttemptSuspension](#attemptsuspension)*
      - `attempts` — Attempt[] → *see [Attempt](#attempt)*
      - `examReservations` — ExamReservation[] → *see [ExamReservation](#examreservation)*
      - `profileFolderQuestions` — ProfileFolderQuestion[] → *see [ProfileFolderQuestion](#profilefolderquestion)*
      - `profileFolders` — ProfileFolder[] → *see [ProfileFolder](#profilefolder)*
      - `profileOwners` — ProfileOwner[] → *see [ProfileOwner](#profileowner)*
      - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[] → *see [ProfileRestrictedTestingCenter](#profilerestrictedtestingcenter)*
      - `questionsPriorities` — QuestionsPriority[] → *see [QuestionsPriority](#questionspriority)*
      - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[] → *see [TestCenterScheduleDayPeriodSpecializationExamProfile](#testcenterscheduledayperiodspecializationexamprofile)*
      - `trialExams` — TrialExam[] → *see [TrialExam](#trialexam)*
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `userFavoritId` — string
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
- `message` — string

### CountryRegistrationLookupDto — full response body

Returned by: `GET /api/v1/Lookup/GetCountries`, `GET /api/v1/Lookup/GetCountryById/{countryId}`, `GET /api/v1/Lookup/GetCountryByNafathMappingId/{nafathCountryId}`

- `id` — integer
- `nameAr` — string
- `nameEn` — string
- `nationalityAr` — string
- `nationalityEn` — string
- `countryCode` — string
- `nafathMappingCode` — integer
- `isRestricted` — boolean

### CouponResponseDtoApiResponse — full response body

Returned by: `GET /api/v1/Payment/GetCouponValue`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — CouponResponseDto
  - `amount` — number
  - `totalAmount` — number
  - `vat` — number
  - `discount` — number
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### EventsOverviewDtoReturnResult — full response body

Returned by: `GET /api/v1/Home/EventsOverview`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — EventsOverviewDto
  - `title` — string
  - `description` — string
  - `upcomingEvents` — EventsOverviewSectionDto
    - `title` — string
    - `description` — string
    - `viewAllText` — string
    - `viewAllUrl` — string
    - `bookNowText` — string
    - `items` — EventCardDto[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `locationTypeName` — string
      - `imageAttachmentUrl` — string
      - `speakerName` — string
      - `detailsPageURL` — string
      - `startDate` — datetime
      - `endDate` — datetime
      - `startTime` — string
      - `endTime` — string
      - `eventDate` — string
      - `eventTypeName` — string
      - `eventTypeId` — string
      - `fees` — string
      - `periodStatus` — string
      - `eventLanguage` — string
      - `date` — datetime
      - `eventFees` — number
      - `isPast` — boolean
      - `isCurrent` — boolean
      - `isFuture` — boolean
      - `isExpired` — boolean
      - `numberOfUserRates` — integer
      - `userRate` — number
      - `userFavoritId` — string
      - `speakerAvatar` — string
      - `eventTime` — string
  - `featuredEvents` — EventsOverviewSectionDto
    - `title` — string
    - `description` — string
    - `viewAllText` — string
    - `viewAllUrl` — string
    - `bookNowText` — string
    - `items` — EventCardDto[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `locationTypeName` — string
      - `imageAttachmentUrl` — string
      - `speakerName` — string
      - `detailsPageURL` — string
      - `startDate` — datetime
      - `endDate` — datetime
      - `startTime` — string
      - `endTime` — string
      - `eventDate` — string
      - `eventTypeName` — string
      - `eventTypeId` — string
      - `fees` — string
      - `periodStatus` — string
      - `eventLanguage` — string
      - `date` — datetime
      - `eventFees` — number
      - `isPast` — boolean
      - `isCurrent` — boolean
      - `isFuture` — boolean
      - `isExpired` — boolean
      - `numberOfUserRates` — integer
      - `userRate` — number
      - `userFavoritId` — string
      - `speakerAvatar` — string
      - `eventTime` — string
  - `eventsOfTheMonth` — EventsOverviewSectionDto
    - `title` — string
    - `description` — string
    - `viewAllText` — string
    - `viewAllUrl` — string
    - `bookNowText` — string
    - `items` — EventCardDto[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `locationTypeName` — string
      - `imageAttachmentUrl` — string
      - `speakerName` — string
      - `detailsPageURL` — string
      - `startDate` — datetime
      - `endDate` — datetime
      - `startTime` — string
      - `endTime` — string
      - `eventDate` — string
      - `eventTypeName` — string
      - `eventTypeId` — string
      - `fees` — string
      - `periodStatus` — string
      - `eventLanguage` — string
      - `date` — datetime
      - `eventFees` — number
      - `isPast` — boolean
      - `isCurrent` — boolean
      - `isFuture` — boolean
      - `isExpired` — boolean
      - `numberOfUserRates` — integer
      - `userRate` — number
      - `userFavoritId` — string
      - `speakerAvatar` — string
      - `eventTime` — string
  - `expertSpeakers` — ExpertSpeakersSectionDto
    - `title` — string
    - `description` — string
    - `items` — ExpertSpeakerDto[]
      - `id` — string
      - `fullName` — string
      - `photo` — string
      - `linkedInUrl` — string
      - `xUrl` — string
- `message` — string

### FinancialSectorGatewayDtoReturnResult — full response body

Returned by: `GET /api/v1/Home/FinancialSectorGateway`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — FinancialSectorGatewayDto
  - `programs` — ProgramDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `location` — string
    - `imageAttachmentPath` — string
    - `isPublishedForOrganizations` — boolean
    - `programTopicName` — string
    - `planNumberOfDays` — integer
    - `isNew` — boolean
    - `isEndingSoon` — boolean
    - `endingSoonText` — string
    - `examId` — string
    - `endsWithExam` — boolean
    - `endsWithExamText` — string
    - `appointmentDateText` — string
    - `isExecutiveProgram` — boolean
    - `userRate` — number
    - `ratingUsersCount` — integer
    - `isForStudent` — boolean
    - `isForIndividuals` — boolean
    - `audienceType` — string
    - `userFavoritId` — string
    - `isFavorite` — boolean
    - `trainingTypeCssClass` — string
    - `externalRegistrationURL` — string
    - `hasExternalRegistrationURL` — boolean
    - `startDate` — string
    - `trainingTypeId` — integer
    - `trainingType` — string
    - `allTrainingTypes` — string
    - `programFees` — number
    - `fees` — string
    - `planId` — string
    - `language` — string
    - `date` — datetime
    - `planFees` — number
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `isAvailable` — boolean
    - `isFree` — boolean
    - `freeMessage` — string
    - `isFullySupported` — boolean
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
    - `formattedPrice` — string
    - `isBundle` — boolean
    - `bundleText` — string
  - `selfLearningPrograms` — ProgramDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `location` — string
    - `imageAttachmentPath` — string
    - `isPublishedForOrganizations` — boolean
    - `programTopicName` — string
    - `planNumberOfDays` — integer
    - `isNew` — boolean
    - `isEndingSoon` — boolean
    - `endingSoonText` — string
    - `examId` — string
    - `endsWithExam` — boolean
    - `endsWithExamText` — string
    - `appointmentDateText` — string
    - `isExecutiveProgram` — boolean
    - `userRate` — number
    - `ratingUsersCount` — integer
    - `isForStudent` — boolean
    - `isForIndividuals` — boolean
    - `audienceType` — string
    - `userFavoritId` — string
    - `isFavorite` — boolean
    - `trainingTypeCssClass` — string
    - `externalRegistrationURL` — string
    - `hasExternalRegistrationURL` — boolean
    - `startDate` — string
    - `trainingTypeId` — integer
    - `trainingType` — string
    - `allTrainingTypes` — string
    - `programFees` — number
    - `fees` — string
    - `planId` — string
    - `language` — string
    - `date` — datetime
    - `planFees` — number
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `isAvailable` — boolean
    - `isFree` — boolean
    - `freeMessage` — string
    - `isFullySupported` — boolean
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
    - `formattedPrice` — string
    - `isBundle` — boolean
    - `bundleText` — string
  - `knowledgeSeminars` — EventCardDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `locationTypeName` — string
    - `imageAttachmentUrl` — string
    - `speakerName` — string
    - `detailsPageURL` — string
    - `startDate` — datetime
    - `endDate` — datetime
    - `startTime` — string
    - `endTime` — string
    - `eventDate` — string
    - `eventTypeName` — string
    - `eventTypeId` — string
    - `fees` — string
    - `periodStatus` — string
    - `eventLanguage` — string
    - `date` — datetime
    - `eventFees` — number
    - `isPast` — boolean
    - `isCurrent` — boolean
    - `isFuture` — boolean
    - `isExpired` — boolean
    - `numberOfUserRates` — integer
    - `userRate` — number
    - `userFavoritId` — string
    - `speakerAvatar` — string
    - `eventTime` — string
  - `sectorExpertsMeetings` — EventCardDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `locationTypeName` — string
    - `imageAttachmentUrl` — string
    - `speakerName` — string
    - `detailsPageURL` — string
    - `startDate` — datetime
    - `endDate` — datetime
    - `startTime` — string
    - `endTime` — string
    - `eventDate` — string
    - `eventTypeName` — string
    - `eventTypeId` — string
    - `fees` — string
    - `periodStatus` — string
    - `eventLanguage` — string
    - `date` — datetime
    - `eventFees` — number
    - `isPast` — boolean
    - `isCurrent` — boolean
    - `isFuture` — boolean
    - `isExpired` — boolean
    - `numberOfUserRates` — integer
    - `userRate` — number
    - `userFavoritId` — string
    - `speakerAvatar` — string
    - `eventTime` — string
- `message` — string

### FinancialSkillsFrameworkOverviewDtoApiResponse — full response body

Returned by: `GET /api/v1/FinancialSkills/GetFrameworkOverview`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — FinancialSkillsFrameworkOverviewDto
  - `title` — string
  - `description` — string
  - `financialSkillsDictionary` — FinancialSkillsLinkSectionDto
    - `title` — string
    - `description` — string
    - `buttonText` — string
    - `url` — string
  - `frameworkStructure` — FinancialSkillsLinkSectionDto
    - `title` — string
    - `description` — string
    - `buttonText` — string
    - `url` — string
  - `documentsTitle` — string
  - `documents` — FinancialSkillsDocumentDto[]
    - `title` — string
    - `type` — string
    - `downloadUrl` — string
    - `fileSize` — string
    - `displayOrder` — integer
    - `iconUrl` — string
    - `buttonText` — string
    - `buttonIconUrl` — string
    - `previewIconUrl` — string
  - `faqTitle` — string
  - `faq` — FinancialSkillsFaqDto[]
    - `question` — string
    - `answer` — string
  - `faqViewAll` — FinancialSkillsActionDto
    - `text` — string
    - `url` — string
  - `strategicPartnersTitle` — string
  - `strategicPartners` — FinancialSkillsPartnerDto[]
    - `name` — string
    - `logoUrl` — string
    - `url` — string
    - `displayOrder` — integer
  - `support` — FinancialSkillsSupportDto
    - `title` — string
    - `description` — string
    - `buttonText` — string
    - `url` — string
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### FrameworkStructureResponseDtoApiResponse — full response body

Returned by: `POST /api/v1/FinancialSkills/GetFrameworkStructure`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — FrameworkStructureResponseDto
  - `page` — FrameworkStructurePageDto
    - `title` — string
    - `description` — string
    - `metaTitle` — string
    - `metaDescription` — string
  - `overview` — FrameworkStructureOverviewItemDto[]
    - `title` — string
    - `description` — string
    - `iconUrl` — string
    - `displayOrder` — integer
  - `statistics` — FrameworkStructureStatisticsDto
    - `sectors` — FrameworkStructureSectorDto[]
      - `id` — string
      - `name` — string
      - `iconSvg` — string
      - `iconUrl` — string
      - `segmentsCount` — integer
      - `jobFamiliesCount` — integer
      - `jobRolesCount` — integer
  - `filters` — FrameworkStructureFiltersDto
    - `sectors` — FrameworkStructureFilterOptionDto[]
      - `id` — string
      - `text` — string
      - `value` — string
      - `isSelected` — boolean
    - `jobFamilies` — FrameworkStructureFilterOptionDto[]
      - `id` — string
      - `text` — string
      - `value` — string
      - `isSelected` — boolean
  - `pagination` — FrameworkStructurePaginationDto
    - `pageNumber` — integer
    - `pageSize` — integer
    - `totalItems` — integer
    - `totalPages` — integer
  - `items` — FrameworkStructureItemDto[]
    - `jobFamilyId` — string
    - `sectorId` — string
    - `sector` — string
    - `department` — string
    - `jobFamily` — string
    - `detailsUrl` — string
  - `labels` — FrameworkStructureLabelsDto
    - `search` — string
    - `searchPlaceholder` — string
    - `bankingSector` — string
    - `jobFamilies` — string
    - `all` — string
    - `applyFilters` — string
    - `sector` — string
    - `department` — string
    - `jobFamily` — string
    - `noResults` — string
  - `support` — FrameworkStructureSupportDto
    - `title` — string
    - `buttonText` — string
    - `url` — string
    - `iconUrl` — string
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### HomeExpertDtoListReturnResult — full response body

Returned by: `GET /api/v1/Home/Experts`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — HomeExpertDto[]
  - `id` — string
  - `fullName` — string
  - `profileImage` — string
  - `linkedInUrl` — string
  - `xUrl` — string
- `message` — string

### InitiativeMenuDtoReturnResult — full response body

Returned by: `GET /api/v1/Home/InitiativeMenu`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — InitiativeMenuDto
  - `activeMenu` — InitiativeMenuItemViewModel[]
    - `title` — string
    - `description` — string
    - `image` — string
    - `url` — string
    - `order` — integer
- `message` — string

### JobFamilyDetailsResponseDtoApiResponse — full response body

Returned by: `GET /api/v1/FinancialSkills/GetJobFamilyDetails`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — JobFamilyDetailsResponseDto
  - `jobFamily` — FinancialSkillsJobFamilyDto
    - `id` — string
    - `code` — string
    - `name` — string
    - `description` — string
  - `jobRoles` — JobFamilyJobRoleDto[]
    - `id` — string
    - `code` — string
    - `name` — string
    - `jobFamilyName` — string
    - `isDefault` — boolean
    - `responsibilities` — JobRoleResponsibilityDto[]
      - `order` — integer
      - `description` — string
    - `technicalSkills` — JobRoleSkillDto[]
      - `competencyId` — string
      - `name` — string
      - `level` — string
      - `typeId` — integer
      - `typeName` — string
    - `behavioralSkills` — JobRoleSkillDto[]
      - `competencyId` — string
      - `name` — string
      - `level` — string
      - `typeId` — integer
      - `typeName` — string
  - `support` — FrameworkStructureSupportDto
    - `title` — string
    - `buttonText` — string
    - `url` — string
    - `iconUrl` — string
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### MursionAddToCartResponseDtoReturnResult — full response body

Returned by: `POST /api/v1/Mursion/AddToCart`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — MursionAddToCartResponseDto
  - `redirectToCart` — boolean
  - `requiresPayment` — boolean
  - `nextAction` — string
  - `replacedExistingItem` — boolean
- `message` — string

### MursionDetailsDtoReturnResult — full response body

Returned by: `GET /api/v1/Mursion/GetDetails`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — MursionDetailsDto
  - `title` — string
  - `pageDescription` — string
  - `overview` — string
  - `detailedDescription` — string
  - `mainImageUrl` — string
  - `imageFallbackUrl` — string
  - `videoUrl` — string
  - `sectors` — string[]
  - `jobFamilies` — string[]
  - `topics` — string[]
  - `prerequisites` — string
  - `policyUrl` — string
  - `purchaseSectionTitle` — string
  - `addToCartText` — string
  - `availabilityLabel` — string
  - `availability` — integer
  - `sessionType` — string
  - `durationMinutes` — integer
  - `scenarioLanguage` — string
  - `scenarios` — MursionScenarioDto[]
    - `order` — integer
    - `name` — string
    - `objective` — string
  - `scenariosSectionTitle` — string
  - `scenariosOverview` — string
  - `scenariosDescription` — string
  - `interactiveSessionsLabel` — string
  - `learningPathTitle` — string
  - `learningPath` — MursionLearningPathItemDto[]
    - `order` — integer
    - `title` — string
    - `description` — string
  - `rating` — number
  - `ratingCount` — integer
  - `price` — MursionPriceDto
    - `baseAmount` — number
    - `vat` — number
    - `totalAmount` — number
    - `currency` — string
    - `applyVat` — boolean
  - `canPurchase` — boolean
  - `addToCartRoute` — string
  - `relatedPrograms` — ProgramDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `location` — string
    - `imageAttachmentPath` — string
    - `isPublishedForOrganizations` — boolean
    - `programTopicName` — string
    - `planNumberOfDays` — integer
    - `isNew` — boolean
    - `isEndingSoon` — boolean
    - `endingSoonText` — string
    - `examId` — string
    - `endsWithExam` — boolean
    - `endsWithExamText` — string
    - `appointmentDateText` — string
    - `isExecutiveProgram` — boolean
    - `userRate` — number
    - `ratingUsersCount` — integer
    - `isForStudent` — boolean
    - `isForIndividuals` — boolean
    - `audienceType` — string
    - `userFavoritId` — string
    - `isFavorite` — boolean
    - `trainingTypeCssClass` — string
    - `externalRegistrationURL` — string
    - `hasExternalRegistrationURL` — boolean
    - `startDate` — string
    - `trainingTypeId` — integer
    - `trainingType` — string
    - `allTrainingTypes` — string
    - `programFees` — number
    - `fees` — string
    - `planId` — string
    - `language` — string
    - `date` — datetime
    - `planFees` — number
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `isAvailable` — boolean
    - `isFree` — boolean
    - `freeMessage` — string
    - `isFullySupported` — boolean
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
    - `formattedPrice` — string
    - `isBundle` — boolean
    - `bundleText` — string
  - `suggestedCertificates` — ExamCardDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `marketingDescription` — string
    - `userRate` — number
    - `imageUrl` — string
    - `examFees` — string
    - `fees` — number
    - `examProfiles` — StringLookupViewModelAPI[]
      - `key` — string
      - `text` — string
      - `itemId` — string
      - `id` — integer
      - `value` — string
    - `profiles` — Profile[]
      - `id` — string
      - `examId` — string
      - `code` — string
      - `nameAr` — string
      - `nameEn` — string
      - `titleAr` — string
      - `titleEn` — string
      - `confidentialInformationText` — string
      - `guidelinesText` — string
      - `isSuccessGradeByPercentage` — boolean
      - `successGrade` — number
      - `totalScore` — number
      - `isTrainingMaterialLink` — boolean
      - `trainingMaterialLink` — string
      - `trainingMaterialAttachmentId` — string
      - `noOfQuestions` — integer
      - `noOfTrialQuestions` — integer
      - `durationInMinutes` — integer
      - `languageId` — integer
      - `isQuestionsSelectionRandom` — boolean
      - `targetAudienceId` — integer
      - `isFolderWeightByPercentage` — boolean
      - `isOrganizedByInstitute` — boolean
      - `isActive` — boolean
      - `isPublished` — boolean
      - `versionNum` — integer
      - `versioningRelatedCode` — string
      - `isLastVersion` — boolean
      - `isOriginalVersion` — boolean
      - `createdBy` — string
      - `createdOn` — datetime
      - `updatedBy` — string
      - `updatedOn` — datetime
      - `statusId` — integer
      - `integrationExamId` — string
      - `isExternalRegistration` — boolean
      - `isCollectedInDynamics` — boolean
      - `externalRegistrationUrl` — string
      - `isHoldInsideAcademy` — boolean
      - `registrationEndDate` — datetime
      - `registrationStartDate` — datetime
      - `projectId` — string
      - `exam` — Exam → *see [Exam](#exam)*
      - `targetAudience` — TargetAudienceType → *see [TargetAudienceType](#targetaudiencetype)*
      - `profileSetting` — ProfileSetting → *see [ProfileSetting](#profilesetting)*
      - `attemptConfiscationProfiles` — AttemptConfiscationProfile[] → *see [AttemptConfiscationProfile](#attemptconfiscationprofile)*
      - `attemptObjections` — AttemptObjection[] → *see [AttemptObjection](#attemptobjection)*
      - `attemptSuspensions` — AttemptSuspension[] → *see [AttemptSuspension](#attemptsuspension)*
      - `attempts` — Attempt[] → *see [Attempt](#attempt)*
      - `examReservations` — ExamReservation[] → *see [ExamReservation](#examreservation)*
      - `profileFolderQuestions` — ProfileFolderQuestion[] → *see [ProfileFolderQuestion](#profilefolderquestion)*
      - `profileFolders` — ProfileFolder[] → *see [ProfileFolder](#profilefolder)*
      - `profileOwners` — ProfileOwner[] → *see [ProfileOwner](#profileowner)*
      - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[] → *see [ProfileRestrictedTestingCenter](#profilerestrictedtestingcenter)*
      - `questionsPriorities` — QuestionsPriority[] → *see [QuestionsPriority](#questionspriority)*
      - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[] → *see [TestCenterScheduleDayPeriodSpecializationExamProfile](#testcenterscheduledayperiodspecializationexamprofile)*
      - `trialExams` — TrialExam[] → *see [TrialExam](#trialexam)*
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `userFavoritId` — string
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
- `message` — string

### MursionPostPaymentActionDtoReturnResult — full response body

Returned by: `GET /api/v1/Mursion/GetPostPaymentAction`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — MursionPostPaymentActionDto
  - `paymentSucceeded` — boolean
  - `nextAction` — string
  - `redirectUrl` — string
- `message` — string

### ObjectReturnResultApiResponse — full response body

Returned by: `POST /api/v1/Program/AddUserInterestInProgram`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — ObjectReturnResult
  - `value` — object
  - `errors` — Item[]
    - `name` — string
    - `value` — string
    - `count` — integer
  - `isValid` — boolean
  - `message` — string
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### OrganizationPartnerModelIPagedListReturnResult — full response body

Returned by: `GET /api/v1/Orgnization/GetOrganisationsPartners`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — OrganizationPartnerModel[]
  - `id` — integer
  - `organizationId` — string
  - `name` — string
  - `partnerCode` — string
  - `isEnabled` — boolean
  - `integrationUrl` — string
- `message` — string

### ProgramDetailsDtoReturnResult — full response body

Returned by: `POST /api/v1/AlmentorCourseCatalogue/GetProgramDetails`, `GET /api/v1/Program/GetProgramDetails`

- `value` — ProgramDetailsDto
  - `id` — string
  - `name` — string
  - `brief` — string
  - `marketingDescription` — string
  - `externalRegistrationURL` — string
  - `hasExternalRegistrationURL` — boolean
  - `videoURL` — string
  - `competencyLevelId` — integer
  - `imageAttachmentUrl` — string
  - `rate` — number
  - `numberOfUserRates` — integer
  - `userFavoritId` — string
  - `isInterestSaved` — boolean
  - `interestSavedMessage` — string
  - `language` — string
  - `sectorsList` — LookupModel[]
    - `name` — string
    - `description` — string
    - `value` — object
    - `extra` — object
  - `programTopic` — LookupModel
    - `name` — string
    - `description` — string
    - `value` — object
    - `extra` — object
  - `programTopics` — LookupModel[]
    - `name` — string
    - `description` — string
    - `value` — object
    - `extra` — object
  - `trainers` — LookupModel[]
    - `name` — string
    - `description` — string
    - `value` — object
    - `extra` — object
  - `programAgenda` — LookupTreeModel[]
    - `name` — string
    - `description` — string
    - `value` — object
    - `parentValue` — object
  - `actualTrainingMethod` — string[]
  - `actualEvaluationMethod` — string[]
  - `programRequirements` — LookupModel[]
    - `name` — string
    - `description` — string
    - `value` — object
    - `extra` — object
  - `programMains` — LookupModel[]
    - `name` — string
    - `description` — string
    - `value` — object
    - `extra` — object
  - `programAcquiredSkills` — LookupModel[]
    - `name` — string
    - `description` — string
    - `value` — object
    - `extra` — object
  - `programJobFamily` — JobFamilyViewModel[]
    - `id` — string
    - `name` — string
    - `nameAr` — string
    - `nameEn` — string **required**
    - `familyDeclarationAr` — string
    - `code` — string
    - `isCommon` — boolean
    - `familyDeclarationEn` — string
    - `sectorsCheckListData` — CheckListData **required**
      - `dataSource` — CheckItem[] → *see [CheckItem](#checkitem)*
      - `selectedItems` — string[]
      - `isReadOnly` — boolean
  - `brochureUrl` — string
  - `isAvailable` — boolean
  - `planFees` — number
  - `isFullySupported` — boolean
  - `isHrdfSupported` — boolean
  - `hrdfTagText` — string
  - `hrdfLogoUrl` — string
  - `formattedPrice` — string
  - `trainingPolicyLink` — string
  - `programTargetCategories` — string[]
  - `programJobRoleFamilies` — string[]
  - `hasRegistrationRequirements` — boolean
  - `registrationRequirments` — RegistrationRequirmentsDto[]
    - `id` — string
    - `registrationRequirementId` — string
    - `name` — string
    - `data` — object
    - `dataFile` — string
    - `dataTypeValue` — RequirementDataTypes
      *(enum: 1,2,3)*
    - `dataTypeId` — RequirementDataTypes
      *(enum: 1,2,3)*
    - `dataTypeIdValue` — integer
    - `isRequired` — boolean
  - `isExecutiveProgram` — boolean
  - `executiveProgram` — ExecutiveProgram
    - `partnersCDN` — PartnerDto
      - `name` — string
      - `image` — string
    - `partnersList` — PartnerDto[]
      - `name` — string
      - `image` — string
    - `learners` — SiteContentProgramDto[]
      - `id` — integer
      - `photo` — string
      - `title` — string
      - `subTitle` — string
      - `job` — string
      - `content` — string
      - `linkUrl` — string
      - `contentType` — SiteContentType → *see [SiteContentType](#sitecontenttype)*
      - `isPublish` — boolean
      - `itemId` — string
      - `sortOrder` — integer
    - `trainers` — LookupModel[]
      - `name` — string
      - `description` — string
      - `value` — object
      - `extra` — object
    - `trainersViewModel` — ProgramTrainerDto[]
      - `id` — string
      - `programId` — string
      - `name` — string
      - `description` — string
      - `attachmentId` — string
    - `descriptions` — ExecutiveProgramDescriptionsDto
      - `acceptanceDescription` — string
      - `educationalDescription` — string
      - `futureInvestmentDescription` — string
      - `organizationBenefitsDescription` — string
      - `professionalDevelopmentDescription` — string
      - `statisticsDescription` — string
    - `nearestPlan` — object
  - `detailsPageURL` — string
  - `location` — string
  - `locations` — string[]
  - `numberOfLessons` — integer
  - `relatedPrograms` — ProgramDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `location` — string
    - `imageAttachmentPath` — string
    - `isPublishedForOrganizations` — boolean
    - `programTopicName` — string
    - `planNumberOfDays` — integer
    - `isNew` — boolean
    - `isEndingSoon` — boolean
    - `endingSoonText` — string
    - `examId` — string
    - `endsWithExam` — boolean
    - `endsWithExamText` — string
    - `appointmentDateText` — string
    - `isExecutiveProgram` — boolean
    - `userRate` — number
    - `ratingUsersCount` — integer
    - `isForStudent` — boolean
    - `isForIndividuals` — boolean
    - `audienceType` — string
    - `userFavoritId` — string
    - `isFavorite` — boolean
    - `trainingTypeCssClass` — string
    - `externalRegistrationURL` — string
    - `hasExternalRegistrationURL` — boolean
    - `startDate` — string
    - `trainingTypeId` — integer
    - `trainingType` — string
    - `allTrainingTypes` — string
    - `programFees` — number
    - `fees` — string
    - `planId` — string
    - `language` — string
    - `date` — datetime
    - `planFees` — number
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `isAvailable` — boolean
    - `isFree` — boolean
    - `freeMessage` — string
    - `isFullySupported` — boolean
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
    - `formattedPrice` — string
    - `isBundle` — boolean
    - `bundleText` — string
  - `suggestedCertificates` — ExamCardDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `marketingDescription` — string
    - `userRate` — number
    - `imageUrl` — string
    - `examFees` — string
    - `fees` — number
    - `examProfiles` — StringLookupViewModelAPI[]
      - `key` — string
      - `text` — string
      - `itemId` — string
      - `id` — integer
      - `value` — string
    - `profiles` — Profile[]
      - `id` — string
      - `examId` — string
      - `code` — string
      - `nameAr` — string
      - `nameEn` — string
      - `titleAr` — string
      - `titleEn` — string
      - `confidentialInformationText` — string
      - `guidelinesText` — string
      - `isSuccessGradeByPercentage` — boolean
      - `successGrade` — number
      - `totalScore` — number
      - `isTrainingMaterialLink` — boolean
      - `trainingMaterialLink` — string
      - `trainingMaterialAttachmentId` — string
      - `noOfQuestions` — integer
      - `noOfTrialQuestions` — integer
      - `durationInMinutes` — integer
      - `languageId` — integer
      - `isQuestionsSelectionRandom` — boolean
      - `targetAudienceId` — integer
      - `isFolderWeightByPercentage` — boolean
      - `isOrganizedByInstitute` — boolean
      - `isActive` — boolean
      - `isPublished` — boolean
      - `versionNum` — integer
      - `versioningRelatedCode` — string
      - `isLastVersion` — boolean
      - `isOriginalVersion` — boolean
      - `createdBy` — string
      - `createdOn` — datetime
      - `updatedBy` — string
      - `updatedOn` — datetime
      - `statusId` — integer
      - `integrationExamId` — string
      - `isExternalRegistration` — boolean
      - `isCollectedInDynamics` — boolean
      - `externalRegistrationUrl` — string
      - `isHoldInsideAcademy` — boolean
      - `registrationEndDate` — datetime
      - `registrationStartDate` — datetime
      - `projectId` — string
      - `exam` — Exam → *see [Exam](#exam)*
      - `targetAudience` — TargetAudienceType → *see [TargetAudienceType](#targetaudiencetype)*
      - `profileSetting` — ProfileSetting → *see [ProfileSetting](#profilesetting)*
      - `attemptConfiscationProfiles` — AttemptConfiscationProfile[] → *see [AttemptConfiscationProfile](#attemptconfiscationprofile)*
      - `attemptObjections` — AttemptObjection[] → *see [AttemptObjection](#attemptobjection)*
      - `attemptSuspensions` — AttemptSuspension[] → *see [AttemptSuspension](#attemptsuspension)*
      - `attempts` — Attempt[] → *see [Attempt](#attempt)*
      - `examReservations` — ExamReservation[] → *see [ExamReservation](#examreservation)*
      - `profileFolderQuestions` — ProfileFolderQuestion[] → *see [ProfileFolderQuestion](#profilefolderquestion)*
      - `profileFolders` — ProfileFolder[] → *see [ProfileFolder](#profilefolder)*
      - `profileOwners` — ProfileOwner[] → *see [ProfileOwner](#profileowner)*
      - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[] → *see [ProfileRestrictedTestingCenter](#profilerestrictedtestingcenter)*
      - `questionsPriorities` — QuestionsPriority[] → *see [QuestionsPriority](#questionspriority)*
      - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[] → *see [TestCenterScheduleDayPeriodSpecializationExamProfile](#testcenterscheduledayperiodspecializationexamprofile)*
      - `trialExams` — TrialExam[] → *see [TrialExam](#trialexam)*
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `userFavoritId` — string
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
  - `durationInDays` — integer
  - `totalLearningHours` — integer
  - `numberOfRegisteredUsers` — integer
  - `applicationProcess` — ApplicationProcessDto
    - `title` — string
    - `description` — string
    - `steps` — ApplicationProcessStepDto[]
      - `id` — string
      - `stepOrder` — integer
      - `description` — string
  - `trainerCards` — ProgramExpertDto[]
    - `id` — string
    - `fullName` — string
    - `photoPath` — string
    - `linkedInUrl` — string
    - `xUrl` — string
  - `examId` — string
  - `isBundle` — boolean
  - `bundleText` — string
  - `endsWithExam` — boolean
  - `examDetails` — ProgramExamDetailsDto
    - `examId` — string
    - `examName` — string
    - `examDetailsUrl` — string
    - `numberOfQuestions` — integer
    - `numberOfFreeAttempts` — integer
    - `registrationDurationDays` — integer
    - `trials` — ProgramExamTrialDto[]
      - `trialNumber` — integer
      - `price` — number
      - `isFree` — boolean
      - `formattedPrice` — string
      - `appliesToSubsequentTrials` — boolean
- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `message` — string

### ProgramDtoListApiResponse — full response body

Returned by: `GET /api/v1/FinancialSkills/GetJobFamilyPrograms`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — ProgramDto[]
  - `id` — string
  - `name` — string
  - `description` — string
  - `location` — string
  - `imageAttachmentPath` — string
  - `isPublishedForOrganizations` — boolean
  - `programTopicName` — string
  - `planNumberOfDays` — integer
  - `isNew` — boolean
  - `isEndingSoon` — boolean
  - `endingSoonText` — string
  - `examId` — string
  - `endsWithExam` — boolean
  - `endsWithExamText` — string
  - `appointmentDateText` — string
  - `isExecutiveProgram` — boolean
  - `userRate` — number
  - `ratingUsersCount` — integer
  - `isForStudent` — boolean
  - `isForIndividuals` — boolean
  - `audienceType` — string
  - `userFavoritId` — string
  - `isFavorite` — boolean
  - `trainingTypeCssClass` — string
  - `externalRegistrationURL` — string
  - `hasExternalRegistrationURL` — boolean
  - `startDate` — string
  - `trainingTypeId` — integer
  - `trainingType` — string
  - `allTrainingTypes` — string
  - `programFees` — number
  - `fees` — string
  - `planId` — string
  - `language` — string
  - `date` — datetime
  - `planFees` — number
  - `priceAfterDiscount` — number
  - `isPercentage` — boolean
  - `hasDiscount` — boolean
  - `discountMarketDescription` — string
  - `discountAmount` — number
  - `discountAmountDescription` — string
  - `isAvailable` — boolean
  - `isFree` — boolean
  - `freeMessage` — string
  - `isFullySupported` — boolean
  - `isHrdfSupported` — boolean
  - `hrdfTagText` — string
  - `hrdfLogoUrl` — string
  - `formattedPrice` — string
  - `isBundle` — boolean
  - `bundleText` — string
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### ProgramDtoReturnResult — full response body

Returned by: `GET /api/v1/Program/GetProgramType`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — ProgramDto
  - `id` — string
  - `name` — string
  - `description` — string
  - `location` — string
  - `imageAttachmentPath` — string
  - `isPublishedForOrganizations` — boolean
  - `programTopicName` — string
  - `planNumberOfDays` — integer
  - `isNew` — boolean
  - `isEndingSoon` — boolean
  - `endingSoonText` — string
  - `examId` — string
  - `endsWithExam` — boolean
  - `endsWithExamText` — string
  - `appointmentDateText` — string
  - `isExecutiveProgram` — boolean
  - `userRate` — number
  - `ratingUsersCount` — integer
  - `isForStudent` — boolean
  - `isForIndividuals` — boolean
  - `audienceType` — string
  - `userFavoritId` — string
  - `isFavorite` — boolean
  - `trainingTypeCssClass` — string
  - `externalRegistrationURL` — string
  - `hasExternalRegistrationURL` — boolean
  - `startDate` — string
  - `trainingTypeId` — integer
  - `trainingType` — string
  - `allTrainingTypes` — string
  - `programFees` — number
  - `fees` — string
  - `planId` — string
  - `language` — string
  - `date` — datetime
  - `planFees` — number
  - `priceAfterDiscount` — number
  - `isPercentage` — boolean
  - `hasDiscount` — boolean
  - `discountMarketDescription` — string
  - `discountAmount` — number
  - `discountAmountDescription` — string
  - `isAvailable` — boolean
  - `isFree` — boolean
  - `freeMessage` — string
  - `isFullySupported` — boolean
  - `isHrdfSupported` — boolean
  - `hrdfTagText` — string
  - `hrdfLogoUrl` — string
  - `formattedPrice` — string
  - `isBundle` — boolean
  - `bundleText` — string
- `message` — string

### ProgramsOverviewDtoReturnResult — full response body

Returned by: `GET /api/v1/Program/Overview`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — ProgramsOverviewDto
  - `mainCategories` — ProgramCategoryDto[]
    - `id` — string
    - `name` — string
    - `numberOfPrograms` — integer
    - `icon` — string
    - `url` — string
  - `featuredPrograms` — ProgramDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `location` — string
    - `imageAttachmentPath` — string
    - `isPublishedForOrganizations` — boolean
    - `programTopicName` — string
    - `planNumberOfDays` — integer
    - `isNew` — boolean
    - `isEndingSoon` — boolean
    - `endingSoonText` — string
    - `examId` — string
    - `endsWithExam` — boolean
    - `endsWithExamText` — string
    - `appointmentDateText` — string
    - `isExecutiveProgram` — boolean
    - `userRate` — number
    - `ratingUsersCount` — integer
    - `isForStudent` — boolean
    - `isForIndividuals` — boolean
    - `audienceType` — string
    - `userFavoritId` — string
    - `isFavorite` — boolean
    - `trainingTypeCssClass` — string
    - `externalRegistrationURL` — string
    - `hasExternalRegistrationURL` — boolean
    - `startDate` — string
    - `trainingTypeId` — integer
    - `trainingType` — string
    - `allTrainingTypes` — string
    - `programFees` — number
    - `fees` — string
    - `planId` — string
    - `language` — string
    - `date` — datetime
    - `planFees` — number
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `isAvailable` — boolean
    - `isFree` — boolean
    - `freeMessage` — string
    - `isFullySupported` — boolean
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
    - `formattedPrice` — string
    - `isBundle` — boolean
    - `bundleText` — string
  - `programsOfTheMonth` — ProgramsOfTheMonthDto
    - `all` — ProgramDto[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `location` — string
      - `imageAttachmentPath` — string
      - `isPublishedForOrganizations` — boolean
      - `programTopicName` — string
      - `planNumberOfDays` — integer
      - `isNew` — boolean
      - `isEndingSoon` — boolean
      - `endingSoonText` — string
      - `examId` — string
      - `endsWithExam` — boolean
      - `endsWithExamText` — string
      - `appointmentDateText` — string
      - `isExecutiveProgram` — boolean
      - `userRate` — number
      - `ratingUsersCount` — integer
      - `isForStudent` — boolean
      - `isForIndividuals` — boolean
      - `audienceType` — string
      - `userFavoritId` — string
      - `isFavorite` — boolean
      - `trainingTypeCssClass` — string
      - `externalRegistrationURL` — string
      - `hasExternalRegistrationURL` — boolean
      - `startDate` — string
      - `trainingTypeId` — integer
      - `trainingType` — string
      - `allTrainingTypes` — string
      - `programFees` — number
      - `fees` — string
      - `planId` — string
      - `language` — string
      - `date` — datetime
      - `planFees` — number
      - `priceAfterDiscount` — number
      - `isPercentage` — boolean
      - `hasDiscount` — boolean
      - `discountMarketDescription` — string
      - `discountAmount` — number
      - `discountAmountDescription` — string
      - `isAvailable` — boolean
      - `isFree` — boolean
      - `freeMessage` — string
      - `isFullySupported` — boolean
      - `isHrdfSupported` — boolean
      - `hrdfTagText` — string
      - `hrdfLogoUrl` — string
      - `formattedPrice` — string
      - `isBundle` — boolean
      - `bundleText` — string
    - `individuals` — ProgramDto[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `location` — string
      - `imageAttachmentPath` — string
      - `isPublishedForOrganizations` — boolean
      - `programTopicName` — string
      - `planNumberOfDays` — integer
      - `isNew` — boolean
      - `isEndingSoon` — boolean
      - `endingSoonText` — string
      - `examId` — string
      - `endsWithExam` — boolean
      - `endsWithExamText` — string
      - `appointmentDateText` — string
      - `isExecutiveProgram` — boolean
      - `userRate` — number
      - `ratingUsersCount` — integer
      - `isForStudent` — boolean
      - `isForIndividuals` — boolean
      - `audienceType` — string
      - `userFavoritId` — string
      - `isFavorite` — boolean
      - `trainingTypeCssClass` — string
      - `externalRegistrationURL` — string
      - `hasExternalRegistrationURL` — boolean
      - `startDate` — string
      - `trainingTypeId` — integer
      - `trainingType` — string
      - `allTrainingTypes` — string
      - `programFees` — number
      - `fees` — string
      - `planId` — string
      - `language` — string
      - `date` — datetime
      - `planFees` — number
      - `priceAfterDiscount` — number
      - `isPercentage` — boolean
      - `hasDiscount` — boolean
      - `discountMarketDescription` — string
      - `discountAmount` — number
      - `discountAmountDescription` — string
      - `isAvailable` — boolean
      - `isFree` — boolean
      - `freeMessage` — string
      - `isFullySupported` — boolean
      - `isHrdfSupported` — boolean
      - `hrdfTagText` — string
      - `hrdfLogoUrl` — string
      - `formattedPrice` — string
      - `isBundle` — boolean
      - `bundleText` — string
    - `organizations` — ProgramDto[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `location` — string
      - `imageAttachmentPath` — string
      - `isPublishedForOrganizations` — boolean
      - `programTopicName` — string
      - `planNumberOfDays` — integer
      - `isNew` — boolean
      - `isEndingSoon` — boolean
      - `endingSoonText` — string
      - `examId` — string
      - `endsWithExam` — boolean
      - `endsWithExamText` — string
      - `appointmentDateText` — string
      - `isExecutiveProgram` — boolean
      - `userRate` — number
      - `ratingUsersCount` — integer
      - `isForStudent` — boolean
      - `isForIndividuals` — boolean
      - `audienceType` — string
      - `userFavoritId` — string
      - `isFavorite` — boolean
      - `trainingTypeCssClass` — string
      - `externalRegistrationURL` — string
      - `hasExternalRegistrationURL` — boolean
      - `startDate` — string
      - `trainingTypeId` — integer
      - `trainingType` — string
      - `allTrainingTypes` — string
      - `programFees` — number
      - `fees` — string
      - `planId` — string
      - `language` — string
      - `date` — datetime
      - `planFees` — number
      - `priceAfterDiscount` — number
      - `isPercentage` — boolean
      - `hasDiscount` — boolean
      - `discountMarketDescription` — string
      - `discountAmount` — number
      - `discountAmountDescription` — string
      - `isAvailable` — boolean
      - `isFree` — boolean
      - `freeMessage` — string
      - `isFullySupported` — boolean
      - `isHrdfSupported` — boolean
      - `hrdfTagText` — string
      - `hrdfLogoUrl` — string
      - `formattedPrice` — string
      - `isBundle` — boolean
      - `bundleText` — string
  - `selfLearningPrograms` — ProgramDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `location` — string
    - `imageAttachmentPath` — string
    - `isPublishedForOrganizations` — boolean
    - `programTopicName` — string
    - `planNumberOfDays` — integer
    - `isNew` — boolean
    - `isEndingSoon` — boolean
    - `endingSoonText` — string
    - `examId` — string
    - `endsWithExam` — boolean
    - `endsWithExamText` — string
    - `appointmentDateText` — string
    - `isExecutiveProgram` — boolean
    - `userRate` — number
    - `ratingUsersCount` — integer
    - `isForStudent` — boolean
    - `isForIndividuals` — boolean
    - `audienceType` — string
    - `userFavoritId` — string
    - `isFavorite` — boolean
    - `trainingTypeCssClass` — string
    - `externalRegistrationURL` — string
    - `hasExternalRegistrationURL` — boolean
    - `startDate` — string
    - `trainingTypeId` — integer
    - `trainingType` — string
    - `allTrainingTypes` — string
    - `programFees` — number
    - `fees` — string
    - `planId` — string
    - `language` — string
    - `date` — datetime
    - `planFees` — number
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `isAvailable` — boolean
    - `isFree` — boolean
    - `freeMessage` — string
    - `isFullySupported` — boolean
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
    - `formattedPrice` — string
    - `isBundle` — boolean
    - `bundleText` — string
  - `experts` — ProgramExpertDto[]
    - `id` — string
    - `fullName` — string
    - `photoPath` — string
    - `linkedInUrl` — string
    - `xUrl` — string
- `message` — string

### RescheduleExamResponseDtoApiResponse — full response body

Returned by: `POST /api/v1/Exam/exam-reschedule`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — RescheduleExamResponseDto
  - `isFree` — boolean
  - `fees` — number
  - `isPostPaid` — boolean
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### RescheduleResponseDtoReturnResult — full response body

Returned by: `POST /api/v1/Program/program-reschedule`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — RescheduleResponseDto
  - `isFree` — boolean
  - `newReservationId` — string
- `message` — string

### ReservationInfoResponseDtoApiResponse — full response body

Returned by: `GET /api/v1/DashBoard/ReservationInfo/{id}/{type}`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — ReservationInfoResponseDto
  - `reservationId` — string
  - `itemId` — string
  - `planId` — string
  - `organizationId` — string
  - `candidateName` — string
  - `nationalId` — string
  - `profileId` — string
  - `isOrganizationMember` — boolean
  - `organizationName` — string
  - `name` — string
  - `description` — string
  - `language` — string
  - `skills` — string
  - `imageUrl` — string
  - `materialUrl` — string
  - `rate` — number
  - `numberOfUserRates` — integer
  - `comments` — string
  - `price` — string
  - `reservationNo` — string
  - `startDate` — string
  - `activityDate` — datetime
  - `endDate` — string
  - `tryNo` — integer
  - `startTime` — string
  - `endTime` — string
  - `duration` — string
  - `sector` — string
  - `location` — string
  - `certificateId` — string
  - `certificateType` — string
  - `planTraningTypeId` — TrainingTypeEnum
    *(enum: 0,1,2,3)*
  - `profileOwners` — string
  - `reservationStatus` — string
  - `reservationStatusEnum` — ReservationStatus
    *(enum: 0,1,2,3,4,5,6,7,8,9,10)*
  - `reservationDate` — string
  - `reservationType` — ModuleType
    *(enum: 1,2,3)*
  - `validation` — ReservationValidation
    - `isRescheduleValid` — boolean
    - `isRescheduleExceptionValid` — boolean
    - `isCancelValid` — boolean
    - `isChangeProfileValid` — boolean
    - `canSendExcuseRequest` — boolean
    - `rescheduleFees` — number
    - `cancellationFees` — number
    - `errors` — Item[]
      - `name` — string
      - `value` — string
      - `count` — integer
    - `isCISIOwner` — boolean
  - `attendanceUrl` — string
  - `checkInQrCode` — string
  - `canSendExcuseRequest` — boolean
  - `execuseRequest` — ExecuseRequestSubmitDto
    - `id` — string
    - `examReservationId` — string
    - `excuseTypeId` — integer
    - `reasonDescription` — string
    - `submittedDate` — datetime
    - `execuseRequestStatus` — string
    - `execuseRequestStatusEnum` — ExcuseRequestStatus
      *(enum: 1,2,3)*
    - `attachmentUrl` — string
    - `attachmentFileName` — string
    - `adminDecisionReason` — string
    - `requestNumber` — string
    - `excuseType` — string
  - `examIdForProgramEndWithExam` — string
  - `examEligibilityStatus` — string
  - `isQualifiedForEndExamRegistration` — boolean
  - `isProgramCompleted` — boolean
  - `isAttendanceQualifiedForEndExam` — boolean
  - `programAttendancePercentage` — number
  - `isExamWaitingPeriodPassed` — boolean
  - `examEligibleFromDate` — datetime
  - `examWaitingPeriodDays` — integer
  - `nextExamAttemptNumber` — integer
  - `programEndDate` — datetime
  - `lastExamAttemptDate` — datetime
  - `isRegisteredInEndExam` — boolean
  - `endExamReservationId` — string
  - `numberOfExamQuestions` — integer
  - `studyMaterialLink` — string
  - `studyMaterialNote` — string
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### SearchResultsDtoReturnResult — full response body

Returned by: `GET /api/v1/Search`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — SearchResultsDto
  - `searchText` — string
  - `totalCount` — integer
  - `programsCount` — integer
  - `examsCount` — integer
  - `eventsCount` — integer
  - `programs` — ProgramDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `location` — string
    - `imageAttachmentPath` — string
    - `isPublishedForOrganizations` — boolean
    - `programTopicName` — string
    - `planNumberOfDays` — integer
    - `isNew` — boolean
    - `isEndingSoon` — boolean
    - `endingSoonText` — string
    - `examId` — string
    - `endsWithExam` — boolean
    - `endsWithExamText` — string
    - `appointmentDateText` — string
    - `isExecutiveProgram` — boolean
    - `userRate` — number
    - `ratingUsersCount` — integer
    - `isForStudent` — boolean
    - `isForIndividuals` — boolean
    - `audienceType` — string
    - `userFavoritId` — string
    - `isFavorite` — boolean
    - `trainingTypeCssClass` — string
    - `externalRegistrationURL` — string
    - `hasExternalRegistrationURL` — boolean
    - `startDate` — string
    - `trainingTypeId` — integer
    - `trainingType` — string
    - `allTrainingTypes` — string
    - `programFees` — number
    - `fees` — string
    - `planId` — string
    - `language` — string
    - `date` — datetime
    - `planFees` — number
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `isAvailable` — boolean
    - `isFree` — boolean
    - `freeMessage` — string
    - `isFullySupported` — boolean
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
    - `formattedPrice` — string
    - `isBundle` — boolean
    - `bundleText` — string
  - `exams` — ExamCardDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `marketingDescription` — string
    - `userRate` — number
    - `imageUrl` — string
    - `examFees` — string
    - `fees` — number
    - `examProfiles` — StringLookupViewModelAPI[]
      - `key` — string
      - `text` — string
      - `itemId` — string
      - `id` — integer
      - `value` — string
    - `profiles` — Profile[]
      - `id` — string
      - `examId` — string
      - `code` — string
      - `nameAr` — string
      - `nameEn` — string
      - `titleAr` — string
      - `titleEn` — string
      - `confidentialInformationText` — string
      - `guidelinesText` — string
      - `isSuccessGradeByPercentage` — boolean
      - `successGrade` — number
      - `totalScore` — number
      - `isTrainingMaterialLink` — boolean
      - `trainingMaterialLink` — string
      - `trainingMaterialAttachmentId` — string
      - `noOfQuestions` — integer
      - `noOfTrialQuestions` — integer
      - `durationInMinutes` — integer
      - `languageId` — integer
      - `isQuestionsSelectionRandom` — boolean
      - `targetAudienceId` — integer
      - `isFolderWeightByPercentage` — boolean
      - `isOrganizedByInstitute` — boolean
      - `isActive` — boolean
      - `isPublished` — boolean
      - `versionNum` — integer
      - `versioningRelatedCode` — string
      - `isLastVersion` — boolean
      - `isOriginalVersion` — boolean
      - `createdBy` — string
      - `createdOn` — datetime
      - `updatedBy` — string
      - `updatedOn` — datetime
      - `statusId` — integer
      - `integrationExamId` — string
      - `isExternalRegistration` — boolean
      - `isCollectedInDynamics` — boolean
      - `externalRegistrationUrl` — string
      - `isHoldInsideAcademy` — boolean
      - `registrationEndDate` — datetime
      - `registrationStartDate` — datetime
      - `projectId` — string
      - `exam` — Exam → *see [Exam](#exam)*
      - `targetAudience` — TargetAudienceType → *see [TargetAudienceType](#targetaudiencetype)*
      - `profileSetting` — ProfileSetting → *see [ProfileSetting](#profilesetting)*
      - `attemptConfiscationProfiles` — AttemptConfiscationProfile[] → *see [AttemptConfiscationProfile](#attemptconfiscationprofile)*
      - `attemptObjections` — AttemptObjection[] → *see [AttemptObjection](#attemptobjection)*
      - `attemptSuspensions` — AttemptSuspension[] → *see [AttemptSuspension](#attemptsuspension)*
      - `attempts` — Attempt[] → *see [Attempt](#attempt)*
      - `examReservations` — ExamReservation[] → *see [ExamReservation](#examreservation)*
      - `profileFolderQuestions` — ProfileFolderQuestion[] → *see [ProfileFolderQuestion](#profilefolderquestion)*
      - `profileFolders` — ProfileFolder[] → *see [ProfileFolder](#profilefolder)*
      - `profileOwners` — ProfileOwner[] → *see [ProfileOwner](#profileowner)*
      - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[] → *see [ProfileRestrictedTestingCenter](#profilerestrictedtestingcenter)*
      - `questionsPriorities` — QuestionsPriority[] → *see [QuestionsPriority](#questionspriority)*
      - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[] → *see [TestCenterScheduleDayPeriodSpecializationExamProfile](#testcenterscheduledayperiodspecializationexamprofile)*
      - `trialExams` — TrialExam[] → *see [TrialExam](#trialexam)*
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `userFavoritId` — string
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
  - `events` — EventCardDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `locationTypeName` — string
    - `imageAttachmentUrl` — string
    - `speakerName` — string
    - `detailsPageURL` — string
    - `startDate` — datetime
    - `endDate` — datetime
    - `startTime` — string
    - `endTime` — string
    - `eventDate` — string
    - `eventTypeName` — string
    - `eventTypeId` — string
    - `fees` — string
    - `periodStatus` — string
    - `eventLanguage` — string
    - `date` — datetime
    - `eventFees` — number
    - `isPast` — boolean
    - `isCurrent` — boolean
    - `isFuture` — boolean
    - `isExpired` — boolean
    - `numberOfUserRates` — integer
    - `userRate` — number
    - `userFavoritId` — string
    - `speakerAvatar` — string
    - `eventTime` — string
- `message` — string

### StringApiResponse — full response body

Returned by: `POST /api/v1/Users/Photo`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — string
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

### TestCenterViewModelReturnResult — full response body

Returned by: `GET /api/v1/Exam/GetExamTestCenters`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — TestCenterViewModel
  - `testCenterId` — string
  - `name` — string
- `message` — string

### TopMenuDtoReturnResult — full response body

Returned by: `GET /api/v1/Home/TopMenu`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — TopMenuDto
  - `programMenu` — ProgramMenuDto
    - `statistics` — ProgramSectorMenuItemViewModel[]
      - `sectorId` — string
      - `sectorName` — string
      - `icon` — string
      - `count` — integer
    - `programs` — ProgramMenuItemViewModel[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `isNew` — boolean
    - `excutivePrograms` — ProgramMenuItemViewModel[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `isNew` — boolean
    - `digitalPrograms` — ProgramMenuItemViewModel[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `isNew` — boolean
  - `financialSectorProgramMenu` — FinancialSectorProgramMenuDto
    - `programs` — ProgramMenuItemViewModel[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `isNew` — boolean
    - `upcomingEvents` — EventMenuItemViewModel[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `startDate` — datetime
      - `startTime` — string
      - `endTime` — string
    - `digitalPrograms` — ProgramMenuItemViewModel[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `isNew` — boolean
  - `examMenu` — ExamMenuDto
    - `statistics` — ExamSectorMenuItemViewModel[]
      - `sectorId` — string
      - `sectorName` — string
      - `sectorCode` — string
      - `icon` — string
      - `count` — integer
    - `exams` — ExamMenuItemViewModel[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `languagee` — string
  - `eventMenu` — EventMenuDto
    - `statistics` — EventTypeMenuItemViewModel[]
      - `typeId` — string
      - `typeName` — string
      - `icon` — string
      - `count` — integer
    - `upcomingEvents` — EventMenuItemViewModel[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `startDate` — datetime
      - `startTime` — string
      - `endTime` — string
    - `currentMonthEvents` — EventMenuItemViewModel[]
      - `id` — string
      - `name` — string
      - `description` — string
      - `startDate` — datetime
      - `startTime` — string
      - `endTime` — string
  - `reportAndStudy` — ReportAndStudyMenuDto
    - `reportAndStudyViewModels` — ReportAndStudyDto[]
      - `id` — string
      - `title` — string
      - `details` — string
      - `image` — string
      - `linkAr` — string
      - `linkEn` — string
      - `reportDate` — datetime
      - `detailsPageURL` — string
  - `initiativeMenu` — InitiativeMenuSectionDto
    - `activeMenu` — InitiativeMenuItemViewModel[]
      - `title` — string
      - `description` — string
      - `image` — string
      - `url` — string
      - `order` — integer
    - `openingSoonMenu` — InitiativeMenuItemViewModel[]
      - `title` — string
      - `description` — string
      - `image` — string
      - `url` — string
      - `order` — integer
- `message` — string

### TrainingTopicsPageDtoReturnResult — full response body

Returned by: `GET /api/v1/Program/TrainingTopics`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — TrainingTopicsPageDto
  - `module` — string
  - `pageTitle` — string
  - `allPrograms` — PageNavigationDto
    - `text` — string
    - `url` — string
    - `absoluteUrl` — string
  - `topics` — TrainingTopicDto[]
    - `id` — string
    - `name` — string
    - `nameAr` — string
    - `nameEn` — string
    - `description` — string
    - `descriptionAr` — string
    - `descriptionEn` — string
    - `imageAttachmentId` — string
    - `imageUrl` — string
    - `imageFallbackUrl` — string
    - `programsCount` — integer
    - `programs` — TrainingTopicProgramDto[]
      - `id` — string
      - `title` — string
      - `url` — string
      - `absoluteUrl` — string
    - `viewAll` — PageNavigationDto
      - `text` — string
      - `url` — string
      - `absoluteUrl` — string
  - `totalItems` — integer
  - `pageSize` — integer
  - `pageNumber` — integer
- `message` — string

### TrendingHomeDtoReturnResult — full response body

Returned by: `GET /api/v1/Home/Trending`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — TrendingHomeDto
  - `programs` — ProgramDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `location` — string
    - `imageAttachmentPath` — string
    - `isPublishedForOrganizations` — boolean
    - `programTopicName` — string
    - `planNumberOfDays` — integer
    - `isNew` — boolean
    - `isEndingSoon` — boolean
    - `endingSoonText` — string
    - `examId` — string
    - `endsWithExam` — boolean
    - `endsWithExamText` — string
    - `appointmentDateText` — string
    - `isExecutiveProgram` — boolean
    - `userRate` — number
    - `ratingUsersCount` — integer
    - `isForStudent` — boolean
    - `isForIndividuals` — boolean
    - `audienceType` — string
    - `userFavoritId` — string
    - `isFavorite` — boolean
    - `trainingTypeCssClass` — string
    - `externalRegistrationURL` — string
    - `hasExternalRegistrationURL` — boolean
    - `startDate` — string
    - `trainingTypeId` — integer
    - `trainingType` — string
    - `allTrainingTypes` — string
    - `programFees` — number
    - `fees` — string
    - `planId` — string
    - `language` — string
    - `date` — datetime
    - `planFees` — number
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `isAvailable` — boolean
    - `isFree` — boolean
    - `freeMessage` — string
    - `isFullySupported` — boolean
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
    - `formattedPrice` — string
    - `isBundle` — boolean
    - `bundleText` — string
  - `exams` — ExamCardDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `marketingDescription` — string
    - `userRate` — number
    - `imageUrl` — string
    - `examFees` — string
    - `fees` — number
    - `examProfiles` — StringLookupViewModelAPI[]
      - `key` — string
      - `text` — string
      - `itemId` — string
      - `id` — integer
      - `value` — string
    - `profiles` — Profile[]
      - `id` — string
      - `examId` — string
      - `code` — string
      - `nameAr` — string
      - `nameEn` — string
      - `titleAr` — string
      - `titleEn` — string
      - `confidentialInformationText` — string
      - `guidelinesText` — string
      - `isSuccessGradeByPercentage` — boolean
      - `successGrade` — number
      - `totalScore` — number
      - `isTrainingMaterialLink` — boolean
      - `trainingMaterialLink` — string
      - `trainingMaterialAttachmentId` — string
      - `noOfQuestions` — integer
      - `noOfTrialQuestions` — integer
      - `durationInMinutes` — integer
      - `languageId` — integer
      - `isQuestionsSelectionRandom` — boolean
      - `targetAudienceId` — integer
      - `isFolderWeightByPercentage` — boolean
      - `isOrganizedByInstitute` — boolean
      - `isActive` — boolean
      - `isPublished` — boolean
      - `versionNum` — integer
      - `versioningRelatedCode` — string
      - `isLastVersion` — boolean
      - `isOriginalVersion` — boolean
      - `createdBy` — string
      - `createdOn` — datetime
      - `updatedBy` — string
      - `updatedOn` — datetime
      - `statusId` — integer
      - `integrationExamId` — string
      - `isExternalRegistration` — boolean
      - `isCollectedInDynamics` — boolean
      - `externalRegistrationUrl` — string
      - `isHoldInsideAcademy` — boolean
      - `registrationEndDate` — datetime
      - `registrationStartDate` — datetime
      - `projectId` — string
      - `exam` — Exam → *see [Exam](#exam)*
      - `targetAudience` — TargetAudienceType → *see [TargetAudienceType](#targetaudiencetype)*
      - `profileSetting` — ProfileSetting → *see [ProfileSetting](#profilesetting)*
      - `attemptConfiscationProfiles` — AttemptConfiscationProfile[] → *see [AttemptConfiscationProfile](#attemptconfiscationprofile)*
      - `attemptObjections` — AttemptObjection[] → *see [AttemptObjection](#attemptobjection)*
      - `attemptSuspensions` — AttemptSuspension[] → *see [AttemptSuspension](#attemptsuspension)*
      - `attempts` — Attempt[] → *see [Attempt](#attempt)*
      - `examReservations` — ExamReservation[] → *see [ExamReservation](#examreservation)*
      - `profileFolderQuestions` — ProfileFolderQuestion[] → *see [ProfileFolderQuestion](#profilefolderquestion)*
      - `profileFolders` — ProfileFolder[] → *see [ProfileFolder](#profilefolder)*
      - `profileOwners` — ProfileOwner[] → *see [ProfileOwner](#profileowner)*
      - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[] → *see [ProfileRestrictedTestingCenter](#profilerestrictedtestingcenter)*
      - `questionsPriorities` — QuestionsPriority[] → *see [QuestionsPriority](#questionspriority)*
      - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[] → *see [TestCenterScheduleDayPeriodSpecializationExamProfile](#testcenterscheduledayperiodspecializationexamprofile)*
      - `trialExams` — TrialExam[] → *see [TrialExam](#trialexam)*
    - `priceAfterDiscount` — number
    - `isPercentage` — boolean
    - `hasDiscount` — boolean
    - `discountMarketDescription` — string
    - `discountAmount` — number
    - `discountAmountDescription` — string
    - `userFavoritId` — string
    - `isHrdfSupported` — boolean
    - `hrdfTagText` — string
    - `hrdfLogoUrl` — string
  - `events` — EventCardDto[]
    - `id` — string
    - `name` — string
    - `description` — string
    - `locationTypeName` — string
    - `imageAttachmentUrl` — string
    - `speakerName` — string
    - `detailsPageURL` — string
    - `startDate` — datetime
    - `endDate` — datetime
    - `startTime` — string
    - `endTime` — string
    - `eventDate` — string
    - `eventTypeName` — string
    - `eventTypeId` — string
    - `fees` — string
    - `periodStatus` — string
    - `eventLanguage` — string
    - `date` — datetime
    - `eventFees` — number
    - `isPast` — boolean
    - `isCurrent` — boolean
    - `isFuture` — boolean
    - `isExpired` — boolean
    - `numberOfUserRates` — integer
    - `userRate` — number
    - `userFavoritId` — string
    - `speakerAvatar` — string
    - `eventTime` — string
  - `siteContents` — SiteContentDto[]
    - `id` — integer
    - `photo` — string
    - `title` — string
    - `titleAr` — string
    - `titleEn` — string
    - `subTitle` — string
    - `subTitleAr` — string
    - `subTitleEn` — string
    - `job` — string
    - `jobAr` — string
    - `jobEn` — string
    - `content` — string
    - `contentAr` — string
    - `contentEn` — string
    - `linkUrl` — string
    - `contentType` — SiteContentType
      *(enum: 1,2,3,4,5,6,7,8,9,10,11,12,13,14)*
    - `isPublish` — boolean
    - `itemId` — string
    - `sortOrder` — integer
  - `initiativeMenu` — InitiativeMenuItemViewModel[]
    - `title` — string
    - `description` — string
    - `image` — string
    - `url` — string
    - `order` — integer
  - `reportAndStudy` — ReportAndStudyDto[]
    - `id` — string
    - `title` — string
    - `details` — string
    - `image` — string
    - `linkAr` — string
    - `linkEn` — string
    - `reportDate` — datetime
    - `detailsPageURL` — string
  - `notificationCount` — integer
- `message` — string

### UserBillsListDtoListReturnResult — full response body

Returned by: `GET /api/v1/Payment/Bills`, `POST /api/v1/Payment/Search/Bills`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — UserBillsListDto[]
  - `id` — string
  - `parentId` — string
  - `amount` — number
  - `vat` — number
  - `discount` — number
  - `totalAmount` — number
  - `currencyName` — string
  - `billNumber` — string
  - `isRefunded` — boolean
  - `isPostPoned` — boolean
  - `isReplaced` — boolean
  - `billDate` — datetime
  - `billDetails` — UserBillDetailsDto[]
    - `id` — string
    - `amount` — number
    - `vat` — number
    - `discount` — number
    - `totalAmount` — number
    - `descriptionAr` — string
    - `descriptionEn` — string
    - `name` — string
    - `allowRefund` — boolean
    - `refundTransaction` — UserBillDetailsViewModel[]
      - `id` — string
      - `amount` — number
      - `vat` — number
      - `discount` — number
      - `totalAmount` — number
      - `descritionAr` — string
      - `descritionEn` — string
      - `allowRefund` — boolean
      - `refundTransaction` — UserBillDetailsViewModel[] → *see [UserBillDetailsViewModel](#userbilldetailsviewmodel)*
      - `postPoneTransaction` — UserBillDetailsViewModel[] → *see [UserBillDetailsViewModel](#userbilldetailsviewmodel)*
      - `replcaeTransaction` — UserBillDetailsViewModel[] → *see [UserBillDetailsViewModel](#userbilldetailsviewmodel)*
      - `transactionTypeId` — integer
      - `paymentModuleId` — integer
      - `userFullName` — string
      - `approved` — boolean
      - `approvalText` — string
      - `requestStatus` — string
      - `transactionDetailId` — string
      - `fullInvoicePdfPath` — string
      - `voucherNumber` — string
      - `transactionType` — TransactionTypes → *see [TransactionTypes](#transactiontypes)*
      - `transactionTypeData` — StringStringTuple → *see [StringStringTuple](#stringstringtuple)*
      - `paymentModule` — PaymentModules → *see [PaymentModules](#paymentmodules)*
      - `paymentModuleName` — string
    - `postPoneTransaction` — UserBillDetailsViewModel[]
      - `id` — string
      - `amount` — number
      - `vat` — number
      - `discount` — number
      - `totalAmount` — number
      - `descritionAr` — string
      - `descritionEn` — string
      - `allowRefund` — boolean
      - `refundTransaction` — UserBillDetailsViewModel[] → *see [UserBillDetailsViewModel](#userbilldetailsviewmodel)*
      - `postPoneTransaction` — UserBillDetailsViewModel[] → *see [UserBillDetailsViewModel](#userbilldetailsviewmodel)*
      - `replcaeTransaction` — UserBillDetailsViewModel[] → *see [UserBillDetailsViewModel](#userbilldetailsviewmodel)*
      - `transactionTypeId` — integer
      - `paymentModuleId` — integer
      - `userFullName` — string
      - `approved` — boolean
      - `approvalText` — string
      - `requestStatus` — string
      - `transactionDetailId` — string
      - `fullInvoicePdfPath` — string
      - `voucherNumber` — string
      - `transactionType` — TransactionTypes → *see [TransactionTypes](#transactiontypes)*
      - `transactionTypeData` — StringStringTuple → *see [StringStringTuple](#stringstringtuple)*
      - `paymentModule` — PaymentModules → *see [PaymentModules](#paymentmodules)*
      - `paymentModuleName` — string
    - `replaceTransaction` — UserBillDetailsViewModel[]
      - `id` — string
      - `amount` — number
      - `vat` — number
      - `discount` — number
      - `totalAmount` — number
      - `descritionAr` — string
      - `descritionEn` — string
      - `allowRefund` — boolean
      - `refundTransaction` — UserBillDetailsViewModel[] → *see [UserBillDetailsViewModel](#userbilldetailsviewmodel)*
      - `postPoneTransaction` — UserBillDetailsViewModel[] → *see [UserBillDetailsViewModel](#userbilldetailsviewmodel)*
      - `replcaeTransaction` — UserBillDetailsViewModel[] → *see [UserBillDetailsViewModel](#userbilldetailsviewmodel)*
      - `transactionTypeId` — integer
      - `paymentModuleId` — integer
      - `userFullName` — string
      - `approved` — boolean
      - `approvalText` — string
      - `requestStatus` — string
      - `transactionDetailId` — string
      - `fullInvoicePdfPath` — string
      - `voucherNumber` — string
      - `transactionType` — TransactionTypes → *see [TransactionTypes](#transactiontypes)*
      - `transactionTypeData` — StringStringTuple → *see [StringStringTuple](#stringstringtuple)*
      - `paymentModule` — PaymentModules → *see [PaymentModules](#paymentmodules)*
      - `paymentModuleName` — string
    - `transactionTypeId` — integer
    - `paymentModuleId` — integer
    - `fullInvoicePdfPath` — string
    - `userFullName` — string
    - `approved` — boolean
    - `approvalText` — string
    - `requestStatus` — string
    - `transactionType` — TransactionTypes
      *(enum: 1,2,3,4)*
    - `transactionTypeData` — StringStringTuple
      - `item1` — string
      - `item2` — string
    - `paymentModule` — PaymentModules
      *(enum: 1,2,3,4,7,8,9,10)*
    - `paymentModuleName` — string
  - `transactionStatus` — string
  - `transactionStatusId` — integer
  - `allowConfirmPay` — boolean
  - `approved` — boolean
  - `paymentTypeId` — integer
  - `succeeded` — boolean
  - `createdOn` — datetime
  - `iBan` — string
  - `bankBranch` — string
  - `ownerId` — string
  - `taxBillNumber` — integer
- `message` — string

### UserCertificateApiModelApiResponse — full response body

Returned by: `GET /api/v1/Exam/ValidateCertificate`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — UserCertificateApiModel
  - `fullUserName` — string
  - `issueNumber` — string
  - `expirationTimeInYears` — integer
  - `issueDate` — datetime
  - `titleAr` — string
  - `titleEn` — string
  - `certificateTypeId` — integer
  - `certificateTypeName` — string
  - `prerequisiteCertificateExams` — LookupModel[]
    - `name` — string
    - `description` — string
    - `value` — object
    - `extra` — object
  - `prerequisiteCertificateTrainingCourses` — LookupModel[]
    - `name` — string
    - `description` — string
    - `value` — object
    - `extra` — object
  - `prerequisiteCertificateEvents` — LookupModel[]
    - `name` — string
    - `description` — string
    - `value` — object
    - `extra` — object
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

---

## 6. Schema dictionary

All 226 object schemas and 12 enums reachable from a declared response, alphabetically, one level deep. Field types that name another schema link to its entry.

#### ApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | `object` |  |

#### ApplicationProcessDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `steps` | [ApplicationProcessStepDto[]](#applicationprocessstepdto) |  |

#### ApplicationProcessStepDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `stepOrder` | `integer` |  |
| `description` | `string` |  |

#### Attachment

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `fileName` | `string` |  |
| `extention` | `string` |  |
| `filePath` | `string` |  |
| `contentType` | `string` |  |
| `titleAr` | `string` |  |
| `titleEn` | `string` |  |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `attachmentTypeId` | `integer` |  |
| `thumbnail` | `string` |  |
| `createdOn` | `datetime` |  |
| `createdBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `attachmentType` | [AttachmentType](#attachmenttype) |  |
| `attachmentContent` | [AttachmentContent](#attachmentcontent) |  |
| `attemptObjectionAttachments` | [AttemptObjectionAttachment[]](#attemptobjectionattachment) |  |
| `attemptSuspensionAttachments` | [AttemptSuspensionAttachment[]](#attemptsuspensionattachment) |  |
| `attemptSuspensions` | [AttemptSuspension[]](#attemptsuspension) |  |

#### AttachmentContent

| Field | Type | Required |
|---|---|---|
| `attachmentId` | `string` |  |
| `content` | `string` |  |
| `attachment` | [Attachment](#attachment) |  |

#### AttachmentType

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `code` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `allowedFilesExtension` | `string` |  |
| `isImage` | `boolean` |  |
| `imageMaxHeight` | `integer` |  |
| `imageMaxWidth` | `integer` |  |
| `maxSizeInMegabytes` | `integer` |  |
| `isMandatory` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `attachments` | [Attachment[]](#attachment) |  |

#### Attempt

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examReservationId` | `string` |  |
| `attemptNumber` | `integer` |  |
| `date` | `datetime` |  |
| `examLoginUserName` | `string` |  |
| `examLoginPassword` | `string` |  |
| `isAbsent` | `boolean` |  |
| `profileId` | `string` |  |
| `examTakerId` | `string` |  |
| `examResultStatusId` | `integer` |  |
| `isCanceled` | `boolean` |  |
| `cancelDate` | `datetime` |  |
| `cancelBillNumber` | `string` |  |
| `isRescheduled` | `boolean` |  |
| `rescheduleNumber` | `integer` |  |
| `rescheduleBillNumber` | `boolean` |  |
| `isRetry` | `boolean` |  |
| `isSuspended` | `boolean` |  |
| `isClosed` | `boolean` |  |
| `totalScore` | `number` |  |
| `totalMCQScore` | `number` |  |
| `totalScoreBeforeObjectionModification` | `number` |  |
| `isPassed` | `boolean` |  |
| `isPassedAfterObjection` | `boolean` |  |
| `isCertificateIssued` | `boolean` |  |
| `actualFromTime` | `string` |  |
| `actualToTime` | `string` |  |
| `hasObjectionRequest` | `boolean` |  |
| `commentOnExam` | `string` |  |
| `certificateId` | `string` |  |
| `eligibilityIDPortal` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `execuseRequestComments` | `string` |  |
| `isGradeSentToLMS` | `boolean` |  |
| `isNewDateSyncedWithDynamic` | `boolean` |  |
| `examReservation` | [ExamReservation](#examreservation) |  |
| `examResultStatus` | [ExamResultStatus](#examresultstatus) |  |
| `examTaker` | [ExamTaker](#examtaker) |  |
| `profile` | [Profile](#profile) |  |
| `attemptConfiscations` | [AttemptConfiscation[]](#attemptconfiscation) |  |
| `attemptFolderScores` | [AttemptFolderScore[]](#attemptfolderscore) |  |
| `attemptObjections` | [AttemptObjection[]](#attemptobjection) |  |
| `attemptQuestions` | [AttemptQuestion[]](#attemptquestion) |  |
| `attemptSuspensions` | [AttemptSuspension[]](#attemptsuspension) |  |

#### AttemptConfiscation

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examTakerId` | `string` |  |
| `attempId` | `string` |  |
| `startDate` | `datetime` |  |
| `endDate` | `datetime` |  |
| `reason` | `string` |  |
| `isStopped` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `attemp` | [Attempt](#attempt) |  |
| `examTaker` | [ExamTaker](#examtaker) |  |
| `attemptConfiscationProfiles` | [AttemptConfiscationProfile[]](#attemptconfiscationprofile) |  |

#### AttemptConfiscationProfile

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examTakerAttemptConfiscationId` | `string` |  |
| `profileId` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `examTakerAttemptConfiscation` | [AttemptConfiscation](#attemptconfiscation) |  |
| `profile` | [Profile](#profile) |  |

#### AttemptFolderScore

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `attemptId` | `string` |  |
| `folderId` | `string` |  |
| `score` | `number` |  |
| `isScoreModifiedByObjection` | `boolean` |  |
| `modifiedScore` | `number` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `attempt` | [Attempt](#attempt) |  |
| `folder` | [Folder](#folder) |  |

#### AttemptObjection

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `objectionNumber` | `string` |  |
| `attempId` | `string` |  |
| `examTakerId` | `string` |  |
| `profileId` | `string` |  |
| `objectionReasonId` | `integer` |  |
| `otherObjectonReason` | `string` |  |
| `objectionText` | `string` |  |
| `isFeesPaid` | `boolean` |  |
| `examReviewerUserId` | `string` |  |
| `isObjectionValid` | `boolean` |  |
| `isClosed` | `boolean` |  |
| `isQuestionNeedModify` | `boolean` |  |
| `isExaminerScoreNeedModify` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `objectionStatusId` | `integer` |  |
| `attemp` | [Attempt](#attempt) |  |
| `examTaker` | [ExamTaker](#examtaker) |  |
| `objectionReason` | [ObjectionReason](#objectionreason) |  |
| `profile` | [Profile](#profile) |  |
| `attemptObjectionAttachments` | [AttemptObjectionAttachment[]](#attemptobjectionattachment) |  |

#### AttemptObjectionAttachment

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `attachmentId` | `string` |  |
| `objectionId` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `attachment` | [Attachment](#attachment) |  |
| `objection` | [AttemptObjection](#attemptobjection) |  |

#### AttemptQuestion

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `attemptId` | `string` |  |
| `examTakerId` | `string` |  |
| `questionId` | `string` |  |
| `questionTypeId` | `integer` |  |
| `folderId` | `string` |  |
| `isPinned` | `boolean` |  |
| `comment` | `string` |  |
| `answer` | `string` |  |
| `questionScore` | `number` |  |
| `score` | `number` |  |
| `isScoreModifiedByObjection` | `boolean` |  |
| `modifiedScore` | `number` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `correctorUserId` | `string` |  |
| `reviewerUserId` | `string` |  |
| `correctorComment` | `string` |  |
| `reviewerComment` | `string` |  |
| `correctorScore` | `number` |  |
| `attempt` | [Attempt](#attempt) |  |
| `examTaker` | [ExamTaker](#examtaker) |  |
| `folder` | [Folder](#folder) |  |
| `question` | [Question](#question) |  |
| `questionType` | [QuestionType](#questiontype) |  |

#### AttemptSuspension

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `attemptId` | `string` |  |
| `examTakerId` | `string` |  |
| `testingCenterId` | `string` |  |
| `profileId` | `string` |  |
| `suspensionReasonId` | `integer` |  |
| `otherSuspensionReason` | `string` |  |
| `suspensionText` | `string` |  |
| `suspendedBy` | `string` |  |
| `suspendedOn` | `datetime` |  |
| `suspensionCommitteeDecisionId` | `integer` |  |
| `minutesOfCommitteeAttachmentId` | `string` |  |
| `isClosed` | `boolean` |  |
| `isStopped` | `boolean` |  |
| `suspensionStatusId` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `attempt` | [Attempt](#attempt) |  |
| `examTaker` | [ExamTaker](#examtaker) |  |
| `minutesOfCommitteeAttachment` | [Attachment](#attachment) |  |
| `profile` | [Profile](#profile) |  |
| `suspensionCommitteeDecision` | [SuspensionCommitteeDecision](#suspensioncommitteedecision) |  |
| `suspensionReason` | [SuspensionReason](#suspensionreason) |  |
| `attemptSuspensionAttachments` | [AttemptSuspensionAttachment[]](#attemptsuspensionattachment) |  |

#### AttemptSuspensionAttachment

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `attachmentId` | `string` |  |
| `suspensionId` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `attachment` | [Attachment](#attachment) |  |
| `suspension` | [AttemptSuspension](#attemptsuspension) |  |

#### BooleanApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | `boolean` |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### BooleanReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | `boolean` |  |
| `message` | `string` |  |

#### CalendarUnifiedItemDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `startDate` | `string` |  |
| `endDate` | `string` |  |
| `startTime` | `string` |  |
| `endTime` | `string` |  |
| `itemType` | `string` |  |

#### CalendarUnifiedItemDtoListReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [CalendarUnifiedItemDto[]](#calendarunifieditemdto) |  |
| `message` | `string` |  |

#### CalendarUnifiedItemDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [CalendarUnifiedItemDto](#calendarunifieditemdto) |  |
| `message` | `string` |  |

#### CartDetailMetaData

| Field | Type | Required |
|---|---|---|
| `language` | `integer` |  |
| `location` | `string` |  |
| `itemDate` | `string` |  |
| `itemTime` | `string` |  |
| `duration` | `string` |  |
| `imageAttachmentId` | `string` |  |
| `imageUrl` | `string` |  |
| `programId` | `string` |  |
| `thumbnailImageId` | `string` |  |
| `isExecutive` | `boolean` |  |
| `isSelfLearning` | `boolean` |  |

#### CartDetailsViewModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `requestId` | `string` |  |
| `centerId` | `string` |  |
| `amount` | `number` |  |
| `totalAmount` | `number` |  |
| `vat` | `number` |  |
| `discount` | `number` |  |
| `userName` | `string` |  |
| `descrition` | `string` |  |
| `descritionAr` | `string` |  |
| `descritionEn` | `string` |  |
| `isPricesChanged` | `boolean` |  |
| `transactionTypeId` | `integer` |  |
| `paymentModuleId` | `integer` |  |
| `moduleName` | `string` |  |
| `userFullName` | `string` |  |
| `userId` | `string` |  |
| `description` | `string` |  |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `refId` | `string` |  |
| `periodId` | `string` |  |
| `penaltyDiscountTypeId` | `integer` |  |
| `couponId` | `string` |  |
| `couponCode` | `string` |  |
| `autoApply` | `boolean` |  |
| `bundleId` | `string` |  |
| `parentCartDetailsId` | `string` |  |
| `enableDelete` | `boolean` |  |
| `startDate` | `datetime` |  |
| `cartDetailMetaData` | [CartDetailMetaData](#cartdetailmetadata) |  |
| `voucherNumber` | `string` |  |
| `quantity` | `integer` |  |

#### CartPaymentViewModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `amount` | `number` |  |
| `totalAmount` | `number` |  |
| `vat` | `number` |  |
| `discount` | `number` |  |
| `shoppingCartList` | [CartDetailsViewModel[]](#cartdetailsviewmodel) |  |
| `refUrl` | `string` |  |
| `billNumber` | `string` |  |
| `invoiceId` | `string` |  |
| `url` | `string` |  |
| `callbackUrl` | `string` |  |
| `isPricesChanged` | `boolean` |  |
| `couponCode` | `string` |  |
| `allowCouponDiscount` | `boolean` |  |
| `isValidCoupon` | `boolean` |  |
| `viewPaymentSummary` | `boolean` |  |
| `isAlreadyPaid` | `boolean` |  |
| `isUsedZatkaLayout` | `boolean` |  |
| `refCode` | `string` |  |
| `issueDate` | `datetime` |  |
| `organizationCart` | `object` |  |
| `walletCartInfo` | [WalletCartInfo](#walletcartinfo) |  |
| `hasIndividualRegistration` | `boolean` |  |
| `cartItems` | [MoEngagePurchaseItemDto[]](#moengagepurchaseitemdto) |  |
| `numberOfItems` | `integer` |  |
| `currentUserId` | `string` |  |
| `allowedTaxInvoices` | `boolean` |  |

#### CartPaymentViewModelReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [CartPaymentViewModel](#cartpaymentviewmodel) |  |
| `message` | `string` |  |

#### CertificateCategoryDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `numberOfExams` | `integer` |  |
| `icon` | `string` |  |
| `url` | `string` |  |

#### CertificateCategoryDtoOverviewSectionDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `subtitle` | `string` |  |
| `items` | [CertificateCategoryDto[]](#certificatecategorydto) |  |

#### CertificatePolicyDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `url` | `string` |  |
| `displayOrder` | `integer` |  |
| `icon` | `string` |  |

#### CertificatePolicyDtoOverviewSectionDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `subtitle` | `string` |  |
| `items` | [CertificatePolicyDto[]](#certificatepolicydto) |  |

#### CertificatesOverviewDto

| Field | Type | Required |
|---|---|---|
| `mostRequestedCertificates` | [ExamCardDtoOverviewSectionDto](#examcarddtooverviewsectiondto) |  |
| `newCertificates` | [ExamCardDtoOverviewSectionDto](#examcarddtooverviewsectiondto) |  |
| `mainCategories` | [CertificateCategoryDtoOverviewSectionDto](#certificatecategorydtooverviewsectiondto) |  |
| `policies` | [CertificatePolicyDtoOverviewSectionDto](#certificatepolicydtooverviewsectiondto) |  |
| `exploreCertificates` | [ExploreCertificatesDto](#explorecertificatesdto) |  |

#### CertificatesOverviewDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [CertificatesOverviewDto](#certificatesoverviewdto) |  |
| `message` | `string` |  |

#### CfaCertificateDto

| Field | Type | Required |
|---|---|---|
| `name` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `imageUrl` | `string` |  |
| `certificateIconUrl` | `string` |  |
| `language` | `string` |  |
| `learningType` | `string` |  |
| `isNew` | `boolean` |  |
| `status` | `string` |  |
| `price` | `string` |  |
| `duration` | `string` |  |
| `registrationText` | `string` |  |
| `registrationUrl` | `string` |  |

#### CfaCertificatesSectionDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `viewAllText` | `string` |  |
| `viewAllUrl` | `string` |  |
| `items` | [CfaCertificateDto[]](#cfacertificatedto) |  |

#### CfaCertificatesSectionDtoApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [CfaCertificatesSectionDto](#cfacertificatessectiondto) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### CheckItem

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `alternativeId` | `string` |  |
| `info` | `string` |  |
| `infoMinValue` | `integer` |  |
| `infoMaxValue` | `integer` |  |
| `name` | `string` |  |
| `type` | [CheckListItemType](#checklistitemtype) |  |
| `subItems` | [CheckItem[]](#checkitem) |  |
| `isSaved` | `boolean` |  |
| `supportedOperations` | [CheckListTreeOperations](#checklisttreeoperations) |  |
| `isCheckBox` | `boolean` |  |
| `makeItemLinkable` | `boolean` |  |
| `linkUrl` | `string` |  |
| `makeRadioButtonGroupingOnAllLevels` | `boolean` |  |
| `hasSelectionControl` | `boolean` |  |
| `columns` | [CheckListColumn[]](#checklistcolumn) |  |

#### CheckListColumn

| Field | Type | Required |
|---|---|---|
| `columnName` | `string` |  |
| `columnType` | [CheckListColumnType](#checklistcolumntype) |  |
| `columnValue` | `object` |  |

#### CheckListColumnType

Enum — values `0,1,2,3,4`

#### CheckListData

| Field | Type | Required |
|---|---|---|
| `dataSource` | [CheckItem[]](#checkitem) |  |
| `selectedItems` | `string[]` |  |
| `isReadOnly` | `boolean` |  |

#### CheckListItemType

Enum — values `0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16`

#### CheckListTreeOperations

| Field | Type | Required |
|---|---|---|
| `canPinQuestions` | `boolean` |  |
| `canSetRanges` | `boolean` |  |
| `canDelete` | `boolean` |  |

#### CheckoutResponseApiDto

| Field | Type | Required |
|---|---|---|
| `isalreadyPaid` | `boolean` |  |
| `isFreePayment` | `boolean` |  |
| `checkoutUrl` | `string` |  |
| `paymentType` | [PaymentGatewayType](#paymentgatewaytype) |  |
| `expriyDate` | `string` |  |
| `billNumber` | `string` |  |

#### CheckoutResponseApiDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [CheckoutResponseApiDto](#checkoutresponseapidto) |  |
| `message` | `string` |  |

#### CompetencyDetailsDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `code` | `string` |  |
| `name` | `string` |  |
| `typeId` | `integer` |  |
| `typeName` | `string` |  |
| `description` | `string` |  |
| `levels` | [CompetencyDetailsLevelDto[]](#competencydetailsleveldto) |  |

#### CompetencyDetailsDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [CompetencyDetailsDto](#competencydetailsdto) |  |
| `message` | `string` |  |

#### CompetencyDetailsLevelDto

| Field | Type | Required |
|---|---|---|
| `level` | `integer` |  |
| `title` | `string` |  |
| `elements` | [CompetencyDetailsLevelElementDto[]](#competencydetailslevelelementdto) |  |

#### CompetencyDetailsLevelElementDto

| Field | Type | Required |
|---|---|---|
| `description` | `string` |  |

#### CompetencyLevelDetailsDto

| Field | Type | Required |
|---|---|---|
| `programs` | [ProgramDto[]](#programdto) |  |
| `certificates` | [ExamCardDto[]](#examcarddto) |  |

#### CompetencyLevelDetailsDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [CompetencyLevelDetailsDto](#competencyleveldetailsdto) |  |
| `message` | `string` |  |

#### CountryRegistrationLookupDto

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `nationalityAr` | `string` |  |
| `nationalityEn` | `string` |  |
| `countryCode` | `string` |  |
| `nafathMappingCode` | `integer` |  |
| `isRestricted` | `boolean` |  |

#### CouponResponseDto

| Field | Type | Required |
|---|---|---|
| `amount` | `number` |  |
| `totalAmount` | `number` |  |
| `vat` | `number` |  |
| `discount` | `number` |  |

#### CouponResponseDtoApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [CouponResponseDto](#couponresponsedto) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### EventCardDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `locationTypeName` | `string` |  |
| `imageAttachmentUrl` | `string` |  |
| `speakerName` | `string` |  |
| `detailsPageURL` | `string` |  |
| `startDate` | `datetime` |  |
| `endDate` | `datetime` |  |
| `startTime` | `string` |  |
| `endTime` | `string` |  |
| `eventDate` | `string` |  |
| `eventTypeName` | `string` |  |
| `eventTypeId` | `string` |  |
| `fees` | `string` |  |
| `periodStatus` | `string` |  |
| `eventLanguage` | `string` |  |
| `date` | `datetime` |  |
| `eventFees` | `number` |  |
| `isPast` | `boolean` |  |
| `isCurrent` | `boolean` |  |
| `isFuture` | `boolean` |  |
| `isExpired` | `boolean` |  |
| `numberOfUserRates` | `integer` |  |
| `userRate` | `number` |  |
| `userFavoritId` | `string` |  |
| `speakerAvatar` | `string` |  |
| `eventTime` | `string` |  |

#### EventMenuDto

| Field | Type | Required |
|---|---|---|
| `statistics` | [EventTypeMenuItemViewModel[]](#eventtypemenuitemviewmodel) |  |
| `upcomingEvents` | [EventMenuItemViewModel[]](#eventmenuitemviewmodel) |  |
| `currentMonthEvents` | [EventMenuItemViewModel[]](#eventmenuitemviewmodel) |  |

#### EventMenuItemViewModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `startDate` | `datetime` |  |
| `startTime` | `string` |  |
| `endTime` | `string` |  |

#### EventTypeMenuItemViewModel

| Field | Type | Required |
|---|---|---|
| `typeId` | `string` |  |
| `typeName` | `string` |  |
| `icon` | `string` |  |
| `count` | `integer` |  |

#### EventsOverviewDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `upcomingEvents` | [EventsOverviewSectionDto](#eventsoverviewsectiondto) |  |
| `featuredEvents` | [EventsOverviewSectionDto](#eventsoverviewsectiondto) |  |
| `eventsOfTheMonth` | [EventsOverviewSectionDto](#eventsoverviewsectiondto) |  |
| `expertSpeakers` | [ExpertSpeakersSectionDto](#expertspeakerssectiondto) |  |

#### EventsOverviewDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [EventsOverviewDto](#eventsoverviewdto) |  |
| `message` | `string` |  |

#### EventsOverviewSectionDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `viewAllText` | `string` |  |
| `viewAllUrl` | `string` |  |
| `bookNowText` | `string` |  |
| `items` | [EventCardDto[]](#eventcarddto) |  |

#### Exam

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `code` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `newLearningMaterialLink` | `string` |  |
| `newLearningMaterialNote` | `string` |  |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `marketingDescriptionAr` | `string` |  |
| `marketingDescriptionEn` | `string` |  |
| `fees` | `number` |  |
| `maxNumberOfTries` | `integer` |  |
| `maxTriesBeforeCourseRequired` | `integer` |  |
| `courseId` | `string` |  |
| `trialResetType` | `integer` |  |
| `isDraft` | `boolean` |  |
| `targetCategories` | `string` |  |
| `targetCategoriesEn` | `string` |  |
| `additionalPrerequisites` | `string` |  |
| `additionalPrerequisitesEn` | `string` |  |
| `competenciesTextAr` | `string` |  |
| `competenciesTextEn` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `applyVAT` | `boolean` |  |
| `isCollectInDynamics` | `boolean` |  |
| `isCollectInDynamicsAsSeats` | `boolean` |  |
| `competencyLevelId` | `integer` |  |
| `mandated` | `boolean` |  |
| `centerCategoryId` | `string` |  |
| `enableBundleFeature` | `boolean` |  |
| `isTrending` | `boolean` |  |
| `imageUrl` | `string` |  |
| `examDiscountTypes` | [ExamDiscountType[]](#examdiscounttype) |  |
| `examSectors` | [ExamSector[]](#examsector) |  |
| `prerequisiteCourses` | [PrerequisiteCourse[]](#prerequisitecourse) |  |
| `prerequisiteExamExams` | [PrerequisiteExam[]](#prerequisiteexam) |  |
| `prerequisiteExamPrerequisiteExamNavigations` | [PrerequisiteExam[]](#prerequisiteexam) |  |
| `profiles` | [Profile[]](#profile) |  |
| `retries` | [Retry[]](#retry) |  |
| `examJobFamilies` | [ExamJobFamily[]](#examjobfamily) |  |
| `examCompetecies` | [ExamCompetecie[]](#examcompetecie) |  |
| `examAcquiredSkills` | [ExamAcquiredSkill[]](#examacquiredskill) |  |
| `examTopics` | [ExamTopic[]](#examtopic) |  |
| `userRate` | `number` |  |
| `numberOfUserRates` | `integer` |  |
| `relatedProgramId` | `string` |  |
| `searchKeywords` | `string` |  |

#### ExamAcquiredSkill

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examId` | `string` |  |
| `nameAr` | `string` | yes |
| `nameEn` | `string` |  |
| `valueAr` | `string` |  |
| `valueEn` | `string` |  |
| `exam` | [Exam](#exam) |  |

#### ExamCardDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `marketingDescription` | `string` |  |
| `userRate` | `number` |  |
| `imageUrl` | `string` |  |
| `examFees` | `string` |  |
| `fees` | `number` |  |
| `examProfiles` | [StringLookupViewModelAPI[]](#stringlookupviewmodelapi) |  |
| `profiles` | [Profile[]](#profile) |  |
| `priceAfterDiscount` | `number` |  |
| `isPercentage` | `boolean` |  |
| `hasDiscount` | `boolean` |  |
| `discountMarketDescription` | `string` |  |
| `discountAmount` | `number` |  |
| `discountAmountDescription` | `string` |  |
| `userFavoritId` | `string` |  |
| `isHrdfSupported` | `boolean` |  |
| `hrdfTagText` | `string` |  |
| `hrdfLogoUrl` | `string` |  |

#### ExamCardDtoOverviewSectionDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `subtitle` | `string` |  |
| `items` | [ExamCardDto[]](#examcarddto) |  |

#### ExamCompetecie

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examId` | `string` |  |
| `competencyId` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `exam` | [Exam](#exam) |  |

#### ExamDiscountType

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examId` | `string` |  |
| `discountTypeId` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `exam` | [Exam](#exam) |  |

#### ExamJobFamily

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examId` | `string` |  |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `jobFamilyId` | `string` |  |
| `jobFamilyNameOther` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `exam` | [Exam](#exam) |  |

#### ExamMenuDto

| Field | Type | Required |
|---|---|---|
| `statistics` | [ExamSectorMenuItemViewModel[]](#examsectormenuitemviewmodel) |  |
| `exams` | [ExamMenuItemViewModel[]](#exammenuitemviewmodel) |  |

#### ExamMenuItemViewModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `languagee` | `string` |  |

#### ExamReservation

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `testCenterScheduleDayPeriodId` | `string` |  |
| `testingCenterId` | `string` |  |
| `profileId` | `string` |  |
| `examTakerId` | `string` |  |
| `examDate` | `datetime` |  |
| `stateTime` | `string` |  |
| `endTime` | `string` |  |
| `duration` | `integer` |  |
| `statusId` | `integer` |  |
| `isExamTakerReplaced` | `boolean` |  |
| `originalExamTakerId` | `string` |  |
| `reservationId` | `integer` |  |
| `reservationDate` | `string` |  |
| `certificateDate` | `datetime` |  |
| `paymentPendingStartTime` | `datetime` |  |
| `reservedByAdmin` | `boolean` |  |
| `allowedForOneMoreReschedule` | `boolean` |  |
| `isExamGenerated` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `parent` | [ExamReservation](#examreservation) |  |
| `parentId` | `string` |  |
| `organizationId` | `string` |  |
| `reservedById` | `string` |  |
| `confirmationMailSent` | `boolean` |  |
| `cartId` | `string` |  |
| `lmsReservationDate` | `datetime` |  |
| `lmsReservationId` | `string` |  |
| `bundleId` | `string` |  |
| `bundleReservationId` | `string` |  |
| `reasonId` | [ReasonsList](#reasonslist) |  |
| `reasonDescription` | `string` |  |
| `isSentToMTM` | `boolean` |  |
| `examTaker` | [ExamTaker](#examtaker) |  |
| `profile` | [Profile](#profile) |  |
| `status` | [ExamReservationStatus](#examreservationstatus) |  |
| `testCenterScheduleDayPeriod` | [TestCenterScheduleDayPeriod](#testcenterscheduledayperiod) |  |
| `attempts` | [Attempt[]](#attempt) |  |
| `inverseParent` | [ExamReservation[]](#examreservation) |  |
| `excuseRequests` | [ExcuseRequest[]](#excuserequest) |  |
| `voucherNumber` | `string` |  |
| `licenceType` | `integer` |  |

#### ExamReservationStatus

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `examReservations` | [ExamReservation[]](#examreservation) |  |

#### ExamResultStatus

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `attempts` | [Attempt[]](#attempt) |  |

#### ExamSector

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examId` | `string` |  |
| `sectorId` | `string` |  |
| `subSectorId` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `exam` | [Exam](#exam) |  |

#### ExamSectorMenuItemViewModel

| Field | Type | Required |
|---|---|---|
| `sectorId` | `string` |  |
| `sectorName` | `string` |  |
| `sectorCode` | `string` |  |
| `icon` | `string` |  |
| `count` | `integer` |  |

#### ExamTaker

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `nameEn` | `string` |  |
| `nationalId` | `string` |  |
| `nationalIdentityTypeId` | `integer` |  |
| `userId` | `string` |  |
| `email` | `string` |  |
| `genderId` | `integer` |  |
| `userName` | `string` |  |
| `examTakerId` | `integer` |  |
| `registrationDate` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `traineeIDPortal` | `string` |  |
| `nationalIdentityType` | [NationalIdentityType](#nationalidentitytype) |  |
| `attemptConfiscations` | [AttemptConfiscation[]](#attemptconfiscation) |  |
| `attemptObjections` | [AttemptObjection[]](#attemptobjection) |  |
| `attemptQuestions` | [AttemptQuestion[]](#attemptquestion) |  |
| `attemptSuspensions` | [AttemptSuspension[]](#attemptsuspension) |  |
| `attempts` | [Attempt[]](#attempt) |  |
| `examReservations` | [ExamReservation[]](#examreservation) |  |

#### ExamTopic

| Field | Type | Required |
|---|---|---|
| `examId` | `string` |  |
| `topicId` | `string` |  |
| `exam` | [Exam](#exam) |  |
| `topic` | [Topic](#topic) |  |

#### ExcuseRequest

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examReservationId` | `string` |  |
| `excuseTypeId` | `integer` |  |
| `reasonDescription` | `string` |  |
| `statusId` | `integer` |  |
| `adminDecisionReason` | `string` |  |
| `reviewDate` | `datetime` |  |
| `decisionBy` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `attachmentUrl` | `string` |  |
| `attachmentFileName` | `string` |  |
| `examReservation` | [ExamReservation](#examreservation) |  |
| `excuseType` | [ExcuseType](#excusetype) |  |
| `excuseRequestCompensationTypeId` | `integer` |  |
| `requestNumber` | `string` |  |

#### ExcuseRequestStatus

Enum — values `1,2,3`

#### ExcuseType

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `isActive` | `boolean` |  |

#### ExecuseRequestSubmitDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examReservationId` | `string` |  |
| `excuseTypeId` | `integer` |  |
| `reasonDescription` | `string` |  |
| `submittedDate` | `datetime` |  |
| `execuseRequestStatus` | `string` |  |
| `execuseRequestStatusEnum` | [ExcuseRequestStatus](#excuserequeststatus) |  |
| `attachmentUrl` | `string` |  |
| `attachmentFileName` | `string` |  |
| `adminDecisionReason` | `string` |  |
| `requestNumber` | `string` |  |
| `excuseType` | `string` |  |

#### ExecutiveProgram

| Field | Type | Required |
|---|---|---|
| `partnersCDN` | [PartnerDto](#partnerdto) |  |
| `partnersList` | [PartnerDto[]](#partnerdto) |  |
| `learners` | [SiteContentProgramDto[]](#sitecontentprogramdto) |  |
| `trainers` | [LookupModel[]](#lookupmodel) |  |
| `trainersViewModel` | [ProgramTrainerDto[]](#programtrainerdto) |  |
| `descriptions` | [ExecutiveProgramDescriptionsDto](#executiveprogramdescriptionsdto) |  |
| `nearestPlan` | `object` |  |

#### ExecutiveProgramDescriptionsDto

| Field | Type | Required |
|---|---|---|
| `acceptanceDescription` | `string` |  |
| `educationalDescription` | `string` |  |
| `futureInvestmentDescription` | `string` |  |
| `organizationBenefitsDescription` | `string` |  |
| `professionalDevelopmentDescription` | `string` |  |
| `statisticsDescription` | `string` |  |

#### ExpertSpeakerDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `fullName` | `string` |  |
| `photo` | `string` |  |
| `linkedInUrl` | `string` |  |
| `xUrl` | `string` |  |

#### ExpertSpeakersSectionDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `items` | [ExpertSpeakerDto[]](#expertspeakerdto) |  |

#### ExploreCertificatesDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `url` | `string` |  |

#### FinancialSectorGatewayDto

| Field | Type | Required |
|---|---|---|
| `programs` | [ProgramDto[]](#programdto) |  |
| `selfLearningPrograms` | [ProgramDto[]](#programdto) |  |
| `knowledgeSeminars` | [EventCardDto[]](#eventcarddto) |  |
| `sectorExpertsMeetings` | [EventCardDto[]](#eventcarddto) |  |

#### FinancialSectorGatewayDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [FinancialSectorGatewayDto](#financialsectorgatewaydto) |  |
| `message` | `string` |  |

#### FinancialSectorProgramMenuDto

| Field | Type | Required |
|---|---|---|
| `programs` | [ProgramMenuItemViewModel[]](#programmenuitemviewmodel) |  |
| `upcomingEvents` | [EventMenuItemViewModel[]](#eventmenuitemviewmodel) |  |
| `digitalPrograms` | [ProgramMenuItemViewModel[]](#programmenuitemviewmodel) |  |

#### FinancialSkillsActionDto

| Field | Type | Required |
|---|---|---|
| `text` | `string` |  |
| `url` | `string` |  |

#### FinancialSkillsDocumentDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `type` | `string` |  |
| `downloadUrl` | `string` |  |
| `fileSize` | `string` |  |
| `displayOrder` | `integer` |  |
| `iconUrl` | `string` |  |
| `buttonText` | `string` |  |
| `buttonIconUrl` | `string` |  |
| `previewIconUrl` | `string` |  |

#### FinancialSkillsFaqDto

| Field | Type | Required |
|---|---|---|
| `question` | `string` |  |
| `answer` | `string` |  |

#### FinancialSkillsFrameworkOverviewDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `financialSkillsDictionary` | [FinancialSkillsLinkSectionDto](#financialskillslinksectiondto) |  |
| `frameworkStructure` | [FinancialSkillsLinkSectionDto](#financialskillslinksectiondto) |  |
| `documentsTitle` | `string` |  |
| `documents` | [FinancialSkillsDocumentDto[]](#financialskillsdocumentdto) |  |
| `faqTitle` | `string` |  |
| `faq` | [FinancialSkillsFaqDto[]](#financialskillsfaqdto) |  |
| `faqViewAll` | [FinancialSkillsActionDto](#financialskillsactiondto) |  |
| `strategicPartnersTitle` | `string` |  |
| `strategicPartners` | [FinancialSkillsPartnerDto[]](#financialskillspartnerdto) |  |
| `support` | [FinancialSkillsSupportDto](#financialskillssupportdto) |  |

#### FinancialSkillsFrameworkOverviewDtoApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [FinancialSkillsFrameworkOverviewDto](#financialskillsframeworkoverviewdto) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### FinancialSkillsJobFamilyDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `code` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |

#### FinancialSkillsLinkSectionDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `buttonText` | `string` |  |
| `url` | `string` |  |

#### FinancialSkillsPartnerDto

| Field | Type | Required |
|---|---|---|
| `name` | `string` |  |
| `logoUrl` | `string` |  |
| `url` | `string` |  |
| `displayOrder` | `integer` |  |

#### FinancialSkillsSupportDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `buttonText` | `string` |  |
| `url` | `string` |  |

#### Folder

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `isRelatedToCompetency` | `boolean` |  |
| `code` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `competencyId` | `string` |  |
| `competencyElementId` | `string` |  |
| `performanceCriteriaId` | `string` |  |
| `assessmentJudgmentId` | `string` |  |
| `parentFolderId` | `string` |  |
| `isActive` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `parentFolder` | [Folder](#folder) |  |
| `attemptFolderScores` | [AttemptFolderScore[]](#attemptfolderscore) |  |
| `attemptQuestions` | [AttemptQuestion[]](#attemptquestion) |  |
| `inverseParentFolder` | [Folder[]](#folder) |  |
| `profileFolderFolders` | [ProfileFolder[]](#profilefolder) |  |
| `profileFolderParentFolders` | [ProfileFolder[]](#profilefolder) |  |
| `profileFolderQuestions` | [ProfileFolderQuestion[]](#profilefolderquestion) |  |
| `questions` | [Question[]](#question) |  |
| `questionsPriorities` | [QuestionsPriority[]](#questionspriority) |  |

#### FrameworkStructureFilterOptionDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `text` | `string` |  |
| `value` | `string` |  |
| `isSelected` | `boolean` |  |

#### FrameworkStructureFiltersDto

| Field | Type | Required |
|---|---|---|
| `sectors` | [FrameworkStructureFilterOptionDto[]](#frameworkstructurefilteroptiondto) |  |
| `jobFamilies` | [FrameworkStructureFilterOptionDto[]](#frameworkstructurefilteroptiondto) |  |

#### FrameworkStructureItemDto

| Field | Type | Required |
|---|---|---|
| `jobFamilyId` | `string` |  |
| `sectorId` | `string` |  |
| `sector` | `string` |  |
| `department` | `string` |  |
| `jobFamily` | `string` |  |
| `detailsUrl` | `string` |  |

#### FrameworkStructureLabelsDto

| Field | Type | Required |
|---|---|---|
| `search` | `string` |  |
| `searchPlaceholder` | `string` |  |
| `bankingSector` | `string` |  |
| `jobFamilies` | `string` |  |
| `all` | `string` |  |
| `applyFilters` | `string` |  |
| `sector` | `string` |  |
| `department` | `string` |  |
| `jobFamily` | `string` |  |
| `noResults` | `string` |  |

#### FrameworkStructureOverviewItemDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `iconUrl` | `string` |  |
| `displayOrder` | `integer` |  |

#### FrameworkStructurePageDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `metaTitle` | `string` |  |
| `metaDescription` | `string` |  |

#### FrameworkStructurePaginationDto

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `totalItems` | `integer` |  |
| `totalPages` | `integer` |  |

#### FrameworkStructureResponseDto

| Field | Type | Required |
|---|---|---|
| `page` | [FrameworkStructurePageDto](#frameworkstructurepagedto) |  |
| `overview` | [FrameworkStructureOverviewItemDto[]](#frameworkstructureoverviewitemdto) |  |
| `statistics` | [FrameworkStructureStatisticsDto](#frameworkstructurestatisticsdto) |  |
| `filters` | [FrameworkStructureFiltersDto](#frameworkstructurefiltersdto) |  |
| `pagination` | [FrameworkStructurePaginationDto](#frameworkstructurepaginationdto) |  |
| `items` | [FrameworkStructureItemDto[]](#frameworkstructureitemdto) |  |
| `labels` | [FrameworkStructureLabelsDto](#frameworkstructurelabelsdto) |  |
| `support` | [FrameworkStructureSupportDto](#frameworkstructuresupportdto) |  |

#### FrameworkStructureResponseDtoApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [FrameworkStructureResponseDto](#frameworkstructureresponsedto) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### FrameworkStructureSectorDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `iconSvg` | `string` |  |
| `iconUrl` | `string` |  |
| `segmentsCount` | `integer` |  |
| `jobFamiliesCount` | `integer` |  |
| `jobRolesCount` | `integer` |  |

#### FrameworkStructureStatisticsDto

| Field | Type | Required |
|---|---|---|
| `sectors` | [FrameworkStructureSectorDto[]](#frameworkstructuresectordto) |  |

#### FrameworkStructureSupportDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `buttonText` | `string` |  |
| `url` | `string` |  |
| `iconUrl` | `string` |  |

#### Gender

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `testCenterSchedules` | [TestCenterSchedule[]](#testcenterschedule) |  |

#### HomeExpertDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `fullName` | `string` |  |
| `profileImage` | `string` |  |
| `linkedInUrl` | `string` |  |
| `xUrl` | `string` |  |

#### HomeExpertDtoListReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [HomeExpertDto[]](#homeexpertdto) |  |
| `message` | `string` |  |

#### InitiativeMenuDto

| Field | Type | Required |
|---|---|---|
| `activeMenu` | [InitiativeMenuItemViewModel[]](#initiativemenuitemviewmodel) |  |

#### InitiativeMenuDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [InitiativeMenuDto](#initiativemenudto) |  |
| `message` | `string` |  |

#### InitiativeMenuItemViewModel

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `description` | `string` |  |
| `image` | `string` |  |
| `url` | `string` |  |
| `order` | `integer` |  |

#### InitiativeMenuSectionDto

| Field | Type | Required |
|---|---|---|
| `activeMenu` | [InitiativeMenuItemViewModel[]](#initiativemenuitemviewmodel) |  |
| `openingSoonMenu` | [InitiativeMenuItemViewModel[]](#initiativemenuitemviewmodel) |  |

#### Item

| Field | Type | Required |
|---|---|---|
| `name` | `string` |  |
| `value` | `string` |  |
| `count` | `integer` |  |

#### JobFamilyDetailsResponseDto

| Field | Type | Required |
|---|---|---|
| `jobFamily` | [FinancialSkillsJobFamilyDto](#financialskillsjobfamilydto) |  |
| `jobRoles` | [JobFamilyJobRoleDto[]](#jobfamilyjobroledto) |  |
| `support` | [FrameworkStructureSupportDto](#frameworkstructuresupportdto) |  |

#### JobFamilyDetailsResponseDtoApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [JobFamilyDetailsResponseDto](#jobfamilydetailsresponsedto) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### JobFamilyJobRoleDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `code` | `string` |  |
| `name` | `string` |  |
| `jobFamilyName` | `string` |  |
| `isDefault` | `boolean` |  |
| `responsibilities` | [JobRoleResponsibilityDto[]](#jobroleresponsibilitydto) |  |
| `technicalSkills` | [JobRoleSkillDto[]](#jobroleskilldto) |  |
| `behavioralSkills` | [JobRoleSkillDto[]](#jobroleskilldto) |  |

#### JobFamilyViewModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` | yes |
| `familyDeclarationAr` | `string` |  |
| `code` | `string` |  |
| `isCommon` | `boolean` |  |
| `familyDeclarationEn` | `string` |  |
| `sectorsCheckListData` | [CheckListData](#checklistdata) | yes |

#### JobRoleResponsibilityDto

| Field | Type | Required |
|---|---|---|
| `order` | `integer` |  |
| `description` | `string` |  |

#### JobRoleSkillDto

| Field | Type | Required |
|---|---|---|
| `competencyId` | `string` |  |
| `name` | `string` |  |
| `level` | `string` |  |
| `typeId` | `integer` |  |
| `typeName` | `string` |  |

#### LookupModel

| Field | Type | Required |
|---|---|---|
| `name` | `string` |  |
| `description` | `string` |  |
| `value` | `object` |  |
| `extra` | `object` |  |

#### LookupTreeModel

| Field | Type | Required |
|---|---|---|
| `name` | `string` |  |
| `description` | `string` |  |
| `value` | `object` |  |
| `parentValue` | `object` |  |

#### Meeting

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `sessionId` | `string` |  |
| `dateOfMeeting` | `datetime` |  |
| `startTime` | `string` |  |
| `endTime` | `string` |  |
| `actualDurationInMinutes` | `integer` |  |
| `closeDate` | `datetime` |  |
| `numberOfQuestions` | `integer` |  |
| `numberOfMeetingInSession` | `integer` |  |
| `meetingStatusId` | `integer` |  |
| `closingReason` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `meetingStatus` | [MeetingStatus](#meetingstatus) |  |
| `session` | [Session](#session) |  |
| `meetingExpertQuestions` | [MeetingExpertQuestion[]](#meetingexpertquestion) |  |
| `meetingExperts` | [MeetingExpert[]](#meetingexpert) |  |
| `questions` | [Question[]](#question) |  |

#### MeetingExpert

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `sessionExpertId` | `string` |  |
| `expertUserId` | `string` |  |
| `meetingId` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `meeting` | [Meeting](#meeting) |  |
| `sessionExpert` | [SessionExpert](#sessionexpert) |  |
| `meetingExpertQuestions` | [MeetingExpertQuestion[]](#meetingexpertquestion) |  |

#### MeetingExpertQuestion

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `meetingId` | `string` |  |
| `meetingExpertId` | `string` |  |
| `sessionQuestionId` | `string` |  |
| `sectorId` | `string` |  |
| `subSectorId` | `string` |  |
| `competencyId` | `string` |  |
| `competencyElementId` | `string` |  |
| `performanceCriteriaId` | `string` |  |
| `assessmentJudgementId` | `string` |  |
| `numberOfQuestions` | `integer` |  |
| `addedQuestionsCount` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `meeting` | [Meeting](#meeting) |  |
| `meetingExpert` | [MeetingExpert](#meetingexpert) |  |
| `sessionQuestion` | [SessionQuestion](#sessionquestion) |  |
| `meetingExpertRanges` | [MeetingExpertRange[]](#meetingexpertrange) |  |

#### MeetingExpertRange

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `sessionRangeId` | `string` |  |
| `meetingExpertQuestionId` | `string` |  |
| `numberOfQuestions` | `integer` |  |
| `addedQuestionsCount` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `meetingExpertQuestion` | [MeetingExpertQuestion](#meetingexpertquestion) |  |
| `sessionRange` | [SessionRange](#sessionrange) |  |

#### MeetingStatus

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `meetings` | [Meeting[]](#meeting) |  |

#### MoEngagePurchaseItemDto

| Field | Type | Required |
|---|---|---|
| `request_id` | `string` |  |
| `item_id` | `string` |  |
| `is_executive` | `boolean` |  |
| `item_type` | `integer` |  |

#### ModuleType

Enum — values `1,2,3`

#### MursionAddToCartResponseDto

| Field | Type | Required |
|---|---|---|
| `redirectToCart` | `boolean` |  |
| `requiresPayment` | `boolean` |  |
| `nextAction` | `string` |  |
| `replacedExistingItem` | `boolean` |  |

#### MursionAddToCartResponseDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [MursionAddToCartResponseDto](#mursionaddtocartresponsedto) |  |
| `message` | `string` |  |

#### MursionDetailsDto

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `pageDescription` | `string` |  |
| `overview` | `string` |  |
| `detailedDescription` | `string` |  |
| `mainImageUrl` | `string` |  |
| `imageFallbackUrl` | `string` |  |
| `videoUrl` | `string` |  |
| `sectors` | `string[]` |  |
| `jobFamilies` | `string[]` |  |
| `topics` | `string[]` |  |
| `prerequisites` | `string` |  |
| `policyUrl` | `string` |  |
| `purchaseSectionTitle` | `string` |  |
| `addToCartText` | `string` |  |
| `availabilityLabel` | `string` |  |
| `availability` | `integer` |  |
| `sessionType` | `string` |  |
| `durationMinutes` | `integer` |  |
| `scenarioLanguage` | `string` |  |
| `scenarios` | [MursionScenarioDto[]](#mursionscenariodto) |  |
| `scenariosSectionTitle` | `string` |  |
| `scenariosOverview` | `string` |  |
| `scenariosDescription` | `string` |  |
| `interactiveSessionsLabel` | `string` |  |
| `learningPathTitle` | `string` |  |
| `learningPath` | [MursionLearningPathItemDto[]](#mursionlearningpathitemdto) |  |
| `rating` | `number` |  |
| `ratingCount` | `integer` |  |
| `price` | [MursionPriceDto](#mursionpricedto) |  |
| `canPurchase` | `boolean` |  |
| `addToCartRoute` | `string` |  |
| `relatedPrograms` | [ProgramDto[]](#programdto) |  |
| `suggestedCertificates` | [ExamCardDto[]](#examcarddto) |  |

#### MursionDetailsDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [MursionDetailsDto](#mursiondetailsdto) |  |
| `message` | `string` |  |

#### MursionLearningPathItemDto

| Field | Type | Required |
|---|---|---|
| `order` | `integer` |  |
| `title` | `string` |  |
| `description` | `string` |  |

#### MursionPostPaymentActionDto

| Field | Type | Required |
|---|---|---|
| `paymentSucceeded` | `boolean` |  |
| `nextAction` | `string` |  |
| `redirectUrl` | `string` |  |

#### MursionPostPaymentActionDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [MursionPostPaymentActionDto](#mursionpostpaymentactiondto) |  |
| `message` | `string` |  |

#### MursionPriceDto

| Field | Type | Required |
|---|---|---|
| `baseAmount` | `number` |  |
| `vat` | `number` |  |
| `totalAmount` | `number` |  |
| `currency` | `string` |  |
| `applyVat` | `boolean` |  |

#### MursionScenarioDto

| Field | Type | Required |
|---|---|---|
| `order` | `integer` |  |
| `name` | `string` |  |
| `objective` | `string` |  |

#### NationalIdentityType

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `namrEn` | `string` |  |
| `examTakers` | [ExamTaker[]](#examtaker) |  |

#### ObjectReturnResult

| Field | Type | Required |
|---|---|---|
| `value` | `object` |  |
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `message` | `string` |  |

#### ObjectReturnResultApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [ObjectReturnResult](#objectreturnresult) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### ObjectionReason

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `attemptObjections` | [AttemptObjection[]](#attemptobjection) |  |

#### OrganizationPartnerModel

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `organizationId` | `string` |  |
| `name` | `string` |  |
| `partnerCode` | `string` |  |
| `isEnabled` | `boolean` |  |
| `integrationUrl` | `string` |  |

#### OrganizationPartnerModelIPagedListReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [OrganizationPartnerModel[]](#organizationpartnermodel) |  |
| `message` | `string` |  |

#### PageNavigationDto

| Field | Type | Required |
|---|---|---|
| `text` | `string` |  |
| `url` | `string` |  |
| `absoluteUrl` | `string` |  |

#### PartnerDto

| Field | Type | Required |
|---|---|---|
| `name` | `string` |  |
| `image` | `string` |  |

#### PaymentGatewayType

Enum — values `1,2,3,4,5,6`

#### PaymentModules

Enum — values `1,2,3,4,7,8,9,10`

#### Period

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `fromTime` | `string` |  |
| `toTime` | `string` |  |
| `isActive` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `testCenterScheduleDayPeriods` | [TestCenterScheduleDayPeriod[]](#testcenterscheduledayperiod) |  |

#### PrerequisiteCourse

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examId` | `string` |  |
| `courseId` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `exam` | [Exam](#exam) |  |

#### PrerequisiteExam

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examId` | `string` |  |
| `prerequisiteExamId` | `string` |  |
| `alternativePrerequisiteExamId` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `exam` | [Exam](#exam) |  |
| `prerequisiteExamNavigation` | [Exam](#exam) |  |

#### Profile

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examId` | `string` |  |
| `code` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `titleAr` | `string` |  |
| `titleEn` | `string` |  |
| `confidentialInformationText` | `string` |  |
| `guidelinesText` | `string` |  |
| `isSuccessGradeByPercentage` | `boolean` |  |
| `successGrade` | `number` |  |
| `totalScore` | `number` |  |
| `isTrainingMaterialLink` | `boolean` |  |
| `trainingMaterialLink` | `string` |  |
| `trainingMaterialAttachmentId` | `string` |  |
| `noOfQuestions` | `integer` |  |
| `noOfTrialQuestions` | `integer` |  |
| `durationInMinutes` | `integer` |  |
| `languageId` | `integer` |  |
| `isQuestionsSelectionRandom` | `boolean` |  |
| `targetAudienceId` | `integer` |  |
| `isFolderWeightByPercentage` | `boolean` |  |
| `isOrganizedByInstitute` | `boolean` |  |
| `isActive` | `boolean` |  |
| `isPublished` | `boolean` |  |
| `versionNum` | `integer` |  |
| `versioningRelatedCode` | `string` |  |
| `isLastVersion` | `boolean` |  |
| `isOriginalVersion` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `statusId` | `integer` |  |
| `integrationExamId` | `string` |  |
| `isExternalRegistration` | `boolean` |  |
| `isCollectedInDynamics` | `boolean` |  |
| `externalRegistrationUrl` | `string` |  |
| `isHoldInsideAcademy` | `boolean` |  |
| `registrationEndDate` | `datetime` |  |
| `registrationStartDate` | `datetime` |  |
| `projectId` | `string` |  |
| `exam` | [Exam](#exam) |  |
| `targetAudience` | [TargetAudienceType](#targetaudiencetype) |  |
| `profileSetting` | [ProfileSetting](#profilesetting) |  |
| `attemptConfiscationProfiles` | [AttemptConfiscationProfile[]](#attemptconfiscationprofile) |  |
| `attemptObjections` | [AttemptObjection[]](#attemptobjection) |  |
| `attemptSuspensions` | [AttemptSuspension[]](#attemptsuspension) |  |
| `attempts` | [Attempt[]](#attempt) |  |
| `examReservations` | [ExamReservation[]](#examreservation) |  |
| `profileFolderQuestions` | [ProfileFolderQuestion[]](#profilefolderquestion) |  |
| `profileFolders` | [ProfileFolder[]](#profilefolder) |  |
| `profileOwners` | [ProfileOwner[]](#profileowner) |  |
| `profileRestrictedTestingCenters` | [ProfileRestrictedTestingCenter[]](#profilerestrictedtestingcenter) |  |
| `questionsPriorities` | [QuestionsPriority[]](#questionspriority) |  |
| `testCenterScheduleDayPeriodSpecializationExamProfiles` | [TestCenterScheduleDayPeriodSpecializationExamProfile[]](#testcenterscheduledayperiodspecializationexamprofile) |  |
| `trialExams` | [TrialExam[]](#trialexam) |  |

#### ProfileFolder

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `profileId` | `string` |  |
| `folderId` | `string` |  |
| `parentFolderId` | `string` |  |
| `folderWeight` | `integer` |  |
| `folderOrder` | `integer` |  |
| `isConfirmed` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `folder` | [Folder](#folder) |  |
| `parentFolder` | [Folder](#folder) |  |
| `profile` | [Profile](#profile) |  |
| `profileFolderQuestions` | [ProfileFolderQuestion[]](#profilefolderquestion) |  |
| `folderName` | `string` |  |

#### ProfileFolderQuestion

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `profileFolderId` | `string` |  |
| `profileId` | `string` |  |
| `folderId` | `string` |  |
| `questionId` | `string` |  |
| `questionScore` | `integer` |  |
| `isPinned` | `boolean` |  |
| `isConfirmed` | `boolean` |  |
| `questionOrder` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `folder` | [Folder](#folder) |  |
| `profile` | [Profile](#profile) |  |
| `profileFolder` | [ProfileFolder](#profilefolder) |  |
| `question` | [Question](#question) |  |

#### ProfileOwner

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `profileId` | `string` |  |
| `ownerId` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `profile` | [Profile](#profile) |  |

#### ProfileRestrictedTestingCenter

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `profileId` | `string` |  |
| `testingCenterId` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `profile` | [Profile](#profile) |  |

#### ProfileSetting

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `showIntroPage` | `boolean` |  |
| `showSuccessPrerequisite` | `boolean` |  |
| `showNumberOfQuestions` | `boolean` |  |
| `showExamDuration` | `boolean` |  |
| `showRemainingDuration` | `boolean` |  |
| `notifyUserBeforeEndOfExam` | `boolean` |  |
| `notifyUserBeforeEndOfExamDuration` | `integer` |  |
| `allowCommentPerQuestion` | `boolean` |  |
| `allowCommentForExam` | `boolean` |  |
| `showExamResultAsStatus` | `boolean` |  |
| `showTotalCompetenciesResult` | `boolean` |  |
| `showResultPerCompetency` | `boolean` |  |
| `isSurveyMandatory` | `boolean` |  |
| `showExamReport` | `boolean` |  |
| `hasCertificate` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `idNavigation` | [Profile](#profile) |  |

#### ProgramCategoryDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `numberOfPrograms` | `integer` |  |
| `icon` | `string` |  |
| `url` | `string` |  |

#### ProgramDetailsDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `brief` | `string` |  |
| `marketingDescription` | `string` |  |
| `externalRegistrationURL` | `string` |  |
| `hasExternalRegistrationURL` | `boolean` |  |
| `videoURL` | `string` |  |
| `competencyLevelId` | `integer` |  |
| `imageAttachmentUrl` | `string` |  |
| `rate` | `number` |  |
| `numberOfUserRates` | `integer` |  |
| `userFavoritId` | `string` |  |
| `isInterestSaved` | `boolean` |  |
| `interestSavedMessage` | `string` |  |
| `language` | `string` |  |
| `sectorsList` | [LookupModel[]](#lookupmodel) |  |
| `programTopic` | [LookupModel](#lookupmodel) |  |
| `programTopics` | [LookupModel[]](#lookupmodel) |  |
| `trainers` | [LookupModel[]](#lookupmodel) |  |
| `programAgenda` | [LookupTreeModel[]](#lookuptreemodel) |  |
| `actualTrainingMethod` | `string[]` |  |
| `actualEvaluationMethod` | `string[]` |  |
| `programRequirements` | [LookupModel[]](#lookupmodel) |  |
| `programMains` | [LookupModel[]](#lookupmodel) |  |
| `programAcquiredSkills` | [LookupModel[]](#lookupmodel) |  |
| `programJobFamily` | [JobFamilyViewModel[]](#jobfamilyviewmodel) |  |
| `brochureUrl` | `string` |  |
| `isAvailable` | `boolean` |  |
| `planFees` | `number` |  |
| `isFullySupported` | `boolean` |  |
| `isHrdfSupported` | `boolean` |  |
| `hrdfTagText` | `string` |  |
| `hrdfLogoUrl` | `string` |  |
| `formattedPrice` | `string` |  |
| `trainingPolicyLink` | `string` |  |
| `programTargetCategories` | `string[]` |  |
| `programJobRoleFamilies` | `string[]` |  |
| `hasRegistrationRequirements` | `boolean` |  |
| `registrationRequirments` | [RegistrationRequirmentsDto[]](#registrationrequirmentsdto) |  |
| `isExecutiveProgram` | `boolean` |  |
| `executiveProgram` | [ExecutiveProgram](#executiveprogram) |  |
| `detailsPageURL` | `string` |  |
| `location` | `string` |  |
| `locations` | `string[]` |  |
| `numberOfLessons` | `integer` |  |
| `relatedPrograms` | [ProgramDto[]](#programdto) |  |
| `suggestedCertificates` | [ExamCardDto[]](#examcarddto) |  |
| `durationInDays` | `integer` |  |
| `totalLearningHours` | `integer` |  |
| `numberOfRegisteredUsers` | `integer` |  |
| `applicationProcess` | [ApplicationProcessDto](#applicationprocessdto) |  |
| `trainerCards` | [ProgramExpertDto[]](#programexpertdto) |  |
| `examId` | `string` |  |
| `isBundle` | `boolean` |  |
| `bundleText` | `string` |  |
| `endsWithExam` | `boolean` |  |
| `examDetails` | [ProgramExamDetailsDto](#programexamdetailsdto) |  |

#### ProgramDetailsDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `value` | [ProgramDetailsDto](#programdetailsdto) |  |
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `message` | `string` |  |

#### ProgramDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `location` | `string` |  |
| `imageAttachmentPath` | `string` |  |
| `isPublishedForOrganizations` | `boolean` |  |
| `programTopicName` | `string` |  |
| `planNumberOfDays` | `integer` |  |
| `isNew` | `boolean` |  |
| `isEndingSoon` | `boolean` |  |
| `endingSoonText` | `string` |  |
| `examId` | `string` |  |
| `endsWithExam` | `boolean` |  |
| `endsWithExamText` | `string` |  |
| `appointmentDateText` | `string` |  |
| `isExecutiveProgram` | `boolean` |  |
| `userRate` | `number` |  |
| `ratingUsersCount` | `integer` |  |
| `isForStudent` | `boolean` |  |
| `isForIndividuals` | `boolean` |  |
| `audienceType` | `string` |  |
| `userFavoritId` | `string` |  |
| `isFavorite` | `boolean` |  |
| `trainingTypeCssClass` | `string` |  |
| `externalRegistrationURL` | `string` |  |
| `hasExternalRegistrationURL` | `boolean` |  |
| `startDate` | `string` |  |
| `trainingTypeId` | `integer` |  |
| `trainingType` | `string` |  |
| `allTrainingTypes` | `string` |  |
| `programFees` | `number` |  |
| `fees` | `string` |  |
| `planId` | `string` |  |
| `language` | `string` |  |
| `date` | `datetime` |  |
| `planFees` | `number` |  |
| `priceAfterDiscount` | `number` |  |
| `isPercentage` | `boolean` |  |
| `hasDiscount` | `boolean` |  |
| `discountMarketDescription` | `string` |  |
| `discountAmount` | `number` |  |
| `discountAmountDescription` | `string` |  |
| `isAvailable` | `boolean` |  |
| `isFree` | `boolean` |  |
| `freeMessage` | `string` |  |
| `isFullySupported` | `boolean` |  |
| `isHrdfSupported` | `boolean` |  |
| `hrdfTagText` | `string` |  |
| `hrdfLogoUrl` | `string` |  |
| `formattedPrice` | `string` |  |
| `isBundle` | `boolean` |  |
| `bundleText` | `string` |  |

#### ProgramDtoListApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [ProgramDto[]](#programdto) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### ProgramDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [ProgramDto](#programdto) |  |
| `message` | `string` |  |

#### ProgramExamDetailsDto

| Field | Type | Required |
|---|---|---|
| `examId` | `string` |  |
| `examName` | `string` |  |
| `examDetailsUrl` | `string` |  |
| `numberOfQuestions` | `integer` |  |
| `numberOfFreeAttempts` | `integer` |  |
| `registrationDurationDays` | `integer` |  |
| `trials` | [ProgramExamTrialDto[]](#programexamtrialdto) |  |

#### ProgramExamTrialDto

| Field | Type | Required |
|---|---|---|
| `trialNumber` | `integer` |  |
| `price` | `number` |  |
| `isFree` | `boolean` |  |
| `formattedPrice` | `string` |  |
| `appliesToSubsequentTrials` | `boolean` |  |

#### ProgramExpertDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `fullName` | `string` |  |
| `photoPath` | `string` |  |
| `linkedInUrl` | `string` |  |
| `xUrl` | `string` |  |

#### ProgramMenuDto

| Field | Type | Required |
|---|---|---|
| `statistics` | [ProgramSectorMenuItemViewModel[]](#programsectormenuitemviewmodel) |  |
| `programs` | [ProgramMenuItemViewModel[]](#programmenuitemviewmodel) |  |
| `excutivePrograms` | [ProgramMenuItemViewModel[]](#programmenuitemviewmodel) |  |
| `digitalPrograms` | [ProgramMenuItemViewModel[]](#programmenuitemviewmodel) |  |

#### ProgramMenuItemViewModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `isNew` | `boolean` |  |

#### ProgramSectorMenuItemViewModel

| Field | Type | Required |
|---|---|---|
| `sectorId` | `string` |  |
| `sectorName` | `string` |  |
| `icon` | `string` |  |
| `count` | `integer` |  |

#### ProgramTrainerDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `programId` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `attachmentId` | `string` |  |

#### ProgramsOfTheMonthDto

| Field | Type | Required |
|---|---|---|
| `all` | [ProgramDto[]](#programdto) |  |
| `individuals` | [ProgramDto[]](#programdto) |  |
| `organizations` | [ProgramDto[]](#programdto) |  |

#### ProgramsOverviewDto

| Field | Type | Required |
|---|---|---|
| `mainCategories` | [ProgramCategoryDto[]](#programcategorydto) |  |
| `featuredPrograms` | [ProgramDto[]](#programdto) |  |
| `programsOfTheMonth` | [ProgramsOfTheMonthDto](#programsofthemonthdto) |  |
| `selfLearningPrograms` | [ProgramDto[]](#programdto) |  |
| `experts` | [ProgramExpertDto[]](#programexpertdto) |  |

#### ProgramsOverviewDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [ProgramsOverviewDto](#programsoverviewdto) |  |
| `message` | `string` |  |

#### Question

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `folderId` | `string` |  |
| `questionTypeId` | `integer` |  |
| `code` | `string` |  |
| `meetingId` | `string` |  |
| `sectorId` | `string` |  |
| `subSectorId` | `string` |  |
| `competencyId` | `string` |  |
| `competencyElementId` | `string` |  |
| `performanceCriteriaId` | `string` |  |
| `assessmentJudgementId` | `string` |  |
| `defaultScore` | `integer` |  |
| `isAllCorrectAnswersRequired` | `boolean` |  |
| `isActive` | `boolean` |  |
| `isCancelled` | `boolean` |  |
| `versionNum` | `integer` |  |
| `versioningRelatedCode` | `string` |  |
| `isLastVersion` | `boolean` |  |
| `isOriginalVersion` | `boolean` |  |
| `expertUserId` | `string` |  |
| `approvalDate` | `datetime` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `questionStatusId` | `integer` |  |
| `questionBinaryAr` | `string` |  |
| `idealAnswerBinaryAr` | `string` |  |
| `questionBinaryEn` | `string` |  |
| `idealAnswerBinaryEn` | `string` |  |
| `questionIDPortal` | `string` |  |
| `folder` | [Folder](#folder) |  |
| `meeting` | [Meeting](#meeting) |  |
| `questionType` | [QuestionType](#questiontype) |  |
| `attemptQuestions` | [AttemptQuestion[]](#attemptquestion) |  |
| `profileFolderQuestions` | [ProfileFolderQuestion[]](#profilefolderquestion) |  |
| `questionAnswerChoices` | [QuestionAnswerChoice[]](#questionanswerchoice) |  |
| `questionsPriorities` | [QuestionsPriority[]](#questionspriority) |  |

#### QuestionAnswerChoice

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `questionId` | `string` |  |
| `isCorrectChoice` | `boolean` |  |
| `choiceItemOrder` | `integer` |  |
| `isChoiceItemOrderFixed` | `boolean` |  |
| `choiceBinaryAr` | `string` |  |
| `choiceBinaryEn` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `question` | [Question](#question) |  |

#### QuestionType

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `attemptQuestions` | [AttemptQuestion[]](#attemptquestion) |  |
| `questions` | [Question[]](#question) |  |

#### QuestionsPriority

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `questionId` | `string` |  |
| `profileId` | `string` |  |
| `folderId` | `string` |  |
| `usedFrequency` | `integer` |  |
| `lastUsedOn` | `datetime` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `folder` | [Folder](#folder) |  |
| `profile` | [Profile](#profile) |  |
| `question` | [Question](#question) |  |

#### ReasonsList

Enum — values `1,2,3,4,5,6,7,8`

#### RegistrationRequirmentsDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `registrationRequirementId` | `string` |  |
| `name` | `string` |  |
| `data` | `object` |  |
| `dataFile` | `string` |  |
| `dataTypeValue` | [RequirementDataTypes](#requirementdatatypes) |  |
| `dataTypeId` | [RequirementDataTypes](#requirementdatatypes) |  |
| `dataTypeIdValue` | `integer` |  |
| `isRequired` | `boolean` |  |

#### ReportAndStudyDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `title` | `string` |  |
| `details` | `string` |  |
| `image` | `string` |  |
| `linkAr` | `string` |  |
| `linkEn` | `string` |  |
| `reportDate` | `datetime` |  |
| `detailsPageURL` | `string` |  |

#### ReportAndStudyMenuDto

| Field | Type | Required |
|---|---|---|
| `reportAndStudyViewModels` | [ReportAndStudyDto[]](#reportandstudydto) |  |

#### RequirementDataTypes

Enum — values `1,2,3`

#### RescheduleExamResponseDto

| Field | Type | Required |
|---|---|---|
| `isFree` | `boolean` |  |
| `fees` | `number` |  |
| `isPostPaid` | `boolean` |  |

#### RescheduleExamResponseDtoApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [RescheduleExamResponseDto](#rescheduleexamresponsedto) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### RescheduleResponseDto

| Field | Type | Required |
|---|---|---|
| `isFree` | `boolean` |  |
| `newReservationId` | `string` |  |

#### RescheduleResponseDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [RescheduleResponseDto](#rescheduleresponsedto) |  |
| `message` | `string` |  |

#### ReservationInfoResponseDto

| Field | Type | Required |
|---|---|---|
| `reservationId` | `string` |  |
| `itemId` | `string` |  |
| `planId` | `string` |  |
| `organizationId` | `string` |  |
| `candidateName` | `string` |  |
| `nationalId` | `string` |  |
| `profileId` | `string` |  |
| `isOrganizationMember` | `boolean` |  |
| `organizationName` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `language` | `string` |  |
| `skills` | `string` |  |
| `imageUrl` | `string` |  |
| `materialUrl` | `string` |  |
| `rate` | `number` |  |
| `numberOfUserRates` | `integer` |  |
| `comments` | `string` |  |
| `price` | `string` |  |
| `reservationNo` | `string` |  |
| `startDate` | `string` |  |
| `activityDate` | `datetime` |  |
| `endDate` | `string` |  |
| `tryNo` | `integer` |  |
| `startTime` | `string` |  |
| `endTime` | `string` |  |
| `duration` | `string` |  |
| `sector` | `string` |  |
| `location` | `string` |  |
| `certificateId` | `string` |  |
| `certificateType` | `string` |  |
| `planTraningTypeId` | [TrainingTypeEnum](#trainingtypeenum) |  |
| `profileOwners` | `string` |  |
| `reservationStatus` | `string` |  |
| `reservationStatusEnum` | [ReservationStatus](#reservationstatus) |  |
| `reservationDate` | `string` |  |
| `reservationType` | [ModuleType](#moduletype) |  |
| `validation` | [ReservationValidation](#reservationvalidation) |  |
| `attendanceUrl` | `string` |  |
| `checkInQrCode` | `string` |  |
| `canSendExcuseRequest` | `boolean` |  |
| `execuseRequest` | [ExecuseRequestSubmitDto](#execuserequestsubmitdto) |  |
| `examIdForProgramEndWithExam` | `string` |  |
| `examEligibilityStatus` | `string` |  |
| `isQualifiedForEndExamRegistration` | `boolean` |  |
| `isProgramCompleted` | `boolean` |  |
| `isAttendanceQualifiedForEndExam` | `boolean` |  |
| `programAttendancePercentage` | `number` |  |
| `isExamWaitingPeriodPassed` | `boolean` |  |
| `examEligibleFromDate` | `datetime` |  |
| `examWaitingPeriodDays` | `integer` |  |
| `nextExamAttemptNumber` | `integer` |  |
| `programEndDate` | `datetime` |  |
| `lastExamAttemptDate` | `datetime` |  |
| `isRegisteredInEndExam` | `boolean` |  |
| `endExamReservationId` | `string` |  |
| `numberOfExamQuestions` | `integer` |  |
| `studyMaterialLink` | `string` |  |
| `studyMaterialNote` | `string` |  |

#### ReservationInfoResponseDtoApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [ReservationInfoResponseDto](#reservationinforesponsedto) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### ReservationStatus

Enum — values `0,1,2,3,4,5,6,7,8,9,10`

#### ReservationValidation

| Field | Type | Required |
|---|---|---|
| `isRescheduleValid` | `boolean` |  |
| `isRescheduleExceptionValid` | `boolean` |  |
| `isCancelValid` | `boolean` |  |
| `isChangeProfileValid` | `boolean` |  |
| `canSendExcuseRequest` | `boolean` |  |
| `rescheduleFees` | `number` |  |
| `cancellationFees` | `number` |  |
| `errors` | [Item[]](#item) |  |
| `isCISIOwner` | `boolean` |  |

#### Retry

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `examId` | `string` |  |
| `fees` | `number` |  |
| `numberOfDays` | `integer` |  |
| `indexOrder` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `exam` | [Exam](#exam) |  |

#### SearchResultsDto

| Field | Type | Required |
|---|---|---|
| `searchText` | `string` |  |
| `totalCount` | `integer` |  |
| `programsCount` | `integer` |  |
| `examsCount` | `integer` |  |
| `eventsCount` | `integer` |  |
| `programs` | [ProgramDto[]](#programdto) |  |
| `exams` | [ExamCardDto[]](#examcarddto) |  |
| `events` | [EventCardDto[]](#eventcarddto) |  |

#### SearchResultsDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [SearchResultsDto](#searchresultsdto) |  |
| `message` | `string` |  |

#### Session

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `titleAr` | `string` |  |
| `titleEn` | `string` |  |
| `startDate` | `datetime` |  |
| `noOfTargetQuestions` | `integer` |  |
| `noOfSelectedExperts` | `integer` |  |
| `sessionManagerUserId` | `string` |  |
| `competencyLevelId` | `integer` |  |
| `sessionStatusId` | `integer` |  |
| `closedDate` | `datetime` |  |
| `isSessionConnectedToCompetency` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `sessionStatus` | [SessionStatus](#sessionstatus) |  |
| `meetings` | [Meeting[]](#meeting) |  |
| `sessionExperts` | [SessionExpert[]](#sessionexpert) |  |
| `sessionQuestions` | [SessionQuestion[]](#sessionquestion) |  |
| `sessionSectors` | [SessionSector[]](#sessionsector) |  |
| `title` | `string` |  |

#### SessionExpert

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `sessionId` | `string` |  |
| `expertUserId` | `string` |  |
| `jobFamilyId` | `string` |  |
| `isSpecializedExpert` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `session` | [Session](#session) |  |
| `meetingExperts` | [MeetingExpert[]](#meetingexpert) |  |

#### SessionQuestion

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `sessionId` | `string` |  |
| `sectorId` | `string` |  |
| `subSectorId` | `string` |  |
| `competencyId` | `string` |  |
| `competencyElementId` | `string` |  |
| `performanceCriteriaId` | `string` |  |
| `assessmentJudgementId` | `string` |  |
| `numberOfQuestions` | `integer` |  |
| `isConfirmed` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `session` | [Session](#session) |  |
| `meetingExpertQuestions` | [MeetingExpertQuestion[]](#meetingexpertquestion) |  |
| `sessionRanges` | [SessionRange[]](#sessionrange) |  |

#### SessionRange

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `sessionQuestionId` | `string` |  |
| `rangeNameAr` | `string` |  |
| `rangeNameEn` | `string` |  |
| `numberOfQuestions` | `integer` |  |
| `isConfirmed` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `sessionQuestion` | [SessionQuestion](#sessionquestion) |  |
| `meetingExpertRanges` | [MeetingExpertRange[]](#meetingexpertrange) |  |

#### SessionSector

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `sessionId` | `string` |  |
| `sectorId` | `string` |  |
| `subSectorId` | `string` |  |
| `isConfirmed` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `session` | [Session](#session) |  |

#### SessionStatus

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `sessions` | [Session[]](#session) |  |

#### SiteContentDto

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `photo` | `string` |  |
| `title` | `string` |  |
| `titleAr` | `string` |  |
| `titleEn` | `string` |  |
| `subTitle` | `string` |  |
| `subTitleAr` | `string` |  |
| `subTitleEn` | `string` |  |
| `job` | `string` |  |
| `jobAr` | `string` |  |
| `jobEn` | `string` |  |
| `content` | `string` |  |
| `contentAr` | `string` |  |
| `contentEn` | `string` |  |
| `linkUrl` | `string` |  |
| `contentType` | [SiteContentType](#sitecontenttype) |  |
| `isPublish` | `boolean` |  |
| `itemId` | `string` |  |
| `sortOrder` | `integer` |  |

#### SiteContentProgramDto

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `photo` | `string` |  |
| `title` | `string` |  |
| `subTitle` | `string` |  |
| `job` | `string` |  |
| `content` | `string` |  |
| `linkUrl` | `string` |  |
| `contentType` | [SiteContentType](#sitecontenttype) |  |
| `isPublish` | `boolean` |  |
| `itemId` | `string` |  |
| `sortOrder` | `integer` |  |

#### SiteContentType

Enum — values `1,2,3,4,5,6,7,8,9,10,11,12,13,14`

#### SpecializationType

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `testCenterScheduleDayPeriodSpecializations` | [TestCenterScheduleDayPeriodSpecialization[]](#testcenterscheduledayperiodspecialization) |  |

#### StringApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | `string` |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### StringLookupViewModelAPI

| Field | Type | Required |
|---|---|---|
| `key` | `string` |  |
| `text` | `string` |  |
| `itemId` | `string` |  |
| `id` | `integer` |  |
| `value` | `string` |  |

#### StringStringTuple

| Field | Type | Required |
|---|---|---|
| `item1` | `string` |  |
| `item2` | `string` |  |

#### SuspensionCommitteeDecision

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `attemptSuspensions` | [AttemptSuspension[]](#attemptsuspension) |  |

#### SuspensionReason

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `attemptSuspensions` | [AttemptSuspension[]](#attemptsuspension) |  |

#### TargetAudienceType

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `profiles` | [Profile[]](#profile) |  |

#### TestCenterSchedule

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `testCenterId` | `string` |  |
| `capacity` | `integer` |  |
| `fromDate` | `datetime` |  |
| `endDate` | `datetime` |  |
| `isOnline` | `boolean` |  |
| `genderId` | `integer` |  |
| `isCancelled` | `boolean` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `gender` | [Gender](#gender) |  |
| `testCenterScheduleDays` | [TestCenterScheduleDay[]](#testcenterscheduleday) |  |

#### TestCenterScheduleDay

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `testCenterScheduleId` | `string` |  |
| `testCenterId` | `string` |  |
| `dayDate` | `datetime` |  |
| `dayNumberInMonth` | `integer` |  |
| `dayNumberInWeek` | `integer` |  |
| `month` | `integer` |  |
| `year` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `testCenterSchedule` | [TestCenterSchedule](#testcenterschedule) |  |
| `testCenterScheduleDayPeriods` | [TestCenterScheduleDayPeriod[]](#testcenterscheduledayperiod) |  |

#### TestCenterScheduleDayPeriod

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `testCenterScheduleDayId` | `string` |  |
| `testCenterId` | `string` |  |
| `individualsCapacity` | `integer` |  |
| `periodId` | `string` |  |
| `capacity` | `integer` |  |
| `isOnline` | `boolean` |  |
| `genderId` | `integer` |  |
| `isCancelled` | `boolean` |  |
| `scheduleNoLeft` | `string` |  |
| `scheduleNoRight` | `integer` |  |
| `reservationsCount` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `period` | [Period](#period) |  |
| `testCenterScheduleDay` | [TestCenterScheduleDay](#testcenterscheduleday) |  |
| `examReservations` | [ExamReservation[]](#examreservation) |  |
| `testCenterScheduleDayPeriodSpecializations` | [TestCenterScheduleDayPeriodSpecialization[]](#testcenterscheduledayperiodspecialization) |  |

#### TestCenterScheduleDayPeriodSpecialization

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `testCenterScheduleDayPeriodId` | `string` |  |
| `testCenterScheduleId` | `string` |  |
| `specializationTypeId` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `specializationType` | [SpecializationType](#specializationtype) |  |
| `testCenterScheduleDayPeriod` | [TestCenterScheduleDayPeriod](#testcenterscheduledayperiod) |  |
| `testCenterScheduleDayPeriodSpecializationExamProfiles` | [TestCenterScheduleDayPeriodSpecializationExamProfile[]](#testcenterscheduledayperiodspecializationexamprofile) |  |
| `testCenterScheduleDayPeriodSpecializationSectors` | [TestCenterScheduleDayPeriodSpecializationSector[]](#testcenterscheduledayperiodspecializationsector) |  |

#### TestCenterScheduleDayPeriodSpecializationExamProfile

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `testCenterScheduleDayPeriodSpecializationId` | `string` |  |
| `profileId` | `string` |  |
| `noOfSeats` | `integer` |  |
| `noOfReservations` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `profile` | [Profile](#profile) |  |
| `testCenterScheduleDayPeriodSpecialization` | [TestCenterScheduleDayPeriodSpecialization](#testcenterscheduledayperiodspecialization) |  |

#### TestCenterScheduleDayPeriodSpecializationSector

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `testCenterScheduleDayPeriodSpecializationId` | `string` |  |
| `sectorId` | `string` |  |
| `subSectorId` | `string` |  |
| `organizationId` | `string` |  |
| `noOfSeats` | `integer` |  |
| `noOfReservations` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `testCenterScheduleDayPeriodSpecialization` | [TestCenterScheduleDayPeriodSpecialization](#testcenterscheduledayperiodspecialization) |  |

#### TestCenterViewModel

| Field | Type | Required |
|---|---|---|
| `testCenterId` | `string` |  |
| `name` | `string` |  |

#### TestCenterViewModelReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [TestCenterViewModel](#testcenterviewmodel) |  |
| `message` | `string` |  |

#### TopMenuDto

| Field | Type | Required |
|---|---|---|
| `programMenu` | [ProgramMenuDto](#programmenudto) |  |
| `financialSectorProgramMenu` | [FinancialSectorProgramMenuDto](#financialsectorprogrammenudto) |  |
| `examMenu` | [ExamMenuDto](#exammenudto) |  |
| `eventMenu` | [EventMenuDto](#eventmenudto) |  |
| `reportAndStudy` | [ReportAndStudyMenuDto](#reportandstudymenudto) |  |
| `initiativeMenu` | [InitiativeMenuSectionDto](#initiativemenusectiondto) |  |

#### TopMenuDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [TopMenuDto](#topmenudto) |  |
| `message` | `string` |  |

#### Topic

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `imageAttachmentId` | `string` |  |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |

#### TrainingTopicDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `description` | `string` |  |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `imageAttachmentId` | `string` |  |
| `imageUrl` | `string` |  |
| `imageFallbackUrl` | `string` |  |
| `programsCount` | `integer` |  |
| `programs` | [TrainingTopicProgramDto[]](#trainingtopicprogramdto) |  |
| `viewAll` | [PageNavigationDto](#pagenavigationdto) |  |

#### TrainingTopicProgramDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `title` | `string` |  |
| `url` | `string` |  |
| `absoluteUrl` | `string` |  |

#### TrainingTopicsPageDto

| Field | Type | Required |
|---|---|---|
| `module` | `string` |  |
| `pageTitle` | `string` |  |
| `allPrograms` | [PageNavigationDto](#pagenavigationdto) |  |
| `topics` | [TrainingTopicDto[]](#trainingtopicdto) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### TrainingTopicsPageDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [TrainingTopicsPageDto](#trainingtopicspagedto) |  |
| `message` | `string` |  |

#### TrainingTypeEnum

Enum — values `0,1,2,3`

#### TransactionTypes

Enum — values `1,2,3,4`

#### TrendingHomeDto

| Field | Type | Required |
|---|---|---|
| `programs` | [ProgramDto[]](#programdto) |  |
| `exams` | [ExamCardDto[]](#examcarddto) |  |
| `events` | [EventCardDto[]](#eventcarddto) |  |
| `siteContents` | [SiteContentDto[]](#sitecontentdto) |  |
| `initiativeMenu` | [InitiativeMenuItemViewModel[]](#initiativemenuitemviewmodel) |  |
| `reportAndStudy` | [ReportAndStudyDto[]](#reportandstudydto) |  |
| `notificationCount` | `integer` |  |

#### TrendingHomeDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [TrendingHomeDto](#trendinghomedto) |  |
| `message` | `string` |  |

#### TrialExam

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `profileId` | `string` |  |
| `maxNoOfSeats` | `integer` |  |
| `fees` | `number` |  |
| `isActive` | `boolean` |  |
| `isCancelled` | `boolean` |  |
| `statusId` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `profile` | [Profile](#profile) |  |
| `trialExamInvitedOrganizations` | [TrialExamInvitedOrganization[]](#trialexaminvitedorganization) |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |

#### TrialExamInvitedOrganization

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `trialExamId` | `string` |  |
| `sectorId` | `string` |  |
| `subSectorId` | `string` |  |
| `organizationId` | `string` |  |
| `noOfSeats` | `integer` |  |
| `createdBy` | `string` |  |
| `createdOn` | `datetime` |  |
| `updatedBy` | `string` |  |
| `updatedOn` | `datetime` |  |
| `trialExam` | [TrialExam](#trialexam) |  |

#### UserBillDetailsDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `amount` | `number` |  |
| `vat` | `number` |  |
| `discount` | `number` |  |
| `totalAmount` | `number` |  |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `name` | `string` |  |
| `allowRefund` | `boolean` |  |
| `refundTransaction` | [UserBillDetailsViewModel[]](#userbilldetailsviewmodel) |  |
| `postPoneTransaction` | [UserBillDetailsViewModel[]](#userbilldetailsviewmodel) |  |
| `replaceTransaction` | [UserBillDetailsViewModel[]](#userbilldetailsviewmodel) |  |
| `transactionTypeId` | `integer` |  |
| `paymentModuleId` | `integer` |  |
| `fullInvoicePdfPath` | `string` |  |
| `userFullName` | `string` |  |
| `approved` | `boolean` |  |
| `approvalText` | `string` |  |
| `requestStatus` | `string` |  |
| `transactionType` | [TransactionTypes](#transactiontypes) |  |
| `transactionTypeData` | [StringStringTuple](#stringstringtuple) |  |
| `paymentModule` | [PaymentModules](#paymentmodules) |  |
| `paymentModuleName` | `string` |  |

#### UserBillDetailsViewModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `amount` | `number` |  |
| `vat` | `number` |  |
| `discount` | `number` |  |
| `totalAmount` | `number` |  |
| `descritionAr` | `string` |  |
| `descritionEn` | `string` |  |
| `allowRefund` | `boolean` |  |
| `refundTransaction` | [UserBillDetailsViewModel[]](#userbilldetailsviewmodel) |  |
| `postPoneTransaction` | [UserBillDetailsViewModel[]](#userbilldetailsviewmodel) |  |
| `replcaeTransaction` | [UserBillDetailsViewModel[]](#userbilldetailsviewmodel) |  |
| `transactionTypeId` | `integer` |  |
| `paymentModuleId` | `integer` |  |
| `userFullName` | `string` |  |
| `approved` | `boolean` |  |
| `approvalText` | `string` |  |
| `requestStatus` | `string` |  |
| `transactionDetailId` | `string` |  |
| `fullInvoicePdfPath` | `string` |  |
| `voucherNumber` | `string` |  |
| `transactionType` | [TransactionTypes](#transactiontypes) |  |
| `transactionTypeData` | [StringStringTuple](#stringstringtuple) |  |
| `paymentModule` | [PaymentModules](#paymentmodules) |  |
| `paymentModuleName` | `string` |  |

#### UserBillsListDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `parentId` | `string` |  |
| `amount` | `number` |  |
| `vat` | `number` |  |
| `discount` | `number` |  |
| `totalAmount` | `number` |  |
| `currencyName` | `string` |  |
| `billNumber` | `string` |  |
| `isRefunded` | `boolean` |  |
| `isPostPoned` | `boolean` |  |
| `isReplaced` | `boolean` |  |
| `billDate` | `datetime` |  |
| `billDetails` | [UserBillDetailsDto[]](#userbilldetailsdto) |  |
| `transactionStatus` | `string` |  |
| `transactionStatusId` | `integer` |  |
| `allowConfirmPay` | `boolean` |  |
| `approved` | `boolean` |  |
| `paymentTypeId` | `integer` |  |
| `succeeded` | `boolean` |  |
| `createdOn` | `datetime` |  |
| `iBan` | `string` |  |
| `bankBranch` | `string` |  |
| `ownerId` | `string` |  |
| `taxBillNumber` | `integer` |  |

#### UserBillsListDtoListReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [UserBillsListDto[]](#userbillslistdto) |  |
| `message` | `string` |  |

#### UserCertificateApiModel

| Field | Type | Required |
|---|---|---|
| `fullUserName` | `string` |  |
| `issueNumber` | `string` |  |
| `expirationTimeInYears` | `integer` |  |
| `issueDate` | `datetime` |  |
| `titleAr` | `string` |  |
| `titleEn` | `string` |  |
| `certificateTypeId` | `integer` |  |
| `certificateTypeName` | `string` |  |
| `prerequisiteCertificateExams` | [LookupModel[]](#lookupmodel) |  |
| `prerequisiteCertificateTrainingCourses` | [LookupModel[]](#lookupmodel) |  |
| `prerequisiteCertificateEvents` | [LookupModel[]](#lookupmodel) |  |

#### UserCertificateApiModelApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [UserCertificateApiModel](#usercertificateapimodel) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### WalletCartInfo

| Field | Type | Required |
|---|---|---|
| `balance` | `number` |  |
| `enable` | `boolean` |  |
| `show` | `boolean` |  |

---

*Compiled from the live OpenAPI definitions on the FA testing portal, 8 September 2026.*
