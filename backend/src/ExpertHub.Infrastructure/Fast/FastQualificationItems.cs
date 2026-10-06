using System.Text.Json;
using System.Text.Json.Serialization;

namespace ExpertHub.Infrastructure.Fast;

/// <summary>
/// One academic qualification, as `qualifications-education` returns it.
/// </summary>
/// <remarks>
/// ⚠️ <b>Written from a REAL response, captured 2026-09-10</b>, not from the
/// contract — the register declares no schema for this endpoint. Only the
/// fields the product shows are named; FAST also sends `qualificationsTypeId`,
/// `userProfileId` and `requestStatus`, which are its own bookkeeping.
/// </remarks>
public sealed record FastEducationItem
{
    public string? Id { get; init; }

    /// <summary>The degree — «ماجستير», «بكالوريوس».</summary>
    public string? QualificationsType { get; init; }

    public string? GeneralSpecialization { get; init; }

    public string? Specialization { get; init; }

    /// <summary>
    /// The awarding institution. ⚠️ FAST calls this `donor`, which reads as
    /// something else entirely in English; the name is theirs and the meaning
    /// is «الجهة المانحة» — who granted the qualification.
    /// </summary>
    public string? Donor { get; init; }

    public DateTime? DateObtained { get; init; }

    /// <summary>
    /// ⚠️ FAST keeps removed rows in the payload and flags them. Anything true
    /// here has been deleted by the person and must never be displayed.
    /// </summary>
    public bool? IsDeleted { get; init; }
}

/// <summary>
/// One professional certification, as `qualifications-professional` returns it.
/// </summary>
public sealed record FastProfessionalItem
{
    public string? Id { get; init; }

    public string? CertificateName { get; init; }

    /// <summary>The awarding body — see the note on the education item.</summary>
    public string? Donor { get; init; }

    public DateTime? DateObtained { get; init; }

    /// <summary>The document's own file name.</summary>
    public string? AttachmentName { get; init; }

    /// <summary>
    /// FAST's CDN link for the document.
    /// </summary>
    /// <remarks>
    /// ⚠️ <b>Captured but not offered as a link.</b> It points at the Academy's
    /// portal, and whether it opens for somebody holding only an Expert Hub
    /// session is unknown — nobody has tried it. A link that answers 401 is
    /// worse than a file name, because the person cannot tell whether the
    /// document is missing or they are.
    /// </remarks>
    public string? AttachmentDownloadUrl { get; init; }

    public bool? IsDeleted { get; init; }
}

/// <summary>Reads the stored collections into the shapes above.</summary>
public static class FastQualificationItems
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// The person's live qualifications — deleted rows removed, newest first.
    /// </summary>
    public static IReadOnlyList<FastEducationItem> Education(string? raw) =>
        Parse<FastEducationItem>(raw)
            .Where(item => item.IsDeleted != true)
            .OrderByDescending(item => item.DateObtained ?? DateTime.MinValue)
            .ToArray();

    public static IReadOnlyList<FastProfessionalItem> Professional(string? raw) =>
        Parse<FastProfessionalItem>(raw)
            .Where(item => item.IsDeleted != true)
            .OrderByDescending(item => item.DateObtained ?? DateTime.MinValue)
            .ToArray();

    /// <summary>
    /// ⚠️ Never throws. The stored text is whatever FAST sent at some past
    /// sign-in; a payload that changed shape is a display gap, not a reason a
    /// profile page fails to load.
    /// </summary>
    private static List<T> Parse<T>(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return [];
        }
        try
        {
            return JsonSerializer.Deserialize<List<T>>(raw, Json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
