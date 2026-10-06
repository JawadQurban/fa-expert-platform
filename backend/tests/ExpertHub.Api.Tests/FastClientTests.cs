using System.Text.Json;
using ExpertHub.Infrastructure.Fast;
using Microsoft.Extensions.Configuration;

namespace ExpertHub.Api.Tests;

/// <summary>
/// INT-05's REST client. FAST wraps nearly every payload in one of two
/// envelopes that disagree about how they spell success — the client absorbs
/// that once so no capability branches on it.
/// </summary>
public sealed class FastClientTests
{
    [Fact]
    public void Both_envelopes_unwrap_to_the_same_payload()
    {
        /*
         * ⚠️ The REAL field names, from the API register of 2026-09-08:
         * `ApiResponse` says `success`, `ReturnResult` says `isValid`, and BOTH
         * carry the payload at `value`. This test previously asserted
         * `succeeded`/`isSuccess` and `data` — names taken from a reference
         * that was wrong — so it passed while the client could not read a
         * single real response.
         */
        var apiResponse = FastApiClient.Unwrap<JsonElement>(
            """{"success":true,"confirm":false,"message":"ok","value":{"id":7},"totalItems":1}""");
        var returnResult = FastApiClient.Unwrap<JsonElement>(
            """{"isValid":true,"errors":[],"message":"تم","value":{"id":7}}""");

        Assert.True(apiResponse.Ok);
        Assert.True(returnResult.Ok);
        Assert.Equal(7, apiResponse.Value.GetProperty("id").GetInt32());
        Assert.Equal(7, returnResult.Value.GetProperty("id").GetInt32());
    }

    [Fact]
    public void The_envelope_itself_is_never_handed_back_as_the_payload()
    {
        /*
         * The failure this guards against had no exception and no error: with
         * the wrong field names the ENVELOPE was deserialized as the payload,
         * so a typed read came back with every field null and reported
         * success. Silence is the worst possible symptom for a data bug, and
         * it went unnoticed because the one endpoint we consume returns a bare
         * object with no envelope at all.
         */
        var result = FastApiClient.Unwrap<FastLookupItem>(
            """{"isValid":true,"value":{"id":3,"nameAr":"الرياض","nameEn":"Riyadh"}}""");

        Assert.True(result.Ok);
        Assert.Equal(3, result.Value!.Id);
        Assert.Equal("الرياض", result.Value.NameAr);
    }

    [Fact]
    public void A_payload_that_happens_to_carry_a_value_field_is_left_alone()
    {
        // Unwrapping on the name alone would silently reduce a bare payload to
        // one of its own fields. The envelope has to look like an envelope.
        var result = FastApiClient.Unwrap<JsonElement>(
            """{"id":7,"value":"a field of ours"}""");

        Assert.True(result.Ok);
        Assert.Equal(7, result.Value.GetProperty("id").GetInt32());
    }

    [Fact]
    public void The_legacy_spellings_still_unwrap()
    {
        // Kept because they cost nothing, and 247 of 325 operations declare no
        // response schema at all — an endpoint the register did not reach may
        // still answer in the older shape.
        var legacy = FastApiClient.Unwrap<JsonElement>(
            """{"succeeded":true,"data":{"id":7}}""");
        Assert.True(legacy.Ok);
        Assert.Equal(7, legacy.Value.GetProperty("id").GetInt32());
    }

    [Fact]
    public void A_bare_payload_is_accepted_too()
    {
        // Not every endpoint wraps. An absent success flag is not a failure.
        var result = FastApiClient.Unwrap<JsonElement>("""{"id":7}""");
        Assert.True(result.Ok);
        Assert.Equal(7, result.Value.GetProperty("id").GetInt32());
    }

    [Fact]
    public void A_declared_failure_carries_the_arabic_message()
    {
        // This is an Arabic-first product and FAST supplies both, so the
        // Arabic message is the one a person should end up reading.
        var result = FastApiClient.Unwrap<JsonElement>(
            """{"isValid":false,"message":"Not allowed","messageAr":"غير مسموح","value":null}""");
        Assert.False(result.Ok);
        Assert.Equal("غير مسموح", result.Error);
    }

    [Fact]
    public void Unreadable_or_empty_bodies_fail_with_a_reason_rather_than_throwing()
    {
        // A capability that cannot reach FAST must degrade, not crash.
        Assert.False(FastApiClient.Unwrap<JsonElement>("<html>502</html>").Ok);
        Assert.False(FastApiClient.Unwrap<JsonElement>("").Ok);
        Assert.NotNull(FastApiClient.Unwrap<JsonElement>("").Error);
    }

    [Fact]
    public async Task With_no_base_url_the_client_is_off_and_says_so()
    {
        // Ships dark: the product behaves exactly as it does today until a
        // deployment configures it.
        var client = Build(baseUrl: null);
        Assert.False(client.IsConfigured);
        var result = await client.GetAsync("api/v1/Lookup/GetCountries", "ar", CancellationToken.None);
        Assert.False(result.Ok);
        Assert.Contains("not configured", result.Error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task With_no_token_the_call_names_the_open_decision_instead_of_failing_vaguely()
    {
        // ⚠️ Every FAST endpoint is scoped to the authenticated user, and
        // whether we call them as the user or as a service is undecided.
        var client = Build(baseUrl: "https://testingportal.fa.gov.sa/fa-api");
        Assert.True(client.IsConfigured);
        var result = await client.GetAsync("api/v1/Lookup/GetCountries", "ar", CancellationToken.None);
        Assert.False(result.Ok);
        Assert.Contains("token", result.Error, StringComparison.OrdinalIgnoreCase);
    }

    private static FastApiClient Build(string? baseUrl) =>
        new(new HttpClient(),
            new NoFastToken(),
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?> { ["Fast:BaseUrl"] = baseUrl })
                .Build());
}
