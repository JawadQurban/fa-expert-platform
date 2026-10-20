# FAST Training API Register

Every operation of the FAST **Training API**, the service FAST published for Expert Hub's integration request (`22_FAST_INTEGRATION_REQUEST.md`, blocked items B-03 to B-14). Generated from `tools/fast-api/training-swagger-v1.json` by `tools/fast-api/build-training-register.py` — **do not edit by hand**.

| | |
|---|---|
| **Host (testing)** | `testingadminapi.fa.gov.sa` |
| **Base path** | `/training` |
| **Auth** | OAuth 2.0 `clientCredentials`, scope `ims_training_api`, token from `https://testingauth.fa.gov.sa/identitymanagement.sts/connect/token` |
| **Operations** | 27 |
| **By method** | 23 GET · 4 POST |
| **Envelope** | `ApiResponse` — `success`, `message`, `modelStateErrors`, `value` (the payload) |
| **Captured** | 2026-10-20 |

## Operations

| Method | Path | Parameters | Returns | Summary |
|---|---|---|---|---|
| `GET` | `/api/v1/Lookup/GetSectors` | — | [LookupItemDto](#lookupitemdto)[] | Sectors and sub-sectors (Competencies). A sub-sector's parentId is its sector. |
| `GET` | `/api/v1/Lookup/GetJobFamilies` | — | [LookupItemDto](#lookupitemdto)[] | Job families (Competencies). |
| `GET` | `/api/v1/Lookup/GetTopics` | — | [LookupItemDto](#lookupitemdto)[] | Programme topics. |
| `GET` | `/api/v1/Lookup/GetTraineeLevels` | — | [LookupItemDto](#lookupitemdto)[] | Trainee levels (lookup.ProgramParticipantLevel). |
| `GET` | `/api/v1/Lookup/GetCancellationReasons` | — | [LookupItemDto](#lookupitemdto)[] | Plan cancellation reasons. |
| `GET` | `/api/v1/Lookup/GetPlanStatuses` | — | [LookupItemDto](#lookupitemdto)[] | Plan statuses; code is new \| open \| closed \| final-closed \| canceled. |
| `GET` | `/api/v1/Lookup/GetDeliveryModes` | — | [LookupItemDto](#lookupitemdto)[] | Delivery modes (lookup.TrainingType); code is in-class \| online \| self-learning. |
| `GET` | `/api/v1/Lookup/GetVenueScopes` | — | [LookupItemDto](#lookupitemdto)[] | Venue scopes (lookup.PlanLocation); code is inside-academy \| outside-academy \| client-site \| online \| unknown. |
| `GET` | `/api/v1/Lookup/GetTrainingMaterialStatuses` | — | [LookupItemDto](#lookupitemdto)[] | Training material statuses; code is new \| current \| book \| none \| unknown. |
| `GET` | `/api/v1/Lookup/GetLanguages` | — | [LookupItemDto](#lookupitemdto)[] | Training languages. |
| `GET` | `/api/v1/Lookup/GetProgramTypes` | — | [LookupItemDto](#lookupitemdto)[] | Programme types. |
| `GET` | `/api/v1/Lookup/GetFoodServicePeriods` | — | [LookupItemDto](#lookupitemdto)[] | Food service periods (full day / half day). |
| `GET` | `/api/v1/Lookup/GetProgramSkillTypes` | — | [LookupItemDto](#lookupitemdto)[] | Programme skill types. |
| `GET` | `/api/v1/Lookup/GetTargetGenders` | — | [LookupItemDto](#lookupitemdto)[] | Target genders. |
| `POST` | `/api/v1/Plan/AssignTrainer` | body [AssignTrainerRequest](#assigntrainerrequest) | [AssignTrainerResponseDto](#assigntrainerresponsedto) | B-07: adds a trainer to a plan. Safe to retry: a trainer already on the plan returns the existing record with alreadyAssigned = true. Other trainers on the plan are kept. |
| `POST` | `/api/v1/Plan/UnassignTrainer` | body [UnassignTrainerRequest](#unassigntrainerrequest) | [UnassignTrainerResponseDto](#unassigntrainerresponsedto) | B-08: removes a trainer from a plan. Safe to retry: a trainer who is not on the plan returns removed = false. |
| `POST` | `/api/v1/Plan/TrainingMaterial` | body (multipart/form-data: `PlanId`, `StatusCode`, `File`?) | [TrainingMaterialDto](#trainingmaterialdto) | B-09: sets the plan's training material status and, when a file is sent, replaces the material file (max 50 MB). |
| `GET` | `/api/v1/Plan/{planId}/TrainingMaterial/File` | `planId` (path, required) | binary | Downloads the plan's current training material file. |
| `GET` | `/api/v1/Plan/GetPlanTakers` | `planId` (query, required) | [PlanTakerDto](#plantakerdto)[] | B-10: trainees with a confirmed registration on the plan (names only), with attendance per session. |
| `GET` | `/api/v1/Plan/GetPlanStatus` | `planId` (query, required) | [PlanStatusDto](#planstatusdto) | B-11: status, schedule, Teams link and cancellation of one plan. |
| `POST` | `/api/v1/Program/Search` | body [ProgramSearchRequest](#programsearchrequest) | [ProgramListItemDtoPagedItemsDto](#programlistitemdtopageditemsdto) | B-03: searches approved programmes, paged. |
| `GET` | `/api/v1/Program/GetProgramDetails` | `programId` (query, required) | [ProgramDetailsDto](#programdetailsdto) | B-04: a programme's brief, sectors, job families, trainee level and prospectus. |
| `GET` | `/api/v1/Program/GetPlansByProgramId` | `programId` (query, required)<br>`status` (query)<br>`fromDate` (query) | [PlanListItemDto](#planlistitemdto)[] | B-05: the plans of a programme. |
| `GET` | `/api/v1/Program/GetPlanDetails` | `planId` (query, required) | [PlanDetailsDto](#plandetailsdto) | B-06: the full plan record: schedule, venue, language, delivery mode, training material and trainers. |
| `GET` | `/api/v1/Program/{programId}/Prospectus/File` | `programId` (path, required)<br>`lang` (query) | binary | Downloads the programme prospectus. |
| `GET` | `/api/v1/Survey/GetTrainerEvaluations` | `planId` (query, required)<br>`trainerFastUserId` (query, required) | [TrainerEvaluationDto](#trainerevaluationdto) | B-12: the trainer's MTM rating on the plan, plus the plan's trainee survey answers. FAST does not link survey answers to a trainer, so the answers are the plan's. |
| `GET` | `/api/v1/Trainer/GetDeliveredPlans` | `trainerFastUserId` (query, required) | [DeliveredPlanDto](#deliveredplandto)[] | B-14: closed and final-closed plans the trainer delivered, newest first. An unknown trainer returns an empty list. |

## Error responses

- `POST /api/v1/Plan/AssignTrainer` — `400` The plan is closed or canceled, or the user is not an active FAST trainer.; `404` The plan does not exist.
- `POST /api/v1/Plan/UnassignTrainer` — `400` The plan is closed; a delivered plan keeps its trainer.; `404` The plan does not exist.
- `POST /api/v1/Plan/TrainingMaterial` — `400` Unknown status code, a rejected file, or the plan is final-closed or canceled.; `404` The plan does not exist.
- `GET /api/v1/Plan/{planId}/TrainingMaterial/File` — `404` Not Found
- `GET /api/v1/Plan/GetPlanTakers` — `404` Not Found
- `GET /api/v1/Plan/GetPlanStatus` — `404` Not Found
- `POST /api/v1/Program/Search` — `400` Bad Request
- `GET /api/v1/Program/GetProgramDetails` — `404` Not Found
- `GET /api/v1/Program/GetPlansByProgramId` — `400` Bad Request; `404` Not Found
- `GET /api/v1/Program/GetPlanDetails` — `404` Not Found
- `GET /api/v1/Program/{programId}/Prospectus/File` — `404` Not Found
- `GET /api/v1/Survey/GetTrainerEvaluations` — `404` The trainer is not on the plan.

## Schemas

### ApiResponse

| Field | Type | Notes |
|---|---|---|
| `confirm` | boolean |  |
| `message` | string? |  |
| `modelStateErrors` | [Item](#item)[] |  |
| `success` | boolean |  |
| `value` | object? |  |

### AssignTrainerRequest

B-07 request.

| Field | Type | Notes |
|---|---|---|
| `planId` | uuid |  |
| `trainerFastUserId` | uuid |  |
| `isFreelance` | boolean |  |

### AssignTrainerResponseDto

| Field | Type | Notes |
|---|---|---|
| `planTrainerId` | string? |  |
| `planId` | string? |  |
| `trainerFastUserId` | string? |  |
| `alreadyAssigned` | boolean | True when the trainer was already on the plan and nothing changed. |

### AttendanceDto

One row per session the trainee was marked for.

| Field | Type | Notes |
|---|---|---|
| `date` | date-time |  |
| `sessionStartTime` | date-span? |  |
| `status` | string? | present \| absent. FAST records no "excused" state. |

### DeliveredPlanDto

B-14 row.

| Field | Type | Notes |
|---|---|---|
| `programId` | string? |  |
| `nameAr` | string? |  |
| `nameEn` | string? |  |
| `planId` | string? |  |
| `planCode` | string? |  |
| `startDate` | date-time? |  |
| `endDate` | date-time? |  |
| `status` | [NamedRefDto](#namedrefdto) |  |

### FileRefDto

| Field | Type | Notes |
|---|---|---|
| `fileName` | string? |  |
| `downloadUrl` | string? | Relative to the API base URL; call it with the same service token. |

### Item

| Field | Type | Notes |
|---|---|---|
| `name` | string? |  |
| `value` | string? |  |
| `count` | int32? |  |

### LookupItemDto

A row of a reference list.

| Field | Type | Notes |
|---|---|---|
| `id` | string? |  |
| `code` | string? | Stable language-neutral code, where FAST has one (e.g. plan status "open"); otherwise null. |
| `nameAr` | string? |  |
| `nameEn` | string? |  |
| `isActive` | boolean | False for retired values that stay readable on old records. |
| `parentId` | string? | The parent row: a city's country, a sub-sector's sector. Null when the list is flat. |

### NamedRefDto

A lookup value inside a record. All ids are strings: FAST mixes int and GUID keys.

| Field | Type | Notes |
|---|---|---|
| `id` | string? |  |
| `code` | string? | Stable language-neutral code, where FAST has one (e.g. plan status "open"); otherwise null. |
| `nameAr` | string? |  |
| `nameEn` | string? |  |

### PlanCancellationDto

| Field | Type | Notes |
|---|---|---|
| `reason` | [NamedRefDto](#namedrefdto) |  |
| `reasonOther` | string? |  |
| `canceledOn` | date-time? |  |

### PlanDetailsDto

B-06.

| Field | Type | Notes |
|---|---|---|
| `planId` | string? |  |
| `planCode` | string? |  |
| `programId` | string? |  |
| `status` | [NamedRefDto](#namedrefdto) |  |
| `finalClosedOn` | date-time? |  |
| `centre` | [NamedRefDto](#namedrefdto) |  |
| `numberOfDays` | int32 |  |
| `numberOfHours` | double |  |
| `programFee` | double | Display only. |
| `language` | [NamedRefDto](#namedrefdto) |  |
| `deliveryMode` | [NamedRefDto](#namedrefdto) |  |
| `venueScope` | string? | inside-academy \| outside-academy \| client-site \| online \| unknown (lookup.PlanLocation). |
| `country` | [NamedRefDto](#namedrefdto) |  |
| `city` | [NamedRefDto](#namedrefdto) |  |
| `period` | string? | morning \| evening, read from the first session's start time (before 12:00 is morning). FAST stores no such field. |
| `foodServicePeriod` | [NamedRefDto](#namedrefdto) |  |
| `clientOrganizations` | [NamedRefDto](#namedrefdto)[] | The client organizations of a private plan; empty for public plans. |
| `teamsUrl` | string? | Online plans only. |
| `scheduleDays` | [ScheduleDayDto](#scheduledaydto)[] |  |
| `trainingMaterial` | [TrainingMaterialDto](#trainingmaterialdto) |  |
| `trainers` | [PlanTrainerDto](#plantrainerdto)[] |  |

### PlanListItemDto

B-05 row.

| Field | Type | Notes |
|---|---|---|
| `planId` | string? |  |
| `planCode` | string? |  |
| `status` | [NamedRefDto](#namedrefdto) |  |
| `startDate` | date-time? |  |
| `endDate` | date-time? |  |
| `city` | [NamedRefDto](#namedrefdto) |  |
| `deliveryMode` | string? | in-class \| online \| self-learning. |
| `hasTrainer` | boolean | False means the plan still needs a trainer. |

### PlanStatusDto

B-11.

| Field | Type | Notes |
|---|---|---|
| `planId` | string? |  |
| `status` | [NamedRefDto](#namedrefdto) |  |
| `finalClosedOn` | date-time? |  |
| `scheduleDays` | [ScheduleDayDto](#scheduledaydto)[] |  |
| `teamsUrl` | string? |  |
| `cancellation` | [PlanCancellationDto](#plancancellationdto) |  |

### PlanTakerDto

B-10 row: names only.

| Field | Type | Notes |
|---|---|---|
| `nameAr` | string? |  |
| `nameEn` | string? |  |
| `attendance` | [AttendanceDto](#attendancedto)[] |  |

### PlanTrainerDto

| Field | Type | Notes |
|---|---|---|
| `trainerFastUserId` | string? |  |
| `nameAr` | string? |  |
| `nameEn` | string? |  |
| `isFreelance` | boolean |  |

### ProgramDetailsDto

B-04.

| Field | Type | Notes |
|---|---|---|
| `programId` | string? |  |
| `programCode` | string? |  |
| `nameAr` | string? |  |
| `nameEn` | string? |  |
| `briefAr` | string? |  |
| `briefEn` | string? |  |
| `status` | string? |  |
| `sectors` | [NamedRefDto](#namedrefdto)[] | A programme can belong to several sectors. |
| `subSectors` | [NamedRefDto](#namedrefdto)[] |  |
| `jobFamilies` | [NamedRefDto](#namedrefdto)[] |  |
| `traineeLevel` | [NamedRefDto](#namedrefdto) |  |
| `prospectus` | [FileRefDto](#filerefdto) |  |
| `prospectusEn` | [FileRefDto](#filerefdto) |  |

### ProgramListItemDto

B-03 row.

| Field | Type | Notes |
|---|---|---|
| `programId` | string? |  |
| `programCode` | string? |  |
| `nameAr` | string? |  |
| `nameEn` | string? |  |
| `status` | string? | active (published current version) \| inactive (unpublished current version) \| archived (superseded version). |
| `programType` | [NamedRefDto](#namedrefdto) |  |
| `isExecutive` | boolean |  |
| `isCustom` | boolean | A private (custom) programme built for one client. |

### ProgramListItemDtoPagedItemsDto

| Field | Type | Notes |
|---|---|---|
| `totalItems` | int32 |  |
| `pageNumber` | int32 |  |
| `pageSize` | int32 |  |
| `items` | [ProgramListItemDto](#programlistitemdto)[] |  |

### ProgramSearchRequest

B-03 request.

| Field | Type | Notes |
|---|---|---|
| `pageNumber` | int32 |  |
| `pageSize` | int32 | 1 to 200. |
| `searchText` | string? | Optional: matches the Arabic name, English name or programme code. |
| `status` | string? | active \| inactive \| archived. Omit for active and inactive. |
| `hasUpcomingPlans` | boolean | Only programmes with a new or open plan that has not started yet. |

### ScheduleDayDto

| Field | Type | Notes |
|---|---|---|
| `date` | date-time |  |
| `startTime` | date-span |  |
| `endTime` | date-span |  |
| `isLatestSchedule` | boolean |  |

### SurveyResponseDto

| Field | Type | Notes |
|---|---|---|
| `evaluationId` | string? |  |
| `questionId` | string? |  |
| `questionTextAr` | string? |  |
| `questionTextEn` | string? |  |
| `value` | int32? | 1 (weak) to 5 (excellent); null when the trainee was marked absent. |
| `answerTextAr` | string? |  |
| `answerTextEn` | string? |  |
| `scaleLow` | int32 |  |
| `scaleHigh` | int32 |  |
| `receivedAt` | date-time |  |

### TrainerEvaluationDto

B-12.

| Field | Type | Notes |
|---|---|---|
| `planId` | string? |  |
| `trainerFastUserId` | string? |  |
| `rating` | [TrainerRatingDto](#trainerratingdto) |  |
| `planSurveyResponses` | [SurveyResponseDto](#surveyresponsedto)[] | Trainee survey answers for the whole plan. FAST does not record which trainer a survey answer is about, so on a plan with several trainers these are shared. |

### TrainerRatingDto

| Field | Type | Notes |
|---|---|---|
| `overallRating` | double? |  |
| `responseCount` | int32 |  |
| `oneRating` | double? |  |
| `twoRating` | double? |  |
| `threeRating` | double? |  |
| `fourRating` | double? |  |
| `fiveRating` | double? |  |

### TrainingMaterialDto

| Field | Type | Notes |
|---|---|---|
| `planId` | string? |  |
| `status` | [NamedRefDto](#namedrefdto) |  |
| `file` | [FileRefDto](#filerefdto) |  |

### UnassignTrainerRequest

B-08 request.

| Field | Type | Notes |
|---|---|---|
| `planId` | uuid |  |
| `trainerFastUserId` | uuid |  |
| `reasonText` | string? |  |

### UnassignTrainerResponseDto

| Field | Type | Notes |
|---|---|---|
| `planId` | string? |  |
| `removed` | boolean | False when the trainer was not on the plan (for example a retry after a successful removal). |
