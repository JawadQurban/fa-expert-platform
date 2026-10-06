using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using ExpertHub.Api.Agreements;
using ExpertHub.Api.Auth;
using ExpertHub.Api.Interviews;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Meetings;
using ExpertHub.Infrastructure.Applications;
using ExpertHub.Infrastructure.Documents;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Screening;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Applications;

/*
 * CAP-01 — applications (BRD §8.1, J-01/J-03), behind the contract
 * `applicationsService.ts` already calls:
 *
 *   GET  v1/applications/schema                       (public — the guest fills first, J-01 §3B)
 *   GET  v1/me/applications?page=&pageSize=&search=&status=&service=
 *   POST v1/me/applications/draft/start
 *   POST v1/me/applications/draft
 *   POST v1/me/applications/draft/attachments/remove
 *   POST v1/me/applications/submit
 *   GET  v1/me/applications/{id}
 *   POST v1/me/applications/{id}/interview-slot        → 409 at this stage (BE-07's flow)
 *   POST v1/me/applications/{id}/interview-reschedule  → 409 at this stage (BE-07's flow)
 *   POST v1/me/applications/{id}/agreement-decision    → 409 at this stage (BE-08's flow)
 *   GET  v1/me/applications/{id}/services/context
 *   POST v1/me/applications/{id}/services
 *
 * The structural rules: a draft has NO reference and submit is the only place
 * one is issued (`BR-0107`); one un-decided application blocks a new one
 * (`BR-0101`, with the approved-trainer block routed to add-service instead);
 * completeness is enforced server-side against the SAME schema rows the form
 * renders (`BR-0105`); and submission raises `EV-0101` through CAP-07's
 * dispatcher in the same transaction — the capability emits and knows nothing
 * (`BR-0703`).
 *
 * ⚠️ `G26`/`G27` (file storage + antivirus) stay open: no upload endpoint
 * exists (the frontend's own HTTP provider 501s it), so a required-attachment
 * rule blocks live submission until they close — enforced honestly, not
 * waved through. The interview/agreement actions above 409 until BE-07/BE-08
 * build their flows; for every application THIS increment can produce, that
 * conflict is the correct answer, not a stub.
 */

/// <summary>The wire types — `application.types.ts` / `applicationForm.types.ts`.</summary>
internal sealed record ApplicationSummaryWire(
    string Id, string? Reference, IReadOnlyList<string> Services, string Status,
    string CreatedAt, string? SubmittedAt, string UpdatedAt);

internal sealed record MyApplicationsListWire(
    IReadOnlyList<ApplicationSummaryWire> Items, int TotalCount, int Page, int PageSize,
    int PageCount, bool CanCreateNew, string? ActiveApplicationId, int TotalApplications,
    IReadOnlyDictionary<string, int> StatusCounts);

internal sealed record DraftAttachmentWire(string Id, string RuleId, string FileName, long SizeBytes);

internal sealed record ApplicationDraftWire(
    string Id, IReadOnlyList<string> Services,
    IReadOnlyDictionary<string, JsonElement> Values,
    IReadOnlyList<DraftAttachmentWire> Attachments, string UpdatedAt,
    // The form version the draft was started on, so the page loads that one.
    string SchemaVersion,
    // The repeatable sections' entries, section code -> entries in order.
    // ABSENT for a draft written before repeatable groups existed, which the
    // page reads as exactly one entry built from `Values` (`BR-0103`).
    IReadOnlyDictionary<string, IReadOnlyList<DraftEntryWire>>? Entries = null);

internal sealed record StartOrResumeDraftWire(
    ApplicationDraftWire? Draft, bool Resumed, string? BlockReason, string? BlockedByApplicationId);

internal sealed record SaveDraftInputWire(
    IReadOnlyList<string>? Services, IReadOnlyDictionary<string, JsonElement>? Values,
    IReadOnlyDictionary<string, IReadOnlyList<DraftEntryWire>>? Entries = null);

/// <summary>One entry of a repeatable section. The array position IS the
/// entry index; <c>EntryId</c> is the client's stable handle for it, so an
/// entry survives a reorder or a removal above it.</summary>
internal sealed record DraftEntryWire(
    string? EntryId, IReadOnlyDictionary<string, JsonElement>? Values);

internal sealed record RemoveAttachmentInputWire(string? AttachmentId);

internal sealed record SelectSlotInputWire(string? SlotId);

internal sealed record ApplicantRescheduleInputWire(string? Note);

internal sealed record SubmitApplicationWire(string ApplicationId, string Reference, string SubmittedAt);

internal sealed record TimelineStageWire(string Id, string State);

internal sealed record PerServiceOutcomeWire(string Service, string Outcome);

internal sealed record DetailAttachmentWire(
    string Id, string Name, string Kind,
    // The document the applicant uploaded, so their own copy is openable —
    // QA found three files listed under one label with no way to tell them
    // apart and no link (`D-09`).
    ServiceRequests.LocalizedTextWire? Label, string? Url);

internal sealed record BankBlockWire(
    string State, IReadOnlyDictionary<string, string>? Fields,
    string? RequestedAt, string? CompletedAt,
    // What the Academy already holds — offered so the applicant checks rather
    // than retypes. Deliberately NOT `Fields`: that key means "what they
    // confirmed", and the two must never be confused (`P-229`).
    IReadOnlyDictionary<string, string>? Suggested);

internal sealed record ApplicationDetailWire(
    string Id, string? Reference, IReadOnlyList<string> Services, string Status,
    string CreatedAt, string? SubmittedAt, string UpdatedAt,
    IReadOnlyList<TimelineStageWire> Timeline,
    IReadOnlyList<PerServiceOutcomeWire> PerServiceOutcomes,
    string? RejectionReason,
    IReadOnlyList<DetailAttachmentWire> Attachments,
    string Action,
    /*
     * The answers the applicant actually submitted, against the form version
     * they submitted them on. The page had never shown one: the detail wire
     * carried status, timeline and attachments and nothing the person typed.
     * `Entries` is absent for a version with no repeatable sections, exactly
     * as on the draft.
     */
    object FormSchema,
    IReadOnlyDictionary<string, JsonElement> Values,
    IReadOnlyDictionary<string, IReadOnlyList<DraftEntryWire>>? Entries,
    // J-09/F6 — the section that opens after final approval. Null before the
    // applicant is asked, so no bank form can render over a stage that has
    // not reached it.
    object? BankData,
    // BE-07/BE-08 territory — null/none/not-ready is this stage's truth.
    object? Interview,
    string AgreementState,
    object? Agreement,
    string Sync);

internal sealed record AddServiceContextWire(
    string ApplicationId, string Reference, IReadOnlyList<string> CurrentServices,
    bool FastAvailable, bool Eligible);

internal sealed record AddServiceAttachmentInputWire(string? RuleId, string? FileName, long SizeBytes);

internal sealed record AddServiceRequestInputWire(
    string? Service,
    IReadOnlyDictionary<string, JsonElement>? Values,
    IReadOnlyList<AddServiceAttachmentInputWire>? Attachments);

internal sealed record AddServiceRequestWire(string RequestId, string SubmittedAt);

