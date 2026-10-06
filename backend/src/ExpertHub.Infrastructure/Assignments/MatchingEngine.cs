using System.Text.Json;
using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Assignments;

/// <summary>What the request asks for, as the engine reads it.</summary>
public sealed record MatchingContext(
    string ServiceType,
    string? SpecializationDomain,
    string? Language,
    string? DeliveryMechanism,
    string? City,
    DateTime? StartsAt,
    DateTime? EndsAt);

/// <summary>One trainer, as the engine sees them.</summary>
public sealed record MatchingCandidateInput(
    Guid TrainerId,
    string Name,
    string FileStatus,
    IReadOnlyList<string> AccreditedServices,
    string? SpecializationDomain,
    string? City,
    IReadOnlyList<string> Languages,
    IReadOnlyList<string> DeliveryModes,
    decimal? EvaluationOverall,
    IReadOnlyList<(DateTime From, DateTime To)> ConfirmedEngagements);

/// <summary>One weighted criterion's contribution — the breakdown behind a rank.</summary>
public sealed record CriterionScore(string Criterion, decimal RawScore, decimal Weight, decimal Weighted);

/// <summary>A ranked candidate.</summary>
public sealed record RankedCandidate(
    Guid TrainerId, IReadOnlyList<CriterionScore> Scores, decimal TotalScore);

/// <summary>A candidate the matrix ruled out, and why.</summary>
public sealed record ExcludedCandidate(Guid TrainerId, IReadOnlyList<string> Reasons);

public sealed record MatchingResult(
    IReadOnlyList<RankedCandidate> Ranked, IReadOnlyList<ExcludedCandidate> Excluded);

/// <summary>
/// J-17's Matching Matrix: four EXCLUSIONARY rows and three WEIGHTED ones.
/// </summary>
/// <remarks>
/// <para>
/// <b>The separation is the design.</b> F1/AC-3 says no weighted criterion
/// excludes anyone on its own, so the weighted half of this engine can only
/// ever produce a NUMBER — <see cref="CriterionScore"/> has no way to say
/// "excluded" — and the exclusionary half produces only REASONS, never a
/// penalty. Neither can do the other's job, so the rule cannot be violated by
/// a later edit that "just adds a big negative weight".
/// </para>
/// <para>
/// The exclusions apply on BOTH paths — engine and manual search (F3/AC-3) —
/// which is why <see cref="Match"/> is the only way in and the manual search
/// runs through it too.
/// </para>
/// <para>
/// ⚠️ `DM-GAP-05` — the weights arrive from the model row, never from here.
/// ⚠️ `Q16` — the domain has no taxonomy, so the specialization row compares
/// the request's free text against the trainer's, case-insensitively, and
/// treats an ABSENT value on either side as "not a reason to exclude": a
/// missing taxonomy must not silently rule everyone out.
/// </para>
/// </remarks>
public static class MatchingEngine
{
    public static MatchingResult Match(
        MatchingContext request,
        IReadOnlyList<MatchingCandidateInput> candidates,
        IReadOnlyDictionary<string, decimal> weights)
    {
        var ranked = new List<RankedCandidate>();
        var excluded = new List<ExcludedCandidate>();

        foreach (var candidate in candidates)
        {
            var reasons = Exclusions(request, candidate);
            if (reasons.Count > 0)
            {
                excluded.Add(new ExcludedCandidate(candidate.TrainerId, reasons));
                continue;
            }
            var scores = Weighted(request, candidate, weights);
            ranked.Add(new RankedCandidate(
                candidate.TrainerId,
                scores,
                Math.Round(scores.Sum(s => s.Weighted), 3)));
        }

        // Highest first. ⚠️ `DM-GAP-05` leaves the tie-break rule unapproved,
        // so ties fall back to a STABLE order (the trainer id) rather than an
        // invented rule — deterministic, and visibly arbitrary rather than
        // pretending to be a judgement.
        return new MatchingResult(
            [.. ranked.OrderByDescending(r => r.TotalScore).ThenBy(r => r.TrainerId)],
            excluded);
    }

