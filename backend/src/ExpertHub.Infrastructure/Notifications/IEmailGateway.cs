using System.Text.Json;
using System.Text.Encodings.Web;
using ExpertHub.Infrastructure.Integration;

namespace ExpertHub.Infrastructure.Notifications;

/// <summary>
/// The actual email transport — INT-04's unbuilt half. The Academy's gateway
/// details (host, credentials, sender) are an infrastructure ask; until they
/// arrive the <see cref="NullEmailGateway"/> stands in and every email queues
/// on the outbox as pending (`P-135`), visibly, losing nothing.
/// </summary>
public interface IEmailGateway
{
    /// <summary>False until a real gateway is configured — and while false,
    /// no attempt is burnt and no failure is invented.</summary>
    bool IsConfigured { get; }

    Task<IntegrationAttemptResult> SendAsync(EmailMessage message, CancellationToken cancellationToken);
}

/// <summary>One rendered, single-language email (`BR-0707`).</summary>
public sealed record EmailMessage(string To, string Subject, string Body, string Language);

/// <summary>The stand-in until infrastructure supplies gateway details.</summary>
public sealed class NullEmailGateway : IEmailGateway
{
    public bool IsConfigured => false;

    public Task<IntegrationAttemptResult> SendAsync(
        EmailMessage message,
        CancellationToken cancellationToken) =>
        Task.FromResult(IntegrationAttemptResult.Failure("No email gateway is configured."));
}

/// <summary>
/// What the dispatcher hands INT-04's outbox — everything the channel needs
/// to send the email <i>and</i> write the `NOTIFICATION_LOG` row for it when
/// the send resolves: the render happened at dispatch time, against the
/// template version that was current then.
/// </summary>
public sealed record EmailDispatch(
    string EventCode,
    Guid RecipientUserId,
    string RecipientEmail,
    string Language,
    string TemplateCode,
    int TemplateVersion,
    string Subject,
    string Body,
    Guid? SourceEntityId)
{
    /// <summary>
    /// One serializer shape for the payload, both directions. The relaxed
    /// encoder keeps Arabic readable in the stored payload instead of
    /// escaped-unicode soup — the payload lives in a database column and is
    /// parsed as JSON, never embedded in HTML, so the relaxation is safe.
    /// </summary>
    public static readonly JsonSerializerOptions PayloadOptions =
        new(JsonSerializerDefaults.Web) { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
}
