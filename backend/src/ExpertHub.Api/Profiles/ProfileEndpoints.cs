using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Documents;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Profiles;

/*
 * EH-TP-04 — My Profile (CAP-04, J-14), behind `profileService.ts`:
 *
 *   GET  v1/me/profile
 *   POST v1/me/profile/fields
 *   POST v1/me/profile/change-request
 *   POST v1/me/profile/visibility
 *   POST v1/me/profile/certificates/remove
 *   (bank-data lives with CAP-03 — J-09/F6 collects it BEFORE this profile
 *    exists, so it is keyed by user, not by trainer.)
 *
 * The rules, held server-side:
 * - `BR-0404`/J-14/F1/AC-1 — the SAME application-form schema, no separate
 *   update form: `formSchema` IS what J-01 renders, served from one place.
 * - Editability is decided PER FIELD by the server (`P-16`, `P-J9`), and
 *   re-checked on write: a client that skipped the UI cannot write a
 *   FAST-owned or locked field.
 * - A `request-change` field is WRITE-THROUGH (`P-135`): the change queues
 *   to FAST through BE-04's outbox and the OLD value keeps displaying with
 *   `pendingValue` set until FAST confirms — never applied locally and hoped
 *   for. With no FAST channel configured it simply stays pending, which is
 *   the contract's own described behaviour.
 * - ⚠️ `file_status` is ABSENT from this whole surface (`BR-0408`, `P-48`):
 *   the trainer never sees it, so no field here can carry it.
 */

/// <summary>
/// Field values, and which of them the Academy supplied rather than the person.
/// </summary>
/// <remarks>
/// ⚠️ The provenance is not cosmetic. Owner ruling, 2026-09-10: «if it comes
/// from FAST it should be already approved» — a value the Academy verified must
/// not be labelled as something this platform is still waiting for.
/// </remarks>
/// <summary>One further degree the Academy holds (`P-265`).</summary>
internal sealed record AcademyEducationWire(
    string? Qualification, string? Specialization, string? Institution, string? ObtainedAt);

/// <summary>One further professional certification the Academy holds.</summary>
internal sealed record AcademyCertificationWire(
    string? Name, string? Institution, string? ObtainedAt, string? FileName);

/// <summary>
/// What the Academy holds that the form's single set of fields could not.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>The overflow, not a second copy.</b> `P-258` removed a panel that
/// duplicated «المؤهل العلمي» beside itself, and this must not reintroduce it:
/// the entry already showing in the form's own fields is EXCLUDED here, so
/// each qualification appears exactly once on the page.
/// </para>
/// <para>
/// Owner ruling, 2026-09-10: «the user can add multiple experience roles … I
/// think it's in FAST». It is — FAST holds a list for all four collections
/// while the form has one of each (`DM-GAP-11`). Until the form itself takes
/// repeating groups, the rest are shown read-only rather than silently
/// dropped.
/// </para>
/// </remarks>
/// <summary>
/// One trainer contract the Financial Academy holds (`P-266`).
/// </summary>
/// <remarks>
/// ⚠️ <b>The Academy's document, not an Expert Hub agreement.</b> Whether the
/// two are the same artefact is unanswered (question 3 for the FAST team, and
/// the one that risks `BR-1201`), so this is served READ-ONLY and the page
/// names its source. There is no approve, no refuse and no download here —
/// FAST exposes all three and Expert Hub calls none of them.
/// </remarks>
internal sealed record AcademyContractWire(
    string? Reference, string? Status, string? StartsAt, string? EndsAt);

internal sealed record AcademyRecordsWire(
    IReadOnlyList<AcademyEducationWire> Education,
    IReadOnlyList<AcademyCertificationWire> Certifications,
    // ⚠️ Empty when the Academy holds none, or when the read has never run —
    // `SyncedAt` is what separates those, and the page uses it.
    IReadOnlyList<AcademyContractWire> Contracts,
    // Only ever as fresh as the person's last sign-in, and dated so nobody
    // mistakes it for live.
    string? SyncedAt);

internal readonly record struct AcademyMerge(
    Dictionary<string, JsonElement> Values,
    IReadOnlySet<string> FromAcademy,
    AcademyRecordsWire? Records);

internal sealed record ProfileFieldStateWire(
    string FieldId, string Editability, string? PendingValue,
    string? LastSyncAt, string? LockReason);

internal sealed record LockedFactsWire(
    // ⚠️ Null with no trainer file — see the note on `MyProfileWire`.
    string? Classification, decimal? EvaluationOverall,
    string? AgreementStatus, string? AgreementEndsAt);

