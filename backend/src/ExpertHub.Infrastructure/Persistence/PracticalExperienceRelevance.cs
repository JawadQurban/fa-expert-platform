namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// Criterion #3 «المجال» — the option→percentage-point table.
/// </summary>
/// <remarks>
/// ⚠️ GENERATED — do not edit by hand. Produced by
/// `tools/data/practical-experience-relevance.py extract` from
/// `docs/inputs/practical-experience-relevance.xlsx`, the business's own
/// classification. The keys are the approved 147-value «مجال التخصص» list the
/// application form's «المجال» field already offers, so the value a person
/// picks and the table it is scored against come from one master list.
///
/// The matrix's table: «مجال ليس له صلة 0 · مجال ذو صلة 0.1», max 10%. The
/// classification is COMMON — one answer serves all four services (approved
/// policy, 2026-09-28).
///
/// <b>134 RELATED · 0 NOT_RELATED · 13 omitted.</b>
///
/// The 13 omitted values are not professional domains at all —
/// tools, certifications, methodologies, programmes, service types, a
/// catch-all. They are NOT recorded as «not related», because that would state
/// a relevance decision nobody made. They are left OUT of the table, and the
/// rule is `strict`, so an applicant who picked one is reported UNRESOLVED and
/// the master-data problem stays diagnosable. All 147 codes are preserved in
/// the form's own list for historical compatibility.
/// </remarks>
internal static class PracticalExperienceRelevance
{
    /// <summary>Every approved value carries a business classification.</summary>
    internal const bool IsComplete = true;

    /// <summary>Values the business has ruled on, and that can therefore score.</summary>
    internal const int ClassifiedCount = 134;

    /// <summary>Values that are not domains, and so resolve to nothing.</summary>
    internal const int MasterDataReviewCount = 13;

    internal const string ScoreRule =
        "{\"kind\":\"option\",\"strict\":true,\"points\":{"
        + "\"dom-001\":0.1,\"dom-002\":0.1,\"dom-003\":0.1,\"dom-004\":0.1,\"dom-005\":0.1,\"dom-006\":0.1,"
        + "\"dom-007\":0.1,\"dom-008\":0.1,\"dom-009\":0.1,\"dom-010\":0.1,\"dom-012\":0.1,\"dom-013\":0.1,"
        + "\"dom-014\":0.1,\"dom-015\":0.1,\"dom-017\":0.1,\"dom-018\":0.1,\"dom-019\":0.1,\"dom-020\":0.1,"
        + "\"dom-021\":0.1,\"dom-022\":0.1,\"dom-023\":0.1,\"dom-024\":0.1,\"dom-025\":0.1,\"dom-026\":0.1,"
        + "\"dom-027\":0.1,\"dom-028\":0.1,\"dom-030\":0.1,\"dom-031\":0.1,\"dom-033\":0.1,\"dom-034\":0.1,"
        + "\"dom-036\":0.1,\"dom-038\":0.1,\"dom-040\":0.1,\"dom-041\":0.1,\"dom-043\":0.1,\"dom-044\":0.1,"
        + "\"dom-045\":0.1,\"dom-046\":0.1,\"dom-047\":0.1,\"dom-048\":0.1,\"dom-049\":0.1,\"dom-050\":0.1,"
        + "\"dom-051\":0.1,\"dom-052\":0.1,\"dom-053\":0.1,\"dom-054\":0.1,\"dom-055\":0.1,\"dom-056\":0.1,"
        + "\"dom-057\":0.1,\"dom-058\":0.1,\"dom-059\":0.1,\"dom-060\":0.1,\"dom-061\":0.1,\"dom-062\":0.1,"
        + "\"dom-063\":0.1,\"dom-064\":0.1,\"dom-065\":0.1,\"dom-066\":0.1,\"dom-067\":0.1,\"dom-068\":0.1,"
        + "\"dom-069\":0.1,\"dom-070\":0.1,\"dom-071\":0.1,\"dom-072\":0.1,\"dom-073\":0.1,\"dom-074\":0.1,"
        + "\"dom-077\":0.1,\"dom-078\":0.1,\"dom-079\":0.1,\"dom-080\":0.1,\"dom-081\":0.1,\"dom-082\":0.1,"
        + "\"dom-083\":0.1,\"dom-084\":0.1,\"dom-085\":0.1,\"dom-086\":0.1,\"dom-087\":0.1,\"dom-088\":0.1,"
        + "\"dom-089\":0.1,\"dom-090\":0.1,\"dom-091\":0.1,\"dom-092\":0.1,\"dom-093\":0.1,\"dom-094\":0.1,"
        + "\"dom-095\":0.1,\"dom-097\":0.1,\"dom-098\":0.1,\"dom-099\":0.1,\"dom-100\":0.1,\"dom-101\":0.1,"
        + "\"dom-102\":0.1,\"dom-103\":0.1,\"dom-104\":0.1,\"dom-105\":0.1,\"dom-106\":0.1,\"dom-107\":0.1,"
        + "\"dom-108\":0.1,\"dom-109\":0.1,\"dom-110\":0.1,\"dom-111\":0.1,\"dom-112\":0.1,\"dom-113\":0.1,"
        + "\"dom-114\":0.1,\"dom-115\":0.1,\"dom-116\":0.1,\"dom-117\":0.1,\"dom-118\":0.1,\"dom-119\":0.1,"
        + "\"dom-120\":0.1,\"dom-121\":0.1,\"dom-123\":0.1,\"dom-124\":0.1,\"dom-125\":0.1,\"dom-126\":0.1,"
        + "\"dom-127\":0.1,\"dom-128\":0.1,\"dom-129\":0.1,\"dom-130\":0.1,\"dom-131\":0.1,\"dom-132\":0.1,"
        + "\"dom-133\":0.1,\"dom-134\":0.1,\"dom-135\":0.1,\"dom-136\":0.1,\"dom-137\":0.1,\"dom-138\":0.1,"
        + "\"dom-140\":0.1,\"dom-141\":0.1,\"dom-142\":0.1,\"dom-143\":0.1,\"dom-144\":0.1,\"dom-145\":0.1,"
        + "\"dom-146\":0.1,\"dom-147\":0.1"
        + "}}";
}