    /// <summary>The four exclusionary rows. Each is a REASON, never a score.</summary>
    private static List<string> Exclusions(
        MatchingContext request, MatchingCandidateInput candidate)
    {
        var reasons = new List<string>();

        // Row 1 — specialization/domain, against the request's own field.
        if (!string.IsNullOrWhiteSpace(request.SpecializationDomain)
            && !string.IsNullOrWhiteSpace(candidate.SpecializationDomain)
            && !string.Equals(
                request.SpecializationDomain.Trim(),
                candidate.SpecializationDomain.Trim(),
                StringComparison.OrdinalIgnoreCase))
        {
            reasons.Add(MatchExclusionReasons.Specialization);
        }

        // Row 2 — location, UNLESS the delivery is online, in which case the
        // row does not apply at all (J-17/F1/AC-2).
        var isOnline = IsOnline(request.DeliveryMechanism);
        if (!isOnline
            && !string.IsNullOrWhiteSpace(request.City)
            && !string.IsNullOrWhiteSpace(candidate.City)
            && !string.Equals(request.City.Trim(), candidate.City.Trim(),
                StringComparison.OrdinalIgnoreCase))
        {
            reasons.Add(MatchExclusionReasons.Location);
        }

        // Row 3 — a confirmed engagement overlapping the request's dates.
        if (request.StartsAt is { } from && request.EndsAt is { } to
            && candidate.ConfirmedEngagements.Any(e => e.From <= to && from <= e.To))
        {
            reasons.Add(MatchExclusionReasons.ScheduleConflict);
        }

        // Row 4 — the file status must be active. This is the internal-only
        // status of `BR-0408`, used here as J-15 makes it visible internally.
        // J-13's `idle` is an active agreement with no recent engagement, «for
        // monitoring purposes only, with no effect on matching eligibility» —
        // so it is eligible exactly as `active` is.
        if (candidate.FileStatus is not (TrainerFileStatuses.Active or TrainerFileStatuses.Idle))
        {
            reasons.Add(MatchExclusionReasons.FileStatus);
        }

        // Not a matrix row, but the same kind of fact: a trainer who is not
        // accredited for the requested service is not a candidate for it.
        if (!candidate.AccreditedServices.Contains(request.ServiceType))
        {
            reasons.Add(MatchExclusionReasons.Specialization);
        }

        return [.. reasons.Distinct()];
    }

    /// <summary>The three weighted rows. Each yields 0–1, then the model's weight.</summary>
    private static List<CriterionScore> Weighted(
        MatchingContext request,
        MatchingCandidateInput candidate,
        IReadOnlyDictionary<string, decimal> weights)
    {
        decimal Weight(string criterion) =>
            weights.TryGetValue(criterion, out var value) ? value : 0m;

        var languageRaw = string.IsNullOrWhiteSpace(request.Language)
            ? 0m
            : candidate.Languages.Any(l => string.Equals(
                l, request.Language.Trim(), StringComparison.OrdinalIgnoreCase)) ? 1m : 0m;

        var modeRaw = string.IsNullOrWhiteSpace(request.DeliveryMechanism)
            ? 0m
            : candidate.DeliveryModes.Any(m => string.Equals(
                m, request.DeliveryMechanism.Trim(), StringComparison.OrdinalIgnoreCase)) ? 1m : 0m;

        // ⚠️ No calculated rating exists yet (`02D`/`DM-GAP-14`), so an
        // unrated trainer scores 0 on this row rather than being penalised or
        // excluded — the row is weighted, and a weighted row cannot exclude.
        var evaluationRaw = candidate.EvaluationOverall is { } rating
            ? Math.Clamp(rating / 5m, 0m, 1m)
            : 0m;

        return
        [
            Line(WeightedCriteria.Language, languageRaw),
            Line(WeightedCriteria.DeliveryMode, modeRaw),
            Line(WeightedCriteria.Evaluation, evaluationRaw),
        ];

        CriterionScore Line(string criterion, decimal raw)
        {
            var weight = Weight(criterion);
            return new CriterionScore(
                criterion, raw, weight, Math.Round(raw * weight, 3));
        }
    }

    private static bool IsOnline(string? deliveryMechanism) =>
        deliveryMechanism is not null
        && (deliveryMechanism.Contains("online", StringComparison.OrdinalIgnoreCase)
            || deliveryMechanism.Contains("عن بعد", StringComparison.Ordinal)
            || deliveryMechanism.Contains("افتراضي", StringComparison.Ordinal));

    /// <summary>The model's weights, as the engine wants them.</summary>
    public static IReadOnlyDictionary<string, decimal> ParseWeights(string weightsJson) =>
        JsonSerializer.Deserialize<Dictionary<string, decimal>>(weightsJson)
        ?? new Dictionary<string, decimal>();
}
