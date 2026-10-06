using ExpertHub.Infrastructure.Fast;

namespace ExpertHub.Api.Applications;

/// <summary>
/// Turns FAST's country id into the application form's nationality value.
/// </summary>
/// <remarks>
/// <para>
/// `Users/Info` sends `nationalityCountryId` — a number in FAST's own country
/// table — and the form asks for one of three values: `sa`, `gcc` or `other`.
/// The bridge is `Lookup/GetAllCountries`, which is the only thing that turns
/// the number into a country anybody can reason about.
/// </para>
/// <para>
/// ⚠️ <b>Never guessed from the number.</b> `1` looks like Saudi Arabia and
/// probably is, but the ordering of somebody else's lookup table is not a fact
/// about a person's nationality — and this fills a field on a government form.
/// An id the lookup does not resolve leaves the field EMPTY, and the raw id
/// stays on the replica so a later sign-in can resolve what this one could not.
/// </para>
/// </remarks>
internal static class FastNationality
{
    /// <summary>
    /// The GCC states, by the English names FAST's lookup uses.
    /// </summary>
    /// <remarks>
    /// ⚠️ Matched on the country name rather than `countryCode`, because the
    /// code's format is undocumented — ISO-2, ISO-3 and a numeric code would
    /// all match the field's name and only one of them would match this list.
    /// A country that is neither Saudi Arabia nor on this list is `other`,
    /// which is what the form's third option is for.
    /// </remarks>
    private static readonly HashSet<string> Gcc =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "kuwait", "bahrain", "qatar", "oman",
            "united arab emirates", "uae",
        };

    private static readonly HashSet<string> GccAr =
        new(StringComparer.Ordinal)
        {
            "الكويت", "البحرين", "قطر", "عمان", "سلطنة عمان",
            "الإمارات", "الامارات",
            "الإمارات العربية المتحدة", "الامارات العربية المتحدة",
        };

    /// <summary>
    /// The form's value for this country, or null when it cannot be resolved.
    /// </summary>
    internal static string? Resolve(FastCountryItem? country)
    {
        if (country is null)
        {
            return null;
        }

        // ⚠️ Both the country and the NATIONALITY names are checked: FAST
        // sends «السعودية» and «سعودي» in different fields, and which one is
        // populated has varied between operations.
        var en = Pick(country.NameEn, country.NationalityEn);
        var ar = Pick(country.NameAr, country.NationalityAr);
        if (en.Length == 0 && ar.Length == 0)
        {
            return null;
        }

        if (en.Contains("saudi", StringComparison.OrdinalIgnoreCase)
            || ar.Contains("السعودية", StringComparison.Ordinal)
            || ar.Contains("سعودي", StringComparison.Ordinal))
        {
            return "sa";
        }

        return Gcc.Contains(en) || GccAr.Contains(ar) ? "gcc" : "other";
    }

    /// <summary>The first of the two that actually carries a value.</summary>
    private static string Pick(string? first, string? second) =>
        string.IsNullOrWhiteSpace(first) ? (second ?? string.Empty).Trim() : first.Trim();
}
