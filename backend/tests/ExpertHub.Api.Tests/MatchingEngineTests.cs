using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Applications;
using ExpertHub.Infrastructure.Assignments;

namespace ExpertHub.Api.Tests;

/// <summary>
/// UAT `RUN-011` / `BUG-038` — the owner's rule: only TWO criteria exclude
/// (a conflicting engagement, a file that is not active). Specialization and
/// city move the score; they never remove anyone, and a city is the same city
/// whatever language it was written in.
/// </summary>
public sealed class MatchingEngineTests
{
    private static readonly IReadOnlyDictionary<string, decimal> Weights =
        new Dictionary<string, decimal>
        {
            ["specialization"] = 33,
            ["location"] = 33,
            ["language"] = 34,
            ["delivery-mode"] = 33,
            ["evaluation"] = 33,
            ["availability"] = 33,
        };

    private static readonly MatchingContext Request = new(
        ApplicationServices.Trainer,
        SpecializationDomain: "dom-003",
        Language: "ar",
        DeliveryMechanism: "onsite",
        City: "الرياض",
        StartsAt: new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc),
        EndsAt: new DateTime(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc));

    private static MatchingCandidateInput Trainer(
        string? domain = "dom-003",
        string? city = "الرياض",
        string fileStatus = TrainerFileStatuses.Active,
        string service = ApplicationServices.Trainer,
        (DateTime, DateTime)[]? booked = null) =>
        new(Guid.NewGuid(), "مدرب", fileStatus, [service], domain, city, [], [], null, booked ?? []);

    [Fact]
    public void A_different_specialization_or_city_lowers_the_score_and_excludes_nobody()
    {
        var match = Trainer();
        var otherDomain = Trainer(domain: "dom-001");
        var otherCity = Trainer(city: "جدة");

        var result = MatchingEngine.Match(Request, [otherDomain, otherCity, match], Weights);

        Assert.Empty(result.Excluded);
        Assert.Equal(3, result.Ranked.Count);
        Assert.Equal(match.TrainerId, result.Ranked[0].TrainerId);
        var specialization = result.Ranked.Single(r => r.TrainerId == otherDomain.TrainerId)
            .Scores.Single(s => s.Criterion == WeightedCriteria.Specialization);
        Assert.Equal(0m, specialization.Weighted);
        var location = result.Ranked.Single(r => r.TrainerId == otherCity.TrainerId)
            .Scores.Single(s => s.Criterion == WeightedCriteria.Location);
        Assert.Equal(0m, location.Weighted);
    }

    [Fact]
    public void Only_a_schedule_conflict_and_an_inactive_file_exclude()
    {
        var booked = Trainer(booked: [(Request.StartsAt!.Value, Request.EndsAt!.Value)]);
        var suspended = Trainer(fileStatus: TrainerFileStatuses.Suspended);

        var result = MatchingEngine.Match(Request, [booked, suspended], Weights);

        Assert.Empty(result.Ranked);
        Assert.Equal(
            [MatchExclusionReasons.ScheduleConflict],
            result.Excluded.Single(e => e.TrainerId == booked.TrainerId).Reasons);
        Assert.Equal(
            [MatchExclusionReasons.FileStatus],
            result.Excluded.Single(e => e.TrainerId == suspended.TrainerId).Reasons);
    }

    [Fact]
    public void A_consultants_scheduling_conflict_lowers_the_score_and_excludes_nobody()
    {
        // Owner ruling (chat, 2026-10-20): for a consultant the conflict is a
        // penalty; the inactive file still excludes.
        var consultation = Request with { ServiceType = ApplicationServices.Consultant };
        var free = Trainer(service: ApplicationServices.Consultant);
        var booked = Trainer(
            service: ApplicationServices.Consultant,
            booked: [(Request.StartsAt!.Value, Request.EndsAt!.Value)]);
        var suspended = Trainer(
            service: ApplicationServices.Consultant, fileStatus: TrainerFileStatuses.Suspended);

        var result = MatchingEngine.Match(consultation, [booked, free, suspended], Weights);

        Assert.Equal([free.TrainerId, booked.TrainerId], result.Ranked.Select(r => r.TrainerId));
        Assert.Equal(33m, result.Ranked[0].TotalScore - result.Ranked[1].TotalScore);
        Assert.Equal(0m, result.Ranked[1].Scores
            .Single(s => s.Criterion == WeightedCriteria.Availability).Weighted);
        Assert.Equal(
            [MatchExclusionReasons.FileStatus],
            result.Excluded.Single(e => e.TrainerId == suspended.TrainerId).Reasons);
    }

    [Theory]
    [InlineData("Riyadh")]
    [InlineData("riyadh")]
    [InlineData("الرياض")]
    [InlineData("جدة، الرياض")]
    [InlineData("Jeddah, Riyadh")]
    public void A_city_matches_whatever_language_it_was_written_in(string trainerCities)
    {
        var result = MatchingEngine.Match(Request, [Trainer(city: trainerCities)], Weights);

        Assert.Equal(33m, result.Ranked.Single().Scores
            .Single(s => s.Criterion == WeightedCriteria.Location).Weighted);
    }

    [Fact]
    public void Someone_not_accredited_for_the_service_is_not_in_the_pool_at_all()
    {
        var consultant = Trainer(service: ApplicationServices.Consultant);

        var result = MatchingEngine.Match(Request, [consultant], Weights);

        Assert.Empty(result.Ranked);
        Assert.Empty(result.Excluded);
    }

    [Theory]
    [InlineData("احمد العتيبي", true)]
    [InlineData("أحمد", true)]
    [InlineData("العتيبي أحمد", true)]
    [InlineData("ahmed", true)]
    [InlineData("سعيد", false)]
    public void A_name_search_matches_every_word_whatever_letter_forms_were_typed(string query, bool found)
    {
        Assert.Equal(found, MatchText.NameMatches(query, "أحمد بن سعد العتيبي", "Ahmed Alotaibi"));
    }

    [Fact]
    public void A_fresh_three_day_window_reads_three_days_left_and_a_breach_is_never_zero()
    {
        var now = new DateTime(2026, 10, 18, 9, 0, 0, DateTimeKind.Utc);

        Assert.Equal(3, BusinessCalendar.Countdown(now.AddDays(3), now.AddSeconds(1)).DaysRemaining);
        Assert.Equal(("approaching", 1), BusinessCalendar.Countdown(now.AddHours(5), now));
        Assert.Equal(("breached", -1), BusinessCalendar.Countdown(now, now.AddMinutes(1)));
    }
}
