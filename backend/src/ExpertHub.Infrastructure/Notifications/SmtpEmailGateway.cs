using System.Net;
using System.Net.Mail;
using System.Text;
using ExpertHub.Infrastructure.Integration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Infrastructure.Notifications;

/// <summary>
/// INT-04 over plain SMTP — `Email:Host` and `Email:From` switch it on; the
/// password lives in `deploy/env/api.secrets.env` only. One connection per
/// email: the outbox sends a handful a minute, and <see cref="SmtpClient"/> is
/// not safe to share across threads.
/// </summary>
public sealed partial class SmtpEmailGateway : IEmailGateway
{
    private readonly ILogger<SmtpEmailGateway> _logger;
    private readonly string _host;
    private readonly int _port;
    private readonly bool _enableSsl;
    private readonly string _username;
    private readonly string _password;
    private readonly string _from;
    private readonly string _fromName;
    private readonly int _timeoutMs;

    public SmtpEmailGateway(IConfiguration configuration, ILogger<SmtpEmailGateway> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _logger = logger;
        _host = configuration["Email:Host"] ?? string.Empty;
        _port = configuration.GetValue("Email:Port", 25);
        _enableSsl = configuration.GetValue("Email:EnableSsl", false);
        _username = configuration["Email:Username"] ?? string.Empty;
        _password = configuration["Email:Password"] ?? string.Empty;
        _from = configuration["Email:From"] ?? string.Empty;
        _fromName = configuration["Email:FromName"] ?? "الأكاديمية المالية";
        _timeoutMs = configuration.GetValue("Email:TimeoutSeconds", 30) * 1000;
    }

    public bool IsConfigured => _host.Length > 0 && _from.Length > 0;

    public async Task<IntegrationAttemptResult> SendAsync(
        EmailMessage message, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(message);
        if (!IsConfigured)
        {
            return IntegrationAttemptResult.Failure("No email gateway is configured.");
        }

        using var mail = new MailMessage
        {
            From = new MailAddress(_from, _fromName, Encoding.UTF8),
            Subject = message.Subject,
            SubjectEncoding = Encoding.UTF8,
            // The template is plain text; HTML only to set the direction, so an
            // Arabic email reads right-to-left in every client.
            Body = Html(message),
            BodyEncoding = Encoding.UTF8,
            IsBodyHtml = true,
        };
        mail.To.Add(message.To);

        using var client = new SmtpClient(_host, _port)
        {
            EnableSsl = _enableSsl,
            Timeout = _timeoutMs,
            DeliveryMethod = SmtpDeliveryMethod.Network,
        };
        if (_username.Length > 0)
        {
            client.Credentials = new NetworkCredential(_username, _password);
        }

        try
        {
            await client.SendMailAsync(mail, cancellationToken).ConfigureAwait(false);
            return IntegrationAttemptResult.Success();
        }
        catch (Exception ex) when (ex is not OperationCanceledException
            || !cancellationToken.IsCancellationRequested)
        {
            // The outbox retries and NOTIFICATION_LOG records the reason; the
            // recipient's address stays out of the log line.
            LogSendFailed(_logger, ex.GetType().Name, ex.Message);
            return IntegrationAttemptResult.Failure($"SMTP send failed: {ex.Message}");
        }
    }

    private static string Html(EmailMessage message)
    {
        var dir = message.Language == "en" ? "ltr" : "rtl";
        var body = WebUtility.HtmlEncode(message.Body)
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace("\n", "<br>", StringComparison.Ordinal);
        return $"<!doctype html><html lang=\"{message.Language}\" dir=\"{dir}\"><body "
            + $"style=\"font-family:Tahoma,Arial,sans-serif;direction:{dir}\">{body}</body></html>";
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "SMTP send failed ({Kind}): {Detail}")]
    private static partial void LogSendFailed(ILogger logger, string kind, string detail);
}
