namespace ExpertHub.Core.Domain;

/// <summary>
/// One bilingual template — `NOTIFICATION_TEMPLATE`, `10` §3.9. `BR-0701`:
/// no free-form wording reaches a notification; only an approved template can
/// be routed, and approval requires both languages complete.
/// </summary>
/// <remarks>
/// <see cref="Version"/> exists because the log records the version that was
/// actually sent: editing a template must not rewrite the history of what
/// people received. Editing an approved template returns it to
/// <c>draft</c> and unroutes its matrix rows — the approval was of the
/// wording, and the wording changed.
/// </remarks>
public sealed class NotificationTemplate
{
    public Guid TemplateId { get; set; }

    public required string Code { get; set; }

    public required string SubjectAr { get; set; }

    public required string SubjectEn { get; set; }

    public required string BodyAr { get; set; }

    public required string BodyEn { get; set; }

    /// <summary>JSON array of the placeholder names the bodies use.</summary>
    public required string Placeholders { get; set; }

    public int Version { get; set; }

    /// <summary>A value of <see cref="TemplateStatuses"/>.</summary>
    public required string Status { get; set; }

    public DateTime UpdatedAt { get; set; }

    /// <summary>The System Administrator who last saved it (`BR-0704`).</summary>
    public Guid UpdatedBy { get; set; }
}
