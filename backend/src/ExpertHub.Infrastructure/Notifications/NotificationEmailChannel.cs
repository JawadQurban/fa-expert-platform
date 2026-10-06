using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace ExpertHub.Infrastructure.Notifications;

/// <summary>
/// The one <see cref="IIntegrationChannel"/> the stack has: INT-04, email.
/// Hands the rendered message to the <see cref="IEmailGateway"/> and writes
/// the email's `NOTIFICATION_LOG` row with what actually happened — success,
/// or the failure `US-0705` wants visible. The outbox's retry then produces a
/// fresh attempt and a fresh row: the log records attempts, not intentions.
/// </summary>
/// <remarks>
/// ⚠️ 2026-09-02: the routing this class used to hold internally now lives in
/// <see cref="ChannelRouter"/> — INT-06 became the second system with a real
/// contract, which is exactly the follow-up the old note predicted. This
/// channel no longer checks the system code, because it is no longer asked
/// about messages that are not its own.
/// </remarks>
public sealed class NotificationEmailChannel : ISystemChannel
{
    private readonly IEmailGateway _gateway;
    private readonly IServiceScopeFactory _scopes;

    public NotificationEmailChannel(IEmailGateway gateway, IServiceScopeFactory scopes)
    {
        _gateway = gateway;
        _scopes = scopes;
    }

    public string SystemCode => IntegrationSystems.EmailGateway;

    public bool IsConfigured => _gateway.IsConfigured;

    public async Task<IntegrationAttemptResult> SendAsync(
        OutboxMessage message,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(message);

        EmailDispatch? dispatch;
        try
        {
            dispatch = JsonSerializer.Deserialize<EmailDispatch>(
                message.Payload, EmailDispatch.PayloadOptions);
        }
        catch (JsonException exception)
        {
            return IntegrationAttemptResult.Failure($"Unreadable email payload: {exception.Message}");
        }
        if (dispatch is null)
        {
            return IntegrationAttemptResult.Failure("Unreadable email payload: null.");
        }

        var result = await _gateway
            .SendAsync(
                new EmailMessage(dispatch.RecipientEmail, dispatch.Subject, dispatch.Body, dispatch.Language),
                cancellationToken)
            .ConfigureAwait(false);

        // The email channel's half of BR-0702's "one may fail while the other
        // succeeds": its own log row, per resolved attempt.
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
        db.AppendNotificationLog(new NotificationLogEntry
        {
            LogId = Guid.NewGuid(),
            EventCode = dispatch.EventCode,
            RecipientUserId = dispatch.RecipientUserId,
            Channel = NotificationChannels.Email,
            Language = dispatch.Language,
            TemplateCode = dispatch.TemplateCode,
            TemplateVersion = dispatch.TemplateVersion,
            SendStatus = result.Succeeded ? SendStatuses.Success : SendStatuses.Failure,
            FailureReason = result.ErrorDetail,
            SourceEntityId = dispatch.SourceEntityId,
            SentAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return result;
    }
}
