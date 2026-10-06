using ExpertHub.Api.Access;
using ExpertHub.Api.Agreements;
using ExpertHub.Api.Analytics;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Assignments;
using ExpertHub.Api.Auth;
using ExpertHub.Api.Committee;
using ExpertHub.Api.Configuration;
using ExpertHub.Api.Entitlements;
using ExpertHub.Api.Health;
using ExpertHub.Api.Integration;
using ExpertHub.Api.Internal;
using ExpertHub.Api.Interviews;
using ExpertHub.Api.Notifications;
using ExpertHub.Api.Profiles;
using ExpertHub.Api.ReferenceData;
using ExpertHub.Api.ServiceRequests;
using ExpertHub.Api.Screening;
using ExpertHub.Core;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Configuration is bound and validated at startup, so a misconfigured
// deployment fails loudly rather than at the first request that needs the
// missing value — the same rule the frontend follows (`runtimeConfig.ts`).
builder.Services.AddExpertHubOptions(builder.Configuration);

// RFC 7807 for every failure. The frontend's `Result<T, ExpertHubApiError>`
// already expects a status and a message on every error path.
builder.Services.AddProblemDetails();
// A unique index refusing a duplicate is a 409, never a 500: the loser of a
// race submitted a request that is no longer valid, which is not a server
// fault. The backstop behind the conditional claims, not a substitute for them.
builder.Services.AddExceptionHandler<ExpertHub.Api.Middleware.UniqueViolationExceptionHandler>();

// The database (`10_DATABASE_DESIGN`). The connection string arrives from the
// environment (`ConnectionStrings__ExpertHub`); until it does, the process
// boots healthy and readiness reports the gap.
builder.Services.AddExpertHubPersistence(builder.Configuration);

// CAP-07 before CAP-12 on purpose: notifications register the INT-04 email
// channel, and the hub's TryAdd of the null fallback must find it registered.
builder.Services.AddExpertHubNotifications();

// CAP-12 — the integration hub (`08` §4.2): every crossing goes through it,
// so no capability ever grows an ad-hoc HttpClient call of its own.
// Attachment uploads. Kestrel and the form reader both cap a body, and a cap
// that is lower than the attachment rules allow rejects the exact upload the
// product invites — so both are set explicitly and generously above the
// largest `ATTACHMENT_RULE.max_size_mb`. ⚠️ The reverse proxy caps it too, and
// nginx defaults to 1 MB: see `deploy/server-nginx.example.conf`.
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 25L * 1024 * 1024;
});
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 25L * 1024 * 1024);

builder.Services.AddExpertHubFast();
builder.Services.AddExpertHubMeetings();
builder.Services.AddExpertHubDocuments();
builder.Services.AddExpertHubAi();
builder.Services.AddExpertHubIntegration();
// J-18/F2/AC-3 — offers expire on their own, not only when answered late.
builder.Services.AddHostedService<ExpertHub.Api.Assignments.OfferExpiryWorker>();
// J-12/F1 — the 90/30/5-day agreement expiry alerts (offsets from SLA-0301).
builder.Services.AddHostedService<ExpertHub.Api.Agreements.AgreementExpiryReminderWorker>();
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseReadinessCheck>("database", tags: ["ready"]);

// INT-01 — cookie session + the OIDC code/PKCE flow, in the API (`P-163`).
builder.Services.AddExpertHubAuthentication(builder.Configuration);

// With a cookie session, CORS is a security control, not a convenience: an
// origin on this list can act as the signed-in user. Explicit list, never `*`.
var corsOrigins = builder.Configuration
    .GetSection(ExpertHub.Api.Configuration.CorsOptions.Section)
    .Get<ExpertHub.Api.Configuration.CorsOptions>()?.AllowedOrigins ?? [];
builder.Services.AddCors(options => options.AddPolicy("expert-hub", policy => policy
    .WithOrigins(corsOrigins)
    .AllowCredentials()
    .AllowAnyHeader()
    .AllowAnyMethod()));

// Behind the deployment proxies (server Nginx → container), the request this
// process sees is plain HTTP on an internal address. The OIDC redirect URI
// and the cookie's Secure flag are both derived from the request, so the
// proxy's X-Forwarded-Proto/Host must be honoured — otherwise the API would
// tell the identity provider to return to `http://127.0.0.1:8086/...`.
// Trusting the headers unconditionally is safe HERE because the container
// binds to localhost only and the server Nginx is the sole caller.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

/*
 * Testing-stack convenience: apply EF migrations at startup when a database
 * is configured and `Database:AutoMigrate` is on (the compose default). A
 * no-op when the schema is current; a failure is logged and the process keeps
 * serving — /health/ready is what reports the database honestly. Managed
 * environments can turn this off and run migrations explicitly.
 */
if (app.Configuration.GetValue<bool>("Database:AutoMigrate")
    && !string.IsNullOrWhiteSpace(app.Configuration.GetConnectionString("ExpertHub")))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
    try
    {
        db.Database.Migrate();
    }
    catch (Exception exception)
    {
        app.Logger.LogStartupMigrationFailed(exception);
    }
}

app.UseForwardedHeaders();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseCors("expert-hub");
app.UseAuthentication();
app.UseAuthorization();

