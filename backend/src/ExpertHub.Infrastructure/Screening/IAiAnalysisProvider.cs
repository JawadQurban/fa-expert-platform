namespace ExpertHub.Infrastructure.Screening;

/// <summary>What the provider receives: qualitative answer text ONLY. No
/// name, no national ID, no contact detail, no application reference — text
/// to analyse and nothing identifying whose it is (`08` §2.2 rule 3).</summary>
public sealed record QualitativeAnswer(string FieldCode, string Text);

/// <summary>
/// What a provider returns — the analysis <b>without</b> the application it
/// belongs to, because the provider was never told.
/// </summary>
/// <param name="DetailJson">Strengths and considerations, bilingual, as the
/// screening wire renders them.</param>
/// <param name="AdvisoryScore">SEPARATE from the official score, always
/// (`BR-0201`, `BR-0202`). May be null — a provider that declines to score
/// is still useful for its summary.</param>
/// <param name="ModelVersion">Stored with the result so an analysis stays
/// explainable after the fact (`08` §2.2 consequence 1).</param>
public sealed record AiAnalysisDraft(
    string SummaryAr,
    string SummaryEn,
    string DetailJson,
    decimal? AdvisoryScore,
    string Provider,
    string ModelVersion,
    string PromptVersion);

/// <summary>
/// INT-06's provider-agnostic port (`P-132`) — the owner named OpenAI or
/// Claude, so neither is assumed; the choice (a future in-Kingdom model
/// included) is configuration, not a rewrite.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>The signature is the data-minimisation rule.</b> `08` §2.2 requires
/// that no name, national ID, contact detail or application reference leave
/// the boundary — so this method <b>has no parameter that could carry one</b>.
/// It receives field codes and answer text and returns an analysis that does
/// not know whose it is; the caller attaches it to an application afterwards,
/// on our side of the boundary. An implementation cannot leak an identifier
/// it was never given, which is a stronger guarantee than a review of the
/// request body.
/// </para>
/// <para>
/// ⚠️ `Q28` gates the whole feature: sending applicant free-text outside the
/// Academy's boundary needs a data-protection ruling (PDPL/SDAIA) before any
/// real provider is configured. Until then <see cref="NullAiAnalysisProvider"/>
/// stands in, and — because `BR-0202` makes the analysis advisory only —
/// screening works unchanged with the feature off entirely.
/// </para>
/// </remarks>
public interface IAiAnalysisProvider
{
    bool IsConfigured { get; }

    /// <summary>Analyses the qualitative answers; returns null when the
    /// provider is unavailable — the decision never waits on it.</summary>
    Task<AiAnalysisDraft?> AnalyzeAsync(
        IReadOnlyList<QualitativeAnswer> answers,
        CancellationToken cancellationToken);

    /// <summary>
    /// `P-331` — a short bio drafted from the text of the trainer's CV, in
    /// <paramref name="language"/> (`ar` or `en`). Null when the provider is
    /// unavailable or returns nothing usable; the trainer then writes it.
    /// </summary>
    /// <remarks>
    /// ⚠️ The one call on this port that carries identifying text: a CV holds a
    /// name and contact details by nature. It is the owner's explicit exception
    /// to `BR-0202` (`P-331`), and the prompt tells the model to leave contact
    /// details out of what it writes.
    /// </remarks>
    Task<string?> DraftBioAsync(string cvText, string language, CancellationToken cancellationToken);
}

/// <summary>The stand-in until `Q28` is ruled and a provider is configured.</summary>
public sealed class NullAiAnalysisProvider : IAiAnalysisProvider
{
    public bool IsConfigured => false;

    public Task<AiAnalysisDraft?> AnalyzeAsync(
        IReadOnlyList<QualitativeAnswer> answers,
        CancellationToken cancellationToken) => Task.FromResult<AiAnalysisDraft?>(null);

    public Task<string?> DraftBioAsync(
        string cvText, string language, CancellationToken cancellationToken) =>
        Task.FromResult<string?>(null);
}