internal sealed record ProgramHistoryWire(string Id, string Name, string Role, int Year);

internal sealed record CertificateWire(string Id, string Name);

internal sealed record ProgramRatingWire(string Program, decimal Score);

internal sealed record ProfileRatingsWire(
    string State, decimal? Overall, string? LastRefreshedAt,
    IReadOnlyList<ProgramRatingWire> Programs);

internal sealed record BankDataWire(
    string State, object? Fields, string? RequestedAt, string? CompletedAt,
    // See `BankPrefill` — offered, never confirmed.
    IReadOnlyDictionary<string, string>? Suggested);

/// <summary>
/// The trainer's repeatable-section entries, read through the schema version
/// they applied on. Their value rows carry the SAME entry columns the
/// application's do — the copy at approval preserves them — so the grouping is
/// the application's own, and a qualification cannot be shaped one way on the
/// application and another on the profile.
/// </summary>
internal static partial class ProfileEntryReader;

internal sealed record MyProfileWire(
    string DisplayName, string Email, string? AvatarUrl,
    /*
     * ⚠️ NULL for somebody with no trainer file. A classification is a fact
     * about an accredited trainer, and `TrainerClassifications
     * .PendingRulesPlaceholder` resolves to `certified` — so filling it here
     * would tell a person the Academy had accredited them when it has not.
     * That is `P-236` exactly, in a second place; a test caught it this time
     * rather than QA.
     */
    string? Classification,
    object FormSchema,
    IReadOnlyDictionary<string, JsonElement> FieldValues,
    /*
     * The repeatable sections' entries. `FieldValues` is entry 0 — which is
     * the whole answer for a section that holds one — and this carries the
     * rest, so a trainer who was approved with three qualifications sees
     * three. Absent when the person's form version had no repeatable section,
     * which is every version before `dm-gap-01.2026-09-21`.
     */
    IReadOnlyDictionary<string, IReadOnlyList<DraftEntryWire>>? Entries,
    IReadOnlyList<ProfileFieldStateWire> FieldStates,
    LockedFactsWire LockedFacts,
    IReadOnlyList<string> Services,
    IReadOnlyList<string> Specialties,
    IReadOnlyList<ProgramHistoryWire> Programs,
    ProfileRatingsWire Ratings,
    IReadOnlyList<CertificateWire> Certificates,
    // ⚠️ Null when the Academy's record has never been read. Empty lists mean
    // «read, and there is nothing beyond what the fields already show» — a
    // different statement, and the page makes it differently.
    AcademyRecordsWire? AcademyRecords,
    bool VisibilityConsent,
    // `D-44` — null means «never asked», which the profile shows differently
    // from «asked, and said no».
    string? VisibilityConsentDecidedAt,
    BankDataWire BankData,
    bool FastAvailable,
    /*
     * ⚠️ False when the person holds the trainer role but Expert Hub has no
     * trainer file for them yet — granted from the Academy's record (`P-234`)
     * without ever going through this platform's own accreditation.
     *
     * The page must render either way. Before this flag existed the profile
     * answered 404 and the screen said «تعذّر تحميل الملف», which is a lie:
     * nothing failed, and the Academy holds most of what the page is for.
     */
    bool EstablishedInExpertHub,
    // `P-331` — null with no trainer file: a bio belongs to an accredited trainer.
    TrainerBioWire? Bio);

internal sealed record SaveFieldsInputWire(IReadOnlyDictionary<string, JsonElement>? Values);

internal sealed record ChangeRequestInputWire(string? FieldId, string? NewValue);

internal sealed record VisibilityInputWire(bool Consent);

internal sealed record RemoveCertificateInputWire(string? Id);