/*
 * Liveness. Deliberately free of dependencies: it answers "is this process
 * up", which is what an orchestrator restarts on — conflating it with
 * readiness makes a database blip restart a healthy process.
 */
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }))
    .WithName("Health");

/*
 * Readiness. The other half of the split: "can this instance serve" — which
 * for now means SQL Server answers (and, later, whatever else serving
 * requires). An orchestrator routes on this and restarts on /health.
 */
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready"),
    ResponseWriter = static async (context, report) =>
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsJsonAsync(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                reason = entry.Value.Description,
            }),
        }).ConfigureAwait(false);
    },
});

/*
 * Everything the frontend calls mounts under `/api` — one prefix, no proxy
 * rewriting to get wrong. Fixed, not chosen: the committed callback path is
 * `/api/auth/callback` and P-164 registered exactly that absolute URL with
 * FAST, so `/api` is the API's external mount and the frontend's `apiBaseUrl`
 * ends with it (e.g. `https://experts.fa.gov.sa/api`). The health endpoints
 * stay at the root on purpose — they are for the orchestrator, not the SPA.
 */
var api = app.MapGroup("/api");

// INT-01 — /api/auth/login · /api/auth/session · /api/auth/logout (`P-163`);
// the provider callback is the OIDC middleware's, at `Oidc:CallbackPath`.
api.MapExpertHubAuthEndpoints();

/*
 * The version prefix every Expert Hub business endpoint sits behind.
 *
 * `ApiVersions.V1` is the single source: the frontend's service contracts
 * already call `v1/internal/...` **relative to `apiBaseUrl`** (see
 * `accessService.ts`, `notificationService.ts`), so the string is fixed by an
 * existing consumer, not chosen here.
 */
var v1 = api.MapGroup($"/{ApiVersions.V1}");

// Capability modules register their endpoints on this group as they are built
// (CAP-01 … CAP-12). One module per capability, per `D-01` and P-162.
v1.MapGet("/ping", () => Results.Ok(new { version = ApiVersions.V1 }))
    .WithName("Ping");

// CAP-08 — roles & permissions administration, behind `accessService.ts`'s
// contract. Everything under `/internal` requires the internal-role session.
v1.MapAccessEndpoints();

// CAP-12 — the integration registry, readable by internal roles.
v1.MapIntegrationEndpoints();
v1.MapReferenceDataEndpoints();
// UAT — per-provider readiness detail for internal staff; /health/ready stays minimal.
v1.MapProviderReadinessEndpoints();

// CAP-07 — the notification matrix, templates, log, and the SLA console,
// behind `notificationService.ts`'s contract.
v1.MapNotificationEndpoints();

// CAP-01 — the application form schema (public read), the trainer's own
// applications, and add-service, behind `applicationsService.ts`'s contract.
v1.MapApplicationEndpoints();

// EH-INT-01/02 — the staff dashboard and the application inbox: the entry
// every internal journey is reached FROM, so it ships with them.
v1.MapInternalEndpoints();

// CAP-01/03 — J-03's internal half: the service-request queue and decision,
// behind `serviceRequestService.ts`'s contract.
v1.MapServiceRequestEndpoints();
// J-16 brochure / J-03 addendum uploads — the application form's own store.
ExpertHub.Api.Documents.AttachmentUploads.MapAttachmentUploadEndpoints(v1);

// CAP-02 — screening + AI boundary (J-05/J-08), the interview (J-06/J-07),
// and the sequential approval committee (J-09), behind their three contracts.
v1.MapScreeningEndpoints();
v1.MapInterviewEndpoints();
v1.MapCommitteeEndpoints();

// CAP-03 — agreement preparation and internal signing (J-10), the
// lifecycle and template (J-12), and the applicant's own half (J-11 +
// J-09/F6's bank data).
v1.MapAgreementEndpoints();
v1.MapAgreementLifecycleEndpoints();
v1.MapApplicantAgreementEndpoints();

// CAP-04 — the trainer's own profile (J-14), the PUBLIC directory (J-24,
// anonymous and consent-gated), and the internal trainer base (J-15).
v1.MapProfileEndpoints();
// P-331 — the trainer's short bio, and its staff review.
v1.MapTrainerBioEndpoints();
v1.MapDirectoryEndpoints();

// CAP-05 — the assignment chain (J-16→J-19) and the trainer's own offers,
// engagements, material and withdrawal (J-18, J-20, J-21, J-22).
v1.MapAssignmentEndpoints();
v1.MapEngagementEndpoints();

// CAP-09 — the trainer's own overview (`F-0906`). The role-scoped internal
// dashboards live with the staff entry points, in MapInternalEndpoints.
v1.MapHomeEndpoints();

// CAP-06 — المستحقات المالية, read-only in both directions (`BR-0601`): the
// trainer's own entitlements and the staff view of anyone's. There is no
// third route, and no write path exists anywhere in the product.
v1.MapEntitlementEndpoints();

app.Run();

/// <summary>
/// Exposed so <c>WebApplicationFactory</c> can boot the real application in
/// tests rather than a rebuilt approximation of it.
/// </summary>
public partial class Program;

internal static partial class ProgramLog
{
    [LoggerMessage(
        EventId = 1,
        Level = LogLevel.Error,
        Message = "Applying database migrations at startup failed; the process keeps serving and /health/ready reports the database.")]
    public static partial void LogStartupMigrationFailed(this ILogger logger, Exception exception);
}
