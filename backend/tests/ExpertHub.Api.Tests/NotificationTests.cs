using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ExpertHub.Api.Tests;

/// <summary>
/// BE-05 — CAP-07 held to its four structural rules on a real database:
/// capabilities emit and know nothing (`BR-0703`), both channels fire
/// together and independently (`BR-0702`), only approved bilingual templates
/// route (`BR-0701`), and every send is one language from the recipient's
/// own field (`BR-0707`) — with the email riding BE-04's outbox.
/// </summary>
public sealed class NotificationTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;
    private HttpClient _client = null!;

    public NotificationTests(WebApplicationFactory<Program> factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        // The signed-in internal user is a bootstrap administrator, so the
        // BR-0704 gate opens for them (P-181's persisted grant).
        _configured = TestOidc.Configure(
            _factory,
            _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString),
            ("Access:BootstrapAdministrators", TestOidc.Subject));
        _client = TestOidc.CreateClient(_configured);
    }

    public async Task DisposeAsync()
    {
        _configured?.Dispose();
        await _database.DisposeAsync();
    }

    public void Dispose() => _tokenEndpoint.Dispose();

    private Task<JsonElement> SignInAdministratorAsync() =>
        TestOidc.SignInAsync(_client, _tokenEndpoint, "fa-staff");

    /* ── the gate ──────────────────────────────────────────────────────────── */

    [Fact]
    public async Task The_notification_surface_denies_anonymous_callers()
    {
        foreach (var path in new[]
        {
            "/api/v1/internal/notifications/matrix",
            "/api/v1/internal/notifications/log",
            "/api/v1/internal/sla",
        })
        {
            var response = await _client.GetAsync(path);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }

    /* ── the catalogue and the gaps, served as such ────────────────────────── */

    [Fact]
    public async Task The_matrix_serves_twenty_cited_events_with_no_routing_and_no_template()
    {
        await SignInAdministratorAsync();
        var matrix = await GetJsonAsync("/api/v1/internal/notifications/matrix");

        var events = matrix.GetProperty("events").EnumerateArray().ToArray();
        Assert.Equal(20, events.Length);
        Assert.All(events, e =>
            Assert.False(string.IsNullOrWhiteSpace(e.GetProperty("source").GetString())));

        // DM-GAP-08 and Q33, served rather than filled.
        Assert.Empty(matrix.GetProperty("rows").EnumerateArray());
        Assert.Empty(matrix.GetProperty("templates").EnumerateArray());
        Assert.Equal("unapproved", matrix.GetProperty("modelStatus").GetString());
        Assert.Equal(12, matrix.GetProperty("knownPlaceholders").GetArrayLength());
        Assert.True(matrix.GetProperty("canManageTemplates").GetBoolean());
    }

    /* ── BR-0701/BR-0704 — the template lifecycle ──────────────────────────── */

    [Fact]
    public async Task A_template_routes_only_approved_and_editing_unroutes_it()
    {
        await SignInAdministratorAsync();

        // Draft: saving succeeds, approving the incomplete half does not.
        var draft = await PostJsonAsync("/api/v1/internal/notifications/templates", new
        {
            code = "TPL-TEST-OFFER",
            subjectAr = "عرض إسناد: {{programName}}",
            subjectEn = "",
            bodyAr = "مرحبًا {{recipientName}}، لديك عرض إسناد.",
            bodyEn = "",
        });
        var template = draft.GetProperty("templates").EnumerateArray().Single();
        var templateId = template.GetProperty("templateId").GetString()!;
        Assert.Equal("draft", template.GetProperty("status").GetString());
        Assert.Equal(1, template.GetProperty("version").GetInt32());

        var incomplete = await _client.PostAsync(
            $"/api/v1/internal/notifications/templates/{templateId}/approve", null);
        Assert.Equal(HttpStatusCode.BadRequest, incomplete.StatusCode);

        // A draft cannot be routed (BR-0701).
        var draftRoute = await _client.PostAsJsonAsync(
            "/api/v1/internal/notifications/matrix/EV-0501/routing",
            new { templateId, audience = new[] { "record_subject" } });
        Assert.Equal(HttpStatusCode.BadRequest, draftRoute.StatusCode);

        // Complete both languages → approve → route.
        await PostJsonAsync($"/api/v1/internal/notifications/templates/{templateId}", new
        {
            code = "TPL-TEST-OFFER",
            subjectAr = "عرض إسناد: {{programName}}",
            subjectEn = "Assignment offer: {{programName}}",
            bodyAr = "مرحبًا {{recipientName}}، لديك عرض إسناد.",
            bodyEn = "Hello {{recipientName}}, you have an assignment offer.",
        });
        var approved = await PostJsonAsync(
            $"/api/v1/internal/notifications/templates/{templateId}/approve", null);
        Assert.Equal(
            "approved",
            approved.GetProperty("templates").EnumerateArray().Single()
                .GetProperty("status").GetString());

        var routed = await PostJsonAsync(
            "/api/v1/internal/notifications/matrix/EV-0501/routing",
            new { templateId, audience = new[] { "record_subject", "staff" } });
        var row = routed.GetProperty("rows").EnumerateArray().Single();
        Assert.Equal("routed", row.GetProperty("status").GetString());
        Assert.Equal("EV-0501", row.GetProperty("eventCode").GetString());
        Assert.True(row.GetProperty("isActive").GetBoolean());

        // Editing the approved wording returns it to draft AND unroutes the
        // row — the approval was of the wording, and the wording changed.
        var edited = await PostJsonAsync($"/api/v1/internal/notifications/templates/{templateId}", new
        {
            code = "TPL-TEST-OFFER",
            subjectAr = "عرض إسناد محدث",
            subjectEn = "Updated assignment offer",
            bodyAr = "نص جديد.",
            bodyEn = "New wording.",
        });
        var reverted = edited.GetProperty("templates").EnumerateArray().Single();
        Assert.Equal("draft", reverted.GetProperty("status").GetString());
        Assert.Equal(3, reverted.GetProperty("version").GetInt32());
        Assert.Empty(edited.GetProperty("rows").EnumerateArray());
    }

    [Fact]
    public async Task Routing_validates_the_event_the_audience_and_the_placeholders()
    {
        await SignInAdministratorAsync();

        var unknownEvent = await _client.PostAsJsonAsync(
            "/api/v1/internal/notifications/matrix/EV-9999/routing",
            new { templateId = Guid.NewGuid().ToString(), audience = new[] { "staff" } });
        Assert.Equal(HttpStatusCode.NotFound, unknownEvent.StatusCode);

        var unknownPlaceholder = await _client.PostAsJsonAsync(
            "/api/v1/internal/notifications/templates",
            new { code = "TPL-BAD", subjectAr = "س", subjectEn = "s", bodyAr = "{{notAThing}}", bodyEn = "x" });
        Assert.Equal(HttpStatusCode.BadRequest, unknownPlaceholder.StatusCode);

        // An unrouted row has nothing to pause.
        var pause = await _client.PostAsJsonAsync(
            "/api/v1/internal/notifications/matrix/EV-0101/active", new { isActive = false });
        Assert.Equal(HttpStatusCode.Conflict, pause.StatusCode);
    }

    [Fact]
    public async Task A_non_administrator_internal_session_cannot_manage_templates()
    {
        // Internal by claim mapping, but holding no USER_ROLE row — BR-0704
        // is decided from the platform's own table (P-181), not the session.
        using var plain = TestOidc.Configure(
            _factory,
            _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString));
        var client = TestOidc.CreateClient(plain);
        await TestOidc.SignInAsync(client, _tokenEndpoint, "fa-staff");

        // P-190 — with feature-level permissions the refusal comes EARLIER
        // and is stronger: holding no `USER_ROLE` row means holding no
        // feature, so the matrix itself (`F-0702`) is refused, not just the
        // template write (`F-0703`). Internal-by-claim opens nothing.
        var matrixResponse = await client.GetAsync("/api/v1/internal/notifications/matrix");
        Assert.Equal(HttpStatusCode.Forbidden, matrixResponse.StatusCode);

        var refused = await client.PostAsJsonAsync(
            "/api/v1/internal/notifications/templates",
            new { code = "TPL-X", subjectAr = "س", subjectEn = "s", bodyAr = "ن", bodyEn = "b" });
        Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);
    }

    /* ── BR-0705 — the SLA console ─────────────────────────────────────────── */

    [Fact]
    public async Task The_sla_matrix_serves_six_cited_rows_and_is_the_one_write_path()
    {
        await SignInAdministratorAsync();
        var rows = (await GetJsonAsync("/api/v1/internal/sla")).EnumerateArray().ToArray();
        Assert.Equal(6, rows.Length);

        // The three kinds of deadline, each shaped exactly as the union says.
        var offer = rows.Single(r => r.GetProperty("slaId").GetString() == "SLA-0501");
        Assert.Equal("fixed", offer.GetProperty("status").GetString());
        Assert.Equal(3, offer.GetProperty("duration").GetInt32());

        var agreement = rows.Single(r => r.GetProperty("slaId").GetString() == "SLA-0301");
        Assert.Equal("record-derived", agreement.GetProperty("status").GetString());
        Assert.False(agreement.TryGetProperty("duration", out _));
        Assert.Equal(
            new[] { 90, 30, 5 },
            agreement.GetProperty("reminderOffsets").EnumerateArray().Select(o => o.GetInt32()).ToArray());

        var screening = rows.Single(r => r.GetProperty("slaId").GetString() == "SLA-0202");
        Assert.Equal("undefined-duration", screening.GetProperty("status").GetString());
        Assert.False(screening.TryGetProperty("reminderOffsets", out _));

        // Setting the undefined screening deadline — DM-GAP-10 closing for one
        // row, through the only write path a deadline has.
        var invalid = await _client.PostAsJsonAsync("/api/v1/internal/sla/SLA-0202", new
        {
            kind = "fixed", duration = 5, unit = "business-days", reminderOffsets = new[] { 5 },
        });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode); // reminder >= duration

        var updated = await PostJsonAsync("/api/v1/internal/sla/SLA-0202", new
        {
            kind = "fixed", duration = 5, unit = "business-days", reminderOffsets = new[] { 2 },
        });
        var fixedRow = updated.EnumerateArray()
            .Single(r => r.GetProperty("slaId").GetString() == "SLA-0202");
        Assert.Equal("fixed", fixedRow.GetProperty("status").GetString());
        Assert.Equal(5, fixedRow.GetProperty("duration").GetInt32());

        var missing = await _client.PostAsJsonAsync("/api/v1/internal/sla/SLA-9999", new
        {
            kind = "reminders-only", reminderOffsets = new[] { 7 },
        });
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    /* ── the dispatcher — the rules in motion ──────────────────────────────── */

    [Fact]
    public async Task A_raise_fires_both_channels_per_recipient_in_their_own_language()
    {
        var (trainer, staff) = await SeedRecipientsAsync();
        var templateId = await SeedApprovedTemplateAsync();
        await SeedRoutingAsync("EV-0501", templateId, """["record_subject","staff"]""");

        Guid outboxEntityForTrainer;
        await using (var db = _database.CreateContext())
        {
            var dispatcher = new NotificationDispatcher(db, new IntegrationHub(db));
            var outcome = await dispatcher.RaiseAsync(
                "EV-0501",
                new NotificationEventContext(
                    SourceEntityId: Guid.NewGuid(),
                    RecordSubjectUserId: trainer),
                new Dictionary<string, string> { ["programName"] = "برنامج القيادة" });
            await db.SaveChangesAsync();

            Assert.True(outcome.Routed);
            Assert.Equal(2, outcome.RecipientCount);

            // BR-0702 channel 1: one in-platform row per recipient, already
            // delivered. BR-0707: each in their own language.
            var inPlatform = await db.NotificationLog
                .Where(l => l.Channel == "in-platform").ToListAsync();
            Assert.Equal(2, inPlatform.Count);
            Assert.All(inPlatform, l => Assert.Equal("success", l.SendStatus));
            Assert.Equal("ar", inPlatform.Single(l => l.RecipientUserId == trainer).Language);
            Assert.Equal("en", inPlatform.Single(l => l.RecipientUserId == staff).Language);

            // BR-0702 channel 2: the emails ride the outbox, rendered at
            // dispatch — Arabic for the trainer, with both the caller's
            // placeholder and the dispatcher's own recipientName resolved.
            var queued = await db.OutboxMessages
                .Where(m => m.SystemCode == IntegrationSystems.EmailGateway).ToListAsync();
            Assert.Equal(2, queued.Count);
            Assert.All(queued, m => Assert.Equal("pending", m.Status));
            var trainerMail = queued.Single(m => m.Payload.Contains("مرحبًا"));
            Assert.Contains("برنامج القيادة", trainerMail.Payload, StringComparison.Ordinal);
            Assert.Contains("سارة", trainerMail.Payload, StringComparison.Ordinal);
            outboxEntityForTrainer = trainerMail.EntityId;
        }

        // The gateway resolves the sends: one failure first (US-0705's whole
        // point — visible, with its reason), then success on the retry.
        var services = new ServiceCollection();
        services.AddDbContext<ExpertHubDbContext>(o => o.UseSqlServer(_database.ConnectionString));
        await using var provider = services.BuildServiceProvider();
        var channel = new NotificationEmailChannel(
            new FakeEmailGateway(
                IntegrationAttemptResult.Failure("صندوق المستلم ممتلئ."),
                IntegrationAttemptResult.Success(),
                IntegrationAttemptResult.Success()),
            provider.GetRequiredService<IServiceScopeFactory>());
        // BE-17 — the publisher sends through the router now, which picks the
        // channel by system code rather than taking whichever one DI handed it.
        var router = new ChannelRouter([channel]);

        await using (var db = _database.CreateContext())
        {
            var now = DateTime.UtcNow;
            await OutboxPublisher.PublishDueAsync(db, router, now, CancellationToken.None);
            await OutboxPublisher.PublishDueAsync(db, router, now.AddMinutes(5), CancellationToken.None);

            var emailRows = await db.NotificationLog
                .Where(l => l.Channel == "email").OrderBy(l => l.SentAt).ToListAsync();
            Assert.Equal(3, emailRows.Count);
            var failed = emailRows.Single(l => l.SendStatus == "failure");
            Assert.Equal("صندوق المستلم ممتلئ.", failed.FailureReason);
            Assert.Equal(2, emailRows.Count(l => l.SendStatus == "success"));

            // And the queue drained: both published, the failed one retried.
            Assert.Equal(0, await db.OutboxMessages.CountAsync(m => m.Status == "pending"));
            Assert.True(await db.OutboxMessages.AnyAsync(
                m => m.EntityId == outboxEntityForTrainer && m.Status == "published"));
        }
    }

    [Fact]
    public async Task An_unrouted_event_notifies_nobody_and_loses_nothing()
    {
        await using var db = _database.CreateContext();
        var dispatcher = new NotificationDispatcher(db, new IntegrationHub(db));

        // DM-GAP-08's reality: every event starts unrouted, so a raise is a
        // no-op — never an exception a business transaction trips over.
        var outcome = await dispatcher.RaiseAsync(
            "EV-0508",
            new NotificationEventContext(RecordSubjectUserId: Guid.NewGuid()),
            new Dictionary<string, string>());
        await db.SaveChangesAsync();

        Assert.False(outcome.Routed);
        Assert.Equal(0, outcome.RecipientCount);
        Assert.False(await db.NotificationLog.AnyAsync());
        Assert.False(await db.OutboxMessages.AnyAsync());
    }

    [Fact]
    public async Task The_notification_log_is_append_only()
    {
        var (trainer, _) = await SeedRecipientsAsync();
        var entry = new NotificationLogEntry
        {
            LogId = Guid.NewGuid(),
            EventCode = "EV-0101",
            RecipientUserId = trainer,
            Channel = "email",
            Language = "ar",
            TemplateCode = "TPL-ANY",
            TemplateVersion = 1,
            SendStatus = "failure",
            FailureReason = "timeout",
            SentAt = DateTime.UtcNow,
        };
        await using (var db = _database.CreateContext())
        {
            db.AppendNotificationLog(entry);
            await db.SaveChangesAsync();
        }

        await using (var check = _database.CreateContext())
        {
            check.Attach(entry);
            entry.SendStatus = "success";
            var refused = await Assert.ThrowsAsync<InvalidOperationException>(
                () => check.SaveChangesAsync());
            Assert.Contains("append-only", refused.Message, StringComparison.Ordinal);
        }
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    private async Task<(Guid TrainerId, Guid StaffId)> SeedRecipientsAsync()
    {
        await using var db = _database.CreateContext();
        var trainer = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = $"trainer-{Guid.NewGuid():N}",
            Email = "sara@trainers.test",
            FullNameAr = "سارة العتيبي",
            FullNameEn = "Sara Alotaibi",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            IsActive = true,
            IsEmployee = false,
            CreatedAt = DateTime.UtcNow,
        };
        var staff = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = $"staff-{Guid.NewGuid():N}",
            Email = "john@fa.test",
            FullNameAr = "جون ميلر",
            FullNameEn = "John Miller",
            // BR-0707 — the send follows this field, one language per person.
            PreferredCommunicationLanguage = "en",
            PreferredUiLanguage = "en",
            IsActive = true,
            IsEmployee = true,
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.AddRange(trainer, staff);
        var staffRole = await db.Roles.SingleAsync(r => r.Code == RoleCode.Staff);
        db.UserRoles.Add(new UserRole
        {
            UserRoleId = Guid.NewGuid(),
            UserId = staff.UserId,
            RoleId = staffRole.RoleId,
            ScopeRef = null,
            AssignedBy = staff.UserId,
            AssignedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
        return (trainer.UserId, staff.UserId);
    }

    private async Task<Guid> SeedApprovedTemplateAsync()
    {
        await using var db = _database.CreateContext();
        var author = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = $"admin-{Guid.NewGuid():N}",
            Email = "admin@fa.test",
            FullNameAr = "مشرف النظام",
            FullNameEn = "System Administrator",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            IsActive = true,
            IsEmployee = true,
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(author);
        var template = new NotificationTemplate
        {
            TemplateId = Guid.NewGuid(),
            Code = "TPL-ASSIGNMENT-OFFER",
            SubjectAr = "عرض إسناد: {{programName}}",
            SubjectEn = "Assignment offer: {{programName}}",
            BodyAr = "مرحبًا {{recipientName}}، لديك عرض لبرنامج {{programName}}.",
            BodyEn = "Hello {{recipientName}}, you have an offer for {{programName}}.",
            Placeholders = """["recipientName","programName"]""",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = DateTime.UtcNow,
            UpdatedBy = author.UserId,
        };
        db.NotificationTemplates.Add(template);
        await db.SaveChangesAsync();
        return template.TemplateId;
    }

    private async Task SeedRoutingAsync(string eventCode, Guid templateId, string audienceJson)
    {
        await using var db = _database.CreateContext();
        db.NotificationMatrixRows.Add(new NotificationMatrixRow
        {
            RowId = Guid.NewGuid(),
            EventCode = eventCode,
            TemplateId = templateId,
            Audience = audienceJson,
            IsActive = true,
        });
        await db.SaveChangesAsync();
    }

    private async Task<JsonElement> GetJsonAsync(string path)
    {
        var response = await _client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private async Task<JsonElement> PostJsonAsync(string path, object? body)
    {
        var response = body is null
            ? await _client.PostAsync(path, null)
            : await _client.PostAsJsonAsync(path, body);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    /// <summary>Scripted transport: resolves each send with the next queued result.</summary>
    private sealed class FakeEmailGateway : IEmailGateway
    {
        private readonly Queue<IntegrationAttemptResult> _results;

        public FakeEmailGateway(params IntegrationAttemptResult[] results) => _results = new(results);

        public bool IsConfigured => true;

        public Task<IntegrationAttemptResult> SendAsync(
            EmailMessage message,
            CancellationToken cancellationToken) => Task.FromResult(_results.Dequeue());
    }
}
