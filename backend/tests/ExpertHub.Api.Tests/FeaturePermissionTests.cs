using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core.Domain;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// P-190 — permissions are enforced per FEATURE, not per capability or per
/// role. The distinction is the whole point, so it is tested directly: two
/// features of the SAME capability must be able to answer differently for
/// the same person.
/// </summary>
public sealed class FeaturePermissionTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;

    public FeaturePermissionTests(WebApplicationFactory<Program> factory) => _factory = factory;

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

    /* ── the crux: same capability, different features, different answers ─── */

    [Fact]
    public async Task Two_features_of_one_capability_answer_differently_for_the_same_person()
    {
        var applicationId = await SubmittedApplicationAsync();
        using var staff = await SignInAsync("perm-staff", "موظف العمليات", RoleCode.Staff);

        // CAP-02, feature F-0201 الفرز الأولي — Staff's, in the default
        // matrix: the daily operational work their BRD description names.
        var screening = await staff.GetAsync(
            $"/api/v1/internal/applications/{applicationId}/screening");
        Assert.Equal(HttpStatusCode.OK, screening.StatusCode);

        // CAP-02, feature F-0204 قرار لجنة — the SAME capability, and refused:
        // the committee decision is «الاعتماد والقرارات الإشرافية», which the
        // BRD gives the Manager. A capability-level check could not tell
        // these two apart; a feature-level one does.
        var committee = await staff.GetAsync(
            $"/api/v1/internal/applications/{applicationId}/committee");
        Assert.Equal(HttpStatusCode.Forbidden, committee.StatusCode);
        var problem = await committee.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("F-0204", problem.GetProperty("featureCode").GetString());

        // The Manager holds both — «يملك جميع صلاحيات الموظف، بالإضافة إلى…».
        using var manager = await SignInAsync("perm-manager", "المدير", RoleCode.Manager);
        Assert.Equal(HttpStatusCode.OK, (await manager.GetAsync(
            $"/api/v1/internal/applications/{applicationId}/screening")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await manager.GetAsync(
            $"/api/v1/internal/applications/{applicationId}/committee")).StatusCode);
    }

    /* ── fail closed: internal-by-claim opens nothing ──────────────────────── */

    [Fact]
    public async Task An_internal_session_with_no_platform_role_can_reach_nothing()
    {
        var applicationId = await SubmittedApplicationAsync();
        // Signed in, mapped to the internal role by the provider's claim —
        // and holding no `USER_ROLE` row, which is what a newcomer is.
        using var stranger = await SignInAsync("perm-stranger", "زائر داخلي", platformRole: null);

        foreach (var path in new[]
        {
            $"/api/v1/internal/applications/{applicationId}/screening",
            $"/api/v1/internal/applications/{applicationId}/committee",
            $"/api/v1/internal/applications/{applicationId}/agreement",
            "/api/v1/internal/service-requests/",
            "/api/v1/internal/notifications/matrix",
            "/api/v1/internal/sla/",
            "/api/v1/internal/agreements/",
            "/api/v1/internal/access/matrix",
        })
        {
            var response = await stranger.GetAsync(path);
            Assert.True(
                response.StatusCode == HttpStatusCode.Forbidden,
                $"{path} answered {(int)response.StatusCode}, expected 403");
        }
    }

    /* ── configuration is not operations, and operations are not config ───── */

    [Fact]
    public async Task The_administrator_configures_and_the_staff_operate_and_neither_is_the_other()
    {
        var applicationId = await SubmittedApplicationAsync();
        using var admin = await SignInAsync(
            "perm-admin", "مشرف النظام", RoleCode.SystemAdministrator);
        using var staff = await SignInAsync("perm-staff2", "موظف", RoleCode.Staff);

        // «يدير إعدادات المنصة، والأدوار، والصلاحيات» — the administrator
        // reaches the access matrix (F-0801) and the notification console
        // (F-0702); the staff member reaches neither.
        Assert.Equal(HttpStatusCode.OK,
            (await admin.GetAsync("/api/v1/internal/access/matrix")).StatusCode);
        Assert.Equal(HttpStatusCode.OK,
            (await admin.GetAsync("/api/v1/internal/notifications/matrix")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await staff.GetAsync("/api/v1/internal/access/matrix")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await staff.GetAsync("/api/v1/internal/notifications/matrix")).StatusCode);

        // …and the reverse: configuration does not confer operations. The
        // administrator cannot screen an application (F-0201).
        Assert.Equal(HttpStatusCode.Forbidden, (await admin.GetAsync(
            $"/api/v1/internal/applications/{applicationId}/screening")).StatusCode);
    }

    /* ── the inbox feeds the internal journeys, so it serves real ids ─────── */

    [Fact]
    public async Task The_inbox_lists_real_applications_whose_ids_the_screening_page_opens()
    {
        var applicationId = await SubmittedApplicationAsync();
        using var staff = await SignInAsync("perm-inbox", "موظف الصندوق", RoleCode.Staff);

        var inbox = await staff.GetFromJsonAsync<JsonElement>(
            "/api/v1/internal/applications?page=1&pageSize=20");
        var row = inbox.GetProperty("items").EnumerateArray().Single();
        Assert.Equal(applicationId.ToString(), row.GetProperty("id").GetString());
        Assert.Equal("EH-2026-09001", row.GetProperty("reference").GetString());
        Assert.Equal("مقدّم الطلب", row.GetProperty("applicantName").GetString());
        Assert.Equal(1, inbox.GetProperty("totalOpen").GetInt32());

        // The point of the pairing: the id the inbox hands out is the id the
        // screening page opens. A demo inbox in front of a live screening
        // page answers "الطلب غير موجود" — found on the server, 2026-08-31.
        var screening = await staff.GetAsync(
            $"/api/v1/internal/applications/{row.GetProperty("id").GetString()}/screening");
        Assert.Equal(HttpStatusCode.OK, screening.StatusCode);

        var dashboard = await staff.GetFromJsonAsync<JsonElement>("/api/v1/internal/dashboard");
        var awaiting = dashboard.GetProperty("metrics").EnumerateArray()
            .Single(m => m.GetProperty("id").GetString() == "awaiting-screening");
        Assert.Equal(1, awaiting.GetProperty("value").GetInt32());
        // BE-12 — a tile names WHERE it drills, not just a bare status, so
        // the material tile can point at a queue that has no application status.
        Assert.Equal("applications", awaiting.GetProperty("target").GetProperty("queue").GetString());
        Assert.Equal("submitted", awaiting.GetProperty("target").GetProperty("status").GetString());
        Assert.Single(dashboard.GetProperty("recent").EnumerateArray());
    }

    /* ── the default matrix, as the BRD's role descriptions imply it ───────── */

    [Fact]
    public async Task The_default_matrix_is_seeded_and_the_manager_holds_every_staff_grant()
    {
        await using var db = _database.CreateContext();
        var grants = await (
            from grant in db.RolePermissions
            join role in db.Roles on grant.RoleId equals role.RoleId
            join permission in db.Permissions on grant.PermissionId equals permission.PermissionId
            select new { role.Code, permission.FeatureCode, grant.Scope }).ToListAsync();

        Assert.NotEmpty(grants);
        var staff = grants.Where(g => g.Code == RoleCode.Staff)
            .Select(g => g.FeatureCode).ToHashSet();
        var manager = grants.Where(g => g.Code == RoleCode.Manager)
            .Select(g => g.FeatureCode).ToHashSet();

        // «يملك جميع صلاحيات الموظف، بالإضافة إلى…» — literally a superset.
        Assert.True(staff.IsProperSubsetOf(manager));
        Assert.Contains("F-0204", manager);
        Assert.DoesNotContain("F-0204", staff);

        // «ضمن نطاق طلبه فقط» — the coordinator's grants are centre-scoped,
        // and the trainer's reach only their own record (P-140, §8.8.3).
        Assert.All(
            grants.Where(g => g.Code == RoleCode.CentreCoordinator),
            g => Assert.Equal(DataScope.Centre, g.Scope));
        Assert.All(
            grants.Where(g => g.Code == RoleCode.Trainer),
            g => Assert.Equal(DataScope.Own, g.Scope));

        // «القراءة والتصدير فقط دون تنفيذ أي عمليات تشغيلية» — the executive
        // holds no operational feature at all.
        var executive = grants.Where(g => g.Code == RoleCode.Executive)
            .Select(g => g.FeatureCode).ToHashSet();
        foreach (var operational in new[] { "F-0201", "F-0204", "F-0301", "F-0305", "F-0801" })
        {
            Assert.DoesNotContain(operational, executive);
        }
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    private async Task<HttpClient> SignInAsync(string subject, string name, RoleCode? platformRole)
    {
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(
            client, _tokenEndpoint, "fa-staff", subject: subject, displayName: name);
        if (platformRole is { } granted)
        {
            await using var db = _database.CreateContext();
            var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
            var roleRow = await db.Roles.SingleAsync(r => r.Code == granted);
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
        return client;
    }

    /// <summary>A submitted application for the internal screens to look at.</summary>
    private async Task<Guid> SubmittedApplicationAsync()
    {
        await using var db = _database.CreateContext();
        var applicant = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = $"perm-applicant-{Guid.NewGuid():N}",
            Email = "perm-applicant@test.fa.gov.sa",
            FullNameAr = "مقدّم الطلب",
            FullNameEn = "Applicant",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            IsActive = true,
            IsEmployee = false,
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(applicant);
        var application = new Application
        {
            ApplicationId = Guid.NewGuid(),
            ApplicantUserId = applicant.UserId,
            SchemaVersion = FormSchemaVersions.Current,
            Reference = "EH-2026-09001",
            Status = ApplicationStatuses.Submitted,
            Origin = ApplicationOrigins.SelfService,
            CreatedAt = DateTime.UtcNow,
            SubmittedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Applications.Add(application);
        db.ApplicationServices.Add(new ApplicationServiceEntry
        {
            ApplicationServiceId = Guid.NewGuid(),
            ApplicationId = application.ApplicationId,
            Service = ApplicationServices.Trainer,
            Outcome = ServiceOutcomes.Pending,
        });
        await db.SaveChangesAsync();
        return application.ApplicationId;
    }
}
