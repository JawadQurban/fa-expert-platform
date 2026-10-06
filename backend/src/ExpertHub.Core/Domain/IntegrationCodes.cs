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

    public static readonly IReadOnlyList<string> All = [Countries];
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
