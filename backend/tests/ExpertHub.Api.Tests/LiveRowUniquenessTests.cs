using ExpertHub.Api.Middleware;
using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// M37 — the four filtered unique indexes that make a duplicate "live" row
/// impossible, and the handler that turns the refusal into a 409.
/// </summary>
/// <remarks>
/// Every one of these invariants was previously held by a read-then-check in one
/// endpoint, which two concurrent requests both pass. The database is the only
/// place the rule holds for every caller, including a second instance of the API
/// and anything that reaches the schema without going through this code at all.
/// </remarks>
[Collection(LocalDbCollection.Name)]
public sealed class LiveRowUniquenessTests
{
    private readonly LocalDbFixture _fixture;

    public LiveRowUniquenessTests(LocalDbFixture fixture) => _fixture = fixture;

    [Theory]
    [InlineData("UX_APPLICATION_applicant_draft", "APPLICATION", "[status]='draft'")]
    [InlineData("UX_ASSIGNMENT_OFFER_slot_id_live", "ASSIGNMENT_OFFER", "[status]='awaiting_response'")]
    [InlineData("UX_ENGAGEMENT_slot_id_live", "ENGAGEMENT", "[status]<>'withdrawn' AND [status]<>'cancelled'")]
    [InlineData("UX_SIGNING_SEQUENCE_agreement_live", "SIGNING_SEQUENCE", "[voided_at] IS NULL")]
    public async Task The_index_exists_as_a_filtered_unique_index(
        string indexName, string tableName, string expectedFilter)
    {
        // Asserted against sys.indexes rather than the model: a filtered unique
        // index that EF believes in but the database does not have enforces
        // nothing, and that is precisely the failure this suite must catch.
        await using var context = _fixture.CreateContext();

        var rows = await context.Database
            .SqlQueryRaw<string>(
                """
                SELECT CONCAT(
                    CAST(i.is_unique AS varchar(1)), '|',
                    REPLACE(REPLACE(i.filter_definition, '(', ''), ')', '')) AS [Value]
                FROM sys.indexes i
                JOIN sys.tables t ON t.object_id = i.object_id
                WHERE i.name = {0} AND t.name = {1}
                """,
                indexName,
                tableName)
            .ToListAsync();

        var row = Assert.Single(rows);
        Assert.StartsWith("1|", row, StringComparison.Ordinal); // unique
        Assert.Equal(expectedFilter, row[2..]);
    }

    [Fact]
    public async Task A_second_draft_for_one_applicant_is_refused_by_the_database()
    {
        // BR-0101's first half. `/draft/start` checks for an existing draft and
        // inserts when it finds none — two requests both find none. The index is
        // what makes the second insert fail instead of succeeding quietly.
        await using var context = _fixture.CreateContext();
        var applicant = await AddApplicantAsync(context);

        context.Applications.Add(NewDraft(applicant.UserId));
        await context.SaveChangesAsync();

        context.Applications.Add(NewDraft(applicant.UserId));
        var refused = await Assert.ThrowsAsync<DbUpdateException>(
            () => context.SaveChangesAsync());

        // The same exception the API will see — so this also pins the handler's
        // SQL error-number detection against a REAL SqlException, which cannot
        // be constructed in a unit test.
        Assert.True(UniqueViolationExceptionHandler.IsUniqueViolation(refused));
    }

    [Fact]
    public async Task A_decided_application_never_blocks_the_next_draft()
    {
        // The filter is the point: one DRAFT at a time, not one application
        // ever. Somebody rejected in 2026 applies again in 2027.
        await using var context = _fixture.CreateContext();
        var applicant = await AddApplicantAsync(context);

        var closed = NewDraft(applicant.UserId);
        closed.Status = ApplicationStatuses.Rejected;
        var alsoClosed = NewDraft(applicant.UserId);
        alsoClosed.Status = ApplicationStatuses.Rejected;
        context.Applications.AddRange(closed, alsoClosed);
        await context.SaveChangesAsync();

        context.Applications.Add(NewDraft(applicant.UserId));

        await context.SaveChangesAsync(); // throws if the filter is wrong
    }

    [Fact]
    public async Task A_non_unique_failure_is_not_mistaken_for_a_duplicate()
    {
        // The handler must answer 409 for a duplicate and leave everything else
        // to the default handler — a missing foreign key is a 500, not a 409.
        await using var context = _fixture.CreateContext();

        context.Applications.Add(NewDraft(Guid.NewGuid())); // no such applicant
        var failed = await Assert.ThrowsAsync<DbUpdateException>(
            () => context.SaveChangesAsync());

        Assert.False(UniqueViolationExceptionHandler.IsUniqueViolation(failed));
    }

    private static Application NewDraft(Guid applicantUserId) => new()
    {
        ApplicationId = Guid.NewGuid(),
        ApplicantUserId = applicantUserId,
        SchemaVersion = FormSchemaVersions.Current,
        Status = ApplicationStatuses.Draft,
        Origin = ApplicationOrigins.SelfService,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };

    private static async Task<AppUser> AddApplicantAsync(
        Infrastructure.Persistence.ExpertHubDbContext context)
    {
        var user = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = $"uniqueness-{Guid.NewGuid():N}",
            Email = $"{Guid.NewGuid():N}@example.test",
            FullNameAr = "مُقدِّم طلب",
            FullNameEn = "Applicant",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user;
    }
}
