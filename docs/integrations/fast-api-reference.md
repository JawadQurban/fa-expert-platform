# FA API — Endpoint & Output Reference

**Source:** `https://testingportal.fa.gov.sa/fa-api` — OpenAPI documents `/swagger/v1/swagger.json` and `/swagger/v2/swagger.json`  
**Generated:** 2026-09-08 from the live Swagger definition  
**Scope:** 324 operations · 44 modules · 378 schemas in the contract (227 documented here)

---

## 1. Read this first — how outputs are declared

| | Count | What it means |
|---|---|---|
| Operations with a **typed** response schema | 79 | Swagger declares the exact response object. Its fields are listed in [section 4](#4-output-object-definitions). |
| Operations with an **untyped** response | 245 | Swagger declares only `200 OK` with no schema (the controller returns `IActionResult`/`object`). The shape is **not in the contract** — it must be confirmed by calling the endpoint or reading the controller. |

All typed responses are served as `application/json` (also offered as `text/json` and `text/plain`).

### The two response envelopes

Nearly every typed response is a wrapper, not a bare object:

| Envelope | Fields | Payload location |
|---|---|---|
| `<X>ApiResponse` | `statusCode`, `succeeded`, `message`, `errors[]`, `data` | `data` → `X` |
| `<X>ReturnResult` | `isSuccess`, `message`, `messageAr`, `statusCode`, `data` | `data` → `X` |
| `<X>ListApiResponse` / `<X>ListReturnResult` | same as above | `data` → `X[]` |

So a response of `ProgramDetailsDtoReturnResult` means: envelope + `data: ProgramDetailsDto`. Look up `ProgramDetailsDto` in section 4 for the real payload.

### Common request conventions

- `Authorization: Bearer <JWT>` on all authenticated endpoints (public ones: registration, recovery, catalog/overview reads).
- `Accept-Language: ar | en` on every endpoint — switches all localized text fields.
- Paged list endpoints take `pageNumber` / `pageSize` and return `totalCount` / `totalPages` inside the payload.

---

## 2. Module index

| # | Module | Ops | Typed outputs | Area |
|---|---|---|---|---|
| 1 | [AlmentorCourseCatalogue](#almentorcoursecatalogue) | 5 | 3 | Full program details as rendered on the program details page: descriptive conten |
| 2 | [Announcements](#announcements) | 8 | 0 | — |
| 3 | [Cart](#cart) | 2 | 1 | Deletes a cart item and its related records based on the given ID. |
| 4 | [Catalog](#catalog) | 1 | 0 | — |
| 5 | [Certificate](#certificate) | 3 | 0 | — |
| 6 | [DashBoard](#dashboard) | 9 | 7 | Retrieves a list of exams for the currently logged-in user based on search crite |
| 7 | [Eligibility](#eligibility) | 4 | 0 | Checks whether the supplied email belongs to a recognized university domain. Ano |
| 8 | [Event](#event) | 7 | 1 | Cancels an event registration and processes refund if needed. |
| 9 | [Exam](#exam) | 16 | 9 | Gets the CFA certificates section displayed on the Self Learning page. |
| 10 | [ExecuseRequest](#execuserequest) | 4 | 0 | — |
| 11 | [FinancialSkills](#financialskills) | 7 | 6 | Job family details + every job role under it, matching the MVC `FinancialSkills/ |
| 12 | [Home](#home) | 12 | 8 | Retrieves a collection of trending programs, exams, events, and banners, and ini |
| 13 | [IdentityCheckupDiagnostic](#identitycheckupdiagnostic) | 1 | 0 | — |
| 14 | [IdentityNafath](#identitynafath) | 5 | 0 | Creates a generic Nafath challenge for the current Mobile compatibility flow. |
| 15 | [IdentityPublicRegistration](#identitypublicregistration) | 5 | 0 | Checks registration identity format and required journey. |
| 16 | [IdentityRecovery](#identityrecovery) | 5 | 0 | Starts the email-based forgot-password flow. |
| 17 | [IdentityRegistration](#identityregistration) | 5 | 0 | Gets IdentityManagement's registration checkup status for the authenticated acco |
| 18 | [IdentityRegistrationEmail](#identityregistrationemail) | 3 | 0 | Resends the authenticated account's registration confirmation email. |
| 19 | [IndividualLearningPath](#individuallearningpath) | 10 | 0 | — |
| 20 | [Invitation](#invitation) | 7 | 0 | — |
| 21 | [LearningGroup](#learninggroup) | 6 | 0 | — |
| 22 | [LearningPath](#learningpath) | 29 | 0 | — |
| 23 | [Lookup](#lookup) | 10 | 3 | Retrieves the list of program competency levels used to populate the "Competency |
| 24 | [MobileConfiguration](#mobileconfiguration) | 2 | 0 | Get current mobile configuration flag. |
| 25 | [Mursion](#mursion) | 3 | 3 | — |
| 26 | [Notification](#notification) | 2 | 0 | — |
| 27 | [Orgnization](#orgnization) | 9 | 2 | — |
| 28 | [Payment](#payment) | 6 | 6 | Retrieves the discount value associated with a given coupon code. |
| 29 | [PaymentProcess](#paymentprocess) | 1 | 0 | — |
| 30 | [Player](#player) | 12 | 0 | — |
| 31 | [PrePostAssesment](#prepostassesment) | 2 | 0 | — |
| 32 | [Program](#program) | 26 | 7 | Returns the complete data rendered by the public Training Topics page (`/Service |
| 33 | [QualificationsEducation](#qualificationseducation) | 4 | 4 | Retrieves a list of educational qualifications for the currently logged-in user. |
| 34 | [QualificationsPracticalExperience](#qualificationspracticalexperience) | 4 | 4 | Retrieves a list of practical experience qualifications for the current user. |
| 35 | [QualificationsProfessional](#qualificationsprofessional) | 4 | 4 | Gets all professional certifications for the current user. |
| 36 | [QualificationsTrainingCourses](#qualificationstrainingcourses) | 8 | 8 | Retrieves a list of training courses for the currently authenticated user. |
| 37 | [Reports](#reports) | 27 | 0 | — |
| 38 | [Search](#search) | 1 | 1 | Searches Programs, Exams, and Events by searchText and returns all three collect |
| 39 | [TrackingRequest](#trackingrequest) | 5 | 0 | Paged list of the current user's requests (same data as Dashboard MyRequests). |
| 40 | [TrainerContracts](#trainercontracts) | 5 | 1 | Retrieves all trainer contracts associated with the currently authenticated user |
| 41 | [UserCertificate](#usercertificate) | 1 | 0 | — |
| 42 | [Users](#users) | 9 | 1 | Updates the profile photo of the currently logged-in user. Reuses (internal serv |
| 43 | [WorkSpace](#workspace) | 27 | 0 | — |
| 44 | [WorkSpaces](#workspaces) | 2 | 0 | — |

---

## 3. Endpoints by module

### AlmentorCourseCatalogue

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/AlmentorCourseCatalogue/GetAllPrograms` | — | `WorkSpaceProgramsFilterViewModel` | *not declared* | 200 |
| `GET` | `/api/v1/AlmentorCourseCatalogue/GetAllLearnsProgress` | — | — | `ApiResponse` | 200 |
| `POST` | `/api/v1/AlmentorCourseCatalogue/MyPrograms` | — | `SearchMyProgramsDto` | `ApiResponse` | 200 |
| `GET` | `/api/v1/AlmentorCourseCatalogue/GetTimeLineChartData`<br>`programId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/AlmentorCourseCatalogue/GetProgramDetails` | Full program details as rendered on the program details page: descriptive content, topics, location, lessons count, pricing, nearest plan, registration requirements, rela | `ProgramDetailDto` | `ProgramDetailsDtoReturnResult` | 200, 404, 500 |

### Announcements

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Announcements/GetAll` | — | `AnnouncementGetAllQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Announcements/Details` | — | `AnnouncementGetByIdQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Announcements/create` | — | `CreateOrUpdateAnnouncementDto` | *not declared* | 200 |
| `POST` | `/api/v1/Announcements/edit` | — | `CreateOrUpdateAnnouncementDto` | *not declared* | 200 |
| `POST` | `/api/v1/Announcements/SetStatus` | — | `AnnouncementSetStatusCommandModel` | *not declared* | 200 |
| `POST` | `/api/v1/Announcements/Remove` | — | `AnnouncementGetByIdQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Announcements/GetNotification` | — | `NotificationGetByOrganizationQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Announcements/SendNotification` | — | `NotificationCategoryModel` | *not declared* | 200 |

### Cart

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Cart/delete/{id}`<br>`id` | Deletes a cart item and its related records based on the given ID. | — | *not declared* | 200 |
| `GET` | `/api/v1/Cart/GetShoppingCartWithDetails` | — | — | `CartPaymentViewModelReturnResult` | 200, 500 |

### Catalog

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Catalog/search`<br>`Keyword`, `Type` | — | — | *not declared* | 200 |

### Certificate

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Certificate/CurrentCertificates` | — | `UserCertificateFilterRequest` | *not declared* | 200 |
| `GET` | `/api/v1/Certificate/Generate`<br>`id`, `asBase64` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Certificate/Download`<br>`id` | — | — | *not declared* | 200 |

### DashBoard

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/DashBoard/MyPrograms` | — | `SearchMyProgramsDto` | `ApiResponse` | 200 |
| `POST` | `/api/v1/DashBoard/MySelfLearningPrograms` | — | `MySelfLearningViewModel` | `ApiResponse` | 200 |
| `POST` | `/api/v1/DashBoard/MyExams` | Retrieves a list of exams for the currently logged-in user based on search criteria. | `SearchMyExamDto` | `ApiResponse` | 200, 400 |
| `POST` | `/api/v1/DashBoard/MyEvents` | Retrieves a list of events for the currently logged-in user based on search criteria. | `SearchMyEventsDto` | `ApiResponse` | 200, 400 |
| `GET` | `/api/v1/DashBoard/ReservationInfo/{id}/{type}`<br>`id`, `type` | Retrieves reservation information based on ID and module type. | — | `ReservationInfoResponseDtoApiResponse` | 200, 403, 404, 500 |
| `POST` | `/api/v1/DashBoard/AddUserRate`<br>`reservationId`, `type`, `rate`, `comment` | Submits a user rating for a specific module (Training, Exams, Events). | — | `ApiResponse` | 200, 400 |
| `POST` | `/api/v1/DashBoard/GetSubmittedRate/{reservationId}/{type}`<br>`reservationId`, `type` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/DashBoard/MyCoupon` | Retrieves a Coupon for the currently logged-in user. | — | *not declared* | 200 |
| `GET` | `/api/v1/DashBoard/ProgramEndWithExam` | Retrieves program that ends with an exam along with coupon details for the currently logged-in user dashboard. | — | `ApiResponse` | 200 |

### Eligibility

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Eligibility/check` | Checks whether the supplied email belongs to a recognized university domain. Anonymous: no authentication required (mirrors the source MVC endpoint). | `CheckEligibilityRequestDto` | *not declared* | 200 |
| `GET` | `/api/v1/Eligibility/status` | Returns the current user's university email and whether it is verified. Business equivalent of the MVC "Prompt" action (no view rendering / redirect). | — | *not declared* | 200 |
| `POST` | `/api/v1/Eligibility/send-code` | Generates a verification code for the supplied university email, caches it (10 min) and emails it to the user. Business equivalent of the MVC "SendCode" action. | `SendVerificationCodeRequestDto` | *not declared* | 200 |
| `POST` | `/api/v1/Eligibility/verify-code` | Verifies the code previously sent and confirms the user's university email. Business equivalent of the MVC "VerifyCode" action (pending email is supplied in the request b | `VerifyVerificationCodeRequestDto` | *not declared* | 200 |

### Event

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Event/Search` | — | `FilterEventDto` | *not declared* | 200 |
| `GET` | `/api/v1/Event/GetEventTypes` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Event/GetEventPeriods` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Event/GetEventDetails`<br>`eventId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Event/AddToCart` | — | `EventRegisterationApiViewModel` | *not declared* | 500 |
| `POST` | `/api/v1/Event/CancelReservation` | Cancels an event registration and processes refund if needed. | `CancelReservationViewModel` | `BooleanReturnResult` | 200 |
| `POST` | `/api/v1/Event/RegisterUser` | — | `object` | *not declared* | 200 |

### Exam

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Exam/GetCfaCertificates` | Gets the CFA certificates section displayed on the Self Learning page. | — | `CfaCertificatesSectionDtoApiResponse` | 200 |
| `POST` | `/api/v1/Exam/Search` | — | `FilterExamDto` | *not declared* | 200 |
| `GET` | `/api/v1/Exam/GetExamDetailsById`<br>`examId` | Retrieves exam details for the given exam ID. | — | *not declared* | 200 |
| `GET` | `/api/v1/Exam/ValidateCertificate`<br>`certificateNumber` | Validates a certificate by its issue number and, when valid, returns the certificate information shown on the public "Validate Certificate" web page. | — | `UserCertificateApiModelApiResponse` | 200 |
| `GET` | `/api/v1/Exam/GetExamProfiles`<br>`examId` | Gets exam profiles for a given exam ID. | — | *not declared* | 200 |
| `GET` | `/api/v1/Exam/GetExamTestCenters`<br>`examId` | Retrieves a list of available exam centers for a given exam. | — | `TestCenterViewModelReturnResult` | 200, 400, 404, 500 |
| `GET` | `/api/v1/Exam/TestingCenters` | Gets the list of testing centers. | — | *not declared* | 200, 404, 500 |
| `GET` | `/api/v1/Exam/GetCenterAvailableDates`<br>`centerId`, `profileId` | Gets available center dates based on center ID and profile ID. | — | *not declared* | 200 |
| `GET` | `/api/v1/Exam/GetCenterAvailableTimes`<br>`centerId`, `date`, `profileId` | Gets available center times based on center ID, date, and profile ID. | — | *not declared* | 200 |
| `POST` | `/api/v1/Exam/AddToCart` | — | `ExamAddToCartApiDto` | `BooleanReturnResult` | 200, 500 |
| `POST` | `/api/v1/Exam/External/AddToCart`<br>`code` | Add an external exam to the shopping cart. | — | `BooleanReturnResult` | 200, 400, 500 |
| `POST` | `/api/v1/Exam/ChangeProfile`<br>`reservationId`, `profileId` | Changes the exam profile for a reservation if it meets eligibility conditions. | — | `BooleanApiResponse` | 200, 400, 500 |
| `POST` | `/api/v1/Exam/cancel-reservation` | Cancels an exam reservation and processes refund if applicable. | `CancelReservationViewModel` | `BooleanReturnResult` | 200 |
| `POST` | `/api/v1/Exam/exam-reschedule` | Reschedules an exam for the user. | `RescheduleExamDto` | `RescheduleExamResponseDtoApiResponse` | 200 |
| `GET` | `/api/v1/Exam/generate-exam-report`<br>`regId`, `isExport` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Exam/Overview`<br>`count` | Returns the Certificates (Exams) Overview: most requested certificates, new certificates, main categories, policies and the explore-certificates call-to-action, in a sing | — | `CertificatesOverviewDtoReturnResult` | 200 |

### ExecuseRequest

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/ExecuseRequest/Service/filter-excuse-request`<br>`SelectedExcuseTypeId`, `StatusId`, `CreatedDateFrom`, `CreatedDateTo`, `PageNumber`, `PageSize` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/ExecuseRequest/Service/can-submit-excuse`<br>`reservationId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/ExecuseRequest/Service/excuse-types` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/ExecuseRequest/Service/submit-excuse` | — | `object` | *not declared* | 200 |

### FinancialSkills

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/FinancialSkills/GetFrameworkStructure` | — | `FrameworkStructureRequestDto` | `FrameworkStructureResponseDtoApiResponse` | 200 |
| `GET` | `/api/v1/FinancialSkills/GetJobFamilyDetails`<br>`familyId`, `sectorId` | Job family details + every job role under it, matching the MVC `FinancialSkills/FrameworkStructure/JobRoles?FId=&SId=` page. All roles are returned with full detail (resp | — | `JobFamilyDetailsResponseDtoApiResponse` | 200, 404 |
| `GET` | `/api/v1/FinancialSkills/GetJobFamilyPrograms`<br>`familyId`, `sectorId` | Programs related to a job family, matching the MVC `Services/GetJobFamilyProgram?resultJobFamilyId=&sectorId=` action (loaded via its own request in MVC too). Reuses `IPr | — | `ProgramDtoListApiResponse` | 200 |
| `GET` | `/api/v1/FinancialSkills/GetFrameworkOverview` | — | — | `FinancialSkillsFrameworkOverviewDtoApiResponse` | 200 |
| `GET` | `/api/v1/FinancialSkills/GetCompetencies`<br>`competencyTypeId`, `pageNumber`, `pageSize` | Paged list of competencies for a given competency type, matching the MVC `FinancialSkills/GetCompetencyByType` action (which returns rendered HTML) but as structured JSON | — | *not declared* | 200 |
| `GET` | `/api/v1/FinancialSkills/GetCompetencyDetails`<br>`id` | Full competency details, matching the MVC `FinancialSkills/FinancialSkillCard/{id}` action (which renders HTML) but as structured JSON. Reuses (internal service) the same | — | `CompetencyDetailsDtoReturnResult` | 200, 404 |
| `GET` | `/api/v1/FinancialSkills/GetCompetencyLevelDetails`<br>`competencyId`, `levelOrder`, `pageNumber`, `pageSize` | Training programs and certificates related to a single competency level, matching the MVC level-expand AJAX call (`Ims.Portal.Web.Areas.Competencies.Controllers.HomeContr | — | `CompetencyLevelDetailsDtoReturnResult` | 200, 404 |

### Home

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Home/Trending` | Retrieves a collection of trending programs, exams, events, and banners, and initiative. | — | `TrendingHomeDtoReturnResult` | 200 |
| `GET` | `/api/v1/Home/EventsOverview` | Retrieves everything needed to render the public Events Overview page (`https://fa.gov.sa/services/events/overview`). | — | `EventsOverviewDtoReturnResult` | 200 |
| `GET` | `/api/v1/Home/Calendar`<br>`startDate` | Retrieves a list of scheduled programs and exams for display in a calendar view. | — | `CalendarUnifiedItemDtoListReturnResult` | 200 |
| `GET` | `/api/v1/Home/Calendar-Guest`<br>`startDate` | Retrieves a list of scheduled events for display in a calendar view. | — | `CalendarUnifiedItemDtoReturnResult` | 200 |
| `GET` | `/api/v1/Home/InitiativeMenu` | Retrieves the initiative menu including active and opening soon items. | — | `InitiativeMenuDtoReturnResult` | 200 |
| `GET` | `/api/v1/Home/TopMenu` | Retrieves the complete website top-menu tree (the same business data the MVC application renders), including programs, financial-sector programs, exams, events, reports a | — | `TopMenuDtoReturnResult` | 200 |
| `POST` | `/api/v1/Home/contactus` | Submits a contact request from the user. | `ContactUsDto` | *not declared* | 200 |
| `GET` | `/api/v1/Home/force-update` | Checks if a force update is required and returns the app version from configuration. | — | *not declared* | 200 |
| `GET` | `/api/v1/Home/about-us` | Retrieves the About Us information, including contact details, social media links, and working hours. | — | *not declared* | 200 |
| `GET` | `/api/v1/Home/report-and-study` | Returns all reports and studies with language-based fields. | — | *not declared* | 200 |
| `GET` | `/api/v1/Home/Experts` | Returns the experts shown in the Home page "Experts Platform" (منصة الخبراء) section: this month's (freelance) trainers, in the same order the website renders them. | — | `HomeExpertDtoListReturnResult` | 200 |
| `GET` | `/api/v1/Home/FinancialSectorGateway` | Retrieves the Financial Sector Gateway content as four categories: Training Programs, Self Learning Programs, Knowledge Seminars, and Sector Experts Meetings. | — | `FinancialSectorGatewayDtoReturnResult` | 200 |

### IdentityCheckupDiagnostic

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity-test/registration/checkup/status` | — | — | *not declared* | 200, 401, 404, 502, 503, 504 |

### IdentityNafath

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/nafath/create-request` | Creates a generic Nafath challenge for the current Mobile compatibility flow. | `NafathCreateRequest` | *not declared* | 200 |
| `POST` | `/api/v1/identity/nafath/check-status` | Polls a generic Nafath login challenge and preserves the current Identity response. | `NafathChallengeRequest` | *not declared* | 200 |
| `POST` | `/api/v1/identity/nafath/get-person-data` | Gets the current Identity registration model mapped from Nafath person data. | `NafathChallengeRequest` | *not declared* | 200 |
| `POST` | `/api/v1/identity/nafath/token` | Preserves the current Identity Nafath token compatibility response. | `NafathTokenRequest` | *not declared* | 200 |
| `POST` | `/api/v1/identity/nafath/is-nafath-login` | Checks whether the current Identity account is eligible for Nafath login. | `IsNafathLoginRequest` | *not declared* | 200 |

### IdentityPublicRegistration

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/registration/check-identity` | Checks registration identity format and required journey. | `RegistrationCheckIdentityRequest` | *not declared* | 200, 400, 500, 502, 504 |
| `POST` | `/api/v1/identity/registration/nafath/status` | Polls the registration-specific Nafath challenge status. | `NafathRecoveryStatusRequest` | *not declared* | 200, 400, 500, 502, 504 |
| `POST` | `/api/v1/identity/registration` | Creates an individual registration account. | `IndividualRegistrationRequest` | *not declared* | 200, 400, 500, 502, 504 |
| `POST` | `/api/v1/identity/registration/confirm-email` | Confirms a newly registered account's email address. | `ConfirmRegistrationEmailRequest` | *not declared* | 200, 400, 500, 502, 504 |
| `GET` | `/api/v1/identity/registration/terms` | Gets localized Terms and Conditions for registration. | — | *not declared* | 200, 404, 500, 502, 504 |

### IdentityRecovery

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/recovery/forgot-password` | Starts the email-based forgot-password flow. | `ForgotPasswordRequest` | *not declared* | 200, 400, 500, 502, 504 |
| `POST` | `/api/v1/identity/recovery/forgot-password/reset` | Completes an email-link password reset. | `ResetPasswordRequest` | *not declared* | 200, 400, 500, 502, 504 |
| `POST` | `/api/v1/identity/recovery/forgot-password/nafath/status` | Polls a Nafath challenge for password recovery. | `NafathRecoveryStatusRequest` | *not declared* | 200, 400, 500, 502, 504 |
| `POST` | `/api/v1/identity/recovery/forgot-password/reset/nafath` | Completes a Nafath-verified password reset. | `ResetPasswordNafathRequest` | *not declared* | 200, 400, 500, 502, 504 |
| `POST` | `/api/v1/identity/recovery/forgot-username` | Requests username recovery by registered email address. | `ForgotUsernameRequest` | *not declared* | 200, 400, 500, 502, 504 |

### IdentityRegistration

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/registration/checkup/status` | Gets IdentityManagement's registration checkup status for the authenticated account. | — | *not declared* | 200, 400, 401, 404, 502, 504 |
| `POST` | `/api/v1/identity/registration/checkup/username/update-to-identity` | Updates the authenticated account username to its verified identity number. | — | *not declared* | 200, 400, 401, 403, 404, 409, 500, 502, 504 |
| `POST` | `/api/v1/identity/registration/checkup/identity/nafath/initiate` | Initiates Nafath verification for the authenticated account's current identity. | — | *not declared* | 200, 400, 401, 403, 404, 500, 502, 504 |
| `POST` | `/api/v1/identity/registration/checkup/identity/nafath/status` | Polls and, when approved, completes Nafath identity verification. | `NafathIdentityVerificationPollRequest` | *not declared* | 200, 400, 401, 403, 404, 500, 502, 504 |
| `POST` | `/api/v1/identity/registration/checkup/identity/change` | Changes the registration identity for the authenticated account. | `ChangeRegistrationIdentityRequest` | *not declared* | 200, 400, 401, 403, 404, 409, 500, 502, 504 |

### IdentityRegistrationEmail

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/identity/registration/resend-confirmation-email` | Resends the authenticated account's registration confirmation email. | — | *not declared* | 200, 400, 401, 403, 500, 502, 504 |
| `POST` | `/api/v1/identity/registration/change-email` | Starts changing the authenticated account's email address. | `ChangeRegistrationEmailRequest` | *not declared* | 200, 400, 401, 403, 500, 502, 504 |
| `POST` | `/api/v1/identity/registration/confirm-change-email` | Confirms a pending registration email change. | `ConfirmRegistrationEmailChangeRequest` | *not declared* | 200, 400, 500, 502, 504 |

### IndividualLearningPath

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/IndividualLearningPath/Search` | — | `LearningPathFilterViewModel` | *not declared* | 200 |
| `GET` | `/api/v1/IndividualLearningPath/Details/{id}`<br>`id` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/IndividualLearningPath/{id}/competencies`<br>`id` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/IndividualLearningPath/{id}/certificates`<br>`id` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/IndividualLearningPath/chart/Cards` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/IndividualLearningPath/chart/CardData` | — | `LearningPathDashboardCardFilter` | *not declared* | 200 |
| `GET` | `/api/v1/IndividualLearningPath/chart/Timeline`<br>`userId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/IndividualLearningPath/chart/completion-rate`<br>`userId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/IndividualLearningPath/chart/status-summary` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/IndividualLearningPath/chart/program-status-summary` | — | — | *not declared* | 200 |

### Invitation

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Invitation/Invite` | — | `InviteUserViewModel[]` | *not declared* | 200 |
| `POST` | `/api/v1/Invitation/Resend` | — | `InviteUserViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/Invitation/Revoke` | — | `InviteUserViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/Invitation/User/Invites` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Invitation/Search` | — | `SearchInviteViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/Invitation/Accept/{key}`<br>`key` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Invitation/Reject/{key}`<br>`key` | — | — | *not declared* | 200 |

### LearningGroup

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/LearningGroup/GetAll` | — | `LearningGroupFilterViewModel` | *not declared* | 200 |
| `GET` | `/api/v1/LearningGroup/Detail`<br>`Id`, `OrganizationId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/LearningGroup/ChangeStatus` | — | `UpdateLearningGroupStatusViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/LearningGroup/Remove`<br>`organizationId` | — | `string[]` | *not declared* | 200 |
| `POST` | `/api/v1/LearningGroup/Create` | — | `object` | *not declared* | 200 |
| `POST` | `/api/v1/LearningGroup/Edit/{id}`<br>`id` | — | `object` | *not declared* | 200 |

### LearningPath

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/LearningPath/{id}`<br>`id` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/Details/{id}`<br>`id` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath`<br>`orgId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath` | — | `CreateLearningPathViewModel` | *not declared* | 200 |
| `DELETE` | `/api/v1/LearningPath`<br>`id` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/Cards`<br>`orgId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/OverDueAssignments` | — | `OverDueAssignmentRequestViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/Search` | — | `OrgLearningPathFilterViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/User/{userId}/Search`<br>`userId` | — | `OrgLearningPathFilterViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/draft`<br>`id` | — | `LearningPathViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/Clone/{id}`<br>`id` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/ValidateBulkAssign/{learningPathId}/{orgId}`<br>`learningPathId`, `orgId` | — | `object` | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/{learningPathId}/assignlearners`<br>`learningPathId` | — | `AssignLearnersToLearningPathRequestModel` | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/{learningPathId}/UnAssign/{userId}`<br>`learningPathId`, `userId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/OrganizationUsers`<br>`term`, `organizationId`, `LearningPathId`, `pageNumber`, `pageSize` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/{learningPathId}/assignees`<br>`name`, `IsActive`, `learningPathId`, `pageNumber`, `pageSize` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/chart/completion-rate`<br>`orgId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/chart/activity`<br>`period`, `orgId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/chart/status-summary`<br>`orgId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/update/{id}`<br>`id` | — | `LearningPathViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/{id}/status/{status}`<br>`id`, `status` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/{learningPathId}/items/links/{itemId}/completed`<br>`learningPathId`, `itemId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/overall`<br>`learningPathId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/{learningPathId}/items/next`<br>`learningPathId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/countdown`<br>`learningPathId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/overdue`<br>`learningPathId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/LearningPath/{learningPathId}/progress/averagetimetocomplete`<br>`learningPathId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/Assignee/Update` | — | `LearningPathAssigneeStatusViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/LearningPath/Assignee/History` | — | `LearningPathAssigneeHistoryRequestViewModel` | *not declared* | 200 |

### Lookup

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Lookup/GetSectors` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Lookup/GetTopics` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Lookup/GetCompetencyLevels` | Retrieves the list of program competency levels used to populate the "Competency Level" search filter (`FilterProgramDto.CompetencyLevelId`). | — | *not declared* | 200 |
| `GET` | `/api/v1/Lookup/GetAllEducationType` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Lookup/GetAllCountries` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Lookup/GetCountries` | Returns the native FAST country and nationality data used by registration clients. | — | `CountryRegistrationLookupDto[]` | 200 |
| `GET` | `/api/v1/Lookup/GetCountryById/{countryId}`<br>`countryId` | Returns a native FAST country by its FAST identifier. | — | `CountryRegistrationLookupDto` | 200, 404 |
| `GET` | `/api/v1/Lookup/GetCountryByNafathMappingId/{nafathCountryId}`<br>`nafathCountryId` | Returns a native FAST country by its IAM/Nafath mapping identifier. | — | `CountryRegistrationLookupDto` | 200, 404 |
| `GET` | `/api/v1/Lookup/GetCancellationReasons` | Retrieves a list of cancellation reasons with both Arabic and English names. | — | *not declared* | 200 |
| `GET` | `/api/v1/Lookup/GetCancellationPolicy`<br>`type` | Returns the cancellation policy URL for the requested policy type. | — | *not declared* | 200 |

### MobileConfiguration

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/MobileConfiguration/is-mobile-nafath-enabled` | Get current mobile configuration flag. | — | *not declared* | 200 |
| `GET` | `/api/v1/MobileConfiguration/mobile-force-update` | Checks if a force update is required and returns the app version from configuration. | — | *not declared* | 200 |

### Mursion

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Mursion/GetDetails` | — | — | `MursionDetailsDtoReturnResult` | 200, 404 |
| `POST` | `/api/v1/Mursion/AddToCart` | — | — | `MursionAddToCartResponseDtoReturnResult` | 200, 401, 403, 404 |
| `GET` | `/api/v1/Mursion/GetPostPaymentAction`<br>`billNumber` | — | — | `MursionPostPaymentActionDtoReturnResult` | 200, 400, 401, 404 |

### Notification

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/org/{orgId}`<br>`orgId` | — | — | *not declared* | 200 |
| `POST` | `/org/{orgId}`<br>`orgId` | — | `NotificationPreferencesDto` | *not declared* | 200 |

### Orgnization

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Orgnization/RegisterOrganizationMembers` | — | `object` | *not declared* | 200 |
| `POST` | `/api/v1/Orgnization/BulkRegisterOrganizationMembers` | — | `OrgUserViewModel[]` | *not declared* | 200 |
| `POST` | `/api/v1/Orgnization/RemoveMember` | — | `string[]` | *not declared* | 200 |
| `POST` | `/api/v1/Orgnization/UpdateMember` | — | `UpdateUserRoleViewModel` | *not declared* | 200 |
| `GET` | `/api/v1/Orgnization/GetOrganizationUsers`<br>`term`, `pageNumber`, `pageSize`, `organizationId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Orgnization/Roles` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Orgnization/Roles/{userId}`<br>`userId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Orgnization/GetOrganisationsPartners`<br>`pageSize`, `pageNumber` | — | — | `OrganizationPartnerModelIPagedListReturnResult` | 200 |
| `POST` | `/api/v1/Orgnization/EnableDisablePartnerOrg` | — | `OrganizationPartnerModel` | `BooleanReturnResult` | 200 |

### Payment

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Payment/CheckPaymentComplish`<br>`billNumber` | — | — | `BooleanReturnResult` | 200, 500 |
| `POST` | `/api/v1/Payment/Checkout`<br>`couponCode` | — | — | `CheckoutResponseApiDtoReturnResult` | 200, 500 |
| `GET` | `/api/v1/Payment/Bills` | — | — | `UserBillsListDtoListReturnResult` | 200, 500 |
| `POST` | `/api/v1/Payment/Search/Bills` | — | `BillsRequestDto` | `UserBillsListDtoListReturnResult` | 200, 500 |
| `GET` | `/api/v1/Payment/GetCouponValue`<br>`couponCode` | Retrieves the discount value associated with a given coupon code. | — | `CouponResponseDtoApiResponse` | 200, 400 |
| `GET` | `/api/v1/Payment/export-invoice-pdf/{trxId}`<br>`trxId` | Exports the invoice associated with the specified transaction ID to a PDF file. | — | `object` | 200, 400, 404, 500 |

### PaymentProcess

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/PaymentProcess`<br>`billNumber` | — | — | *not declared* | 200 |

### Player

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Player/Player/Header/{id}`<br>`id` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Player/SelfLearning/{programId}`<br>`programId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Player/SelfLearning/status/{programId}`<br>`programId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Player/SelfLearning/GetQuestions`<br>`evalutionCode` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Player/SelfLearning/SaveQuestionAnswer` | — | `AddEvalutionSelfLearningViewModel` | *not declared* | 200 |
| `GET` | `/api/v1/Player/Training/SelfLearning/PreExam/StartExam/{programId}`<br>`programId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Player/Training/SelfLearning/PreExam/PreExam/FinishExam/{programId}`<br>`programId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Player/Training/SelfLearning/PreExam/SaveQuestionAnswer` | — | `SavePrePostQuestionAnswer` | *not declared* | 200 |
| `GET` | `/api/v1/Player/Training/SelfLearning/PostExam/StartExam/{programId}`<br>`programId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Player/Training/SelfLearning/PostExam/FinishExam/{programId}`<br>`programId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Player/Training/SelfLearning/PostExam/SaveQuestionAnswer` | — | `SavePrePostQuestionAnswer` | *not declared* | 200 |
| `POST` | `/api/v1/Player/Training/EnableAdaptiveLearning` | — | `EnableAdaptiveLearningViewModel` | *not declared* | 200 |

### PrePostAssesment

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/PrePostAssesment/GetPrePost` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/PrePostAssesment/DeltaScore` | — | — | *not declared* | 200 |

### Program

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Program/Search` | — | `FilterProgramDto` | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetProgramType`<br>`programId` | — | — | `ProgramDtoReturnResult` | 200 |
| `GET` | `/api/v1/Program/GetTrendingPrograms` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetDigitalInteractiveTools` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/TrainingTopics`<br>`pageNumber`, `pageSize` | Returns the complete data rendered by the public Training Topics page (`/Services/Topics/Training`), including each topic's displayed programs, image URLs and existing we | — | `TrainingTopicsPageDtoReturnResult` | 200 |
| `GET` | `/api/v1/Program/GetAttendaceTypes` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetProgramParticipantLevels` | Lookup for the "Participant Level" (target audience) search filter. Returns the values accepted by `FilterProgramDto.ProgramParticipantLevelIds` on `POST Search`. | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetProgramDetails`<br>`programId` | Full program details as rendered on the program details page: descriptive content, topics, location, lessons count, pricing, nearest plan, registration requirements, rela | — | `ProgramDetailsDtoReturnResult` | 200, 404, 500 |
| `GET` | `/api/v1/Program/GetProgramDetailsHeader`<br>`programId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetProgramAgenda`<br>`programId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetPlansByProgramId`<br>`programId` | Retrieves plans associated with a given program ID. | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetLanguages` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetProgramPeriods` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetProgramPrice` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Program/AddToCart` | Adds a registration to the cart after processing requirements. | `RegistrationSubmitApiDto` | *not declared* | 200 |
| `POST` | `/api/v1/Program/cancel-reservation` | Cancels a reservation and triggers refund process. | `CancelReservationViewModel` | `BooleanReturnResult` | 200 |
| `POST` | `/api/v1/Program/program-reschedule` | Reschedules a reservation to a new plan. | `RescheduleDto` | `RescheduleResponseDtoReturnResult` | 200 |
| `POST` | `/api/v1/Program/AddUserInterestInProgram`<br>`programId` | Adds the current user's interest in a specific training program. | — | `ObjectReturnResultApiResponse` | 200, 400 |
| `GET` | `/api/v1/Program/GetProgramPlanTakers` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Program/MyPrograms` | — | `MyProgramSearchCriteria` | *not declared* | 200 |
| `POST` | `/api/v1/Program/chart/Cards` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Program/chart/CardData` | — | `LearningPathDashboardCardFilter` | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetProgramCardInfo`<br>`programId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/GetTimeLineChartData`<br>`programId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/{id}/competencies`<br>`id` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Program/Overview` | Returns the domain data required to render the public Programs Overview page (https://fa.gov.sa/Services/Programsoverview) in a single response: main categories, featured | — | `ProgramsOverviewDtoReturnResult` | 200 |

### QualificationsEducation

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-education` | Retrieves a list of educational qualifications for the currently logged-in user. | — | `ApiResponse` | 200 |
| `POST` | `/api/qualifications-education` | Saves a new or existing qualification education record for the current user. Supports file upload via multipart/form-data. | `object` | `ApiResponse` | 200 |
| `GET` | `/api/qualifications-education/{id}`<br>`id` | Retrieves a specific qualification by ID, or returns an empty record for new entry. | — | `ApiResponse` | 200 |
| `GET` | `/api/qualifications-education/delete/{id}`<br>`id` | Deletes a qualification education record by its ID. | — | `ApiResponse` | 200 |

### QualificationsPracticalExperience

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-practical-experience` | Retrieves a list of practical experience qualifications for the current user. | — | `ApiResponse` | 200 |
| `POST` | `/api/qualifications-practical-experience` | Saves a new or existing qualification practical experience record for the current user. | `CreateOrUpdatePracticalExperienceDto` | `ApiResponse` | 200 |
| `GET` | `/api/qualifications-practical-experience/{id}`<br>`id` | Retrieves a specific practical experience qualification by ID, or returns an empty record for new entry. | — | `ApiResponse` | 200 |
| `GET` | `/api/qualifications-practical-experience/delete/{id}`<br>`id` | Deletes a qualifications practical experience record by its ID. | — | `ApiResponse` | 200 |

### QualificationsProfessional

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-professional` | Gets all professional certifications for the current user. | — | `ApiResponse` | 200 |
| `POST` | `/api/qualifications-professional` | Saves a new or existing professional certification for the current user. | `object` | `ApiResponse` | 200 |
| `GET` | `/api/qualifications-professional/{id}`<br>`professionalCertificationId`, `id` | Retrieves a specific professional certification by ID for the current user. If no ID is provided, returns an empty initialized object for form population. | — | `ApiResponse` | 200 |
| `POST` | `/api/qualifications-professional/delete/{id}`<br>`id` | Deletes a professional certification by its ID for the current user. | — | `ApiResponse` | 200 |

### QualificationsTrainingCourses

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/qualifications-training-courses`<br>`isInSideFA` | Retrieves a list of training courses for the currently authenticated user. | — | `ApiResponse` | 200 |
| `POST` | `/api/qualifications-training-courses` | Creates or updates a training course qualification for the current user. | `CreateTrainingCourseApiDto` | `ApiResponse` | 200 |
| `GET` | `/api/qualifications-training-courses/{id}`<br>`id` | Retrieves a specific training course qualification for the current user. If the ID is null, returns an empty record for creation. | — | `ApiResponse` | 200 |
| `GET` | `/api/qualifications-training-courses/delete/{id}`<br>`id` | Deletes a training course qualification record. | — | `ApiResponse` | 200 |
| `GET` | `/api/training-courses/programs`<br>`title` | Searches programs used for dropdown selection. | — | `ApiResponse` | 200 |
| `GET` | `/api/training-courses/sectors` | Retrieves the list of sectors used for dropdown selection when creating or editing training courses. | — | `ApiResponse` | 200 |
| `GET` | `/api/training-courses/levels` | Retrieves the list of training course levels. | — | `ApiResponse` | 200 |
| `GET` | `/api/training-courses/location-types` | Retrieves the location options for training courses (Inside FA or Outside FA). | — | `ApiResponse` | 200 |

### Reports

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/Reports/GetAll` | — | `ReportGetAllQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/GetMicroLearningOrgAdmin` | — | `GetMicroLearningOrgAdminQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/GetMicroLearningLearner` | — | `GetTimeLineQueryModel` | *not declared* | 200 |
| `GET` | `/api/v1/Reports/GetPerformanceLearner/{userId}`<br>`userId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Reports/GetPerformanceOrgAdmin/{OrgId}`<br>`OrgId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Reports/GetRegulators` | — | `GetRegulatorQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/GetLearningTimeLinePerProgram` | — | `GetTimeLineQueryModel` | *not declared* | 200 |
| `GET` | `/api/v1/Reports/GetLearningDeltaScore/{userId}`<br>`userId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Reports/GetOrgDeltaScore/{OrgId}`<br>`OrgId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Reports/GetLearnerHeapMap` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Reports/GetOrgHeapMap` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Reports/AvailablePrograms` | — | `GetOrganizationProgramQuertFilter` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/AvailableLearnersProgram` | — | `GetOrganizationProgramUsersQueryFilter` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/OrgCharts` | — | `BuildOrgChartQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/GetMicroLearningOrgAdminEngagedRate` | — | `GetMicroLearningOrgAdminEngagedRateQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/LearnerCharts` | — | `BuildLearnerChartQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/GetMicroLearningUserEngagedRate` | — | `GetTimeLineQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/GetDeltaScoreUserEngagedRate/{userId}`<br>`userId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Reports/OrgAdminEvents/{OrgId}`<br>`OrgId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Reports/LearnerEvents/{UserId}`<br>`UserId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Reports/OrganizationPrograms/{OrgId}`<br>`OrgId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Reports/LearnerPrograms/{userId}`<br>`userId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Reports/LearnerPreAssesmentVsPostAssesment/{userId}`<br>`userId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Reports/OrgPreAssesmentVsPostAssesment/{OrgId}`<br>`OrgId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Reports/ValidateOrganizationProgramData` | — | `ValidateOrganizationProgramDataQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/GetOrganizationUserLearningReportData` | — | `UserLearningReportQueryModel` | *not declared* | 200 |
| `POST` | `/api/v1/Reports/GetOrganizationExecutiveSummaryReportData` | — | `OrganizationExecutiveSummaryReportQueryModel` | *not declared* | 200 |

### Search

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Search`<br>`searchText`, `pageSize` | Searches Programs, Exams, and Events by searchText and returns all three collections plus their counts in one response, so the frontend can render the All/Programs/Exams/ | — | `SearchResultsDtoReturnResult` | 200 |

### TrackingRequest

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/TrackingRequest/Search` | Paged list of the current user's requests (same data as Dashboard MyRequests). | `FilterUserRequestDto` | *not declared* | 200 |
| `GET` | `/api/v1/TrackingRequest/Lookups` | Request-type and status options for filters (replaces ViewBag on the MVC MyRequests page). | — | *not declared* | 200 |
| `GET` | `/api/v1/TrackingRequest/Details`<br>`userRequestId` | Details for a single user request (e.g. Order line items), scoped to the current user. | — | *not declared* | 200 |
| `POST` | `/api/v1/TrackingRequest/ExamException` | — | `object` | *not declared* | 200 |
| `PUT` | `/api/v1/TrackingRequest/ExamException/Cancel`<br>`userRequestId` | — | — | *not declared* | 200 |

### TrainerContracts

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/TrainerContracts/trainer-contracts` | Retrieves all trainer contracts associated with the currently authenticated user. | — | `ApiResponse` | 200 |
| `GET` | `/api/v1/TrainerContracts/trainer-contracts/Download`<br>`contractId` | Generates the trainer contract PDF, stores it on CDN when missing, and returns the file for download. | — | *not declared* | 200 |
| `POST` | `/api/v1/TrainerContracts/trainer-contracts/backfill/generate`<br>`contractId`, `X-Backfill-ApiKey` | Generates and persists a trainer contract agreement for system backfill (no JWT; API key required). | — | *not declared* | 200 |
| `POST` | `/api/v1/TrainerContracts/trainer-contracts/Approve` | — | `UpdateContractViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/TrainerContracts/trainer-contracts/Refuse` | — | `UpdateContractViewModel` | *not declared* | 200 |

### UserCertificate

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/UserCertificate/{userCertificateId}/GetOrGenerateUserCertificateCdnUrl`<br>`userCertificateId` | — | — | *not declared* | 200 |

### Users

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/Users/Info` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Users/GetOrganizationUsers`<br>`term`, `page`, `organizationId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/Users/{userId}/Info`<br>`userId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Users/User/LeaveOrg`<br>`id` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/Users/ChangeTheme` | — | `ChangeUserProfileThemeCommand` | *not declared* | 200 |
| `POST` | `/api/v1/Users/Photo` | Updates the profile photo of the currently logged-in user. Reuses (internal service) which performs all business validation (file signature / allowed content types), uplo | `object` | `StringApiResponse` | 200, 400 |
| `POST` | `/api/v1/Users/AddUserFavorite` | Adds a new item to user favorites. | `AddUserFavoriteRequest` | *not declared* | 200 |
| `GET` | `/api/v1/Users/GetUserFavorites` | Retrieves the current user's favorite items. | — | *not declared* | 200 |
| `POST` | `/api/v1/Users/RemoveFavorite/{id}`<br>`id`, `paymentModuleId` | Removes an item from user favorites. | — | *not declared* | 200 |

### WorkSpace

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/WorkSpace/ReceiveWebhook` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/WorkSpace/Organization/{id}`<br>`X-Provider`, `id` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/WorkSpace/workspace-courses`<br>`provider`, `userId` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/WorkSpace/workspace-cards/{id}`<br>`id` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/WorkSpace/workspace-cards-learner/{id}`<br>`id` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/workspace-learners` | — | `WorkSpaceLearnerRequestModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/SearchPrograms` | — | `WorkSpaceProgramsFilterViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/WorkSpaceProgramCount` | — | `WorkSpaceProgramsFilterViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/Enrollement/Users` | — | `WorkSpaceAssignedUsersFilterViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/Users/SearchPrograms` | — | `WorkSpaceUserProgramsFilterViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/MyPrograms` | — | `WorkSpaceUserProgramsFilterViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/Enrollement/Update/Status` | — | `WorkSpaceEnrollementStatusViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/Enrollement/Status/SearchUsers` | — | `OrgUsersProgramEnrollementFilterViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/Enrollement/Users/program/Validate` | — | `EnrollUserToProgramViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/Enrollement/Users/Program` | — | `EnrollUserToProgramViewModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/Enrollement/BulkUsers/Program/{Provider}/{OrgId}/{ProgramId}/{EnrollementStatus}/{DueDate}`<br>`Provider`, `OrgId`, `ProgramId`, `EnrollementStatus`, `DueDate` | — | `object` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/Enrollement/ValidateBulkUsers/Program/{Provider}/{OrgId}/{ProgramId}`<br>`Provider`, `OrgId`, `ProgramId`, `EnrollementStatus`, `DueDate` | — | `object` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/activate-deActivate-license` | — | `ManageLicenceRequest` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/OrgAdmin/GetRequestAccess` | — | `WorkSpaceLicenseFilterRequestsViewModel` | *not declared* | 200 |
| `GET` | `/api/v1/WorkSpace/OrgAdmin/GetPendingRequestCount/{organizationId}/{status}`<br>`organizationId`, `status` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/WorkSpace/OrgAdmin/GetRequestAccessHistory/{requestId}`<br>`requestId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/OrgAdmin/ApproveRejectRequestAccess/{requestId}/{isApproved}`<br>`requestId`, `isApproved` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/individual/RequestAccessLicense`<br>`workSpaceProvider` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/individual/RequestAccessLicenseReminder`<br>`requestId` | — | — | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/WorkSpaceUserProgress` | — | `WorkSpaceLearnerProgressRequestModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/WorkSpaceUserProgress/{userId}`<br>`userId` | — | `WorkSpaceUserProgressRequestModel` | *not declared* | 200 |
| `POST` | `/api/v1/WorkSpace/Users/Courses` | — | `WorkSpaceUserCoursesFilterViewModel` | *not declared* | 200 |

### WorkSpaces

| Method | Path | Purpose | Request body | Output (response) | Status codes |
|---|---|---|---|---|---|
| `GET` | `/api/v1/WorkSpaces` | — | — | *not declared* | 200 |
| `GET` | `/api/v1/WorkSpaces/Classification/FA` | — | — | *not declared* | 200 |

---

## 4. Output object definitions

Every object reachable from a declared response or request body, with its fields. `X[]` = array · `?` = nullable · `map<string,X>` = dictionary.

#### `ActiveStatus`

Enum values: `1`, `2`, `3`

#### `AddEvalutionSelfLearningViewModel`

| Field | Type |
|---|---|
| `questionId` | `string/uuid` |
| `selectedAnswerId` | `string/uuid` |

#### `AddUserFavoriteRequest`

| Field | Type |
|---|---|
| `requestId` | `string/uuid` |
| `paymentModuleId` | `integer/int32` |

#### `AnnouncementGetAllQueryModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid` |
| `search` | `string?` |
| `pageIndex` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `AnnouncementGetByIdQueryModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid` |
| `id` | `string/uuid` |

#### `AnnouncementSetStatusCommandModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid` |
| `id` | `string/uuid` |
| `isActive` | `boolean` |

#### `ApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `object?` |

#### `ApplicationProcessDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `description` | `string?` |
| `steps` | `ApplicationProcessStepDto[]?` |

#### `AssignLearnersToLearningPathRequestModel`

| Field | Type |
|---|---|
| `users` | `AssignLearnerToLearningPathRequestModel[]?` |

#### `AssignedLearningPathStatus`

Enum values: `1`, `2`, `3`

#### `BillsRequestDto`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `billNumber` | `string?` |

#### `BooleanApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `boolean` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `BooleanReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `boolean` |
| `message` | `string?` |

#### `BuildLearnerChartQueryModel`

| Field | Type |
|---|---|
| `chartType` | `ChartTypes` |
| `organizationId` | `string/uuid` |
| `userId` | `string/uuid` |

#### `BuildOrgChartQueryModel`

| Field | Type |
|---|---|
| `chartType` | `ChartTypes` |
| `organizationId` | `string/uuid` |

#### `CalendarUnifiedItemDto`

| Field | Type |
|---|---|
| `id` | `string/uuid` |
| `name` | `string?` |
| `description` | `string?` |
| `startDate` | `string?` |
| `endDate` | `string?` |
| `startTime` | `string/date-span?` |
| `endTime` | `string/date-span?` |
| `itemType` | `string?` |

#### `CalendarUnifiedItemDtoListReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `CalendarUnifiedItemDto[]?` |
| `message` | `string?` |

#### `CalendarUnifiedItemDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `CalendarUnifiedItemDto` |
| `message` | `string?` |

#### `CancelReservationViewModel`

| Field | Type |
|---|---|
| `reservationId` | `string/uuid` |
| `reservationType` | `ModuleType` |
| `reasonId` | `ReasonsList` |
| `reasonDescription` | `string?` |

#### `CartPaymentViewModel`

| Field | Type |
|---|---|
| `id` | `string/uuid?` |
| `amount` | `number/double` |
| `totalAmount` | `number/double` |
| `vat` | `number/double` |
| `discount` | `number/double` |
| `shoppingCartList` | `CartDetailsViewModel[]?` |
| `refUrl` | `string?` |
| `billNumber` | `string?` |
| `invoiceId` | `string?` |
| `url` | `string?` |
| `callbackUrl` | `string?` |
| `isPricesChanged` | `boolean` |
| `couponCode` | `string?` |
| `allowCouponDiscount` | `boolean` |
| `isValidCoupon` | `boolean?` |
| `viewPaymentSummary` | `boolean` |
| `isAlreadyPaid` | `boolean` |
| `isUsedZatkaLayout` | `boolean` |
| `refCode` | `string?` |
| `issueDate` | `string/date-time` |
| `organizationCart` | `map<string,CartDetailsViewModel[]>?` |
| `walletCartInfo` | `WalletCartInfo` |
| `hasIndividualRegistration` | `boolean` |
| `cartItems` | `MoEngagePurchaseItemDto[]?` |
| `numberOfItems` | `integer/int32` |
| `currentUserId` | `string/uuid?` |
| `allowedTaxInvoices` | `boolean?` |

#### `CartPaymentViewModelReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `CartPaymentViewModel` |
| `message` | `string?` |

#### `CertificateCategoryDtoOverviewSectionDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `subtitle` | `string?` |
| `items` | `CertificateCategoryDto[]?` |

#### `CertificatePolicyDtoOverviewSectionDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `subtitle` | `string?` |
| `items` | `CertificatePolicyDto[]?` |

#### `CertificatesOverviewDto`

| Field | Type |
|---|---|
| `mostRequestedCertificates` | `ExamCardDtoOverviewSectionDto` |
| `newCertificates` | `ExamCardDtoOverviewSectionDto` |
| `mainCategories` | `CertificateCategoryDtoOverviewSectionDto` |
| `policies` | `CertificatePolicyDtoOverviewSectionDto` |
| `exploreCertificates` | `ExploreCertificatesDto` |

#### `CertificatesOverviewDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `CertificatesOverviewDto` |
| `message` | `string?` |

#### `CfaCertificatesSectionDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `description` | `string?` |
| `viewAllText` | `string?` |
| `viewAllUrl` | `string?` |
| `items` | `CfaCertificateDto[]?` |

#### `CfaCertificatesSectionDtoApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `CfaCertificatesSectionDto` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `ChangeRegistrationEmailRequest`

| Field | Type |
|---|---|
| `email` | `string/email` |

#### `ChangeRegistrationIdentityRequest`

| Field | Type |
|---|---|
| `identityType` | `string` |
| `identityNumber` | `string` |

#### `ChangeUserProfileThemeCommand`

| Field | Type |
|---|---|
| `id` | `string/uuid` |
| `theme` | `ProfileTheme` |

#### `ChartTypes`

Enum values: `1`, `2`, `3`

#### `CheckEligibilityRequestDto`

| Field | Type |
|---|---|
| `universityEmail` | `string/email` |

#### `CheckoutResponseApiDto`

| Field | Type |
|---|---|
| `isalreadyPaid` | `boolean` |
| `isFreePayment` | `boolean` |
| `checkoutUrl` | `string?` |
| `paymentType` | `PaymentGatewayType` |
| `expriyDate` | `string?` |
| `billNumber` | `string?` |

#### `CheckoutResponseApiDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `CheckoutResponseApiDto` |
| `message` | `string?` |

#### `CompetencyDetailsDto`

| Field | Type |
|---|---|
| `id` | `string/uuid` |
| `code` | `string?` |
| `name` | `string?` |
| `typeId` | `integer/int32` |
| `typeName` | `string?` |
| `description` | `string?` |
| `levels` | `CompetencyDetailsLevelDto[]?` |

#### `CompetencyDetailsDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `CompetencyDetailsDto` |
| `message` | `string?` |

#### `CompetencyLevelDetailsDto`

| Field | Type |
|---|---|
| `programs` | `ProgramDto[]?` |
| `certificates` | `ExamCardDto[]?` |

#### `CompetencyLevelDetailsDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `CompetencyLevelDetailsDto` |
| `message` | `string?` |

#### `ConfirmRegistrationEmailChangeRequest`

| Field | Type |
|---|---|
| `userId` | `string` |
| `email` | `string/email` |
| `code` | `string` |

#### `ConfirmRegistrationEmailRequest`

| Field | Type |
|---|---|
| `userId` | `string` |
| `code` | `string` |

#### `ContactUsDto`

| Field | Type |
|---|---|
| `fullName` | `string?` |
| `email` | `string?` |
| `mobileNumber` | `string?` |
| `job` | `string?` |
| `subject` | `string?` |
| `message` | `string?` |

#### `CountryRegistrationLookupDto`

| Field | Type |
|---|---|
| `id` | `integer/int32` |
| `nameAr` | `string?` |
| `nameEn` | `string?` |
| `nationalityAr` | `string?` |
| `nationalityEn` | `string?` |
| `countryCode` | `string?` |
| `nafathMappingCode` | `integer/int32?` |
| `isRestricted` | `boolean` |

#### `CouponResponseDto`

| Field | Type |
|---|---|
| `amount` | `number/double` |
| `totalAmount` | `number/double` |
| `vat` | `number/double` |
| `discount` | `number/double` |

#### `CouponResponseDtoApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `CouponResponseDto` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `CreateLearningPathViewModel`

| Field | Type |
|---|---|
| `nameAr` | `string` |
| `nameEn` | `string` |
| `descriptionAr` | `string?` |
| `descriptionEn` | `string?` |
| `orgId` | `string/uuid?` |
| `isMandatory` | `boolean?` |
| `offsetDays` | `integer/int32?` |
| `items` | `LearningPathItemViewModel[]?` |
| `assignedLearningPaths` | `AssignedLearningPathViewModel[]?` |

#### `CreateOrUpdateAnnouncementDto`

| Field | Type |
|---|---|
| `id` | `string/uuid?` |
| `isTape` | `boolean` |
| `organizationId` | `string/uuid` |
| `contentAr` | `string?` |
| `contentEn` | `string?` |
| `duration` | `integer/int32` |
| `durationType` | `DurationTypeEnum` |
| `isActive` | `boolean` |
| `reminders` | `ReminderModel[]?` |

#### `CreateOrUpdatePracticalExperienceDto`

| Field | Type |
|---|---|
| `id` | `string/uuid` |
| `jobTitle` | `string?` |
| `mainTask` | `string?` |
| `organization` | `string?` |
| `dateFrom` | `string/date-time?` |
| `dateTo` | `string/date-time?` |
| `yearsOfExperience` | `integer/int32` |
| `requestStatus` | `integer/int32?` |
| `stillEmployed` | `boolean?` |
| `isPartTimeWork` | `boolean?` |

#### `CreateTrainingCourseApiDto`

| Field | Type |
|---|---|
| `id` | `string/uuid?` |
| `courseLevelId` | `integer/int32` |
| `courseName` | `string?` |
| `field` | `string?` |
| `dateFrom` | `string/date-time?` |
| `dateTo` | `string/date-time?` |
| `isInSideFA` | `integer/int32` |
| `numberOfDays` | `integer/int32` |
| `organizationName` | `string?` |
| `programId` | `string/uuid?` |
| `sectorId` | `string/uuid?` |
| `trainingCourseAttachmentId` | `string/uuid?` |

#### `DurationTypeEnum`

Enum values: `1`, `2`, `3`

#### `EnableAdaptiveLearningViewModel`

| Field | Type |
|---|---|
| `programId` | `string/uuid` |
| `enableAdaptiveLearning` | `boolean` |

#### `EnrollUserToProgramViewModel`

| Field | Type |
|---|---|
| `userIds` | `string/uuid[]?` |
| `provider` | `WorkSpaceProvider` |
| `orgId` | `string/uuid` |
| `programId` | `string/uuid` |
| `enrollementStatus` | `EnrollementStatus` |
| `dueDate` | `string/date-time?` |

#### `EnrollementStatus`

Enum values: `0`, `1`

#### `EventMenuDto`

| Field | Type |
|---|---|
| `statistics` | `EventTypeMenuItemViewModel[]?` |
| `upcomingEvents` | `EventMenuItemViewModel[]?` |
| `currentMonthEvents` | `EventMenuItemViewModel[]?` |

#### `EventRegisterationApiViewModel`

| Field | Type |
|---|---|
| `eventId` | `string/uuid` |

#### `EventReservationStatus`

Enum values: `1`, `2`, `3`

#### `EventSortBy`

Enum values: `1`, `2`

#### `EventsOverviewDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `description` | `string?` |
| `upcomingEvents` | `EventsOverviewSectionDto` |
| `featuredEvents` | `EventsOverviewSectionDto` |
| `eventsOfTheMonth` | `EventsOverviewSectionDto` |
| `expertSpeakers` | `ExpertSpeakersSectionDto` |

#### `EventsOverviewDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `EventsOverviewDto` |
| `message` | `string?` |

#### `EventsOverviewSectionDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `description` | `string?` |
| `viewAllText` | `string?` |
| `viewAllUrl` | `string?` |
| `bookNowText` | `string?` |
| `items` | `EventCardDto[]?` |

#### `ExamAddToCartApiDto`

| Field | Type |
|---|---|
| `profileId` | `string/uuid` |
| `testCenterScheduleDayPeriodId` | `string/uuid` |
| `requirements` | `ExamRegistrationRequirementApiDto[]?` |

#### `ExamCardDtoOverviewSectionDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `subtitle` | `string?` |
| `items` | `ExamCardDto[]?` |

#### `ExamMenuDto`

| Field | Type |
|---|---|
| `statistics` | `ExamSectorMenuItemViewModel[]?` |
| `exams` | `ExamMenuItemViewModel[]?` |

#### `ExamSortBy`

Enum values: `3`, `4`

#### `ExcuseRequestStatus`

Enum values: `1`, `2`, `3`

#### `ExecuseRequestSubmitDto`

| Field | Type |
|---|---|
| `id` | `string/uuid` |
| `examReservationId` | `string/uuid` |
| `excuseTypeId` | `integer/int32` |
| `reasonDescription` | `string?` |
| `submittedDate` | `string/date-time` |
| `execuseRequestStatus` | `string?` |
| `execuseRequestStatusEnum` | `ExcuseRequestStatus` |
| `attachmentUrl` | `string?` |
| `attachmentFileName` | `string?` |
| `adminDecisionReason` | `string?` |
| `requestNumber` | `string?` |
| `excuseType` | `string?` |

#### `ExecutiveProgram`

| Field | Type |
|---|---|
| `partnersCDN` | `PartnerDto` |
| `partnersList` | `PartnerDto[]?` |
| `learners` | `SiteContentProgramDto[]?` |
| `trainers` | `LookupModel[]?` |
| `trainersViewModel` | `ProgramTrainerDto[]?` |
| `descriptions` | `ExecutiveProgramDescriptionsDto` |
| `nearestPlan` | `object?` |

#### `ExecutiveProgramDescriptionsDto`

| Field | Type |
|---|---|
| `acceptanceDescription` | `string?` |
| `educationalDescription` | `string?` |
| `futureInvestmentDescription` | `string?` |
| `organizationBenefitsDescription` | `string?` |
| `professionalDevelopmentDescription` | `string?` |
| `statisticsDescription` | `string?` |

#### `ExpertSpeakersSectionDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `description` | `string?` |
| `items` | `ExpertSpeakerDto[]?` |

#### `ExploreCertificatesDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `url` | `string?` |

#### `FilterEventDto`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `query` | `string?` |
| `eventTypeId` | `string/uuid?` |
| `periodId` | `integer/int32?` |
| `isFavorite` | `boolean?` |
| `sortBy` | `EventSortBy` |

#### `FilterExamDto`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `title` | `string?` |
| `query` | `string?` |
| `sectorId` | `string/uuid?` |
| `topicId` | `string/uuid?` |
| `isFavorite` | `boolean?` |
| `competencyLevelId` | `integer/int32?` |
| `language` | `integer/int32[]?` |
| `minimumPrice` | `integer/int32?` |
| `maximumPrice` | `integer/int32?` |
| `sortBy` | `ExamSortBy` |

#### `FilterProgramDto`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `title` | `string?` |
| `sectorId` | `string/uuid?` |
| `topicId` | `string/uuid?` |
| `language` | `integer/int32[]?` |
| `attendanceType` | `integer/int32[]?` |
| `period` | `integer/int32[]?` |
| `programParticipantLevelIds` | `integer/int32[]?` |
| `minimumPrice` | `integer/int32?` |
| `maximumPrice` | `integer/int32?` |
| `dateFrom` | `string/date-time?` |
| `dateTo` | `string/date-time?` |
| `competencyLevelId` | `integer/int32?` |
| `isFavorite` | `boolean?` |
| `isExcutivePrograms` | `boolean?` |
| `sortBy` | `ProgramSortBy` |

#### `FilterUserRequestDto`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `keyword` | `string?` |
| `requestTypes` | `UserRequestType[]?` |
| `status` | `UserRequestStatus` |
| `submissionDate` | `string/date-time?` |
| `userRequestSortKey` | `UserRequestSortKey` |
| `isDescending` | `boolean` |

#### `FinancialSectorGatewayDto`

| Field | Type |
|---|---|
| `programs` | `ProgramDto[]?` |
| `selfLearningPrograms` | `ProgramDto[]?` |
| `knowledgeSeminars` | `EventCardDto[]?` |
| `sectorExpertsMeetings` | `EventCardDto[]?` |

#### `FinancialSectorGatewayDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `FinancialSectorGatewayDto` |
| `message` | `string?` |

#### `FinancialSectorProgramMenuDto`

| Field | Type |
|---|---|
| `programs` | `ProgramMenuItemViewModel[]?` |
| `upcomingEvents` | `EventMenuItemViewModel[]?` |
| `digitalPrograms` | `ProgramMenuItemViewModel[]?` |

#### `FinancialSkillsActionDto`

| Field | Type |
|---|---|
| `text` | `string?` |
| `url` | `string?` |

#### `FinancialSkillsFrameworkOverviewDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `description` | `string?` |
| `financialSkillsDictionary` | `FinancialSkillsLinkSectionDto` |
| `frameworkStructure` | `FinancialSkillsLinkSectionDto` |
| `documentsTitle` | `string?` |
| `documents` | `FinancialSkillsDocumentDto[]?` |
| `faqTitle` | `string?` |
| `faq` | `FinancialSkillsFaqDto[]?` |
| `faqViewAll` | `FinancialSkillsActionDto` |
| `strategicPartnersTitle` | `string?` |
| `strategicPartners` | `FinancialSkillsPartnerDto[]?` |
| `support` | `FinancialSkillsSupportDto` |

#### `FinancialSkillsFrameworkOverviewDtoApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `FinancialSkillsFrameworkOverviewDto` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `FinancialSkillsJobFamilyDto`

| Field | Type |
|---|---|
| `id` | `string/uuid` |
| `code` | `string?` |
| `name` | `string?` |
| `description` | `string?` |

#### `FinancialSkillsLinkSectionDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `description` | `string?` |
| `buttonText` | `string?` |
| `url` | `string?` |

#### `FinancialSkillsSupportDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `description` | `string?` |
| `buttonText` | `string?` |
| `url` | `string?` |

#### `ForgotPasswordRequest`

| Field | Type |
|---|---|
| `email` | `string` |

#### `ForgotUsernameRequest`

| Field | Type |
|---|---|
| `email` | `string/email` |

#### `FrameworkStructureFiltersDto`

| Field | Type |
|---|---|
| `sectors` | `FrameworkStructureFilterOptionDto[]?` |
| `jobFamilies` | `FrameworkStructureFilterOptionDto[]?` |

#### `FrameworkStructureLabelsDto`

| Field | Type |
|---|---|
| `search` | `string?` |
| `searchPlaceholder` | `string?` |
| `bankingSector` | `string?` |
| `jobFamilies` | `string?` |
| `all` | `string?` |
| `applyFilters` | `string?` |
| `sector` | `string?` |
| `department` | `string?` |
| `jobFamily` | `string?` |
| `noResults` | `string?` |

#### `FrameworkStructurePageDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `description` | `string?` |
| `metaTitle` | `string?` |
| `metaDescription` | `string?` |

#### `FrameworkStructurePaginationDto`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `totalItems` | `integer/int32` |
| `totalPages` | `integer/int32` |

#### `FrameworkStructureRequestDto`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `title` | `string?` |
| `sectorId` | `string/uuid?` |
| `jobFamilyId` | `string/uuid?` |

#### `FrameworkStructureResponseDto`

| Field | Type |
|---|---|
| `page` | `FrameworkStructurePageDto` |
| `overview` | `FrameworkStructureOverviewItemDto[]?` |
| `statistics` | `FrameworkStructureStatisticsDto` |
| `filters` | `FrameworkStructureFiltersDto` |
| `pagination` | `FrameworkStructurePaginationDto` |
| `items` | `FrameworkStructureItemDto[]?` |
| `labels` | `FrameworkStructureLabelsDto` |
| `support` | `FrameworkStructureSupportDto` |

#### `FrameworkStructureResponseDtoApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `FrameworkStructureResponseDto` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `FrameworkStructureStatisticsDto`

| Field | Type |
|---|---|
| `sectors` | `FrameworkStructureSectorDto[]?` |

#### `FrameworkStructureSupportDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `buttonText` | `string?` |
| `url` | `string?` |
| `iconUrl` | `string?` |

#### `GetMicroLearningOrgAdminEngagedRateQueryModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid` |
| `programId` | `string/uuid` |

#### `GetMicroLearningOrgAdminQueryModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid` |

#### `GetOrganizationProgramQuertFilter`

| Field | Type |
|---|---|
| `orgId` | `string/uuid` |
| `title` | `string?` |
| `topicId` | `string/uuid?` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `GetOrganizationProgramUsersQueryFilter`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid` |
| `programId` | `string/uuid` |
| `idNumber` | `string?` |
| `department` | `string?` |
| `jobTitle` | `string?` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `GetRegulatorQueryModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid` |
| `programId` | `string/uuid` |
| `users` | `string/uuid[]?` |

#### `GetTimeLineQueryModel`

| Field | Type |
|---|---|
| `userId` | `string/uuid` |
| `programIds` | `string/uuid[]?` |

#### `HomeExpertDtoListReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `HomeExpertDto[]?` |
| `message` | `string?` |

#### `IamIdentityTypeEnum`

Enum values: `1`, `2`, `3`, `4`

#### `IndividualRegistrationRequest`

| Field | Type |
|---|---|
| `identityType` | `string` |
| `identityNumber` | `string` |
| `firstNameAr` | `string` |
| `fatherNameAr` | `string?` |
| `grandFatherNameAr` | `string?` |
| `lastNameAr` | `string?` |
| `firstNameEn` | `string` |
| `fatherNameEn` | `string?` |
| `grandFatherNameEn` | `string?` |
| `lastNameEn` | `string?` |
| `sex` | `string` |
| `language` | `string` |
| `nationalityCountryId` | `string?` |
| `residentCountry` | `string` |
| `dateOfBirthGreg` | `string?` |
| `dateOfBirthHijri` | `string?` |
| `email` | `string/email` |
| `confirmEmail` | `string?` |
| `phoneNumber` | `string` |
| `password` | `string/password` |
| `confirmPassword` | `string/password` |
| `userName` | `string?` |
| `nafathRedirectGuid` | `string?` |
| `receiveMarketingMessages` | `boolean` |
| `informationSource` | `string?` |

#### `InitiativeMenuDto`

| Field | Type |
|---|---|
| `activeMenu` | `InitiativeMenuItemViewModel[]?` |

#### `InitiativeMenuDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `InitiativeMenuDto` |
| `message` | `string?` |

#### `InitiativeMenuSectionDto`

| Field | Type |
|---|---|
| `activeMenu` | `InitiativeMenuItemViewModel[]?` |
| `openingSoonMenu` | `InitiativeMenuItemViewModel[]?` |

#### `InvitationResult`

Enum values: `0`, `1`, `2`, `3`

#### `InviteUserViewModel`

| Field | Type |
|---|---|
| `idType` | `IamIdentityTypeEnum` |
| `idNumber` | `string?` |
| `email` | `string?` |
| `dateOfBirth` | `string/date-time` |
| `employeeId` | `string?` |
| `mobileNumber` | `string?` |
| `jobTitle` | `string?` |
| `isValid` | `boolean` |

#### `IsNafathLoginRequest`

| Field | Type |
|---|---|
| `userName` | `string?` |

#### `JobFamilyDetailsResponseDto`

| Field | Type |
|---|---|
| `jobFamily` | `FinancialSkillsJobFamilyDto` |
| `jobRoles` | `JobFamilyJobRoleDto[]?` |
| `support` | `FrameworkStructureSupportDto` |

#### `JobFamilyDetailsResponseDtoApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `JobFamilyDetailsResponseDto` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `LearnerStatus`

Enum values: `1`, `2`, `3`, `4`, `5`, `6`

#### `LearningGroupFilterViewModel`

| Field | Type |
|---|---|
| `name` | `string?` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `organizationId` | `string/uuid` |
| `status` | `boolean?` |

#### `LearningPathAssigneeHistoryRequestViewModel`

| Field | Type |
|---|---|
| `assignedLearningPathId` | `string/uuid` |
| `pageNumber` | `integer/int32` |
| `pageSize` | `integer/int32` |

#### `LearningPathAssigneeStatusViewModel`

| Field | Type |
|---|---|
| `assignedLearningPathId` | `string/uuid` |
| `enrollementStatus` | `EnrollementStatus` |
| `dueDate` | `string/date-time?` |

#### `LearningPathDashboardCardFilter`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `status` | `LearnerStatus` |

#### `LearningPathFilterViewModel`

| Field | Type |
|---|---|
| `sortBy` | `Sort` |
| `sortDesc` | `boolean` |
| `topicId` | `string/uuid?` |
| `query` | `string?` |
| `status` | `LearningPathStatus` |
| `assigneeStatus` | `AssignedLearningPathStatus` |
| `dueStatus` | `OverDueStatus` |
| `isMandatory` | `boolean?` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `LearningPathStatus`

Enum values: `1`, `2`, `3`, `4`

#### `LearningPathViewModel`

| Field | Type |
|---|---|
| `publishedVirsionId` | `string/uuid?` |
| `nameAr` | `string` |
| `nameEn` | `string` |
| `descriptionAr` | `string?` |
| `descriptionEn` | `string?` |
| `orgId` | `string/uuid?` |
| `isMandatory` | `boolean?` |
| `status` | `LearningPathStatus` |
| `offsetDays` | `integer/int32?` |
| `items` | `LearningPathItemViewModel[]?` |
| `assignedLearningPaths` | `AssignedLearningPathViewModel[]?` |
| `bulkAssignLimit` | `integer/int32` |

#### `LicenceRequestStatus`

Enum values: `0`, `1`, `2`, `3`

#### `LookupModel`

| Field | Type |
|---|---|
| `name` | `string?` |
| `description` | `string?` |
| `value` | `object?` |
| `extra` | `object?` |

#### `ManageLicenceRequest`

| Field | Type |
|---|---|
| `userId` | `string/uuid` |
| `organizationId` | `string/uuid` |
| `typeId` | `string/uuid` |
| `isActive` | `boolean` |
| `provider` | `WorkSpaceProvider` |

#### `ModuleType`

Enum values: `1`, `2`, `3`

#### `MursionAddToCartResponseDto`

| Field | Type |
|---|---|
| `redirectToCart` | `boolean` |
| `requiresPayment` | `boolean` |
| `nextAction` | `string?` |
| `replacedExistingItem` | `boolean` |

#### `MursionAddToCartResponseDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `MursionAddToCartResponseDto` |
| `message` | `string?` |

#### `MursionDetailsDto`

| Field | Type |
|---|---|
| `title` | `string?` |
| `pageDescription` | `string?` |
| `overview` | `string?` |
| `detailedDescription` | `string?` |
| `mainImageUrl` | `string?` |
| `imageFallbackUrl` | `string?` |
| `videoUrl` | `string?` |
| `sectors` | `string[]?` |
| `jobFamilies` | `string[]?` |
| `topics` | `string[]?` |
| `prerequisites` | `string?` |
| `policyUrl` | `string?` |
| `purchaseSectionTitle` | `string?` |
| `addToCartText` | `string?` |
| `availabilityLabel` | `string?` |
| `availability` | `integer/int32` |
| `sessionType` | `string?` |
| `durationMinutes` | `integer/int32?` |
| `scenarioLanguage` | `string?` |
| `scenarios` | `MursionScenarioDto[]?` |
| `scenariosSectionTitle` | `string?` |
| `scenariosOverview` | `string?` |
| `scenariosDescription` | `string?` |
| `interactiveSessionsLabel` | `string?` |
| `learningPathTitle` | `string?` |
| `learningPath` | `MursionLearningPathItemDto[]?` |
| `rating` | `number/double?` |
| `ratingCount` | `integer/int32` |
| `price` | `MursionPriceDto` |
| `canPurchase` | `boolean` |
| `addToCartRoute` | `string?` |
| `relatedPrograms` | `ProgramDto[]?` |
| `suggestedCertificates` | `ExamCardDto[]?` |

#### `MursionDetailsDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `MursionDetailsDto` |
| `message` | `string?` |

#### `MursionPostPaymentActionDto`

| Field | Type |
|---|---|
| `paymentSucceeded` | `boolean` |
| `nextAction` | `string?` |
| `redirectUrl` | `string?` |

#### `MursionPostPaymentActionDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `MursionPostPaymentActionDto` |
| `message` | `string?` |

#### `MursionPriceDto`

| Field | Type |
|---|---|
| `baseAmount` | `number/double` |
| `vat` | `number/double` |
| `totalAmount` | `number/double` |
| `currency` | `string?` |
| `applyVat` | `boolean` |

#### `MyProgramSearchCriteria`

| Field | Type |
|---|---|
| `progName` | `string?` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `registrationType` | `RegistrationType` |

#### `MySelfLearningViewModel`

| Field | Type |
|---|---|
| `title` | `string?` |
| `isMandatory` | `boolean?` |
| `sortBy` | `Sort` |
| `sortDesc` | `boolean` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `NafathChallengeRequest`

| Field | Type |
|---|---|
| `type` | `string?` |
| `code` | `string?` |
| `expirationInSeconds` | `integer/int32` |
| `userName` | `string?` |
| `data` | `map<string,string>?` |

#### `NafathCreateRequest`

| Field | Type |
|---|---|
| `identityNumber` | `string` |

#### `NafathIdentityVerificationPollRequest`

| Field | Type |
|---|---|
| `transactionId` | `string` |
| `randomNumber` | `string` |
| `identityType` | `string` |
| `identityNumber` | `string` |

#### `NafathRecoveryStatusRequest`

| Field | Type |
|---|---|
| `identityNumber` | `string` |
| `transId` | `string` |
| `randomNumber` | `string` |

#### `NafathTokenRequest`

| Field | Type |
|---|---|
| `identityNumber` | `string?` |

#### `NotificationCategoryModel`

| Field | Type |
|---|---|
| `id` | `string/uuid` |
| `name` | `string?` |
| `description` | `string?` |
| `isActive` | `boolean` |
| `organizationId` | `string/uuid` |
| `notificationTypes` | `NotificationTypeModel[]?` |

#### `NotificationGetByOrganizationQueryModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid?` |
| `pageIndex` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `isActive` | `boolean?` |

#### `NotificationPreferencesDto`

| Field | Type |
|---|---|
| `categories` | `NotificationCategoryDto[]?` |
| `reminderSettings` | `ReminderSettings` |
| `orgId` | `string/uuid` |

#### `ObjectReturnResult`

| Field | Type |
|---|---|
| `value` | `object?` |
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `message` | `string?` |

#### `ObjectReturnResultApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `ObjectReturnResult` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `OrgLearningPathFilterViewModel`

| Field | Type |
|---|---|
| `sortBy` | `Sort` |
| `sortDesc` | `boolean` |
| `topicId` | `string/uuid?` |
| `query` | `string?` |
| `status` | `LearningPathStatus` |
| `assigneeStatus` | `AssignedLearningPathStatus` |
| `dueStatus` | `OverDueStatus` |
| `isMandatory` | `boolean?` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `orgId` | `string/uuid` |

#### `OrgUserViewModel`

| Field | Type |
|---|---|
| `empID` | `string?` |
| `identityType` | `string?` |
| `identityNumber` | `string?` |
| `dateOfBirth` | `string?` |
| `email` | `string?` |
| `mobileNumber` | `string?` |
| `nationality` | `string?` |
| `gender` | `string?` |
| `countryId` | `integer/int32` |
| `trainee_Name_ar` | `string?` |
| `trainee_Name_en` | `string?` |
| `isValid` | `boolean` |

#### `OrgUsersProgramEnrollementFilterViewModel`

| Field | Type |
|---|---|
| `provider` | `WorkSpaceProvider` |
| `orgId` | `string/uuid` |
| `programId` | `string/uuid` |
| `userName` | `string?` |
| `title` | `string?` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `OrganizationExecutiveSummaryReportQueryModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid?` |
| `startDate` | `string/date-time?` |
| `endDate` | `string/date-time?` |

#### `OrganizationPartnerModel`

| Field | Type |
|---|---|
| `id` | `integer/int32` |
| `organizationId` | `string/uuid` |
| `name` | `string?` |
| `partnerCode` | `string?` |
| `isEnabled` | `boolean` |
| `integrationUrl` | `string?` |

#### `OrganizationPartnerModelIPagedListReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `OrganizationPartnerModel[]?` |
| `message` | `string?` |

#### `OverDueAssignmentRequestViewModel`

| Field | Type |
|---|---|
| `orgId` | `string/uuid` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `OverDueStatus`

Enum values: `1`, `2`, `3`

#### `PageNavigationDto`

| Field | Type |
|---|---|
| `text` | `string?` |
| `url` | `string?` |
| `absoluteUrl` | `string?` |

#### `PartnerDto`

| Field | Type |
|---|---|
| `name` | `string?` |
| `image` | `string?` |

#### `PaymentGatewayType`

Enum values: `1`, `2`, `3`, `4`, `5`, `6`

#### `ProfileTheme`

Enum values: `1`, `2`, `3`

#### `ProgramDetailDto`

| Field | Type |
|---|---|
| `orgId` | `string/uuid?` |
| `programId` | `integer/int32` |

#### `ProgramDetailsDto`

| Field | Type |
|---|---|
| `id` | `string/uuid` |
| `name` | `string?` |
| `brief` | `string?` |
| `marketingDescription` | `string?` |
| `externalRegistrationURL` | `string?` |
| `hasExternalRegistrationURL` | `boolean` |
| `videoURL` | `string?` |
| `competencyLevelId` | `integer/int32` |
| `imageAttachmentUrl` | `string?` |
| `rate` | `number/double?` |
| `numberOfUserRates` | `integer/int32?` |
| `userFavoritId` | `string/uuid?` |
| `isInterestSaved` | `boolean` |
| `interestSavedMessage` | `string?` |
| `language` | `string?` |
| `sectorsList` | `LookupModel[]?` |
| `programTopic` | `LookupModel` |
| `programTopics` | `LookupModel[]?` |
| `trainers` | `LookupModel[]?` |
| `programAgenda` | `LookupTreeModel[]?` |
| `actualTrainingMethod` | `string[]?` |
| `actualEvaluationMethod` | `string[]?` |
| `programRequirements` | `LookupModel[]?` |
| `programMains` | `LookupModel[]?` |
| `programAcquiredSkills` | `LookupModel[]?` |
| `programJobFamily` | `JobFamilyViewModel[]?` |
| `brochureUrl` | `string?` |
| `isAvailable` | `boolean` |
| `planFees` | `number/double?` |
| `isFullySupported` | `boolean` |
| `isHrdfSupported` | `boolean` |
| `hrdfTagText` | `string?` |
| `hrdfLogoUrl` | `string?` |
| `formattedPrice` | `string?` |
| `trainingPolicyLink` | `string?` |
| `programTargetCategories` | `string[]?` |
| `programJobRoleFamilies` | `string[]?` |
| `hasRegistrationRequirements` | `boolean` |
| `registrationRequirments` | `RegistrationRequirmentsDto[]?` |
| `isExecutiveProgram` | `boolean` |
| `executiveProgram` | `ExecutiveProgram` |
| `detailsPageURL` | `string?` |
| `location` | `string?` |
| `locations` | `string[]?` |
| `numberOfLessons` | `integer/int32` |
| `relatedPrograms` | `ProgramDto[]?` |
| `suggestedCertificates` | `ExamCardDto[]?` |
| `durationInDays` | `integer/int32` |
| `totalLearningHours` | `integer/int32` |
| `numberOfRegisteredUsers` | `integer/int32` |
| `applicationProcess` | `ApplicationProcessDto` |
| `trainerCards` | `ProgramExpertDto[]?` |
| `examId` | `string/uuid?` |
| `isBundle` | `boolean` |
| `bundleText` | `string?` |
| `endsWithExam` | `boolean` |
| `examDetails` | `ProgramExamDetailsDto` |

#### `ProgramDetailsDtoReturnResult`

| Field | Type |
|---|---|
| `value` | `ProgramDetailsDto` |
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `message` | `string?` |

#### `ProgramDto`

| Field | Type |
|---|---|
| `id` | `string/uuid` |
| `name` | `string?` |
| `description` | `string?` |
| `location` | `string?` |
| `imageAttachmentPath` | `string?` |
| `isPublishedForOrganizations` | `boolean` |
| `programTopicName` | `string?` |
| `planNumberOfDays` | `integer/int32?` |
| `isNew` | `boolean` |
| `isEndingSoon` | `boolean` |
| `endingSoonText` | `string?` |
| `examId` | `string/uuid?` |
| `endsWithExam` | `boolean` |
| `endsWithExamText` | `string?` |
| `appointmentDateText` | `string?` |
| `isExecutiveProgram` | `boolean` |
| `userRate` | `number/double?` |
| `ratingUsersCount` | `integer/int32` |
| `isForStudent` | `boolean?` |
| `isForIndividuals` | `boolean` |
| `audienceType` | `string?` |
| `userFavoritId` | `string/uuid?` |
| `isFavorite` | `boolean` |
| `trainingTypeCssClass` | `string?` |
| `externalRegistrationURL` | `string?` |
| `hasExternalRegistrationURL` | `boolean` |
| `startDate` | `string?` |
| `trainingTypeId` | `integer/int32?` |
| `trainingType` | `string?` |
| `allTrainingTypes` | `string?` |
| `programFees` | `number/double` |
| `fees` | `string?` |
| `planId` | `string/uuid?` |
| `language` | `string?` |
| `date` | `string/date-time?` |
| `planFees` | `number/double?` |
| `priceAfterDiscount` | `number/double?` |
| `isPercentage` | `boolean?` |
| `hasDiscount` | `boolean` |
| `discountMarketDescription` | `string?` |
| `discountAmount` | `number/double` |
| `discountAmountDescription` | `string?` |
| `isAvailable` | `boolean` |
| `isFree` | `boolean` |
| `freeMessage` | `string?` |
| `isFullySupported` | `boolean` |
| `isHrdfSupported` | `boolean` |
| `hrdfTagText` | `string?` |
| `hrdfLogoUrl` | `string?` |
| `formattedPrice` | `string?` |
| `isBundle` | `boolean` |
| `bundleText` | `string?` |

#### `ProgramDtoListApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `ProgramDto[]?` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `ProgramDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `ProgramDto` |
| `message` | `string?` |

#### `ProgramExamDetailsDto`

| Field | Type |
|---|---|
| `examId` | `string/uuid` |
| `examName` | `string?` |
| `examDetailsUrl` | `string?` |
| `numberOfQuestions` | `integer/int32` |
| `numberOfFreeAttempts` | `integer/int32` |
| `registrationDurationDays` | `integer/int32?` |
| `trials` | `ProgramExamTrialDto[]?` |

#### `ProgramMenuDto`

| Field | Type |
|---|---|
| `statistics` | `ProgramSectorMenuItemViewModel[]?` |
| `programs` | `ProgramMenuItemViewModel[]?` |
| `excutivePrograms` | `ProgramMenuItemViewModel[]?` |
| `digitalPrograms` | `ProgramMenuItemViewModel[]?` |

#### `ProgramSortBy`

Enum values: `1`, `2`, `3`, `4`

#### `ProgramsOfTheMonthDto`

| Field | Type |
|---|---|
| `all` | `ProgramDto[]?` |
| `individuals` | `ProgramDto[]?` |
| `organizations` | `ProgramDto[]?` |

#### `ProgramsOverviewDto`

| Field | Type |
|---|---|
| `mainCategories` | `ProgramCategoryDto[]?` |
| `featuredPrograms` | `ProgramDto[]?` |
| `programsOfTheMonth` | `ProgramsOfTheMonthDto` |
| `selfLearningPrograms` | `ProgramDto[]?` |
| `experts` | `ProgramExpertDto[]?` |

#### `ProgramsOverviewDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `ProgramsOverviewDto` |
| `message` | `string?` |

#### `ReasonsList`

Enum values: `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`

#### `RegistrationCheckIdentityRequest`

| Field | Type |
|---|---|
| `identityType` | `string` |
| `identityNumber` | `string` |

#### `RegistrationListType`

Enum values: `0`, `1`, `2`, `3`

#### `RegistrationSubmitApiDto`

| Field | Type |
|---|---|
| `planId` | `string/uuid` |
| `programId` | `string/uuid?` |
| `requirements` | `RegistrationRequirementApiDto[]?` |

#### `RegistrationType`

Enum values: `0`, `1`, `2`, `3`, `4`

#### `ReminderSettings`

| Field | Type |
|---|---|
| `reminders` | `Reminder[]?` |
| `isActive` | `boolean` |

#### `ReportAndStudyMenuDto`

| Field | Type |
|---|---|
| `reportAndStudyViewModels` | `ReportAndStudyDto[]?` |

#### `ReportGetAllQueryModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid` |
| `search` | `string?` |
| `pageIndex` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `RescheduleDto`

| Field | Type |
|---|---|
| `newPlanId` | `string/uuid` |
| `reservationId` | `string/uuid` |

#### `RescheduleExamDto`

| Field | Type |
|---|---|
| `reservationId` | `string/uuid` |
| `examFileId` | `string/uuid` |
| `testCenterScheduleDayPeriodId` | `string/uuid` |
| `testingCenterId` | `string/uuid` |

#### `RescheduleExamResponseDto`

| Field | Type |
|---|---|
| `isFree` | `boolean` |
| `fees` | `number/double` |
| `isPostPaid` | `boolean` |

#### `RescheduleExamResponseDtoApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `RescheduleExamResponseDto` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `RescheduleResponseDto`

| Field | Type |
|---|---|
| `isFree` | `boolean` |
| `newReservationId` | `string/uuid` |

#### `RescheduleResponseDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `RescheduleResponseDto` |
| `message` | `string?` |

#### `ReservationInfoResponseDto`

| Field | Type |
|---|---|
| `reservationId` | `string/uuid` |
| `itemId` | `string/uuid` |
| `planId` | `string/uuid?` |
| `organizationId` | `string/uuid?` |
| `candidateName` | `string?` |
| `nationalId` | `string?` |
| `profileId` | `string/uuid?` |
| `isOrganizationMember` | `boolean` |
| `organizationName` | `string?` |
| `name` | `string?` |
| `description` | `string?` |
| `language` | `string?` |
| `skills` | `string?` |
| `imageUrl` | `string?` |
| `materialUrl` | `string?` |
| `rate` | `number/double?` |
| `numberOfUserRates` | `integer/int32?` |
| `comments` | `string?` |
| `price` | `string?` |
| `reservationNo` | `string?` |
| `startDate` | `string?` |
| `activityDate` | `string/date-time` |
| `endDate` | `string?` |
| `tryNo` | `integer/int32` |
| `startTime` | `string?` |
| `endTime` | `string?` |
| `duration` | `string?` |
| `sector` | `string?` |
| `location` | `string?` |
| `certificateId` | `string/uuid?` |
| `certificateType` | `string?` |
| `planTraningTypeId` | `TrainingTypeEnum` |
| `profileOwners` | `string?` |
| `reservationStatus` | `string?` |
| `reservationStatusEnum` | `ReservationStatus` |
| `reservationDate` | `string?` |
| `reservationType` | `ModuleType` |
| `validation` | `ReservationValidation` |
| `attendanceUrl` | `string?` |
| `checkInQrCode` | `string?` |
| `canSendExcuseRequest` | `boolean` |
| `execuseRequest` | `ExecuseRequestSubmitDto` |
| `examIdForProgramEndWithExam` | `string/uuid?` |
| `examEligibilityStatus` | `string?` |
| `isQualifiedForEndExamRegistration` | `boolean` |
| `isProgramCompleted` | `boolean` |
| `isAttendanceQualifiedForEndExam` | `boolean` |
| `programAttendancePercentage` | `number/double?` |
| `isExamWaitingPeriodPassed` | `boolean` |
| `examEligibleFromDate` | `string/date-time?` |
| `examWaitingPeriodDays` | `integer/int32` |
| `nextExamAttemptNumber` | `integer/int32` |
| `programEndDate` | `string/date-time?` |
| `lastExamAttemptDate` | `string/date-time?` |
| `isRegisteredInEndExam` | `boolean` |
| `endExamReservationId` | `string/uuid?` |
| `numberOfExamQuestions` | `integer/int32?` |
| `studyMaterialLink` | `string?` |
| `studyMaterialNote` | `string?` |

#### `ReservationInfoResponseDtoApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `ReservationInfoResponseDto` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `ReservationStatus`

Enum values: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`

#### `ReservationValidation`

| Field | Type |
|---|---|
| `isRescheduleValid` | `boolean` |
| `isRescheduleExceptionValid` | `boolean` |
| `isCancelValid` | `boolean` |
| `isChangeProfileValid` | `boolean` |
| `canSendExcuseRequest` | `boolean` |
| `rescheduleFees` | `number/double` |
| `cancellationFees` | `number/double` |
| `errors` | `Item[]?` |
| `isCISIOwner` | `boolean` |

#### `ResetPasswordNafathRequest`

| Field | Type |
|---|---|
| `identityNumber` | `string` |
| `transId` | `string` |
| `randomNumber` | `string` |
| `password` | `string/password` |
| `confirmPassword` | `string/password?` |

#### `ResetPasswordRequest`

| Field | Type |
|---|---|
| `userId` | `string` |
| `code` | `string` |
| `password` | `string/password` |
| `confirmPassword` | `string/password?` |

#### `SavePrePostQuestionAnswer`

| Field | Type |
|---|---|
| `questionId` | `string/uuid` |
| `selectedAnswerId` | `string/uuid` |
| `targetId` | `string/uuid` |

#### `SearchInviteViewModel`

| Field | Type |
|---|---|
| `query` | `string?` |
| `status` | `InvitationResult` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `SearchMyEventsDto`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `registrationType` | `RegistrationType` |
| `eventReservationStatus` | `EventReservationStatus` |
| `name` | `string?` |
| `startDate` | `string/date-time?` |
| `endDate` | `string/date-time?` |

#### `SearchMyExamDto`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `registrationType` | `RegistrationListType` |
| `examName` | `string?` |

#### `SearchMyProgramsDto`

| Field | Type |
|---|---|
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `registrationType` | `RegistrationType` |
| `trainingType` | `TrainingTypeEnum` |
| `progName` | `string?` |

#### `SearchResultsDto`

| Field | Type |
|---|---|
| `searchText` | `string?` |
| `totalCount` | `integer/int32` |
| `programsCount` | `integer/int32` |
| `examsCount` | `integer/int32` |
| `eventsCount` | `integer/int32` |
| `programs` | `ProgramDto[]?` |
| `exams` | `ExamCardDto[]?` |
| `events` | `EventCardDto[]?` |

#### `SearchResultsDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `SearchResultsDto` |
| `message` | `string?` |

#### `SendVerificationCodeRequestDto`

| Field | Type |
|---|---|
| `universityEmail` | `string/email` |

#### `Sort`

Enum values: `1`, `2`, `3`, `4`, `5`, `6`

#### `StringApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `string?` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `TestCenterViewModel`

| Field | Type |
|---|---|
| `testCenterId` | `string/uuid` |
| `name` | `string?` |

#### `TestCenterViewModelReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `TestCenterViewModel` |
| `message` | `string?` |

#### `TopMenuDto`

| Field | Type |
|---|---|
| `programMenu` | `ProgramMenuDto` |
| `financialSectorProgramMenu` | `FinancialSectorProgramMenuDto` |
| `examMenu` | `ExamMenuDto` |
| `eventMenu` | `EventMenuDto` |
| `reportAndStudy` | `ReportAndStudyMenuDto` |
| `initiativeMenu` | `InitiativeMenuSectionDto` |

#### `TopMenuDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `TopMenuDto` |
| `message` | `string?` |

#### `TrainingTopicsPageDto`

| Field | Type |
|---|---|
| `module` | `string?` |
| `pageTitle` | `string?` |
| `allPrograms` | `PageNavigationDto` |
| `topics` | `TrainingTopicDto[]?` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `TrainingTopicsPageDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `TrainingTopicsPageDto` |
| `message` | `string?` |

#### `TrainingTypeEnum`

Enum values: `0`, `1`, `2`, `3`

#### `TrendingHomeDto`

| Field | Type |
|---|---|
| `programs` | `ProgramDto[]?` |
| `exams` | `ExamCardDto[]?` |
| `events` | `EventCardDto[]?` |
| `siteContents` | `SiteContentDto[]?` |
| `initiativeMenu` | `InitiativeMenuItemViewModel[]?` |
| `reportAndStudy` | `ReportAndStudyDto[]?` |
| `notificationCount` | `integer/int32` |

#### `TrendingHomeDtoReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `TrendingHomeDto` |
| `message` | `string?` |

#### `UpdateContractViewModel`

| Field | Type |
|---|---|
| `contractId` | `string/uuid` |
| `comment` | `string?` |

#### `UpdateLearningGroupStatusViewModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid` |
| `learningGroupId` | `string/uuid` |
| `isActive` | `boolean` |

#### `UpdateUserRoleViewModel`

| Field | Type |
|---|---|
| `userId` | `string/uuid` |
| `roles` | `UserRole[]?` |

#### `UserBillsListDtoListReturnResult`

| Field | Type |
|---|---|
| `errors` | `Item[]?` |
| `isValid` | `boolean` |
| `value` | `UserBillsListDto[]?` |
| `message` | `string?` |

#### `UserCertificateApiModel`

| Field | Type |
|---|---|
| `fullUserName` | `string?` |
| `issueNumber` | `string?` |
| `expirationTimeInYears` | `integer/int32?` |
| `issueDate` | `string/date-time` |
| `titleAr` | `string?` |
| `titleEn` | `string?` |
| `certificateTypeId` | `integer/int32` |
| `certificateTypeName` | `string?` |
| `prerequisiteCertificateExams` | `LookupModel[]?` |
| `prerequisiteCertificateTrainingCourses` | `LookupModel[]?` |
| `prerequisiteCertificateEvents` | `LookupModel[]?` |

#### `UserCertificateApiModelApiResponse`

| Field | Type |
|---|---|
| `confirm` | `boolean` |
| `message` | `string?` |
| `modelStateErrors` | `Item[]?` |
| `success` | `boolean` |
| `value` | `UserCertificateApiModel` |
| `totalItems` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `pageNumber` | `integer/int32` |

#### `UserCertificateFilterRequest`

| Field | Type |
|---|---|
| `certificateTypeId` | `integer/int32?` |
| `userId` | `string/uuid?` |
| `title` | `string?` |
| `pageNumber` | `integer/int32` |
| `pageSize` | `integer/int32` |

#### `UserLearningReportQueryModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid?` |
| `startDate` | `string/date-time?` |
| `endDate` | `string/date-time?` |

#### `UserRequestSortKey`

Enum values: `1`, `2`, `3`

#### `UserRequestStatus`

Enum values: `0`, `1`, `2`, `3`, `4`, `5`, `6`

#### `ValidateOrganizationProgramDataQueryModel`

| Field | Type |
|---|---|
| `userId` | `string/uuid?` |
| `organizationId` | `string/uuid?` |
| `programIds` | `string/uuid[]?` |

#### `VerifyVerificationCodeRequestDto`

| Field | Type |
|---|---|
| `universityEmail` | `string/email` |
| `verificationCode` | `string` |

#### `WalletCartInfo`

| Field | Type |
|---|---|
| `balance` | `number/double` |
| `enable` | `boolean` |
| `show` | `boolean` |

#### `WorkSpaceAssignedUsersFilterViewModel`

| Field | Type |
|---|---|
| `provider` | `WorkSpaceProvider` |
| `orgId` | `string/uuid` |
| `programId` | `string/uuid` |
| `userName` | `string?` |
| `title` | `string?` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `WorkSpaceEnrollementStatusViewModel`

| Field | Type |
|---|---|
| `provider` | `WorkSpaceProvider` |
| `orgId` | `string/uuid` |
| `planTaker` | `string/uuid` |
| `enrollementStatus` | `EnrollementStatus` |
| `dueDate` | `string/date-time?` |

#### `WorkSpaceLearnerProgressRequestModel`

| Field | Type |
|---|---|
| `provider` | `WorkSpaceProvider` |
| `organizationId` | `string/uuid` |
| `programId` | `string/uuid` |
| `userIds` | `string/uuid[]?` |

#### `WorkSpaceLearnerRequestModel`

| Field | Type |
|---|---|
| `term` | `string?` |
| `provider` | `WorkSpaceProvider` |
| `organizationId` | `string/uuid` |
| `workSpaceTypeId` | `string/uuid?` |
| `pageNumber` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `activeStatus` | `ActiveStatus` |

#### `WorkSpaceLicenseFilterRequestsViewModel`

| Field | Type |
|---|---|
| `organizationId` | `string/uuid` |
| `status` | `LicenceRequestStatus` |
| `employeeName` | `string?` |
| `idNumber` | `string?` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `WorkSpaceProgramsFilterViewModel`

| Field | Type |
|---|---|
| `provider` | `WorkSpaceProvider` |
| `orgId` | `string/uuid` |
| `classificationId` | `integer/int32?` |
| `title` | `string?` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |

#### `WorkSpaceProvider`

Enum values: `1`, `2`, `3`, `4`, `5`

#### `WorkSpaceUserCoursesFilterViewModel`

| Field | Type |
|---|---|
| `provider` | `WorkSpaceProvider` |
| `orgId` | `string/uuid` |

#### `WorkSpaceUserProgramsFilterViewModel`

| Field | Type |
|---|---|
| `provider` | `WorkSpaceProvider` |
| `orgId` | `string/uuid` |
| `userId` | `string/uuid?` |
| `title` | `string?` |
| `isMandatory` | `boolean?` |
| `status` | `LearnerStatus` |
| `sortBy` | `Sort` |
| `sortDesc` | `boolean` |
| `pageNumber` | `integer/int32?` |
| `pageSize` | `integer/int32?` |
| `classificationId` | `integer/int32?` |

#### `WorkSpaceUserProgressRequestModel`

| Field | Type |
|---|---|
| `term` | `string?` |
| `provider` | `WorkSpaceProvider` |
| `organizationId` | `string/uuid` |
| `workSpaceTypeId` | `string/uuid?` |
| `pageNumber` | `integer/int32` |
| `pageSize` | `integer/int32` |
| `activeStatus` | `ActiveStatus` |
| `programIds` | `string/uuid[]?` |

---

## 5. API v2

- `GET /api/v2/Catalog/search` — no summary provided → **untyped**

The v2 document currently exposes a single operation; the entire functional surface lives in v1.

---

## 6. Gaps worth closing

1. **245 of 324 operations (76%) publish no response schema.** Consumers cannot generate clients or validate payloads for them. Adding `[ProducesResponseType(typeof(X), 200)]` to those controllers fixes it.
2. **Missing error contracts.** Most operations declare only `200`; `400/401/403/404/500` are undeclared, so error payload shape is unknown to clients.
3. **Two competing envelopes** (`ApiResponse` and `ReturnResult`) with different success/message field names force consumers to branch per endpoint. Consolidating to one envelope is a low-cost, high-value cleanup.
4. **Empty summaries.** 208 operations have no description in the contract.
