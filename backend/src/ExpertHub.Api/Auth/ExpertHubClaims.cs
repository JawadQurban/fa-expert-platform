namespace ExpertHub.Api.Auth;

/// <summary>
/// The claim vocabulary of the Expert Hub session itself — what survives claim
/// mapping and lands in the cookie, independent of whatever FAST's token calls
/// things (`G16`/`G28` make those configuration).
/// </summary>
public static class ExpertHubClaims
{
    /// <summary>
    /// The coarse access role, mapped from the provider's role claim. Values
    /// are exactly the frontend's <c>ExpertHubRole</c> union:
    /// <see cref="IndividualRole"/>, <see cref="TrainerRole"/> and
    /// <see cref="InternalRole"/>.
    /// </summary>
    public const string Role = "expert_hub_role";

    /// <summary>Self-service trainer experience.</summary>
    public const string TrainerRole = "trainer";

    /// <summary>Operational internal experience.</summary>
    public const string InternalRole = "internal";

    /// <summary>
    /// مستخدم مسجل — held by everybody who signs in (owner ruling,
    /// 2026-09-08). ⚠️ Never treat it as staff: everyone has it.
    /// </summary>
    public const string IndividualRole = "individual";

    /// <summary>The stable subject identifier, as OIDC names it.</summary>
    public const string Subject = "sub";
}
