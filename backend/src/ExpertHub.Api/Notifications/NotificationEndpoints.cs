using System.Text.Json;
using System.Text.Json.Serialization;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Notifications;

/*
 * CAP-07 — communication & notifications (BRD §8.7), behind the contract
 * `notificationService.ts` already calls:
 *
 *   GET  v1/internal/notifications/matrix
 *   POST v1/internal/notifications/matrix/{eventCode}/routing
 *   POST v1/internal/notifications/matrix/{eventCode}/active
 *   POST v1/internal/notifications/templates          (create)
 *   POST v1/internal/notifications/templates/{id}     (edit)
 *   POST v1/internal/notifications/templates/{id}/approve
 *   GET  v1/internal/notifications/log?q=&status=&channel=
 *   GET  v1/internal/sla
 *   POST v1/internal/sla/{slaId}
 *
 * What is deliberately ABSENT is again the specification: nothing here sends
 * a notification (BR-0703 — capabilities raise events, the dispatcher fires),
 * nothing creates an event, nothing carries a message body except a template
 * (BR-0701), nothing chooses a channel (BR-0702), nothing edits the log, and
 * there is NO resend (Q32 — §8.7 never defines what one does).
 *
 * ⚠️ `DM-GAP-08`: the routing CONTENTS are not seeded — every row starts
 * unrouted and `modelStatus` stays `unapproved`. ⚠️ `Q33`: no template is
 * seeded; message wording is the Academy's to write, in the template editor.
 */

/// <summary>The wire types — `notification.types.ts`, exactly.</summary>
internal sealed record EventWire(
    string EventCode, string CapabilityCode, string NameAr, string NameEn,
    string Source, string JourneyAudienceAr, string JourneyAudienceEn);

internal sealed record TemplateWire(
    string TemplateId, string Code, string SubjectAr, string SubjectEn,
    string BodyAr, string BodyEn, IReadOnlyList<string> Placeholders,
    int Version, string UpdatedAt, string UpdatedByName, string Status);

/// <summary>Only routed rows are served; the frontend's `rowFor` supplies the
/// `unrouted` default for the rest — presence is the routing.</summary>
internal sealed record MatrixRowWire(
    string Status, string EventCode, string TemplateId,
    IReadOnlyList<string> Audience, bool IsActive);

internal sealed record MatrixWire(
    IReadOnlyList<EventWire> Events,
    IReadOnlyList<MatrixRowWire> Rows,
    IReadOnlyList<TemplateWire> Templates,
    string ModelStatus,
    bool CanManageTemplates,
    IReadOnlyList<string> KnownPlaceholders);

/// <summary>The union: `failureReason` exists only on a failure.</summary>
/// <summary>One in-platform notification, as its recipient reads it.</summary>
internal sealed record InboxItemWire(
    string LogId, string EventCode, string? Subject, string? Body, string SentAt, string? SourceEntityId);

/// <summary>One raised event, routed or not (J-25 generation, not delivery).</summary>
internal sealed record OccurrenceWire(
    string OccurrenceId, string EventCode, string RoutingStatus, int RecipientCount,
    string? SourceEntityId, string RaisedAt);

internal sealed record LogWire(
    string LogId, string EventCode, string RecipientName, string Channel,
    string Language, string TemplateCode, int TemplateVersion, string SentAt,
    string SendStatus,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? FailureReason);

/// <summary>The three-member union of `shared/types/sla.ts`: the nullable
/// keys are omitted on the members that do not carry them.</summary>
internal sealed record SlaRowWire(
    string SlaId,
    string? CapabilityCode,
    string ActionCode, string NameAr, string NameEn, string Source,
    string OnBreachAr, string OnBreachEn, string Status,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] int? Duration,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Unit,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] IReadOnlyList<int>? ReminderOffsets);

internal sealed record RouteEventInputWire(string? TemplateId, IReadOnlyList<string>? Audience);

internal sealed record SetActiveInputWire(bool IsActive);

internal sealed record TemplateInputWire(
    string? Code, string? SubjectAr, string? SubjectEn, string? BodyAr, string? BodyEn);

