using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core.Domain;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// UAT — the per-provider readiness detail: internal staff only, every
/// unconfigured provider reported as such (never simulated READY), and not one
/// configuration value in the answer.
/// </summary>
public sealed class ProviderReadinessTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();
    private WebApplicationFactory<Program>? _configured;

    public ProviderReadinessTests(WebApplicationFactory<Program> factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        _configured = TestOidc.Configure(
            _factory, _tokenEndpoint, ("ConnectionStrings:ExpertHub", _database.ConnectionString));
    }

    public async Task DisposeAsync()
    {
        _configured?.Dispose();
        await _database.DisposeAsync();
    }

    public void Dispose() => _tokenEndpoint.Dispose();

    [Fact]
    public async Task Internal_staff_see_each_provider_honestly_and_no_configuration_value()
    {
        var anonymous = TestOidc.CreateClient(_configured!);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await anonymous.GetAsync("/api/v1/internal/readiness")).StatusCode);

        using var trainer = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(trainer, _tokenEndpoint, "fa-trainer", subject: "ready-trainer", displayName: "مدرب");
        Assert.Equal(HttpStatusCode.Forbidden,
            (await trainer.GetAsync("/api/v1/internal/readiness")).StatusCode);

        using var staff = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(staff, _tokenEndpoint, "fa-staff", subject: "ready-staff", displayName: "موظف");
        await GrantAsync("ready-staff", RoleCode.Staff);

        var raw = await staff.GetStringAsync("/api/v1/internal/readiness");
        var providers = JsonDocument.Parse(raw).RootElement.GetProperty("providers").EnumerateArray()
            .ToDictionary(p => p.GetProperty("provider").GetString()!, p => p.GetProperty("status").GetString());

        Assert.Equal(new Dictionary<string, string?>
        {
            ["database"] = "READY",
            ["sso"] = "READY",
            ["fast"] = "NOT_CONFIGURED",
            ["teams"] = "NOT_CONFIGURED",
            ["email"] = "NOT_CONFIGURED",
            ["e-signature"] = "PENDING_BUSINESS_APPROVAL",
            ["yaqeen"] = "NOT_CONFIGURED",
            ["antivirus"] = "NOT_CONFIGURED",
        }, providers);

        // Statuses only — the connection string, OIDC client and any URL stay out.
        Assert.DoesNotContain(_database.ConnectionString, raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Server=", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("http", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(TestOidc.ClientId, raw, StringComparison.OrdinalIgnoreCase);
    }

    private async Task GrantAsync(string subject, RoleCode role)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
        db.UserRoles.Add(new UserRole
        {
            UserRoleId = Guid.NewGuid(),
            UserId = user.UserId,
            RoleId = (await db.Roles.SingleAsync(r => r.Code == role)).RoleId,
            AssignedBy = user.UserId,
            AssignedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }
}
