namespace ExpertHub.Core.Domain;

/*
 * CAP-01's closed vocabularies — one source each, spellings fixed by the
 * frontend contract (`application.types.ts`, `serviceRequest.types.ts`).
 */

/// <summary>
/// The locked 11-value trainer presentation vocabulary (P-05) plus
/// <c>draft</c>. Internal technical states and FAST-sync state are never part
/// of this set and never shown on the trainer surface (`BR-0108`).
/// </summary>
public static class ApplicationStatuses
{
    public const string Draft = "draft";
    public const string Submitted = "submitted";
    public const string UnderReview = "under-review";
    public const string InterviewScheduled = "interview-scheduled";
    public const string InterviewCompleted = "interview-completed";
    public const string ApprovalInProgress = "approval-in-progress";
    public const string Approved = "approved";
    public const string AgreementPending = "agreement-pending";
    public const string Active = "active";
    public const string Rejected = "rejected";
    public const string Closed = "closed";

    /// <summary>Every status a list response must count (the wire record's keys).</summary>
    public static readonly IReadOnlyList<string> All =
    [
        Draft, Submitted, UnderReview, InterviewScheduled, InterviewCompleted,
        ApprovalInProgress, Approved, AgreementPending, Active, Rejected, Closed,
    ];

    /// <summary>`BR-0101`'s un-decided set — while one exists, no new application.</summary>
    public static readonly IReadOnlyList<string> Undecided =
    [
        Draft, Submitted, UnderReview, InterviewScheduled, InterviewCompleted,
        ApprovalInProgress, AgreementPending,
    ];
}

/// <summary>The form-schema versions — the delivery date of the approved map
/// is the identity (`P-172`). A submitted application keeps the version it
/// was answered against; a DRAFT is carried to <see cref="Current"/> when it is
/// resumed (`P-381`), and new drafts start on it.</summary>
public static class FormSchemaVersions
{
    /// <summary>The owner's `DM-GAP-01` workbook, 2026-08-30 — superseded.</summary>
    public const string Initial = "dm-gap-01.2026-08-30";

    /// <summary>The Notion «Application Form Matrix», 2026-09-14 — superseded.</summary>
    public const string NotionMatrix = "dm-gap-01.2026-09-14";

    /// <summary>The matrix plus the business decisions of 2026-09-16 — superseded.</summary>
    public const string BusinessDecisions = "dm-gap-01.2026-09-16";

    /// <summary>
    /// The approved repeatable sections and the Evaluation Matrix's own source
    /// fields, 2026-09-21 — published. Sections 2, 3 and 4 became repeatable
    /// groups, the specialization/university/certificate fields became the
    /// classified dropdowns the matrix scores, and Form 5 #8–#11 and Form 6 #8
    /// arrived.
    /// </summary>
    /// <remarks>
    /// ⚠️ This is also the version criterion #3 scores against. A 2026-09-22
    /// draft added a second domain field to the Experience section before the
    /// matrix was re-read: the criterion is «المجال», which Section 1 has
    /// carried all along, so no form change was needed and no version was
    /// published for one.
    /// </remarks>
    public const string RepeatableSections = "dm-gap-01.2026-09-21";

    /// <summary>
    /// The «المجال» option list minus the 13 values the business classified as
    /// master-data problems on 2026-09-28 — superseded. No field changed; every
    /// earlier version keeps all 147 options, so an application that selected
    /// one of them stays readable.
    /// </summary>
    public const string DomainFiltered = "dm-gap-01.2026-09-28";

    /// <summary>
    /// `preferredDeliveryMode` declares the service list it is actually for —
    /// superseded. Business decision 2026-09-29: the field is Trainer-only, so
    /// `requiredFor` now matches `visibleFor` instead of naming all four
    /// services. The correction is INERT — both validators skip a hidden field,
    /// so no application's outcome differs — but a published version is history
    /// and is never edited in place, so it ships as its own version.
    /// </summary>
    public const string DeliveryModeTrainerOnly = "dm-gap-01.2026-09-29";

    /// <summary>
    /// The Notion review of 2026-10-07 (`P-342`) — superseded. «المجال» offers
    /// «أخرى» with a text field to name it (criterion #3 pays 0 for it), and
    /// «هل سبق لك التدريب» is mandatory for the Trainer, and «القطاع» arrives
    /// (four sectors, mandatory for all four services).
    /// </summary>
    public const string NotionReview = "dm-gap-01.2026-10-07";

    /// <summary>
    /// The UAT round of 2026-10 — superseded. «تاريخ الانتهاء» is mandatory
    /// when «أعمل حاليًا» is off and never before «تاريخ البدء»; «عدد سنوات
    /// الخبرة» is mandatory; «التخصص» and «اسم الشهادة» name their «أخرى».
    /// </summary>
    public const string UatRound = "dm-gap-01.2026-10-19";

