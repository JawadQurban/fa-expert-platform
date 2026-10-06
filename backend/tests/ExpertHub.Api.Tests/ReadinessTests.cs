using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The liveness/readiness split, held apart: <c>/health</c> answers "is this
/// process up" and touches nothing; <c>/health/ready</c> answers "can it
/// serve" and consults the database.
/// </summary>
[Collection(LocalDbCollection.Name)]
public sealed class ReadinessTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database;

    public ReadinessTests(WebApplicationFactory<Program> factory, LocalDbFixture database)
    {
        _factory = factory;
        _database = database;
    }

    [Fact]
    public async Task Readiness_reports_unready_while_no_database_is_configured()
    {
        // The committed configuration deliberately carries no connection
        // string, so out of the box the process is alive but cannot serve —
        // and must say so on the readiness endpoint, not by crashing.
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unhealthy", body.GetProperty("status").GetString());
        var check = Assert.Single(body.GetProperty("checks").EnumerateArray());
        Assert.Equal("database", check.GetProperty("name").GetString());
        Assert.Contains(
            "No database is configured",
            check.GetProperty("reason").GetString(),
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task Readiness_reports_ready_when_the_database_answers()
    {
        using var configured = _factory.WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:ExpertHub", _database.ConnectionString));
        var client = configured.CreateClient();

        var response = await client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Healthy", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Liveness_stays_healthy_even_with_no_database()
    {
        // The other half of the split: a database outage must take the
        // instance out of rotation, never restart it.
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
