using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Api.ServiceRequests;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Documents;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Profiles;

/*
 * EH-PUB-02/03 — the public trainer directory (CAP-10, J-24), behind
 * `directoryService.ts`:
 *
 *   GET v1/directory?page=&pageSize=&search=&specialty=      (ANONYMOUS)
 *   GET v1/directory/{id}                                    (ANONYMOUS)
 *
 * and EH-INT-07 — the internal trainer base (CAP-04, J-15), behind
 * `trainerSearchService.ts`:
 *
 *   GET v1/internal/trainers?…
 *   GET v1/internal/trainers/{id}
 *
 * The two live in one file because their difference is the point, and it is
 * easier to keep honest side by side:
 *
 * - The PUBLIC projection carries exactly what `P-335` lists — name, field
 *   (specialties), approved short bio, programmes delivered with the Academy,
 *   personal photo and classification — and NOTHING else. No rating
 *   (`P-40`/`P-41`), no city, no file status, no email, no internal id —
 *   enforced by the projection itself, not by a view that remembers to omit
 *   them, and pinned by a property allow-list test. Only trainers who turned
 *   consent ON appear at all (`BR-1002`/`BR-1007`).
 * - The INTERNAL projection adds exactly what J-15/F1/AC-1 enumerates, file
 *   status included (`BR-0408` keeps it internal — this is the surface it is
 *   allowed on).
 */

/* ── public ──────────────────────────────────────────────────────────────── */

/// <summary>
/// One card in the public directory.
/// </summary>
/// <remarks>
/// ⚠️ Every field is a publication decision, not a styling one. `P-335`
/// (2026-10-06) fixes the list: name, field, short bio (profile only),
/// programmes delivered with the Academy, personal photo, classification.
/// It supersedes the 2026-09-09 ruling for <b>city</b>, which is no longer
/// published. <b>Classification</b> stays public as text; the «معتمد» badge
/// that used to carry it was removed from the card. <b>The photo</b> is a URL
/// to <c>/directory/{id}/photo</c>, never an attachment id. The consent gate is
/// untouched: none of this reaches anybody for a trainer who has not turned
/// visibility on (`BR-1002`/`BR-1007`).
/// </remarks>
internal sealed record PublicTrainerSummaryWire(
    string Id,
    string Name,
    IReadOnlyList<string> Specialties,
    int ProgramsDelivered,
    string Classification,
    string? PhotoUrl);

/// <summary>A delivered programme — name and year only. The `TRAINER_RECORD`
/// id is internal and is not published (`P-335`, UI-27).</summary>
internal sealed record PublicProgramWire(string Name, int Year);

/// <summary>
/// The public profile: the card's fields plus the programmes themselves and the
/// APPROVED short bio (`P-331`), never a draft.
/// </summary>
internal sealed record PublicTrainerProfileWire(
    string Id, string Name, IReadOnlyList<string> Specialties,
    IReadOnlyList<PublicProgramWire> DeliveredPrograms,
    string Classification, string? Bio, string? PhotoUrl);

internal sealed record DirectoryListWire(
    IReadOnlyList<PublicTrainerSummaryWire> Items, int TotalCount, int Page, int PageSize,
    int PageCount, int TotalConsented, int SpecialtiesRepresented, int ProgramsDelivered);

/* ── internal ────────────────────────────────────────────────────────────── */

internal sealed record DomainOptionWire(string Id, string Label);

internal sealed record TrainerSearchResultWire(
    string TrainerId, string Name, IReadOnlyList<string> Services,
    IReadOnlyList<string> Specialties, string Classification, string FileStatus,
    decimal? EvaluationOverall, int CertificationCount, int? YearsExperience);

internal sealed record TrainerSearchListWire(
    IReadOnlyList<TrainerSearchResultWire> Items, int TotalCount,
    IReadOnlyList<DomainOptionWire> AvailableDomains);

internal sealed record TrainerRecordEntryWire(string Id, string Name, string Role, int Year);

internal sealed record TrainerEvaluationWire(
    decimal? Overall, string? LastSyncedAt,
    IReadOnlyList<ProgramRatingWire> PerProgram);

