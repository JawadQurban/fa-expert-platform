using System.Text.Json;
using System.Text.Json.Serialization;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Api.Profiles;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Applications;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.ServiceRequests;

/*
 * EH-INT-02b — the internal half of add-service (J-03 F2+F3), behind
 * `serviceRequestService.ts`:
 *
 *   GET  v1/internal/service-requests?search=&service=&status=
 *   GET  v1/internal/service-requests/{id}
 *   POST v1/internal/service-requests/{id}/decision
 *
 * The journey's structural rules, held server-side: the decision union is
 * approve/reject and NOTHING routes to screening (`BR-0112`); an approval is
 * unfinalizable without its addendum (F3/AC-4, `BR-0305` — the annex attaches
 * to the existing agreement, no new agreement, no new signature); a rejection
 * always carries a reason from the served list (F3/AC-3); and the trainer is
 * notified of a rejection WITHOUT the reason (F3/AC-7) — enforced where it
 * matters: the EV-0104 raise passes no reason placeholder, so no template
 * can leak what it was never given.
 */

internal sealed record ServiceRequestSummaryWire(
    string Id, string Reference, string TrainerId, string TrainerName,
    string RequestedService, string Status, string SubmittedAt);

internal sealed record ServiceRequestListWire(
    IReadOnlyList<ServiceRequestSummaryWire> Items, int TotalCount, int PendingCount);

internal sealed record LocalizedTextWire(string Ar, string En);

internal sealed record TrainerAgreementWire(string Reference, string Status, string? EndsAt);

internal sealed record TrainerContextWire(
    string TrainerId, string Name, IReadOnlyList<string> CurrentServices,
    IReadOnlyList<string> Specialties, string Classification,
    double? EvaluationOverall, TrainerAgreementWire? Agreement);

internal sealed record SubmittedFieldWire(LocalizedTextWire Label, string Value);

internal sealed record SubmittedAttachmentWire(string Id, LocalizedTextWire Label, string FileName);

internal sealed record RejectionReasonWire(string Id, LocalizedTextWire Label, bool RequiresText);

internal sealed record DecisionRecordWire(
    string Kind, string DecidedAt, string DecidedByName,
    string? ReasonId, string? ReasonText, string? AddendumFileName, string? Note,
    string? AddendumUrl = null);

internal sealed record ViewerWire(
    bool CanDecide,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] string? BlockedReason);

internal sealed record ServiceRequestDetailWire(
    string Id, string Reference, string TrainerId, string TrainerName,
    string RequestedService, string Status, string SubmittedAt,
    TrainerContextWire TrainerContext,
    IReadOnlyList<SubmittedFieldWire> SubmittedFields,
    IReadOnlyList<SubmittedAttachmentWire> SubmittedAttachments,
    IReadOnlyList<RejectionReasonWire> RejectionReasons,
    DecisionRecordWire? Decision,
    ViewerWire Viewer);

/// <summary>The uploaded addendum (`POST internal/attachments`, purpose
/// <c>service-addendum</c>) — the id is what is stored; name and size are
/// read from the stored document, never trusted from the input.</summary>
internal sealed record AddendumInputWire(string? FileName, long SizeBytes, string? AttachmentId = null);

internal sealed record DecisionInputWire(
    string? Kind, AddendumInputWire? Addendum, string? Note, string? ReasonId, string? ReasonText);

/// <summary>The J-03 internal surface.</summary>
public static class ServiceRequestEndpoints
{
    public static RouteGroupBuilder MapServiceRequestEndpoints(this RouteGroupBuilder v1)
    {
        var requests = v1.MapGroup("/internal/service-requests")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy)
            // F-0305 إلحاق خدمة جديدة — J-03's internal half.
            .RequireFeature("F-0305");

