using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// The APPROVED screening evaluation matrix — Notion «Evaluation Matrix - By
/// Services», last edited 2026-09-21, served as version
/// <see cref="Version"/>. It replaces `mock-dm-gap-02-draft.1`, which stays
/// seeded and inactive so every application screened under it keeps the score
/// it was screened with (the same pattern `M24` used for the interview model).
/// </summary>
/// <remarks>
/// <para>
/// <b>The shape changed, not just the numbers.</b> The draft model scored the
/// form's five SECTIONS by completeness. The approved matrix scores individual
/// FIELDS: «the workbook does not use a classic raw-score × weight model. Each
/// criterion has its own option → weighted-percentage-point lookup table — the
/// applicant's selected answer is looked up directly and returns a percentage-
/// point value that already *is* the weighted score for that criterion.»
/// So <c>Final Score = SUM of all looked-up values</c>, 0–100 by construction.
/// </para>
/// <para>
/// <b>Ten common criteria (70%) + that service's own (30%) = 100%.</b> There
/// are THREE tracks, not four: Trainer, Consultant, and one combined
/// «Content Developer &amp; Question Writer» track whose two services share
/// identical criteria and weights. A model row still exists per service — the
/// wire is per-service (`J-05/F2/AC-3`: a score per requested service, never a
/// blended one) — the two content rows simply carry the same criteria.
/// </para>
/// <para>
/// <b>Pass threshold 50, display-only</b> (`J-05/F2/AC-5`): «a display-only
/// visual flag on the Insight Page, no automatic accept/reject effect». The
/// draft model's 70/75 were never approved numbers.
/// </para>
/// <para>
/// <b>Repeatable sections collapse best-of (MAX).</b> The matrix rules it for
/// certificates by name — «Do No Harm … an added entry can only help, never
/// hurt», with averaging and «primary/first entry only» both explicitly
/// rejected — and the owner ruled the same way for years of practical
/// experience on 2026-09-21. The same rule therefore applies to every
/// criterion reading a repeatable section, so the best qualification, the best
/// specialization and the longest role all score.
/// </para>
/// <para>
/// <b>Criterion #3 computes.</b> The controlled field it needed arrived on
/// 2026-09-22 — and it turned out to be «المجال», the Section 1 field the form
/// had carried all along, over the approved 147-value «مجال التخصص» list. So
/// it is a direct look-up like every other criterion and the model can reach
/// 100.
/// ⚠️ Its table is GENERATED from a workbook the business fills in
/// (<see cref="PracticalExperienceRelevance"/>) and is **strict**: a value the
/// business has not ruled on is ABSENT from it, and an applicant who picks one
/// is reported UNRESOLVED rather than scored zero. A missing decision must not
/// read as a decided «ليس له صلة». <c>ClassifiedCount</c> says how far the
/// workbook has got.
/// Nothing is renormalised either way: inflating the other criteria to reach
/// 100 would be a weighting the business never approved.
/// </para>
/// </remarks>
internal static class EvaluationMatrixSeedData
{
    /// <summary>
    /// The first approved matrix. Criterion #3 had no source field then, so it
    /// carried <see cref="Unavailable"/> and the reachable maximum was 90.
    /// SUPERSEDED and kept INACTIVE — never deleted, because a screening result
    /// decided under it pins it through `SCREENING_RESULT.model_id`.
    /// </summary>
    internal const string SupersededVersion = "dm-gap-02.2026-09-21";

    /// <summary>
    /// The same matrix with criterion #3 computing, once the controlled field
    /// and its list arrived (2026-09-22). Nothing else about the model changed:
    /// same criteria, same labels, same weights, same threshold.
    /// SUPERSEDED and kept INACTIVE for the same reason as the first.
    /// </summary>
    internal const string ClassifiedDomainVersion = "dm-gap-02.2026-09-22";

