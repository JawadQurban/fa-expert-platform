using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
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

    /* ── BUG-050: nobody could get past the lobby ──────────────────────────── */

    private static TeamsMeetingProvider Provider(FakeGraph graph) =>
        new(new HttpClient(graph),
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Teams:TenantId"] = "tid",
                    ["Teams:ClientId"] = "cid",
                    ["Teams:ClientSecret"] = "shh",
                    ["Teams:OrganizerUpn"] = "service-teams@fa.gov.sa",
                })
                .Build(),
            NullLogger<TeamsMeetingProvider>.Instance);

    private static MeetingRequest Interview() => new(
        "مقابلة", DateTime.UtcNow.AddDays(1), TimeSpan.FromMinutes(30), ["a@b.test"], "ar");

    [Fact]
    public async Task A_booked_meeting_lets_everyone_in_without_waiting_for_the_organiser()
    {
        /*
         * The organiser is a service mailbox that never joins. Teams' default
         * lobby kept the applicant AND the committee waiting for it — «someone
         * will let you in when the meeting starts» — and nobody ever did.
         */
        var graph = new FakeGraph();
        var booking = await Provider(graph).BookAsync(Interview(), CancellationToken.None);

        Assert.NotNull(booking);
        Assert.Equal(FakeGraph.JoinUrl, booking.JoinUrl);
        // Found by its join link…
        var lookup = Assert.Single(graph.Requests, r => r.Method == HttpMethod.Get);
        Assert.Contains("/users/service-teams%40fa.gov.sa/onlineMeetings?$filter=", lookup.Uri, StringComparison.Ordinal);
        Assert.Contains(Uri.EscapeDataString(FakeGraph.JoinUrl), lookup.Uri, StringComparison.Ordinal);
        // …then opened: everybody bypasses the lobby, dial-in too, and the
        // Academy's own people may present.
        var patch = Assert.Single(graph.Requests, r => r.Uri.Contains("/onlineMeetings/om-1", StringComparison.Ordinal));
        Assert.Equal(HttpMethod.Patch, patch.Method);
        using var body = JsonDocument.Parse(patch.Body!);
        var lobby = body.RootElement.GetProperty("lobbyBypassSettings");
        Assert.Equal("everyone", lobby.GetProperty("scope").GetString());
        Assert.True(lobby.GetProperty("isDialInBypassEnabled").GetBoolean());
        Assert.Equal("organization", body.RootElement.GetProperty("allowedPresenters").GetString());
    }

    [Fact]
    public async Task A_rescheduled_meeting_opens_its_lobby_again()
    {
        var graph = new FakeGraph();
        var booking = await Provider(graph).RescheduleAsync("evt-1", Interview(), CancellationToken.None);

        Assert.NotNull(booking);
        Assert.Contains(graph.Requests, r => r.Method == HttpMethod.Patch
            && r.Uri.Contains("/onlineMeetings/om-1", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_lobby_that_cannot_be_opened_never_costs_the_booking()
    {
        // The missing `OnlineMeetings.ReadWrite.All` or Teams access policy:
        // a 403 on the lookup. The interview still has its meeting and link.
        var graph = new FakeGraph { LookupStatus = HttpStatusCode.Forbidden };
        var booking = await Provider(graph).BookAsync(Interview(), CancellationToken.None);

        Assert.NotNull(booking);
        Assert.Equal(FakeGraph.JoinUrl, booking.JoinUrl);
        Assert.DoesNotContain(graph.Requests, r => r.Uri.Contains("/onlineMeetings/om-1", StringComparison.Ordinal));
    }

    /// <summary>Graph, as far as booking a meeting goes: a token, the event,
    /// the online-meeting lookup, and its PATCH.</summary>
    private sealed class FakeGraph : HttpMessageHandler
    {
        public const string JoinUrl = "https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc%40thread.v2/0";

        public HttpStatusCode LookupStatus { get; init; } = HttpStatusCode.OK;

        public List<(HttpMethod Method, string Uri, string? Body)> Requests { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var uri = request.RequestUri!.ToString();
            var body = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            Requests.Add((request.Method, uri, body));
            if (uri.Contains("/oauth2/v2.0/token", StringComparison.Ordinal))
            {
                return Json(HttpStatusCode.OK, new { access_token = "token", expires_in = 3600 });
            }
            if (uri.Contains("/events", StringComparison.Ordinal))
            {
                return Json(HttpStatusCode.OK, new { id = "evt-1", onlineMeeting = new { joinUrl = JoinUrl } });
            }
            if (request.Method == HttpMethod.Get && uri.Contains("/onlineMeetings?", StringComparison.Ordinal))
            {
                return LookupStatus == HttpStatusCode.OK
                    ? Json(HttpStatusCode.OK, new { value = new[] { new { id = "om-1" } } })
                    : Json(LookupStatus, new { error = new { message = "Application access policy not found." } });
            }
            if (request.Method == HttpMethod.Patch && uri.Contains("/onlineMeetings/", StringComparison.Ordinal))
            {
                return Json(HttpStatusCode.OK, new { id = "om-1" });
            }
            return new HttpResponseMessage(HttpStatusCode.NotFound);
        }

        private static HttpResponseMessage Json(HttpStatusCode status, object payload) =>
            new(status) { Content = JsonContent.Create(payload) };
    }
}
