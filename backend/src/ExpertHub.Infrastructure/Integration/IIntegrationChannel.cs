using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Integration;

/// <summary>
/// The transport a published outbox message rides on. One deliberately thin
/// seam: FAST's outbound API, the email gateway and the AI provider all have
/// unbuilt contracts (INT-05a, `G41`–`G44` for MTM, `Q28`, `Q33`/`Q34`), so what exists today
/// is the mechanism and this interface — a real channel per system plugs in
/// when its contract does.
/// </summary>
public interface IIntegrationChannel
{
    /// <summary>
    /// Whether this channel can deliver at all. While it cannot, the
    /// publisher leaves messages queued as <c>pending</c> without burning
    /// attempts (`P-135`) — an unconfigured endpoint is not a failed
    /// delivery, it is a delivery not yet attempted.
    /// </summary>
    bool IsConfigured { get; }

    /// <summary>Attempts one delivery. Throwing is equivalent to failure.</summary>
    Task<IntegrationAttemptResult> SendAsync(OutboxMessage message, CancellationToken cancellationToken);
}

/// <summary>One attempt's outcome, as the log will record it (`BR-1204`).</summary>
public sealed record IntegrationAttemptResult(bool Succeeded, string? ErrorDetail = null)
{
    public static IntegrationAttemptResult Success() => new(true);

    public static IntegrationAttemptResult Failure(string errorDetail) => new(false, errorDetail);
}

/// <summary>
/// The channel registered until any real one exists: never configured, so the
/// outbox queues and nothing pretends to deliver. Replaced per system as
/// contracts arrive; deliberately not a stub that "succeeds", because a
/// success the remote side never saw is the exact lie CAP-12 exists to
/// prevent.
/// </summary>
public sealed class NullIntegrationChannel : IIntegrationChannel
{
    public bool IsConfigured => false;

    public Task<IntegrationAttemptResult> SendAsync(
        OutboxMessage message,
        CancellationToken cancellationToken) =>
        Task.FromResult(IntegrationAttemptResult.Failure("No integration channel is configured."));
}
