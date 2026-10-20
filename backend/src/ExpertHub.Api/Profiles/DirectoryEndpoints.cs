using System.Text.Json;
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

/// <summary>
/// The trainer base search. <c>Speakers</c> is J-04/F2/AC-1: speaker records
/// in the same results, tagged «متحدث». They are a separate list rather than
/// trainer rows, because a speaker has no file status, rating, certifications
/// or experience, and a trainer row would have to invent all four.
/// </summary>
internal sealed record TrainerSearchListWire(
    IReadOnlyList<TrainerSearchResultWire> Items, int TotalCount,
    IReadOnlyList<DomainOptionWire> AvailableDomains,
    IReadOnlyList<ExpertHub.Api.Speakers.SpeakerSummaryWire> Speakers);

internal sealed record TrainerRecordEntryWire(string Id, string Name, string Role, int Year);

internal sealed record TrainerEvaluationWire(
    decimal? Overall, string? LastSyncedAt,
    IReadOnlyList<ProgramRatingWire> PerProgram);

internal sealed record TrainerAgreementSummaryWire(
    string Reference, string Status, string StartsAt, string EndsAt);

/// <summary>One of the card's «أبرز الخبرات الأخيرة» — dates as stored (ISO).</summary>
internal sealed record IdentityCardRoleWire(
    string JobTitle, string Organization, string? StartedAt, string? EndedAt, bool Current);

/// <summary>
/// Notion «Identity Card Template Fields» (2026-09-29): the front cover (photo,
/// name, certificates, LinkedIn) and the inner panel — «نبذة عامة» (sector,
/// participation types), «الخبرات» (years, recent roles), «المؤهلات الأكاديمية»
/// (degree / university / year) and «المجالات ذات العلاقة».
/// </summary>
internal sealed record IdentityCardWire(
    string? PhotoUrl, string Name, string Experience, string AcademicQualifications,
    IReadOnlyList<string>? RelatedFields, IReadOnlyList<string> Certifications,
    IReadOnlyList<string>? SocialAccounts, string? PdfUrl,
    string? Sector = null,
    IReadOnlyList<string>? ParticipationTypes = null,
    IReadOnlyList<IdentityCardRoleWire>? RecentRoles = null,
    string? University = null,
    string? QualificationYear = null);

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
    string? Bio,
    /*
     * RUN-017 — the approved application in full: every section and field
     * the trainer was accredited on (identity, qualifications, certificates,
     * experience, training, availability), select answers by their label,
     * and every entry of a repeatable section. The same wire the screening
     * screen reads, so both views of one application stay one shape.
     */
    IReadOnlyList<Screening.ScreeningSectionWire> ApplicationSections,
    IReadOnlyList<Screening.ScreeningAttachmentWire> Attachments,
    /*
     * The bank data, keyed as the trainer saved it — ONLY for a viewer who
     * holds F-0301 (إعداد الاتفاقية وتفعيلها), the feature that already shows
     * staff these fields in the agreement's merged data. Null for anyone
     * else, and null while the trainer has not completed it.
     */
    IReadOnlyDictionary<string, string>? BankData,
    // RUN-025 — true while the status above was set by hand (F-0411).
    bool FileStatusManual = false,
    // RUN-025 — whether this viewer holds F-0411 and so sees the control.
    bool CanSetFileStatus = false);

/// <summary>RUN-025 — a file status from `TrainerFileStatuses`, or
/// `automatic` to return the file to its agreement; the reason is mandatory.</summary>
internal sealed record FileStatusInputWire(string? Status, string? Reason);

/// <summary>The public directory and the internal trainer base.</summary>
public static class DirectoryEndpoints
{
    private const string ProfessionalCertificateRule = "professional-certificate";

