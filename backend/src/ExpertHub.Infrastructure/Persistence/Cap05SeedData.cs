namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// CAP-05's seeded configuration — the DRAFT matching model.
/// </summary>
/// <remarks>
/// ⚠️ **`DM-GAP-05` is open**: neither the weights nor the tie-break rule is
/// approved. What `BR-0203`'s pattern demands is that the model be DATA — a
/// System Administrator changes a weight without a deployment — so the model
/// is a row and the engine reads it. The weights below split evenly across
/// the three weighted criteria precisely because no approved distribution
/// exists: an even split claims nothing about their relative importance,
/// where any other number would. The version string says so.
///
/// The tie-break note is NULL, not a sentence: J-17 leaves it unapproved,
/// and authoring one here would put words in the Academy's mouth.
/// </remarks>
internal static class Cap05SeedData
{
    internal const string MatchingModelVersion = "mock-dm-gap-05-draft.1";

    internal static readonly Guid MatchingModelId =
        new("c5000000-0000-0000-0000-000000000001");

    internal static readonly object[] MatchingModels =
    [
        new
        {
            MatchingModelId,
            Version = MatchingModelVersion,
            // The weighted rows of J-17's matrix, evenly weighted — see the
            // remarks: an even split is the only honest placeholder. The
            // owner's ruling (UAT `BUG-038`) moved specialization and location
            // from exclusionary to weighted; they join at the same weight and
            // the three original weights are kept as they were. A consultant's
            // scheduling conflict became the weighted `availability` row
            // (ruling 2026-10-20), at the same weight.
            Weights = """{"specialization":33,"location":33,"language":34,"delivery-mode":33,"evaluation":33,"availability":33}""",
            TieBreakNoteAr = (string?)null,
            TieBreakNoteEn = (string?)null,
            IsActive = true,
        },
    ];
}
