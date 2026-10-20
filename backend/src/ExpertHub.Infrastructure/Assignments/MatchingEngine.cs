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
/// J-17's Matching Matrix: TWO exclusionary rows and six weighted ones.
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
/// Owner ruling (Notion J-17, UAT `BUG-038`/`RUN-011`): «المعايير الاقصائية ٢
/// فقط: تعارض الارتباط، ملف المدرب غير مفعل». Specialization and location were
/// exclusionary until then; they are WEIGHTED now — a mismatch lowers the score
/// and never removes anyone, on the engine, the manual search and the
/// named-nominee path alike (all three run through <see cref="Match"/>).
/// </para>
/// <para>
/// Owner ruling (chat, 2026-10-20): a CONSULTANT's scheduling conflict lowers
/// their score instead of excluding them — the `availability` row. For every
/// other service an overlapping engagement is still exclusionary.
/// </para>
/// <para>
/// Who is a candidate at all is not a matrix row: the matrix applies WITHIN a
/// service category («applies across (Trainer, Content Developer, Question
/// Writer)»), so a trainer not accredited for the requested service is not in
/// the pool — neither ranked nor listed as excluded.
/// </para>
/// <para>
/// ⚠️ `DM-GAP-05` — the weights arrive from the model row, never from here.
/// ⚠️ `Q16` — the domain has no taxonomy, so specialization and city compare
/// normalised text (<see cref="MatchText"/>): letter forms, case and — for the
/// cities it knows — the language a city was written in do not matter.
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

        foreach (var candidate in candidates.Where(c => IsInCategory(request, c)))
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

    /// <summary>Accredited for the requested service — who the pool is, not a row.</summary>
    public static bool IsInCategory(MatchingContext request, MatchingCandidateInput candidate) =>
        candidate.AccreditedServices.Contains(request.ServiceType);

    /// <summary>The two exclusionary rows. Each is a REASON, never a score.</summary>
    private static List<string> Exclusions(
        MatchingContext request, MatchingCandidateInput candidate)
    {
        var reasons = new List<string>();

        // A confirmed engagement overlapping the request's dates — weighted,
        // not exclusionary, when a consultant is requested (ruling 2026-10-20).
        if (HasConflict(request, candidate)
            && request.ServiceType != ApplicationServices.Consultant)
        {
            reasons.Add(MatchExclusionReasons.ScheduleConflict);
        }

        // The file must be active. This is the internal-only status of
        // `BR-0408`, used here as J-15 makes it visible internally. J-13's
        // `idle` is an active agreement with no recent engagement, «for
        // monitoring purposes only, with no effect on matching eligibility» —
        // so it is eligible exactly as `active` is.
        if (candidate.FileStatus is not (TrainerFileStatuses.Active or TrainerFileStatuses.Idle))
        {
            reasons.Add(MatchExclusionReasons.FileStatus);
        }

        return reasons;
    }

    private static bool HasConflict(MatchingContext request, MatchingCandidateInput candidate) =>
        request.StartsAt is { } from && request.EndsAt is { } to
        && candidate.ConfirmedEngagements.Any(e => e.From <= to && from <= e.To);

    /// <summary>The six weighted rows. Each yields 0–1, then the model's weight.</summary>
    private static List<CriterionScore> Weighted(
        MatchingContext request,
        MatchingCandidateInput candidate,
        IReadOnlyDictionary<string, decimal> weights)
    {
        decimal Weight(string criterion) =>
            weights.TryGetValue(criterion, out var value) ? value : 0m;

        // Specialization — the request's domain among the trainer's.
        var specializationRaw =
            MatchText.AnyEqual(request.SpecializationDomain, candidate.SpecializationDomain) ? 1m : 0m;

        // Location — the request's city among the trainer's in-person cities.
        // An online delivery has no location, so the row scores nothing for
        // anyone (J-17's «unless online»), which leaves the ranking untouched.
        var locationRaw = !IsOnline(request.DeliveryMechanism)
            && MatchText.AnyCityEqual(request.City, candidate.City) ? 1m : 0m;

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
            Line(WeightedCriteria.Specialization, specializationRaw),
            Line(WeightedCriteria.Location, locationRaw),
            Line(WeightedCriteria.Language, languageRaw),
            Line(WeightedCriteria.DeliveryMode, modeRaw),
            Line(WeightedCriteria.Evaluation, evaluationRaw),
            // Only a consultant can reach here with a conflict; everyone else
            // ranked is free on the dates and scores the row in full.
            Line(WeightedCriteria.Availability, HasConflict(request, candidate) ? 0m : 1m),
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
