using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Api.Documents;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using ExpertHub.Infrastructure.Persistence.Configurations;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Speakers;

internal sealed record SpeakerSummaryWire(
    string SpeakerId, string NameAr, string? NameEn, string? Title, string? PhotoUrl,
    string CreatedAt);

internal sealed record SpeakerListWire(
    IReadOnlyList<SpeakerSummaryWire> Items, int TotalCount, int Page, int PageSize, int PageCount);

/// <summary>
/// F3 — participation history. FAST exposes no speaker-to-event link yet, so
/// the section is served as unavailable with the reason, never as an empty
/// history that reads «this speaker has never spoken».
/// </summary>
internal sealed record SpeakerHistoryWire(
    bool Available, string? Reason, IReadOnlyList<SpeakerParticipationWire> Items);

internal sealed record SpeakerParticipationWire(string EventName, string Date, string? Role);

internal sealed record SpeakerDetailWire(
    string SpeakerId, string? Title,
    string FirstNameAr, string? MiddleNameAr, string? ThirdNameAr, string LastNameAr,
    string? FirstNameEn, string? MiddleNameEn, string? ThirdNameEn, string? LastNameEn,
    string? Bio, string? PhotoAttachmentId, string? PhotoUrl,
    // Owner ruling 2026-10-13: the email is read from the FAST profile. Null,
    // with the reason, until FAST serves another person's profile (B-13).
    string? Email, string? EmailUnavailableReason,
    SpeakerHistoryWire History, string CreatedAt, string UpdatedAt);

internal sealed record SpeakerInputWire(
    string? Title,
    string? FirstNameAr, string? MiddleNameAr, string? ThirdNameAr, string? LastNameAr,
    string? FirstNameEn, string? MiddleNameEn, string? ThirdNameEn, string? LastNameEn,
    string? Bio, string? PhotoAttachmentId,
    // RUN-040: create only — the user has seen the same-name warning and says
    // the record is a different person.
    bool? ConfirmDuplicate = null);

/*
 * EH-INT-11 — speaker records (J-04), behind `speakerService.ts`:
 *
 *   GET  v1/internal/speakers?search=&page=&pageSize=   F-0413
 *   GET  v1/internal/speakers/{id}                      F-0413
 *   POST v1/internal/speakers                           F-0105
 *   POST v1/internal/speakers/{id}                      F-0413
 *
 * Internal only, by construction: the group sits behind the internal policy
 * and no `/me` route exists, so no trainer-portal or external path can create
 * one (`BR-0113`, F1/AC-1). Nothing here creates a profile, an evaluation, an
 * agreement or an entitlement (`BR-0413`, F1/AC-3).
 *
 * The photo is uploaded first through `POST v1/internal/attachments` with the
 * purpose `speaker-photo`, then referenced by id, as the brochure and the
 * agreement file are.
 */
internal static class SpeakerEndpoints
{
    internal const string EntityType = "speaker_record";

    internal const string EmailPendingFast = "fast-profile-unavailable";

    internal const string HistoryPendingFast = "fast-speaker-history-unavailable";

