using System.Globalization;
using System.Text;

namespace ExpertHub.Infrastructure.Assignments;

/// <summary>
/// How matching compares the free text two people typed — a request's city
/// against a trainer's, a name against a search. Letter forms (أ/إ/آ/ا, ة/ه,
/// ى/ي), diacritics, tatweel, case and spacing never decide a match.
/// </summary>
public static class MatchText
{
    private static readonly char[] ListSeparators = ['،', ',', '؛', ';', '/', '\n'];

    /// <summary>Folds one value to the form two spellings of it share.</summary>
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }
        var builder = new StringBuilder(value.Length);
        foreach (var raw in value.Trim().ToUpperInvariant())
        {
            var c = raw switch
            {
                'أ' or 'إ' or 'آ' or 'ٱ' => 'ا',
                'ة' => 'ه',
                'ى' or 'ئ' => 'ي',
                'ؤ' => 'و',
                '-' or '_' or '.' => ' ',
                _ => raw,
            };
            // Harakat, shadda, sukun, superscript alef — and the tatweel.
            if (c == 'ـ' || CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }
            builder.Append(c);
        }
        return string.Join(' ', builder.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    /// <summary>
    /// Every word of the query appears in the name, in any order — so «محمد
    /// العتيبي» finds «محمد عبدالله العتيبي», and «احمد» finds «أحمد».
    /// </summary>
    public static bool NameMatches(string? query, params string?[] names)
    {
        var words = Normalize(query).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0)
        {
            return true;
        }
        return names.Any(name =>
        {
            var normalized = Normalize(name);
            return normalized.Length > 0
                && words.All(word => normalized.Contains(word, StringComparison.Ordinal));
        });
    }

    /// <summary>The value equals one of the entries of a «،»/«,»-separated list.</summary>
    public static bool AnyEqual(string? value, string? list)
    {
        var key = Normalize(value);
        return key.Length > 0 && Split(list).Any(item => Normalize(item) == key);
    }

    /// <summary>
    /// The city equals one of the listed cities — the same city whatever
    /// language it was written in («Riyadh» = «الرياض»).
    /// </summary>
    public static bool AnyCityEqual(string? city, string? list)
    {
        var key = CityKey(city);
        return key.Length > 0 && Split(list).Any(item => CityKey(item) == key);
    }

    private static string[] Split(string? list) =>
        string.IsNullOrWhiteSpace(list)
            ? []
            : list.Split(ListSeparators, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    /// <summary>A city's language-neutral key: its known canonical name, else its normalised text.</summary>
    internal static string CityKey(string? city)
    {
        var key = StripArticle(Normalize(city));
        return CityAliases.TryGetValue(key, out var canonical) ? canonical : key;
    }

    /// <summary>«ال» / «al» before each word is not part of a city's name.</summary>
    private static string StripArticle(string normalized) =>
        string.Join(' ', normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(word => word.Length > 3 && word.StartsWith("ال", StringComparison.Ordinal) ? word[2..] : word)
            .Where(word => word != "AL"));

    /*
     * ponytail: the request's city and the trainer's cities are both still
     * free text (UAT `BUG-005` asks for a Saudi-cities list), so a reference
     * value cannot be compared yet. Until that list exists this maps the
     * Kingdom's main cities, Arabic and English, to one key; a city not here
     * still matches its own spelling in either script it was typed in.
     */
    private static readonly Dictionary<string, string> CityAliases = BuildAliases(
        ("riyadh", ["الرياض", "Riyadh", "Riyad", "Ar Riyadh"]),
        ("jeddah", ["جدة", "Jeddah", "Jiddah", "Jedda"]),
        ("makkah", ["مكة", "مكة المكرمة", "Makkah", "Mecca", "Makka"]),
        ("madinah", ["المدينة", "المدينة المنورة", "Madinah", "Medina", "Madina", "Al Madinah"]),
        ("dammam", ["الدمام", "Dammam"]),
        ("khobar", ["الخبر", "Khobar", "Al Khobar"]),
        ("dhahran", ["الظهران", "Dhahran"]),
        ("taif", ["الطائف", "Taif"]),
        ("abha", ["أبها", "Abha"]),
        ("tabuk", ["تبوك", "Tabuk"]),
        ("buraidah", ["بريدة", "Buraidah", "Buraydah"]),
        ("hail", ["حائل", "Hail", "Ha'il"]),
        ("jazan", ["جازان", "جيزان", "Jazan", "Jizan"]),
        ("najran", ["نجران", "Najran"]),
        ("ahsa", ["الأحساء", "Al Ahsa", "Al-Ahsa", "Ahsa", "Hofuf", "الهفوف"]),
        ("khamis-mushait", ["خميس مشيط", "Khamis Mushait"]),
        ("jubail", ["الجبيل", "Jubail"]),
        ("yanbu", ["ينبع", "Yanbu"]),
        ("qatif", ["القطيف", "Qatif"]),
        ("baha", ["الباحة", "Al Baha", "Baha"]),
        ("arar", ["عرعر", "Arar"]),
        ("sakaka", ["سكاكا", "Sakaka"]),
        ("qassim", ["القصيم", "Qassim", "Al Qassim"]),
        ("abu-dhabi", ["أبوظبي", "أبو ظبي", "Abu Dhabi"]),
        ("dubai", ["دبي", "Dubai"]),
        ("teams", ["تيمز", "Teams", "Microsoft Teams"]));

    private static Dictionary<string, string> BuildAliases(
        params (string Canonical, string[] Spellings)[] cities)
    {
        var map = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var (canonical, spellings) in cities)
        {
            foreach (var spelling in spellings)
            {
                map[StripArticle(Normalize(spelling))] = canonical;
            }
        }
        return map;
    }
}
