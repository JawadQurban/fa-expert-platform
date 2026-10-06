using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace ExpertHub.Infrastructure.Fast;

/// <summary>
/// One call's outcome. Never throws at the caller: a capability that cannot
/// reach FAST must degrade, not fail (`18` §1.4).
/// </summary>
public sealed record FastResult<T>(bool Ok, T? Value, string? Error, int? StatusCode);

/// <summary>Builds a <see cref="FastResult{T}"/> — non-generic so the factory
/// methods do not sit on the generic type itself.</summary>
public static class FastResult
{
    public static FastResult<T> Success<T>(T value) => new(true, value, null, null);

    public static FastResult<T> Failure<T>(string error, int? statusCode = null) =>
        new(false, default, error, statusCode);
}

/// <summary>
/// How a FAST call is authenticated.
/// </summary>
/// <remarks>
/// ⚠️ <b>Every documented FAST endpoint is scoped to «the currently
/// authenticated user» and takes a Bearer JWT.</b> That makes the token the
/// central open question of this integration, not a detail:
/// <list type="bullet">
/// <item>Acting <b>as the user</b> needs their FAST access token — which
/// Expert Hub deliberately discards on sign-in (`P-215`), because nothing
/// called FAST on their behalf until now. Reversing that is a decision with a
/// security cost, not a config change.</item>
/// <item>Acting <b>as a service</b> needs a client-credentials grant and
/// endpoints that accept a service principal. The STS advertises the grant;
/// whether `/fa-api` accepts the token is still FAST's to confirm (`G28`, A10).</item>
/// </list>
/// Decided 2026-10-05: <b>as a service</b>, through
/// <see cref="ClientCredentialsFastTokenProvider"/> when the credential is
/// configured, and <see cref="NoFastToken"/> until then.
/// </remarks>
public interface IFastTokenProvider
{
    /// <summary>The bearer token for this call, or null when none is available.</summary>
    Task<string?> GetTokenAsync(CancellationToken cancellationToken);
}

/// <summary>The stand-in until the token question is answered.</summary>
public sealed class NoFastToken : IFastTokenProvider
{
    public Task<string?> GetTokenAsync(CancellationToken cancellationToken) =>
        Task.FromResult<string?>(null);
}