        requests.MapGet("/", async (
            string? search,
            string? service,
            string? status,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var rows = await (
                from request in db.ServiceRequests
                join user in db.Users on request.TrainerUserId equals user.UserId
                orderby request.SubmittedAt descending
                select new { request, user.FullNameAr }).ToListAsync(ct);

            var filtered = rows.Where(x =>
                    (string.IsNullOrWhiteSpace(search)
                        || x.FullNameAr.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase))
                    && (string.IsNullOrWhiteSpace(service) || x.request.RequestedService == service)
                    && (string.IsNullOrWhiteSpace(status) || x.request.Status == status))
                .ToList();

            return Results.Ok(new ServiceRequestListWire(
                [.. filtered.Select(x => Summary(x.request, x.FullNameAr))],
                filtered.Count,
                rows.Count(x => x.request.Status == ServiceRequestStatuses.Pending)));
        }).WithName("ServiceRequests");

        requests.MapGet("/{id}", async (
            string id,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var found = await FindAsync(id, db, ct);
            if (found is null)
            {
                return Results.Problem(statusCode: 404, detail: "Service request not found.");
            }
            return Results.Ok(await DetailWireAsync(db, found, ct));
        }).WithName("ServiceRequestDetail");

        requests.MapPost("/{id}/decision", async (
            string id,
            DecisionInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            CancellationToken ct) =>
        {
            var request = await FindAsync(id, db, ct);
            if (request is null)
            {
                return Results.Problem(statusCode: 404, detail: "Service request not found.");
            }
            if (request.Status != ServiceRequestStatuses.Pending)
            {
                return Results.Problem(statusCode: 409, detail: "Already decided.");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;

            if (string.Equals(input.Kind, "approve", StringComparison.Ordinal))
            {
                // F3/AC-4 / BR-0305 — no addendum DOCUMENT, no finalized
                // approval. A file name alone no longer satisfies the gate.
                var addendumDocument = await Documents.AttachmentUploads.FindAsync(
                    db, input.Addendum?.AttachmentId, ct);
                if (addendumDocument is null)
                {
                    return Results.Problem(statusCode: 400, detail: "addendum-missing");
                }
                request.Status = ServiceRequestStatuses.Approved;
                request.DecisionKind = "approve";
                request.AddendumFileName = addendumDocument.FileName;
                request.AddendumAttachmentId = addendumDocument.AttachmentId;
                request.DecisionNote = input.Note;

                // BR-0305 — the annex attaches to the trainer's EXISTING
                // agreement; no new agreement, no new signature.
                var agreement = await db.Agreements.FirstOrDefaultAsync(
                    a => a.TrainerUserId == request.TrainerUserId
                        && a.Status == AgreementStatuses.Active, ct);
                if (agreement is not null)
                {
                    db.Addenda.Add(new AddendumRecord
                    {
                        AddendumId = Guid.NewGuid(),
                        AgreementId = agreement.AgreementId,
                        Service = request.RequestedService,
                        DocumentFileName = addendumDocument.FileName,
                        AttachmentId = addendumDocument.AttachmentId,
                        ServiceRequestId = request.ServiceRequestId,
                        ApprovedBy = actor.UserId,
                        ApprovedAt = now,
                    });
                    if (!await db.AgreementServices.AnyAsync(
                        s => s.AgreementId == agreement.AgreementId
                            && s.Service == request.RequestedService, ct))
                    {
                        db.AgreementServices.Add(new AgreementServiceRow
                        {
                            AgreementServiceId = Guid.NewGuid(),
                            AgreementId = agreement.AgreementId,
                            Service = request.RequestedService,
                        });
                    }
                }

                // The trainer's approved scope widens — the accreditation
                // layer is Expert-Hub-mastered data (P-134), in BOTH places
                // it is recorded: the application's per-service outcome and
                // the trainer's own `TRAINER_SERVICE` rows.
                await TrainerProfileService.AddAccreditedServiceAsync(
                    db, request.TrainerUserId, request.RequestedService, now, ct);

                var existing = await db.ApplicationServices.FirstOrDefaultAsync(
                    s => s.ApplicationId == request.ApplicationId
                        && s.Service == request.RequestedService, ct);
                if (existing is null)
                {
                    db.ApplicationServices.Add(new ApplicationServiceEntry
                    {
                        ApplicationServiceId = Guid.NewGuid(),
                        ApplicationId = request.ApplicationId,
                        Service = request.RequestedService,
                        Outcome = ServiceOutcomes.Accepted,
                        DecidedAt = now,
                    });
                }
                else
                {
                    existing.Outcome = ServiceOutcomes.Accepted;
                    existing.DecidedAt = now;
                }

                // J-03/F3/AC-6 — approval notified with the updated addendum.
                await dispatcher.RaiseAsync(
                    "EV-0103",
                    new NotificationEventContext(
                        SourceEntityId: request.ServiceRequestId,
                        RecordSubjectUserId: request.TrainerUserId,
                        ActingStaffUserId: actor.UserId),
                    new Dictionary<string, string>
                    {
                        ["serviceName"] = ApplicationServices.NameAr(request.RequestedService),
                        ["referenceNumber"] = request.Reference,
                    },
                    ct);
            }
            else if (string.Equals(input.Kind, "reject", StringComparison.Ordinal))
            {
                var reason = ServiceRequestRejectionReasons.All
                    .FirstOrDefault(r => r.Id == input.ReasonId);
                if (reason is null)
                {
                    return Results.Problem(statusCode: 400, detail: "reason-missing");
                }
                if (reason.RequiresText && string.IsNullOrWhiteSpace(input.ReasonText))
                {
                    return Results.Problem(statusCode: 400, detail: "reason-text-missing");
                }
                request.Status = ServiceRequestStatuses.Rejected;
                request.DecisionKind = "reject";
                request.RejectionReasonId = reason.Id;
                request.RejectionReasonText = input.ReasonText;

                // F3/AC-7 — the outcome WITHOUT the reason: the raise carries
                // no reason placeholder, so no template can render one.
                await dispatcher.RaiseAsync(
                    "EV-0104",
                    new NotificationEventContext(
                        SourceEntityId: request.ServiceRequestId,
                        RecordSubjectUserId: request.TrainerUserId,
                        ActingStaffUserId: actor.UserId),
                    new Dictionary<string, string>
                    {
                        ["serviceName"] = ApplicationServices.NameAr(request.RequestedService),
                        ["referenceNumber"] = request.Reference,
                    },
                    ct);
            }
            else
            {
                return Results.Problem(statusCode: 400, detail: "Unknown decision.");
            }

            request.DecidedBy = actor.UserId;
            request.DecidedAt = now;
            await db.SaveChangesAsync(ct);
            return Results.Ok(await DetailWireAsync(db, request, ct));
        }).WithName("DecideServiceRequest");

        return v1;
    }

    private static async Task<ServiceRequest?> FindAsync(
        string id,
        ExpertHubDbContext db,
        CancellationToken ct) =>
        Guid.TryParse(id, out var requestId)
            ? await db.ServiceRequests.FirstOrDefaultAsync(r => r.ServiceRequestId == requestId, ct)
            : null;

    private static ServiceRequestSummaryWire Summary(ServiceRequest request, string trainerName) =>
        new(
            request.ServiceRequestId.ToString(),
            request.Reference,
            request.TrainerUserId.ToString(),
            trainerName,
            request.RequestedService,
            request.Status,
            ApplicationEndpoints.Iso(request.SubmittedAt));

    private static async Task<ServiceRequestDetailWire> DetailWireAsync(
        ExpertHubDbContext db,
        ServiceRequest request,
        CancellationToken ct)
    {
        var trainer = await db.Users.SingleAsync(u => u.UserId == request.TrainerUserId, ct);
        var currentServices = await db.ApplicationServices
            .Where(s => s.ApplicationId == request.ApplicationId
                && s.Outcome == ServiceOutcomes.Accepted)
            .Select(s => s.Service)
            .ToListAsync(ct);

        var deltaValues = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
            request.DeltaValues, ApplicationFormLogic.WireJson) ?? [];
        var fieldLabels = await db.FormFields
            .Where(f => deltaValues.Keys.Contains(f.FieldCode))
            .Select(f => new { f.FieldCode, f.LabelAr, f.LabelEn })
            .ToListAsync(ct);
        var submittedFields = deltaValues
            .Select(pair =>
            {
                var label = fieldLabels.FirstOrDefault(l => l.FieldCode == pair.Key);
                return new SubmittedFieldWire(
                    new LocalizedTextWire(label?.LabelAr ?? pair.Key, label?.LabelEn ?? pair.Key),
                    DisplayValue(pair.Value));
            })
            .ToList();

        var deltaAttachments = JsonSerializer.Deserialize<List<AddServiceAttachmentInputWire>>(
            request.DeltaAttachments, ApplicationFormLogic.WireJson) ?? [];
        var ruleLabels = await db.AttachmentRules
            .Select(r => new { r.RuleCode, r.LabelAr, r.LabelEn })
            .ToListAsync(ct);
        var submittedAttachments = deltaAttachments
            .Where(a => a.RuleId is not null && a.FileName is not null)
            .Select(a =>
            {
                var label = ruleLabels.FirstOrDefault(l => l.RuleCode == a.RuleId);
                return new SubmittedAttachmentWire(
                    a.RuleId!,
                    new LocalizedTextWire(label?.LabelAr ?? a.RuleId!, label?.LabelEn ?? a.RuleId!),
                    a.FileName!);
            })
            .ToList();

        DecisionRecordWire? decision = null;
        if (request.DecisionKind is not null)
        {
            var decider = request.DecidedBy is { } deciderId
                ? await db.Users.SingleAsync(u => u.UserId == deciderId, ct)
                : null;
            decision = new DecisionRecordWire(
                request.DecisionKind,
                ApplicationEndpoints.Iso(request.DecidedAt ?? request.SubmittedAt),
                decider?.FullNameAr ?? string.Empty,
                request.RejectionReasonId,
                request.RejectionReasonText,
                request.AddendumFileName,
                request.DecisionNote,
                request.AddendumAttachmentId is { } addendumId
                    ? Documents.AttachmentUploads.DownloadUrl(addendumId)
                    : null);
        }

        return new ServiceRequestDetailWire(
            request.ServiceRequestId.ToString(),
            request.Reference,
            request.TrainerUserId.ToString(),
            trainer.FullNameAr,
            request.RequestedService,
            request.Status,
            ApplicationEndpoints.Iso(request.SubmittedAt),
            new TrainerContextWire(
                trainer.UserId.ToString(),
                trainer.FullNameAr,
                currentServices,
                // BE-09's trainer profile supplies these for real; until then
                // the served context is the platform's own minimum — no
                // specialties on record, the ENTRY classification tier as the
                // pre-BE-09 placeholder, and no calculated rating (02D).
                Specialties: [],
                Classification: "certified",
                EvaluationOverall: null,
                Agreement: null),
            submittedFields,
            submittedAttachments,
            [.. ServiceRequestRejectionReasons.All.Select(r => new RejectionReasonWire(
                r.Id, new LocalizedTextWire(r.LabelAr, r.LabelEn), r.RequiresText))],
            decision,
            // J-03's open decision-maker role: any internal session may decide
            // (P-J9 — served, so the eventual ruling changes only this line).
            new ViewerWire(
                CanDecide: request.Status == ServiceRequestStatuses.Pending,
                BlockedReason: request.Status == ServiceRequestStatuses.Pending ? null : "already-decided"));
    }

    private static string DisplayValue(JsonElement value) => value.ValueKind switch
    {
        JsonValueKind.String => value.GetString() ?? string.Empty,
        JsonValueKind.True => "نعم",
        JsonValueKind.False => "لا",
        JsonValueKind.Array => string.Join("، ", value.EnumerateArray()
            .Select(item => item.GetString() ?? string.Empty)),
        _ => value.GetRawText(),
    };
}
