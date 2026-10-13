namespace ExpertHub.Core.Domain;

/// <summary>
/// A hosted speaker — `SPEAKER_RECORD` (J-04, `BR-0412`, `BR-0413`).
/// </summary>
/// <remarks>
/// <para>
/// <b>A record, not a person's account.</b> A speaker has no portal and no
/// sign-in; staff create and edit the record from the internal dashboard only
/// (`BR-0113`, `BR-0412`). It is never classified, evaluated, contracted or
/// paid (`BR-0413`), so nothing in CAP-02, CAP-03 or CAP-06 references it.
/// </para>
/// <para>
/// The fields are the owner's Speaker Record matrix (Notion, 11 fields): the
/// photo, the speaker's title, four name parts in each language, and the bio.
/// </para>
/// <para>
/// <b>The email comes from FAST</b> (owner ruling, 2026-10-13): the speaker's
/// contact details are read from their FAST profile, not typed here.
/// <see cref="FastUserId"/> is that link. FAST exposes no read of another
/// person's profile yet (B-13 in the FAST contract), so it stays null and
/// J-04/F1/AC-4's creation email waits on FAST.
/// </para>
/// </remarks>
public sealed class SpeakerRecord
{
    public Guid SpeakerRecordId { get; set; }

    /// <summary>Matrix row 2 — صفة المتحدث.</summary>
    public string? Title { get; set; }

    public required string FirstNameAr { get; set; }

    public string? MiddleNameAr { get; set; }

    public string? ThirdNameAr { get; set; }

    public required string LastNameAr { get; set; }

    public string? FirstNameEn { get; set; }

    public string? MiddleNameEn { get; set; }

    public string? ThirdNameEn { get; set; }

    public string? LastNameEn { get; set; }

    /// <summary>Matrix row 11 — نبذة عن المتحدث.</summary>
    public string? Bio { get; set; }

    /// <summary>Matrix row 1 — the personal photo, an uploaded image.</summary>
    public Guid? PhotoAttachmentId { get; set; }

    /// <summary>The speaker's FAST account, where the email is read from.
    /// Null until FAST offers a lookup (see the remarks).</summary>
    public string? FastUserId { get; set; }

    public Guid CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid? UpdatedBy { get; set; }

    public DateTime UpdatedAt { get; set; }
}
