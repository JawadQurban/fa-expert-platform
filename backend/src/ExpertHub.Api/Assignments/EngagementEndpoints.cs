using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Applications;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Assignments;

/*
 * The trainer's half of CAP-05 (J-18 response, J-21 execution, J-22
 * withdrawal) and the slot view staff read, behind `engagementService.ts`,
 * `executionService.ts`, `withdrawalService.ts` and `submissionService.ts`:
 *
 *   GET  v1/me/assignment-offers
 *   POST v1/me/assignment-offers/{offerId}/response
 *   GET  v1/me/engagements
 *   GET  v1/me/engagements/{engagementId}                (execution detail)
 *   POST v1/me/engagements/{engagementId}/withdrawal
 *   GET  v1/me/submissions
 *   POST v1/me/submissions/{submissionId}/upload
 *   GET  v1/internal/assignment-requests/{id}/slots
 *   POST v1/internal/engagements/{engagementId}/delink
 *   GET  v1/internal/submissions
 *   GET  v1/internal/submissions/{submissionId}
 *   POST v1/internal/submissions/{submissionId}/decision
 *
 * What is deliberately ABSENT: a send-offer operation (the system creates
 * offers — J-18/F1/AC-1) and a cancel-plan operation (cancellation
 * originates only in FAST — J-22/F3/AC-2). Neither exists to be called.
 */

internal sealed record SlaWire(string SlaId, string State, string DueAt, int DaysRemaining);

/// <summary>The offer's price as the offer recorded it — null when the
/// agreement carries none for the mode (`DM-GAP-16`), never a guess.</summary>
internal sealed record OfferPriceWire(decimal? Amount, string Currency);

internal sealed record OfferWire(
    string OfferId, string RequestId, int SlotNumber, string TrainerId, string TrainerName,
    string Status, string SentAt, SlaWire? ResponseSla, string? RespondedAt, object? Details,
    OfferPriceWire Price);

internal sealed record SlotBackupWire(string TrainerId, string TrainerName, int PreferenceRank);

internal sealed record SlotWire(
    int SlotNumber, OfferWire? CurrentOffer, IReadOnlyList<SlotBackupWire> Backups,
    IReadOnlyList<OfferWire> History, string? ConfirmedTrainerId,
    string? ConfirmedEngagementId, string FastSync, bool Exhausted);

internal sealed record MaterialWire(string Status, string? Name);

internal sealed record MyEngagementWire(
    string EngagementId, string RequestId, int SlotNumber, string ConfirmedAt,
    object? Details, MaterialWire TrainingMaterial, bool CanUploadMaterial, string Lifecycle);

internal sealed record OfferResponseInputWire(string? Response);

internal sealed record TerminationInputWire(string? Reason, string? Note);

internal sealed record SubmissionRoundWire(
    int RoundNumber, string FileName, string? Decision, string? Note,
    string? DecidedByName, string? DecidedAt, string UploadedAt);

internal sealed record SubmissionWire(
    string SubmissionId, string EngagementId, string Kind, string Status,
    string SyncState, string TrainerName, string OpenedAt,
    IReadOnlyList<SubmissionRoundWire> Rounds);

internal sealed record UploadRoundInputWire(string? FileName);

internal sealed record SubmissionDecisionInputWire(string? Decision, string? Note);