    /// <summary>
    /// `EVAL-GAP-11`, decided 2026-09-29: criteria #2, #7 and #8 look their
    /// answers up in CLOSED tables. An unclassified or unknown value now
    /// resolves to nothing AND says so, where before it scored a silent 0 that
    /// was indistinguishable from a decided «not related». Criteria, labels,
    /// weights, aggregations and the threshold are all unchanged — only what an
    /// unruled value does changed, and that is enough to need its own version.
    /// </summary>
    internal const string Version = "dm-gap-02.2026-09-29";

    /// <summary>`J-05/F2/AC-5` — display-only, never an automated gate.</summary>
    internal const decimal PassThreshold = 50m;

    /// <summary>The rule a criterion carries when its source field does not
    /// exist yet — it scores 0 and stays visible in the breakdown.</summary>
    private const string Unavailable = "{\"kind\":\"unavailable\"}";

    private static string Option(params (string Value, string Points)[] points) =>
        "{\"kind\":\"option\",\"points\":{"
        + string.Join(",", points.Select(p => $"\"{p.Value}\":{p.Points}"))
        + "}}";

    private static string Bucket(params (string UpTo, string Points)[] buckets) =>
        "{\"kind\":\"bucket\",\"buckets\":["
        + string.Join(",", buckets.Select(b =>
            b.UpTo is null
                ? $"{{\"points\":{b.Points}}}"
                : $"{{\"upTo\":{b.UpTo},\"points\":{b.Points}}}"))
        + "]}";

    private sealed record Criterion(
        string Ar,
        string En,
        string Section,
        string? Field,
        decimal Weight,
        string Aggregation,
        string Rule);

    /// <summary>
    /// §1.1 — the ten common criteria, «apply to all 4 services identically»,
    /// max 70% (verified: 5+10+10+20+6+6+5+4+2+2).
    /// </summary>
    private static Criterion[] Common(Criterion domainRelevance, Lookups lookups) =>
    [
        // #1 دبلوم 0.035 · بكالوريوس 0.04 · ماجستير 0.045 · دكتوراه 0.05
        new("المؤهل", "Qualification type", "education", "qualificationType", 5m,
            CriterionAggregations.Max,
            Option(("diploma", "0.035"), ("bachelor", "0.04"),
                   ("master", "0.045"), ("doctorate", "0.05"))),

        // #2 تخصص آخر (غير ذي صلة) 0 · تخصص مالي/اقتصادي/إداري 0.1.
        // The table is generated from the same workbook as the dropdown.
        new("التخصص العام", "General specialization (relevance)", "education",
            "specializationDetail", 10m, CriterionAggregations.Max,
            lookups.SpecializationRelevance),

        // #3 مجال ليس له صلة 0 · مجال ذو صلة 0.1 — the one row that differs
        // between the two versions, passed in.
        domainRelevance,

        // #4 1–5 0.05 · 5–10 0.1 · 11–15 0.15 · 16+ 0.2. The buckets are the
        // workbook's own and skip 10→11; the dropdown was aligned to them on
        // 2026-09-19, so this is a direct label look-up, not range arithmetic.
        new("عدد سنوات الخبرة العملية", "Years of practical experience",
            "experience", "yearsOfExperience", 20m, CriterionAggregations.Max,
            Option(("1-5", "0.05"), ("5-10", "0.1"),
                   ("11-15", "0.15"), ("16-plus", "0.2"))),

        // #5 لا يوجد 0 · 1–3 0.0171 · 4–7 0.0343 · 8+ 0.06, counted over the
        // FILES attached to «إحالات العملاء» (owner's ruling, 2026-09-21 — the
        // approved field is an attachment, and the table counts entries).
        // The source wrote its last two labels as «4–7» then «7+», which
        // overlap at 7. Business decision 2026-09-29: «4–7» means 4, 5, 6, 7
        // and the next bucket starts at 8, so the ranges are contiguous and
        // non-overlapping. The buckets below already read that way — `upTo: 7`
        // then the open bucket — so this fixes the LABEL, not the arithmetic.
        new("إحالات العملاء / شهادات المشاركة", "Client referrals",
            "training-content", "client-referrals", 6m,
            CriterionAggregations.FileCount,
            Bucket(("0", "0"), ("3", "0.0171"), ("7", "0.0343"), (null!, "0.06"))),

        // #6 لا يوجد 0 · شهادة واحدة 0.0171 · 2–3 0.0343 · أكثر من 3 0.06 —
        // «COUNT(Section 3 entries)», which is what makes section 3 repeatable.
        new("عدد الشهادات المهنية المرفقة", "Professional certificate count",
            "certifications", null, 6m, CriterionAggregations.EntryCount,
            Bucket(("0", "0"), ("1", "0.0171"), ("3", "0.0343"), (null!, "0.06"))),

        // #7 شهادة ليس لها صلة 0 · شهادة ذات صلة 0.05 — best-of across entries.
        new("مجال الشهادة المهنية", "Certificate field (relevance)",
            "certifications", "certificateName", 5m, CriterionAggregations.Max,
            lookups.CertificateRelevance),

        // #8 محلية 0.02 · عالمية 0.04 — best-of, so one global certificate
        // wins the 0.04 exactly as the matrix's worked examples show.
        new("مصدر الشهادة", "Certificate source", "certifications",
            "certificateName", 4m, CriterionAggregations.Max,
            lookups.CertificateSource),

        // #9 تفرغ كامل 0.02 · تفرغ جزئي 0.01 — the «نمط التعامل» field added
        // to the form on 2026-09-20 (resolves `EVAL-GAP-06`).
        new("نوع التعامل", "Employment type", "availability", "engagementMode",
            2m, CriterionAggregations.SingleAnswer,
            Option(("full-time", "0.02"), ("part-time", "0.01"))),

        // #10 عربي 0.01 · انجليزي 0.01 · ثنائي اللغة 0.02
        new("اللغة", "Language", "training-content", "trainingLanguages", 2m,
            CriterionAggregations.SingleAnswer,
            Option(("ar", "0.01"), ("en", "0.01"), ("bilingual", "0.02"))),
    ];

