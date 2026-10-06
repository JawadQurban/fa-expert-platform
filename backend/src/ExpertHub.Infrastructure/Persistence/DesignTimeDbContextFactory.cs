using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// Lets <c>dotnet ef</c> build the context without booting the API — the API's
/// connection string is deliberately empty in every committed file, so design
/// time needs its own.
/// </summary>
/// <remarks>
/// Generating a migration only needs the model, but the tool still requires a
/// provider connection string. LocalDB is the development default
/// (`17_STACK_DECISION.md` §4 — a real SQL Server instance is still an open
/// infrastructure ask); override with <c>EXPERTHUB_MIGRATIONS_CONNECTION</c>
/// when applying migrations against anything real.
/// </remarks>
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ExpertHubDbContext>
{
    public ExpertHubDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("EXPERTHUB_MIGRATIONS_CONNECTION")
            ?? @"Server=(localdb)\MSSQLLocalDB;Database=ExpertHubDesign;Integrated Security=true;TrustServerCertificate=true";

        var options = new DbContextOptionsBuilder<ExpertHubDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        return new ExpertHubDbContext(options);
    }
}
