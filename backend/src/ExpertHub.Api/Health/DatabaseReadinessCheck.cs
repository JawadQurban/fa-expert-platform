using ExpertHub.Api.Configuration;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ExpertHub.Api.Health;

/// <summary>
/// Readiness half of the liveness/readiness split: can this process serve?
/// </summary>
/// <remarks>
/// Liveness (<c>/health</c>) deliberately touches nothing — it answers "is the
/// process up", which is what an orchestrator restarts on. This check backs
/// <c>/health/ready</c> and answers the different question "can it serve",
/// which for now means the database answers. The two are never conflated: a
/// database blip takes the instance out of rotation, it does not restart a
/// healthy process.
/// </remarks>
public sealed class DatabaseReadinessCheck : IHealthCheck
{
    private readonly IOptions<DatabaseOptions> _options;
    private readonly ExpertHubDbContext _context;

    public DatabaseReadinessCheck(IOptions<DatabaseOptions> options, ExpertHubDbContext context)
    {
        _options = options;
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.Value.ExpertHub))
        {
            // Not an exception path: until infrastructure supplies
            // ConnectionStrings__ExpertHub the process is healthy but cannot
            // serve, and readiness is exactly where that belongs.
            return HealthCheckResult.Unhealthy(
                "No database is configured (ConnectionStrings__ExpertHub is empty).");
        }

        try
        {
            return await _context.Database.CanConnectAsync(cancellationToken).ConfigureAwait(false)
                ? HealthCheckResult.Healthy("Database reachable.")
                : HealthCheckResult.Unhealthy("The database did not answer.");
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("The database did not answer.", exception);
        }
    }
}
