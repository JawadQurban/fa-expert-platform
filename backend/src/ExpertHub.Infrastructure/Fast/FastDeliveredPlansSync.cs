using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Infrastructure.Fast;

/// <summary>
/// B-14 — the programmes a trainer delivered with the Academy, from FAST
/// (<c>Trainer/GetDeliveredPlans</c>: closed and final-closed plans), copied
/// into <c>TRAINER_RECORD</c>, which the trainer file (J-13/J-15), the public
/// directory (J-24) and the home counts already read.
/// </summary>
/// <remarks>
/// Idempotent and never destructive, like the reference sync: one row per FAST
/// plan per trainer (a filtered unique index backs it), names and dates updated
/// when FAST changes them, and a plan FAST no longer returns is kept — a
/// delivered programme stays delivered. Only trainers whose FAST user id is
/// known (from their sign-in) are read. A failed read for one trainer is logged
/// with the trainer id only and the rest continue.
/// </remarks>
public sealed partial class FastDeliveredPlansSync
{
    /// <summary>`TRAINER_RECORD.role` for a delivered FAST plan.</summary>
    public const string TrainerRole = "مدرب";

    private readonly FastTrainingApi _fast;
    private readonly ILogger<FastDeliveredPlansSync> _logger;

    public FastDeliveredPlansSync(FastTrainingApi fast, ILogger<FastDeliveredPlansSync> logger)
    {
        _fast = fast;
        _logger = logger;
    }

    public bool IsConfigured => _fast.IsConfigured;

    /// <returns>How many rows were added or updated.</returns>
    public async Task<int> SyncAsync(ExpertHubDbContext db, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(db);
        if (!_fast.IsConfigured)
        {
            return 0;
        }
        var trainers = await (
            from profile in db.TrainerProfiles
            join replica in db.FastProfiles on profile.UserId equals replica.UserId
            where replica.FastUserId != null
            select new { profile.TrainerId, replica.FastUserId })
            .ToListAsync(ct).ConfigureAwait(false);

        var changed = 0;
        foreach (var trainer in trainers)
        {
            var delivered = await _fast.DeliveredPlansAsync(trainer.FastUserId!, ct).ConfigureAwait(false);
            if (!delivered.Ok || delivered.Value is null)
            {
                LogFailed(_logger, trainer.TrainerId, delivered.Error ?? "no payload");
                continue;
            }
            var existing = await db.TrainerRecords
                .Where(r => r.TrainerId == trainer.TrainerId && r.FastPlanId != null)
                .ToDictionaryAsync(r => r.FastPlanId!, StringComparer.Ordinal, ct).ConfigureAwait(false);
            foreach (var plan in delivered.Value.Where(p => !string.IsNullOrWhiteSpace(p.PlanId) && p.StartDate is not null))
            {
                var nameAr = plan.NameAr ?? plan.NameEn ?? plan.PlanCode ?? plan.PlanId!;
                var nameEn = plan.NameEn ?? plan.NameAr ?? plan.PlanCode ?? plan.PlanId!;
                if (existing.TryGetValue(plan.PlanId!, out var row))
                {
                    if (row.ProgramNameAr == nameAr && row.ProgramNameEn == nameEn
                        && row.DeliveredFrom == plan.StartDate!.Value && row.DeliveredTo == plan.EndDate)
                    {
                        continue;
                    }
                    row.ProgramNameAr = nameAr;
                    row.ProgramNameEn = nameEn;
                    row.DeliveredFrom = plan.StartDate!.Value;
                    row.DeliveredTo = plan.EndDate;
                }
                else
                {
                    db.TrainerRecords.Add(new TrainerRecord
                    {
                        RecordId = Guid.NewGuid(),
                        TrainerId = trainer.TrainerId,
                        ProgramNameAr = nameAr,
                        ProgramNameEn = nameEn,
                        Role = TrainerRole,
                        DeliveredFrom = plan.StartDate!.Value,
                        DeliveredTo = plan.EndDate,
                        FastPlanId = plan.PlanId,
                    });
                }
                changed++;
            }
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
        }
        if (changed > 0)
        {
            LogSynced(_logger, changed, trainers.Count);
        }
        return changed;
    }

    [LoggerMessage(EventId = 5250, Level = LogLevel.Information,
        Message = "FAST delivered plans: {Changed} trainer record(s) added or updated across {Trainers} trainer(s).")]
    private static partial void LogSynced(ILogger logger, int changed, int trainers);

    [LoggerMessage(EventId = 5251, Level = LogLevel.Warning,
        Message = "FAST delivered plans not read for trainer {TrainerId}: {Reason}. The existing records are kept.")]
    private static partial void LogFailed(ILogger logger, Guid trainerId, string reason);
}
