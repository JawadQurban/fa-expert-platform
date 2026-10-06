using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Api.ServiceRequests;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Committee;

/*
 * EH-INT-05 — Approval Committee Decision (CAP-02, J-09), behind
 * `committeeService.ts`:
 *
 *   GET  v1/internal/applications/{id}/committee
 *   POST v1/internal/applications/{id}/committee/formation
 *   POST v1/internal/applications/{id}/committee/decisions
 *   POST v1/internal/applications/{id}/committee/resubmit
 *
 * The five invariants, held server-side:
 * - Only a MANDATORY member's rejection halts (`BR-0211` revised, F4/AC-4);
 *   an optional member's rejection is a logged note and the sequence walks on.
 * - The decision is on the application as a WHOLE (`BR-0209`) — nothing here
 *   is per service until the final act writes the accreditation rows.
 * - A modification request pauses the sequence and a resubmit resumes FROM
 *   the requesting member, approvals preserved (`BR-0218`, F7/AC-4).
 * - Templates are COPIES (F2/AC-5): reuse copies members in; edits never
 *   touch the saved template.
 * - Bank data runs in parallel (F6) — served as its own flag, `not-requested`
 *   until BE-08 builds the J-10 gate; never collapsed into "ready".
 */

internal sealed record SequenceMemberWire(
    string ApproverId, string Name, LocalizedTextWire RoleTitle,
    string Obligation, int Position, string State, string? DecidedAt, string? Note);

internal sealed record ServiceContextWire(
    string Service, decimal ScreeningScore, decimal? InterviewAverage,
    decimal InterviewMaxScore, bool Exempted, LocalizedTextWire? ExemptionReason);

internal sealed record OptionalRejectionWire(string ApproverId, string Name, string? Note);

internal sealed record OutcomeWire(
    string State, string? DecidedAt, string? RejectedByName, string? RejectionReason,
    IReadOnlyList<OptionalRejectionWire> OptionalRejections);

internal sealed record BankDataWire(string State, string? RequestedAt, string? CompletedAt);

internal sealed record CommitteeViewerWire(
    bool IsCreator, string? ApproverId, bool CanDecide, bool CanResubmit);

internal sealed record TemplateMemberWire(string ApproverId, string Obligation);

internal sealed record SequenceTemplateWire(
    string Id, string Name, IReadOnlyList<TemplateMemberWire> Members);

internal sealed record CommitteeDetailWire(
    string ApplicationId, string Reference, string ApplicantName,
    IReadOnlyList<string> AcceptedServices,
    IReadOnlyList<ServiceContextWire> Context,
    IReadOnlyList<SequenceMemberWire> Sequence,
    IReadOnlyList<Screening.PoolMemberWire> ApproverPool,
    IReadOnlyList<SequenceTemplateWire> Templates,
    OutcomeWire Outcome,
    BankDataWire BankData,
    CommitteeViewerWire Viewer);

internal sealed record FormationMemberInputWire(string? ApproverId, string? Obligation);

internal sealed record FormationInputWire(
    IReadOnlyList<FormationMemberInputWire>? Members, string? SaveAsTemplateName);

internal sealed record CommitteeDecisionInputWire(
    string? Kind, string? Note, string? Reason, string? ReasonOther);

/// <summary>The J-09 internal surface.</summary>
public static class CommitteeEndpoints
{
    /// <summary>J-08 «Interview Exemption Reasons», the approved wording. Only the
    /// id is stored, so a wording change never touches a recorded decision.</summary>
    private static readonly Dictionary<string, (string Ar, string En)> ExemptionLabels = new()
    {
        ["expert"] = ("خبير", "Expert"),
        ["prior-collaboration"] = ("تعاون سابق موثَّق مع الأكاديمية", "Documented prior collaboration with the Academy"),
        ["other"] = ("أخرى (نص حر)", "Other (free text)"),
    };

