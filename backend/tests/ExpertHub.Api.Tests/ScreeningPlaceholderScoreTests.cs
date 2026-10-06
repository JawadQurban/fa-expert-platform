using System.Text.Json;
using ExpertHub.Api.Screening;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Applications;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The placeholder screening score must not move because a later form version
/// added OPTIONAL fields — no approved model weighs them (business decision,
/// 2026-09-16: preserve the placeholder until the approved Screening Matrix).
/// </summary>
/// <remarks>
/// The approved matrix arrived on 2026-09-21 (`dm-gap-02.2026-09-21`) and is
/// now the ACTIVE model, so this guard runs against the draft explicitly —
/// which is the point of keeping the draft seeded. An application screened
/// under the placeholder must keep scoring 85.7 forever; the approved model's
/// own arithmetic lives in <see cref="EvaluationMatrixCalculationTests"/>.
/// </remarks>
public sealed class ScreeningPlaceholderScoreTests : IAsyncLifetime
{
    private readonly LocalDbFixture _database = new();

    public Task InitializeAsync() => _database.InitializeAsync();

    public Task DisposeAsync() => _database.DisposeAsync();

    [Fact]
    public async Task The_same_answers_score_the_same_on_every_form_version()
    {
        await using var db = _database.CreateContext();
        await ServeTheDraftModelAsync(db);

        // A trainer who answered exactly the required fields of the original form.
        var original = await db.FormFields.AsNoTracking()
            .Where(f => f.SchemaVersion == FormSchemaVersions.Initial)
            .ToListAsync();
        var answers = new Dictionary<string, string>();
        foreach (var field in original)
        {
            var definition = ApplicationFormLogic.Parse(field.Definition);
            if (!definition.RequiredFor.Contains(ApplicationServices.Trainer))
            {
                continue;
            }
            answers[field.FieldCode] = definition.Type switch
            {
                "multi-select" => JsonSerializer.Serialize(new[] { definition.Options![0].Value }),
                "select" => JsonSerializer.Serialize(definition.Options![0].Value),
                _ => JsonSerializer.Serialize("قيمة"),
            };
        }

        var trainer = new List<ApplicationServiceEntry>
        {
            new() { ApplicationServiceId = Guid.NewGuid(), Service = ApplicationServices.Trainer, Outcome = ServiceOutcomes.Pending },
        };
        var onOriginal = await ScoreAsync(db, FormSchemaVersions.Initial, answers, trainer);
        var onMatrix = await ScoreAsync(db, FormSchemaVersions.NotionMatrix, answers, trainer);
        var onCurrent = await ScoreAsync(db, FormSchemaVersions.Current, answers, trainer);
        Assert.Equal(85.7m, onOriginal);
        Assert.Equal(onOriginal, onMatrix);
        Assert.Equal(onOriginal, onCurrent);

        // Answering a field only the newer versions have changes nothing either.
        answers["weekdayAvailability"] = JsonSerializer.Serialize(new[] { "sunday" });
        answers["dailyTrainingHours"] = JsonSerializer.Serialize("6");
        Assert.Equal(onOriginal, await ScoreAsync(db, FormSchemaVersions.Current, answers, trainer));
    }

    /// <summary>
    /// Serves the superseded placeholder instead of the approved matrix, so
    /// this test measures the model it was written for. The draft rows are
    /// never deleted precisely so this is possible — the same reason an
    /// interview can still be read through `mock-dm-gap-03-draft.1`.
    /// </summary>
    private static async Task ServeTheDraftModelAsync(
        Infrastructure.Persistence.ExpertHubDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            "UPDATE [EVALUATION_MODEL] SET [is_active] = CASE WHEN [version] = {0} THEN 1 ELSE 0 END;",
            "mock-dm-gap-02-draft.1");
    }

    private static async Task<decimal> ScoreAsync(
        Infrastructure.Persistence.ExpertHubDbContext db,
        string schemaVersion,
        Dictionary<string, string> answers,
        List<ApplicationServiceEntry> services)
    {
        var application = new Application
        {
            ApplicationId = Guid.NewGuid(),
            ApplicantUserId = Guid.NewGuid(),
            SchemaVersion = schemaVersion,
            Status = ApplicationStatuses.Submitted,
            Origin = ApplicationOrigins.SelfService,
        };
        // Only the answers matter to the scorer; their parent rows are not built.
        await db.Database.ExecuteSqlRawAsync("ALTER TABLE [APPLICATION_FIELD_VALUE] NOCHECK CONSTRAINT ALL;");
        foreach (var (code, value) in answers)
        {
            db.ApplicationFieldValues.Add(new ApplicationFieldValue
            {
                ValueId = Guid.NewGuid(),
                ApplicationId = application.ApplicationId,
                FieldCode = code,
                Value = value,
            });
        }
        await db.SaveChangesAsync();
        var scores = await ScreeningEndpoints.ComputeScoresAsync(db, application, services, CancellationToken.None);
        return scores[ApplicationServices.Trainer].Total;
    }
}