    internal static RouteGroupBuilder MapSpeakerEndpoints(this RouteGroupBuilder v1)
    {
        var speakers = v1.MapGroup("/internal/speakers")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        // F2/AC-3 — search by name (either language) or title. The owner's
        // ruling keeps specialization out until the filters are defined.
        speakers.MapGet("/", async (
            string? search, int? page, int? pageSize, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var query = Matching(db, search);
            var total = await query.CountAsync(ct);
            var safePageSize = Math.Clamp(pageSize ?? 20, 1, 100);
            var pageCount = Math.Max(1, (int)Math.Ceiling(total / (double)safePageSize));
            var safePage = Math.Clamp(page ?? 1, 1, pageCount);
            var rows = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((safePage - 1) * safePageSize)
                .Take(safePageSize)
                .ToListAsync(ct);
            return Results.Ok(new SpeakerListWire(
                [.. rows.Select(Summary)], total, safePage, safePageSize, pageCount));
        })
            .WithName("SpeakerSearch")
            .RequireFeature("F-0413");

        speakers.MapGet("/{id}", async (string id, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var speaker = await FindAsync(db, id, ct);
            return speaker is null
                ? Results.Problem(statusCode: 404, detail: "Speaker not found.")
                : Results.Ok(Detail(speaker));
        })
            .WithName("SpeakerDetail")
            .RequireFeature("F-0413");

        // F1 — create, independent of any event (AC-2).
        speakers.MapPost("/", async (
            SpeakerInputWire input, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var (values, problem) = await ValidateAsync(input, db, ct);
            if (problem is not null)
            {
                return problem;
            }
            // RUN-040 — a warning, not a refusal: two people can share a name.
            if (input.ConfirmDuplicate != true && await db.SpeakerRecords.AnyAsync(
                    s => s.FirstNameAr == values!.FirstNameAr && s.LastNameAr == values.LastNameAr, ct))
            {
                return Results.Problem(statusCode: 409, detail: "duplicate-name");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;
            var speaker = new SpeakerRecord
            {
                SpeakerRecordId = Guid.NewGuid(),
                FirstNameAr = values!.FirstNameAr!,
                LastNameAr = values.LastNameAr!,
                CreatedBy = actor.UserId,
                CreatedAt = now,
                UpdatedAt = now,
            };
            Apply(speaker, values);
            db.SpeakerRecords.Add(speaker);
            db.AppendAudit(Audit(actor.UserId, "speaker-created", speaker.SpeakerRecordId, null, http, now));
            await db.SaveChangesAsync(ct);
            return Results.Created(
                $"/api/{ExpertHub.Core.ApiVersions.V1}/internal/speakers/{speaker.SpeakerRecordId:D}", Detail(speaker));
        })
            .WithName("CreateSpeaker")
            .RequireFeature("F-0105");

        // F1/AC-5 — every field stays editable from the dashboard (`BR-0412`).
        speakers.MapPost("/{id}", async (
            string id, SpeakerInputWire input, HttpContext http, ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var speaker = await FindAsync(db, id, ct, track: true);
            if (speaker is null)
            {
                return Results.Problem(statusCode: 404, detail: "Speaker not found.");
            }
            var (values, problem) = await ValidateAsync(input, db, ct);
            if (problem is not null)
            {
                return problem;
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var changed = ChangedFields(speaker, values!);
            Apply(speaker, values!);
            speaker.UpdatedBy = actor.UserId;
            speaker.UpdatedAt = DateTime.UtcNow;
            db.AppendAudit(Audit(
                actor.UserId, "speaker-updated", speaker.SpeakerRecordId, changed, http, speaker.UpdatedAt));
            await db.SaveChangesAsync(ct);
            return Results.Ok(Detail(speaker));
        })
            .WithName("UpdateSpeaker")
            .RequireFeature("F-0413");

        return v1;
    }

    /// <summary>F2/AC-3 — speakers whose name (either language) or title
    /// contains the term; all of them when there is none.</summary>
    internal static IQueryable<SpeakerRecord> Matching(ExpertHubDbContext db, string? search)
    {
        var query = db.SpeakerRecords.AsNoTracking();
        if (string.IsNullOrWhiteSpace(search))
        {
            return query;
        }
        // RUN-029 — every WORD must match some column: «متحدث اختبار» is a
        // first name and a last name, which no single column ever contained.
        foreach (var term in search.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
        {
            query = query.Where(s =>
                s.FirstNameAr.Contains(term) || s.LastNameAr.Contains(term)
                || (s.MiddleNameAr != null && s.MiddleNameAr.Contains(term))
                || (s.ThirdNameAr != null && s.ThirdNameAr.Contains(term))
                || (s.FirstNameEn != null && s.FirstNameEn.Contains(term))
                || (s.LastNameEn != null && s.LastNameEn.Contains(term))
                || (s.Title != null && s.Title.Contains(term)));
        }
        return query;
    }

    private static async Task<SpeakerRecord?> FindAsync(
        ExpertHubDbContext db, string id, CancellationToken ct, bool track = false)
    {
        if (!Guid.TryParse(id, out var speakerId))
        {
            return null;
        }
        var query = track ? db.SpeakerRecords : db.SpeakerRecords.AsNoTracking();
        return await query.FirstOrDefaultAsync(s => s.SpeakerRecordId == speakerId, ct);
    }

    /// <summary>Trimmed input, with blanks as null — what is stored.</summary>
    private sealed record SpeakerValues(
        string? Title,
        string? FirstNameAr, string? MiddleNameAr, string? ThirdNameAr, string? LastNameAr,
        string? FirstNameEn, string? MiddleNameEn, string? ThirdNameEn, string? LastNameEn,
        string? Bio, Guid? PhotoAttachmentId);

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>
    /// ⚠️ Needs Confirmation: the matrix marks no field mandatory. The Arabic
    /// first and last name are required because a record nobody can name
    /// cannot be found or listed; everything else is optional.
    /// </summary>
    private static async Task<(SpeakerValues? Values, IResult? Problem)> ValidateAsync(
        SpeakerInputWire input, ExpertHubDbContext db, CancellationToken ct)
    {
        var values = new SpeakerValues(
            Clean(input.Title),
            Clean(input.FirstNameAr), Clean(input.MiddleNameAr), Clean(input.ThirdNameAr), Clean(input.LastNameAr),
            Clean(input.FirstNameEn), Clean(input.MiddleNameEn), Clean(input.ThirdNameEn), Clean(input.LastNameEn),
            Clean(input.Bio), null);

        if (values.FirstNameAr is null)
        {
            return (null, Invalid("firstNameAr", "required"));
        }
        if (values.LastNameAr is null)
        {
            return (null, Invalid("lastNameAr", "required"));
        }
        var names = new (string Field, string? Value)[]
        {
            ("firstNameAr", values.FirstNameAr), ("middleNameAr", values.MiddleNameAr),
            ("thirdNameAr", values.ThirdNameAr), ("lastNameAr", values.LastNameAr),
            ("firstNameEn", values.FirstNameEn), ("middleNameEn", values.MiddleNameEn),
            ("thirdNameEn", values.ThirdNameEn), ("lastNameEn", values.LastNameEn),
        };
        foreach (var (field, value) in names)
        {
            if (value is { Length: > SpeakerRecordConfiguration.NameMaxLength })
            {
                return (null, Invalid(field, "too-long"));
            }
        }
        if (values.Title is { Length: > SpeakerRecordConfiguration.TitleMaxLength })
        {
            return (null, Invalid("title", "too-long"));
        }
        if (values.Bio is { Length: > SpeakerRecordConfiguration.BioMaxLength })
        {
            return (null, Invalid("bio", "too-long"));
        }

        if (string.IsNullOrWhiteSpace(input.PhotoAttachmentId))
        {
            return (values, null);
        }
        // The photo must be an uploaded image — an id that resolves to nothing,
        // or to a document, is refused rather than stored as a broken photo.
        var photo = await AttachmentUploads.FindAsync(db, input.PhotoAttachmentId, ct);
        if (photo is null || !photo.MimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return (null, Invalid("photoAttachmentId", "invalid"));
        }
        return (values with { PhotoAttachmentId = photo.AttachmentId }, null);
    }

    private static IResult Invalid(string field, string reason) =>
        Results.Problem(
            statusCode: 400,
            detail: $"{field}-{reason}",
            extensions: new Dictionary<string, object?> { ["field"] = field, ["reason"] = reason });

    private static void Apply(SpeakerRecord speaker, SpeakerValues values)
    {
        speaker.Title = values.Title;
        speaker.FirstNameAr = values.FirstNameAr!;
        speaker.MiddleNameAr = values.MiddleNameAr;
        speaker.ThirdNameAr = values.ThirdNameAr;
        speaker.LastNameAr = values.LastNameAr!;
        speaker.FirstNameEn = values.FirstNameEn;
        speaker.MiddleNameEn = values.MiddleNameEn;
        speaker.ThirdNameEn = values.ThirdNameEn;
        speaker.LastNameEn = values.LastNameEn;
        speaker.Bio = values.Bio;
        speaker.PhotoAttachmentId = values.PhotoAttachmentId;
    }

    /// <summary>Which fields an edit changed — the audit names them, never
    /// their values, so the trail carries no personal data.</summary>
    private static string[] ChangedFields(SpeakerRecord before, SpeakerValues after) =>
    [
        .. new (string Field, bool Changed)[]
        {
            ("title", before.Title != after.Title),
            ("firstNameAr", before.FirstNameAr != after.FirstNameAr),
            ("middleNameAr", before.MiddleNameAr != after.MiddleNameAr),
            ("thirdNameAr", before.ThirdNameAr != after.ThirdNameAr),
            ("lastNameAr", before.LastNameAr != after.LastNameAr),
            ("firstNameEn", before.FirstNameEn != after.FirstNameEn),
            ("middleNameEn", before.MiddleNameEn != after.MiddleNameEn),
            ("thirdNameEn", before.ThirdNameEn != after.ThirdNameEn),
            ("lastNameEn", before.LastNameEn != after.LastNameEn),
            ("bio", before.Bio != after.Bio),
            ("photo", before.PhotoAttachmentId != after.PhotoAttachmentId),
        }.Where(f => f.Changed).Select(f => f.Field),
    ];

    private static AuditLogEntry Audit(
        Guid userId, string action, Guid speakerId, string[]? changed, HttpContext http, DateTime at) =>
        new()
        {
            AuditId = Guid.NewGuid(),
            UserId = userId,
            Action = action,
            EntityType = EntityType,
            EntityId = speakerId,
            AfterState = changed is null ? null : JsonSerializer.Serialize(new { changed }),
            IpAddress = http.Connection.RemoteIpAddress?.ToString(),
            OccurredAt = at,
        };

    internal static string NameAr(SpeakerRecord s) =>
        string.Join(' ', new[] { s.FirstNameAr, s.MiddleNameAr, s.ThirdNameAr, s.LastNameAr }
            .Where(p => !string.IsNullOrWhiteSpace(p)));

    internal static string? NameEn(SpeakerRecord s)
    {
        var name = string.Join(' ', new[] { s.FirstNameEn, s.MiddleNameEn, s.ThirdNameEn, s.LastNameEn }
            .Where(p => !string.IsNullOrWhiteSpace(p)));
        return name.Length == 0 ? null : name;
    }

    private static string? PhotoUrl(SpeakerRecord s) =>
        s.PhotoAttachmentId is { } photo ? AttachmentUploads.DownloadUrl(photo) : null;

    internal static SpeakerSummaryWire Summary(SpeakerRecord s) => new(
        s.SpeakerRecordId.ToString(), NameAr(s), NameEn(s), s.Title, PhotoUrl(s),
        ApplicationEndpoints.Iso(s.CreatedAt));

    private static SpeakerDetailWire Detail(SpeakerRecord s) => new(
        s.SpeakerRecordId.ToString(), s.Title,
        s.FirstNameAr, s.MiddleNameAr, s.ThirdNameAr, s.LastNameAr,
        s.FirstNameEn, s.MiddleNameEn, s.ThirdNameEn, s.LastNameEn,
        s.Bio, s.PhotoAttachmentId?.ToString(), PhotoUrl(s),
        Email: null, EmailUnavailableReason: EmailPendingFast,
        History: new SpeakerHistoryWire(false, HistoryPendingFast, []),
        ApplicationEndpoints.Iso(s.CreatedAt), ApplicationEndpoints.Iso(s.UpdatedAt));
}
