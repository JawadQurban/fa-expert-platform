namespace ExpertHub.Core.Domain;

/// <summary>
/// One screening evaluation model — `EVALUATION_MODEL`, `10` §3.4. Weights
/// are rows, never code (`BR-0203`): a weight change must not need a release.
/// ⚠️ `DM-GAP-02`: no weight or threshold is approved — the seeded model
/// carries the frontend's own draft version string so nothing can mistake it
/// for the approved matrix.
/// </summary>
public sealed class EvaluationModel
{
    public Guid ModelId { get; set; }

    public required string Service { get; set; }

    public required string Version { get; set; }

    /// <summary>Display-only indicator (J-05/F2/AC-5) — never an automated gate.</summary>
    public decimal PassThreshold { get; set; }

    public bool IsActive { get; set; }
}

/// <summary>One weighted criterion — `EVALUATION_CRITERION`, `10` §3.4.</summary>
/// <remarks>
/// <para>
/// The ORIGINAL five criteria mapped to the application form's scored SECTIONS
/// (2–6), so the link is <see cref="SourceSectionCode"/> — the design sketch
/// wrote `source_field_id`, but the draft J-05 matrix scored sections, not
/// single fields; recorded as an implementation note on `10` §3.4.
/// </para>
/// <para>
/// The APPROVED matrix (Notion «Evaluation Matrix - By Services», 2026-09-21)
/// scores single FIELDS, each through its own option→percentage-point table.
/// <see cref="SourceFieldCode"/>, <see cref="ScoreRule"/> and
/// <see cref="Aggregation"/> carry that, and are null on every model that
/// predates it — which is exactly how a historical result keeps computing the
/// way it always did (see `ScreeningScorer`).
/// </para>
/// </remarks>
public sealed class EvaluationCriterion
{
    public Guid CriterionId { get; set; }

    public Guid ModelId { get; set; }

    public required string LabelAr { get; set; }

    public required string LabelEn { get; set; }

    /// <summary>The form section this criterion scores (`FORM_SECTION.section_code`).
    /// Still set on lookup models — it groups the breakdown on screen.</summary>
    public required string SourceSectionCode { get; set; }

    /// <summary>
    /// Percent of the service's total; a model's criteria sum to 100. On a
    /// lookup model this is the criterion's CEILING — the largest value its
    /// <see cref="ScoreRule"/> can return — because the approved tables return
    /// already-weighted percentage points rather than a 0–100 raw score.
    /// </summary>
    public decimal Weight { get; set; }

    public int OrderIndex { get; set; }

    /// <summary>
    /// The form field this criterion looks the applicant's answer up in
    /// (`FORM_FIELD.field_code`), or an attachment rule code when
    /// <see cref="Aggregation"/> is `file-count`. NULL on the section-
    /// completeness models that predate the approved matrix.
    /// </summary>
    public string? SourceFieldCode { get; set; }

    /// <summary>
    /// JSON — the criterion's own option→percentage-point table, the shape the
    /// approved matrix describes ("the applicant's selected answer is looked up
    /// directly and returns a percentage-point value that already *is* the
    /// weighted score"). NULL selects the legacy completeness path.
    /// `BR-0203`: this is a row, so a weight change is data, not a release.
    /// </summary>
    public string? ScoreRule { get; set; }

    /// <summary>
    /// How the entries of a REPEATABLE section collapse into one value:
    /// `single` (the section holds one entry), `max` (best-of — the matrix's
    /// own «Do No Harm» policy, and the owner's 2026-09-21 ruling for years of
    /// experience), `entry-count` (how many entries exist) or `file-count`
    /// (how many files were attached to <see cref="SourceFieldCode"/>).
    /// </summary>
    public string? Aggregation { get; set; }
}

/// <summary>The <see cref="EvaluationCriterion.Aggregation"/> vocabulary.</summary>
public static class CriterionAggregations
{
    /// <summary>One answer — the section is not repeatable.</summary>
    public const string SingleAnswer = "single";

    /// <summary>Best-of across the section's entries.</summary>
    public const string Max = "max";

    /// <summary>How many entries the section holds.</summary>
    public const string EntryCount = "entry-count";

    /// <summary>How many files the attachment rule holds.</summary>
    public const string FileCount = "file-count";
}

/// <summary>The recorded screening decision for one service — `SCREENING_RESULT`.</summary>
public sealed class ScreeningResult
{
    public Guid ScreeningResultId { get; set; }

    public Guid ApplicationServiceId { get; set; }

    public Guid ModelId { get; set; }

    /// <summary>`BR-0201` — the fixed weighted formula's output. NO AI input:
    /// the scorer never receives an <see cref="AiAnalysis"/> (see
    /// `ScreeningScorer`), so no code path can merge one in.</summary>
    public decimal ObjectiveScore { get; set; }

    /// <summary>`accept` | `reject` | `exempt_interview` (J-08).</summary>
    public required string Decision { get; set; }

    /// <summary>Unified list id (`BR-0219`); rejections only.</summary>
    public string? RejectionReasonId { get; set; }

    public string? RejectionReasonText { get; set; }

    /// <summary>J-08's three approved reasons + other; exemptions only.</summary>
    public string? ExemptionReasonId { get; set; }

    public string? ExemptionReasonText { get; set; }

    public Guid DecidedBy { get; set; }

    public DateTime DecidedAt { get; set; }
}

/// <summary>The per-criterion breakdown snapshot — `SCREENING_CRITERION_SCORE`.</summary>
public sealed class ScreeningCriterionScore
{
    public Guid ScoreId { get; set; }

    public Guid ScreeningResultId { get; set; }

    public Guid CriterionId { get; set; }

    public decimal RawScore { get; set; }

    public decimal WeightedScore { get; set; }
}

/// <summary>
/// The advisory AI output — `AI_ANALYSIS`, a SIBLING of the screening result,
/// never a column on it (`BR-0201`/`BR-0202`, `08` §2.2). The official score
/// function does not take this type as a parameter, so the advisory value is
/// structurally unable to reach the official score. No row can exist until
/// `Q28`'s data-protection ruling opens INT-06; screening works unchanged
/// with the feature off entirely.
/// </summary>
public sealed class AiAnalysis
{
    public Guid AnalysisId { get; set; }

    public Guid ApplicationId { get; set; }

    /// <summary>Qualitative questions ONLY (`BR-0202`) — never attachments.</summary>
    public required string SummaryAr { get; set; }

    public required string SummaryEn { get; set; }

    /// <summary>JSON — strengths/considerations lists, bilingual.</summary>
    public required string Detail { get; set; }

    /// <summary>SEPARATE — never merged into the official score.</summary>
    public decimal? AdvisoryScore { get; set; }

    /// <summary>JSON array of the field codes analysed — the scope, auditable.</summary>
    public required string AnalyzedFieldCodes { get; set; }

    /// <summary>INT-06's provider-agnostic port (`P-132`).</summary>
    public required string Provider { get; set; }

    /// <summary>Stored so the analysis stays explainable after the fact.</summary>
    public required string ModelVersion { get; set; }

    public required string PromptVersion { get; set; }

    /// <summary>`produced` | `unavailable` — degrades without blocking.</summary>
    public required string Status { get; set; }

    public DateTime ProducedAt { get; set; }
}
