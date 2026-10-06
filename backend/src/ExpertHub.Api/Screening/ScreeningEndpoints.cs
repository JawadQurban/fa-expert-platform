using System.Text.Json;
using System.Text.Json.Serialization;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Applications;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using ExpertHub.Infrastructure.Screening;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Screening;

/*
 * EH-INT-03 — Screening & Initial Decision (CAP-02, J-05 + J-08), behind
 * `screeningService.ts`:
 *
 *   GET  v1/internal/applications/{id}/screening
 *   POST v1/internal/applications/{id}/screening/decision
 *
 * The three invariants, held where they cannot drift:
 *
 * - The objective score comes from `ScreeningScorer.Score`, whose signature
 *   takes the model and the answers — NOT the AI analysis (`BR-0201`/`BR-0202`);
 *   the advisory insight is a separate read of the sibling `AI_ANALYSIS` row.
 * - One score per SERVICE, never a blended total (J-05/F2/AC-3).
 * - An acceptance is complete only when every accepted service carries a full
 *   path — slots AND committee together, or an exemption with its reason
 *   (J-05/F5/AC-4, J-08) — and every requested-but-unlisted service is
 *   auto-rejected (AC-2), reported as such.
 */

/// <summary>
/// One criterion's line in the breakdown. <c>WeightedScore</c> is the value the
/// backend actually summed — the page DISPLAYS it and never re-derives it
/// (`BR-0201`: one authoritative calculation). Re-multiplying
/// <c>RawScore × Weight ÷ 100</c> on the client drifts from the approved
/// matrix, whose tables return already-weighted percentage points.
/// </summary>
internal sealed record CriterionWire(
    string Id, ServiceRequests.LocalizedTextWire Label, decimal Weight, decimal RawScore,
    decimal WeightedScore,
    // The applicant answered and the criterion's table had no entry for it —
    // an unknown code, or one nobody has classified yet. It scores nothing,
    // and the page must say so rather than show a plain zero: a missing
    // business decision is not a business result.
    bool Unresolved);

internal sealed record ServiceScoreWire(
    string Service, decimal Score, decimal Threshold,
    IReadOnlyList<CriterionWire> Criteria, string ModelVersion);

internal sealed record ScreeningFieldWire(
    string Id, ServiceRequests.LocalizedTextWire Label, string Value,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] bool? Qualitative);

/// <summary>One entry of a repeatable section, in entry order.</summary>
internal sealed record ScreeningEntryWire(
    int Index,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? EntryId,
    IReadOnlyList<ScreeningFieldWire> Fields);

internal sealed record ScreeningSectionWire(
    string Id, ServiceRequests.LocalizedTextWire Title, IReadOnlyList<ScreeningFieldWire> Fields,
    /// <summary>
    /// `DEF-01` — a repeatable section answers the same field once per entry,
    /// so <see cref="Fields"/> alone cannot carry an applicant's second
    /// qualification. It stays the FIRST entry (which is the whole answer for
    /// every non-repeatable section and for every application written before
    /// entries existed), and this carries the rest.
    /// </summary>
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    IReadOnlyList<ScreeningEntryWire>? Entries = null);

internal sealed record ScreeningAttachmentWire(
    string Id, string Name, ServiceRequests.LocalizedTextWire Type,
    string Format, long SizeKb, string? PreviewUrl);

internal sealed record PoolMemberWire(
    string Id, string Name, ServiceRequests.LocalizedTextWire RoleTitle);

internal sealed record SlaWire(string SlaId, string State, string DueAt, int DaysRemaining);

internal sealed record ScreeningDecisionSummaryWire(
    string Kind, string DecidedAt, string DecidedByName,
    IReadOnlyList<string> AcceptedServices,
    IReadOnlyList<string> AutoRejectedServices,
    IReadOnlyList<string> ExemptedServices,
    string? RejectionReason);

internal sealed record ScreeningDetailWire(
    string Id, string Reference, string ApplicantName, string ApplicantEmail,
    string Source, IReadOnlyList<string> Services, string Status, string SubmittedAt,
    SlaWire? Sla,
    IReadOnlyList<ServiceScoreWire> Scores,
    object? Insight,
    IReadOnlyList<ScreeningSectionWire> Sections,
    IReadOnlyList<ScreeningAttachmentWire> Attachments,
    IReadOnlyList<PoolMemberWire> CommitteePool,
    bool DecisionPending,
    ScreeningDecisionSummaryWire? Decision);

