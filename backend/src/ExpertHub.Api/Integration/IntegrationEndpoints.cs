using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Integration;

/*
 * CAP-12 — the registry, readable:
 *
 *   GET v1/internal/integration/systems
 *
 * One endpoint, and deliberately only a read: the registry's CONTENTS change
 * by seed/administration, crossings change by the hub — nothing here mutates
 * integration state over HTTP. No frontend service file exists for CAP-12 yet
 * (verified before BE-04 started), so this wire shape is the backend's own;
 * the eventual admin screen contract supersedes it if they differ.
 */

/// <summary>One registered element, as the matrix shows it.</summary>
internal sealed record DataElementWire(
    string ElementName, string EntityName, string OwningSystem, string Direction);

/// <summary>One system with its live standing.</summary>
internal sealed record IntegratedSystemWire(
    string SystemCode,
    string NameAr,
    string NameEn,
    string Direction,
    string Importance,
    bool IsActive,
    IReadOnlyList<DataElementWire> Elements,
    int PendingOutbound,
    int DriftedEntities,
    DateTime? LastCrossingAt,
    string? LastCrossingOutcome);

/// <summary>One FAST reference list's standing.</summary>
internal sealed record ReferenceListStatusWire(
    string ListCode, string NameAr, string NameEn, int ActiveCount, int InactiveCount,
    DateTime? LastAttemptAt, string? LastOutcome, string? LastError, DateTime? LastSuccessfulSyncAt);

/// <summary>The CAP-12 read surface.</summary>
public static class IntegrationEndpoints
{
    /// <summary>Mounts under the version group; everything requires the internal role.</summary>
    public static RouteGroupBuilder MapIntegrationEndpoints(this RouteGroupBuilder v1)
    {
        var integration = v1.MapGroup("/internal/integration")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        integration.MapGet("/systems", async (ExpertHubDbContext db, CancellationToken ct) =>
        {
            var systems = await db.IntegratedSystems
                .OrderBy(s => s.SystemCode)
                .ToListAsync(ct);
            var elements = await db.DataElements
                .OrderBy(e => e.ElementName)
                .ToListAsync(ct);
            var pending = await db.OutboxMessages
                .Where(m => m.Status == OutboxStatuses.Pending)
                .GroupBy(m => m.SystemCode)
                .Select(g => new { SystemCode = g.Key, Count = g.Count() })
                .ToListAsync(ct);
            var drifted = await db.ReplicationStates
                .Where(r => r.DriftStatus == DriftStatuses.Drifted)
                .GroupBy(r => r.SystemCode)
                .Select(g => new { SystemCode = g.Key, Count = g.Count() })
                .ToListAsync(ct);

            var wire = new List<IntegratedSystemWire>(systems.Count);
            foreach (var system in systems)
            {
                // Newest crossing per system — one indexed lookup each; six
                // systems, not an unbounded fan-out.
                var last = await db.IntegrationLog
                    .Where(l => l.SystemCode == system.SystemCode)
                    .OrderByDescending(l => l.OccurredAt)
                    .Select(l => new { l.OccurredAt, l.Outcome })
                    .FirstOrDefaultAsync(ct);

                wire.Add(new IntegratedSystemWire(
                    system.SystemCode,
                    system.NameAr,
                    system.NameEn,
                    system.Direction,
                    system.Importance,
                    system.IsActive,
                    elements
                        .Where(e => e.SystemCode == system.SystemCode)
                        .Select(e => new DataElementWire(
                            e.ElementName, e.EntityName, e.OwningSystem, e.Direction))
                        .ToList(),
                    pending.FirstOrDefault(p => p.SystemCode == system.SystemCode)?.Count ?? 0,
                    drifted.FirstOrDefault(d => d.SystemCode == system.SystemCode)?.Count ?? 0,
                    last?.OccurredAt,
                    last?.Outcome));
            }

            return Results.Ok(new { systems = wire });
        }).WithName("IntegrationSystems");

        // FAST reference lists: how fresh Expert Hub's copy is, and why the
        // last attempt failed if it did. A read, like everything here.
        integration.MapGet("/reference-data", async (ExpertHubDbContext db, CancellationToken ct) =>
        {
            var lists = await db.ReferenceLists.AsNoTracking()
                .Where(l => FastReferenceLists.All.Contains(l.ListCode))
                .OrderBy(l => l.ListCode)
                .ToListAsync(ct);
            var wire = new List<ReferenceListStatusWire>(lists.Count);
            foreach (var list in lists)
            {
                var counts = await db.ReferenceValues.AsNoTracking()
                    .Where(v => v.ListCode == list.ListCode)
                    .GroupBy(v => v.IsActive)
                    .Select(g => new { Active = g.Key, Count = g.Count() })
                    .ToListAsync(ct);
                var entityType = Infrastructure.Fast.FastReferenceDataSync.EntityTypeFor(list.ListCode);
                var last = await db.IntegrationLog
                    .Where(l => l.SystemCode == IntegrationSystems.Fast && l.EntityType == entityType)
                    .OrderByDescending(l => l.OccurredAt)
                    .Select(l => new { l.OccurredAt, l.Outcome, l.ErrorDetail })
                    .FirstOrDefaultAsync(ct);
                wire.Add(new ReferenceListStatusWire(
                    list.ListCode,
                    list.NameAr,
                    list.NameEn,
                    counts.FirstOrDefault(c => c.Active)?.Count ?? 0,
                    counts.FirstOrDefault(c => !c.Active)?.Count ?? 0,
                    last?.OccurredAt,
                    last?.Outcome,
                    last?.ErrorDetail,
                    await ReferenceData.ReferenceDataEndpoints.LastSuccessfulSyncAsync(db, list.ListCode, ct)));
            }
            return Results.Ok(new { lists = wire });
        }).WithName("ReferenceDataStatus");

        return v1;
    }
}
