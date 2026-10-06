namespace ExpertHub.Core.Domain;

/// <summary>
/// One actual send on one channel — `NOTIFICATION_LOG`, `10` §3.9.
/// Append-only: the log records what happened, and `US-0705` wants failures
/// visible with their reason so they can be followed up — never edited away.
/// </summary>
/// <remarks>
/// `BR-0702` means one event produces one row per channel, and one channel
/// can fail while the other succeeds. `BR-0707`: <see cref="Language"/> is a
/// single locale, chosen from the recipient's primary-language field — the
/// template is bilingual, the send is not. <see cref="TemplateVersion"/> is
/// the version actually rendered, so editing a template never rewrites the
/// history of what people received.
/// </remarks>
public sealed class NotificationLogEntry
{
    public Guid LogId { get; set; }

    public required string EventCode { get; set; }

    public Guid RecipientUserId { get; set; }

    /// <summary>A value of <see cref="NotificationChannels"/>.</summary>
    public required string Channel { get; set; }

    /// <summary>`ar` or `en` — one language per send (`BR-0707`).</summary>
    public required string Language { get; set; }

    public required string TemplateCode { get; set; }

    public int TemplateVersion { get; set; }

    /// <summary>A value of <see cref="SendStatuses"/>.</summary>
    public required string SendStatus { get; set; }

    /// <summary>Never empty on a failure — the whole point of `US-0705`.</summary>
    public string? FailureReason { get; set; }

    /// <summary>The business record the event was about, when there is one.</summary>
    public Guid? SourceEntityId { get; set; }

    public DateTime SentAt { get; set; }

    /// <summary>The occurrence this send came from (null on rows written
    /// before occurrences were recorded).</summary>
    public Guid? OccurrenceId { get; set; }

    /// <summary>In-platform rows only: the rendered subject the recipient's
    /// inbox shows — kept as sent, so a later template edit never rewrites what
    /// somebody received.</summary>
    public string? Subject { get; set; }

    /// <summary>In-platform rows only: the rendered body, as sent.</summary>
    public string? Body { get; set; }
}
