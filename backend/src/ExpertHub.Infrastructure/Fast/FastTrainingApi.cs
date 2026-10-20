using System.Globalization;
using System.Net.Http.Headers;
using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Fast;

/*
 * The FAST Training API (`/training`, scope `ims_training_api`) — the service FAST
 * published for Expert Hub's integration request. Every shape below is the
 * OpenAPI document's own (`tools/fast-api/training-swagger-v1.json`, register in
 * `docs/integrations/fast-training-api-register.md`), not a guess: unlike the
 * portal API, this one declares a schema for every response.
 *
 * All ids are strings, because FAST mixes int and GUID keys (`NamedRefDto`).
 */

/// <summary>A lookup value inside a record (`NamedRefDto`).</summary>
public sealed record FastNamedRef(string? Id, string? Code, string? NameAr, string? NameEn);

/// <summary>A row of a reference list (`LookupItemDto`).</summary>
public sealed record FastLookupRow(
    string? Id, string? Code, string? NameAr, string? NameEn, bool IsActive, string? ParentId);

/// <summary>`ProgramSearchRequest` — B-03.</summary>
public sealed record FastProgramSearch(
    int PageNumber, int PageSize, string? SearchText, string? Status, bool HasUpcomingPlans);

/// <summary>`PagedItemsDto`.</summary>
public sealed record FastPage<T>(int TotalItems, int PageNumber, int PageSize, IReadOnlyList<T> Items);

/// <summary>`ProgramListItemDto` — B-03 row.</summary>
public sealed record FastProgramListItem(
    string? ProgramId, string? ProgramCode, string? NameAr, string? NameEn, string? Status,
    FastNamedRef? ProgramType, bool IsExecutive, bool IsCustom);

/// <summary>`FileRefDto`; <c>DownloadUrl</c> is relative to the API base.</summary>
public sealed record FastFileRef(string? FileName, string? DownloadUrl);

/// <summary>`ProgramDetailsDto` — B-04.</summary>
public sealed record FastProgramDetails(
    string? ProgramId, string? ProgramCode, string? NameAr, string? NameEn,
    string? BriefAr, string? BriefEn, string? Status,
    IReadOnlyList<FastNamedRef>? Sectors, IReadOnlyList<FastNamedRef>? SubSectors,
    IReadOnlyList<FastNamedRef>? JobFamilies, FastNamedRef? TraineeLevel,
    FastFileRef? Prospectus, FastFileRef? ProspectusEn);

/// <summary>`PlanListItemDto` — B-05 row.</summary>
public sealed record FastPlanListItem(
    string? PlanId, string? PlanCode, FastNamedRef? Status, DateTime? StartDate, DateTime? EndDate,
    FastNamedRef? City, string? DeliveryMode, bool HasTrainer);

/// <summary>`ScheduleDayDto`.</summary>
public sealed record FastScheduleDay(DateTime Date, TimeSpan StartTime, TimeSpan EndTime, bool IsLatestSchedule);

/// <summary>`PlanTrainerDto`.</summary>
public sealed record FastPlanTrainer(string? TrainerFastUserId, string? NameAr, string? NameEn, bool IsFreelance);

/// <summary>`TrainingMaterialDto`.</summary>
public sealed record FastTrainingMaterial(string? PlanId, FastNamedRef? Status, FastFileRef? File);

/// <summary>`PlanDetailsDto` — B-06.</summary>
public sealed record FastPlanDetails(
    string? PlanId, string? PlanCode, string? ProgramId, FastNamedRef? Status, DateTime? FinalClosedOn,
    FastNamedRef? Centre, int NumberOfDays, double NumberOfHours, double ProgramFee,
    FastNamedRef? Language, FastNamedRef? DeliveryMode, string? VenueScope,
    FastNamedRef? Country, FastNamedRef? City, string? Period, FastNamedRef? FoodServicePeriod,
    IReadOnlyList<FastNamedRef>? ClientOrganizations, string? TeamsUrl,
    IReadOnlyList<FastScheduleDay>? ScheduleDays, FastTrainingMaterial? TrainingMaterial,
    IReadOnlyList<FastPlanTrainer>? Trainers);