internal sealed record TrainerAgreementSummaryWire(
    string Reference, string Status, string StartsAt, string EndsAt);

internal sealed record IdentityCardWire(
    string? PhotoUrl, string Name, string Experience, string AcademicQualifications,
    IReadOnlyList<string>? RelatedFields, IReadOnlyList<string> Certifications,
    IReadOnlyList<string>? SocialAccounts, string? PdfUrl);

internal sealed record TrainerProfileWire(
    string TrainerId, string Name, string Email, string Phone, string City,
    string? AvatarUrl, IReadOnlyList<string> Services, IReadOnlyList<string> Specialties,
    string Classification, int? YearsExperience, string AcademicQualification,
    IReadOnlyList<string> Certifications, string FileStatus,
    IReadOnlyList<TrainerRecordEntryWire> Record,
    TrainerEvaluationWire Evaluation,
    TrainerAgreementSummaryWire? Agreement,
    IdentityCardWire IdentityCard,
    // `P-331` — the approved short bio; a pending one is in the review queue.
    string? Bio);

/// <summary>The public directory and the internal trainer base.</summary>
public static class DirectoryEndpoints
{
    public static RouteGroupBuilder MapDirectoryEndpoints(this RouteGroupBuilder v1)
    {
        /*
         * ANONYMOUS on purpose — EH-PUB-02/03 are public pages. What protects
         * a trainer here is not authentication but CONSENT: a profile without
         * it is not in the query at all.
         */
        v1.MapGet("/directory", async (
            int page, int pageSize, string? search, string? specialty,
            ExpertHubDbContext db, CancellationToken ct) =>
        {
            // ⚠️ `G12`/`Q16` — no taxonomy maps a trainer onto a specialty, so
            // this filter could only ever answer «nobody». Refused, never
            // exposed as a filter that predictably returns a wrong result.
            if (!string.IsNullOrWhiteSpace(specialty))
            {
                return Results.Problem(statusCode: 400, detail: "specialty-filter-unavailable");
            }
            var consented = await ConsentedAsync(db, ct);
            var filtered = consented
                .Where(t =>
                    string.IsNullOrWhiteSpace(search)
                        || t.Name.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase))
                .ToList();

            var safePageSize = Math.Clamp(pageSize, 1, 100);
            var pageCount = Math.Max(1, (int)Math.Ceiling(filtered.Count / (double)safePageSize));
            var safePage = Math.Clamp(page, 1, pageCount);
            return Results.Ok(new DirectoryListWire(
                [.. filtered
                    .Skip((safePage - 1) * safePageSize)
                    .Take(safePageSize)],
                filtered.Count,
                safePage,
                safePageSize,
                pageCount,
                consented.Count,
                consented.SelectMany(t => t.Specialties).Distinct().Count(),
                consented.Sum(t => t.ProgramsDelivered)));
        }).WithName("PublicDirectory");

