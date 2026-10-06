namespace ExpertHub.Infrastructure.Applications;

/// <summary>
/// The server's business-day arithmetic (`P-51` — the frontend must never
/// approximate it). Weekend = Friday + Saturday; ⚠️ public holidays are an
/// infrastructure ask (the Academy calendar) and are not yet subtracted —
/// recorded, not hidden.
/// </summary>
public static class BusinessCalendar
{
    /// <summary>
    /// ⚠️ The weekend is a fact about Riyadh, not about UTC.
    /// </summary>
    /// <remarks>
    /// Counting weekdays on the UTC date made every deadline set between 21:00
    /// and 24:00 UTC land one calendar day early in local terms: an offer sent
    /// at 00:30 Thursday Riyadh time (21:30 Wednesday UTC) fell due on
    /// <b>Friday</b>, a weekend day, instead of Sunday. A fixed +03:00 offset
    /// rather than a time-zone id on purpose — Saudi Arabia has no daylight
    /// saving, and an id ("Arab Standard Time" on Windows, "Asia/Riyadh" on the
    /// container's Linux) is one more thing that differs between dev and
    /// production.
    /// </remarks>
    private static readonly TimeSpan RiyadhOffset = TimeSpan.FromHours(3);

    public static DateTime AddBusinessDays(DateTime fromUtc, int businessDays)
    {
        var local = fromUtc + RiyadhOffset;
        var added = 0;
        while (added < businessDays)
        {
            local = local.AddDays(1);
            if (local.DayOfWeek is not (DayOfWeek.Friday or DayOfWeek.Saturday))
            {
                added++;
            }
        }
        // Back to UTC: every caller stores and compares UTC.
        return local - RiyadhOffset;
    }

    /// <summary>`within` | `approaching` (≤1 day) | `breached` — the P-J4 states.</summary>
    public static (string State, int DaysRemaining) Countdown(DateTime dueAtUtc, DateTime nowUtc)
    {
        var daysRemaining = (int)Math.Floor((dueAtUtc - nowUtc).TotalDays);
        var state = daysRemaining < 0 ? "breached" : daysRemaining <= 1 ? "approaching" : "within";
        return (state, daysRemaining);
    }
}
