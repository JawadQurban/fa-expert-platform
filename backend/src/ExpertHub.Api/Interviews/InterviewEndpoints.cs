using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Api.ServiceRequests;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Interviews;

/*
 * EH-INT-04 — Interview Evaluation & Post-Interview Decision (CAP-02, J-07 +
 * the staff half of J-06), behind `interviewService.ts`:
 *
 *   GET  v1/internal/applications/{id}/interview
 *   POST v1/internal/applications/{id}/interview/evaluations
 *   POST v1/internal/applications/{id}/interview/decision
 *   POST v1/internal/applications/{id}/interview/reschedule
 *
 * The four invariants, held server-side:
 * - `BR-0220`: `result` is NULL — never a partial number — while any member
 *   is pending. The pending state is `submitted_at IS NULL` on the
 *   assignment row, so the rule is a query, not bookkeeping.
 * - Non-attendance is a distinct response, EXCLUDED from the average and
 *   never counted as zero (F1/AC-3, F2/AC-2) — the result reports how many
 *   it excluded.
 * - Each accepted service is scored independently (F1/AC-2): scores are
 *   per (axis, service); no blended application score exists.
 * - `BR-0208`: only the screening decision-maker decides — compared against
 *   `SCREENING_RESULT.decided_by`, never a role string.
 */

internal sealed record TicketWire(
    string Number, string ScheduledAt, string? MeetingUrl, int RescheduleCount);

/// <summary>J-06/F1/AC-3 + F3 — the applicant asked for a different time. Served
/// to staff so the request reaches somebody who can act on it; cleared when
/// staff propose new slots.</summary>
internal sealed record RescheduleRequestWire(string RequestedAt, string? Note);

internal sealed record AxisWire(
    string Id, LocalizedTextWire Label, LocalizedTextWire? Description,
    decimal Weight, decimal MaxScore);

internal sealed record RatingLevelWire(int Score, LocalizedTextWire Label);

/// <summary>One level of `INTERVIEW_MODEL.rating_scale` as stored.</summary>
internal sealed record RatingLevelDefinition(int Score, string LabelAr, string LabelEn);

/// <summary>`RatingScale` is null for a model that defines no named levels.</summary>
internal sealed record ModelWire(
    string Version, IReadOnlyList<AxisWire> Axes, IReadOnlyList<RatingLevelWire>? RatingScale);

internal sealed record MemberResponseWire(
    string MemberId, string Name, LocalizedTextWire RoleTitle,
    string State, string? RespondedAt);

/// <summary>
/// `Passed` applies the model's pass mark (the approved model: ≥ 70 of 100);
/// null when the interview's model has none (the draft model). Passing lets the
/// service proceed to the approval committee — it never approves it.
/// </summary>
internal sealed record ServiceResultWire(
    string Service, decimal Average, decimal MaxScore,
    int CountedEvaluations, int ExcludedNonAttendance, decimal? PassThreshold, bool? Passed);

internal sealed record InterviewViewerWire(
    string? MemberId, bool CanEvaluate, bool CanDecide, bool CanReschedule);

internal sealed record PostInterviewDecisionWire(
    string Kind, string DecidedAt, string DecidedByName, string? RejectionReason);

/// <remarks><c>ExemptedServices</c> — services of the same application exempted
/// from interview (J-08). They are eligible for the committee without an
/// interview result, so a failed interviewed service never takes them down.</remarks>
internal sealed record InterviewDetailWire(
    string ApplicationId, string Reference, string ApplicantName,
    IReadOnlyList<string> AcceptedServices,
    TicketWire Ticket, ModelWire Model,
    IReadOnlyList<MemberResponseWire> Committee,
    IReadOnlyList<ServiceResultWire>? Result,
    InterviewViewerWire Viewer,
    PostInterviewDecisionWire? Decision,
    IReadOnlyList<string> ExemptedServices,
    RescheduleRequestWire? RescheduleRequest = null);

internal sealed record AxisScoreInputWire(string? AxisId, decimal? Score);

internal sealed record ServiceEvaluationInputWire(
    string? Service, IReadOnlyList<AxisScoreInputWire>? AxisScores,
    string? Recommendation, string? Notes);

internal sealed record EvaluationInputWire(
    string? Kind, IReadOnlyList<ServiceEvaluationInputWire>? Services);