    /// <summary>
    /// The three classified look-up tables a model version scores #2, #7 and #8
    /// against. They are per-version for the same reason #3 is: changing what a
    /// table pays changes what the criterion pays, and a result already decided
    /// must keep the score it was decided with.
    /// </summary>
    private sealed record Lookups(
        string SpecializationRelevance,
        string CertificateRelevance,
        string CertificateSource);

    /// <summary>
    /// What `dm-gap-02.2026-09-21` and `dm-gap-02.2026-09-22` scored against —
    /// OPEN tables, where a value the table did not carry scored a silent 0.
    /// Frozen verbatim in <see cref="EvaluationLookupTablesSuperseded"/>.
    /// </summary>
    private static readonly Lookups LegacyLookups = new(
        EvaluationLookupTablesSuperseded.SpecializationRelevance,
        EvaluationLookupTablesSuperseded.CertificateRelevance,
        EvaluationLookupTablesSuperseded.CertificateSource);

    /// <summary>
    /// What `dm-gap-02.2026-09-29` scores against — the same classifications,
    /// now in CLOSED tables (`EVAL-GAP-11`). The one academic specialization
    /// whose source row carries no relevance value is OMITTED rather than
    /// written as 0, so an applicant who selected it is reported UNRESOLVED
    /// instead of being handed a zero nobody decided.
    /// </summary>
    private static readonly Lookups StrictLookups = new(
        EvaluationLookupTables.SpecializationRelevance,
        EvaluationLookupTables.CertificateRelevance,
        EvaluationLookupTables.CertificateSource);

