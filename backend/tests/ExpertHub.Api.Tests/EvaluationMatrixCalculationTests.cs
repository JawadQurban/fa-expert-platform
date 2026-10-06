using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Screening;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The approved screening matrix, computed — Notion «Evaluation Matrix - By
/// Services», version `dm-gap-02.2026-09-29`.
/// </summary>
/// <remarks>
/// <para>
/// Every expected number here is derived BY HAND from the matrix's own weight
/// tables and written in the test beside its working, so a failure says which
/// criterion moved rather than only that a total changed. The criteria and
/// their rules are read from the DATABASE, so these tests cover the seed and
/// the scorer together — a mis-seeded weight fails here, not in production.
/// </para>
/// <para>
/// Criterion #3 computes: it reads «المجال», the Section 1 field the form
/// always had, and the business classified all 147 values on 2026-09-28, so the
/// reachable maximum is 100. That is a DATA state, read from the seeded rule,
/// so <see cref="Maximum_reachable_score_matches_what_the_configured_rules_can_pay"/>
/// follows the data rather than hardcoding a number, while
/// <see cref="A_perfect_applicant_scores_exactly_100_on_the_seeded_classification"/>
/// proves the 100 arithmetic with nothing substituted.
/// </para>
/// <para>
/// `EVAL-GAP-11` (2026-09-29) closed criteria #2, #7 and #8 the same way #3 was
/// already closed: an unclassified or unknown value resolves to nothing AND is
/// reported, instead of taking a silent zero.
/// </para>
/// </remarks>
public sealed class EvaluationMatrixCalculationTests : IAsyncLifetime
{
    private const string ApprovedVersion = "dm-gap-02.2026-09-29";

    /// <summary>The version `EVAL-GAP-11` superseded on 2026-09-29. It stays
    /// seeded, INACTIVE, and carries the OPEN tables it was decided with.</summary>
    private const string ClassifiedDomainVersion = "dm-gap-02.2026-09-22";

    /// <summary>The first approved matrix — criterion #3 had no source field
    /// then. Superseded, inactive, and still resolvable for results decided
    /// under it.</summary>
    private const string SupersededVersion = "dm-gap-02.2026-09-21";
    private const string DraftVersion = "mock-dm-gap-02-draft.1";

    private readonly LocalDbFixture _database = new();

    public Task InitializeAsync() => _database.InitializeAsync();

    public Task DisposeAsync() => _database.DisposeAsync();

    // ── the model itself ────────────────────────────────────────────────

    [Theory]
    [InlineData(ApplicationServices.Trainer)]
    [InlineData(ApplicationServices.Consultant)]
    [InlineData(ApplicationServices.ContentDeveloper)]
    [InlineData(ApplicationServices.QuestionWriter)]
    public async Task Every_service_carries_the_approved_model_at_threshold_50(string service)
    {
        var (model, criteria) = await ApprovedAsync(service);

        Assert.Equal(ApprovedVersion, model.Version);
        Assert.True(model.IsActive);
        // J-05/F2/AC-5 — display-only. The draft's 70/75 were never approved.
        Assert.Equal(50m, model.PassThreshold);
        // Ten common + that track's own (3 for Trainer, 2 for the others).
        Assert.Equal(service == ApplicationServices.Trainer ? 13 : 12, criteria.Count);
        // «Common (70%) + that service's specific (30%) = 100% max».
        Assert.Equal(100m, criteria.Sum(c => c.Weight));
        Assert.Equal(70m, criteria.Take(10).Sum(c => c.Weight));
    }

    [Fact]
    public async Task The_draft_model_survives_inactive_so_old_results_still_resolve()
    {
        await using var db = _database.CreateContext();
        var drafts = await db.EvaluationModels.AsNoTracking()
            .Where(m => m.Version == DraftVersion).ToListAsync();

        Assert.Equal(4, drafts.Count);
        Assert.All(drafts, m => Assert.False(m.IsActive));
        // Its criteria keep NO rule, which is what routes them to the original
        // completeness path — the pin is the data, not a version check.
        var criteria = await CriteriaOfAsync(db, drafts[0].ModelId);
        Assert.All(criteria, c => Assert.Null(c.ScoreRule));
    }

    [Fact]
    public async Task The_superseded_versions_keep_the_OPEN_tables_they_were_decided_with()
    {
        /*
         * The guarantee `EVAL-GAP-11` must not break. Closing the tables changes
         * what an unruled value does, so it shipped as a new model version —
         * and the two older ones keep their rules byte for byte. A screening
         * result decided under either resolves through `SCREENING_RESULT.model_id`
         * and must still compute the way it did on the day it was decided.
         */
        await using var db = _database.CreateContext();

        foreach (var version in new[] { SupersededVersion, ClassifiedDomainVersion })
        {
            var models = await db.EvaluationModels.AsNoTracking()
                .Where(m => m.Version == version).ToListAsync();
            Assert.Equal(4, models.Count);
            Assert.All(models, m => Assert.False(m.IsActive));

            var criteria = await CriteriaOfAsync(db, models[0].ModelId);
            foreach (var field in new[] { "specializationDetail", "certificateName" })
            {
                foreach (var criterion in criteria.Where(c => c.SourceFieldCode == field))
                {
                    Assert.DoesNotContain("\"strict\":true", criterion.ScoreRule!);
                    // …and still carry the row that used to score a silent 0.
                    if (field == "specializationDetail")
                    {
                        Assert.Contains("\"spec-025\":0", criterion.ScoreRule!);
                    }
                }
            }
        }

        // Only the current version is active, and only it is closed.
        var active = await db.EvaluationModels.AsNoTracking()
            .Where(m => m.IsActive).Select(m => m.Version).Distinct().ToListAsync();
        Assert.Equal([ApprovedVersion], active);
    }

