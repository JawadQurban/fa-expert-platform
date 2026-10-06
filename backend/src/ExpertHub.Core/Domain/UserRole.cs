namespace ExpertHub.Core.Domain;

/// <summary>
/// A user holds a role (`10` §3.2) — assigned by an administrator, audited.
/// </summary>
/// <remarks>
/// <see cref="ScopeRef"/> is the centre, and only for منسق مركز (P-140): the
/// API layer keeps that pairing structural. A unique index on
/// (user, role, scope) makes the same assignment unrepeatable rather than
/// merely unusual.
/// </remarks>
public sealed class UserRole
{
    public Guid UserRoleId { get; set; }

    public Guid UserId { get; set; }

    public int RoleId { get; set; }

    /// <summary>The centre, for the centre-coordinator role only (P-140).</summary>
    public Guid? ScopeRef { get; set; }

    public Guid AssignedBy { get; set; }

    public DateTime AssignedAt { get; set; }
}
