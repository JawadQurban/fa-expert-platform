using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Documents;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Infrastructure.Fast;

/// <summary>
/// INT-05's outbound channel — what the outbox delivers to FAST through the
/// Training API. Until now FAST had no channel, so these messages sat queued
/// (`P-135`); this is the channel <see cref="ChannelRouter"/> was waiting for.
/// </summary>
/// <remarks>
/// <list type="bullet">
/// <item><b>B-07</b> — <c>engagement</c> / <c>upsert</c> (a confirmed slot,
/// `OfferService.ConfirmAsync`) assigns the trainer to the request's FAST plan
/// (<c>Plan/AssignTrainer</c>, as a freelance trainer). The slot's
/// <c>fast_sync_state</c> becomes <c>synchronized</c>.</item>
/// <item><b>B-08</b> — <c>engagement</c> / <see cref="Unassign"/> (the
/// engagement was ended in Expert Hub) removes them again.</item>
/// <item><b>B-09</b> — <c>approved_training_material</c> sends the approved
/// file and sets the plan's material status.</item>
/// </list>
/// <para>
/// A request with no FAST plan (manual entry, or a form that does not pick
/// one) has nothing to tell FAST: the attempt succeeds as a no-op and the slot
/// reads <c>not-linked</c>, so nothing claims a FAST record exists. Everything
/// that can fail at FAST — the plan closed, the trainer not an active FAST
/// trainer, FAST down — is a failed attempt with FAST's reason, retried by the
/// outbox. Both FAST writes are idempotent at FAST, so a retry after an
/// ambiguous timeout never duplicates.
/// </para>
/// <para>
/// No PII in the logs or the error text: ids only.
/// </para>
/// </remarks>
public sealed partial class FastPlanChannel : ISystemChannel
{
    /// <summary>The outbox operation that removes a trainer from a plan (B-08).</summary>
    public const string Unassign = "unassign";

    /// <summary>
    /// B-09's material status for a file Expert Hub approved. ⚠️ Needs
    /// Confirmation (Training Management / FAST): <c>new</c> vs <c>current</c>.
    /// </summary>
    public const string ApprovedMaterialStatus = "new";

    private readonly FastTrainingApi _fast;
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<FastPlanChannel> _logger;

    public FastPlanChannel(FastTrainingApi fast, IServiceScopeFactory scopes, ILogger<FastPlanChannel> logger)
    {
        _fast = fast;
        _scopes = scopes;
        _logger = logger;
    }

    public string SystemCode => IntegrationSystems.Fast;

    public bool IsConfigured => _fast.IsConfigured;

    public async Task<IntegrationAttemptResult> SendAsync(OutboxMessage message, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(message);
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
        return message.ElementName switch
        {
            "engagement" => await EngagementAsync(db, message, cancellationToken).ConfigureAwait(false),
            "approved_training_material" => await MaterialAsync(
                db, scope.ServiceProvider.GetRequiredService<IDocumentStore>(), message, cancellationToken)
                .ConfigureAwait(false),
            _ => IntegrationAttemptResult.Failure(
                $"No FAST operation exists for '{message.ElementName}'; the message stays queued."),
        };
    }

    private async Task<IntegrationAttemptResult> EngagementAsync(
        ExpertHubDbContext db, OutboxMessage message, CancellationToken ct)
    {
        var engagement = await db.Engagements
            .FirstOrDefaultAsync(e => e.EngagementId == message.EntityId, ct).ConfigureAwait(false);
        if (engagement is null)
        {
            return IntegrationAttemptResult.Failure("The engagement no longer exists.");
        }
        var slot = await db.AssignmentSlots.SingleAsync(s => s.SlotId == engagement.SlotId, ct).ConfigureAwait(false);
        var planId = await PlanOfAsync(db, slot.RequestId, ct).ConfigureAwait(false);
        var removing = message.Operation == Unassign;
        if (planId is null)
        {
            if (!removing && slot.ConfirmedEngagementId == engagement.EngagementId)
            {
                slot.FastSyncState = "not-linked";
                await db.SaveChangesAsync(ct).ConfigureAwait(false);
            }
            return IntegrationAttemptResult.Success();
        }
        // An assignment that arrives after its engagement ended must not put
        // the trainer back on the plan (a retried B-07 overtaking B-08).
        if (!removing && engagement.Status is EngagementStatuses.Withdrawn or EngagementStatuses.Cancelled)
        {
            return IntegrationAttemptResult.Success();
        }
        var trainerFastUserId = await FastUserOfAsync(db, engagement.TrainerId, ct).ConfigureAwait(false);
        if (trainerFastUserId is null)
        {
            return IntegrationAttemptResult.Failure(
                "The trainer has no FAST user id in Expert Hub yet (it is read from FAST at their sign-in).");
        }

        if (removing)
        {
            var reason = ReadString(message.Payload, "reason");
            var removed = await _fast.UnassignTrainerAsync(planId.Value, trainerFastUserId.Value, reason, ct)
                .ConfigureAwait(false);
            if (!removed.Ok)
            {
                return IntegrationAttemptResult.Failure(removed.Error ?? "FAST refused the removal.");
            }
            LogUnassigned(_logger, engagement.EngagementId, planId.Value, removed.Value!.Removed);
            return IntegrationAttemptResult.Success();
        }

        var assigned = await _fast.AssignTrainerAsync(planId.Value, trainerFastUserId.Value, isFreelance: true, ct)
            .ConfigureAwait(false);
        if (!assigned.Ok)
        {
            return IntegrationAttemptResult.Failure(assigned.Error ?? "FAST refused the assignment.");
        }
        if (slot.ConfirmedEngagementId == engagement.EngagementId)
        {
            slot.FastSyncState = "synchronized";
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
        }
        LogAssigned(_logger, engagement.EngagementId, planId.Value, assigned.Value!.AlreadyAssigned);
        return IntegrationAttemptResult.Success();
    }

