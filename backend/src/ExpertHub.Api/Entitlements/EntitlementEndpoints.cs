using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Assignments;
using ExpertHub.Api.Auth;
using ExpertHub.Api.ServiceRequests;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Entitlements;

/*
 * EH-TP-09 / EH-INT-11 — المستحقات المالية (CAP-06), behind
 * `entitlementService.ts`:
 *
 *   GET v1/me/entitlements          — `F-0601`, the trainer's own
 *   GET v1/internal/entitlements    — `F-0602`, staff, any trainer
 *
 * And that is the whole capability. `BR-0601` («لا يُدخل أي مستحق أو يُعدَّل
 * يدويًا بأي حال») and `BR-0605` (no dispute path in this release) are
 * encoded as `P-127` describes them — **as the absence of a door**: there is
 * no third route here, and there could not be one, because the writable
 * DbSets are internal to `ExpertHub.Infrastructure` and this assembly cannot
 * reach them. The only author is ERP, through `ErpEntitlementImporter`.
 *
 * `F-0603` — «the automatic link» — likewise has no route, because nobody
 * performs it: it is `EntitlementLinkage.Resolve`, run on every read.
 *
 * ⚠️ No total is displayed and none is computed (`P-125`, §8.6.1): «لا تحتسب
 * هذه القدرة أي مبلغ». There is no sum anywhere in this file, and a caller
 * wanting one would have to add it — which is the point.
 */

internal sealed record DisbursementStatusWire(string Code, LocalizedTextWire Label);

internal sealed record DisbursementAmountWire(decimal Value, string Currency);

/// <summary>
/// `BR-0603` as a type (`P-126`). Every linkage field is non-nullable and the
/// constructor is private, so <b>a record the trainer must not see cannot be
/// built</b> — <see cref="TryLink"/> is the only door, and it returns null
/// for an incomplete chain. There is no flag to mis-read and no null to
/// forget to check.
/// </summary>
internal sealed record TrainerEntitlementWire
{
    private TrainerEntitlementWire()
    {
    }

    public required string EntitlementId { get; init; }

    public required string PurchaseOrderNumber { get; init; }

    public required string AgreementReference { get; init; }

    public required LocalizedTextWire ProgramName { get; init; }

    public required DisbursementStatusWire Status { get; init; }

    public required DisbursementAmountWire Amount { get; init; }

    /// <summary>Null until ERP reports one — a pending amount has no date,
    /// and none is invented.</summary>
    public required string? DisbursementDate { get; init; }

    /// <summary>
    /// The only constructor of this type. Returns null exactly when
    /// `BR-0602`'s chain did not resolve, which is exactly when `BR-0603`
    /// hides the record from the trainer.
    /// </summary>
    internal static TrainerEntitlementWire? TryLink(EntitlementRow row)
    {
        var linkage = row.Linkage;
        if (!linkage.IsComplete || row.AgreementReference is null || row.ProgramName is null)
        {
            return null;
        }
        return new TrainerEntitlementWire
        {
            EntitlementId = row.Entitlement.EntitlementId.ToString(),
            PurchaseOrderNumber = row.Entitlement.PurchaseOrderNumber,
            AgreementReference = row.AgreementReference,
            ProgramName = row.ProgramName,
            Status = EntitlementEndpoints.StatusOf(row.Entitlement),
            Amount = EntitlementEndpoints.AmountOf(row.Entitlement),
            DisbursementDate = EntitlementEndpoints.IsoOrNull(row.Entitlement.DisbursementDate),
        };
    }
}

/// <summary>`linkage: 'complete'` — the trainer's record plus who it belongs to.</summary>
internal sealed record CompleteStaffEntitlementWire(
    string Linkage,
    string TrainerId,
    string TrainerName,
    string EntitlementId,
    string PurchaseOrderNumber,
    string AgreementReference,
    LocalizedTextWire ProgramName,
    DisbursementStatusWire Status,
    DisbursementAmountWire Amount,
    string? DisbursementDate);

/// <summary>
/// `linkage: 'incomplete'` — what staff see and the trainer does not.
/// <c>MissingLinks</c> is the answer to `US-0602`'s support call: «why can't
/// I see my payment?» is answered by naming the hop, not by a verdict.
/// </summary>
internal sealed record IncompleteStaffEntitlementWire(
    string Linkage,
    string TrainerId,
    string TrainerName,
    string EntitlementId,
    string? PurchaseOrderNumber,
    string? AgreementReference,
    LocalizedTextWire? ProgramName,
    DisbursementStatusWire Status,
    DisbursementAmountWire Amount,
    string? DisbursementDate,
    IReadOnlyList<string> MissingLinks);