internal sealed record PostInterviewDecisionInputWire(
    string? Kind, string? Reason, string? ReasonOther);

internal sealed record StaffRescheduleInputWire(IReadOnlyList<string>? Slots, string? Note);

/// <summary>The J-07 internal surface.</summary>
public static class InterviewEndpoints
{
    public static RouteGroupBuilder MapInterviewEndpoints(this RouteGroupBuilder v1)
    {
        var interview = v1.MapGroup("/internal/applications/{id}/interview")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        // F-0203 تقييم المقابلة for reading and evaluating; F-0202 جدولة
        // المقابلة for proposing new times — two features, two audiences.
        interview.MapGet("/", async (
            string id, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var loaded = await LoadAsync(id, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No interview exists for this application.");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            return Results.Ok(await BuildDetailAsync(db, loaded.Value.Application, loaded.Value.Interview, actor.UserId, ct));
        }).WithName("InterviewDetail")
            .RequireFeature("F-0203");

        interview.MapPost("/evaluations", async (
            string id,
            EvaluationInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var loaded = await LoadAsync(id, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No interview exists for this application.");
            }
            var (application, interviewRow) = loaded.Value;
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var assignment = await db.InterviewEvaluations.FirstOrDefaultAsync(
                e => e.InterviewId == interviewRow.InterviewId
                    && e.EvaluatorUserId == actor.UserId, ct);
            if (assignment is null)
            {
                return Results.Problem(statusCode: 403, detail: "Not an assigned committee member.");
            }
            if (assignment.SubmittedAt is not null)
            {
                return Results.Problem(statusCode: 409, detail: "Already responded.");
            }
            if (interviewRow.Status != InterviewStatuses.Scheduled)
            {
                // J-07 follows J-06: nobody evaluates an interview whose time
                // the applicant has not confirmed. The page hiding the form is
                // not the rule — this is.
                return Results.Problem(statusCode: 409, detail: "interview-not-scheduled");
            }
            var now = DateTime.UtcNow;

            /*
             * Two claims, in this order. (1) Lock the interview row: the panel's
             * submissions run one at a time, so the LAST two members can no
             * longer each count the other as pending and leave the interview
             * `scheduled` for ever. (2) Claim this member's own row, so a
             * double-click is one response. A 400 below rolls back when the
             * transaction is disposed uncommitted.
             */
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            var locked = await db.Interviews
                .Where(i => i.InterviewId == interviewRow.InterviewId
                    && i.Status == InterviewStatuses.Scheduled)
                .ExecuteUpdateAsync(set => set.SetProperty(i => i.Status, i => i.Status), ct);
            if (locked == 0)
            {
                return Results.Problem(statusCode: 409, detail: "interview-not-scheduled");
            }
            var claimed = await db.InterviewEvaluations
                .Where(e => e.InterviewEvaluationId == assignment.InterviewEvaluationId
                    && e.SubmittedAt == null)
                .ExecuteUpdateAsync(set => set.SetProperty(e => e.SubmittedAt, now), ct);
            if (claimed == 0)
            {
                return Results.Problem(statusCode: 409, detail: "Already responded.");
            }

            if (string.Equals(input.Kind, "did-not-attend", StringComparison.Ordinal))
            {
                // F1/AC-3 — a response, never a zero.
                assignment.DidNotAttend = true;
                assignment.SubmittedAt = now;
            }
            else
            {
                var acceptedServices = await AcceptedServicesAsync(db, application.ApplicationId, ct);
                var (model, axes) = await ModelForAsync(db, acceptedServices, interviewRow.ModelVersion, ct);
                var levels = RatingLevels(model);
                var services = input.Services ?? [];
                // F1 — every axis of every accepted service; nothing partial is
                // storable. The recommendation is optional (business decision,
                // 2026-09-16) and stored as given.
                foreach (var service in acceptedServices)
                {
                    var entry = services.FirstOrDefault(s => s.Service == service);
                    if (entry is null
                        || axes.Any(axis => !(entry.AxisScores ?? []).Any(
                            s => s.AxisId == axis.AxisCode && s.Score is not null)))
                    {
                        return Results.Problem(statusCode: 400, detail: "axis-score-missing");
                    }
                    foreach (var axis in axes)
                    {
                        var score = (entry.AxisScores ?? []).First(s => s.AxisId == axis.AxisCode);
                        // A model with a defined scale accepts only its levels
                        // (the approved model: 1–5); one without keeps 0..max.
                        var outOfScale = levels.Count > 0
                            ? !levels.Any(level => level.Score == score.Score)
                            : score.Score is < 0 || score.Score > axis.MaxScore;
                        if (outOfScale)
                        {
                            return Results.Problem(statusCode: 400, detail: "axis-score-missing");
                        }
                        db.InterviewAxisScores.Add(new InterviewAxisScore
                        {
                            AxisScoreId = Guid.NewGuid(),
                            InterviewEvaluationId = assignment.InterviewEvaluationId,
                            AxisId = axis.AxisId,
                            Service = service,
                            Score = score.Score!.Value,
                        });
                    }
                }
                assignment.Recommendations = JsonSerializer.Serialize(
                    services.Where(s => s.Service is not null)
                        .ToDictionary(s => s.Service!, s => s.Recommendation));
                assignment.Note = string.Join(
                    "\n", services.Select(s => s.Notes).Where(n => !string.IsNullOrWhiteSpace(n)));
                assignment.SubmittedAt = now;
            }

            // BR-0220's other half: once the LAST member responds, the
            // consolidated result exists and the stage completes.
            var pending = await db.InterviewEvaluations.CountAsync(
                e => e.InterviewId == interviewRow.InterviewId
                    && e.InterviewEvaluationId != assignment.InterviewEvaluationId
                    && e.SubmittedAt == null, ct);
            if (pending == 0)
            {
                interviewRow.Status = InterviewStatuses.Completed;
                application.Status = ApplicationStatuses.InterviewCompleted;
                application.UpdatedAt = now;
            }
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, interviewRow, actor.UserId, ct));
        }).WithName("SubmitInterviewEvaluation")
            .RequireFeature("F-0203");

