namespace ExpertHub.Core.Domain;

/// <summary>
/// The trainer record — `TRAINER_PROFILE`, `10` §3.6. Created after signature
/// (J-13), which is why it does not exist for an applicant: a person becomes
/// a trainer when their agreement activates, not when they apply.
/// </summary>
/// <remarks>
/// <para>
/// <b>Split mastership (`P-134`).</b> The BASE profile is FAST's — it already
/// exists there as `dbo.AspNetUsers` + `profile.*`. Expert Hub masters only
/// the ACCREDITATION layer: <see cref="TrainerServiceRow"/>,
/// <see cref="FileStatus"/>, <see cref="VisibilityConsent"/>, the calculated
/// ratings and the Academy record.
/// </para>
/// <para>
/// ⚠️ <b>`file_status` is INTERNAL-ONLY</b> (`BR-0408`, J-13/AC-10, `P-48`):
/// never shown to the trainer and never on a public view. It appears on the
/// internal DTOs and is absent from `MyProfileDto` and every public
/// projection — enforced by the projections, not by a guard.
/// </para>
/// </remarks>
public sealed class TrainerProfile
{
    public Guid TrainerId { get; set; }

    public Guid UserId { get; set; }

    /// <summary>The application whose approval produced this trainer (J-13).</summary>
    public Guid ApplicationId { get; set; }

    /// <summary>FAST's own id for the base profile, once the INT-05a feed
    /// supplies it (INT-05a has no agreed contract); null until then.</summary>
    public string? FastUserProfileId { get; set; }

    /// <summary>A value of <see cref="TrainerFileStatuses"/> — Expert Hub
    /// masters it, and it never leaves the internal surface.</summary>
    public required string FileStatus { get; set; }

    /// <summary>`BR-1002`/`BR-1007` — the toggle that feeds the public
    /// directory. Off until the trainer turns it on; a directory that
    /// defaulted to visible would publish people who never agreed.</summary>
    public bool VisibilityConsent { get; set; }

    /// <summary>
    /// When the trainer actually answered the visibility question — null while
    /// they never have.
    /// </summary>
    /// <remarks>
    /// ⚠️ <b>Because `false` on its own is not consent, it is silence.</b> QA
    /// raised `D-44` against a government platform publishing personal data:
    /// the directory was correctly gated and correctly defaulted to off, but
    /// nothing recorded that anybody had been ASKED. «We defaulted you to
    /// hidden» and «you decided to stay hidden» are different facts, and only
    /// the second is a consent record.
    ///
    /// So this column carries the decision's date, and the profile can tell an
    /// undecided trainer apart from one who declined — the first gets asked,
    /// the second is left alone.
    /// </remarks>
    public DateTime? VisibilityConsentDecidedAt { get; set; }

    public Guid? PhotoAttachmentId { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// One accredited service and its classification —`TRAINER_SERVICE`,
/// Expert-Hub-mastered. `BR-0403`: the classification is independent per
/// service, which is why it lives here and not on the profile.
/// </summary>
public sealed class TrainerServiceRow
{
    public Guid TrainerServiceId { get; set; }

    public Guid TrainerId { get; set; }

    public required string Service { get; set; }

    /// <summary>⟨gap⟩ — nobody has supplied the rules that assign a tier, so
    /// this stays null and the wire serves the entry tier (see
    /// `TrainerClassifications`). Recorded, not invented.</summary>
    public string? Classification { get; set; }

    public DateTime AccreditedAt { get; set; }

    public required string Status { get; set; }
}

/// <summary>
/// One profile field value — the trainer's copy of the shared application-form
/// schema (`BR-0404`, J-14/F1/AC-1: the SAME fields, no separate update form).
/// </summary>
/// <remarks>
/// ⚠️ Deviation from `10` §3.6, recorded there: the design sketches EDUCATION,
/// PROFESSIONAL_CERTIFICATION, PRACTICAL_EXPERIENCE, TRAINING_COURSE,
/// AREA_OF_* and AVAILABILITY as separate replica tables. Those are FAST's own
/// tables, and Expert Hub's replica of them arrives with the INT-05a inbound
/// feed whose contract is still open (INT-05a). What the built contract
/// actually renders is a flat `fieldValues` map over the application schema —
/// so that is what is stored, and the sub-entity replicas land with the feed
/// that would populate them.
/// </remarks>
public sealed class TrainerFieldValue
{
    public Guid ValueId { get; set; }

    public Guid TrainerId { get; set; }

    public required string FieldCode { get; set; }

    /// <summary>JSON — a string, a boolean, or an array of option values.</summary>
    public required string Value { get; set; }

    /// <summary>
    /// The repeatable-section entry this value belongs to, carried across from
    /// the application unchanged (<see cref="ApplicationFieldValue.EntryId"/>).
    /// An approved applicant with three qualifications becomes a trainer with
    /// three — the alternative was losing two of them at approval, or failing
    /// the copy on the unique index.
    /// </summary>
    public string? EntryId { get; set; }

    /// <summary>The entry's 0-based position. 0 for a single-entry section and
    /// for every value copied before entries existed.</summary>
    public int EntryIndex { get; set; }
}

/// <summary>
/// A requested change to a FAST-mastered field — `PROFILE_CHANGE_REQUEST`.
/// This IS write-through (`P-135`): the request is queued to FAST through
/// BE-04's outbox and the trainer sees the OLD value with a pending marker
/// until FAST confirms, so the two copies cannot diverge and nothing is
/// applied locally and hoped for.
/// </summary>
public sealed class ProfileChangeRequest
{
    public Guid ChangeRequestId { get; set; }

    public Guid TrainerId { get; set; }

    public required string FieldCode { get; set; }

    /// <summary>JSON — the proposed value, shown as `pendingValue`.</summary>
    public required string ProposedValue { get; set; }

    /// <summary>`pending` | `applied` | `rejected`.</summary>
    public required string Status { get; set; }

    public DateTime RequestedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }
}

/// <summary>One programme the trainer delivered — `TRAINER_RECORD`, the
/// Academy record (J-13/F1/AC-5, J-15/F1). Also the public view's
/// "delivered programmes" (J-24/F2/AC-1).</summary>
public sealed class TrainerRecord
{
    public Guid RecordId { get; set; }