    /// <summary>
    /// The UAT re-test of 2026-10-28 — published. «التخصص» stops offering the
    /// workbook's footnote row (`spec-025`) and «أخرى*» its asterisk
    /// (BUG-006); every typed field checks the kind of input it holds and a
    /// date obtained or started cannot be in the future (J-01/F1 AC-6,
    /// BUG-014/BUG-015). Corrected in place before any deployment (M57):
    /// «المدن المتاح فيها الحضور الشخصي» is a list of the Kingdom's cities
    /// from FAST's table (BUG-005, `P-385`), and «أبرز البرامج …» a list of
    /// the Academy's published programmes plus «أخرى» named in
    /// <c>preferredProgramsOther</c> (BUG-004, `P-386`). Same sections,
    /// attachment rules and requiredness.
    /// </summary>
    public const string Current = "dm-gap-01.2026-10-28";
}

/// <summary>`FORM_SCHEMA.status` — exactly one version is published at a time.</summary>
public static class FormSchemaStatuses
{
    public const string Published = "published";
    public const string Superseded = "superseded";
}

/// <summary>The five service types (BRD §6), wire spellings.</summary>
public static class ApplicationServices
{
    public const string Trainer = "trainer";
    public const string Consultant = "consultant";
    public const string ContentDeveloper = "content-developer";
    public const string QuestionWriter = "question-writer";
    public const string Speaker = "speaker";

    public static readonly IReadOnlyList<string> All =
        [Trainer, Consultant, ContentDeveloper, QuestionWriter, Speaker];

    /// <summary>The Arabic service names — the BRD §6 vocabulary. One source
    /// for every surface that shows a service to a person: the notification
    /// templates' `serviceName` placeholder and the agreement document's
    /// «الخدمات المشمولة» group. Business review 2026-10-01, UI-06: that group
    /// used to print the raw code, so a trainer read `trainer` on their own
    /// agreement.</summary>
    private static readonly Dictionary<string, string> NamesAr = new()
    {
        [Trainer] = "مدرب",
        [Consultant] = "مستشار",
        [ContentDeveloper] = "مطوّر محتوى",
        [QuestionWriter] = "كاتب أسئلة",
        [Speaker] = "متحدث",
    };

    /// <summary>The Arabic name of a service code, or the code itself when it
    /// is one this vocabulary does not cover — never an empty string, because
    /// a blank is worse than an untranslated code on an agreement.</summary>
    public static string NameAr(string code) =>
        NamesAr.TryGetValue(code, out var name) ? name : code;

    private static readonly Dictionary<string, string> NamesEn = new()
    {
        [Trainer] = "Trainer",
        [Consultant] = "Consultant",
        [ContentDeveloper] = "Content developer",
        [QuestionWriter] = "Question writer",
        [Speaker] = "Speaker",
    };

    /// <summary>The English name of a service code, on the same terms as
    /// <see cref="NameAr"/>.</summary>
    public static string NameEn(string code) =>
        NamesEn.TryGetValue(code, out var name) ? name : code;
}

/// <summary>`APPLICATION.origin`.</summary>
public static class ApplicationOrigins
{
    public const string SelfService = "self_service";
    public const string InternalNomination = "internal_nomination";
}

/// <summary>`APPLICATION_SERVICE.outcome` — independent per service (`BR-0403`).</summary>
public static class ServiceOutcomes
{
    public const string Pending = "pending";
    public const string Accepted = "accepted";
    public const string Rejected = "rejected";
}

/// <summary>`SERVICE_REQUEST.status` — there is no screening state (`BR-0112`).</summary>
public static class ServiceRequestStatuses
{
    public const string Pending = "pending";
    public const string Approved = "approved";
    public const string Rejected = "rejected";
}

/// <summary>
/// The served rejection-reason list for J-03/F3/AC-3 — configuration on the
/// wire, a constant here. J-03's open item 2 leaves unresolved whether this
/// list is shared with CAP-02; these five entries mirror the frontend mock's
/// development-convenience list, and either answer replaces this constant
/// with served data without touching the UI.
/// </summary>
public sealed record ServiceRequestRejectionReason(
    string Id, string LabelAr, string LabelEn, bool RequiresText);

/// <summary>The five entries, one source.</summary>
public static class ServiceRequestRejectionReasons
{
    public static readonly IReadOnlyList<ServiceRequestRejectionReason> All =
    [
        new("insufficient-qualifications", "عدم استيفاء المؤهلات المطلوبة", "Insufficient qualifications", false),
        new("insufficient-experience", "الخبرة العملية غير كافية للخدمة المطلوبة", "Insufficient experience", false),
        new("incomplete-documents", "المستندات غير مكتملة", "Incomplete documents", false),
        new("specialty-not-required", "التخصص غير مطلوب حاليًا", "Specialty not currently required", false),
        new("other", "سبب آخر", "Other", true),
    ];

    /// <summary>
    /// RB-03 (Notion, 2026-09-20): «the request is automatically rejected with
    /// a dedicated reason ("no active agreement") pointing to the renewal path
    /// (J-12), and this cannot be overridden by the decision-maker». Applied by
    /// the system only — never offered in the decision-maker's list.
    /// </summary>
    public static readonly ServiceRequestRejectionReason NoActiveAgreement = new(
        "no-active-agreement",
        "لا توجد اتفاقية سارية — يلزم تجديد الاتفاقية",
        "No active agreement — the agreement must be renewed",
        false);
}
