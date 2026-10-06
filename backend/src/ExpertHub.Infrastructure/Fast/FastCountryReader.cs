using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Infrastructure.Fast;

/// <summary>
/// Reads FAST's country lookup, so a `nationalityCountryId` can become a
/// country rather than staying a number.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>Cached for the life of the process.</b> The list of countries does not
/// change between two people signing in, and reading it on every sign-in would
/// put a second FAST call in the authentication path for a payload that is the
/// same every time.
/// </para>
/// <para>
/// ⚠️ <b>A failure is remembered as «unknown», not as «none».</b> A lookup that
/// fails leaves the cache empty and every nationality unresolved, which shows
/// as an empty field — the honest state. It does not cache a wrong answer.
/// </para>
/// </remarks>
public sealed partial class FastCountryReader : IDisposable
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly FastApiClient _client;
    private readonly ILogger<FastCountryReader> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private Dictionary<int, FastCountryItem>? _countries;

    public FastCountryReader(FastApiClient client, ILogger<FastCountryReader> logger)
    {
        _client = client;
        _logger = logger;
    }

    public bool IsConfigured => _client.IsConfigured;

    /// <summary>
    /// The country with this id, or null when the lookup is unavailable or
    /// does not know it.
    /// </summary>
    public async Task<FastCountryItem?> ByIdAsync(
        int? countryId, string accessToken, CancellationToken cancellationToken)
    {
        if (countryId is not { } id)
        {
            return null;
        }

        var countries = await CountriesAsync(accessToken, cancellationToken).ConfigureAwait(false);
        return countries.TryGetValue(id, out var country) ? country : null;
    }

    private async Task<Dictionary<int, FastCountryItem>> CountriesAsync(
        string accessToken, CancellationToken ct)
    {
        if (_countries is { } cached)
        {
            return cached;
        }

        await _gate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            if (_countries is { } raced)
            {
                return raced;
            }

            /*
             * ⚠️ `GetCountries`, NOT `GetAllCountries`. The register documents
             * `CountryRegistrationLookupDto` — `{ id, nameAr, nameEn,
             * nationalityAr, nationalityEn, countryCode, nafathMappingCode,
             * isRestricted }` — for THIS operation. `GetAllCountries` is a
             * different operation with no documented shape, and calling it
             * left `nationality_code` null for every person on the server
             * (2026-09-10): the id was there, the resolution was not.
             */
            var result = await _client
                .GetWithTokenAsync<List<FastCountryItem>>(
                    FastLookups.Countries, accessToken, "ar", ct)
                .ConfigureAwait(false);

            // ⚠️ A failed read is NOT cached — the next sign-in tries again.
            // Caching «the lookup was down once» would leave every nationality
            // permanently blank until a redeploy.
            if (!result.Ok || result.Value is null)
            {
                // ⚠️ Said out loud. An unresolved nationality used to leave a
                // null column and no log line at all, so the only way to find
                // out was to query the database and infer it.
                LogUnavailable(_logger, result.Error ?? "no payload returned");
                return new Dictionary<int, FastCountryItem>();
            }

            _countries = result.Value
                .Where(country => country.Id is not null)
                .GroupBy(country => country.Id!.Value)
                .ToDictionary(group => group.Key, group => group.First());
            LogLoaded(_logger, _countries.Count);
            return _countries;
        }
        finally
        {
            _gate.Release();
        }
    }

    /// <summary>Kept so the options type is used consistently.</summary>
    internal static JsonSerializerOptions Options => Json;

    public void Dispose() => _gate.Dispose();

    [LoggerMessage(
        EventId = 5210, Level = LogLevel.Warning,
        Message = "FAST country lookup unavailable: {Reason}. Nationality stays unresolved.")]
    private static partial void LogUnavailable(ILogger logger, string reason);

    [LoggerMessage(
        EventId = 5211, Level = LogLevel.Information,
        Message = "FAST country lookup loaded: {Count} countries.")]
    private static partial void LogLoaded(ILogger logger, int count);
}

/// <summary>
/// One country, as `Lookup/GetCountries` returns it.
/// </summary>
/// <remarks>
/// ⚠️ <b>The register's own `CountryRegistrationLookupDto`</b>, not a guess:
/// `{ id, nameAr, nameEn, nationalityAr, nationalityEn, countryCode,
/// nafathMappingCode, isRestricted }`. It carries the country <i>and</i> the
/// nationality in both languages, which is more than the three-option field
/// this currently feeds can express — `D-36` is that field, and this lookup is
/// what eventually closes it.
/// </remarks>
public sealed record FastCountryItem
{
    public int? Id { get; init; }

    public string? NameAr { get; init; }

    public string? NameEn { get; init; }

    /// <summary>«سعودي» rather than «السعودية» — the word a nationality field
    /// actually wants.</summary>
    public string? NationalityAr { get; init; }

    public string? NationalityEn { get; init; }

    public string? CountryCode { get; init; }

    /// <summary>The bridge to the identity provider's own country ids.</summary>
    /// <remarks>⚠️ An <b>integer</b> in the register's DTO. It was typed as a
    /// string here, which fails deserialization of the whole list the moment a
    /// real response carries a number.</remarks>
    public int? NafathMappingCode { get; init; }

    /// <summary>⚠️ Some countries are flagged and nothing tells us what the
    /// Academy does with the flag. Carried, not acted on.</summary>
    public bool? IsRestricted { get; init; }
}