internal sealed record SlaInputWire(
    string? Kind, int? Duration, string? Unit, IReadOnlyList<int>? ReminderOffsets);

/// <summary>The CAP-07 endpoints.</summary>
public static class NotificationEndpoints
{
    private static readonly JsonSerializerOptions PlainJson = new();

    /// <summary>Mounts under the version group; internal-role sessions only.</summary>
    public static RouteGroupBuilder MapNotificationEndpoints(this RouteGroupBuilder v1)
    {
        /*
         * J-25 — the RECIPIENT's in-platform channel. `BR-0702` makes the
         * in-platform notification a `NOTIFICATION_LOG` row; until now nothing
         * let the person it was addressed to read it. Their own rows only.
         */
        v1.MapGet("/me/notifications", async (HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var rows = await db.NotificationLog
                .Where(l => l.RecipientUserId == actor.UserId && l.Channel == NotificationChannels.InPlatform)
                .OrderByDescending(l => l.SentAt)
                .Take(100)
                .ToListAsync(ct);
            return Results.Ok(rows.Select(l => new InboxItemWire(
                l.LogId.ToString(), l.EventCode, l.Subject, l.Body, Iso(l.SentAt), l.SourceEntityId?.ToString())));
        })
            .RequireAuthorization()
            .WithName("MyNotifications");

        var notifications = v1.MapGroup("/internal/notifications")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        // Every raised event with its routing outcome — so an unrouted event
        // (the norm while `DM-GAP-08` is open) is visible rather than silent.
        notifications.MapGet("/occurrences", async (string? eventCode, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var query = db.NotificationOccurrences.AsQueryable();
            if (!string.IsNullOrWhiteSpace(eventCode))
            {
                query = query.Where(o => o.EventCode == eventCode);
            }
            var rows = await query.OrderByDescending(o => o.RaisedAt).Take(200).ToListAsync(ct);
            return Results.Ok(rows.Select(o => new OccurrenceWire(
                o.OccurrenceId.ToString(), o.EventCode, o.RoutingStatus, o.RecipientCount,
                o.SourceEntityId?.ToString(), Iso(o.RaisedAt))));
        })
            .WithName("NotificationOccurrences")
            .RequireFeature("F-0705");

        notifications.MapGet("/matrix", async (HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
            Results.Ok(await BuildMatrixAsync(http, db, ct))).WithName("NotificationMatrix")
            .RequireFeature("F-0702");

        notifications.MapPost("/matrix/{eventCode}/routing", async (
            string eventCode,
            RouteEventInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            if (!await db.NotificationEvents.AnyAsync(e => e.EventCode == eventCode, ct))
            {
                // BR-0703 — events come from capabilities; routing invents none.
                return Results.Problem(statusCode: 404, detail: "Unknown event.");
            }
            var audience = (input.Audience ?? []).Where(a => AudienceCodes.All.Contains(a)).ToList();
            if (audience.Count == 0 || string.IsNullOrWhiteSpace(input.TemplateId)
                || !Guid.TryParse(input.TemplateId, out var templateId))
            {
                return Results.Problem(statusCode: 400, detail: "Invalid routing.");
            }
            var template = await db.NotificationTemplates
                .SingleOrDefaultAsync(t => t.TemplateId == templateId, ct);
            if (template is null
                || !string.Equals(template.Status, TemplateStatuses.Approved, StringComparison.Ordinal))
            {
                // BR-0701 — a draft is not an approved template; it cannot route.
                return Results.Problem(statusCode: 400, detail: "Invalid routing.");
            }

            var row = await db.NotificationMatrixRows.SingleOrDefaultAsync(r => r.EventCode == eventCode, ct);
            if (row is null)
            {
                db.NotificationMatrixRows.Add(new NotificationMatrixRow
                {
                    RowId = Guid.NewGuid(),
                    EventCode = eventCode,
                    TemplateId = templateId,
                    Audience = JsonSerializer.Serialize(audience, PlainJson),
                    IsActive = true,
                });
            }
            else
            {
                row.TemplateId = templateId;
                row.Audience = JsonSerializer.Serialize(audience, PlainJson);
                row.IsActive = true;
            }
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildMatrixAsync(http, db, ct));
        }).WithName("RouteNotificationEvent")
            .RequireFeature("F-0702");

        notifications.MapPost("/matrix/{eventCode}/active", async (
            string eventCode,
            SetActiveInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var row = await db.NotificationMatrixRows.SingleOrDefaultAsync(r => r.EventCode == eventCode, ct);
            if (row is null)
            {
                // An unrouted row has nothing to pause — the union says as much.
                return Results.Problem(statusCode: 409, detail: "Event is not routed.");
            }
            row.IsActive = input.IsActive;
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildMatrixAsync(http, db, ct));
        }).WithName("SetNotificationRowActive")
            .RequireFeature("F-0702");