/// <summary>`PlanCancellationDto`.</summary>
public sealed record FastPlanCancellation(FastNamedRef? Reason, string? ReasonOther, DateTime? CanceledOn);

/// <summary>`PlanStatusDto` — B-11.</summary>
public sealed record FastPlanStatus(
    string? PlanId, FastNamedRef? Status, DateTime? FinalClosedOn,
    IReadOnlyList<FastScheduleDay>? ScheduleDays, string? TeamsUrl, FastPlanCancellation? Cancellation);

/// <summary>`AttendanceDto` — <c>present</c> | <c>absent</c>.</summary>
public sealed record FastAttendance(DateTime Date, TimeSpan? SessionStartTime, string? Status);

/// <summary>`PlanTakerDto` — B-10 row, names only.</summary>
public sealed record FastPlanTaker(string? NameAr, string? NameEn, IReadOnlyList<FastAttendance>? Attendance);

/// <summary>`TrainerRatingDto`.</summary>
public sealed record FastTrainerRating(
    double? OverallRating, int ResponseCount,
    double? OneRating, double? TwoRating, double? ThreeRating, double? FourRating, double? FiveRating);

/// <summary>`SurveyResponseDto`.</summary>
public sealed record FastSurveyResponse(
    string? EvaluationId, string? QuestionId, string? QuestionTextAr, string? QuestionTextEn,
    int? Value, string? AnswerTextAr, string? AnswerTextEn, int ScaleLow, int ScaleHigh, DateTime ReceivedAt);

/// <summary>`TrainerEvaluationDto` — B-12.</summary>
public sealed record FastTrainerEvaluation(
    string? PlanId, string? TrainerFastUserId, FastTrainerRating? Rating,
    IReadOnlyList<FastSurveyResponse>? PlanSurveyResponses);

/// <summary>`DeliveredPlanDto` — B-14 row.</summary>
public sealed record FastDeliveredPlan(
    string? ProgramId, string? NameAr, string? NameEn, string? PlanId, string? PlanCode,
    DateTime? StartDate, DateTime? EndDate, FastNamedRef? Status);

/// <summary>`AssignTrainerResponseDto` — B-07.</summary>
public sealed record FastAssignTrainerResult(
    string? PlanTrainerId, string? PlanId, string? TrainerFastUserId, bool AlreadyAssigned);

/// <summary>`UnassignTrainerResponseDto` — B-08.</summary>
public sealed record FastUnassignTrainerResult(string? PlanId, bool Removed);

/// <summary>FAST's plan status codes (`Lookup/GetPlanStatuses`).</summary>
public static class FastPlanStatuses
{
    public const string New = "new";
    public const string Open = "open";
    public const string Closed = "closed";
    public const string FinalClosed = "final-closed";
    public const string Canceled = "canceled";

    /// <summary>
    /// RUN-030 — a plan Expert Hub may still assign people to: <c>new</c> or
    /// <c>open</c>, not final-closed, and not already over. A closed, final-closed
    /// or cancelled plan — or one whose last day has passed — is refused.
    /// </summary>
    public static bool IsAssignable(FastNamedRef? status, DateTime? finalClosedOn, DateTime? endDate, DateTime today) =>
        status?.Code is New or Open
        && finalClosedOn is null
        && (endDate is null || endDate.Value.Date >= today.Date);
}

