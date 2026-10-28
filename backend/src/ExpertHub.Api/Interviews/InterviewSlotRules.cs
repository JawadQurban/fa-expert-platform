namespace ExpertHub.Api.Interviews;

/// <summary>
/// The one rule for a proposed interview time, held in one place for both
/// places a time is chosen: the screening decision (J-05/F5/AC-3) and a staff
/// reschedule (J-06/F4).
/// </summary>
/// <remarks>
/// BUG-056 — a slot could be proposed for the current hour, so the applicant
/// was asked to confirm an interview that was already starting and the panel
/// had no time to prepare or to receive the invitation. The UAT ruling: «على ان
/// يكن شرط جدولة المقابلة بعد ساعة من الوقت الحالي» — a slot starts at least one
/// hour after now. The picker's <c>min</c> and the inline error are
/// conveniences; this is the rule.
/// </remarks>
internal static class InterviewSlotRules
{
    /// <summary>How far ahead of now the earliest proposable slot starts.</summary>
    internal static readonly TimeSpan MinimumLeadTime = TimeSpan.FromHours(1);

    /// <summary>The value could not be read as a time.</summary>
    internal const string Invalid = "slot-invalid";

    /// <summary>The time has already passed.</summary>
    internal const string InPast = "slot-in-past";

    /// <summary>The time is ahead, but less than <see cref="MinimumLeadTime"/> away.</summary>
    internal const string TooSoon = "slot-too-soon";

    /// <summary>
    /// A proposed time as the UTC instant it names. RUN-021: the reschedule
    /// parsed with <c>RoundtripKind</c>, so an offset-less value stayed
    /// <c>Unspecified</c>, was stored as written and served back as UTC —
    /// 09:00 entered, 12:00 shown in Riyadh. An offset is honoured; a value
    /// without one is taken as UTC, which is what the client sends.
    /// </summary>
    internal static DateTime? Parse(string value) =>
        DateTimeOffset.TryParse(
            value,
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AssumeUniversal,
            out var parsed)
            ? parsed.UtcDateTime
            : null;

    /// <summary>
    /// Reads every proposed time and checks it against the clock. Returns the
    /// UTC instants, or the code of the first slot that breaks the rule.
    /// </summary>
    /// <param name="values">The times as sent by the client.</param>
    /// <param name="nowUtc">The current instant, in UTC.</param>
    /// <returns>The instants, or <c>Error</c> set to one of this class's codes.</returns>
    internal static (IReadOnlyList<DateTime> Slots, string? Error) Check(
        IEnumerable<string> values, DateTime nowUtc)
    {
        ArgumentNullException.ThrowIfNull(values);
        var slots = new List<DateTime>();
        foreach (var value in values)
        {
            if (Parse(value) is not { } slot)
            {
                return ([], Invalid);
            }
            if (slot <= nowUtc)
            {
                return ([], InPast);
            }
            if (slot < nowUtc + MinimumLeadTime)
            {
                return ([], TooSoon);
            }
            slots.Add(slot);
        }
        return (slots, null);
    }
}