/// <summary>
/// One entitlement with `BR-0602`'s chain already walked — assembled once so
/// both endpoints resolve the linkage the same way, rather than each writing
/// its own version of the rule.
/// </summary>
internal sealed record EntitlementRow(
    Entitlement Entitlement,
    string TrainerName,
    string? AgreementReference,
    LocalizedTextWire? ProgramName,
    EntitlementLinkage Linkage);

/// <summary>المستحقات المالية — two reads, and nothing else.</summary>
public static class EntitlementEndpoints
{
    public static RouteGroupBuilder MapEntitlementEndpoints(this RouteGroupBuilder v1)
    {
        /*
         * Ownership, not a feature gate — the `/me/*` rule `P-190` records.
         * The query is keyed by the caller's own trainer profile, so there is
         * no id to tamper with and nothing to widen; and gating it on
         * `F-0601` would 403 every accredited trainer until an administrator
         * assigned them the Trainer role, which is a login problem, not a
         * permission decision.
         */
        v1.MapGet("/me/entitlements", async (
            HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var profile = await db.TrainerProfiles
                .FirstOrDefaultAsync(p => p.UserId == actor.UserId, ct);
            if (profile is null)
            {
                // Not an error: a person with no trainer file has no
                // entitlements, and the portal's empty state says so.
                return Results.Ok(Array.Empty<TrainerEntitlementWire>());
            }

            var rows = await RowsAsync(db, p => p.TrainerId == profile.TrainerId, ct);
            // `BR-0603` applied at the source: the incomplete ones do not
            // survive `TryLink`, so they never reach a client that could
            // render them by mistake.
            return Results.Ok(rows
                .Select(TrainerEntitlementWire.TryLink)
                .OfType<TrainerEntitlementWire>()
                .ToList());
        }).RequireAuthorization().WithName("MyEntitlements");

        v1.MapGet("/internal/entitlements", async (
            string? trainer,
            string? linkage,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var scope = await FeatureAuthorization.WidestScopeAsync(db, actor.UserId, "F-0602", ct);

            // `DM-GAP-07`'s third column, applied at the query rather than by
            // a guard a later handler could forget: a holder scoped to their
            // own data sees their own record and no one else's.
            var rows = scope == DataScope.Own
                ? await RowsForOwnScopeAsync(db, actor.UserId, ct)
                : await RowsAsync(db, _ => true, ct);

            var term = trainer?.Trim();
            var onlyIncomplete = string.Equals(linkage, "incomplete", StringComparison.Ordinal);
            var wires = rows
                .Where(row => string.IsNullOrEmpty(term)
                    || row.TrainerName.Contains(term, StringComparison.OrdinalIgnoreCase))
                .Where(row => !onlyIncomplete || !row.Linkage.IsComplete)
                .Select(StaffWireOf)
                .ToList();
            return Results.Ok(wires);
        }).RequireAuthorization().RequireFeature("F-0602").WithName("InternalEntitlements");

        return v1;
    }

    /// <summary>
    /// The union `entitlement.types.ts` declares, as two records rather than
    /// one nullable one: the complete member carries no `missingLinks` field
    /// at all, so the wire cannot describe a visible record as unlinked.
    /// </summary>
    private static object StaffWireOf(EntitlementRow row)
    {
        var trainerId = row.Entitlement.TrainerId.ToString();
        if (row.Linkage.IsComplete
            && row.AgreementReference is { } reference
            && row.ProgramName is { } programName)
        {
            return new CompleteStaffEntitlementWire(
                "complete",
                trainerId,
                row.TrainerName,
                row.Entitlement.EntitlementId.ToString(),
                row.Entitlement.PurchaseOrderNumber,
                reference,
                programName,
                StatusOf(row.Entitlement),
                AmountOf(row.Entitlement),
                IsoOrNull(row.Entitlement.DisbursementDate));
        }

        return new IncompleteStaffEntitlementWire(
            "incomplete",
            trainerId,
            row.TrainerName,
            row.Entitlement.EntitlementId.ToString(),
            row.Linkage.MissingLinks.Contains(EntitlementLinkSteps.PurchaseOrder)
                ? null
                : row.Entitlement.PurchaseOrderNumber,
            row.AgreementReference,
            row.ProgramName,
            StatusOf(row.Entitlement),
            AmountOf(row.Entitlement),
            IsoOrNull(row.Entitlement.DisbursementDate),
            row.Linkage.MissingLinks);
    }

