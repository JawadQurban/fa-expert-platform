using System.Globalization;
using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Api.Committee;
using ExpertHub.Api.ServiceRequests;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Agreements;

/*
 * EH-INT-06a — Agreement Preparation & Internal Approval (CAP-03, J-10),
 * behind `agreementService.ts`:
 *
 *   GET  v1/internal/applications/{id}/agreement
 *   POST v1/internal/applications/{id}/agreement/preparation
 *   POST v1/internal/applications/{id}/agreement/signing-sequence
 *   POST v1/internal/applications/{id}/agreement/decisions
 *   POST v1/internal/applications/{id}/agreement/resubmit
 *
 * The invariants, held server-side:
 * - The gate is BOTH J-09 outcomes, separately (F1/AC-1): committee approval
 *   AND completed bank data — the wire names whichever half is missing.
 * - The covered services are server-derived (F1/AC-3) — never an input.
 * - There is NO reject in this sequence (F3/AC-6) — eligibility was settled
 *   at J-09; the input union simply has no such member to parse.
 * - A designated e-signer SIGNS (F3/AC-4): plain approval from a signer is
 *   refused, so a completed sequence cannot lack its signature — and the
 *   send gate still checks BOTH halves independently (`BR-0213`, P-38).
 * - The send happens the moment both halves hold, raising `EV-0204` (the
 *   agreement is ready for the applicant) through CAP-07.
 */

internal sealed record AgreementFieldSchemaWire(
    string Id, LocalizedTextWire Label, string Type, bool Required, LocalizedTextWire? Help);

internal sealed record MergedEntryWire(LocalizedTextWire Label, string Value);

internal sealed record MergedGroupWire(
    string Id, LocalizedTextWire Title, IReadOnlyList<MergedEntryWire> Entries);

internal sealed record SigningMemberWire(
    string ApproverId, string Name, LocalizedTextWire RoleTitle, string Obligation,
    bool IsSigner, int Position, string State, string? DecidedAt, string? Note);

internal sealed record AgreementViewerWire(
    bool IsCreator, string? ApproverId, bool CanDecide, bool IsSigner, bool CanResubmit);

internal sealed record AgreementGateWire(bool CommitteeApproved, bool BankDataComplete);

internal sealed record SigningTemplateMemberWire(string ApproverId, string Obligation, bool IsSigner);

internal sealed record SigningTemplateWire(
    string Id, string Name, IReadOnlyList<SigningTemplateMemberWire> Members);

internal sealed record AgreementDetailWire(
    string ApplicationId, string Reference, string ApplicantName,
    IReadOnlyList<string> ApprovedServices,
    AgreementGateWire Gate, string Stage,
    IReadOnlyList<AgreementFieldSchemaWire> FieldSchema,
    IReadOnlyDictionary<string, string> FieldValues,
    IReadOnlyList<MergedGroupWire> MergedData,
    IReadOnlyList<SigningMemberWire> Sequence,
    IReadOnlyList<Screening.PoolMemberWire> ApproverPool,
    IReadOnlyList<SigningTemplateWire> Templates,
    string? DocumentUrl,
    bool SequenceComplete,
    bool SignaturesAttached,
    string? SentToApplicantAt,
    AgreementViewerWire Viewer,
    AgreementDocumentWire? Document);

internal sealed record PrepareInputWire(IReadOnlyDictionary<string, string>? Values);

internal sealed record SigningMemberInputWire(string? ApproverId, string? Obligation, bool IsSigner);

internal sealed record SigningFormationInputWire(
    IReadOnlyList<SigningMemberInputWire>? Members, string? SaveAsTemplateName);

internal sealed record SigningDecisionInputWire(
    string? Kind, string? Note, string? SignatureName);

/// <summary>The J-10 internal surface.</summary>
public static class AgreementEndpoints
{
    /// <summary>One cached instance — the wire's camelCase shape.</summary>
    private static readonly JsonSerializerOptions WireJson = new(JsonSerializerDefaults.Web);

