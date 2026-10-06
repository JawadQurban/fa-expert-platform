using System.Text.Json;
using System.Text.Json.Serialization;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace ExpertHub.Infrastructure.Screening;

/// <summary>
/// What the outbox carries for INT-06 — the answers to analyse, and the
/// application to attach the result to.
/// </summary>
/// <remarks>
/// ⚠️ The application id is in the <b>local</b> payload and never in the
/// provider request: <see cref="AiAnalysisChannel"/> uses it to write the
/// `AI_ANALYSIS` row and hands <see cref="IAiAnalysisProvider"/> only the
/// answers, which is a rule the port's signature enforces rather than trusts.
/// </remarks>
public sealed record AiAnalysisRequest(
    Guid ApplicationId,
    IReadOnlyList<QualitativeAnswer> Answers)
{
    /// <summary>Relaxed encoding so Arabic answers are stored as Arabic in
    /// the outbox payload, not as \uXXXX escapes.</summary>
    public static readonly JsonSerializerOptions PayloadOptions =
        new(JsonSerializerDefaults.Web)
        {
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        };
}

/// <summary>
/// INT-06's channel: hands the qualitative answers to the configured provider
/// and writes the `AI_ANALYSIS` row with what came back.
/// </summary>
/// <remarks>
/// <para>
/// The crossing rides the outbox for the same reason every other one does —
/// the request is staged in the same transaction as the submission that
/// caused it, so the provider is never asked about an application that failed
/// to commit, and a slow model never holds a database transaction open.
/// </para>
/// <para>
/// <b>`BR-0202` survives here structurally.</b> This channel writes exactly
/// one entity, `AI_ANALYSIS`, and has no reference to `SCREENING_RESULT` or
/// to the scoring function — so there is no path from a model's opinion into
/// an official score, and adding one would mean adding a dependency that does
/// not exist.
/// </para>
/// <para>
/// A provider that returns nothing is <b>not</b> a failed delivery: the row
/// is written with status <c>unavailable</c> and the message is done. `08`
/// §4.1 requires INT-06 to «degrade to unavailable without blocking a
/// screening decision», and retrying an analysis nobody is waiting for would
/// burn attempts on the one integration whose absence costs nothing.
/// </para>
/// </remarks>
public sealed class AiAnalysisChannel : ISystemChannel
{
    private readonly IAiAnalysisProvider _provider;
    private readonly IServiceScopeFactory _scopes;

    public AiAnalysisChannel(IAiAnalysisProvider provider, IServiceScopeFactory scopes)
    {
        _provider = provider;
        _scopes = scopes;
    }

    public string SystemCode => IntegrationSystems.AiProvider;

    public bool IsConfigured => _provider.IsConfigured;

    public async Task<IntegrationAttemptResult> SendAsync(
        OutboxMessage message, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(message);

        // P-331 — the bio draft is INT-06's other crossing, with its own handler.
        if (message.EntityType == Profiles.TrainerBioDrafting.EntityType)
        {
            return await Profiles.TrainerBioDrafting.HandleAsync(
                message, _provider, _scopes, cancellationToken).ConfigureAwait(false);
        }

        AiAnalysisRequest? request;
        try
        {
            request = JsonSerializer.Deserialize<AiAnalysisRequest>(
                message.Payload, AiAnalysisRequest.PayloadOptions);
        }
        catch (JsonException exception)
        {
            return IntegrationAttemptResult.Failure($"Unreadable analysis payload: {exception.Message}");
        }
        if (request is null || request.Answers.Count == 0)
        {
            return IntegrationAttemptResult.Failure("Unreadable analysis payload: no answers.");
        }

        AiAnalysisDraft? draft;
        try
        {
            draft = await _provider.AnalyzeAsync(request.Answers, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !cancellationToken.IsCancellationRequested)
        {
            // A provider fault IS a failed delivery — the outbox retries it,
            // and the screening page shows no insight meanwhile.
            return IntegrationAttemptResult.Failure($"Provider call failed: {exception.Message}");
        }

        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
        await WriteAsync(db, request, draft, cancellationToken).ConfigureAwait(false);
        // ⚠️ WriteAsync only stages the row. Until 2026-10-05 nothing saved it,
        // so every delivered analysis was reported a success and then lost.
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return IntegrationAttemptResult.Success();
    }

    /// <summary>
    /// Records the analysis — or its absence. One row per application: a
    /// re-analysis replaces rather than accumulates, because the screening
    /// page shows «the» insight and two would be ambiguous.
    /// </summary>
    internal static async Task WriteAsync(
        ExpertHubDbContext db,
        AiAnalysisRequest request,
        AiAnalysisDraft? draft,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(request);

        var existing = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .FirstOrDefaultAsync(db.AiAnalyses, a => a.ApplicationId == request.ApplicationId,
                cancellationToken)
            .ConfigureAwait(false);

        var fieldCodes = JsonSerializer.Serialize(
            request.Answers.Select(a => a.FieldCode).ToArray(), AiAnalysisRequest.PayloadOptions);

        var analysis = existing ?? new AiAnalysis
        {
            AnalysisId = Guid.NewGuid(),
            ApplicationId = request.ApplicationId,
            SummaryAr = string.Empty,
            SummaryEn = string.Empty,
            Detail = "{}",
            AnalyzedFieldCodes = fieldCodes,
            Provider = draft?.Provider ?? "none",
            ModelVersion = draft?.ModelVersion ?? "none",
            PromptVersion = draft?.PromptVersion ?? "none",
            Status = AiAnalysisStatuses.Unavailable,
        };
        if (existing is null)
        {
            db.AiAnalyses.Add(analysis);
        }

        analysis.AnalyzedFieldCodes = fieldCodes;
        analysis.ProducedAt = DateTime.UtcNow;
        if (draft is null)
        {
            // ⚠️ Unavailable is a RESULT, recorded as one. The screening page
            // then says the insight is unavailable rather than showing an
            // empty panel that looks like a model with no opinion.
            analysis.Status = AiAnalysisStatuses.Unavailable;
            analysis.AdvisoryScore = null;
            return;
        }

        analysis.SummaryAr = draft.SummaryAr;
        analysis.SummaryEn = draft.SummaryEn;
        analysis.Detail = draft.DetailJson;
        analysis.AdvisoryScore = draft.AdvisoryScore;
        analysis.Provider = draft.Provider;
        analysis.ModelVersion = draft.ModelVersion;
        analysis.PromptVersion = draft.PromptVersion;
        analysis.Status = AiAnalysisStatuses.Produced;
    }
}

/// <summary>`AI_ANALYSIS.status` — `08` §4.1's degrade-to-unavailable rule.</summary>
public static class AiAnalysisStatuses
{
    public const string Produced = "produced";
    public const string Unavailable = "unavailable";
}

/// <summary>
/// The shape a provider is asked to return. Named here rather than in each
/// adapter so «the prompt» and «the contract» are the same artefact.
/// </summary>
internal sealed record AiAnalysisResponse(
    [property: JsonPropertyName("summaryAr")] string? SummaryAr,
    [property: JsonPropertyName("summaryEn")] string? SummaryEn,
    [property: JsonPropertyName("strengths")] AiBilingualNote[]? Strengths,
    [property: JsonPropertyName("considerations")] AiBilingualNote[]? Considerations,
    [property: JsonPropertyName("advisoryScore")] decimal? AdvisoryScore);

internal sealed record AiBilingualNote(
    [property: JsonPropertyName("ar")] string? Ar,
    [property: JsonPropertyName("en")] string? En);
