namespace ExpertHub.Core.Domain;

/// <summary>
/// The one unified agreement per person — `AGREEMENT`, `10` §3.5 (§6.1,
/// `D-05`): every accredited service under one agreement; an added service is
/// an ADDENDUM, never a second agreement. The document itself is authored
/// OUTSIDE the platform (BRD §9.2) — linked and tracked, never edited here.
/// </summary>
/// <remarks>
/// One state machine end to end: the J-10 preparation stages
/// (<c>preparation → formation → in-progress → modification-requested →
/// sent-to-applicant</c>), J-11's applicant outcomes (<c>declined</c>, or
/// activation), then J-12's lifecycle (<c>active → suspended/expired/ended</c>).
/// The lifecycle wire union only ever sees the last four. `TRAINER_PROFILE`
/// does not exist yet (BE-09), so the party is the `APP_USER` — recorded
/// deviation.
/// </remarks>
public sealed class Agreement
{
    public Guid AgreementId { get; set; }

    public Guid TrainerUserId { get; set; }

    /// <summary>The application whose approval produced it (J-10's entry).</summary>
    public Guid ApplicationId { get; set; }

    public Guid? TemplateId { get; set; }

    /// <summary>`AGR-YYYY-NNNN`.</summary>
    public required string Reference { get; set; }

    /// <summary>A value of <see cref="AgreementStatuses"/>.</summary>
    public required string Status { get; set; }

    public DateTime? StartsAt { get; set; }

    /// <summary>Calculated from the term — never entered (`BR-0301`).</summary>
    public DateTime? EndsAt { get; set; }

    /// <summary>1 first, 3 on every renewal (`BR-0302`) — server-derived.</summary>
    public int TermYears { get; set; }

    public int RenewalCount { get; set; }

    /// <summary>JSON map of the creator-filled template fields (`DM-GAP-16`).</summary>
    public required string FieldValues { get; set; }

    /// <summary>`P-333` — the trainer's own agreement file, uploaded at
    /// preparation. What the signers and the applicant read and sign.</summary>
    public Guid? DocumentAttachmentId { get; set; }

    public DateTime? SentToApplicantAt { get; set; }

    /* ── J-11/F1 — the applicant's three-way decision ────────────────────── */

    /// <summary>`sign` | `reject` | `request-modification`, once decided.</summary>
    public string? ApplicantDecisionKind { get; set; }

    /// <summary>Mandatory on a modification request (F1/AC-5).</summary>
    public string? ApplicantDecisionNote { get; set; }

    /// <summary>The typed-name stand-in (`G26` keeps the artefact minimal).</summary>
    public string? ApplicantSignatureName { get; set; }

    public DateTime? ApplicantDecidedAt { get; set; }

    /// <summary>The exact document version the applicant accepted.</summary>
    public Guid? ApplicantDocumentVersionId { get; set; }

