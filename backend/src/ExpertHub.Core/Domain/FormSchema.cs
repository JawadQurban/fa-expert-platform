namespace ExpertHub.Core.Domain;

/// <summary>
/// One published version of the application form — `FORM_SCHEMA`, `10` §3.3.
/// The form is schema-driven and versioned (`BR-0103`): the approved
/// `DM-GAP-01` map replaces data rather than code, and a submitted
/// application keeps the version it was answered against so it still renders
/// correctly years later.
/// </summary>
public sealed class FormSchema
{
    /// <summary>The wire version string, e.g. <c>dm-gap-01.2026-08-30</c> —
    /// the owner's workbook delivery date is the identity.</summary>
    public required string SchemaVersion { get; set; }

    /// <summary>`draft` | `published` | `superseded` — applications start only
    /// against published; a superseded version still serves its pinned drafts
    /// and applications.</summary>
    public required string Status { get; set; }

    /// <summary>JSON array of the four self-service-selectable services —
    /// Speaker is internal-only and never appears here (`BR-0113`).</summary>
    public required string SelectableServices { get; set; }

    public DateTime? PublishedAt { get; set; }
}

/// <summary>One form section — `FORM_SECTION`, `10` §3.3.</summary>
public sealed class FormSection
{
    public Guid SectionId { get; set; }

    public required string SchemaVersion { get; set; }

    /// <summary>The wire section id, e.g. <c>personal</c>.</summary>
    public required string SectionCode { get; set; }

    public required string TitleAr { get; set; }

    public required string TitleEn { get; set; }

    public int OrderIndex { get; set; }

    /// <summary>
    /// JSON — the section's repeat configuration when it is a REPEATABLE group
    /// (`{ minEntries, addLabelAr, addLabelEn, entryLabelAr, entryLabelEn }`),
    /// NULL when it holds a single entry. Sections 2, 3 and 4 became repeatable
    /// with `dm-gap-01.2026-09-21`; every earlier version keeps NULL, which is
    /// what makes a historical application read as exactly one entry.
    /// No maximum is carried — none is approved.
    /// </summary>
    public string? Repeatable { get; set; }
}

/// <summary>
/// One form field — `FORM_FIELD`, `10` §3.3, carried as data so `DM-GAP-01`
/// replaced data, not code (`P-172`).
/// </summary>
/// <remarks>
/// The design sketch's columns cover code/labels/type/order; the owner's
/// workbook demands more — help texts, per-service visibility, conditional
/// `dependsOn`, inline options, ownership, read-only. <see cref="Definition"/>
/// therefore carries the complete wire field object verbatim (the frontend's
/// `ApplicationFieldSchema`), and the queryable columns beside it are a
/// projection of it, never a second source.
/// </remarks>
public sealed class FormField
{
    public Guid FieldId { get; set; }

    public required string SchemaVersion { get; set; }

    /// <summary>The wire field id — how values and validations name it.</summary>
    public required string FieldCode { get; set; }

    public required string SectionCode { get; set; }

    public required string LabelAr { get; set; }

    public required string LabelEn { get; set; }

    public required string InputType { get; set; }

    public int OrderIndex { get; set; }

    /// <summary>The full wire field object, JSON, served verbatim.</summary>
    public required string Definition { get; set; }
}

/// <summary>One attachment rule — `ATTACHMENT_RULE`, `10` §3.3 (`BR-0106`).</summary>
public sealed class AttachmentRule
{
    public Guid RuleId { get; set; }

    public required string SchemaVersion { get; set; }

    /// <summary>The wire rule id, e.g. <c>cv</c>.</summary>
    public required string RuleCode { get; set; }

    public required string LabelAr { get; set; }

    public required string LabelEn { get; set; }

    /// <summary>JSON array of lower-case extensions.</summary>
    public required string AcceptedFormats { get; set; }

    public int MaxSizeMb { get; set; }

    public int MaxCount { get; set; }

    /// <summary>JSON array of services this rule is required for (`BR-0104`).</summary>
    public required string RequiredFor { get; set; }

    /// <summary>
    /// The repeatable section whose ENTRY this rule attaches to — a
    /// qualification certificate belongs to its qualification, not to the
    /// application. NULL for an application-level attachment (CV, photo), and
    /// NULL on every schema version before `dm-gap-01.2026-09-21`.
    /// <see cref="MaxCount"/> and <see cref="RequiredFor"/> then read PER ENTRY.
    /// </summary>
    public string? PerEntryOf { get; set; }
}
