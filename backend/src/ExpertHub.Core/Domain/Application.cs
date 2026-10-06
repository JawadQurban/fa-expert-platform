namespace ExpertHub.Core.Domain;

/// <summary>
/// One application to join — `APPLICATION`, `10` §3.3 (CAP-01, J-01/J-02).
/// </summary>
/// <remarks>
/// <see cref="Reference"/> is issued <b>at submission only</b> (`BR-0107`) —
/// a draft has none, structurally. <see cref="Status"/> uses the locked
/// 11-value trainer presentation vocabulary (P-05) plus <c>draft</c>;
/// internal technical states never leak into it (`BR-0108`).
/// </remarks>
public sealed class Application
{
    public Guid ApplicationId { get; set; }

    public Guid ApplicantUserId { get; set; }

    /// <summary>The form version it was answered against (`BR-0103`).</summary>
    public required string SchemaVersion { get; set; }

    /// <summary>`EH-YYYY-NNNNN`, at submission only (`BR-0107`); null on drafts.</summary>
    public string? Reference { get; set; }

    /// <summary>A value of <see cref="ApplicationStatuses"/>.</summary>
    public required string Status { get; set; }

    /// <summary>`self_service` | `internal_nomination` (J-02).</summary>
    public required string Origin { get; set; }

    /// <summary>The nominating staff member (J-02); null for self-service.</summary>
    public Guid? NominatedBy { get; set; }

    /// <summary>J-02/F4 — the nominee has no account yet; the link carries this.</summary>
    public string? ActivationToken { get; set; }

    /// <summary>Reviewer-authored, shown to the trainer only when rejected.</summary>
    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

/// <summary>One requested service on an application — `APPLICATION_SERVICE`,
/// `10` §3.3. Outcomes are independent per service (`BR-0403`).</summary>
public sealed class ApplicationServiceEntry
{
    public Guid ApplicationServiceId { get; set; }

    public Guid ApplicationId { get; set; }

    /// <summary>A value of <see cref="ApplicationServices"/> (wire spelling).</summary>
    public required string Service { get; set; }

    /// <summary>`pending` | `accepted` | `rejected` — per service (`BR-0403`).</summary>
    public required string Outcome { get; set; }

    public DateTime? DecidedAt { get; set; }
}

/// <summary>One answered field — `APPLICATION_FIELD_VALUE`, `10` §3.3.</summary>
/// <remarks>Keyed by the wire <see cref="FieldCode"/> (the schema field's
/// stable identity across versions), value JSON-encoded because the wire type
/// is `string | boolean | string[]`.</remarks>
public sealed class ApplicationFieldValue
{
    public Guid ValueId { get; set; }

    public Guid ApplicationId { get; set; }

    public required string FieldCode { get; set; }

    /// <summary>JSON: a string, a boolean, or an array of option values.</summary>
    public required string Value { get; set; }

    /// <summary>
    /// Which entry of a REPEATABLE section this value belongs to — the
    /// qualification, certificate or past role it was typed into. Every field
    /// of one entry shares one id, which is what makes the entry editable and
    /// removable as a unit rather than by position.
    /// </summary>
    /// <remarks>
    /// ⚠️ NULL is the historical shape, and it stays readable forever: every
    /// value written before the repeatable sections existed has no entry, and
    /// is read as THE single entry of its section (`EntryIndex` 0). Nothing
    /// backfills it — an application submitted against a one-entry schema is
    /// not retroactively a multi-entry one.
    /// </remarks>
    public string? EntryId { get; set; }

    /// <summary>
    /// The entry's 0-based position within its section. 0 for every value of a
    /// non-repeatable section, and for every historical value.
    /// </summary>
    public int EntryIndex { get; set; }
}

/// <summary>
/// One attachment reference on an application — `APPLICATION_ATTACHMENT`,
/// `10` §3.3. ⚠️ Metadata only while `G26`/`G27` (storage + antivirus) stay
/// open: <see cref="AttachmentId"/> points into `ATTACHMENT` once a real
/// upload pipeline exists; until then no endpoint can create one.
/// </summary>
public sealed class ApplicationAttachment
{
    public Guid ApplicationAttachmentId { get; set; }

    public Guid ApplicationId { get; set; }

    /// <summary>The wire <see cref="AttachmentRule.RuleCode"/> it satisfies.</summary>
    public required string RuleCode { get; set; }

    public required string FileName { get; set; }

    public long SizeBytes { get; set; }

    /// <summary>Null until `G26` closes and files actually land in storage.</summary>
    public Guid? AttachmentId { get; set; }
}

/// <summary>
/// One add-service request — `SERVICE_REQUEST`, `10` §3.3 (J-03). Bypasses
/// screening entirely (`BR-0112`): the decision union is approve/reject and
/// nothing here can route anywhere else.
/// </summary>
public sealed class ServiceRequest
{
    public Guid ServiceRequestId { get; set; }

    /// <summary>The approved application whose scope this widens.</summary>
    public Guid ApplicationId { get; set; }

    public Guid TrainerUserId { get; set; }

    /// <summary>`EH-ASR-YYYY-NNNN` — issued at request submission (J-03/F1/AC-3).</summary>
    public required string Reference { get; set; }

    /// <summary>Never one already approved (`BR-0110`).</summary>
    public required string RequestedService { get; set; }

    /// <summary>`pending` | `approved` | `rejected` — no screening state exists.</summary>
    public required string Status { get; set; }

    /// <summary>JSON map of the delta field values only (`BR-0111`).</summary>
    public required string DeltaValues { get; set; }

    /// <summary>JSON array of the delta attachments' metadata (`G26` pending).</summary>
    public required string DeltaAttachments { get; set; }

    /// <summary>`approve` | `reject` once decided.</summary>
    public string? DecisionKind { get; set; }

    /// <summary>⚠️ Internal only — the trainer is notified WITHOUT the reason
    /// (J-03/F3/AC-7); no trainer-facing projection may read these two.</summary>
    public string? RejectionReasonId { get; set; }

    public string? RejectionReasonText { get; set; }

    /// <summary>F3/AC-4 — approval is not finalizable without it (`BR-0305`).</summary>
    public string? AddendumFileName { get; set; }

    /// <summary>The stored addendum document. Null on decisions recorded when
    /// only its file name was kept — those still read by name.</summary>
    public Guid? AddendumAttachmentId { get; set; }

    public string? DecisionNote { get; set; }

    public Guid? DecidedBy { get; set; }

    public DateTime? DecidedAt { get; set; }

    public DateTime SubmittedAt { get; set; }
}