    /// <summary>A value of <see cref="SignatureMethods"/> — how the applicant's
    /// acceptance was captured.</summary>
    public string? ApplicantSignatureMethod { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>One covered service — `AGREEMENT_SERVICE` (Speaker never appears
/// here, BRD §6.1).</summary>
public sealed class AgreementServiceRow
{
    public Guid AgreementServiceId { get; set; }

    public Guid AgreementId { get; set; }

    public required string Service { get; set; }
}

/// <summary>An added service's annex — `ADDENDUM` (`BR-0305`): attaches to
/// the EXISTING agreement; no new agreement, no new signature.</summary>
public sealed class AddendumRecord
{
    public Guid AddendumId { get; set; }

    public Guid AgreementId { get; set; }

    public required string Service { get; set; }

    /// <summary>The document's file name (kept for rows recorded before the
    /// document itself was stored).</summary>
    public required string DocumentFileName { get; set; }

    /// <summary>The stored addendum document; null on older rows.</summary>
    public Guid? AttachmentId { get; set; }

    public Guid? ServiceRequestId { get; set; }

    public Guid ApprovedBy { get; set; }

    public DateTime ApprovedAt { get; set; }
}

/// <summary>The central template — `AGREEMENT_TEMPLATE` (`BR-0306`; J-12/F4
/// owns it, System Administrator only). ⚠️ `DM-GAP-16`: only start/end date
/// are confirmed fields; the seed carries the frontend's own draft label.</summary>
public sealed class AgreementTemplateRecord
{
    public Guid TemplateId { get; set; }

    public required string Name { get; set; }

    public required string Version { get; set; }

    /// <summary>The fixed legal text (`BR-0306`).</summary>
    public required string BodyText { get; set; }

    /// <summary>JSON array of field definitions — served as configuration.</summary>
    public required string FieldMap { get; set; }

    /// <summary>JSON array — F4/AC-2 builds for the multi-template future.</summary>
    public required string Services { get; set; }

    public bool IsActive { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }
}

/// <summary>The internal signing chain — `SIGNING_SEQUENCE` (J-10/F2; shares
/// P-J1's mechanics with J-09 while staying a distinct record — F2/AC-3).</summary>
/// <remarks>⚠️ Never deleted. A restarted run VOIDS the previous chain, which
/// keeps every approval and signature it carried as evidence.</remarks>
public sealed class SigningSequenceRecord
{
    public Guid SequenceId { get; set; }

    public Guid AgreementId { get; set; }

    /// <summary>`in-progress` | `modification-requested` | `complete` | `voided`.</summary>
    public required string Status { get; set; }

    /// <summary>When a restarted run superseded this chain; null while current.</summary>
    public DateTime? VoidedAt { get; set; }

    public int CurrentStepIndex { get; set; }

    /// <summary>One half of the send gate — the other is an attached
    /// signature; the two are never collapsed (`BR-0213`, P-38).</summary>
    public bool IsComplete { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>One person in the chain — `SIGNATORY`. No `reject` decision can
/// be stored: J-10/F3/AC-6 removed rejection from this sequence entirely.</summary>
public sealed class SignatoryRecord
{
    public Guid SignatoryId { get; set; }

    public Guid SequenceId { get; set; }

    public Guid UserId { get; set; }

    public int OrderIndex { get; set; }

    /// <summary>`mandatory` | `optional` — the shared formation vocabulary.</summary>
    public required string Obligation { get; set; }

    /// <summary>F2/AC-4 — a designated e-signer SIGNS; approval alone from
    /// them is refused, so a completed sequence cannot lack its signature.</summary>
    public bool IsSigner { get; set; }

    /// <summary>`approve` | `sign` | `request_modification`.</summary>
    public string? Decision { get; set; }

    public string? Note { get; set; }

    public DateTime? ActedAt { get; set; }

    /// <summary>The exact document version this person acted on.</summary>
    public Guid? DocumentVersionId { get; set; }
}

/// <summary>The captured signature — `E_SIGNATURE` (`G26` keeps it the typed
/// name + server timestamp; the shared P-J10 stand-in).</summary>
public sealed class ESignatureRecord
{
    public Guid SignatureId { get; set; }

    public Guid SignatoryId { get; set; }

    public required string SignatureName { get; set; }

    public string? IpAddress { get; set; }

    public DateTime SignedAt { get; set; }

    /// <summary>A value of <see cref="SignatureMethods"/>. Every signature so far
    /// is an internal acceptance — no e-signature provider exists.</summary>
    public string Method { get; set; } = SignatureMethods.InternalAcceptance;
}

/// <summary>
/// How a signature was captured. ⚠️ No external e-signature provider is
/// integrated, so nothing may claim a qualified or digital signature: the
/// typed name + identity + timestamp + the exact document version is an
/// INTERNAL acceptance, and it is labelled as one.
/// </summary>
public static class SignatureMethods
{
    public const string InternalAcceptance = "internal-acceptance";

    /// <summary>Reserved for a real provider; nothing writes it today.</summary>
    public const string ExternalESignature = "external-e-signature";
}

/// <summary>
/// One immutable version of an agreement's content — `AGREEMENT_DOCUMENT_VERSION`.
/// </summary>
/// <remarks>
/// The fixed legal text, the creator-filled fields (with the labels they had),
/// and the merged trainer/bank data, frozen at preparation. Signers and the
/// applicant read THIS, and every approval, signature and acceptance names the
/// version it applied to — so a later template edit or re-preparation can never
/// change what somebody agreed to. Append-only; a content change is a new
/// version, never an edit.
/// </remarks>
public sealed class AgreementDocumentVersion
{
    public Guid DocumentVersionId { get; set; }

    public Guid AgreementId { get; set; }

    public int VersionNumber { get; set; }

    public Guid? TemplateId { get; set; }

    public required string TemplateName { get; set; }

    public required string TemplateVersion { get; set; }

    /// <summary>The fixed legal text as it was.</summary>
    public required string BodyText { get; set; }

    /// <summary>JSON — the fields with their labels and values.</summary>
    public required string Fields { get; set; }

    /// <summary>JSON — the merged data groups as they were.</summary>
    public required string MergedData { get; set; }

    /// <summary>SHA-256 of the content — evidence it was not altered. For a
    /// version with an <see cref="AttachmentId"/> it is the hash of the file's
    /// bytes (`P-333`).</summary>
    public required string ContentHash { get; set; }

    /// <summary>`P-333` — the uploaded agreement file this version froze; null
    /// on versions rendered from the template before files were uploaded.</summary>
    public Guid? AttachmentId { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// A template's earlier content — `AGREEMENT_TEMPLATE_VERSION`. Saving the
/// template (J-12/F4) keeps what it replaced here; append-only.
/// </summary>
public sealed class AgreementTemplateVersion
{
    public Guid TemplateVersionId { get; set; }

    public Guid TemplateId { get; set; }

    public required string Version { get; set; }

    public required string BodyText { get; set; }

    public required string FieldMap { get; set; }

    public DateTime RecordedAt { get; set; }

    public Guid? RecordedBy { get; set; }
}

/// <summary>One lifecycle event — `AGREEMENT_EVENT`, the J-12 history.</summary>
public sealed class AgreementEvent
{
    public Guid EventId { get; set; }

    public Guid AgreementId { get; set; }

    /// <summary>`prepared|sent|signed|activated|renewed|suspended|reactivated|ended|declined|modification-requested`.</summary>
    public required string Kind { get; set; }

    /// <summary>Present on `renewed` — the term granted, for the record.</summary>
    public int? TermYears { get; set; }

    public string? Note { get; set; }

    public Guid ActorUserId { get; set; }

    public DateTime OccurredAt { get; set; }
}

/// <summary>
/// J-09/F6 — the bank data collected AFTER preliminary approval, never on the
/// application form (AC-2). One row per user; whether it persists across
/// future agreements is J-09's open item, flagged not assumed.
/// </summary>
public sealed class BankDataRecord
{
    public Guid UserId { get; set; }

    /// <summary>JSON of the eight mandatory fields; null until completed.</summary>
    public string? Fields { get; set; }

    /// <summary>Set when the committee's final approval triggers the request
    /// (J-09/F4/AC-5 — in parallel, not as a later step).</summary>
    public DateTime? RequestedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}

/// <summary>`AGREEMENT.status` — one machine, J-10 through J-12.</summary>
public static class AgreementStatuses
{
    /* J-10 — before the applicant ever sees it. */
    public const string Preparation = "preparation";
    public const string Formation = "formation";
    public const string InProgress = "in-progress";
    public const string ModificationRequested = "modification-requested";
    public const string SentToApplicant = "sent-to-applicant";

    /* J-11 — the applicant's terminal refusal. */
    public const string Declined = "declined";

    /* J-12 — the lifecycle the wire union shows. */
    public const string Active = "active";
    public const string Suspended = "suspended";
    public const string Ended = "ended";

    /// <summary>`expired` is DERIVED (active + past `ends_at`), never stored —
    /// a lapse is a fact about the calendar, not an act anyone performed.</summary>
    public const string Expired = "expired";
}
