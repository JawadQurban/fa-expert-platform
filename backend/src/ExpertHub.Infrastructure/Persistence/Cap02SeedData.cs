using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// CAP-02's seeded configuration — the screening evaluation models and the
/// interview evaluation models.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ **The screening model seeded HERE is the superseded draft.** `DM-GAP-02`
/// was open when it was written, so it carries the frontend's own draft
/// version string (`mock-dm-gap-02-draft.1`) and no approved number. The
/// APPROVED matrix arrived 2026-09-21 and is seeded separately in
/// <see cref="EvaluationMatrixSeedData"/>; this one stays inactive so the
/// applications screened under it keep computing the way they were screened.
/// </para>
/// <para>
/// **The interview model is approved** — Notion «Interview Evaluation Model
/// (axes, criteria, weights)», status Finalized, served as version
/// <see cref="InterviewModelVersion"/>. The draft model it replaced
/// (<see cref="DraftInterviewModelVersion"/>) stays seeded and inactive: every
/// interview is pinned to the version it was created under
/// (<c>INTERVIEW.model_version</c>), so interviews scored on the draft keep
/// computing on the draft.
/// </para>
/// </remarks>
internal static class Cap02SeedData
{
    /// <summary>The five scored criteria — the form's sections 2–6 (J-05 matrix).</summary>
    private static readonly (string Code, string Ar, string En)[] CriterionLabels =
    [
        ("education", "المؤهلات العلمية", "Educational qualifications"),
        ("certifications", "الشهادات المهنية", "Professional certifications"),
        ("experience", "الخبرة العملية", "Practical experience"),
        ("training-content", "الخبرة التدريبية والمحتوى", "Training experience & content"),
        ("availability", "الجاهزية والإتاحة", "Availability & readiness"),
    ];

    /// <summary>Per-service draft weights (each row sums to 100) + thresholds.</summary>
    private static readonly (string Service, int Threshold, int[] Weights)[] Models =
    [
        (ApplicationServices.Trainer, 70, [20, 15, 25, 30, 10]),
        (ApplicationServices.Consultant, 75, [25, 20, 35, 10, 10]),
        (ApplicationServices.ContentDeveloper, 70, [20, 15, 25, 30, 10]),
        (ApplicationServices.QuestionWriter, 70, [25, 20, 25, 20, 10]),
    ];

    /// <summary>The draft axes (`mock-dm-gap-03-draft.1`) — kept for the
    /// interviews created under them.</summary>
    private static readonly (string Code, string Ar, string En, string DescAr, string DescEn, int Weight)[] DraftAxes =
    [
        ("subject-mastery", "التمكن من المادة العلمية", "Subject-matter mastery",
            "عمق المعرفة بالمجال ودقة الإجابة عن الأسئلة التخصصية.",
            "Depth of domain knowledge and accuracy on specialist questions.", 30),
        ("delivery-skills", "مهارات العرض والتقديم", "Presentation & delivery skills",
            "وضوح الطرح، إدارة الوقت، والتفاعل مع الحضور.",
            "Clarity, time management, and audience engagement.", 25),
        ("practical-experience", "الخبرة التطبيقية", "Applied experience",
            "القدرة على ربط المحتوى بحالات عملية من السوق.",
            "Ability to connect content to real market cases.", 25),
        ("professional-conduct", "السلوك المهني", "Professional conduct",
            "الالتزام، والتواصل، والاستعداد للمقابلة.",
            "Commitment, communication, and interview readiness.", 20),
    ];

    /// <summary>
    /// The approved interview criteria, in the matrix's order, with its weights
    /// (Σ = 100.0). Labels are the Notion model page's own wording.
    /// </summary>
    private static readonly (string Code, string Ar, string En, decimal Weight)[] ApprovedAxes =
    [
        ("training-skills", "مهارات التدريب", "Training Skills", 33.3m),
        ("communication-skills", "مهارات الإتصال / التواصل", "Communication Skills", 16.7m),
        ("training-camps-willingness", "الإستعداد لحضور المعسكرات التدريبية",
            "Willingness to Attend Training Camps", 16.7m),
        ("energy-levels", "مستويات الطاقة", "Energy Levels", 6.7m),
        ("emotional-intelligence", "التعامل مع الذكاء العاطفي", "Emotional Intelligence", 6.7m),
        ("client-needs-flexibility", "المرونة والإستعداد للتكيف مع إحتياجات العميل",
            "Flexibility & Adaptability to Client Needs", 6.7m),
        ("community-giving-back", "الميل لرد الجميل للمجتمع / رؤية 2030",
            "Giving Back to Community / Vision 2030", 3.3m),
        ("organizational-values", "التوافق مع القيم التنظيمية",
            "Alignment with Organizational Values", 3.3m),
        ("cultural-sensitivity", "الحساسية الثقافية", "Cultural Sensitivity", 3.3m),
        ("thinking-comprehension", "القدرة على التفكير والإستيعاب",
            "Thinking & Comprehension Ability", 3.3m),
    ];

