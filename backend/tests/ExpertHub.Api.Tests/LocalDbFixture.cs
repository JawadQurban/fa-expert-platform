using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// One throwaway database on the machine's LocalDB instance, migrated once,
/// dropped at the end of the run.
/// </summary>
/// <remarks>
/// LocalDB is the development stand-in the playbook allows for BE-01 while a
/// real SQL Server instance remains an open infrastructure ask. If this
/// fixture fails to connect, install/start LocalDB (<c>sqllocaldb start
/// MSSQLLocalDB</c>) — the tests are integration tests by design and have no
/// in-memory fallback, because the in-memory provider enforces none of the
/// constraints under test.
/// </remarks>
public sealed class LocalDbFixture : IAsyncLifetime
{
    public string ConnectionString { get; } =
        $@"Server=(localdb)\MSSQLLocalDB;Database=ExpertHubTest_{Guid.NewGuid():N};" +
        "Integrated Security=true;TrustServerCertificate=true";

    public ExpertHubDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<ExpertHubDbContext>()
            .UseSqlServer(ConnectionString)
            .Options);

    public async Task InitializeAsync()
    {
        await using var context = CreateContext();
        await context.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await using var context = CreateContext();
        await context.Database.EnsureDeletedAsync();
    }
}

/// <summary>
/// Everything touching the LocalDB database shares one fixture — and therefore
/// runs serially, which is also the right call for tests asserting on shared
/// tables like ROLE.
/// </summary>
[CollectionDefinition(Name)]
public sealed class LocalDbCollection : ICollectionFixture<LocalDbFixture>
{
    public const string Name = "LocalDb";
}
