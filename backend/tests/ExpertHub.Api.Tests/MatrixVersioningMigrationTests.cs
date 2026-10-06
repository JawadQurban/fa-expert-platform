using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ExpertHub.Api.Tests;

/// <summary>
/// Matrix alignment ships new matrix VERSIONS beside the old ones. These tests
/// migrate a database that already holds records up to the migration before
/// each change, then apply the rest — and check the old records still point at
/// the version they were created under.
/// </summary>
public sealed class MatrixVersioningMigrationTests : IAsyncLifetime
{
    private readonly LocalDbFixture _database = new();

    public Task InitializeAsync() => Task.CompletedTask;

    public Task DisposeAsync() => _database.DisposeAsync();

    [Fact]
    public async Task An_interview_that_predates_the_approved_model_stays_on_the_draft_model()
    {
        await using var db = _database.CreateContext();
        var migrator = db.GetService<IMigrator>();
        await migrator.MigrateAsync("M23FastContracts");

        // An interview as it existed before M24 — no model column at all. Only
        // the INTERVIEW row matters here, so its parent rows are not built.
        var interviewId = Guid.NewGuid();
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE [INTERVIEW] NOCHECK CONSTRAINT ALL; "
            + "INSERT INTO [INTERVIEW] (interview_id, application_id, status, reschedule_count, created_at) "
            + "VALUES ({0}, {1}, N'scheduled', 0, SYSUTCDATETIME());",
            interviewId, Guid.NewGuid());

        await migrator.MigrateAsync();

        var pinned = await db.Database
            .SqlQueryRaw<string>(
                "SELECT model_version AS [Value] FROM [INTERVIEW] WHERE interview_id = {0}", interviewId)
            .SingleAsync();
        Assert.Equal("mock-dm-gap-03-draft.1", pinned);

        // The draft model is kept (inactive, 0–5 scale); the approved one is active.
        var models = await db.InterviewModels.AsNoTracking().ToListAsync();
        var draft = models.Where(m => m.Version == "mock-dm-gap-03-draft.1").ToList();
        var approved = models.Where(m => m.Version == "dm-gap-03.2026-09-02").ToList();
        Assert.Equal(4, draft.Count);
        Assert.All(draft, m => Assert.False(m.IsActive));
        Assert.All(draft, m => Assert.Equal(5m, m.ResultMaxScore));
        Assert.Equal(4, approved.Count);
        Assert.All(approved, m => Assert.True(m.IsActive));
        Assert.All(approved, m => Assert.Equal(100m, m.ResultMaxScore));
        Assert.All(approved, m => Assert.Equal(70m, m.PassThreshold));