/// <summary>The CAP-01 trainer surface.</summary>
public static class ApplicationEndpoints
{
    public static RouteGroupBuilder MapApplicationEndpoints(this RouteGroupBuilder v1)
    {
        /*
         * The schema is form CONFIGURATION, not personal data, and J-01 §3B
         * lets a guest read the form before any sign-in — so this one route
         * is anonymous, exactly as the public New Application page needs.
         */
        // `?version=` serves a superseded version too: a draft keeps the
        // version it was started on (`BR-0103`), so its form must still load.
        v1.MapGet("/applications/schema", async (
            string? version, ExpertHubDbContext db, CancellationToken ct) =>
            version is not null && !await db.FormSchemas.AnyAsync(s => s.SchemaVersion == version, ct)
                ? Results.Problem(statusCode: 404, detail: "Unknown form schema version.")
                : Results.Ok(await BuildSchemaWireAsync(db, ct, version))).WithName("ApplicationSchema");

        var me = v1.MapGroup("/me/applications").RequireAuthorization();

        /*
         * What the Academy already knows about the person filling the form
         * (owner ruling, 2026-09-09).
         *
         * ⚠️ Deliberately NOT part of `/applications/schema`. That route is
         * anonymous, because `J-01` §3B lets a guest read the form before
         * signing in — and personal data must never ride on an anonymous
         * response. This one is authenticated and own-scope, so a person can
         * only ever be handed their own answers.
         */
        me.MapGet("/prefill", async (
            HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            return Results.Ok(await ApplicationPrefill.ForUserAsync(db, actor.UserId, ct));
        }).WithName("ApplicationPrefill");

        me.MapGet("/", async (
            int page,
            int pageSize,
            string? search,
            string? status,
            string? service,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            await db.SaveChangesAsync(ct); // persist a first-contact JIT actor

            var mine = await db.Applications
                .Where(a => a.ApplicantUserId == actor.UserId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync(ct);
            var serviceRows = await db.ApplicationServices
                .Where(s => db.Applications.Any(
                    a => a.ApplicationId == s.ApplicationId && a.ApplicantUserId == actor.UserId))
                .ToListAsync(ct);
            var servicesByApp = serviceRows
                .GroupBy(s => s.ApplicationId)
                .ToDictionary(g => g.Key, g => (IReadOnlyList<string>)[.. g.Select(s => s.Service)]);

            var filtered = mine.Where(a =>
                    (string.IsNullOrWhiteSpace(search)
                        || (a.Reference ?? string.Empty).Contains(search.Trim(), StringComparison.OrdinalIgnoreCase))
                    && (string.IsNullOrWhiteSpace(status) || a.Status == status)
                    && (string.IsNullOrWhiteSpace(service)
                        || (servicesByApp.TryGetValue(a.ApplicationId, out var s) && s.Contains(service))))
                .ToList();

            var safePageSize = Math.Clamp(pageSize, 1, 100);
            var pageCount = Math.Max(1, (int)Math.Ceiling(filtered.Count / (double)safePageSize));
            var safePage = Math.Clamp(page, 1, pageCount);
            var items = filtered
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .Select(a => Summary(a, servicesByApp))
                .ToList();

            var undecided = mine.FirstOrDefault(a => ApplicationStatuses.Undecided.Contains(a.Status));
            var counts = ApplicationStatuses.All.ToDictionary(
                s => s,
                s => mine.Count(a => a.Status == s));

            return Results.Ok(new MyApplicationsListWire(
                items, filtered.Count, safePage, safePageSize, pageCount,
                CanCreateNew: undecided is null,
                ActiveApplicationId: undecided?.ApplicationId.ToString(),
                TotalApplications: mine.Count,
                StatusCounts: counts));
        }).WithName("MyApplications");

        me.MapPost("/draft/start", async (
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);

            // J-01/F3/AC-4 — an accredited trainer is sent to add-service, not
            // to a second full application.
            if (await ActorResolution.HoldsRoleAsync(db, actor.UserId, RoleCode.Trainer, ct))
            {
                await db.SaveChangesAsync(ct);
                return Results.Ok(new StartOrResumeDraftWire(null, false, "approved-trainer", null));
            }

            var mine = await db.Applications
                .Where(a => a.ApplicantUserId == actor.UserId)
                .ToListAsync(ct);
            var draft = mine.FirstOrDefault(a => a.Status == ApplicationStatuses.Draft);
            if (draft is not null)
            {
                await db.SaveChangesAsync(ct);
                return Results.Ok(new StartOrResumeDraftWire(
                    await DraftWireAsync(db, draft, ct), Resumed: true, null, null));
            }

            // BR-0101 / J-01/F3/AC-3 — one un-decided application at a time.
            var open = mine.FirstOrDefault(a => ApplicationStatuses.Undecided.Contains(a.Status));
            if (open is not null)
            {
                await db.SaveChangesAsync(ct);
                return Results.Ok(new StartOrResumeDraftWire(
                    null, false, "open-application", open.ApplicationId.ToString()));
            }

            var now = DateTime.UtcNow;
            var created = new Application
            {
                ApplicationId = Guid.NewGuid(),
                ApplicantUserId = actor.UserId,
                SchemaVersion = FormSchemaVersions.Current,
                Status = ApplicationStatuses.Draft,
                Origin = ApplicationOrigins.SelfService,
                CreatedAt = now,
                UpdatedAt = now,
            };
            db.Applications.Add(created);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new StartOrResumeDraftWire(
                await DraftWireAsync(db, created, ct), Resumed: false, null, null));
        }).WithName("StartOrResumeDraft");

        me.MapPost("/draft", async (
            SaveDraftInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var draft = await db.Applications.FirstOrDefaultAsync(
                a => a.ApplicantUserId == actor.UserId && a.Status == ApplicationStatuses.Draft, ct);
            if (draft is null)
            {
                return Results.Problem(statusCode: 409, detail: "No draft to save.");
            }
            var invalid = await ApplyDraftInputAsync(db, draft, input, ct);
            if (invalid is not null)
            {
                return invalid;
            }
            draft.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(await DraftWireAsync(db, draft, ct));
        }).WithName("SaveDraft");