/// <summary>The trainer's own profile surface.</summary>
public static class ProfileEndpoints
{
    public static RouteGroupBuilder MapProfileEndpoints(this RouteGroupBuilder v1)
    {
        // Ownership, not features (`P-190`): a trainer edits their own record
        // and nobody else's, which is the stronger guarantee.
        var me = v1.MapGroup("/me/profile").RequireAuthorization();

        me.MapGet("/", async (HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var loaded = await LoadAsync(http, db, ct);
            if (loaded is not null)
            {
                return Results.Ok(
                    await BuildAsync(db, loaded.Value.Profile, loaded.Value.User, ct));
            }

            /*
             * No trainer file — but that is not an error and must not read as
             * one. Somebody the Academy calls a trainer holds the role here
             * (`P-234`) and their qualifications, certifications and identity
             * are all in the replica. The page renders from those, and marks
             * what Expert Hub does not have yet.
             */
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            return Results.Ok(await BuildFromAcademyRecordAsync(db, actor, ct));
        }).WithName("MyProfile");

        me.MapPost("/fields", async (
            SaveFieldsInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var loaded = await LoadAsync(http, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No trainer profile exists yet.");
            }
            var (profile, user) = loaded.Value;
            var states = await FieldStatesAsync(db, profile, ct);
            var editable = states
                .Where(s => s.Editability == "editable")
                .Select(s => s.FieldId)
                .ToHashSet(StringComparer.Ordinal);

            foreach (var (code, value) in input.Values ?? new Dictionary<string, JsonElement>())
            {
                if (!editable.Contains(code))
                {
                    // Re-checked here on purpose: the UI hides these, and a
                    // client that skipped the UI must still be refused.
                    return Results.Problem(
                        statusCode: 403,
                        detail: $"'{code}' is not editable by its owner.",
                        extensions: new Dictionary<string, object?> { ["fieldId"] = code });
                }
                var row = await db.TrainerFieldValues.FirstOrDefaultAsync(
                    v => v.TrainerId == profile.TrainerId && v.FieldCode == code, ct);
                if (row is null)
                {
                    db.TrainerFieldValues.Add(new TrainerFieldValue
                    {
                        ValueId = Guid.NewGuid(),
                        TrainerId = profile.TrainerId,
                        FieldCode = code,
                        Value = value.GetRawText(),
                    });
                }
                else
                {
                    row.Value = value.GetRawText();
                }
            }
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildAsync(db, profile, user, ct));
        }).WithName("SaveProfileFields");

