using ExpertHub.Api.Auth;
using ExpertHub.Api.Configuration;
using ExpertHub.Infrastructure.Documents;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Meetings;
using ExpertHub.Infrastructure.Notifications;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ExpertHub.Api.Health;

/// <summary>One external capability: its status, and what the product does instead while it is not READY.</summary>
public sealed record ProviderStatusWire(string Provider, string Status, string? Fallback);

/// <summary>
/// UAT readiness in detail — which external capability this instance can
/// actually use. <c>/health</c> and <c>/health/ready</c> stay minimal and
/// public; this breakdown needs the internal role, like the CAP-12 integration
/// registry beside it.
/// </summary>
/// <remarks>
/// ⚠️ Statuses and fallback codes ONLY: no URL, client id, token, secret or
/// connection string is ever part of the answer. Nothing here calls an
/// external system — a status says what is configured, not that a live call
/// just succeeded (the database, already a readiness check, is the exception).
/// </remarks>
public static class ProviderReadiness
{
    public static RouteGroupBuilder MapProviderReadinessEndpoints(this RouteGroupBuilder v1)
    {
        v1.MapGet("/internal/readiness", async (
            HealthCheckService health,
            IOptions<DatabaseOptions> database,
            IOptions<OidcOptions> oidc,
            FastApiClient fast,
            IFastTokenProvider fastTokens,
            IMeetingProvider meetings,
            IEmailGateway email,
            IUploadScanner scanner,
            CancellationToken ct) =>
        {
            var databaseStatus = string.IsNullOrWhiteSpace(database.Value.ExpertHub)
                ? "NOT_CONFIGURED"
                : (await health.CheckHealthAsync(r => r.Tags.Contains("ready"), ct)).Status == HealthStatus.Healthy
                    ? "READY"
                    : "DEGRADED";

            ProviderStatusWire[] providers =
            [
                new("database", databaseStatus, null),
                oidc.Value.IsConfigured
                    ? new("sso", "READY", null)
                    : new("sso", "NOT_CONFIGURED", "sign-in-unavailable"),
                // FAST answers only with a bearer token, and the only token
                // source is the NoFastToken seam until the service credential
                // is issued (22_FAST_INTEGRATION_REQUEST).
                !fast.IsConfigured
                    ? new("fast", "NOT_CONFIGURED", "last-good-reference-data")
                    : fastTokens is NoFastToken
                        ? new("fast", "DEGRADED", "WAITING_FOR_FAST_SERVICE_CREDENTIAL")
                        : new("fast", "READY", null),
                meetings.IsConfigured
                    ? new("teams", "READY", null)
                    : new("teams", "NOT_CONFIGURED", "internal-scheduling-meeting-link-pending"),
                email.IsConfigured
                    ? new("email", "READY", null)
                    : new("email", "NOT_CONFIGURED", "outbox-delivery-pending"),
                // No provider exists: acceptance is recorded as
                // `internal-acceptance`, never as a certified signature (BD-UAT-03).
                new("e-signature", "PENDING_BUSINESS_APPROVAL", "internal-acceptance-only"),
                // No adapter exists; identity fails closed (RB-01).
                new("yaqeen", "NOT_CONFIGURED", "no-automated-identity-verification"),
                scanner is UnscannedUploadScanner
                    ? new("antivirus", "NOT_CONFIGURED", "stored-as-not-scanned")
                    : new("antivirus", "READY", null),
            ];
            return Results.Ok(new { providers });
        })
        .RequireAuthorization(AuthenticationSetup.InternalPolicy)
        .WithName("ProviderReadiness");

        return v1;
    }
}