        notifications.MapPost("/templates", (
            TemplateInputWire input, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
            SaveTemplateAsync(null, input, http, db, ct)).WithName("CreateNotificationTemplate")
            .RequireFeature("F-0703");

        notifications.MapPost("/templates/{templateId}", (
            string templateId, TemplateInputWire input, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
            SaveTemplateAsync(templateId, input, http, db, ct)).WithName("EditNotificationTemplate")
            .RequireFeature("F-0703");

        notifications.MapPost("/templates/{templateId}/approve", async (
            string templateId,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (!await ActorResolution.HoldsRoleAsync(db, actor.UserId, RoleCode.SystemAdministrator, ct))
            {
                return Results.Problem(statusCode: 403, detail: "Not permitted.");
            }
            if (!Guid.TryParse(templateId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Template not found.");
            }
            var template = await db.NotificationTemplates.SingleOrDefaultAsync(t => t.TemplateId == id, ct);
            if (template is null)
            {
                return Results.Problem(statusCode: 404, detail: "Template not found.");
            }
            if (string.IsNullOrWhiteSpace(template.Code)
                || string.IsNullOrWhiteSpace(template.SubjectAr)
                || string.IsNullOrWhiteSpace(template.SubjectEn)
                || string.IsNullOrWhiteSpace(template.BodyAr)
                || string.IsNullOrWhiteSpace(template.BodyEn))
            {
                // BR-0701 — both languages, complete, before approval: a
                // half-translated template would send the wrong language
                // (BR-0707) or nothing at all.
                return Results.Problem(statusCode: 400, detail: "Template is incomplete.");
            }
            template.Status = TemplateStatuses.Approved;
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildMatrixAsync(http, db, ct));
        }).WithName("ApproveNotificationTemplate")
            .RequireFeature("F-0703");

        notifications.MapGet("/log", async (
            string? q,
            string? status,
            string? channel,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var query =
                from entry in db.NotificationLog
                join user in db.Users on entry.RecipientUserId equals user.UserId
                select new { entry, user.FullNameAr };
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(x => x.entry.SendStatus == status);
            }
            if (!string.IsNullOrWhiteSpace(channel))
            {
                query = query.Where(x => x.entry.Channel == channel);
            }
            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                query = query.Where(x =>
                    x.FullNameAr.Contains(term)
                    || x.entry.EventCode.Contains(term)
                    || x.entry.TemplateCode.Contains(term));
            }
            var entries = await query
                .OrderByDescending(x => x.entry.SentAt)
                .Take(200)
                .ToListAsync(ct);
            return Results.Ok(entries.Select(x => new LogWire(
                x.entry.LogId.ToString(),
                x.entry.EventCode,
                x.FullNameAr,
                x.entry.Channel,
                x.entry.Language,
                x.entry.TemplateCode,
                x.entry.TemplateVersion,
                Iso(x.entry.SentAt),
                x.entry.SendStatus,
                x.entry.FailureReason)));
        }).WithName("NotificationLog")
            .RequireFeature("F-0705");

        /*
         * The SLA console — not under `/notifications`: a deadline is not a
         * notification, even though §8.7 puts both screens in the same hands.
         */
        var sla = v1.MapGroup("/internal/sla")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        sla.MapGet("/", async (ExpertHubDbContext db, CancellationToken ct) =>
            Results.Ok(await ListSlaAsync(db, ct))).WithName("SlaMatrix")
            .RequireFeature("F-0704");

