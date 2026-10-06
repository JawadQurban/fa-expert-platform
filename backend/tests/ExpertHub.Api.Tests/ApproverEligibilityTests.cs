using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core.Domain;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// `DEF-05` — a sequence may only be formed from people who can actually act
/// on it.
///
/// <para>
/// The committee group requires `F-0204` and the agreement group `F-0301`, but
/// the approver pool was every active employee and formation validated only
/// `IsEmployee &amp;&amp; IsActive`. A creator could therefore seat somebody who
/// would be refused on their own turn — and there was no way out: re-forming
/// answers 409 «Already formed.», re-preparing answers 409 «Not editable at
/// this stage.», and only the stuck member could raise a modification request.
/// A permanent deadlock, reachable through the ordinary UI.
/// </para>
/// <para>
/// Fixed at the pool, not downstream: the pool now lists only holders of the
/// feature the surface requires, and formation re-checks it. Downstream
/// authorization is untouched — nothing was weakened to make this pass, and no
/// hand-off was invented.
/// </para>
/// </summary>
public sealed class ApproverEligibilityTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;

    public ApproverEligibilityTests(WebApplicationFactory<Program> factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        _configured = TestOidc.Configure(
            _factory,
            _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString));
    }

    public async Task DisposeAsync()
    {
        _configured?.Dispose();
        await _database.DisposeAsync();
    }

    public void Dispose() => _tokenEndpoint.Dispose();

    /* ── the pool only offers people who can act ───────────────────────────── */

    [Fact]
    public async Task The_committee_pool_offers_only_holders_of_the_committee_feature()
    {
        var applicationId = await ApplicationAtCommitteeAsync("elig-manager");

        // A Manager holds `F-0204`; a Centre coordinator does not.
        using var manager = await SignInAsync("elig-manager", "مدير", RoleCode.Manager);
        using var coordinator = await SignInAsync(
            "elig-coordinator", "منسق المركز", RoleCode.CentreCoordinator);
        var coordinatorId = await UserIdOfAsync("elig-coordinator");

        var screening = await GetAsync(
            manager, $"/api/v1/internal/applications/{applicationId}/screening");
        var pool = screening.GetProperty("committeePool").EnumerateArray()
            .Select(m => m.GetProperty("id").GetString())
            .ToArray();

        Assert.DoesNotContain(coordinatorId, pool);
        Assert.Contains(await UserIdOfAsync("elig-manager"), pool);
    }

    /* ── forming with someone who cannot act is refused ────────────────────── */

    [Fact]
    public async Task A_committee_cannot_seat_somebody_who_could_never_decide()
    {
        var applicationId = await ApplicationAtCommitteeAsync("elig-forming");
        using var manager = await SignInAsync("elig-forming", "مدير", RoleCode.Manager);
        using var coordinator = await SignInAsync(
            "elig-seated", "منسق المركز", RoleCode.CentreCoordinator);
        var coordinatorId = await UserIdOfAsync("elig-seated");

        var response = await manager.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new { members = new[] { new { approverId = coordinatorId, obligation = "mandatory" } } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // …and the refusal changed NOTHING. This is what makes the deadlock
        // unreachable rather than merely less likely: with no sequence written,
        // the creator can simply form a correct one.
        await using (var db = _database.CreateContext())
        {
            Assert.Empty(await db.CommitteeSequences
                .Where(s => s.ApplicationId == Guid.Parse(applicationId))
                .ToListAsync());
        }

        var second = await manager.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new
            {
                members = new[]
                {
                    new { approverId = await UserIdOfAsync("elig-forming"), obligation = "mandatory" },
                },
            });

        // NOT 409 «Already formed.» — the failed attempt left no state behind.
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
    }

    [Fact]
    public async Task An_authorized_member_forms_the_committee_and_can_then_decide()
    {
        var applicationId = await ApplicationAtCommitteeAsync("elig-both");
        using var manager = await SignInAsync("elig-both", "مدير", RoleCode.Manager);
        var managerId = await UserIdOfAsync("elig-both");

        var formed = await manager.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new { members = new[] { new { approverId = managerId, obligation = "mandatory" } } });
        Assert.Equal(HttpStatusCode.OK, formed.StatusCode);

        // The point of the whole defect: the person seated can take the next
        // required action rather than meeting a 403 on their own turn.
        var decided = await manager.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "approve", note = "موافق" });

        Assert.Equal(HttpStatusCode.OK, decided.StatusCode);
    }

    /* ── the same rule guards the signing sequence ─────────────────────────── */

    [Fact]
    public async Task The_signatory_pool_offers_only_holders_of_the_agreement_feature()
    {
        var applicationId = await ApplicationAtCommitteeAsync("elig-agr-manager");
        using var manager = await SignInAsync("elig-agr-manager", "مدير", RoleCode.Manager);
        using var coordinator = await SignInAsync(
            "elig-agr-coordinator", "منسق المركز", RoleCode.CentreCoordinator);

        var agreement = await GetAsync(
            manager, $"/api/v1/internal/applications/{applicationId}/agreement");
        var pool = agreement.GetProperty("approverPool").EnumerateArray()
            .Select(m => m.GetProperty("id").GetString())
            .ToArray();

        // Staff and Manager hold `F-0301`; the Centre coordinator does not.
        Assert.DoesNotContain(await UserIdOfAsync("elig-agr-coordinator"), pool);
        Assert.Contains(await UserIdOfAsync("elig-agr-manager"), pool);
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    /// <summary>An application whose services are all exempted, so it sits at
    /// the committee stage with nothing else in the way.</summary>
    private async Task<string> ApplicationAtCommitteeAsync(string creatorSubject)
    {
        using var applicant = await SignInAsync(
            $"applicant-{creatorSubject}", "مقدم الطلب");
        var applicationId = await SubmitAsync(applicant);

        // `BR-0215` — only the application's CREATOR forms its committee, so
        // the screening decision and the formation are the same person.
        using var decider = await SignInAsync(creatorSubject, "مدير الفرز", RoleCode.Manager);
        var response = await decider.PostAsJsonAsync(
            $"/api/v1/internal/applications/{applicationId}/screening/decision",
            new
            {
                kind = "accept",
                services = new[]
                {
                    new
                    {
                        service = "trainer",
                        path = "exemption",
                        slots = Array.Empty<string>(),
                        committeeMemberIds = Array.Empty<string>(),
                        exemptionReason = (string?)"prior-collaboration",
                        exemptionReasonOther = "",
                    },
                },
            });
        response.EnsureSuccessStatusCode();
        return applicationId;
    }

    private async Task<string> SubmitAsync(HttpClient applicant)
    {
        var started = await applicant.PostAsJsonAsync(
            "/api/v1/me/applications/draft/start", new { });
        started.EnsureSuccessStatusCode();

        var schema = await GetAsync(applicant, "/api/v1/applications/schema");
        var values = new Dictionary<string, object?>();
        foreach (var field in schema.GetProperty("fields").EnumerateArray())
        {
            var id = field.GetProperty("id").GetString()!;
            var hasPattern = field.TryGetProperty("validation", out var validation)
                && validation.TryGetProperty("pattern", out _);
            values[id] = field.GetProperty("type").GetString() switch
            {
                "checkbox" => true,
                "date" => "2020-01-15",
                "number" => "8",
                "select" => field.GetProperty("options")[0].GetProperty("value").GetString(),
                "multi-select" => new[]
                {
                    field.GetProperty("options")[0].GetProperty("value").GetString(),
                },
                _ when hasPattern => id == "idNumber"
                    ? "1012345678"
                    : "https://example.com/profile",
                _ => "قيمة تجريبية",
            };
        }

        await using (var db = _database.CreateContext())
        {
            var draft = await db.Applications
                .OrderByDescending(a => a.CreatedAt)
                .FirstAsync(a => a.Status == "draft");
            foreach (var rule in await db.AttachmentRules
                .Where(r => r.SchemaVersion == FormSchemaVersions.Current).ToListAsync())
            {
                db.ApplicationAttachments.Add(new ApplicationAttachment
                {
                    ApplicationAttachmentId = Guid.NewGuid(),
                    ApplicationId = draft.ApplicationId,
                    RuleCode = rule.RuleCode,
                    FileName = $"{rule.RuleCode}.pdf",
                    SizeBytes = 100_000,
                });
            }
            await db.SaveChangesAsync();
        }

        var submitted = await applicant.PostAsJsonAsync(
            "/api/v1/me/applications/submit",
            new { services = new[] { "trainer" }, values });
        submitted.EnsureSuccessStatusCode();
        return (await submitted.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("applicationId").GetString()!;
    }

    private async Task<HttpClient> SignInAsync(
        string subject, string name, RoleCode? platformRole = null)
    {
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(
            client, _tokenEndpoint,
            platformRole is null ? "unmapped" : "fa-staff",
            subject: subject, displayName: name);
        if (platformRole is { } granted)
        {
            await using (var db = _database.CreateContext())
            {
                var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
                var roleRow = await db.Roles.SingleAsync(r => r.Code == granted);
                // Idempotent: a test may sign the same person in more than once.
                var already = await db.UserRoles.AnyAsync(
                    ur => ur.UserId == user.UserId && ur.RoleId == roleRow.RoleId);
                if (!already)
                {
                    db.UserRoles.Add(new UserRole
                    {
                        UserRoleId = Guid.NewGuid(),
                        UserId = user.UserId,
                        RoleId = roleRow.RoleId,
                        AssignedBy = user.UserId,
                        AssignedAt = DateTime.UtcNow,
                    });
                    await db.SaveChangesAsync();
                }
            }
            // Sign in again so the session carries the role that was granted.
            await TestOidc.SignInAsync(
                client, _tokenEndpoint, "fa-staff", subject: subject, displayName: name);
        }
        return client;
    }

    private async Task<string> UserIdOfAsync(string externalId)
    {
        await using var db = _database.CreateContext();
        return (await db.Users.SingleAsync(u => u.ExternalIdentityId == externalId))
            .UserId.ToString();
    }

    private static async Task<JsonElement> GetAsync(HttpClient client, string url)
    {
        var response = await client.GetAsync(url);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }
}
