namespace ExpertHub.Core.Domain;

/*
 * The closed vocabularies of CAP-12 (`10` §3.12), one source each — the same
 * rule as `RoleCodes`: the database CHECK-like invariants, the seed data and
 * the API's JSON all spell these identically because they all read them here.
 */

/// <summary>The six registered systems — `08` §4.1, BRD §8.12.</summary>
public static class IntegrationSystems
{
    /// <summary>INT-01 — Academy identity (the FAST STS).</summary>
    public const string AcademyIdentity = "INT-01";

    /// <summary>INT-02 — MTM survey data, hosted in the IMS estate (`P-13`).</summary>
    public const string Mtm = "INT-02";

    /// <summary>INT-03 — ERP entitlements.</summary>
    public const string Erp = "INT-03";

    /// <summary>INT-04 — the email gateway.</summary>
    public const string EmailGateway = "INT-04";

    /// <summary>INT-05 — FAST, both halves (`08` §4.1 05a/05b are one system).</summary>
    public const string Fast = "INT-05";

    /// <summary>INT-06 — the AI provider (`Q28` gates go-live).</summary>
    public const string AiProvider = "INT-06";
}

/// <summary>
/// The reference lists FAST masters and Expert Hub keeps a synchronized copy
/// of (`REFERENCE_LIST` rows, never editable here). A list joins this set only
/// once its FAST contract is documented — a guessed request body is not a
/// contract.
/// </summary>
public static class FastReferenceLists
{
    /// <summary>`Lookup/GetCountries` — countries and nationalities, both languages in one call.</summary>
    public const string Countries = "fast-country";

    /* B-15 — the FAST Training API's lookups (`LookupItemDto`, documented). */
    public const string Sectors = "fast-sector";
    public const string JobFamilies = "fast-job-family";
    public const string Topics = "fast-topic";
    public const string TraineeLevels = "fast-trainee-level";
    public const string CancellationReasons = "fast-cancellation-reason";
    public const string PlanStatuses = "fast-plan-status";
    public const string DeliveryModes = "fast-delivery-mode";
    public const string VenueScopes = "fast-venue-scope";
    public const string TrainingMaterialStatuses = "fast-training-material-status";
    public const string Languages = "fast-language";
    public const string ProgramTypes = "fast-program-type";
    public const string FoodServicePeriods = "fast-food-service-period";
    public const string ProgramSkillTypes = "fast-program-skill-type";
    public const string TargetGenders = "fast-target-gender";

    /// <summary>The Training API lists, with their `REFERENCE_LIST` names (M49).</summary>
    public static readonly IReadOnlyList<(string Code, string NameAr, string NameEn)> TrainingLists =
    [
        (Sectors, "القطاعات والقطاعات الفرعية (FAST)", "Sectors and sub-sectors (FAST)"),
        (JobFamilies, "العائلات الوظيفية (FAST)", "Job families (FAST)"),
        (Topics, "موضوعات البرامج (FAST)", "Programme topics (FAST)"),
        (TraineeLevels, "مستويات المتدربين (FAST)", "Trainee levels (FAST)"),
        (CancellationReasons, "أسباب إلغاء الخطط (FAST)", "Plan cancellation reasons (FAST)"),
        (PlanStatuses, "حالات الخطط (FAST)", "Plan statuses (FAST)"),
        (DeliveryModes, "آليات التنفيذ (FAST)", "Delivery modes (FAST)"),
        (VenueScopes, "نطاقات مكان التنفيذ (FAST)", "Venue scopes (FAST)"),
        (TrainingMaterialStatuses, "حالات المادة التدريبية (FAST)", "Training material statuses (FAST)"),
        (Languages, "لغات التدريب (FAST)", "Training languages (FAST)"),
        (ProgramTypes, "أنواع البرامج (FAST)", "Programme types (FAST)"),
        (FoodServicePeriods, "فترات الضيافة (FAST)", "Food service periods (FAST)"),
        (ProgramSkillTypes, "أنواع مهارات البرامج (FAST)", "Programme skill types (FAST)"),
        (TargetGenders, "الفئات المستهدفة حسب الجنس (FAST)", "Target genders (FAST)"),
    ];

    public static readonly IReadOnlyList<string> All =
        [Countries, .. TrainingLists.Select(list => list.Code)];
}

/// <summary>Who masters a data element (`BR-1201`, `08` §1.1.1).</summary>
public static class OwningSystems
{
    public const string ExpertHub = "expert_hub";
    public const string Fast = "fast";
    public const string Mtm = "mtm";
    public const string Erp = "erp";
    public const string AcademyIdentity = "academy_identity";
}

/// <summary>A crossing's direction, from Expert Hub's viewpoint.</summary>
public static class IntegrationDirections
{
    public const string Inbound = "inbound";
    public const string Outbound = "outbound";
    public const string Bidirectional = "bidirectional";
}

/// <summary>`REPLICATION_STATE.master_side` (`P-129`).</summary>
public static class MasterSides
{
    public const string ExpertHub = "expert_hub";
    public const string Remote = "remote";
}

/// <summary>`REPLICATION_STATE.drift_status` (`10` §3.12).</summary>
public static class DriftStatuses
{
    public const string InSync = "in_sync";
    public const string Pending = "pending";
    public const string Drifted = "drifted";
}

/// <summary>`OUTBOX_MESSAGE.status` — pending until the remote side accepted it (`P-135`).</summary>
public static class OutboxStatuses
{
    public const string Pending = "pending";
    public const string Published = "published";
}

/// <summary>`INTEGRATION_LOG.outcome` (`BR-1204`).</summary>
public static class IntegrationOutcomes
{
    public const string Success = "success";
    public const string Failure = "failure";
}
