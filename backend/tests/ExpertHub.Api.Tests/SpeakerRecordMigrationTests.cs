using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ExpertHub.Api.Tests;

/// <summary>
/// M43 grants F-0105 to Staff and Manager. The access matrix is edited at
/// runtime, so a live server may already hold one of those grants — FA-QIYAS
/// did, and the first M43 failed there on <c>PK_ROLE_PERMISSION</c>.
/// </summary>
public sealed class SpeakerRecordMigrationTests : IAsyncLifetime
{
    private readonly LocalDbFixture _database = new();

    public Task InitializeAsync() => Task.CompletedTask;

    public Task DisposeAsync() => _database.DisposeAsync();

    [Fact]
    public async Task M43_applies_over_a_grant_an_administrator_already_made()
    {
        await using var db = _database.CreateContext();
        var migrator = db.GetService<IMigrator>();
        await migrator.MigrateAsync("M42InterviewNoShowReschedule");

        // Role 2 granted F-0105 (permission 4) from the access screen, with its own scope.
        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO [ROLE_PERMISSION] (permission_id, role_id, data_scope) VALUES (4, 2, N'own');");

        await migrator.MigrateAsync();

        var grants = await db.Database
            .SqlQueryRaw<string>(
                "SELECT CONCAT(role_id, ':', data_scope) AS [Value] FROM [ROLE_PERMISSION] "
                + "WHERE permission_id = 4 ORDER BY role_id")
            .ToListAsync();
        Assert.Equal(["2:own", "3:all"], grants);
        Assert.Equal(0, await db.Database
            .SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM [SPEAKER_RECORD]")
            .SingleAsync());
    }
}
