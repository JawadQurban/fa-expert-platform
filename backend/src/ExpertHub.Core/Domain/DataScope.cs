namespace ExpertHub.Core.Domain;

/// <summary>
/// How far a granted permission reaches — BRD §8.8.3, `DM-GAP-07`.
/// </summary>
/// <remarks>
/// The scope is applied at the <b>query layer</b>, never in a controller
/// (playbook rule "fail closed"): a handler that forgets the check must see
/// nothing, not everything.
/// </remarks>
public enum DataScope
{
    /// <summary>كل البيانات.</summary>
    All,

    /// <summary>بياناته فقط.</summary>
    Own,

    /// <summary>نطاق مركزه.</summary>
    Centre,
}

/// <summary>
/// The database/wire spelling — one source for the EF converter, the CHECK
/// constraint, and the API's JSON (`DATA_SCOPES` in `access.types.ts`).
/// </summary>
public static class DataScopes
{
    public static readonly IReadOnlyDictionary<DataScope, string> Strings =
        new Dictionary<DataScope, string>
        {
            [DataScope.All] = "all",
            [DataScope.Own] = "own",
            [DataScope.Centre] = "centre",
        };

    public static string ToWire(DataScope scope) => Strings[scope];

    public static bool TryParse(string? value, out DataScope scope)
    {
        foreach (var pair in Strings)
        {
            if (string.Equals(pair.Value, value, StringComparison.Ordinal))
            {
                scope = pair.Key;
                return true;
            }
        }
        scope = default;
        return false;
    }
}
