namespace ExpertHub.Core.Domain;

/// <summary>
/// One raised event — `NOTIFICATION_OCCURRENCE`. Recorded on EVERY raise,
/// routed or not.
/// </summary>
/// <remarks>
/// <para>
/// Separates event GENERATION from DELIVERY (J-25). While `DM-GAP-08` keeps the
/// routing matrix unapproved, the dispatcher correctly sends nothing — and,
/// before this record, it also left no trace that anything had happened: an
/// offer lapsing or a slot running out was invisible to anyone looking later.
/// Now the occurrence is kept with its context and its routing outcome, so the
/// event exists whether or not a recipient, a template or an email gateway
/// does. Nobody is guessed as a recipient to fill the gap.
/// </para>
/// <para>
/// Append-only. <see cref="DedupeKey"/> makes a reminder idempotent: the same
/// entity, reminder type and threshold is raised once, however often the
/// reminder job runs.
/// </para>
/// </remarks>
public sealed class NotificationOccurrence
{
    public Guid OccurrenceId { get; set; }

    public required string EventCode { get; set; }

    public Guid? SourceEntityId { get; set; }

    public Guid? RecordSubjectUserId { get; set; }

    public Guid? ActingStaffUserId { get; set; }

    /// <summary>JSON map of the placeholder values supplied with the raise.</summary>
    public required string Placeholders { get; set; }

    /// <summary>A value of <see cref="NotificationRoutingStatuses"/>.</summary>
    public required string RoutingStatus { get; set; }

    public int RecipientCount { get; set; }

    /// <summary>Unique when set — a reminder's identity.</summary>
    public string? DedupeKey { get; set; }

    public DateTime RaisedAt { get; set; }
}

/// <summary>What routing made of an occurrence at the moment it was raised.</summary>
public static class NotificationRoutingStatuses
{
    /// <summary>The matrix row is inactive or its template is not approved.</summary>
    public const string Unrouted = "unrouted";

    /// <summary>Delivered to the channels for <see cref="NotificationOccurrence.RecipientCount"/> people.</summary>
    public const string Routed = "routed";
}
