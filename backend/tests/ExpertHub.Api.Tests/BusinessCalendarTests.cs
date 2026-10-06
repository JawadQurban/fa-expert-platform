using ExpertHub.Infrastructure.Applications;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The business-day arithmetic every SLA deadline is built from — held to the
/// weekend that actually applies, which is Riyadh's (Friday + Saturday), not
/// UTC's.
/// </summary>
/// <remarks>
/// This exists because counting weekdays on the UTC date is wrong for three
/// hours of every day and looks right for the other twenty-one. A deadline set
/// between 21:00 and 24:00 UTC belongs to the NEXT day in Riyadh, so the count
/// started from the wrong weekday and could hand somebody a due date on a
/// weekend — the one thing business-day arithmetic exists to prevent.
/// </remarks>
public sealed class BusinessCalendarTests
{
    private static readonly TimeSpan Riyadh = TimeSpan.FromHours(3);

    [Fact]
    public void A_deadline_set_late_on_Wednesday_UTC_is_due_on_Sunday_in_Riyadh()
    {
        // 21:30 UTC Wednesday is already 00:30 THURSDAY in Riyadh. One business
        // day from Thursday skips Friday and Saturday, so it is due Sunday.
        var sentUtc = new DateTime(2026, 9, 30, 21, 30, 0, DateTimeKind.Utc);
        Assert.Equal(DayOfWeek.Wednesday, sentUtc.DayOfWeek);
        Assert.Equal(DayOfWeek.Thursday, (sentUtc + Riyadh).DayOfWeek);

        var dueUtc = BusinessCalendar.AddBusinessDays(sentUtc, 1);

        // Counting on the UTC weekday returned Thursday 21:30 UTC — which is
        // 00:30 FRIDAY in Riyadh, a weekend day.
        Assert.Equal(DayOfWeek.Sunday, (dueUtc + Riyadh).DayOfWeek);
    }

    [Fact]
    public void The_weekend_is_never_a_due_date_whatever_hour_the_clock_shows()
    {
        // Every hour of one full day, one business day out: none may land on a
        // Riyadh weekend. The 21:00–24:00 UTC hours are the ones that used to.
        var midnightUtc = new DateTime(2026, 9, 30, 0, 0, 0, DateTimeKind.Utc);
        for (var hour = 0; hour < 24; hour++)
        {
            var dueRiyadh = BusinessCalendar.AddBusinessDays(midnightUtc.AddHours(hour), 1) + Riyadh;

            Assert.DoesNotContain(
                dueRiyadh.DayOfWeek,
                new[] { DayOfWeek.Friday, DayOfWeek.Saturday });
        }
    }

    [Fact]
    public void A_midweek_deadline_is_the_next_day_and_keeps_its_time_of_day()
    {
        // 09:00 Riyadh on Sunday (06:00 UTC) — nothing to skip.
        var sundayUtc = new DateTime(2026, 10, 4, 6, 0, 0, DateTimeKind.Utc);
        Assert.Equal(DayOfWeek.Sunday, (sundayUtc + Riyadh).DayOfWeek);

        var dueUtc = BusinessCalendar.AddBusinessDays(sundayUtc, 1);

        Assert.Equal(DayOfWeek.Monday, (dueUtc + Riyadh).DayOfWeek);
        Assert.Equal(sundayUtc.TimeOfDay, dueUtc.TimeOfDay);
    }

    [Fact]
    public void Five_business_days_from_Thursday_in_Riyadh_crosses_one_weekend()
    {
        // Thursday 12:00 Riyadh (09:00 UTC) + 5 business days:
        // Sun, Mon, Tue, Wed, Thu — the following Thursday.
        var thursdayUtc = new DateTime(2026, 10, 1, 9, 0, 0, DateTimeKind.Utc);
        Assert.Equal(DayOfWeek.Thursday, (thursdayUtc + Riyadh).DayOfWeek);

        var dueUtc = BusinessCalendar.AddBusinessDays(thursdayUtc, 5);

        var dueRiyadh = dueUtc + Riyadh;
        Assert.Equal(DayOfWeek.Thursday, dueRiyadh.DayOfWeek);
        Assert.Equal(new DateTime(2026, 10, 8, 12, 0, 0), dueRiyadh);
    }
}
