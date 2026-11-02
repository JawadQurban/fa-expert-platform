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
 * - `P-384` (UAT BUG-027): ONE interview per application — one slot set, one
 *   pick, one meeting, one committee — covering the services listed in
 *   `INTERVIEW_SERVICE`. Each member scores each covered service, and the
 *   post-interview decision is taken PER SERVICE (forward or reject, with its
 *   reason). A service exempted at screening has no row and is never decided here.
 */

/// <remarks><c>ScheduledAt</c> is the CONFIRMED time only — null while the
/// applicant has not chosen (RUN-021: the first proposal used to be served here,
/// so a reschedule looked fixed before anybody had picked it).
/// <c>ProposedSlots</c> are the open proposals, shown as entered.</remarks>
internal sealed record TicketWire(
    string Number, string? ScheduledAt, string? MeetingUrl, int RescheduleCount,
    IReadOnlyList<string> ProposedSlots);

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

/// <remarks><c>CanReject</c> — J-07/F3/AC-4: after a reschedule for a full
/// committee no-show, rejection stays available while forwarding does not.
/// <c>FullNoShow</c> — every member marked «did not attend» (AC-3).
/// <c>EvaluationBlockedReason</c> says WHY <c>CanEvaluate</c> is false
/// (RUN-002: the page read every false as «not a member», so a member who had
/// already evaluated, or whose interview was awaiting a new time, was told they
/// did not belong to the panel). Null when the viewer can evaluate.</remarks>
internal sealed record InterviewViewerWire(
    string? MemberId, bool CanEvaluate, bool CanDecide, bool CanReschedule,
    bool CanReject = false, bool FullNoShow = false, string? EvaluationBlockedReason = null);

/// <summary>`P-384` — the post-interview decision for ONE covered service.</summary>
internal sealed record ServiceDecisionWire(
    string Service, string Kind, string? RejectionReason, string? RejectionReasonText);

/// <remarks><c>Kind</c> is the application's outcome — `forward` when anything
/// goes on to the approval committee, `reject` when nothing does; the decision
/// itself is <c>Services</c>, one per covered service (`P-384`).</remarks>
internal sealed record PostInterviewDecisionWire(
    string Kind, string DecidedAt, string DecidedByName, string? RejectionReason,
    IReadOnlyList<ServiceDecisionWire> Services);

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
    RescheduleRequestWire? RescheduleRequest = null,
    string Status = InterviewPhases.AwaitingSelection);

/// <summary>
/// The interview's state as a person reads it — DERIVED from the stored status
/// and the clock, so «ended» needs no background job (BUG-032).
/// </summary>
internal static class InterviewPhases
{
    public const string AwaitingSelection = "awaiting-selection";
    public const string Scheduled = "scheduled";
    public const string InProgress = "in-progress";
    public const string Ended = "ended";
    public const string Completed = "completed";
}

internal sealed record AxisScoreInputWire(string? AxisId, decimal? Score);

internal sealed record ServiceEvaluationInputWire(
    string? Service, IReadOnlyList<AxisScoreInputWire>? AxisScores,
    string? Recommendation, string? Notes);

internal sealed record EvaluationInputWire(
    string? Kind, IReadOnlyList<ServiceEvaluationInputWire>? Services);

internal sealed record ServiceDecisionInputWire(
    string? Service, string? Kind, string? Reason, string? ReasonOther);

