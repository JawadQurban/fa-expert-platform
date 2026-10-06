namespace ExpertHub.Core.Domain;

/// <summary>
/// A centre's request for people — `ASSIGNMENT_REQUEST`, `10` §3.7 (J-16).
/// </summary>
/// <remarks>
/// ⚠️ The FAST plan payload (`PulledRequestDataDto`) is deliberately NOT
/// stored: there is no FAST plan read (INT-05a has no agreed contract —
/// `Q20`/`Q21`), so the request
/// carries what the centre itself entered — the owner's `DM-GAP-06` workbook
/// (`P-174`/`P-175`) — and `pulled` serves null rather than a fabricated
/// programme. Matching reads the entered fields, which is where the language,
/// delivery mode, city and dates actually come from today.
/// </remarks>
public sealed class AssignmentRequest
{
    public Guid RequestId { get; set; }

    /// <summary>`ASR-YYYY-NNNN` — issued at submission (J-16/F5/AC-1).</summary>
    public required string Reference { get; set; }

    /// <summary>The mapped service (`serviceTypeFor` — the workbook's five
    /// request types collapse onto four services).</summary>
    public required string ServiceType { get; set; }

    /// <summary>The workbook's own request type, kept as entered.</summary>
    public required string RequestType { get; set; }

    public required string CentreId { get; set; }

    public required string ResponsibleEmployee { get; set; }

    public int RequiredHeadcount { get; set; }

    /// <summary>`matching` | `nominated` | `closed`.</summary>
    public required string Status { get; set; }

