using System.Net;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Screening;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// BE-17 — INT-06. The feature ships DARK (`Q28` is unanswered), so most of
/// what is asserted here is that nothing happens by default, that only
/// qualitative text can reach a provider, and that an absent provider is
/// recorded as a result rather than as a failure.
/// </summary>
public sealed class AiAnalysisTests : IAsyncLifetime
{
    private readonly LocalDbFixture _database = new();

    public Task InitializeAsync() => _database.InitializeAsync();

    public Task DisposeAsync() => _database.DisposeAsync();

    /* ── `Q28` — off unless somebody deliberately turns it on ──────────────── */

    [Theory]
    // Nothing configured at all — the shipped default.
    [InlineData(null, null)]
    // Half-configured is OFF, not "guess a model".
    [InlineData("sk-test-key", null)]
    [InlineData(null, "claude-sonnet-4")]
    public void The_provider_is_off_until_a_key_AND_a_model_are_set(string? apiKey, string? model)
    {
        var provider = BuildProvider(apiKey, model);
        Assert.False(provider.IsConfigured);
    }

    [Fact]
    public async Task An_unconfigured_provider_analyses_nothing_rather_than_erroring()
    {
        var provider = BuildProvider(null, null);
        var draft = await provider.AnalyzeAsync(
            [new QualitativeAnswer("q-motivation", "نص الإجابة")], CancellationToken.None);
        // `BR-0202` — advisory only, so "no analysis" is a working system.
        Assert.Null(draft);
    }

    [Fact]
    public void The_committed_settings_name_the_AI_keys_and_carry_no_value()
    {
        var path = Path.Combine(RepoRoot(), "src", "ExpertHub.Api", "appsettings.json");
        using var document = JsonDocument.Parse(File.ReadAllText(path));
        var ai = document.RootElement.GetProperty("Ai");
        // Named so a deployment knows what to set; empty so this file never
        // becomes the thing that turns the feature on.
        Assert.Equal(string.Empty, ai.GetProperty("ApiKey").GetString());
        Assert.Equal(string.Empty, ai.GetProperty("Model").GetString());
    }

    /* ── `08` §2.2 — only qualitative text crosses the boundary ────────────── */

    [Fact]
    public void The_provider_port_cannot_be_given_an_identity()
    {
        var method = typeof(IAiAnalysisProvider).GetMethod(nameof(IAiAnalysisProvider.AnalyzeAsync));
        Assert.NotNull(method);
        var parameters = method!.GetParameters();

        // The data-minimisation rule, as a signature: answers and a token,
        // and nothing that could name whose answers they are. A future
        // parameter called applicationId, userId or reference fails here.
        Assert.Equal(2, parameters.Length);
        Assert.Equal(typeof(IReadOnlyList<QualitativeAnswer>), parameters[0].ParameterType);
        Assert.Equal(typeof(CancellationToken), parameters[1].ParameterType);

        // And the payload type carries exactly two fields — a code and text.
        var carried = typeof(QualitativeAnswer).GetProperties()
            .Select(p => p.Name).OrderBy(n => n, StringComparer.Ordinal).ToArray();
        Assert.Equal(new[] { "FieldCode", "Text" }, carried);
    }

    /* ── degrade to unavailable, never block ───────────────────────────────── */

