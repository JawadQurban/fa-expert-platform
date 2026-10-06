using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Documents;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Persistence;
using ExpertHub.Infrastructure.Screening;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Infrastructure.Profiles;

/// <summary>What the outbox carries for one bio draft: whose, which request,
/// which CV and in which language. The CV TEXT is not in it: it is read
/// from the document store at send time, so the outbox never holds a copy.</summary>
public sealed record TrainerBioDraftRequest(
    Guid TrainerId, int Version, Guid CvAttachmentId, string Language);

/// <summary>
/// `P-331` — drafts a trainer's short bio from their CV through INT-06.
/// </summary>
/// <remarks>
/// <para>
/// Rides the AI channel (`AiAnalysisChannel` hands it every `TRAINER_BIO`
/// message), so it is queued in the trainer's own transaction and a slow model
/// never holds a request open.
/// </para>
/// <para>
/// <b>It writes only if the trainer is still waiting for THIS request</b>:
/// the row must be <c>drafting</c> at <see cref="TrainerBioDraftRequest.Version"/>.
/// A trainer who gave up and wrote their own bio, or asked again, has moved the
/// row on, and a late answer then changes nothing.
/// </para>
/// </remarks>
public static partial class TrainerBioDrafting
{
    public const string EntityType = "TRAINER_BIO";

    public const string ElementName = "trainer_bio_draft";

    internal static async Task<IntegrationAttemptResult> HandleAsync(
        OutboxMessage message,
        IAiAnalysisProvider provider,
        IServiceScopeFactory scopes,
        CancellationToken cancellationToken)
    {
        TrainerBioDraftRequest? request;
        try
        {
            request = JsonSerializer.Deserialize<TrainerBioDraftRequest>(
                message.Payload, AiAnalysisRequest.PayloadOptions);
        }
        catch (JsonException exception)
        {
            return IntegrationAttemptResult.Failure($"Unreadable bio payload: {exception.Message}");
        }
        if (request is null)
        {
            return IntegrationAttemptResult.Failure("Unreadable bio payload.");
        }

        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
        if (!await WaitingAsync(db, request, cancellationToken).ConfigureAwait(false))
        {
            // Superseded — nothing to draft, and not a failure.
            return IntegrationAttemptResult.Success();
        }

        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger(typeof(TrainerBioDrafting));
        var (cv, unreadable) = await ReadCvAsync(
            db, scope.ServiceProvider.GetRequiredService<IDocumentStore>(),
            request.CvAttachmentId, cancellationToken).ConfigureAwait(false);
        string? draft = null;
        if (cv is null)
        {
            // Said in the log, by trainer id only: «no CV to read» and «the
            // model said nothing» look identical on the page.
            LogNoCvText(logger, request.TrainerId, unreadable!);
        }
        else
        {
            try
            {
                draft = await provider.DraftBioAsync(cv, request.Language, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (Exception exception) when (exception is not OperationCanceledException
                || !cancellationToken.IsCancellationRequested)
            {
                // A provider fault is a failed delivery: the outbox retries, and
                // the trainer can write their own bio meanwhile.
                return IntegrationAttemptResult.Failure($"Provider call failed: {exception.Message}");
            }
        }

        await WriteAsync(db, request, draft, DateTime.UtcNow, cancellationToken).ConfigureAwait(false);
        return IntegrationAttemptResult.Success();
    }

    /// <summary>
    /// Records the outcome, under the claim. A null draft (no readable CV, or
    /// the model gave nothing usable) is a result, `ai_unavailable`, so the page
    /// stops waiting and asks the trainer to write it.
    /// </summary>
    internal static Task<int> WriteAsync(
        ExpertHubDbContext db, TrainerBioDraftRequest request, string? draft, DateTime now,
        CancellationToken cancellationToken)
    {
        var claim = db.TrainerBios.Where(b => b.TrainerId == request.TrainerId
            && b.Status == TrainerBioStatuses.Drafting
            && b.Revision == request.Version);
        return draft is null
            ? claim.ExecuteUpdateAsync(set => set
                .SetProperty(b => b.Status, TrainerBioStatuses.AiUnavailable)
                .SetProperty(b => b.Revision, b => b.Revision + 1)
                .SetProperty(b => b.UpdatedAt, now), cancellationToken)
            : claim.ExecuteUpdateAsync(set => set
                .SetProperty(b => b.Status, TrainerBioStatuses.AiDraft)
                .SetProperty(b => b.Draft, draft)
                .SetProperty(b => b.DraftSource, TrainerBioSources.Ai)
                .SetProperty(b => b.Revision, b => b.Revision + 1)
                .SetProperty(b => b.UpdatedAt, now), cancellationToken);
    }

    private static Task<bool> WaitingAsync(
        ExpertHubDbContext db, TrainerBioDraftRequest request, CancellationToken cancellationToken) =>
        db.TrainerBios.AnyAsync(b => b.TrainerId == request.TrainerId
            && b.Status == TrainerBioStatuses.Drafting
            && b.Revision == request.Version, cancellationToken);

    /// <summary>The CV's text, or why there is none.</summary>
    private static async Task<(string? Text, string? Unreadable)> ReadCvAsync(
        ExpertHubDbContext db, IDocumentStore store, Guid attachmentId, CancellationToken cancellationToken)
    {
        var attachment = await db.Attachments.AsNoTracking()
            .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId, cancellationToken)
            .ConfigureAwait(false);
        if (attachment is null)
        {
            return (null, "no attachment row");
        }
        var content = await store.GetAsync(attachment.StorageRef, cancellationToken).ConfigureAwait(false);
        if (content is null)
        {
            return (null, "file not in the document store");
        }
        var text = CvText.Extract(content);
        return text is null
            ? (null, $"no text could be read from a {content.MimeType} file (scanned, legacy or corrupt)")
            : (text, null);
    }

    [LoggerMessage(EventId = 5242, Level = LogLevel.Warning,
        Message = "Bio draft for trainer {TrainerId} skipped: {Reason}.")]
    private static partial void LogNoCvText(ILogger logger, Guid trainerId, string reason);
}
