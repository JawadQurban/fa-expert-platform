using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Infrastructure.Meetings;

/// <summary>
/// Books interviews as Teams meetings, through a calendar event on the
/// Academy's organiser mailbox.
/// </summary>
/// <remarks>
/// <para>
/// <b>A calendar event, not an <c>onlineMeeting</c> — and the reason matters.</b>
/// The owner's ruling of 2026-09-09 is that everybody is invited, the applicant
/// included. An applicant is <b>external to the Academy's tenant</b>, and an
/// app-created <c>onlineMeeting</c> can only carry attendees who resolve inside
/// it. <c>POST /users/{organiser}/events</c> with <c>isOnlineMeeting: true</c>
/// creates the Teams meeting <i>and</i> sends real invitations to external
/// addresses, which is what was asked for.
/// </para>
/// <para>
/// ⚠️ <b>The security cost of that choice, stated plainly.</b> This needs
/// <c>Calendars.ReadWrite</c> (Application), and that permission reaches
/// <b>every mailbox in the tenant</b> unless an Exchange administrator scopes
/// it:
/// <code>
/// New-ApplicationAccessPolicy -AppId &lt;client-id&gt; `
///   -PolicyScopeGroupId service-teams@fa.gov.sa `
///   -AccessRight RestrictAccess `
///   -Description "Expert Hub — interview invitations only"
/// </code>
/// Without that policy the Academy has granted a hackathon service read/write
/// access to the calendar of every employee. <b>It is not optional.</b>
/// </para>
/// <para>
/// ⚠️ <b>The lobby needs a second permission (BUG-050).</b> The organiser is a
/// service mailbox that never joins, so after booking, the meeting's lobby is
/// opened to everyone through <c>/users/{organiser}/onlineMeetings</c>. That
/// needs <c>OnlineMeetings.ReadWrite.All</c> (Application) with admin consent,
/// <b>and</b> a Teams application access policy granted to the organiser —
/// without the policy Graph answers 403 even with the permission:
/// <code>
/// New-CsApplicationAccessPolicy -Identity ExpertHub-Interviews `
///   -AppIds &lt;client-id&gt; -Description "Expert Hub — interview meetings"
/// Grant-CsApplicationAccessPolicy -PolicyName ExpertHub-Interviews `
///   -Identity service-teams@fa.gov.sa
/// </code>
/// Missing either, the booking still succeeds and the link still works, but
/// people wait in the lobby — logged as event 5502.
/// </para>
/// <para>
/// <b>Ships dark.</b> No <c>Teams:ClientSecret</c> and the provider reports
/// itself unconfigured; nothing is called and the interview panel behaves as it
/// always has.
/// </para>
/// <para>
/// ⚠️ <b>Never throws.</b> An applicant has chosen a time and a committee is
/// expecting them — a calendar system that did not answer is not a reason to
/// lose that. Failures return null and are the caller's to survive.
/// </para>
/// </remarks>
public sealed partial class TeamsMeetingProvider : IMeetingProvider
{
    /*
     * ⚠️ Every outcome is logged, including the boring ones.
     *
     * This swallows its failures on purpose — an applicant has just chosen a
     * time and must not lose it because a calendar system was unavailable. But
     * swallowed AND silent is a different thing: a missing token, a refused
     * permission, an unscoped mailbox and a provider that is simply switched
     * off all produce the same symptom, which is an interview with no link.
     * `P-233` was written after exactly that cost a debugging session.
     */

    [LoggerMessage(Level = LogLevel.Information,
        Message = "Teams meeting booked for interview: {Subject}")]
    private static partial void LogBooked(ILogger logger, string subject);

    [LoggerMessage(Level = LogLevel.Warning,
        Message = "Teams booking refused ({Status}) for {Subject}: {Detail}")]
    private static partial void LogRefused(
        ILogger logger, int status, string subject, string detail);

    [LoggerMessage(Level = LogLevel.Warning,
        Message = "Teams token could not be acquired ({Status}): {Detail}")]
    private static partial void LogNoToken(ILogger logger, int status, string detail);

    [LoggerMessage(Level = LogLevel.Warning,
        Message = "Teams booking failed for {Subject}.")]
    private static partial void LogFailed(ILogger logger, string subject, Exception exception);

