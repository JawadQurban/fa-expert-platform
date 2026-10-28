using System.Text.Json;
using ExpertHub.Infrastructure.Fast;

namespace ExpertHub.Infrastructure.Applications;

/// <summary>
/// «المدن المتاح فيها الحضور الشخصي» (<c>inPersonCities</c>), whatever form
/// version answered it: free text before UAT BUG-005 («الرياض، جدة»), a list
/// of FAST city codes since (<c>["city-1","city-2"]</c>, `P-385`).
/// </summary>
public static class InPersonCities
{
    /// <summary>The field's code.</summary>
    public const string FieldCode = "inPersonCities";

    private static readonly char[] TextSeparators = ['،', ',', '؛', ';', '/', '\n'];

    /// <summary>
    /// Each city the answer names, in both languages. A FAST code resolves to
    /// FAST's two names; a typed city is the same text in both; an unknown
    /// code is kept as written rather than dropped.
    /// </summary>
    public static IReadOnlyList<(string Ar, string En)> Names(JsonElement? value)
    {
        if (value is not { } stored)
        {
            return [];
        }
        return stored.ValueKind switch
        {
            JsonValueKind.Array => [.. stored.EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => item.GetString()!.Trim())
                .Where(code => code.Length > 0)
                .Select(code => FastCities.ByCode.TryGetValue(code, out var city)
                    ? (city.NameAr, city.NameEn)
                    : (code, code))],
            JsonValueKind.String => [.. (stored.GetString() ?? string.Empty)
                .Split(TextSeparators, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(city => (city, city))],
            _ => [],
        };
    }

    /// <summary>What matching compares a request's city with: every name, in either language.</summary>
    public static IReadOnlyList<string> ForMatching(JsonElement? value) =>
        [.. Names(value).SelectMany(name => new[] { name.Ar, name.En }).Distinct(StringComparer.Ordinal)];

    /// <summary>The answer as a person reads it, in Arabic — never a code.</summary>
    public static string Display(JsonElement? value) =>
        value is { ValueKind: JsonValueKind.String } text
            ? text.GetString() ?? string.Empty
            : string.Join("، ", Names(value).Select(name => name.Ar));
}