    /// <summary>
    /// Walks `BR-0602`'s chain for every matching entitlement. One query per
    /// hop rather than per row, and the linkage resolved from what actually
    /// came back — never from a stored flag, which is why `linkage_complete`
    /// is not a column.
    /// </summary>
    private static async Task<List<EntitlementRow>> RowsAsync(
        ExpertHubDbContext db,
        System.Linq.Expressions.Expression<Func<Entitlement, bool>> predicate,
        CancellationToken ct)
    {
        var entitlements = await db.Entitlements.Where(predicate)
            .OrderByDescending(e => e.LastSyncedAt).ToListAsync(ct);
        if (entitlements.Count == 0)
        {
            return [];
        }

        var trainerIds = entitlements.Select(e => e.TrainerId).Distinct().ToList();
        var names = await (
            from profile in db.TrainerProfiles
            join user in db.Users on profile.UserId equals user.UserId
            where trainerIds.Contains(profile.TrainerId)
            select new { profile.TrainerId, user.FullNameAr }).ToListAsync(ct);
        var nameByTrainer = names.ToDictionary(n => n.TrainerId, n => n.FullNameAr);

        var poNumbers = entitlements.Select(e => e.PurchaseOrderNumber).Distinct().ToList();
        var orders = await db.ErpPurchaseOrders
            .Where(p => poNumbers.Contains(p.PurchaseOrderNumber)).ToListAsync(ct);
        var orderByNumber = orders.ToDictionary(p => p.PurchaseOrderNumber, StringComparer.Ordinal);

        var agreementIds = entitlements
            .Where(e => e.AgreementId is not null).Select(e => e.AgreementId!.Value)
            .Distinct().ToList();
        var agreements = await db.Agreements
            .Where(a => agreementIds.Contains(a.AgreementId))
            .Select(a => new { a.AgreementId, a.Reference }).ToListAsync(ct);
        var referenceByAgreement = agreements.ToDictionary(a => a.AgreementId, a => a.Reference);

        var engagementIds = entitlements
            .Where(e => e.EngagementId is not null).Select(e => e.EngagementId!.Value)
            .Distinct().ToList();
        var programmes = await (
            from engagement in db.Engagements
            join slot in db.AssignmentSlots on engagement.SlotId equals slot.SlotId
            join request in db.AssignmentRequests on slot.RequestId equals request.RequestId
            where engagementIds.Contains(engagement.EngagementId)
            select new { engagement.EngagementId, request.FormValues }).ToListAsync(ct);
        var programmeByEngagement = programmes.ToDictionary(
            p => p.EngagementId, p => ProgramNameOf(p.FormValues));

        return [.. entitlements.Select(entitlement =>
        {
            var order = orderByNumber.GetValueOrDefault(entitlement.PurchaseOrderNumber);
            var reference = entitlement.AgreementId is { } agreementId
                ? referenceByAgreement.GetValueOrDefault(agreementId)
                : null;
            var programName = entitlement.EngagementId is { } engagementId
                ? programmeByEngagement.GetValueOrDefault(engagementId)
                : null;
            return new EntitlementRow(
                entitlement,
                nameByTrainer.GetValueOrDefault(entitlement.TrainerId, string.Empty),
                reference,
                programName,
                EntitlementLinkage.Resolve(order, reference, programName?.Ar));
        })];
    }

    /// <summary>The `own`-scoped staff read — their own trainer file, if any.</summary>
    private static async Task<List<EntitlementRow>> RowsForOwnScopeAsync(
        ExpertHubDbContext db, Guid userId, CancellationToken ct)
    {
        var profile = await db.TrainerProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        return profile is null
            ? []
            : await RowsAsync(db, e => e.TrainerId == profile.TrainerId, ct);
    }

    /// <summary>
    /// The programme, «tied to the programme by name specifically»
    /// (`US-0601`). ⚠️ One string serves both locales because the centre
    /// enters one name (`DM-GAP-06`, `P-174`) — there is no bilingual
    /// programme catalogue to read, and translating it here would be the
    /// platform authoring a programme name.
    /// </summary>
    private static LocalizedTextWire? ProgramNameOf(string formValues)
    {
        var form = JsonSerializer.Deserialize<CreateRequestInputWire>(
            formValues, AssignmentEndpoints.WireJson);
        return string.IsNullOrWhiteSpace(form?.ProgramName)
            ? null
            : new LocalizedTextWire(form.ProgramName, form.ProgramName);
    }

    /// <summary>ERP's status, rendered as ERP sent it (`P-128`, `Q27`).</summary>
    internal static DisbursementStatusWire StatusOf(Entitlement entitlement) =>
        new(entitlement.DisbursementStatusCode,
            new LocalizedTextWire(
                entitlement.DisbursementStatusLabelAr,
                entitlement.DisbursementStatusLabelEn));

    /// <summary>The money, exactly as ERP sent it. Nothing here is computed.</summary>
    internal static DisbursementAmountWire AmountOf(Entitlement entitlement) =>
        new(entitlement.Amount, entitlement.Currency);

    internal static string? IsoOrNull(DateTime? utc) =>
        utc is { } value ? ApplicationEndpoints.Iso(value) : null;
}
