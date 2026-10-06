using ExpertHub.Api.Profiles;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Assignments;

namespace ExpertHub.Api.Tests;

/// <summary>
/// J-13 «Trainer Profile Status & Conditions» — `active` needs an agreement in
/// effect AND an engagement executed in the last 6 months; `idle` is the same
/// agreement without one, and stays eligible for matching.
/// </summary>
public sealed class TrainerFileStatusTests
{
    private static readonly DateTime Now = new(2026, 9, 16, 12, 0, 0, DateTimeKind.Utc);

    private static readonly TrainerProfile Profile = new()
    {
        TrainerId = Guid.NewGuid(),
        UserId = Guid.NewGuid(),
        ApplicationId = Guid.NewGuid(),
        FileStatus = TrainerFileStatuses.Active,
        CreatedAt = Now.AddYears(-1),
    };

    private static Agreement AgreementIn(string status, DateTime? endsAt = null) => new()
    {
        Reference = "AGR-2026-0001",
        Status = status,
        FieldValues = "{}",
        EndsAt = endsAt ?? Now.AddYears(1),
    };

    [Fact]
    public void An_engagement_completed_on_the_first_day_of_the_window_keeps_the_file_active()
    {
        var boundary = Now.AddMonths(-6);
        Assert.Equal(TrainerFileStatuses.Active,
            TrainerProfileService.FileStatus(Profile, AgreementIn(AgreementStatuses.Active), Now, boundary));
    }

    [Fact]
    public void An_engagement_completed_inside_the_window_keeps_the_file_active()
    {
        Assert.Equal(TrainerFileStatuses.Active,
            TrainerProfileService.FileStatus(
                Profile, AgreementIn(AgreementStatuses.Active), Now, Now.AddMonths(-6).AddDays(1)));
        Assert.Equal(TrainerFileStatuses.Active,
            TrainerProfileService.FileStatus(
                Profile, AgreementIn(AgreementStatuses.Active), Now, Now.AddDays(-1)));
    }

    [Fact]
    public void The_last_engagement_completed_just_before_the_window_makes_the_file_idle()
    {
        Assert.Equal(TrainerFileStatuses.Idle,
            TrainerProfileService.FileStatus(
                Profile, AgreementIn(AgreementStatuses.Active), Now, Now.AddMonths(-6).AddTicks(-1)));
        Assert.Equal(TrainerFileStatuses.Idle,
            TrainerProfileService.FileStatus(
                Profile, AgreementIn(AgreementStatuses.Active), Now, Now.AddMonths(-6).AddDays(-1)));
    }

    [Fact]
    public void No_completed_engagement_at_all_makes_an_agreement_in_effect_idle()
    {
        Assert.Equal(TrainerFileStatuses.Idle,
            TrainerProfileService.FileStatus(Profile, AgreementIn(AgreementStatuses.Active), Now, null));
    }

    [Fact]
    public void Suspension_and_expiry_are_decided_by_the_agreement_whatever_the_activity()
    {
        var recent = Now.AddDays(-1);
        Assert.Equal(TrainerFileStatuses.Suspended,
            TrainerProfileService.FileStatus(Profile, AgreementIn(AgreementStatuses.Suspended), Now, recent));
        Assert.Equal(TrainerFileStatuses.Expired,
            TrainerProfileService.FileStatus(Profile, AgreementIn(AgreementStatuses.Ended), Now, recent));
        Assert.Equal(TrainerFileStatuses.Expired,
            TrainerProfileService.FileStatus(
                Profile, AgreementIn(AgreementStatuses.Active, Now.AddDays(-1)), Now, recent));
    }

    [Fact]
    public void An_idle_trainer_remains_eligible_for_matching_and_a_suspended_one_does_not()
    {
        var context = new MatchingContext(
            ApplicationServices.Trainer, null, null, null, null, null, null);
        MatchingCandidateInput Candidate(string fileStatus) => new(
            Guid.NewGuid(), fileStatus, fileStatus, [ApplicationServices.Trainer],
            null, null, [], [], null, []);
        var idle = Candidate(TrainerFileStatuses.Idle);
        var active = Candidate(TrainerFileStatuses.Active);
        var suspended = Candidate(TrainerFileStatuses.Suspended);

        var result = MatchingEngine.Match(
            context, [idle, active, suspended],
            new Dictionary<string, decimal> { ["language"] = 34, ["delivery-mode"] = 33, ["evaluation"] = 33 });

        Assert.Contains(result.Ranked, r => r.TrainerId == idle.TrainerId);
        Assert.Contains(result.Ranked, r => r.TrainerId == active.TrainerId);
        var excluded = Assert.Single(result.Excluded);
        Assert.Equal(suspended.TrainerId, excluded.TrainerId);
        Assert.Contains(MatchExclusionReasons.FileStatus, excluded.Reasons);
    }
}
