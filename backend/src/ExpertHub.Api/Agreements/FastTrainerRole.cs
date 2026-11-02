using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Agreements;

/// <summary>
/// `P-391` — FAST's Trainer role follows the agreement: given at signature and
/// at a renewal after expiry, taken away when the agreement ends, by hand or by
/// its end date passing.
/// </summary>
public static class FastTrainerRole
{
    private const string Element = "trainer_accreditation";

    /// <summary>
    /// How far back the sweep looks. An agreement that expired long before the
    /// role was sent at all is left alone: its person may be a trainer at FAST
    /// for reasons Expert Hub never recorded.
    /// </summary>
    private static readonly TimeSpan ExpiredWindow = TimeSpan.FromDays(7);

    /// <summary>Queues the change; the caller saves it with its own transition.</summary>
    public static async Task EnqueueAsync(
        ExpertHubDbContext db, IntegrationHub hub, Guid trainerId, string operation, CancellationToken ct)
    {
        var sent = await db.OutboxMessages.CountAsync(
            m => m.ElementName == Element && m.EntityId == trainerId, ct);
        await hub.EnqueueOutboundAsync(
            IntegrationSystems.Fast,
            Element,
            "TRAINER",
            trainerId,
            entityVersion: sent + 1,
            operation,
            JsonSerializer.Serialize(new { trainerId }),
            ct);
    }

    /// <summary>The trainer holding this user's profile, if they became one.</summary>
    public static Task<Guid?> TrainerOfAsync(ExpertHubDbContext db, Guid userId, CancellationToken ct) =>
        db.TrainerProfiles
            .Where(p => p.UserId == userId)
            .Select(p => (Guid?)p.TrainerId)
            .FirstOrDefaultAsync(ct);

    /// <summary>
    /// An expired agreement stays stored as <c>active</c> (expiry is derived on
    /// read), so no transition exists to hook: this sweep finds them. Idempotent:
    /// a trainer whose latest message is already a revoke is skipped.
    /// </summary>
    public static async Task<int> RevokeExpiredAsync(
        ExpertHubDbContext db, IntegrationHub hub, DateTime now, CancellationToken ct)
    {
        var cutoff = now - ExpiredWindow;
        var trainerIds = await (
            from agreement in db.Agreements
            join profile in db.TrainerProfiles on agreement.TrainerUserId equals profile.UserId
            where agreement.Status == AgreementStatuses.Active
                && agreement.EndsAt <= now
                && agreement.EndsAt >= cutoff
            select profile.TrainerId).Distinct().ToListAsync(ct);
        var revoked = 0;
        foreach (var trainerId in trainerIds)
        {
            var latest = await db.OutboxMessages
                .Where(m => m.ElementName == Element && m.EntityId == trainerId)
                .OrderByDescending(m => m.EntityVersion)
                .Select(m => m.Operation)
                .FirstOrDefaultAsync(ct);
            if (latest == FastPlanChannel.Revoke)
            {
                continue;
            }
            await EnqueueAsync(db, hub, trainerId, FastPlanChannel.Revoke, ct);
            revoked++;
        }
        await db.SaveChangesAsync(ct);
        return revoked;
    }
}