    public static RouteGroupBuilder MapAgreementEndpoints(this RouteGroupBuilder v1)
    {
        var agreement = v1.MapGroup("/internal/applications/{id}/agreement")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy)
            // F-0301 تفعيل الاتفاقية — J-10's preparation and signing.
            .RequireFeature("F-0301");

        agreement.MapGet("/", async (
            string id, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var application = await FindAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            return Results.Ok(await BuildDetailAsync(db, application, actor.UserId, ct));
        }).WithName("AgreementDetail");

        // J-10/F3/AC-2 — the complete agreement, for every internal reader
        // (not only its creator): the version everybody signs.
        agreement.MapGet("/document", async (
            string id, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var application = await FindAsync(id, db, ct);
            var row = application is null
                ? null
                : await db.Agreements.FirstOrDefaultAsync(a => a.ApplicationId == application.ApplicationId, ct);
            return row is null
                ? Results.Problem(statusCode: 404, detail: "No agreement has been prepared.")
                : Results.Ok(await AgreementDocuments.WireAsync(db, row, ct));
        }).WithName("AgreementDocument");

        agreement.MapPost("/preparation", async (
            string id,
            PrepareInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var application = await FindAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            var gate = await GateAsync(db, application, ct);
            if (!gate.CommitteeApproved || !gate.BankDataComplete)
            {
                // F1/AC-1 — both halves, and the response names them.
                return Results.Problem(statusCode: 409, detail: "The J-09 gate is not satisfied.");
            }
            // J-10/F1 — «the creator prepares», and BR-0215 names the creator:
            // the application's owner from its screening decision. Holding
            // F-0301 lets somebody READ and act in the chain; it does not make
            // them the preparer.
            var preparer = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (!await Interviews.InterviewEndpoints.IsScreeningDeciderAsync(
                    db, application.ApplicationId, preparer.UserId, ct))
            {
                return Results.Problem(statusCode: 403, detail: "only-application-creator");
            }
            var template = await db.AgreementTemplates.SingleAsync(t => t.IsActive, ct);
            var schema = ParseFields(template.FieldMap);
            var values = input.Values ?? new Dictionary<string, string>();
            if (schema.Any(f => f.Required && string.IsNullOrWhiteSpace(
                values.TryGetValue(f.Id, out var v) ? v : null)))
            {
                return Results.Problem(statusCode: 400, detail: "required-field-missing");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;

            var existing = await db.Agreements.FirstOrDefaultAsync(
                a => a.ApplicationId == application.ApplicationId, ct);
            if (existing is null)
            {
                var created = new Agreement
                {
                    AgreementId = Guid.NewGuid(),
                    TrainerUserId = application.ApplicantUserId,
                    ApplicationId = application.ApplicationId,
                    TemplateId = template.TemplateId,
                    Reference = await NextReferenceAsync(db, now, ct),
                    Status = AgreementStatuses.Formation,
                    TermYears = 1, // BR-0302 — first accreditation.
                    FieldValues = JsonSerializer.Serialize(values),
                    CreatedBy = actor.UserId,
                    CreatedAt = now,
                };
                db.Agreements.Add(created);
                foreach (var service in await ApprovedServicesAsync(db, application.ApplicationId, ct))
                {
                    db.AgreementServices.Add(new AgreementServiceRow
                    {
                        AgreementServiceId = Guid.NewGuid(),
                        AgreementId = created.AgreementId,
                        Service = service,
                    });
                }
                LogEvent(db, created.AgreementId, "prepared", actor.UserId, now);
                existing = created;
            }
            else
            {
                if (existing.Status is not (AgreementStatuses.Preparation
                    or AgreementStatuses.Formation
                    or AgreementStatuses.ModificationRequested))
                {
                    return Results.Problem(statusCode: 409, detail: "Not editable at this stage.");
                }
                existing.FieldValues = JsonSerializer.Serialize(values);
                if (existing.Status == AgreementStatuses.ModificationRequested)
                {
                    // J-10/F4/AC-2 + AC-3 — an internal member asked for a
                    // change: the creator corrects it, and the chain RESUMES
                    // from that member on re-submit. Earlier approvals stand,
                    // each still naming the version it approved.
                    LogEvent(db, existing.AgreementId, "corrected", actor.UserId, now);
                }
                else
                {
                    existing.Status = AgreementStatuses.Formation;
                    // A re-preparation (after the applicant asked for changes)
                    // restarts the internal run. The old chain is VOIDED, never
                    // deleted: its approvals and signatures remain evidence.
                    await AgreementDocuments.VoidActiveSequenceAsync(db, existing.AgreementId, now, ct);
                    LogEvent(db, existing.AgreementId, "prepared", actor.UserId, now);
                }
            }
            await db.SaveChangesAsync(ct);
            // The content everybody will read and sign, frozen as a version.
            await AgreementDocuments.SnapshotAsync(db, existing, actor.UserId, now, ct);
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, actor.UserId, ct));
        }).WithName("PrepareAgreement");

        agreement.MapPost("/signing-sequence", async (
            string id,
            SigningFormationInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var application = await FindAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            var row = await db.Agreements.FirstOrDefaultAsync(
                a => a.ApplicationId == application.ApplicationId, ct);
            if (row is null || row.Status != AgreementStatuses.Formation)
            {
                return Results.Problem(statusCode: 409, detail: "Nothing to form a sequence for.");
            }
            var former = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (!await Interviews.InterviewEndpoints.IsScreeningDeciderAsync(
                    db, application.ApplicationId, former.UserId, ct))
            {
                return Results.Problem(statusCode: 403, detail: "only-application-creator");
            }
            var members = (input.Members ?? []).Where(m => m.ApproverId is not null).ToList();
            var ids = members.Select(m => m.ApproverId!).ToList();
            // P-36 — at least one designated e-signer: a signing sequence with
            // nobody designated could never complete (the P-J1 shared gate).
            if (members.Count == 0
                || !members.Any(m => m.IsSigner)
                || ids.Distinct().Count() != ids.Count)
            {
                return Results.Problem(statusCode: 400, detail: "invalid-formation");
            }
            var memberIds = ids.Select(Guid.Parse).ToList();
            // `DEF-05` — the same rule as the committee, for the feature THIS
            // group requires: a reviewer or signer who cannot reach the
            // agreement would stall the chain with no way to re-prepare.
            var eligible = await FeatureAuthorization.HoldersOfAsync(
                db, "F-0301", ct);
            var known = await db.Users.CountAsync(
                u => memberIds.Contains(u.UserId)
                    && u.IsEmployee && u.IsActive && eligible.Contains(u.UserId), ct);
            if (known != memberIds.Count)
            {
                return Results.Problem(statusCode: 400, detail: "invalid-formation");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;

            // The claim: only an agreement STILL in formation gets a chain.
            // Two submits both read `formation`; the second finds it moved.
            // The filtered unique index on SIGNING_SEQUENCE is the backstop.
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            var claimed = await db.Agreements
                .Where(a => a.AgreementId == row.AgreementId
                    && a.Status == AgreementStatuses.Formation)
                .ExecuteUpdateAsync(set => set.SetProperty(a => a.Status, AgreementStatuses.InProgress), ct);
            if (claimed == 0)
            {
                await transaction.RollbackAsync(ct);
                return Results.Problem(statusCode: 409, detail: "Nothing to form a sequence for.");
            }

            var sequence = new SigningSequenceRecord
            {
                SequenceId = Guid.NewGuid(),
                AgreementId = row.AgreementId,
                Status = "in-progress",
                CurrentStepIndex = 1,
                CreatedBy = actor.UserId,
                CreatedAt = now,
            };
            db.SigningSequences.Add(sequence);
            for (var index = 0; index < members.Count; index++)
            {
                db.Signatories.Add(new SignatoryRecord
                {
                    SignatoryId = Guid.NewGuid(),
                    SequenceId = sequence.SequenceId,
                    UserId = memberIds[index],
                    OrderIndex = index + 1,
                    Obligation = string.Equals(members[index].Obligation, "optional", StringComparison.Ordinal)
                        ? "optional"
                        : "mandatory",
                    IsSigner = members[index].IsSigner,
                });
            }
            if (!string.IsNullOrWhiteSpace(input.SaveAsTemplateName))
            {
                // Shared mechanics, separate records (J-10/F2/AC-3): the
                // signing arrangement saves under its own kind.
                db.CommitteeTemplates.Add(new CommitteeTemplate
                {
                    TemplateId = Guid.NewGuid(),
                    Name = input.SaveAsTemplateName.Trim(),
                    Members = JsonSerializer.Serialize(members.Select(m => new
                    {
                        approverId = m.ApproverId,
                        obligation = m.Obligation,
                        isSigner = m.IsSigner,
                    })),
                    Kind = "signing",
                    CreatedBy = actor.UserId,
                    CreatedAt = now,
                });
            }
            row.Status = AgreementStatuses.InProgress;
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, actor.UserId, ct));
        }).WithName("FormSigningSequence");

        agreement.MapPost("/decisions", async (
            string id,
            SigningDecisionInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            CancellationToken ct) =>
        {
            var application = await FindAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            var row = await db.Agreements.FirstOrDefaultAsync(
                a => a.ApplicationId == application.ApplicationId, ct);
            var sequence = row is null
                ? null
                : await AgreementDocuments.ActiveSequenceAsync(db, row.AgreementId, ct);
            if (row is null || sequence is null || sequence.Status != "in-progress")
            {
                return Results.Problem(statusCode: 409, detail: "No decision is awaited.");
            }
            var steps = await db.Signatories
                .Where(s => s.SequenceId == sequence.SequenceId)
                .OrderBy(s => s.OrderIndex)
                .ToListAsync(ct);
            var current = steps.First(s => s.OrderIndex == sequence.CurrentStepIndex);
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (current.UserId != actor.UserId)
            {
                return Results.Problem(statusCode: 403, detail: "Not this member's turn.");
            }
            var now = DateTime.UtcNow;
            // Every act names the exact content it was taken on.
            var document = await AgreementDocuments.LatestAsync(db, row.AgreementId, ct)
                ?? await AgreementDocuments.SnapshotAsync(db, row, actor.UserId, now, ct);
            current.DocumentVersionId = document.DocumentVersionId;

            if (string.Equals(input.Kind, "sign-and-approve", StringComparison.Ordinal))
            {
                if (!current.IsSigner)
                {
                    return Results.Problem(statusCode: 403, detail: "Not a designated signer.");
                }
                if (string.IsNullOrWhiteSpace(input.SignatureName))
                {
                    return Results.Problem(statusCode: 400, detail: "signature-missing");
                }
                current.Decision = "sign";
                current.Note = input.Note;
                current.ActedAt = now;
                db.ESignatures.Add(new ESignatureRecord
                {
                    SignatureId = Guid.NewGuid(),
                    SignatoryId = current.SignatoryId,
                    SignatureName = input.SignatureName.Trim(),
                    IpAddress = http.Connection.RemoteIpAddress?.ToString(),
                    SignedAt = now,
                    Method = SignatureMethods.InternalAcceptance,
                });
                LogEvent(db, row.AgreementId, "signed", actor.UserId, now);
            }
            else if (string.Equals(input.Kind, "approve", StringComparison.Ordinal))
            {
                if (current.IsSigner)
                {
                    // F3/AC-4 — a designated signer signs; a bare approval
                    // would complete the chain without its signature and
                    // strand the agreement at BR-0213's gate.
                    return Results.Problem(statusCode: 400, detail: "signature-required");
                }
                current.Decision = "approve";
                current.Note = input.Note;
                current.ActedAt = now;
            }
            else if (string.Equals(input.Kind, "request-modification", StringComparison.Ordinal))
            {
                if (string.IsNullOrWhiteSpace(input.Note))
                {
                    return Results.Problem(statusCode: 400, detail: "note-missing");
                }
                current.Decision = "request_modification";
                current.Note = input.Note;
                current.ActedAt = now;
                sequence.Status = "modification-requested";
                row.Status = AgreementStatuses.ModificationRequested;
                await db.SaveChangesAsync(ct);
                return Results.Ok(await BuildDetailAsync(db, application, actor.UserId, ct));
            }
            else
            {
                return Results.Problem(statusCode: 400, detail: "Unknown decision.");
            }

            var next = steps.FirstOrDefault(s => s.OrderIndex > sequence.CurrentStepIndex);
            if (next is not null)
            {
                sequence.CurrentStepIndex = next.OrderIndex;
            }
            else
            {
                sequence.Status = "complete";
                sequence.IsComplete = true;
                // BR-0213 / F3/AC-5 — BOTH halves, checked separately even
                // though formation + the signer rule make them coincide. The
                // signature this very request captured is still only STAGED,
                // so the local set counts as much as the stored rows.
                var signatoryIds = steps.Select(x => x.SignatoryId).ToList();
                var signaturesAttached =
                    db.ESignatures.Local.Any(s => signatoryIds.Contains(s.SignatoryId))
                    || await db.ESignatures.AnyAsync(
                        s => signatoryIds.Contains(s.SignatoryId), ct);
                if (signaturesAttached)
                {
                    row.Status = AgreementStatuses.SentToApplicant;
                    row.SentToApplicantAt = now;
                    application.Status = ApplicationStatuses.AgreementPending;
                    application.UpdatedAt = now;
                    LogEvent(db, row.AgreementId, "sent", actor.UserId, now);

                    // J-11/F1/AC-1 — the applicant receives the fully
                    // internally-signed agreement (EV-0204).
                    await dispatcher.RaiseAsync(
                        "EV-0204",
                        new NotificationEventContext(
                            SourceEntityId: row.AgreementId,
                            RecordSubjectUserId: application.ApplicantUserId,
                            ActingStaffUserId: actor.UserId),
                        new Dictionary<string, string>
                        {
                            ["referenceNumber"] = application.Reference ?? string.Empty,
                        },
                        ct);
                }
            }
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, actor.UserId, ct));
        }).WithName("SigningDecision");

        agreement.MapPost("/resubmit", async (
            string id, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var application = await FindAsync(id, db, ct);
            if (application is null)
            {
                return Results.Problem(statusCode: 404, detail: "Application not found.");
            }
            var row = await db.Agreements.FirstOrDefaultAsync(
                a => a.ApplicationId == application.ApplicationId, ct);
            var sequence = row is null
                ? null
                : await AgreementDocuments.ActiveSequenceAsync(db, row.AgreementId, ct);
            if (row is null || sequence is null || sequence.Status != "modification-requested")
            {
                return Results.Problem(statusCode: 409, detail: "No modification request is pending.");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (sequence.CreatedBy != actor.UserId)
            {
                return Results.Problem(statusCode: 403, detail: "Only the creator may re-submit.");
            }
            var requesting = await db.Signatories.FirstAsync(
                s => s.SequenceId == sequence.SequenceId && s.Decision == "request_modification", ct);
            requesting.Decision = null;
            requesting.Note = null;
            requesting.ActedAt = null;
            sequence.CurrentStepIndex = requesting.OrderIndex;
            sequence.Status = "in-progress";
            row.Status = AgreementStatuses.InProgress;
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildDetailAsync(db, application, actor.UserId, ct));
        }).WithName("AgreementResubmit");

        return v1;
    }

    /* ── shared assembly ───────────────────────────────────────────────────── */

    private static async Task<Application?> FindAsync(
        string id, ExpertHubDbContext db, CancellationToken ct) =>
        Guid.TryParse(id, out var applicationId)
            ? await db.Applications.FirstOrDefaultAsync(
                a => a.ApplicationId == applicationId && a.Status != ApplicationStatuses.Draft, ct)
            : null;

    private static async Task<AgreementGateWire> GateAsync(
        ExpertHubDbContext db, Application application, CancellationToken ct)
    {
        var committeeApproved = await db.CommitteeSequences.AnyAsync(
            s => s.ApplicationId == application.ApplicationId
                && s.Status == CommitteeSequenceStatuses.Approved, ct);
        var bank = await db.BankData.FirstOrDefaultAsync(
            b => b.UserId == application.ApplicantUserId, ct);
        return new AgreementGateWire(committeeApproved, bank?.CompletedAt is not null);
    }

    private static async Task<IReadOnlyList<string>> ApprovedServicesAsync(
        ExpertHubDbContext db, Guid applicationId, CancellationToken ct) =>
        await db.ApplicationServices
            .Where(s => s.ApplicationId == applicationId && s.Outcome == ServiceOutcomes.Accepted)
            .Select(s => s.Service)
            .ToListAsync(ct);

    internal static IReadOnlyList<AgreementFieldSchemaWire> ParseFields(string fieldMap)
    {
        var parsed = JsonSerializer.Deserialize<List<FieldJson>>(fieldMap, WireJson) ?? [];
        return [.. parsed.Select(f => new AgreementFieldSchemaWire(
            f.Id,
            new LocalizedTextWire(f.Label.Ar, f.Label.En),
            f.Type,
            f.Required,
            f.Help is null ? null : new LocalizedTextWire(f.Help.Ar, f.Help.En)))];
    }

    /// <summary>F1/AC-2 / `BR-0212` — the read-only merged blocks: covered
    /// services, the trainer's identity, and the completed bank data. Nothing
    /// here can be re-keyed by the creator.</summary>
    internal static async Task<IReadOnlyList<MergedGroupWire>> BuildMergedDataAsync(
        ExpertHubDbContext db, Agreement row, CancellationToken ct)
    {
        var trainer = await db.Users.SingleAsync(u => u.UserId == row.TrainerUserId, ct);
        var services = await db.AgreementServices
            .Where(s => s.AgreementId == row.AgreementId)
            .Select(s => s.Service)
            .ToListAsync(ct);
        var bank = await db.BankData.FirstOrDefaultAsync(b => b.UserId == row.TrainerUserId, ct);
        var bankFields = bank?.Fields is null
            ? new Dictionary<string, string>()
            : JsonSerializer.Deserialize<Dictionary<string, string>>(bank.Fields) ?? [];

        var groups = new List<MergedGroupWire>
        {
            new(
                "services",
                new LocalizedTextWire("الخدمات المشمولة", "Covered services"),
                // UI-06: the Arabic name, not the raw code — a trainer used to
                // read `trainer` on their own agreement. Historical versions
                // keep whatever they froze; only new ones are built from here.
                [.. services.Select(s => new MergedEntryWire(
                    new LocalizedTextWire("الخدمة", "Service"),
                    ApplicationServices.NameAr(s)))]),
            new(
                "trainer",
                new LocalizedTextWire("بيانات المدرب", "Trainer data"),
                [
                    new MergedEntryWire(new LocalizedTextWire("الاسم", "Name"), trainer.FullNameAr),
                    new MergedEntryWire(new LocalizedTextWire("البريد الإلكتروني", "Email"), trainer.Email),
                ]),
        };
        if (bankFields.Count > 0)
        {
            groups.Add(new MergedGroupWire(
                "bank",
                new LocalizedTextWire("البيانات المصرفية", "Bank data"),
                [
                    new MergedEntryWire(
                        new LocalizedTextWire("اسم البنك", "Bank name"),
                        bankFields.GetValueOrDefault("bankName", string.Empty)),
                    new MergedEntryWire(
                        new LocalizedTextWire("رقم الآيبان", "IBAN"),
                        bankFields.GetValueOrDefault("iban", string.Empty)),
                    new MergedEntryWire(
                        new LocalizedTextWire("اسم صاحب الحساب", "Account holder"),
                        bankFields.GetValueOrDefault("accountHolderName", string.Empty)),
                ]));
        }
        return groups;
    }

    private static async Task<AgreementDetailWire> BuildDetailAsync(
        ExpertHubDbContext db,
        Application application,
        Guid viewerUserId,
        CancellationToken ct)
    {
        var applicant = await db.Users.SingleAsync(u => u.UserId == application.ApplicantUserId, ct);
        var gate = await GateAsync(db, application, ct);
        var template = await db.AgreementTemplates.SingleAsync(t => t.IsActive, ct);
        var row = await db.Agreements.FirstOrDefaultAsync(
            a => a.ApplicationId == application.ApplicationId, ct);
        var sequence = row is null
            ? null
            : await AgreementDocuments.ActiveSequenceAsync(db, row.AgreementId, ct);
        var steps = sequence is null
            ? []
            : await db.Signatories
                .Where(s => s.SequenceId == sequence.SequenceId)
                .OrderBy(s => s.OrderIndex)
                .ToListAsync(ct);
        var stepUsers = await db.Users
            .Where(u => steps.Select(s => s.UserId).Contains(u.UserId))
            .ToListAsync(ct);
        var signaturesAttached = steps.Count > 0
            && await db.ESignatures.AnyAsync(
                s => steps.Select(x => x.SignatoryId).Contains(s.SignatoryId), ct);
        var titles = await (
            from userRole in db.UserRoles
            join role in db.Roles on userRole.RoleId equals role.RoleId
            select new { userRole.UserId, role.NameAr, role.NameEn }).ToListAsync(ct);
        var templates = await db.CommitteeTemplates
            .Where(t => t.Kind == "signing")
            .OrderBy(t => t.Name)
            .ToListAsync(ct);

        var stage = row is null
            ? (gate.CommitteeApproved && gate.BankDataComplete ? "preparation" : "blocked")
            : row.Status switch
            {
                AgreementStatuses.Formation => "formation",
                AgreementStatuses.InProgress => "in-progress",
                AgreementStatuses.ModificationRequested => "modification-requested",
                AgreementStatuses.Preparation => "preparation",
                _ => "sent-to-applicant",
            };

        var myStep = steps.FirstOrDefault(s => s.UserId == viewerUserId);
        return new AgreementDetailWire(
            application.ApplicationId.ToString(),
            application.Reference ?? string.Empty,
            applicant.FullNameAr,
            row is null
                ? await ApprovedServicesAsync(db, application.ApplicationId, ct)
                : await db.AgreementServices
                    .Where(s => s.AgreementId == row.AgreementId)
                    .Select(s => s.Service)
                    .ToListAsync(ct),
            gate,
            stage,
            ParseFields(template.FieldMap),
            row is null
                ? new Dictionary<string, string>()
                : JsonSerializer.Deserialize<Dictionary<string, string>>(row.FieldValues) ?? [],
            row is null ? [] : await BuildMergedDataAsync(db, row, ct),
            [.. steps.Select(s =>
            {
                var member = stepUsers.First(u => u.UserId == s.UserId);
                var title = titles.FirstOrDefault(t => t.UserId == member.UserId);
                var state = s.Decision switch
                {
                    "approve" => "approved",
                    "sign" => "signed",
                    "request_modification" => "modification-requested",
                    _ => sequence!.Status == "in-progress" && s.OrderIndex == sequence.CurrentStepIndex
                        ? "current"
                        : "waiting",
                };
                return new SigningMemberWire(
                    member.UserId.ToString(),
                    member.FullNameAr,
                    new LocalizedTextWire(title?.NameAr ?? "موظف", title?.NameEn ?? "Staff"),
                    s.Obligation,
                    s.IsSigner,
                    s.OrderIndex,
                    state,
                    s.ActedAt is { } at ? ApplicationEndpoints.Iso(at) : null,
                    s.Note);
            })],
            await Screening.ScreeningEndpoints.BuildPoolAsync(
                db, "F-0301", ct),
            [.. templates.Select(t => new SigningTemplateWire(
                t.TemplateId.ToString(), t.Name, ParseTemplateMembers(t.Members)))],
            DocumentUrl: null, // G26 — no dead links.
            SequenceComplete: sequence?.IsComplete ?? false,
            SignaturesAttached: signaturesAttached,
            row?.SentToApplicantAt is { } sent ? ApplicationEndpoints.Iso(sent) : null,
            new AgreementViewerWire(
                // Served from the rule itself (BR-0215), not assumed until a
                // chain exists — a non-creator is never offered the form.
                IsCreator: sequence is null
                    ? await Interviews.InterviewEndpoints.IsScreeningDeciderAsync(
                        db, application.ApplicationId, viewerUserId, ct)
                    : sequence.CreatedBy == viewerUserId,
                myStep?.UserId.ToString(),
                CanDecide: sequence is not null && sequence.Status == "in-progress"
                    && steps.Any(s => s.OrderIndex == sequence.CurrentStepIndex
                        && s.UserId == viewerUserId),
                IsSigner: myStep?.IsSigner ?? false,
                CanResubmit: sequence is not null
                    && sequence.Status == "modification-requested"
                    && sequence.CreatedBy == viewerUserId),
            row is null ? null : await AgreementDocuments.WireAsync(db, row, ct));
    }

    internal static void LogEvent(
        ExpertHubDbContext db, Guid agreementId, string kind, Guid actorUserId, DateTime now,
        string? note = null, int? termYears = null)
    {
        db.AgreementEvents.Add(new AgreementEvent
        {
            EventId = Guid.NewGuid(),
            AgreementId = agreementId,
            Kind = kind,
            TermYears = termYears,
            Note = note,
            ActorUserId = actorUserId,
            OccurredAt = now,
        });
    }

    private static async Task<string> NextReferenceAsync(
        ExpertHubDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var prefix = string.Create(CultureInfo.InvariantCulture, $"AGR-{nowUtc.Year}-");
        var last = await db.Agreements
            .Where(a => a.Reference.StartsWith(prefix))
            .OrderByDescending(a => a.Reference)
            .Select(a => a.Reference)
            .FirstOrDefaultAsync(ct);
        return await ReferenceNumbers.NextAsync(db, prefix, last, digits: 4, ct);
    }

    /// <summary>A saved signing arrangement's members, as stored by the
    /// formation step — copied on reuse, never referenced (F2/AC-5).</summary>
    private static IReadOnlyList<SigningTemplateMemberWire> ParseTemplateMembers(string membersJson)
    {
        var parsed = JsonSerializer.Deserialize<List<SigningTemplateMemberJson>>(
            membersJson, WireJson);
        return parsed is null
            ? []
            : [.. parsed.Select(m => new SigningTemplateMemberWire(
                m.ApproverId, m.Obligation, m.IsSigner))];
    }

    private sealed record FieldJson(
        string Id, LocalizedJson Label, string Type, bool Required, LocalizedJson? Help);

    private sealed record LocalizedJson(string Ar, string En);

    private sealed record SigningTemplateMemberJson(
        string ApproverId, string Obligation, bool IsSigner);
}