        sla.MapPost("/{slaId}", async (
            string slaId,
            SlaInputWire input,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var offsets = input.ReminderOffsets ?? [];
            if (offsets.Any(offset => offset <= 0))
            {
                return Results.Problem(statusCode: 400, detail: "Invalid deadline.");
            }
            var isFixed = string.Equals(input.Kind, "fixed", StringComparison.Ordinal);
            if (isFixed)
            {
                if (input.Duration is not > 0
                    || (input.Unit != SlaUnits.Days && input.Unit != SlaUnits.BusinessDays)
                    || offsets.Any(offset => offset >= input.Duration))
                {
                    // Mirrors `validateSla`: a reminder at or beyond the
                    // deadline is not a reminder.
                    return Results.Problem(statusCode: 400, detail: "Invalid deadline.");
                }
            }
            else if (!string.Equals(input.Kind, "reminders-only", StringComparison.Ordinal))
            {
                return Results.Problem(statusCode: 400, detail: "Invalid deadline.");
            }

            var row = await db.SlaMatrix.SingleOrDefaultAsync(r => r.SlaId == slaId, ct);
            if (row is null)
            {
                return Results.Problem(statusCode: 404, detail: "SLA row not found.");
            }

            // BR-0705 — the one write path for every deadline in the product.
            row.Status = isFixed ? SlaStatuses.Fixed : SlaStatuses.RecordDerived;
            row.Duration = isFixed ? input.Duration : null;
            row.Unit = isFixed ? input.Unit : null;
            row.ReminderOffsets = JsonSerializer.Serialize(offsets, PlainJson);
            await db.SaveChangesAsync(ct);
            return Results.Ok(await ListSlaAsync(db, ct));
        }).WithName("SetSla")
            .RequireFeature("F-0704");