    // BUG-050 — opening the lobby, after the event exists. Stable ids, so an
    // operator can filter for "the meeting was booked but people wait in the
    // lobby" without reading message text. Subject only, never an address.
    [LoggerMessage(EventId = 5501, Level = LogLevel.Information,
        Message = "Teams lobby opened to everyone for: {Subject}")]
    private static partial void LogLobbyOpened(ILogger logger, string subject);

    [LoggerMessage(EventId = 5502, Level = LogLevel.Warning,
        Message = "Teams lobby could not be opened ({Status}) for {Subject}: {Detail}")]
    private static partial void LogLobbyRefused(
        ILogger logger, int status, string subject, string detail);

    [LoggerMessage(EventId = 5503, Level = LogLevel.Warning,
        Message = "Teams lobby not opened for {Subject}: no online meeting matches the event's join link.")]
    private static partial void LogLobbyNotFound(ILogger logger, string subject);

    [LoggerMessage(EventId = 5504, Level = LogLevel.Warning,
        Message = "Teams lobby could not be opened for {Subject}.")]
    private static partial void LogLobbyFailed(ILogger logger, string subject, Exception exception);

    private const string Graph = "https://graph.microsoft.com/v1.0";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly ILogger _logger;
    private readonly string _tenantId;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly string _organizer;
    private readonly string _timeZone;

    // One token, reused until it is nearly expired. Acquiring a token per
    // interview would be a needless round trip on a path a person is waiting on.
    private string? _token;
    private DateTimeOffset _tokenExpiresAt = DateTimeOffset.MinValue;

    public TeamsMeetingProvider(
        HttpClient http, IConfiguration configuration, ILogger<TeamsMeetingProvider> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _http = http;
        _logger = logger;
        _tenantId = configuration["Teams:TenantId"] ?? string.Empty;
        _clientId = configuration["Teams:ClientId"] ?? string.Empty;
        _clientSecret = configuration["Teams:ClientSecret"] ?? string.Empty;
        _organizer = configuration["Teams:OrganizerUpn"] ?? string.Empty;
        // The invitation is read by people in Riyadh; a UTC invitation is
        // correct and unreadable.
        _timeZone = configuration["Teams:TimeZone"] ?? "Arab Standard Time";
    }

    /// <summary>
    /// ⚠️ Requires the <b>secret</b> too, not just the ids. A half-configured
    /// deployment must fail closed rather than call Graph without credentials
    /// and log an authentication error on every interview.
    /// </summary>
    public bool IsConfigured =>
        _tenantId.Length > 0 && _clientId.Length > 0
        && _clientSecret.Length > 0 && _organizer.Length > 0;