internal sealed record AcceptedServiceDecisionWire(
    string? Service, string? Path, IReadOnlyList<string>? Slots,
    IReadOnlyList<string>? CommitteeMemberIds, string? ExemptionReason,
    string? ExemptionReasonOther);

internal sealed record ScreeningDecisionInputWire(
    string? Kind,
    IReadOnlyList<AcceptedServiceDecisionWire>? Services,
    string? Reason, string? ReasonOther);

internal sealed record ScreeningDecisionResultWire(
    string ApplicationId, string Status,
    IReadOnlyList<string> AcceptedServices,
    IReadOnlyList<string> AutoRejectedServices,
    IReadOnlyList<string> ExemptedServices,
    string DecidedAt);

/// <summary>The J-05/J-08 internal surface.</summary>
public static class ScreeningEndpoints
{
    public static RouteGroupBuilder MapScreeningEndpoints(this RouteGroupBuilder v1)
    {
        var screening = v1.MapGroup("/internal/applications/{id}/screening")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy)
            // F-0201 الفرز الأولي — the screening feature, whole.
            .RequireFeature("F-0201");

        screening.MapGet("/", async (string id, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var application = await FindSubmittedAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            return Results.Ok(await BuildDetailAsync(db, application, ct));
        }).WithName("ScreeningDetail");