        interview.MapPost("/decision", async (
            string id,
            PostInterviewDecisionInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var loaded = await LoadAsync(id, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No interview exists for this application.");
            }
            var (application, interviewRow) = loaded.Value;
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (!await IsScreeningDeciderAsync(db, application.ApplicationId, actor.UserId, ct))
            {
                // BR-0208 — only the screening decision-maker, by identity.
                return Results.Problem(statusCode: 403, detail: "Only the screening decision-maker may decide.");
            }
            if (interviewRow.DecisionKind is not null)
            {
                return Results.Problem(statusCode: 409, detail: "Already decided.");
            }
            if (interviewRow.Status != InterviewStatuses.Completed)
            {
                // F2/AC-1 — the decision follows the consolidated result.
                return Results.Problem(statusCode: 409, detail: "The consolidated result does not exist yet.");
            }
            var now = DateTime.UtcNow;

            if (string.Equals(input.Kind, "forward", StringComparison.Ordinal))
            {
                /*
                 * The 70% pass mark (business decision, 2026-09-16): only a
                 * service that passed proceeds to the approval committee
                 * (J-09), which still decides — passing approves nothing. A
                 * service that did not pass stops here; if none passed there
                 * is nothing to forward and only rejection remains. A model
                 * without a pass mark (the draft model) gates nothing.
                 */
                var results = await ServiceResultsAsync(db, application.ApplicationId, interviewRow, ct) ?? [];
                var notPassed = results.Where(r => r.Passed == false).Select(r => r.Service).ToList();
                // Eligible for the committee = passed the interview + exempted
                // from it (J-08). Services are evaluated independently: only
                // when NOTHING remains eligible is forwarding impossible.
                var exempted = await ExemptedServicesAsync(db, application.ApplicationId, ct);
                if (results.Count > 0 && notPassed.Count == results.Count && exempted.Count == 0)
                {
                    return Results.Problem(statusCode: 409, detail: "no-service-passed");
                }
                interviewRow.DecisionKind = "forward";
                application.Status = ApplicationStatuses.ApprovalInProgress;
                var stopped = await db.ApplicationServices
                    .Where(s => s.ApplicationId == application.ApplicationId
                        && notPassed.Contains(s.Service)
                        && s.Outcome == ServiceOutcomes.Pending)
                    .ToListAsync(ct);
                foreach (var row in stopped)
                {
                    row.Outcome = ServiceOutcomes.Rejected;
                    row.DecidedAt = now;
                }
            }
            else if (string.Equals(input.Kind, "reject", StringComparison.Ordinal))
            {
                var reason = ServiceRequestRejectionReasons.All
                    .FirstOrDefault(r => r.Id == input.Reason);
                if (reason is null
                    || (reason.RequiresText && string.IsNullOrWhiteSpace(input.ReasonOther)))
                {
                    return Results.Problem(statusCode: 400, detail: "reason-missing");
                }
                interviewRow.DecisionKind = "reject";
                interviewRow.DecisionReasonId = reason.Id;
                interviewRow.DecisionReasonText = input.ReasonOther;
                application.Status = ApplicationStatuses.Rejected;
                application.RejectionReason = reason.RequiresText ? input.ReasonOther : reason.LabelAr;
                var serviceRows = await db.ApplicationServices
                    .Where(s => s.ApplicationId == application.ApplicationId)
                    .ToListAsync(ct);
                foreach (var row in serviceRows.Where(r => r.Outcome == ServiceOutcomes.Pending))
                {
                    row.Outcome = ServiceOutcomes.Rejected;
                    row.DecidedAt = now;
                }
            }
            else
            {
                return Results.Problem(statusCode: 400, detail: "Unknown decision.");
            }

            interviewRow.DecidedBy = actor.UserId;
            interviewRow.DecidedAt = now;
            application.UpdatedAt = now;
            await db.SaveChangesAsync(ct);

            var decider = await db.Users.SingleAsync(u => u.UserId == actor.UserId, ct);
            return Results.Ok(new PostInterviewDecisionWire(
                interviewRow.DecisionKind!,
                ApplicationEndpoints.Iso(now),
                decider.FullNameAr,
                interviewRow.DecisionReasonId));
        }).WithName("PostInterviewDecision")
            .RequireFeature("F-0203");