    [Fact]
    public async Task A_delivered_analysis_is_saved_by_the_channel_itself()
    {
        // The regression: WriteAsync only stages the row, and the channel never
        // saved it — so every delivery was logged a success and then lost. The
        // tests above save it themselves, which is why they never noticed.
        var applicationId = await SeedApplicationAsync();
        await using var services = new ServiceCollection()
            .AddDbContext<ExpertHub.Infrastructure.Persistence.ExpertHubDbContext>(
                o => o.UseSqlServer(_database.ConnectionString))
            .BuildServiceProvider();
        var channel = new AiAnalysisChannel(
            new StubProvider(new AiAnalysisDraft(
                "ملخّص", "Summary", "{}", null, "anthropic", "claude-sonnet-5-5", "p.v1")),
            services.GetRequiredService<IServiceScopeFactory>());

        var result = await channel.SendAsync(new OutboxMessage
        {
            SystemCode = IntegrationSystems.AiProvider,
            ElementName = "screening_analysis",
            EntityType = "AI_ANALYSIS",
            EntityId = applicationId,
            Operation = "analyze",
            Payload = JsonSerializer.Serialize(
                new AiAnalysisRequest(applicationId, [new QualitativeAnswer("q", "نص")]),
                AiAnalysisRequest.PayloadOptions),
            IdempotencyKey = "test",
            Status = "pending",
        }, CancellationToken.None);

        Assert.True(result.Succeeded);
        await using var db = _database.CreateContext();
        var analysis = await db.AiAnalyses.SingleAsync(a => a.ApplicationId == applicationId);
        Assert.Equal(AiAnalysisStatuses.Produced, analysis.Status);
        Assert.Equal("claude-sonnet-5-5", analysis.ModelVersion);
    }

    private sealed class StubProvider(AiAnalysisDraft draft) : IAiAnalysisProvider
    {
        public bool IsConfigured => true;

        public Task<AiAnalysisDraft?> AnalyzeAsync(
            IReadOnlyList<QualitativeAnswer> answers, CancellationToken cancellationToken) =>
            Task.FromResult<AiAnalysisDraft?>(draft);

        public Task<string?> DraftBioAsync(
            string cvText, string language, CancellationToken cancellationToken) =>
            Task.FromResult<string?>(null);
    }

    [Fact]
    public async Task A_provider_that_returns_nothing_is_recorded_as_unavailable()
    {
        var applicationId = await SeedApplicationAsync();
        var request = new AiAnalysisRequest(
            applicationId, [new QualitativeAnswer("q-motivation", "لماذا أرغب في التدريب")]);

        await using (var db = _database.CreateContext())
        {
            await AiAnalysisChannel.WriteAsync(db, request, draft: null, CancellationToken.None);
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var analysis = await db.AiAnalyses.SingleAsync(a => a.ApplicationId == applicationId);
            // `08` §4.1 — unavailable is a RESULT, recorded as one, so the page
            // can say so instead of showing an empty panel.
            Assert.Equal(AiAnalysisStatuses.Unavailable, analysis.Status);
            Assert.Null(analysis.AdvisoryScore);
            // The scope is still auditable even with no analysis.
            Assert.Equal(
                new[] { "q-motivation" },
                JsonSerializer.Deserialize<string[]>(analysis.AnalyzedFieldCodes));
        }
    }

    [Fact]
    public async Task An_analysis_is_stored_with_the_model_and_prompt_that_produced_it()
    {
        var applicationId = await SeedApplicationAsync();
        var request = new AiAnalysisRequest(
            applicationId, [new QualitativeAnswer("q-motivation", "نص")]);
        var draft = new AiAnalysisDraft(
            "ملخّص", "Summary", """{"strengths":[],"considerations":[]}""",
            72m, "anthropic", "claude-sonnet-4", LlmAiAnalysisProvider.CurrentPromptVersion);

        await using (var db = _database.CreateContext())
        {
            await AiAnalysisChannel.WriteAsync(db, request, draft, CancellationToken.None);
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var analysis = await db.AiAnalyses.SingleAsync(a => a.ApplicationId == applicationId);
            Assert.Equal(AiAnalysisStatuses.Produced, analysis.Status);
            Assert.Equal("ملخّص", analysis.SummaryAr);
            // Explainable after the fact — `08` §2.2 consequence 1.
            Assert.Equal("claude-sonnet-4", analysis.ModelVersion);
            Assert.Equal("screening-qualitative.v1", analysis.PromptVersion);
            // ⚠️ Advisory, and stored where it cannot reach a score: the
            // scoring function does not take AI_ANALYSIS as a parameter.
            Assert.Equal(72m, analysis.AdvisoryScore);
        }
    }