        me.MapPost("/change-request", async (
            ChangeRequestInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            IntegrationHub hub,
            CancellationToken ct) =>
        {
            var loaded = await LoadAsync(http, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No trainer profile exists yet.");
            }
            var (profile, user) = loaded.Value;
            var states = await FieldStatesAsync(db, profile, ct);
            var state = states.FirstOrDefault(s => s.FieldId == input.FieldId);
            if (state is null || state.Editability != "request-change")
            {
                return Results.Problem(
                    statusCode: 400,
                    detail: "Only a FAST-owned field is changed by request.");
            }
            if (state.PendingValue is not null)
            {
                return Results.Problem(statusCode: 409, detail: "A change is already pending.");
            }

            var now = DateTime.UtcNow;
            var request = new ProfileChangeRequest
            {
                ChangeRequestId = Guid.NewGuid(),
                TrainerId = profile.TrainerId,
                FieldCode = input.FieldId!,
                ProposedValue = JsonSerializer.Serialize(input.NewValue ?? string.Empty),
                Status = "pending",
                RequestedAt = now,
            };
            db.ProfileChangeRequests.Add(request);

            /*
             * P-135, write-through — and the reason `Q30` does not block this
             * increment. The change is enqueued for FAST in the SAME
             * transaction and shown as pending; the trainer's displayed value
             * does not move. With no FAST channel configured it stays queued,
             * which is exactly what the contract describes. If FAST never
             * gains a write API, the answer is to serve these fields as
             * `locked` instead — a change to the field-state map below, not
             * to this mechanism.
             *
             * `trainer_profile_base` is FAST-mastered, so the hub REFUSES an
             * outbound write to it (`P-129`). That refusal is the correct
             * answer and is caught here: the request is still recorded and
             * still shows as pending, which is the honest state — queued for
             * a crossing the mastership register does not yet permit.
             */
            try
            {
                await hub.EnqueueOutboundAsync(
                    IntegrationSystems.Fast,
                    "trainer_profile_base",
                    "TRAINER_PROFILE",
                    profile.TrainerId,
                    entityVersion: await db.ProfileChangeRequests
                        .CountAsync(r => r.TrainerId == profile.TrainerId, ct) + 1,
                    operation: "upsert",
                    TrainerProfileService.Serialize(new
                    {
                        trainerId = profile.TrainerId,
                        fieldCode = request.FieldCode,
                        proposedValue = input.NewValue,
                    }),
                    ct);
            }
            catch (MastershipViolationException)
            {
                // Recorded as pending regardless — see the note above.
            }

            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildAsync(db, profile, user, ct));
        }).WithName("RequestFastFieldChange");

        me.MapPost("/visibility", async (
            VisibilityInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var loaded = await LoadAsync(http, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No trainer profile exists yet.");
            }
            var (profile, user) = loaded.Value;
            // BR-1007 — immediate effect: the directory reads this column.
            profile.VisibilityConsent = input.Consent;
            // `D-44` — the answer is dated, so a decision to stay hidden is
            // distinguishable from never having been asked. Stamped on BOTH
            // answers: declining is a decision too, and a trainer who declines
            // should not be asked again every time they open their profile.
            profile.VisibilityConsentDecidedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildAsync(db, profile, user, ct));
        }).WithName("SetVisibilityConsent");

        // J-14/F1/AC-2 — add a professional certificate. The document is
        // stored exactly as the application form stores one (same store,
        // scanner and record), under the trainer's own application's
        // `professional-certificate` rule for formats and size.
        me.MapPost("/certificates", async (
            HttpRequest request,
            HttpContext http,
            ExpertHubDbContext db,
            IDocumentStore store,
            IUploadScanner scanner,
            CancellationToken ct) =>
        {
            var loaded = await LoadAsync(http, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No trainer profile exists yet.");
            }
            var (profile, user) = loaded.Value;
            if (!request.HasFormContentType)
            {
                return Results.Problem(statusCode: 415, detail: "Expected a multipart upload.");
            }
            var application = await db.Applications.SingleAsync(a => a.ApplicationId == profile.ApplicationId, ct);
            var rule = await db.AttachmentRules.FirstOrDefaultAsync(
                r => r.RuleCode == "professional-certificate" && r.SchemaVersion == application.SchemaVersion, ct);
            if (rule is null)
            {
                return Results.Problem(statusCode: 409, detail: "certificate-rule-unavailable");
            }
            var formats = (JsonSerializer.Deserialize<string[]>(rule.AcceptedFormats) ?? [])
                .Select(f => f.TrimStart('.').ToLowerInvariant())
                .ToArray();
            var form = await request.ReadFormAsync(ct);
            var (attachment, problem) = await Documents.AttachmentUploads.StoreAsync(
                form.Files.GetFile("file"), formats, rule.MaxSizeMb, user.UserId, db, store, scanner, ct);
            if (problem is not null)
            {
                return problem;
            }
            db.ApplicationAttachments.Add(new ApplicationAttachment
            {
                ApplicationAttachmentId = Guid.NewGuid(),
                ApplicationId = profile.ApplicationId,
                AttachmentId = attachment!.AttachmentId,
                RuleCode = rule.RuleCode,
                FileName = attachment.FileName,
                SizeBytes = attachment.SizeBytes,
            });
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildAsync(db, profile, user, ct));
        })
            .DisableAntiforgery()
            .WithName("AddCertificate");

        me.MapPost("/certificates/remove", async (
            RemoveCertificateInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var loaded = await LoadAsync(http, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No trainer profile exists yet.");
            }
            var (profile, user) = loaded.Value;
            // Certificates reach the profile as the application's attachments
            // (`G26` keeps the upload path closed), so removing one removes
            // that record. Nothing here deletes a stored file: there is none.
            if (!Guid.TryParse(input.Id, out var attachmentId))
            {
                return Results.Problem(statusCode: 404, detail: "Certificate not found.");
            }
            // ⚠️ Scoped to the certificate rule. Without it this route removed
            // ANY attachment on the application by id — the CV, the ID
            // document, the qualification the committee read — through a button
            // labelled "remove certificate".
            var row = await db.ApplicationAttachments.FirstOrDefaultAsync(
                a => a.ApplicationAttachmentId == attachmentId
                    && a.ApplicationId == profile.ApplicationId
                    && a.RuleCode == "professional-certificate", ct);
            if (row is null)
            {
                return Results.Problem(statusCode: 404, detail: "Certificate not found.");
            }
            db.ApplicationAttachments.Remove(row);
            await db.SaveChangesAsync(ct);
            return Results.Ok(await BuildAsync(db, profile, user, ct));
        }).WithName("RemoveCertificate");

        return v1;
    }

    /* ── assembly ──────────────────────────────────────────────────────────── */

    private static async Task<(TrainerProfile Profile, AppUser User)?> LoadAsync(
        HttpContext http, ExpertHubDbContext db, CancellationToken ct)
    {
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        var profile = await db.TrainerProfiles.FirstOrDefaultAsync(p => p.UserId == actor.UserId, ct);
        return profile is null ? null : (profile, actor);
    }

    /// <summary>
    /// Per-field editability — the heart of J-14. The mastership register
    /// (`DATA_ELEMENT`, `P-129`) decides it as DATA: a field of an element
    /// FAST masters is `request-change`; everything else the trainer owns is
    /// `editable`. `locked` is reserved for J-14/F2's three matrix rows,
    /// which are facts about the trainer rather than form fields, so no form
    /// field is served locked today — a fourth lock reason is a business
    /// decision, not a hunch.
    /// </summary>
    /// <summary>
    /// Every field of the current schema, locked, for somebody with no Expert
    /// Hub trainer file.
    /// </summary>
    /// <remarks>
    /// <para>
    /// ⚠️ <b>NOT an empty list.</b> `ProfileFieldsForm` drops any field it has
    /// no state for, so `FieldStates: []` rendered «المؤهلات العلمية» and every
    /// other section as a heading with nothing underneath — the exact opposite
    /// of the ruling this path exists to satisfy, and worse than the 404 it
    /// replaced, because an empty section looks like an answer.
    /// </para>
    /// <para>
    /// Locked rather than editable, because there is no `TRAINER_PROFILE` row
    /// to write to: an input with a save button that cannot save is a promise
    /// the endpoint would break. Locked still RENDERS the label and the value,
    /// so the Academy's record shows and every field it does not cover shows
    /// «—» — which is «highlight the information missing», literally.
    /// </para>
    /// </remarks>
    /// <summary>
    /// The Academy's records that the form's single set of fields could not
    /// hold — everything except the one already on screen.
    /// </summary>
    /// <remarks>
    /// ⚠️ Null when the record has never been read, which the page shows
    /// differently from «read, and there is nothing more» — the same
    /// distinction `P-230` draws, for the same reason.
    /// </remarks>
    private static AcademyRecordsWire? AcademyRecords(
        FastProfileReplica replica, Applications.FastRecordsUsed used)
    {
        // ⚠️ EITHER read is enough to have something to show. Gating on the
        // qualifications alone would hide a contract from somebody whose
        // qualification read failed — two independent calls, two independent
        // outcomes.
        var syncedAt = replica.QualificationsSyncedAt ?? replica.ContractsSyncedAt;
        if (syncedAt is null)
        {
            return null;
        }

        // `Skip(1)` exactly when the newest entry reached the fields. When the
        // person's own answers filled them instead, no FAST entry is on
        // screen and every one of them belongs in the list.
        var education = FastQualificationItems.Education(replica.QualificationsEducation)
            .Skip(used.Education ? 1 : 0)
            .Select(item => new AcademyEducationWire(
                item.QualificationsType,
                string.IsNullOrWhiteSpace(item.Specialization)
                    ? item.GeneralSpecialization
                    : item.Specialization!.Trim(),
                item.Donor,
                item.DateObtained is { } on ? ApplicationEndpoints.Iso(on) : null));

        var certifications = FastQualificationItems.Professional(replica.QualificationsProfessional)
            .Skip(used.Professional ? 1 : 0)
            .Select(item => new AcademyCertificationWire(
                item.CertificateName,
                item.Donor,
                item.DateObtained is { } on ? ApplicationEndpoints.Iso(on) : null,
                // The file name only — FAST's own download URL points at the
                // Academy portal and nobody has confirmed it opens for an
                // Expert Hub session.
                item.AttachmentName));

        var contracts = FastContractItems.Parse(replica.Contracts)
            .Select(item => new AcademyContractWire(
                // Whichever identifier FAST actually sent — the payload has no
                // declared schema, so both are read and the first real one is
                // shown rather than an empty label.
                item.ContractNumber ?? item.Id,
                item.StatusName ?? item.Status,
                item.StartDate is { } from ? ApplicationEndpoints.Iso(from) : null,
                item.EndDate is { } to ? ApplicationEndpoints.Iso(to) : null));

        return new AcademyRecordsWire(
            [.. education],
            [.. certifications],
            [.. contracts],
            ApplicationEndpoints.Iso(syncedAt.Value));
    }

    private static async Task<List<ProfileFieldStateWire>> AcademyFieldStatesAsync(
        ExpertHubDbContext db,
        IReadOnlySet<string> fromAcademy,
        Guid userId,
        CancellationToken ct)
    {
        var fields = await db.FormFields
            .Where(f => f.SchemaVersion == FormSchemaVersions.Current)
            .OrderBy(f => f.OrderIndex)
            .Select(f => f.FieldCode)
            .ToListAsync(ct);
        var synced = await db.FastProfiles.AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => (DateTime?)p.LastSyncedAt)
            .FirstOrDefaultAsync(ct);

        return [.. fields.Select(code => new ProfileFieldStateWire(
            code,
            "locked",
            PendingValue: null,
            // Dated, because the record is only ever as fresh as the last
            // sign-in and a reader should be able to see how fresh that is.
            LastSyncAt: fromAcademy.Contains(code) && synced is { } at
                ? ApplicationEndpoints.Iso(at)
                : null,
            /*
             * ⚠️ Two different absences, and calling them the same thing was
             * the defect. Owner ruling, 2026-09-10: «if it comes from FAST it
             * should be already approved» — a value the Academy verified is
             * not something Expert Hub is waiting for, and tagging «يُستكمل
             * عند الاعتماد» on a filled, verified field said the opposite.
             *
             * Filled from the Academy → `from-academy`: verified, and shown
             * as such. Empty → `not-accredited`: this platform still needs it.
             */
            LockReason: fromAcademy.Contains(code) ? "from-academy" : "not-accredited"))];
    }

    /// <summary>
    /// The trainer's repeatable-section entries, read through the schema
    /// version they applied on. Their value rows carry the SAME entry columns
    /// the application's do — the copy at approval preserves them — so the
    /// grouping is the application's own, and a qualification cannot be shaped
    /// one way on the application and another on the profile.
    /// </summary>
    private static async Task<IReadOnlyDictionary<string, IReadOnlyList<DraftEntryWire>>?> TrainerEntriesAsync(
        ExpertHubDbContext db, Guid trainerId, string schemaVersion, CancellationToken ct)
    {
        var rows = await db.TrainerFieldValues
            .Where(v => v.TrainerId == trainerId)
            .Select(v => new ApplicationEndpoints.EntryValue(
                v.FieldCode, v.Value, v.EntryId, v.EntryIndex))
            .ToListAsync(ct);
        return await ApplicationEndpoints.GroupEntriesAsync(db, schemaVersion, rows, ct);
    }

    private static async Task<List<ProfileFieldStateWire>> FieldStatesAsync(
        ExpertHubDbContext db, TrainerProfile profile, CancellationToken ct)
    {
        var application = await db.Applications.SingleAsync(
            a => a.ApplicationId == profile.ApplicationId, ct);
        var fields = await db.FormFields
            .Where(f => f.SchemaVersion == application.SchemaVersion)
            .OrderBy(f => f.OrderIndex)
            .ToListAsync(ct);
        var pending = await db.ProfileChangeRequests
            .Where(r => r.TrainerId == profile.TrainerId && r.Status == "pending")
            .ToListAsync(ct);
        var lastSynced = await db.ReplicationStates
            .Where(r => r.EntityType == "TRAINER_PROFILE" && r.LocalEntityId == profile.TrainerId)
            .Select(r => r.LastSyncedAt)
            .FirstOrDefaultAsync(ct);

        var states = new List<ProfileFieldStateWire>(fields.Count);
        foreach (var field in fields)
        {
            var definition = JsonSerializer.Deserialize<JsonElement>(field.Definition);
            // The application schema already records who owns each field:
            // `sso-profile` fields come from the identity/base profile FAST
            // masters, `expert-hub` fields are the trainer's own.
            var fastOwned = definition.TryGetProperty("ownership", out var ownership)
                && ownership.GetString() == "sso-profile";
            var request = pending.FirstOrDefault(r => r.FieldCode == field.FieldCode);
            states.Add(new ProfileFieldStateWire(
                field.FieldCode,
                fastOwned ? "request-change" : "editable",
                request is null
                    ? null
                    : JsonSerializer.Deserialize<string>(request.ProposedValue),
                fastOwned && lastSynced is { } synced ? ApplicationEndpoints.Iso(synced) : null,
                LockReason: null));
        }
        return states;
    }

    /// <summary>
    /// The Academy's own qualification record for this person, or null.
    /// </summary>
    /// <remarks>
    /// ⚠️ Read from the replica, not from FAST. The live endpoints are scoped
    /// to the caller's token and `P-215` discards it — so what is shown is what
    /// the last sign-in stored, dated so nobody mistakes it for live.
    /// </remarks>
    /// <summary>
    /// The person's own answers, with everything the Academy holds filling any
    /// field Expert Hub has nothing for.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Owner ruling, 2026-09-10: «it shouldn't do this at all, it should save
    /// in the same qualification in the platform». The Academy's record is not
    /// a second panel beside «المؤهل العلمي» — it IS «المؤهل العلمي», in the
    /// fields the form already has.
    /// </para>
    /// <para>
    /// And then, the same day: «work on all the data from FAST … all this
    /// information on the API, also for the approved one». So it is no longer
    /// the qualifications alone but everything `FastFieldMap` can express —
    /// the eight name parts, the ID, the date of birth, the nationality, the
    /// working life — on BOTH profile paths, through the one mapping the
    /// application form reads, so the form and the profile cannot disagree.
    /// </para>
    /// <para>
    /// ⚠️ <b>The trainer's own answers win.</b> Their file is what they wrote
    /// on an application the Academy accredited, and the replica is a copy of
    /// what FAST held at their last sign-in; where both have a field, the
    /// stored answer stands and the copy fills nothing.
    /// </para>
    /// </remarks>
    /// <returns>The merged values, and the codes the Academy supplied.</returns>
    private static async Task<AcademyMerge> MergedFieldValuesAsync(
        ExpertHubDbContext db,
        Dictionary<string, JsonElement> stored,
        Guid userId,
        CancellationToken ct)
    {
        var replica = await db.FastProfiles.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (replica is null)
        {
            return new AcademyMerge(
                stored, new HashSet<string>(StringComparer.Ordinal), Records: null);
        }

        // The full names live on the user record, not the replica — that is
        // where `D-15` put them, and the name split needs both.
        var user = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId, ct);

        var fromAcademy = new Dictionary<string, string>(StringComparer.Ordinal);
        var mapped = Applications.FastFieldMap.Add(
            replica, user?.FullNameAr, user?.FullNameEn, fromAcademy);
        var supplied = new HashSet<string>(StringComparer.Ordinal);

        foreach (var (field, value) in fromAcademy)
        {
            if (!stored.ContainsKey(field))
            {
                // Serialized the same way a stored answer is, so the form
                // cannot tell one source from the other — which is the point.
                stored[field] = JsonSerializer.SerializeToElement(value);
                supplied.Add(field);
            }
        }
        return new AcademyMerge(stored, supplied, AcademyRecords(replica, mapped.Used));
    }

    /// <summary>
    /// The profile of somebody who holds the trainer role but has no Expert Hub
    /// trainer file yet.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Owner ruling, 2026-09-10: «the user has all information in FAST, it
    /// should show the information and highlight the information missing».
    /// </para>
    /// <para>
    /// ⚠️ Every Expert Hub section is EMPTY here, not absent — no accredited
    /// services, no programme history, no ratings, no agreement. That is the
    /// truthful state: this person has been recognised by the Academy and has
    /// not been through this platform's accreditation, and the page can say so
    /// only if the shape is the same either way.
    /// </para>
    /// </remarks>
    private static async Task<MyProfileWire> BuildFromAcademyRecordAsync(
        ExpertHubDbContext db, AppUser user, CancellationToken ct)
    {
        var bank = await db.BankData.FirstOrDefaultAsync(b => b.UserId == user.UserId, ct);
        var merged = await MergedFieldValuesAsync(
            db,
            new Dictionary<string, JsonElement>(StringComparer.Ordinal),
            user.UserId,
            ct);

        return new MyProfileWire(
            user.FullNameAr,
            user.Email,
            AvatarUrl: null,
            Classification: null,
            await ApplicationEndpoints.BuildSchemaWireAsync(db, ct),
            // Nothing stored — this person has no trainer file — so every
            // value on the page comes from the Academy's record, and there are
            // no repeatable entries of their own to carry.
            merged.Values,
            Entries: null,
            await AcademyFieldStatesAsync(db, merged.FromAcademy, user.UserId, ct),
            new LockedFactsWire(null, null, null, null),
            Services: [],
            Specialties: [],
            Programs: [],
            new ProfileRatingsWire("unavailable", null, null, []),
            Certificates: [],
            merged.Records,
            VisibilityConsent: false,
            // Never asked, and cannot be: the directory lists accredited
            // trainers, and this person is not one yet.
            VisibilityConsentDecidedAt: null,
            new BankDataWire(
                bank switch
                {
                    null or { RequestedAt: null } => "not-requested",
                    { CompletedAt: not null } => "complete",
                    _ => "requested",
                },
                bank?.Fields is null
                    ? null
                    : JsonSerializer.Deserialize<JsonElement>(bank.Fields),
                bank?.RequestedAt is { } requested ? ApplicationEndpoints.Iso(requested) : null,
                bank?.CompletedAt is { } completed ? ApplicationEndpoints.Iso(completed) : null,
                bank?.CompletedAt is null
                    ? await Applications.BankPrefill.ForUserAsync(db, user.UserId, ct)
                    : null),
            FastAvailable: true,
            EstablishedInExpertHub: false,
            Bio: null);
    }

    internal static async Task<MyProfileWire> BuildAsync(
        ExpertHubDbContext db,
        TrainerProfile profile,
        AppUser user,
        CancellationToken ct)
    {
        var application = await db.Applications.SingleAsync(
            a => a.ApplicationId == profile.ApplicationId, ct);
        var services = await db.TrainerServices
            .Where(s => s.TrainerId == profile.TrainerId)
            .ToListAsync(ct);
        var records = await TrainerProfileService.RecordsAsync(db, profile.TrainerId, ct);
        var (state, overall, refreshedAt, programs) =
            await TrainerProfileService.RatingsAsync(db, profile.TrainerId, ct);
        var agreement = await db.Agreements.FirstOrDefaultAsync(
            a => a.TrainerUserId == profile.UserId
                && (a.Status == AgreementStatuses.Active
                    || a.Status == AgreementStatuses.Suspended
                    || a.Status == AgreementStatuses.Ended), ct);
        var certificates = await db.ApplicationAttachments
            .Where(a => a.ApplicationId == profile.ApplicationId)
            .ToListAsync(ct);
        var bank = await db.BankData.FirstOrDefaultAsync(b => b.UserId == profile.UserId, ct);
        // ⚠️ The accredited trainer gets the Academy's record too («also for
        // the approved one»). Their own stored answers still win every field
        // they have one for; this only fills the gaps.
        var merged = await MergedFieldValuesAsync(
            db,
            await TrainerProfileService.FieldValuesAsync(db, profile.TrainerId, ct),
            profile.UserId,
            ct);

        return new MyProfileWire(
            user.FullNameAr,
            user.Email,
            AvatarUrl: null, // G26 — no stored photo to link to.
            TrainerProfileService.Classification(services),
            // The version the trainer applied on — the one their answers and
            // field states (`FieldStatesAsync`) belong to.
            await ApplicationEndpoints.BuildSchemaWireAsync(db, ct, application.SchemaVersion),
            merged.Values,
            // Every qualification, certificate and past role the applicant was
            // approved with — `merged.Values` is only entry 0, and serving one
            // of three was the profile's half of the repeatable feature.
            await TrainerEntriesAsync(db, profile.TrainerId, application.SchemaVersion, ct),
            await FieldStatesAsync(db, profile, ct),
            new LockedFactsWire(
                TrainerProfileService.Classification(services),
                overall,
                agreement is null ? null : AgreementStatusWire(agreement, DateTime.UtcNow),
                agreement?.EndsAt is { } endsAt ? ApplicationEndpoints.Iso(endsAt) : null),
            [.. services.Select(s => s.Service)],
            TrainerProfileService.Specialties(),
            [.. records.Select(r => new ProgramHistoryWire(
                r.RecordId.ToString(), r.ProgramNameAr, r.Role, r.DeliveredFrom.Year))],
            new ProfileRatingsWire(
                state,
                overall,
                refreshedAt is { } at ? ApplicationEndpoints.Iso(at) : null,
                [.. programs.Select(p => new ProgramRatingWire(p.Program, p.Score))]),
            [.. certificates.Select(c => new CertificateWire(
                c.ApplicationAttachmentId.ToString(), c.FileName))],
            merged.Records,
            profile.VisibilityConsent,
            profile.VisibilityConsentDecidedAt is { } decidedAt
                ? ApplicationEndpoints.Iso(decidedAt)
                : null,
            new BankDataWire(
                bank switch
                {
                    null or { RequestedAt: null } => "not-requested",
                    { CompletedAt: not null } => "complete",
                    _ => "requested",
                },
                bank?.Fields is null
                    ? null
                    : JsonSerializer.Deserialize<JsonElement>(bank.Fields),
                bank?.RequestedAt is { } requested ? ApplicationEndpoints.Iso(requested) : null,
                bank?.CompletedAt is { } completed ? ApplicationEndpoints.Iso(completed) : null,
                bank?.CompletedAt is null
                    ? await Applications.BankPrefill.ForUserAsync(db, profile.UserId, ct)
                    : null),
            // `P-17` — the FAST section's reachability. True while nothing
            // reads FAST live; it turns on the INT-05a feed's health when
            // that feed exists.
            FastAvailable: true,
            // A trainer file exists, so every section on this page has a source.
            EstablishedInExpertHub: true,
            await TrainerBioEndpoints.WireAsync(db, profile, ct));
    }

    /// <summary>`expired` is derived from the calendar (`P-188`), so the
    /// trainer's view derives it the same way the lifecycle screen does.</summary>
    internal static string AgreementStatusWire(Agreement agreement, DateTime nowUtc) =>
        agreement.Status == AgreementStatuses.Active
            && agreement.EndsAt is { } ends && ends < nowUtc
            ? AgreementStatuses.Expired
            : agreement.Status;
}
