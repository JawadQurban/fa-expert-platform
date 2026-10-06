using System.Net;
using System.Text.Json;
using ExpertHub.Api.Agreements;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ExpertHub.Api.Tests;

/// <summary>
/// J-25 / RB-13 — event GENERATION is separate from DELIVERY. Events are
/// recorded whether or not routing (`DM-GAP-08`) or an email gateway exists;
/// reminders fire only at the approved offsets and exactly once; a recipient
/// reads their own in-platform notifications and nobody else's.
/// </summary>
public sealed class NotificationFoundationTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();
    private WebApplicationFactory<Program>? _configured;

    public NotificationFoundationTests(WebApplicationFactory<Program> factory) => _factory = factory;

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
    public async Task Agreement_expiry_alerts_fire_at_the_approved_offsets_exactly_once_each()
    {
        // Years ahead of the real clock: the hosted reminder worker runs on
        // DateTime.UtcNow at start-up, and must not reach these thresholds first.
        var now = new DateTime(2030, 1, 10, 8, 0, 0, DateTimeKind.Utc);
        var inTwenty = await SeedActiveAgreementAsync(now.AddDays(20));
        var inFour = await SeedActiveAgreementAsync(now.AddDays(4));
        var farAway = await SeedActiveAgreementAsync(now.AddDays(200));

        // A first run 20 days out raises the 30-day alert — not a stale 90-day one too.
        Assert.Equal(2, await RunRemindersAsync(now));
        // Idempotent: the same entity, reminder and threshold is raised once.
        Assert.Equal(0, await RunRemindersAsync(now));
        Assert.Equal(0, await RunRemindersAsync(now.AddHours(6)));

        await using var db = _database.CreateContext();
        var occurrences = await db.NotificationOccurrences.ToListAsync();
        Assert.Equal(2, occurrences.Count);
        Assert.Equal("EV-0302", occurrences.Single(o => o.SourceEntityId == inTwenty).EventCode);
        Assert.Equal("EV-0303", occurrences.Single(o => o.SourceEntityId == inFour).EventCode);
        Assert.DoesNotContain(occurrences, o => o.SourceEntityId == farAway);
        // Routing is not approved (DM-GAP-08): recorded, delivered to nobody guessed.
        Assert.All(occurrences, o => Assert.Equal(NotificationRoutingStatuses.Unrouted, o.RoutingStatus));
        Assert.False(await db.NotificationLog.AnyAsync());

        // When the 20-day agreement reaches its 5-day threshold, that alert follows once.
        Assert.Equal(1, await RunRemindersAsync(now.AddDays(16)));
        Assert.Equal(0, await RunRemindersAsync(now.AddDays(16)));
    }

    [Fact]
    public async Task A_recipient_reads_only_their_own_in_platform_notifications()
    {
        using var reader = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(reader, _tokenEndpoint, "unmapped", subject: "inbox-reader", displayName: "قارئ");
        using var other = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(other, _tokenEndpoint, "unmapped", subject: "inbox-other", displayName: "آخر");

        await using (var db = _database.CreateContext())
        {
            var readerId = (await db.Users.SingleAsync(u => u.ExternalIdentityId == "inbox-reader")).UserId;
            var otherId = (await db.Users.SingleAsync(u => u.ExternalIdentityId == "inbox-other")).UserId;
            foreach (var (recipient, channel, subject) in new[]
            {
                (readerId, NotificationChannels.InPlatform, "لك"),
                (readerId, NotificationChannels.Email, "بريد"),
                (otherId, NotificationChannels.InPlatform, "لغيرك"),
            })
            {
                db.AppendNotificationLog(new NotificationLogEntry
                {
                    LogId = Guid.NewGuid(),
                    EventCode = "EV-0101",
                    RecipientUserId = recipient,
                    Channel = channel,
                    Language = "ar",
                    TemplateCode = "application-submitted",
                    TemplateVersion = 1,
                    SendStatus = SendStatuses.Success,
                    SentAt = DateTime.UtcNow,
                    Subject = subject,
                    Body = "نص",
                });
            }
            await db.SaveChangesAsync();
        }

        var response = await reader.GetAsync("/api/v1/me/notifications");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());
        var subjects = items.EnumerateArray().Select(i => i.GetProperty("subject").GetString()).ToList();
        Assert.Equal(["لك"], subjects);

        using var anonymous = TestOidc.CreateClient(_configured!);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/v1/me/notifications")).StatusCode);
    }

    private async Task<int> RunRemindersAsync(DateTime now)
    {
        using var scope = _configured!.Services.CreateScope();
        return await AgreementExpiryReminders.RaiseDueAsync(
            scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>(),
            scope.ServiceProvider.GetRequiredService<NotificationDispatcher>(),
            now,
            CancellationToken.None);
    }

    private async Task<Guid> SeedActiveAgreementAsync(DateTime endsAt)
    {
        await using var db = _database.CreateContext();
        var user = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = $"trainer-{Guid.NewGuid():N}",
            Email = "trainer@example.test",
            FullNameAr = "مدرب",
            FullNameEn = "Trainer",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
        };
        db.Users.Add(user);
        var application = new Application
        {
            ApplicationId = Guid.NewGuid(),
            ApplicantUserId = user.UserId,
            SchemaVersion = FormSchemaVersions.Current,
            Reference = $"EH-2026-{Random.Shared.Next(10000, 99999)}",
            Status = ApplicationStatuses.Active,
            Origin = ApplicationOrigins.SelfService,
            CreatedAt = DateTime.UtcNow,
            SubmittedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Applications.Add(application);
        var agreement = new Agreement
        {
            AgreementId = Guid.NewGuid(),
            TrainerUserId = user.UserId,
            ApplicationId = application.ApplicationId,
            Reference = $"AGR-2026-{Random.Shared.Next(1000, 9999)}",
            Status = AgreementStatuses.Active,
            StartsAt = endsAt.AddYears(-1),
            EndsAt = endsAt,
            TermYears = 1,
            FieldValues = "{}",
            CreatedBy = user.UserId,
            CreatedAt = DateTime.UtcNow,
        };
        db.Agreements.Add(agreement);
        await db.SaveChangesAsync();
        return agreement.AgreementId;
    }
}
