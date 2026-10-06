using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// The CAP-12 registry, seeded by migration: the six systems of `08` §4.1
/// (BRD §8.12) and the shared-entity mastership register of `08` §1.1.1 as
/// `DATA_ELEMENT` rows (`P-129` — mastership is data, not code).
/// </summary>
/// <remarks>
/// <para>
/// Only what CROSSES is registered. Entities the register marks "not shared"
/// (agreements, evaluation models and results, AI analysis, roles) have no
/// row on purpose: no registration, no crossing — the enforcement is the
/// absence, exactly like `BR-1202`'s absent write path.
/// </para>
/// <para>
/// `importance` and `benefiting_capabilities` are editorial readings of `08`
/// §4.1's failure-behaviour column and the capability each trigger serves —
/// the BRD names the systems but not these two gradings. They are display
/// metadata, enforce nothing, and are editable data (`BR-0103`) if the owner
/// grades them differently.
/// </para>
/// <para>
/// Stable ids on purpose, like every seed: element ids never renumber. The
/// `de…` GUID prefix is synthetic and meaningless beyond being stable.
/// </para>
/// </remarks>
internal static class IntegrationSeedData
{
    internal static readonly object[] Systems =
    [
        new
        {
            SystemCode = IntegrationSystems.AcademyIdentity,
            NameAr = "هوية الأكاديمية (الدخول الموحد)",
            NameEn = "Academy identity (SSO)",
            Direction = IntegrationDirections.Bidirectional,
            BenefitingCapabilities = """["CAP-08","CAP-09"]""",
            Importance = "critical",
            IsActive = true,
        },
        new
        {
            SystemCode = IntegrationSystems.Mtm,
            NameAr = "نظام تقييمات المتدربين (MTM)",
            NameEn = "MTM trainee-evaluation system",
            Direction = IntegrationDirections.Inbound,
            BenefitingCapabilities = """["CAP-04","CAP-02"]""",
            Importance = "high",
            IsActive = true,
        },
        new
        {
            SystemCode = IntegrationSystems.Erp,
            NameAr = "نظام تخطيط الموارد (ERP)",
            NameEn = "ERP",
            Direction = IntegrationDirections.Inbound,
            BenefitingCapabilities = """["CAP-06"]""",
            Importance = "high",
            IsActive = true,
        },
        new
        {
            SystemCode = IntegrationSystems.EmailGateway,
            NameAr = "بوابة البريد الإلكتروني",
            NameEn = "Email gateway",
            Direction = IntegrationDirections.Outbound,
            BenefitingCapabilities = """["CAP-07"]""",
            Importance = "high",
            IsActive = true,
        },
        new
        {
            SystemCode = IntegrationSystems.Fast,
            NameAr = "نظام فاست (إدارة التدريب)",
            NameEn = "FAST training management",
            Direction = IntegrationDirections.Bidirectional,
            BenefitingCapabilities = """["CAP-03","CAP-05","CAP-04"]""",
            Importance = "critical",
            IsActive = true,
        },
        new
        {
            SystemCode = IntegrationSystems.AiProvider,
            NameAr = "مزوّد الذكاء الاصطناعي",
            NameEn = "AI provider",
            Direction = IntegrationDirections.Bidirectional,
            BenefitingCapabilities = """["CAP-01"]""",
            Importance = "medium",
            IsActive = true,
        },
    ];

    /*
     * `08` §1.1.1, row by row. Directions are Expert Hub's viewpoint:
     * inbound = the remote side masters it and we hold the replica,
     * outbound = we master it and publish it (`08` §4.2 rule 1 — this
     * outbound set is exactly the small explicit list: accredited trainer
     * records, PlanTrainer.TrainerId, approved training material, plus the
     * two request/response crossings INT-04 and INT-06 carry).
     */
    internal static readonly object[] Elements =
    [
        Element(1, IntegrationSystems.Fast, "trainer_profile_base", OwningSystems.Fast, "TRAINER", IntegrationDirections.Inbound),
        Element(2, IntegrationSystems.Fast, "trainer_accreditation", OwningSystems.ExpertHub, "TRAINER", IntegrationDirections.Outbound),
        Element(3, IntegrationSystems.Fast, "engagement", OwningSystems.ExpertHub, "PlanTrainer", IntegrationDirections.Outbound),
        Element(4, IntegrationSystems.Fast, "approved_training_material", OwningSystems.ExpertHub, "TrainingMaterial", IntegrationDirections.Outbound),
        Element(5, IntegrationSystems.Fast, "programme_plan", OwningSystems.Fast, "Plan", IntegrationDirections.Inbound),
        Element(6, IntegrationSystems.Fast, "enrolment_attendance", OwningSystems.Fast, "PlanTaker", IntegrationDirections.Inbound),
        Element(7, IntegrationSystems.Mtm, "trainee_evaluation", OwningSystems.Mtm, "SurveyResponse", IntegrationDirections.Inbound),
        Element(8, IntegrationSystems.Erp, "entitlement", OwningSystems.Erp, "PurchaseOrder", IntegrationDirections.Inbound),
        Element(9, IntegrationSystems.AcademyIdentity, "user_identity", OwningSystems.AcademyIdentity, "APP_USER", IntegrationDirections.Inbound),
        Element(10, IntegrationSystems.EmailGateway, "notification_message", OwningSystems.ExpertHub, "NOTIFICATION_LOG", IntegrationDirections.Outbound),
        Element(11, IntegrationSystems.AiProvider, "screening_analysis", OwningSystems.ExpertHub, "AI_ANALYSIS", IntegrationDirections.Outbound),
        // P-331 — the CV text goes out, a bio draft comes back. The one INT-06
        // crossing allowed to read an attachment, and only for this.
        Element(12, IntegrationSystems.AiProvider, "trainer_bio_draft", OwningSystems.ExpertHub, "TRAINER_BIO", IntegrationDirections.Outbound),
    ];

    private static object Element(
        int stableId,
        string systemCode,
        string elementName,
        string owningSystem,
        string entityName,
        string direction) => new
        {
            ElementId = new Guid($"de000000-0000-0000-0000-{stableId:D12}"),
            SystemCode = systemCode,
            ElementName = elementName,
            OwningSystem = owningSystem,
            EntityName = entityName,
            Direction = direction,
        };
}