/// <summary>The offer, engagement, submission and termination surfaces.</summary>
public static class EngagementEndpoints
{
    public static RouteGroupBuilder MapEngagementEndpoints(this RouteGroupBuilder v1)
    {
        var me = v1.MapGroup("/me").RequireAuthorization();

        me.MapGet("/assignment-offers", async (
            HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var trainer = await TrainerOfAsync(http, db, ct);
            if (trainer is null)
            {
                return Results.Ok(Array.Empty<OfferWire>());
            }
            var offers = await db.AssignmentOffers
                .Where(o => o.TrainerId == trainer.TrainerId)
                .OrderByDescending(o => o.SentAt)
                .ToListAsync(ct);
            return Results.Ok(await OfferWiresAsync(db, offers, ct));
        }).WithName("MyAssignmentOffers");

        me.MapPost("/assignment-offers/{offerId}/response", async (
            string offerId,
            OfferResponseInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            IntegrationHub hub,
            NotificationDispatcher dispatcher,
            CancellationToken ct) =>
        {
            var trainer = await TrainerOfAsync(http, db, ct);
            if (trainer is null || !Guid.TryParse(offerId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Offer not found.");
            }
            var offer = await db.AssignmentOffers.FirstOrDefaultAsync(
                o => o.OfferId == id && o.TrainerId == trainer.TrainerId, ct);
            if (offer is null)
            {
                return Results.Problem(statusCode: 404, detail: "Offer not found.");
            }
            if (offer.Status != OfferStatuses.AwaitingResponse)
            {
                return Results.Problem(statusCode: 409, detail: "Already answered.");
            }
            var accept = string.Equals(input.Response, "accept", StringComparison.Ordinal);
            if (!accept && !string.Equals(input.Response, "reject", StringComparison.Ordinal))
            {
                return Results.Problem(statusCode: 400, detail: "Unknown response.");
            }
            var now = DateTime.UtcNow;
            await using var transaction = await db.Database.BeginTransactionAsync(ct);

            // F2/AC-3 — expiry is automatic and the SERVER's to decide. An
            // answer arriving after the window has closed is not an answer.
            if (offer.ResponseDueAt is { } due && due <= now)
            {
                await OfferService.ExpireAsync(db, dispatcher, offer.OfferId, now, ct);
                await db.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
                return Results.Problem(statusCode: 409, detail: "The response window has closed.");
            }

            // The claim: only an offer STILL awaiting inside its window may be
            // answered. The expiry sweep claims the same row the same way, so
            // an expired offer can never be accepted afterwards.
            var claimed = await db.AssignmentOffers
                .Where(o => o.OfferId == offer.OfferId
                    && o.Status == OfferStatuses.AwaitingResponse
                    && (o.ResponseDueAt == null || o.ResponseDueAt > now))
                .ExecuteUpdateAsync(set => set
                    .SetProperty(o => o.Status, accept ? OfferStatuses.Accepted : OfferStatuses.Rejected)
                    .SetProperty(o => o.RespondedAt, now), ct);
            if (claimed == 0)
            {
                await transaction.RollbackAsync(ct);
                return Results.Problem(statusCode: 409, detail: "Already answered.");
            }

            var slot = await db.AssignmentSlots.SingleAsync(s => s.SlotId == offer.SlotId, ct);
            if (accept)
            {
                await OfferService.ConfirmAsync(
                    db, hub, dispatcher, offer, slot, trainer.UserId, now, ct);
            }
            else
            {
                offer.Status = OfferStatuses.Rejected;
                offer.RespondedAt = now;
                // J-18/F2/AC-2 — staff are told IMMEDIATELY, and this is a
                // different event from a lapse (EV-0503).
                await OfferService.RaiseAsync(dispatcher, db, "EV-0502", slot, ct);
                await OfferService.AdvanceAsync(db, dispatcher, slot, now, ct);
            }

            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return Results.Ok(await MyEngagementsAsync(db, trainer.TrainerId, ct));
        }).WithName("RespondToOffer");

        me.MapGet("/engagements", async (
            HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var trainer = await TrainerOfAsync(http, db, ct);
            return Results.Ok(trainer is null
                ? []
                : await MyEngagementsAsync(db, trainer.TrainerId, ct));
        }).WithName("MyEngagements");

        me.MapGet("/engagements/{engagementId}", async (
            string engagementId, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var found = await FindOwnEngagementAsync(engagementId, http, db, ct);
            if (found is null)
            {
                return Results.Problem(statusCode: 404, detail: "Engagement not found.");
            }
            var (engagement, request, slot) = found.Value;
            var form = FormOf(request);
            return Results.Ok(new
            {
                engagementId = engagement.EngagementId.ToString(),
                requestId = request.RequestId.ToString(),
                slotNumber = slot.SlotNumber,
                status = OfferService.Lifecycle(
                    engagement, ParseDate(form?.DateFrom), ParseDate(form?.DateTo), DateTime.UtcNow),
                confirmedAt = ApplicationEndpoints.Iso(engagement.ConfirmedAt),
                details = DetailsOf(request),
                // ⚠️ `Q20` — `plan.PlanTaker` is not supplied, so enrolment
                // and attendance have no source. Served as EMPTY with the
                // gap named, never as zeroes that look like real figures.
                enrolment = new { available = false, reason = "Q20", takers = Array.Empty<object>() },
                attendance = new { available = false, reason = "Q20", days = Array.Empty<object>() },
                // J-21/F1/AC-3 — FAST moving the dates is a fact about the
                // plan, so it is reported when it happened and null otherwise.
                scheduleChangedAt = engagement.ScheduleChangedAt is { } changed
                    ? ApplicationEndpoints.Iso(changed)
                    : null,
                // J-21/F6 — trainee evaluations come straight from MTM (`Q29`),
                // and no such integration exists: the gap is named, not zeroed.
                evaluations = new { available = false, reason = "Q29", items = Array.Empty<object>() },
                // J-22/F3/AC-6 — an ended engagement shows how it ended.
                termination = await TerminationOfAsync(db, engagement.EngagementId, ct),
            });
        }).WithName("EngagementExecution");

        me.MapPost("/engagements/{engagementId}/withdrawal", async (
            string engagementId,
            TerminationInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            CancellationToken ct) =>
        {
            var found = await FindOwnEngagementAsync(engagementId, http, db, ct);
            if (found is null)
            {
                return Results.Problem(statusCode: 404, detail: "Engagement not found.");
            }
            var (engagement, _, slot) = found.Value;
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            return await TerminateAsync(
                db, dispatcher, engagement, slot,
                actorKind: "trainer", allowed: TerminationReasons.Trainer,
                // `D-10` (BR-0511) — a trainer may withdraw until 4 days before.
                noticeBeforeStart: TimeSpan.FromDays(4),
                input, actor.UserId, eventCode: "EV-0506", ct);
        }).WithName("WithdrawFromEngagement");

        me.MapGet("/submissions", async (
            HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var trainer = await TrainerOfAsync(http, db, ct);
            if (trainer is null)
            {
                return Results.Ok(Array.Empty<SubmissionWire>());
            }
            var mine = await db.Engagements
                .Where(e => e.TrainerId == trainer.TrainerId)
                .Select(e => e.EngagementId)
                .ToListAsync(ct);
            return Results.Ok(await SubmissionWiresAsync(db, mine, ct));
        }).WithName("MySubmissions");

        me.MapPost("/submissions/{submissionId}/upload", async (
            string submissionId,
            UploadRoundInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var trainer = await TrainerOfAsync(http, db, ct);
            if (trainer is null || !Guid.TryParse(submissionId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Submission not found.");
            }
            var submission = await (
                from s in db.MaterialSubmissions
                join engagement in db.Engagements on s.EngagementId equals engagement.EngagementId
                where s.SubmissionId == id && engagement.TrainerId == trainer.TrainerId
                select s).FirstOrDefaultAsync(ct);
            if (submission is null)
            {
                return Results.Problem(statusCode: 404, detail: "Submission not found.");
            }
            if (submission.Status is not (SubmissionStatuses.AwaitingUpload
                or SubmissionStatuses.ChangesRequested))
            {
                return Results.Problem(statusCode: 409, detail: "Nothing to upload at this stage.");
            }
            if (string.IsNullOrWhiteSpace(input.FileName))
            {
                // ⚠️ `G26`/`G27` — the real upload (storage + antivirus) is
                // blocked, so a round records the file NAME the trainer chose
                // and no bytes are stored anywhere.
                return Results.Problem(statusCode: 400, detail: "file-required");
            }
            var rounds = await db.SubmissionRounds
                .Where(r => r.SubmissionId == submission.SubmissionId)
                .ToListAsync(ct);
            db.SubmissionRounds.Add(new SubmissionRound
            {
                RoundId = Guid.NewGuid(),
                SubmissionId = submission.SubmissionId,
                RoundNumber = rounds.Count + 1,
                FileName = input.FileName,
                UploadedAt = DateTime.UtcNow,
            });
            submission.Status = SubmissionStatuses.PendingApproval;
            await db.SaveChangesAsync(ct);
            return Results.Ok((await SubmissionWiresAsync(db, [submission.EngagementId], ct))[0]);
        }).WithName("UploadSubmissionRound");

        /* ── the internal side ─────────────────────────────────────────────── */

        var internalGroup = v1.MapGroup("/internal")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        internalGroup.MapGet("/assignment-requests/{requestId}/slots", async (
            string requestId, ExpertHubDbContext db, CancellationToken ct) =>
        {
            if (!Guid.TryParse(requestId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Assignment request not found.");
            }
            var slots = await db.AssignmentSlots
                .Where(s => s.RequestId == id)
                .OrderBy(s => s.SlotNumber)
                .ToListAsync(ct);
            var offers = await db.AssignmentOffers
                .Where(o => slots.Select(s => s.SlotId).Contains(o.SlotId))
                .OrderBy(o => o.SentAt)
                .ToListAsync(ct);
            var wires = await OfferWiresAsync(db, offers, ct);
            var pools = await db.CandidatePools.Where(p => p.RequestId == id).ToListAsync(ct);
            var members = await db.PoolMembers
                .Where(m => pools.Select(p => p.PoolId).Contains(m.PoolId))
                .ToListAsync(ct);
            var names = await TrainerNamesAsync(db, ct);

            return Results.Ok(slots.Select(slot =>
            {
                var slotOffers = wires.Where(w => w.SlotNumber == slot.SlotNumber).ToList();
                var current = slotOffers.LastOrDefault(o => o.Status == "awaiting-response");
                var tried = slotOffers.Select(o => o.TrainerId).ToHashSet();
                return new SlotWire(
                    slot.SlotNumber,
                    current,
                    [.. members
                        .Where(m => m.Decision == "approved"
                            && !tried.Contains(m.TrainerId.ToString()))
                        .OrderBy(m => m.PreferenceRank ?? int.MaxValue)
                        .Select(m => new SlotBackupWire(
                            m.TrainerId.ToString(),
                            names.GetValueOrDefault(m.TrainerId, string.Empty),
                            m.PreferenceRank ?? 0))],
                    slotOffers,
                    slot.ConfirmedEngagementId is null
                        ? null
                        : slotOffers.LastOrDefault(o => o.Status == "accepted")?.TrainerId,
                    slot.ConfirmedEngagementId?.ToString(),
                    slot.FastSyncState,
                    slot.Exhausted);
            }));
        })
            .WithName("RequestSlots")
            .RequireFeature("F-0505");

        internalGroup.MapPost("/engagements/{engagementId}/delink", async (
            string engagementId,
            TerminationInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(engagementId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Engagement not found.");
            }
            var engagement = await db.Engagements.FirstOrDefaultAsync(e => e.EngagementId == id, ct);
            if (engagement is null)
            {
                return Results.Problem(statusCode: 404, detail: "Engagement not found.");
            }
            var slot = await db.AssignmentSlots.SingleAsync(s => s.SlotId == engagement.SlotId, ct);
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            return await TerminateAsync(
                db, dispatcher, engagement, slot,
                actorKind: "staff", allowed: TerminationReasons.Staff,
                // `D-10` (BR-0512) — staff may end it until 24 hours before.
                noticeBeforeStart: TimeSpan.FromHours(24),
                input, actor.UserId, eventCode: "EV-0507", ct);
        })
            .WithName("DelinkTrainer")
            .RequireFeature("F-0508");

        internalGroup.MapGet("/submissions", async (
            ExpertHubDbContext db, CancellationToken ct) =>
        {
            var engagementIds = await db.Engagements.Select(e => e.EngagementId).ToListAsync(ct);
            return Results.Ok(await SubmissionWiresAsync(db, engagementIds, ct));
        })
            .WithName("InternalSubmissions")
            .RequireFeature("F-0506");

        internalGroup.MapGet("/submissions/{submissionId}", async (
            string submissionId, ExpertHubDbContext db, CancellationToken ct) =>
        {
            if (!Guid.TryParse(submissionId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Submission not found.");
            }
            var submission = await db.MaterialSubmissions.FirstOrDefaultAsync(
                s => s.SubmissionId == id, ct);
            return submission is null
                ? Results.Problem(statusCode: 404, detail: "Submission not found.")
                : Results.Ok((await SubmissionWiresAsync(db, [submission.EngagementId], ct))[0]);
        })
            .WithName("InternalSubmissionDetail")
            .RequireFeature("F-0506");

        internalGroup.MapPost("/submissions/{submissionId}/decision", async (
            string submissionId,
            SubmissionDecisionInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            IntegrationHub hub,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(submissionId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Submission not found.");
            }
            var submission = await db.MaterialSubmissions.FirstOrDefaultAsync(
                s => s.SubmissionId == id, ct);
            if (submission is null || submission.Status != SubmissionStatuses.PendingApproval)
            {
                return Results.Problem(statusCode: 409, detail: "Nothing awaits a decision.");
            }
            var round = await db.SubmissionRounds
                .Where(r => r.SubmissionId == submission.SubmissionId && r.Decision == null)
                .OrderByDescending(r => r.RoundNumber)
                .FirstAsync(ct);
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;

            if (string.Equals(input.Decision, "approved", StringComparison.Ordinal))
            {
                round.Decision = "approved";
                submission.Status = SubmissionStatuses.Approved;
                // J-20/F3 — the approved MATERIAL syncs to FAST; service
                // content does not, which is why the kind decides.
                if (submission.Kind == "training-material")
                {
                    submission.FastSyncState = "processing";
                    await hub.EnqueueOutboundAsync(
                        IntegrationSystems.Fast,
                        "approved_training_material",
                        "MATERIAL_SUBMISSION",
                        submission.SubmissionId,
                        entityVersion: round.RoundNumber,
                        operation: "upsert",
                        JsonSerializer.Serialize(new
                        {
                            submissionId = submission.SubmissionId,
                            fileName = round.FileName,
                        }, AssignmentEndpoints.WireJson),
                        ct);
                }
            }
            else if (string.Equals(input.Decision, "changes-requested", StringComparison.Ordinal))
            {
                if (string.IsNullOrWhiteSpace(input.Note))
                {
                    // J-20/F2/AC-3 (`P-98`) — the note IS the request.
                    return Results.Problem(statusCode: 400, detail: "note-required");
                }
                round.Decision = "changes_requested";
                round.Note = input.Note;
                submission.Status = SubmissionStatuses.ChangesRequested;
            }
            else
            {
                // There is NO rejection in J-20 — only approve or ask for
                // changes — so an unknown decision is simply unknown.
                return Results.Problem(statusCode: 400, detail: "Unknown decision.");
            }
            round.DecidedBy = actor.UserId;
            round.DecidedAt = now;
            await db.SaveChangesAsync(ct);
            return Results.Ok((await SubmissionWiresAsync(db, [submission.EngagementId], ct))[0]);
        })
            .WithName("DecideSubmission")
            .RequireFeature("F-0506");

        return v1;
    }

    /* ── shared ────────────────────────────────────────────────────────────── */

    /// <summary>
    /// J-22/F1 + F2 — both end the engagement as `withdrawn` (`P-111`: one
    /// outcome, and the termination record says whether the trainer or staff
    /// ended it). `cancelled` belongs to FAST alone (F3).
    /// </summary>
    /// <remarks>
    /// ⚠️ The server decides whether the engagement can still be ended — the
    /// page hiding a button is not a rule. Only an UPCOMING engagement, and
    /// only before its notice period (`D-10`), may end here: an engagement that
    /// has started or finished is a fact, and ending it would re-offer a slot
    /// that has already run.
    /// </remarks>
    private static async Task<IResult> TerminateAsync(
        ExpertHubDbContext db,
        NotificationDispatcher dispatcher,
        Engagement engagement,
        AssignmentSlot slot,
        string actorKind,
        IReadOnlyList<string> allowed,
        TimeSpan noticeBeforeStart,
        TerminationInputWire input,
        Guid actorUserId,
        string eventCode,
        CancellationToken ct)
    {
        const string kind = EngagementStatuses.Withdrawn;
        if (engagement.Status is EngagementStatuses.Withdrawn or EngagementStatuses.Cancelled)
        {
            return Results.Problem(statusCode: 409, detail: "Already ended.");
        }
        var form = FormOf(await db.AssignmentRequests.SingleAsync(r => r.RequestId == slot.RequestId, ct));
        var start = ParseDate(form?.DateFrom);
        var lifecycle = OfferService.Lifecycle(engagement, start, ParseDate(form?.DateTo), DateTime.UtcNow);
        if (lifecycle != EngagementStatuses.Upcoming)
        {
            return Results.Problem(
                statusCode: 409,
                detail: "engagement-not-upcoming",
                extensions: new Dictionary<string, object?> { ["lifecycle"] = lifecycle });
        }
        if (start is { } startsAt && DateTime.UtcNow > startsAt - noticeBeforeStart)
        {
            return Results.Problem(
                statusCode: 409,
                detail: "termination-deadline-passed",
                extensions: new Dictionary<string, object?>
                {
                    ["deadline"] = ApplicationEndpoints.Iso(startsAt - noticeBeforeStart),
                });
        }
        if (input.Reason is null || !allowed.Contains(input.Reason))
        {
            return Results.Problem(statusCode: 400, detail: "reason-required");
        }
        if (input.Reason == "other" && string.IsNullOrWhiteSpace(input.Note))
        {
            // The text is what makes «other» a reason.
            return Results.Problem(statusCode: 400, detail: "note-required");
        }
        var now = DateTime.UtcNow;
        engagement.Status = kind;
        db.EngagementTerminations.Add(new EngagementTermination
        {
            TerminationId = Guid.NewGuid(),
            EngagementId = engagement.EngagementId,
            Kind = "withdrawn",
            Actor = actorKind,
            Reason = input.Reason,
            Note = input.Note,
            ActedBy = actorUserId,
            OccurredAt = now,
        });

        // The slot is free again, and the next approved candidate's turn has
        // come — the same mechanism that opened the first offer.
        slot.ConfirmedEngagementId = null;
        slot.FastSyncState = "none";
        await OfferService.AdvanceAsync(db, dispatcher, slot, now, ct);

        await OfferService.RaiseAsync(dispatcher, db, eventCode, slot, ct);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new
        {
            engagementId = engagement.EngagementId.ToString(),
            kind = engagement.Status,
            occurredAt = ApplicationEndpoints.Iso(now),
            slotReopened = slot.ConfirmedEngagementId is null && !slot.Exhausted,
        });
    }

    private static async Task<object?> TerminationOfAsync(
        ExpertHubDbContext db, Guid engagementId, CancellationToken ct)
    {
        var row = await db.EngagementTerminations
            .Where(t => t.EngagementId == engagementId)
            .OrderByDescending(t => t.OccurredAt)
            .FirstOrDefaultAsync(ct);
        return row is null ? null : new
        {
            kind = row.Kind,
            actor = row.Actor,
            reason = row.Reason,
            note = row.Note,
            fastCancelReasonCode = row.FastCancelReasonCode,
            occurredAt = ApplicationEndpoints.Iso(row.OccurredAt),
        };
    }

    private static async Task<TrainerProfile?> TrainerOfAsync(
        HttpContext http, ExpertHubDbContext db, CancellationToken ct)
    {
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        return await db.TrainerProfiles.FirstOrDefaultAsync(p => p.UserId == actor.UserId, ct);
    }

    private static async Task<(Engagement Engagement, AssignmentRequest Request, AssignmentSlot Slot)?>
        FindOwnEngagementAsync(
            string engagementId, HttpContext http, ExpertHubDbContext db, CancellationToken ct)
    {
        var trainer = await TrainerOfAsync(http, db, ct);
        if (trainer is null || !Guid.TryParse(engagementId, out var id))
        {
            return null;
        }
        var engagement = await db.Engagements.FirstOrDefaultAsync(
            e => e.EngagementId == id && e.TrainerId == trainer.TrainerId, ct);
        if (engagement is null)
        {
            return null;
        }
        var slot = await db.AssignmentSlots.SingleAsync(s => s.SlotId == engagement.SlotId, ct);
        var request = await db.AssignmentRequests.SingleAsync(r => r.RequestId == slot.RequestId, ct);
        return (engagement, request, slot);
    }

    private static async Task<List<MyEngagementWire>> MyEngagementsAsync(
        ExpertHubDbContext db, Guid trainerId, CancellationToken ct)
    {
        var rows = await (
            from engagement in db.Engagements
            join slot in db.AssignmentSlots on engagement.SlotId equals slot.SlotId
            join request in db.AssignmentRequests on slot.RequestId equals request.RequestId
            where engagement.TrainerId == trainerId
            orderby engagement.ConfirmedAt descending
            select new { engagement, slot, request }).ToListAsync(ct);
        var submissions = await db.MaterialSubmissions
            .Where(s => rows.Select(r => r.engagement.EngagementId).Contains(s.EngagementId))
            .ToListAsync(ct);
        var now = DateTime.UtcNow;

        return [.. rows.Select(row =>
        {
            var form = FormOf(row.request);
            var submission = submissions.FirstOrDefault(
                s => s.EngagementId == row.engagement.EngagementId);
            return new MyEngagementWire(
                row.engagement.EngagementId.ToString(),
                row.request.RequestId.ToString(),
                row.slot.SlotNumber,
                ApplicationEndpoints.Iso(row.engagement.ConfirmedAt),
                DetailsOf(row.request),
                new MaterialWire(
                    submission?.Status ?? SubmissionStatuses.AwaitingUpload,
                    form?.ProgramName),
                // F5/AC-3 — server-decided, so the portal never re-derives it.
                CanUploadMaterial: submission is not null
                    && submission.Status is SubmissionStatuses.AwaitingUpload
                        or SubmissionStatuses.ChangesRequested,
                OfferService.Lifecycle(
                    row.engagement, ParseDate(form?.DateFrom), ParseDate(form?.DateTo), now));
        })];
    }

    private static async Task<List<OfferWire>> OfferWiresAsync(
        ExpertHubDbContext db, List<AssignmentOffer> offers, CancellationToken ct)
    {
        if (offers.Count == 0)
        {
            return [];
        }
        var slots = await db.AssignmentSlots
            .Where(s => offers.Select(o => o.SlotId).Contains(s.SlotId))
            .ToListAsync(ct);
        var requests = await db.AssignmentRequests
            .Where(r => slots.Select(s => s.RequestId).Contains(r.RequestId))
            .ToListAsync(ct);
        var names = await TrainerNamesAsync(db, ct);
        var now = DateTime.UtcNow;

        return [.. offers.Select(offer =>
        {
            var slot = slots.First(s => s.SlotId == offer.SlotId);
            var request = requests.First(r => r.RequestId == slot.RequestId);
            SlaWire? sla = null;
            if (offer.Status == OfferStatuses.AwaitingResponse && offer.ResponseDueAt is { } due)
            {
                var (state, daysRemaining) = BusinessCalendar.Countdown(due, now);
                sla = new SlaWire("SLA-0501", state, ApplicationEndpoints.Iso(due), daysRemaining);
            }
            return new OfferWire(
                offer.OfferId.ToString(),
                request.RequestId.ToString(),
                slot.SlotNumber,
                offer.TrainerId.ToString(),
                names.GetValueOrDefault(offer.TrainerId, string.Empty),
                offer.Status switch
                {
                    OfferStatuses.AwaitingResponse => "awaiting-response",
                    OfferStatuses.Accepted => "accepted",
                    OfferStatuses.Rejected => "rejected",
                    _ => "expired",
                },
                ApplicationEndpoints.Iso(offer.SentAt),
                sla,
                offer.RespondedAt is { } at ? ApplicationEndpoints.Iso(at) : null,
                DetailsOf(request),
                new OfferPriceWire(offer.Price, offer.Currency));
        })];
    }

    private static async Task<List<SubmissionWire>> SubmissionWiresAsync(
        ExpertHubDbContext db, IReadOnlyList<Guid> engagementIds, CancellationToken ct)
    {
        var submissions = await db.MaterialSubmissions
            .Where(s => engagementIds.Contains(s.EngagementId))
            .OrderByDescending(s => s.OpenedAt)
            .ToListAsync(ct);
        if (submissions.Count == 0)
        {
            return [];
        }
        var rounds = await db.SubmissionRounds
            .Where(r => submissions.Select(s => s.SubmissionId).Contains(r.SubmissionId))
            .OrderBy(r => r.RoundNumber)
            .ToListAsync(ct);
        var engagements = await db.Engagements
            .Where(e => engagementIds.Contains(e.EngagementId))
            .ToListAsync(ct);
        var names = await TrainerNamesAsync(db, ct);
        var deciders = await db.Users.ToDictionaryAsync(u => u.UserId, u => u.FullNameAr, ct);

        return [.. submissions.Select(submission =>
        {
            var engagement = engagements.First(e => e.EngagementId == submission.EngagementId);
            return new SubmissionWire(
                submission.SubmissionId.ToString(),
                submission.EngagementId.ToString(),
                submission.Kind,
                submission.Status,
                submission.FastSyncState,
                names.GetValueOrDefault(engagement.TrainerId, string.Empty),
                ApplicationEndpoints.Iso(submission.OpenedAt),
                [.. rounds
                    .Where(r => r.SubmissionId == submission.SubmissionId)
                    .Select(r => new SubmissionRoundWire(
                        r.RoundNumber,
                        r.FileName,
                        r.Decision,
                        r.Note,
                        r.DecidedBy is { } by ? deciders.GetValueOrDefault(by) : null,
                        r.DecidedAt is { } at ? ApplicationEndpoints.Iso(at) : null,
                        ApplicationEndpoints.Iso(r.UploadedAt)))]);
        })];
    }

    private static async Task<Dictionary<Guid, string>> TrainerNamesAsync(
        ExpertHubDbContext db, CancellationToken ct) =>
        await (from profile in db.TrainerProfiles
               join user in db.Users on profile.UserId equals user.UserId
               select new { profile.TrainerId, user.FullNameAr })
            .ToDictionaryAsync(x => x.TrainerId, x => x.FullNameAr, ct);

    private static CreateRequestInputWire? FormOf(AssignmentRequest request) =>
        JsonSerializer.Deserialize<CreateRequestInputWire>(
            request.FormValues, AssignmentEndpoints.WireJson);

    /// <summary>
    /// What the trainer is shown about the work. ⚠️ Not FAST's
    /// `PulledRequestDataDto` — there is no plan read — but the centre's own
    /// entered request, which is the only description that exists today.
    /// </summary>
    private static object? DetailsOf(AssignmentRequest request)
    {
        var form = FormOf(request);
        return form is null ? null : new
        {
            reference = request.Reference,
            serviceType = request.ServiceType,
            programName = form.ProgramName,
            days = form.DaysCount,
            dateFrom = form.DateFrom,
            dateTo = form.DateTo,
            language = form.Language,
            deliveryMechanism = form.DeliveryMechanism,
            city = form.City,
            specializationDomain = form.SpecializationDomain,
            // J-21/F2 — the meeting link is FAST's and there is no feed, so
            // it is null rather than fabricated.
            meetingUrl = (string?)null,
        };
    }

    private static DateTime? ParseDate(string? value) =>
        DateTime.TryParse(value, System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.RoundtripKind, out var parsed) ? parsed : null;
}