/// <summary>
/// The FAST Training API, through the same fail-closed <see cref="FastApiClient"/>
/// (envelope unwrapping, explicit timeout, a reason instead of an exception).
/// </summary>
/// <remarks>
/// <para>
/// Configured by <c>Fast:TrainingBaseUrl</c> — empty means off, and every call
/// fails closed with a reason. Authenticated as a SERVICE only: a
/// client-credentials token for <c>Fast:TrainingScope</c> (default
/// <c>ims_training_api</c>), with the same <c>Fast:ClientId</c> /
/// <c>Fast:ClientSecret</c> as the portal API.
/// </para>
/// <para>
/// ⚠️ Needs Confirmation (FAST): that the Expert Hub client is granted
/// <c>ims_training_api</c> in each environment.
/// </para>
/// </remarks>
public sealed class FastTrainingApi
{
    private readonly FastApiClient _client;

    public FastTrainingApi(FastApiClient client, IFastTokenProvider tokens)
    {
        _client = client;
        Tokens = tokens;
    }

    public bool IsConfigured => _client.IsConfigured;

    /// <summary>The service token seam, so a caller can tell «no credential» from «FAST down».</summary>
    public IFastTokenProvider Tokens { get; }

    /// <summary>Each synchronized list's code → its lookup operation (B-15).</summary>
    public static readonly IReadOnlyDictionary<string, string> LookupPaths = new Dictionary<string, string>
    {
        [FastReferenceLists.Sectors] = "api/v1/Lookup/GetSectors",
        [FastReferenceLists.JobFamilies] = "api/v1/Lookup/GetJobFamilies",
        [FastReferenceLists.Topics] = "api/v1/Lookup/GetTopics",
        [FastReferenceLists.TraineeLevels] = "api/v1/Lookup/GetTraineeLevels",
        [FastReferenceLists.CancellationReasons] = "api/v1/Lookup/GetCancellationReasons",
        [FastReferenceLists.PlanStatuses] = "api/v1/Lookup/GetPlanStatuses",
        [FastReferenceLists.DeliveryModes] = "api/v1/Lookup/GetDeliveryModes",
        [FastReferenceLists.VenueScopes] = "api/v1/Lookup/GetVenueScopes",
        [FastReferenceLists.TrainingMaterialStatuses] = "api/v1/Lookup/GetTrainingMaterialStatuses",
        [FastReferenceLists.Languages] = "api/v1/Lookup/GetLanguages",
        [FastReferenceLists.ProgramTypes] = "api/v1/Lookup/GetProgramTypes",
        [FastReferenceLists.FoodServicePeriods] = "api/v1/Lookup/GetFoodServicePeriods",
        [FastReferenceLists.ProgramSkillTypes] = "api/v1/Lookup/GetProgramSkillTypes",
        [FastReferenceLists.TargetGenders] = "api/v1/Lookup/GetTargetGenders",
    };

    public Task<FastResult<List<FastLookupRow>>> LookupAsync(string listCode, CancellationToken ct) =>
        _client.GetAsync<List<FastLookupRow>>(LookupPaths[listCode], "ar", ct);

    /// <summary>B-03.</summary>
    public Task<FastResult<FastPage<FastProgramListItem>>> SearchProgramsAsync(
        FastProgramSearch search, CancellationToken ct) =>
        _client.PostAsync<FastPage<FastProgramListItem>>("api/v1/Program/Search", search, "ar", ct);

    /// <summary>B-04.</summary>
    public Task<FastResult<FastProgramDetails>> ProgramDetailsAsync(string programId, CancellationToken ct) =>
        _client.GetAsync<FastProgramDetails>(
            $"api/v1/Program/GetProgramDetails?programId={Uri.EscapeDataString(programId)}", "ar", ct);

    /// <summary>B-05 — <paramref name="status"/> <c>open</c> means new or open plans.</summary>
    public Task<FastResult<List<FastPlanListItem>>> PlansAsync(
        string programId, string? status, DateTime? fromDate, CancellationToken ct)
    {
        var query = $"programId={Uri.EscapeDataString(programId)}";
        if (!string.IsNullOrWhiteSpace(status))
        {
            query += $"&status={Uri.EscapeDataString(status)}";
        }
        if (fromDate is not null)
        {
            query += $"&fromDate={fromDate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)}";
        }
        return _client.GetAsync<List<FastPlanListItem>>($"api/v1/Program/GetPlansByProgramId?{query}", "ar", ct);
    }

