namespace ExpertHub.Core.Domain;

/// <summary>
/// A crossing was attempted against the source-of-truth matrix — an outbound
/// write to an element another system masters, an inbound apply to one Expert
/// Hub masters, or an element that is not registered at all. `P-129`: the
/// write is <b>rejected with a reason</b>, never accepted and lost at the
/// next sync.
/// </summary>
public sealed class MastershipViolationException : InvalidOperationException
{
    public MastershipViolationException()
    {
    }

    public MastershipViolationException(string message)
        : base(message)
    {
    }

    public MastershipViolationException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
