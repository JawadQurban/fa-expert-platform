using ExpertHub.Infrastructure.Documents;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Meetings;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Screening;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// Registers <see cref="ExpertHubDbContext"/> from configuration.
/// </summary>
public static class PersistenceServiceCollectionExtensions
{
    /// <summary>
    /// The connection string comes from <c>ConnectionStrings__ExpertHub</c> —
    /// environment or secret store, never <c>appsettings.json</c>. While it is
    /// empty (infrastructure has not supplied one yet) the process still boots
    /// and <c>/health</c> stays healthy; only <c>/health/ready</c> says the
    /// database cannot serve.
    /// </summary>
    public static IServiceCollection AddExpertHubPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var connectionString = configuration.GetConnectionString("ExpertHub");

        services.AddDbContext<ExpertHubDbContext>(options =>
        {
            // With no connection string the context is registered but
            // provider-less: resolving it works, using it throws — which the
            // readiness check reports instead of the process crashing at boot.
            if (!string.IsNullOrWhiteSpace(connectionString))
            {
                options.UseSqlServer(connectionString);
            }
        });

        return services;
    }

    /// <summary>
    /// CAP-12 — the integration hub (`08` §4.2): the scoped hub every
    /// capability enqueues through, the channel router, and the background
    /// publisher.
    /// </summary>
    /// <remarks>
    /// ⚠️ 2026-09-02 (BE-17): the publisher no longer resolves a single
    /// channel by registration order. Each system registers an
    /// <see cref="ISystemChannel"/> and <see cref="ChannelRouter"/> picks
    /// between them by system code — so the mount order of the capability
    /// modules stopped being load-bearing, which it never should have been.
    /// A message for a system with no channel stays queued with the reason.
    /// </remarks>
    public static IServiceCollection AddExpertHubIntegration(this IServiceCollection services)
    {
        services.AddScoped<IntegrationHub>();
        services.TryAddSingleton<IIntegrationChannel, ChannelRouter>();
        services.AddHostedService<OutboxPublisher>();
        return services;
    }

    /// <summary>
    /// Document storage and upload scanning — `G26` and `G27`'s seams, each
    /// with the default that keeps the product usable while the decision is
    /// open: the platform's own database, and a scan status that says
    /// <c>not-scanned</c> rather than pretending a file was checked.
    /// </summary>
    public static IServiceCollection AddExpertHubDocuments(this IServiceCollection services)
    {
        services.TryAddScoped<DatabaseDocumentStore>();
        services.TryAddSingleton<FileSystemDocumentStore>();
        // Writes go to whichever store is configured; reads try both, so a ref
        // written before a switch still resolves after it.
        services.TryAddScoped<IDocumentStore, DocumentStoreRouter>();
        services.TryAddSingleton<IUploadScanner, UnscannedUploadScanner>();
        return services;
    }

    /// <summary>
    /// The meeting provider for interview bookings (`J-06/F2`).
    /// </summary>
    /// <remarks>
    /// ⚠️ <b>Registered and off.</b> Without `Teams:ClientSecret` the provider
    /// reports itself unconfigured, nothing is called, and the interview panel
    /// behaves exactly as it does today — no link, which is what `J-06` open
    /// item 1 has always meant. Turning it on is a deployment's decision, not
    /// a release.
    /// </remarks>
    /// <summary>
    /// The one HttpClient shape every long-lived client here uses.
    /// </summary>
    /// <remarks>
    /// ⚠️ Two settings, both of which a bare <c>new HttpClient()</c> gets wrong
    /// for a singleton:
    /// <list type="bullet">
    /// <item><c>PooledConnectionLifetime</c> — a singleton otherwise keeps its
    /// connections for the life of the process and never sees a DNS change, so
    /// a failover of the remote host is invisible until the API restarts.</item>
    /// <item><c>Timeout</c> — the 100-second default is far longer than any
    /// caller here is willing to wait, and a timeout is the failure these
    /// clients are built to report rather than block on.</item>
    /// </list>
    /// </remarks>
    private static HttpClient NewHttpClient(TimeSpan timeout) =>
        new(new SocketsHttpHandler { PooledConnectionLifetime = TimeSpan.FromMinutes(5) })
        {
            Timeout = timeout,
        };

    public static IServiceCollection AddExpertHubMeetings(this IServiceCollection services)
    {
        services.TryAddSingleton<IMeetingProvider>(sp =>
        {
            var configuration = sp.GetRequiredService<
                Microsoft.Extensions.Configuration.IConfiguration>();
            var provider = new TeamsMeetingProvider(
                // Graph, on a path an interview panel is waiting on.
                NewHttpClient(TimeSpan.FromSeconds(
                    configuration.GetValue("Teams:TimeoutSeconds", 30))),
                configuration,
                sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<TeamsMeetingProvider>>());
            // The null object rather than an unconfigured Teams client, so
            // `IsConfigured` is the only thing any caller has to ask.
            return provider.IsConfigured ? provider : new NoMeetingProvider();
        });
        return services;
    }

    /// <summary>
    /// INT-05 — the FAST REST client, and the token seam it depends on.
    /// </summary>
    /// <remarks>
    /// ⚠️ <b>Registered and off.</b> With no `Fast:BaseUrl` the client reports
    /// itself unconfigured and every call fails closed with a reason, so the
    /// product behaves exactly as it does today until a deployment turns it
    /// on. Server-to-server calls authenticate as a SERVICE (2026-10-05):
    /// the client-credentials provider when the credential is configured, the
    /// `NoFastToken` seam otherwise.
    /// </remarks>
    public static IServiceCollection AddExpertHubFast(this IServiceCollection services)
    {
        // Server-to-server: a client-credentials token when `Fast:ClientId` and
        // `Fast:ClientSecret` are set, otherwise the null seam — so issuing the
        // credential is an env edit and a restart, never a release.
        services.TryAddSingleton<IFastTokenProvider>(sp =>
        {
            var configuration = sp.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
            return ClientCredentialsFastTokenProvider.IsConfigured(configuration)
                ? new ClientCredentialsFastTokenProvider(
                    NewHttpClient(TimeSpan.FromSeconds(configuration.GetValue("Fast:TimeoutSeconds", 30))),
                    configuration,
                    sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<ClientCredentialsFastTokenProvider>>())
                : new NoFastToken();
        });
        // One long-lived HttpClient behind a singleton, reached directly so
        // Infrastructure does not take a package for one client — the same
        // arrangement the AI provider uses.
        services.TryAddSingleton(sp => new FastApiClient(
            // The client sets its own Timeout from `Fast:TimeoutSeconds`; this
            // is here for the connection lifetime.
            NewHttpClient(TimeSpan.FromSeconds(30)),
            sp.GetRequiredService<IFastTokenProvider>(),
            sp.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>()));
        services.AddScoped<FastReferenceReader>();
        services.AddScoped<FastUserReader>();
        services.AddScoped<FastQualificationsReader>();
        services.AddScoped<FastContractsReader>();
        // ⚠️ SINGLETON, unlike the readers around it: it caches FAST's country
        // table, which is the same for every person and every request. Scoped
        // would re-read it on each sign-in and defeat the cache entirely.
        services.AddSingleton<FastCountryReader>();
        // FAST reference lists, copied into REFERENCE_VALUE on a schedule —
        // through the token provider only, never a signed-in user's token.
        services.AddSingleton<FastReferenceDataSync>();
        services.AddHostedService<FastReferenceDataWorker>();
        return services;
    }

    /// <summary>
    /// INT-06 — the AI provider (`P-132`), and the CAP-02 channel that writes
    /// what it returns.
    /// </summary>
    /// <remarks>
    /// ⚠️ <b>Registered, and off.</b> `Q28` — whether applicant free-text may
    /// leave the Academy's boundary — is unanswered, so
    /// <see cref="LlmAiAnalysisProvider"/> reports itself unconfigured unless
    /// somebody sets `Ai:ApiKey` and `Ai:Model` in the environment. Until
    /// then the analysis request queues on the outbox and the screening page
    /// shows no insight, which `BR-0202` makes harmless: the official score
    /// never had AI in it.
    /// </remarks>
    public static IServiceCollection AddExpertHubAi(this IServiceCollection services)
    {
        // One long-lived HttpClient on a singleton provider — the pattern the
        // factory exists to enforce, reached directly so Infrastructure does
        // not take a package for one client.
        services.TryAddSingleton<IAiAnalysisProvider>(sp => new LlmAiAnalysisProvider(
            // Generous: this runs on the outbox, not a request. Still bounded —
            // an unbounded wait is what stalls a publish cycle.
            NewHttpClient(TimeSpan.FromSeconds(
                sp.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>()
                    .GetValue("Ai:TimeoutSeconds", 120))),
            sp.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>(),
            sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<LlmAiAnalysisProvider>>()));
        services.AddSingleton<ISystemChannel, AiAnalysisChannel>();
        return services;
    }

    /// <summary>
    /// CAP-07 — the dispatcher every capability raises events through
    /// (`BR-0703`), the email-gateway seam (a <see cref="NullEmailGateway"/>
    /// until infrastructure supplies INT-04's details, so emails queue as
    /// pending), and the INT-04 channel the outbox publishes on. Mount order
    /// no longer matters: since BE-17 each system registers its own
    /// <see cref="ISystemChannel"/> and the router picks by system code.
    /// </summary>
    public static IServiceCollection AddExpertHubNotifications(this IServiceCollection services)
    {
        services.AddScoped<NotificationDispatcher>();
        services.TryAddSingleton<IEmailGateway, NullEmailGateway>();
        services.AddSingleton<ISystemChannel, NotificationEmailChannel>();
        return services;
    }
}
