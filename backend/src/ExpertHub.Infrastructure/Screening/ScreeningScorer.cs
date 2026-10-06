using System.Text.Json;
using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Screening;

/// <summary>One criterion's computed line.</summary>
/// <param name="Unresolved">
/// The applicant ANSWERED, and the criterion's table has no entry for what
/// they chose — an unknown code, or a value the business has not classified
/// yet. It scores nothing, but it is NOT the same statement as a legitimate
/// zero and the breakdown must not present it as one: a missing classification
/// is a configuration problem, and it has to stay diagnosable.
/// </param>
public sealed record CriterionScore(
    Guid CriterionId, string SectionCode, string LabelAr, string LabelEn,
    decimal Weight, decimal RawScore, decimal WeightedScore, bool Unresolved = false);

/// <summary>A service's official score with its breakdown.</summary>
public sealed record ObjectiveScore(
    decimal Total, Guid ModelId, string ModelVersion, decimal Threshold,
    IReadOnlyList<CriterionScore> Criteria)
{
    /// <summary>
    /// At least one criterion could not be resolved against its table, so the
    /// total is short by a CONFIGURATION problem rather than by the applicant's
    /// answers. Screening can still be decided — the score is advisory
    /// (`J-05/F2/AC-5`) — but nobody should read the number without this.
    /// </summary>
    public bool HasUnresolvedCriteria => Criteria.Any(c => c.Unresolved);
}

/// <summary>
/// Everything a LOOKUP model needs beyond the flat answer map — the repeatable
/// sections' entries and the attachment counts. Null on the legacy path, which
/// is why a historical score is computed by exactly the code that produced it.
/// </summary>
/// <param name="EntryAnswers">
/// Field code → that field's value in EVERY entry of its repeatable section,
/// in entry order. A one-entry section yields a single-element list.
/// </param>
/// <param name="SectionEntryCounts">Section code → how many entries it holds.</param>
/// <param name="AttachmentCounts">Attachment rule code → how many files.</param>
public sealed record ScoringEntries(
    IReadOnlyDictionary<string, IReadOnlyList<JsonElement>> EntryAnswers,
    IReadOnlyDictionary<string, int> SectionEntryCounts,
    IReadOnlyDictionary<string, int> AttachmentCounts)
{
    public static readonly ScoringEntries Empty = new(
        new Dictionary<string, IReadOnlyList<JsonElement>>(StringComparer.Ordinal),
        new Dictionary<string, int>(StringComparer.Ordinal),
        new Dictionary<string, int>(StringComparer.Ordinal));
}

/// <summary>
/// `BR-0201` — the official score: a FIXED weighted formula from the
/// evaluation model and the applicant's answers, and nothing else.
/// </summary>
/// <remarks>
/// <para>
/// <b>The boundary is the signature.</b> This function takes the model's
/// criteria and the application's answers. It does not take
/// <see cref="AiAnalysis"/> — so no code path can merge the advisory value
/// into the official score, which is `BR-0202` enforced by the compiler
/// rather than reviewed for (`08` §2.2, the same technique as P-79/P-96).
/// </para>
/// <para>
/// <b>Two models live here, and which one runs is the criterion's own data.</b>
/// </para>
/// <para>
/// A criterion with no <see cref="EvaluationCriterion.ScoreRule"/> takes the
/// ORIGINAL path: its raw score is the COMPLETENESS of its form section — the
/// share of the section's fields the applicant answered, 0–100 — weighted and
/// rounded to 1 dp. That was the documented placeholder while `DM-GAP-02` was
/// open, and it is kept BYTE-FOR-BYTE so an application screened under
/// `mock-dm-gap-02-draft.1` keeps the number it was screened with.
/// </para>
/// <para>
/// A criterion WITH a rule takes the approved path (Notion «Evaluation Matrix -
/// By Services», 2026-09-21): the applicant's answer is looked up in the
/// criterion's own option→percentage-point table, which returns a value that
/// already IS the weighted score — there is no separate multiplication. The
/// total is their sum, 0–100 by construction.
/// </para>
/// </remarks>
public static class ScreeningScorer
{
    public static ObjectiveScore Score(
        EvaluationModel model,
        IReadOnlyList<EvaluationCriterion> criteria,
        IReadOnlyDictionary<string, IReadOnlyList<string>> fieldCodesBySection,
        IReadOnlyDictionary<string, JsonElement> answers,
        ScoringEntries? entries = null)
    {
        var repeatable = entries ?? ScoringEntries.Empty;
        var lines = new List<CriterionScore>();
        foreach (var criterion in criteria.OrderBy(c => c.OrderIndex))
        {
            var (raw, weighted, unresolved) = criterion.ScoreRule is { Length: > 0 } rule
                ? LookupScore(criterion, rule, answers, repeatable)
                : CompletenessScore(criterion, fieldCodesBySection, answers);
            lines.Add(new CriterionScore(
                criterion.CriterionId,
                criterion.SourceSectionCode,
                criterion.LabelAr,
                criterion.LabelEn,
                criterion.Weight,
                raw,
                weighted,
                unresolved));
        }

        // The approved matrix's formula is «SUM of all looked-up values», so
        // the sum is taken over the EXACT values and rounded once, at the end.
        // Rounding each line first and adding the rounded lines would drift
        // from the workbook by up to a criterion-count of half-pennies.
        var total = lines.Sum(l => l.WeightedScore);
        return new ObjectiveScore(
            Math.Round(total, 2),
            model.ModelId,
            model.Version,
            model.PassThreshold,
            lines);
    }

