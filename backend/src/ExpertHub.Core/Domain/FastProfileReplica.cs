namespace ExpertHub.Core.Domain;

/// <summary>
/// `FAST_USER_PROFILE` — Expert Hub's replica of the base profile FAST
/// masters, read at sign-in from `Users/Info`.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>FAST masters every column here</b> (`BR-1201`, `P-129`). Nothing in
/// the product writes to it except the sign-in importer, and nothing writes
/// back to FAST through it. `LastSyncedAt` is the whole point: the UI can say
/// when a value was last true rather than implying it is current (`BR-1203`).
/// </para>
/// <para>
/// Kept apart from <see cref="AppUser"/> deliberately. `APP_USER` is the
/// platform's own record of a person — it exists for people FAST has never
/// heard of, and its columns are ours. This table is somebody else's data,
/// dated, and deletable without losing a person.
/// </para>
/// </remarks>
public sealed class FastProfileReplica
{
    public Guid UserId { get; set; }

    /// <summary>FAST's own identifier for the person.</summary>
    public string? FastUserId { get; set; }

    public string? IdNumber { get; set; }

    public string? PassportNumber { get; set; }

    public string? ResidencyNumber { get; set; }

    public DateTime? DateOfBirth { get; set; }

    /// <summary>The given name, kept apart from the full name.</summary>
    public string? FirstNameAr { get; set; }

    public string? FirstNameEn { get; set; }

    /// <summary>
    /// The application form's own nationality value — `sa`, `gcc` or `other` —
    /// resolved from <see cref="NationalityCountryId"/> through FAST's country
    /// lookup at sign-in.
    /// </summary>
    /// <remarks>
    /// ⚠️ Null when the lookup has never run or did not recognise the id. The
    /// raw id stays beside it either way, so a later run can resolve what an
    /// earlier one could not.
    /// </remarks>
    public string? NationalityCode { get; set; }

    public int? NationalityCountryId { get; set; }

    public string? JobTitle { get; set; }

    public string? Organization { get; set; }

    public string? SocialMediaUrl { get; set; }

    /// <summary>Whether FAST lets them edit their own profile — which decides
    /// whether a field is offered as `request-change` or shown locked.</summary>
    public bool CanChangeProfile { get; set; }

    public bool IsOrganizationAdmin { get; set; }

    public bool IsOrganizationCoordinator { get; set; }

    /// <summary>JSON — FAST's roles, verbatim. ⚠️ Informative only: Expert
    /// Hub's permissions come from `USER_ROLE` (`P-181`). These are shown to
    /// an administrator deciding what to grant, never consulted by a gate.</summary>
    public string? FastRoles { get; set; }

    /* ⚠️ `Q22` — FAST's three Expert flags do NOT map onto Expert Hub's four
       services; only «question writer» has an obvious counterpart. Stored as
       sent so the mapping is decided from real data. */

    public bool ExpertCorrector { get; set; }

    public bool ExpertReviewer { get; set; }

    public bool ExpertQuestionAuthor { get; set; }

    /// <summary>JSON — the eight J-09/F6 bank fields FAST already holds, in
    /// Expert Hub's own field names. Used to PREFILL the bank form so the
    /// applicant confirms rather than retypes; never treated as submitted.</summary>
    public string? BankFields { get; set; }

    /// <summary>`BR-1203` — the last known state, visibly dated.</summary>
    /*
     * The four qualification collections FAST holds, stored as received
     * (owner ruling, 2026-09-09).
     *
     * ⚠️ Raw JSON, not columns. All four endpoints return an UNDECLARED
     * payload — the API register names a request DTO for one of them and
     * defines none — so there are no field names to make columns out of.
     * Storing the response verbatim is what will reveal them: the first live
     * sign-in writes a real payload here, and the shape can be read off it
     * instead of guessed at.
     */

    /// <summary>Degrees, as `qualifications-education` returned them.</summary>
    public string? QualificationsEducation { get; set; }

    /// <summary>Employment history.</summary>
    public string? QualificationsPracticalExperience { get; set; }

    /// <summary>Professional certifications.</summary>
    public string? QualificationsProfessional { get; set; }

    /// <summary>Courses attended.</summary>
    public string? QualificationsTrainingCourses { get; set; }

    /// <summary>When the four collections were last read — null while never.</summary>
    /// <summary>
    /// The trainer contracts FAST holds, as received.
    /// </summary>
    /// <remarks>
    /// ⚠️ Raw JSON and read-only (`P-266`). Whether a FAST «trainer contract»
    /// is the same artefact as an Expert Hub agreement is unanswered, so this
    /// is shown as the Academy's own document and never written to.
    /// </remarks>
    public string? Contracts { get; set; }

    /// <summary>When the contracts were last read. Null = never.</summary>
    public DateTime? ContractsSyncedAt { get; set; }

    public DateTime? QualificationsSyncedAt { get; set; }

    public DateTime LastSyncedAt { get; set; }
}
