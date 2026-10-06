using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Infrastructure.Fast;

/// <summary>
/// Expert Hub authenticating to FAST <b>as a service</b> — the OAuth 2.0
/// client-credentials grant against the FAST identity server, with the token
/// cached until shortly before it expires.
/// </summary>
/// <remarks>
/// <para>
/// Used for every call that has no signed-in person behind it (the reference
/// sync, and any server-to-server read). The sign-in read is untouched: it
/// still goes through <see cref="FastApiClient.GetWithTokenAsync{T}"/> with
/// the user's own token, because an endpoint scoped to «the currently
/// authenticated user» answers about the service principal when called as one.
/// </para>
/// <para>
/// Everything is configuration: <c>Fast:ClientId</c>, <c>Fast:ClientSecret</c>,
/// <c>Fast:Scope</c> (omitted when empty), and <c>Fast:TokenEndpoint</c> —
/// which, when empty, is DISCOVERED from <c>Fast:Authority</c> (defaulting to
/// <c>Oidc:Authority</c>, the same IMS), never guessed.
/// </para>
/// <para>
/// Fails closed: a token it cannot obtain is <c>null</c>, which
/// <see cref="FastApiClient"/> already reports as a reasoned failure. The
/// reason is logged without the response body, which could echo a credential.
/// </para>
/// </remarks>
public sealed partial class ClientCredentialsFastTokenProvider : IFastTokenProvider, IDisposable
{
    /// <summary>Renew this long before expiry, so a token never dies mid-call.</summary>
    private static readonly TimeSpan RenewalMargin = TimeSpan.FromSeconds(60);

    private readonly HttpClient _http;
    private readonly ILogger<ClientCredentialsFastTokenProvider> _logger;
    private readonly TimeProvider _clock;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly string _scope;
    private readonly string _authority;
    private readonly SemaphoreSlim _gate = new(1, 1);

    private string? _tokenEndpoint;
    private string? _token;
    private DateTimeOffset _renewAt;

    public ClientCredentialsFastTokenProvider(
        HttpClient http,
        IConfiguration configuration,
        ILogger<ClientCredentialsFastTokenProvider> logger,
        TimeProvider? clock = null)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _http = http;
        _logger = logger;
        _clock = clock ?? TimeProvider.System;
        _clientId = configuration["Fast:ClientId"] ?? string.Empty;
        _clientSecret = configuration["Fast:ClientSecret"] ?? string.Empty;
        _scope = configuration["Fast:Scope"] ?? string.Empty;
        _tokenEndpoint = NullIfEmpty(configuration["Fast:TokenEndpoint"]);
        _authority = (NullIfEmpty(configuration["Fast:Authority"])
            ?? configuration["Oidc:Authority"] ?? string.Empty).TrimEnd('/');
    }

    /// <summary>True when the configuration names a service credential at all.</summary>
    public static bool IsConfigured(IConfiguration configuration) =>
        !string.IsNullOrWhiteSpace(configuration["Fast:ClientId"])
        && !string.IsNullOrWhiteSpace(configuration["Fast:ClientSecret"]);

    public async Task<string?> GetTokenAsync(CancellationToken cancellationToken)
    {
        if (_token is not null && _clock.GetUtcNow() < _renewAt)
        {
            return _token;
        }
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            // Re-checked under the gate: the caller that waited may find the
            // token the first one just fetched.
            if (_token is not null && _clock.GetUtcNow() < _renewAt)
            {
                return _token;
            }
            return await RequestTokenAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !cancellationToken.IsCancellationRequested)
        {
            LogTokenFailed(_logger, exception.GetType().Name);
            return null;
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task<string?> RequestTokenAsync(CancellationToken cancellationToken)
    {
        var endpoint = _tokenEndpoint ??= await DiscoverTokenEndpointAsync(cancellationToken)
            .ConfigureAwait(false);
        if (endpoint is null)
        {
            LogTokenFailed(_logger, "no-token-endpoint");
            return null;
        }

        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = _clientId,
            ["client_secret"] = _clientSecret,
        };
        if (_scope.Length > 0)
        {
            form["scope"] = _scope;
        }
        using var content = new FormUrlEncodedContent(form);
        using var response = await _http.PostAsync(endpoint, content, cancellationToken)
            .ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            LogTokenFailed(_logger, $"HTTP {(int)response.StatusCode}");
            return null;
        }

        using var body = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false),
            cancellationToken: cancellationToken).ConfigureAwait(false);
        if (!body.RootElement.TryGetProperty("access_token", out var token)
            || token.GetString() is not { Length: > 0 } accessToken)
        {
            LogTokenFailed(_logger, "no-access-token-in-response");
            return null;
        }
        var lifetime = body.RootElement.TryGetProperty("expires_in", out var expires)
            && expires.TryGetInt32(out var seconds)
                ? TimeSpan.FromSeconds(seconds)
                : TimeSpan.FromMinutes(5);
        _token = accessToken;
        _renewAt = _clock.GetUtcNow() + (lifetime > RenewalMargin * 2 ? lifetime - RenewalMargin : lifetime / 2);
        return _token;
    }

    private async Task<string?> DiscoverTokenEndpointAsync(CancellationToken cancellationToken)
    {
        if (_authority.Length == 0)
        {
            return null;
        }
        using var response = await _http.GetAsync(
            $"{_authority}/.well-known/openid-configuration", cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }
        using var document = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false),
            cancellationToken: cancellationToken).ConfigureAwait(false);
        return document.RootElement.TryGetProperty("token_endpoint", out var endpoint)
            ? endpoint.GetString()
            : null;
    }

    /// <summary>Owns its client and its gate; the container disposes the singleton.</summary>
    public void Dispose()
    {
        _gate.Dispose();
        _http.Dispose();
    }

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value;

    [LoggerMessage(EventId = 5230, Level = LogLevel.Warning,
        Message = "FAST service token not obtained: {Reason}. FAST calls without a signed-in user fail closed until it is.")]
    private static partial void LogTokenFailed(ILogger logger, string reason);
}
