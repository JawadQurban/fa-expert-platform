namespace ExpertHub.Core;

/// <summary>
/// The API version prefix every Expert Hub endpoint sits behind.
/// </summary>
/// <remarks>
/// Not a choice made here: the frontend's service contracts were written first
/// and already call <c>v1/internal/access/matrix</c>,
/// <c>v1/internal/notifications/matrix</c> and so on. This constant exists so
/// the string has one home on this side too, and so a future <c>v2</c> is a
/// deliberate addition rather than a scattered edit.
/// </remarks>
public static class ApiVersions
{
    public const string V1 = "v1";
}
