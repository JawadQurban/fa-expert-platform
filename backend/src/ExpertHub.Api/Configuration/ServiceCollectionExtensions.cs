using ExpertHub.Infrastructure.Documents;

namespace ExpertHub.Api.Configuration;

/// <summary>
/// Binds and validates Expert Hub configuration at startup.
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddExpertHubOptions(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<DatabaseOptions>(configuration.GetSection(DatabaseOptions.Section));
        services.Configure<OidcOptions>(configuration.GetSection(OidcOptions.Section));
        services.Configure<AccessOptions>(configuration.GetSection(AccessOptions.Section));

        // Validated on start, not on first use: a bad CORS list should stop a
        // deployment, not surface as a browser error nobody can explain.
        services.AddOptions<CorsOptions>()
            .Bind(configuration.GetSection(CorsOptions.Section))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // `P-370` — AzureBlob with no connection string stops the deployment
        // here, rather than failing the first person who uploads a CV. The
        // messages name the variable, never its value.
        services.AddOptions<StorageOptions>()
            .Bind(configuration.GetSection(StorageOptions.Section))
            .Validate(o => o.IsKnownProvider, "Storage:Provider must be 'Local' or 'AzureBlob'.")
            .Validate(
                o => !o.UsesAzureBlob || !string.IsNullOrWhiteSpace(o.AzureBlob.ConnectionString),
                "Storage:Provider is AzureBlob but Storage__AzureBlob__ConnectionString is empty (env/api.secrets.env).")
            .Validate(
                o => !o.UsesAzureBlob || !string.IsNullOrWhiteSpace(o.AzureBlob.ContainerName),
                "Storage:Provider is AzureBlob but Storage__AzureBlob__ContainerName is empty.")
            .Validate(
                o => string.IsNullOrWhiteSpace(o.AzureBlob.ConnectionString) || o.AzureBlob.ConnectionStringParses(),
                "Storage__AzureBlob__ConnectionString is not a valid Azure Storage connection string.")
            .Validate(
                o => o.AzureBlob.TimeoutSeconds is > 0 and <= 300 && o.AzureBlob.MaxRetries is >= 0 and <= 10,
                "Storage:AzureBlob TimeoutSeconds must be 1-300 and MaxRetries 0-10.")
            .ValidateOnStart();

        return services;
    }
}
