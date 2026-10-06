using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The first backend increment: the host boots, answers, and versions its
/// endpoints the way the frontend already calls them.
/// </summary>
/// <remarks>
/// These run against the real <c>Program</c> through
/// <c>WebApplicationFactory</c> rather than a rebuilt approximation, so a
/// startup failure — a missing binding, a validation that throws — fails here.
/// </remarks>
public sealed class ApiContractTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ApiContractTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task Health_reports_healthy_without_touching_a_dependency()
    {
        // Liveness answers "is this process up". If it consulted SQL Server, a
        // database blip would restart a perfectly healthy process.
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("healthy", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Endpoints_sit_behind_the_version_prefix_the_frontend_already_calls()
    {
        // Not a choice made here: `accessService.ts` and `notificationService.ts`
        // were written first and call `v1/internal/...` relative to
        // `apiBaseUrl` — and the API's mount is `/api`, fixed by the committed
        // callback path and the URL P-164 registered with FAST. So the full
        // in-app path is `/api/v1/...` and `apiBaseUrl` ends with `/api`.
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/{ApiVersions.V1}/ping");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("v1", body.GetProperty("version").GetString());
    }

    [Fact]
    public async Task An_unknown_route_is_a_problem_details_404_not_an_empty_body()
    {
        // The frontend's `Result<T, ExpertHubApiError>` expects a status and a
        // message on every error path.
        var client = _factory.CreateClient();

        var response = await client.GetAsync($"/{ApiVersions.V1}/does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }
}
