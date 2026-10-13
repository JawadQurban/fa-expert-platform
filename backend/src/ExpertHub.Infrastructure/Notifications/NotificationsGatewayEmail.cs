using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using ExpertHub.Infrastructure.Integration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Infrastructure.Notifications;

/// <summary>
/// INT-04 through the Academy's <b>Notifications Gateway</b>
/// (`POST /api/v1/Notifications/NotifyByEmail`, HTTP Basic) — the Academy's
/// own mail route, so Expert Hub never talks SMTP. `Email:GatewayUrl`,
/// `Email:Username` and `Email:Password` switch it on; the password lives in
/// `deploy/env/api.secrets.env` only.
/// </summary>
public sealed partial class NotificationsGatewayEmail : IEmailGateway
{
    private readonly HttpClient _http;
    private readonly ILogger<NotificationsGatewayEmail> _logger;
    private readonly string _gatewayUrl;
    private readonly string _username;
    private readonly string _password;
    private readonly string _fromName;

    public NotificationsGatewayEmail(
        HttpClient http, IConfiguration configuration, ILogger<NotificationsGatewayEmail> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _http = http;
        _logger = logger;
        _gatewayUrl = (configuration["Email:GatewayUrl"] ?? string.Empty).TrimEnd('/');
        _username = configuration["Email:Username"] ?? string.Empty;
        _password = configuration["Email:Password"] ?? string.Empty;
        _fromName = configuration["Email:FromName"] ?? "الأكاديمية المالية";
    }

    /// <summary>Needs the password too: half-configured fails closed, rather
    /// than calling the gateway and logging a 401 on every email.</summary>
    public bool IsConfigured =>
        _gatewayUrl.Length > 0 && _username.Length > 0 && _password.Length > 0;

    public async Task<IntegrationAttemptResult> SendAsync(
        EmailMessage message, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(message);
        if (!IsConfigured)
        {
            return IntegrationAttemptResult.Failure("No email gateway is configured.");
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Post, $"{_gatewayUrl}/api/v1/Notifications/NotifyByEmail")
        {
            Content = JsonContent.Create(new
            {
                fromSenderName = _fromName,
                subject = message.Subject,
                htmlMessage = Html(message),
                toReceiver = message.To,
                // Numbers, not names: accepted whether or not the gateway
                // serialises enums as strings. 1 = Normal, 0 = no report.
                priority = 1,
                deliveryReport = 0,
            }),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_username}:{_password}")));

        try
        {
            using var response = await _http.SendAsync(request, cancellationToken).ConfigureAwait(false);
            if (response.IsSuccessStatusCode)
            {
                return IntegrationAttemptResult.Success();
            }
            // The status only: the gateway's body can echo the recipient.
            LogRefused(_logger, (int)response.StatusCode);
            return IntegrationAttemptResult.Failure(
                $"Notifications Gateway answered {(int)response.StatusCode}.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException
            || !cancellationToken.IsCancellationRequested)
        {
            // Outbox retries; NOTIFICATION_LOG records why.
            LogUnreachable(_logger, ex.GetType().Name, ex.Message);
            return IntegrationAttemptResult.Failure($"Notifications Gateway unreachable: {ex.Message}");
        }
    }

    /// <summary>The template is plain text; HTML only to escape it and set the
    /// direction, so an Arabic email reads right-to-left in every client.</summary>
    internal static string Html(EmailMessage message)
    {
        var dir = message.Language == "en" ? "ltr" : "rtl";
        var body = WebUtility.HtmlEncode(message.Body)
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace("\n", "<br>", StringComparison.Ordinal);
        return $"<!doctype html><html lang=\"{message.Language}\" dir=\"{dir}\"><body "
            + $"style=\"font-family:Tahoma,Arial,sans-serif;direction:{dir}\">{body}</body></html>";
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Notifications Gateway refused an email ({Status})")]
    private static partial void LogRefused(ILogger logger, int status);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Notifications Gateway unreachable ({Kind}): {Detail}")]
    private static partial void LogUnreachable(ILogger logger, string kind, string detail);
}
