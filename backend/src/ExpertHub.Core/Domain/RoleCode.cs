namespace ExpertHub.Core.Domain;

/// <summary>
/// The roles of BRD §8.8.5, plus the baseline role the owner added on
/// 2026-09-08 — a closed union.
/// </summary>
/// <remarks>
/// <para>
/// There is deliberately no create-role or delete-role operation anywhere in
/// the product (`BR-0803`, P-136): a role is a BRD amendment, not an API call.
/// The database says the same thing with a CHECK constraint on
/// <c>ROLE.code</c>, so even a hand-written INSERT cannot widen the union.
/// The wire spelling of each member lives in <see cref="RoleCodes"/> and is
/// fixed by the frontend contract (`access.types.ts` `ROLE_CODES`).
/// </para>
/// <para>
/// ⚠️ <b><see cref="Individual"/> is the seventh, and it IS an amendment</b> —
/// §8.8.5 approved six. It is here because the owner ruled on 2026-09-08 that
/// everybody who signs in holds a baseline role, and the union is the only
/// honest place to put it: a role that exists outside the enum is a permission
/// the matrix cannot govern, which is exactly what `BR-0801` forbids. It is
/// named for the Academy's own <c>Individual</c> role, so the two systems say
/// the same word about the same person.
/// </para>
/// </remarks>
public enum RoleCode
{
    /// <summary>مدرب — the external trainer/expert.</summary>
    Trainer,

    /// <summary>موظف إدارة المدربين.</summary>
    Staff,

    /// <summary>مدير إدارة المدربين.</summary>
    Manager,

    /// <summary>منسق مركز — the one role whose scope is a centre (P-140).</summary>
    CentreCoordinator,

    /// <summary>مشرف النظام.</summary>
    SystemAdministrator,

    /// <summary>الإدارة العليا.</summary>
    Executive,

    /// <summary>
    /// مستخدم مسجل — everybody who signs in, before they are anything else.
    /// </summary>
    /// <remarks>
    /// Owner ruling, 2026-09-08. Its permissions are the matrix's to decide
    /// like any other role's; what the platform guarantees is only that a
    /// signed-in person holds it, so nobody is ever role-less and every screen
    /// has a defined answer for them.
    /// </remarks>
    Individual,
}

/// <summary>
/// The database/wire spelling of the closed union — one source, used by the
/// EF value converter, the CHECK constraint, and the API's JSON.
/// </summary>
/// <remarks>
/// The spellings are the frontend contract's (`ROLE_CODES` in
/// `access.types.ts`): <c>trainer</c>, <c>staff</c>, <c>manager</c>,
/// <c>centre_coordinator</c>, <c>system_administrator</c>, <c>executive</c>.
/// ⚠️ `10_DATABASE_DESIGN` §3.2 wrote <c>sysadmin</c>; the service file
/// outranks it (playbook source map, rank 1) and the document is corrected.
/// </remarks>
public static class RoleCodes
{
    public static readonly IReadOnlyDictionary<RoleCode, string> Strings =
        new Dictionary<RoleCode, string>
        {
            [RoleCode.Trainer] = "trainer",
            [RoleCode.Staff] = "staff",
            [RoleCode.Manager] = "manager",
            [RoleCode.CentreCoordinator] = "centre_coordinator",
            [RoleCode.SystemAdministrator] = "system_administrator",
            [RoleCode.Executive] = "executive",
            [RoleCode.Individual] = "individual",
        };

    public static string ToWire(RoleCode code) => Strings[code];

    public static bool TryParse(string? value, out RoleCode code)
    {
        foreach (var pair in Strings)
        {
            if (string.Equals(pair.Value, value, StringComparison.Ordinal))
            {
                code = pair.Key;
                return true;
            }
        }
        code = default;
        return false;
    }
}