    /// <summary>The ORIGINAL placeholder — section completeness. Unchanged.</summary>
    private static (decimal Raw, decimal Weighted, bool Unresolved) CompletenessScore(
        EvaluationCriterion criterion,
        IReadOnlyDictionary<string, IReadOnlyList<string>> fieldCodesBySection,
        IReadOnlyDictionary<string, JsonElement> answers)
    {
        var raw = SectionCompleteness(
            fieldCodesBySection.TryGetValue(criterion.SourceSectionCode, out var codes)
                ? codes
                : [],
            answers);
        return (raw, Math.Round(raw * criterion.Weight / 100m, 1), false);
    }

    /// <summary>
    /// The APPROVED matrix — one option→percentage-point look-up, collapsed
    /// across the entries of a repeatable section per the criterion's
    /// <see cref="EvaluationCriterion.Aggregation"/>.
    /// </summary>
    private static (decimal Raw, decimal Weighted, bool Unresolved) LookupScore(
        EvaluationCriterion criterion,
        string rule,
        IReadOnlyDictionary<string, JsonElement> answers,
        ScoringEntries entries)
    {
        using var document = JsonDocument.Parse(rule);
        var root = document.RootElement;
        var kind = root.TryGetProperty("kind", out var kindValue)
            ? kindValue.GetString()
            : null;

        // The matrix writes its tables as fractions of 1 («دكتوراه 0.05» for a
        // 5% criterion), so they are stored exactly as Notion writes them —
        // diffable against the source — and scaled to percentage points here.
        var unresolved = false;
        var points = kind switch
        {
            "option" => OptionPoints(criterion, root, answers, entries, out unresolved),
            "bucket" => BucketPoints(criterion, root, entries),
            // `EVAL-GAP-*` — an approved criterion whose source field does not
            // exist yet. It is seeded, named and weighted so the breakdown
            // shows WHY the ceiling is short, and it scores zero until the
            // field arrives. Never silently dropped, never renormalised away.
            _ => 0m,
        } * 100m;

        var raw = criterion.Weight == 0m
            ? 0m
            : Math.Round(points / criterion.Weight * 100m, 1);
        return (raw, points, unresolved);
    }

