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

        return services;
    }
}
