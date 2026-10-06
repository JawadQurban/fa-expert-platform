namespace ExpertHub.Core.Domain;

/// <summary>
/// One event a capability raises — `NOTIFICATION_EVENT`, `10` §3.9. Declared
/// by the capability, routed by CAP-07 (`BR-0703`): there is no create-event
/// operation anywhere, and the twenty seeded rows are the events the built
/// journeys name, each with its citation (`P-146`). An event with no citation
/// is an invented event.
/// </summary>
public sealed class NotificationEvent
{
    public required string EventCode { get; set; }

    /// <summary>`CAP-01` … `CAP-12` — the capability that raises it.</summary>
    public required string CapabilityCode { get; set; }

    public required string NameAr { get; set; }

    public required string NameEn { get; set; }

    /// <summary>Where the event is stated, e.g. `J-18/F2/AC-4`. Never blank —
    /// the playbook's rule that this column must survive into the database.</summary>
    public required string Source { get; set; }

    /// <summary>The journey's own words about who is notified — evidence for
    /// routing the event, not the routing itself (that is `DM-GAP-08`).</summary>
    public required string JourneyAudienceAr { get; set; }

    public required string JourneyAudienceEn { get; set; }
}
