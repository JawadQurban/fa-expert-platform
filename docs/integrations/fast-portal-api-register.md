# FA Portal API Register

Every operation published by `Ims.Portal.Api` on the Financial Academy testing portal: the parameters it takes, the payload it declares in return, and the fields inside that payload. Generated from the OpenAPI 3.0 definitions at `/fa-api/swagger/v1/swagger.json` and `/fa-api/swagger/v2/swagger.json`, saved in `tools/fast-api/`. **Do not edit sections 4–7 by hand** — run `fast-api/build-register.py`.

| | |
|---|---|
| **Host** | `testingportal.fa.gov.sa` |
| **Base path** | `/fa-api` |
| **Auth (declared)** | Bearer JWT on every operation (`Authorization: Bearer <token>`) |
| **Auth (observed)** | Not enforced on the public catalogue: `Lookup/*`, `Program/Search` and `Program/GetPlansByProgramId` answer `200` with no token. `Program/GetProgramLiveSessions` accepts the service token as valid (no 401) but refuses it at authorization (`success=false`, `Unauthorized`). Caller-scoped endpoints (e.g. `GetProgramPlanTakers`) return nothing for a service principal (2026-10-06) |
| **Service token** | Client credentials, client `fast_test`, scope `fast_integration`, from `https://testingauth.fa.gov.sa/identitymanagement.sts/connect/token` |
| **Required header** | `Accept-Language` (`ar`/`en`) on every operation |
| **Operations** | 353 across 47 controllers |
| **By method** | 177 GET · 174 POST · 1 PUT · 1 DELETE |
| **Schemas documented** | 350 objects + 50 enums (request and response) |
| **Typed responses** | 83 of 353; the rest declare a bare `200 OK` |
| **Captured** | 2026-10-06 |