        screening.MapPost("/decision", async (
            string id,
            ScreeningDecisionInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            CancellationToken ct) =>
        {
            var application = await FindSubmittedAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            var serviceRows = await db.ApplicationServices
                .Where(s => s.ApplicationId == application.ApplicationId)
                .ToListAsync(ct);
            if (await db.ScreeningResults.AnyAsync(
                r => serviceRows.Select(s => s.ApplicationServiceId).Contains(r.ApplicationServiceId), ct))
            {
                // J-05/F6/AC-2 — a decided screening renders read-only.
                return Results.Problem(statusCode: 409, detail: "Already decided.");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;
            var scores = await ComputeScoresAsync(db, application, serviceRows, ct);

            if (string.Equals(input.Kind, "reject", StringComparison.Ordinal))
            {
                var reason = ServiceRequestRejectionReasons.All
                    .FirstOrDefault(r => r.Id == input.Reason);
                if (reason is null
                    || (reason.RequiresText && string.IsNullOrWhiteSpace(input.ReasonOther)))
                {
                    // J-05/F5/AC-8 / BR-0219 — no rejection without its reason.
                    return Results.Problem(statusCode: 400, detail: "reason-missing");
                }
                foreach (var row in serviceRows)
                {
                    RecordResult(db, row, scores, "reject", now, actor.UserId,
                        rejectionReasonId: reason.Id, rejectionReasonText: input.ReasonOther);
                    row.Outcome = ServiceOutcomes.Rejected;
                    row.DecidedAt = now;
                }
                application.Status = ApplicationStatuses.Rejected;
                application.RejectionReason = reason.RequiresText
                    ? input.ReasonOther
                    : reason.LabelAr;
                application.UpdatedAt = now;
                await db.SaveChangesAsync(ct);
                return Results.Ok(new ScreeningDecisionResultWire(
                    application.ApplicationId.ToString(), application.Status,
                    [], [.. serviceRows.Select(s => s.Service)], [], ApplicationEndpoints.Iso(now)));
            }

            if (!string.Equals(input.Kind, "accept", StringComparison.Ordinal))
            {
                return Results.Problem(statusCode: 400, detail: "Unknown decision.");
            }

            var decisions = input.Services ?? [];
            var requested = serviceRows.Select(s => s.Service).ToList();
            if (decisions.Count == 0
                || decisions.Any(d => d.Service is null || !requested.Contains(d.Service)))
            {
                return Results.Problem(statusCode: 400, detail: "no-service-selected");
            }
            // J-05/F5/AC-4 — every accepted service carries one COMPLETE path.
            foreach (var decision in decisions)
            {
                if (string.Equals(decision.Path, "interview", StringComparison.Ordinal))
                {
                    if (decision.Slots is not { Count: > 0 }
                        || decision.CommitteeMemberIds is not { Count: > 0 })
                    {
                        return Results.Problem(statusCode: 400, detail: "slots-or-committee-missing");
                    }
                }
                else if (string.Equals(decision.Path, "exemption", StringComparison.Ordinal))
                {
                    if (decision.ExemptionReason is null
                        || !ExemptionReasons.All.Contains(decision.ExemptionReason)
                        || (decision.ExemptionReason == "other"
                            && string.IsNullOrWhiteSpace(decision.ExemptionReasonOther)))
                    {
                        return Results.Problem(statusCode: 400, detail: "exemption-reason-missing");
                    }
                }
                else
                {
                    return Results.Problem(statusCode: 400, detail: "Unknown path.");
                }
            }

            var accepted = new List<string>();
            var exempted = new List<string>();
            var autoRejected = new List<string>();
            foreach (var row in serviceRows)
            {
                var decision = decisions.FirstOrDefault(d => d.Service == row.Service);
                if (decision is null)
                {
                    // AC-2 — everything not accepted is auto-rejected, visibly.
                    RecordResult(db, row, scores, "reject", now, actor.UserId);
                    row.Outcome = ServiceOutcomes.Rejected;
                    row.DecidedAt = now;
                    autoRejected.Add(row.Service);
                }
                else if (string.Equals(decision.Path, "exemption", StringComparison.Ordinal))
                {
                    RecordResult(db, row, scores, "exempt_interview", now, actor.UserId,
                        exemptionReasonId: decision.ExemptionReason,
                        exemptionReasonText: decision.ExemptionReasonOther);
                    exempted.Add(row.Service);
                }
                else
                {
                    RecordResult(db, row, scores, "accept", now, actor.UserId);
                    accepted.Add(row.Service);
                }
            }

            var interviewDecisions = decisions
                .Where(d => string.Equals(d.Path, "interview", StringComparison.Ordinal))
                .ToList();

            // D-04 — a slot in the past was accepted, offered to the applicant,
            // and issued an interview ticket for a date that had already gone.
            // The picker's `min` is a convenience; this is the rule.
            foreach (var slot in interviewDecisions.SelectMany(d => d.Slots ?? []))
            {
                if (!DateTime.TryParse(
                        slot, null,
                        System.Globalization.DateTimeStyles.AdjustToUniversal,
                        out var parsed))
                {
                    return Results.Problem(
                        statusCode: 400, detail: "An interview time could not be read.");
                }
                if (parsed <= now)
                {
                    return Results.Problem(
                        statusCode: 422,
                        detail: "An interview time must be in the future.",
                        extensions: new Dictionary<string, object?> { ["reason"] = "slot-in-past" });
                }
            }

            if (interviewDecisions.Count > 0)
            {
                await CreateInterviewAsync(db, application, interviewDecisions, now, ct);
                application.Status = ApplicationStatuses.UnderReview;

                // J-06/F1/AC-1 — the applicant is told slots are available
                // (email + in-platform together), in the same transaction.
                await dispatcher.RaiseAsync(
                    "EV-0201",
                    new NotificationEventContext(
                        SourceEntityId: application.ApplicationId,
                        RecordSubjectUserId: application.ApplicantUserId,
                        ActingStaffUserId: actor.UserId),
                    new Dictionary<string, string>
                    {
                        ["referenceNumber"] = application.Reference ?? string.Empty,
                    },
                    ct);
            }
            else
            {
                // Every accepted service is exempted — straight to the
                // approval committee (J-08/F2), no interview stage at all.
                application.Status = ApplicationStatuses.ApprovalInProgress;
            }
            application.UpdatedAt = now;
            await db.SaveChangesAsync(ct);

            return Results.Ok(new ScreeningDecisionResultWire(
                application.ApplicationId.ToString(),
                application.Status,
                accepted, autoRejected, exempted,
                ApplicationEndpoints.Iso(now)));
        }).WithName("ScreeningDecision");

        return v1;
    }

    /* ── assembly ──────────────────────────────────────────────────────────── */

    private static async Task<Application?> FindSubmittedAsync(
        string id, ExpertHubDbContext db, CancellationToken ct) =>
        Guid.TryParse(id, out var applicationId)
            ? await db.Applications.FirstOrDefaultAsync(
                a => a.ApplicationId == applicationId && a.Status != ApplicationStatuses.Draft, ct)
            : null;

