namespace ExpertHub.Core.Domain;

/// <summary>A saved committee arrangement — `COMMITTEE_TEMPLATE`. Reuse
/// COPIES its members into the sequence (J-09/F2/AC-5): editing a reused
/// template for one application never alters the saved template.</summary>
public sealed class CommitteeTemplate
{
    public Guid TemplateId { get; set; }

    public required string Name { get; set; }

    /// <summary>JSON array of member inputs — copied on use, never referenced.</summary>
    public required string Members { get; set; }

    /// <summary>`committee` (J-09) | `signing` (J-10) — shared mechanics,
    /// separate records (J-10/F2/AC-3); each surface lists only its own.</summary>
    public required string Kind { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>The approval sequence for one application — `COMMITTEE_SEQUENCE`
/// (`BR-0209`: the decision is on the application as a whole).</summary>
public sealed class CommitteeSequence
{
    public Guid SequenceId { get; set; }

    public Guid ApplicationId { get; set; }

    public Guid? CreatedFromTemplateId { get; set; }

    /// <summary>A value of <see cref="CommitteeSequenceStatuses"/>.</summary>
    public required string Status { get; set; }

    /// <summary>1-based position of the member whose turn it is — sequential,
    /// auto-advance (J-09/F4).</summary>
    public int CurrentStepIndex { get; set; }

    /// <summary>The creator forms it, receives the result, and may resubmit
    /// after a modification request (F2, F5, F7/AC-3).</summary>
    public Guid CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? DecidedAt { get; set; }
}

/// <summary>One member's position and recorded act — `COMMITTEE_STEP`.
/// Per-member state on purpose (`BR-0218`): a modification request resumes
/// from the requesting member, and approvals already given are preserved —
/// a single cursor that resets could not honour that.</summary>
public sealed class CommitteeStep
{
    public Guid StepId { get; set; }

    public Guid SequenceId { get; set; }

    public Guid MemberUserId { get; set; }

    public int OrderIndex { get; set; }

    /// <summary>Only a MANDATORY member's rejection halts the application;
    /// an optional member's rejection is a logged note (`BR-0211` revised,
    /// J-09/F4/AC-4). Two different consequences, one flag.</summary>
    public bool IsMandatory { get; set; }

    /// <summary>`approve` | `reject` | `request_modification`, once acted.</summary>
    public string? Decision { get; set; }

    /// <summary>Unified reason id, on a rejection (`BR-0219`).</summary>
    public string? RejectionReasonId { get; set; }

    public string? RejectionReasonText { get; set; }

    public string? Note { get; set; }

    public DateTime? ActedAt { get; set; }
}

/// <summary>The concluding record for one service — `ACCREDITATION_DECISION`.</summary>
public sealed class AccreditationDecision
{
    public Guid DecisionId { get; set; }

    public Guid ApplicationServiceId { get; set; }

    /// <summary>`accredited` | `rejected`.</summary>
    public required string Outcome { get; set; }

    /// <summary>⟨gap⟩ per-service classification — nobody has supplied the
    /// scale's assignment rules; null until they do (`BR-0403`).</summary>
    public string? Classification { get; set; }

    public Guid DecidedBy { get; set; }

    public DateTime DecidedAt { get; set; }
}

/// <summary>`COMMITTEE_SEQUENCE.status`.</summary>
public static class CommitteeSequenceStatuses
{
    public const string InProgress = "in-progress";
    public const string ModificationRequested = "modification-requested";
    public const string Approved = "approved";
    public const string Rejected = "rejected";
}

/// <summary>J-08's approved exemption reasons + other.</summary>
public static class ExemptionReasons
{
    public static readonly IReadOnlyList<string> All =
        ["expert", "prior-collaboration", "other"];
}