    public async Task<MeetingBooking?> BookAsync(
        MeetingRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        return await SendAsync(
            HttpMethod.Post,
            $"{Graph}/users/{Uri.EscapeDataString(_organizer)}/events",
            request,
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<MeetingBooking?> RescheduleAsync(
        string externalId, MeetingRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(externalId))
        {
            return null;
        }
        // PATCH, so the invitation people already hold moves with it rather
        // than leaving them at a meeting nobody attends.
        return await SendAsync(
            HttpMethod.Patch,
            $"{Graph}/users/{Uri.EscapeDataString(_organizer)}/events/{Uri.EscapeDataString(externalId)}",
            request,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<MeetingBooking?> SendAsync(
        HttpMethod method, string url, MeetingRequest request, CancellationToken ct)
    {
        if (!IsConfigured)
        {
            return null;
        }

        try
        {
            var token = await TokenAsync(ct).ConfigureAwait(false);
            if (token is null)
            {
                return null;
            }

            using var message = new HttpRequestMessage(method, url);
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            message.Content = JsonContent.Create(Body(request), options: Json);

            using var response = await _http.SendAsync(message, ct).ConfigureAwait(false);
            var raw = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                // Graph's own message, verbatim. A 403 here almost always means
                // the Exchange application access policy does not cover this
                // mailbox, and reading that sentence is the whole diagnosis.
                LogRefused(_logger, (int)response.StatusCode, request.Subject, Describe(raw));
                return null;
            }

            using var document = JsonDocument.Parse(raw);
            var root = document.RootElement;

            // The join link lives on the event's `onlineMeeting`. Without it
            // there is nothing worth storing: an event with no link is a
            // calendar entry nobody can attend.
            if (!root.TryGetProperty("onlineMeeting", out var meeting)
                || !meeting.TryGetProperty("joinUrl", out var join)
                || join.GetString() is not { Length: > 0 } joinUrl
                || root.TryGetProperty("id", out var id) is false
                || id.GetString() is not { Length: > 0 } eventId)
            {
                LogRefused(_logger, (int)response.StatusCode, request.Subject,
                    "the event was created without a Teams join link");
                return null;
            }
            LogBooked(_logger, request.Subject);
            // BUG-050 — the organiser is a service mailbox that never joins,
            // so without this every participant waits in the lobby for a host
            // who is not coming. Best effort: the booking already stands.
            await OpenLobbyAsync(token, joinUrl, request.Subject, ct).ConfigureAwait(false);
            return new MeetingBooking(joinUrl, eventId);
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !ct.IsCancellationRequested)
        {
            LogFailed(_logger, request.Subject, exception);
            return null;
        }
    }

    /// <summary>
    /// Lets everybody holding the link straight into the meeting, and lets the
    /// Academy's own people present (BUG-050).
    /// </summary>
    /// <remarks>
    /// <para>
    /// The event's Teams meeting belongs to the organiser mailbox, which is a
    /// service account nobody signs into. With Teams' default lobby, people
    /// outside the organiser's circle — the applicant, always — wait «until
    /// someone lets you in», and nobody ever does. So the meeting behind the
    /// event is found by its join URL and PATCHed:
    /// <c>lobbyBypassSettings.scope = everyone</c> (dial-in too), so the first
    /// person to arrive starts it.
    /// </para>
    /// <para>
    /// <c>allowedPresenters = organization</c>, not <c>everyone</c>: the lobby
    /// was the defect, and presenting is a separate power. The committee
    /// members are inside the tenant and present; an applicant who needs to
    /// share a screen is promoted by a member in one click. Granting every
    /// guest presenter rights would let anybody with a forwarded link remove
    /// or mute the panel.
    /// </para>
    /// <para>
    /// Never throws and never undoes the booking: a meeting with a lobby is
    /// still a meeting, and the outcome is logged either way.
    /// </para>
    /// </remarks>
    private async Task OpenLobbyAsync(string token, string joinUrl, string subject, CancellationToken ct)
    {
        try
        {
            var organizer = Uri.EscapeDataString(_organizer);
            var filter = Uri.EscapeDataString($"JoinWebUrl eq '{joinUrl.Replace("'", "''", StringComparison.Ordinal)}'");
            using var find = new HttpRequestMessage(
                HttpMethod.Get, $"{Graph}/users/{organizer}/onlineMeetings?$filter={filter}");
            find.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            using var found = await _http.SendAsync(find, ct).ConfigureAwait(false);
            var raw = await found.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            if (!found.IsSuccessStatusCode)
            {
                // A 403 here is the missing `OnlineMeetings.ReadWrite.All` or
                // the Teams application access policy — see the class remarks.
                LogLobbyRefused(_logger, (int)found.StatusCode, subject, Describe(raw));
                return;
            }
            using var document = JsonDocument.Parse(raw);
            if (!document.RootElement.TryGetProperty("value", out var meetings)
                || meetings.ValueKind != JsonValueKind.Array
                || meetings.GetArrayLength() == 0
                || !meetings[0].TryGetProperty("id", out var id)
                || id.GetString() is not { Length: > 0 } meetingId)
            {
                LogLobbyNotFound(_logger, subject);
                return;
            }

            using var patch = new HttpRequestMessage(
                HttpMethod.Patch, $"{Graph}/users/{organizer}/onlineMeetings/{Uri.EscapeDataString(meetingId)}");
            patch.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            patch.Content = JsonContent.Create(new
            {
                lobbyBypassSettings = new { scope = "everyone", isDialInBypassEnabled = true },
                allowedPresenters = "organization",
            }, options: Json);
            using var patched = await _http.SendAsync(patch, ct).ConfigureAwait(false);
            if (!patched.IsSuccessStatusCode)
            {
                LogLobbyRefused(_logger, (int)patched.StatusCode, subject,
                    Describe(await patched.Content.ReadAsStringAsync(ct).ConfigureAwait(false)));
                return;
            }
            LogLobbyOpened(_logger, subject);
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !ct.IsCancellationRequested)
        {
            LogLobbyFailed(_logger, subject, exception);
        }
    }

    /// <summary>
    /// The error worth reading out of a failure body, and nothing else.
    /// </summary>
    /// <remarks>
    /// ⚠️ Deliberately not the whole body. Graph echoes request context in some
    /// errors, and a token endpoint's failure can carry the credential that was
    /// sent — a log line is the last place either belongs.
    /// </remarks>
    private static string Describe(string raw)
    {
        try
        {
            var root = JsonDocument.Parse(raw).RootElement;
            if (root.TryGetProperty("error", out var error))
            {
                if (error.ValueKind == JsonValueKind.String)
                {
                    return error.GetString() ?? "unknown";
                }
                if (error.TryGetProperty("message", out var message))
                {
                    return message.GetString() ?? "unknown";
                }
            }
            return root.TryGetProperty("error_description", out var described)
                ? Truncate(described.GetString() ?? "unknown")
                : "unknown";
        }
        catch (JsonException)
        {
            return "unreadable response";
        }
    }

    /// <summary>One line of it — Azure's error descriptions run to paragraphs
    /// with correlation ids and timestamps, and the first sentence is the part
    /// anybody reads.</summary>
    private static string Truncate(string value) =>
        value.Length <= 200 ? value : value[..200] + "…";

    /// <summary>The event body Graph expects.</summary>
    private object Body(MeetingRequest request) => new
    {
        subject = request.Subject,
        // `isOnlineMeeting` is what turns a calendar entry into a Teams
        // meeting; without the provider Graph creates one with no link.
        isOnlineMeeting = true,
        onlineMeetingProvider = "teamsForBusiness",
        start = new
        {
            dateTime = request.StartsAtUtc.ToString("yyyy-MM-dd'T'HH:mm:ss", CultureInfo.InvariantCulture),
            timeZone = "UTC",
        },
        end = new
        {
            dateTime = (request.StartsAtUtc + request.Duration)
                .ToString("yyyy-MM-dd'T'HH:mm:ss", CultureInfo.InvariantCulture),
            timeZone = "UTC",
        },
        // Sent in UTC and displayed in the reader's own zone by Outlook; the
        // organiser's zone is set separately so the mailbox shows it correctly.
        originalStartTimeZone = _timeZone,
        originalEndTimeZone = _timeZone,
        attendees = request.AttendeeEmails
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(email => new
            {
                emailAddress = new { address = email },
                type = "required",
            })
            .ToArray(),
        // ⚠️ Nothing about the application, the services applied for, or any
        // decision goes in here. A calendar invitation travels to an external
        // address and sits in an inbox indefinitely; it carries the time and
        // the link, and everything else stays in the platform.
        body = new
        {
            contentType = "text",
            content = request.LanguageTag == "en"
                ? "Financial Academy — interview. Join with the link in this invitation."
                : "الأكاديمية المالية — مقابلة. انضم عبر الرابط في هذه الدعوة.",
        },
    };

    /// <summary>
    /// A client-credentials token for Graph, cached until shortly before it
    /// expires.
    /// </summary>
    private async Task<string?> TokenAsync(CancellationToken ct)
    {
        if (_token is not null && DateTimeOffset.UtcNow < _tokenExpiresAt)
        {
            return _token;
        }

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = _clientId,
            ["client_secret"] = _clientSecret,
            ["scope"] = "https://graph.microsoft.com/.default",
            ["grant_type"] = "client_credentials",
        });

        using var response = await _http.PostAsync(
            $"https://login.microsoftonline.com/{_tenantId}/oauth2/v2.0/token", content, ct)
            .ConfigureAwait(false);
        var body = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            // ⚠️ Never the body itself — a token response can echo the request,
            // and the client secret is in it.
            LogNoToken(_logger, (int)response.StatusCode, Describe(body));
            return null;
        }

        using var document = JsonDocument.Parse(body);
        if (!document.RootElement.TryGetProperty("access_token", out var token)
            || token.GetString() is not { Length: > 0 } value)
        {
            return null;
        }

        var seconds = document.RootElement.TryGetProperty("expires_in", out var expires)
            && expires.TryGetInt32(out var parsed) ? parsed : 3600;
        _token = value;
        // A minute's margin: a token that expires mid-request is a failed
        // interview booking for no reason.
        _tokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(Math.Max(60, seconds - 60));
        return _token;
    }
}
