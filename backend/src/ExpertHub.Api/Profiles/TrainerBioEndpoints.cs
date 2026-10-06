using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Persistence;
using ExpertHub.Infrastructure.Persistence.Configurations;
using ExpertHub.Infrastructure.Profiles;
using ExpertHub.Infrastructure.Screening;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Profiles;

/*
 * P-331 / UI-15 — the trainer's short bio:
 *
 *   POST v1/me/profile/bio/draft-from-cv                   the trainer, own record
 *   POST v1/me/profile/bio                                 the trainer, own record
 *   GET  v1/internal/trainer-bios                          F-0401
 *   POST v1/internal/trainers/{trainerId}/bio/decision     F-0401
 *
 * The flow, in the owner's words: the AI drafts it from the CV, the trainer
 * edits and confirms it, a trainer-management employee approves it, and only
 * the approved text is ever shown to anyone else, publicly only with consent.
 *
 * ⚠️ F-0401 («إنشاء ملف المدرب») gates the review because the BRD's 58 features
 * have none for a bio and inventing a 59th is not ours to do. It is held by the
 * employee and the manager, which is the ruling; the access screen can move it.
 */

/// <summary>What the trainer's own profile shows about their bio.</summary>
internal sealed record TrainerBioWire(
    string Status,
    string? Draft,
    string? DraftSource,
    string? Published,
    string? ReviewNote,
    int Revision,
    // Whether there is a CV to draft from at all.
    bool HasCv);

internal sealed record DraftBioInputWire(int Revision);

internal sealed record SubmitBioInputWire(string? Text, int Revision);

internal sealed record BioDecisionInputWire(string? Decision, string? Note, int Revision);

internal sealed record PendingBioWire(
    string TrainerId, string TrainerName, string Draft, string? DraftSource,
    string? Published, string? SubmittedAt, int Revision);

/// <summary>The short bio's endpoints.</summary>
public static class TrainerBioEndpoints
{
    /// <summary>The revision of a trainer with no bio row yet.</summary>
    private const int NoRow = 0;

    public static RouteGroupBuilder MapTrainerBioEndpoints(this RouteGroupBuilder v1)
    {
        var me = v1.MapGroup("/me/profile/bio").RequireAuthorization();

        me.MapPost("/draft-from-cv", async (
            DraftBioInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            IntegrationHub hub,
            IAiAnalysisProvider ai,
            CancellationToken ct) =>
        {
            var loaded = await OwnProfileAsync(http, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No trainer profile exists yet.");
            }
            var (profile, user) = loaded.Value;
            // Off until `Q28`: said plainly, so the page offers writing it by hand.
            if (!ai.IsConfigured)
            {
                return Results.Problem(statusCode: 409, detail: "ai-unavailable");
            }
            var cv = await CvAttachmentIdAsync(db, profile.ApplicationId, ct);
            if (cv is null)
            {
                return Results.Problem(statusCode: 409, detail: "no-cv");
            }

            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            var next = input.Revision + 1;
            // A submission under review is the reviewer's to decide, not a draft
            // to overwrite; the trainer can still edit it by submitting again.
            var claimed = await ClaimAsync(db, profile.TrainerId, input.Revision,
                [TrainerBioStatuses.Drafting, TrainerBioStatuses.PendingReview],
                TrainerBioStatuses.Drafting, ct);
            if (!claimed)
            {
                return Results.Problem(statusCode: 409, detail: "Already changed.");
            }
            await hub.EnqueueOutboundAsync(
                IntegrationSystems.AiProvider,
                TrainerBioDrafting.ElementName,
                TrainerBioDrafting.EntityType,
                profile.TrainerId,
                entityVersion: next,
                operation: "draft",
                JsonSerializer.Serialize(
                    new TrainerBioDraftRequest(
                        profile.TrainerId, next, cv.Value,
                        user.PreferredCommunicationLanguage == "en" ? "en" : "ar"),
                    AiAnalysisRequest.PayloadOptions),
                ct);
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return Results.Ok(await ProfileEndpoints.BuildAsync(db, profile, user, ct));
        }).WithName("DraftBioFromCv");

        me.MapPost("/", async (
            SubmitBioInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var loaded = await OwnProfileAsync(http, db, ct);
            if (loaded is null)
            {
                return Results.Problem(statusCode: 404, detail: "No trainer profile exists yet.");
            }
            var (profile, user) = loaded.Value;
            var text = input.Text?.Trim() ?? string.Empty;
            if (text.Length == 0 || text.Length > TrainerBioConfiguration.MaxLength)
            {
                return Results.Problem(statusCode: 400, detail: "bio-length");
            }

            var now = DateTime.UtcNow;
            var row = await db.TrainerBios.AsNoTracking()
                .FirstOrDefaultAsync(b => b.TrainerId == profile.TrainerId, ct);
            // The AI's words stay credited to it only if the trainer kept them.
            var source = row is { DraftSource: TrainerBioSources.Ai } && row.Draft == text
                ? TrainerBioSources.Ai
                : TrainerBioSources.Trainer;
            if (row is null)
            {
                if (input.Revision != NoRow)
                {
                    return Results.Problem(statusCode: 409, detail: "Already changed.");
                }
                db.TrainerBios.Add(new TrainerBio
                {
                    TrainerId = profile.TrainerId,
                    Status = TrainerBioStatuses.PendingReview,
                    Draft = text,
                    DraftSource = source,
                    Revision = 1,
                    SubmittedAt = now,
                    UpdatedAt = now,
                });
                // Two first submissions at once: the primary key refuses the
                // second, and the unique-violation handler answers it 409.
                await db.SaveChangesAsync(ct);
                return Results.Ok(await ProfileEndpoints.BuildAsync(db, profile, user, ct));
            }

            // Any state: submitting while an AI draft is pending simply wins,
            // and the late draft then finds the row moved and writes nothing.
            var claimed = await db.TrainerBios
                .Where(b => b.TrainerId == profile.TrainerId && b.Revision == input.Revision)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(b => b.Status, TrainerBioStatuses.PendingReview)
                    .SetProperty(b => b.Draft, text)
                    .SetProperty(b => b.DraftSource, source)
                    .SetProperty(b => b.SubmittedAt, now)
                    .SetProperty(b => b.ReviewNote, (string?)null)
                    .SetProperty(b => b.Revision, b => b.Revision + 1)
                    .SetProperty(b => b.UpdatedAt, now), ct);
            return claimed == 0
                ? Results.Problem(statusCode: 409, detail: "Already changed.")
                : Results.Ok(await ProfileEndpoints.BuildAsync(db, profile, user, ct));
        }).WithName("SubmitBio");

