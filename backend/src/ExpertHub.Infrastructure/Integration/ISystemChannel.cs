using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Integration;

/// <summary>
/// One system's transport. Each registered channel names the system it
/// speaks for, and <see cref="ChannelRouter"/> picks between them.
/// </summary>
/// <remarks>
/// This is the follow-up `NotificationEmailChannel` predicted in BE-04:
/// «until a second system has a real outbound contract, every publishable
/// message is INT-04's… the honest answer until per-system channel routing
/// exists». BE-17 is that second system, so the routing exists now rather
/// than as a guard inside a channel that happens to be first in the
/// container.
/// </remarks>
public interface ISystemChannel
{
    /// <summary>The `INTEGRATED_SYSTEM.system_code` this channel delivers for.</summary>
    string SystemCode { get; }

    /// <summary>
    /// Whether this channel can deliver at all. While it cannot, the
    /// publisher leaves its messages queued as <c>pending</c> without burning
    /// attempts (`P-135`) — an unconfigured endpoint is not a failed
    /// delivery, it is a delivery not yet attempted.
    /// </summary>
    bool IsConfigured { get; }

    /// <summary>Attempts one delivery. Throwing is equivalent to failure.</summary>
    Task<IntegrationAttemptResult> SendAsync(
        OutboxMessage message, CancellationToken cancellationToken);
}

/// <summary>
/// Dispatches each outbox message to the channel that speaks for its system.
/// </summary>
/// <remarks>
/// <para>
/// A message for a system with no registered channel — or with one that is
/// not configured — fails its attempt <b>with the reason</b> and waits. It is
/// never reported as delivered: «a success the remote side never saw is the
/// exact lie CAP-12 exists to prevent».
/// </para>
/// <para>
/// <see cref="IsConfigured"/> is true when ANY channel is, because the
/// publisher's loop is shared: one configured system must not be held back by
/// four that are not.
/// </para>
/// </remarks>
public sealed class ChannelRouter : IIntegrationChannel
{
    private readonly IReadOnlyList<ISystemChannel> _channels;

    public ChannelRouter(IEnumerable<ISystemChannel> channels) =>
        _channels = [.. channels];

    public bool IsConfigured => _channels.Any(c => c.IsConfigured);

    public Task<IntegrationAttemptResult> SendAsync(
        OutboxMessage message, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(message);
        var channel = _channels.FirstOrDefault(
            c => string.Equals(c.SystemCode, message.SystemCode, StringComparison.Ordinal));
        if (channel is null)
        {
            return Task.FromResult(IntegrationAttemptResult.Failure(
                $"No channel is registered for '{message.SystemCode}'; the message stays queued."));
        }
        return channel.IsConfigured
            ? channel.SendAsync(message, cancellationToken)
            : Task.FromResult(IntegrationAttemptResult.Failure(
                $"The channel for '{message.SystemCode}' is not configured; the message stays queued."));
    }
}