        /*
         * EH-TP-05 — the upload `BR-0106` describes. Multipart, because a file
         * is a file; everything else on this surface is JSON.
         *
         * The rule is re-validated HERE and not trusted from the browser: the
         * accepted formats, the size cap and the per-rule count all come from
         * `ATTACHMENT_RULE`, which is the same row the form renders from. A
         * client that skipped the input's `accept` attribute gets the same
         * answer as one that honoured it.
         *
         * ⚠️ `G26` (where documents live) and `G27` (antivirus) are open, so
         * both are PORTS with working defaults — the database stores the bytes
         * and the scan status records `not-scanned` rather than claiming a
         * file passed a check nobody ran. See `IDocumentStore`.
         */
        /*
         * Opening a file. An uploaded document is useless if the screener who
         * has to read the CV cannot open it, so the download ships with the
         * upload rather than waiting for `G26`.
         *
         * Who may open it: the person who uploaded it, or any internal user.
         * The internal surface is already role-gated at the route group level,
         * and an applicant's own attachment is theirs by ownership — the same
         * guarantee the rest of `/me/*` holds.
         */
        v1.MapGet("/attachments/{id}", async (
            string id,
            HttpContext http,
            ExpertHubDbContext db,
            IDocumentStore store,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(id, out var attachmentId))
            {
                return Results.NotFound();
            }
            var attachment = await db.Attachments
                .FirstOrDefaultAsync(a => a.AttachmentId == attachmentId, ct);
            if (attachment is null)
            {
                return Results.NotFound();
            }

            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var isOwner = attachment.UploadedBy == actor.UserId;
            /*
             * ⚠️ The session's `internal` role, NOT `APP_USER.is_employee`.
             *
             * `is_employee` comes from the Academy's own record and decides who
             * is selectable for a committee; nothing in the product ever sets it
             * back to false. Reading it as permission meant every Academy
             * employee — and anyone whose Expert Hub role had been revoked —
             * could download any applicant's CV and ID document by id.
             */
            var isStaff = http.User.HasClaim(
                ExpertHubClaims.Role, ExpertHubClaims.InternalRole);
            // `P-333` — the trainer reads the agreement file staff uploaded for
            // them, once it has been sent to them (and afterwards, as a record).
            var isAgreementParty = !isOwner && !isStaff && await (
                from version in db.AgreementDocumentVersions
                join agreement in db.Agreements on version.AgreementId equals agreement.AgreementId
                where version.AttachmentId == attachmentId
                    && agreement.TrainerUserId == actor.UserId
                    && (agreement.SentToApplicantAt != null || agreement.ApplicantDecidedAt != null)
                select version).AnyAsync(ct);
            if (!isOwner && !isStaff && !isAgreementParty)
            {
                // Not "not found": the file exists and is simply not theirs.
                return Results.Problem(statusCode: 403, title: "Forbidden",
                    detail: "This document belongs to another applicant.");
            }

            var content = await store.GetAsync(attachment.StorageRef, ct);
            if (content is null)
            {
                // The ref belongs to a store this deployment does not have —
                // say so rather than serving an empty file.
                return Results.Problem(statusCode: 404,
                    detail: "The stored file could not be read.");
            }
            return Results.File(content.Bytes, content.MimeType, attachment.FileName);
        }).RequireAuthorization().WithName("DownloadAttachment");

        me.MapPost("/draft/attachments", async (
            HttpRequest request,
            HttpContext http,
            ExpertHubDbContext db,
            IDocumentStore store,
            IUploadScanner scanner,
            CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
            {
                return Results.Problem(statusCode: 415, detail: "Expected a multipart upload.");
            }
            var form = await request.ReadFormAsync(ct);
            var file = form.Files.GetFile("file");
            var ruleId = form["ruleId"].ToString();
            if (file is null || file.Length == 0 || string.IsNullOrWhiteSpace(ruleId))
            {
                return Results.Problem(statusCode: 400, detail: "A file and a ruleId are required.");
            }

            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var draft = await db.Applications.FirstOrDefaultAsync(
                a => a.ApplicantUserId == actor.UserId && a.Status == ApplicationStatuses.Draft, ct);
            if (draft is null)
            {
                return Results.Problem(statusCode: 409, detail: "No draft to attach to.");
            }

            // ⚠️ The form schema serves each rule's `id` as its CODE (`cv`,
            // `qualification`) — see the schema endpoint — so that is what the
            // browser sends back, and that is what `APPLICATION_ATTACHMENT`
            // stores. Parsing it as the internal GUID refused every upload.
            var rule = await db.AttachmentRules.FirstOrDefaultAsync(
                r => r.RuleCode == ruleId && r.SchemaVersion == draft.SchemaVersion, ct);
            if (rule is null)
            {
                return Results.Problem(statusCode: 400, detail: "Unknown attachment rule.");
            }

            var extension = Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant();
            // `ATTACHMENT_RULE.accepted_formats` is stored as the JSON array the
            // owner's field matrix supplies, and read as one — not split on
            // commas, which would keep the brackets and quotes.
            var accepted = (JsonSerializer.Deserialize<string[]>(rule.AcceptedFormats) ?? [])
                .Select(f => f.TrimStart('.').ToLowerInvariant())
                .ToList();
            if (!accepted.Contains(extension))
            {
                return Results.Problem(
                    statusCode: 422,
                    detail: $"'{extension}' is not an accepted format for this document.",
                    extensions: new Dictionary<string, object?> { ["reason"] = "format" });
            }
            if (file.Length > (long)rule.MaxSizeMb * 1024 * 1024)
            {
                return Results.Problem(
                    statusCode: 422,
                    detail: $"The file is larger than {rule.MaxSizeMb} MB.",
                    extensions: new Dictionary<string, object?> { ["reason"] = "size" });
            }

            var already = await db.ApplicationAttachments.CountAsync(
                a => a.ApplicationId == draft.ApplicationId && a.RuleCode == rule.RuleCode, ct);
            if (already >= rule.MaxCount)
            {
                return Results.Problem(
                    statusCode: 422,
                    detail: $"This document accepts {rule.MaxCount} file(s).",
                    extensions: new Dictionary<string, object?> { ["reason"] = "count" });
            }

            byte[] content;
            using (var buffer = new MemoryStream())
            {
                await file.CopyToAsync(buffer, ct);
                content = buffer.ToArray();
            }

            var now = DateTime.UtcNow;
            var attachment = new Attachment
            {
                AttachmentId = Guid.NewGuid(),
                FileName = Path.GetFileName(file.FileName),
                MimeType = string.IsNullOrWhiteSpace(file.ContentType)
                    ? "application/octet-stream"
                    : file.ContentType,
                SizeBytes = file.Length,
                StorageRef = await store.PutAsync(content, file.FileName, file.ContentType, ct),
                Checksum = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(content)),
                // ⚠️ `G27` — `not-scanned` is recorded as itself, never as `clean`.
                ScanStatus = await scanner.ScanAsync(content, ct),
                UploadedBy = actor.UserId,
                UploadedAt = now,
            };
            db.Attachments.Add(attachment);
            db.ApplicationAttachments.Add(new ApplicationAttachment
            {
                ApplicationAttachmentId = Guid.NewGuid(),
                ApplicationId = draft.ApplicationId,
                AttachmentId = attachment.AttachmentId,
                RuleCode = rule.RuleCode,
                FileName = attachment.FileName,
                SizeBytes = attachment.SizeBytes,
            });
            draft.UpdatedAt = now;
            await db.SaveChangesAsync(ct);

            return Results.Ok(new DraftAttachmentWire(
                attachment.AttachmentId.ToString(),
                // The code again, so the page can file it under the rule it
                // rendered — the same id it sent.
                rule.RuleCode,
                attachment.FileName,
                attachment.SizeBytes));
        }).WithName("UploadDraftAttachment").DisableAntiforgery();

        me.MapPost("/draft/attachments/remove", async (
            RemoveAttachmentInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (!Guid.TryParse(input.AttachmentId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Attachment not found.");
            }
            var row = await db.ApplicationAttachments.FirstOrDefaultAsync(
                a => a.ApplicationAttachmentId == id
                    && db.Applications.Any(app => app.ApplicationId == a.ApplicationId
                        && app.ApplicantUserId == actor.UserId
                        && app.Status == ApplicationStatuses.Draft),
                ct);
            if (row is null)
            {
                return Results.Problem(statusCode: 404, detail: "Attachment not found.");
            }
            db.ApplicationAttachments.Remove(row);
            await db.SaveChangesAsync(ct);
            return Results.Ok((object?)null);
        }).WithName("RemoveDraftAttachment");

        me.MapPost("/submit", async (
            SaveDraftInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            IntegrationHub hub,
            CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var draft = await db.Applications.FirstOrDefaultAsync(
                a => a.ApplicantUserId == actor.UserId && a.Status == ApplicationStatuses.Draft, ct);
            if (draft is null)
            {
                return Results.Problem(statusCode: 409, detail: "No draft to submit.");
            }
            var invalid = await ApplyDraftInputAsync(db, draft, input, ct);
            if (invalid is not null)
            {
                return invalid;
            }

            // BR-0105 — completeness, against the same schema rows the form
            // renders. The frontend's validation is UX; this is the gate.
            // Judged on the SUBMITTED values (the rows staged above are not
            // yet saved — and must not be until the gate passes).
            var services = input.Services ?? [];
            var values = input.Values ?? new Dictionary<string, JsonElement>();
            var fields = (await db.FormFields
                    .Where(f => f.SchemaVersion == draft.SchemaVersion)
                    .OrderBy(f => f.OrderIndex)
                    .ToListAsync(ct))
                .Select(f => ApplicationFormLogic.Parse(f.Definition))
                .ToList();
            var rules = (await db.AttachmentRules
                    .Where(r => r.SchemaVersion == draft.SchemaVersion)
                    .ToListAsync(ct))
                .Select(r => (r.RuleCode, (IReadOnlyList<string>)(
                    JsonSerializer.Deserialize<string[]>(r.RequiredFor) ?? [])))
                .ToList();
            var present = await db.ApplicationAttachments
                .Where(a => a.ApplicationId == draft.ApplicationId)
                .Select(a => a.RuleCode)
                .ToListAsync(ct);

            var failedFields = ApplicationFormLogic.MissingOrInvalidFields(fields, services, values);
            var missingRules = ApplicationFormLogic.MissingAttachmentRules(rules, services, present);
            if (services.Count == 0 || failedFields.Count > 0 || missingRules.Count > 0)
            {
                return Results.Problem(
                    statusCode: 400,
                    detail: "Application is incomplete.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["fieldErrors"] = failedFields,
                        ["missingAttachmentRuleIds"] = missingRules,
                    });
            }

            var now = DateTime.UtcNow;
            draft.Reference = await NextReferenceAsync(db, now, ct);
            draft.Status = ApplicationStatuses.Submitted;
            draft.SubmittedAt = now;
            draft.UpdatedAt = now;
            // The per-service rows were staged by ApplyDraftInputAsync above,
            // outcome `pending` (BR-0403) — nothing to add twice here.

            // J-01 user flow 7 — the submission confirmation, raised through
            // CAP-07 in the SAME transaction: a notification can never
            // describe a submission that failed to commit.
            await dispatcher.RaiseAsync(
                "EV-0101",
                new NotificationEventContext(
                    SourceEntityId: draft.ApplicationId,
                    RecordSubjectUserId: actor.UserId),
                new Dictionary<string, string> { ["referenceNumber"] = draft.Reference },
                ct);

            // INT-06 (`08` §4.1 — trigger: application submitted). Staged in
            // the SAME transaction, so the provider is never asked about a
            // submission that failed to commit, and the request rides the
            // outbox so a slow model never holds this one open.
            await QueueAiAnalysisAsync(db, hub, draft, ct);

            await db.SaveChangesAsync(ct);
            return Results.Ok(new SubmitApplicationWire(
                draft.ApplicationId.ToString(), draft.Reference, Iso(now)));
        }).WithName("SubmitApplication");

        me.MapGet("/{id}", async (
            string id,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var (application, notFound) = await FindOwnedAsync(id, http, db, ct);
            if (application is null)
            {
                return notFound!;
            }
            return Results.Ok(await DetailWireAsync(db, application, ct));
        }).WithName("MyApplicationDetail");

        /*
         * J-06/F1 — the applicant confirms a proposed slot: the choice is made
         * in the portal, never in the email (F1/AC-2). Confirmation issues the
         * ticket (F2/AC-3), which then SURVIVES every reschedule (F4/AC-6).
         */
        me.MapPost("/{id}/interview-slot", async (
            string id,
            SelectSlotInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            IMeetingProvider meetings,
            IConfiguration configuration,
            CancellationToken ct) =>
        {
            var (application, notFound) = await FindOwnedAsync(id, http, db, ct);
            if (application is null)
            {
                return notFound!;
            }
            var interview = await db.Interviews.FirstOrDefaultAsync(
                i => i.ApplicationId == application.ApplicationId, ct);
            if (interview is null || interview.Status != InterviewStatuses.AwaitingSelection)
            {
                return Results.Problem(
                    statusCode: 409, detail: "The application has no interview to manage at this stage.");
            }
            if (!Guid.TryParse(input.SlotId, out var slotId)
                || !await db.InterviewSlots.AnyAsync(
                    s => s.SlotId == slotId && s.InterviewId == interview.InterviewId
                        && !s.IsSuperseded, ct))
            {
                return Results.Problem(statusCode: 400, detail: "Unknown slot.");
            }
            var now = DateTime.UtcNow;
            interview.ConfirmedSlotId = slotId;
            interview.Status = InterviewStatuses.Scheduled;
            interview.RescheduleRequestedAt = null;
            interview.RescheduleNote = null;
            // F2/AC-3 — issued once; F4/AC-6 — never re-issued.
            if (interview.TicketNumber is null)
            {
                var issued = await db.Interviews.CountAsync(i => i.TicketNumber != null, ct);
                interview.TicketNumber = string.Create(
                    CultureInfo.InvariantCulture, $"INT-{now.Year}-{issued + 1:D4}");
            }
            application.Status = ApplicationStatuses.InterviewScheduled;
            application.UpdatedAt = now;

            /*
             * `J-06/F2` — the meeting, booked at the one moment the time is
             * real. Owner ruling, 2026-09-09: created on confirmation, with
             * everybody invited including the applicant.
             *
             * ⚠️ Best effort, always. The applicant has just chosen a time and
             * a committee is expecting them; a calendar system that did not
             * answer must not cost them that. When nothing is booked the link
             * stays null — exactly as it has been — and staff can paste one.
             */
            if (meetings.IsConfigured)
            {
                var slot = await db.InterviewSlots
                    .FirstOrDefaultAsync(s => s.SlotId == slotId, ct);
                if (slot is not null)
                {
                    var booking = await InterviewMeeting.ForAsync(
                        db, meetings, configuration, application, interview, slot, ct);
                    if (booking is not null)
                    {
                        interview.MeetingUrl = booking.JoinUrl;
                        interview.MeetingExternalId = booking.ExternalId;
                    }
                }
            }

            // J-06 user flow 5 — confirmation + meeting invitation, together.
            await dispatcher.RaiseAsync(
                "EV-0203",
                new NotificationEventContext(
                    SourceEntityId: application.ApplicationId,
                    RecordSubjectUserId: application.ApplicantUserId),
                new Dictionary<string, string>
                {
                    ["referenceNumber"] = application.Reference ?? string.Empty,
                },
                ct);
            await db.SaveChangesAsync(ct);
            return Results.Ok(await DetailWireAsync(db, application, ct));
        }).WithName("SelectInterviewSlot");

        /*
         * J-06/F4 — the applicant asks for a different time: before selecting
         * (AC-1) or after confirming (AC-2). No reason is required — the
         * journey asks for none, and requiring one would invent a rule.
         */
        me.MapPost("/{id}/interview-reschedule", async (
            string id,
            ApplicantRescheduleInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var (application, notFound) = await FindOwnedAsync(id, http, db, ct);
            if (application is null)
            {
                return notFound!;
            }
            var interview = await db.Interviews.FirstOrDefaultAsync(
                i => i.ApplicationId == application.ApplicationId, ct);
            if (interview is null || interview.Status == InterviewStatuses.Completed
                || interview.RescheduleRequestedAt is not null)
            {
                return Results.Problem(
                    statusCode: 409, detail: "The application has no interview to manage at this stage.");
            }
            interview.RescheduleRequestedAt = DateTime.UtcNow;
            interview.RescheduleNote = string.IsNullOrWhiteSpace(input.Note) ? null : input.Note;
            application.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(await DetailWireAsync(db, application, ct));
        }).WithName("RequestInterviewReschedule");

        // J-11/F1 — e-sign, reject, or request a modification: three
        // mutually exclusive answers to one question, so one endpoint.
        me.MapPost("/{id}/agreement-decision", async (
            string id,
            ApplicantDecisionInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            CancellationToken ct) =>
        {
            var (application, notFound) = await FindOwnedAsync(id, http, db, ct);
            return application is null
                ? notFound!
                : await ApplicantAgreementEndpoints.DecideAsync(
                    application, input, http, db, dispatcher, ct);
        }).WithName("DecideOnAgreement");

        me.MapGet("/{id}/services/context", async (
            string id,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var (application, notFound) = await FindOwnedAsync(id, http, db, ct);
            if (application is null)
            {
                return notFound!;
            }
            var current = await CurrentServicesAsync(db, application.ApplicationId, ct);
            return Results.Ok(new AddServiceContextWire(
                application.ApplicationId.ToString(),
                application.Reference ?? string.Empty,
                current,
                // P-134 — the accreditation layer (approved services) is
                // Expert-Hub-mastered, so "current services" is OUR record and
                // is always readable; the FAST-availability guard the contract
                // carries is for the day a FAST read joins this projection.
                FastAvailable: true,
                Eligible: application.Status is ApplicationStatuses.Approved or ApplicationStatuses.Active));
        }).WithName("AddServiceContext");

        me.MapPost("/{id}/services", async (
            string id,
            AddServiceRequestInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var (application, notFound) = await FindOwnedAsync(id, http, db, ct);
            if (application is null)
            {
                return notFound!;
            }
            if (application.Status is not (ApplicationStatuses.Approved or ApplicationStatuses.Active))
            {
                return Results.Problem(statusCode: 409, detail: "Only an approved application can add a service.");
            }
            var schema = await db.FormSchemas.SingleAsync(
                s => s.SchemaVersion == application.SchemaVersion, ct);
            var selectable = JsonSerializer.Deserialize<string[]>(schema.SelectableServices) ?? [];
            var current = await CurrentServicesAsync(db, application.ApplicationId, ct);
            if (input.Service is null || !selectable.Contains(input.Service))
            {
                return Results.Problem(statusCode: 400, detail: "Unknown or non-selectable service.");
            }
            if (current.Contains(input.Service))
            {
                // BR-0110 — a service already approved cannot be requested again.
                return Results.Problem(statusCode: 409, detail: "Service already approved.");
            }
            if (await db.ServiceRequests.AnyAsync(
                r => r.TrainerUserId == application.ApplicantUserId
                    && r.RequestedService == input.Service
                    && r.Status == ServiceRequestStatuses.Pending, ct))
            {
                return Results.Problem(statusCode: 409, detail: "A request for this service is already pending.");
            }

            var now = DateTime.UtcNow;
            var request = new ServiceRequest
            {
                ServiceRequestId = Guid.NewGuid(),
                ApplicationId = application.ApplicationId,
                TrainerUserId = application.ApplicantUserId,
                Reference = await NextRequestReferenceAsync(db, now, ct),
                RequestedService = input.Service,
                Status = ServiceRequestStatuses.Pending,
                DeltaValues = JsonSerializer.Serialize(
                    input.Values ?? new Dictionary<string, JsonElement>(),
                    ApplicationFormLogic.WireJson),
                DeltaAttachments = JsonSerializer.Serialize(
                    (input.Attachments ?? []).Where(a => a.RuleId is not null && a.FileName is not null),
                    ApplicationFormLogic.WireJson),
                SubmittedAt = now,
            };
            db.ServiceRequests.Add(request);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new AddServiceRequestWire(request.ServiceRequestId.ToString(), Iso(now)));
        }).WithName("SubmitAddServiceRequest");

        return v1;
    }

    /* ── shared assembly ───────────────────────────────────────────────────── */

    /// <summary>The published schema, or the named <paramref name="version"/>.</summary>
    internal static async Task<object> BuildSchemaWireAsync(
        ExpertHubDbContext db, CancellationToken ct, string? version = null)
    {
        var schema = version is null
            ? await db.FormSchemas.SingleAsync(s => s.Status == FormSchemaStatuses.Published, ct)
            : await db.FormSchemas.SingleAsync(s => s.SchemaVersion == version, ct);
        var sections = await db.FormSections
            .Where(s => s.SchemaVersion == schema.SchemaVersion)
            .OrderBy(s => s.OrderIndex)
            .ToListAsync(ct);
        var fields = await db.FormFields
            .Where(f => f.SchemaVersion == schema.SchemaVersion)
            .OrderBy(f => f.OrderIndex)
            .ToListAsync(ct);
        var rules = await db.AttachmentRules
            .Where(r => r.SchemaVersion == schema.SchemaVersion)
            .OrderBy(r => r.RuleCode)
            .ToListAsync(ct);
        return new
        {
            version = schema.SchemaVersion,
            selectableServices = JsonSerializer.Deserialize<string[]>(schema.SelectableServices),
            // `repeatable` is only present on a section that HAS entries, so a
            // schema version from before repeatable groups serves exactly the
            // bytes it always served.
            sections = sections.Select(s => s.Repeatable is { Length: > 0 } repeat
                ? (object)new
                {
                    id = s.SectionCode,
                    titleAr = s.TitleAr,
                    titleEn = s.TitleEn,
                    order = s.OrderIndex,
                    repeatable = JsonSerializer.Deserialize<JsonElement>(repeat),
                }
                : new
                {
                    id = s.SectionCode,
                    titleAr = s.TitleAr,
                    titleEn = s.TitleEn,
                    order = s.OrderIndex,
                }),
            // The stored definition IS the wire field object — served verbatim,
            // so the API's schema is byte-for-byte the one the form renders.
            fields = fields.Select(f => JsonSerializer.Deserialize<JsonElement>(f.Definition)),
            attachments = rules.Select(r => r.PerEntryOf is { Length: > 0 } section
                ? (object)new
                {
                    id = r.RuleCode,
                    labelAr = r.LabelAr,
                    labelEn = r.LabelEn,
                    acceptedFormats = JsonSerializer.Deserialize<string[]>(r.AcceptedFormats),
                    maxSizeMb = r.MaxSizeMb,
                    maxCount = r.MaxCount,
                    requiredFor = JsonSerializer.Deserialize<string[]>(r.RequiredFor),
                    perEntryOf = section,
                }
                : new
                {
                    id = r.RuleCode,
                    labelAr = r.LabelAr,
                    labelEn = r.LabelEn,
                    acceptedFormats = JsonSerializer.Deserialize<string[]>(r.AcceptedFormats),
                    maxSizeMb = r.MaxSizeMb,
                    maxCount = r.MaxCount,
                    requiredFor = JsonSerializer.Deserialize<string[]>(r.RequiredFor),
                }),
        };
    }

    private static async Task<IResult?> ApplyDraftInputAsync(
        ExpertHubDbContext db,
        Application draft,
        SaveDraftInputWire input,
        CancellationToken ct)
    {
        var schema = await db.FormSchemas.SingleAsync(
            s => s.SchemaVersion == draft.SchemaVersion, ct);
        var selectable = JsonSerializer.Deserialize<string[]>(schema.SelectableServices) ?? [];
        var services = input.Services ?? [];
        if (services.Any(s => !selectable.Contains(s)))
        {
            // BR-0113 — Speaker (or anything else) is never self-service.
            return Results.Problem(statusCode: 400, detail: "Unknown or non-selectable service.");
        }
        var knownCodes = await db.FormFields
            .Where(f => f.SchemaVersion == draft.SchemaVersion)
            .Select(f => f.FieldCode)
            .ToListAsync(ct);
        var values = input.Values ?? new Dictionary<string, JsonElement>();
        var entries = input.Entries ?? new Dictionary<string, IReadOnlyList<DraftEntryWire>>();
        if (values.Keys.Any(code => !knownCodes.Contains(code))
            || entries.Values.Any(section => section.Any(entry =>
                (entry.Values ?? new Dictionary<string, JsonElement>())
                    .Keys.Any(code => !knownCodes.Contains(code)))))
        {
            return Results.Problem(statusCode: 400, detail: "Unknown field.");
        }

        // Only a section the schema declares repeatable may carry entries —
        // otherwise a caller could smuggle a second answer past the unique
        // (application, field, entry) index and score a criterion twice.
        var repeatableSections = await db.FormSections
            .Where(s => s.SchemaVersion == draft.SchemaVersion && s.Repeatable != null)
            .Select(s => s.SectionCode)
            .ToListAsync(ct);
        if (entries.Keys.Any(section => !repeatableSections.Contains(section)))
        {
            return Results.Problem(statusCode: 400, detail: "Section is not repeatable.");
        }

        // Replace the requested-services rows only while drafting — after
        // submission they carry per-service outcomes and never churn here.
        var serviceRows = await db.ApplicationServices
            .Where(s => s.ApplicationId == draft.ApplicationId)
            .ToListAsync(ct);
        db.ApplicationServices.RemoveRange(serviceRows);
        foreach (var service in services)
        {
            db.ApplicationServices.Add(new ApplicationServiceEntry
            {
                ApplicationServiceId = Guid.NewGuid(),
                ApplicationId = draft.ApplicationId,
                Service = service,
                Outcome = ServiceOutcomes.Pending,
            });
        }

        var valueRows = await db.ApplicationFieldValues
            .Where(v => v.ApplicationId == draft.ApplicationId)
            .ToListAsync(ct);
        db.ApplicationFieldValues.RemoveRange(valueRows);

        /*
         * ENTRIES FIRST, and they win. A repeatable section's answers land one
         * row per (field, entry); the array position IS the entry index, so
         * removing the middle qualification renumbers the rest — which is why
         * the entry also carries the client's stable id.
         *
         * A caller may send the same field in BOTH shapes (a flat value and
         * entry 0). The entry is the more specific statement, so it is written
         * first and the flat map fills only what it did not cover. The other
         * order silently discarded the first qualification.
         */
        var written = new HashSet<(string Field, int Index)>();
        foreach (var (_, section) in entries)
        {
            for (var index = 0; index < section.Count; index += 1)
            {
                var entry = section[index];
                foreach (var (code, value) in entry.Values ?? new Dictionary<string, JsonElement>())
                {
                    if (!written.Add((code, index)))
                    {
                        continue;
                    }
                    db.ApplicationFieldValues.Add(new ApplicationFieldValue
                    {
                        ValueId = Guid.NewGuid(),
                        ApplicationId = draft.ApplicationId,
                        FieldCode = code,
                        Value = value.GetRawText(),
                        EntryId = entry.EntryId,
                        EntryIndex = index,
                    });
                }
            }
        }
        foreach (var (code, value) in values)
        {
            if (!written.Add((code, 0)))
            {
                continue;
            }
            db.ApplicationFieldValues.Add(new ApplicationFieldValue
            {
                ValueId = Guid.NewGuid(),
                ApplicationId = draft.ApplicationId,
                FieldCode = code,
                Value = value.GetRawText(),
            });
        }
        return null;
    }

    private static async Task<IReadOnlyDictionary<string, JsonElement>> LoadValuesAsync(
        ExpertHubDbContext db,
        Guid applicationId,
        CancellationToken ct)
    {
        var rows = await db.ApplicationFieldValues
            .Where(v => v.ApplicationId == applicationId)
            .ToListAsync(ct);
        // A repeatable section answers the same field once per entry. The flat
        // map is entry 0 — which is exactly the whole answer for a section that
        // is not repeatable, and for every application written before entries
        // existed. `LoadEntriesAsync` carries the rest.
        return rows
            .GroupBy(r => r.FieldCode, StringComparer.Ordinal)
            .ToDictionary(
                g => g.Key,
                g => JsonSerializer.Deserialize<JsonElement>(
                    g.OrderBy(r => r.EntryIndex).First().Value),
                StringComparer.Ordinal);
    }

    /// <summary>
    /// The repeatable sections' entries, section code → entries in index order.
    /// Returns null when the application has none, so a draft written before
    /// repeatable groups serves the same bytes it always did.
    /// </summary>
    private static async Task<IReadOnlyDictionary<string, IReadOnlyList<DraftEntryWire>>?> LoadEntriesAsync(
        ExpertHubDbContext db,
        Application application,
        CancellationToken ct)
    {
        var rows = await db.ApplicationFieldValues
            .Where(v => v.ApplicationId == application.ApplicationId)
            .Select(v => new EntryValue(v.FieldCode, v.Value, v.EntryId, v.EntryIndex))
            .ToListAsync(ct);
        return await GroupEntriesAsync(db, application.SchemaVersion, rows, ct);
    }

    /// <summary>One value row, as the grouping needs it — the application's and
    /// the trainer profile's tables carry the same four columns.</summary>
    internal sealed record EntryValue(string FieldCode, string Value, string? EntryId, int EntryIndex);

    /// <summary>
    /// Groups a schema version's value rows into its repeatable sections'
    /// entries. Shared by the draft, the submitted application and the trainer
    /// profile, because all three answer the SAME schema and a person who
    /// entered three qualifications must see three everywhere.
    /// </summary>
    internal static async Task<IReadOnlyDictionary<string, IReadOnlyList<DraftEntryWire>>?> GroupEntriesAsync(
        ExpertHubDbContext db,
        string schemaVersion,
        IReadOnlyList<EntryValue> rows,
        CancellationToken ct)
    {
        var repeatable = await db.FormSections
            .Where(s => s.SchemaVersion == schemaVersion && s.Repeatable != null)
            .Select(s => s.SectionCode)
            .ToListAsync(ct);
        if (repeatable.Count == 0)
        {
            return null;
        }
        var sectionOf = await db.FormFields
            .Where(f => f.SchemaVersion == schemaVersion)
            .Select(f => new { f.FieldCode, f.SectionCode })
            .ToDictionaryAsync(f => f.FieldCode, f => f.SectionCode, StringComparer.Ordinal, ct);

        var bySection = new Dictionary<string, IReadOnlyList<DraftEntryWire>>(StringComparer.Ordinal);
        foreach (var section in repeatable)
        {
            var sectionRows = rows
                .Where(r => sectionOf.TryGetValue(r.FieldCode, out var code) && code == section)
                .ToList();
            if (sectionRows.Count == 0)
            {
                continue;
            }
            bySection[section] = [.. sectionRows
                .GroupBy(r => r.EntryIndex)
                .OrderBy(g => g.Key)
                .Select(g => new DraftEntryWire(
                    g.Select(r => r.EntryId).FirstOrDefault(id => id is not null),
                    g.ToDictionary(
                        r => r.FieldCode,
                        r => JsonSerializer.Deserialize<JsonElement>(r.Value),
                        StringComparer.Ordinal)))];
        }
        return bySection.Count == 0 ? null : bySection;
    }

    private static async Task<ApplicationDraftWire> DraftWireAsync(
        ExpertHubDbContext db,
        Application draft,
        CancellationToken ct)
    {
        var services = await db.ApplicationServices
            .Where(s => s.ApplicationId == draft.ApplicationId)
            .Select(s => s.Service)
            .ToListAsync(ct);
        var attachments = await db.ApplicationAttachments
            .Where(a => a.ApplicationId == draft.ApplicationId)
            .ToListAsync(ct);
        return new ApplicationDraftWire(
            draft.ApplicationId.ToString(),
            services,
            await LoadValuesAsync(db, draft.ApplicationId, ct),
            attachments.Select(a => new DraftAttachmentWire(
                a.ApplicationAttachmentId.ToString(), a.RuleCode, a.FileName, a.SizeBytes)).ToList(),
            Iso(draft.UpdatedAt),
            draft.SchemaVersion,
            await LoadEntriesAsync(db, draft, ct));
    }

    private static async Task<(Application? Application, IResult? Error)> FindOwnedAsync(
        string id,
        HttpContext http,
        ExpertHubDbContext db,
        CancellationToken ct)
    {
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        if (!Guid.TryParse(id, out var applicationId))
        {
            return (null, Results.Problem(statusCode: 404, detail: "Application not found."));
        }
        var application = await db.Applications.FirstOrDefaultAsync(
            a => a.ApplicationId == applicationId && a.ApplicantUserId == actor.UserId, ct);
        return application is null
            ? (null, Results.Problem(statusCode: 404, detail: "Application not found."))
            : (application, null);
    }

    private static async Task<IResult> StageConflictAsync(
        string id,
        HttpContext http,
        ExpertHubDbContext db,
        string detail,
        CancellationToken ct)
    {
        var (application, notFound) = await FindOwnedAsync(id, http, db, ct);
        return application is null ? notFound! : Results.Problem(statusCode: 409, detail: detail);
    }

    private static async Task<IReadOnlyList<string>> CurrentServicesAsync(
        ExpertHubDbContext db,
        Guid applicationId,
        CancellationToken ct) =>
        await db.ApplicationServices
            .Where(s => s.ApplicationId == applicationId && s.Outcome == ServiceOutcomes.Accepted)
            .Select(s => s.Service)
            .ToListAsync(ct);

    private static ApplicationSummaryWire Summary(
        Application application,
        Dictionary<Guid, IReadOnlyList<string>> servicesByApp) =>
        new(
            application.ApplicationId.ToString(),
            application.Reference,
            servicesByApp.TryGetValue(application.ApplicationId, out var services) ? services : [],
            application.Status,
            Iso(application.CreatedAt),
            application.SubmittedAt is { } submitted ? Iso(submitted) : null,
            Iso(application.UpdatedAt));

    /// <summary>The same detail the trainer's own GET serves — so an action's
    /// response and a refresh can never disagree.</summary>
    internal static async Task<object> DetailWireForAsync(
        ExpertHubDbContext db, Application application, CancellationToken ct) =>
        await DetailWireAsync(db, application, ct);

    private static async Task<ApplicationDetailWire> DetailWireAsync(
        ExpertHubDbContext db,
        Application application,
        CancellationToken ct)
    {
        var serviceRows = await db.ApplicationServices
            .Where(s => s.ApplicationId == application.ApplicationId)
            .ToListAsync(ct);
        var attachments = await db.ApplicationAttachments
            .Where(a => a.ApplicationId == application.ApplicationId)
            .ToListAsync(ct);
        var attachmentRules = await db.AttachmentRules
            .Where(r => r.SchemaVersion == application.SchemaVersion)
            .ToListAsync(ct);
        var interviewBlock = await BuildInterviewBlockAsync(db, application, ct);
        // The same state the committee's own gate card reads (`J-09/F6`), so
        // the applicant and the staff never disagree about whether the data
        // has been asked for.
        var bankBlock = await BuildBankBlockAsync(db, application.ApplicantUserId, ct);
        var (agreementState, agreementBlock) =
            await ApplicantAgreementEndpoints.ApplicantViewAsync(db, application, ct);
        return new ApplicationDetailWire(
            application.ApplicationId.ToString(),
            application.Reference,
            [.. serviceRows.Select(s => s.Service)],
            application.Status,
            Iso(application.CreatedAt),
            application.SubmittedAt is { } submitted ? Iso(submitted) : null,
            Iso(application.UpdatedAt),
            Timeline(application.Status),
            [.. serviceRows.Select(s => new PerServiceOutcomeWire(s.Service, s.Outcome))],
            application.Status == ApplicationStatuses.Rejected ? application.RejectionReason : null,
            [.. attachments.Select(a =>
            {
                var rule = attachmentRules.FirstOrDefault(r => r.RuleCode == a.RuleCode);
                return new DetailAttachmentWire(
                    a.ApplicationAttachmentId.ToString(),
                    a.FileName,
                    "applicant",
                    new ServiceRequests.LocalizedTextWire(
                        rule?.LabelAr ?? a.RuleCode, rule?.LabelEn ?? a.RuleCode),
                    a.AttachmentId is { } attachmentId
                        ? $"/{ExpertHub.Core.ApiVersions.V1}/attachments/{attachmentId:D}"
                        : null);
            })],
            /*
              * J-09/F6/AC-1 — bank data is asked for the moment final approval
              * completes, and `AC-3` makes the agreement wait on it. So it
              * outranks the agreement decision here: an applicant told to
              * decide on an agreement that cannot be prepared yet would be
              * given the wrong job.
              */
            Action: interviewBlock is not null ? "manage-interview"
                : bankBlock is { State: "requested" } ? "provide-bank-data"
                : agreementState == "awaiting-decision" ? "decide-agreement"
                : "none",
            // The form the applicant answered, and their answers — read
            // through THEIR schema version, never today's, so an application
            // submitted months ago still renders with its own labels.
            FormSchema: await BuildSchemaWireAsync(db, ct, application.SchemaVersion),
            Values: await LoadValuesAsync(db, application.ApplicationId, ct),
            Entries: await LoadEntriesAsync(db, application, ct),
            BankData: bankBlock is null or { State: "not-requested" } ? null : bankBlock,
            Interview: interviewBlock,
            AgreementState: agreementState,
            Agreement: agreementBlock,
            // §0.9 — a separate track, shown only post-signature; a stalled
            // FAST sync never reverts the business status (BE-10 drives it).
            Sync: agreementState == "signed" ? "processing" : "none");
    }

    /// <summary>
    /// J-06 — present from the moment screening proposes slots until the
    /// interview is behind them; null at every other stage, so no interview
    /// UI can render over an interview that does not exist. The exemption
    /// path (J-08/F2/AC-3) is invisible BY OMISSION: an exempted application
    /// never had an interview row, so this block is null, the timeline shows
    /// the stage as passed, and no field exists that could disclose why.
    /// </summary>
    private static async Task<object?> BuildInterviewBlockAsync(
        ExpertHubDbContext db,
        Application application,
        CancellationToken ct)
    {
        var interview = await db.Interviews.FirstOrDefaultAsync(
            i => i.ApplicationId == application.ApplicationId, ct);
        if (interview is null
            || interview.Status == InterviewStatuses.Completed
            || !ApplicationStatuses.Undecided.Contains(application.Status))
        {
            return null;
        }
        var slots = await db.InterviewSlots
            .Where(s => s.InterviewId == interview.InterviewId && !s.IsSuperseded)
            .OrderBy(s => s.StartsAt)
            .ToListAsync(ct);
        var pendingReschedule = interview.RescheduleRequestedAt is { } requestedAt
            ? new { requestedAt = Iso(requestedAt), note = interview.RescheduleNote }
            : null;
        // F1/AC-4 — no deadline to show when there is nothing to decide.
        object? selectionSla = null;
        if (interview.Status == InterviewStatuses.AwaitingSelection
            && pendingReschedule is null
            && interview.SelectionDueAt is { } dueAt)
        {
            var (state, daysRemaining) = Infrastructure.Applications.BusinessCalendar
                .Countdown(dueAt, DateTime.UtcNow);
            selectionSla = new { slaId = "SLA-0201", state, dueAt = Iso(dueAt), daysRemaining };
        }
        return new
        {
            proposedSlots = slots.Select(s => new
            {
                id = s.SlotId.ToString(),
                startsAt = Iso(s.StartsAt),
            }),
            selectedSlotId = interview.ConfirmedSlotId?.ToString(),
            selectionSla,
            canRequestReschedule = interview.RescheduleRequestedAt is null,
            pendingReschedule,
            ticketNumber = interview.TicketNumber,
            meetingUrl = interview.MeetingUrl,
        };
    }

    /// <summary>The mock's `currentStageIndex`/`buildTimeline`, exactly.</summary>
    internal static IReadOnlyList<TimelineStageWire> Timeline(string status)
    {
        string[] stages = ["submitted", "under-review", "interview", "approval", "agreement", "active"];
        var current = status switch
        {
            ApplicationStatuses.Submitted => 0,
            ApplicationStatuses.UnderReview => 1,
            ApplicationStatuses.InterviewScheduled or ApplicationStatuses.InterviewCompleted => 2,
            ApplicationStatuses.ApprovalInProgress or ApplicationStatuses.Rejected => 3,
            ApplicationStatuses.AgreementPending => 4,
            _ => 5,
        };
        var rejected = status == ApplicationStatuses.Rejected;
        return [.. stages.Select((id, index) => new TimelineStageWire(
            id,
            rejected && index == current ? "rejected"
                : index < current ? "complete"
                : index == current ? "current"
                : "upcoming"))];
    }

    /// <summary>`EH-YYYY-NNNNN`, issued at submission only (`BR-0107`).</summary>
    private static async Task<string> NextReferenceAsync(
        ExpertHubDbContext db,
        DateTime nowUtc,
        CancellationToken ct)
    {
        var prefix = string.Create(CultureInfo.InvariantCulture, $"EH-{nowUtc.Year}-");
        var last = await db.Applications
            .Where(a => a.Reference != null && a.Reference.StartsWith(prefix))
            .OrderByDescending(a => a.Reference)
            .Select(a => a.Reference)
            .FirstOrDefaultAsync(ct);
        return await ReferenceNumbers.NextAsync(db, prefix, last, digits: 5, ct);
    }

    /// <summary>`EH-ASR-YYYY-NNNN` — J-03/F1/AC-3.</summary>
    private static async Task<string> NextRequestReferenceAsync(
        ExpertHubDbContext db,
        DateTime nowUtc,
        CancellationToken ct)
    {
        var prefix = string.Create(CultureInfo.InvariantCulture, $"EH-ASR-{nowUtc.Year}-");
        var last = await db.ServiceRequests
            .Where(r => r.Reference.StartsWith(prefix))
            .OrderByDescending(r => r.Reference)
            .Select(r => r.Reference)
            .FirstOrDefaultAsync(ct);
        return await ReferenceNumbers.NextAsync(db, prefix, last, digits: 4, ct);
    }

    /// <summary>
    /// Queues the advisory analysis of the QUALITATIVE answers only
    /// (`BR-0202`) — the free-text fields, never a name, an identifier, a
    /// contact detail or the reference, and never an attachment.
    /// </summary>
    /// <remarks>
    /// <para>
    /// The scope is read from the form schema rather than listed here: a
    /// field is qualitative when its input type is <c>textarea</c>, which is
    /// the same rule the screening page uses to mark what the AI may read.
    /// Add a free-text question to the form and it is in scope automatically;
    /// change a question to a dropdown and it leaves, with nothing to update
    /// in two places.
    /// </para>
    /// <para>
    /// Nothing is queued when the form has no free-text answers — an empty
    /// request would produce an <c>unavailable</c> row that says nothing
    /// about the provider.
    /// </para>
    /// </remarks>
    private static async Task QueueAiAnalysisAsync(
        ExpertHubDbContext db, IntegrationHub hub, Application application, CancellationToken ct)
    {
        var qualitative = await (
            from field in db.FormFields
            where field.SchemaVersion == application.SchemaVersion && field.InputType == "textarea"
            select field.FieldCode).ToListAsync(ct);
        if (qualitative.Count == 0)
        {
            return;
        }

        var values = await db.ApplicationFieldValues
            .Where(v => v.ApplicationId == application.ApplicationId
                && qualitative.Contains(v.FieldCode))
            .ToListAsync(ct);

        var answers = values
            .Select(v => new QualitativeAnswer(v.FieldCode, DisplayText(v.Value)))
            .Where(a => !string.IsNullOrWhiteSpace(a.Text))
            .ToList();
        if (answers.Count == 0)
        {
            return;
        }

        await hub.EnqueueOutboundAsync(
            IntegrationSystems.AiProvider,
            "screening_analysis",
            "AI_ANALYSIS",
            application.ApplicationId,
            entityVersion: 1,
            operation: "analyze",
            JsonSerializer.Serialize(
                new AiAnalysisRequest(application.ApplicationId, answers),
                AiAnalysisRequest.PayloadOptions),
            ct);
    }

    /// <summary>The stored answer as text — a JSON string unwrapped, anything
    /// else left as written.</summary>
    private static string DisplayText(string storedValue)
    {
        try
        {
            var element = JsonSerializer.Deserialize<JsonElement>(storedValue);
            return element.ValueKind == JsonValueKind.String
                ? element.GetString() ?? string.Empty
                : storedValue;
        }
        catch (JsonException)
        {
            return storedValue;
        }
    }

    /// <summary>
    /// `J-09/F6` — the applicant's own view of the bank-data request: the
    /// state, and the fields once saved so the form can show what is on file.
    /// Shaped exactly like the profile's block, because it is the same
    /// section — it simply has to be reachable before a profile exists.
    /// </summary>
    private static async Task<BankBlockWire?> BuildBankBlockAsync(
        ExpertHubDbContext db, Guid applicantUserId, CancellationToken ct)
    {
        var record = await db.BankData.FirstOrDefaultAsync(b => b.UserId == applicantUserId, ct);
        if (record?.RequestedAt is not { } requestedAt)
        {
            return new BankBlockWire("not-requested", null, null, null, null);
        }
        return new BankBlockWire(
            record.CompletedAt is null ? "requested" : "complete",
            record.CompletedAt is null
                ? null
                : (record.Fields is null
                    ? null
                    : JsonSerializer.Deserialize<Dictionary<string, string>>(record.Fields)),
            Iso(requestedAt),
            record.CompletedAt is { } completedAt ? Iso(completedAt) : null,
            // Only while it is still being asked for: once they have confirmed,
            // what they confirmed is the answer and a suggestion beside it
            // would just invite second-guessing.
            record.CompletedAt is null
                ? await BankPrefill.ForUserAsync(db, applicantUserId, ct)
                : null);
    }

    internal static string Iso(DateTime utc) =>
        new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc)).ToString(
            "yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture);
}