        var staff = v1.MapGroup("/internal")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        staff.MapGet("/trainer-bios", async (ExpertHubDbContext db, CancellationToken ct) =>
            Results.Ok(await PendingAsync(db, ct)))
            .WithName("PendingBios")
            .RequireFeature("F-0401");

        staff.MapPost("/trainers/{trainerId}/bio/decision", async (
            string trainerId,
            BioDecisionInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(trainerId, out var id))
            {
                return Results.Problem(statusCode: 404, detail: "Trainer not found.");
            }
            var approve = input.Decision == "approve";
            if (!approve && input.Decision != "return")
            {
                return Results.Problem(statusCode: 400, detail: "Unknown decision.");
            }
            var note = input.Note?.Trim();
            if (!approve && string.IsNullOrEmpty(note))
            {
                // Sending it back without saying why leaves the trainer guessing.
                return Results.Problem(statusCode: 400, detail: "note-required");
            }

            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var now = DateTime.UtcNow;
            await using var transaction = await db.Database.BeginTransactionAsync(ct);
            // The revision the reviewer read: an edit since then is not what
            // they approved, so the decision is refused and they re-read.
            var claim = db.TrainerBios.Where(b => b.TrainerId == id
                && b.Status == TrainerBioStatuses.PendingReview
                && b.Revision == input.Revision);
            var claimed = approve
                ? await claim.ExecuteUpdateAsync(set => set
                    .SetProperty(b => b.Status, TrainerBioStatuses.Approved)
                    .SetProperty(b => b.Published, b => b.Draft)
                    .SetProperty(b => b.PublishedAt, now)
                    .SetProperty(b => b.ReviewNote, (string?)null)
                    .SetProperty(b => b.ReviewedBy, actor.UserId)
                    .SetProperty(b => b.ReviewedAt, now)
                    .SetProperty(b => b.Revision, b => b.Revision + 1)
                    .SetProperty(b => b.UpdatedAt, now), ct)
                : await claim.ExecuteUpdateAsync(set => set
                    .SetProperty(b => b.Status, TrainerBioStatuses.Returned)
                    .SetProperty(b => b.ReviewNote, note)
                    .SetProperty(b => b.ReviewedBy, actor.UserId)
                    .SetProperty(b => b.ReviewedAt, now)
                    .SetProperty(b => b.Revision, b => b.Revision + 1)
                    .SetProperty(b => b.UpdatedAt, now), ct);
            if (claimed == 0)
            {
                return Results.Problem(statusCode: 409, detail: "Already changed.");
            }
            // Publishing text about a person is a decision the trail keeps.
            db.AppendAudit(new AuditLogEntry
            {
                AuditId = Guid.NewGuid(),
                UserId = actor.UserId,
                Action = approve ? "bio-approved" : "bio-returned",
                EntityType = TrainerBioDrafting.EntityType,
                EntityId = id,
                AfterState = JsonSerializer.Serialize(new { revision = input.Revision, note }),
                IpAddress = http.Connection.RemoteIpAddress?.ToString(),
                OccurredAt = now,
            });
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return Results.Ok(await PendingAsync(db, ct));
        })
            .WithName("DecideBio")
            .RequireFeature("F-0401");

        return v1;
    }

    /// <summary>The bio block of the trainer's own profile.</summary>
    internal static async Task<TrainerBioWire> WireAsync(
        ExpertHubDbContext db, TrainerProfile profile, CancellationToken ct)
    {
        var row = await db.TrainerBios.AsNoTracking()
            .FirstOrDefaultAsync(b => b.TrainerId == profile.TrainerId, ct);
        var hasCv = await CvAttachmentIdAsync(db, profile.ApplicationId, ct) is not null;
        return row is null
            ? new TrainerBioWire("none", null, null, null, null, NoRow, hasCv)
            : new TrainerBioWire(
                row.Status, row.Draft, row.DraftSource, row.Published, row.ReviewNote,
                row.Revision, hasCv);
    }

    /// <summary>The approved text, for every surface other than the trainer's own.</summary>
    internal static Task<string?> PublishedAsync(
        ExpertHubDbContext db, Guid trainerId, CancellationToken ct) =>
        db.TrainerBios
            .Where(b => b.TrainerId == trainerId)
            .Select(b => b.Published)
            .FirstOrDefaultAsync(ct);

    /// <summary>The CV the trainer applied with — the bio's only source.</summary>
    private static async Task<Guid?> CvAttachmentIdAsync(
        ExpertHubDbContext db, Guid applicationId, CancellationToken ct) =>
        await db.ApplicationAttachments
            .Where(a => a.ApplicationId == applicationId && a.RuleCode == "cv" && a.AttachmentId != null)
            .Select(a => a.AttachmentId)
            .FirstOrDefaultAsync(ct);

    /// <summary>
    /// Moves the row to <paramref name="toStatus"/> from the revision the caller
    /// read, or creates it when the caller read none. False when it moved.
    /// </summary>
    private static async Task<bool> ClaimAsync(
        ExpertHubDbContext db, Guid trainerId, int revision, string[] notFrom, string toStatus,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        if (revision == NoRow)
        {
            if (await db.TrainerBios.AnyAsync(b => b.TrainerId == trainerId, ct))
            {
                return false;
            }
            db.TrainerBios.Add(new TrainerBio
            {
                TrainerId = trainerId,
                Status = toStatus,
                Revision = 1,
                UpdatedAt = now,
            });
            return true;
        }
        return await db.TrainerBios
            .Where(b => b.TrainerId == trainerId && b.Revision == revision
                && !notFrom.Contains(b.Status))
            .ExecuteUpdateAsync(set => set
                .SetProperty(b => b.Status, toStatus)
                .SetProperty(b => b.Revision, b => b.Revision + 1)
                .SetProperty(b => b.UpdatedAt, now), ct) == 1;
    }

    private static async Task<List<PendingBioWire>> PendingAsync(
        ExpertHubDbContext db, CancellationToken ct)
    {
        var rows = await (
            from bio in db.TrainerBios
            join profile in db.TrainerProfiles on bio.TrainerId equals profile.TrainerId
            join user in db.Users on profile.UserId equals user.UserId
            where bio.Status == TrainerBioStatuses.PendingReview
            orderby bio.SubmittedAt
            select new { bio, user.FullNameAr }).AsNoTracking().ToListAsync(ct);
        return [.. rows.Select(r => new PendingBioWire(
            r.bio.TrainerId.ToString(),
            r.FullNameAr,
            r.bio.Draft ?? string.Empty,
            r.bio.DraftSource,
            r.bio.Published,
            r.bio.SubmittedAt is { } at ? ApplicationEndpoints.Iso(at) : null,
            r.bio.Revision))];
    }

    private static async Task<(TrainerProfile Profile, AppUser User)?> OwnProfileAsync(
        HttpContext http, ExpertHubDbContext db, CancellationToken ct)
    {
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        var profile = await db.TrainerProfiles.FirstOrDefaultAsync(p => p.UserId == actor.UserId, ct);
        return profile is null ? null : (profile, actor);
    }
}
