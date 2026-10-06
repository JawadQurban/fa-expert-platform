using System.Text.Json;
using System.Text.RegularExpressions;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Infrastructure.Notifications;

/// <summary>
/// What the event was about — supplied by the capability that raises it.
/// This is context, not routing: naming the record's subject is not choosing
/// a recipient (`BR-0703` — CAP-07 alone decides who is notified, by
/// resolving the matrix row's audience against this context and the role
/// tables).
/// </summary>
public sealed record NotificationEventContext(
    Guid? SourceEntityId = null,
    Guid? RecordSubjectUserId = null,
    Guid? ActingStaffUserId = null);

/// <summary>What a raise produced. An unrouted or paused event produces
/// nothing — which, while `DM-GAP-08` keeps every row unrouted, is the
/// correct amount.</summary>
public sealed record DispatchOutcome(bool Routed, int RecipientCount);

/// <summary>
/// CAP-07's dispatcher — the only way a notification comes into being.
/// A capability calls <see cref="RaiseAsync"/> with an event code and its
/// context and knows nothing else (`BR-0703`): the matrix row supplies the
/// audience and the approved template (`BR-0701`), the recipient's
/// primary-language field picks the one language of the send (`BR-0707`),
/// and both channels fire together (`BR-0702`) — the in-platform entry lands
/// in `NOTIFICATION_LOG` at once, the email rides BE-04's outbox through
/// INT-04 and writes its own log row when the send resolves, so one channel
/// can fail while the other succeeded.
/// </summary>
/// <remarks>
/// Stage-only, like <see cref="IntegrationHub"/>: nothing is saved here. The
/// caller commits the raise together with the business change it announces in
/// one <c>SaveChanges</c>, so a notification can never describe a change that
/// failed to commit.
/// </remarks>
public sealed partial class NotificationDispatcher
{
    private readonly ExpertHubDbContext _db;
    private readonly IntegrationHub _hub;

    public NotificationDispatcher(ExpertHubDbContext db, IntegrationHub hub)
    {
        _db = db;
        _hub = hub;
    }

    public Task<DispatchOutcome> RaiseAsync(
        string eventCode,
        NotificationEventContext context,
        IReadOnlyDictionary<string, string> placeholderValues,
        CancellationToken cancellationToken = default) =>
        RaiseCoreAsync(eventCode, context, placeholderValues, dedupeKey: null, cancellationToken);

