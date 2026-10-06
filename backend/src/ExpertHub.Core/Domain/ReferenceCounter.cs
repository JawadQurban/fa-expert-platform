namespace ExpertHub.Core.Domain;

/// <summary>
/// The last number issued under one reference prefix (`EH-2026-`, `AGR-2026-`…)
/// — `REFERENCE_COUNTER`. Not in `10`: added when `max + 1` was found to hand
/// two simultaneous submissions the same number. Advanced only by the atomic
/// statement in <c>ReferenceNumbers</c>, never through the change tracker.
/// </summary>
public sealed class ReferenceCounter
{
    public required string Prefix { get; set; }

    public int LastValue { get; set; }
}