    /// <summary>B-06.</summary>
    public Task<FastResult<FastPlanDetails>> PlanDetailsAsync(string planId, CancellationToken ct) =>
        _client.GetAsync<FastPlanDetails>(
            $"api/v1/Program/GetPlanDetails?planId={Uri.EscapeDataString(planId)}", "ar", ct);

    /// <summary>B-07 — idempotent at FAST: a trainer already on the plan answers <c>alreadyAssigned</c>.</summary>
    public Task<FastResult<FastAssignTrainerResult>> AssignTrainerAsync(
        Guid planId, Guid trainerFastUserId, bool isFreelance, CancellationToken ct) =>
        _client.PostAsync<FastAssignTrainerResult>(
            "api/v1/Plan/AssignTrainer", new { planId, trainerFastUserId, isFreelance }, "ar", ct);

    /// <summary>B-08 — idempotent at FAST: a trainer not on the plan answers <c>removed = false</c>.</summary>
    public Task<FastResult<FastUnassignTrainerResult>> UnassignTrainerAsync(
        Guid planId, Guid trainerFastUserId, string? reasonText, CancellationToken ct) =>
        _client.PostAsync<FastUnassignTrainerResult>(
            "api/v1/Plan/UnassignTrainer", new { planId, trainerFastUserId, reasonText }, "ar", ct);

    /// <summary>B-09 — the material status and, when a file is given, the file itself (max 50 MB).</summary>
    public Task<FastResult<FastTrainingMaterial>> SetTrainingMaterialAsync(
        Guid planId, string statusCode, string? fileName, byte[]? file, string? contentType, CancellationToken ct)
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent(planId.ToString()), "PlanId" },
            { new StringContent(statusCode), "StatusCode" },
        };
        if (file is not null)
        {
            var part = new ByteArrayContent(file);
            part.Headers.ContentType = new MediaTypeHeaderValue(contentType ?? "application/octet-stream");
            form.Add(part, "File", fileName ?? "material");
        }
        return _client.PostAsync<FastTrainingMaterial>("api/v1/Plan/TrainingMaterial", form, "ar", ct);
    }

    /// <summary>B-10 — names only, with attendance per session.</summary>
    public Task<FastResult<List<FastPlanTaker>>> PlanTakersAsync(string planId, CancellationToken ct) =>
        _client.GetAsync<List<FastPlanTaker>>(
            $"api/v1/Plan/GetPlanTakers?planId={Uri.EscapeDataString(planId)}", "ar", ct);

    /// <summary>B-11.</summary>
    public Task<FastResult<FastPlanStatus>> PlanStatusAsync(string planId, CancellationToken ct) =>
        _client.GetAsync<FastPlanStatus>(
            $"api/v1/Plan/GetPlanStatus?planId={Uri.EscapeDataString(planId)}", "ar", ct);

    /// <summary>B-12.</summary>
    public Task<FastResult<FastTrainerEvaluation>> TrainerEvaluationsAsync(
        string planId, string trainerFastUserId, CancellationToken ct) =>
        _client.GetAsync<FastTrainerEvaluation>(
            $"api/v1/Survey/GetTrainerEvaluations?planId={Uri.EscapeDataString(planId)}"
            + $"&trainerFastUserId={Uri.EscapeDataString(trainerFastUserId)}", "ar", ct);

    /// <summary>B-14 — closed and final-closed plans the trainer delivered, newest first.</summary>
    public Task<FastResult<List<FastDeliveredPlan>>> DeliveredPlansAsync(string trainerFastUserId, CancellationToken ct) =>
        _client.GetAsync<List<FastDeliveredPlan>>(
            $"api/v1/Trainer/GetDeliveredPlans?trainerFastUserId={Uri.EscapeDataString(trainerFastUserId)}", "ar", ct);
}
