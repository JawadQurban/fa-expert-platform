namespace ExpertHub.Core.Domain;

/*
 * The closed vocabularies of CAP-07 — one source each, the `RoleCodes` rule.
 * Every spelling is fixed by the frontend contract (`notification.types.ts`,
 * `shared/types/sla.ts`), not chosen here.
 */

/// <summary>§8.7.2 — two channels, always both (`BR-0702`). Used only by the
/// log: a matrix row has no channel to configure.</summary>
public static class NotificationChannels
{
    public const string Email = "email";
    public const string InPlatform = "in-platform";
}

/// <summary>`NOTIFICATION_LOG.send_status`.</summary>
public static class SendStatuses
{
    public const string Success = "success";
    public const string Failure = "failure";
}

/// <summary>A template is either a draft or approved — only an approved one
/// may be routed (`BR-0701`).</summary>
public static class TemplateStatuses
{
    public const string Draft = "draft";
    public const string Approved = "approved";
}

/// <summary>
/// Who an event may notify — `notification.types.ts` `AUDIENCE_CODES`. The
/// six role codes are §8.8.5's approved roles; the two relationship targets
/// are quoted from journeys (J-18/F2/AC-4 "the staff member who nominated",
/// J-03/F3/AC-6 the record's subject), neither being a role.
/// </summary>
public static class AudienceCodes
{
    public const string RecordSubject = "record_subject";
    public const string ActingStaff = "acting_staff";

    /// <summary>Every audience the matrix accepts, role codes included.</summary>
    public static readonly IReadOnlyList<string> All =
    [
        RecordSubject,
        ActingStaff,
        "trainer",
        "staff",
        "manager",
        "centre_coordinator",
        "system_administrator",
        "executive",
    ];
}

/// <summary>
/// The placeholder vocabulary a template body may use — `{{name}}` syntax,
/// the editor's own (`notification.types.ts`). §8.7 never enumerates the
/// placeholders: this is the set the seeded events imply, the same list the
/// frontend validates against. → `Q33`.
/// </summary>
public static class NotificationPlaceholders
{
    public static readonly IReadOnlyList<string> Known =
    [
        "recipientName",
        "trainerName",
        "serviceName",
        "referenceNumber",
        "agreementEndDate",
        "agreementDuration",
        "programName",
        "programDates",
        "slotNumber",
        "reasonText",
        "actionUrl",
        "deadlineDate",
    ];
}

/// <summary>`SLA_MATRIX_ROW.status` — the three kinds of deadline (P-150/P-151/P-156).</summary>
public static class SlaStatuses
{
    public const string Fixed = "fixed";
    public const string RecordDerived = "record-derived";
    public const string UndefinedDuration = "undefined-duration";
}

/// <summary>`SLA_MATRIX_ROW.unit` — `shared/types/sla.ts` `SLA_UNITS`.</summary>
public static class SlaUnits
{
    public const string Days = "days";
    public const string BusinessDays = "business-days";
}

/// <summary>`SLA_INSTANCE.state` — server-decided (`P-51`).</summary>
public static class SlaStates
{
    public const string Within = "within";
    public const string Approaching = "approaching";
    public const string Breached = "breached";
}
