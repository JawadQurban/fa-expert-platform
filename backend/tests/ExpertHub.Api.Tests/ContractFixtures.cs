using System.Text.Encodings.Web;
using System.Text.Json;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The API's real response shapes, shared with the frontend.
/// </summary>
/// <remarks>
/// <para>
/// J-18 … J-22 passed hundreds of frontend tests and failed on the first live
/// response, because every one of those tests fed the page the MOCK provider's
/// idea of the payload. The mock and the API were two contracts that nobody
/// compared. Each fixture here is a response the API actually returned during a
/// test, stored under `frontend/src/contracts/fixtures/`. The
/// frontend's contract tests render those fixtures through the HTTP provider,
/// and this check fails the backend build when a response's SHAPE (property
/// names and value kinds) stops matching its fixture.
/// </para>
/// <para>
/// Regenerate after a deliberate contract change:
/// <c>EXPERT_HUB_WRITE_CONTRACTS=1 dotnet test</c>, then update the frontend to
/// match. A missing fixture is a failure, not a silent write.
/// </para>
/// </remarks>
internal static class ContractFixtures
{
    private static readonly JsonSerializerOptions Pretty = new()
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    public static void Verify(string name, JsonElement actual)
    {
        var path = Path.Combine(Directory(), $"{name}.json");
        if (Environment.GetEnvironmentVariable("EXPERT_HUB_WRITE_CONTRACTS") == "1")
        {
            System.IO.Directory.CreateDirectory(Directory());
            File.WriteAllText(path, JsonSerializer.Serialize(actual, Pretty) + "\n");
            return;
        }
        Assert.True(File.Exists(path),
            $"Contract fixture `{name}` is missing ({path}). Run with EXPERT_HUB_WRITE_CONTRACTS=1.");
        using var fixture = JsonDocument.Parse(File.ReadAllText(path));
        var problems = new List<string>();
        Compare(fixture.RootElement, actual, "$", problems);
        Assert.True(problems.Count == 0,
            $"The API response no longer matches contract `{name}` — the frontend renders that "
            + $"fixture, so update both together:\n  {string.Join("\n  ", problems)}");
    }

    /// <summary>Same property names and value kinds; null matches anything (nullable).</summary>
    private static void Compare(JsonElement expected, JsonElement actual, string at, List<string> problems)
    {
        if (expected.ValueKind == JsonValueKind.Null || actual.ValueKind == JsonValueKind.Null)
        {
            return;
        }
        if (Kind(expected) != Kind(actual))
        {
            problems.Add($"{at}: fixture has {expected.ValueKind}, API returned {actual.ValueKind}");
            return;
        }
        switch (expected.ValueKind)
        {
            case JsonValueKind.Object:
                var expectedNames = expected.EnumerateObject().Select(p => p.Name).ToHashSet(StringComparer.Ordinal);
                var actualNames = actual.EnumerateObject().Select(p => p.Name).ToHashSet(StringComparer.Ordinal);
                foreach (var missing in expectedNames.Except(actualNames))
                {
                    problems.Add($"{at}.{missing}: in the fixture, not returned by the API");
                }
                foreach (var added in actualNames.Except(expectedNames))
                {
                    problems.Add($"{at}.{added}: returned by the API, not in the fixture");
                }
                foreach (var name in expectedNames.Intersect(actualNames))
                {
                    Compare(expected.GetProperty(name), actual.GetProperty(name), $"{at}.{name}", problems);
                }
                break;
            case JsonValueKind.Array when expected.GetArrayLength() > 0 && actual.GetArrayLength() > 0:
                Compare(expected[0], actual[0], $"{at}[0]", problems);
                break;
        }
    }

    private static string Kind(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.True or JsonValueKind.False => "bool",
        var kind => kind.ToString(),
    };

    private static string Directory()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "ExpertHub.sln")))
        {
            directory = directory.Parent;
        }
        Assert.NotNull(directory);
        return Path.GetFullPath(Path.Combine(
            directory!.FullName, "..", "frontend", "src", "contracts", "fixtures"));
    }
}