    public static RouteGroupBuilder MapCommitteeEndpoints(this RouteGroupBuilder v1)
    {
        var committee = v1.MapGroup("/internal/applications/{id}/committee")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy)
            // F-0204 قرار لجنة — forming and deciding are one feature.
            .RequireFeature("F-0204");

        committee.MapGet("/", async (
            string id, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var application = await FindAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            return Results.Ok(await BuildDetailAsync(db, application, actor.UserId, ct));
        }).WithName("CommitteeDetail");

        committee.MapPost("/formation", async (
            string id,
            FormationInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var application = await FindAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            if (await db.CommitteeSequences.AnyAsync(
                s => s.ApplicationId == application.ApplicationId, ct))
            {
                return Results.Problem(statusCode: 409, detail: "Already formed.");
            }
            if (application.Status != ApplicationStatuses.ApprovalInProgress)
            {
                return Results.Problem(statusCode: 409, detail: "The application has not reached approval.");
            }
            // J-09/F1/AC-2 — «the creator forms the approval committee», and
            // BR-0215 names the creator: the person who owns the application
            // from its screening decision until it reaches CAP-04. Holding the
            // feature is necessary, not sufficient.
            var former = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (!await Interviews.InterviewEndpoints.IsScreeningDeciderAsync(
                    db, application.ApplicationId, former.UserId, ct))
            {
                return Results.Problem(statusCode: 403, detail: "only-application-creator");
            }
            var members = (input.Members ?? [])
                .Where(m => m.ApproverId is not null)
                .ToList();
            // The shared formation gate (P-J1): members, ≥1 mandatory (an
            // all-optional sequence could never reach approval), no
            // duplicates, a name when saving a template.
            var ids = members.Select(m => m.ApproverId!).ToList();
            if (members.Count == 0
                || !members.Any(m => string.Equals(m.Obligation, "mandatory", StringComparison.Ordinal))
                || ids.Distinct().Count() != ids.Count)
            {
                return Results.Problem(statusCode: 400, detail: "invalid-formation");
            }
            var memberIds = ids.Select(Guid.Parse).ToList();
            /*
             * `DEF-05` — every member must be able to DECIDE, not merely exist.
             * The group requires `F-0204`, so somebody without it would be
             * refused on their own turn and the sequence could never be
             * re-formed (409 «Already formed.»). Refusing here writes nothing,
             * so the creator simply forms a correct sequence instead.
             */
            var eligible = await FeatureAuthorization.HoldersOfAsync(
                db, "F-0204", ct);
            var known = await db.Users.CountAsync(
                u => memberIds.Contains(u.UserId)
                    && u.IsEmployee && u.IsActive && eligible.Contains(u.UserId), ct);
            if (known != memberIds.Count)
            {
                return Results.Problem(statusCode: 400, detail: "invalid-formation");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;

            var sequence = new CommitteeSequence
            {
                SequenceId = Guid.NewGuid(),
                ApplicationId = application.ApplicationId,
                Status = CommitteeSequenceStatuses.InProgress,
                CurrentStepIndex = 1,
                CreatedBy = actor.UserId,
                CreatedAt = now,
            };
            db.CommitteeSequences.Add(sequence);
            for (var index = 0; index < members.Count; index++)
            {
                db.CommitteeSteps.Add(new CommitteeStep
                {
                    StepId = Guid.NewGuid(),
                    SequenceId = sequence.SequenceId,
                    MemberUserId = memberIds[index],
                    OrderIndex = index + 1,
                    IsMandatory = string.Equals(
                        members[index].Obligation, "mandatory", StringComparison.Ordinal),
                });
            }
            if (!string.IsNullOrWhiteSpace(input.SaveAsTemplateName))
            {
                // F2/AC-5 — saved as a COPY of this arrangement.
                db.CommitteeTemplates.Add(new CommitteeTemplate
                {
                    TemplateId = Guid.NewGuid(),
                    Name = input.SaveAsTemplateName.Trim(),
                    Members = JsonSerializer.Serialize(members.Select(m => new
                    {
                        approverId = m.ApproverId,
                        obligation = m.Obligation,
                    })),
                    Kind = "committee",
                    CreatedBy = actor.UserId,
                    CreatedAt = now,
                });
            }
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, actor.UserId, ct));
        }).WithName("FormCommittee");

        committee.MapPost("/decisions", async (
            string id,
            CommitteeDecisionInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var application = await FindAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            var sequence = await db.CommitteeSequences.FirstOrDefaultAsync(
                s => s.ApplicationId == application.ApplicationId, ct);
            if (sequence is null || sequence.Status != CommitteeSequenceStatuses.InProgress)
            {
                return Results.Problem(statusCode: 409, detail: "No decision is awaited.");
            }
            var steps = await db.CommitteeSteps
                .Where(s => s.SequenceId == sequence.SequenceId)
                .OrderBy(s => s.OrderIndex)
                .ToListAsync(ct);
            var current = steps.First(s => s.OrderIndex == sequence.CurrentStepIndex);
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (current.MemberUserId != actor.UserId)
            {
                // F4/AC-2 — sequential: only the member whose turn it is.
                return Results.Problem(statusCode: 403, detail: "Not this member's turn.");
            }
            var now = DateTime.UtcNow;

            if (string.Equals(input.Kind, "approve", StringComparison.Ordinal))
            {
                current.Decision = "approve";
                current.Note = input.Note;
                current.ActedAt = now;
                await AdvanceOrConcludeAsync(db, application, sequence, steps, actor.UserId, now, ct);
            }
            else if (string.Equals(input.Kind, "reject", StringComparison.Ordinal))
            {
                var reason = ServiceRequestRejectionReasons.All
                    .FirstOrDefault(r => r.Id == input.Reason);
                if (reason is null
                    || (reason.RequiresText && string.IsNullOrWhiteSpace(input.ReasonOther)))
                {
                    return Results.Problem(statusCode: 400, detail: "reason-missing");
                }
                current.Decision = "reject";
                current.RejectionReasonId = reason.Id;
                current.RejectionReasonText = input.ReasonOther;
                current.Note = input.Note;
                current.ActedAt = now;
                if (current.IsMandatory)
                {
                    // F4/AC-4 — a mandatory rejection halts the application.
                    sequence.Status = CommitteeSequenceStatuses.Rejected;
                    sequence.DecidedAt = now;
                    application.Status = ApplicationStatuses.Rejected;
                    application.RejectionReason = reason.RequiresText
                        ? input.ReasonOther
                        : reason.LabelAr;
                    var serviceRows = await db.ApplicationServices
                        .Where(s => s.ApplicationId == application.ApplicationId)
                        .ToListAsync(ct);
                    foreach (var row in serviceRows.Where(r => r.Outcome == ServiceOutcomes.Pending))
                    {
                        row.Outcome = ServiceOutcomes.Rejected;
                        row.DecidedAt = now;
                    }
                    application.UpdatedAt = now;
                }
                else
                {
                    // F4/AC-4's other half — logged, with NO effect on the walk.
                    await AdvanceOrConcludeAsync(db, application, sequence, steps, actor.UserId, now, ct);
                }
            }
            else if (string.Equals(input.Kind, "request-modification", StringComparison.Ordinal))
            {
                if (string.IsNullOrWhiteSpace(input.Note))
                {
                    // BR-0217 — the note is what the creator acts on.
                    return Results.Problem(statusCode: 400, detail: "note-missing");
                }
                current.Decision = "request_modification";
                current.Note = input.Note;
                current.ActedAt = now;
                sequence.Status = CommitteeSequenceStatuses.ModificationRequested;
            }
            else
            {
                return Results.Problem(statusCode: 400, detail: "Unknown decision.");
            }

            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, actor.UserId, ct));
        }).WithName("CommitteeDecision");

        committee.MapPost("/resubmit", async (
            string id, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var application = await FindAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            var sequence = await db.CommitteeSequences.FirstOrDefaultAsync(
                s => s.ApplicationId == application.ApplicationId, ct);
            if (sequence is null || sequence.Status != CommitteeSequenceStatuses.ModificationRequested)
            {
                return Results.Problem(statusCode: 409, detail: "No modification request is pending.");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (sequence.CreatedBy != actor.UserId)
            {
                // F7/AC-3 — the creator addresses the request and re-submits.
                return Results.Problem(statusCode: 403, detail: "Only the creator may re-submit.");
            }
            var requesting = await db.CommitteeSteps.FirstAsync(
                s => s.SequenceId == sequence.SequenceId && s.Decision == "request_modification", ct);
            // BR-0218 — resume FROM the requesting member; approvals already
            // given are untouched rows behind the cursor.
            requesting.Decision = null;
            requesting.Note = null;
            requesting.ActedAt = null;
            sequence.CurrentStepIndex = requesting.OrderIndex;
            sequence.Status = CommitteeSequenceStatuses.InProgress;
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, actor.UserId, ct));
        }).WithName("CommitteeResubmit");

        return v1;
    }

    /* ── the walk ──────────────────────────────────────────────────────────── */

    private static async Task AdvanceOrConcludeAsync(
        ExpertHubDbContext db,
        Application application,
        CommitteeSequence sequence,
        IReadOnlyList<CommitteeStep> steps,
        Guid actorUserId,
        DateTime now,
        CancellationToken ct)
    {
        var next = steps.FirstOrDefault(s => s.OrderIndex > sequence.CurrentStepIndex);
        if (next is not null)
        {
            sequence.CurrentStepIndex = next.OrderIndex;
            return;
        }
        // The walk is over, and no mandatory rejection halted it — "finally
        // approved" (F4/AC-4). The per-service accreditation rows conclude
        // CAP-02; the agreement chain (J-10/J-11, BE-08) takes it from here.
        sequence.Status = CommitteeSequenceStatuses.Approved;
        sequence.DecidedAt = now;

        // J-09/F4/AC-5 + F6 — bank-data collection is triggered IN PARALLEL
        // with the result returning to the creator, not as a later step.
        var bank = await db.BankData.FirstOrDefaultAsync(
            b => b.UserId == application.ApplicantUserId, ct);
        if (bank is null)
        {
            db.BankData.Add(new BankDataRecord
            {
                UserId = application.ApplicantUserId,
                RequestedAt = now,
            });
        }
        else
        {
            bank.RequestedAt ??= now;
        }

        var serviceRows = await db.ApplicationServices
            .Where(s => s.ApplicationId == application.ApplicationId)
            .ToListAsync(ct);
        foreach (var row in serviceRows.Where(r => r.Outcome == ServiceOutcomes.Pending))
        {
            row.Outcome = ServiceOutcomes.Accepted;
            row.DecidedAt = now;
            db.AccreditationDecisions.Add(new AccreditationDecision
            {
                DecisionId = Guid.NewGuid(),
                ApplicationServiceId = row.ApplicationServiceId,
                Outcome = "accredited",
                // ⟨gap⟩ — no classification rules supplied (BR-0403); null
                // until the business defines the scale's assignment.
                Classification = null,
                DecidedBy = actorUserId,
                DecidedAt = now,
            });
        }
        application.UpdatedAt = now;
    }

    /* ── assembly ──────────────────────────────────────────────────────────── */

    private static async Task<Application?> FindAsync(
        string id, ExpertHubDbContext db, CancellationToken ct) =>
        Guid.TryParse(id, out var applicationId)
            ? await db.Applications.FirstOrDefaultAsync(
                a => a.ApplicationId == applicationId && a.Status != ApplicationStatuses.Draft, ct)
            : null;

    private static async Task<CommitteeDetailWire> BuildDetailAsync(
        ExpertHubDbContext db,
        Application application,
        Guid viewerUserId,
        CancellationToken ct)
    {
        var applicant = await db.Users.SingleAsync(u => u.UserId == application.ApplicantUserId, ct);
        var results = await (
            from result in db.ScreeningResults
            join service in db.ApplicationServices
                on result.ApplicationServiceId equals service.ApplicationServiceId
            where service.ApplicationId == application.ApplicationId
                && (result.Decision == "accept" || result.Decision == "exempt_interview")
                // A service that failed its interview was closed as not
                // accepted on forwarding — it is not before the committee.
                && service.Outcome != ServiceOutcomes.Rejected
            select new { result, service.Service }).ToListAsync(ct);

        // F3/AC-2 — the CONSOLIDATED interview result, never the individual
        // evaluations. Reuses the interview page's own aggregation.
        var interviewRow = await db.Interviews.FirstOrDefaultAsync(
            i => i.ApplicationId == application.ApplicationId, ct);
        var interviewAverages = new Dictionary<string, decimal>(StringComparer.Ordinal);
        // The scale of THIS application's interview model (100 on the approved
        // model, 5 on the draft) — never a constant.
        var interviewMaxScore = await Interviews.InterviewEndpoints.ResultMaxScoreAsync(
            db, application.ApplicationId, interviewRow, ct);
        if (interviewRow is not null && interviewRow.Status == InterviewStatuses.Completed)
        {
            var detail = await Interviews.InterviewEndpoints.BuildDetailAsync(
                db, application, interviewRow, viewerUserId, ct);
            foreach (var line in detail.Result ?? [])
            {
                interviewAverages[line.Service] = line.Average;
            }
        }

        var sequence = await db.CommitteeSequences.FirstOrDefaultAsync(
            s => s.ApplicationId == application.ApplicationId, ct);
        var steps = sequence is null
            ? []
            : await db.CommitteeSteps
                .Where(s => s.SequenceId == sequence.SequenceId)
                .OrderBy(s => s.OrderIndex)
                .ToListAsync(ct);
        var stepUsers = await db.Users
            .Where(u => steps.Select(s => s.MemberUserId).Contains(u.UserId))
            .ToListAsync(ct);
        var titles = await (
            from userRole in db.UserRoles
            join role in db.Roles on userRole.RoleId equals role.RoleId
            select new { userRole.UserId, role.NameAr, role.NameEn }).ToListAsync(ct);

        var templates = await db.CommitteeTemplates
            .Where(t => t.Kind == "committee")
            .OrderBy(t => t.Name)
            .ToListAsync(ct);

        var outcomeState = sequence?.Status switch
        {
            null => "not-formed",
            CommitteeSequenceStatuses.InProgress => "in-progress",
            CommitteeSequenceStatuses.ModificationRequested => "modification-requested",
            CommitteeSequenceStatuses.Approved => "approved",
            _ => "rejected",
        };
        var halting = steps.FirstOrDefault(s => s.Decision == "reject" && s.IsMandatory);
        var mySteps = steps.Where(s => s.MemberUserId == viewerUserId).ToList();

        return new CommitteeDetailWire(
            application.ApplicationId.ToString(),
            application.Reference ?? string.Empty,
            applicant.FullNameAr,
            [.. results.Select(r => r.Service)],
            [.. results.Select(r =>
            {
                var exempted = r.result.Decision == "exempt_interview";
                LocalizedTextWire? reason = null;
                if (exempted && r.result.ExemptionReasonId is { } reasonId)
                {
                    reason = reasonId == "other" && r.result.ExemptionReasonText is { } text
                        ? new LocalizedTextWire(text, text)
                        : new LocalizedTextWire(
                            ExemptionLabels[reasonId].Ar, ExemptionLabels[reasonId].En);
                }
                return new ServiceContextWire(
                    r.Service,
                    r.result.ObjectiveScore,
                    exempted ? null
                        : interviewAverages.TryGetValue(r.Service, out var avg) ? avg : null,
                    interviewMaxScore,
                    exempted,
                    reason);
            })],
            [.. steps.Select(s =>
            {
                var member = stepUsers.First(u => u.UserId == s.MemberUserId);
                var title = titles.FirstOrDefault(t => t.UserId == member.UserId);
                var state = s.Decision switch
                {
                    "approve" => "approved",
                    "reject" => "rejected",
                    "request_modification" => "modification-requested",
                    _ => sequence!.Status == CommitteeSequenceStatuses.InProgress
                        && s.OrderIndex == sequence.CurrentStepIndex
                        ? "current"
                        : "waiting",
                };
                return new SequenceMemberWire(
                    member.UserId.ToString(),
                    member.FullNameAr,
                    new LocalizedTextWire(title?.NameAr ?? "موظف", title?.NameEn ?? "Staff"),
                    s.IsMandatory ? "mandatory" : "optional",
                    s.OrderIndex,
                    state,
                    s.ActedAt is { } at ? ApplicationEndpoints.Iso(at) : null,
                    s.Note);
            })],
            await Screening.ScreeningEndpoints.BuildPoolAsync(
                db, "F-0204", ct),
            [.. templates.Select(t => new SequenceTemplateWire(
                t.TemplateId.ToString(),
                t.Name,
                [.. (JsonSerializer.Deserialize<List<TemplateMemberJson>>(t.Members) ?? [])
                    .Select(m => new TemplateMemberWire(m.ApproverId, m.Obligation))]))],
            new OutcomeWire(
                outcomeState,
                sequence?.DecidedAt is { } decidedAt ? ApplicationEndpoints.Iso(decidedAt) : null,
                halting is null
                    ? null
                    : stepUsers.First(u => u.UserId == halting.MemberUserId).FullNameAr,
                halting?.RejectionReasonId,
                [.. steps
                    .Where(s => s.Decision == "reject" && !s.IsMandatory)
                    .Select(s => new OptionalRejectionWire(
                        s.MemberUserId.ToString(),
                        stepUsers.First(u => u.UserId == s.MemberUserId).FullNameAr,
                        s.Note))]),
            await BankDataWireAsync(db, application.ApplicantUserId, ct),
            new CommitteeViewerWire(
                // BR-0215 — the formation right is served from the rule the
                // formation endpoint enforces, not assumed until a sequence exists.
                IsCreator: sequence is null
                    ? await Interviews.InterviewEndpoints.IsScreeningDeciderAsync(
                        db, application.ApplicationId, viewerUserId, ct)
                    : sequence.CreatedBy == viewerUserId,
                mySteps.Count > 0 ? viewerUserId.ToString() : null,
                CanDecide: sequence is not null
                    && sequence.Status == CommitteeSequenceStatuses.InProgress
                    && steps.Any(s => s.OrderIndex == sequence.CurrentStepIndex
                        && s.MemberUserId == viewerUserId),
                CanResubmit: sequence is not null
                    && sequence.Status == CommitteeSequenceStatuses.ModificationRequested
                    && sequence.CreatedBy == viewerUserId));
    }

    /// <summary>J-09/F6's real state, from the `BANK_DATA` row.</summary>
    internal static async Task<BankDataWire> BankDataWireAsync(
        ExpertHubDbContext db, Guid userId, CancellationToken ct)
    {
        var bank = await db.BankData.FirstOrDefaultAsync(b => b.UserId == userId, ct);
        var state = bank switch
        {
            null or { RequestedAt: null } => "not-requested",
            { CompletedAt: not null } => "complete",
            _ => "requested",
        };
        return new BankDataWire(
            state,
            bank?.RequestedAt is { } requested ? ApplicationEndpoints.Iso(requested) : null,
            bank?.CompletedAt is { } completed ? ApplicationEndpoints.Iso(completed) : null);
    }

    private sealed record TemplateMemberJson(string ApproverId, string Obligation);
}