    /// <summary>
    /// Raises once per <paramref name="dedupeKey"/> — a reminder's identity
    /// (entity + reminder type + threshold). Returns null when that key was
    /// already raised, staged or stored, so re-running a reminder job is safe.
    /// </summary>
    public async Task<DispatchOutcome?> RaiseOnceAsync(
        string eventCode,
        NotificationEventContext context,
        IReadOnlyDictionary<string, string> placeholderValues,
        string dedupeKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(dedupeKey);
        if (_db.StagedNotificationOccurrences.Any(o => o.DedupeKey == dedupeKey)
            || await _db.NotificationOccurrences
                .AnyAsync(o => o.DedupeKey == dedupeKey, cancellationToken)
                .ConfigureAwait(false))
        {
            return null;
        }
        return await RaiseCoreAsync(eventCode, context, placeholderValues, dedupeKey, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<DispatchOutcome> RaiseCoreAsync(
        string eventCode,
        NotificationEventContext context,
        IReadOnlyDictionary<string, string> placeholderValues,
        string? dedupeKey,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(placeholderValues);

        // GENERATION, before routing decides anything: the event is recorded
        // whether or not anyone is routed to receive it (J-25).
        var occurrence = new NotificationOccurrence
        {
            OccurrenceId = Guid.NewGuid(),
            EventCode = eventCode,
            SourceEntityId = context.SourceEntityId,
            RecordSubjectUserId = context.RecordSubjectUserId,
            ActingStaffUserId = context.ActingStaffUserId,
            Placeholders = JsonSerializer.Serialize(placeholderValues),
            RoutingStatus = NotificationRoutingStatuses.Unrouted,
            DedupeKey = dedupeKey,
            RaisedAt = DateTime.UtcNow,
        };
        _db.AppendNotificationOccurrence(occurrence);

        var row = await _db.NotificationMatrixRows
            .FirstOrDefaultAsync(r => r.EventCode == eventCode, cancellationToken)
            .ConfigureAwait(false);
        if (row is null || !row.IsActive)
        {
            return new DispatchOutcome(Routed: false, RecipientCount: 0);
        }

        var template = await _db.NotificationTemplates
            .FirstAsync(t => t.TemplateId == row.TemplateId, cancellationToken)
            .ConfigureAwait(false);
        if (!string.Equals(template.Status, TemplateStatuses.Approved, StringComparison.Ordinal))
        {
            // Unreachable through the endpoints (editing unroutes), and held
            // here too: a draft never reaches a recipient (BR-0701).
            return new DispatchOutcome(Routed: false, RecipientCount: 0);
        }

        var recipients = await ResolveAudienceAsync(row.Audience, context, cancellationToken)
            .ConfigureAwait(false);
        var now = DateTime.UtcNow;
        foreach (var recipient in recipients)
        {
            var language =
                string.Equals(recipient.PreferredCommunicationLanguage, "en", StringComparison.OrdinalIgnoreCase)
                    ? "en"
                    : "ar";
            var values = new Dictionary<string, string>(placeholderValues, StringComparer.Ordinal)
            {
                // The one placeholder the dispatcher owns: who is being addressed.
                ["recipientName"] = language == "en" ? recipient.FullNameEn : recipient.FullNameAr,
            };
            var subject = Render(language == "en" ? template.SubjectEn : template.SubjectAr, values);
            var body = Render(language == "en" ? template.BodyEn : template.BodyAr, values);

            // BR-0702, channel 1 — the in-platform notification IS this row.
            _db.AppendNotificationLog(new NotificationLogEntry
            {
                LogId = Guid.NewGuid(),
                EventCode = eventCode,
                RecipientUserId = recipient.UserId,
                Channel = NotificationChannels.InPlatform,
                Language = language,
                TemplateCode = template.Code,
                TemplateVersion = template.Version,
                SendStatus = SendStatuses.Success,
                SourceEntityId = context.SourceEntityId,
                SentAt = now,
                OccurrenceId = occurrence.OccurrenceId,
                Subject = subject,
                Body = body,
            });

            // BR-0702, channel 2 — the email rides the outbox (BE-04), so a
            // gateway outage means queued-and-retried, never lost. Its log
            // row is written when the send actually resolves.
            var dispatch = new EmailDispatch(
                eventCode,
                recipient.UserId,
                recipient.Email,
                language,
                template.Code,
                template.Version,
                subject,
                body,
                context.SourceEntityId);
            await _hub.EnqueueOutboundAsync(
                    IntegrationSystems.EmailGateway,
                    "notification_message",
                    "NOTIFICATION",
                    Guid.NewGuid(),
                    entityVersion: 1,
                    operation: "send",
                    JsonSerializer.Serialize(dispatch, EmailDispatch.PayloadOptions),
                    cancellationToken)
                .ConfigureAwait(false);
        }

        occurrence.RoutingStatus = NotificationRoutingStatuses.Routed;
        occurrence.RecipientCount = recipients.Count;
        return new DispatchOutcome(Routed: true, RecipientCount: recipients.Count);
    }

    /// <summary>
    /// The matrix row's audience codes, resolved to people: the two
    /// relationship targets come from the event's context, the six role codes
    /// from `USER_ROLE` — CAP-07 doing the deciding (`BR-0703`).
    /// </summary>
    private async Task<IReadOnlyList<AppUser>> ResolveAudienceAsync(
        string audienceJson,
        NotificationEventContext context,
        CancellationToken cancellationToken)
    {
        var audiences = JsonSerializer.Deserialize<string[]>(audienceJson) ?? [];
        var userIds = new HashSet<Guid>();
        var roleAudiences = new List<RoleCode>();
        foreach (var audience in audiences)
        {
            if (string.Equals(audience, AudienceCodes.RecordSubject, StringComparison.Ordinal))
            {
                if (context.RecordSubjectUserId is { } subject)
                {
                    userIds.Add(subject);
                }
            }
            else if (string.Equals(audience, AudienceCodes.ActingStaff, StringComparison.Ordinal))
            {
                if (context.ActingStaffUserId is { } actor)
                {
                    userIds.Add(actor);
                }
            }
            else if (RoleCodes.TryParse(audience, out var role))
            {
                roleAudiences.Add(role);
            }
        }

        if (roleAudiences.Count > 0)
        {
            var holders = await _db.UserRoles
                .Join(_db.Roles, ur => ur.RoleId, r => r.RoleId, (ur, r) => new { ur.UserId, r.Code })
                .Where(x => roleAudiences.Contains(x.Code))
                .Select(x => x.UserId)
                .Distinct()
                .ToListAsync(cancellationToken)
                .ConfigureAwait(false);
            foreach (var id in holders)
            {
                userIds.Add(id);
            }
        }

        if (userIds.Count == 0)
        {
            return [];
        }

        return await _db.Users
            .Where(u => userIds.Contains(u.UserId) && u.IsActive)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>`{{name}}` substitution — the editor's own syntax
    /// (`notification.types.ts`). An unknown token stays literal rather than
    /// vanishing: visible in the log beats silently missing.</summary>
    internal static string Render(string text, IReadOnlyDictionary<string, string> values) =>
        PlaceholderPattern().Replace(
            text,
            match => values.TryGetValue(match.Groups[1].Value, out var value) ? value : match.Value);

    [GeneratedRegex(@"\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}")]
    private static partial Regex PlaceholderPattern();
}
