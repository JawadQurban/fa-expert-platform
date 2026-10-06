using ExpertHub.Infrastructure.Meetings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace ExpertHub.Api.Tests;

/// <summary>
/// J-06/F2 — the interview meeting provider, and the rule that matters more
/// than booking one: a calendar system that does not answer must never cost
/// somebody the interview they just scheduled.
/// </summary>
public sealed class MeetingProviderTests
{
    private static TeamsMeetingProvider Provider(params (string Key, string Value)[] settings) =>
        new(new HttpClient(),
            new ConfigurationBuilder()
                .AddInMemoryCollection(settings.Select(s =>
                    new KeyValuePair<string, string?>(s.Key, s.Value)))
                .Build(),
            NullLogger<TeamsMeetingProvider>.Instance);

    [Fact]
    public void With_nothing_configured_the_product_behaves_exactly_as_it_did()
    {
        // The same arrangement as the email gateway, the document store and
        // the FAST client: an unconfigured deployment is a working deployment.
        Assert.False(Provider().IsConfigured);
        Assert.False(new NoMeetingProvider().IsConfigured);
    }

    [Fact]
    public async Task An_unconfigured_provider_returns_no_booking_rather_than_throwing()
    {
        var request = new MeetingRequest(
            "مقابلة", DateTime.UtcNow.AddDays(1), TimeSpan.FromMinutes(30), ["a@b.test"], "ar");

        Assert.Null(await Provider().BookAsync(request, CancellationToken.None));
        Assert.Null(await new NoMeetingProvider().BookAsync(request, CancellationToken.None));
        Assert.Null(await new NoMeetingProvider()
            .RescheduleAsync("evt-1", request, CancellationToken.None));
    }

    [Fact]
    public void Ids_without_a_secret_are_NOT_configured()
    {
        /*
         * ⚠️ Half-configured must read as off, not as on. A deployment that
         * carries the tenant and client id but no secret would otherwise call
         * Graph on every confirmed interview and fail authentication every
         * time — noise on a path a person is waiting on, and a log full of
         * errors that look like an outage.
         */
        var half = Provider(
            ("Teams:TenantId", "tid"),
            ("Teams:ClientId", "cid"),
            ("Teams:OrganizerUpn", "service-teams@fa.gov.sa"));

        Assert.False(half.IsConfigured);
    }

    [Fact]
    public void A_fully_configured_provider_reports_itself_ready()
    {
        var full = Provider(
            ("Teams:TenantId", "tid"),
            ("Teams:ClientId", "cid"),
            ("Teams:ClientSecret", "shh"),
            ("Teams:OrganizerUpn", "service-teams@fa.gov.sa"));

        Assert.True(full.IsConfigured);
    }

    [Fact]
    public async Task A_provider_that_cannot_reach_Graph_still_returns_null()
    {
        // Configured, but pointed at nothing that answers — the shape of a
        // real outage. The booking fails; it does not throw into a request the
        // applicant is waiting on.
        var configured = Provider(
            ("Teams:TenantId", "unreachable.invalid"),
            ("Teams:ClientId", "cid"),
            ("Teams:ClientSecret", "shh"),
            ("Teams:OrganizerUpn", "service-teams@fa.gov.sa"));

        var request = new MeetingRequest(
            "مقابلة", DateTime.UtcNow.AddDays(1), TimeSpan.FromMinutes(30), ["a@b.test"], "ar");

        Assert.Null(await configured.BookAsync(request, CancellationToken.None));
    }

    [Fact]
    public async Task A_reschedule_with_no_prior_booking_is_not_attempted()
    {
        // Nothing to move: `PATCH` on an empty id would be a request to Graph
        // that can only fail.
        var configured = Provider(
            ("Teams:TenantId", "tid"),
            ("Teams:ClientId", "cid"),
            ("Teams:ClientSecret", "shh"),
            ("Teams:OrganizerUpn", "service-teams@fa.gov.sa"));

        var request = new MeetingRequest(
            "مقابلة", DateTime.UtcNow.AddDays(1), TimeSpan.FromMinutes(30), ["a@b.test"], "ar");

        Assert.Null(await configured.RescheduleAsync("", request, CancellationToken.None));
    }
}