        var draftAxes = await db.InterviewAxes.AsNoTracking()
            .CountAsync(a => draft.Select(m => m.InterviewModelId).Contains(a.InterviewModelId));
        Assert.Equal(16, draftAxes);
        foreach (var model in approved)
        {
            var weights = await db.InterviewAxes.AsNoTracking()
                .Where(a => a.InterviewModelId == model.InterviewModelId)
                .Select(a => a.Weight)
                .ToListAsync();
            Assert.Equal(10, weights.Count);
            Assert.Equal(100.0m, weights.Sum());
        }
    }

    [Fact]
    public async Task An_application_that_predates_the_matrix_form_keeps_its_version_whole()
    {
        await using var db = _database.CreateContext();
        var migrator = db.GetService<IMigrator>();
        await migrator.MigrateAsync("M24InterviewModelApproved");

        var initialFields = await db.FormFields.AsNoTracking()
            .Where(f => f.SchemaVersion == "dm-gap-01.2026-08-30")
            .OrderBy(f => f.FieldId)
            .Select(f => new { f.FieldId, f.FieldCode, f.Definition })
            .ToListAsync();
        var applicationId = Guid.NewGuid();
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE [APPLICATION] NOCHECK CONSTRAINT ALL; "
            + "INSERT INTO [APPLICATION] (application_id, applicant_user_id, schema_version, status, origin, created_at, updated_at) "
            + "VALUES ({0}, {1}, N'dm-gap-01.2026-08-30', N'draft', N'self_service', SYSUTCDATETIME(), SYSUTCDATETIME());",
            applicationId, Guid.NewGuid());

        await migrator.MigrateAsync();

        var version = await db.Database
            .SqlQueryRaw<string>(
                "SELECT schema_version AS [Value] FROM [APPLICATION] WHERE application_id = {0}", applicationId)
            .SingleAsync();
        Assert.Equal("dm-gap-01.2026-08-30", version);

        // The old version's rows are untouched; it is superseded, the new one published.
        var afterFields = await db.FormFields.AsNoTracking()
            .Where(f => f.SchemaVersion == "dm-gap-01.2026-08-30")
            .OrderBy(f => f.FieldId)
            .Select(f => new { f.FieldId, f.FieldCode, f.Definition })
            .ToListAsync();
        Assert.Equal(39, afterFields.Count);
        Assert.Equal(initialFields, afterFields);
        var schemas = await db.FormSchemas.AsNoTracking().ToDictionaryAsync(s => s.SchemaVersion, s => s.Status);
        Assert.Equal("superseded", schemas["dm-gap-01.2026-08-30"]);
        Assert.Equal("superseded", schemas["dm-gap-01.2026-09-14"]);
        Assert.Equal("superseded", schemas["dm-gap-01.2026-09-16"]);
        Assert.Equal("superseded", schemas["dm-gap-01.2026-09-21"]);
        // The «المجال» list minus the 13 master-data values (2026-09-28). No
        // field changed; every earlier version keeps all 147 options.
        Assert.Equal("superseded", schemas["dm-gap-01.2026-09-28"]);
        // `preferredDeliveryMode` declares the services it is actually for
        // (2026-09-29) — an inert correction, published as its own version
        // because a published version is history and is never edited.
        Assert.Equal("published", schemas["dm-gap-01.2026-09-29"]);
        Assert.Equal(47, await db.FormFields.CountAsync(f => f.SchemaVersion == "dm-gap-01.2026-09-14"));
        Assert.Equal(51, await db.FormFields.CountAsync(f => f.SchemaVersion == "dm-gap-01.2026-09-16"));
        Assert.Equal(55, await db.FormFields.CountAsync(f => f.SchemaVersion == "dm-gap-01.2026-09-21"));
        // Only the newest version declares repeatable groups — a historical
        // application therefore still reads as exactly one entry per section.
        Assert.Equal(
            ["education", "certifications", "experience"],
            await db.FormSections.AsNoTracking()
                .Where(s => s.SchemaVersion == "dm-gap-01.2026-09-29" && s.Repeatable != null)
                .OrderBy(s => s.OrderIndex)
                .Select(s => s.SectionCode)
                .ToListAsync());
        // Only the three newest declare them; every earlier one is flat.
        Assert.Equal(0, await db.FormSections.CountAsync(
            s => s.SchemaVersion != "dm-gap-01.2026-09-21"
                && s.SchemaVersion != "dm-gap-01.2026-09-28"
                && s.SchemaVersion != "dm-gap-01.2026-09-29"
                && s.Repeatable != null));
    }

    [Fact]
    public async Task A_draft_on_the_matrix_form_keeps_its_version_through_the_decisions_version()
    {
        await using var db = _database.CreateContext();
        var migrator = db.GetService<IMigrator>();
        await migrator.MigrateAsync("M25ApplicationFormMatrixVersion");

        var matrixFields = await db.FormFields.AsNoTracking()
            .Where(f => f.SchemaVersion == "dm-gap-01.2026-09-14")
            .OrderBy(f => f.FieldId)
            .Select(f => new { f.FieldId, f.FieldCode, f.Definition })
            .ToListAsync();
        var applicationId = Guid.NewGuid();
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE [APPLICATION] NOCHECK CONSTRAINT ALL; "
            + "INSERT INTO [APPLICATION] (application_id, applicant_user_id, schema_version, status, origin, created_at, updated_at) "
            + "VALUES ({0}, {1}, N'dm-gap-01.2026-09-14', N'draft', N'self_service', SYSUTCDATETIME(), SYSUTCDATETIME());",
            applicationId, Guid.NewGuid());

        await migrator.MigrateAsync();

        var version = await db.Database
            .SqlQueryRaw<string>(
                "SELECT schema_version AS [Value] FROM [APPLICATION] WHERE application_id = {0}", applicationId)
            .SingleAsync();
        Assert.Equal("dm-gap-01.2026-09-14", version);
        var after = await db.FormFields.AsNoTracking()
            .Where(f => f.SchemaVersion == "dm-gap-01.2026-09-14")
            .OrderBy(f => f.FieldId)
            .Select(f => new { f.FieldId, f.FieldCode, f.Definition })
            .ToListAsync();
        Assert.Equal(matrixFields, after);
    }
}