    /// <summary>The official scores — `ScreeningScorer` only; no AI anywhere
    /// near this call (`BR-0201`).</summary>
    internal static async Task<Dictionary<string, ObjectiveScore>> ComputeScoresAsync(
        ExpertHubDbContext db,
        Application application,
        IReadOnlyList<ApplicationServiceEntry> serviceRows,
        CancellationToken ct)
    {
        /*
         * ⚠️ The placeholder completeness score counts only the fields it was
         * written against — DM-GAP-01's original set. Later form versions add
         * OPTIONAL fields no approved model weighs; counting them lowered a
         * required-only trainer from 85.7 to 67.5, under the 70 threshold, for
         * leaving optional boxes blank. Until the approved Screening Matrix
         * (DM-GAP-02) exists, fields added after that set are not scored.
         */
        var scoredCodes = db.FormFields
            .Where(f => f.SchemaVersion == FormSchemaVersions.Initial)
            .Select(f => f.FieldCode);
        var fields = await db.FormFields
            .Where(f => f.SchemaVersion == application.SchemaVersion && scoredCodes.Contains(f.FieldCode))
            .Select(f => new { f.SectionCode, f.FieldCode })
            .ToListAsync(ct);
        var codesBySection = fields
            .GroupBy(f => f.SectionCode)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<string>)[.. g.Select(f => f.FieldCode)]);
        var valueRows = await db.ApplicationFieldValues
            .Where(v => v.ApplicationId == application.ApplicationId)
            .ToListAsync(ct);

        /*
         * A repeatable section answers the SAME field code once per entry, so
         * the flat map keeps entry 0 — which is exactly the historical value
         * for every application written before entries existed — and the
         * per-entry map carries all of them for the best-of criteria.
         */
        var answers = valueRows
            .GroupBy(v => v.FieldCode, StringComparer.Ordinal)
            .ToDictionary(
                g => g.Key,
                g => JsonSerializer.Deserialize<JsonElement>(
                    g.OrderBy(v => v.EntryIndex).First().Value),
                StringComparer.Ordinal);
        var entryAnswers = valueRows
            .GroupBy(v => v.FieldCode, StringComparer.Ordinal)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<JsonElement>)[.. g
                    .OrderBy(v => v.EntryIndex)
                    .Select(v => JsonSerializer.Deserialize<JsonElement>(v.Value))],
                StringComparer.Ordinal);

        // An entry counts when it actually carries an answer — an empty card
        // the applicant added and left blank is not a certificate.
        var sectionOf = fields.ToDictionary(f => f.FieldCode, f => f.SectionCode, StringComparer.Ordinal);
        var sectionEntryCounts = valueRows
            .Where(v => !IsBlank(v.Value) && sectionOf.ContainsKey(v.FieldCode))
            .GroupBy(v => sectionOf[v.FieldCode], StringComparer.Ordinal)
            .ToDictionary(
                g => g.Key,
                g => g.Select(v => v.EntryIndex).Distinct().Count(),
                StringComparer.Ordinal);
        var attachmentCounts = await db.ApplicationAttachments
            .Where(a => a.ApplicationId == application.ApplicationId)
            .GroupBy(a => a.RuleCode)
            .Select(g => new { RuleCode = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RuleCode, x => x.Count, StringComparer.Ordinal, ct);
        var entries = new ScoringEntries(entryAnswers, sectionEntryCounts, attachmentCounts);

        /*
         * ⚠️ A DECIDED service is read through the model it was DECIDED under,
         * never the one active today. Activating the approved matrix must not
         * move a score a screening manager already acted on — the same pin
         * `INTERVIEW.model_version` gives an interview, here carried by
         * `SCREENING_RESULT.model_id`.
         */
        var serviceIds = serviceRows.Select(r => r.ApplicationServiceId).ToList();
        var decidedModelIds = await db.ScreeningResults
            .Where(r => serviceIds.Contains(r.ApplicationServiceId))
            .ToDictionaryAsync(r => r.ApplicationServiceId, r => r.ModelId, ct);
        var models = await db.EvaluationModels.ToListAsync(ct);
        var criteria = await db.EvaluationCriteria.ToListAsync(ct);
        var scores = new Dictionary<string, ObjectiveScore>(StringComparer.Ordinal);
        foreach (var row in serviceRows)
        {
            var model = decidedModelIds.TryGetValue(row.ApplicationServiceId, out var pinned)
                ? models.FirstOrDefault(m => m.ModelId == pinned)
                : models.FirstOrDefault(m => m.Service == row.Service && m.IsActive);
            if (model is null)
            {
                continue; // Speaker never reaches screening (BR-0113/BR-0413).
            }
            scores[row.Service] = ScreeningScorer.Score(
                model,
                [.. criteria.Where(c => c.ModelId == model.ModelId)],
                codesBySection,
                answers,
                entries);
        }
        return scores;
    }

    /// <summary>An unanswered value row — `""`, `[]`, `null` or `false`.</summary>
    private static bool IsBlank(string json)
    {
        var value = JsonSerializer.Deserialize<JsonElement>(json);
        return value.ValueKind switch
        {
            JsonValueKind.String => string.IsNullOrWhiteSpace(value.GetString()),
            JsonValueKind.Array => value.GetArrayLength() == 0,
            JsonValueKind.True or JsonValueKind.Number => false,
            _ => true,
        };
    }

    private static void RecordResult(
        ExpertHubDbContext db,
        ApplicationServiceEntry row,
        Dictionary<string, ObjectiveScore> scores,
        string decision,
        DateTime now,
        Guid decidedBy,
        string? rejectionReasonId = null,
        string? rejectionReasonText = null,
        string? exemptionReasonId = null,
        string? exemptionReasonText = null)
    {
        // Every screenable service has an active model (BE-06 restricts the
        // selectable set to the four the seed covers).
        var score = scores[row.Service];
        var result = new ScreeningResult
        {
            ScreeningResultId = Guid.NewGuid(),
            ApplicationServiceId = row.ApplicationServiceId,
            ModelId = score.ModelId,
            ObjectiveScore = score.Total,
            Decision = decision,
            RejectionReasonId = rejectionReasonId,
            RejectionReasonText = rejectionReasonText,
            ExemptionReasonId = exemptionReasonId,
            ExemptionReasonText = exemptionReasonText,
            DecidedBy = decidedBy,
            DecidedAt = now,
        };
        db.ScreeningResults.Add(result);
        foreach (var line in score.Criteria)
        {
            db.ScreeningCriterionScores.Add(new ScreeningCriterionScore
            {
                ScoreId = Guid.NewGuid(),
                ScreeningResultId = result.ScreeningResultId,
                CriterionId = line.CriterionId,
                RawScore = line.RawScore,
                WeightedScore = line.WeightedScore,
            });
        }
    }

    private static async Task CreateInterviewAsync(
        ExpertHubDbContext db,
        Application application,
        List<AcceptedServiceDecisionWire> interviewDecisions,
        DateTime now,
        CancellationToken ct)
    {
        // One application-scoped interview: the slot set and the committee are
        // the union of what the decision named per service (the applicant
        // confirms ONE time for the application — J-06's shape).
        var due = await SelectionDueAsync(db, now, ct);
        // Pinned to the model active NOW, so activating a newer model later
        // never changes how this interview is scored.
        var model = await Interviews.InterviewEndpoints.ActiveModelAsync(
            db, interviewDecisions[0].Service!, ct);
        var interview = new Interview
        {
            InterviewId = Guid.NewGuid(),
            ApplicationId = application.ApplicationId,
            Status = InterviewStatuses.AwaitingSelection,
            SelectionDueAt = due,
            ModelVersion = model.Version,
            CreatedAt = now,
        };
        db.Interviews.Add(interview);
        foreach (var startsAt in interviewDecisions
            .SelectMany(d => d.Slots ?? [])
            .Select(s => DateTime.Parse(
                s, null,
                // The client sends an instant; keep it one. `RoundtripKind`
                // alone left an offset-less value `Unspecified`, which was then
                // re-labelled UTC on the way out — the three-hour shift QA
                // found (`D-03`). `AdjustToUniversal` makes the intent explicit.
                // ⚠️ `RoundtripKind` cannot be combined with
                // `AdjustToUniversal` — together they throw. The client sends
                // Z-suffixed instants, so this alone is both correct and enough.
                System.Globalization.DateTimeStyles.AdjustToUniversal))
            .Distinct())
        {
            db.InterviewSlots.Add(new InterviewSlot
            {
                SlotId = Guid.NewGuid(),
                InterviewId = interview.InterviewId,
                StartsAt = startsAt,
            });
        }
        foreach (var memberId in interviewDecisions
            .SelectMany(d => d.CommitteeMemberIds ?? [])
            .Distinct()
            .Select(Guid.Parse))
        {
            // The assignment IS the pending evaluation row (BR-0220).
            db.InterviewEvaluations.Add(new InterviewEvaluation
            {
                InterviewEvaluationId = Guid.NewGuid(),
                InterviewId = interview.InterviewId,
                EvaluatorUserId = memberId,
            });
        }
    }

    /// <summary>`SLA-0201` from the central matrix (`BR-0705`) — the ONE place
    /// the 3-business-day rule lives; no duration configured means no clock.</summary>
    private static async Task<DateTime?> SelectionDueAsync(
        ExpertHubDbContext db, DateTime now, CancellationToken ct)
    {
        var row = await db.SlaMatrix.FirstOrDefaultAsync(r => r.SlaId == "SLA-0201", ct);
        if (row is null || row.Status != SlaStatuses.Fixed || row.Duration is not { } duration)
        {
            return null;
        }
        return row.Unit == SlaUnits.BusinessDays
            ? BusinessCalendar.AddBusinessDays(now, duration)
            : now.AddDays(duration);
    }

    private static async Task<ScreeningDetailWire> BuildDetailAsync(
        ExpertHubDbContext db,
        Application application,
        CancellationToken ct)
    {
        var applicant = await db.Users.SingleAsync(u => u.UserId == application.ApplicantUserId, ct);
        var serviceRows = await db.ApplicationServices
            .Where(s => s.ApplicationId == application.ApplicationId)
            .ToListAsync(ct);
        var scores = await ComputeScoresAsync(db, application, serviceRows, ct);

        var sections = await db.FormSections
            .Where(s => s.SchemaVersion == application.SchemaVersion)
            .OrderBy(s => s.OrderIndex)
            .ToListAsync(ct);
        var fields = await db.FormFields
            .Where(f => f.SchemaVersion == application.SchemaVersion)
            .OrderBy(f => f.OrderIndex)
            .ToListAsync(ct);
        /*
         * `DEF-01` — the unique key of an answer is (application, field, ENTRY)
         * since `P-296`, so the same field code legitimately appears once per
         * entry. Keying a dictionary on the field code alone threw on the
         * second one: a 500 on this very screen for any applicant who listed
         * two qualifications. Grouped exactly the way the sibling reader
         * `ApplicationEndpoints.LoadValuesAsync` has grouped since the same day.
         */
        var valueRows = await db.ApplicationFieldValues
            .Where(v => v.ApplicationId == application.ApplicationId)
            .ToListAsync(ct);
        var values = valueRows
            .GroupBy(v => v.FieldCode, StringComparer.Ordinal)
            .ToDictionary(
                g => g.Key,
                g => JsonSerializer.Deserialize<JsonElement>(
                    g.OrderBy(v => v.EntryIndex).First().Value),
                StringComparer.Ordinal);
        var attachments = await db.ApplicationAttachments
            .Where(a => a.ApplicationId == application.ApplicationId)
            .ToListAsync(ct);
        var rules = await db.AttachmentRules
            .Where(r => r.SchemaVersion == application.SchemaVersion)
            .ToListAsync(ct);

        var pool = await BuildPoolAsync(db, "F-0204", ct);

        var results = await (
            from result in db.ScreeningResults
            join service in db.ApplicationServices on result.ApplicationServiceId equals service.ApplicationServiceId
            where service.ApplicationId == application.ApplicationId
            select new { result, service.Service }).ToListAsync(ct);

        ScreeningDecisionSummaryWire? decisionSummary = null;
        if (results.Count > 0)
        {
            var decider = await db.Users.SingleAsync(
                u => u.UserId == results[0].result.DecidedBy, ct);
            var rejectedAll = results.All(r => r.result.Decision == "reject");
            decisionSummary = new ScreeningDecisionSummaryWire(
                rejectedAll ? "reject" : "accept",
                ApplicationEndpoints.Iso(results[0].result.DecidedAt),
                decider.FullNameAr,
                [.. results.Where(r => r.result.Decision == "accept").Select(r => r.Service)],
                [.. results.Where(r => r.result.Decision == "reject" && r.result.RejectionReasonId == null).Select(r => r.Service)],
                [.. results.Where(r => r.result.Decision == "exempt_interview").Select(r => r.Service)],
                rejectedAll ? results[0].result.RejectionReasonId : null);
        }

        // The advisory sibling — read separately, merged nowhere (BR-0202).
        var analysis = await db.AiAnalyses.FirstOrDefaultAsync(
            a => a.ApplicationId == application.ApplicationId && a.Status == "produced", ct);

        return new ScreeningDetailWire(
            application.ApplicationId.ToString(),
            application.Reference ?? string.Empty,
            applicant.FullNameAr,
            applicant.Email,
            application.Origin == ApplicationOrigins.InternalNomination
                ? "internal-nomination"
                : "self-service",
            [.. serviceRows.Select(s => s.Service)],
            application.Status,
            ApplicationEndpoints.Iso(application.SubmittedAt ?? application.CreatedAt),
            await ScreeningSlaAsync(db, application, ct),
            [.. serviceRows
                .Where(s => scores.ContainsKey(s.Service))
                .Select(s =>
                {
                    var score = scores[s.Service];
                    return new ServiceScoreWire(
                        s.Service, score.Total, score.Threshold,
                        [.. score.Criteria.Select(c => new CriterionWire(
                            c.SectionCode,
                            new ServiceRequests.LocalizedTextWire(c.LabelAr, c.LabelEn),
                            c.Weight, c.RawScore, c.WeightedScore, c.Unresolved))],
                        score.ModelVersion);
                })],
            analysis is null ? null : BuildInsight(analysis),
            [.. sections.Select(section => new ScreeningSectionWire(
                section.SectionCode,
                new ServiceRequests.LocalizedTextWire(section.TitleAr, section.TitleEn),
                [.. fields
                    .Where(f => f.SectionCode == section.SectionCode
                        && values.ContainsKey(f.FieldCode))
                    .Select(f => new ScreeningFieldWire(
                        f.FieldCode,
                        new ServiceRequests.LocalizedTextWire(f.LabelAr, f.LabelEn),
                        DisplayValue(values[f.FieldCode]),
                        // The AI scope: free-text answers (BR-0202 —
                        // qualitative questions only, never attachments).
                        f.InputType == "textarea" ? true : null))],
                EntriesOf(section, fields, valueRows)))],
            [.. attachments.Select(a =>
            {
                var rule = rules.FirstOrDefault(r => r.RuleCode == a.RuleCode);
                var extension = Path.GetExtension(a.FileName).TrimStart('.');
                return new ScreeningAttachmentWire(
                    a.ApplicationAttachmentId.ToString(),
                    a.FileName,
                    new ServiceRequests.LocalizedTextWire(
                        rule?.LabelAr ?? a.RuleCode, rule?.LabelEn ?? a.RuleCode),
                    extension,
                    Math.Max(1, a.SizeBytes / 1024),
                    /*
                     * The download route, now that documents are actually
                     * stored (`P-206`/`P-208`). ⚠️ This was left null with the
                     * comment «G26 — no dead preview links», which was right
                     * until storage existed and then was never revisited: QA
                     * found screeners deciding on applications without being
                     * able to open a single CV (`D-09`). A null here means the
                     * attachment row carries no file, not that we are unsure.
                     */
                    a.AttachmentId is { } attachmentId
                        ? $"/{ExpertHub.Core.ApiVersions.V1}/attachments/{attachmentId:D}"
                        : null);
            })],
            pool,
            DecisionPending: results.Count == 0,
            decisionSummary);
    }

    /// <summary>`SLA-0202` — null while its duration is undefined (`DM-GAP-10`,
    /// P-156): no countdown is produced from a number nobody approved.</summary>
    private static async Task<SlaWire?> ScreeningSlaAsync(
        ExpertHubDbContext db, Application application, CancellationToken ct)
    {
        var row = await db.SlaMatrix.FirstOrDefaultAsync(r => r.SlaId == "SLA-0202", ct);
        if (row is null || row.Status != SlaStatuses.Fixed || row.Duration is not { } duration
            || application.SubmittedAt is not { } submittedAt)
        {
            return null;
        }
        var due = row.Unit == SlaUnits.BusinessDays
            ? BusinessCalendar.AddBusinessDays(submittedAt, duration)
            : submittedAt.AddDays(duration);
        var (state, daysRemaining) = BusinessCalendar.Countdown(due, DateTime.UtcNow);
        return new SlaWire("SLA-0202", state, ApplicationEndpoints.Iso(due), daysRemaining);
    }

    private static object BuildInsight(AiAnalysis analysis)
    {
        var detail = JsonSerializer.Deserialize<JsonElement>(analysis.Detail);
        return new
        {
            summary = new { ar = analysis.SummaryAr, en = analysis.SummaryEn },
            strengths = detail.TryGetProperty("strengths", out var s) ? s : default,
            considerations = detail.TryGetProperty("considerations", out var c) ? c : default,
            analyzedFieldIds = JsonSerializer.Deserialize<string[]>(analysis.AnalyzedFieldCodes),
            generatedAt = ApplicationEndpoints.Iso(analysis.ProducedAt),
            modelVersion = analysis.ModelVersion,
        };
    }

    /// <summary>Internal staff, as selectable members — role title from their
    /// highest-sounding held role, the pre-BE-09 minimum.</summary>
    /// <summary>
    /// `DEF-01` — every entry of a REPEATABLE section, in entry order, so the
    /// screener reads the whole of an applicant's education rather than its
    /// first row. Returns null for a section the schema does not repeat, which
    /// keeps the payload of every other section byte-identical.
    /// </summary>
    private static IReadOnlyList<ScreeningEntryWire>? EntriesOf(
        FormSection section,
        IReadOnlyList<FormField> fields,
        IReadOnlyList<ApplicationFieldValue> rows)
    {
        if (section.Repeatable is not { Length: > 0 })
        {
            return null;
        }
        var sectionFields = fields
            .Where(f => f.SectionCode == section.SectionCode)
            .ToList();
        var codes = sectionFields.Select(f => f.FieldCode).ToHashSet(StringComparer.Ordinal);

        return
        [
            .. rows
                .Where(v => codes.Contains(v.FieldCode))
                .GroupBy(v => v.EntryIndex)
                .OrderBy(g => g.Key)
                .Select(g => new ScreeningEntryWire(
                    g.Key,
                    g.Select(v => v.EntryId).FirstOrDefault(id => id is { Length: > 0 }),
                    [
                        .. sectionFields
                            .Where(f => g.Any(v => v.FieldCode == f.FieldCode))
                            .Select(f => new ScreeningFieldWire(
                                f.FieldCode,
                                new ServiceRequests.LocalizedTextWire(f.LabelAr, f.LabelEn),
                                DisplayValue(JsonSerializer.Deserialize<JsonElement>(
                                    g.First(v => v.FieldCode == f.FieldCode).Value)),
                                f.InputType == "textarea" ? true : null)),
                    ])),
        ];
    }

    /// <summary>
    /// The people a sequence may be formed from.
    ///
    /// <para>
    /// `DEF-05` — <paramref name="featureCode"/> is the feature the surface
    /// this pool feeds actually requires (`F-0204` for the committee, `F-0301`
    /// for the signing sequence). Offering anyone else let a creator seat
    /// somebody who would be refused on their own turn, with no way to re-form:
    /// a permanent deadlock. Narrowing the POOL fixes it without touching a
    /// single downstream check.
    /// </para>
    /// </summary>
    internal static async Task<IReadOnlyList<PoolMemberWire>> BuildPoolAsync(
        ExpertHubDbContext db, string featureCode, CancellationToken ct)
    {
        var eligible = await FeatureAuthorization
            .HoldersOfAsync(db, featureCode, ct);
        var staff = await db.Users
            .Where(u => u.IsEmployee && u.IsActive && eligible.Contains(u.UserId))
            .OrderBy(u => u.FullNameAr)
            .ToListAsync(ct);
        var titles = await (
            from userRole in db.UserRoles
            join role in db.Roles on userRole.RoleId equals role.RoleId
            select new { userRole.UserId, role.NameAr, role.NameEn }).ToListAsync(ct);
        return [.. staff.Select(u =>
        {
            var title = titles.FirstOrDefault(t => t.UserId == u.UserId);
            return new PoolMemberWire(
                u.UserId.ToString(),
                u.FullNameAr,
                new ServiceRequests.LocalizedTextWire(
                    title?.NameAr ?? "موظف", title?.NameEn ?? "Staff"));
        })];
    }

    internal static string DisplayValue(JsonElement value) => value.ValueKind switch
    {
        JsonValueKind.String => value.GetString() ?? string.Empty,
        JsonValueKind.True => "نعم",
        JsonValueKind.False => "لا",
        JsonValueKind.Array => string.Join("، ", value.EnumerateArray()
            .Select(item => item.GetString() ?? string.Empty)),
        _ => value.GetRawText(),
    };
}
