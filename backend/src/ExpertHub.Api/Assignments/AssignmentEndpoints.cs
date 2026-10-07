using System.Globalization;
using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Api.Profiles;
using ExpertHub.Api.ServiceRequests;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Assignments;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Assignments;

/*
 * EH-INT-09 — assignment requests and matching (CAP-05, J-16 + J-17 + J-19),
 * behind `assignmentService.ts` and `reRoutingService.ts`:
 *
 *   GET  v1/internal/assignment-requests
 *   POST v1/internal/assignment-requests
 *   GET  v1/internal/assignment-requests/{id}
 *   GET  v1/internal/assignment-requests/lookups/responsible-employees
 *   GET  v1/internal/assignment-requests/lookups/nominees
 *   GET  v1/internal/assignment-requests/{id}/matching
 *   POST v1/internal/assignment-requests/{id}/matching/run
 *   GET  v1/internal/assignment-requests/{id}/matching/candidates?q=
 *   POST v1/internal/assignment-requests/{id}/pool
 *   POST v1/internal/assignment-requests/{id}/pool/decision
 *   …and the same four, slot-scoped, under /slots/{n} for J-19's re-routing.
 *
 * The structural rules:
 * - Exactly THREE candidates per required person (`BR-0505`, F2/AC-2) — the
 *   pool is refused at any other size, on both the engine and manual paths.
 * - The pool is sent in ONE batch (F3/AC-1); there is no send-one-candidate
 *   operation to reach for.
 * - A decision is PER CANDIDATE (F4/AC-1), never one verdict on the pool.
 * - Re-routing is SLOT-scoped, never request-scoped (`P-95`) — hence the
 *   parallel slot routes rather than a flag on the request ones.
 * - ⚠️ There is no send-offer operation anywhere: J-18/F1/AC-1 has the
 *   SYSTEM create the offer, so it appears when the pool decision names a
 *   first preference (see `OfferService`).
 */

internal sealed record LookupOptionWire(string Value, string LabelAr, string LabelEn);

internal sealed record RequestSummaryWire(
    string RequestId, string Reference, string ServiceType,
    LocalizedTextWire? ProgramName, int RequiredHeadcount, string Status,
    string CreatedAt, string CreatedByName);

internal sealed record RequestDetailWire(
    string RequestId, string Reference, string ServiceType,
    LocalizedTextWire? ProgramName, int RequiredHeadcount, string Status,
    string CreatedAt, string CreatedByName, object? Pulled);

internal sealed record WeightedScoreWire(
    string Criterion, decimal RawScore, decimal Weight, decimal Weighted);

internal sealed record CandidatePriceWire(
    decimal? InClass, decimal? Online, string Currency, string AgreementReference);

internal sealed record MatchCandidateWire(
    string TrainerId, string Name, string Classification, decimal? EvaluationOverall,
    IReadOnlyList<WeightedScoreWire> Scores, decimal TotalScore, CandidatePriceWire Price);

internal sealed record ExcludedCandidateWire(
    string TrainerId, string Name, IReadOnlyList<string> Reasons);

internal sealed record MatchingModelWire(
    string Version, IReadOnlyDictionary<string, decimal> Weights, LocalizedTextWire? TieBreakNote);

internal sealed record MatchingRunWire(
    MatchingModelWire Model, IReadOnlyList<MatchCandidateWire> Ranked,
    IReadOnlyList<ExcludedCandidateWire> Excluded, int RequiredPoolSize);

internal sealed record PoolMemberWire(
    string TrainerId, string Name, CandidatePriceWire Price,
    string Decision, int? PreferenceRank);

internal sealed record CandidatePoolWire(
    string Status, IReadOnlyList<PoolMemberWire> Members, string? SentAt, int RequiredHeadcount);

internal sealed record MatchingViewerWire(bool CanMatch, bool CanApprove);

internal sealed record MatchingPayloadWire(CandidatePoolWire Pool, MatchingViewerWire Viewer);

internal sealed record CreateRequestInputWire(
    string? CentreId, string? RequestType, string? ResponsibleEmployee,
    string? ProgramName, int? DaysCount, string? DateFrom, string? DateTo,
    string? Period, string? DeliveryMechanism, string? City, string? Language,
    string? TraineeLevel, string? ClientName, string? SpecificNominee,
    string? ConsultationTopic, int? ExpectedHours, string? ConsultationType,
    string? Beneficiary, string? SpecializationDomain, string? AttachmentName,
    string? Notes, bool? DaysCountOther = null, string? AttachmentId = null,
    // J-16/F4/AC-1 — «the number of people needed (a number, with no defined
    // minimum/maximum)». Defaults to one, which is what every request created
    // before this field existed meant. No maximum is invented: the register
    // still records «Minimum / maximum headcount per request — Not defined».
    int? RequiredHeadcount = null,
    // J-16/F5 generalized (owner's ruling, 2026-09-21): a centre may name
    // several specific experts, at most one per slot. `SpecificNominee` above
    // stays accepted so a caller written against the single-value shape keeps
    // working — it is read as a one-element list.
    IReadOnlyList<string>? SpecificNominees = null,
    // Notion «Assignment Matrix» (2026-09-29): «عروض فنية / محاور البرامج» →
    // «مطوّر محتوى أو مدرب». Required only where the type allows several.
    string? ServiceType = null);

internal sealed record SendPoolInputWire(IReadOnlyList<string>? TrainerIds);

internal sealed record PoolCandidateDecisionWire(
    string? TrainerId, string? Decision, int? PreferenceRank);

/// <summary>
/// F4/AC-1 + AC-2. <c>PreferenceOrder</c> is the canonical ranking — the
/// approved trainer ids, most preferred first — and must name exactly the
/// approved candidates. A per-decision <c>PreferenceRank</c> is still honoured
/// when no order is sent, for callers written against the earlier shape.
/// </summary>
internal sealed record PoolDecisionInputWire(
    IReadOnlyList<PoolCandidateDecisionWire>? Decisions,
    IReadOnlyList<string>? PreferenceOrder = null);

/// <summary>The J-16/J-17/J-19 internal surface.</summary>
public static class AssignmentEndpoints
{
    private static readonly string[] RequestTypeField = ["requestType"];

    private static readonly string[] SpecificNomineeField = ["specificNominees"];

    private static readonly string[] HeadcountField = ["requiredHeadcount"];

    private static readonly string[] CentreField = ["centreId"];

    private static readonly string[] AttachmentField = ["attachmentId"];