/// <remarks>`P-384` — <c>Services</c> carries one decision per covered service.
/// Without it, the pre-P-384 shape (<c>Kind</c>/<c>Reason</c> for the whole
/// interview) is applied to every covered service alike.</remarks>
internal sealed record PostInterviewDecisionInputWire(
    string? Kind, string? Reason, string? ReasonOther,
    IReadOnlyList<ServiceDecisionInputWire>? Services = null);

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
            string id, HttpContext http, ExpertHubDbContext db, IConfiguration configuration,
            CancellationToken ct) =>
        {
            var loaded = await LoadAsync(id, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No interview exists for this application.");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            return Results.Ok(await BuildDetailAsync(db, loaded.Value.Application, loaded.Value.Interview, actor.UserId, ct, InterviewMeeting.Length(configuration)));
        }).WithName("InterviewDetail")
            .RequireFeature("F-0203");

        interview.MapPost("/evaluations", async (
            string id,
            EvaluationInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            IConfiguration configuration,
            NotificationDispatcher dispatcher,
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
            if (assignment.SubmittedAt is not null || interviewRow.DecisionKind is not null)
            {
                // A decided interview (J-07/F3/AC-4 can decide one that is still
                // scheduled) takes no further responses.
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
            if (await ConfirmedStartAsync(db, interviewRow, ct) is not { } startsAt || startsAt > now)
            {
                // RUN-036 / BUG-030 — an evaluation records what happened in
                // the room, so it opens when the interview starts, not before.
                return Results.Problem(statusCode: 409, detail: "interview-not-started");
            }

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
                var coveredServices = await CoveredServicesAsync(db, interviewRow.InterviewId, ct);
                var (model, axes) = await ModelForAsync(db, coveredServices, interviewRow.ModelVersion, ct);
                var levels = RatingLevels(model);
                var services = input.Services ?? [];
                // F1 — every axis of every service the interview covers (P-384:
                // one interview, scored per service); nothing partial is
                // storable. The recommendation is optional (business decision,
                // 2026-09-16) and stored as given.
                foreach (var service in coveredServices)
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
                    services.Where(s => s.Service is not null && coveredServices.Contains(s.Service))
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

                // P-372 E-072 — the result is ready; the decision-maker is asked to decide.
                await dispatcher.RaiseAsync(
                    "EV-0217",
                    new NotificationEventContext(
                        SourceEntityId: application.ApplicationId,
                        RecordSubjectUserId: application.ApplicantUserId,
                        ActingStaffUserId: await ScreeningDeciderAsync(db, application.ApplicationId, ct)),
                    new Dictionary<string, string> { ["referenceNumber"] = application.Reference ?? string.Empty },
                    ct);
            }
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, interviewRow, actor.UserId, ct, InterviewMeeting.Length(configuration)));
        }).WithName("SubmitInterviewEvaluation")
            .RequireFeature("F-0203");

        interview.MapPost("/decision", async (
            string id,
            PostInterviewDecisionInputWire input,
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
            var covered = await db.InterviewServices
                .Where(s => s.InterviewId == interviewRow.InterviewId)
                .ToListAsync(ct);
            var (decisions, inputError) = ResolveServiceDecisions(input, covered);
            if (inputError is not null)
            {
                return Results.Problem(statusCode: 400, detail: inputError);
            }
            // J-07/F3/AC-4 — after a reschedule for a full committee no-show,
            // rejection stays available at any point; forwarding still needs
            // the consolidated result of an interview that actually happened.
            var allRejected = decisions.All(d => d.Kind == InterviewServiceDecisions.Reject);
            var rejectAnyTime = interviewRow.NoShowRescheduleCount > 0 && allRejected;
            if (interviewRow.Status != InterviewStatuses.Completed && !rejectAnyTime)
            {
                // F2/AC-1 — the decision follows the consolidated result.
                return Results.Problem(statusCode: 409, detail: "The consolidated result does not exist yet.");
            }
            var now = DateTime.UtcNow;

            /*
             * P-355 (BUG-033): the pass mark is advisory — forwarding is always
             * the decision-maker's choice, and so is rejecting. P-384 (BUG-027):
             * that choice is made PER SERVICE. The application goes on to the
             * approval committee when anything is left for it — a forwarded
             * service, or one exempted from the interview at screening (J-08)
             * — and is rejected when nothing is.
             */
            var exempted = await ExemptedServicesAsync(db, application.ApplicationId, ct);
            var forwardsAnything = !allRejected || exempted.Count > 0;
            var firstRejection = decisions.FirstOrDefault(d => d.Kind == InterviewServiceDecisions.Reject);

            // Claim the decision: a double-click is one decision (backend/AGENTS.md).
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            var claimed = await db.Interviews
                .Where(i => i.InterviewId == interviewRow.InterviewId && i.DecisionKind == null)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(i => i.DecisionKind, forwardsAnything
                        ? InterviewServiceDecisions.Forward
                        : InterviewServiceDecisions.Reject), ct);
            if (claimed == 0)
            {
                return Results.Problem(statusCode: 409, detail: "Already decided.");
            }
            interviewRow.DecisionKind = forwardsAnything
                ? InterviewServiceDecisions.Forward
                : InterviewServiceDecisions.Reject;
            interviewRow.DecisionReasonId = forwardsAnything ? null : firstRejection?.Reason?.Id;
            interviewRow.DecisionReasonText = forwardsAnything ? null : firstRejection?.ReasonOther;
            interviewRow.DecidedBy = actor.UserId;
            interviewRow.DecidedAt = now;

            var serviceRows = await db.ApplicationServices
                .Where(s => s.ApplicationId == application.ApplicationId)
                .ToListAsync(ct);
            foreach (var decision in decisions)
            {
                decision.Row.DecisionKind = decision.Kind;
                decision.Row.DecisionReasonId = decision.Reason?.Id;
                decision.Row.DecisionReasonText = decision.Reason is null ? null : decision.ReasonOther;
                decision.Row.DecidedBy = actor.UserId;
                decision.Row.DecidedAt = now;
                if (decision.Kind == InterviewServiceDecisions.Reject
                    && serviceRows.FirstOrDefault(r => r.Service == decision.Row.Service) is { } serviceRow
                    && serviceRow.Outcome == ServiceOutcomes.Pending)
                {
                    // The service is closed as not accepted; the others wait
                    // for the approval committee, which never sees this one.
                    serviceRow.Outcome = ServiceOutcomes.Rejected;
                    serviceRow.DecidedAt = now;
                }
            }

            if (forwardsAnything)
            {
                application.Status = ApplicationStatuses.ApprovalInProgress;
                var rejected = decisions
                    .Where(d => d.Kind == InterviewServiceDecisions.Reject)
                    .Select(d => d.Row.Service)
                    .ToList();
                if (rejected.Count > 0)
                {
                    // `P-389` — the application goes on, but the applicant hears
                    // which services it goes on without.
                    await dispatcher.RaiseAsync(
                        "EV-0218",
                        new NotificationEventContext(
                            SourceEntityId: application.ApplicationId,
                            RecordSubjectUserId: application.ApplicantUserId,
                            ActingStaffUserId: actor.UserId),
                        new Dictionary<string, string>
                        {
                            ["referenceNumber"] = application.Reference ?? string.Empty,
                            ["serviceList"] = string.Join("، ", rejected.Select(ApplicationServices.NameAr)),
                            ["serviceList" + NotificationDispatcher.EnglishSuffix] =
                                string.Join(", ", rejected.Select(ApplicationServices.NameEn)),
                        },
                        ct);
                }
            }
            else
            {
                application.Status = ApplicationStatuses.Rejected;
                application.RejectionReason = string.Join("؛ ", decisions
                    .Select(d => d.Reason!.RequiresText ? d.ReasonOther : d.Reason.LabelAr)
                    .Where(text => !string.IsNullOrWhiteSpace(text))
                    .Distinct(StringComparer.Ordinal));
                // P-372 E-019 — the applicant hears the post-interview rejection.
                await dispatcher.RaiseAsync(
                    "EV-0210",
                    new NotificationEventContext(
                        SourceEntityId: application.ApplicationId,
                        RecordSubjectUserId: application.ApplicantUserId,
                        ActingStaffUserId: actor.UserId),
                    new Dictionary<string, string>
                    {
                        ["referenceNumber"] = application.Reference ?? string.Empty,
                        ["reasonText"] = application.RejectionReason ?? string.Empty,
                    },
                    ct);
            }
            application.UpdatedAt = now;
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return Results.Ok(await DecisionWireAsync(db, interviewRow, ct));
        }).WithName("PostInterviewDecision")
            .RequireFeature("F-0203");

        interview.MapPost("/reschedule", async (
            string id,
            StaffRescheduleInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            IConfiguration configuration,
            CancellationToken ct) =>
        {
            var loaded = await LoadAsync(id, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No interview exists for this application.");
            }
            var (application, interviewRow) = loaded.Value;
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            /*
             * J-07/F3/AC-3 — a completed interview is behind them, EXCEPT when
             * every assigned member marked «did not attend»: then the
             * decision-maker may reschedule instead of rejecting, with no limit
             * on how often. It stays their call (`BR-0208`).
             */
            var noShowReschedule = interviewRow.Status == InterviewStatuses.Completed;
            if (noShowReschedule)
            {
                if (interviewRow.DecisionKind is not null
                    || !await IsFullNoShowAsync(db, interviewRow.InterviewId, ct))
                {
                    return Results.Problem(statusCode: 409, detail: "The interview is already behind them.");
                }
                if (!await IsScreeningDeciderAsync(db, application.ApplicationId, actor.UserId, ct))
                {
                    return Results.Problem(statusCode: 403, detail: "Only the screening decision-maker may reschedule after a no-show.");
                }
            }
            var slots = (input.Slots ?? []).Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
            if (slots.Count == 0)
            {
                // J-06/F4 — a reschedule must propose at least one usable slot.
                return Results.Problem(statusCode: 400, detail: "slots-missing");
            }
            var now = DateTime.UtcNow;
            // A malformed time, a past one, or one inside the next hour
            // (BUG-056) is the caller's mistake: 400, with the rule's code.
            var (proposed, slotError) = InterviewSlotRules.Check(slots, now);
            if (slotError is not null)
            {
                return Results.Problem(statusCode: 400, detail: slotError);
            }

            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            if (noShowReschedule)
            {
                // Claim the transition: a double-click, or a decision racing
                // it, must not reschedule a decided or already-reopened interview.
                var claimed = await db.Interviews
                    .Where(i => i.InterviewId == interviewRow.InterviewId
                        && i.Status == InterviewStatuses.Completed
                        && i.DecisionKind == null)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(i => i.Status, InterviewStatuses.AwaitingSelection)
                        .SetProperty(i => i.NoShowRescheduleCount, i => i.NoShowRescheduleCount + 1), ct);
                if (claimed == 0)
                {
                    return Results.Problem(statusCode: 409, detail: "The interview is already behind them.");
                }
                interviewRow.NoShowRescheduleCount += 1;
                // The same members evaluate the new interview from scratch.
                var responses = await db.InterviewEvaluations
                    .Where(e => e.InterviewId == interviewRow.InterviewId)
                    .ToListAsync(ct);
                foreach (var response in responses)
                {
                    response.DidNotAttend = false;
                    response.SubmittedAt = null;
                    response.Recommendations = null;
                    response.Note = null;
                }
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
            // RUN-022 — still an interview stage; the applicant only picks a
            // new time. Dropping back to «قيد المراجعة» told them otherwise.
            application.Status = ApplicationStatuses.InterviewScheduled;
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
            await transaction.CommitAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, interviewRow, actor.UserId, ct, InterviewMeeting.Length(configuration)));
        }).WithName("StaffReschedule")
            .RequireFeature("F-0202");

        return v1;
    }

    /* ── shared assembly ───────────────────────────────────────────────────── */

    private static async Task<DateTime?> ConfirmedStartAsync(
        ExpertHubDbContext db, Interview interviewRow, CancellationToken ct) =>
        interviewRow.ConfirmedSlotId is { } slotId
            ? await db.InterviewSlots.Where(s => s.SlotId == slotId)
                .Select(s => (DateTime?)s.StartsAt).FirstOrDefaultAsync(ct)
            : null;

    /// <summary>The derived phase — the stored status plus the clock.</summary>
    internal static string PhaseOf(
        Interview interviewRow, DateTime? confirmedStart, TimeSpan length, DateTime now) =>
        interviewRow.Status == InterviewStatuses.Completed ? InterviewPhases.Completed
        : interviewRow.Status != InterviewStatuses.Scheduled || confirmedStart is not { } start
            ? InterviewPhases.AwaitingSelection
        : now < start ? InterviewPhases.Scheduled
        : now < start + length ? InterviewPhases.InProgress
        : InterviewPhases.Ended;

    /// <summary>
    /// The phase as the APPLICANT reads it. The same as <see cref="PhaseOf"/>,
    /// plus one case only the applicant has: they never picked, asked for no
    /// other time, and every proposed time has gone (BUG-052). That interview
    /// is over for them — asking them to confirm a time in the past was the
    /// defect. Staff keep <see cref="PhaseOf"/>: for them the stored status
    /// still decides what may be evaluated.
    /// </summary>
    /// <param name="interviewRow">The interview.</param>
    /// <param name="openSlots">Its proposals that are not superseded.</param>
    /// <param name="length">How long an interview lasts.</param>
    /// <param name="now">The current instant, in UTC.</param>
    /// <returns>One of <see cref="InterviewPhases"/>.</returns>
    internal static string ApplicantPhaseOf(
        Interview interviewRow, IReadOnlyCollection<InterviewSlot> openSlots, TimeSpan length, DateTime now)
    {
        ArgumentNullException.ThrowIfNull(interviewRow);
        ArgumentNullException.ThrowIfNull(openSlots);
        var confirmedStart = openSlots
            .Where(s => s.SlotId == interviewRow.ConfirmedSlotId)
            .Select(s => (DateTime?)s.StartsAt)
            .FirstOrDefault();
        var phase = PhaseOf(interviewRow, confirmedStart, length, now);
        var lapsedUnpicked = phase == InterviewPhases.AwaitingSelection
            && interviewRow.RescheduleRequestedAt is null
            && openSlots.Count > 0
            && openSlots.All(s => s.StartsAt <= now);
        return lapsedUnpicked ? InterviewPhases.Ended : phase;
    }

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

    /// <summary>One covered service's decision, validated.</summary>
    private sealed record ResolvedServiceDecision(
        InterviewServiceEntry Row, string Kind, ServiceRequestRejectionReason? Reason, string? ReasonOther);

    /// <summary>
    /// Reads the decision input as one decision per covered service (`P-384`),
    /// or — the pre-P-384 shape — one decision applied to every covered service.
    /// Every covered service must be decided, once; a rejection carries a reason
    /// from the unified list (`BR-0219`).
    /// </summary>
    private static (IReadOnlyList<ResolvedServiceDecision> Decisions, string? Error) ResolveServiceDecisions(
        PostInterviewDecisionInputWire input, List<InterviewServiceEntry> covered)
    {
        if (covered.Count == 0)
        {
            return ([], "No service is covered by this interview.");
        }
        var requested = input.Services
            ?? [.. covered.Select(row => new ServiceDecisionInputWire(
                row.Service, input.Kind, input.Reason, input.ReasonOther))];
        if (requested.Any(d => d.Service is null || covered.All(row => row.Service != d.Service))
            || requested.GroupBy(d => d.Service).Any(group => group.Count() > 1))
        {
            return ([], "Unknown service.");
        }
        var resolved = new List<ResolvedServiceDecision>();
        foreach (var row in covered)
        {
            var entry = requested.FirstOrDefault(d => d.Service == row.Service);
            if (entry is null)
            {
                return ([], "service-decision-missing");
            }
            if (string.Equals(entry.Kind, InterviewServiceDecisions.Forward, StringComparison.Ordinal))
            {
                resolved.Add(new ResolvedServiceDecision(row, InterviewServiceDecisions.Forward, null, null));
                continue;
            }
            if (!string.Equals(entry.Kind, InterviewServiceDecisions.Reject, StringComparison.Ordinal))
            {
                return ([], "Unknown decision.");
            }
            var reason = ServiceRequestRejectionReasons.All.FirstOrDefault(r => r.Id == entry.Reason);
            if (reason is null || (reason.RequiresText && string.IsNullOrWhiteSpace(entry.ReasonOther)))
            {
                return ([], "reason-missing");
            }
            resolved.Add(new ResolvedServiceDecision(
                row, InterviewServiceDecisions.Reject, reason,
                string.IsNullOrWhiteSpace(entry.ReasonOther) ? null : entry.ReasonOther.Trim()));
        }
        return (resolved, null);
    }

    /// <summary>
    /// The services the application's ONE interview covers (`P-384`), in the
    /// platform's service order — never a service exempted at screening.
    /// </summary>
    internal static async Task<IReadOnlyList<string>> CoveredServicesAsync(
        ExpertHubDbContext db, Guid interviewId, CancellationToken ct)
    {
        var services = await db.InterviewServices
            .Where(s => s.InterviewId == interviewId)
            .Select(s => s.Service)
            .ToListAsync(ct);
        return [.. services.OrderBy(service => ApplicationServices.All.ToList().IndexOf(service))];
    }

    /// <summary>The recorded decision, application outcome and per service.</summary>
    private static async Task<PostInterviewDecisionWire?> DecisionWireAsync(
        ExpertHubDbContext db, Interview interviewRow, CancellationToken ct)
    {
        if (interviewRow.DecisionKind is null)
        {
            return null;
        }
        var decider = await db.Users.SingleAsync(u => u.UserId == interviewRow.DecidedBy, ct);
        var rows = await db.InterviewServices
            .Where(s => s.InterviewId == interviewRow.InterviewId && s.DecisionKind != null)
            .ToListAsync(ct);
        return new PostInterviewDecisionWire(
            interviewRow.DecisionKind,
            ApplicationEndpoints.Iso(interviewRow.DecidedAt ?? interviewRow.CreatedAt),
            decider.FullNameAr,
            interviewRow.DecisionReasonId,
            [.. rows
                .OrderBy(row => ApplicationServices.All.ToList().IndexOf(row.Service))
                .Select(row => new ServiceDecisionWire(
                    row.Service, row.DecisionKind!, row.DecisionReasonId, row.DecisionReasonText))]);
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

    /// <summary>J-07/F3/AC-3 — every assigned member responded «did not attend».</summary>
    internal static async Task<bool> IsFullNoShowAsync(
        ExpertHubDbContext db, Guid interviewId, CancellationToken ct)
    {
        var responses = await db.InterviewEvaluations
            .Where(e => e.InterviewId == interviewId)
            .Select(e => new { e.SubmittedAt, e.DidNotAttend })
            .ToListAsync(ct);
        return responses.Count > 0 && responses.All(r => r.SubmittedAt != null && r.DidNotAttend);
    }

    /// <summary>Who decided the application's screening — the J-05/J-07
    /// decision-maker the email matrix addresses (E-016, E-072).</summary>
    internal static Task<Guid> ScreeningDeciderAsync(
        ExpertHubDbContext db, Guid applicationId, CancellationToken ct) =>
        (
            from result in db.ScreeningResults
            join service in db.ApplicationServices
                on result.ApplicationServiceId equals service.ApplicationServiceId
            where service.ApplicationId == applicationId
            select result.DecidedBy).FirstOrDefaultAsync(ct);

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
        var coveredServices = await CoveredServicesAsync(db, interviewRow.InterviewId, ct);
        var (model, axes) = await ModelForAsync(db, coveredServices, interviewRow.ModelVersion, ct);
        var counted = evaluations.Where(e => !e.DidNotAttend).ToList();
        var scores = await db.InterviewAxisScores
            .Where(s => counted.Select(e => e.InterviewEvaluationId).Contains(s.InterviewEvaluationId))
            .ToListAsync(ct);
        return [.. coveredServices.Select(service =>
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
        CancellationToken ct,
        TimeSpan? length = null)
    {
        var applicant = await db.Users.SingleAsync(u => u.UserId == application.ApplicantUserId, ct);
        var coveredServices = await CoveredServicesAsync(db, interviewRow.InterviewId, ct);
        var (model, axes) = await ModelForAsync(db, coveredServices, interviewRow.ModelVersion, ct);
        var evaluations = await db.InterviewEvaluations
            .Where(e => e.InterviewId == interviewRow.InterviewId)
            .ToListAsync(ct);
        var members = await db.Users
            .Where(u => evaluations.Select(e => e.EvaluatorUserId).Contains(u.UserId))
            .ToListAsync(ct);
        var confirmed = interviewRow.ConfirmedSlotId is { } slotId
            ? await db.InterviewSlots.FirstOrDefaultAsync(s => s.SlotId == slotId, ct)
            : null;
        var proposed = await db.InterviewSlots
            .Where(s => s.InterviewId == interviewRow.InterviewId && !s.IsSuperseded)
            .OrderBy(s => s.StartsAt)
            .Select(s => s.StartsAt)
            .ToListAsync(ct);
        var phase = PhaseOf(
            interviewRow, confirmed?.StartsAt, length ?? InterviewMeeting.Length(null), DateTime.UtcNow);

        var result = await ServiceResultsAsync(db, application.ApplicationId, interviewRow, ct);

        var mine = evaluations.FirstOrDefault(e => e.EvaluatorUserId == viewerUserId);
        var blocked = mine is null ? "not-member"
            : mine.SubmittedAt is not null ? "already-responded"
            : phase == InterviewPhases.AwaitingSelection ? "awaiting-selection"
            : phase == InterviewPhases.Scheduled ? "not-started"
            : phase == InterviewPhases.Completed ? "completed"
            : null;
        var isDecider = await IsScreeningDeciderAsync(db, application.ApplicationId, viewerUserId, ct);
        var fullNoShow = interviewRow.Status == InterviewStatuses.Completed
            && await IsFullNoShowAsync(db, interviewRow.InterviewId, ct);
        var decision = await DecisionWireAsync(db, interviewRow, ct);

        var titles = await (
            from userRole in db.UserRoles
            join role in db.Roles on userRole.RoleId equals role.RoleId
            select new { userRole.UserId, role.NameAr, role.NameEn }).ToListAsync(ct);

        return new InterviewDetailWire(
            application.ApplicationId.ToString(),
            application.Reference ?? string.Empty,
            applicant.FullNameAr,
            coveredServices,
            new TicketWire(
                interviewRow.TicketNumber ?? string.Empty,
                confirmed is null ? null : ApplicationEndpoints.Iso(confirmed.StartsAt),
                interviewRow.MeetingUrl,
                interviewRow.RescheduleCount,
                [.. proposed.Select(ApplicationEndpoints.Iso)]),
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
                CanEvaluate: blocked is null,
                CanDecide: isDecider && interviewRow.DecisionKind is null
                    && interviewRow.Status == InterviewStatuses.Completed,
                CanReschedule: interviewRow.DecisionKind is null
                    && (interviewRow.Status != InterviewStatuses.Completed
                        || (fullNoShow && isDecider)),
                CanReject: isDecider && interviewRow.DecisionKind is null
                    && (interviewRow.Status == InterviewStatuses.Completed
                        || interviewRow.NoShowRescheduleCount > 0),
                FullNoShow: fullNoShow,
                EvaluationBlockedReason: blocked),
            decision,
            await ExemptedServicesAsync(db, application.ApplicationId, ct),
            interviewRow.RescheduleRequestedAt is { } requestedAt
                ? new RescheduleRequestWire(ApplicationEndpoints.Iso(requestedAt), interviewRow.RescheduleNote)
                : null,
            phase);
    }
}