    // ── the boundaries §6 asks for ──────────────────────────────────────

    [Fact]
    public async Task An_application_with_no_answers_scores_zero()
    {
        var score = await ScoreAsync(ApplicationServices.Trainer, new());

        Assert.Equal(0m, score.Total);
        Assert.All(score.Criteria, c => Assert.Equal(0m, c.WeightedScore));
    }

    [Fact]
    public async Task Maximum_reachable_score_matches_what_the_configured_rules_can_pay()
    {
        //  #1 doctorate               5.00
        //  #2 related specialization 10.00
        //  #3 dom-003 (RELATED)      10.00
        //  #4 16+ years              20.00
        //  #5 8 referral files        6.00
        //  #6 4 certificates          6.00
        //  #7 a relevant certificate  5.00
        //  #8 a global certificate    4.00
        //  #9 full-time               2.00
        // #10 bilingual               2.00
        //  T1 >10 training years     20.00
        //  T2 on-site and online      5.00
        //  T3 ready materials         5.00
        //                            ─────
        //                             90.00
        var score = await ScoreAsync(ApplicationServices.Trainer, PerfectTrainer(), PerfectEntries());

        // Not asserted as a constant: computed from what each seeded rule can
        // actually return, so this says WHY the ceiling is what it is.
        var (_, criteria) = await ApprovedAsync(ApplicationServices.Trainer);
        Assert.Equal(TheoreticalMaximum(criteria), score.Total);

        // §15 — 100.00 from the ACTUAL seeded classification, with no test-time
        // substitution anywhere in this path.
        Assert.Equal(100.00m, score.Total);
        Assert.True(BestPossible(criteria.Single(c => c.SourceFieldCode == "domain")) > 0m);

        // The same answers WITHOUT any repeatable entry or attachment lose
        // exactly the four entry-driven criteria: 6.00 + 6.00 + 5.00 + 4.00.
        var flatOnly = await ScoreAsync(ApplicationServices.Trainer, PerfectTrainer());
        Assert.Equal(score.Total - 21.00m, flatOnly.Total);
    }

    /// <summary>
    /// §15/§20 — the matrix reaches exactly 100.00 on the ACTUAL seeded
    /// classification. Nothing is substituted: the criteria, their rules and
    /// the relevance table all come from the database, so this is the real
    /// model answering, not a fixture shaped to agree with it.
    /// </summary>
    [Fact]
    public async Task A_perfect_applicant_scores_exactly_100_on_the_seeded_classification()
    {
        var (model, criteria) = await ApprovedAsync(ApplicationServices.Trainer);

        var score = ScreeningScorer.Score(
            model, criteria,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal),
            ToAnswers(PerfectTrainer()), PerfectEntries());

