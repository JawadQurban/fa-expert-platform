namespace ExpertHub.Core.Domain;

/// <summary>
/// One interview — `INTERVIEW`. ⚠️ Deviation from `10` §3.4's ERD, recorded
/// there: the ERD hangs the interview off `APPLICATION_SERVICE`, but every
/// wire contract (J-06's applicant view, J-07's evaluation page) treats the
/// interview as APPLICATION-scoped — one ticket, one slot set, one committee
/// — with the per-service independence living INSIDE each evaluation's
/// scores (F1/AC-2). The row therefore references the application; the
/// per-service grain is `INTERVIEW_AXIS_SCORE.service`.
/// </summary>
public sealed class Interview
{
    public Guid InterviewId { get; set; }

    public Guid ApplicationId { get; set; }

    /// <summary>Issued at slot confirmation (J-06/F2/AC-3); SURVIVES
    /// reschedules (F4/AC-6) — null until first confirmed.</summary>
    public string? TicketNumber { get; set; }

    /// <summary>A value of <see cref="InterviewStatuses"/>.</summary>
    public required string Status { get; set; }

    public Guid? ConfirmedSlotId { get; set; }

    /// <summary>The applicant's pending ask for different times (J-06/F4).</summary>
    public DateTime? RescheduleRequestedAt { get; set; }

    public string? RescheduleNote { get; set; }

    public int RescheduleCount { get; set; }

    /// <summary>
    /// The join link, once a meeting exists. Null while none does — the state
    /// this carried from the start, and still the honest answer when no
    /// meeting provider is configured (`J-06` open item 1).
    /// </summary>
    public string? MeetingUrl { get; set; }

    /// <summary>
    /// The provider's own id for the booking.
    /// </summary>
    /// <remarks>
    /// ⚠️ Kept so a reschedule can MOVE the meeting people already hold.
    /// Without it the only option is a second meeting and a dead link in
    /// somebody's inbox, which is worse than not rescheduling at all.
    /// </remarks>
    public string? MeetingExternalId { get; set; }

    /// <summary>3 business days to select (J-06/F1/AC-4, `SLA-0201`).</summary>
    public DateTime? SelectionDueAt { get; set; }

    /// <summary>
    /// The <see cref="InterviewModel.Version"/> this interview was created
    /// under. Every score, total and scale is read through it, so an interview
    /// keeps its own model when a newer one is activated.
    /// </summary>
    public string? ModelVersion { get; set; }

    /* ── J-07/F3 — the post-interview decision, `BR-0208`-gated ──────────── */

    /// <summary>`forward` | `reject`, once the screening decision-maker acts.</summary>
    public string? DecisionKind { get; set; }

    public string? DecisionReasonId { get; set; }

    public string? DecisionReasonText { get; set; }

    public Guid? DecidedBy { get; set; }

    public DateTime? DecidedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>One proposed time — `INTERVIEW_SLOT`. Superseded slots are kept,
/// so a reschedule history exists.</summary>
public sealed class InterviewSlot
{
    public Guid SlotId { get; set; }

    public Guid InterviewId { get; set; }

    public DateTime StartsAt { get; set; }

    public bool IsSuperseded { get; set; }
}

/// <summary>The interview evaluation model — `INTERVIEW_MODEL`. Versioned rows:
/// a newer model is activated beside the older ones, never written over them.</summary>
public sealed class InterviewModel
{
    public Guid InterviewModelId { get; set; }

    public required string Service { get; set; }

    public required string Version { get; set; }

    public bool IsActive { get; set; }

    /// <summary>
    /// The top of a service total. Each criterion contributes
    /// (score ÷ axis max) × weight, scaled to this — 100 for the approved
    /// percentage model, 5 for the draft model it replaced.
    /// </summary>
    public decimal ResultMaxScore { get; set; }

    /// <summary>Display-only pass indicator on the result (J-07 model: ≥ 70%).
    /// Null where the model defines none. Never a workflow gate.</summary>
    public decimal? PassThreshold { get; set; }

    /// <summary>
    /// JSON array of the rating levels — <c>[{"score":1,"labelAr":…,"labelEn":…}]</c>.
    /// When present, a score must be one of these levels; when null the model
    /// predates a defined scale and accepts 0 to the axis max.
    /// </summary>
    public string? RatingScale { get; set; }
}

/// <summary>One measured axis — `INTERVIEW_AXIS`.</summary>
public sealed class InterviewAxis
{
    public Guid AxisId { get; set; }

    public Guid InterviewModelId { get; set; }

    /// <summary>The wire axis id, e.g. <c>subject-mastery</c>.</summary>
    public required string AxisCode { get; set; }

    public required string LabelAr { get; set; }

    public required string LabelEn { get; set; }

    public string? DescriptionAr { get; set; }

    public string? DescriptionEn { get; set; }

    public decimal Weight { get; set; }

    public decimal MaxScore { get; set; }

    public int OrderIndex { get; set; }
}

/// <summary>
/// One member's response — `INTERVIEW_EVALUATION`. A row is created at
/// screening time for every chosen committee member with
/// <see cref="SubmittedAt"/> null: the assignment IS the pending row, and
/// `BR-0220` (no result until every member responded) is a query over nulls,
/// not a flag someone maintains.
/// </summary>
public sealed class InterviewEvaluation
{
    public Guid InterviewEvaluationId { get; set; }

    public Guid InterviewId { get; set; }

    public Guid EvaluatorUserId { get; set; }

    /// <summary>Non-attendance is a distinct response — excluded from the
    /// average, never counted as zero (J-07/F2/AC-2).</summary>
    public bool DidNotAttend { get; set; }

    /// <summary>JSON map service → recommendation (the member's overall read).</summary>
    public string? Recommendations { get; set; }

    public string? Note { get; set; }

    /// <summary>Null while pending — the `BR-0220` discriminator.</summary>
    public DateTime? SubmittedAt { get; set; }
}

/// <summary>One axis score — `INTERVIEW_AXIS_SCORE`, per service (F1/AC-2:
/// each accepted service is scored independently).</summary>
public sealed class InterviewAxisScore
{
    public Guid AxisScoreId { get; set; }

    public Guid InterviewEvaluationId { get; set; }

    public Guid AxisId { get; set; }

    /// <summary>The service this score belongs to — the per-service grain.</summary>
    public required string Service { get; set; }

    public decimal Score { get; set; }
}

/// <summary>`INTERVIEW.status` — the closed set.</summary>
public static class InterviewStatuses
{
    /// <summary>Slots proposed; the applicant has not confirmed one (J-06/F1).</summary>
    public const string AwaitingSelection = "awaiting-selection";

    /// <summary>A slot is confirmed; the ticket exists (J-06/F2).</summary>
    public const string Scheduled = "scheduled";

    /// <summary>Every member responded; the consolidated result exists (J-07/F2).</summary>
    public const string Completed = "completed";
}