        v1.MapGet("/directory/{id}", async (
            string id, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var profile = await PublicProfileAsync(db, id, ct);
            if (profile is null)
            {
                // Without consent the profile is not "forbidden" — it is not
                // public at all, and saying so would itself disclose that the
                // person exists (J-24: hidden/not-found, `P-41`).
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            var user = await db.Users.SingleAsync(u => u.UserId == profile.UserId, ct);
            var records = await TrainerProfileService.RecordsAsync(db, profile.TrainerId, ct);
            var publicServices = await db.TrainerServices
                .Where(s => s.TrainerId == profile.TrainerId)
                .ToListAsync(ct);
            var photos = await PhotoAttachmentsAsync(db, [profile.ApplicationId], ct);

            return Results.Ok(new PublicTrainerProfileWire(
                profile.TrainerId.ToString(),
                user.FullNameAr,
                TrainerProfileService.Specialties(),
                [.. records.Select(r => new PublicProgramWire(r.ProgramNameAr, r.DeliveredFrom.Year))],
                Classification: TrainerProfileService.Classification(publicServices),
                Bio: await TrainerBioEndpoints.PublishedAsync(db, profile.TrainerId, ct),
                PhotoUrl: photos.ContainsKey(profile.ApplicationId) ? PhotoUrl(profile.TrainerId) : null));
        }).WithName("PublicTrainerProfile");

        /*
         * The personal photo (`P-335`) — the one file the directory publishes.
         * The same gate as the profile, and the same identical 404 for a
         * malformed id, an unknown trainer, a withheld one and one with no
         * photo, so the route never tells anybody more than the profile would.
         * Only an image is served: a `photo` slot holding anything else is
         * treated as no photo rather than handed to an anonymous browser.
         */
        v1.MapGet("/directory/{id}/photo", async (
            string id, HttpContext http, ExpertHubDbContext db, IDocumentStore store,
            CancellationToken ct) =>
        {
            var profile = await PublicProfileAsync(db, id, ct);
            var photo = profile is null
                ? null
                : (await PhotoAttachmentsAsync(db, [profile.ApplicationId], ct))
                    .GetValueOrDefault(profile.ApplicationId);
            var content = photo is null ? null : await store.GetAsync(photo.StorageRef, ct);
            if (content is null || !content.MimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            {
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            // Short and public: a withdrawn consent must stop the photo soon,
            // and nothing about it differs per viewer.
            http.Response.Headers.CacheControl = "public, max-age=300";
            return Results.File(content.Bytes, content.MimeType);
        }).WithName("PublicTrainerPhoto");

        /* ── the internal trainer base — J-15 ──────────────────────────────── */

        var trainers = v1.MapGroup("/internal/trainers")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        // F-0410 البحث والفلترة — the trainer base search.
        trainers.MapGet("/", async (
            string? search, string? service, string? specialty, string? domain,
            string? fileStatus, int? minCertifications, int? minYearsExperience,
            decimal? minEvaluation,
            ExpertHubDbContext db, CancellationToken ct) =>
        {
            // ⚠️ The minimum-years filter has no numeric source (see
            // `YearsExperience`), so it answered «nobody» for every value. It
            // is refused rather than silently ignored — a filter that appears
            // applied but is not would mislead just as badly.
            if (minYearsExperience is not null)
            {
                return Results.Problem(statusCode: 400, detail: "min-years-experience-unavailable");
            }
            // The same rule for three more filters with nothing behind them:
            // no specialty or domain taxonomy (`Q16`), and no calculated rating
            // (`DM-GAP-14` — nothing writes one), so each answered «nobody» or
            // silently nothing. Refused rather than offered.
            if (!string.IsNullOrWhiteSpace(specialty))
            {
                return Results.Problem(statusCode: 400, detail: "specialty-filter-unavailable");
            }
            if (!string.IsNullOrWhiteSpace(domain))
            {
                return Results.Problem(statusCode: 400, detail: "domain-filter-unavailable");
            }
            if (minEvaluation is not null)
            {
                return Results.Problem(statusCode: 400, detail: "min-evaluation-unavailable");
            }
            var rows = await LoadInternalAsync(db, ct);
            var filtered = rows.Where(r =>
                    (string.IsNullOrWhiteSpace(search)
                        || r.Wire.Name.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase))
                    && (string.IsNullOrWhiteSpace(service) || r.Wire.Services.Contains(service))
                    && (string.IsNullOrWhiteSpace(fileStatus) || r.Wire.FileStatus == fileStatus)
                    && (minCertifications is not { } minCerts
                        || r.Wire.CertificationCount >= minCerts))
                .Select(r => r.Wire)
                .ToList();

            return Results.Ok(new TrainerSearchListWire(
                filtered,
                filtered.Count,
                // `Q16` — empty until the domain taxonomy exists, exactly as
                // the contract's own comment says it will be.
                AvailableDomains: []));
        })
            .WithName("TrainerSearch")
            .RequireFeature("F-0410");

        // F-0402 الملف الشامل — the unified internal profile.
        trainers.MapGet("/{trainerId}", async (
            string trainerId, ExpertHubDbContext db, CancellationToken ct) =>
        {
            if (!Guid.TryParse(trainerId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            var profile = await db.TrainerProfiles.FirstOrDefaultAsync(p => p.TrainerId == id, ct);
            if (profile is null)
            {
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            return Results.Ok(await BuildInternalProfileAsync(db, profile, ct));
        })
            .WithName("TrainerProfileDetail")
            .RequireFeature("F-0402");

        return v1;
    }

    /* ── assembly ──────────────────────────────────────────────────────────── */

    /// <summary>
    /// The trainers whose file may appear publicly: ACTIVE or IDLE, derived by
    /// the one file-status rule the trainer base and matching already use
    /// (`D-24`) — never a second calculation. Idle is monitoring-only (J-13/AC-9)
    /// and stays listable; suspended and expired (which includes a deliberately
    /// ended agreement, `P-244`) do not.
    /// </summary>
    private static async Task<HashSet<Guid>> ListableAsync(
        ExpertHubDbContext db, IReadOnlyList<TrainerProfile> profiles, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var agreements = await TrainerProfileService.GoverningAgreementsAsync(
            db, [.. profiles.Select(p => p.ApplicationId)], ct);
        var lastCompleted = await TrainerProfileService.LastCompletedEngagementsAsync(
            db, [.. profiles.Select(p => p.TrainerId)], now, ct);
        return [.. profiles
            .Where(p => TrainerProfileService.FileStatus(
                    p,
                    agreements.GetValueOrDefault(p.ApplicationId),
                    now,
                    lastCompleted.TryGetValue(p.TrainerId, out var end) ? end : null)
                is TrainerFileStatuses.Active or TrainerFileStatuses.Idle)
            .Select(p => p.TrainerId)];
    }

    /// <summary>The trainer behind a public id, or null when the id is
    /// malformed, unknown, not consenting or not listable — one answer for all
    /// four, so the caller cannot tell them apart.</summary>
    private static async Task<TrainerProfile?> PublicProfileAsync(
        ExpertHubDbContext db, string id, CancellationToken ct)
    {
        if (!Guid.TryParse(id, out var trainerId))
        {
            return null;
        }
        var profile = await db.TrainerProfiles.FirstOrDefaultAsync(
            p => p.TrainerId == trainerId && p.VisibilityConsent, ct);
        return profile is not null && (await ListableAsync(db, [profile], ct)).Contains(profile.TrainerId)
            ? profile
            : null;
    }

    /// <summary>The `photo` attachment each application carries, by application.</summary>
    private static async Task<Dictionary<Guid, Attachment>> PhotoAttachmentsAsync(
        ExpertHubDbContext db, Guid[] applicationIds, CancellationToken ct) =>
        (await (
            from link in db.ApplicationAttachments
            join file in db.Attachments on link.AttachmentId equals file.AttachmentId
            where applicationIds.Contains(link.ApplicationId) && link.RuleCode == "photo"
            select new { link.ApplicationId, file }).ToListAsync(ct))
        .GroupBy(x => x.ApplicationId)
        .ToDictionary(g => g.Key, g => g.First().file);

    private static string PhotoUrl(Guid trainerId) =>
        $"/{ExpertHub.Core.ApiVersions.V1}/directory/{trainerId:D}/photo";

    private static async Task<List<PublicTrainerSummaryWire>> ConsentedAsync(
        ExpertHubDbContext db, CancellationToken ct)
    {
        var consenting = await (
            from profile in db.TrainerProfiles
            join user in db.Users on profile.UserId equals user.UserId
            where profile.VisibilityConsent
            orderby user.FullNameAr
            select new { profile, user.FullNameAr }).ToListAsync(ct);
        // Consent alone is not enough: a suspended, ended or expired file is
        // not public, whatever its consent says (J-23/J-24).
        var listable = await ListableAsync(db, [.. consenting.Select(c => c.profile)], ct);
        var rows = consenting
            .Where(c => listable.Contains(c.profile.TrainerId))
            .Select(c => new { c.profile.TrainerId, c.profile.ApplicationId, c.FullNameAr })
            .ToList();

        var trainerIds = rows.Select(r => r.TrainerId).ToArray();

        var recordCounts = await db.TrainerRecords
            .Where(r => trainerIds.Contains(r.TrainerId))
            .GroupBy(r => r.TrainerId)
            .Select(g => new { TrainerId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var services = await db.TrainerServices
            .Where(s => trainerIds.Contains(s.TrainerId))
            .ToListAsync(ct);

        var photos = await PhotoAttachmentsAsync(db, [.. rows.Select(r => r.ApplicationId)], ct);

        return [.. rows.Select(r => new PublicTrainerSummaryWire(
            r.TrainerId.ToString(),
            r.FullNameAr,
            TrainerProfileService.Specialties(),
            ProgramsDelivered: recordCounts
                .FirstOrDefault(c => c.TrainerId == r.TrainerId)?.Count ?? 0,
            Classification: TrainerProfileService.Classification(
                [.. services.Where(s => s.TrainerId == r.TrainerId)]),
            PhotoUrl: photos.ContainsKey(r.ApplicationId) ? PhotoUrl(r.TrainerId) : null))];
    }

    private static async Task<List<(TrainerSearchResultWire Wire, Guid TrainerId)>>
        LoadInternalAsync(ExpertHubDbContext db, CancellationToken ct)
    {
        var profiles = await (
            from profile in db.TrainerProfiles
            join user in db.Users on profile.UserId equals user.UserId
            orderby user.FullNameAr
            select new { profile, user.FullNameAr }).ToListAsync(ct);
        var services = await db.TrainerServices.ToListAsync(ct);
        var ratings = await db.TrainerRatings.Where(r => r.Scope == "overall").ToListAsync(ct);
        var attachments = await db.ApplicationAttachments.ToListAsync(ct);
        // `D-24` — the agreement decides whether a file is active, not a
        // column written once at accreditation and never touched again.
        var agreements = await TrainerProfileService.GoverningAgreementsAsync(
            db, [.. profiles.Select(p => p.profile.ApplicationId)], ct);
        var now = DateTime.UtcNow;
        var lastCompleted = await TrainerProfileService.LastCompletedEngagementsAsync(
            db, [.. profiles.Select(p => p.profile.TrainerId)], now, ct);

        var results = new List<(TrainerSearchResultWire, Guid)>(profiles.Count);
        foreach (var row in profiles)
        {
            var held = services.Where(s => s.TrainerId == row.profile.TrainerId).ToList();
            results.Add((
                new TrainerSearchResultWire(
                    row.profile.TrainerId.ToString(),
                    row.FullNameAr,
                    [.. held.Select(s => s.Service)],
                    TrainerProfileService.Specialties(),
                    TrainerProfileService.Classification(held),
                    TrainerProfileService.FileStatus(
                        row.profile,
                        agreements.GetValueOrDefault(row.profile.ApplicationId),
                        now,
                        lastCompleted.TryGetValue(row.profile.TrainerId, out var end) ? end : null),
                    ratings.FirstOrDefault(r => r.TrainerId == row.profile.TrainerId)?.CalculatedValue,
                    attachments.Count(a => a.ApplicationId == row.profile.ApplicationId
                        && a.RuleCode.Contains("certificate", StringComparison.Ordinal)),
                    // ⚠️ Unknown, and said so: no structured numeric source
                    // exists. The form's experience answers are RANGES
                    // (2026-09-14 onward, with gaps), which cannot be a number
                    // without inventing one. It was 0, which read as «none».
                    YearsExperience: null),
                row.profile.TrainerId));
        }
        return results;
    }

    private static async Task<TrainerProfileWire> BuildInternalProfileAsync(
        ExpertHubDbContext db, TrainerProfile profile, CancellationToken ct)
    {
        var user = await db.Users.SingleAsync(u => u.UserId == profile.UserId, ct);
        var services = await db.TrainerServices
            .Where(s => s.TrainerId == profile.TrainerId).ToListAsync(ct);
        var values = await TrainerProfileService.FieldValuesAsync(db, profile.TrainerId, ct);
        var records = await TrainerProfileService.RecordsAsync(db, profile.TrainerId, ct);
        var (_, overall, refreshedAt, programs) =
            await TrainerProfileService.RatingsAsync(db, profile.TrainerId, ct);
        var agreement = await db.Agreements.FirstOrDefaultAsync(
            a => a.TrainerUserId == profile.UserId
                && a.Status != AgreementStatuses.Declined, ct);
        var attachments = await db.ApplicationAttachments
            .Where(a => a.ApplicationId == profile.ApplicationId)
            .ToListAsync(ct);
        var certificates = attachments.Select(a => a.FileName).ToList();
        // The profile picture the trainer uploaded with their application —
        // already stored, and downloadable by staff through the attachment
        // route (`/v1/attachments/{id}`). No photo, no link: the card falls back
        // to initials.
        var photoUrl = attachments
            .FirstOrDefault(a => a.RuleCode == "photo" && a.AttachmentId is not null)
            ?.AttachmentId is { } photoId
            ? $"/{ExpertHub.Core.ApiVersions.V1}/attachments/{photoId:D}"
            : null;
        var now = DateTime.UtcNow;
        var lastCompleted = await TrainerProfileService.LastCompletedEngagementsAsync(
            db, [profile.TrainerId], now, ct);

        string Value(string code) =>
            values.TryGetValue(code, out var v) && v.ValueKind == System.Text.Json.JsonValueKind.String
                ? v.GetString() ?? string.Empty
                : string.Empty;

        // A select answer is stored as its option value (e.g. `master`); what a
        // person reads is the option's label in the trainer's own form version.
        var schemaVersion = await db.Applications
            .Where(a => a.ApplicationId == profile.ApplicationId)
            .Select(a => a.SchemaVersion)
            .SingleAsync(ct);
        var optionDefinitions = await db.FormFields
            .Where(f => f.SchemaVersion == schemaVersion
                && (f.FieldCode == "qualificationType" || f.FieldCode == "domain"
                    || f.FieldCode == "yearsOfExperience"))
            .ToDictionaryAsync(f => f.FieldCode, f => f.Definition, ct);
        string OptionLabel(string code)
        {
            var stored = Value(code);
            return stored.Length == 0 || !optionDefinitions.TryGetValue(code, out var definition)
                ? stored
                : SelectOptionLabelAr(definition, stored) ?? stored;
        }

        /*
         * `CARD-GAP-05` — the card has ONE slot for الشهادة/الجامعة/السنة but
         * Section 2 is a repeatable group. Owner's ruling (2026-09-21): the
         * HIGHEST degree, ties broken by the most recent date obtained. It is
         * the same qualification the Evaluation Matrix's criterion #1 scores
         * (best-of across entries), so the card and the score never disagree.
         * The full list stays on the detailed profile.
         */
        var qualificationEntries = await db.TrainerFieldValues
            .Where(v => v.TrainerId == profile.TrainerId && v.FieldCode == "qualificationType")
            .ToListAsync(ct);
        var datesByEntry = await db.TrainerFieldValues
            .Where(v => v.TrainerId == profile.TrainerId && v.FieldCode == "qualificationDate")
            .ToDictionaryAsync(v => v.EntryIndex, v => v.Value, ct);
        var highest = qualificationEntries
            .Select(v => StoredText(v.Value))
            .Zip(qualificationEntries, (code, row) => new
            {
                Code = code,
                Rank = QualificationRank(code),
                Obtained = datesByEntry.TryGetValue(row.EntryIndex, out var date)
                    ? StoredText(date)
                    : string.Empty,
            })
            .OrderByDescending(e => e.Rank)
            .ThenByDescending(e => e.Obtained, StringComparer.Ordinal)
            .FirstOrDefault();
        var qualification = highest is null
            ? OptionLabel("qualificationType")
            : optionDefinitions.TryGetValue("qualificationType", out var qualificationDefinition)
                ? SelectOptionLabelAr(qualificationDefinition, highest.Code) ?? highest.Code
                : highest.Code;
        var domain = OptionLabel("domain");
        string[] NonEmpty(params string[] entries) =>
            [.. entries.Where(e => !string.IsNullOrWhiteSpace(e))];
        return new TrainerProfileWire(
            profile.TrainerId.ToString(),
            user.FullNameAr,
            user.Email,
            // The DM-GAP-01 workbook carries no phone field (identity arrives
            // via INT-01), so nothing is fabricated for it.
            Phone: string.Empty,
            Value("inPersonCities"),
            AvatarUrl: photoUrl,
            [.. services.Select(s => s.Service)],
            TrainerProfileService.Specialties(),
            TrainerProfileService.Classification(services),
            YearsExperience: null,
            qualification,
            certificates,
            // `BR-0408` — internal-only, and this is the internal surface.
            // `D-24` — derived from the agreement already loaded above, so the
            // trainer's own file and the trainer base cannot disagree about
            // whether they are active.
            TrainerProfileService.FileStatus(
                profile, agreement, now,
                lastCompleted.TryGetValue(profile.TrainerId, out var lastEnd) ? lastEnd : null),
            [.. records.Select(r => new TrainerRecordEntryWire(
                r.RecordId.ToString(), r.ProgramNameAr, r.Role, r.DeliveredFrom.Year))],
            new TrainerEvaluationWire(
                overall,
                refreshedAt is { } at ? ApplicationEndpoints.Iso(at) : null,
                [.. programs.Select(p => new ProgramRatingWire(p.Program, p.Score))]),
            agreement is null
                ? null
                : new TrainerAgreementSummaryWire(
                    agreement.Reference,
                    ProfileEndpoints.AgreementStatusWire(agreement, DateTime.UtcNow),
                    agreement.StartsAt is { } starts ? ApplicationEndpoints.Iso(starts) : string.Empty,
                    agreement.EndsAt is { } ends ? ApplicationEndpoints.Iso(ends) : string.Empty),
            // J-15 «Identity Card Template Fields» — every row from the trainer
            // profile, with no added content.
            new IdentityCardWire(
                photoUrl,
                user.FullNameAr,
                // The structured «عدد سنوات الخبرة» range where the trainer's form
                // version asked it; otherwise the free text, as before. Never
                // turned into a number — the directory's years filter has no
                // reliable numeric source yet.
                Experience: OptionLabel("yearsOfExperience") is { Length: > 0 } years
                    ? years
                    : Value("responsibilities"),
                qualification,
                // Related fields ← the profile's field/domain answer.
                RelatedFields: NonEmpty(domain),
                // Professional certifications ← the certificate the profile names,
                // not the uploaded file names.
                Certifications: NonEmpty(Value("certificateName")),
                // Social media accounts ← the LinkedIn and personal-website links.
                SocialAccounts: NonEmpty(Value("linkedin"), Value("personalWebsite")),
                PdfUrl: null), // G26 — no generated document to link to.
            await TrainerBioEndpoints.PublishedAsync(db, profile.TrainerId, ct));
    }

    /// <summary>
    /// Degree order for `CARD-GAP-05`'s «highest qualification» rule — the same
    /// ordering the Evaluation Matrix pays for (دبلوم 0.035 &lt; بكالوريوس 0.04
    /// &lt; ماجستير 0.045 &lt; دكتوراه 0.05). An unrecognised code ranks lowest
    /// rather than winning by accident.
    /// </summary>
    /// <summary>A stored value is JSON — `"doctorate"`, quotes and all.</summary>
    private static string StoredText(string stored)
    {
        var value = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(stored);
        return value.ValueKind == System.Text.Json.JsonValueKind.String
            ? value.GetString() ?? string.Empty
            : string.Empty;
    }

    private static int QualificationRank(string code) => code switch
    {
        "doctorate" => 4,
        "master" => 3,
        "bachelor" => 2,
        "diploma" => 1,
        _ => 0,
    };

    /// <summary>The Arabic label of <paramref name="value"/> among a select
    /// field definition's options, or null when it is not one of them.</summary>
    private static string? SelectOptionLabelAr(string definition, string value)
    {
        using var parsed = System.Text.Json.JsonDocument.Parse(definition);
        if (!parsed.RootElement.TryGetProperty("options", out var options)
            || options.ValueKind != System.Text.Json.JsonValueKind.Array)
        {
            return null;
        }
        foreach (var option in options.EnumerateArray())
        {
            if (option.TryGetProperty("value", out var optionValue)
                && optionValue.GetString() == value
                && option.TryGetProperty("labelAr", out var label))
            {
                return label.GetString();
            }
        }
        return null;
    }
}