**Contents** — [1. Response envelopes](#1-response-envelopes) · [2. Live call results](#2-live-call-results) · [3. Reading the tables](#3-reading-the-tables) · [4. Endpoint reference](#4-endpoint-reference) · [5. Return bodies](#5-return-bodies) · [6. Fields observed live](#6-fields-observed-live) · [7. Schema dictionary](#7-schema-dictionary) · [8. Changes](#8-changes)

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

> **Coverage note.** Only the operations counted under *Typed responses* in the header declare a response schema; those are fully expanded in section 5. The rest declare a bare `200 OK` (the controller returns `IActionResult` without `ProducesResponseType`), so their body is **not** in the spec. The only way to document it is to call the operation and read the JSON back; section 6 holds what has been read that way.

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
| [AcademyLearningPath](#academylearningpath) | 10 | [LearningPath](#learningpath) | 29 |
| [AcademyLearningPathManagement](#academylearningpathmanagement) | 7 | [Lookup](#lookup) | 10 |
| [AlmentorCourseCatalogue](#almentorcoursecatalogue) | 6 | [MobileConfiguration](#mobileconfiguration) | 2 |
| [Announcements](#announcements) | 8 | [Mursion](#mursion) | 3 |
| [Cart](#cart) | 2 | [Notification](#notification) | 2 |
| [Catalog](#catalog) | 2 | [Orgnization](#orgnization) | 9 |
| [Certificate](#certificate) | 3 | [Payment](#payment) | 8 |
| [DashBoard](#dashboard) | 9 | [PaymentProcess](#paymentprocess) | 1 |
| [Eligibility](#eligibility) | 5 | [Player](#player) | 12 |
| [Event](#event) | 7 | [PrePostAssesment](#prepostassesment) | 2 |
| [Exam](#exam) | 16 | [Program](#program) | 27 |
| [ExecuseRequest](#execuserequest) | 4 | [QualificationsEducation](#qualificationseducation) | 4 |
| [FinancialAwareness](#financialawareness) | 1 | [QualificationsPracticalExperience](#qualificationspracticalexperience) | 4 |
| [FinancialSkills](#financialskills) | 7 | [QualificationsProfessional](#qualificationsprofessional) | 4 |
| [Home](#home) | 12 | [QualificationsTrainingCourses](#qualificationstrainingcourses) | 8 |
| [IdentityCheckupDiagnostic](#identitycheckupdiagnostic) | 1 | [Reports](#reports) | 27 |
| [IdentityNafath](#identitynafath) | 5 | [Search](#search) | 1 |
| [IdentityPublicRegistration](#identitypublicregistration) | 5 | [TrackingRequest](#trackingrequest) | 5 |
| [IdentityRecovery](#identityrecovery) | 5 | [TrainerContracts](#trainercontracts) | 5 |
| [IdentityRegistration](#identityregistration) | 5 | [UserCertificate](#usercertificate) | 1 |
| [IdentityRegistrationEmail](#identityregistrationemail) | 5 | [Users](#users) | 11 |
| [IndividualLearningPath](#individuallearningpath) | 10 | [WorkSpace](#workspace) | 27 |
| [Invitation](#invitation) | 7 | [WorkSpaces](#workspaces) | 3 |
| [LearningGroup](#learninggroup) | 6 |  | |

### AcademyLearningPath

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/AcademyLearningPath` | `Status` *AcademyPathLearnerStatus*<br>`Search` *string*<br>`SubjectId` *string*<br>`PageNumber` *integer*<br>`PageSize` *integer* | — | `200` OK |  |
| `GET` | `/api/v1/AcademyLearningPath/summary` | — | — | `200` OK |  |
| `POST` | `/api/v1/AcademyLearningPath/{id}/start` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/AcademyLearningPath/{id}/overview` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/AcademyLearningPath/{id}/content` | `id` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/AcademyLearningPath/{id}/items/{itemId}/start` | `id` *string* (required, path)<br>`itemId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/AcademyLearningPath/{id}/certificates` | `id` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/AcademyLearningPath/{id}/path-certificate` | `id` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/AcademyLearningPath/{id}/evaluation` | `id` *string* (required, path)<br>`rate` *integer*<br>`comment` *string* | — | `200` OK |  |
| `GET` | `/api/v1/AcademyLearningPath/{id}/evaluation` | `id` *string* (required, path) | — | `200` OK |  |

### AcademyLearningPathManagement

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/AcademyLearningPathManagement` | `Status` *AcademyLearningPathManagementStatus*<br>`Search` *string*<br>`SubjectId` *string*<br>`PageNumber` *integer*<br>`PageSize` *integer* | — | `200` OK |  |
| `GET` | `/api/v1/AcademyLearningPathManagement/summary` | — | — | `200` OK |  |
| `GET` | `/api/v1/AcademyLearningPathManagement/{id}/overview` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/AcademyLearningPathManagement/{id}/content` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/AcademyLearningPathManagement/{id}/users` | `id` *string* (required, path)<br>`Search` *string*<br>`JobTitleId` *string*<br>`DepartmentId` *string*<br>`Status` *AcademyPathLearnerStatus*<br>`PageNumber` *integer*<br>`PageSize` *integer* | — | `200` OK |  |
| `POST` | `/api/v1/AcademyLearningPathManagement/{id}/users` | `id` *string* (required, path) | [AcademyLearningPathManagementAssignUsersViewModel](#academylearningpathmanagementassignusersviewmodel) | `200` OK |  |
| `GET` | `/api/v1/AcademyLearningPathManagement/{id}/progress-report` | `id` *string* (required, path) | — | `200` OK |  |

### AlmentorCourseCatalogue

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/AlmentorCourseCatalogue/GetAllPrograms` | — | [WorkSpaceProgramsFilterViewModel](#workspaceprogramsfilterviewmodel) | `200` OK |  |
| `GET` | `/api/v1/AlmentorCourseCatalogue/GetAllLearnsProgress` | — | — | `200` [ApiResponse](#apiresponse) | `200` 241 B · user token, 2026-09-08 |
| `GET` | `/api/v1/AlmentorCourseCatalogue/GetProgramProgess` | `ProgramId` *string* | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/v1/AlmentorCourseCatalogue/MyPrograms` | — | [SearchMyProgramsDto](#searchmyprogramsdto) | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/v1/AlmentorCourseCatalogue/GetTimeLineChartData` | `programId` *integer* | — | `200` OK | `200` 279 B · user token, 2026-09-08 |
| `POST` | `/api/v1/AlmentorCourseCatalogue/GetProgramDetails` | — | [ProgramDetailDto](#programdetaildto) | `200` [ProgramDetailsDtoReturnResult](#programdetailsdtoreturnresult)<br>`404` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error |  |

- **`POST /api/v1/AlmentorCourseCatalogue/GetProgramDetails`** — Full program details as rendered on the program details page: descriptive content, topics,
location, lessons count, pricing, nearest plan, registration requirements, related programs
and suggested certificates.

### Announcements

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Announcements/GetAll` | — | [AnnouncementGetAllQueryModel](#announcementgetallquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Announcements/Details` | — | [AnnouncementGetByIdQueryModel](#announcementgetbyidquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Announcements/create` | — | [CreateOrUpdateAnnouncementDto](#createorupdateannouncementdto) | `200` OK |  |
| `POST` | `/api/v1/Announcements/edit` | — | [CreateOrUpdateAnnouncementDto](#createorupdateannouncementdto) | `200` OK |  |
| `POST` | `/api/v1/Announcements/SetStatus` | — | [AnnouncementSetStatusCommandModel](#announcementsetstatuscommandmodel) | `200` OK |  |
| `POST` | `/api/v1/Announcements/Remove` | — | [AnnouncementGetByIdQueryModel](#announcementgetbyidquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Announcements/GetNotification` | — | [NotificationGetByOrganizationQueryModel](#notificationgetbyorganizationquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Announcements/SendNotification` | — | [NotificationCategoryModel](#notificationcategorymodel) | `200` OK |  |

### Cart

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Cart/delete/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Cart/GetShoppingCartWithDetails` | — | — | `200` [CartPaymentViewModelReturnResult](#cartpaymentviewmodelreturnresult)<br>`500` Internal Server Error | `200` 82 B · user token, 2026-09-08 |

- **`POST /api/v1/Cart/delete/{id}`** — Deletes a cart item and its related records based on the given ID.

### Catalog

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Catalog/search` | `Keyword` *string*<br>`Type` *CatalogItemType* | — | `200` OK | `200` 13 KB · user token, 2026-09-08 |
| `GET` | `/api/v2/Catalog/search` | `Keyword` *string*<br>`Type` *CatalogItemType* | — | `200` OK |  |

### Certificate

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Certificate/CurrentCertificates` | — | [UserCertificateFilterRequest](#usercertificatefilterrequest) | `200` OK |  |
| `GET` | `/api/v1/Certificate/Generate` | `id` *string*<br>`asBase64` *boolean* | — | `200` OK |  |
| `GET` | `/api/v1/Certificate/Download` | `id` *string* | — | `200` OK |  |

### DashBoard

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/DashBoard/MyPrograms` | — | [SearchMyProgramsDto](#searchmyprogramsdto) | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/v1/DashBoard/MySelfLearningPrograms` | — | [MySelfLearningViewModel](#myselflearningviewmodel) | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/v1/DashBoard/MyExams` | — | [SearchMyExamDto](#searchmyexamdto) | `200` [ApiResponse](#apiresponse)<br>`400` [ProblemDetails](#problemdetails) |  |
| `POST` | `/api/v1/DashBoard/MyEvents` | — | [SearchMyEventsDto](#searchmyeventsdto) | `200` [ApiResponse](#apiresponse)<br>`400` [ProblemDetails](#problemdetails) |  |
| `GET` | `/api/v1/DashBoard/ReservationInfo/{id}/{type}` | `id` *string* (required, path)<br>`type` *ModuleType* (required, path) | — | `200` [ReservationInfoResponseDtoApiResponse](#reservationinforesponsedtoapiresponse)<br>`404` [ApiResponse](#apiresponse)<br>`403` [ApiResponse](#apiresponse)<br>`500` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/v1/DashBoard/AddUserRate` | `reservationId` *string*<br>`type` *ModuleType*<br>`rate` *number*<br>`comment` *string* | — | `200` [ApiResponse](#apiresponse)<br>`400` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/v1/DashBoard/GetSubmittedRate/{reservationId}/{type}` | `reservationId` *string* (required, path)<br>`type` *ModuleType* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/DashBoard/MyCoupon` | — | — | `200` OK | `200` 312 B · user token, 2026-09-08 |
| `GET` | `/api/v1/DashBoard/ProgramEndWithExam` | — | — | `200` [ApiResponse](#apiresponse) | `200` 378 B · user token, 2026-09-08 |

- **`POST /api/v1/DashBoard/MyExams`** — Retrieves a list of exams for the currently logged-in user based on search criteria.
- **`POST /api/v1/DashBoard/MyEvents`** — Retrieves a list of events for the currently logged-in user based on search criteria.
- **`GET /api/v1/DashBoard/ReservationInfo/{id}/{type}`** — Retrieves reservation information based on ID and module type.
- **`POST /api/v1/DashBoard/AddUserRate`** — Submits a user rating for a specific module (Training, Exams, Events).
- **`GET /api/v1/DashBoard/MyCoupon`** — Retrieves a Coupon for the currently logged-in user.
- **`GET /api/v1/DashBoard/ProgramEndWithExam`** — Retrieves program that ends with an exam along with coupon details
for the currently logged-in user dashboard.

### Eligibility

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Eligibility/check` | — | [CheckEligibilityRequestDto](#checkeligibilityrequestdto) | `200` OK |  |
| `GET` | `/api/v1/Eligibility/status` | — | — | `200` OK | `200` 164 B · user token, 2026-09-08 |
| `POST` | `/api/v1/Eligibility/declaration` | — | [CheckEligibilityRequestDto](#checkeligibilityrequestdto) | `200` OK |  |
| `POST` | `/api/v1/Eligibility/send-code` | — | [SendVerificationCodeRequestDto](#sendverificationcoderequestdto) | `200` OK |  |
| `POST` | `/api/v1/Eligibility/verify-code` | — | [VerifyVerificationCodeRequestDto](#verifyverificationcoderequestdto) | `200` OK |  |

- **`POST /api/v1/Eligibility/check`** — Checks whether the supplied email belongs to a recognized university domain.
Anonymous: no authentication required (mirrors the source MVC endpoint).
- **`GET /api/v1/Eligibility/status`** — Returns the current user's university email and whether it is verified.
Business equivalent of the MVC "Prompt" action (no view rendering / redirect).
- **`POST /api/v1/Eligibility/declaration`** — Saves the user's university email and submits the student data eligibility declaration.
Business equivalent of the MVC "SubmitDeclaration" action — the current Web flow, which
no longer involves a verification code. On success, the client should proceed directly
to the existing AddToCart API, exactly as Web re-attempts AddToCart after this step.
- **`POST /api/v1/Eligibility/send-code`** — Generates a verification code for the supplied university email, caches it (10 min)
and emails it to the user. Business equivalent of the MVC "SendCode" action.
- **`POST /api/v1/Eligibility/verify-code`** — Verifies the code previously sent and confirms the user's university email.
Business equivalent of the MVC "VerifyCode" action (pending email is supplied in the
request body instead of TempData).

### Event

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Event/Search` | — | [FilterEventDto](#filtereventdto) | `200` OK |  |
| `GET` | `/api/v1/Event/GetEventTypes` | — | — | `200` OK | `200` 791 B · user token, 2026-09-08 |
| `GET` | `/api/v1/Event/GetEventPeriods` | — | — | `200` OK | `200` 278 B · user token, 2026-09-08 |
| `GET` | `/api/v1/Event/GetEventDetails` | `eventId` *string* | — | `200` OK | `404` 30 B · user token, 2026-09-08 |
| `POST` | `/api/v1/Event/AddToCart` | — | [EventRegisterationApiViewModel](#eventregisterationapiviewmodel) | `500` Internal Server Error |  |
| `POST` | `/api/v1/Event/CancelReservation` | — | [CancelReservationViewModel](#cancelreservationviewmodel) | `200` [BooleanReturnResult](#booleanreturnresult) |  |
| `POST` | `/api/v1/Event/RegisterUser` | — | object | `200` OK |  |

- **`POST /api/v1/Event/CancelReservation`** — Cancels an event registration and processes refund if needed.

### Exam

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Exam/GetCfaCertificates` | — | — | `200` [CfaCertificatesSectionDtoApiResponse](#cfacertificatessectiondtoapiresponse) | `200` 5.4 KB · user token, 2026-09-08 |
| `POST` | `/api/v1/Exam/Search` | — | [FilterExamDto](#filterexamdto) | `200` OK |  |
| `GET` | `/api/v1/Exam/GetExamDetailsById` | `examId` *string* | — | `200` OK | `200` 259 B · user token, 2026-09-08 |
| `GET` | `/api/v1/Exam/ValidateCertificate` | `certificateNumber` *string* | — | `200` [UserCertificateApiModelApiResponse](#usercertificateapimodelapiresponse) | `400` 267 B · user token, 2026-09-08 |
| `GET` | `/api/v1/Exam/GetExamProfiles` | `examId` *string* | — | `200` OK | `500` 179 B · user token, 2026-09-08 |
| `GET` | `/api/v1/Exam/GetExamTestCenters` | `examId` *string* | — | `200` [TestCenterViewModelReturnResult](#testcenterviewmodelreturnresult)<br>`400` [ProblemDetails](#problemdetails)<br>`404` [ProblemDetails](#problemdetails)<br>`500` If there is an internal server error. | `400` 40 B · user token, 2026-09-08 |
| `GET` | `/api/v1/Exam/TestingCenters` | — | — | `200` Returns a list of testing centers.<br>`404` Returns a message indicating no testing centers were found.<br>`500` Returns a message indicating an internal server error. | `200` 2.4 KB · user token, 2026-09-08 |
| `GET` | `/api/v1/Exam/GetCenterAvailableDates` | `centerId` *string*<br>`profileId` *string* | — | `200` OK | `400` 36 B · user token, 2026-09-08 |
| `GET` | `/api/v1/Exam/GetCenterAvailableTimes` | `centerId` *string*<br>`date` *string*<br>`profileId` *string* | — | `200` OK | `400` 241 B · user token, 2026-09-08 |
| `POST` | `/api/v1/Exam/AddToCart` | — | [ExamAddToCartApiDto](#examaddtocartapidto) | `200` [BooleanReturnResult](#booleanreturnresult)<br>`500` Internal Server Error |  |
| `POST` | `/api/v1/Exam/External/AddToCart` | `code` *string* | — | `200` [BooleanReturnResult](#booleanreturnresult)<br>`400` [ProblemDetails](#problemdetails)<br>`500` If an unexpected server error occurs. |  |
| `POST` | `/api/v1/Exam/ChangeProfile` | `reservationId` *string*<br>`profileId` *string* | — | `200` [BooleanApiResponse](#booleanapiresponse)<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal server error. |  |
| `POST` | `/api/v1/Exam/cancel-reservation` | — | [CancelReservationViewModel](#cancelreservationviewmodel) | `200` [BooleanReturnResult](#booleanreturnresult) |  |
| `POST` | `/api/v1/Exam/exam-reschedule` | — | [RescheduleExamDto](#rescheduleexamdto) | `200` [RescheduleExamResponseDtoApiResponse](#rescheduleexamresponsedtoapiresponse) |  |
| `GET` | `/api/v1/Exam/generate-exam-report` | `regId` *string*<br>`isExport` *boolean* | — | `200` OK | `200` 227 B · user token, 2026-09-08 |
| `GET` | `/api/v1/Exam/Overview` | `count` *integer* | — | `200` [CertificatesOverviewDtoReturnResult](#certificatesoverviewdtoreturnresult) | `200` 28 KB · user token, 2026-09-08 |

- **`GET /api/v1/Exam/GetCfaCertificates`** — Gets the CFA certificates section displayed on the Self Learning page.
- **`GET /api/v1/Exam/GetExamDetailsById`** — Retrieves exam details for the given exam ID.
- **`GET /api/v1/Exam/ValidateCertificate`** — Validates a certificate by its issue number and, when valid, returns the certificate
information shown on the public "Validate Certificate" web page. This endpoint exposes the exact same validation used by the website
(Home/CertifcateValidate). It reuses `AppMainUow.UserCertificates.CheckUserCertificateByIssueNumber`
and the localized `AppMainResources` messages; no new validation logic is introduced.
- **`GET /api/v1/Exam/GetExamProfiles`** — Gets exam profiles for a given exam ID.
- **`GET /api/v1/Exam/GetExamTestCenters`** — Retrieves a list of available exam centers for a given exam. This endpoint fetches available exam centers based on the user’s profile and exam-specific restrictions.
- **`GET /api/v1/Exam/TestingCenters`** — Gets the list of testing centers.
- **`GET /api/v1/Exam/GetCenterAvailableDates`** — Gets available  center dates based on  center ID and profile ID.
- **`GET /api/v1/Exam/GetCenterAvailableTimes`** — Gets available  center times based on  center ID, date, and profile ID.
- **`POST /api/v1/Exam/External/AddToCart`** — Add an external exam to the shopping cart.
- **`POST /api/v1/Exam/ChangeProfile`** — Changes the exam profile for a reservation if it meets eligibility conditions.
- **`POST /api/v1/Exam/cancel-reservation`** — Cancels an exam reservation and processes refund if applicable.
- **`POST /api/v1/Exam/exam-reschedule`** — Reschedules an exam for the user.
- **`GET /api/v1/Exam/Overview`** — Returns the Certificates (Exams) Overview: most requested certificates, new certificates,
main categories, policies and the explore-certificates call-to-action, in a single response
so the public overview page (https://fa.gov.sa/Services/Exams/overview) needs only one call.

### ExecuseRequest

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/ExecuseRequest/Service/filter-excuse-request` | `SelectedExcuseTypeId` *integer*<br>`StatusId` *integer*<br>`CreatedDateFrom` *datetime*<br>`CreatedDateTo` *datetime*<br>`PageNumber` *integer*<br>`PageSize` *integer* | — | `200` OK | `200` 3.8 KB · user token, 2026-09-08 |
| `POST` | `/api/v1/ExecuseRequest/Service/can-submit-excuse` | `reservationId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/ExecuseRequest/Service/excuse-types` | — | — | `200` OK |  |
| `POST` | `/api/v1/ExecuseRequest/Service/submit-excuse` | — | object | `200` OK |  |

### FinancialAwareness

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/FinancialAwareness/LearningInitiative` | — | — | `200` [LearningInitiativeDtoReturnResult](#learninginitiativedtoreturnresult) |  |

- **`GET /api/v1/FinancialAwareness/LearningInitiative`** — Retrieves the FAST-owned data of the Financial Awareness Platform page (/LearningInitiative):
the first published awareness units and all published learning paths. Public endpoint ("Optional" policy): the JWT is read when sent but never required. With a valid JWT,
unit completion statuses and path completed-units counts are calculated for that user;
anonymous requests get not-completed statuses.
CMS-driven sections (hero, overview, section headers, initiative cards, articles, support)
are not returned; the client reads them directly from the CMS.
Localized fields follow the Accept-Language header.

### FinancialSkills

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/FinancialSkills/GetFrameworkStructure` | — | [FrameworkStructureRequestDto](#frameworkstructurerequestdto) | `200` [FrameworkStructureResponseDtoApiResponse](#frameworkstructureresponsedtoapiresponse) |  |
| `GET` | `/api/v1/FinancialSkills/GetJobFamilyDetails` | `familyId` *string*<br>`sectorId` *string* | — | `200` [JobFamilyDetailsResponseDtoApiResponse](#jobfamilydetailsresponsedtoapiresponse)<br>`404` [ProblemDetails](#problemdetails) |  |
| `GET` | `/api/v1/FinancialSkills/GetJobFamilyPrograms` | `familyId` *string*<br>`sectorId` *string* | — | `200` [ProgramDtoListApiResponse](#programdtolistapiresponse) |  |
| `GET` | `/api/v1/FinancialSkills/GetFrameworkOverview` | — | — | `200` [FinancialSkillsFrameworkOverviewDtoApiResponse](#financialskillsframeworkoverviewdtoapiresponse) |  |
| `GET` | `/api/v1/FinancialSkills/GetCompetencies` | `competencyTypeId` *integer*<br>`pageNumber` *integer*<br>`pageSize` *integer* | — | `200` OK |  |
| `GET` | `/api/v1/FinancialSkills/GetCompetencyDetails` | `id` *string* | — | `200` [CompetencyDetailsDtoReturnResult](#competencydetailsdtoreturnresult)<br>`404` [ProblemDetails](#problemdetails) |  |
| `GET` | `/api/v1/FinancialSkills/GetCompetencyLevelDetails` | `competencyId` *string*<br>`levelOrder` *integer*<br>`pageNumber` *integer*<br>`pageSize` *integer* | — | `200` [CompetencyLevelDetailsDtoReturnResult](#competencyleveldetailsdtoreturnresult)<br>`404` [ProblemDetails](#problemdetails) |  |

- **`GET /api/v1/FinancialSkills/GetJobFamilyDetails`** — Job family details + every job role under it, matching the MVC
`FinancialSkills/FrameworkStructure/JobRoles?FId=&SId=` page. All roles are
returned with full detail (responsibilities/skills) in one response, same as MVC -
there is no separate per-role request to mirror (the MVC page toggles between roles
entirely client-side).
- **`GET /api/v1/FinancialSkills/GetJobFamilyPrograms`** — Programs related to a job family, matching the MVC
`Services/GetJobFamilyProgram?resultJobFamilyId=&sectorId=` action (loaded via
its own request in MVC too). Reuses `IProgramService.GetAllProgramsAsync` and the
same program-card DTO/mapping `ProgramController` uses - no card logic duplicated.
- **`GET /api/v1/FinancialSkills/GetCompetencies`** — Paged list of competencies for a given competency type, matching the MVC
`FinancialSkills/GetCompetencyByType` action (which returns rendered HTML)
but as structured JSON. Reuses
M:Ims.Competencies.Bll.Repositories.CompetenciesRepository.GetCompetencyByTypeIdPaging(System.Int32,System.Boolean,System.Int32,System.Nullable{System.Int32},System.String)
for querying, paging, localization and ordering - unchanged from MVC.
- **`GET /api/v1/FinancialSkills/GetCompetencyDetails`** — Full competency details, matching the MVC `FinancialSkills/FinancialSkillCard/{id}`
action (which renders HTML) but as structured JSON. Reuses
M:Ims.Competencies.Bll.Repositories.CompetenciesRepository.GetCompetenciesDetailsById(System.Guid,System.Boolean),
the same method the MVC Details action calls, including its level ordering.
- **`GET /api/v1/FinancialSkills/GetCompetencyLevelDetails`** — Training programs and certificates related to a single competency level, matching the
MVC level-expand AJAX call (`Ims.Portal.Web.Areas.Competencies.Controllers.HomeController.JadaratDetails`,
route `FinancialSkills/FinancialSkillDetails/{competencyId}/{levelId}`), which
returns pre-rendered HTML partials - this endpoint calls the exact same
M:Ims.Portal.Bll.Interfaces.Training.IProgramService.GetAllProgramsAsync(Ims.Training.Model.ViewModels.Search.IndexUserFiltersViewModel) / M:Ims.Portal.Bll.Interfaces.Exams.IExamService.GetAllExams(Ims.Exams.Model.ViewModels.Search.IndexUserFilterViewModel)
services and returns the same underlying data as structured JSON instead.
The MVC page/JS identifies a level by `Level.Id` (the shared master level primary
key used as `Program.CompetencyLevelId` / `Exam.CompetencyLevelId`), which is
not exposed by M:Ims.Portal.Api.Areas.Competencies.Controllers.FinancialSkillsController.GetCompetencyDetails(System.Guid). To avoid changing that endpoint's
contract, this endpoint accepts the competency id + the level's visible number (1-5) and
resolves the matching `Level.Id` itself, via the same
`CompetenciesRepository.GetCompetenciesDetailsById` call M:Ims.Portal.Api.Areas.Competencies.Controllers.FinancialSkillsController.GetCompetencyDetails(System.Guid)
and the MVC page both use. The level is matched against `Level.Code`, not `Level.Order`: `Level.Order`
is only used elsewhere (`CompetencyLevelsRepository`/`LevelsRepository`) to sort
levels for display and is not guaranteed to hold the visible level number (in production
data all 5 levels of at least one competency have `Order == 0`). `Level.Code` is
the field the rest of the app uses to represent the level's visible number/identity - see
`LevelsRepository.GetLevelCode`/`GetLevelCodeAsync`,
`CompetenciesDtoRepository.GetCompetencyLevelById`/`GetCompetenciesDtoById`, and
`JobFamilyDetailsResponseDto.JobRoleSkillDto.Level` (documented there as "Level.Code -
NOT Level.Order"). It is a `string`, not an `int`, so the incoming
levelOrder is compared as a string.

Business rules are unchanged from MVC: programs are matched by level only
(`Program.CompetencyLevelId == Level.Id`, competency not filtered - see
`ProgramsRepository.ApplyProgramFilters`); certificates are matched by level and
competency (`Exam.CompetencyLevelId == Level.Id` and joined to the competency via
`ExamCompetecies` - see `ExamsRepository.GetAllExamsPaging`). Paging mirrors the
MVC page: when pageNumber/pageSize are omitted, the
same per-section defaults MVC relies on apply (10 for programs, 12 for certificates).

### Home

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Home/Trending` | — | — | `200` [TrendingHomeDtoReturnResult](#trendinghomedtoreturnresult) | `200` 283 KB · user token, 2026-09-08 |
| `GET` | `/api/v1/Home/EventsOverview` | — | — | `200` [EventsOverviewDtoReturnResult](#eventsoverviewdtoreturnresult) | `200` 17 KB · user token, 2026-09-08 |
| `GET` | `/api/v1/Home/Calendar` | `startDate` *datetime* | — | `200` [CalendarUnifiedItemDtoListReturnResult](#calendarunifieditemdtolistreturnresult) |  |
| `GET` | `/api/v1/Home/Calendar-Guest` | `startDate` *datetime* | — | `200` [CalendarUnifiedItemDtoReturnResult](#calendarunifieditemdtoreturnresult) |  |
| `GET` | `/api/v1/Home/InitiativeMenu` | — | — | `200` [InitiativeMenuDtoReturnResult](#initiativemenudtoreturnresult) |  |
| `GET` | `/api/v1/Home/TopMenu` | — | — | `200` [TopMenuDtoReturnResult](#topmenudtoreturnresult) | `200` 11 KB · user token, 2026-09-08 |
| `POST` | `/api/v1/Home/contactus` | — | [ContactUsDto](#contactusdto) | `200` OK |  |
| `GET` | `/api/v1/Home/force-update` | — | — | `200` OK |  |
| `GET` | `/api/v1/Home/about-us` | — | — | `200` OK |  |
| `GET` | `/api/v1/Home/report-and-study` | — | — | `200` OK | `200` 6.7 KB · user token, 2026-09-08 |
| `GET` | `/api/v1/Home/Experts` | — | — | `200` [HomeExpertDtoListReturnResult](#homeexpertdtolistreturnresult) |  |
| `GET` | `/api/v1/Home/FinancialSectorGateway` | — | — | `200` [FinancialSectorGatewayDtoReturnResult](#financialsectorgatewaydtoreturnresult) | `200` 33 KB · user token, 2026-09-08 |

- **`GET /api/v1/Home/Trending`** — Retrieves a collection of trending programs, exams, events, and banners, and initiative. DGA-204: returns every matching item for each category (Programs, Exams, Events
marked IsTrending = true; all published banners; the full initiative menu; all
reports/studies) - no longer capped to a fixed number of cards per category.
- **`GET /api/v1/Home/EventsOverview`** — Retrieves everything needed to render the public Events Overview page
(`https://fa.gov.sa/services/events/overview`). Aggregates, and caches per culture, the sections shown on the MVC Events Overview
page (`~/Services/Events/Overview`) by reusing existing business logic:
<list type="bullet"><item><description>Upcoming events — `IEventService.GetUpcomingEventsAsync`</description></item><item><description>Featured events — `IEventService.GetFeaturedEventsAsync`</description></item><item><description>Events of the month — `IEventService.GetThisMonthEventsAsync`</description></item><item><description>Expert speakers — `IProgramService.GetThisMonthAllTrainers` (same source as `GET Home/Experts`)</description></item></list>
Localized titles/subtitles come from Ims.Shared.Localization.AppMainResources (the API is kept CMS-free,
consistent with the other Overview endpoints).
- **`GET /api/v1/Home/Calendar`** — Retrieves a list of scheduled programs and exams for display in a calendar view. This endpoint returns the top  scheduled programs and the top 10 scheduled exams
starting from the specified startDate (if provided). 
It is intended for use in calendar-based UIs to give users a quick overview of upcoming activities.
- **`GET /api/v1/Home/Calendar-Guest`** — Retrieves a list of scheduled events for display in a calendar view. This endpoint returns scheduled events starting from the current date if no date is provided.
- **`GET /api/v1/Home/InitiativeMenu`** — Retrieves the initiative menu including active and opening soon items.
- **`GET /api/v1/Home/TopMenu`** — Retrieves the complete website top-menu tree (the same business data the MVC
application renders), including programs, financial-sector programs, exams,
events, reports and studies, and initiatives. This endpoint is a thin API layer over the existing MVC business logic
`TopMenuService.GetTopMenuTree()` (resolved via Ims.Portal.Bll.Interfaces.Menu.IMenuService).
No menu logic is duplicated. Arabic/English content is selected automatically
from the `Accept-Language` request header (defaults to Arabic), exactly as in MVC.
- **`POST /api/v1/Home/contactus`** — Submits a contact request from the user. Example success response:
{
  "success": true,
  "result": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "mobileNumber": "1234567890",
    "job": "Developer",
    "subject": "Support",
    "message": "Help needed",
    "isSubmittedSuccessfully": true
  },
  "errors": []
}
            
Example error response:
{
  "success": false,
  "result": null,
  "errors": [ { "key": "Validation", "message": "Invalid input data." } ]
}
- **`GET /api/v1/Home/force-update`** — Checks if a force update is required and returns the app version from configuration.
- **`GET /api/v1/Home/about-us`** — Retrieves the About Us information, including contact details, social media links, and working hours.
- **`GET /api/v1/Home/report-and-study`** — Returns all reports and studies with language-based fields.
- **`GET /api/v1/Home/Experts`** — Returns the experts shown in the Home page "Experts Platform" (منصة الخبراء) section:
this month's (freelance) trainers, in the same order the website renders them. Reuses the existing business logic M:Ims.Portal.Bll.Interfaces.Training.IProgramService.GetThisMonthAllTrainers
(no repository query is duplicated). Only the public fields the system stores for this
source are exposed; there is no separate public "expert profile" store (see the details note).
- **`GET /api/v1/Home/FinancialSectorGateway`** — Retrieves the Financial Sector Gateway content as four categories: Training Programs,
Self Learning Programs, Knowledge Seminars, and Sector Experts Meetings. Mirrors the MVC `HomeController.GetFinancialSectorGatewayPrograms` business behavior:
programs are classified by package / training type, and the two seminar categories are
Events classified by package. View-only CMS content is intentionally not returned.

### IdentityCheckupDiagnostic

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity-test/registration/checkup/status` | — | — | `200` OK<br>`401` [ProblemDetails](#problemdetails)<br>`404` [ProblemDetails](#problemdetails)<br>`503` Service Unavailable<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |

### IdentityNafath

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/nafath/create-request` | — | [NafathCreateRequest](#nafathcreaterequest) | `200` OK |  |
| `POST` | `/api/v1/identity/nafath/check-status` | — | [NafathChallengeRequest](#nafathchallengerequest) | `200` OK |  |
| `POST` | `/api/v1/identity/nafath/get-person-data` | — | [NafathChallengeRequest](#nafathchallengerequest) | `200` OK |  |
| `POST` | `/api/v1/identity/nafath/token` | — | [NafathTokenRequest](#nafathtokenrequest) | `200` OK |  |
| `POST` | `/api/v1/identity/nafath/is-nafath-login` | — | [IsNafathLoginRequest](#isnafathloginrequest) | `200` OK |  |

- **`POST /api/v1/identity/nafath/create-request`** — Creates a generic Nafath challenge for the current Mobile compatibility flow.
- **`POST /api/v1/identity/nafath/check-status`** — Polls a generic Nafath login challenge and preserves the current Identity response.
- **`POST /api/v1/identity/nafath/get-person-data`** — Gets the current Identity registration model mapped from Nafath person data.
- **`POST /api/v1/identity/nafath/token`** — Preserves the current Identity Nafath token compatibility response.
- **`POST /api/v1/identity/nafath/is-nafath-login`** — Checks whether the current Identity account is eligible for Nafath login.

### IdentityPublicRegistration

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/registration/check-identity` | — | [RegistrationCheckIdentityRequest](#registrationcheckidentityrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/nafath/status` | — | [NafathRecoveryStatusRequest](#nafathrecoverystatusrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration` | — | [IndividualRegistrationRequest](#individualregistrationrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/confirm-email` | — | [ConfirmRegistrationEmailRequest](#confirmregistrationemailrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `GET` | `/api/v1/identity/registration/terms` | — | — | `200` OK<br>`404` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |

- **`POST /api/v1/identity/registration/check-identity`** — Checks registration identity format and required journey. Anonymous privacy-preserving operation. IdentityManagement decides validity, whether Nafath is required, and username behavior without revealing account existence.
- **`POST /api/v1/identity/registration/nafath/status`** — Polls the registration-specific Nafath challenge status. Returns Pending, Completed, Rejected, Expired, or Failed unchanged. Challenge initiation and person-data prefill remain external dependencies outside this batch.
- **`POST /api/v1/identity/registration`** — Creates an individual registration account. IdentityManagement owns all normalization, conditional validation, duplicate checks, password policy, claims, confirmation email, and FAST synchronization. Duplicate matches retain the generic anti-enumeration success response.
- **`POST /api/v1/identity/registration/confirm-email`** — Confirms a newly registered account's email address. Submit userId and opaque Base64Url code from the external client confirmation link exactly. IdentityManagement validates and applies the token.
- **`GET /api/v1/identity/registration/terms`** — Gets localized Terms and Conditions for registration. Read-only registration content. IdentityManagement selects the requested culture or Arabic fallback and reports the served culture.

### IdentityRecovery

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/recovery/forgot-password` | — | [ForgotPasswordRequest](#forgotpasswordrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/recovery/forgot-password/reset` | — | [ResetPasswordRequest](#resetpasswordrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/recovery/forgot-password/nafath/status` | — | [NafathRecoveryStatusRequest](#nafathrecoverystatusrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/recovery/forgot-password/reset/nafath` | — | [ResetPasswordNafathRequest](#resetpasswordnafathrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/recovery/forgot-username` | — | [ForgotUsernameRequest](#forgotusernamerequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |

- **`POST /api/v1/identity/recovery/forgot-password`** — Starts the email-based forgot-password flow. Anonymous anti-enumeration endpoint. The email field may contain an email, username, or phone number. IdentityManagement always returns its generic accepted response for matching and nonmatching accounts.
- **`POST /api/v1/identity/recovery/forgot-password/reset`** — Completes an email-link password reset. Submit userId and opaque code from the reset link unchanged. IdentityManagement owns token validation and password policy.
- **`POST /api/v1/identity/recovery/forgot-password/nafath/status`** — Polls a Nafath challenge for password recovery. One poll per request. Pending, Completed, Rejected, Expired, and Failed bodies come from IdentityManagement unchanged. Challenge initiation remains a separate dependency.
- **`POST /api/v1/identity/recovery/forgot-password/reset/nafath`** — Completes a Nafath-verified password reset. IdentityManagement independently verifies the transaction, resolves the account, and applies password policy. FAST performs transport only.
- **`POST /api/v1/identity/recovery/forgot-username`** — Requests username recovery by registered email address. Anonymous anti-enumeration endpoint. IdentityManagement returns the same generic accepted response whether or not an eligible account exists.

### IdentityRegistration

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/registration/checkup/status` | — | — | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`401` [ProblemDetails](#problemdetails)<br>`404` [ProblemDetails](#problemdetails)<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/checkup/username/update-to-identity` | — | — | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`401` [ProblemDetails](#problemdetails)<br>`403` [ProblemDetails](#problemdetails)<br>`404` [ProblemDetails](#problemdetails)<br>`409` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/checkup/identity/nafath/initiate` | — | — | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`401` [ProblemDetails](#problemdetails)<br>`403` [ProblemDetails](#problemdetails)<br>`404` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/checkup/identity/nafath/status` | — | [NafathIdentityVerificationPollRequest](#nafathidentityverificationpollrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`401` [ProblemDetails](#problemdetails)<br>`403` [ProblemDetails](#problemdetails)<br>`404` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/checkup/identity/change` | — | [ChangeRegistrationIdentityRequest](#changeregistrationidentityrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`401` [ProblemDetails](#problemdetails)<br>`403` [ProblemDetails](#problemdetails)<br>`404` [ProblemDetails](#problemdetails)<br>`409` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |

- **`POST /api/v1/identity/registration/checkup/status`** — Gets IdentityManagement's registration checkup status for the authenticated account. Mobile clients use this response to select the next checkup action. FAST does not calculate eligibility.
- **`POST /api/v1/identity/registration/checkup/username/update-to-identity`** — Updates the authenticated account username to its verified identity number. Mobile checkup operation. IdentityManagement determines eligibility and the target username.
- **`POST /api/v1/identity/registration/checkup/identity/nafath/initiate`** — Initiates Nafath verification for the authenticated account's current identity. Returns the challenge used by mobile clients. Identity values are resolved by IdentityManagement from the bearer token.
- **`POST /api/v1/identity/registration/checkup/identity/nafath/status`** — Polls and, when approved, completes Nafath identity verification. Mobile clients must preserve the opaque transactionId exactly. FAST does not decode or alter it.
- **`POST /api/v1/identity/registration/checkup/identity/change`** — Changes the registration identity for the authenticated account. Mobile checkup operation. All identity validation, eligibility, and duplicate detection remain in IdentityManagement.

### IdentityRegistrationEmail

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/registration/resend-confirmation-email` | — | — | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`401` [ProblemDetails](#problemdetails)<br>`403` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/change-email` | — | [ChangeRegistrationEmailRequest](#changeregistrationemailrequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`401` [ProblemDetails](#problemdetails)<br>`403` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/confirm-change-email` | — | [ConfirmRegistrationEmailChangeRequest](#confirmregistrationemailchangerequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/change-phone` | — | [ChangeRegistrationPhoneRequest](#changeregistrationphonerequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`401` [ProblemDetails](#problemdetails)<br>`403` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |
| `POST` | `/api/v1/identity/registration/confirm-change-phone` | — | [ConfirmRegistrationPhoneChangeRequest](#confirmregistrationphonechangerequest) | `200` OK<br>`400` [ProblemDetails](#problemdetails)<br>`401` [ProblemDetails](#problemdetails)<br>`403` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error<br>`502` Bad Gateway<br>`504` Gateway Timeout |  |

- **`POST /api/v1/identity/registration/resend-confirmation-email`** — Resends the authenticated account's registration confirmation email. Use after checkup status reports an unconfirmed email. IdentityManagement resolves the account from the bearer token and decides applicability.
- **`POST /api/v1/identity/registration/change-email`** — Starts changing the authenticated account's email address. Sends a confirmation link to the requested email. The current email remains unchanged until confirmation succeeds.
- **`POST /api/v1/identity/registration/confirm-change-email`** — Confirms a pending registration email change. Anonymous deep-link completion operation. Submit userId, email, and the opaque code exactly as supplied by the confirmation link.
- **`POST /api/v1/identity/registration/change-phone`** — Starts changing the authenticated account's phone number. Sends an OTP to the requested phone number. The current phone number remains unchanged until confirmation succeeds.
- **`POST /api/v1/identity/registration/confirm-change-phone`** — Confirms a pending registration phone number change for the authenticated account. Authenticated OTP confirmation. IdentityManagement resolves the account from the bearer token's subject and validates the code.

### IndividualLearningPath

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/IndividualLearningPath/Search` | — | [LearningPathFilterViewModel](#learningpathfilterviewmodel) | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/Details/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/{id}/competencies` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/{id}/certificates` | `id` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/IndividualLearningPath/chart/Cards` | `classificationId` *integer* | — | `200` OK |  |
| `POST` | `/api/v1/IndividualLearningPath/chart/CardData` | — | [LearningPathDashboardCardFilter](#learningpathdashboardcardfilter) | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/chart/Timeline` | `userId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/chart/completion-rate` | `userId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/chart/status-summary` | — | — | `200` OK |  |
| `GET` | `/api/v1/IndividualLearningPath/chart/program-status-summary` | — | — | `200` OK |  |

### Invitation

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Invitation/Invite` | — | [InviteUserViewModel[]](#inviteuserviewmodel) | `200` OK |  |
| `POST` | `/api/v1/Invitation/Resend` | — | [InviteUserViewModel](#inviteuserviewmodel) | `200` OK |  |
| `POST` | `/api/v1/Invitation/Revoke` | — | [InviteUserViewModel](#inviteuserviewmodel) | `200` OK |  |
| `POST` | `/api/v1/Invitation/User/Invites` | — | — | `200` OK |  |
| `POST` | `/api/v1/Invitation/Search` | — | [SearchInviteViewModel](#searchinviteviewmodel) | `200` OK |  |
| `POST` | `/api/v1/Invitation/Accept/{key}` | `key` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Invitation/Reject/{key}` | `key` *string* (required, path) | — | `200` OK |  |

### LearningGroup

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/LearningGroup/GetAll` | — | [LearningGroupFilterViewModel](#learninggroupfilterviewmodel) | `200` OK |  |
| `GET` | `/api/v1/LearningGroup/Detail` | `Id` *string*<br>`OrganizationId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/LearningGroup/ChangeStatus` | — | [UpdateLearningGroupStatusViewModel](#updatelearninggroupstatusviewmodel) | `200` OK |  |
| `POST` | `/api/v1/LearningGroup/Remove` | `organizationId` *string* | string[] | `200` OK |  |
| `POST` | `/api/v1/LearningGroup/Create` | — | object | `200` OK |  |
| `POST` | `/api/v1/LearningGroup/Edit/{id}` | `id` *string* (required, path) | object | `200` OK |  |

### LearningPath

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/LearningPath/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/Details/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath` | `orgId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath` | — | [CreateLearningPathViewModel](#createlearningpathviewmodel) | `200` OK |  |
| `DELETE` | `/api/v1/LearningPath` | `id` *string* | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/Cards` | `orgId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath/OverDueAssignments` | — | [OverDueAssignmentRequestViewModel](#overdueassignmentrequestviewmodel) | `200` OK |  |
| `POST` | `/api/v1/LearningPath/Search` | — | [OrgLearningPathFilterViewModel](#orglearningpathfilterviewmodel) | `200` OK |  |
| `POST` | `/api/v1/LearningPath/User/{userId}/Search` | `userId` *string* (required, path) | [OrgLearningPathFilterViewModel](#orglearningpathfilterviewmodel) | `200` OK |  |
| `POST` | `/api/v1/LearningPath/draft` | `id` *string* | [LearningPathViewModel](#learningpathviewmodel) | `200` OK |  |
| `POST` | `/api/v1/LearningPath/Clone/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath/ValidateBulkAssign/{learningPathId}/{orgId}` | `learningPathId` *string* (required, path)<br>`orgId` *string* (required, path) | object | `200` OK |  |
| `POST` | `/api/v1/LearningPath/{learningPathId}/assignlearners` | `learningPathId` *string* (required, path) | [AssignLearnersToLearningPathRequestModel](#assignlearnerstolearningpathrequestmodel) | `200` OK |  |
| `POST` | `/api/v1/LearningPath/{learningPathId}/UnAssign/{userId}` | `learningPathId` *string* (required, path)<br>`userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/OrganizationUsers` | `term` *string*<br>`organizationId` *string*<br>`LearningPathId` *string*<br>`pageNumber` *integer*<br>`pageSize` *integer* | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/assignees` | `name` *string*<br>`IsActive` *boolean*<br>`learningPathId` *string* (required, path)<br>`pageNumber` *integer*<br>`pageSize` *integer* | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/chart/completion-rate` | `orgId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/chart/activity` | `period` *ActivityPeriod*<br>`orgId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/chart/status-summary` | `orgId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath/update/{id}` | `id` *string* (required, path) | [LearningPathViewModel](#learningpathviewmodel) | `200` OK |  |
| `POST` | `/api/v1/LearningPath/{id}/status/{status}` | `id` *string* (required, path)<br>`status` *LearningPathStatus* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath/{learningPathId}/items/links/{itemId}/completed` | `learningPathId` *string* (required, path)<br>`itemId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/overall` | `learningPathId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/items/next` | `learningPathId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/countdown` | `learningPathId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/overdue` | `learningPathId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/averagetimetocomplete` | `learningPathId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/LearningPath/Assignee/Update` | — | [LearningPathAssigneeStatusViewModel](#learningpathassigneestatusviewmodel) | `200` OK |  |
| `POST` | `/api/v1/LearningPath/Assignee/History` | — | [LearningPathAssigneeHistoryRequestViewModel](#learningpathassigneehistoryrequestviewmodel) | `200` OK |  |

### Lookup

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Lookup/GetSectors` | — | — | `200` OK | `200` · service token (fast_test), 2026-10-06 |
| `GET` | `/api/v1/Lookup/GetTopics` | — | — | `200` OK |  |
| `GET` | `/api/v1/Lookup/GetCompetencyLevels` | — | — | `200` Returns the list of competency levels. |  |
| `GET` | `/api/v1/Lookup/GetAllEducationType` | — | — | `200` OK |  |
| `GET` | `/api/v1/Lookup/GetAllCountries` | — | — | `200` OK | `200` 15 KB · user token, 2026-09-08 |
| `GET` | `/api/v1/Lookup/GetCountries` | — | — | `200` [CountryRegistrationLookupDto[]](#countryregistrationlookupdto) | `200` · service token (fast_test), 2026-10-06<br>`200` 49 KB · user token, 2026-09-08 |
| `GET` | `/api/v1/Lookup/GetCountryById/{countryId}` | `countryId` *integer* (required, path) | — | `200` [CountryRegistrationLookupDto](#countryregistrationlookupdto)<br>`404` [ProblemDetails](#problemdetails) |  |
| `GET` | `/api/v1/Lookup/GetCountryByNafathMappingId/{nafathCountryId}` | `nafathCountryId` *integer* (required, path) | — | `200` [CountryRegistrationLookupDto](#countryregistrationlookupdto)<br>`404` [ProblemDetails](#problemdetails) |  |
| `GET` | `/api/v1/Lookup/GetCancellationReasons` | — | — | `200` Returns the list of cancellation reasons |  |
| `GET` | `/api/v1/Lookup/GetCancellationPolicy` | `type` *CancellationPolicyType* | — | `200` Returns the cancellation policy URL wrapped in the standard response envelope. |  |

- **`GET /api/v1/Lookup/GetCompetencyLevels`** — Retrieves the list of program competency levels used to populate the
"Competency Level" search filter (`FilterProgramDto.CompetencyLevelId`). Reuses M:Ims.Training.Bll.LookupsService.GetCompetencyLevels, the same
source the program search uses to resolve competency-level names, so the returned
`Value`s match the ids accepted by `POST api/v1/Program/Search`.
Values are localized based on the current request culture.
- **`GET /api/v1/Lookup/GetCountries`** — Returns the native FAST country and nationality data used by registration clients.
- **`GET /api/v1/Lookup/GetCountryById/{countryId}`** — Returns a native FAST country by its FAST identifier.
- **`GET /api/v1/Lookup/GetCountryByNafathMappingId/{nafathCountryId}`** — Returns a native FAST country by its IAM/Nafath mapping identifier.
- **`GET /api/v1/Lookup/GetCancellationReasons`** — Retrieves a list of cancellation reasons with both Arabic and English names. This endpoint returns all values from the Ims.Shared.Model.ReasonsList enum
with localized names based on the DisplayAttribute and SharedResources.
- **`GET /api/v1/Lookup/GetCancellationPolicy`** — Returns the cancellation policy URL for the requested policy type.

### MobileConfiguration

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/MobileConfiguration/is-mobile-nafath-enabled` | — | — | `200` OK |  |
| `GET` | `/api/v1/MobileConfiguration/mobile-force-update` | — | — | `200` OK |  |

- **`GET /api/v1/MobileConfiguration/is-mobile-nafath-enabled`** — Get current mobile configuration flag.
- **`GET /api/v1/MobileConfiguration/mobile-force-update`** — Checks if a force update is required and returns the app version from configuration.

### Mursion

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Mursion/GetDetails` | — | — | `200` [MursionDetailsDtoReturnResult](#mursiondetailsdtoreturnresult)<br>`404` [ProblemDetails](#problemdetails) | `200` 42 KB · user token, 2026-09-08 |
| `POST` | `/api/v1/Mursion/AddToCart` | — | — | `200` [MursionAddToCartResponseDtoReturnResult](#mursionaddtocartresponsedtoreturnresult)<br>`401` [ProblemDetails](#problemdetails)<br>`403` [ProblemDetails](#problemdetails)<br>`404` [ProblemDetails](#problemdetails) |  |
| `GET` | `/api/v1/Mursion/GetPostPaymentAction` | `billNumber` *string* | — | `200` [MursionPostPaymentActionDtoReturnResult](#mursionpostpaymentactiondtoreturnresult)<br>`400` [ProblemDetails](#problemdetails)<br>`401` [ProblemDetails](#problemdetails)<br>`404` [ProblemDetails](#problemdetails) |  |

### Notification

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/org/{orgId}` | `orgId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/org/{orgId}` | `orgId` *string* (required, path) | [NotificationPreferencesDto](#notificationpreferencesdto) | `200` OK |  |

### Orgnization

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Orgnization/RegisterOrganizationMembers` | — | object | `200` OK |  |
| `POST` | `/api/v1/Orgnization/BulkRegisterOrganizationMembers` | — | [OrgUserViewModel[]](#orguserviewmodel) | `200` OK |  |
| `POST` | `/api/v1/Orgnization/RemoveMember` | — | string[] | `200` OK |  |
| `POST` | `/api/v1/Orgnization/UpdateMember` | — | [UpdateUserRoleViewModel](#updateuserroleviewmodel) | `200` OK |  |
| `GET` | `/api/v1/Orgnization/GetOrganizationUsers` | `term` *string*<br>`pageNumber` *integer*<br>`pageSize` *integer*<br>`organizationId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Orgnization/Roles` | — | — | `200` OK |  |
| `GET` | `/api/v1/Orgnization/Roles/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Orgnization/GetOrganisationsPartners` | `pageSize` *integer*<br>`pageNumber` *integer* | — | `200` [OrganizationPartnerModelIPagedListReturnResult](#organizationpartnermodelipagedlistreturnresult) |  |
| `POST` | `/api/v1/Orgnization/EnableDisablePartnerOrg` | — | [OrganizationPartnerModel](#organizationpartnermodel) | `200` [BooleanReturnResult](#booleanreturnresult) |  |

### Payment

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Payment/CheckPaymentComplish` | `billNumber` *string* | — | `200` [BooleanReturnResult](#booleanreturnresult)<br>`500` Internal Server Error |  |
| `POST` | `/api/v1/Payment/Checkout` | `couponCode` *string*<br>`returnUrl` *string* | — | `200` [CheckoutResponseApiDtoReturnResult](#checkoutresponseapidtoreturnresult)<br>`500` Internal Server Error |  |
| `POST` | `/api/v1/Payment/PayLater` | — | [PayLaterRequestDto](#paylaterrequestdto) | `200` [PayLaterBillDtoApiResponse](#paylaterbilldtoapiresponse) |  |
| `GET` | `/api/v1/Payment/PayLater/{billNumber}` | `billNumber` *string* (required, path) | — | `200` [PayLaterBillDtoApiResponse](#paylaterbilldtoapiresponse) |  |
| `GET` | `/api/v1/Payment/Bills` | — | — | `200` [UserBillsListDtoListReturnResult](#userbillslistdtolistreturnresult)<br>`500` Internal Server Error |  |
| `POST` | `/api/v1/Payment/Search/Bills` | — | [BillsRequestDto](#billsrequestdto) | `200` [UserBillsListDtoListReturnResult](#userbillslistdtolistreturnresult)<br>`500` Internal Server Error |  |
| `GET` | `/api/v1/Payment/GetCouponValue` | `couponCode` *string* | — | `200` [CouponResponseDtoApiResponse](#couponresponsedtoapiresponse)<br>`400` [ProblemDetails](#problemdetails) |  |
| `GET` | `/api/v1/Payment/export-invoice-pdf/{trxId}` | `trxId` *string* (required, path) | — | `200` Returns the generated PDF file of the invoice.<br>`400` [ProblemDetails](#problemdetails)<br>`500` If an internal server error occurred during export.<br>`404` If the invoice data could not be found for the given transaction ID. |  |

- **`POST /api/v1/Payment/Checkout`** — Checks out the current user's cart and returns the payment (Moyasar) checkout URL.
- **`POST /api/v1/Payment/PayLater`** — Confirms an organization "Pay Later" request and creates its SADAD bill, for the seat vouchers in the current
user's cart (`PaymentModules = Voucher`) or an organization wallet deposit (`PaymentModules = Wallet`).
Same business operation as the Web `Payment/ConfirmPayLater` (Ims.Main.Bll.Services.PayLater.Interface.IOrganizationPayLaterService).
The payment is confirmed later by the existing SADAD notification processing; use GET PayLater/{billNumber} for its status.
- **`GET /api/v1/Payment/PayLater/{billNumber}`** — Gets an organization pay-later bill and its current payment state, as persisted by our system
(updated by the existing SADAD notification processing; SADAD itself is not called).
Only admins/coordinators of the organization that owns the bill can read it.
- **`GET /api/v1/Payment/GetCouponValue`** — Retrieves the discount value associated with a given coupon code.
- **`GET /api/v1/Payment/export-invoice-pdf/{trxId}`** — Exports the invoice associated with the specified transaction ID to a PDF file.

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
| `POST` | `/api/v1/Player/SelfLearning/SaveQuestionAnswer` | — | [AddEvalutionSelfLearningViewModel](#addevalutionselflearningviewmodel) | `200` OK |  |
| `GET` | `/api/v1/Player/Training/SelfLearning/PreExam/StartExam/{programId}` | `programId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Player/Training/SelfLearning/PreExam/PreExam/FinishExam/{programId}` | `programId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Player/Training/SelfLearning/PreExam/SaveQuestionAnswer` | — | [SavePrePostQuestionAnswer](#saveprepostquestionanswer) | `200` OK |  |
| `GET` | `/api/v1/Player/Training/SelfLearning/PostExam/StartExam/{programId}` | `programId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Player/Training/SelfLearning/PostExam/FinishExam/{programId}` | `programId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Player/Training/SelfLearning/PostExam/SaveQuestionAnswer` | — | [SavePrePostQuestionAnswer](#saveprepostquestionanswer) | `200` OK |  |
| `POST` | `/api/v1/Player/Training/EnableAdaptiveLearning` | — | [EnableAdaptiveLearningViewModel](#enableadaptivelearningviewmodel) | `200` OK |  |

### PrePostAssesment

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/PrePostAssesment/GetPrePost` | — | — | `200` OK |  |
| `GET` | `/api/v1/PrePostAssesment/DeltaScore` | — | — | `200` OK |  |

### Program

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Program/Search` | — | [FilterProgramDto](#filterprogramdto) | `200` OK | `200` · service token (fast_test), 2026-10-06<br>`200` · anonymous, 2026-10-06 |
| `GET` | `/api/v1/Program/GetProgramType` | `programId` *string* | — | `200` [ProgramDtoReturnResult](#programdtoreturnresult) |  |
| `GET` | `/api/v1/Program/GetTrendingPrograms` | — | — | `200` OK | `200` 21 KB · user token, 2026-09-08 |
| `GET` | `/api/v1/Program/GetDigitalInteractiveTools` | — | — | `200` OK |  |
| `GET` | `/api/v1/Program/TrainingTopics` | `pageNumber` *integer*<br>`pageSize` *integer* | — | `200` [TrainingTopicsPageDtoReturnResult](#trainingtopicspagedtoreturnresult) | `200` 18 KB · user token, 2026-09-08 |
| `GET` | `/api/v1/Program/GetAttendaceTypes` | — | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramParticipantLevels` | — | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramDetails` | `programId` *string* | — | `200` [ProgramDetailsDtoReturnResult](#programdetailsdtoreturnresult)<br>`404` [ProblemDetails](#problemdetails)<br>`500` Internal Server Error |  |
| `GET` | `/api/v1/Program/GetProgramDetailsHeader` | `programId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramLiveSessions` | `programId` *string* | — | `200` OK | `200` · service token (fast_test), 2026-10-06 |
| `GET` | `/api/v1/Program/GetProgramAgenda` | `programId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetPlansByProgramId` | `programId` *string* | — | `200` OK | `200` · service token (fast_test), 2026-10-06 |
| `GET` | `/api/v1/Program/GetLanguages` | — | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramPeriods` | — | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramPrice` | — | — | `200` OK |  |
| `POST` | `/api/v1/Program/AddToCart` | — | [RegistrationSubmitApiDto](#registrationsubmitapidto) | `200` OK |  |
| `POST` | `/api/v1/Program/cancel-reservation` | — | [CancelReservationViewModel](#cancelreservationviewmodel) | `200` [BooleanReturnResult](#booleanreturnresult) |  |
| `POST` | `/api/v1/Program/program-reschedule` | — | [RescheduleDto](#rescheduledto) | `200` [RescheduleResponseDtoReturnResult](#rescheduleresponsedtoreturnresult) |  |
| `POST` | `/api/v1/Program/AddUserInterestInProgram` | `programId` *string* | — | `200` [ObjectReturnResultApiResponse](#objectreturnresultapiresponse)<br>`400` [ProblemDetails](#problemdetails) |  |
| `GET` | `/api/v1/Program/GetProgramPlanTakers` | — | — | `200` OK | `200` · service token (fast_test), 2026-10-06 |
| `POST` | `/api/v1/Program/MyPrograms` | — | [MyProgramSearchCriteria](#myprogramsearchcriteria) | `200` OK |  |
| `POST` | `/api/v1/Program/chart/Cards` | `classificationId` *integer* | — | `200` OK |  |
| `POST` | `/api/v1/Program/chart/CardData` | — | [LearningPathDashboardCardFilter](#learningpathdashboardcardfilter) | `200` OK |  |
| `GET` | `/api/v1/Program/GetProgramCardInfo` | `programId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Program/GetTimeLineChartData` | `programId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Program/{id}/competencies` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Program/Overview` | — | — | `200` [ProgramsOverviewDtoReturnResult](#programsoverviewdtoreturnresult) | `200` 52 KB · user token, 2026-09-08 |

- **`POST /api/v1/Program/Search`** — *Live:* paged: totalItems=270, pageSize is capped at 100 (asked 200, got 100); some programmes have appointmentDateText «الموعد غير محدد» (no date set); body `{}` returned 12 programmes; same result with the service token.
- **`GET /api/v1/Program/TrainingTopics`** — Returns the complete data rendered by the public Training Topics page
(`/Services/Topics/Training`), including each topic's displayed programs,
image URLs and existing website navigation URLs.
- **`GET /api/v1/Program/GetProgramParticipantLevels`** — Lookup for the "Participant Level" (target audience) search filter.
Returns the values accepted by `FilterProgramDto.ProgramParticipantLevelIds`
on `POST Search`.
- **`GET /api/v1/Program/GetProgramDetails`** — Full program details as rendered on the program details page: descriptive content, topics,
location, lessons count, pricing, nearest plan, registration requirements, related programs
and suggested certificates.
- **`GET /api/v1/Program/GetProgramLiveSessions`** — *Live:* no token or a forged token → HTTP 401 «Unauthorized access. Please provide a valid token.» from the auth middleware; the fast_test service token → HTTP 200 with success=false «Unauthorized» from the controller. So the token AUTHENTICATES and is refused at authorization (token carries a client_role claim; the endpoint presumably needs a user or a role the client lacks).
- **`GET /api/v1/Program/GetPlansByProgramId`** — Retrieves plans associated with a given program ID. *Live:* also 200 anonymously per Program/Search; a missing programId returns success=false with a NullReferenceException message.
- **`POST /api/v1/Program/AddToCart`** — Adds a registration to the cart after processing requirements.
- **`POST /api/v1/Program/cancel-reservation`** — Cancels a reservation and triggers refund process.
- **`POST /api/v1/Program/program-reschedule`** — Reschedules a reservation to a new plan.
- **`POST /api/v1/Program/AddUserInterestInProgram`** — Adds the current user's interest in a specific training program.
- **`GET /api/v1/Program/GetProgramPlanTakers`** — *Live:* success=true, 0 items — takes no programId, so it is scoped to the caller; the service principal has no plans.
- **`GET /api/v1/Program/Overview`** — Returns the domain data required to render the public Programs Overview page
(https://fa.gov.sa/Services/Programsoverview) in a single response: main categories,
featured programs, programs of the month (All/Individuals/Organizations tabs),
self-learning programs and the experts platform. CMS-authored content (section titles/subtitles, button links and the "Featured Topics" cards)
is intentionally not included and continues to be served by the CMS to the client, so this
endpoint takes no CMS/GraphQL dependency. Section page sizes mirror the MVC overview action.

### QualificationsEducation

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-education` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/qualifications-education` | — | object | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-education/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-education/delete/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |

- **`GET /api/qualifications-education`** — Retrieves a list of educational qualifications for the currently logged-in user.
- **`POST /api/qualifications-education`** — Saves a new or existing qualification education record for the current user.
Supports file upload via multipart/form-data.
- **`GET /api/qualifications-education/{id}`** — Retrieves a specific qualification by ID, or returns an empty record for new entry.
- **`GET /api/qualifications-education/delete/{id}`** — Deletes a qualification education record by its ID.

### QualificationsPracticalExperience

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-practical-experience` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/qualifications-practical-experience` | — | [CreateOrUpdatePracticalExperienceDto](#createorupdatepracticalexperiencedto) | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-practical-experience/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-practical-experience/delete/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |

- **`GET /api/qualifications-practical-experience`** — Retrieves a list of practical experience qualifications for the current user.
- **`POST /api/qualifications-practical-experience`** — Saves a new or existing qualification practical experience record for the current user.
- **`GET /api/qualifications-practical-experience/{id}`** — Retrieves a specific practical experience qualification by ID, or returns an empty record for new entry.
- **`GET /api/qualifications-practical-experience/delete/{id}`** — Deletes a qualifications practical experience record by its ID.

### QualificationsProfessional

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-professional` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/qualifications-professional` | — | object | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-professional/{id}` | `professionalCertificationId` *string*<br>`id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/qualifications-professional/delete/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |

- **`GET /api/qualifications-professional`** — Gets all professional certifications for the current user.
- **`POST /api/qualifications-professional`** — Saves a new or existing professional certification for the current user.
- **`GET /api/qualifications-professional/{id}`** — Retrieves a specific professional certification by ID for the current user.
If no ID is provided, returns an empty initialized object for form population.
- **`POST /api/qualifications-professional/delete/{id}`** — Deletes a professional certification by its ID for the current user.

### QualificationsTrainingCourses

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-training-courses` | `isInSideFA` *boolean* | — | `200` [ApiResponse](#apiresponse) |  |
| `POST` | `/api/qualifications-training-courses` | — | [CreateTrainingCourseApiDto](#createtrainingcourseapidto) | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-training-courses/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/qualifications-training-courses/delete/{id}` | `id` *string* (required, path) | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/training-courses/programs` | `title` *string* | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/training-courses/sectors` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/training-courses/levels` | — | — | `200` [ApiResponse](#apiresponse) | `200` · service token (fast_test), 2026-10-06 |
| `GET` | `/api/training-courses/location-types` | — | — | `200` [ApiResponse](#apiresponse) |  |

- **`GET /api/qualifications-training-courses`** — Retrieves a list of training courses for the currently authenticated user.
- **`POST /api/qualifications-training-courses`** — Creates or updates a training course qualification for the current user.
- **`GET /api/qualifications-training-courses/{id}`** — Retrieves a specific training course qualification for the current user.
If the ID is null, returns an empty record for creation.
- **`GET /api/qualifications-training-courses/delete/{id}`** — Deletes a training course qualification record.
- **`GET /api/training-courses/programs`** — Searches programs used for dropdown selection.
- **`GET /api/training-courses/sectors`** — Retrieves the list of sectors used for dropdown selection
when creating or editing training courses.
- **`GET /api/training-courses/levels`** — Retrieves the list of training course levels.
- **`GET /api/training-courses/location-types`** — Retrieves the location options for training courses
(Inside FA or Outside FA).

### Reports

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Reports/GetAll` | — | [ReportGetAllQueryModel](#reportgetallquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Reports/GetMicroLearningOrgAdmin` | — | [GetMicroLearningOrgAdminQueryModel](#getmicrolearningorgadminquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Reports/GetMicroLearningLearner` | — | [GetTimeLineQueryModel](#gettimelinequerymodel) | `200` OK |  |
| `GET` | `/api/v1/Reports/GetPerformanceLearner/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/GetPerformanceOrgAdmin/{OrgId}` | `OrgId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Reports/GetRegulators` | — | [GetRegulatorQueryModel](#getregulatorquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Reports/GetLearningTimeLinePerProgram` | — | [GetTimeLineQueryModel](#gettimelinequerymodel) | `200` OK |  |
| `GET` | `/api/v1/Reports/GetLearningDeltaScore/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/GetOrgDeltaScore/{OrgId}` | `OrgId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/GetLearnerHeapMap` | — | — | `200` OK |  |
| `GET` | `/api/v1/Reports/GetOrgHeapMap` | — | — | `200` OK |  |
| `POST` | `/api/v1/Reports/AvailablePrograms` | — | [GetOrganizationProgramQuertFilter](#getorganizationprogramquertfilter) | `200` OK |  |
| `POST` | `/api/v1/Reports/AvailableLearnersProgram` | — | [GetOrganizationProgramUsersQueryFilter](#getorganizationprogramusersqueryfilter) | `200` OK |  |
| `POST` | `/api/v1/Reports/OrgCharts` | — | [BuildOrgChartQueryModel](#buildorgchartquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Reports/GetMicroLearningOrgAdminEngagedRate` | — | [GetMicroLearningOrgAdminEngagedRateQueryModel](#getmicrolearningorgadminengagedratequerymodel) | `200` OK |  |
| `POST` | `/api/v1/Reports/LearnerCharts` | — | [BuildLearnerChartQueryModel](#buildlearnerchartquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Reports/GetMicroLearningUserEngagedRate` | — | [GetTimeLineQueryModel](#gettimelinequerymodel) | `200` OK |  |
| `POST` | `/api/v1/Reports/GetDeltaScoreUserEngagedRate/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/OrgAdminEvents/{OrgId}` | `OrgId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/LearnerEvents/{UserId}` | `UserId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/OrganizationPrograms/{OrgId}` | `OrgId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/LearnerPrograms/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/LearnerPreAssesmentVsPostAssesment/{userId}` | `userId` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/Reports/OrgPreAssesmentVsPostAssesment/{OrgId}` | `OrgId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Reports/ValidateOrganizationProgramData` | — | [ValidateOrganizationProgramDataQueryModel](#validateorganizationprogramdataquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Reports/GetOrganizationUserLearningReportData` | — | [UserLearningReportQueryModel](#userlearningreportquerymodel) | `200` OK |  |
| `POST` | `/api/v1/Reports/GetOrganizationExecutiveSummaryReportData` | — | [OrganizationExecutiveSummaryReportQueryModel](#organizationexecutivesummaryreportquerymodel) | `200` OK |  |

### Search

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Search` | `searchText` *string*<br>`pageSize` *integer* | — | `200` [SearchResultsDtoReturnResult](#searchresultsdtoreturnresult) |  |

- **`GET /api/v1/Search`** — Searches Programs, Exams, and Events by searchText and returns all
three collections plus their counts in one response, so the frontend can render the
All/Programs/Exams/Events tabs without additional calls - the same shape of data the
MVC Search page fetches (one page per type, no per-tab re-query).

### TrackingRequest

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/TrackingRequest/Search` | — | [FilterUserRequestDto](#filteruserrequestdto) | `200` OK |  |
| `GET` | `/api/v1/TrackingRequest/Lookups` | — | — | `200` OK |  |
| `GET` | `/api/v1/TrackingRequest/Details` | `userRequestId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/TrackingRequest/ExamException` | — | object | `200` OK |  |
| `PUT` | `/api/v1/TrackingRequest/ExamException/Cancel` | `userRequestId` *string* | — | `200` OK |  |

- **`POST /api/v1/TrackingRequest/Search`** — Paged list of the current user's requests (same data as Dashboard MyRequests).
- **`GET /api/v1/TrackingRequest/Lookups`** — Request-type and status options for filters (replaces ViewBag on the MVC MyRequests page).
- **`GET /api/v1/TrackingRequest/Details`** — Details for a single user request (e.g. Order line items), scoped to the current user.

### TrainerContracts

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/TrainerContracts/trainer-contracts` | — | — | `200` [ApiResponse](#apiresponse) |  |
| `GET` | `/api/v1/TrainerContracts/trainer-contracts/Download` | `contractId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/TrainerContracts/trainer-contracts/backfill/generate` | `contractId` *string*<br>`X-Backfill-ApiKey` *string* (header) | — | `200` OK |  |
| `POST` | `/api/v1/TrainerContracts/trainer-contracts/Approve` | — | [UpdateContractViewModel](#updatecontractviewmodel) | `200` OK |  |
| `POST` | `/api/v1/TrainerContracts/trainer-contracts/Refuse` | — | [UpdateContractViewModel](#updatecontractviewmodel) | `200` OK |  |

- **`GET /api/v1/TrainerContracts/trainer-contracts`** — Retrieves all trainer contracts associated with the currently authenticated user. This endpoint filters contracts based on the current user's profile identifier.
- **`GET /api/v1/TrainerContracts/trainer-contracts/Download`** — Generates the trainer contract PDF, stores it on CDN when missing, and returns the file for download.
- **`POST /api/v1/TrainerContracts/trainer-contracts/backfill/generate`** — Generates and persists a trainer contract agreement for system backfill (no JWT; API key required).

### UserCertificate

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/UserCertificate/{userCertificateId}/GetOrGenerateUserCertificateCdnUrl` | `userCertificateId` *string* (required, path) | — | `200` OK |  |

### Users

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Users/Info` | — | — | `200` OK | `200` 5.2 KB · user token, 2026-09-08 |
| `GET` | `/api/v1/Users/Roles` | — | — | `200` OK |  |
| `GET` | `/api/v1/Users/GetOrganizationUsers` | `term` *string*<br>`page` *integer*<br>`organizationId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/Users/{userId}/Info` | `userId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/Users/User/LeaveOrg` | `id` *string* | — | `200` OK |  |
| `POST` | `/api/v1/Users/ChangeTheme` | — | [ChangeUserProfileThemeCommand](#changeuserprofilethemecommand) | `200` OK |  |
| `POST` | `/api/v1/Users/Photo` | — | object | `200` [StringApiResponse](#stringapiresponse)<br>`400` Missing file or the file is not a supported image. |  |
| `POST` | `/api/v1/Users/DeletePhoto` | — | — | `200` [ObjectApiResponse](#objectapiresponse) |  |
| `POST` | `/api/v1/Users/AddUserFavorite` | — | [AddUserFavoriteRequest](#adduserfavoriterequest) | `200` OK |  |
| `GET` | `/api/v1/Users/GetUserFavorites` | — | — | `200` OK |  |
| `POST` | `/api/v1/Users/RemoveFavorite/{id}` | `id` *string* (required, path)<br>`paymentModuleId` *integer* | — | `200` OK |  |

- **`GET /api/v1/Users/Roles`** — Returns the current authenticated user's switchable role assignments
(Individual/Trainer/OrganizationAdmin/OrganizationCoordinator), for React to determine
which dashboard options to display. Reuses the same source as the existing Web
dashboard-switcher UI (Framework.Core.Contracts.IUsersService.CurrentUserRolesForNewPortal).
- **`POST /api/v1/Users/Photo`** — Updates the profile photo of the currently logged-in user.
Reuses M:Ims.Portal.Bll.Interfaces.UserProfile.IUserProfileService.UploadProfileImage(Microsoft.AspNetCore.Http.IFormFile,System.Guid) which performs all business
validation (file signature / allowed content types), uploads the image to the CDN
(project-standard Blob flow) and stores the CDN URL on `UserProfile.ProfileImagePath`.
The controller only checks that a non-empty file was sent.
- **`POST /api/v1/Users/DeletePhoto`** — Deletes the profile photo of the currently logged-in user.
Reuses M:Ims.Portal.Bll.Interfaces.UserProfile.IUserProfileService.DeleteProfileImage(System.Guid). Succeeds even when the user
has no profile photo.
- **`POST /api/v1/Users/AddUserFavorite`** — Adds a new item to user favorites.
- **`GET /api/v1/Users/GetUserFavorites`** — Retrieves the current user's favorite items.
- **`POST /api/v1/Users/RemoveFavorite/{id}`** — Removes an item from user favorites.

### WorkSpace

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `POST` | `/api/v1/WorkSpace/ReceiveWebhook` | — | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/Organization/{id}` | `X-Provider` *WorkSpaceProvider* (header)<br>`id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/workspace-courses` | `provider` *WorkSpaceProvider* (required)<br>`userId` *string* | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/workspace-cards/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/workspace-cards-learner/{id}` | `id` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/workspace-learners` | — | [WorkSpaceLearnerRequestModel](#workspacelearnerrequestmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/SearchPrograms` | — | [WorkSpaceProgramsFilterViewModel](#workspaceprogramsfilterviewmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/WorkSpaceProgramCount` | — | [WorkSpaceProgramsFilterViewModel](#workspaceprogramsfilterviewmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/Users` | — | [WorkSpaceAssignedUsersFilterViewModel](#workspaceassignedusersfilterviewmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Users/SearchPrograms` | — | [WorkSpaceUserProgramsFilterViewModel](#workspaceuserprogramsfilterviewmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/MyPrograms` | — | [WorkSpaceUserProgramsFilterViewModel](#workspaceuserprogramsfilterviewmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/Update/Status` | — | [WorkSpaceEnrollementStatusViewModel](#workspaceenrollementstatusviewmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/Status/SearchUsers` | — | [OrgUsersProgramEnrollementFilterViewModel](#orgusersprogramenrollementfilterviewmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/Users/program/Validate` | — | [EnrollUserToProgramViewModel](#enrollusertoprogramviewmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/Users/Program` | — | [EnrollUserToProgramViewModel](#enrollusertoprogramviewmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/BulkUsers/Program/{Provider}/{OrgId}/{ProgramId}/{EnrollementStatus}/{DueDate}` | `Provider` *WorkSpaceProvider* (required, path)<br>`OrgId` *string* (required, path)<br>`ProgramId` *string* (required, path)<br>`EnrollementStatus` *EnrollementStatus* (required, path)<br>`DueDate` *datetime* (required, path) | object | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Enrollement/ValidateBulkUsers/Program/{Provider}/{OrgId}/{ProgramId}` | `Provider` *WorkSpaceProvider* (required, path)<br>`OrgId` *string* (required, path)<br>`ProgramId` *string* (required, path)<br>`EnrollementStatus` *EnrollementStatus* (required, path)<br>`DueDate` *datetime* (required, path) | object | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/activate-deActivate-license` | — | [ManageLicenceRequest](#managelicencerequest) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/OrgAdmin/GetRequestAccess` | — | [WorkSpaceLicenseFilterRequestsViewModel](#workspacelicensefilterrequestsviewmodel) | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/OrgAdmin/GetPendingRequestCount/{organizationId}/{status}` | `organizationId` *string* (required, path)<br>`status` *LicenceRequestStatus* (required, path) | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpace/OrgAdmin/GetRequestAccessHistory/{requestId}` | `requestId` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/OrgAdmin/ApproveRejectRequestAccess/{requestId}/{isApproved}` | `requestId` *string* (required, path)<br>`isApproved` *boolean* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/individual/RequestAccessLicense` | `workSpaceProvider` *WorkSpaceProvider* | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/individual/RequestAccessLicenseReminder` | `requestId` *string* | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/WorkSpaceUserProgress` | — | [WorkSpaceLearnerProgressRequestModel](#workspacelearnerprogressrequestmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/WorkSpaceUserProgress/{userId}` | `userId` *string* (required, path) | [WorkSpaceUserProgressRequestModel](#workspaceuserprogressrequestmodel) | `200` OK |  |
| `POST` | `/api/v1/WorkSpace/Users/Courses` | — | [WorkSpaceUserCoursesFilterViewModel](#workspaceusercoursesfilterviewmodel) | `200` OK |  |

### WorkSpaces

| Method | Path | Parameters | Accepts | Returns | Live |
|---|---|---|---|---|---|
| `GET` | `/api/v1/WorkSpaces` | — | — | `200` OK |  |
| `GET` | `/api/v1/WorkSpaces/Classification/FA/{scope}` | `scope` *string* (required, path) | — | `200` OK |  |
| `POST` | `/api/v1/WorkSpaces/Classification/FA/programs/{scope}` | `scope` *string* (required, path) | [WorkspaceProgramsRequest](#workspaceprogramsrequest) | `200` OK |  |

## 5. Return bodies

The response payload of every operation that declares one, expanded field by field. Each heading lists the operations that return it.

### ApiResponse — full response body

Returned by: `GET /api/v1/AlmentorCourseCatalogue/GetAllLearnsProgress`, `GET /api/v1/AlmentorCourseCatalogue/GetProgramProgess`, `POST /api/v1/AlmentorCourseCatalogue/MyPrograms`, `POST /api/v1/DashBoard/MyPrograms`, `POST /api/v1/DashBoard/MySelfLearningPrograms`, `POST /api/v1/DashBoard/MyExams`, `POST /api/v1/DashBoard/MyEvents`, `POST /api/v1/DashBoard/AddUserRate`, `GET /api/v1/DashBoard/ProgramEndWithExam`, `GET /api/qualifications-education`, `POST /api/qualifications-education`, `GET /api/qualifications-education/{id}`, `GET /api/qualifications-education/delete/{id}`, `GET /api/qualifications-practical-experience`, `POST /api/qualifications-practical-experience`, `GET /api/qualifications-practical-experience/{id}`, `GET /api/qualifications-practical-experience/delete/{id}`, `GET /api/qualifications-professional`, `POST /api/qualifications-professional`, `GET /api/qualifications-professional/{id}`, `POST /api/qualifications-professional/delete/{id}`, `GET /api/qualifications-training-courses`, `POST /api/qualifications-training-courses`, `GET /api/qualifications-training-courses/{id}`, `GET /api/qualifications-training-courses/delete/{id}`, `GET /api/training-courses/programs`, `GET /api/training-courses/sectors`, `GET /api/training-courses/levels`, `GET /api/training-courses/location-types`, `GET /api/v1/TrainerContracts/trainer-contracts`

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
  - `trackingEvent` — string
  - `isUsedZatkaLayout` — boolean
  - `refCode` — string
  - `issueDate` — datetime
  - `organizationCart` — object
  - `walletCartInfo` — WalletCartInfo
    - `balance` — number
    - `enable` — boolean
    - `show` — boolean
  - `hasIndividualRegistration` — boolean
  - `numberOfItems` — integer
  - `currentUserId` — string
  - `allowedTaxInvoices` — boolean
  - `organizationId` — string
  - `paymentOptions` — CartPaymentOptionViewModel[]
    - `paymentOption` — CartPaymentOption
    - `isAvailable` — boolean
    - `paymentMethods` — CartPaymentMethodOptionViewModel[]
      - `paymentMethod` — PaymentMethodEnum
      - `isAvailable` — boolean
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
        - `exam` — Exam
        - `targetAudience` — TargetAudienceType
        - `profileSetting` — ProfileSetting
        - `attemptConfiscationProfiles` — AttemptConfiscationProfile[]
        - `attemptObjections` — AttemptObjection[]
        - `attemptSuspensions` — AttemptSuspension[]
        - `attempts` — Attempt[]
        - `examReservations` — ExamReservation[]
        - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `profileFolders` — ProfileFolder[]
        - `profileOwners` — ProfileOwner[]
        - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[]
        - `questionsPriorities` — QuestionsPriority[]
        - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[]
        - `trialExams` — TrialExam[]
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
        - `exam` — Exam
        - `targetAudience` — TargetAudienceType
        - `profileSetting` — ProfileSetting
        - `attemptConfiscationProfiles` — AttemptConfiscationProfile[]
        - `attemptObjections` — AttemptObjection[]
        - `attemptSuspensions` — AttemptSuspension[]
        - `attempts` — Attempt[]
        - `examReservations` — ExamReservation[]
        - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `profileFolders` — ProfileFolder[]
        - `profileOwners` — ProfileOwner[]
        - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[]
        - `questionsPriorities` — QuestionsPriority[]
        - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[]
        - `trialExams` — TrialExam[]
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
      - `exam` — Exam
        - `id` — string
        - `code` — string
        - `nameAr` — string
        - `nameEn` — string
        - `newLearningMaterialLink` — string
        - `newLearningMaterialNote` — string
        - `descriptionAr` — string
        - `descriptionEn` — string
        - `marketingDescriptionAr` — string
        - `marketingDescriptionEn` — string
        - `fees` — number
        - `maxNumberOfTries` — integer
        - `maxTriesBeforeCourseRequired` — integer
        - `courseId` — string
        - `trialResetType` — integer
        - `isDraft` — boolean
        - `targetCategories` — string
        - `targetCategoriesEn` — string
        - `additionalPrerequisites` — string
        - `additionalPrerequisitesEn` — string
        - `competenciesTextAr` — string
        - `competenciesTextEn` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `applyVAT` — boolean
        - `isCollectInDynamics` — boolean
        - `isCollectInDynamicsAsSeats` — boolean
        - `competencyLevelId` — integer
        - `mandated` — boolean
        - `centerCategoryId` — string
        - `enableBundleFeature` — boolean
        - `isTrending` — boolean
        - `imageUrl` — string
        - `examDiscountTypes` — ExamDiscountType[]
        - `examSectors` — ExamSector[]
        - `prerequisiteCourses` — PrerequisiteCourse[]
        - `prerequisiteExamExams` — PrerequisiteExam[]
        - `prerequisiteExamPrerequisiteExamNavigations` — PrerequisiteExam[]
        - `profiles` — Profile[]
        - `retries` — Retry[]
        - `examJobFamilies` — ExamJobFamily[]
        - `examCompetecies` — ExamCompetecie[]
        - `examAcquiredSkills` — ExamAcquiredSkill[]
        - `examTopics` — ExamTopic[]
        - `userRate` — number
        - `numberOfUserRates` — integer
        - `relatedProgramId` — string
        - `searchKeywords` — string
      - `targetAudience` — TargetAudienceType
        - `id` — integer
        - `nameAr` — string
        - `nameEn` — string
        - `profiles` — Profile[]
      - `profileSetting` — ProfileSetting
        - `id` — string
        - `showIntroPage` — boolean
        - `showSuccessPrerequisite` — boolean
        - `showNumberOfQuestions` — boolean
        - `showExamDuration` — boolean
        - `showRemainingDuration` — boolean
        - `notifyUserBeforeEndOfExam` — boolean
        - `notifyUserBeforeEndOfExamDuration` — integer
        - `allowCommentPerQuestion` — boolean
        - `allowCommentForExam` — boolean
        - `showExamResultAsStatus` — boolean
        - `showTotalCompetenciesResult` — boolean
        - `showResultPerCompetency` — boolean
        - `isSurveyMandatory` — boolean
        - `showExamReport` — boolean
        - `hasCertificate` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `idNavigation` — Profile
      - `attemptConfiscationProfiles` — AttemptConfiscationProfile[]
        - `id` — string
        - `examTakerAttemptConfiscationId` — string
        - `profileId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `examTakerAttemptConfiscation` — AttemptConfiscation
        - `profile` — Profile
      - `attemptObjections` — AttemptObjection[]
        - `id` — string
        - `objectionNumber` — string
        - `attempId` — string
        - `examTakerId` — string
        - `profileId` — string
        - `objectionReasonId` — integer
        - `otherObjectonReason` — string
        - `objectionText` — string
        - `isFeesPaid` — boolean
        - `examReviewerUserId` — string
        - `isObjectionValid` — boolean
        - `isClosed` — boolean
        - `isQuestionNeedModify` — boolean
        - `isExaminerScoreNeedModify` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `objectionStatusId` — integer
        - `attemp` — Attempt
        - `examTaker` — ExamTaker
        - `objectionReason` — ObjectionReason
        - `profile` — Profile
        - `attemptObjectionAttachments` — AttemptObjectionAttachment[]
      - `attemptSuspensions` — AttemptSuspension[]
        - `id` — string
        - `attemptId` — string
        - `examTakerId` — string
        - `testingCenterId` — string
        - `profileId` — string
        - `suspensionReasonId` — integer
        - `otherSuspensionReason` — string
        - `suspensionText` — string
        - `suspendedBy` — string
        - `suspendedOn` — datetime
        - `suspensionCommitteeDecisionId` — integer
        - `minutesOfCommitteeAttachmentId` — string
        - `isClosed` — boolean
        - `isStopped` — boolean
        - `suspensionStatusId` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `attempt` — Attempt
        - `examTaker` — ExamTaker
        - `minutesOfCommitteeAttachment` — Attachment
        - `profile` — Profile
        - `suspensionCommitteeDecision` — SuspensionCommitteeDecision
        - `suspensionReason` — SuspensionReason
        - `attemptSuspensionAttachments` — AttemptSuspensionAttachment[]
      - `attempts` — Attempt[]
        - `id` — string
        - `examReservationId` — string
        - `attemptNumber` — integer
        - `date` — datetime
        - `examLoginUserName` — string
        - `examLoginPassword` — string
        - `isAbsent` — boolean
        - `profileId` — string
        - `examTakerId` — string
        - `examResultStatusId` — integer
        - `isCanceled` — boolean
        - `cancelDate` — datetime
        - `cancelBillNumber` — string
        - `isRescheduled` — boolean
        - `rescheduleNumber` — integer
        - `rescheduleBillNumber` — boolean
        - `isRetry` — boolean
        - `isSuspended` — boolean
        - `isClosed` — boolean
        - `totalScore` — number
        - `totalMCQScore` — number
        - `totalScoreBeforeObjectionModification` — number
        - `isPassed` — boolean
        - `isPassedAfterObjection` — boolean
        - `isCertificateIssued` — boolean
        - `actualFromTime` — string
        - `actualToTime` — string
        - `hasObjectionRequest` — boolean
        - `commentOnExam` — string
        - `certificateId` — string
        - `eligibilityIDPortal` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `execuseRequestComments` — string
        - `isGradeSentToLMS` — boolean
        - `isNewDateSyncedWithDynamic` — boolean
        - `examReservation` — ExamReservation
        - `examResultStatus` — ExamResultStatus
        - `examTaker` — ExamTaker
        - `profile` — Profile
        - `attemptConfiscations` — AttemptConfiscation[]
        - `attemptFolderScores` — AttemptFolderScore[]
        - `attemptObjections` — AttemptObjection[]
        - `attemptQuestions` — AttemptQuestion[]
        - `attemptSuspensions` — AttemptSuspension[]
      - `examReservations` — ExamReservation[]
        - `id` — string
        - `testCenterScheduleDayPeriodId` — string
        - `testingCenterId` — string
        - `profileId` — string
        - `examTakerId` — string
        - `examDate` — datetime
        - `stateTime` — string
        - `endTime` — string
        - `duration` — integer
        - `statusId` — integer
        - `isExamTakerReplaced` — boolean
        - `originalExamTakerId` — string
        - `reservationId` — integer
        - `reservationDate` — string
        - `certificateDate` — datetime
        - `paymentPendingStartTime` — datetime
        - `reservedByAdmin` — boolean
        - `allowedForOneMoreReschedule` — boolean
        - `isExamGenerated` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `parent` — ExamReservation
        - `parentId` — string
        - `organizationId` — string
        - `reservedById` — string
        - `confirmationMailSent` — boolean
        - `cartId` — string
        - `lmsReservationDate` — datetime
        - `lmsReservationId` — string
        - `bundleId` — string
        - `bundleReservationId` — string
        - `reasonId` — ReasonsList
        - `reasonDescription` — string
        - `isSentToMTM` — boolean
        - `examTaker` — ExamTaker
        - `profile` — Profile
        - `status` — ExamReservationStatus
        - `testCenterScheduleDayPeriod` — TestCenterScheduleDayPeriod
        - `attempts` — Attempt[]
        - `inverseParent` — ExamReservation[]
        - `excuseRequests` — ExcuseRequest[]
        - `voucherNumber` — string
        - `licenceType` — integer
      - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `id` — string
        - `profileFolderId` — string
        - `profileId` — string
        - `folderId` — string
        - `questionId` — string
        - `questionScore` — integer
        - `isPinned` — boolean
        - `isConfirmed` — boolean
        - `questionOrder` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `profile` — Profile
        - `profileFolder` — ProfileFolder
        - `question` — Question
      - `profileFolders` — ProfileFolder[]
        - `id` — string
        - `profileId` — string
        - `folderId` — string
        - `parentFolderId` — string
        - `folderWeight` — integer
        - `folderOrder` — integer
        - `isConfirmed` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `parentFolder` — Folder
        - `profile` — Profile
        - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `folderName` — string
      - `profileOwners` — ProfileOwner[]
        - `id` — string
        - `profileId` — string
        - `ownerId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
      - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[]
        - `id` — string
        - `profileId` — string
        - `testingCenterId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
      - `questionsPriorities` — QuestionsPriority[]
        - `id` — string
        - `questionId` — string
        - `profileId` — string
        - `folderId` — string
        - `usedFrequency` — integer
        - `lastUsedOn` — datetime
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `profile` — Profile
        - `question` — Question
      - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[]
        - `id` — string
        - `testCenterScheduleDayPeriodSpecializationId` — string
        - `profileId` — string
        - `noOfSeats` — integer
        - `noOfReservations` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
        - `testCenterScheduleDayPeriodSpecialization` — TestCenterScheduleDayPeriodSpecialization
      - `trialExams` — TrialExam[]
        - `id` — string
        - `profileId` — string
        - `maxNoOfSeats` — integer
        - `fees` — number
        - `isActive` — boolean
        - `isCancelled` — boolean
        - `statusId` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
        - `trialExamInvitedOrganizations` — TrialExamInvitedOrganization[]
        - `nameAr` — string
        - `nameEn` — string
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

Returned by: `GET /api/v1/Lookup/GetCountryById/{countryId}`, `GET /api/v1/Lookup/GetCountryByNafathMappingId/{nafathCountryId}`

- `id` — integer
- `nameAr` — string
- `nameEn` — string
- `nationalityAr` — string
- `nationalityEn` — string
- `countryCode` — string
- `nafathMappingCode` — integer
- `isRestricted` — boolean

### CountryRegistrationLookupDto[] — full response body

Returned by: `GET /api/v1/Lookup/GetCountries`

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
      - `eventEnded` — boolean
      - `isRegistrationClosed` — boolean
      - `registrationStatusMessage` — string
      - `isRegistered` — boolean
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
      - `eventEnded` — boolean
      - `isRegistrationClosed` — boolean
      - `registrationStatusMessage` — string
      - `isRegistered` — boolean
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
      - `eventEnded` — boolean
      - `isRegistrationClosed` — boolean
      - `registrationStatusMessage` — string
      - `isRegistered` — boolean
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
    - `eventEnded` — boolean
    - `isRegistrationClosed` — boolean
    - `registrationStatusMessage` — string
    - `isRegistered` — boolean
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
    - `eventEnded` — boolean
    - `isRegistrationClosed` — boolean
    - `registrationStatusMessage` — string
    - `isRegistered` — boolean
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

### LearningInitiativeDtoReturnResult — full response body

Returned by: `GET /api/v1/FinancialAwareness/LearningInitiative`

- `errors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `isValid` — boolean
- `value` — LearningInitiativeDto
  - `isLoggedIn` — boolean
  - `awarenessUnits` — LearningInitiativeUnitDto[]
    - `id` — string
    - `initiativeId` — string
    - `name` — string
    - `shortDescription` — string
    - `requiredTimeInMinutes` — integer
    - `thumbnailUrl` — string
    - `initiativeLogoUrl` — string
    - `isCompleted` — boolean
    - `status` — string
  - `learningPaths` — LearningInitiativePathDto[]
    - `id` — string
    - `initiativeId` — string
    - `name` — string
    - `summary` — string
    - `thumbnailUrl` — string
    - `initiativeLogoUrl` — string
    - `unitsCount` — integer
    - `completedUnitsCount` — integer
    - `units` — LearningInitiativePathUnitDto[]
      - `unitId` — string
      - `name` — string
      - `requiredTimeInMinutes` — integer
      - `displayOrder` — integer
- `message` — string

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
      - `exam` — Exam
        - `id` — string
        - `code` — string
        - `nameAr` — string
        - `nameEn` — string
        - `newLearningMaterialLink` — string
        - `newLearningMaterialNote` — string
        - `descriptionAr` — string
        - `descriptionEn` — string
        - `marketingDescriptionAr` — string
        - `marketingDescriptionEn` — string
        - `fees` — number
        - `maxNumberOfTries` — integer
        - `maxTriesBeforeCourseRequired` — integer
        - `courseId` — string
        - `trialResetType` — integer
        - `isDraft` — boolean
        - `targetCategories` — string
        - `targetCategoriesEn` — string
        - `additionalPrerequisites` — string
        - `additionalPrerequisitesEn` — string
        - `competenciesTextAr` — string
        - `competenciesTextEn` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `applyVAT` — boolean
        - `isCollectInDynamics` — boolean
        - `isCollectInDynamicsAsSeats` — boolean
        - `competencyLevelId` — integer
        - `mandated` — boolean
        - `centerCategoryId` — string
        - `enableBundleFeature` — boolean
        - `isTrending` — boolean
        - `imageUrl` — string
        - `examDiscountTypes` — ExamDiscountType[]
        - `examSectors` — ExamSector[]
        - `prerequisiteCourses` — PrerequisiteCourse[]
        - `prerequisiteExamExams` — PrerequisiteExam[]
        - `prerequisiteExamPrerequisiteExamNavigations` — PrerequisiteExam[]
        - `profiles` — Profile[]
        - `retries` — Retry[]
        - `examJobFamilies` — ExamJobFamily[]
        - `examCompetecies` — ExamCompetecie[]
        - `examAcquiredSkills` — ExamAcquiredSkill[]
        - `examTopics` — ExamTopic[]
        - `userRate` — number
        - `numberOfUserRates` — integer
        - `relatedProgramId` — string
        - `searchKeywords` — string
      - `targetAudience` — TargetAudienceType
        - `id` — integer
        - `nameAr` — string
        - `nameEn` — string
        - `profiles` — Profile[]
      - `profileSetting` — ProfileSetting
        - `id` — string
        - `showIntroPage` — boolean
        - `showSuccessPrerequisite` — boolean
        - `showNumberOfQuestions` — boolean
        - `showExamDuration` — boolean
        - `showRemainingDuration` — boolean
        - `notifyUserBeforeEndOfExam` — boolean
        - `notifyUserBeforeEndOfExamDuration` — integer
        - `allowCommentPerQuestion` — boolean
        - `allowCommentForExam` — boolean
        - `showExamResultAsStatus` — boolean
        - `showTotalCompetenciesResult` — boolean
        - `showResultPerCompetency` — boolean
        - `isSurveyMandatory` — boolean
        - `showExamReport` — boolean
        - `hasCertificate` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `idNavigation` — Profile
      - `attemptConfiscationProfiles` — AttemptConfiscationProfile[]
        - `id` — string
        - `examTakerAttemptConfiscationId` — string
        - `profileId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `examTakerAttemptConfiscation` — AttemptConfiscation
        - `profile` — Profile
      - `attemptObjections` — AttemptObjection[]
        - `id` — string
        - `objectionNumber` — string
        - `attempId` — string
        - `examTakerId` — string
        - `profileId` — string
        - `objectionReasonId` — integer
        - `otherObjectonReason` — string
        - `objectionText` — string
        - `isFeesPaid` — boolean
        - `examReviewerUserId` — string
        - `isObjectionValid` — boolean
        - `isClosed` — boolean
        - `isQuestionNeedModify` — boolean
        - `isExaminerScoreNeedModify` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `objectionStatusId` — integer
        - `attemp` — Attempt
        - `examTaker` — ExamTaker
        - `objectionReason` — ObjectionReason
        - `profile` — Profile
        - `attemptObjectionAttachments` — AttemptObjectionAttachment[]
      - `attemptSuspensions` — AttemptSuspension[]
        - `id` — string
        - `attemptId` — string
        - `examTakerId` — string
        - `testingCenterId` — string
        - `profileId` — string
        - `suspensionReasonId` — integer
        - `otherSuspensionReason` — string
        - `suspensionText` — string
        - `suspendedBy` — string
        - `suspendedOn` — datetime
        - `suspensionCommitteeDecisionId` — integer
        - `minutesOfCommitteeAttachmentId` — string
        - `isClosed` — boolean
        - `isStopped` — boolean
        - `suspensionStatusId` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `attempt` — Attempt
        - `examTaker` — ExamTaker
        - `minutesOfCommitteeAttachment` — Attachment
        - `profile` — Profile
        - `suspensionCommitteeDecision` — SuspensionCommitteeDecision
        - `suspensionReason` — SuspensionReason
        - `attemptSuspensionAttachments` — AttemptSuspensionAttachment[]
      - `attempts` — Attempt[]
        - `id` — string
        - `examReservationId` — string
        - `attemptNumber` — integer
        - `date` — datetime
        - `examLoginUserName` — string
        - `examLoginPassword` — string
        - `isAbsent` — boolean
        - `profileId` — string
        - `examTakerId` — string
        - `examResultStatusId` — integer
        - `isCanceled` — boolean
        - `cancelDate` — datetime
        - `cancelBillNumber` — string
        - `isRescheduled` — boolean
        - `rescheduleNumber` — integer
        - `rescheduleBillNumber` — boolean
        - `isRetry` — boolean
        - `isSuspended` — boolean
        - `isClosed` — boolean
        - `totalScore` — number
        - `totalMCQScore` — number
        - `totalScoreBeforeObjectionModification` — number
        - `isPassed` — boolean
        - `isPassedAfterObjection` — boolean
        - `isCertificateIssued` — boolean
        - `actualFromTime` — string
        - `actualToTime` — string
        - `hasObjectionRequest` — boolean
        - `commentOnExam` — string
        - `certificateId` — string
        - `eligibilityIDPortal` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `execuseRequestComments` — string
        - `isGradeSentToLMS` — boolean
        - `isNewDateSyncedWithDynamic` — boolean
        - `examReservation` — ExamReservation
        - `examResultStatus` — ExamResultStatus
        - `examTaker` — ExamTaker
        - `profile` — Profile
        - `attemptConfiscations` — AttemptConfiscation[]
        - `attemptFolderScores` — AttemptFolderScore[]
        - `attemptObjections` — AttemptObjection[]
        - `attemptQuestions` — AttemptQuestion[]
        - `attemptSuspensions` — AttemptSuspension[]
      - `examReservations` — ExamReservation[]
        - `id` — string
        - `testCenterScheduleDayPeriodId` — string
        - `testingCenterId` — string
        - `profileId` — string
        - `examTakerId` — string
        - `examDate` — datetime
        - `stateTime` — string
        - `endTime` — string
        - `duration` — integer
        - `statusId` — integer
        - `isExamTakerReplaced` — boolean
        - `originalExamTakerId` — string
        - `reservationId` — integer
        - `reservationDate` — string
        - `certificateDate` — datetime
        - `paymentPendingStartTime` — datetime
        - `reservedByAdmin` — boolean
        - `allowedForOneMoreReschedule` — boolean
        - `isExamGenerated` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `parent` — ExamReservation
        - `parentId` — string
        - `organizationId` — string
        - `reservedById` — string
        - `confirmationMailSent` — boolean
        - `cartId` — string
        - `lmsReservationDate` — datetime
        - `lmsReservationId` — string
        - `bundleId` — string
        - `bundleReservationId` — string
        - `reasonId` — ReasonsList
        - `reasonDescription` — string
        - `isSentToMTM` — boolean
        - `examTaker` — ExamTaker
        - `profile` — Profile
        - `status` — ExamReservationStatus
        - `testCenterScheduleDayPeriod` — TestCenterScheduleDayPeriod
        - `attempts` — Attempt[]
        - `inverseParent` — ExamReservation[]
        - `excuseRequests` — ExcuseRequest[]
        - `voucherNumber` — string
        - `licenceType` — integer
      - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `id` — string
        - `profileFolderId` — string
        - `profileId` — string
        - `folderId` — string
        - `questionId` — string
        - `questionScore` — integer
        - `isPinned` — boolean
        - `isConfirmed` — boolean
        - `questionOrder` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `profile` — Profile
        - `profileFolder` — ProfileFolder
        - `question` — Question
      - `profileFolders` — ProfileFolder[]
        - `id` — string
        - `profileId` — string
        - `folderId` — string
        - `parentFolderId` — string
        - `folderWeight` — integer
        - `folderOrder` — integer
        - `isConfirmed` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `parentFolder` — Folder
        - `profile` — Profile
        - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `folderName` — string
      - `profileOwners` — ProfileOwner[]
        - `id` — string
        - `profileId` — string
        - `ownerId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
      - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[]
        - `id` — string
        - `profileId` — string
        - `testingCenterId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
      - `questionsPriorities` — QuestionsPriority[]
        - `id` — string
        - `questionId` — string
        - `profileId` — string
        - `folderId` — string
        - `usedFrequency` — integer
        - `lastUsedOn` — datetime
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `profile` — Profile
        - `question` — Question
      - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[]
        - `id` — string
        - `testCenterScheduleDayPeriodSpecializationId` — string
        - `profileId` — string
        - `noOfSeats` — integer
        - `noOfReservations` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
        - `testCenterScheduleDayPeriodSpecialization` — TestCenterScheduleDayPeriodSpecialization
      - `trialExams` — TrialExam[]
        - `id` — string
        - `profileId` — string
        - `maxNoOfSeats` — integer
        - `fees` — number
        - `isActive` — boolean
        - `isCancelled` — boolean
        - `statusId` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
        - `trialExamInvitedOrganizations` — TrialExamInvitedOrganization[]
        - `nameAr` — string
        - `nameEn` — string
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

### ObjectApiResponse — full response body

Returned by: `POST /api/v1/Users/DeletePhoto`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — object
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

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

### PayLaterBillDtoApiResponse — full response body

Returned by: `POST /api/v1/Payment/PayLater`, `GET /api/v1/Payment/PayLater/{billNumber}`

- `confirm` — boolean
- `message` — string
- `modelStateErrors` — Item[]
  - `name` — string
  - `value` — string
  - `count` — integer
- `success` — boolean
- `value` — PayLaterBillDto
  - `billNumber` — string
  - `paymentModules` — PaymentModules
  - `amount` — number
  - `isTaxInvoice` — boolean
  - `issueDate` — datetime
  - `isCreatedInSadad` — boolean
  - `status` — PaymentRequestStatus
  - `paymentMethod` — PaymentRequestMethodEnum
  - `paymentRefId` — string
  - `paymentDate` — datetime
- `totalItems` — integer
- `pageSize` — integer
- `pageNumber` — integer

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
  - `registrationRequestStatus` — RegistrationStatus
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
      - `dataSource` — CheckItem[]
        - `id` — string
        - `alternativeId` — string
        - `info` — string
        - `infoMinValue` — integer
        - `infoMaxValue` — integer
        - `name` — string
        - `type` — CheckListItemType
        - `subItems` — CheckItem[]
        - `isSaved` — boolean
        - `supportedOperations` — CheckListTreeOperations
        - `isCheckBox` — boolean
        - `makeItemLinkable` — boolean
        - `linkUrl` — string
        - `makeRadioButtonGroupingOnAllLevels` — boolean
        - `hasSelectionControl` — boolean
        - `columns` — CheckListColumn[]
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
    - `dataTypeId` — RequirementDataTypes
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
      - `contentType` — SiteContentType
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
      - `exam` — Exam
        - `id` — string
        - `code` — string
        - `nameAr` — string
        - `nameEn` — string
        - `newLearningMaterialLink` — string
        - `newLearningMaterialNote` — string
        - `descriptionAr` — string
        - `descriptionEn` — string
        - `marketingDescriptionAr` — string
        - `marketingDescriptionEn` — string
        - `fees` — number
        - `maxNumberOfTries` — integer
        - `maxTriesBeforeCourseRequired` — integer
        - `courseId` — string
        - `trialResetType` — integer
        - `isDraft` — boolean
        - `targetCategories` — string
        - `targetCategoriesEn` — string
        - `additionalPrerequisites` — string
        - `additionalPrerequisitesEn` — string
        - `competenciesTextAr` — string
        - `competenciesTextEn` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `applyVAT` — boolean
        - `isCollectInDynamics` — boolean
        - `isCollectInDynamicsAsSeats` — boolean
        - `competencyLevelId` — integer
        - `mandated` — boolean
        - `centerCategoryId` — string
        - `enableBundleFeature` — boolean
        - `isTrending` — boolean
        - `imageUrl` — string
        - `examDiscountTypes` — ExamDiscountType[]
        - `examSectors` — ExamSector[]
        - `prerequisiteCourses` — PrerequisiteCourse[]
        - `prerequisiteExamExams` — PrerequisiteExam[]
        - `prerequisiteExamPrerequisiteExamNavigations` — PrerequisiteExam[]
        - `profiles` — Profile[]
        - `retries` — Retry[]
        - `examJobFamilies` — ExamJobFamily[]
        - `examCompetecies` — ExamCompetecie[]
        - `examAcquiredSkills` — ExamAcquiredSkill[]
        - `examTopics` — ExamTopic[]
        - `userRate` — number
        - `numberOfUserRates` — integer
        - `relatedProgramId` — string
        - `searchKeywords` — string
      - `targetAudience` — TargetAudienceType
        - `id` — integer
        - `nameAr` — string
        - `nameEn` — string
        - `profiles` — Profile[]
      - `profileSetting` — ProfileSetting
        - `id` — string
        - `showIntroPage` — boolean
        - `showSuccessPrerequisite` — boolean
        - `showNumberOfQuestions` — boolean
        - `showExamDuration` — boolean
        - `showRemainingDuration` — boolean
        - `notifyUserBeforeEndOfExam` — boolean
        - `notifyUserBeforeEndOfExamDuration` — integer
        - `allowCommentPerQuestion` — boolean
        - `allowCommentForExam` — boolean
        - `showExamResultAsStatus` — boolean
        - `showTotalCompetenciesResult` — boolean
        - `showResultPerCompetency` — boolean
        - `isSurveyMandatory` — boolean
        - `showExamReport` — boolean
        - `hasCertificate` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `idNavigation` — Profile
      - `attemptConfiscationProfiles` — AttemptConfiscationProfile[]
        - `id` — string
        - `examTakerAttemptConfiscationId` — string
        - `profileId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `examTakerAttemptConfiscation` — AttemptConfiscation
        - `profile` — Profile
      - `attemptObjections` — AttemptObjection[]
        - `id` — string
        - `objectionNumber` — string
        - `attempId` — string
        - `examTakerId` — string
        - `profileId` — string
        - `objectionReasonId` — integer
        - `otherObjectonReason` — string
        - `objectionText` — string
        - `isFeesPaid` — boolean
        - `examReviewerUserId` — string
        - `isObjectionValid` — boolean
        - `isClosed` — boolean
        - `isQuestionNeedModify` — boolean
        - `isExaminerScoreNeedModify` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `objectionStatusId` — integer
        - `attemp` — Attempt
        - `examTaker` — ExamTaker
        - `objectionReason` — ObjectionReason
        - `profile` — Profile
        - `attemptObjectionAttachments` — AttemptObjectionAttachment[]
      - `attemptSuspensions` — AttemptSuspension[]
        - `id` — string
        - `attemptId` — string
        - `examTakerId` — string
        - `testingCenterId` — string
        - `profileId` — string
        - `suspensionReasonId` — integer
        - `otherSuspensionReason` — string
        - `suspensionText` — string
        - `suspendedBy` — string
        - `suspendedOn` — datetime
        - `suspensionCommitteeDecisionId` — integer
        - `minutesOfCommitteeAttachmentId` — string
        - `isClosed` — boolean
        - `isStopped` — boolean
        - `suspensionStatusId` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `attempt` — Attempt
        - `examTaker` — ExamTaker
        - `minutesOfCommitteeAttachment` — Attachment
        - `profile` — Profile
        - `suspensionCommitteeDecision` — SuspensionCommitteeDecision
        - `suspensionReason` — SuspensionReason
        - `attemptSuspensionAttachments` — AttemptSuspensionAttachment[]
      - `attempts` — Attempt[]
        - `id` — string
        - `examReservationId` — string
        - `attemptNumber` — integer
        - `date` — datetime
        - `examLoginUserName` — string
        - `examLoginPassword` — string
        - `isAbsent` — boolean
        - `profileId` — string
        - `examTakerId` — string
        - `examResultStatusId` — integer
        - `isCanceled` — boolean
        - `cancelDate` — datetime
        - `cancelBillNumber` — string
        - `isRescheduled` — boolean
        - `rescheduleNumber` — integer
        - `rescheduleBillNumber` — boolean
        - `isRetry` — boolean
        - `isSuspended` — boolean
        - `isClosed` — boolean
        - `totalScore` — number
        - `totalMCQScore` — number
        - `totalScoreBeforeObjectionModification` — number
        - `isPassed` — boolean
        - `isPassedAfterObjection` — boolean
        - `isCertificateIssued` — boolean
        - `actualFromTime` — string
        - `actualToTime` — string
        - `hasObjectionRequest` — boolean
        - `commentOnExam` — string
        - `certificateId` — string
        - `eligibilityIDPortal` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `execuseRequestComments` — string
        - `isGradeSentToLMS` — boolean
        - `isNewDateSyncedWithDynamic` — boolean
        - `examReservation` — ExamReservation
        - `examResultStatus` — ExamResultStatus
        - `examTaker` — ExamTaker
        - `profile` — Profile
        - `attemptConfiscations` — AttemptConfiscation[]
        - `attemptFolderScores` — AttemptFolderScore[]
        - `attemptObjections` — AttemptObjection[]
        - `attemptQuestions` — AttemptQuestion[]
        - `attemptSuspensions` — AttemptSuspension[]
      - `examReservations` — ExamReservation[]
        - `id` — string
        - `testCenterScheduleDayPeriodId` — string
        - `testingCenterId` — string
        - `profileId` — string
        - `examTakerId` — string
        - `examDate` — datetime
        - `stateTime` — string
        - `endTime` — string
        - `duration` — integer
        - `statusId` — integer
        - `isExamTakerReplaced` — boolean
        - `originalExamTakerId` — string
        - `reservationId` — integer
        - `reservationDate` — string
        - `certificateDate` — datetime
        - `paymentPendingStartTime` — datetime
        - `reservedByAdmin` — boolean
        - `allowedForOneMoreReschedule` — boolean
        - `isExamGenerated` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `parent` — ExamReservation
        - `parentId` — string
        - `organizationId` — string
        - `reservedById` — string
        - `confirmationMailSent` — boolean
        - `cartId` — string
        - `lmsReservationDate` — datetime
        - `lmsReservationId` — string
        - `bundleId` — string
        - `bundleReservationId` — string
        - `reasonId` — ReasonsList
        - `reasonDescription` — string
        - `isSentToMTM` — boolean
        - `examTaker` — ExamTaker
        - `profile` — Profile
        - `status` — ExamReservationStatus
        - `testCenterScheduleDayPeriod` — TestCenterScheduleDayPeriod
        - `attempts` — Attempt[]
        - `inverseParent` — ExamReservation[]
        - `excuseRequests` — ExcuseRequest[]
        - `voucherNumber` — string
        - `licenceType` — integer
      - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `id` — string
        - `profileFolderId` — string
        - `profileId` — string
        - `folderId` — string
        - `questionId` — string
        - `questionScore` — integer
        - `isPinned` — boolean
        - `isConfirmed` — boolean
        - `questionOrder` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `profile` — Profile
        - `profileFolder` — ProfileFolder
        - `question` — Question
      - `profileFolders` — ProfileFolder[]
        - `id` — string
        - `profileId` — string
        - `folderId` — string
        - `parentFolderId` — string
        - `folderWeight` — integer
        - `folderOrder` — integer
        - `isConfirmed` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `parentFolder` — Folder
        - `profile` — Profile
        - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `folderName` — string
      - `profileOwners` — ProfileOwner[]
        - `id` — string
        - `profileId` — string
        - `ownerId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
      - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[]
        - `id` — string
        - `profileId` — string
        - `testingCenterId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
      - `questionsPriorities` — QuestionsPriority[]
        - `id` — string
        - `questionId` — string
        - `profileId` — string
        - `folderId` — string
        - `usedFrequency` — integer
        - `lastUsedOn` — datetime
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `profile` — Profile
        - `question` — Question
      - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[]
        - `id` — string
        - `testCenterScheduleDayPeriodSpecializationId` — string
        - `profileId` — string
        - `noOfSeats` — integer
        - `noOfReservations` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
        - `testCenterScheduleDayPeriodSpecialization` — TestCenterScheduleDayPeriodSpecialization
      - `trialExams` — TrialExam[]
        - `id` — string
        - `profileId` — string
        - `maxNoOfSeats` — integer
        - `fees` — number
        - `isActive` — boolean
        - `isCancelled` — boolean
        - `statusId` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
        - `trialExamInvitedOrganizations` — TrialExamInvitedOrganization[]
        - `nameAr` — string
        - `nameEn` — string
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
  - `lastActionDate` — datetime
  - `completedUnits` — integer
  - `totalUnits` — integer
  - `completionPercentage` — number
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
  - `numberOfExamQuestions` — integer
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
  - `profileOwners` — string
  - `reservationStatus` — string
  - `reservationStatusEnum` — ReservationStatus
  - `reservationDate` — string
  - `reservationType` — ModuleType
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
    - `attachmentUrl` — string
    - `attachmentFileName` — string
    - `adminDecisionReason` — string
    - `requestNumber` — string
    - `excuseType` — string
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
  - `eligibilityExamDetailsUrl` — string
  - `examRegisterLinkText` — string
  - `examEligibilityStatus` — string
  - `educationalMaterials` — ReservationMaterialItemDto[]
    - `name` — string
    - `url` — string
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
      - `exam` — Exam
        - `id` — string
        - `code` — string
        - `nameAr` — string
        - `nameEn` — string
        - `newLearningMaterialLink` — string
        - `newLearningMaterialNote` — string
        - `descriptionAr` — string
        - `descriptionEn` — string
        - `marketingDescriptionAr` — string
        - `marketingDescriptionEn` — string
        - `fees` — number
        - `maxNumberOfTries` — integer
        - `maxTriesBeforeCourseRequired` — integer
        - `courseId` — string
        - `trialResetType` — integer
        - `isDraft` — boolean
        - `targetCategories` — string
        - `targetCategoriesEn` — string
        - `additionalPrerequisites` — string
        - `additionalPrerequisitesEn` — string
        - `competenciesTextAr` — string
        - `competenciesTextEn` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `applyVAT` — boolean
        - `isCollectInDynamics` — boolean
        - `isCollectInDynamicsAsSeats` — boolean
        - `competencyLevelId` — integer
        - `mandated` — boolean
        - `centerCategoryId` — string
        - `enableBundleFeature` — boolean
        - `isTrending` — boolean
        - `imageUrl` — string
        - `examDiscountTypes` — ExamDiscountType[]
        - `examSectors` — ExamSector[]
        - `prerequisiteCourses` — PrerequisiteCourse[]
        - `prerequisiteExamExams` — PrerequisiteExam[]
        - `prerequisiteExamPrerequisiteExamNavigations` — PrerequisiteExam[]
        - `profiles` — Profile[]
        - `retries` — Retry[]
        - `examJobFamilies` — ExamJobFamily[]
        - `examCompetecies` — ExamCompetecie[]
        - `examAcquiredSkills` — ExamAcquiredSkill[]
        - `examTopics` — ExamTopic[]
        - `userRate` — number
        - `numberOfUserRates` — integer
        - `relatedProgramId` — string
        - `searchKeywords` — string
      - `targetAudience` — TargetAudienceType
        - `id` — integer
        - `nameAr` — string
        - `nameEn` — string
        - `profiles` — Profile[]
      - `profileSetting` — ProfileSetting
        - `id` — string
        - `showIntroPage` — boolean
        - `showSuccessPrerequisite` — boolean
        - `showNumberOfQuestions` — boolean
        - `showExamDuration` — boolean
        - `showRemainingDuration` — boolean
        - `notifyUserBeforeEndOfExam` — boolean
        - `notifyUserBeforeEndOfExamDuration` — integer
        - `allowCommentPerQuestion` — boolean
        - `allowCommentForExam` — boolean
        - `showExamResultAsStatus` — boolean
        - `showTotalCompetenciesResult` — boolean
        - `showResultPerCompetency` — boolean
        - `isSurveyMandatory` — boolean
        - `showExamReport` — boolean
        - `hasCertificate` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `idNavigation` — Profile
      - `attemptConfiscationProfiles` — AttemptConfiscationProfile[]
        - `id` — string
        - `examTakerAttemptConfiscationId` — string
        - `profileId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `examTakerAttemptConfiscation` — AttemptConfiscation
        - `profile` — Profile
      - `attemptObjections` — AttemptObjection[]
        - `id` — string
        - `objectionNumber` — string
        - `attempId` — string
        - `examTakerId` — string
        - `profileId` — string
        - `objectionReasonId` — integer
        - `otherObjectonReason` — string
        - `objectionText` — string
        - `isFeesPaid` — boolean
        - `examReviewerUserId` — string
        - `isObjectionValid` — boolean
        - `isClosed` — boolean
        - `isQuestionNeedModify` — boolean
        - `isExaminerScoreNeedModify` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `objectionStatusId` — integer
        - `attemp` — Attempt
        - `examTaker` — ExamTaker
        - `objectionReason` — ObjectionReason
        - `profile` — Profile
        - `attemptObjectionAttachments` — AttemptObjectionAttachment[]
      - `attemptSuspensions` — AttemptSuspension[]
        - `id` — string
        - `attemptId` — string
        - `examTakerId` — string
        - `testingCenterId` — string
        - `profileId` — string
        - `suspensionReasonId` — integer
        - `otherSuspensionReason` — string
        - `suspensionText` — string
        - `suspendedBy` — string
        - `suspendedOn` — datetime
        - `suspensionCommitteeDecisionId` — integer
        - `minutesOfCommitteeAttachmentId` — string
        - `isClosed` — boolean
        - `isStopped` — boolean
        - `suspensionStatusId` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `attempt` — Attempt
        - `examTaker` — ExamTaker
        - `minutesOfCommitteeAttachment` — Attachment
        - `profile` — Profile
        - `suspensionCommitteeDecision` — SuspensionCommitteeDecision
        - `suspensionReason` — SuspensionReason
        - `attemptSuspensionAttachments` — AttemptSuspensionAttachment[]
      - `attempts` — Attempt[]
        - `id` — string
        - `examReservationId` — string
        - `attemptNumber` — integer
        - `date` — datetime
        - `examLoginUserName` — string
        - `examLoginPassword` — string
        - `isAbsent` — boolean
        - `profileId` — string
        - `examTakerId` — string
        - `examResultStatusId` — integer
        - `isCanceled` — boolean
        - `cancelDate` — datetime
        - `cancelBillNumber` — string
        - `isRescheduled` — boolean
        - `rescheduleNumber` — integer
        - `rescheduleBillNumber` — boolean
        - `isRetry` — boolean
        - `isSuspended` — boolean
        - `isClosed` — boolean
        - `totalScore` — number
        - `totalMCQScore` — number
        - `totalScoreBeforeObjectionModification` — number
        - `isPassed` — boolean
        - `isPassedAfterObjection` — boolean
        - `isCertificateIssued` — boolean
        - `actualFromTime` — string
        - `actualToTime` — string
        - `hasObjectionRequest` — boolean
        - `commentOnExam` — string
        - `certificateId` — string
        - `eligibilityIDPortal` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `execuseRequestComments` — string
        - `isGradeSentToLMS` — boolean
        - `isNewDateSyncedWithDynamic` — boolean
        - `examReservation` — ExamReservation
        - `examResultStatus` — ExamResultStatus
        - `examTaker` — ExamTaker
        - `profile` — Profile
        - `attemptConfiscations` — AttemptConfiscation[]
        - `attemptFolderScores` — AttemptFolderScore[]
        - `attemptObjections` — AttemptObjection[]
        - `attemptQuestions` — AttemptQuestion[]
        - `attemptSuspensions` — AttemptSuspension[]
      - `examReservations` — ExamReservation[]
        - `id` — string
        - `testCenterScheduleDayPeriodId` — string
        - `testingCenterId` — string
        - `profileId` — string
        - `examTakerId` — string
        - `examDate` — datetime
        - `stateTime` — string
        - `endTime` — string
        - `duration` — integer
        - `statusId` — integer
        - `isExamTakerReplaced` — boolean
        - `originalExamTakerId` — string
        - `reservationId` — integer
        - `reservationDate` — string
        - `certificateDate` — datetime
        - `paymentPendingStartTime` — datetime
        - `reservedByAdmin` — boolean
        - `allowedForOneMoreReschedule` — boolean
        - `isExamGenerated` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `parent` — ExamReservation
        - `parentId` — string
        - `organizationId` — string
        - `reservedById` — string
        - `confirmationMailSent` — boolean
        - `cartId` — string
        - `lmsReservationDate` — datetime
        - `lmsReservationId` — string
        - `bundleId` — string
        - `bundleReservationId` — string
        - `reasonId` — ReasonsList
        - `reasonDescription` — string
        - `isSentToMTM` — boolean
        - `examTaker` — ExamTaker
        - `profile` — Profile
        - `status` — ExamReservationStatus
        - `testCenterScheduleDayPeriod` — TestCenterScheduleDayPeriod
        - `attempts` — Attempt[]
        - `inverseParent` — ExamReservation[]
        - `excuseRequests` — ExcuseRequest[]
        - `voucherNumber` — string
        - `licenceType` — integer
      - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `id` — string
        - `profileFolderId` — string
        - `profileId` — string
        - `folderId` — string
        - `questionId` — string
        - `questionScore` — integer
        - `isPinned` — boolean
        - `isConfirmed` — boolean
        - `questionOrder` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `profile` — Profile
        - `profileFolder` — ProfileFolder
        - `question` — Question
      - `profileFolders` — ProfileFolder[]
        - `id` — string
        - `profileId` — string
        - `folderId` — string
        - `parentFolderId` — string
        - `folderWeight` — integer
        - `folderOrder` — integer
        - `isConfirmed` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `parentFolder` — Folder
        - `profile` — Profile
        - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `folderName` — string
      - `profileOwners` — ProfileOwner[]
        - `id` — string
        - `profileId` — string
        - `ownerId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
      - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[]
        - `id` — string
        - `profileId` — string
        - `testingCenterId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
      - `questionsPriorities` — QuestionsPriority[]
        - `id` — string
        - `questionId` — string
        - `profileId` — string
        - `folderId` — string
        - `usedFrequency` — integer
        - `lastUsedOn` — datetime
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `profile` — Profile
        - `question` — Question
      - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[]
        - `id` — string
        - `testCenterScheduleDayPeriodSpecializationId` — string
        - `profileId` — string
        - `noOfSeats` — integer
        - `noOfReservations` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
        - `testCenterScheduleDayPeriodSpecialization` — TestCenterScheduleDayPeriodSpecialization
      - `trialExams` — TrialExam[]
        - `id` — string
        - `profileId` — string
        - `maxNoOfSeats` — integer
        - `fees` — number
        - `isActive` — boolean
        - `isCancelled` — boolean
        - `statusId` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
        - `trialExamInvitedOrganizations` — TrialExamInvitedOrganization[]
        - `nameAr` — string
        - `nameEn` — string
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
    - `eventEnded` — boolean
    - `isRegistrationClosed` — boolean
    - `registrationStatusMessage` — string
    - `isRegistered` — boolean
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
      - `exam` — Exam
        - `id` — string
        - `code` — string
        - `nameAr` — string
        - `nameEn` — string
        - `newLearningMaterialLink` — string
        - `newLearningMaterialNote` — string
        - `descriptionAr` — string
        - `descriptionEn` — string
        - `marketingDescriptionAr` — string
        - `marketingDescriptionEn` — string
        - `fees` — number
        - `maxNumberOfTries` — integer
        - `maxTriesBeforeCourseRequired` — integer
        - `courseId` — string
        - `trialResetType` — integer
        - `isDraft` — boolean
        - `targetCategories` — string
        - `targetCategoriesEn` — string
        - `additionalPrerequisites` — string
        - `additionalPrerequisitesEn` — string
        - `competenciesTextAr` — string
        - `competenciesTextEn` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `applyVAT` — boolean
        - `isCollectInDynamics` — boolean
        - `isCollectInDynamicsAsSeats` — boolean
        - `competencyLevelId` — integer
        - `mandated` — boolean
        - `centerCategoryId` — string
        - `enableBundleFeature` — boolean
        - `isTrending` — boolean
        - `imageUrl` — string
        - `examDiscountTypes` — ExamDiscountType[]
        - `examSectors` — ExamSector[]
        - `prerequisiteCourses` — PrerequisiteCourse[]
        - `prerequisiteExamExams` — PrerequisiteExam[]
        - `prerequisiteExamPrerequisiteExamNavigations` — PrerequisiteExam[]
        - `profiles` — Profile[]
        - `retries` — Retry[]
        - `examJobFamilies` — ExamJobFamily[]
        - `examCompetecies` — ExamCompetecie[]
        - `examAcquiredSkills` — ExamAcquiredSkill[]
        - `examTopics` — ExamTopic[]
        - `userRate` — number
        - `numberOfUserRates` — integer
        - `relatedProgramId` — string
        - `searchKeywords` — string
      - `targetAudience` — TargetAudienceType
        - `id` — integer
        - `nameAr` — string
        - `nameEn` — string
        - `profiles` — Profile[]
      - `profileSetting` — ProfileSetting
        - `id` — string
        - `showIntroPage` — boolean
        - `showSuccessPrerequisite` — boolean
        - `showNumberOfQuestions` — boolean
        - `showExamDuration` — boolean
        - `showRemainingDuration` — boolean
        - `notifyUserBeforeEndOfExam` — boolean
        - `notifyUserBeforeEndOfExamDuration` — integer
        - `allowCommentPerQuestion` — boolean
        - `allowCommentForExam` — boolean
        - `showExamResultAsStatus` — boolean
        - `showTotalCompetenciesResult` — boolean
        - `showResultPerCompetency` — boolean
        - `isSurveyMandatory` — boolean
        - `showExamReport` — boolean
        - `hasCertificate` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `idNavigation` — Profile
      - `attemptConfiscationProfiles` — AttemptConfiscationProfile[]
        - `id` — string
        - `examTakerAttemptConfiscationId` — string
        - `profileId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `examTakerAttemptConfiscation` — AttemptConfiscation
        - `profile` — Profile
      - `attemptObjections` — AttemptObjection[]
        - `id` — string
        - `objectionNumber` — string
        - `attempId` — string
        - `examTakerId` — string
        - `profileId` — string
        - `objectionReasonId` — integer
        - `otherObjectonReason` — string
        - `objectionText` — string
        - `isFeesPaid` — boolean
        - `examReviewerUserId` — string
        - `isObjectionValid` — boolean
        - `isClosed` — boolean
        - `isQuestionNeedModify` — boolean
        - `isExaminerScoreNeedModify` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `objectionStatusId` — integer
        - `attemp` — Attempt
        - `examTaker` — ExamTaker
        - `objectionReason` — ObjectionReason
        - `profile` — Profile
        - `attemptObjectionAttachments` — AttemptObjectionAttachment[]
      - `attemptSuspensions` — AttemptSuspension[]
        - `id` — string
        - `attemptId` — string
        - `examTakerId` — string
        - `testingCenterId` — string
        - `profileId` — string
        - `suspensionReasonId` — integer
        - `otherSuspensionReason` — string
        - `suspensionText` — string
        - `suspendedBy` — string
        - `suspendedOn` — datetime
        - `suspensionCommitteeDecisionId` — integer
        - `minutesOfCommitteeAttachmentId` — string
        - `isClosed` — boolean
        - `isStopped` — boolean
        - `suspensionStatusId` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `attempt` — Attempt
        - `examTaker` — ExamTaker
        - `minutesOfCommitteeAttachment` — Attachment
        - `profile` — Profile
        - `suspensionCommitteeDecision` — SuspensionCommitteeDecision
        - `suspensionReason` — SuspensionReason
        - `attemptSuspensionAttachments` — AttemptSuspensionAttachment[]
      - `attempts` — Attempt[]
        - `id` — string
        - `examReservationId` — string
        - `attemptNumber` — integer
        - `date` — datetime
        - `examLoginUserName` — string
        - `examLoginPassword` — string
        - `isAbsent` — boolean
        - `profileId` — string
        - `examTakerId` — string
        - `examResultStatusId` — integer
        - `isCanceled` — boolean
        - `cancelDate` — datetime
        - `cancelBillNumber` — string
        - `isRescheduled` — boolean
        - `rescheduleNumber` — integer
        - `rescheduleBillNumber` — boolean
        - `isRetry` — boolean
        - `isSuspended` — boolean
        - `isClosed` — boolean
        - `totalScore` — number
        - `totalMCQScore` — number
        - `totalScoreBeforeObjectionModification` — number
        - `isPassed` — boolean
        - `isPassedAfterObjection` — boolean
        - `isCertificateIssued` — boolean
        - `actualFromTime` — string
        - `actualToTime` — string
        - `hasObjectionRequest` — boolean
        - `commentOnExam` — string
        - `certificateId` — string
        - `eligibilityIDPortal` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `execuseRequestComments` — string
        - `isGradeSentToLMS` — boolean
        - `isNewDateSyncedWithDynamic` — boolean
        - `examReservation` — ExamReservation
        - `examResultStatus` — ExamResultStatus
        - `examTaker` — ExamTaker
        - `profile` — Profile
        - `attemptConfiscations` — AttemptConfiscation[]
        - `attemptFolderScores` — AttemptFolderScore[]
        - `attemptObjections` — AttemptObjection[]
        - `attemptQuestions` — AttemptQuestion[]
        - `attemptSuspensions` — AttemptSuspension[]
      - `examReservations` — ExamReservation[]
        - `id` — string
        - `testCenterScheduleDayPeriodId` — string
        - `testingCenterId` — string
        - `profileId` — string
        - `examTakerId` — string
        - `examDate` — datetime
        - `stateTime` — string
        - `endTime` — string
        - `duration` — integer
        - `statusId` — integer
        - `isExamTakerReplaced` — boolean
        - `originalExamTakerId` — string
        - `reservationId` — integer
        - `reservationDate` — string
        - `certificateDate` — datetime
        - `paymentPendingStartTime` — datetime
        - `reservedByAdmin` — boolean
        - `allowedForOneMoreReschedule` — boolean
        - `isExamGenerated` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `parent` — ExamReservation
        - `parentId` — string
        - `organizationId` — string
        - `reservedById` — string
        - `confirmationMailSent` — boolean
        - `cartId` — string
        - `lmsReservationDate` — datetime
        - `lmsReservationId` — string
        - `bundleId` — string
        - `bundleReservationId` — string
        - `reasonId` — ReasonsList
        - `reasonDescription` — string
        - `isSentToMTM` — boolean
        - `examTaker` — ExamTaker
        - `profile` — Profile
        - `status` — ExamReservationStatus
        - `testCenterScheduleDayPeriod` — TestCenterScheduleDayPeriod
        - `attempts` — Attempt[]
        - `inverseParent` — ExamReservation[]
        - `excuseRequests` — ExcuseRequest[]
        - `voucherNumber` — string
        - `licenceType` — integer
      - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `id` — string
        - `profileFolderId` — string
        - `profileId` — string
        - `folderId` — string
        - `questionId` — string
        - `questionScore` — integer
        - `isPinned` — boolean
        - `isConfirmed` — boolean
        - `questionOrder` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `profile` — Profile
        - `profileFolder` — ProfileFolder
        - `question` — Question
      - `profileFolders` — ProfileFolder[]
        - `id` — string
        - `profileId` — string
        - `folderId` — string
        - `parentFolderId` — string
        - `folderWeight` — integer
        - `folderOrder` — integer
        - `isConfirmed` — boolean
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `parentFolder` — Folder
        - `profile` — Profile
        - `profileFolderQuestions` — ProfileFolderQuestion[]
        - `folderName` — string
      - `profileOwners` — ProfileOwner[]
        - `id` — string
        - `profileId` — string
        - `ownerId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
      - `profileRestrictedTestingCenters` — ProfileRestrictedTestingCenter[]
        - `id` — string
        - `profileId` — string
        - `testingCenterId` — string
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
      - `questionsPriorities` — QuestionsPriority[]
        - `id` — string
        - `questionId` — string
        - `profileId` — string
        - `folderId` — string
        - `usedFrequency` — integer
        - `lastUsedOn` — datetime
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `folder` — Folder
        - `profile` — Profile
        - `question` — Question
      - `testCenterScheduleDayPeriodSpecializationExamProfiles` — TestCenterScheduleDayPeriodSpecializationExamProfile[]
        - `id` — string
        - `testCenterScheduleDayPeriodSpecializationId` — string
        - `profileId` — string
        - `noOfSeats` — integer
        - `noOfReservations` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
        - `testCenterScheduleDayPeriodSpecialization` — TestCenterScheduleDayPeriodSpecialization
      - `trialExams` — TrialExam[]
        - `id` — string
        - `profileId` — string
        - `maxNoOfSeats` — integer
        - `fees` — number
        - `isActive` — boolean
        - `isCancelled` — boolean
        - `statusId` — integer
        - `createdBy` — string
        - `createdOn` — datetime
        - `updatedBy` — string
        - `updatedOn` — datetime
        - `profile` — Profile
        - `trialExamInvitedOrganizations` — TrialExamInvitedOrganization[]
        - `nameAr` — string
        - `nameEn` — string
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
    - `eventEnded` — boolean
    - `isRegistrationClosed` — boolean
    - `registrationStatusMessage` — string
    - `isRegistered` — boolean
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
      - `refundTransaction` — UserBillDetailsViewModel[]
      - `postPoneTransaction` — UserBillDetailsViewModel[]
      - `replcaeTransaction` — UserBillDetailsViewModel[]
      - `transactionTypeId` — integer
      - `paymentModuleId` — integer
      - `userFullName` — string
      - `approved` — boolean
      - `approvalText` — string
      - `requestStatus` — string
      - `transactionDetailId` — string
      - `fullInvoicePdfPath` — string
      - `voucherNumber` — string
      - `transactionType` — TransactionTypes
      - `transactionTypeData` — StringStringTuple
        - `item1` — string
        - `item2` — string
      - `paymentModule` — PaymentModules
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
      - `refundTransaction` — UserBillDetailsViewModel[]
      - `postPoneTransaction` — UserBillDetailsViewModel[]
      - `replcaeTransaction` — UserBillDetailsViewModel[]
      - `transactionTypeId` — integer
      - `paymentModuleId` — integer
      - `userFullName` — string
      - `approved` — boolean
      - `approvalText` — string
      - `requestStatus` — string
      - `transactionDetailId` — string
      - `fullInvoicePdfPath` — string
      - `voucherNumber` — string
      - `transactionType` — TransactionTypes
      - `transactionTypeData` — StringStringTuple
        - `item1` — string
        - `item2` — string
      - `paymentModule` — PaymentModules
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
      - `refundTransaction` — UserBillDetailsViewModel[]
      - `postPoneTransaction` — UserBillDetailsViewModel[]
      - `replcaeTransaction` — UserBillDetailsViewModel[]
      - `transactionTypeId` — integer
      - `paymentModuleId` — integer
      - `userFullName` — string
      - `approved` — boolean
      - `approvalText` — string
      - `requestStatus` — string
      - `transactionDetailId` — string
      - `fullInvoicePdfPath` — string
      - `voucherNumber` — string
      - `transactionType` — TransactionTypes
      - `transactionTypeData` — StringStringTuple
        - `item1` — string
        - `item2` — string
      - `paymentModule` — PaymentModules
      - `paymentModuleName` — string
    - `transactionTypeId` — integer
    - `paymentModuleId` — integer
    - `fullInvoicePdfPath` — string
    - `userFullName` — string
    - `approved` — boolean
    - `approvalText` — string
    - `requestStatus` — string
    - `transactionType` — TransactionTypes
    - `transactionTypeData` — StringStringTuple
      - `item1` — string
      - `item2` — string
    - `paymentModule` — PaymentModules
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

## 6. Fields observed live

Operations whose swagger response is a bare `200 OK`, so the spec says nothing about the body. These fields were read from real responses (`tools/fast-api/observed-fields.json`).

### `POST /api/v1/Program/Search`

Envelope `ApiResponse`, `value` is array of programme cards:

`id`, `name`, `description`, `location`, `language`, `imageAttachmentPath`, `isPublishedForOrganizations`, `programTopicName`, `planId`, `planNumberOfDays`, `isNew`, `isEndingSoon`, `endingSoonText`, `appointmentDateText`, `startDate`, `isExecutiveProgram`, `userRate`, `ratingUsersCount`, `isForIndividuals`, `audienceType`, `userFavoritId`, `isFavorite`, `trainingTypeCssClass`, `trainingTypeId`, `trainingType`, `allTrainingTypes`, `externalRegistrationURL`, `hasExternalRegistrationURL`, `isAvailable`, `isFree`, `freeMessage`, `fees`, `programFees`, `formattedPrice`, `priceAfterDiscount`, `hasDiscount`, `discountAmount`, `discountAmountDescription`, `discountMarketDescription`, `isPercentage`, `isFullySupported`, `isHrdfSupported`, `hrdfLogoUrl`, `hrdfTagText`

### `GET /api/v1/Program/GetPlansByProgramId`

Envelope `ApiResponse`, `value` is array of plans:

`id`, `price`, `priceAfterDiscount`, `startDate`, `startTime`, `endDate`, `endTime`, `available`, `availableSeats`, `duration`, `durationDays`, `city`, `trainingTypeId`, `trainingTypeName`, `trainerName`, `externalRegistrationURL`, `isExternal`, `fees`, `isFree`, `freeMessage`, `isFullySupported`, `formattedPrice`, `alreadyInCart`, `alreadyInCartMessage`

## 7. Schema dictionary

All 350 object schemas and 50 enums reachable from any operation (request or response), alphabetically, one level deep.

#### AcademyLearningPathManagementAssignUsersViewModel

| Field | Type | Required |
|---|---|---|
| `userIds` | `string[]` |  |
| `organizationId` | `string` |  |
| `expiryDate` | `datetime` |  |

#### AddEvalutionSelfLearningViewModel

| Field | Type | Required |
|---|---|---|
| `questionId` | `string` |  |
| `selectedAnswerId` | `string` |  |

#### AddUserFavoriteRequest

| Field | Type | Required |
|---|---|---|
| `requestId` | `string` |  |
| `paymentModuleId` | `integer` |  |

#### AnnouncementGetAllQueryModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `search` | `string` |  |
| `pageIndex` | `integer` |  |
| `pageSize` | `integer` |  |

#### AnnouncementGetByIdQueryModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `id` | `string` |  |

#### AnnouncementSetStatusCommandModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `id` | `string` |  |
| `isActive` | `boolean` |  |

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

#### AssignedLearningPathItemProgressViewModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `assignedLearningPathId` | `string` |  |
| `status` | [AssignedLearningPathItemProgressStatus](#assignedlearningpathitemprogressstatus) |  |
| `itemId` | `string` |  |
| `startDate` | `datetime` |  |
| `endDate` | `datetime` |  |

#### AssignedLearningPathViewModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `learningPathId` | `string` |  |
| `userId` | `string` |  |
| `userFullName` | `string` |  |
| `idnumber` | `string` |  |
| `dueDate` | `datetime` |  |
| `status` | [AssignedLearningPathStatus](#assignedlearningpathstatus) |  |
| `completionPercentage` | `number` |  |
| `certificateFile` | `string` |  |
| `startDate` | `datetime` |  |
| `endDate` | `datetime` |  |
| `itemProgresses` | [AssignedLearningPathItemProgressViewModel[]](#assignedlearningpathitemprogressviewmodel) |  |

#### AssignLearnersToLearningPathRequestModel

| Field | Type | Required |
|---|---|---|
| `users` | [AssignLearnerToLearningPathRequestModel[]](#assignlearnertolearningpathrequestmodel) |  |

#### AssignLearnerToLearningPathRequestModel

| Field | Type | Required |
|---|---|---|
| `userId` | `string` |  |
| `dueDate` | `datetime` |  |

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

#### BillsRequestDto

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `billNumber` | `string` |  |

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

#### BuildLearnerChartQueryModel

| Field | Type | Required |
|---|---|---|
| `chartType` | [ChartTypes](#charttypes) |  |
| `organizationId` | `string` |  |
| `userId` | `string` |  |

#### BuildOrgChartQueryModel

| Field | Type | Required |
|---|---|---|
| `chartType` | [ChartTypes](#charttypes) |  |
| `organizationId` | `string` |  |

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

#### CancelReservationViewModel

| Field | Type | Required |
|---|---|---|
| `reservationId` | `string` |  |
| `reservationType` | [ModuleType](#moduletype) |  |
| `reasonId` | [ReasonsList](#reasonslist) |  |
| `reasonDescription` | `string` |  |

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

#### CartPaymentMethodOptionViewModel

| Field | Type | Required |
|---|---|---|
| `paymentMethod` | [PaymentMethodEnum](#paymentmethodenum) |  |
| `isAvailable` | `boolean` |  |

#### CartPaymentOptionViewModel

| Field | Type | Required |
|---|---|---|
| `paymentOption` | [CartPaymentOption](#cartpaymentoption) |  |
| `isAvailable` | `boolean` |  |
| `paymentMethods` | [CartPaymentMethodOptionViewModel[]](#cartpaymentmethodoptionviewmodel) |  |

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
| `trackingEvent` | `string` |  |
| `isUsedZatkaLayout` | `boolean` |  |
| `refCode` | `string` |  |
| `issueDate` | `datetime` |  |
| `organizationCart` | `object` |  |
| `walletCartInfo` | [WalletCartInfo](#walletcartinfo) |  |
| `hasIndividualRegistration` | `boolean` |  |
| `numberOfItems` | `integer` |  |
| `currentUserId` | `string` |  |
| `allowedTaxInvoices` | `boolean` |  |
| `organizationId` | `string` |  |
| `paymentOptions` | [CartPaymentOptionViewModel[]](#cartpaymentoptionviewmodel) |  |

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

#### ChangeRegistrationEmailRequest

| Field | Type | Required |
|---|---|---|
| `email` | `string` | yes |

#### ChangeRegistrationIdentityRequest

| Field | Type | Required |
|---|---|---|
| `identityType` | `string` | yes |
| `identityNumber` | `string` | yes |

#### ChangeRegistrationPhoneRequest

| Field | Type | Required |
|---|---|---|
| `phoneNumber` | `string` | yes |

#### ChangeUserProfileThemeCommand

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `theme` | [ProfileTheme](#profiletheme) |  |

#### CheckEligibilityRequestDto

| Field | Type | Required |
|---|---|---|
| `universityEmail` | `string` | yes |

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

#### CheckListData

| Field | Type | Required |
|---|---|---|
| `dataSource` | [CheckItem[]](#checkitem) |  |
| `selectedItems` | `string[]` |  |
| `isReadOnly` | `boolean` |  |

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

#### ConfirmRegistrationEmailChangeRequest

| Field | Type | Required |
|---|---|---|
| `userId` | `string` | yes |
| `email` | `string` | yes |
| `code` | `string` | yes |

#### ConfirmRegistrationEmailRequest

| Field | Type | Required |
|---|---|---|
| `userId` | `string` | yes |
| `code` | `string` | yes |

#### ConfirmRegistrationPhoneChangeRequest

| Field | Type | Required |
|---|---|---|
| `phoneNumber` | `string` | yes |
| `code` | `string` | yes |

#### ContactUsDto

| Field | Type | Required |
|---|---|---|
| `fullName` | `string` |  |
| `email` | `string` |  |
| `mobileNumber` | `string` |  |
| `job` | `string` |  |
| `subject` | `string` |  |
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

#### CreateLearningPathViewModel

| Field | Type | Required |
|---|---|---|
| `nameAr` | `string` | yes |
| `nameEn` | `string` | yes |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `orgId` | `string` |  |
| `isMandatory` | `boolean` |  |
| `offsetDays` | `integer` |  |
| `items` | [LearningPathItemViewModel[]](#learningpathitemviewmodel) |  |
| `assignedLearningPaths` | [AssignedLearningPathViewModel[]](#assignedlearningpathviewmodel) |  |

#### CreateOrUpdateAnnouncementDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `isTape` | `boolean` |  |
| `organizationId` | `string` |  |
| `contentAr` | `string` |  |
| `contentEn` | `string` |  |
| `duration` | `integer` |  |
| `durationType` | [DurationTypeEnum](#durationtypeenum) |  |
| `isActive` | `boolean` |  |
| `reminders` | [ReminderModel[]](#remindermodel) |  |

#### CreateOrUpdatePracticalExperienceDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `jobTitle` | `string` |  |
| `mainTask` | `string` |  |
| `organization` | `string` |  |
| `dateFrom` | `datetime` |  |
| `dateTo` | `datetime` |  |
| `yearsOfExperience` | `integer` |  |
| `requestStatus` | `integer` |  |
| `stillEmployed` | `boolean` |  |
| `isPartTimeWork` | `boolean` |  |

#### CreateTrainingCourseApiDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `courseLevelId` | `integer` | yes |
| `courseName` | `string` |  |
| `field` | `string` |  |
| `dateFrom` | `datetime` |  |
| `dateTo` | `datetime` |  |
| `isInSideFA` | `integer` |  |
| `numberOfDays` | `integer` |  |
| `organizationName` | `string` |  |
| `programId` | `string` |  |
| `sectorId` | `string` |  |
| `trainingCourseAttachmentId` | `string` |  |

#### EnableAdaptiveLearningViewModel

| Field | Type | Required |
|---|---|---|
| `programId` | `string` |  |
| `enableAdaptiveLearning` | `boolean` |  |

#### EnrollUserToProgramViewModel

| Field | Type | Required |
|---|---|---|
| `userIds` | `string[]` |  |
| `provider` | [WorkSpaceProvider](#workspaceprovider) | yes |
| `orgId` | `string` | yes |
| `programId` | `string` | yes |
| `enrollementStatus` | [EnrollementStatus](#enrollementstatus) |  |
| `dueDate` | `datetime` |  |

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
| `eventEnded` | `boolean` |  |
| `isRegistrationClosed` | `boolean` |  |
| `registrationStatusMessage` | `string` |  |
| `isRegistered` | `boolean` |  |

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

#### EventRegisterationApiViewModel

| Field | Type | Required |
|---|---|---|
| `eventId` | `string` |  |

#### EventRequirementApiModel

| Field | Type | Required |
|---|---|---|
| `requirementId` | `string` |  |
| `name` | `string` |  |
| `data` | `string` |  |
| `dataFile` | `string` |  |

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

#### EventTypeMenuItemViewModel

| Field | Type | Required |
|---|---|---|
| `typeId` | `string` |  |
| `typeName` | `string` |  |
| `icon` | `string` |  |
| `count` | `integer` |  |

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

#### ExamAddToCartApiDto

| Field | Type | Required |
|---|---|---|
| `profileId` | `string` |  |
| `testCenterScheduleDayPeriodId` | `string` |  |
| `requirements` | [ExamRegistrationRequirementApiDto[]](#examregistrationrequirementapidto) |  |

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

#### ExamRegistrationRequirementApiDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `requiremntId` | `string` |  |
| `data` | `string` |  |
| `dataTypeId` | [RequirementDataTypes](#requirementdatatypes) |  |
| `isRequired` | `boolean` |  |
| `fileName` | `string` |  |

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

#### FilterEventDto

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `query` | `string` |  |
| `eventTypeId` | `string` |  |
| `periodId` | `integer` |  |
| `isFavorite` | `boolean` |  |
| `sortBy` | [EventSortBy](#eventsortby) |  |

#### FilterExamDto

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `title` | `string` |  |
| `query` | `string` |  |
| `sectorId` | `string` |  |
| `topicId` | `string` |  |
| `isFavorite` | `boolean` |  |
| `competencyLevelId` | `integer` |  |
| `language` | `integer[]` |  |
| `minimumPrice` | `integer` |  |
| `maximumPrice` | `integer` |  |
| `sortBy` | [ExamSortBy](#examsortby) |  |

#### FilterProgramDto

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `title` | `string` |  |
| `sectorId` | `string` |  |
| `topicId` | `string` |  |
| `language` | `integer[]` |  |
| `attendanceType` | `integer[]` |  |
| `period` | `integer[]` |  |
| `programParticipantLevelIds` | `integer[]` |  |
| `minimumPrice` | `integer` |  |
| `maximumPrice` | `integer` |  |
| `dateFrom` | `datetime` |  |
| `dateTo` | `datetime` |  |
| `competencyLevelId` | `integer` |  |
| `isFavorite` | `boolean` |  |
| `isExcutivePrograms` | `boolean` |  |
| `sortBy` | [ProgramSortBy](#programsortby) |  |

#### FilterUserRequestDto

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `keyword` | `string` |  |
| `requestTypes` | [UserRequestType[]](#userrequesttype) |  |
| `status` | [UserRequestStatus](#userrequeststatus) |  |
| `submissionDate` | `datetime` |  |
| `userRequestSortKey` | [UserRequestSortKey](#userrequestsortkey) |  |
| `isDescending` | `boolean` |  |

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

#### ForgotPasswordRequest

| Field | Type | Required |
|---|---|---|
| `email` | `string` | yes |

#### ForgotUsernameRequest

| Field | Type | Required |
|---|---|---|
| `email` | `string` | yes |

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

#### FrameworkStructureRequestDto

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `title` | `string` |  |
| `sectorId` | `string` |  |
| `jobFamilyId` | `string` |  |

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

#### GetMicroLearningOrgAdminEngagedRateQueryModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `programId` | `string` |  |

#### GetMicroLearningOrgAdminQueryModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |

#### GetOrganizationProgramQuertFilter

| Field | Type | Required |
|---|---|---|
| `orgId` | `string` | yes |
| `title` | `string` |  |
| `topicId` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### GetOrganizationProgramUsersQueryFilter

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` | yes |
| `programId` | `string` | yes |
| `idNumber` | `string` |  |
| `department` | `string` |  |
| `jobTitle` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### GetRegulatorQueryModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `programId` | `string` |  |
| `users` | `string[]` |  |

#### GetTimeLineQueryModel

| Field | Type | Required |
|---|---|---|
| `userId` | `string` |  |
| `programIds` | `string[]` |  |

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

#### IndividualRegistrationRequest

| Field | Type | Required |
|---|---|---|
| `identityType` | `string` | yes |
| `identityNumber` | `string` | yes |
| `firstNameAr` | `string` | yes |
| `fatherNameAr` | `string` |  |
| `grandFatherNameAr` | `string` |  |
| `lastNameAr` | `string` |  |
| `firstNameEn` | `string` | yes |
| `fatherNameEn` | `string` |  |
| `grandFatherNameEn` | `string` |  |
| `lastNameEn` | `string` |  |
| `sex` | `string` | yes |
| `language` | `string` | yes |
| `nationalityCountryId` | `string` |  |
| `residentCountry` | `string` | yes |
| `dateOfBirthGreg` | `string` |  |
| `dateOfBirthHijri` | `string` |  |
| `email` | `string` | yes |
| `confirmEmail` | `string` |  |
| `phoneNumber` | `string` | yes |
| `password` | `string` | yes |
| `confirmPassword` | `string` | yes |
| `userName` | `string` |  |
| `nafathRedirectGuid` | `string` |  |
| `receiveMarketingMessages` | `boolean` |  |
| `informationSource` | `string` |  |

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

#### InviteUserViewModel

| Field | Type | Required |
|---|---|---|
| `idType` | [IamIdentityTypeEnum](#iamidentitytypeenum) |  |
| `idNumber` | `string` |  |
| `email` | `string` |  |
| `dateOfBirth` | `datetime` |  |
| `employeeId` | `string` |  |
| `mobileNumber` | `string` |  |
| `jobTitle` | `string` |  |
| `isValid` | `boolean` |  |

#### IsNafathLoginRequest

| Field | Type | Required |
|---|---|---|
| `userName` | `string` |  |

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

#### LearningGroupFilterViewModel

| Field | Type | Required |
|---|---|---|
| `name` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `organizationId` | `string` |  |
| `status` | `boolean` |  |

#### LearningInitiativeDto

| Field | Type | Required |
|---|---|---|
| `isLoggedIn` | `boolean` |  |
| `awarenessUnits` | [LearningInitiativeUnitDto[]](#learninginitiativeunitdto) |  |
| `learningPaths` | [LearningInitiativePathDto[]](#learninginitiativepathdto) |  |

#### LearningInitiativeDtoReturnResult

| Field | Type | Required |
|---|---|---|
| `errors` | [Item[]](#item) |  |
| `isValid` | `boolean` |  |
| `value` | [LearningInitiativeDto](#learninginitiativedto) |  |
| `message` | `string` |  |

#### LearningInitiativePathDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `initiativeId` | `string` |  |
| `name` | `string` |  |
| `summary` | `string` |  |
| `thumbnailUrl` | `string` |  |
| `initiativeLogoUrl` | `string` |  |
| `unitsCount` | `integer` |  |
| `completedUnitsCount` | `integer` |  |
| `units` | [LearningInitiativePathUnitDto[]](#learninginitiativepathunitdto) |  |

#### LearningInitiativePathUnitDto

| Field | Type | Required |
|---|---|---|
| `unitId` | `string` |  |
| `name` | `string` |  |
| `requiredTimeInMinutes` | `integer` |  |
| `displayOrder` | `integer` |  |

#### LearningInitiativeUnitDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `initiativeId` | `string` |  |
| `name` | `string` |  |
| `shortDescription` | `string` |  |
| `requiredTimeInMinutes` | `integer` |  |
| `thumbnailUrl` | `string` |  |
| `initiativeLogoUrl` | `string` |  |
| `isCompleted` | `boolean` |  |
| `status` | `string` |  |

#### LearningPathAssigneeHistoryRequestViewModel

| Field | Type | Required |
|---|---|---|
| `assignedLearningPathId` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### LearningPathAssigneeStatusViewModel

| Field | Type | Required |
|---|---|---|
| `assignedLearningPathId` | `string` |  |
| `enrollementStatus` | [EnrollementStatus](#enrollementstatus) |  |
| `dueDate` | `datetime` |  |

#### LearningPathDashboardCardFilter

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `status` | [LearnerStatus](#learnerstatus) |  |

#### LearningPathFilterViewModel

| Field | Type | Required |
|---|---|---|
| `sortBy` | [Sort](#sort) |  |
| `sortDesc` | `boolean` |  |
| `topicId` | `string` |  |
| `query` | `string` |  |
| `status` | [LearningPathStatus](#learningpathstatus) |  |
| `assigneeStatus` | [AssignedLearningPathStatus](#assignedlearningpathstatus) |  |
| `dueStatus` | [OverDueStatus](#overduestatus) |  |
| `isMandatory` | `boolean` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### LearningPathItemViewModel

| Field | Type | Required |
|---|---|---|
| `itemId` | `string` |  |
| `itemType` | [LearningPathItemType](#learningpathitemtype) |  |
| `order` | `integer` |  |
| `expireDate` | `datetime` |  |
| `learningPathId` | `string` |  |
| `topicId` | `string` |  |
| `topic` | `string` |  |
| `link` | `string` |  |
| `duration` | `number` |  |
| `linkType` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `status` | [AssignedLearningPathItemProgressStatus](#assignedlearningpathitemprogressstatus) |  |
| `completionPercentage` | `number` |  |
| `programName` | `string` |  |

#### LearningPathViewModel

| Field | Type | Required |
|---|---|---|
| `publishedVirsionId` | `string` |  |
| `nameAr` | `string` | yes |
| `nameEn` | `string` | yes |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `orgId` | `string` |  |
| `isMandatory` | `boolean` |  |
| `status` | [LearningPathStatus](#learningpathstatus) |  |
| `offsetDays` | `integer` |  |
| `items` | [LearningPathItemViewModel[]](#learningpathitemviewmodel) |  |
| `assignedLearningPaths` | [AssignedLearningPathViewModel[]](#assignedlearningpathviewmodel) |  |
| `bulkAssignLimit` | `integer` |  |

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

#### ManageLicenceRequest

| Field | Type | Required |
|---|---|---|
| `userId` | `string` |  |
| `organizationId` | `string` |  |
| `typeId` | `string` |  |
| `isActive` | `boolean` |  |
| `provider` | [WorkSpaceProvider](#workspaceprovider) | yes |

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

#### MyProgramSearchCriteria

| Field | Type | Required |
|---|---|---|
| `progName` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `registrationType` | [RegistrationType](#registrationtype) |  |

#### MySelfLearningViewModel

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `isMandatory` | `boolean` |  |
| `sortBy` | [Sort](#sort) |  |
| `sortDesc` | `boolean` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### NafathChallengeRequest

| Field | Type | Required |
|---|---|---|
| `type` | `string` |  |
| `code` | `string` |  |
| `expirationInSeconds` | `integer` |  |
| `userName` | `string` |  |
| `data` | `object` |  |

#### NafathCreateRequest

| Field | Type | Required |
|---|---|---|
| `identityNumber` | `string` | yes |

#### NafathIdentityVerificationPollRequest

| Field | Type | Required |
|---|---|---|
| `transactionId` | `string` | yes |
| `randomNumber` | `string` | yes |
| `identityType` | `string` | yes |
| `identityNumber` | `string` | yes |

#### NafathRecoveryStatusRequest

| Field | Type | Required |
|---|---|---|
| `identityNumber` | `string` | yes |
| `transId` | `string` | yes |
| `randomNumber` | `string` | yes |

#### NafathTokenRequest

| Field | Type | Required |
|---|---|---|
| `identityNumber` | `string` |  |

#### NationalIdentityType

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `namrEn` | `string` |  |
| `examTakers` | [ExamTaker[]](#examtaker) |  |

#### NotificationCategoryDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `description` | `string` |  |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `notificationTypes` | [NotificationTypeDto[]](#notificationtypedto) |  |

#### NotificationCategoryModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `isActive` | `boolean` |  |
| `organizationId` | `string` |  |
| `notificationTypes` | [NotificationTypeModel[]](#notificationtypemodel) |  |

#### NotificationChannelModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `isActive` | `boolean` |  |

#### NotificationGetByOrganizationQueryModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `pageIndex` | `integer` |  |
| `pageSize` | `integer` |  |
| `isActive` | `boolean` |  |

#### NotificationPreferencesDto

| Field | Type | Required |
|---|---|---|
| `categories` | [NotificationCategoryDto[]](#notificationcategorydto) |  |
| `reminderSettings` | [ReminderSettings](#remindersettings) |  |
| `orgId` | `string` |  |

#### NotificationTypeDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `descriptionAr` | `string` |  |
| `descriptionEn` | `string` |  |
| `description` | `string` |  |
| `channelType` | [NotificationChannelType](#notificationchanneltype) |  |
| `isActive` | `boolean` |  |

#### NotificationTypeModel

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `isActive` | `boolean` |  |
| `categoryId` | `string` |  |
| `channels` | [NotificationChannelModel[]](#notificationchannelmodel) |  |

#### ObjectApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | `object` |  |
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

#### OrganizationExecutiveSummaryReportQueryModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `startDate` | `datetime` |  |
| `endDate` | `datetime` |  |

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

#### OrgLearningPathFilterViewModel

| Field | Type | Required |
|---|---|---|
| `sortBy` | [Sort](#sort) |  |
| `sortDesc` | `boolean` |  |
| `topicId` | `string` |  |
| `query` | `string` |  |
| `status` | [LearningPathStatus](#learningpathstatus) |  |
| `assigneeStatus` | [AssignedLearningPathStatus](#assignedlearningpathstatus) |  |
| `dueStatus` | [OverDueStatus](#overduestatus) |  |
| `isMandatory` | `boolean` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `orgId` | `string` |  |

#### OrgUsersProgramEnrollementFilterViewModel

| Field | Type | Required |
|---|---|---|
| `provider` | [WorkSpaceProvider](#workspaceprovider) | yes |
| `orgId` | `string` | yes |
| `programId` | `string` | yes |
| `userName` | `string` |  |
| `title` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### OrgUserViewModel

| Field | Type | Required |
|---|---|---|
| `empID` | `string` |  |
| `identityType` | `string` |  |
| `identityNumber` | `string` |  |
| `dateOfBirth` | `string` |  |
| `email` | `string` |  |
| `mobileNumber` | `string` |  |
| `nationality` | `string` |  |
| `gender` | `string` |  |
| `countryId` | `integer` |  |
| `trainee_Name_ar` | `string` |  |
| `trainee_Name_en` | `string` |  |
| `isValid` | `boolean` |  |

#### OverDueAssignmentRequestViewModel

| Field | Type | Required |
|---|---|---|
| `orgId` | `string` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

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

#### PayLaterBillDto

| Field | Type | Required |
|---|---|---|
| `billNumber` | `string` |  |
| `paymentModules` | [PaymentModules](#paymentmodules) |  |
| `amount` | `number` |  |
| `isTaxInvoice` | `boolean` |  |
| `issueDate` | `datetime` |  |
| `isCreatedInSadad` | `boolean` |  |
| `status` | [PaymentRequestStatus](#paymentrequeststatus) |  |
| `paymentMethod` | [PaymentRequestMethodEnum](#paymentrequestmethodenum) |  |
| `paymentRefId` | `string` |  |
| `paymentDate` | `datetime` |  |

#### PayLaterBillDtoApiResponse

| Field | Type | Required |
|---|---|---|
| `confirm` | `boolean` |  |
| `message` | `string` |  |
| `modelStateErrors` | [Item[]](#item) |  |
| `success` | `boolean` |  |
| `value` | [PayLaterBillDto](#paylaterbilldto) |  |
| `totalItems` | `integer` |  |
| `pageSize` | `integer` |  |
| `pageNumber` | `integer` |  |

#### PayLaterRequestDto

| Field | Type | Required |
|---|---|---|
| `paymentModules` | [PaymentModules](#paymentmodules) |  |
| `organizationId` | `string` |  |
| `balance` | `number` |  |
| `description` | `string` |  |
| `isTaxInvoice` | `boolean` |  |

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

#### ProblemDetails

| Field | Type | Required |
|---|---|---|
| `type` | `string` |  |
| `title` | `string` |  |
| `status` | `integer` |  |
| `detail` | `string` |  |
| `instance` | `string` |  |

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

#### ProgramDetailDto

| Field | Type | Required |
|---|---|---|
| `orgId` | `string` |  |
| `programId` | `integer` |  |

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
| `registrationRequestStatus` | [RegistrationStatus](#registrationstatus) |  |
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
| `lastActionDate` | `datetime` |  |
| `completedUnits` | `integer` |  |
| `totalUnits` | `integer` |  |
| `completionPercentage` | `number` |  |
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

#### ProgramTrainerDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `programId` | `string` |  |
| `name` | `string` |  |
| `description` | `string` |  |
| `attachmentId` | `string` |  |

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

#### QuestionType

| Field | Type | Required |
|---|---|---|
| `id` | `integer` |  |
| `nameAr` | `string` |  |
| `nameEn` | `string` |  |
| `attemptQuestions` | [AttemptQuestion[]](#attemptquestion) |  |
| `questions` | [Question[]](#question) |  |

#### RegistrationCheckIdentityRequest

| Field | Type | Required |
|---|---|---|
| `identityType` | `string` | yes |
| `identityNumber` | `string` | yes |

#### RegistrationRequirementApiDto

| Field | Type | Required |
|---|---|---|
| `id` | `string` |  |
| `requiremntId` | `string` |  |
| `data` | `string` |  |
| `dataTypeId` | [RequirementDataTypes](#requirementdatatypes) |  |
| `fileName` | `string` |  |

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

#### RegistrationSubmitApiDto

| Field | Type | Required |
|---|---|---|
| `planId` | `string` |  |
| `programId` | `string` |  |
| `requirements` | [RegistrationRequirementApiDto[]](#registrationrequirementapidto) |  |

#### Reminder

| Field | Type | Required |
|---|---|---|
| `offset` | `integer` |  |
| `reminderType` | [ReminderType](#remindertype) |  |

#### ReminderModel

| Field | Type | Required |
|---|---|---|
| `reminder` | `integer` |  |
| `durationType` | [DurationTypeEnum](#durationtypeenum) |  |

#### ReminderSettings

| Field | Type | Required |
|---|---|---|
| `reminders` | [Reminder[]](#reminder) |  |
| `isActive` | `boolean` |  |

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

#### ReportGetAllQueryModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `search` | `string` |  |
| `pageIndex` | `integer` |  |
| `pageSize` | `integer` |  |

#### RescheduleDto

| Field | Type | Required |
|---|---|---|
| `newPlanId` | `string` |  |
| `reservationId` | `string` |  |

#### RescheduleExamDto

| Field | Type | Required |
|---|---|---|
| `reservationId` | `string` |  |
| `examFileId` | `string` |  |
| `testCenterScheduleDayPeriodId` | `string` |  |
| `testingCenterId` | `string` |  |

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
| `numberOfExamQuestions` | `integer` |  |
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
| `examDetails` | [ProgramExamDetailsDto](#programexamdetailsdto) |  |
| `eligibilityExamDetailsUrl` | `string` |  |
| `examRegisterLinkText` | `string` |  |
| `examEligibilityStatus` | `string` |  |
| `educationalMaterials` | [ReservationMaterialItemDto[]](#reservationmaterialitemdto) |  |

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

#### ReservationMaterialItemDto

| Field | Type | Required |
|---|---|---|
| `name` | `string` |  |
| `url` | `string` |  |

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

#### ResetPasswordNafathRequest

| Field | Type | Required |
|---|---|---|
| `identityNumber` | `string` | yes |
| `transId` | `string` | yes |
| `randomNumber` | `string` | yes |
| `password` | `string` | yes |
| `confirmPassword` | `string` |  |

#### ResetPasswordRequest

| Field | Type | Required |
|---|---|---|
| `userId` | `string` | yes |
| `code` | `string` | yes |
| `password` | `string` | yes |
| `confirmPassword` | `string` |  |

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

#### SavePrePostQuestionAnswer

| Field | Type | Required |
|---|---|---|
| `questionId` | `string` |  |
| `selectedAnswerId` | `string` |  |
| `targetId` | `string` |  |

#### SearchInviteViewModel

| Field | Type | Required |
|---|---|---|
| `query` | `string` |  |
| `status` | [InvitationResult](#invitationresult) |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### SearchMyEventsDto

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `registrationType` | [RegistrationType](#registrationtype) |  |
| `eventReservationStatus` | [EventReservationStatus](#eventreservationstatus) |  |
| `name` | `string` |  |
| `startDate` | `datetime` |  |
| `endDate` | `datetime` |  |

#### SearchMyExamDto

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `registrationType` | [RegistrationListType](#registrationlisttype) |  |
| `examName` | `string` |  |

#### SearchMyProgramsDto

| Field | Type | Required |
|---|---|---|
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `registrationType` | [RegistrationType](#registrationtype) |  |
| `trainingType` | [TrainingTypeEnum](#trainingtypeenum) |  |
| `progName` | `string` |  |

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

#### SendVerificationCodeRequestDto

| Field | Type | Required |
|---|---|---|
| `universityEmail` | `string` | yes |

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

#### UpdateContractViewModel

| Field | Type | Required |
|---|---|---|
| `contractId` | `string` |  |
| `comment` | `string` |  |

#### UpdateLearningGroupStatusViewModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `learningGroupId` | `string` |  |
| `isActive` | `boolean` |  |

#### UpdateUserRoleViewModel

| Field | Type | Required |
|---|---|---|
| `userId` | `string` |  |
| `roles` | [UserRole[]](#userrole) |  |

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

#### UserCertificateFilterRequest

| Field | Type | Required |
|---|---|---|
| `certificateTypeId` | `integer` |  |
| `userId` | `string` |  |
| `title` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### UserLearningReportQueryModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `startDate` | `datetime` |  |
| `endDate` | `datetime` |  |

#### UserRole

| Field | Type | Required |
|---|---|---|
| `roleId` | `integer` |  |
| `upgrade` | `boolean` |  |

#### ValidateOrganizationProgramDataQueryModel

| Field | Type | Required |
|---|---|---|
| `userId` | `string` |  |
| `organizationId` | `string` |  |
| `programIds` | `string[]` |  |

#### VerifyVerificationCodeRequestDto

| Field | Type | Required |
|---|---|---|
| `universityEmail` | `string` | yes |
| `verificationCode` | `string` | yes |

#### WalletCartInfo

| Field | Type | Required |
|---|---|---|
| `balance` | `number` |  |
| `enable` | `boolean` |  |
| `show` | `boolean` |  |

#### WorkSpaceAssignedUsersFilterViewModel

| Field | Type | Required |
|---|---|---|
| `provider` | [WorkSpaceProvider](#workspaceprovider) | yes |
| `orgId` | `string` | yes |
| `programId` | `string` | yes |
| `userName` | `string` |  |
| `title` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### WorkSpaceEnrollementStatusViewModel

| Field | Type | Required |
|---|---|---|
| `provider` | [WorkSpaceProvider](#workspaceprovider) | yes |
| `orgId` | `string` | yes |
| `planTaker` | `string` | yes |
| `enrollementStatus` | [EnrollementStatus](#enrollementstatus) |  |
| `dueDate` | `datetime` |  |

#### WorkSpaceLearnerProgressRequestModel

| Field | Type | Required |
|---|---|---|
| `provider` | [WorkSpaceProvider](#workspaceprovider) |  |
| `organizationId` | `string` |  |
| `programId` | `string` |  |
| `userIds` | `string[]` |  |

#### WorkSpaceLearnerRequestModel

| Field | Type | Required |
|---|---|---|
| `term` | `string` |  |
| `provider` | [WorkSpaceProvider](#workspaceprovider) |  |
| `organizationId` | `string` |  |
| `workSpaceTypeId` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `activeStatus` | [ActiveStatus](#activestatus) |  |

#### WorkSpaceLicenseFilterRequestsViewModel

| Field | Type | Required |
|---|---|---|
| `organizationId` | `string` |  |
| `status` | [LicenceRequestStatus](#licencerequeststatus) |  |
| `employeeName` | `string` |  |
| `idNumber` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### WorkSpaceProgramsFilterViewModel

| Field | Type | Required |
|---|---|---|
| `provider` | [WorkSpaceProvider](#workspaceprovider) | yes |
| `orgId` | `string` | yes |
| `classificationId` | `integer` |  |
| `title` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |

#### WorkspaceProgramsRequest

| Field | Type | Required |
|---|---|---|
| `title` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `classificationId` | `integer` |  |

#### WorkSpaceUserCoursesFilterViewModel

| Field | Type | Required |
|---|---|---|
| `provider` | [WorkSpaceProvider](#workspaceprovider) | yes |
| `orgId` | `string` | yes |

#### WorkSpaceUserProgramsFilterViewModel

| Field | Type | Required |
|---|---|---|
| `provider` | [WorkSpaceProvider](#workspaceprovider) | yes |
| `orgId` | `string` | yes |
| `userId` | `string` |  |
| `title` | `string` |  |
| `isMandatory` | `boolean` |  |
| `status` | [LearnerStatus](#learnerstatus) |  |
| `sortBy` | [Sort](#sort) |  |
| `sortDesc` | `boolean` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `classificationId` | `integer` |  |

#### WorkSpaceUserProgressRequestModel

| Field | Type | Required |
|---|---|---|
| `term` | `string` |  |
| `provider` | [WorkSpaceProvider](#workspaceprovider) |  |
| `organizationId` | `string` |  |
| `workSpaceTypeId` | `string` |  |
| `pageNumber` | `integer` |  |
| `pageSize` | `integer` |  |
| `activeStatus` | [ActiveStatus](#activestatus) |  |
| `programIds` | `string[]` |  |

#### AcademyLearningPathManagementStatus

Enum: `1`, `2`, `3`

#### AcademyPathLearnerStatus

Enum: `1`, `2`, `3`, `4`

#### ActiveStatus

Enum: `1`, `2`, `3`

#### ActivityPeriod

Enum: `0`, `1`, `2`

#### AssignedLearningPathItemProgressStatus

Enum: `1`, `2`, `3`

#### AssignedLearningPathStatus

Enum: `1`, `2`, `3`

#### CancellationPolicyType

Enum: `1`, `2`

#### CartPaymentOption

Enum: `1`, `2`, `3`

#### CatalogItemType

Enum: `1`, `2`

#### ChartTypes

Enum: `1`, `2`, `3`

#### CheckListColumnType

Enum: `0`, `1`, `2`, `3`, `4`

#### CheckListItemType

Enum: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `13`, `14`, `15`, `16`

#### DurationTypeEnum

Enum: `1`, `2`, `3`

#### EnrollementStatus

Enum: `0`, `1`

#### EventReservationStatus

Enum: `1`, `2`, `3`

#### EventSortBy

Enum: `1`, `2`

#### ExamExceptionRequestType

Enum: `1`, `2`

#### ExamSortBy

Enum: `3`, `4`

#### ExcuseRequestStatus

Enum: `1`, `2`, `3`

#### IamIdentityTypeEnum

Enum: `1`, `2`, `3`, `4`

#### InvitationResult

Enum: `0`, `1`, `2`, `3`

#### LearnerStatus

Enum: `1`, `2`, `3`, `4`, `5`, `6`

#### LearningPathItemType

Enum: `1`, `2`, `3`, `4`, `5`

#### LearningPathStatus

Enum: `1`, `2`, `3`, `4`

#### LicenceRequestStatus

Enum: `0`, `1`, `2`, `3`

#### ModuleType

Enum: `1`, `2`, `3`

#### NotificationChannelType

Enum: `0`, `1`, `2`, `3`

#### OverDueStatus

Enum: `1`, `2`, `3`

#### PaymentGatewayType

Enum: `1`, `2`, `3`, `4`, `5`, `6`

#### PaymentMethodEnum

Enum: `1`, `2`, `3`, `4`

#### PaymentModules

Enum: `1`, `2`, `3`, `4`, `7`, `8`, `9`, `10`

#### PaymentRequestMethodEnum

Enum: `0`, `1`

#### PaymentRequestStatus

Enum: `0`, `1`, `2`, `3`, `4`

#### ProfileTheme

Enum: `1`, `2`, `3`

#### ProgramSortBy

Enum: `1`, `2`, `3`, `4`

#### ReasonsList

Enum: `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`

#### RegistrationListType

Enum: `0`, `1`, `2`, `3`

#### RegistrationStatus

Enum: `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`

#### RegistrationType

Enum: `0`, `1`, `2`, `3`, `4`

#### ReminderType

Enum: `0`, `1`

#### RequirementDataTypes

Enum: `1`, `2`, `3`

#### ReservationStatus

Enum: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`

#### SiteContentType

Enum: `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `13`, `14`

#### Sort

Enum: `1`, `2`, `3`, `4`, `5`, `6`

#### TrainingTypeEnum

Enum: `0`, `1`, `2`, `3`

#### TransactionTypes

Enum: `1`, `2`, `3`, `4`

#### UserRequestSortKey

Enum: `1`, `2`, `3`

#### UserRequestStatus

Enum: `0`, `1`, `2`, `3`, `4`, `5`, `6`

#### UserRequestType

Enum: `0`, `1`

#### WorkSpaceProvider

Enum: `1`, `2`, `3`, `4`, `5`

## 8. Changes

Since 8 September 2026: **29 added, 1 removed.**

**Added**

- `GET /api/v1/AcademyLearningPath`
- `GET /api/v1/AcademyLearningPath/summary`
- `GET /api/v1/AcademyLearningPath/{id}/certificates`
- `GET /api/v1/AcademyLearningPath/{id}/content`
- `POST /api/v1/AcademyLearningPath/{id}/evaluation`
- `GET /api/v1/AcademyLearningPath/{id}/evaluation`
- `POST /api/v1/AcademyLearningPath/{id}/items/{itemId}/start`
- `GET /api/v1/AcademyLearningPath/{id}/overview`
- `POST /api/v1/AcademyLearningPath/{id}/path-certificate`
- `POST /api/v1/AcademyLearningPath/{id}/start`
- `GET /api/v1/AcademyLearningPathManagement`
- `GET /api/v1/AcademyLearningPathManagement/summary`
- `GET /api/v1/AcademyLearningPathManagement/{id}/content`
- `GET /api/v1/AcademyLearningPathManagement/{id}/overview`
- `GET /api/v1/AcademyLearningPathManagement/{id}/progress-report`
- `POST /api/v1/AcademyLearningPathManagement/{id}/users`
- `GET /api/v1/AcademyLearningPathManagement/{id}/users`
- `GET /api/v1/AlmentorCourseCatalogue/GetProgramProgess`
- `POST /api/v1/Eligibility/declaration`
- `GET /api/v1/FinancialAwareness/LearningInitiative`
- `POST /api/v1/Payment/PayLater`
- `GET /api/v1/Payment/PayLater/{billNumber}`
- `GET /api/v1/Program/GetProgramLiveSessions`
- `POST /api/v1/Users/DeletePhoto`
- `GET /api/v1/Users/Roles`
- `POST /api/v1/WorkSpaces/Classification/FA/programs/{scope}`
- `GET /api/v1/WorkSpaces/Classification/FA/{scope}`
- `POST /api/v1/identity/registration/change-phone`
- `POST /api/v1/identity/registration/confirm-change-phone`

**Removed**

- `GET /api/v1/WorkSpaces/Classification/FA`