    /// <summary>The approved 1–5 rating scale, the model page's own wording per language.</summary>
    private const string ApprovedRatingScale =
        "[{\"score\":1,\"labelAr\":\"لا يظهر السلوك/المهارة إطلاقًا — قصور واضح\",\"labelEn\":\"Very Poor\"},"
        + "{\"score\":2,\"labelAr\":\"أداء ضعيف — أقل من الحد الأدنى المطلوب\",\"labelEn\":\"Poor\"},"
        + "{\"score\":3,\"labelAr\":\"أداء مقبول — يفي بالحد الأدنى المطلوب\",\"labelEn\":\"Acceptable\"},"
        + "{\"score\":4,\"labelAr\":\"أداء جيد — يتجاوز المتوقع في معظم الجوانب\",\"labelEn\":\"Good\"},"
        + "{\"score\":5,\"labelAr\":\"أداء ممتاز — نموذجي، لا يحتاج تطوير\",\"labelEn\":\"Excellent\"}]";

    internal const string EvaluationModelVersion = "mock-dm-gap-02-draft.1";

    /// <summary>The draft interview model, superseded but kept (see remarks).</summary>
    internal const string DraftInterviewModelVersion = "mock-dm-gap-03-draft.1";

    /// <summary>The approved interview model (Notion, Finalized 2026-09-02).</summary>
    internal const string InterviewModelVersion = "dm-gap-03.2026-09-02";

    internal static readonly object[] EvaluationModels = BuildEvaluationModels();

    internal static readonly object[] EvaluationCriteria = BuildEvaluationCriteria();

    internal static readonly object[] InterviewModels = [.. BuildDraftInterviewModels(), .. BuildApprovedInterviewModels()];

    internal static readonly object[] InterviewAxes = [.. BuildDraftInterviewAxes(), .. BuildApprovedInterviewAxes()];

    private static object[] BuildEvaluationModels() =>
        [.. Models.Select((model, index) => (object)new
        {
            ModelId = StableId("e1", index + 1),
            Service = model.Service,
            Version = EvaluationModelVersion,
            PassThreshold = (decimal)model.Threshold,
            // Superseded by the approved matrix (`EvaluationMatrixSeedData`,
            // `M34`) and kept INACTIVE, never deleted: every application
            // screened under it is pinned to it through
            // `SCREENING_RESULT.model_id`, so it must still resolve.
            IsActive = false,
        })];

    private static object[] BuildEvaluationCriteria() =>
        [.. Models.SelectMany((model, modelIndex) =>
            CriterionLabels.Select((criterion, criterionIndex) => (object)new
            {
                CriterionId = StableId("e2", (modelIndex + 1) * 10 + criterionIndex + 1),
                ModelId = StableId("e1", modelIndex + 1),
                LabelAr = criterion.Ar,
                LabelEn = criterion.En,
                SourceSectionCode = criterion.Code,
                Weight = (decimal)model.Weights[criterionIndex],
                OrderIndex = criterionIndex + 1,
            }))];

    private static object[] BuildDraftInterviewModels() =>
        [.. Models.Select((model, index) => (object)new
        {
            InterviewModelId = StableId("e3", index + 1),
            Service = model.Service,
            Version = DraftInterviewModelVersion,
            IsActive = false,
            ResultMaxScore = 5m,
            PassThreshold = (decimal?)null,
            RatingScale = (string?)null,
        })];

    private static object[] BuildDraftInterviewAxes() =>
        [.. Models.SelectMany((model, modelIndex) =>
            DraftAxes.Select((axis, axisIndex) => (object)new
            {
                AxisId = StableId("e4", (modelIndex + 1) * 10 + axisIndex + 1),
                InterviewModelId = StableId("e3", modelIndex + 1),
                AxisCode = axis.Code,
                LabelAr = axis.Ar,
                LabelEn = axis.En,
                DescriptionAr = (string?)axis.DescAr,
                DescriptionEn = (string?)axis.DescEn,
                Weight = (decimal)axis.Weight,
                MaxScore = 5m,
                OrderIndex = axisIndex + 1,
            }))];

    /// <summary>One approved model per service — the matrix is scored per
    /// accepted service with the same criteria (J-07/F1/AC-2).</summary>
    private static object[] BuildApprovedInterviewModels() =>
        [.. Models.Select((model, index) => (object)new
        {
            InterviewModelId = StableId("e5", index + 1),
            Service = model.Service,
            Version = InterviewModelVersion,
            IsActive = true,
            ResultMaxScore = 100m,
            PassThreshold = (decimal?)70m,
            RatingScale = (string?)ApprovedRatingScale,
        })];

    private static object[] BuildApprovedInterviewAxes() =>
        [.. Models.SelectMany((model, modelIndex) =>
            ApprovedAxes.Select((axis, axisIndex) => (object)new
            {
                AxisId = StableId("e6", (modelIndex + 1) * 100 + axisIndex + 1),
                InterviewModelId = StableId("e5", modelIndex + 1),
                AxisCode = axis.Code,
                LabelAr = axis.Ar,
                LabelEn = axis.En,
                DescriptionAr = (string?)null,
                DescriptionEn = (string?)null,
                Weight = axis.Weight,
                MaxScore = 5m,
                OrderIndex = axisIndex + 1,
            }))];

    private static Guid StableId(string prefix, int n) =>
        new($"{prefix}000000-0000-0000-0000-{n:D12}");
}
