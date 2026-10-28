using System.Data;
using ExpertHub.Core.Domain;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ExpertHub.Api.Tests;

/// <summary>
/// M56 (`P-384`, UAT BUG-027) — the per-service decision moves to
/// `INTERVIEW_SERVICE`. A database that already holds interviews is migrated
/// from M55, and every interview must come out with one row per service its
/// screening sent to the interview, carrying the decision it already had —
/// no evaluation and no decision lost, no exempted service pulled in.
/// </summary>
public sealed class InterviewPerServiceMigrationTests : IAsyncLifetime
{
    private readonly LocalDbFixture _database = new();

    public Task InitializeAsync() => Task.CompletedTask;

    public Task DisposeAsync() => _database.DisposeAsync();

    [Fact]
    public async Task M56_gives_every_existing_interview_one_row_per_interviewed_service_with_its_decision()
    {
        await using var db = _database.CreateContext();
        var migrator = db.GetService<IMigrator>();
        await migrator.MigrateAsync("M55UatRetestApplicationForm");

        var decider = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = "m56-decider",
            Email = "m56@example.test",
            FullNameAr = "صاحب القرار",
            FullNameEn = "Decider",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            IsEmployee = true,
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(decider);
        await db.SaveChangesAsync();
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE [APPLICATION_SERVICE] NOCHECK CONSTRAINT ALL; "
            + "ALTER TABLE [SCREENING_RESULT] NOCHECK CONSTRAINT ALL; "
            + "ALTER TABLE [INTERVIEW] NOCHECK CONSTRAINT ALL;");

        var decidedAt = new DateTime(2026, 10, 1, 9, 0, 0, DateTimeKind.Utc);
        // Forwarded under the superseded P-271 rule: consultant failed the pass
        // mark and was closed at the decision; trainer went on and was later
        // rejected by the committee; content-developer was exempted.
        var forwarded = await SeedInterviewAsync(db, decider.UserId, "forward", null, decidedAt,
            ("trainer", "accept", "rejected", decidedAt.AddDays(5)),
            ("consultant", "accept", "rejected", decidedAt),
            ("content-developer", "exempt_interview", "pending", null));
        var rejected = await SeedInterviewAsync(db, decider.UserId, "reject", "insufficient-experience", decidedAt,
            ("trainer", "accept", "rejected", decidedAt),
            ("question-writer", "accept", "rejected", decidedAt));
        var undecided = await SeedInterviewAsync(db, decider.UserId, null, null, null,
            ("trainer", "accept", "pending", null),
            ("consultant", "reject", "rejected", decidedAt));

        await migrator.MigrateAsync();

        var rows = await db.InterviewServices.AsNoTracking().ToListAsync();
        Assert.Equal(
            [("consultant", "reject"), ("trainer", "forward")],
            Decisions(rows, forwarded));
        Assert.Equal(
            [("question-writer", "reject"), ("trainer", "reject")],
            Decisions(rows, rejected));
        Assert.All(rows.Where(r => r.InterviewId == rejected),
            r => Assert.Equal("insufficient-experience", r.DecisionReasonId));
        Assert.Equal([("trainer", (string?)null)], Decisions(rows, undecided));
        Assert.All(rows.Where(r => r.InterviewId != undecided), r =>
        {
            Assert.Equal(decider.UserId, r.DecidedBy);
            Assert.Equal(decidedAt, r.DecidedAt);
        });
        // One interview per application, before and after.
        Assert.Equal(3, await db.Interviews.CountAsync());
    }

    private static List<(string Service, string? Decision)> Decisions(
        IEnumerable<InterviewServiceEntry> rows, Guid interviewId) =>
        [.. rows.Where(r => r.InterviewId == interviewId)
            .OrderBy(r => r.Service, StringComparer.Ordinal)
            .Select(r => (r.Service, r.DecisionKind))];

    private static async Task<Guid> SeedInterviewAsync(
        Microsoft.EntityFrameworkCore.DbContext db, Guid deciderId, string? decision, string? reasonId,
        DateTime? decidedAt, params (string Service, string Screening, string Outcome, DateTime? OutcomeAt)[] services)
    {
        var applicationId = Guid.NewGuid();
        var interviewId = Guid.NewGuid();
        foreach (var (service, screening, outcome, outcomeAt) in services)
        {
            var serviceId = Guid.NewGuid();
            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO [APPLICATION_SERVICE] (application_service_id, application_id, service, outcome, decided_at) "
                + "VALUES ({0}, {1}, {2}, {3}, {4});",
                serviceId, applicationId, service, outcome, Nullable("@outcomeAt", SqlDbType.DateTime2, outcomeAt));
            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO [SCREENING_RESULT] (screening_result_id, application_service_id, model_id, "
                + "objective_score, decision, decided_by, decided_at) "
                + "VALUES ({0}, {1}, {2}, 80, {3}, {4}, SYSUTCDATETIME());",
                Guid.NewGuid(), serviceId, Guid.NewGuid(), screening, deciderId);
        }
        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO [INTERVIEW] (interview_id, application_id, status, reschedule_count, "
            + "no_show_reschedule_count, created_at, decision, decision_reason_id, decided_by, decided_at) "
            + "VALUES ({0}, {1}, N'completed', 0, 0, SYSUTCDATETIME(), {2}, {3}, {4}, {5});",
            interviewId, applicationId,
            Nullable("@decision", SqlDbType.NVarChar, decision),
            Nullable("@reasonId", SqlDbType.NVarChar, reasonId),
            Nullable("@decidedBy", SqlDbType.UniqueIdentifier, decision is null ? null : deciderId),
            Nullable("@decidedAt", SqlDbType.DateTime2, decidedAt));
        return interviewId;
    }

    /// <summary>A typed parameter that may carry SQL NULL.</summary>
    private static SqlParameter Nullable(string name, SqlDbType type, object? value) =>
        new(name, type) { Value = value ?? DBNull.Value };
}