    private async Task<IntegrationAttemptResult> MaterialAsync(
        ExpertHubDbContext db, IDocumentStore documents, OutboxMessage message, CancellationToken ct)
    {
        var submission = await db.MaterialSubmissions
            .FirstOrDefaultAsync(s => s.SubmissionId == message.EntityId, ct).ConfigureAwait(false);
        if (submission is null)
        {
            return IntegrationAttemptResult.Failure("The material submission no longer exists.");
        }
        var engagement = await db.Engagements.SingleAsync(e => e.EngagementId == submission.EngagementId, ct)
            .ConfigureAwait(false);
        var slot = await db.AssignmentSlots.SingleAsync(s => s.SlotId == engagement.SlotId, ct).ConfigureAwait(false);
        var planId = await PlanOfAsync(db, slot.RequestId, ct).ConfigureAwait(false);
        if (planId is null)
        {
            submission.FastSyncState = "not-linked";
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
            return IntegrationAttemptResult.Success();
        }
        // The round the outbox message was raised for — its version.
        var round = await db.SubmissionRounds
            .FirstOrDefaultAsync(r => r.SubmissionId == submission.SubmissionId
                && r.RoundNumber == message.EntityVersion, ct).ConfigureAwait(false);
        var attachment = round?.AttachmentId is { } attachmentId
            ? await db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == attachmentId, ct).ConfigureAwait(false)
            : null;
        var file = attachment is null ? null : await documents.GetAsync(attachment.StorageRef, ct).ConfigureAwait(false);
        if (file is null)
        {
            return IntegrationAttemptResult.Failure("The approved material file is not stored in Expert Hub.");
        }
        var sent = await _fast.SetTrainingMaterialAsync(
            planId.Value, ApprovedMaterialStatus, file.FileName, file.Bytes, file.MimeType, ct).ConfigureAwait(false);
        if (!sent.Ok)
        {
            return IntegrationAttemptResult.Failure(sent.Error ?? "FAST refused the material.");
        }
        submission.FastSyncState = "synchronized";
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
        LogMaterialSent(_logger, submission.SubmissionId, planId.Value);
        return IntegrationAttemptResult.Success();
    }

    /// <summary>The FAST plan the request was linked to (RUN-030), from its form values.</summary>
    private static async Task<Guid?> PlanOfAsync(ExpertHubDbContext db, Guid requestId, CancellationToken ct)
    {
        var form = await db.AssignmentRequests
            .Where(r => r.RequestId == requestId)
            .Select(r => r.FormValues)
            .SingleAsync(ct).ConfigureAwait(false);
        return Guid.TryParse(ReadString(form, "fastPlanId"), out var planId) ? planId : null;
    }

    private static async Task<Guid?> FastUserOfAsync(ExpertHubDbContext db, Guid trainerId, CancellationToken ct)
    {
        var fastUserId = await (
            from profile in db.TrainerProfiles
            join replica in db.FastProfiles on profile.UserId equals replica.UserId
            where profile.TrainerId == trainerId
            select replica.FastUserId)
            .FirstOrDefaultAsync(ct).ConfigureAwait(false);
        return Guid.TryParse(fastUserId, out var id) ? id : null;
    }

    private static string? ReadString(string json, string property)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            return document.RootElement.TryGetProperty(property, out var value)
                && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    [LoggerMessage(EventId = 5240, Level = LogLevel.Information,
        Message = "FAST: engagement {EngagementId} assigned to plan {PlanId} (already assigned: {AlreadyAssigned}).")]
    private static partial void LogAssigned(ILogger logger, Guid engagementId, Guid planId, bool alreadyAssigned);

    [LoggerMessage(EventId = 5241, Level = LogLevel.Information,
        Message = "FAST: engagement {EngagementId} removed from plan {PlanId} (was on it: {Removed}).")]
    private static partial void LogUnassigned(ILogger logger, Guid engagementId, Guid planId, bool removed);

    [LoggerMessage(EventId = 5242, Level = LogLevel.Information,
        Message = "FAST: approved material {SubmissionId} sent to plan {PlanId}.")]
    private static partial void LogMaterialSent(ILogger logger, Guid submissionId, Guid planId);
}