        return v1;
    }

    /// <summary>
    /// `saveTemplate` for both create and edit. `BR-0704` — System
    /// Administrator only, decided here from `USER_ROLE`, never from a claim.
    /// Editing returns the template to draft and unroutes its rows: the
    /// approval was of the wording, and the wording changed.
    /// </summary>
    private static async Task<IResult> SaveTemplateAsync(
        string? templateId,
        TemplateInputWire input,
        HttpContext http,
        ExpertHubDbContext db,
        CancellationToken ct)
    {
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        if (!await ActorResolution.HoldsRoleAsync(db, actor.UserId, RoleCode.SystemAdministrator, ct))
        {
            return Results.Problem(statusCode: 403, detail: "Not permitted.");
        }
        var code = input.Code?.Trim() ?? string.Empty;
        if (code.Length == 0)
        {
            return Results.Problem(statusCode: 400, detail: "Template code is required.");
        }
        var used = PlaceholdersUsed(input.BodyAr ?? string.Empty)
            .Union(PlaceholdersUsed(input.BodyEn ?? string.Empty), StringComparer.Ordinal)
            .ToList();
        if (used.Any(name => !NotificationPlaceholders.Known.Contains(name)))
        {
            // BR-0701's outer edge: even a template may only speak in the
            // served placeholder vocabulary (Q33).
            return Results.Problem(statusCode: 400, detail: "Unknown placeholder.");
        }

        NotificationTemplate? existing = null;
        if (templateId is not null)
        {
            if (!Guid.TryParse(templateId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Template not found.");
            }
            existing = await db.NotificationTemplates.SingleOrDefaultAsync(t => t.TemplateId == id, ct);
            if (existing is null)
            {
                return Results.Problem(statusCode: 404, detail: "Template not found.");
            }
        }

        var target = existing;
        if (target is null)
        {
            target = new NotificationTemplate
            {
                TemplateId = Guid.NewGuid(),
                Code = code,
                SubjectAr = input.SubjectAr ?? string.Empty,
                SubjectEn = input.SubjectEn ?? string.Empty,
                BodyAr = input.BodyAr ?? string.Empty,
                BodyEn = input.BodyEn ?? string.Empty,
                Placeholders = JsonSerializer.Serialize(used, PlainJson),
                Version = 1,
                Status = TemplateStatuses.Draft,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = actor.UserId,
            };
            db.NotificationTemplates.Add(target);
        }
        else
        {
            target.Code = code;
            target.SubjectAr = input.SubjectAr ?? string.Empty;
            target.SubjectEn = input.SubjectEn ?? string.Empty;
            target.BodyAr = input.BodyAr ?? string.Empty;
            target.BodyEn = input.BodyEn ?? string.Empty;
            target.Placeholders = JsonSerializer.Serialize(used, PlainJson);
            target.Version += 1;
            target.Status = TemplateStatuses.Draft;
            target.UpdatedAt = DateTime.UtcNow;
            target.UpdatedBy = actor.UserId;

            // A row pointing at a template that just left approval is no
            // longer routable — it returns to unrouted, not to a draft.
            var routed = await db.NotificationMatrixRows
                .Where(r => r.TemplateId == target.TemplateId)
                .ToListAsync(ct);
            db.NotificationMatrixRows.RemoveRange(routed);
        }
        await db.SaveChangesAsync(ct);
        return Results.Ok(await BuildMatrixAsync(http, db, ct));
    }

    private static async Task<MatrixWire> BuildMatrixAsync(
        HttpContext http,
        ExpertHubDbContext db,
        CancellationToken ct)
    {
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        var canManage = await ActorResolution.HoldsRoleAsync(
            db, actor.UserId, RoleCode.SystemAdministrator, ct);

        var events = await db.NotificationEvents.OrderBy(e => e.EventCode).ToListAsync(ct);
        var rows = await db.NotificationMatrixRows.OrderBy(r => r.EventCode).ToListAsync(ct);
        var templates = await (
            from template in db.NotificationTemplates
            join user in db.Users on template.UpdatedBy equals user.UserId
            orderby template.Code
            select new { template, user.FullNameAr }).ToListAsync(ct);

        return new MatrixWire(
            events.Select(e => new EventWire(
                e.EventCode, e.CapabilityCode, e.NameAr, e.NameEn,
                e.Source, e.JourneyAudienceAr, e.JourneyAudienceEn)).ToList(),
            rows.Select(r => new MatrixRowWire(
                "routed",
                r.EventCode,
                r.TemplateId.ToString(),
                JsonSerializer.Deserialize<string[]>(r.Audience) ?? [],
                r.IsActive)).ToList(),
            templates.Select(x => new TemplateWire(
                x.template.TemplateId.ToString(),
                x.template.Code,
                x.template.SubjectAr,
                x.template.SubjectEn,
                x.template.BodyAr,
                x.template.BodyEn,
                JsonSerializer.Deserialize<string[]>(x.template.Placeholders) ?? [],
                x.template.Version,
                Iso(x.template.UpdatedAt),
                x.FullNameAr,
                x.template.Status)).ToList(),
            // DM-GAP-08 — the approved routing does not exist; the matrix is a
            // working draft and says so (the same handling as DM-GAP-07).
            ModelStatus: "unapproved",
            CanManageTemplates: canManage,
            KnownPlaceholders: NotificationPlaceholders.Known);
    }

    private static async Task<IReadOnlyList<SlaRowWire>> ListSlaAsync(
        ExpertHubDbContext db,
        CancellationToken ct)
    {
        var rows = await db.SlaMatrix.OrderBy(r => r.SortOrder).ToListAsync(ct);
        return rows.Select(r => new SlaRowWire(
            r.SlaId,
            r.CapabilityCode,
            r.ActionCode, r.NameAr, r.NameEn, r.Source,
            r.OnBreachAr, r.OnBreachEn, r.Status,
            r.Duration,
            r.Unit,
            r.ReminderOffsets is null
                ? null
                : JsonSerializer.Deserialize<int[]>(r.ReminderOffsets))).ToList();
    }

    private static IEnumerable<string> PlaceholdersUsed(string text)
    {
        foreach (System.Text.RegularExpressions.Match match in
            System.Text.RegularExpressions.Regex.Matches(
                text, @"\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}"))
        {
            yield return match.Groups[1].Value;
        }
    }

    private static string Iso(DateTime utc) =>
        new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc)).ToString(
            "yyyy-MM-dd'T'HH:mm:ss'Z'", System.Globalization.CultureInfo.InvariantCulture);
}