    public Guid TrainerId { get; set; }

    public required string ProgramNameAr { get; set; }

    public required string ProgramNameEn { get; set; }

    /// <summary>The trainer's part in it — e.g. `مدرب`.</summary>
    public required string Role { get; set; }

    public DateTime DeliveredFrom { get; set; }

    public DateTime? DeliveredTo { get; set; }
}

/// <summary>
/// The IMMUTABLE original from MTM — `RATING_SOURCE_RECORD` (`02D`, INT-02
/// masters it). Kept permanently as an integrated business record, never a
/// cache: once received it is part of Expert Hub's own history even if MTM's
/// copy later changes.
/// </summary>
public sealed class RatingSourceRecord
{
    public Guid RecordId { get; set; }

    public Guid TrainerId { get; set; }

    /// <summary>MTM's own id — the master's key.</summary>
    public required string MtmRecordId { get; set; }

    public decimal RawValue { get; set; }

    public int ScaleLow { get; set; }

    public int ScaleHigh { get; set; }

    public int ResponseCount { get; set; }

    public DateTime SourceDate { get; set; }

    public DateTime ReceivedAt { get; set; }
}

/// <summary>
/// A CALCULATED indicator — `TRAINER_RATING`. Expert Hub owns every
/// calculated figure (`02D`); the raw value it was built from stays on
/// <see cref="RatingSourceRecord"/> and is never overwritten.
/// </summary>
public sealed class TrainerRating
{
    public Guid RatingId { get; set; }

    public Guid TrainerId { get; set; }

    /// <summary>`overall` | `per_program`.</summary>
    public required string Scope { get; set; }

    /// <summary>The programme, when the scope is per-programme.</summary>
    public Guid? RecordId { get; set; }

    public decimal CalculatedValue { get; set; }

    /// <summary>⟨gap⟩ `DM-GAP-14` — the formula is not approved, so no
    /// version string is invented; null until it is.</summary>
    public string? CalculationVersion { get; set; }

    public DateTime CalculatedAt { get; set; }
}

/// <summary>`TRAINER_PROFILE.file_status` — internal-only (`BR-0408`).</summary>
public static class TrainerFileStatuses
{
    /// <summary>An active agreement and recent engagement (J-13/AC-9).</summary>
    public const string Active = "active";

    /// <summary>Active, but no engagement in the monitoring window —
    /// «for monitoring purposes only, with NO effect on matching
    /// eligibility» (J-13/AC-9), which is why it never reaches the trainer.</summary>
    public const string Idle = "idle";

    public const string Suspended = "suspended";

    /// <summary>The agreement lapsed without renewal — a lapse, distinct
    /// from a deliberate ending.</summary>
    public const string Expired = "expired";
}

/// <summary>`TRAINER_SERVICE.classification` — the wire union.</summary>
public static class TrainerClassifications
{
    public const string Expert = "expert";
    public const string Senior = "senior";
    public const string Certified = "certified";

    /// <summary>
    /// What the wire serves while `TRAINER_SERVICE.classification` is null:
    /// nobody has supplied the rules that assign a tier, and the contract's
    /// union has no "unclassified" member. The ENTRY tier is the honest
    /// placeholder — it claims the least — and it is the same one BE-07's
    /// internal trainer context already served.
    /// </summary>
    public const string PendingRulesPlaceholder = Certified;
}
