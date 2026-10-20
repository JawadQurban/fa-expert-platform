using ExpertHub.Infrastructure.Documents;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ExpertHub.Api.Health;

/// <summary>
/// Readiness for document storage (`P-370`): with <c>AzureBlob</c> selected,
/// the container must answer AND be private. <c>Local</c> has nothing to probe.
/// </summary>
public sealed class StorageReadinessCheck(
    IOptions<StorageOptions> options, AzureBlobDocumentStore blobs) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        if (!options.Value.UsesAzureBlob)
        {
            return HealthCheckResult.Healthy("Documents are stored locally.");
        }
        var problem = await blobs.ProbeAsync(cancellationToken).ConfigureAwait(false);
        return problem is null
            ? HealthCheckResult.Healthy("Blob storage reachable and private.")
            : HealthCheckResult.Unhealthy(problem);
    }
}
