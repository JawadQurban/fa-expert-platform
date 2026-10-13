using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Applications;
using ExpertHub.Infrastructure.Documents;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Applications;

/// <summary>One person a staff member may nominate (J-02).</summary>
/// <remarks><c>Blocked</c>: null, <c>approved-trainer</c> (add-service
/// instead), <c>open-application</c> (BR-0101) or <c>self</c>.</remarks>
internal sealed record NominationCandidateWire(
    string UserId,
    string ExternalIdentityId,
    string FullNameAr,
    string FullNameEn,
    string Email,
    string? Blocked,
    string? OpenApplicationId);

/// <summary>
/// J-02 — a staff member fills the application form for an existing Expert Hub
/// user, linked by that user's id (owner ruling, 2026-10-13: «the internal
/// staff should be able to link it with user id»). The application is the
/// NOMINEE's (`ApplicantUserId`), `Origin = internal_nomination`, and
/// `NominatedBy` is the staff member. No unverified account is created, so the
/// identity-linking question that kept J-02 unbuilt (`P-288`, `BD-UAT-01`)
/// does not arise: the nominee already signs in as themselves.
/// </summary>
internal static class NominationEndpoints
{
    internal static RouteGroupBuilder MapNominationEndpoints(this RouteGroupBuilder v1)
    {
        var nominations = v1.MapGroup("/internal/nominations")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy)
            .RequireFeature("F-0102");

        nominations.MapGet("/candidates", async (
            string? q, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var term = (q ?? string.Empty).Trim();
            if (term.Length < 2)
            {
                return Results.Ok(Array.Empty<NominationCandidateWire>());
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var byId = Guid.TryParse(term, out var userId) ? userId : (Guid?)null;
            var users = await db.Users.AsNoTracking()
                .Where(u => u.IsActive
                    && (u.UserId == byId
                        || u.ExternalIdentityId == term
                        || u.Email.Contains(term)
                        || u.FullNameAr.Contains(term)
                        || u.FullNameEn.Contains(term)))
                .OrderBy(u => u.FullNameAr)
                .Take(20)
                .ToListAsync(ct);

            var ids = users.Select(u => u.UserId).ToList();
            var trainers = await db.UserRoles
                .Join(db.Roles, ur => ur.RoleId, r => r.RoleId, (ur, r) => new { ur.UserId, r.Code })
                .Where(x => ids.Contains(x.UserId) && x.Code == RoleCode.Trainer)
                .Select(x => x.UserId)
                .ToListAsync(ct);
            var open = (await db.Applications
                    .Where(a => ids.Contains(a.ApplicantUserId)
                        && ApplicationStatuses.Undecided.Contains(a.Status))
                    .Select(a => new { a.ApplicantUserId, a.ApplicationId, a.Status, a.Origin })
                    .ToListAsync(ct))
                // A nomination draft is resumed, not a block.
                .Where(a => !(a.Status == ApplicationStatuses.Draft
                    && a.Origin == ApplicationOrigins.InternalNomination))
                .GroupBy(a => a.ApplicantUserId)
                .ToDictionary(g => g.Key, g => g.First().ApplicationId);

            return Results.Ok(users.Select(u => new NominationCandidateWire(
                u.UserId.ToString(),
                u.ExternalIdentityId,
                u.FullNameAr,
                u.FullNameEn,
                u.Email,
                u.UserId == actor.UserId ? "self"
                    : trainers.Contains(u.UserId) ? "approved-trainer"
                    : open.ContainsKey(u.UserId) ? "open-application"
                    : null,
                open.TryGetValue(u.UserId, out var appId) ? appId.ToString() : null)).ToList());
        }).WithName("NominationCandidates");

        nominations.MapGet("/{userId}/prefill", async (
            string userId, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var (nominee, error) = await ResolveNomineeAsync(userId, http, db, ct);
            return nominee is null
                ? error!
                : Results.Ok(await ApplicationPrefill.ForUserAsync(db, nominee.Value, ct));
        }).WithName("NominationPrefill");

        nominations.MapPost("/{userId}/draft/start", async (
            string userId, HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var (nominee, error) = await ResolveNomineeAsync(userId, http, db, ct);
            if (nominee is null)
            {
                return error!;
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            return await ApplicationEndpoints.StartDraftAsync(db, nominee.Value, actor.UserId, ct);
        }).WithName("StartNominationDraft");

        nominations.MapPost("/{userId}/draft", async (
            string userId, SaveDraftInputWire input, HttpContext http, ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var (nominee, error) = await ResolveNomineeAsync(userId, http, db, ct);
            return nominee is null
                ? error!
                : await ApplicationEndpoints.SaveDraftAsync(db, await NominationDraftAsync(db, nominee.Value, ct), input, ct);
        }).WithName("SaveNominationDraft");

        nominations.MapPost("/{userId}/draft/attachments", async (
            string userId, HttpRequest request, HttpContext http, ExpertHubDbContext db,
            IDocumentStore store, IUploadScanner scanner, CancellationToken ct) =>
        {
            var (nominee, error) = await ResolveNomineeAsync(userId, http, db, ct);
            if (nominee is null)
            {
                return error!;
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            return await ApplicationEndpoints.UploadDraftAttachmentAsync(
                request, db, store, scanner, await NominationDraftAsync(db, nominee.Value, ct), actor.UserId, ct);
        }).WithName("UploadNominationAttachment").DisableAntiforgery();

        nominations.MapPost("/{userId}/draft/attachments/remove", async (
            string userId, RemoveAttachmentInputWire input, HttpContext http, ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var (nominee, error) = await ResolveNomineeAsync(userId, http, db, ct);
            return nominee is null
                ? error!
                : await ApplicationEndpoints.RemoveDraftAttachmentAsync(
                    db, await NominationDraftAsync(db, nominee.Value, ct), input, ct);
        }).WithName("RemoveNominationAttachment");

        nominations.MapPost("/{userId}/submit", async (
            string userId, SaveDraftInputWire input, HttpContext http, ExpertHubDbContext db,
            NotificationDispatcher dispatcher, IntegrationHub hub, CancellationToken ct) =>
        {
            var (nominee, error) = await ResolveNomineeAsync(userId, http, db, ct);
            return nominee is null
                ? error!
                : await ApplicationEndpoints.SubmitDraftAsync(
                    db, dispatcher, hub, await NominationDraftAsync(db, nominee.Value, ct), input, ct);
        }).WithName("SubmitNomination");

        return v1;
    }

    private static Task<Application?> NominationDraftAsync(
        ExpertHubDbContext db, Guid nominee, CancellationToken ct) =>
        ApplicationEndpoints.FindDraftAsync(db, nominee, ApplicationOrigins.InternalNomination, ct);

    /// <summary>
    /// The nominee: an active Expert Hub user, and never the staff member
    /// themselves — RB-02's original defect was an application in the staff
    /// member's own name entering screening.
    /// </summary>
    private static async Task<(Guid? Nominee, IResult? Error)> ResolveNomineeAsync(
        string userId, HttpContext http, ExpertHubDbContext db, CancellationToken ct)
    {
        if (!Guid.TryParse(userId, out var id)
            || !await db.Users.AnyAsync(u => u.UserId == id && u.IsActive, ct))
        {
            return (null, Results.Problem(statusCode: 404, detail: "No such user."));
        }
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        if (actor.UserId == id)
        {
            return (null, Results.Problem(statusCode: 409, title: "Self-nomination",
                detail: "A staff member cannot nominate themselves."));
        }
        return (id, null);
    }
}