        Assert.Equal(100.00m, score.Total);
        Assert.Equal(100m, criteria.Sum(c => c.Weight));
        // #3 really paid its 10 — not some other criterion covering for it.
        Assert.Equal(10.00m, score.Criteria.Single(c => c.LabelAr == "المجال").WeightedScore);
        Assert.False(score.HasUnresolvedCriteria);
    }

    /// <summary>The largest total the seeded rules can return — each
    /// criterion's own best option, summed. `unavailable` pays nothing.</summary>
    private static decimal TheoreticalMaximum(IReadOnlyList<EvaluationCriterion> criteria) =>
        criteria.Sum(BestPossible);

    private static decimal BestPossible(EvaluationCriterion criterion)
    {
        if (criterion.ScoreRule is not { Length: > 0 } rule)
        {
            return criterion.Weight;
        }
        using var document = JsonDocument.Parse(rule);
        var root = document.RootElement;
        var kind = root.TryGetProperty("kind", out var k) ? k.GetString() : null;
        var best = kind switch
        {
            "option" => root.GetProperty("points").EnumerateObject()
                .Select(p => p.Value.GetDecimal()).DefaultIfEmpty(0m).Max(),
            "bucket" => root.GetProperty("buckets").EnumerateArray()
                .Select(b => b.GetProperty("points").GetDecimal()).DefaultIfEmpty(0m).Max(),
            _ => 0m,
        };
        return best * 100m;
    }

    /// <summary>The same criterion with a table that rules one value NOT related
    /// — a resolved «no», which the current catalogue happens not to contain.</summary>
    private static EvaluationCriterion NotRelated(EvaluationCriterion criterion, string value) =>
        new()
        {
            CriterionId = criterion.CriterionId,
            ModelId = criterion.ModelId,
            LabelAr = criterion.LabelAr,
            LabelEn = criterion.LabelEn,
            SourceSectionCode = criterion.SourceSectionCode,
            Weight = criterion.Weight,
            OrderIndex = criterion.OrderIndex,
            SourceFieldCode = criterion.SourceFieldCode,
            Aggregation = criterion.Aggregation,
            ScoreRule = "{\"kind\":\"option\",\"strict\":true,\"points\":{\"" + value + "\":0}}",
        };

    /// <summary>The same criterion with a table that pays for one value.</summary>
    private static EvaluationCriterion Classified(EvaluationCriterion criterion, string relatedValue) =>
        new()
        {
            CriterionId = criterion.CriterionId,
            ModelId = criterion.ModelId,
            LabelAr = criterion.LabelAr,
            LabelEn = criterion.LabelEn,
            SourceSectionCode = criterion.SourceSectionCode,
            Weight = criterion.Weight,
            OrderIndex = criterion.OrderIndex,
            SourceFieldCode = criterion.SourceFieldCode,
            Aggregation = criterion.Aggregation,
            ScoreRule = "{\"kind\":\"option\",\"strict\":true,\"points\":{\"" + relatedValue + "\":0.1,\"dom-099\":0}}",
        };

    [Fact]
    public async Task A_score_can_land_exactly_on_the_50_threshold()
    {
        // 16+ practical years 20.00 + >10 training years 20.00
        //   + doctorate 5.00 + ready materials 5.00 = 50.00, everything else blank.
        var score = await ScoreAsync(ApplicationServices.Trainer, new()
        {
            ["yearsOfExperience"] = "16-plus",
            ["trainingExperienceYears"] = "more-than-10",
            ["qualificationType"] = "doctorate",
            ["hasReadyMaterials"] = "yes",
        });

        Assert.Equal(50.00m, score.Total);
        Assert.Equal(50m, score.Threshold);
    }

    [Fact]
    public async Task Immediately_below_the_threshold_is_a_half_point_under()
    {
        // The same answers with a master's instead of a doctorate: 4.50 not 5.00.
        var score = await ScoreAsync(ApplicationServices.Trainer, new()
        {
            ["yearsOfExperience"] = "16-plus",
            ["trainingExperienceYears"] = "more-than-10",
            ["qualificationType"] = "master",
            ["hasReadyMaterials"] = "yes",
        });

        Assert.Equal(49.50m, score.Total);
        Assert.True(score.Total < score.Threshold);
    }

    [Fact]
    public async Task Immediately_above_the_threshold_is_a_half_point_over()
    {
        // The master's answers plus part-time engagement (1.00) — 50.50.
        var score = await ScoreAsync(ApplicationServices.Trainer, new()
        {
            ["yearsOfExperience"] = "16-plus",
            ["trainingExperienceYears"] = "more-than-10",
            ["qualificationType"] = "master",
            ["hasReadyMaterials"] = "yes",
            ["engagementMode"] = "part-time",
        });

        Assert.Equal(50.50m, score.Total);
        Assert.True(score.Total > score.Threshold);
    }

    [Fact]
    public async Task A_middle_score_sums_its_criteria_exactly()
    {
        //  #1 bachelor              4.00
        //  #4 5 to 10 years        10.00
        //  #9 part-time             1.00
        // #10 Arabic                1.00
        //  T1 3–5 training years   10.00
        //  T2 online                3.00
        //                          ─────
        //                           29.00
        var score = await ScoreAsync(ApplicationServices.Trainer, new()
        {
            ["qualificationType"] = "bachelor",
            ["yearsOfExperience"] = "5-10",
            ["engagementMode"] = "part-time",
            ["trainingLanguages"] = "ar",
            ["trainingExperienceYears"] = "3-5",
            ["preferredDeliveryMode"] = "online",
        });

        Assert.Equal(29.00m, score.Total);
        Assert.Equal(score.Total, score.Criteria.Sum(c => c.WeightedScore));
    }

    // ── rounding ────────────────────────────────────────────────────────

    [Fact]
    public async Task Two_decimal_place_weights_are_summed_exactly_not_rounded_first()
    {
        // #6 one certificate 1.71 + #5 two referral files 1.71 = 3.42.
        // Rounding each line to 1 dp first would give 1.7 + 1.7 = 3.4 and lose
        // the workbook's own precision — this is the guard against that.
        var score = await ScoreAsync(ApplicationServices.Trainer, new(), new ScoringEntries(
            new Dictionary<string, IReadOnlyList<JsonElement>>(StringComparer.Ordinal),
            new Dictionary<string, int>(StringComparer.Ordinal) { ["certifications"] = 1 },
            new Dictionary<string, int>(StringComparer.Ordinal) { ["client-referrals"] = 2 }));

        Assert.Equal(3.42m, score.Total);
    }

    // ── criterion #3, «المجال» ───────────────────────

    [Fact]
    public async Task Criterion_3_reads_the_controlled_field_with_a_closed_table()
    {
        var (_, seeded) = await ApprovedAsync(ApplicationServices.Trainer);
        var criterion = seeded.Single(c => c.LabelAr == "المجال");

        // A real look-up on «المجال» — the Section 1 field the form always had
        // — not the `unavailable` stub the previous model version carried.
        Assert.Equal("domain", criterion.SourceFieldCode);
        Assert.Equal("personal", criterion.SourceSectionCode);
        // Section 1 is not repeatable, so a single answer. The best-of rule
        // governs #1, #2, #4, #7 and #8, which DO read repeatable sections.
        Assert.Equal(CriterionAggregations.SingleAnswer, criterion.Aggregation);
        Assert.Equal(10m, criterion.Weight);
        Assert.Contains("\"kind\":\"option\"", criterion.ScoreRule);

        /*
         * The table is CLOSED, and it carries only what the business has ruled
         * on. An earlier version of this test required all 147 keys to be
         * present — which was only true because unclassified values were being
         * written as zeros, i.e. a missing decision was being stored as a
         * decided «not related». They are now omitted and the look-up is
         * strict, so an answer the table does not carry is REPORTED rather
         * than silently scored.
         */
        Assert.Contains("\"strict\":true", criterion.ScoreRule);
        using var rule = JsonDocument.Parse(criterion.ScoreRule!);
        var classified = rule.RootElement.GetProperty("points").EnumerateObject().ToList();
        // Every key that IS there is one of the approved 147, and pays either
        // the full 0.1 or nothing — no arbitrary score can reach the table.
        Assert.All(classified, entry =>
        {
            Assert.Matches(@"^dom-\d{3}$", entry.Name);
            Assert.Contains(entry.Value.GetDecimal(), new[] { 0m, 0.1m });
        });
        Assert.Equal(classified.Count, classified.Select(e => e.Name).Distinct().Count());
    }

    [Theory]
    // the applicant's «المجال» answer → points, and whether it resolved
    [InlineData("dom-003", 10.00, false)]   // classified RELATED
    [InlineData("dom-099", 0.00, false)]    // classified NOT_RELATED
    [InlineData("", 0.00, false)]           // never answered — the applicant's own zero
    [InlineData("dom-XXX", 0.00, true)]     // not a value of the approved list
    [InlineData("dom-050", 0.00, true)]     // a real domain nobody has classified
    public async Task Criterion_3_scores_the_applicants_domain(
        string domain, double expected, bool unresolved)
    {
        var score = await ScoreWithClassifiedFieldAsync(
            ApplicationServices.Trainer, domain.Length == 0 ? [] : [domain]);

        var criterion = score.Criteria.Single(c => c.LabelAr == "المجال");
        Assert.Equal((decimal)expected, criterion.WeightedScore);
        // §8 — a configuration problem must never read as a decided
        // «ليس له صلة». Both score nothing; only one is the applicant's fault.
        Assert.Equal(unresolved, criterion.Unresolved);
        Assert.Equal(unresolved, score.HasUnresolvedCriteria);
    }

    [Theory]
    // The 13 values the business ruled are not professional domains at all.
    [InlineData("dom-122")]   // الجميع — catch-all
    [InlineData("dom-032")]   // اكسل — a tool
    [InlineData("dom-076")]   // Power BI — a tool
    [InlineData("dom-011")]   // CME1 — a certification
    [InlineData("dom-139")]   // PMP — a certification
    [InlineData("dom-075")]   // TOT — a methodology
    [InlineData("dom-096")]   // تقديم خدمات استشارية — a service type
    public async Task A_master_data_value_is_unresolved_never_scored_zero(string code)
    {
        /*
         * §5/§8 — these are master-data problems, NOT relevance decisions. They
         * are omitted from the strict table, so they resolve to nothing AND
         * say so. Recording them as NOT_RELATED would state a business
         * decision nobody made; scoring them would reward a legacy data fault.
         */
        var (model, criteria) = await ApprovedAsync(ApplicationServices.Trainer);
        Assert.Contains("\"strict\":true",
            criteria.Single(c => c.SourceFieldCode == "domain").ScoreRule);

        var score = ScreeningScorer.Score(
            model, criteria,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal),
            ToAnswers(new Dictionary<string, string> { ["domain"] = code }),
            ScoringEntries.Empty);

        var line = score.Criteria.Single(c => c.LabelAr == "المجال");
        Assert.Equal(0m, line.WeightedScore);
        Assert.True(line.Unresolved);
        Assert.True(score.HasUnresolvedCriteria);
    }

    [Fact]
    public async Task The_engine_still_supports_a_NOT_RELATED_domain()
    {
        /*
         * §9/§16 — the approved catalogue currently contains no NOT_RELATED
         * domain, and one was NOT manufactured to fill the category. The
         * ENGINE must still handle one, so this substitutes a table that rules
         * `dom-003` not related and checks it scores a clean, resolved zero —
         * the only test here that substitutes anything.
         */
        var (model, seeded) = await ApprovedAsync(ApplicationServices.Trainer);
        var criteria = seeded.Select(c => c.SourceFieldCode == "domain"
            ? NotRelated(c, "dom-003")
            : c).ToList();

        var score = ScreeningScorer.Score(
            model, criteria,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal),
            ToAnswers(new Dictionary<string, string> { ["domain"] = "dom-003" }),
            ScoringEntries.Empty);

        var line = score.Criteria.Single(c => c.LabelAr == "المجال");
        Assert.Equal(0m, line.WeightedScore);
        // Resolved: the business ruled on it, and the ruling was «no».
        Assert.False(line.Unresolved);
        Assert.False(score.HasUnresolvedCriteria);
    }

    [Fact]
    public async Task A_resolved_score_never_reports_an_unresolved_criterion()
    {
        // The other side of the same guard: nothing else in the matrix is
        // strict, so a complete application resolves cleanly.
        var score = await ScoreWithClassifiedFieldAsync(
            ApplicationServices.Trainer, ["dom-003"], PerfectTrainer());

        Assert.False(score.HasUnresolvedCriteria);
        Assert.All(score.Criteria, c => Assert.False(c.Unresolved));
    }

    [Theory]
    [InlineData(ApplicationServices.Trainer)]
    [InlineData(ApplicationServices.Consultant)]
    [InlineData(ApplicationServices.ContentDeveloper)]
    [InlineData(ApplicationServices.QuestionWriter)]
    public async Task Criterion_3_is_common_so_one_field_scores_the_same_for_every_service(
        string service)
    {
        // The owner ruled on 2026-09-22 that #3 stays where Notion puts it —
        // in the COMMON block, «applied identically regardless of which
        // service(s) are requested». One answer, one result, four services.
        var score = await ScoreWithClassifiedFieldAsync(service, ["dom-003"]);

        var criterion = score.Criteria.Single(c => c.LabelAr == "المجال");
        Assert.Equal(10.00m, criterion.WeightedScore);
        Assert.False(criterion.Unresolved);
    }

    [Fact]
    public async Task An_application_that_never_answered_the_field_scores_a_clean_zero()
    {
        /*
         * The historical shape: «المجال» unanswered. #3 pays nothing, NOTHING
         * ELSE is disturbed, and it is NOT flagged unresolved — not answering
         * is the applicant's own legitimate zero, not a configuration fault.
         */
        var withField = await ScoreAsync(
            ApplicationServices.Trainer, PerfectTrainer(), PerfectEntries());

        var unanswered = PerfectTrainer();
        unanswered.Remove("domain");
        var without = await ScoreAsync(ApplicationServices.Trainer, unanswered, PerfectEntries());

        Assert.Equal(10.00m, withField.Total - without.Total);
        Assert.False(without.HasUnresolvedCriteria);
        Assert.Equal(
            withField.Criteria.Where(c => c.LabelAr != "المجال")
                .Select(c => c.WeightedScore),
            without.Criteria.Where(c => c.LabelAr != "المجال")
                .Select(c => c.WeightedScore));
    }

    [Fact]
    public async Task The_superseded_matrix_keeps_criterion_3_unscored_forever()
    {
        await using var db = _database.CreateContext();
        var superseded = await db.EvaluationModels.AsNoTracking()
            .Where(m => m.Version == SupersededVersion).ToListAsync();

        Assert.Equal(4, superseded.Count);
        Assert.All(superseded, m => Assert.False(m.IsActive));

        // A result decided before the controlled field existed keeps the score
        // it was decided with — so ITS criterion #3 stays unavailable.
        var criteria = await CriteriaOfAsync(db, superseded[0].ModelId);
        var criterion = criteria.Single(c => c.LabelAr == "مجال الخبرة العملية");
        Assert.Null(criterion.SourceFieldCode);
        Assert.Equal("{\"kind\":\"unavailable\"}", criterion.ScoreRule);

        var score = ScreeningScorer.Score(
            superseded[0], criteria,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal),
            ToAnswers(PerfectTrainer()), PerfectEntries());
        Assert.Equal(90.00m, score.Total);
    }

    // ── repeatable entries: the owner's MAX ruling ──────────────────────

    [Fact]
    public async Task Years_of_experience_takes_the_best_entry_not_the_first_or_the_average()
    {
        // Three past roles: 1–5 (0.05), 11–15 (0.15), 5–10 (0.10).
        // Best-of = 15.00. First-entry would be 5.00, the average 10.00 —
        // both rejected by name in the matrix's multi-entry policy.
        var score = await ScoreAsync(ApplicationServices.Trainer, new(), Entries(
            ("yearsOfExperience", ["1-5", "11-15", "5-10"])));

        Assert.Equal(15.00m, score.Total);
    }

    [Fact]
    public async Task The_highest_qualification_scores_across_several_qualifications()
    {
        // A bachelor's (4.00) and a doctorate (5.00) → 5.00, and the related
        // specialization of EITHER entry earns the 10.00.
        var score = await ScoreAsync(ApplicationServices.Trainer, new(), Entries(
            ("qualificationType", ["bachelor", "doctorate"]),
            ("specializationDetail", ["spec-016", "spec-001"])));

        Assert.Equal(15.00m, score.Total);
    }

    /* ── EVAL-GAP-11: a blank classification is UNRESOLVED ──────────────────
     *
     * Decided 2026-09-29. Criterion #2 «التخصص العام» reads the business's own
     * relevance column, and one source row (`spec-025`) carries NO value. It
     * used to score a silent 0, which is indistinguishable from a decided «not
     * related». The table is now CLOSED — an unclassified value is omitted —
     * so such an answer resolves to nothing AND says so.
     *
     * The five cases the decision names, plus the one it deliberately spares.
     */

    private const string Specialization = "التخصص العام";

    private async Task<CriterionScore> SpecializationLineAsync(
        string? answer, ScoringEntries? entries = null)
    {
        var answers = new Dictionary<string, string>(StringComparer.Ordinal);
        if (answer is not null)
        {
            answers["specializationDetail"] = answer;
        }
        var score = await ScoreAsync(ApplicationServices.Trainer, answers, entries);
        return score.Criteria.Single(c => c.LabelAr == Specialization);
    }

    [Fact]
    public async Task An_explicitly_related_specialization_pays_its_configured_points()
    {
        // `spec-001` — «ذو صلة مباشرة بالأكاديمية المالية» in the workbook.
        var line = await SpecializationLineAsync("spec-001");

        Assert.Equal(10.00m, line.WeightedScore);
        Assert.False(line.Unresolved);
    }

    [Fact]
    public async Task An_explicitly_unrelated_specialization_is_a_RESOLVED_zero()
    {
        // `spec-016` Law (Regulations) — «غير ذي صلة مباشرة». The business
        // ruled on it, and the ruling was «no»: 0 points, nothing to flag.
        var line = await SpecializationLineAsync("spec-016");

        Assert.Equal(0.00m, line.WeightedScore);
        Assert.False(line.Unresolved);
    }

    [Theory]
    // blank   — the source row exists but its relevance cell is empty.
    [InlineData("spec-025")]
    // missing — a well-formed code the table does not carry.
    [InlineData("spec-999")]
    // unknown — not a code of this list at all.
    [InlineData("not-a-specialization")]
    public async Task A_specialization_with_no_business_decision_is_unresolved(string answer)
    {
        var line = await SpecializationLineAsync(answer);

        Assert.Equal(0.00m, line.WeightedScore);
        Assert.True(line.Unresolved);
    }

    [Fact]
    public async Task Leaving_the_specialization_blank_stays_the_applicants_own_zero()
    {
        /*
         * The one case that is NOT a configuration problem, and the reason the
         * flag means anything: an applicant who answered nothing has earned
         * nothing, and that is a complete, correct statement about them. Only
         * an ANSWER the business never ruled on is ours to fix.
         */
        var line = await SpecializationLineAsync(null);

        Assert.Equal(0.00m, line.WeightedScore);
        Assert.False(line.Unresolved);
    }

    [Fact]
    public async Task One_classified_entry_resolves_the_criterion_for_all_of_them()
    {
        // Best-of across entries (`P-295`) also resolves: an applicant who
        // listed an unclassified specialization AND a related one is scored on
        // the related one, and nothing is flagged — there is no decision
        // missing that would change their result.
        var line = await SpecializationLineAsync(null, Entries(
            ("specializationDetail", ["spec-025", "spec-001"])));

        Assert.Equal(10.00m, line.WeightedScore);
        Assert.False(line.Unresolved);
    }

    [Fact]
    public async Task Every_classified_lookup_criterion_carries_a_closed_table()
    {
        // #2, #3, #7 and #8 all look an answer up in a business-classified
        // list, so all four must be strict. A table that silently pays 0 for an
        // unknown key is the defect `EVAL-GAP-11` and `P-311` both removed.
        var (_, criteria) = await ApprovedAsync(ApplicationServices.Trainer);

        foreach (var field in new[] { "specializationDetail", "domain", "certificateName" })
        {
            foreach (var criterion in criteria.Where(c => c.SourceFieldCode == field))
            {
                Assert.Contains("\"strict\":true", criterion.ScoreRule);
            }
        }
    }

    [Fact]
    public async Task An_added_entry_can_never_lower_the_score()
    {
        var one = await ScoreAsync(ApplicationServices.Trainer, new(), Entries(
            ("yearsOfExperience", ["11-15"])));
        var two = await ScoreAsync(ApplicationServices.Trainer, new(), Entries(
            ("yearsOfExperience", ["11-15", "1-5"])));

        // «Do No Harm» — the matrix's own stated principle.
        Assert.Equal(one.Total, two.Total);
        Assert.True(two.Total >= one.Total);
    }

    // ── the matrix's own certificate worked examples ────────────────────

    [Theory]
    // (relevant?, global?) per certificate → expected #7, expected #8
    [InlineData(new[] { "rel-local" }, 5.00, 2.00)]                 // 1 relevant, local
    [InlineData(new[] { "rel-local", "irr-local" }, 5.00, 2.00)]    // 1 relevant + 1 irrelevant
    [InlineData(new[] { "irr-local", "irr-global" }, 0.00, 4.00)]   // 1 local + 1 global
    [InlineData(new[] { "irr-local", "irr-local" }, 0.00, 2.00)]    // 2 irrelevant, both local
    public async Task Certificate_relevance_and_source_are_best_of_independently(
        string[] certificates, double expectedRelevance, double expectedSource)
    {
        var codes = certificates.Select(CertificateCode).ToArray();
        var score = await ScoreAsync(ApplicationServices.Trainer, new(), Entries(
            ("certificateName", codes)));

        var relevance = score.Criteria.Single(c => c.LabelAr == "مجال الشهادة المهنية");
        var source = score.Criteria.Single(c => c.LabelAr == "مصدر الشهادة");
        Assert.Equal((decimal)expectedRelevance, relevance.WeightedScore);
        Assert.Equal((decimal)expectedSource, source.WeightedScore);
    }

    [Fact]
    public async Task No_certificate_entered_scores_zero_on_all_three_certificate_criteria()
    {
        var score = await ScoreAsync(ApplicationServices.Trainer, new());

        Assert.Equal(0m, score.Criteria.Single(c => c.LabelAr == "عدد الشهادات المهنية المرفقة").WeightedScore);
        Assert.Equal(0m, score.Criteria.Single(c => c.LabelAr == "مجال الشهادة المهنية").WeightedScore);
        Assert.Equal(0m, score.Criteria.Single(c => c.LabelAr == "مصدر الشهادة").WeightedScore);
    }

    // ── count buckets, at every boundary ────────────────────────────────

    [Theory]
    [InlineData(0, 0.00)]
    [InlineData(1, 1.71)]   // «شهادة واحدة»
    [InlineData(2, 3.43)]   // «2–3»
    [InlineData(3, 3.43)]
    [InlineData(4, 6.00)]   // «أكثر من 3»
    [InlineData(9, 6.00)]
    public async Task Certificate_count_buckets_at_their_boundaries(int certificates, double expected)
    {
        var score = await ScoreAsync(ApplicationServices.Trainer, new(), new ScoringEntries(
            new Dictionary<string, IReadOnlyList<JsonElement>>(StringComparer.Ordinal),
            new Dictionary<string, int>(StringComparer.Ordinal) { ["certifications"] = certificates },
            new Dictionary<string, int>(StringComparer.Ordinal)));

        Assert.Equal((decimal)expected,
            score.Criteria.Single(c => c.LabelAr == "عدد الشهادات المهنية المرفقة").WeightedScore);
    }

    /// <summary>
    /// The approved ranges, decided 2026-09-29: <b>0 · 1–3 · 4–7 · 8+</b>.
    /// The source wrote the last two as «4–7» then «7+», which overlap at 7;
    /// «4–7» means 4, 5, 6 and 7, so the next bucket starts at 8. Every
    /// boundary the decision names is driven here — 3 and 4 across the first
    /// seam, 7 and 8 across the second.
    /// </summary>
    [Theory]
    [InlineData(0, 0.00)]   // none
    [InlineData(1, 1.71)]   // «1–3» opens
    [InlineData(3, 1.71)]   // «1–3» closes
    [InlineData(4, 3.43)]   // «4–7» opens — no gap after 3
    [InlineData(7, 3.43)]   // «4–7» closes, and 7 pays THIS bucket, not the next
    [InlineData(8, 6.00)]   // «8+» opens — no overlap with 7
    [InlineData(20, 6.00)]  // and stays open
    public async Task Client_referral_file_buckets_at_their_boundaries(int files, double expected)
    {
        var score = await ScoreAsync(ApplicationServices.Trainer, new(), new ScoringEntries(
            new Dictionary<string, IReadOnlyList<JsonElement>>(StringComparer.Ordinal),
            new Dictionary<string, int>(StringComparer.Ordinal),
            new Dictionary<string, int>(StringComparer.Ordinal) { ["client-referrals"] = files }));

        Assert.Equal((decimal)expected,
            score.Criteria.Single(c => c.LabelAr == "إحالات العملاء / شهادات المشاركة").WeightedScore);
    }

    [Fact]
    public async Task Client_referral_buckets_are_contiguous_with_no_gap_and_no_overlap()
    {
        // Every count from 0 to 20 lands in exactly one bucket, the value never
        // decreases as files are added, and it changes at 1, 4 and 8 — nowhere
        // else. A gap would show as an unexpected value; an overlap would show
        // as a step at 7 instead of 8.
        var paid = new decimal[21];
        for (var files = 0; files <= 20; files++)
        {
            var score = await ScoreAsync(ApplicationServices.Trainer, new(), new ScoringEntries(
                new Dictionary<string, IReadOnlyList<JsonElement>>(StringComparer.Ordinal),
                new Dictionary<string, int>(StringComparer.Ordinal),
                new Dictionary<string, int>(StringComparer.Ordinal) { ["client-referrals"] = files }));
            paid[files] = score.Criteria
                .Single(c => c.LabelAr == "إحالات العملاء / شهادات المشاركة").WeightedScore;
        }

        Assert.All(Enumerable.Range(1, 20), files =>
            Assert.True(paid[files] >= paid[files - 1], $"{files} files paid less than {files - 1}"));

        var steps = Enumerable.Range(1, 20).Where(f => paid[f] != paid[f - 1]).ToArray();
        Assert.Equal([1, 4, 8], steps);
        Assert.Equal([0.00m, 1.71m, 3.43m, 6.00m], paid.Distinct().Order().ToArray());
    }

    // ── the three tracks ────────────────────────────────────────────────

    [Fact]
    public async Task The_consultant_track_reaches_100_on_its_own_two_criteria()
    {
        // The same 70% common block as the trainer, plus C1 >10 consulting
        // years 24.00 + C2 ready consulting materials 6.00.
        var answers = PerfectCommon();
        answers["consultingExperienceYears"] = "more-than-10";
        answers["readyConsultingMaterials"] = "yes";

        var score = await ScoreAsync(ApplicationServices.Consultant, answers, PerfectEntries());

        Assert.Equal(100.00m, score.Total);
    }

    [Fact]
    public async Task Content_developer_and_question_writer_share_one_track_exactly()
    {
        var answers = PerfectCommon();
        answers["contentQuestionExperienceYears"] = "more-than-10";
        // The trainer's ready-materials FIELD, scored on the content track's
        // own table (0.06, not 0.05) — which is why the rule lives on the
        // criterion rather than the field.
        answers["hasReadyMaterials"] = "yes";

        var developer = await ScoreAsync(ApplicationServices.ContentDeveloper, answers, PerfectEntries());
        var writer = await ScoreAsync(ApplicationServices.QuestionWriter, answers, PerfectEntries());

        Assert.Equal(100.00m, developer.Total);
        Assert.Equal(developer.Total, writer.Total);
        Assert.Equal(
            developer.Criteria.Select(c => (c.LabelAr, c.Weight, c.WeightedScore)),
            writer.Criteria.Select(c => (c.LabelAr, c.Weight, c.WeightedScore)));
    }

    [Fact]
    public async Task The_same_answers_score_differently_per_service_and_never_blend()
    {
        // A trainer's 20% training-years criterion pays 20.00; the consultant
        // track does not read that field at all (`J-05/F2/AC-3` — a score per
        // requested service, never one blended number).
        var answers = new Dictionary<string, string>
        {
            ["trainingExperienceYears"] = "more-than-10",
            ["qualificationType"] = "doctorate",
        };

        var trainer = await ScoreAsync(ApplicationServices.Trainer, answers);
        var consultant = await ScoreAsync(ApplicationServices.Consultant, answers);

        Assert.Equal(25.00m, trainer.Total);
        Assert.Equal(5.00m, consultant.Total);
    }

    // ── historical compatibility ────────────────────────────────────────

    [Fact]
    public async Task A_result_recorded_under_the_draft_model_still_computes_the_old_way()
    {
        await using var db = _database.CreateContext();
        var draft = await db.EvaluationModels.AsNoTracking()
            .FirstAsync(m => m.Version == DraftVersion && m.Service == ApplicationServices.Trainer);
        var criteria = await CriteriaOfAsync(db, draft.ModelId);

        // The draft scores SECTION COMPLETENESS: two of the section's two
        // fields answered is 100 raw, weighted by that section's 20 → 20.0.
        var score = ScreeningScorer.Score(
            draft,
            criteria,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal)
            {
                ["education"] = ["qualificationType", "universityName"],
            },
            new Dictionary<string, JsonElement>(StringComparer.Ordinal)
            {
                ["qualificationType"] = Json("doctorate"),
                ["universityName"] = Json("uni-001"),
            });

        Assert.Equal(DraftVersion, score.ModelVersion);
        Assert.Equal(70m, score.Threshold);
        Assert.Equal(5, score.Criteria.Count);
        Assert.Equal(20.0m, score.Total);
    }

    [Fact]
    public async Task The_approved_model_ignores_the_section_map_the_draft_needed()
    {
        // The lookup model reads FIELDS. Handing it the draft's section map
        // must not add a single point — otherwise the two models are mixing.
        var answers = new Dictionary<string, string> { ["qualificationType"] = "doctorate" };
        var withoutSections = await ScoreAsync(ApplicationServices.Trainer, answers);

        await using var db = _database.CreateContext();
        var (model, criteria) = await ApprovedAsync(ApplicationServices.Trainer);
        var withSections = ScreeningScorer.Score(
            model, criteria,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal)
            {
                ["education"] = ["qualificationType", "universityName"],
                ["certifications"] = ["certificateName"],
            },
            ToAnswers(answers),
            ScoringEntries.Empty);

        Assert.Equal(5.00m, withoutSections.Total);
        Assert.Equal(withoutSections.Total, withSections.Total);
    }

    // ── helpers ─────────────────────────────────────────────────────────

    private static string CertificateCode(string shape) => shape switch
    {
        // CERT-0003 SOCPA Fellowship — Relevant, Saudi / Local.
        "rel-local" => "CERT-0003",
        // CERT-0001 Saudi Board — Not Relevant, Saudi / Local.
        "irr-local" => "CERT-0001",
        // CERT-0044 — Global, Not Relevant. Chosen so #8 can reach 0.04 on a
        // certificate that earns #7 nothing, which is the matrix's rule 2:
        // «the certificate scoring highest on #7 need not be the same one
        // scoring highest on #8».
        _ => "CERT-0044",
    };

    private static Dictionary<string, string> PerfectCommon() => new()
    {
        // `dom-003` التحليل المالي والتمويل — classified RELATED by the business
        // on 2026-09-28, so criterion #3 pays from the REAL seeded table.
        ["domain"] = "dom-003",
        ["qualificationType"] = "doctorate",
        ["specializationDetail"] = "spec-001",
        ["yearsOfExperience"] = "16-plus",
        ["engagementMode"] = "full-time",
        ["trainingLanguages"] = "bilingual",
    };

    private static Dictionary<string, string> PerfectTrainer()
    {
        var answers = PerfectCommon();
        answers["trainingExperienceYears"] = "more-than-10";
        answers["preferredDeliveryMode"] = "blended";
        answers["hasReadyMaterials"] = "yes";
        return answers;
    }

    /// <summary>Four certificates, one of them relevant and one global, and
    /// eight referral files — the ceiling of #5, #6, #7 and #8 together.</summary>
    private static ScoringEntries PerfectEntries() => new(
        new Dictionary<string, IReadOnlyList<JsonElement>>(StringComparer.Ordinal)
        {
            // CERT-0003 relevant+local · CERT-0044 global+irrelevant ·
            // CERT-0001 irrelevant+local · CERT-0004 relevant+local.
            ["certificateName"] = [Json("CERT-0003"), Json("CERT-0044"), Json("CERT-0001"), Json("CERT-0004")],
        },
        new Dictionary<string, int>(StringComparer.Ordinal) { ["certifications"] = 4 },
        new Dictionary<string, int>(StringComparer.Ordinal) { ["client-referrals"] = 8 });

    private static ScoringEntries Entries(params (string Field, string[] Values)[] fields) => new(
        fields.ToDictionary(
            f => f.Field,
            f => (IReadOnlyList<JsonElement>)[.. f.Values.Select(Json)],
            StringComparer.Ordinal),
        new Dictionary<string, int>(StringComparer.Ordinal),
        new Dictionary<string, int>(StringComparer.Ordinal));

    private static JsonElement Json(string value) =>
        JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(value));

    private static Dictionary<string, JsonElement> ToAnswers(Dictionary<string, string> answers) =>
        answers.ToDictionary(a => a.Key, a => Json(a.Value), StringComparer.Ordinal);

    private async Task<ObjectiveScore> ScoreWithClassifiedFieldAsync(
        string service, string[] fields, Dictionary<string, string>? answers = null)
    {
        var (model, seeded) = await ApprovedAsync(service);
        // `dom-003` (التحليل المالي والتمويل) stands in for a value the
        // business has marked related. The real table is generated from their
        // workbook; this proves the MECHANISM, which is what the code owns.
        var criteria = seeded.Select(c => c.SourceFieldCode == "domain"
            ? Classified(c, "dom-003")
            : c).ToList();
        // «المجال» is a Section 1 field, so it is a FLAT answer — there is
        // no field-of-experience inside Practical Experience to aggregate.
        var flat = new Dictionary<string, string>(
            answers ?? new Dictionary<string, string>(), StringComparer.Ordinal);
        if (fields.Length > 0)
        {
            flat["domain"] = fields[0];
        }
        return ScreeningScorer.Score(
            model, criteria,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal),
            ToAnswers(flat),
            ScoringEntries.Empty);
    }

    private async Task<ObjectiveScore> ScoreAsync(
        string service, Dictionary<string, string> answers, ScoringEntries? entries = null)
    {
        var (model, criteria) = await ApprovedAsync(service);
        return ScreeningScorer.Score(
            model,
            criteria,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.Ordinal),
            ToAnswers(answers),
            entries ?? ScoringEntries.Empty);
    }

    private async Task<(EvaluationModel Model, IReadOnlyList<EvaluationCriterion> Criteria)> ApprovedAsync(
        string service)
    {
        await using var db = _database.CreateContext();
        var model = await db.EvaluationModels.AsNoTracking()
            .FirstAsync(m => m.Version == ApprovedVersion && m.Service == service);
        return (model, await CriteriaOfAsync(db, model.ModelId));
    }

    private static async Task<IReadOnlyList<EvaluationCriterion>> CriteriaOfAsync(
        Infrastructure.Persistence.ExpertHubDbContext db, Guid modelId) =>
        await db.EvaluationCriteria.AsNoTracking()
            .Where(c => c.ModelId == modelId)
            .OrderBy(c => c.OrderIndex)
            .ToListAsync();
}