    public static RouteGroupBuilder MapAssignmentEndpoints(this RouteGroupBuilder v1)
    {
        var requests = v1.MapGroup("/internal/assignment-requests")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        // F-0501 إنشاء طلب الإسناد — the centre coordinator's own feature.
        requests.MapGet("/", async (ExpertHubDbContext db, CancellationToken ct) =>
        {
            var rows = await LoadRequestsAsync(db, ct);
            return Results.Ok(rows.Select(r => r.Summary));
        })
            .WithName("AssignmentRequests")
            // Read by both of J-17's actors: the coordinator who raised the
            // request (`F-0501`) and the staff who match it (`F-0503`).
            .RequireAnyFeature("F-0501", "F-0503");

        requests.MapPost("/", async (
            CreateRequestInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(input.CentreId)
                || string.IsNullOrWhiteSpace(input.RequestType)
                || string.IsNullOrWhiteSpace(input.ResponsibleEmployee))
            {
                return Results.Problem(statusCode: 400, detail: "required-field-missing");
            }
            // Notion «Assignment Matrix» — the type must be one of the approved
            // ten, and its form's required fields and values must hold.
            // «اسم المركز» — one of the approved operational centres, by id.
            if (!Guid.TryParse(input.CentreId, out var centreValueId)
                || !await db.ReferenceValues.AnyAsync(
                    v => v.ValueId == centreValueId
                        && v.ListCode == AssignmentCentres.ListCode
                        && v.IsActive, ct))
            {
                return Results.Problem(
                    statusCode: 400,
                    detail: "invalid-field-value",
                    extensions: new Dictionary<string, object?> { ["fields"] = CentreField });
            }
            var rule = CentreRequestMatrix.RuleFor(input.RequestType);
            if (rule is null)
            {
                return Results.Problem(
                    statusCode: 400,
                    detail: "invalid-field-value",
                    extensions: new Dictionary<string, object?> { ["fields"] = RequestTypeField });
            }
            var (missingFields, invalidFields) = CentreRequestMatrix.Check(rule, input);
            if (missingFields.Count > 0)
            {
                return Results.Problem(
                    statusCode: 400,
                    detail: "required-field-missing",
                    extensions: new Dictionary<string, object?> { ["fields"] = missingFields });
            }
            if (invalidFields.Count > 0)
            {
                return Results.Problem(
                    statusCode: 400,
                    detail: "invalid-field-value",
                    extensions: new Dictionary<string, object?> { ["fields"] = invalidFields });
            }
            // «النشرة التعريفية» / «المرفقات» — the uploaded DOCUMENT, by id
            // (`POST internal/attachments`), not a file name. Requests saved
            // before this carry only the name, and still read.
            var brochure = await Documents.AttachmentUploads.FindAsync(db, input.AttachmentId, ct);
            if (brochure is null)
            {
                return Results.Problem(
                    statusCode: 400,
                    detail: "required-field-missing",
                    extensions: new Dictionary<string, object?> { ["fields"] = AttachmentField });
            }
            input = input with { AttachmentName = brochure.FileName };
            var headcount = input.RequiredHeadcount ?? 1;
            if (headcount < 1)
            {
                return Results.Problem(
                    statusCode: 400,
                    detail: "invalid-field-value",
                    extensions: new Dictionary<string, object?> { ["fields"] = HeadcountField });
            }

            // The single legacy value and the list are the same field; reading
            // them together is what keeps an older caller working.
            var requestedNominees = (input.SpecificNominees ?? [])
                .Concat(input.SpecificNominee is { Length: > 0 } legacy ? [legacy] : [])
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .ToList();
            var namedTrainerIds = new List<Guid>();
            foreach (var candidateId in requestedNominees)
            {
                if (!Guid.TryParse(candidateId, out var named)
                    || !await db.TrainerProfiles.AnyAsync(p => p.TrainerId == named, ct))
                {
                    return Results.Problem(
                        statusCode: 400,
                        detail: "invalid-field-value",
                        extensions: new Dictionary<string, object?> { ["fields"] = SpecificNomineeField });
                }
                if (namedTrainerIds.Contains(named))
                {
                    return Results.Problem(
                        statusCode: 400,
                        detail: "duplicate-nominee",
                        extensions: new Dictionary<string, object?> { ["fields"] = SpecificNomineeField });
                }
                namedTrainerIds.Add(named);
            }
            if (namedTrainerIds.Count > headcount)
            {
                return Results.Problem(
                    statusCode: 400,
                    detail: "nominees-exceed-headcount",
                    extensions: new Dictionary<string, object?> { ["fields"] = SpecificNomineeField });
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;
            var request = new AssignmentRequest
            {
                RequestId = Guid.NewGuid(),
                Reference = await NextReferenceAsync(db, now, ct),
                ServiceType = CentreRequestMatrix.ServiceFor(rule, input),
                RequestType = input.RequestType,
                CentreId = input.CentreId,
                ResponsibleEmployee = input.ResponsibleEmployee,
                // J-16/F4/AC-1 — the centre's own number. The workbook carried
                // no headcount column (`DM-GAP-06`), so this defaulted to ONE
                // «until the owner says otherwise»; the owner said otherwise on
                // 2026-09-21. The chain was already headcount-aware (slots,
                // pool size at 3 per slot), so this is the field, not a rewrite.
                RequiredHeadcount = headcount,
                Status = AssignmentRequestStatuses.Matching,
                FormValues = JsonSerializer.Serialize(input, WireJson),
                CreatedBy = actor.UserId,
                CreatedAt = now,
            };
            db.AssignmentRequests.Add(request);
            var slots = new List<AssignmentSlot>();
            for (var number = 1; number <= request.RequiredHeadcount; number++)
            {
                var slot = new AssignmentSlot
                {
                    SlotId = Guid.NewGuid(),
                    RequestId = request.RequestId,
                    SlotNumber = number,
                    FastSyncState = "none",
                };
                slots.Add(slot);
                db.AssignmentSlots.Add(slot);
            }

            /*
             * J-16/F5 — a named person skips matching (J-17): no ranking, no
             * pool to assemble, and the offer (J-18) goes to them as the sole
             * candidate. Governance does NOT skip: they must pass every rule
             * matching would have applied — accredited for this service, a
             * file an agreement keeps active or idle, the specialization,
             * the location, no conflicting engagement — or nothing is created.
             * If they decline or let the offer lapse, the slot is exhausted
             * and falls back to matching (J-19/F3).
             */
            if (namedTrainerIds.Count > 0)
            {
                var candidates = await CandidateInputsAsync(db, ct);
                var model = await db.MatchingModels.SingleAsync(m => m.IsActive, ct);
                var context = ContextFor(request);
                var weights = MatchingEngine.ParseWeights(model.Weights);

                // Every named expert is checked SEPARATELY and the whole
                // request is refused on the first failure — naming four people
                // and silently dropping one is the outcome this must not have.
                // `trainerId` says WHICH card the page should point at.
                foreach (var trainerId in namedTrainerIds)
                {
                    var verdict = MatchingEngine.Match(
                        context, [.. candidates.Where(c => c.TrainerId == trainerId)], weights);
                    if (verdict.Excluded.Count > 0)
                    {
                        return Results.Problem(
                            statusCode: 400,
                            detail: "nominee-not-eligible",
                            extensions: new Dictionary<string, object?>
                            {
                                ["reasons"] = verdict.Excluded[0].Reasons,
                                ["trainerId"] = trainerId.ToString(),
                                ["fields"] = SpecificNomineeField,
                            });
                    }
                }

                var pool = new CandidatePool
                {
                    PoolId = Guid.NewGuid(),
                    RequestId = request.RequestId,
                    // Only a FULLY named request is decided — it has no slot
                    // left for matching to fill. Name fewer experts than the
                    // headcount and the rest still go through J-17, which is
                    // the same rule as before, counted per slot.
                    Status = namedTrainerIds.Count >= headcount ? "decided" : "open",
                    Path = "named",
                    SentAt = now,
                };
                db.CandidatePools.Add(pool);
                var prices = await PricesAsync(db, ct);
                var members = namedTrainerIds.Select((trainerId, index) =>
                {
                    var price = prices.GetValueOrDefault(trainerId);
                    return new PoolMember
                    {
                        PoolMemberId = Guid.NewGuid(),
                        PoolId = pool.PoolId,
                        TrainerId = trainerId,
                        PriceInClass = price?.InClass,
                        PriceOnline = price?.Online,
                        Currency = price?.Currency ?? "SAR",
                        // The requesting party chose them by name — that is the
                        // approval. Rank follows the order they were named in.
                        Decision = "approved",
                        PreferenceRank = index + 1,
                        DecidedAt = now,
                    };
                }).ToList();
                db.PoolMembers.AddRange(members);
                if (namedTrainerIds.Count >= headcount)
                {
                    request.Status = AssignmentRequestStatuses.Nominated;
                }
                /*
                 * `DEF-03` — only the slots the named people occupy.
                 *
                 * This used to pass EVERY slot, so a partially named request
                 * put its nominees' offers across all of them and left nothing
                 * for J-17 — the opposite of what the comment above promises.
                 * One named person takes slot 1, two take slots 1–2, and the
                 * rest stay empty for matching to fill.
                 */
                var namedSlots = slots.Take(namedTrainerIds.Count).ToList();
                await OfferService.OpenNextOffersAsync(
                    db, request, namedSlots, members, now, ct);
            }

            await db.SaveChangesAsync(ct);
            return Results.Ok(await SummaryAsync(db, request, ct));
        })
            .WithName("CreateAssignmentRequest")
            .RequireFeature("F-0501");

        // «اسم المركز» — the approved operational centres (Assignment Matrix).
        // Not `/internal/centres`: that list is access scope, and empty (`P-276`).
        requests.MapGet("/lookups/centres", async (ExpertHubDbContext db, CancellationToken ct) =>
        {
            var centres = await db.ReferenceValues.AsNoTracking()
                .Where(v => v.ListCode == AssignmentCentres.ListCode && v.IsActive)
                .OrderBy(v => v.SortOrder)
                .ToListAsync(ct);
            return Results.Ok(centres.Select(v => new LookupOptionWire(
                v.ValueId.ToString(), v.LabelAr, v.LabelEn)));
        })
            .WithName("AssignmentCentreLookup")
            .RequireAnyFeature("F-0501", "F-0503");

        requests.MapGet("/lookups/responsible-employees", async (
            ExpertHubDbContext db, CancellationToken ct) =>
        {
            var staff = await db.Users
                .Where(u => u.IsEmployee && u.IsActive)
                .OrderBy(u => u.FullNameAr)
                .ToListAsync(ct);
            return Results.Ok(staff.Select(u => new LookupOptionWire(
                u.UserId.ToString(), u.FullNameAr, u.FullNameEn)));
        })
            .WithName("ResponsibleEmployeeLookup")
            .RequireAnyFeature("F-0501", "F-0503");

        requests.MapGet("/lookups/nominees", async (
            string? service, ExpertHubDbContext db, CancellationToken ct) =>
        {
            // «إضافة مدرب/استشاري محدد» — J-16/F5/AC-1: the people currently
            // approved FOR THAT SERVICE. With `service`, only those accredited
            // for it whose file an agreement keeps active or idle; without it,
            // every accredited trainer, as before.
            var rows = await (
                from profile in db.TrainerProfiles
                join user in db.Users on profile.UserId equals user.UserId
                orderby user.FullNameAr
                select new { profile.TrainerId, user.FullNameAr, user.FullNameEn })
                .ToListAsync(ct);
            if (!string.IsNullOrWhiteSpace(service))
            {
                var eligible = (await CandidateInputsAsync(db, ct))
                    .Where(c => c.AccreditedServices.Contains(service)
                        && c.FileStatus is TrainerFileStatuses.Active or TrainerFileStatuses.Idle)
                    .Select(c => c.TrainerId)
                    .ToHashSet();
                rows = [.. rows.Where(r => eligible.Contains(r.TrainerId))];
            }
            return Results.Ok(rows.Select(r => new LookupOptionWire(
                r.TrainerId.ToString(), r.FullNameAr, r.FullNameEn)));
        })
            .WithName("NomineeLookup")
            .RequireAnyFeature("F-0501", "F-0503");

        requests.MapGet("/{requestId}", async (
            string requestId, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var request = await FindAsync(requestId, db, ct);
            if (request is null)
            {
                return Results.Problem(statusCode: 404, detail: "Assignment request not found.");
            }
            var summary = await SummaryAsync(db, request, ct);
            return Results.Ok(new RequestDetailWire(
                summary.RequestId, summary.Reference, summary.ServiceType, summary.ProgramName,
                summary.RequiredHeadcount, summary.Status, summary.CreatedAt, summary.CreatedByName,
                // ⚠️ FAST's plan payload. There is no FAST plan read
                // (INT-05a has no agreed contract — `Q20`/`Q21`), so this is NULL rather than a
                // fabricated programme — the contract types it nullable for
                // exactly this reason.
                Pulled: null));
        })
            .WithName("AssignmentRequestDetail")
            .RequireAnyFeature("F-0501", "F-0503");

        /* ── J-17 — matching, request-scoped ───────────────────────────────── */

        requests.MapGet("/{requestId}/matching", async (
            string requestId, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var request = await FindAsync(requestId, db, ct);
            if (request is null)
            {
                return Results.Problem(statusCode: 404, detail: "Assignment request not found.");
            }
            return Results.Ok(new MatchingPayloadWire(
                await PoolWireAsync(db, request, slotId: null, ct),
                // P-J9 — J-17 has two actors, so the rights are served — and
                // served from the viewer's REAL grants, not a constant `true`.
                await ViewerAsync(http, db, ct)));
        })
            .WithName("RequestMatching")
            .RequireAnyFeature("F-0503", "F-0504");

        requests.MapPost("/{requestId}/matching/run", (
            string requestId, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
            RunMatchingAsync(requestId, slotNumber: null, http, db, ct))
            .WithName("RunMatching")
            .RequireFeature("F-0502");

        requests.MapGet("/{requestId}/matching/candidates", (
            string requestId, string? q, ExpertHubDbContext db, CancellationToken ct) =>
            SearchCandidatesAsync(requestId, slotNumber: null, q, db, ct))
            .WithName("SearchCandidates")
            .RequireFeature("F-0503");

        requests.MapPost("/{requestId}/pool", (
            string requestId, SendPoolInputWire input, ExpertHubDbContext db, CancellationToken ct) =>
            SendPoolAsync(requestId, slotNumber: null, input, db, ct))
            .WithName("SendPool")
            .RequireFeature("F-0503");

        requests.MapPost("/{requestId}/pool/decision", (
            string requestId, PoolDecisionInputWire input, ExpertHubDbContext db,
            NotificationDispatcher dispatcher, CancellationToken ct) =>
            DecidePoolAsync(requestId, slotNumber: null, input, db, dispatcher, ct))
            .WithName("DecidePool")
            .RequireFeature("F-0504");

        /* ── J-19 — the same four, SLOT-scoped (`P-95`) ────────────────────── */

        requests.MapGet("/{requestId}/slots/{slotNumber:int}/cycle", async (
            string requestId, int slotNumber, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var found = await FindSlotAsync(requestId, slotNumber, db, ct);
            if (found is null)
            {
                return Results.Problem(statusCode: 404, detail: "Slot not found.");
            }
            var (request, slot) = found.Value;
            var cycles = await db.SlotCycles
                .Where(c => c.SlotId == slot.SlotId)
                .OrderBy(c => c.CycleNumber)
                .ToListAsync(ct);
            var current = cycles.LastOrDefault();
            var siblings = await db.AssignmentSlots
                .Where(s => s.RequestId == request.RequestId && s.SlotId != slot.SlotId)
                .ToListAsync(ct);
            var offers = await db.AssignmentOffers
                .Where(o => siblings.Select(s => s.SlotId).Contains(o.SlotId))
                .ToListAsync(ct);
            var slotOffers = await db.AssignmentOffers
                .Where(o => o.SlotId == slot.SlotId)
                .OrderBy(o => o.SentAt)
                .ToListAsync(ct);
            var names = await TrainerNamesAsync(db, ct);

            return Results.Ok(new
            {
                reference = request.Reference,
                slotNumber,
                // Counted, never capped (F2/AC-3). Null before the slot has
                // ever been exhausted.
                cycleNumber = current?.CycleNumber ?? 0,
                status = current?.Status,
                exhausted = slot.Exhausted,
                confirmed = slot.ConfirmedEngagementId is not null,
                pool = await PoolWireAsync(db, request, slot.SlotId, ct),
                cycles = cycles.Select(c => new
                {
                    cycleNumber = c.CycleNumber,
                    status = c.Status,
                    poolId = c.PoolId?.ToString(),
                    openedAt = ApplicationEndpoints.Iso(c.CreatedAt),
                }),
                // J-19/F1/AC-5 — who was already offered this slot, and how it
                // ended. They may be re-included in a new pool.
                previouslyOffered = slotOffers.Select(o => new
                {
                    offerId = o.OfferId.ToString(),
                    trainerId = o.TrainerId.ToString(),
                    trainerName = names.GetValueOrDefault(o.TrainerId, string.Empty),
                    outcome = o.Status switch
                    {
                        OfferStatuses.AwaitingResponse => "awaiting-response",
                        OfferStatuses.Accepted => "accepted",
                        OfferStatuses.Rejected => "rejected",
                        _ => "expired",
                    },
                    sentAt = ApplicationEndpoints.Iso(o.SentAt),
                    respondedAt = o.RespondedAt is { } at ? ApplicationEndpoints.Iso(at) : null,
                }),
                viewer = await ViewerAsync(http, db, ct),
                siblings = siblings.OrderBy(s => s.SlotNumber).Select(s => new
                {
                    slotNumber = s.SlotNumber,
                    state = s.ConfirmedEngagementId is not null ? "confirmed"
                        : s.Exhausted ? "exhausted"
                        : offers.Any(o => o.SlotId == s.SlotId
                            && o.Status == OfferStatuses.AwaitingResponse) ? "awaiting-response"
                        : "no-offer",
                }),
            });
        })
            .WithName("SlotCycle")
            .RequireAnyFeature("F-0503", "F-0504");

        requests.MapPost("/{requestId}/slots/{slotNumber:int}/matching/run", (
            string requestId, int slotNumber, HttpContext http, ExpertHubDbContext db,
            CancellationToken ct) =>
            RunMatchingAsync(requestId, slotNumber, http, db, ct))
            .WithName("RunSlotMatching")
            .RequireFeature("F-0502");

        requests.MapGet("/{requestId}/slots/{slotNumber:int}/matching/candidates", (
            string requestId, int slotNumber, string? q, ExpertHubDbContext db,
            CancellationToken ct) =>
            SearchCandidatesAsync(requestId, slotNumber, q, db, ct))
            .WithName("SearchSlotCandidates")
            .RequireFeature("F-0503");

        requests.MapPost("/{requestId}/slots/{slotNumber:int}/pool", (
            string requestId, int slotNumber, SendPoolInputWire input, ExpertHubDbContext db,
            CancellationToken ct) =>
            SendPoolAsync(requestId, slotNumber, input, db, ct))
            .WithName("SendSlotPool")
            .RequireFeature("F-0503");

        requests.MapPost("/{requestId}/slots/{slotNumber:int}/pool/decision", (
            string requestId, int slotNumber, PoolDecisionInputWire input, ExpertHubDbContext db,
            NotificationDispatcher dispatcher, CancellationToken ct) =>
            DecidePoolAsync(requestId, slotNumber, input, db, dispatcher, ct))
            .WithName("DecideSlotPool")
            .RequireFeature("F-0504");

        return v1;
    }

    /* ── the four operations, shared by both scopes ────────────────────────── */

    private static async Task<IResult> RunMatchingAsync(
        string requestId, int? slotNumber, HttpContext http, ExpertHubDbContext db,
        CancellationToken ct)
    {
        var request = await FindAsync(requestId, db, ct);
        if (request is null)
        {
            return Results.Problem(statusCode: 404, detail: "Assignment request not found.");
        }
        Guid? slotId = null;
        if (slotNumber is { } number)
        {
            var found = await FindSlotAsync(requestId, number, db, ct);
            if (found is null)
            {
                return Results.Problem(statusCode: 404, detail: "Slot not found.");
            }
            slotId = found.Value.Slot.SlotId;
        }

        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        var model = await db.MatchingModels.SingleAsync(m => m.IsActive, ct);
        var weights = MatchingEngine.ParseWeights(model.Weights);
        var context = ContextFor(request);
        var candidates = await CandidateInputsAsync(db, ct);
        var result = MatchingEngine.Match(context, candidates, weights);

        var run = new MatchingRun
        {
            RunId = Guid.NewGuid(),
            RequestId = request.RequestId,
            SlotId = slotId,
            MatchingModelId = model.MatchingModelId,
            RequiredPoolSize = Matching.PoolSizeFor(
                slotNumber is null ? request.RequiredHeadcount : 1),
            RunBy = actor.UserId,
            RunAt = DateTime.UtcNow,
        };
        db.MatchingRuns.Add(run);
        for (var index = 0; index < result.Ranked.Count; index++)
        {
            var ranked = result.Ranked[index];
            db.MatchCandidates.Add(new MatchCandidate
            {
                MatchCandidateId = Guid.NewGuid(),
                RunId = run.RunId,
                TrainerId = ranked.TrainerId,
                WeightedScores = JsonSerializer.Serialize(ranked.Scores, WireJson),
                TotalScore = ranked.TotalScore,
                Rank = index + 1,
            });
        }
        foreach (var excluded in result.Excluded)
        {
            db.MatchExclusions.Add(new MatchExclusion
            {
                ExclusionId = Guid.NewGuid(),
                RunId = run.RunId,
                TrainerId = excluded.TrainerId,
                Reasons = JsonSerializer.Serialize(excluded.Reasons, WireJson),
            });
        }
        await db.SaveChangesAsync(ct);

        var names = await TrainerNamesAsync(db, ct);
        var prices = await PricesAsync(db, ct);
        return Results.Ok(new MatchingRunWire(
            new MatchingModelWire(
                model.Version,
                weights,
                model.TieBreakNoteAr is null
                    ? null
                    : new LocalizedTextWire(model.TieBreakNoteAr, model.TieBreakNoteEn ?? model.TieBreakNoteAr)),
            [.. result.Ranked.Select(r => CandidateWire(r, names, prices))],
            [.. result.Excluded.Select(e => new ExcludedCandidateWire(
                e.TrainerId.ToString(),
                names.GetValueOrDefault(e.TrainerId, string.Empty),
                e.Reasons))],
            run.RequiredPoolSize));
    }

    /// <summary>
    /// The MANUAL search (F3/AC-3): «the exclusions apply on either path», so
    /// it runs through the same engine and returns only candidates the matrix
    /// permits — a manual search that could surface an excluded trainer would
    /// be the hole the rule exists to close.
    /// </summary>
    private static async Task<IResult> SearchCandidatesAsync(
        string requestId, int? slotNumber, string? query, ExpertHubDbContext db,
        CancellationToken ct)
    {
        _ = slotNumber; // the matrix does not vary by slot; the pool does.
        var request = await FindAsync(requestId, db, ct);
        if (request is null)
        {
            return Results.Problem(statusCode: 404, detail: "Assignment request not found.");
        }
        var model = await db.MatchingModels.SingleAsync(m => m.IsActive, ct);
        var weights = MatchingEngine.ParseWeights(model.Weights);
        var candidates = await CandidateInputsAsync(db, ct);
        var result = MatchingEngine.Match(ContextFor(request), candidates, weights);

        var names = await TrainerNamesAsync(db, ct);
        var prices = await PricesAsync(db, ct);
        var matched = result.Ranked.Where(r =>
            string.IsNullOrWhiteSpace(query)
            || names.GetValueOrDefault(r.TrainerId, string.Empty)
                .Contains(query.Trim(), StringComparison.OrdinalIgnoreCase));
        return Results.Ok(matched.Select(r => CandidateWire(r, names, prices)));
    }

    private static async Task<IResult> SendPoolAsync(
        string requestId, int? slotNumber, SendPoolInputWire input, ExpertHubDbContext db,
        CancellationToken ct)
    {
        var request = await FindAsync(requestId, db, ct);
        if (request is null)
        {
            return Results.Problem(statusCode: 404, detail: "Assignment request not found.");
        }
        Guid? slotId = null;
        var headcount = request.RequiredHeadcount;
        if (slotNumber is { } number)
        {
            var found = await FindSlotAsync(requestId, number, db, ct);
            if (found is null)
            {
                return Results.Problem(statusCode: 404, detail: "Slot not found.");
            }
            slotId = found.Value.Slot.SlotId;
            headcount = 1; // a re-routed slot needs one person, so three candidates.
        }

        var trainerIds = (input.TrainerIds ?? []).Distinct().ToList();
        // BR-0505 / F2/AC-2 — «no fewer, no more», on BOTH paths.
        if (trainerIds.Count != Matching.PoolSizeFor(headcount))
        {
            return Results.Problem(
                statusCode: 400,
                detail: "pool-size",
                extensions: new Dictionary<string, object?>
                {
                    ["requiredPoolSize"] = Matching.PoolSizeFor(headcount),
                    ["received"] = trainerIds.Count,
                });
        }
        var ids = trainerIds.Select(Guid.Parse).ToList();

        // F3/AC-3 — the exclusions apply here too: a pool assembled by hand
        // still cannot contain someone the matrix rules out.
        var model = await db.MatchingModels.SingleAsync(m => m.IsActive, ct);
        var result = MatchingEngine.Match(
            ContextFor(request),
            await CandidateInputsAsync(db, ct),
            MatchingEngine.ParseWeights(model.Weights));
        var excludedIds = result.Excluded.Select(e => e.TrainerId).ToHashSet();
        if (ids.Any(excludedIds.Contains))
        {
            return Results.Problem(statusCode: 400, detail: "excluded-candidate");
        }

        var now = DateTime.UtcNow;
        var existing = await LatestPoolAsync(db, request.RequestId, slotId, ct);
        AssignmentSlot? cycleSlot = slotId is null
            ? null
            : await db.AssignmentSlots.SingleAsync(s => s.SlotId == slotId, ct);
        SlotCycle? cycle = cycleSlot is null
            ? null
            : await OfferService.LatestCycleAsync(db, cycleSlot.SlotId, ct);
        if (cycleSlot is not null && !cycleSlot.Exhausted
            && (existing is null || existing.Status == "decided"))
        {
            // J-19 re-routes an EXHAUSTED slot. A slot with a live offer, a
            // confirmed trainer, or no exhaustion yet has nothing to re-route.
            return Results.Problem(statusCode: 409, detail: "slot-not-exhausted");
        }
        if (existing is not null && existing.Status == "decided")
        {
            // J-19/F2/AC-3 — a decided pool is history, not a wall: an
            // exhausted slot takes a NEW pool, as many times as it runs out.
            if (cycleSlot is null || !cycleSlot.Exhausted)
            {
                return Results.Problem(statusCode: 409, detail: "Already decided.");
            }
            existing = null;
        }
        var pool = new CandidatePool
        {
            PoolId = Guid.NewGuid(),
            RequestId = request.RequestId,
            SlotId = slotId,
            Status = "sent",
            Path = "manual",
            SentAt = now,
        };
        db.CandidatePools.Add(pool);
        if (cycleSlot is not null)
        {
            if (cycle is null || cycle.Status == SlotCycleStatuses.Decided)
            {
                // A slot re-routed before cycles were recorded, or re-routed by
                // staff ahead of exhaustion — the cycle is opened here.
                cycle = new SlotCycle
                {
                    CycleId = Guid.NewGuid(),
                    SlotId = cycleSlot.SlotId,
                    CycleNumber = (cycle?.CycleNumber ?? 0) + 1,
                    Status = SlotCycleStatuses.AwaitingApproval,
                    CreatedAt = now,
                };
                db.SlotCycles.Add(cycle);
            }
            cycle.Status = SlotCycleStatuses.AwaitingApproval;
            cycle.PoolId = pool.PoolId;
        }
        if (existing is not null && !string.Equals(existing.Path, "named", StringComparison.Ordinal))
        {
            // An undecided pool is REPLACED by the one sent now — unless it is
            // the NAMED pool. `DEF-03`: a partially named request keeps an
            // `open` named pool holding approvals the requesting party already
            // gave by naming those people. Removing it cascaded their
            // `POOL_MEMBER` rows away and silently un-nominated them.
            db.CandidatePools.Remove(existing);
        }

        var prices = await PricesAsync(db, ct);
        foreach (var trainerId in ids)
        {
            var price = prices.GetValueOrDefault(trainerId);
            db.PoolMembers.Add(new PoolMember
            {
                PoolMemberId = Guid.NewGuid(),
                PoolId = pool.PoolId,
                TrainerId = trainerId,
                PriceInClass = price?.InClass,
                PriceOnline = price?.Online,
                Currency = price?.Currency ?? "SAR",
                Decision = "pending",
            });
        }

        request.Status = AssignmentRequestStatuses.Nominated;
        await db.SaveChangesAsync(ct);
        return Results.Ok(await PoolWireAsync(db, request, slotId, ct));
    }

    private static async Task<IResult> DecidePoolAsync(
        string requestId, int? slotNumber, PoolDecisionInputWire input, ExpertHubDbContext db,
        NotificationDispatcher dispatcher, CancellationToken ct)
    {
        var request = await FindAsync(requestId, db, ct);
        if (request is null)
        {
            return Results.Problem(statusCode: 404, detail: "Assignment request not found.");
        }
        Guid? slotId = null;
        if (slotNumber is { } number)
        {
            var found = await FindSlotAsync(requestId, number, db, ct);
            if (found is null)
            {
                return Results.Problem(statusCode: 404, detail: "Slot not found.");
            }
            slotId = found.Value.Slot.SlotId;
        }
        var pool = await LatestPoolAsync(db, request.RequestId, slotId, ct);
        if (pool is null || pool.Status != "sent")
        {
            return Results.Problem(statusCode: 409, detail: "No pool awaits a decision.");
        }
        var members = await db.PoolMembers
            .Where(m => m.PoolId == pool.PoolId)
            .ToListAsync(ct);
        var now = DateTime.UtcNow;

        // The claim: one decision per pool. Two submits both read `sent` and
        // each opened an offer for the slot; the second now finds it decided.
        // A 400 below rolls back when the transaction is disposed uncommitted.
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var claimed = await db.CandidatePools
            .Where(p => p.PoolId == pool.PoolId && p.Status == "sent")
            .ExecuteUpdateAsync(set => set.SetProperty(p => p.Status, "decided"), ct);
        if (claimed == 0)
        {
            return Results.Problem(statusCode: 409, detail: "No pool awaits a decision.");
        }

        // F4/AC-1 — a decision PER candidate. Anyone the requesting party did
        // not name stays `pending`; there is no group verdict to apply.
        foreach (var decision in input.Decisions ?? [])
        {
            if (!Guid.TryParse(decision.TrainerId, out var trainerId))
            {
                continue;
            }
            var member = members.FirstOrDefault(m => m.TrainerId == trainerId);
            if (member is null || decision.Decision is not ("approved" or "rejected"))
            {
                continue;
            }
            member.Decision = decision.Decision;
            member.PreferenceRank = decision.Decision == "approved" ? decision.PreferenceRank : null;
            member.DecidedAt = now;
        }

        // The canonical ranking. The requesting party's order was silently
        // dropped while only `preferenceRank` was read — every live decision
        // reached the offer logic unranked.
        if (input.PreferenceOrder is { } order)
        {
            var approvedIds = members.Where(m => m.Decision == "approved").Select(m => m.TrainerId).ToList();
            var ordered = order.Select(id => Guid.TryParse(id, out var parsed) ? parsed : Guid.Empty).ToList();
            if (ordered.Count != approvedIds.Count
                || ordered.Distinct().Count() != ordered.Count
                || !ordered.All(approvedIds.Contains))
            {
                return Results.Problem(statusCode: 400, detail: "preference-order-invalid");
            }
            foreach (var member in members.Where(m => m.Decision == "approved"))
            {
                member.PreferenceRank = ordered.IndexOf(member.TrainerId) + 1;
            }
        }

        var approved = members
            .Where(m => m.Decision == "approved")
            .OrderBy(m => m.PreferenceRank ?? int.MaxValue)
            .ToList();
        if (approved.Count == 0 && members.Any(m => m.Decision == "pending"))
        {
            // Nothing approved AND not everyone decided: an incomplete answer.
            return Results.Problem(statusCode: 400, detail: "no-approved-candidate");
        }
        // J-17/F3/AC-6 — rejecting EVERY candidate is a decision, not a
        // validation failure: the pool is decided, the slots run out, and
        // re-routing (J-19) opens a new cycle for each.
        pool.Status = "decided";
        if (slotId is { } decidedSlotId
            && await OfferService.LatestCycleAsync(db, decidedSlotId, ct) is { } openCycle
            && openCycle.Status != SlotCycleStatuses.Decided)
        {
            openCycle.Status = SlotCycleStatuses.Decided;
            openCycle.PoolId = pool.PoolId;
        }

        // J-18/F1/AC-1 — the SYSTEM creates the offer for the top-ranked
        // candidate. Nobody sends it, which is why no endpoint can.
        var slots = slotId is null
            ? await db.AssignmentSlots
                .Where(s => s.RequestId == request.RequestId && s.ConfirmedEngagementId == null)
                .OrderBy(s => s.SlotNumber)
                .ToListAsync(ct)
            : [await db.AssignmentSlots.SingleAsync(s => s.SlotId == slotId, ct)];
        foreach (var slot in slots)
        {
            // A new decision starts a new set: the slot is no longer exhausted
            // until that set, too, runs out.
            slot.Exhausted = false;
        }
        await OfferService.OpenNextOffersAsync(db, request, slots, approved, now, ct);
        foreach (var slot in slots.Where(s => s.Exhausted))
        {
            await OfferService.RaiseAsync(dispatcher, db, "EV-0504", slot, ct);
        }

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return Results.Ok(await PoolWireAsync(db, request, slotId, ct));
    }

    /* ── shared reads ──────────────────────────────────────────────────────── */

    internal static readonly JsonSerializerOptions WireJson = new(JsonSerializerDefaults.Web);

    private static async Task<AssignmentRequest?> FindAsync(
        string requestId, ExpertHubDbContext db, CancellationToken ct) =>
        Guid.TryParse(requestId, out var id)
            ? await db.AssignmentRequests.FirstOrDefaultAsync(r => r.RequestId == id, ct)
            : null;

    private static async Task<(AssignmentRequest Request, AssignmentSlot Slot)?> FindSlotAsync(
        string requestId, int slotNumber, ExpertHubDbContext db, CancellationToken ct)
    {
        var request = await FindAsync(requestId, db, ct);
        if (request is null)
        {
            return null;
        }
        var slot = await db.AssignmentSlots.FirstOrDefaultAsync(
            s => s.RequestId == request.RequestId && s.SlotNumber == slotNumber, ct);
        return slot is null ? null : (request, slot);
    }

    internal static MatchingContext ContextFor(AssignmentRequest request)
    {
        var form = JsonSerializer.Deserialize<CreateRequestInputWire>(
            request.FormValues, WireJson);
        return new MatchingContext(
            request.ServiceType,
            form?.SpecializationDomain,
            form?.Language,
            form?.DeliveryMechanism,
            form?.City,
            ParseDate(form?.DateFrom),
            ParseDate(form?.DateTo));
    }

    private static DateTime? ParseDate(string? value) =>
        DateTime.TryParse(value, CultureInfo.InvariantCulture,
            DateTimeStyles.RoundtripKind, out var parsed) ? parsed : null;

    internal static async Task<List<MatchingCandidateInput>> CandidateInputsAsync(
        ExpertHubDbContext db, CancellationToken ct)
    {
        var profiles = await (
            from profile in db.TrainerProfiles
            join user in db.Users on profile.UserId equals user.UserId
            select new { profile, user.FullNameAr }).ToListAsync(ct);
        var services = await db.TrainerServices.ToListAsync(ct);
        var values = await db.TrainerFieldValues.ToListAsync(ct);
        // `D-24` / J-13 — the agreement decides whether a file is active, idle,
        // suspended or expired; the column written at accreditation goes stale.
        var now = DateTime.UtcNow;
        var agreements = await TrainerProfileService.GoverningAgreementsAsync(
            db, [.. profiles.Select(p => p.profile.ApplicationId)], ct);
        var lastCompleted = await TrainerProfileService.LastCompletedEngagementsAsync(
            db, [.. profiles.Select(p => p.profile.TrainerId)], now, ct);
        var ratings = await db.TrainerRatings.Where(r => r.Scope == "overall").ToListAsync(ct);
        var engagements = await (
            from engagement in db.Engagements
            join slot in db.AssignmentSlots on engagement.SlotId equals slot.SlotId
            join request in db.AssignmentRequests on slot.RequestId equals request.RequestId
            where engagement.Status != EngagementStatuses.Withdrawn
                && engagement.Status != EngagementStatuses.Cancelled
            select new { engagement.TrainerId, request.FormValues }).ToListAsync(ct);

        return [.. profiles.Select(row =>
        {
            string? Value(string code) => values
                .FirstOrDefault(v => v.TrainerId == row.profile.TrainerId && v.FieldCode == code)
                ?.Value is { } raw
                    ? JsonSerializer.Deserialize<JsonElement>(raw) is { ValueKind: JsonValueKind.String } e
                        ? e.GetString()
                        : null
                    : null;

            var booked = engagements
                .Where(e => e.TrainerId == row.profile.TrainerId)
                .Select(e => JsonSerializer.Deserialize<CreateRequestInputWire>(e.FormValues, WireJson))
                .Select(f => (From: ParseDate(f?.DateFrom), To: ParseDate(f?.DateTo)))
                .Where(d => d.From is not null && d.To is not null)
                .Select(d => (d.From!.Value, d.To!.Value))
                .ToList();

            return new MatchingCandidateInput(
                row.profile.TrainerId,
                row.FullNameAr,
                TrainerProfileService.FileStatus(
                    row.profile,
                    agreements.GetValueOrDefault(row.profile.ApplicationId),
                    now,
                    lastCompleted.TryGetValue(row.profile.TrainerId, out var end) ? end : null),
                [.. services.Where(s => s.TrainerId == row.profile.TrainerId).Select(s => s.Service)],
                Value("domain"),
                Value("inPersonCities"),
                // The workbook's own fields: the languages and delivery modes
                // the trainer declared on their application.
                [.. Split(Value("trainingLanguages"))],
                [.. Split(Value("preferredDeliveryMode"))],
                ratings.FirstOrDefault(r => r.TrainerId == row.profile.TrainerId)?.CalculatedValue,
                booked);
        })];
    }

    private static string[] Split(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split(['،', ','], StringSplitOptions.RemoveEmptyEntries
                | StringSplitOptions.TrimEntries);


    private static async Task<Dictionary<Guid, string>> TrainerNamesAsync(
        ExpertHubDbContext db, CancellationToken ct) =>
        await (from profile in db.TrainerProfiles
               join user in db.Users on profile.UserId equals user.UserId
               select new { profile.TrainerId, user.FullNameAr })
            .ToDictionaryAsync(x => x.TrainerId, x => x.FullNameAr, ct);

    /// <summary>
    /// The prices beside each candidate — «sourced from their active
    /// agreement» (F3/AC-2, `BR-0515`).
    /// ⚠️ The agreement's own field map (`DM-GAP-16`) carries no price rows,
    /// so there is nothing to read: the figures serve NULL and the reference
    /// names the agreement they would come from. A fabricated price is the
    /// one number nobody should ever invent.
    /// </summary>
    private static async Task<Dictionary<Guid, CandidatePriceWire>> PricesAsync(
        ExpertHubDbContext db, CancellationToken ct)
    {
        var rows = await (
            from profile in db.TrainerProfiles
            join agreement in db.Agreements on profile.UserId equals agreement.TrainerUserId
            where agreement.Status == AgreementStatuses.Active
            select new { profile.TrainerId, agreement.Reference }).ToListAsync(ct);
        return rows.ToDictionary(
            r => r.TrainerId,
            r => new CandidatePriceWire(null, null, "SAR", r.Reference));
    }

    private static MatchCandidateWire CandidateWire(
        RankedCandidate ranked,
        Dictionary<Guid, string> names,
        Dictionary<Guid, CandidatePriceWire> prices) =>
        new(
            ranked.TrainerId.ToString(),
            names.GetValueOrDefault(ranked.TrainerId, string.Empty),
            TrainerClassifications.PendingRulesPlaceholder,
            EvaluationOverall: null,
            [.. ranked.Scores.Select(s => new WeightedScoreWire(
                s.Criterion, s.RawScore, s.Weight, s.Weighted))],
            ranked.TotalScore,
            // ⚠️ No price rows exist on the agreement template (`DM-GAP-16`),
            // so the figures are null and only the SOURCE is named. A
            // fabricated price is the one number nobody should invent.
            prices.GetValueOrDefault(
                ranked.TrainerId, new CandidatePriceWire(null, null, "SAR", string.Empty)));

    /// <summary>The request's (or one slot's) most recent pool — a re-routed
    /// slot keeps every earlier cycle's pool as history.</summary>
    private static async Task<CandidatePool?> LatestPoolAsync(
        ExpertHubDbContext db, Guid requestId, Guid? slotId, CancellationToken ct) =>
        await db.CandidatePools
            .Where(p => p.RequestId == requestId && p.SlotId == slotId)
            .OrderByDescending(p => p.SentAt)
            .FirstOrDefaultAsync(ct);

    private static async Task<MatchingViewerWire> ViewerAsync(
        HttpContext http, ExpertHubDbContext db, CancellationToken ct)
    {
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        return new MatchingViewerWire(
            CanMatch: await FeatureAuthorization.HasFeatureAsync(db, actor.UserId, "F-0503", ct),
            CanApprove: await FeatureAuthorization.HasFeatureAsync(db, actor.UserId, "F-0504", ct));
    }

    private static async Task<CandidatePoolWire> PoolWireAsync(
        ExpertHubDbContext db, AssignmentRequest request, Guid? slotId, CancellationToken ct)
    {
        var pool = await LatestPoolAsync(db, request.RequestId, slotId, ct);
        if (pool is null)
        {
            return new CandidatePoolWire("not-built", [], null, slotId is null ? request.RequiredHeadcount : 1);
        }
        var members = await db.PoolMembers
            .Where(m => m.PoolId == pool.PoolId)
            .ToListAsync(ct);
        var names = await TrainerNamesAsync(db, ct);
        return new CandidatePoolWire(
            pool.Status == "sent" ? "sent" : pool.Status == "decided" ? "decided" : "not-built",
            [.. members.Select(m => new PoolMemberWire(
                m.TrainerId.ToString(),
                names.GetValueOrDefault(m.TrainerId, string.Empty),
                new CandidatePriceWire(m.PriceInClass, m.PriceOnline, m.Currency, string.Empty),
                m.Decision,
                m.PreferenceRank))],
            pool.SentAt is { } sentAt ? ApplicationEndpoints.Iso(sentAt) : null,
            slotId is null ? request.RequiredHeadcount : 1);
    }

    private static async Task<List<(AssignmentRequest Request, RequestSummaryWire Summary)>>
        LoadRequestsAsync(ExpertHubDbContext db, CancellationToken ct)
    {
        var rows = await (
            from request in db.AssignmentRequests
            join user in db.Users on request.CreatedBy equals user.UserId
            orderby request.CreatedAt descending
            select new { request, user.FullNameAr }).ToListAsync(ct);
        return [.. rows.Select(r => (r.request, SummaryOf(r.request, r.FullNameAr)))];
    }

    private static async Task<RequestSummaryWire> SummaryAsync(
        ExpertHubDbContext db, AssignmentRequest request, CancellationToken ct)
    {
        var creator = await db.Users.SingleAsync(u => u.UserId == request.CreatedBy, ct);
        return SummaryOf(request, creator.FullNameAr);
    }

    private static RequestSummaryWire SummaryOf(AssignmentRequest request, string creatorName)
    {
        var form = JsonSerializer.Deserialize<CreateRequestInputWire>(request.FormValues, WireJson);
        return new RequestSummaryWire(
            request.RequestId.ToString(),
            request.Reference,
            request.ServiceType,
            string.IsNullOrWhiteSpace(form?.ProgramName)
                ? null
                : new LocalizedTextWire(form.ProgramName, form.ProgramName),
            request.RequiredHeadcount,
            request.Status,
            ApplicationEndpoints.Iso(request.CreatedAt),
            creatorName);
    }

    private static async Task<string> NextReferenceAsync(
        ExpertHubDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var prefix = string.Create(CultureInfo.InvariantCulture, $"ASR-{nowUtc.Year}-");
        var last = await db.AssignmentRequests
            .Where(r => r.Reference.StartsWith(prefix))
            .OrderByDescending(r => r.Reference)
            .Select(r => r.Reference)
            .FirstOrDefaultAsync(ct);
        return await ReferenceNumbers.NextAsync(db, prefix, last, digits: 4, ct);
    }
}