    /// <summary>Criteria #1, #2, #4, #7, #8, #9, #10 and every service-specific
    /// one: the selected option's own value, best-of across entries.</summary>
    private static decimal OptionPoints(
        EvaluationCriterion criterion,
        JsonElement rule,
        IReadOnlyDictionary<string, JsonElement> answers,
        ScoringEntries entries,
        out bool unresolved)
    {
        unresolved = false;
        if (criterion.SourceFieldCode is not { Length: > 0 } field
            || !rule.TryGetProperty("points", out var table))
        {
            return 0m;
        }

        /*
         * A STRICT table is CLOSED: it lists every answer the business has
         * ruled on, and an answer outside it is a configuration problem — an
         * unknown code, or a value nobody has classified yet. It scores
         * nothing AND is reported, because returning a silent 0 would dress a
         * missing decision up as a decided «not related».
         *
         * A non-strict table is OPEN by design — the matrix's own
         * «0 if blank / no match» (`EVAL-GAP-11`), which is how every other
         * criterion reads.
         */
        var strict = rule.TryGetProperty("strict", out var strictValue)
            && strictValue.ValueKind == JsonValueKind.True;

        var selected = criterion.Aggregation == CriterionAggregations.Max
            && entries.EntryAnswers.TryGetValue(field, out var perEntry)
                ? perEntry
                : answers.TryGetValue(field, out var single)
                    ? [single]
                    : (IReadOnlyList<JsonElement>)[];

        // Best-of (MAX), never an average and never «the first entry» — the
        // matrix rejects both by name, and the owner ruled the same way for
        // years of experience on 2026-09-21. An added entry can only help.
        var best = 0m;
        var matched = false;
        var answered = false;
        foreach (var value in selected)
        {
            foreach (var option in OptionValues(value))
            {
                answered = true;
                if (!table.TryGetProperty(option, out var points))
                {
                    continue;
                }
                matched = true;
                if (points.TryGetDecimal(out var scored) && scored > best)
                {
                    best = scored;
                }
            }
        }

        // NOT answering is the applicant's own, legitimate zero. Answering
        // something the table does not carry is OURS.
        unresolved = strict && answered && !matched;
        return best;
    }

    /// <summary>Criteria #5 (files attached) and #6 (entries entered): a count,
    /// then the bucket it falls in.</summary>
    private static decimal BucketPoints(
        EvaluationCriterion criterion,
        JsonElement rule,
        ScoringEntries entries)
    {
        var count = criterion.Aggregation switch
        {
            CriterionAggregations.FileCount when criterion.SourceFieldCode is { } code =>
                entries.AttachmentCounts.TryGetValue(code, out var files) ? files : 0,
            CriterionAggregations.EntryCount =>
                entries.SectionEntryCounts.TryGetValue(criterion.SourceSectionCode, out var rows)
                    ? rows
                    : 0,
            _ => 0,
        };

        if (!rule.TryGetProperty("buckets", out var buckets))
        {
            return 0m;
        }
        // Buckets are ordered and the first whose ceiling the count reaches
        // wins; the last one carries no ceiling and catches the rest.
        foreach (var bucket in buckets.EnumerateArray())
        {
            var open = !bucket.TryGetProperty("upTo", out var ceiling);
            if (open || count <= ceiling.GetInt32())
            {
                return bucket.TryGetProperty("points", out var points)
                    && points.TryGetDecimal(out var scored)
                        ? scored
                        : 0m;
            }
        }
        return 0m;
    }

    /// <summary>A field answers with one option or, for a multi-select, many.</summary>
    private static IEnumerable<string> OptionValues(JsonElement value)
    {
        switch (value.ValueKind)
        {
            case JsonValueKind.String:
                var text = value.GetString();
                if (!string.IsNullOrWhiteSpace(text))
                {
                    yield return text;
                }
                break;
            case JsonValueKind.True:
                yield return "true";
                break;
            case JsonValueKind.False:
                yield return "false";
                break;
            case JsonValueKind.Number:
                yield return value.ToString();
                break;
            case JsonValueKind.Array:
                foreach (var item in value.EnumerateArray())
                {
                    foreach (var option in OptionValues(item))
                    {
                        yield return option;
                    }
                }
                break;
        }
    }

    private static decimal SectionCompleteness(
        IReadOnlyList<string> fieldCodes,
        IReadOnlyDictionary<string, JsonElement> answers)
    {
        if (fieldCodes.Count == 0)
        {
            return 0m;
        }
        var answered = fieldCodes.Count(code =>
            answers.TryGetValue(code, out var value) && !IsEmpty(value));
        return Math.Round(100m * answered / fieldCodes.Count, 1);
    }

    private static bool IsEmpty(JsonElement value) => value.ValueKind switch
    {
        JsonValueKind.String => string.IsNullOrWhiteSpace(value.GetString()),
        JsonValueKind.Array => value.GetArrayLength() == 0,
        JsonValueKind.True => false,
        _ => true,
    };
}