    /// <summary>#3 as `dm-gap-02.2026-09-21` carried it — the matrix still read
    /// «مجال الخبرة العملية» and flagged it as needing a field that did not
    /// exist, so it was seeded, labelled, weighted and scoring zero.</summary>
    private static readonly Criterion UnavailableField =
        new("مجال الخبرة العملية", "Field of practical experience (relevance)",
            "experience", null, 10m, CriterionAggregations.SingleAnswer, Unavailable);

    /// <summary>
    /// #3 as `dm-gap-02.2026-09-22` carries it: a direct look-up on «المجال»,
    /// the field Section 1 has carried all along (`domain` → Form 1 #16 →
    /// `cmpt.JobFamily`, which is the source column the matrix has always
    /// named). Notion renamed the criterion to «المجال» on 2026-09-22, and the
    /// owner confirmed it: «في الخبرة العملية لا يوجد مجال للخبرة المجال فقط في
    /// APPLICATION FORM» — Practical Experience carries no field-of-experience
    /// of its own.
    ///
    /// Section 1 is NOT repeatable, so this is a single answer rather than the
    /// best-of `P-295` applies to #1, #2, #4, #7 and #8.
    /// </summary>
    private static readonly Criterion ClassifiedField =
        new("المجال", "Field / domain (relevance)",
            "personal", "domain", 10m, CriterionAggregations.SingleAnswer,
            PracticalExperienceRelevance.ScoreRule);

    /// <summary>§1.2 — Trainer, max 30% (20+5+5).</summary>
    private static readonly Criterion[] TrainerSpecific =
    [
        new("سنوات الخبرة التدريبية", "Years of training experience",
            "training-content", "trainingExperienceYears", 20m,
            CriterionAggregations.SingleAnswer,
            Option(("less-than-2", "0.05"), ("3-5", "0.1"),
                   ("6-10", "0.15"), ("more-than-10", "0.2"))),

        // حضوري 0.04 · عن بعد 0.03 · حضوري وعن بعد 0.05 — the third option was
        // added to the form on 2026-09-19 (resolves `EVAL-GAP-08`).
        new("نمط التقديم", "Preferred delivery mode", "training-content",
            "preferredDeliveryMode", 5m, CriterionAggregations.SingleAnswer,
            Option(("onsite", "0.04"), ("online", "0.03"), ("blended", "0.05"))),

        new("هل لديك مواد أو حقائب تدريبية جاهزة؟", "Ready training materials",
            "training-content", "hasReadyMaterials", 5m,
            CriterionAggregations.SingleAnswer, Option(("yes", "0.05"), ("no", "0"))),
    ];

    /// <summary>§1.3 — Consultant, max 30% (24+6).</summary>
    private static readonly Criterion[] ConsultantSpecific =
    [
        new("سنوات خبرة استشارات", "Years of consulting experience",
            "training-content", "consultingExperienceYears", 24m,
            CriterionAggregations.SingleAnswer,
            Option(("less-than-2", "0.06"), ("3-5", "0.12"),
                   ("6-10", "0.18"), ("more-than-10", "0.24"))),

        // A DISTINCT question from the trainer's ready-materials field — «not
        // shared, not reused» (resolves `EVAL-GAP-09`).
        new("هل لديك مواد أو استشارات جاهزة؟", "Ready consulting materials",
            "training-content", "readyConsultingMaterials", 6m,
            CriterionAggregations.SingleAnswer, Option(("yes", "0.06"), ("no", "0"))),
    ];

    /// <summary>
    /// §1.4 — «Content Developer &amp; Question Writer», ONE track serving both
    /// services, max 30% (24+6). Note the ready-materials question is the
    /// trainer's own field reused, but scored on a different table (0.06, not
    /// 0.05) — which is why the rule lives on the criterion, not the field.
    /// </summary>
    private static readonly Criterion[] ContentSpecific =
    [
        new("سنوات الخبرة في تطوير المحتوى أو كتابة الأسئلة",
            "Years of experience — content development / question writing",
            "training-content", "contentQuestionExperienceYears", 24m,
            CriterionAggregations.SingleAnswer,
            Option(("less-than-2", "0.06"), ("3-5", "0.12"),
                   ("6-10", "0.18"), ("more-than-10", "0.24"))),

        new("هل لديك مواد أو حقائب تدريبية جاهزة؟", "Ready training materials",
            "training-content", "hasReadyMaterials", 6m,
            CriterionAggregations.SingleAnswer, Option(("yes", "0.06"), ("no", "0"))),
    ];