/// <summary>
/// The REST client for FAST's portal API (`/fa-api`) — the one place in the
/// product that speaks HTTP to FAST.
/// </summary>
/// <remarks>
/// <para>
/// <b>It absorbs the two envelopes so no caller has to.</b> The contract wraps
/// nearly every payload in either <c>ApiResponse</c>
/// (<c>success</c>/<c>message</c>/<c>value</c>, plus paging) or
/// <c>ReturnResult</c> (<c>isValid</c>/<c>message</c>/<c>errors</c>/<c>value</c>).
/// Branching per endpoint would spread that split through our code, so it is
/// unwrapped once, here.
/// </para>
/// <para>
/// ⚠️ <b>These field names were wrong until the API register of 2026-09-08.</b>
/// The earlier reference described <c>succeeded</c>/<c>isSuccess</c> and a
/// payload at <c>data</c>; the real names are <c>success</c>/<c>isValid</c> and
/// <c>value</c>. The failure mode was the worst kind — no exception and no
/// error, just the ENVELOPE deserialized as the payload, so a typed read came
/// back with every field null and reported success. It went unnoticed because
/// the only endpoint we consume, <c>Users/Info</c>, returns a bare object with
/// no envelope at all.
/// </para>
/// <para>
/// <b>76% of operations declare no response schema.</b> Reads therefore return
/// <see cref="JsonElement"/> unless we have a shape worth naming — an invented
/// DTO for an undeclared payload is a guess that compiles.
/// </para>
/// <para>
/// ⚠️ <b>Ships dark.</b> With no <c>Fast:BaseUrl</c> the client reports itself
/// unconfigured and every call fails closed with a reason, exactly as the AI
/// provider and the email gateway do (`18` §7.3).
/// </para>
/// </remarks>
public sealed class FastApiClient
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly IFastTokenProvider _tokens;
    private readonly string _baseUrl;

    public FastApiClient(HttpClient http, IFastTokenProvider tokens, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _http = http;
        _tokens = tokens;
        _baseUrl = (configuration["Fast:BaseUrl"] ?? string.Empty).TrimEnd('/');
        if (_baseUrl.Length > 0)
        {
            _http.Timeout = TimeSpan.FromSeconds(
                configuration.GetValue("Fast:TimeoutSeconds", 30));
        }
    }

    public bool IsConfigured => _baseUrl.Length > 0;

    /// <summary>A GET whose payload shape the contract does not declare.</summary>
    public Task<FastResult<JsonElement>> GetAsync(
        string path, string locale, CancellationToken cancellationToken) =>
        SendAsync<JsonElement>(HttpMethod.Get, path, null, locale, cancellationToken);

    /// <summary>A GET with a payload shape we have chosen to name.</summary>
    public Task<FastResult<T>> GetAsync<T>(
        string path, string locale, CancellationToken cancellationToken) =>
        SendAsync<T>(HttpMethod.Get, path, null, locale, cancellationToken);

    /// <summary>A POST — FAST uses it for both commands and searches.</summary>
    public Task<FastResult<T>> PostAsync<T>(
        string path, object? body, string locale, CancellationToken cancellationToken) =>
        SendAsync<T>(HttpMethod.Post, path, body, locale, cancellationToken);

    /// <summary>A POST whose reply we do not need to read beyond success.</summary>
    public async Task<FastResult<bool>> PostAsync(
        string path, object? body, string locale, CancellationToken cancellationToken)
    {
        var result = await SendAsync<JsonElement>(
            HttpMethod.Post, path, body, locale, cancellationToken).ConfigureAwait(false);
        return result.Ok
            ? FastResult.Success<bool>(true)
            : FastResult.Failure<bool>(result.Error ?? "Unknown error.", result.StatusCode);
    }

    /// <summary>
    /// A GET authenticated with a token the caller already holds.
    /// </summary>
    /// <remarks>
    /// For the one moment Expert Hub reliably has a FAST access token: the
    /// sign-in handshake, before `P-215` discards it. Everywhere else goes
    /// through <see cref="IFastTokenProvider"/>.
    /// </remarks>
    public Task<FastResult<T>> GetWithTokenAsync<T>(
        string path, string accessToken, string locale, CancellationToken cancellationToken) =>
        SendAsync<T>(HttpMethod.Get, path, null, locale, cancellationToken, accessToken);

    private async Task<FastResult<T>> SendAsync<T>(
        HttpMethod method,
        string path,
        object? body,
        string locale,
        CancellationToken cancellationToken,
        string? explicitToken = null)
    {
        if (!IsConfigured)
        {
            return FastResult.Failure<T>("The FAST API is not configured.");
        }

        var token = explicitToken
            ?? await _tokens.GetTokenAsync(cancellationToken).ConfigureAwait(false);
        if (string.IsNullOrWhiteSpace(token))
        {
            // Not an error to retry — nothing has been decided about how we
            // authenticate. Said plainly so it is not mistaken for an outage.
            return FastResult.Failure<T>(
                "No FAST access token is available for this call. See IFastTokenProvider.");
        }

        using var request = new HttpRequestMessage(
            method, $"{_baseUrl}/{path.TrimStart('/')}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        // Every endpoint switches its localized text on this header, so the
        // caller's locale travels with the call rather than being re-derived.
        request.Headers.AcceptLanguage.Add(
            new StringWithQualityHeaderValue(locale == "en" ? "en" : "ar"));
        if (body is not null)
        {
            request.Content = JsonContent.Create(body, options: Json);
        }

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, cancellationToken).ConfigureAwait(false);
        }
        // A request timeout (TaskCanceledException, which IS an
        // OperationCanceledException) must fail closed with a reason like any
        // other unreachable-FAST case — never escape into the caller's path.
        catch (Exception exception) when (exception is not OperationCanceledException
            || !cancellationToken.IsCancellationRequested)
        {
            return FastResult.Failure<T>($"FAST could not be reached: {exception.Message}");
        }

        using (response)
        {
            var raw = await response.Content.ReadAsStringAsync(cancellationToken)
                .ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                return FastResult.Failure<T>(
                    DescribeFailure(raw, response.ReasonPhrase), (int)response.StatusCode);
            }
            return Unwrap<T>(raw);
        }
    }

    /// <summary>
    /// Peels whichever envelope came back. Both carry the payload at
    /// <c>data</c>; they disagree only about how they spell success, so this
    /// accepts either and treats an absent flag as success — a 200 with no
    /// envelope is a bare payload, which some endpoints do return.
    /// </summary>
    public static FastResult<T> Unwrap<T>(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return FastResult.Failure<T>("FAST returned an empty body.");
        }

        JsonElement root;
        try
        {
            root = JsonDocument.Parse(raw).RootElement.Clone();
        }
        catch (JsonException exception)
        {
            return FastResult.Failure<T>($"FAST returned unreadable JSON: {exception.Message}");
        }

        if (root.ValueKind == JsonValueKind.Object)
        {
            // `isValid` is ReturnResult's, `success` is ApiResponse's. The two
            // legacy spellings are kept because they cost nothing and an
            // endpoint the register did not reach may still use them.
            var succeeded = Flag(root, "isValid")
                ?? Flag(root, "success")
                ?? Flag(root, "succeeded")
                ?? Flag(root, "isSuccess");
            if (succeeded == false)
            {
                return FastResult.Failure<T>(Message(root) ?? "FAST reported a failure.");
            }
            /*
             * ⚠️ Only unwrap when this really is an envelope. A bare payload
             * that happens to carry its own `value` field would otherwise be
             * silently reduced to that field — so the flag, or one of the
             * envelope's companions, has to be there too.
             */
            if (succeeded is not null || root.TryGetProperty("errors", out _))
            {
                if (root.TryGetProperty("value", out var value))
                {
                    return Deserialize<T>(value);
                }
                if (root.TryGetProperty("data", out var data))
                {
                    return Deserialize<T>(data);
                }
            }
        }
        return Deserialize<T>(root);
    }

    private static FastResult<T> Deserialize<T>(JsonElement element)
    {
        if (typeof(T) == typeof(JsonElement))
        {
            return FastResult.Success<T>((T)(object)element);
        }
        try
        {
            var value = element.Deserialize<T>(Json);
            return value is null
                ? FastResult.Failure<T>("FAST returned no payload.")
                : FastResult.Success<T>(value);
        }
        catch (JsonException exception)
        {
            return FastResult.Failure<T>(
                $"FAST's payload did not match the expected shape: {exception.Message}");
        }
    }

    private static bool? Flag(JsonElement root, string name) =>
        root.TryGetProperty(name, out var flag)
            && flag.ValueKind is JsonValueKind.True or JsonValueKind.False
            ? flag.GetBoolean()
            : null;

    /// <summary>
    /// The failure text. Both envelopes carry <c>message</c>, already localized
    /// by the <c>Accept-Language</c> header we send — so there is nothing to
    /// choose between, and `messageAr` is kept only for endpoints the register
    /// did not reach.
    /// </summary>
    private static string? Message(JsonElement root)
    {
        foreach (var name in new[] { "messageAr", "message" })
        {
            if (root.TryGetProperty(name, out var value)
                && value.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(value.GetString()))
            {
                return value.GetString();
            }
        }
        return null;
    }

    /// <summary>
    /// ⚠️ The contract declares almost no error shapes, so a failure body may
    /// be an envelope, a ProblemDetails, or HTML from a proxy. Read what can be
    /// read and fall back to the status line rather than guessing.
    /// </summary>
    private static string DescribeFailure(string raw, string? reasonPhrase)
    {
        try
        {
            var root = JsonDocument.Parse(raw).RootElement;
            return Message(root)
                ?? (root.TryGetProperty("detail", out var detail) ? detail.GetString() : null)
                ?? reasonPhrase
                ?? "FAST rejected the request.";
        }
        catch (JsonException)
        {
            return reasonPhrase ?? "FAST rejected the request.";
        }
    }
}