    /// <summary>JSON — the centre's entered form, verbatim (`DM-GAP-06`).</summary>
    public required string FormValues { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// One person the request needs — `ASSIGNMENT_SLOT`. Everything downstream is
/// SLOT-scoped, never request-scoped (`P-95`): the offer, the re-routing
/// cycle, the FAST sync and the exhaustion flag all live here, because
/// J-18/F4/AC-1 syncs a confirmed slot «with no waiting for the remaining
/// slots».
/// </summary>
public sealed class AssignmentSlot
{
    public Guid SlotId { get; set; }

    public Guid RequestId { get; set; }

    /// <summary>1-based, and the number every wire type uses.</summary>
    public int SlotNumber { get; set; }

    public Guid? ConfirmedEngagementId { get; set; }

    /// <summary>`none` | `processing` | `synchronized` — per slot.</summary>
    public required string FastSyncState { get; set; }

    /// <summary>J-19's trigger: every approved candidate refused or lapsed.</summary>
    public bool Exhausted { get; set; }
}

/// <summary>
/// The matching model — `MATCHING_MODEL`. ⚠️ `DM-GAP-05`: the weights and the
/// tie-break rule are UNAPPROVED, so they are served configuration exactly as
/// the screening matrix is (`P-24`), and the seed carries a draft label.
/// </summary>
public sealed class MatchingModel
{
    public Guid MatchingModelId { get; set; }

    public required string Version { get; set; }

    /// <summary>JSON map of the three weighted criteria → weight.</summary>
    public required string Weights { get; set; }

    /// <summary>Authored text; null while unapproved — nothing is invented.</summary>
    public string? TieBreakNoteAr { get; set; }

    public string? TieBreakNoteEn { get; set; }

    public bool IsActive { get; set; }
}

/// <summary>One execution of the engine — `MATCHING_RUN`.</summary>
public sealed class MatchingRun
{
    public Guid RunId { get; set; }

    public Guid RequestId { get; set; }

    /// <summary>Null for a request-wide run; set when J-19 re-routes ONE slot
    /// (`P-95` — re-routing is slot-scoped, never request-scoped).</summary>
    public Guid? SlotId { get; set; }

    public Guid MatchingModelId { get; set; }

    /// <summary>headcount × 3 (`BR-0505`, F2/AC-2).</summary>
    public int RequiredPoolSize { get; set; }

    public Guid RunBy { get; set; }

    public DateTime RunAt { get; set; }
}

/// <summary>A ranked candidate — `MATCH_CANDIDATE`.</summary>
public sealed class MatchCandidate
{
    public Guid MatchCandidateId { get; set; }

    public Guid RunId { get; set; }

    public Guid TrainerId { get; set; }

    /// <summary>JSON — the weighted breakdown BEHIND the rank, so the UI
    /// never recomputes a ranking it was given (F1/AC-3).</summary>
    public required string WeightedScores { get; set; }

    public decimal TotalScore { get; set; }

    public int Rank { get; set; }
}

/// <summary>
/// A candidate the engine ruled out — `MATCH_EXCLUSION`. Kept SEPARATE from
/// the ranked list on purpose: an exclusion is not a low score, and merging
/// the two would let a screen present someone the matrix rules out.
/// </summary>
public sealed class MatchExclusion
{
    public Guid ExclusionId { get; set; }

    public Guid RunId { get; set; }

    public Guid TrainerId { get; set; }

    /// <summary>JSON array of <see cref="MatchExclusionReasons"/> values.</summary>
    public required string Reasons { get; set; }
}

/// <summary>
/// The batch sent to the requesting party — `CANDIDATE_POOL`. F3/AC-1: sent
/// «in one batch — never one at a time», which is why there is no
/// send-one-candidate operation anywhere.
/// </summary>
public sealed class CandidatePool
{
    public Guid PoolId { get; set; }

    public Guid RequestId { get; set; }

    /// <summary>Set when the pool belongs to one re-routed slot (J-19).</summary>
    public Guid? SlotId { get; set; }

    /// <summary>`not_built` | `sent` | `decided`.</summary>
    public required string Status { get; set; }

    /// <summary>`engine` | `manual` — the exclusions apply on EITHER path
    /// (F3/AC-3), so this records which was used, not which rules ran.</summary>
    public required string Path { get; set; }

    public DateTime? SentAt { get; set; }
}

/// <summary>One nominee in the pool — `POOL_MEMBER`.</summary>
public sealed class PoolMember
{
    public Guid PoolMemberId { get; set; }

    public Guid PoolId { get; set; }

    public Guid TrainerId { get; set; }

    /// <summary>From their active agreement (`BR-0515`); null when the
    /// agreement carries no price for that mode.</summary>
    public decimal? PriceInClass { get; set; }

    public decimal? PriceOnline { get; set; }

    public required string Currency { get; set; }

    /// <summary>`pending` | `approved` | `rejected` — PER CANDIDATE, never a
    /// group verdict (J-17/F4/AC-1).</summary>
    public required string Decision { get; set; }

    /// <summary>1-based preference among the approved (F4/AC-2); null until ranked.</summary>
    public int? PreferenceRank { get; set; }

    public DateTime? DecidedAt { get; set; }
}

/// <summary>One re-routing cycle on one slot — `SLOT_CYCLE` (J-19).
/// Counted, never capped (F3/AC-3).</summary>
public sealed class SlotCycle
{
    public Guid CycleId { get; set; }

    public Guid SlotId { get; set; }

    public int CycleNumber { get; set; }

    /// <summary>`exhausted` | `awaiting_approval` | `decided`.</summary>
    public required string Status { get; set; }

    public Guid? PoolId { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// An offer to one trainer for one slot — `ASSIGNMENT_OFFER`. **The system
/// creates it; nobody sends it** (J-18/F1/AC-1), which is why no endpoint
/// anywhere accepts a "send offer" call: an offer appears when a slot has an
/// approved candidate whose turn has come.
/// </summary>
public sealed class AssignmentOffer
{
    public Guid OfferId { get; set; }

    public Guid SlotId { get; set; }

    public Guid TrainerId { get; set; }

    /// <summary>`awaiting_response` | `accepted` | `rejected` | `expired`.</summary>
    public required string Status { get; set; }

    public decimal? Price { get; set; }

    public required string Currency { get; set; }

    public DateTime SentAt { get; set; }

    /// <summary>The 3-day window, from the central SLA matrix (`SLA-0501`,
    /// `BR-0705`) — never a constant here.</summary>
    public DateTime? ResponseDueAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    /// <summary>When the response window closed with no answer — the expiry
    /// transition's own record, set exactly once by whichever path claimed it
    /// (the sweep or a late answer).</summary>
    public DateTime? ExpiredAt { get; set; }
}

/// <summary>A confirmed engagement — `ENGAGEMENT`.</summary>
public sealed class Engagement
{
    public Guid EngagementId { get; set; }

    public Guid OfferId { get; set; }

    public Guid TrainerId { get; set; }

    public Guid SlotId { get; set; }

    /// <summary>`upcoming` | `in_progress` | `completed` | `withdrawn` | `cancelled`.
    /// The first three are DERIVED from the plan's schedule (J-21/F5); only the
    /// last two are stored acts.</summary>
    public required string Status { get; set; }

    public DateTime ConfirmedAt { get; set; }

    /// <summary>FAST moved the dates (J-21/F1/AC-3).</summary>
    public DateTime? ScheduleChangedAt { get; set; }
}

/// <summary>
/// How an engagement ended early — `ENGAGEMENT_TERMINATION`. `P-113`: three
/// DISTINCT end states, and the two reason lists are kept apart because
/// «Personal Emergency» is not a reason staff can give and «Administrative
/// Decision» is not one a trainer can.
/// </summary>
public sealed class EngagementTermination
{
    public Guid TerminationId { get; set; }

    public Guid EngagementId { get; set; }

    /// <summary>`withdrawn` — the trainer withdrew OR staff de-linked (J-22,
    /// `P-111`: one outcome, the actor says who) | `cancelled` — FAST cancelled
    /// the plan. Rows written as `cancelled` by a staff de-link before that fix
    /// are kept as they were.</summary>
    public required string Kind { get; set; }

    /// <summary>`trainer` | `staff` | `fast`.</summary>
    public required string Actor { get; set; }

    public required string Reason { get; set; }

    /// <summary>Required when the reason is `other` — the text IS the reason.</summary>
    public string? Note { get; set; }

    /// <summary>FAST's own cancellation code, when the actor is FAST
    /// (J-22/F3 — cancellation originates ONLY there).</summary>
    public string? FastCancelReasonCode { get; set; }

    public Guid? ActedBy { get; set; }

    public DateTime OccurredAt { get; set; }
}

/// <summary>A material or content submission — `MATERIAL_SUBMISSION` (J-20).</summary>
public sealed class MaterialSubmission
{
    public Guid SubmissionId { get; set; }

    public Guid EngagementId { get; set; }

    /// <summary>`training_material` | `service_content`.</summary>
    public required string Kind { get; set; }

    /// <summary>`awaiting_upload` | `pending_approval` | `changes_requested` | `approved`.</summary>
    public required string Status { get; set; }

    /// <summary>`none` | `processing` | `synchronized` — the material path
    /// only (J-20/F3); service content never syncs to FAST.</summary>
    public required string FastSyncState { get; set; }

    public DateTime OpenedAt { get; set; }
}

/// <summary>
/// One review round — `SUBMISSION_ROUND`. **There is no rejection**: the
/// decision is approve or request-changes, and the note is mandatory on the
/// latter (J-20/F2/AC-3, `P-98`).
/// </summary>
public sealed class SubmissionRound
{
    public Guid RoundId { get; set; }

    public Guid SubmissionId { get; set; }

    public int RoundNumber { get; set; }

    public required string FileName { get; set; }

    /// <summary>`approved` | `changes_requested`, once decided.</summary>
    public string? Decision { get; set; }

    public string? Note { get; set; }

    public Guid? DecidedBy { get; set; }

    public DateTime? DecidedAt { get; set; }

    public DateTime UploadedAt { get; set; }
}

/* ── the closed vocabularies ─────────────────────────────────────────────── */

/// <summary>`ASSIGNMENT_REQUEST.status` (J-16/F5/AC-2 ends at `matching`).</summary>
public static class AssignmentRequestStatuses
{
    public const string Matching = "matching";
    public const string Nominated = "nominated";
    public const string Closed = "closed";
}

/// <summary>The four EXCLUSIONARY matrix rows — a closed union, so a fifth
/// cannot appear without amending the matrix first (J-17/F1/AC-2).</summary>
public static class MatchExclusionReasons
{
    public const string Specialization = "specialization";
    public const string Location = "location";
    public const string ScheduleConflict = "schedule-conflict";
    public const string FileStatus = "file-status";
}

/// <summary>The three WEIGHTED rows. None of them can exclude anyone
/// (F1/AC-3) — which is why they are a different list entirely.</summary>
public static class WeightedCriteria
{
    public const string Language = "language";
    public const string DeliveryMode = "delivery-mode";
    public const string Evaluation = "evaluation";

    public static readonly IReadOnlyList<string> All = [Language, DeliveryMode, Evaluation];
}

/// <summary>`BR-0505` / J-17/F2/AC-2 — exactly three per required person.</summary>
public static class Matching
{
    public const int CandidatesPerSlot = 3;

    public static int PoolSizeFor(int requiredHeadcount) =>
        requiredHeadcount * CandidatesPerSlot;
}

/// <summary>`ASSIGNMENT_OFFER.status`.</summary>
public static class OfferStatuses
{
    public const string AwaitingResponse = "awaiting_response";
    public const string Accepted = "accepted";
    public const string Rejected = "rejected";
    public const string Expired = "expired";
}

/// <summary>`ENGAGEMENT.status` — the two stored end states; the other three
/// are derived from the schedule (J-21/F5).</summary>
public static class EngagementStatuses
{
    public const string Upcoming = "upcoming";
    public const string InProgress = "in_progress";
    public const string Completed = "completed";
    public const string Withdrawn = "withdrawn";
    public const string Cancelled = "cancelled";
}

/// <summary>J-22's two closed reason lists, kept apart (`P-113`).</summary>
public static class TerminationReasons
{
    public static readonly IReadOnlyList<string> Trainer =
        ["personal-emergency", "scheduling-conflict", "other"];

    public static readonly IReadOnlyList<string> Staff =
        ["operational-need-change", "administrative-decision", "other"];
}

/// <summary>
/// «اسم المركز» — the OPERATIONAL centres an assignment request is raised by,
/// exactly as the approved Notion «Assignment Matrix» lists them: «البنوك
/// والتمويل، الأوراق المالية، التامين، البرامج الخاصة، القيادات».
/// </summary>
/// <remarks>
/// ⚠️ A separate list from `centre`, the AUTHORIZATION data-scope list (CAP-08),
/// which stays empty until access governance decides it (`P-276`): naming the
/// centre that raised a request must never quietly become who may see what.
/// The matrix gives the names in Arabic only, so the English label carries the
/// same Arabic rather than an invented translation (the precedent of the domain
/// list).
/// </remarks>
public static class AssignmentCentres
{
    public const string ListCode = "assignment-centre";

    public static readonly IReadOnlyList<(Guid ValueId, string Code, string LabelAr)> Approved =
    [
        (new Guid("ac000000-0000-0000-0000-000000000001"), "banking-finance", "البنوك والتمويل"),
        (new Guid("ac000000-0000-0000-0000-000000000002"), "securities", "الأوراق المالية"),
        (new Guid("ac000000-0000-0000-0000-000000000003"), "insurance", "التامين"),
        (new Guid("ac000000-0000-0000-0000-000000000004"), "special-programs", "البرامج الخاصة"),
        (new Guid("ac000000-0000-0000-0000-000000000005"), "leadership", "القيادات"),
    ];
}

/// <summary>`SLOT_CYCLE.status` — J-19's re-routing states for one slot.</summary>
public static class SlotCycleStatuses
{
    /// <summary>The slot ran out of approved candidates; a new pool is due.</summary>
    public const string Exhausted = "exhausted";

    /// <summary>A new pool was sent to the requesting party.</summary>
    public const string AwaitingApproval = "awaiting_approval";

    /// <summary>The requesting party decided; offers run from that set.</summary>
    public const string Decided = "decided";
}

/// <summary>`MATERIAL_SUBMISSION.status`.</summary>
public static class SubmissionStatuses
{
    public const string AwaitingUpload = "awaiting_upload";
    public const string PendingApproval = "pending_approval";
    public const string ChangesRequested = "changes_requested";
    public const string Approved = "approved";
}