    [Fact]
    public async Task A_re_analysis_replaces_rather_than_accumulates()
    {
        var applicationId = await SeedApplicationAsync();
        var request = new AiAnalysisRequest(applicationId, [new QualitativeAnswer("q", "نص")]);

        await using (var db = _database.CreateContext())
        {
            await AiAnalysisChannel.WriteAsync(db, request, null, CancellationToken.None);
            await db.SaveChangesAsync();
        }
        await using (var db = _database.CreateContext())
        {
            await AiAnalysisChannel.WriteAsync(
                db, request,
                new AiAnalysisDraft("ملخّص", "S", "{}", null, "openai", "gpt-x", "p.v1"),
                CancellationToken.None);
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            // The screening page shows «the» insight; two rows would be ambiguous.
            var analysis = await db.AiAnalyses.SingleAsync(a => a.ApplicationId == applicationId);
            Assert.Equal(AiAnalysisStatuses.Produced, analysis.Status);
        }
    }

    /* ── the router BE-17 forced into existence ───────────────────────────── */

    [Fact]
    public async Task A_message_for_a_system_with_no_channel_stays_queued_with_the_reason()
    {
        var router = new ChannelRouter([new StubChannel(IntegrationSystems.EmailGateway, true)]);
        var result = await router.SendAsync(
            new OutboxMessage
            {
                OutboxMessageId = Guid.NewGuid(),
                SystemCode = IntegrationSystems.Fast,
                ElementName = "engagement",
                EntityType = "ENGAGEMENT",
                EntityId = Guid.NewGuid(),
                EntityVersion = 1,
                Operation = "upsert",
                Payload = "{}",
                IdempotencyKey = "k",
                Status = OutboxStatuses.Pending,
            },
            CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Contains("INT-05", result.ErrorDetail, StringComparison.Ordinal);
        // Never reported as delivered — a success the remote side never saw is
        // the exact lie CAP-12 exists to prevent.
    }

    [Fact]
    public void The_router_is_configured_when_any_one_channel_is()
    {
        // One live system must not be held back by four that are not.
        Assert.True(new ChannelRouter(
            [new StubChannel("INT-04", false), new StubChannel("INT-06", true)]).IsConfigured);
        Assert.False(new ChannelRouter(
            [new StubChannel("INT-04", false)]).IsConfigured);
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    private sealed class StubChannel(string systemCode, bool configured) : ISystemChannel
    {
        public string SystemCode { get; } = systemCode;

        public bool IsConfigured { get; } = configured;

        public Task<IntegrationAttemptResult> SendAsync(
            OutboxMessage message, CancellationToken cancellationToken) =>
            Task.FromResult(IntegrationAttemptResult.Success());
    }

    private static LlmAiAnalysisProvider BuildProvider(string? apiKey, string? model)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Ai:Provider"] = "anthropic",
            ["Ai:ApiKey"] = apiKey,
            ["Ai:Model"] = model,
        };
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        return new LlmAiAnalysisProvider(new HttpClient(), configuration);
    }

    private async Task<Guid> SeedApplicationAsync()
    {
        await using var db = _database.CreateContext();
        var user = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = $"ai-{Guid.NewGuid():N}",
            Email = "ai@example.invalid",
            FullNameAr = "مقدّم الطلب",
            FullNameEn = "Applicant",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(user);
        var application = new Application
        {
            ApplicationId = Guid.NewGuid(),
            ApplicantUserId = user.UserId,
            SchemaVersion = FormSchemaVersions.Current,
            Reference = $"EH-2026-{Random.Shared.Next(10000, 99999)}",
            Status = ApplicationStatuses.Submitted,
            Origin = ApplicationOrigins.SelfService,
            CreatedAt = DateTime.UtcNow,
            SubmittedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Applications.Add(application);
        await db.SaveChangesAsync();
        return application.ApplicationId;
    }

    private static string RepoRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "ExpertHub.sln")))
        {
            directory = directory.Parent;
        }
        Assert.NotNull(directory);
        return directory!.FullName;
    }
}
