using System.Net;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// BE-12 — CAP-09. The capability owns no source data (§8.9.1), so the tests
/// are mostly about what it does NOT do: it writes nothing, it invents no
/// metric, and it hands a role only the dashboard that role was given.
/// </summary>
public sealed class Cap09Tests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;

    public Cap09Tests(WebApplicationFactory<Program> factory) => _factory = factory;

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

    /* ── §8.9.1 — owns no source data ──────────────────────────────────────── */

    [Fact]
    public async Task The_capability_has_no_write_operation_on_any_surface()
    {
        using var manager = await SignInAsync("cap09-mgr-w", "مدير", RoleCode.Manager);

        foreach (var path in new[]
        {
            "/api/v1/internal/dashboard",
            "/api/v1/me/home",
            // The export half `F-0905` names — unbuilt, and it must not be
            // reachable by guessing, because `Q26` defines no report.
            "/api/v1/internal/reports",
            "/api/v1/internal/reports/run",
        })
        {
            foreach (var method in new[] { HttpMethod.Post, HttpMethod.Put, HttpMethod.Delete })
            {
                using var request = new HttpRequestMessage(method, path);
                using var response = await manager.SendAsync(request);
                Assert.True(
                    response.StatusCode is HttpStatusCode.NotFound
                        or HttpStatusCode.MethodNotAllowed,
                    $"{method} {path} answered {(int)response.StatusCode} — CAP-09 owns no "
                        + "source data and has no write path (§8.9.1).");
            }
        }
    }

    [Fact]
    public async Task A_dashboard_read_stages_nothing_at_all()
    {
        using var manager = await SignInAsync("cap09-mgr-t", "مدير", RoleCode.Manager);
        await SeedApplicationAsync("cap09-app-t", ApplicationStatuses.UnderReview);

        // The rule stated where it can be checked: after serving the whole
        // dashboard, the change tracker holds nothing. A metric that quietly
        // cached a total would fail here.
        await using var db = _database.CreateContext();
        var before = db.ChangeTracker.Entries().Count();
        await GetAsync(manager, "/api/v1/internal/dashboard");
        Assert.Equal(before, db.ChangeTracker.Entries().Count());
        Assert.False(db.ChangeTracker.HasChanges());
    }

    /* ── the dashboard is definition-driven and role-scoped ────────────────── */

    [Fact]
    public async Task The_tiles_come_from_the_seeded_definitions_in_their_placed_order()
    {
        using var staff = await SignInAsync("cap09-staff", "موظف", RoleCode.Staff);

        var dashboard = await GetAsync(staff, "/api/v1/internal/dashboard");
        var ids = dashboard.GetProperty("metrics").EnumerateArray()
            .Select(m => m.GetProperty("id").GetString()!).ToArray();
        Assert.Equal(
            new[]
            {
                "awaiting-screening", "in-screening", "interviews",
                "awaiting-decision", "materials-awaiting-approval",
            },
            ids);

        // Every tile names where it drills. Four open the inbox by status;
        // «مواد بانتظار الاعتماد» opens the submission queue, which has no
        // application status — so it carries none rather than a plausible one.
        var material = dashboard.GetProperty("metrics").EnumerateArray()
            .Single(m => m.GetProperty("id").GetString() == "materials-awaiting-approval");
        Assert.Equal("submissions", material.GetProperty("target").GetProperty("queue").GetString());
        Assert.Equal(
            JsonValueKind.Null,
            material.GetProperty("target").GetProperty("status").ValueKind);

        var screening = dashboard.GetProperty("metrics").EnumerateArray()
            .Single(m => m.GetProperty("id").GetString() == "in-screening");
        Assert.Equal("applications",
            screening.GetProperty("target").GetProperty("queue").GetString());
        Assert.Equal("under-review",
            screening.GetProperty("target").GetProperty("status").GetString());
    }

    [Fact]
    public async Task The_counts_are_read_from_the_capabilities_that_own_them()
    {
        using var staff = await SignInAsync("cap09-staff-2", "موظف", RoleCode.Staff);
        await SeedApplicationAsync("cap09-a1", ApplicationStatuses.Submitted);
        await SeedApplicationAsync("cap09-a2", ApplicationStatuses.UnderReview);
        await SeedApplicationAsync("cap09-a3", ApplicationStatuses.UnderReview);
        // A draft is nobody's queue item — `BR-0107`, and the inbox agrees.
        await SeedApplicationAsync("cap09-a4", ApplicationStatuses.Draft);

        var dashboard = await GetAsync(staff, "/api/v1/internal/dashboard");
        Assert.Equal(1, ValueOf(dashboard, "awaiting-screening"));
        Assert.Equal(2, ValueOf(dashboard, "in-screening"));
        Assert.Equal(0, ValueOf(dashboard, "interviews"));
        // CAP-05 owns this one; nothing is pending approval yet.
        Assert.Equal(0, ValueOf(dashboard, "materials-awaiting-approval"));
        Assert.Equal(3, dashboard.GetProperty("totalOpen").GetInt32());
    }

    [Fact]
    public async Task A_role_whose_metrics_nobody_defined_gets_an_empty_dashboard()
    {
        using var coordinator = await SignInAsync(
            "cap09-centre", "منسق مركز", RoleCode.CentreCoordinator);
        using var executive = await SignInAsync("cap09-exec", "الإدارة العليا", RoleCode.Executive);
        await SeedApplicationAsync("cap09-a5", ApplicationStatuses.UnderReview);

        // §8.9 names both dashboards and defines neither one's metrics
        // (`Q26`). Empty says "nobody has decided"; the employee's tiles
        // would say something the Academy never said.
        foreach (var client in new[] { coordinator, executive })
        {
            var dashboard = await GetAsync(client, "/api/v1/internal/dashboard");
            Assert.Empty(dashboard.GetProperty("metrics").EnumerateArray());
            // The rest of the page is still theirs — the queue peek and the
            // open count are not metrics and were never role-scoped.
            Assert.Equal(1, dashboard.GetProperty("totalOpen").GetInt32());
        }
    }

    [Fact]
    public async Task A_role_with_no_dashboard_row_still_reaches_the_page()
    {
        // The system administrator has no `DASHBOARD` row — §8.9 names four
        // and theirs is not among them. That must not be a 500.
        using var admin = await SignInAsync(
            "cap09-admin", "مشرف النظام", RoleCode.SystemAdministrator);
        using var response = await admin.GetAsync("/api/v1/internal/dashboard");
        // They hold none of `F-0901`→`F-0904` either, so the gate answers
        // first — and it answers 403, not 500.
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    /* ── `F-0906` — the trainer's own overview ─────────────────────────────── */

    [Fact]
    public async Task The_portal_home_counts_only_the_callers_own_applications()
    {
        using var mine = await SignInAsync("cap09-trn-1", "مدرب الرئيسية", null);
        using var theirs = await SignInAsync("cap09-trn-2", "مدرب آخر", null);
        await SeedApplicationAsync("cap09-trn-1", ApplicationStatuses.Draft);
        await SeedApplicationAsync("cap09-trn-1", ApplicationStatuses.UnderReview);
        await SeedApplicationAsync("cap09-trn-2", ApplicationStatuses.UnderReview);

        var home = await GetAsync(mine, "/api/v1/me/home");
        var applications = home.GetProperty("applications");
        // `BR-0902` — own data only, and there is no parameter to widen.
        Assert.Equal(2, applications.GetProperty("total").GetInt32());
        Assert.Equal(1, applications.GetProperty("inProgress").GetInt32());
        // A draft is the trainer's own move to make.
        Assert.Equal(1, applications.GetProperty("requiresAction").GetInt32());
        Assert.Equal("مدرب الرئيسية", home.GetProperty("displayName").GetString());
        Assert.True(home.GetProperty("hasActivity").GetBoolean());
    }

    [Fact]
    public async Task A_brand_new_person_gets_the_empty_state_rather_than_zeroes_that_look_wrong()
    {
        using var newcomer = await SignInAsync("cap09-new", "قادم جديد", null);

        var home = await GetAsync(newcomer, "/api/v1/me/home");
        Assert.False(home.GetProperty("hasActivity").GetBoolean());
        Assert.Equal(0, home.GetProperty("programsCount").GetInt32());
        Assert.False(home.GetProperty("visibilityConsent").GetBoolean());
        // No trainer file, so no rating source — `unavailable`, never 0.0,
        // which would read as "we rated you nothing".
        Assert.Equal("unavailable", home.GetProperty("ratingState").GetString());
        Assert.Equal(JsonValueKind.Null, home.GetProperty("overallRating").ValueKind);
        Assert.Empty(home.GetProperty("notifications").EnumerateArray());

        /*
         * ⚠️ Reported from the testing server: this person was greeted as
         * «مدرب معتمد». The endpoint answered `certified` whenever there was
         * no trainer file — reading the ABSENCE of evidence as the evidence.
         * A classification belongs to a trainer, and this person holds only
         * the baseline `individual` role.
         */
        Assert.Equal(JsonValueKind.Null, home.GetProperty("classification").ValueKind);
    }

    [Fact]
    public async Task A_trainer_carries_a_classification_because_the_Academy_vouched_for_them()
    {
        /*
         * Owner ruling, 2026-09-08: the trainer role comes from the Academy's
         * own record, and «the trainer is already [an] approved trainer». So a
         * trainer with no trainer file yet is `certified` — the Academy has
         * vouched for them — while somebody holding only `individual` gets no
         * classification at all. The difference between this and the defect it
         * replaced is WHO gets the badge, not whether one exists.
         */
        using var trainer = await SignInAsync(
            "cap09-trainer-role", "مدرب معتمد", RoleCode.Trainer);

        var home = await GetAsync(trainer, "/api/v1/me/home");

        Assert.Equal("certified", home.GetProperty("classification").GetString());
    }

    [Fact]
    public async Task A_notification_carries_the_subject_that_was_actually_sent()
    {
        using var trainer = await SignInAsync("cap09-notif", "مدرب الإشعارات", null);
        await using (var db = _database.CreateContext())
        {
            var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == "cap09-notif");
            // No template is seeded — `Q33` leaves every message unwritten —
            // so the test writes the one it claims was sent.
            var template = new NotificationTemplate
            {
                TemplateId = Guid.NewGuid(),
                Code = "TPL-CAP09-TEST",
                SubjectAr = "تم اعتماد طلبك",
                SubjectEn = "Your application was approved",
                BodyAr = "نص",
                BodyEn = "body",
                Placeholders = "[]",
                Version = 1,
                Status = TemplateStatuses.Approved,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = user.UserId,
            };
            db.NotificationTemplates.Add(template);
            db.AppendNotificationLog(new NotificationLogEntry
            {
                LogId = Guid.NewGuid(),
                EventCode = "EV-0101",
                RecipientUserId = user.UserId,
                Channel = NotificationChannels.InPlatform,
                Language = "ar",
                TemplateCode = template.Code,
                TemplateVersion = template.Version,
                SendStatus = "sent",
                SentAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var home = await GetAsync(trainer, "/api/v1/me/home");
        var notification = home.GetProperty("notifications").EnumerateArray().Single();
        // The subject that was actually sent, recovered from the code and
        // version the log stored — never re-composed here.
        Assert.Equal("تم اعتماد طلبك", notification.GetProperty("title").GetString());
        // ⚠️ Both are `DM-GAP-08` held honestly: the log records what was
        // SENT and has no read state, and the event catalogue carries no tone.
        Assert.False(notification.GetProperty("read").GetBoolean());
        Assert.Equal("info", notification.GetProperty("kind").GetString());
        Assert.True(home.GetProperty("hasActivity").GetBoolean());
    }

    /* ── the seeded definitions ────────────────────────────────────────────── */

    [Fact]
    public async Task Every_metric_definition_ships_without_a_formula()
    {
        await using var db = _database.CreateContext();
        var metrics = await db.MetricDefinitions.ToListAsync();
        Assert.Equal(5, metrics.Count);
        // ⚠️ `DM-GAP-09`/`Q26` — §8.9 writes no formulas, so none is stored.
        // A row that acquired one would mean somebody invented it.
        Assert.All(metrics, m => Assert.Null(m.Formula));
        Assert.All(metrics, m => Assert.NotEqual("CAP-09", m.SourceCapability));

        // Four dashboards, one per role §8.9 names, and only two carry tiles.
        var dashboards = await db.Dashboards.ToListAsync();
        Assert.Equal(4, dashboards.Count);
        Assert.Equal(4, dashboards.Select(d => d.RoleId).Distinct().Count());
        var placements = await db.DashboardMetrics.ToListAsync();
        Assert.Equal(2, placements.Select(p => p.DashboardId).Distinct().Count());
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    /// <summary>
    /// One application belonging to <paramref name="subject"/>, creating the
    /// applicant if they have never signed in — the dashboard counts
    /// applications, and most of them belong to people who are not the caller.
    /// </summary>
    private async Task SeedApplicationAsync(string subject, string status)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.FirstOrDefaultAsync(u => u.ExternalIdentityId == subject);
        if (user is null)
        {
            user = new AppUser
            {
                UserId = Guid.NewGuid(),
                ExternalIdentityId = subject,
                Email = $"{subject}@example.invalid",
                FullNameAr = subject,
                FullNameEn = subject,
                PreferredCommunicationLanguage = "ar",
                PreferredUiLanguage = "ar",
                CreatedAt = DateTime.UtcNow,
            };
            db.Users.Add(user);
        }
        db.Applications.Add(new Application
        {
            ApplicationId = Guid.NewGuid(),
            ApplicantUserId = user.UserId,
            SchemaVersion = FormSchemaVersions.Current,
            Reference = status == ApplicationStatuses.Draft
                ? null
                : $"EH-2026-{Random.Shared.Next(10000, 99999)}",
            Status = status,
            Origin = ApplicationOrigins.SelfService,
            CreatedAt = DateTime.UtcNow,
            SubmittedAt = status == ApplicationStatuses.Draft ? null : DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }

    private static int ValueOf(JsonElement dashboard, string metricId) =>
        dashboard.GetProperty("metrics").EnumerateArray()
            .Single(m => m.GetProperty("id").GetString() == metricId)
            .GetProperty("value").GetInt32();

    private async Task<HttpClient> SignInAsync(string subject, string name, RoleCode? platformRole)
    {
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(
            client, _tokenEndpoint,
            platformRole is null ? "unmapped" : "fa-staff",
            subject: subject, displayName: name);
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

    private static async Task<JsonElement> GetAsync(HttpClient client, string path)
    {
        var response = await client.GetAsync(path);
        var payload = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 from {path}, got {(int)response.StatusCode}: {payload}");
        return JsonSerializer.Deserialize<JsonElement>(payload);
    }
}
