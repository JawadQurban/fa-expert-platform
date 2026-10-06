using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Auth;

/// <summary>
/// Turns the session's subject into the `APP_USER` row it belongs to,
/// JIT-provisioning on first contact (`BR-1205` — identity arrives from
/// INT-01's cookie, never from local credentials). Shared by every endpoint
/// module that attributes a change to a person.
/// </summary>
internal static class ActorResolution
{
    internal static async Task<AppUser> ResolveActorAsync(
        HttpContext http,
        ExpertHubDbContext db,
        CancellationToken ct)
    {
        var subject = http.User.FindFirst(ExpertHubClaims.Subject)?.Value;
        if (string.IsNullOrWhiteSpace(subject))
        {
            // Behind the authorization policy this is unreachable; if a
            // handler is ever reordered above it, fail rather than attribute
            // changes to nobody.
            throw new InvalidOperationException("An authenticated session carries no subject claim.");
        }

        var existing = await db.Users.SingleOrDefaultAsync(u => u.ExternalIdentityId == subject, ct);
        if (existing is not null)
        {
            return existing;
        }

        var displayName = http.User.Identity?.Name ?? subject;
        var actor = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = subject,
            Email = http.User.FindFirst("email")?.Value ?? string.Empty,
            FullNameAr = displayName,
            FullNameEn = displayName,
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            IsActive = true,
            // The session's coarse role says which surface they came through:
            // an applicant on /me/* is not staff, whatever brought them here.
            IsEmployee = http.User.HasClaim(ExpertHubClaims.Role, "internal"),
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(actor);
        return actor;
    }

    /// <summary>
    /// `BR-0704`-style precise-role checks: the session's coarse roles say
    /// internal/trainer, the `USER_ROLE` table says which internal role —
    /// server-decided, never a claim (`P-181`).
    /// </summary>
    internal static Task<bool> HoldsRoleAsync(
        ExpertHubDbContext db,
        Guid userId,
        RoleCode role,
        CancellationToken ct) =>
        db.UserRoles
            .Join(db.Roles, ur => ur.RoleId, r => r.RoleId, (ur, r) => new { ur.UserId, r.Code })
            .AnyAsync(x => x.UserId == userId && x.Code == role, ct);
}
