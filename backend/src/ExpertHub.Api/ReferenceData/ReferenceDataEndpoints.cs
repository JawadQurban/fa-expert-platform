using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.ReferenceData;

/// <summary>One synchronized value, as a lookup serves it.</summary>
internal sealed record ReferenceValueWire(
    string Code, string LabelAr, string LabelEn, bool IsActive, JsonElement? Attributes);

/// <summary>A FAST reference list from Expert Hub's own copy.</summary>
internal sealed record ReferenceListWire(
    string ListCode, string Source, DateTime? LastSuccessfulSyncAt,
    IReadOnlyList<ReferenceValueWire> Values);

/// <summary>
/// The lookup provider for FAST reference data — read from `REFERENCE_VALUE`,
/// never from FAST, so a dropdown works while FAST is down.
/// </summary>
/// <remarks>
/// `GET v1/reference-data/{listCode}` serves ACTIVE values; with
/// <c>includeInactive=true</c> it also serves the ones FAST stopped sending,
/// so an old answer still resolves to its label. No credential, token or FAST
/// address ever appears on this wire.
/// </remarks>
public static class ReferenceDataEndpoints
{
    public static RouteGroupBuilder MapReferenceDataEndpoints(this RouteGroupBuilder v1)
    {
        v1.MapGet("/reference-data/{listCode}", async (
            string listCode, bool? includeInactive, ExpertHubDbContext db, CancellationToken ct) =>
        {
            if (!FastReferenceLists.All.Contains(listCode))
            {
                return Results.Problem(statusCode: 404, detail: "Unknown reference list.");
            }
            var all = includeInactive == true;
            var values = await db.ReferenceValues.AsNoTracking()
                .Where(v => v.ListCode == listCode && (all || v.IsActive))
                .OrderBy(v => v.SortOrder)
                .ToListAsync(ct);
            return Results.Ok(new ReferenceListWire(
                listCode,
                IntegrationSystems.Fast,
                await LastSuccessfulSyncAsync(db, listCode, ct),
                [.. values.Select(v => new ReferenceValueWire(
                    v.Code,
                    v.LabelAr,
                    v.LabelEn,
                    v.IsActive,
                    v.Attributes is null ? null : JsonSerializer.Deserialize<JsonElement>(v.Attributes)))]));
        })
            .RequireAuthorization()
            .WithName("ReferenceDataList");

        return v1;
    }

    /// <summary>When this list last synchronized successfully, or null if never.</summary>
    internal static async Task<DateTime?> LastSuccessfulSyncAsync(
        ExpertHubDbContext db, string listCode, CancellationToken ct)
    {
        var entityType = FastReferenceDataSync.EntityTypeFor(listCode);
        return await db.IntegrationLog
            .Where(l => l.SystemCode == IntegrationSystems.Fast
                && l.Operation == FastReferenceDataSync.Operation
                && l.EntityType == entityType
                && l.Outcome == IntegrationOutcomes.Success)
            .OrderByDescending(l => l.OccurredAt)
            .Select(l => (DateTime?)l.OccurredAt)
            .FirstOrDefaultAsync(ct);
    }
}