    /// <summary>RUN-025 — the input value that clears a manual file status.</summary>
    private const string AutomaticFileStatus = "automatic";

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
            // RUN-031 — `specialty` is a domain code (`dom-NNN`) from the
            // owner's list the applicant chose from (`TrainerProfileService.Specialties`).
            var consented = await ConsentedAsync(db, ct);
            var filtered = consented
                .Where(t => TrainerProfileService.NameMatches(t.Name, search)
                    && (string.IsNullOrWhiteSpace(specialty) || t.Specialties.Contains(specialty)))
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
                TrainerProfileService.Specialties(
                    (await TrainerProfileService.DomainsAsync(db, [profile.TrainerId], ct))
                        .GetValueOrDefault(profile.TrainerId)),
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
            /*
             * ⚠️ The type is read from the BYTES, never from what was stored
             * with them. The stored MIME is whatever the uploading browser
             * claimed (an SVG with a script in it served as `image/svg+xml`
             * from this origin is stored XSS), and the file store has no MIME
             * at all — it answers `application/octet-stream`, which made every
             * photo a 404 there. Only the three raster formats are served.
             */
            var type = content is null ? null : RasterImageType(content.Bytes);
            if (type is null)
            {
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            // Short and public: a withdrawn consent must stop the photo soon,
            // and nothing about it differs per viewer.
            http.Response.Headers.CacheControl = "public, max-age=300";
            http.Response.Headers.XContentTypeOptions = "nosniff";
            return Results.File(content!.Bytes, type);
        }).WithName("PublicTrainerPhoto");

        /* ── the internal trainer base — J-15 ──────────────────────────────── */

        var trainers = v1.MapGroup("/internal/trainers")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        // F-0410 البحث والفلترة — the trainer base search.
        trainers.MapGet("/", async (
            string? search, string? service, string? specialty, string? domain,
            string? fileStatus, int? minCertifications, int? minYearsExperience,
            decimal? minEvaluation,
            HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            // ⚠️ The minimum-years filter has no numeric source (see
            // `YearsExperience`), so it answered «nobody» for every value. It
            // is refused rather than silently ignored — a filter that appears
            // applied but is not would mislead just as badly.
            if (minYearsExperience is not null)
            {
                return Results.Problem(statusCode: 400, detail: "min-years-experience-unavailable");
            }
            // The same rule for two more filters with nothing behind them: no
            // separate specialty taxonomy (`Q16` — the field filter is `domain`,
            // below), and no calculated rating (`DM-GAP-14` — nothing writes
            // one). Refused rather than offered.
            if (!string.IsNullOrWhiteSpace(specialty))
            {
                return Results.Problem(statusCode: 400, detail: "specialty-filter-unavailable");
            }
            if (minEvaluation is not null)
            {
                return Results.Problem(statusCode: 400, detail: "min-evaluation-unavailable");
            }
            var rows = await LoadInternalAsync(db, ct);
            var filtered = rows.Where(r =>
                    TrainerProfileService.NameMatches(r.Wire.Name, search)
                    // RUN-029 — the declared «المجال», by its code in the owner's list.
                    && (string.IsNullOrWhiteSpace(domain) || r.Wire.Specialties.Contains(domain))
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
                AvailableDomains: [],
                Speakers: await SpeakerRowsAsync(
                    http, db, search, service, fileStatus, minCertifications, domain, ct)));
        })
            .WithName("TrainerSearch")
            .RequireFeature("F-0410");

        // F-0402 الملف الشامل — the unified internal profile. The requesting
        // party (F-0504) reads it too, for the people nominated to a request
        // they can see (UAT `BUG-041`, J-17/F3/AC-2) — and only those.
        trainers.MapGet("/{trainerId}", async (
            string trainerId, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            if (!Guid.TryParse(trainerId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (!await FeatureAuthorization.HasFeatureAsync(db, actor.UserId, "F-0402", ct)
                && !await Assignments.AssignmentEndpoints.IsNominatedToVisibleRequestAsync(http, db, id, ct))
            {
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            var profile = await db.TrainerProfiles.FirstOrDefaultAsync(p => p.TrainerId == id, ct);
            if (profile is null)
            {
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            var showBank = await FeatureAuthorization.HasFeatureAsync(db, actor.UserId, "F-0301", ct);
            return Results.Ok(await BuildInternalProfileAsync(db, profile, showBank, ct) with
            {
                CanSetFileStatus = await FeatureAuthorization.HasFeatureAsync(db, actor.UserId, "F-0411", ct),
            });
        })
            .WithName("TrainerProfileDetail")
            .RequireAnyFeature("F-0402", "F-0504");

        /*
         * RUN-025 — F-0411 ضبط حالة ملف المدرب. Owner ruling 2026-10-20 extends
         * `P-244`: staff may set the file status by hand, with a reason. The
         * value is stored as an OVERRIDE that the one derivation
         * (`TrainerProfileService.FileStatus`) lets win, so matching, the
         * trainer base and the public directory all follow it, and an
         * agreement change cannot silently undo it. `automatic` clears it and
         * hands the file back to its agreement.
         */
        trainers.MapPost("/{trainerId}/file-status", async (
            string trainerId, FileStatusInputWire input,
            HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            if (!Guid.TryParse(trainerId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            string? target = input.Status == AutomaticFileStatus ? null : input.Status;
            if (target is not null && !TrainerFileStatuses.All.Contains(target))
            {
                return Results.Problem(statusCode: 400, detail: "Unknown file status.");
            }
            var reason = input.Reason?.Trim();
            if (string.IsNullOrEmpty(reason))
            {
                return Results.Problem(statusCode: 400, detail: "reason-required");
            }
            var before = await db.TrainerProfiles.AsNoTracking()
                .Where(p => p.TrainerId == id)
                .Select(p => new { p.FileStatusOverride })
                .FirstOrDefaultAsync(ct);
            if (before is null)
            {
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            if (before.FileStatusOverride == target)
            {
                return Results.Problem(statusCode: 409, detail: "Already in that status.");
            }

            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            // Claims the row against the override this request read: a
            // concurrent change in between makes this one a 409, not a
            // silent second write.
            var claimed = await db.TrainerProfiles
                .Where(p => p.TrainerId == id && p.FileStatusOverride == before.FileStatusOverride)
                .ExecuteUpdateAsync(set => set.SetProperty(p => p.FileStatusOverride, target), ct);
            if (claimed == 0)
            {
                return Results.Problem(statusCode: 409, detail: "Already changed.");
            }
            db.AppendAudit(new AuditLogEntry
            {
                AuditId = Guid.NewGuid(),
                UserId = actor.UserId,
                Action = "file-status-set",
                EntityType = "TRAINER_PROFILE",
                EntityId = id,
                BeforeState = JsonSerializer.Serialize(new { fileStatusOverride = before.FileStatusOverride }),
                AfterState = JsonSerializer.Serialize(new { fileStatusOverride = target, reason }),
                IpAddress = http.Connection.RemoteIpAddress?.ToString(),
                OccurredAt = now,
            });
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            var profile = await db.TrainerProfiles.AsNoTracking().SingleAsync(p => p.TrainerId == id, ct);
            var showBank = await FeatureAuthorization.HasFeatureAsync(db, actor.UserId, "F-0301", ct);
            return Results.Ok(await BuildInternalProfileAsync(db, profile, showBank, ct) with { CanSetFileStatus = true });
        })
            .WithName("SetTrainerFileStatus")
            .RequireFeature("F-0411");

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
    internal static async Task<HashSet<Guid>> ListableAsync(
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

    /// <summary>`image/png`, `image/jpeg` or `image/webp` by magic number, or
    /// null for anything else (SVG, PDF, HTML, an unknown or empty file).</summary>
    internal static string? RasterImageType(byte[] bytes)
    {
        ReadOnlySpan<byte> b = bytes;
        if (b.StartsWith((ReadOnlySpan<byte>)[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))
        {
            return "image/png";
        }
        if (b.StartsWith((ReadOnlySpan<byte>)[0xFF, 0xD8, 0xFF]))
        {
            return "image/jpeg";
        }
        return b.Length >= 12 && b[..4].SequenceEqual("RIFF"u8) && b[8..12].SequenceEqual("WEBP"u8)
            ? "image/webp"
            : null;
    }

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
        var domains = await TrainerProfileService.DomainsAsync(db, trainerIds, ct);

        return [.. rows.Select(r => new PublicTrainerSummaryWire(
            r.TrainerId.ToString(),
            r.FullNameAr,
            TrainerProfileService.Specialties(domains.GetValueOrDefault(r.TrainerId)),
            ProgramsDelivered: recordCounts
                .FirstOrDefault(c => c.TrainerId == r.TrainerId)?.Count ?? 0,
            Classification: TrainerProfileService.Classification(
                [.. services.Where(s => s.TrainerId == r.TrainerId)]),
            PhotoUrl: photos.ContainsKey(r.ApplicationId) ? PhotoUrl(r.TrainerId) : null))];
    }

    /// <summary>
    /// J-04/F2/AC-1 — the speakers that belong in this search. None when the
    /// caller may not read speaker records (F-0413), or when a filter only a
    /// trainer can meet is set: a speaker has no file status or certification
    /// count, and a service filter other than «متحدث» excludes them by name.
    /// </summary>
    private static async Task<IReadOnlyList<ExpertHub.Api.Speakers.SpeakerSummaryWire>> SpeakerRowsAsync(
        HttpContext http, ExpertHubDbContext db, string? search, string? service,
        string? fileStatus, int? minCertifications, string? domain, CancellationToken ct)
    {
        var trainerOnlyFilter = (!string.IsNullOrWhiteSpace(service) && service != ApplicationServices.Speaker)
            || !string.IsNullOrWhiteSpace(fileStatus)
            || minCertifications is not null
            || !string.IsNullOrWhiteSpace(domain);
        if (trainerOnlyFilter)
        {
            return [];
        }
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        if (!await FeatureAuthorization.HasFeatureAsync(db, actor.UserId, "F-0413", ct))
        {
            return [];
        }
        var speakers = await ExpertHub.Api.Speakers.SpeakerEndpoints.Matching(db, search)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);
        return [.. speakers.Select(ExpertHub.Api.Speakers.SpeakerEndpoints.Summary)];
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
        var domains = await TrainerProfileService.DomainsAsync(
            db, [.. profiles.Select(p => p.profile.TrainerId)], ct);

        var results = new List<(TrainerSearchResultWire, Guid)>(profiles.Count);
        foreach (var row in profiles)
        {
            var held = services.Where(s => s.TrainerId == row.profile.TrainerId).ToList();
            results.Add((
                new TrainerSearchResultWire(
                    row.profile.TrainerId.ToString(),
                    row.FullNameAr,
                    [.. held.Select(s => s.Service)],
                    TrainerProfileService.Specialties(domains.GetValueOrDefault(row.profile.TrainerId)),
                    TrainerProfileService.Classification(held),
                    TrainerProfileService.FileStatus(
                        row.profile,
                        agreements.GetValueOrDefault(row.profile.ApplicationId),
                        now,
                        lastCompleted.TryGetValue(row.profile.TrainerId, out var end) ? end : null),
                    ratings.FirstOrDefault(r => r.TrainerId == row.profile.TrainerId)?.CalculatedValue,
                    // RUN-029 — PROFESSIONAL certificates only. `Contains("certificate")`
                    // also counted the academic degree's `qualification-certificate`,
                    // so «at least 1» returned trainers with no certificate at all.
                    attachments.Count(a => a.ApplicationId == row.profile.ApplicationId
                        && a.RuleCode == ProfessionalCertificateRule),
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
        ExpertHubDbContext db, TrainerProfile profile, bool showBank, CancellationToken ct)
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
        // Certificates are the PROFESSIONAL certificate files — not the CV,
        // the photo and the degree, which are listed with the attachments.
        var certificates = attachments
            .Where(a => a.RuleCode == ProfessionalCertificateRule)
            .Select(a => a.FileName)
            .ToList();
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
        string[] labelledFields =
        [
            "qualificationType", "domain", "yearsOfExperience", "sector",
            "participationTypes", "certificateName", "universityName",
        ];
        var optionDefinitions = await db.FormFields
            .Where(f => f.SchemaVersion == schemaVersion && labelledFields.Contains(f.FieldCode))
            .ToDictionaryAsync(f => f.FieldCode, f => f.Definition, ct);
        string Label(string code, string stored) =>
            stored.Length == 0 || !optionDefinitions.TryGetValue(code, out var definition)
                ? stored
                : SelectOptionLabelAr(definition, stored) ?? stored;
        string OptionLabel(string code) => Label(code, Value(code));

        // Every entry of a repeatable section, not just the first.
        var fieldRows = await db.TrainerFieldValues
            .Where(v => v.TrainerId == profile.TrainerId)
            .ToListAsync(ct);
        string EntryValue(string code, int entry) =>
            fieldRows.FirstOrDefault(r => r.FieldCode == code && r.EntryIndex == entry) is { } row
                ? StoredText(row.Value)
                : string.Empty;
        List<int> EntriesOf(string code) =>
            [.. fieldRows.Where(r => r.FieldCode == code).Select(r => r.EntryIndex).Order()];

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
            : Label("qualificationType", highest.Code);
        // «الشهادة / الجامعة / السنة» — all three from the SAME entry.
        var highestEntry = highest is null
            ? (int?)null
            : qualificationEntries.First(r => StoredText(r.Value) == highest.Code).EntryIndex;
        var university = highestEntry is { } entryOfHighest
            ? Label("universityName", EntryValue("universityName", entryOfHighest))
            : string.Empty;
        var qualificationYear = highest is { Obtained.Length: >= 4 } ? highest.Obtained[..4] : string.Empty;

        // «المجال» — what the trainer typed when they chose «أخرى» (`P-342`).
        var domain = Value("domain") == "other" ? Value("domainOther") : OptionLabel("domain");
        string[] NonEmpty(params string[] entries) =>
            [.. entries.Where(e => !string.IsNullOrWhiteSpace(e))];

        List<string> participation =
            values.TryGetValue("participationTypes", out var types)
                && types.ValueKind == System.Text.Json.JsonValueKind.Array
                ? [.. types.EnumerateArray()
                    .Where(t => t.ValueKind == System.Text.Json.JsonValueKind.String)
                    .Select(t => t.GetString()!)]
                : [];

        // `CARD-GAP-04`, `P-299` — the two most recent roles, latest start first.
        var recentRoles = EntriesOf("jobTitle")
            .Select(entry => new IdentityCardRoleWire(
                EntryValue("jobTitle", entry),
                EntryValue("organization", entry),
                NullIfEmpty(EntryValue("experienceStartDate", entry)),
                NullIfEmpty(EntryValue("experienceEndDate", entry)),
                fieldRows.Any(r => r.FieldCode == "currentlyEmployed" && r.EntryIndex == entry
                    && r.Value == "true")))
            .Where(role => role.JobTitle.Length > 0)
            .OrderByDescending(role => role.StartedAt ?? string.Empty, StringComparer.Ordinal)
            .Take(2)
            .ToList();
        return new TrainerProfileWire(
            profile.TrainerId.ToString(),
            user.FullNameAr,
            user.Email,
            // The form carries no phone field; the one identity (INT-01) gave
            // the account is the only source, and empty when it gave none.
            Phone: user.Phone ?? string.Empty,
            Value("inPersonCities"),
            AvatarUrl: photoUrl,
            [.. services.Select(s => s.Service)],
            TrainerProfileService.Specialties(Value("domain")),
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
                // «المجالات ذات العلاقة» — the services held, the forum
                // participations, and «المجال» (or what was typed for «أخرى»).
                RelatedFields: NonEmpty([
                    .. services.Select(s => ApplicationServices.NameAr(s.Service)),
                    .. participation.Where(t => t == "conferences")
                        .Select(t => Label("participationTypes", t)),
                    domain]),
                // One row per certificate entry, by name (not the file name).
                Certifications: NonEmpty([
                    .. EntriesOf("certificateName")
                        .Select(entry => Label("certificateName", EntryValue("certificateName", entry)))]),
                // The front cover carries LinkedIn only.
                SocialAccounts: NonEmpty(Value("linkedin")),
                PdfUrl: null, // G26 — no generated document to link to.
                Sector: NullIfEmpty(OptionLabel("sector")),
                ParticipationTypes: [.. participation.Select(t => Label("participationTypes", t))],
                RecentRoles: recentRoles,
                University: NullIfEmpty(university),
                QualificationYear: NullIfEmpty(qualificationYear)),
            await TrainerBioEndpoints.PublishedAsync(db, profile.TrainerId, ct),
            await ApplicationSectionsAsync(db, profile.ApplicationId, schemaVersion, ct),
            await ApplicationAttachmentsAsync(db, attachments, schemaVersion, ct),
            showBank ? await BankFieldsAsync(db, profile.UserId, ct) : null,
            FileStatusManual: profile.FileStatusOverride is not null);
    }

    /// <summary>
    /// RUN-017 — the approved application, section by section, in the form's
    /// own order and labels. A select answer reads as its option's label (the
    /// trainer's form version), never as the stored code.
    /// </summary>
    private static async Task<IReadOnlyList<Screening.ScreeningSectionWire>> ApplicationSectionsAsync(
        ExpertHubDbContext db, Guid applicationId, string schemaVersion, CancellationToken ct)
    {
        var sections = await db.FormSections
            .Where(s => s.SchemaVersion == schemaVersion)
            .OrderBy(s => s.OrderIndex)
            .ToListAsync(ct);
        var fields = await db.FormFields
            .Where(f => f.SchemaVersion == schemaVersion)
            .OrderBy(f => f.OrderIndex)
            .ToListAsync(ct);
        var rows = await db.ApplicationFieldValues
            .Where(v => v.ApplicationId == applicationId)
            .ToListAsync(ct);

        Screening.ScreeningFieldWire Field(FormField field, string stored) => new(
            field.FieldCode,
            new ServiceRequests.LocalizedTextWire(field.LabelAr, field.LabelEn),
            DisplayLabelled(field.Definition, JsonSerializer.Deserialize<JsonElement>(stored)),
            null);

        List<Screening.ScreeningEntryWire> EntriesOf(IReadOnlyList<FormField> sectionFields) =>
        [
            .. rows
                .Where(v => sectionFields.Any(f => f.FieldCode == v.FieldCode))
                .GroupBy(v => v.EntryIndex)
                .OrderBy(g => g.Key)
                .Select(g => new Screening.ScreeningEntryWire(
                    g.Key,
                    g.Select(v => v.EntryId).FirstOrDefault(id => id is { Length: > 0 }),
                    [.. sectionFields
                        .Where(f => g.Any(v => v.FieldCode == f.FieldCode))
                        .Select(f => Field(f, g.First(v => v.FieldCode == f.FieldCode).Value))])),
        ];

        return [.. sections
            .Select(section =>
            {
                var sectionFields = fields.Where(f => f.SectionCode == section.SectionCode).ToList();
                var entries = EntriesOf(sectionFields);
                return new Screening.ScreeningSectionWire(
                    section.SectionCode,
                    new ServiceRequests.LocalizedTextWire(section.TitleAr, section.TitleEn),
                    entries.Count == 0 ? [] : entries[0].Fields,
                    section.Repeatable is { Length: > 0 } && entries.Count > 0 ? entries : null);
            })
            .Where(section => section.Fields.Count > 0)];
    }

    /// <summary>A stored answer as text, select codes replaced by their labels.</summary>
    private static string DisplayLabelled(string definition, JsonElement value) => value.ValueKind switch
    {
        JsonValueKind.String => SelectOptionLabelAr(definition, value.GetString() ?? string.Empty)
            ?? value.GetString() ?? string.Empty,
        JsonValueKind.Array => string.Join("، ", value.EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => SelectOptionLabelAr(definition, item.GetString()!) ?? item.GetString()!)),
        _ => Screening.ScreeningEndpoints.DisplayValue(value),
    };

    /// <summary>Every file on the approved application, with its rule's label
    /// and the staff download route.</summary>
    private static async Task<IReadOnlyList<Screening.ScreeningAttachmentWire>> ApplicationAttachmentsAsync(
        ExpertHubDbContext db, IReadOnlyList<ApplicationAttachment> attachments, string schemaVersion,
        CancellationToken ct)
    {
        var rules = await db.AttachmentRules
            .Where(r => r.SchemaVersion == schemaVersion)
            .ToListAsync(ct);
        return [.. attachments.Select(a =>
        {
            var rule = rules.FirstOrDefault(r => r.RuleCode == a.RuleCode);
            return new Screening.ScreeningAttachmentWire(
                a.ApplicationAttachmentId.ToString(),
                a.FileName,
                new ServiceRequests.LocalizedTextWire(rule?.LabelAr ?? a.RuleCode, rule?.LabelEn ?? a.RuleCode),
                Path.GetExtension(a.FileName).TrimStart('.'),
                Math.Max(1, a.SizeBytes / 1024),
                a.AttachmentId is { } id ? $"/{ExpertHub.Core.ApiVersions.V1}/attachments/{id:D}" : null);
        })];
    }

    /// <summary>The completed bank data as the trainer saved it, or null.</summary>
    private static async Task<IReadOnlyDictionary<string, string>?> BankFieldsAsync(
        ExpertHubDbContext db, Guid userId, CancellationToken ct)
    {
        var bank = await db.BankData.FirstOrDefaultAsync(b => b.UserId == userId, ct);
        return bank is { CompletedAt: not null, Fields: { } fields }
            ? JsonSerializer.Deserialize<Dictionary<string, string>>(fields)
            : null;
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

    private static string? NullIfEmpty(string value) => value.Length == 0 ? null : value;

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
    internal static string? SelectOptionLabelAr(string definition, string value)

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