        interview.MapPost("/reschedule", async (
            string id,
            StaffRescheduleInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            CancellationToken ct) =>
        {
            var loaded = await LoadAsync(id, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No interview exists for this application.");
            }
            var (application, interviewRow) = loaded.Value;
            if (interviewRow.Status == InterviewStatuses.Completed)
            {
                return Results.Problem(statusCode: 409, detail: "The interview is already behind them.");
            }
            var slots = (input.Slots ?? []).Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
            if (slots.Count == 0)
            {
                // J-06/F4 — a reschedule must propose at least one usable slot.
                return Results.Problem(statusCode: 400, detail: "slots-missing");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;
            var proposed = new List<DateTime>();
            foreach (var slot in slots)
            {
                if (!DateTime.TryParse(slot, System.Globalization.CultureInfo.InvariantCulture,
                        System.Globalization.DateTimeStyles.RoundtripKind, out var parsed))
                {
                    // A malformed time is the caller's mistake (400), not a 500.
                    return Results.Problem(statusCode: 400, detail: "slot-invalid");
                }
                if (parsed.ToUniversalTime() <= now)
                {
                    // Nobody can attend an interview in the past.
                    return Results.Problem(statusCode: 400, detail: "slot-in-past");
                }
                proposed.Add(parsed);
            }

            var oldSlots = await db.InterviewSlots
                .Where(s => s.InterviewId == interviewRow.InterviewId && !s.IsSuperseded)
                .ToListAsync(ct);
            foreach (var slot in oldSlots)
            {
                slot.IsSuperseded = true;
            }
            foreach (var startsAt in proposed.Distinct())
            {
                db.InterviewSlots.Add(new InterviewSlot
                {
                    SlotId = Guid.NewGuid(),
                    InterviewId = interviewRow.InterviewId,
                    StartsAt = startsAt,
                });
            }
            // F4/AC-4+AC-6 — selection repeats; the SAME ticket is retained.
            interviewRow.ConfirmedSlotId = null;
            interviewRow.Status = InterviewStatuses.AwaitingSelection;
            interviewRow.RescheduleRequestedAt = null;
            interviewRow.RescheduleNote = null;
            interviewRow.RescheduleCount += 1;
            application.Status = ApplicationStatuses.UnderReview;
            application.UpdatedAt = now;

            // New slots are, once again, slots available (J-06/F1/AC-1).
            await dispatcher.RaiseAsync(
                "EV-0201",
                new NotificationEventContext(
                    SourceEntityId: application.ApplicationId,
                    RecordSubjectUserId: application.ApplicantUserId,
                    ActingStaffUserId: actor.UserId),
                new Dictionary<string, string>
                {
                    ["referenceNumber"] = application.Reference ?? string.Empty,
                },
                ct);
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, interviewRow, actor.UserId, ct));
        }).WithName("StaffReschedule")
            .RequireFeature("F-0202");

        return v1;
    }

    /* ── shared assembly ───────────────────────────────────────────────────── */

    private static async Task<(Application Application, Interview Interview)?> LoadAsync(
        string id, ExpertHubDbContext db, CancellationToken ct)
    {
        if (!Guid.TryParse(id, out var applicationId))
        {
            return null;
        }
        var application = await db.Applications.FirstOrDefaultAsync(
            a => a.ApplicationId == applicationId, ct);
        if (application is null)
        {
            return null;
        }
        var interview = await db.Interviews.FirstOrDefaultAsync(
            i => i.ApplicationId == applicationId, ct);
        return interview is null ? null : (application, interview);
    }

    /// <summary>The application's services exempted from interview and still
    /// undecided — eligible for the committee without an interview result.</summary>
    internal static async Task<IReadOnlyList<string>> ExemptedServicesAsync(
        ExpertHubDbContext db, Guid applicationId, CancellationToken ct) =>
        await (
            from result in db.ScreeningResults
            join service in db.ApplicationServices
                on result.ApplicationServiceId equals service.ApplicationServiceId
            where service.ApplicationId == applicationId
                && result.Decision == "exempt_interview"
                && service.Outcome == ServiceOutcomes.Pending
            select service.Service).ToListAsync(ct);

    internal static async Task<IReadOnlyList<string>> AcceptedServicesAsync(
        ExpertHubDbContext db, Guid applicationId, CancellationToken ct) =>
        await (
            from result in db.ScreeningResults
            join service in db.ApplicationServices
                on result.ApplicationServiceId equals service.ApplicationServiceId
            where service.ApplicationId == applicationId && result.Decision == "accept"
            select service.Service).ToListAsync(ct);

    /// <summary>
    /// The model an interview is read through. Every service's model of one
    /// version shares one criteria set, so the first accepted service's model is
    /// the page's model (the wire carries ONE model). An interview pinned to a
    /// version keeps that version even after a newer one is activated; only an
    /// unpinned interview falls back to the active model.
    /// </summary>
    private static async Task<(InterviewModel Model, IReadOnlyList<InterviewAxis> Axes)> ModelForAsync(
        ExpertHubDbContext db, IReadOnlyList<string> acceptedServices, string? pinnedVersion,
        CancellationToken ct)
    {
        var service = acceptedServices.Count > 0 ? acceptedServices[0] : ApplicationServices.Trainer;
        var model = pinnedVersion is null
            ? null
            : await db.InterviewModels.FirstOrDefaultAsync(
                m => m.Service == service && m.Version == pinnedVersion, ct)
                ?? await db.InterviewModels.FirstOrDefaultAsync(m => m.Version == pinnedVersion, ct);
        model ??= await ActiveModelAsync(db, service, ct);
        var axes = await db.InterviewAxes
            .Where(a => a.InterviewModelId == model.InterviewModelId)
            .OrderBy(a => a.OrderIndex)
            .ToListAsync(ct);
        return (model, axes);
    }

    /// <summary>The service's active model — what a NEW interview is created under.</summary>
    internal static Task<InterviewModel> ActiveModelAsync(
        ExpertHubDbContext db, string service, CancellationToken ct) =>
        db.InterviewModels.FirstAsync(m => m.Service == service && m.IsActive, ct);

    /// <summary>The top of a service total for this application's interview —
    /// its pinned model's scale, or the active model's when none exists yet.</summary>
    internal static async Task<decimal> ResultMaxScoreAsync(
        ExpertHubDbContext db, Guid applicationId, Interview? interviewRow, CancellationToken ct)
    {
        var acceptedServices = await AcceptedServicesAsync(db, applicationId, ct);
        var (model, _) = await ModelForAsync(db, acceptedServices, interviewRow?.ModelVersion, ct);
        return model.ResultMaxScore;
    }

    private static readonly JsonSerializerOptions RatingScaleJson = new(JsonSerializerDefaults.Web);

    private static List<RatingLevelDefinition> RatingLevels(InterviewModel model) =>
        string.IsNullOrWhiteSpace(model.RatingScale)
            ? []
            : JsonSerializer.Deserialize<List<RatingLevelDefinition>>(model.RatingScale, RatingScaleJson) ?? [];

    /// <summary>
    /// One member's total for one service: each criterion contributes
    /// (score ÷ its max) × weight, scaled to the model's result maximum. On the
    /// approved model that is the J-07 formula — (rating ÷ 5) × weight, a
    /// percentage; on the draft model (max 5) it is the draft's own Σ score ×
    /// weight ÷ 100, unchanged.
    /// </summary>
    internal static decimal ServiceTotal(
        InterviewModel model, IReadOnlyList<InterviewAxis> axes, IEnumerable<InterviewAxisScore> scores) =>
        scores.Sum(s =>
        {
            var axis = axes.First(a => a.AxisId == s.AxisId);
            return s.Score / axis.MaxScore * axis.Weight / 100m * model.ResultMaxScore;
        });

    internal static async Task<bool> IsScreeningDeciderAsync(
        ExpertHubDbContext db, Guid applicationId, Guid userId, CancellationToken ct) =>
        await (
            from result in db.ScreeningResults
            join service in db.ApplicationServices
                on result.ApplicationServiceId equals service.ApplicationServiceId
            where service.ApplicationId == applicationId && result.DecidedBy == userId
            select result).AnyAsync(ct);

    /// <summary>
    /// The consolidated result per accepted service, or null until every
    /// assigned member has responded (F2/AC-1).
    /// </summary>
    internal static async Task<IReadOnlyList<ServiceResultWire>?> ServiceResultsAsync(
        ExpertHubDbContext db, Guid applicationId, Interview interviewRow, CancellationToken ct)
    {
        var evaluations = await db.InterviewEvaluations
            .Where(e => e.InterviewId == interviewRow.InterviewId)
            .ToListAsync(ct);
        if (evaluations.Count == 0 || evaluations.Any(e => e.SubmittedAt == null))
        {
            return null;
        }
        var acceptedServices = await AcceptedServicesAsync(db, applicationId, ct);
        var (model, axes) = await ModelForAsync(db, acceptedServices, interviewRow.ModelVersion, ct);
        var counted = evaluations.Where(e => !e.DidNotAttend).ToList();
        var scores = await db.InterviewAxisScores
            .Where(s => counted.Select(e => e.InterviewEvaluationId).Contains(s.InterviewEvaluationId))
            .ToListAsync(ct);
        return [.. acceptedServices.Select(service =>
        {
            // Weighted total per evaluation (0..the model's result max),
            // averaged over the ATTENDED evaluations only (F2/AC-2).
            var totals = counted
                .Select(evaluation => ServiceTotal(model, axes, scores
                    .Where(s => s.InterviewEvaluationId == evaluation.InterviewEvaluationId
                        && s.Service == service)))
                .ToList();
            var average = totals.Count == 0 ? 0m : Math.Round(totals.Average(), 2);
            return new ServiceResultWire(
                service,
                average,
                model.ResultMaxScore,
                totals.Count,
                evaluations.Count(e => e.DidNotAttend),
                model.PassThreshold,
                model.PassThreshold is { } threshold ? average >= threshold : null);
        })];
    }

    internal static async Task<InterviewDetailWire> BuildDetailAsync(
        ExpertHubDbContext db,
        Application application,
        Interview interviewRow,
        Guid viewerUserId,
        CancellationToken ct)
    {
        var applicant = await db.Users.SingleAsync(u => u.UserId == application.ApplicantUserId, ct);
        var acceptedServices = await AcceptedServicesAsync(db, application.ApplicationId, ct);
        var (model, axes) = await ModelForAsync(db, acceptedServices, interviewRow.ModelVersion, ct);
        var evaluations = await db.InterviewEvaluations
            .Where(e => e.InterviewId == interviewRow.InterviewId)
            .ToListAsync(ct);
        var members = await db.Users
            .Where(u => evaluations.Select(e => e.EvaluatorUserId).Contains(u.UserId))
            .ToListAsync(ct);
        var confirmed = interviewRow.ConfirmedSlotId is { } slotId
            ? await db.InterviewSlots.FirstOrDefaultAsync(s => s.SlotId == slotId, ct)
            : null;
        var firstSlot = confirmed ?? await db.InterviewSlots
            .Where(s => s.InterviewId == interviewRow.InterviewId && !s.IsSuperseded)
            .OrderBy(s => s.StartsAt)
            .FirstOrDefaultAsync(ct);

        var result = await ServiceResultsAsync(db, application.ApplicationId, interviewRow, ct);

        var mine = evaluations.FirstOrDefault(e => e.EvaluatorUserId == viewerUserId);
        var isDecider = await IsScreeningDeciderAsync(db, application.ApplicationId, viewerUserId, ct);
        PostInterviewDecisionWire? decision = null;
        if (interviewRow.DecisionKind is not null)
        {
            var decider = await db.Users.SingleAsync(u => u.UserId == interviewRow.DecidedBy, ct);
            decision = new PostInterviewDecisionWire(
                interviewRow.DecisionKind,
                ApplicationEndpoints.Iso(interviewRow.DecidedAt ?? interviewRow.CreatedAt),
                decider.FullNameAr,
                interviewRow.DecisionReasonId);
        }

        var titles = await (
            from userRole in db.UserRoles
            join role in db.Roles on userRole.RoleId equals role.RoleId
            select new { userRole.UserId, role.NameAr, role.NameEn }).ToListAsync(ct);

        return new InterviewDetailWire(
            application.ApplicationId.ToString(),
            application.Reference ?? string.Empty,
            applicant.FullNameAr,
            acceptedServices,
            new TicketWire(
                interviewRow.TicketNumber ?? string.Empty,
                firstSlot is null ? string.Empty : ApplicationEndpoints.Iso(firstSlot.StartsAt),
                interviewRow.MeetingUrl,
                interviewRow.RescheduleCount),
            new ModelWire(
                model.Version,
                [.. axes.Select(a => new AxisWire(
                    a.AxisCode,
                    new LocalizedTextWire(a.LabelAr, a.LabelEn),
                    a.DescriptionAr is null
                        ? null
                        : new LocalizedTextWire(a.DescriptionAr, a.DescriptionEn ?? a.DescriptionAr),
                    a.Weight, a.MaxScore))],
                RatingLevels(model) is { Count: > 0 } levels
                    ? [.. levels.Select(l => new RatingLevelWire(l.Score, new LocalizedTextWire(l.LabelAr, l.LabelEn)))]
                    : null),
            [.. evaluations.Select(e =>
            {
                var member = members.First(m => m.UserId == e.EvaluatorUserId);
                var title = titles.FirstOrDefault(t => t.UserId == member.UserId);
                return new MemberResponseWire(
                    member.UserId.ToString(),
                    member.FullNameAr,
                    new LocalizedTextWire(title?.NameAr ?? "موظف", title?.NameEn ?? "Staff"),
                    e.SubmittedAt is null ? "pending" : e.DidNotAttend ? "did-not-attend" : "submitted",
                    e.SubmittedAt is { } at ? ApplicationEndpoints.Iso(at) : null);
            })],
            result,
            new InterviewViewerWire(
                mine?.EvaluatorUserId.ToString(),
                CanEvaluate: mine is not null && mine.SubmittedAt is null
                    && interviewRow.Status == InterviewStatuses.Scheduled,
                CanDecide: isDecider && interviewRow.DecisionKind is null
                    && interviewRow.Status == InterviewStatuses.Completed,
                CanReschedule: interviewRow.Status != InterviewStatuses.Completed
                    && interviewRow.DecisionKind is null),
            decision,
            await ExemptedServicesAsync(db, application.ApplicationId, ct),
            interviewRow.RescheduleRequestedAt is { } requestedAt
                ? new RescheduleRequestWire(ApplicationEndpoints.Iso(requestedAt), interviewRow.RescheduleNote)
                : null);
    }
}
