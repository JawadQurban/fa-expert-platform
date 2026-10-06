using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Agreements;

/*
 * EH-INT-06 — Agreement Lifecycle (CAP-03, J-12), behind
 * `agreementLifecycleService.ts`:
 *
 *   GET  v1/internal/agreements?search=&status=&milestone=
 *   GET  v1/internal/agreements/{id}
 *   POST v1/internal/agreements/{id}/lifecycle
 *   GET  v1/internal/agreements/template
 *   POST v1/internal/agreements/template
 *
 * The rules, held server-side:
 * - The term is server-derived, NEVER an input (`BR-0302`, D-07): 1 year
 *   first, 3 on every renewal — no input field exists to type a duration.
 * - The expiry date is calculated, never entered (`BR-0301`); `expired` is
 *   DERIVED from the calendar, never stored.
 * - Renewal never routes back through screening (`BR-0304`) — the action
 *   union has no such member to parse.
 * - The reminder offsets come from the central `SLA-0301` row (`BR-0705`)
 *   and are SERVED, so the milestone filter follows the console.
 * - The template is the System Administrator's alone (J-12/F4).
 */

internal sealed record ExpiryMilestoneWire(
    string Kind,
    [property: System.Text.Json.Serialization.JsonIgnore(
        Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
    int? DaysBefore);

internal sealed record AgreementSummaryLifecycleWire(
    string Id, string Reference, string TrainerId, string TrainerName,
    IReadOnlyList<string> Services, string Status, string StartsAt, string EndsAt,
    ExpiryMilestoneWire ExpiryMilestone, int DaysToExpiry, int RenewalCount);

internal sealed record AgreementListWire(
    IReadOnlyList<AgreementSummaryLifecycleWire> Items, int TotalCount,
    int ExpiringCount, IReadOnlyList<int> ReminderOffsets);

internal sealed record HistoryEntryWire(
    string Id, string Kind, string At, string ByName, string? Note, int? TermYears);

internal sealed record LifecycleViewerWire(
    bool CanRenew, bool CanSuspend, bool CanEnd, bool CanReactivate);

internal sealed record LifecycleDetailWire(
    string Id, string Reference, string TrainerId, string TrainerName,
    IReadOnlyList<string> Services, string Status, string StartsAt, string EndsAt,
    ExpiryMilestoneWire ExpiryMilestone, int DaysToExpiry, int RenewalCount,
    int NextTermYears, string RenewedEndsAt,
    IReadOnlyList<HistoryEntryWire> History,
    string? DocumentUrl,
    LifecycleViewerWire Viewer);

internal sealed record LifecycleInputWire(string? Kind, string? Note);

internal sealed record TemplateFieldWire(
    string Id, ServiceRequests.LocalizedTextWire Label, string Type, bool Required);

internal sealed record AgreementTemplateWire(
    string Id, string Name, IReadOnlyList<string> Services, string BodyText,
    IReadOnlyList<TemplateFieldWire> Fields, string UpdatedAt, string UpdatedByName);

internal sealed record SaveTemplateInputWire(
    string? BodyText, IReadOnlyList<TemplateFieldInputWire>? Fields);

internal sealed record TemplateFieldInputWire(
    string? Id, ServiceRequests.LocalizedTextWire? Label, string? Type, bool Required);

/// <summary>The J-12 internal surface.</summary>
public static class AgreementLifecycleEndpoints
{
    /*
     * `allowedActions` — the state machine stated once (the frontend's own
     * function, server-side). `active` also offers renewal because F2/AC-1
     * allows it for an agreement "nearing OR past expiry"; `ended` is
     * terminal, so nothing follows it.
     */
    private static readonly string[] ActiveActions = ["renew", "suspend", "end"];
    private static readonly string[] SuspendedActions = ["reactivate", "end"];
    private static readonly string[] ExpiredActions = ["renew"];
    private static readonly string[] NoActions = [];

    public static RouteGroupBuilder MapAgreementLifecycleEndpoints(this RouteGroupBuilder v1)
    {
        var agreements = v1.MapGroup("/internal/agreements")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        /* The template first — the literal "/template" segment must win over
         * the "{id}" route parameter. */
        agreements.MapGet("/template", async (ExpertHubDbContext db, CancellationToken ct) =>
            Results.Ok(await TemplateWireAsync(db, ct))).WithName("AgreementTemplate");

        agreements.MapPost("/template", async (
            SaveTemplateInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (!await ActorResolution.HoldsRoleAsync(
                db, actor.UserId, RoleCode.SystemAdministrator, ct))
            {
                // J-12/F4 — the template is the System Administrator's alone.
                return Results.Problem(statusCode: 403, detail: "Not permitted.");
            }
            if (string.IsNullOrWhiteSpace(input.BodyText))
            {
                // F4/AC-1 — an empty body would generate an empty agreement.
                return Results.Problem(statusCode: 400, detail: "body-required");
            }
            var fields = (input.Fields ?? []).Where(f => f.Id is not null).ToList();
            if (fields.Any(f => string.IsNullOrWhiteSpace(f.Label?.Ar)))
            {
                return Results.Problem(statusCode: 400, detail: "field-label-required");
            }
            var template = await db.AgreementTemplates.SingleAsync(t => t.IsActive, ct);
            var now = DateTime.UtcNow;
            // J-12/F4 — the text being replaced is kept, and the template's
            // version moves on. Existing agreements are untouched: each reads
            // its own frozen document version, never this row.
            var revisions = await db.AgreementTemplateVersions.CountAsync(
                v => v.TemplateId == template.TemplateId, ct);
            db.AgreementTemplateVersions.Add(new AgreementTemplateVersion
            {
                TemplateVersionId = Guid.NewGuid(),
                TemplateId = template.TemplateId,
                Version = template.Version,
                BodyText = template.BodyText,
                FieldMap = template.FieldMap,
                RecordedAt = now,
                RecordedBy = actor.UserId,
            });
            template.Version = string.Create(
                System.Globalization.CultureInfo.InvariantCulture,
                $"{template.Version.Split("+r")[0]}+r{revisions + 1}");
            template.BodyText = input.BodyText;
            template.FieldMap = JsonSerializer.Serialize(fields.Select(f => new
            {
                id = f.Id,
                label = new { ar = f.Label!.Ar, en = f.Label.En },
                type = f.Type ?? "text",
                required = f.Required,
            }));
            template.UpdatedAt = now;
            template.UpdatedBy = actor.UserId;
            await db.SaveChangesAsync(ct);
            return Results.Ok(await TemplateWireAsync(db, ct));
        }).WithName("SaveAgreementTemplate");

        agreements.MapGet("/", async (
            string? search,
            string? status,
            string? milestone,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var offsets = await ReminderOffsetsAsync(db, ct);
            var rows = await LoadLifecycleRowsAsync(db, ct);
            var now = DateTime.UtcNow;

            var summaries = rows
                .Select(r => Summarize(r.Agreement, r.TrainerName, r.Services, offsets, now))
                .ToList();
            var filtered = summaries.Where(s =>
                    (string.IsNullOrWhiteSpace(search)
                        || s.TrainerName.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase)
                        || s.Reference.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase))
                    && (string.IsNullOrWhiteSpace(status) || s.Status == status)
                    && MilestoneMatches(s, milestone))
                .ToList();

            return Results.Ok(new AgreementListWire(
                filtered,
                filtered.Count,
                summaries.Count(s => s.ExpiryMilestone.Kind != "none"),
                offsets));
        }).WithName("Agreements")
            .RequireFeature("F-0302");

        agreements.MapGet("/{id}", async (
            string id, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var detail = await BuildDetailAsync(id, db, ct);
            return detail is null
                ? Results.Problem(statusCode: 404, detail: "Agreement not found.")
                : Results.Ok(detail);
        }).WithName("AgreementLifecycleDetail")
            .RequireFeature("F-0302");

        agreements.MapPost("/{id}/lifecycle", async (
            string id,
            LifecycleInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(id, out var agreementId))
            {
                return Results.Problem(statusCode: 404, detail: "Agreement not found.");
            }
            var row = await db.Agreements.FirstOrDefaultAsync(
                a => a.AgreementId == agreementId, ct);
            if (row is null || !IsLifecycleStatus(row))
            {
                return Results.Problem(statusCode: 404, detail: "Agreement not found.");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;
            var effective = EffectiveStatus(row, now);
            var kind = input.Kind ?? string.Empty;

            // Two features, not one: F-0303 التجديد الإداري is the renewal,
            // F-0304 ضبط حالة الاتفاقية is suspending/reactivating/ending —
            // so a role may hold one without the other.
            var required = kind == "renew" ? "F-0303" : "F-0304";
            if (!await FeatureAuthorization.HasFeatureAsync(db, actor.UserId, required, ct))
            {
                return Results.Problem(
                    statusCode: 403,
                    detail: $"This action requires the '{required}' permission.");
            }
            var allowed = effective switch
            {
                AgreementStatuses.Active => ActiveActions,
                AgreementStatuses.Suspended => SuspendedActions,
                AgreementStatuses.Expired => ExpiredActions,
                _ => NoActions,
            };
            if (!allowed.Contains(kind))
            {
                return Results.Problem(statusCode: 409, detail: "Action not allowed in this state.");
            }

            // The claim: the row must still be what this request read. Two
            // copies of one click both read the same state; the second finds
            // it moved and is told 409. A renewal may be applied twice ON
            // PURPOSE (owner ruling, 2026-10-05) — a deliberate second one
            // reads the renewed row first, so it matches and goes through.
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            var claimed = await db.Agreements
                .Where(a => a.AgreementId == row.AgreementId
                    && a.Status == row.Status
                    && a.EndsAt == row.EndsAt
                    && a.RenewalCount == row.RenewalCount)
                .ExecuteUpdateAsync(set => set.SetProperty(a => a.RenewalCount, a => a.RenewalCount), ct);
            if (claimed == 0)
            {
                await transaction.RollbackAsync(ct);
                return Results.Problem(statusCode: 409, detail: "Already changed.");
            }

            switch (kind)
            {
                case "renew":
                {
                    // BR-0302 / D-07 — three years, decided HERE; renewal
                    // never routes back through screening (BR-0304).
                    var baseDate = row.EndsAt is { } ends && ends > now ? ends : now;
                    row.TermYears = 3;
                    row.EndsAt = baseDate.AddYears(3);
                    row.RenewalCount += 1;
                    row.Status = AgreementStatuses.Active;
                    AgreementEndpoints.LogEvent(
                        db, row.AgreementId, "renewed", actor.UserId, now, input.Note, 3);

                    // J-12/F2/AC-3 — the trainer is told, with the new term.
                    await dispatcher.RaiseAsync(
                        "EV-0304",
                        new NotificationEventContext(
                            SourceEntityId: row.AgreementId,
                            RecordSubjectUserId: row.TrainerUserId,
                            ActingStaffUserId: actor.UserId),
                        new Dictionary<string, string>
                        {
                            ["agreementDuration"] = "3",
                            ["agreementEndDate"] = row.EndsAt.Value
                                .ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture),
                        },
                        ct);
                    break;
                }
                case "suspend":
                    row.Status = AgreementStatuses.Suspended;
                    AgreementEndpoints.LogEvent(
                        db, row.AgreementId, "suspended", actor.UserId, now, input.Note);
                    break;
                case "reactivate":
                    row.Status = AgreementStatuses.Active;
                    AgreementEndpoints.LogEvent(
                        db, row.AgreementId, "reactivated", actor.UserId, now, input.Note);
                    break;
                default:
                    row.Status = AgreementStatuses.Ended;
                    AgreementEndpoints.LogEvent(
                        db, row.AgreementId, "ended", actor.UserId, now, input.Note);
                    break;
            }
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return Results.Ok(await BuildDetailAsync(id, db, ct));
        }).WithName("AgreementLifecycleAction");

        return v1;
    }

    /* ── assembly ──────────────────────────────────────────────────────────── */

    private static bool IsLifecycleStatus(Agreement row) =>
        row.Status is AgreementStatuses.Active or AgreementStatuses.Suspended
            or AgreementStatuses.Ended;

    /// <summary>`expired` is a fact about the calendar, derived on read.</summary>
    private static string EffectiveStatus(Agreement row, DateTime nowUtc) =>
        row.Status == AgreementStatuses.Active && row.EndsAt is { } ends && ends < nowUtc
            ? AgreementStatuses.Expired
            : row.Status;

    private static async Task<IReadOnlyList<int>> ReminderOffsetsAsync(
        ExpertHubDbContext db, CancellationToken ct)
    {
        var sla = await db.SlaMatrix.FirstOrDefaultAsync(r => r.SlaId == "SLA-0301", ct);
        return sla?.ReminderOffsets is null
            ? []
            : JsonSerializer.Deserialize<int[]>(sla.ReminderOffsets) ?? [];
    }

    private static async Task<List<(Agreement Agreement, string TrainerName, IReadOnlyList<string> Services)>>
        LoadLifecycleRowsAsync(ExpertHubDbContext db, CancellationToken ct)
    {
        var rows = await (
            from agreement in db.Agreements
            join user in db.Users on agreement.TrainerUserId equals user.UserId
            where agreement.Status == AgreementStatuses.Active
                || agreement.Status == AgreementStatuses.Suspended
                || agreement.Status == AgreementStatuses.Ended
            orderby agreement.EndsAt
            select new { agreement, user.FullNameAr }).ToListAsync(ct);
        var services = await db.AgreementServices.ToListAsync(ct);
        return [.. rows.Select(r => (
            r.agreement,
            r.FullNameAr,
            (IReadOnlyList<string>)[.. services
                .Where(s => s.AgreementId == r.agreement.AgreementId)
                .Select(s => s.Service)]))];
    }

    /// <summary>`reminderMilestoneFor`, the server's copy: the TIGHTEST
    /// reached offset wins; past expiry is `expired`.</summary>
    private static ExpiryMilestoneWire Milestone(
        int daysRemaining, IReadOnlyList<int> offsets)
    {
        if (daysRemaining < 0)
        {
            return new ExpiryMilestoneWire("expired", null);
        }
        var reached = offsets.OrderBy(o => o).FirstOrDefault(o => daysRemaining <= o, 0);
        return reached == 0
            ? new ExpiryMilestoneWire("none", null)
            : new ExpiryMilestoneWire("reminder", reached);
    }

    private static AgreementSummaryLifecycleWire Summarize(
        Agreement row,
        string trainerName,
        IReadOnlyList<string> services,
        IReadOnlyList<int> offsets,
        DateTime nowUtc)
    {
        var daysToExpiry = row.EndsAt is { } ends
            ? (int)Math.Floor((ends - nowUtc).TotalDays)
            : 0;
        var effective = EffectiveStatus(row, nowUtc);
        return new AgreementSummaryLifecycleWire(
            row.AgreementId.ToString(),
            row.Reference,
            row.TrainerUserId.ToString(),
            trainerName,
            services,
            effective,
            row.StartsAt is { } starts ? ApplicationEndpoints.Iso(starts) : string.Empty,
            row.EndsAt is { } endsAt ? ApplicationEndpoints.Iso(endsAt) : string.Empty,
            effective is AgreementStatuses.Ended
                ? new ExpiryMilestoneWire("none", null)
                : Milestone(daysToExpiry, offsets),
            daysToExpiry,
            row.RenewalCount);
    }

    private static bool MilestoneMatches(AgreementSummaryLifecycleWire s, string? milestone)
    {
        if (string.IsNullOrWhiteSpace(milestone))
        {
            return true;
        }
        return milestone switch
        {
            "expired" => s.ExpiryMilestone.Kind == "expired",
            _ => s.ExpiryMilestone.Kind == "reminder"
                && s.ExpiryMilestone.DaysBefore?.ToString(
                    System.Globalization.CultureInfo.InvariantCulture) == milestone,
        };
    }

    private static async Task<LifecycleDetailWire?> BuildDetailAsync(
        string id, ExpertHubDbContext db, CancellationToken ct)
    {
        if (!Guid.TryParse(id, out var agreementId))
        {
            return null;
        }
        var row = await db.Agreements.FirstOrDefaultAsync(a => a.AgreementId == agreementId, ct);
        if (row is null || !IsLifecycleStatus(row))
        {
            return null;
        }
        var trainer = await db.Users.SingleAsync(u => u.UserId == row.TrainerUserId, ct);
        var services = await db.AgreementServices
            .Where(s => s.AgreementId == row.AgreementId)
            .Select(s => s.Service)
            .ToListAsync(ct);
        var offsets = await ReminderOffsetsAsync(db, ct);
        var now = DateTime.UtcNow;
        var summary = Summarize(row, trainer.FullNameAr, services, offsets, now);

        var events = await (
            from e in db.AgreementEvents
            join actor in db.Users on e.ActorUserId equals actor.UserId
            where e.AgreementId == row.AgreementId
                && (e.Kind == "activated" || e.Kind == "renewed" || e.Kind == "suspended"
                    || e.Kind == "reactivated" || e.Kind == "ended")
            orderby e.OccurredAt descending
            select new { e, actor.FullNameAr }).ToListAsync(ct);

        var renewBase = row.EndsAt is { } ends && ends > now ? ends : now;
        var effective = summary.Status;
        return new LifecycleDetailWire(
            summary.Id, summary.Reference, summary.TrainerId, summary.TrainerName,
            summary.Services, summary.Status, summary.StartsAt, summary.EndsAt,
            summary.ExpiryMilestone, summary.DaysToExpiry, summary.RenewalCount,
            // BR-0302 — a renewal is always the 3-year term; served, never typed.
            NextTermYears: 3,
            ApplicationEndpoints.Iso(renewBase.AddYears(3)),
            [.. events.Select(x => new HistoryEntryWire(
                x.e.EventId.ToString(), x.e.Kind, ApplicationEndpoints.Iso(x.e.OccurredAt),
                x.FullNameAr, x.e.Note, x.e.TermYears))],
            DocumentUrl: null, // G26
            new LifecycleViewerWire(
                CanRenew: effective is AgreementStatuses.Active or AgreementStatuses.Expired,
                CanSuspend: effective is AgreementStatuses.Active,
                CanEnd: effective is AgreementStatuses.Active or AgreementStatuses.Suspended,
                CanReactivate: effective is AgreementStatuses.Suspended));
    }

    private static async Task<AgreementTemplateWire> TemplateWireAsync(
        ExpertHubDbContext db, CancellationToken ct)
    {
        var template = await db.AgreementTemplates.SingleAsync(t => t.IsActive, ct);
        var updater = template.UpdatedBy is { } updatedBy
            ? await db.Users.FirstOrDefaultAsync(u => u.UserId == updatedBy, ct)
            : null;
        return new AgreementTemplateWire(
            template.TemplateId.ToString(),
            template.Name,
            JsonSerializer.Deserialize<string[]>(template.Services) ?? [],
            template.BodyText,
            [.. AgreementEndpoints.ParseFields(template.FieldMap).Select(f =>
                new TemplateFieldWire(
                    f.Id,
                    new ServiceRequests.LocalizedTextWire(f.Label.Ar, f.Label.En),
                    f.Type,
                    f.Required))],
            ApplicationEndpoints.Iso(template.UpdatedAt),
            updater?.FullNameAr ?? "النظام");
    }
}
