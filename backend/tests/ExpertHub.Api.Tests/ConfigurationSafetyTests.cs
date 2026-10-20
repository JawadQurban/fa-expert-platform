using System.Text.Json;
using ExpertHub.Api.Configuration;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The rules about secrets, held to account.
/// </summary>
/// <remarks>
/// The API is the one component that may hold a client secret (<c>P-163</c>) —
/// and "may hold" means from the environment at runtime, never from a file in
/// this repository. These tests guard the difference, because it is the kind of
/// mistake that is invisible in review and permanent once pushed.
/// </remarks>
public sealed class ConfigurationSafetyTests
{
    private static string RepositoryRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "ExpertHub.sln")))
        {
            directory = directory.Parent;
        }
        Assert.NotNull(directory);
        return directory!.FullName;
    }

    /// <summary>
    /// ⚠️ A setting the deployment cannot reach is a setting that does not
    /// exist.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Found the hard way, twice in one sitting. <c>EXPERT_HUB_OIDC_SCOPES</c>
    /// sat in every environment file and reached nothing: it was written when
    /// the handshake ran in the browser, and after <c>P-163</c> moved the flow
    /// into the API nobody added the compose mapping. Editing it appeared to
    /// work and changed nothing. <c>Fast__BaseUrl</c> was the same shape of
    /// mistake — a client built, registered and documented, with no way to turn
    /// it on short of editing compose on the server.
    /// </para>
    /// <para>
    /// This is the fourth time the pattern has cost something (`P-218`,
    /// `P-219`, `P-223`): a thing built and never connected to its caller. The
    /// remedy is the same each time — the switch and its wire in one change —
    /// so here is the assertion that notices.
    /// </para>
    /// </remarks>
    [Theory]
    [InlineData("Oidc__Authority")]
    [InlineData("Oidc__ClientId")]
    [InlineData("Oidc__Scopes")]
    [InlineData("ConnectionStrings__ExpertHub")]
    [InlineData("Documents__RootPath")]
    [InlineData("Fast__BaseUrl")]
    [InlineData("Fast__ClientId")]
    [InlineData("Fast__ClientSecret")]
    [InlineData("Access__TrainerFastRoles")]
    [InlineData("Teams__ClientSecret")]
    [InlineData("Teams__OrganizerUpn")]
    [InlineData("Storage__Provider")]
    [InlineData("Storage__AzureBlob__ContainerName")]
    [InlineData("Storage__AzureBlob__ConnectionString")]
    public void Every_setting_a_deployment_must_change_is_reachable_from_compose(string key)
    {
        var compose = Path.Combine(
            RepositoryRoot(), "..", "deploy", "docker-compose.yml");
        Assert.True(File.Exists(compose), $"compose file not found at {compose}");

        var text = File.ReadAllText(compose);
        Assert.True(
            text.Contains(key + ":", StringComparison.Ordinal),
            $"`{key}` is read by the API but no compose environment entry sets it, so no "
            + "deployment can change it. Add it to the expert-hub-api service.");
    }

    [Theory]
    [InlineData("src/ExpertHub.Api/appsettings.json")]
    [InlineData("src/ExpertHub.Api/appsettings.Development.json")]
    public void Committed_settings_carry_no_secret_and_no_connection_string(string relativePath)
    {
        var path = Path.Combine(RepositoryRoot(), relativePath);
        if (!File.Exists(path))
        {
            return;
        }

        using var document = JsonDocument.Parse(File.ReadAllText(path));

        // Values, not raw text: a leaked secret is a *value*, and scanning the
        // whole file flags the very comments that tell people where secrets go.
        foreach (var (key, value) in Values(document.RootElement))
        {
            if (value.Length == 0)
            {
                continue;
            }

            var sensitive =
                key.Contains("secret", StringComparison.OrdinalIgnoreCase) ||
                key.Contains("password", StringComparison.OrdinalIgnoreCase) ||
                key.Contains("apikey", StringComparison.OrdinalIgnoreCase) ||
                // `P-370` — Storage:AzureBlob:ConnectionString carries the account key.
                key.Contains("connectionstring", StringComparison.OrdinalIgnoreCase);

            Assert.False(
                sensitive,
                $"{relativePath} commits a value for \"{key}\". Secrets come from the environment.");

            // A connection string may be *named* here but never carry a value.
            Assert.False(
                key.StartsWith("ConnectionStrings:", StringComparison.Ordinal),
                $"{relativePath} commits a value for {key}. Use ConnectionStrings__ExpertHub.");

            foreach (var marker in new[] { "password=", "pwd=", "accountkey=", "sharedaccesssignature=", "sig=" })
            {
                Assert.DoesNotContain(marker, value, StringComparison.OrdinalIgnoreCase);
            }
        }
    }

    /// <summary>
    /// `P-370` — the storage account key never lands in a tracked file: not in
    /// settings, compose, the env templates, the docs or the code. An Azure
    /// account key is 88 characters of base64; a placeholder is not.
    /// </summary>
    [Fact]
    public void No_tracked_file_carries_an_azure_storage_account_key()
    {
        var repository = Path.GetFullPath(Path.Combine(RepositoryRoot(), ".."));
        var key = new System.Text.RegularExpressions.Regex(
            @"AccountKey=[A-Za-z0-9+/]{40,}={0,2}|[?&]sig=[A-Za-z0-9%+/=]{20,}");
        string[] extensions = [".json", ".env", ".example", ".yml", ".yaml", ".md", ".cs", ".sh", ".conf"];
        var leaks = new[] { "backend/src", "backend/tests", "deploy", "docs", "context" }
            .Select(folder => Path.Combine(repository, folder))
            .Where(Directory.Exists)
            .SelectMany(folder => Directory.EnumerateFiles(folder, "*", SearchOption.AllDirectories))
            .Where(file => extensions.Contains(Path.GetExtension(file), StringComparer.OrdinalIgnoreCase)
                && !file.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.Ordinal)
                && !file.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
            .Where(file => key.IsMatch(File.ReadAllText(file)))
            .Select(file => Path.GetRelativePath(repository, file))
            .ToList();

        Assert.True(leaks.Count == 0,
            "An Azure Storage key or SAS signature is committed in: " + string.Join(", ", leaks)
            + ". It belongs in env/api.secrets.env on the server only.");
    }

    /// <summary>Every string leaf in the document, with its dotted path.</summary>
    private static IEnumerable<(string Key, string Value)> Values(JsonElement element, string prefix = "")
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    var key = prefix.Length == 0 ? property.Name : $"{prefix}:{property.Name}";
                    foreach (var pair in Values(property.Value, key))
                    {
                        yield return pair;
                    }
                }
                break;

            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    foreach (var pair in Values(item, prefix))
                    {
                        yield return pair;
                    }
                }
                break;

            case JsonValueKind.String:
                yield return (prefix, element.GetString() ?? string.Empty);
                break;
        }
    }

    [Fact]
    public void An_unconfigured_oidc_client_reports_itself_rather_than_half_starting()
    {
        // Same rule as the frontend (`isOidcConfigured`): a partly-configured
        // client fails in ways that look like an outage, so "not configured" is
        // a state the code can see rather than a surprise at sign-in.
        Assert.False(new OidcOptions().IsConfigured);
        Assert.False(new OidcOptions { Authority = "https://sso.example.gov.sa" }.IsConfigured);
        Assert.False(new OidcOptions { ClientId = "expert-hub-api" }.IsConfigured);

        Assert.True(
            new OidcOptions
            {
                Authority = "https://sso.example.gov.sa",
                ClientId = "expert-hub-api",
            }.IsConfigured);
    }

    [Fact]
    public void A_public_client_is_representable_so_a_missing_secret_is_not_an_error()
    {
        // FAST may register either client type (`P-163`). A public client simply
        // has no secret, and PKCE protects the exchange either way.
        var publicClient = new OidcOptions
        {
            Authority = "https://sso.example.gov.sa",
            ClientId = "expert-hub-api",
        };

        Assert.True(publicClient.IsConfigured);
        Assert.Equal(string.Empty, publicClient.ClientSecret);
    }
}
