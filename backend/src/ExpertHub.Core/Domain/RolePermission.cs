namespace ExpertHub.Core.Domain;

/// <summary>
/// A role holds a permission at a data scope (`10` §3.2, `DM-GAP-07`).
/// </summary>
/// <remarks>
/// This is the <b>only</b> path from a person to a permission: `BR-0801` says
/// no permission is ever granted directly to a user, and the schema keeps the
/// rule the way the frontend does (`P-137`) — there is no user→permission
/// table to write to, so the forbidden grant cannot be represented.
/// </remarks>
public sealed class RolePermission
{
    public int RoleId { get; set; }

    public int PermissionId { get; set; }

    public DataScope Scope { get; set; }
}