    /// <summary>The four screenable services, each with its track's criteria.
    /// Speaker never reaches screening (`BR-0113`/`BR-0413`).</summary>
    private static readonly (string Service, Criterion[] Specific)[] Tracks =
    [
        (ApplicationServices.Trainer, TrainerSpecific),
        (ApplicationServices.Consultant, ConsultantSpecific),
        (ApplicationServices.ContentDeveloper, ContentSpecific),
        (ApplicationServices.QuestionWriter, ContentSpecific),
    ];

    /// <summary>
    /// All three approved versions, seeded side by side. The superseded ones
    /// are INACTIVE and their rows are never deleted: a screening result decided
    /// under one resolves through `SCREENING_RESULT.model_id`, and
    /// `ComputeScoresAsync` reads a decided service through that pin rather
    /// than through whichever model is active today.
    /// </summary>
    internal static readonly object[] Models =
    [
        .. ModelsFor(SupersededVersion, active: false, prefix: 'e'),
        .. ModelsFor(ClassifiedDomainVersion, active: false, prefix: 'f'),
        .. ModelsFor(Version, active: true, prefix: 'a'),
    ];

    internal static readonly object[] Criteria =
    [
        .. CriteriaFor(UnavailableField, LegacyLookups, prefix: 'e'),
        .. CriteriaFor(ClassifiedField, LegacyLookups, prefix: 'f'),
        .. CriteriaFor(ClassifiedField, StrictLookups, prefix: 'a'),
    ];

    private static object[] ModelsFor(string version, bool active, char prefix) =>
        [.. Tracks.Select((track, index) => (object)new
        {
            ModelId = ModelId(prefix, index + 1),
            Service = track.Service,
            Version = version,
            PassThreshold,
            IsActive = active,
        })];

    private static object[] CriteriaFor(Criterion domainRelevance, Lookups lookups, char prefix) =>
        [.. Tracks.SelectMany((track, trackIndex) =>
            Common(domainRelevance, lookups)
                .Concat(track.Specific)
                .Select((criterion, criterionIndex) => (object)new
                {
                    CriterionId = CriterionId(prefix, (trackIndex + 1) * 100 + criterionIndex + 1),
                    ModelId = ModelId(prefix, trackIndex + 1),
                    LabelAr = criterion.Ar,
                    LabelEn = criterion.En,
                    SourceSectionCode = criterion.Section,
                    Weight = criterion.Weight,
                    OrderIndex = criterionIndex + 1,
                    SourceFieldCode = criterion.Field,
                    ScoreRule = criterion.Rule,
                    Aggregation = criterion.Aggregation,
                }))];

    /// <summary>The model ids the `M34` migration deactivates (the draft).</summary>
    internal static Guid DraftModelId(int n) =>
        new($"e1000000-0000-0000-0000-{n:D12}");

    /*
      * The prefix is a frozen per-version TAG, not an ordering: `e7…`/`e8…` are
      * 2026-09-21's rows and must keep the ids `M34` inserted, `f7…`/`f8…` are
      * 2026-09-22's from `M35`. It must be a HEXADECIMAL digit — a Guid cannot
      * be parsed otherwise — so the sequence does not continue at `g`. The
      * 2026-09-29 version takes `a7…`/`a8…`.
      */
    private static Guid ModelId(char prefix, int n) =>
        new($"{prefix}7000000-0000-0000-0000-{n:D12}");

    private static Guid CriterionId(char prefix, int n) =>
        new($"{prefix}8000000-0000-0000-0000-{n:D12}");

}
