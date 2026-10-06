using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Auth;

/// <summary>
/// Grants the trainer role to someone the Academy already calls a trainer.
/// </summary>
/// <remarks>
/// <para>
/// <b>Owner ruling, 2026-09-08:</b> «i want to give access direct to the users
/// that it come from the fast they have roles "Trainer" having a trainer
/// permission my expert-hub.» Somebody the Academy has already registered as a
/// trainer should not wait for an administrator to type their name in before
/// they can do anything.
/// </para>
/// <para>
/// <b>This does not weaken `BR-0801`.</b> The rule is that no permission is
/// granted directly to a user — only through one of the six approved roles.
/// What is granted here is the <b>trainer role</b>, one of those six, carrying
/// exactly the permissions the matrix gives it. What changes is <i>who</i>
/// grants it: the platform, on the Academy's own evidence, instead of an
/// administrator retyping what the Academy already knows. That is the same
/// shape as the bootstrap administrator grant, which has worked this way since
/// `P-146` — a real `USER_ROLE` row with a real audit entry, never a special
/// case the screens cannot see.
/// </para>
/// <para>
/// ⚠️ <b>An administrator's revocation is final, and that is what makes this
/// safe.</b> A grant that comes back on the next sign-in would make the revoke
/// button a lie — the administrator presses it, watches the role disappear, and
/// the platform quietly restores it an hour later. So before granting, the
/// immutable trail (`BR-0806`) is read: if the trainer role has ever been
/// revoked from this person, it is never re-granted automatically. Their access
/// is then an administrator's decision, permanently, which is the only reading
/// under which both this ruling and `BR-0801` are honoured at once.
/// </para>
/// <para>
/// ⚠️ <b>Off unless configured.</b> `Access:TrainerFastRoles` names the values
/// that mean "trainer" over there. Empty — every committed file — grants
/// nothing, because guessing which of the Academy's role labels implies
/// platform access is not a default worth having.
/// </para>
/// </remarks>
internal static class FastTrainerGrant
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// Grants the trainer role if the Academy's record says so and no
    /// administrator has taken it away. Returns true when the person holds the
    /// trainer role afterwards, so the session can carry it immediately rather
    /// than on their next sign-in.
    /// </summary>
    internal static async Task<bool> ApplyAsync(
        ExpertHubDbContext db,
        AppUser user,
        FastUserProfile profile,
        IReadOnlyCollection<string> trainerValues,
        CancellationToken ct)
    {
        var trainerRole = await db.Roles
            .SingleAsync(role => role.Code == RoleCode.Trainer, ct)
            .ConfigureAwait(false);

        var alreadyHeld = await db.UserRoles
            .AnyAsync(ur => ur.UserId == user.UserId && ur.RoleId == trainerRole.RoleId, ct)
            .ConfigureAwait(false);
        if (alreadyHeld)
        {
            return true;
        }

        if (trainerValues.Count == 0 || !NamesATrainer(profile, trainerValues))
        {
            return false;
        }

        if (await WasRevokedByAnAdministratorAsync(db, user.UserId, ct).ConfigureAwait(false))
        {
            // Deliberately silent to the person signing in: they have the
            // access an administrator decided they have, which is the whole
            // point. The trail already says who decided and when.
            return false;
        }

        db.UserRoles.Add(new UserRole
        {
            UserRoleId = Guid.NewGuid(),
            UserId = user.UserId,
            RoleId = trainerRole.RoleId,
            ScopeRef = null,
            // Self, as the bootstrap grant does: nobody administered this, and
            // recording a person who did not act would be a false trail.
            AssignedBy = user.UserId,
            AssignedAt = DateTime.UtcNow,
        });

        // `BR-0806` — the row and its audit entry ride the caller's single
        // SaveChanges, so the grant and the record of it cannot separate.
        db.AppendAudit(new AuditLogEntry
        {
            AuditId = Guid.NewGuid(),
            UserId = user.UserId,
            Action = "role-assigned",
            EntityType = "USER_ROLE",
            EntityId = user.UserId,
            AfterState = JsonSerializer.Serialize(new
            {
                roleCode = RoleCodes.ToWire(RoleCode.Trainer),
                userName = user.FullNameAr,
                // What the audit reader needs that the summary cannot show:
                // this was the platform acting on the Academy's record, not an
                // administrator's decision.
                fromAcademyRecord = true,
            }),
            OccurredAt = DateTime.UtcNow,
        });

        return true;
    }

    /// <summary>
    /// Whether the Academy's record calls this person one of the configured
    /// trainer values.
    /// </summary>
    /// <remarks>
    /// All three places a role can appear are checked — the structured roles'
    /// <c>systemName</c> and <c>displayName</c>, and the free-text
    /// <c>userRoles</c> labels — because which of them carries "Trainer" is
    /// FAST's choice, not ours, and matching only one would fail silently in a
    /// way nobody could see from a screen. Case-insensitive for the same
    /// reason: `Trainer` and `trainer` are the same claim about a person.
    /// </remarks>
    private static bool NamesATrainer(
        FastUserProfile profile, IReadOnlyCollection<string> trainerValues)
    {
        foreach (var role in profile.Roles)
        {
            if (Matches(role.SystemName, trainerValues) || Matches(role.DisplayName, trainerValues))
            {
                return true;
            }
        }
        foreach (var label in profile.UserRoles)
        {
            if (Matches(label, trainerValues))
            {
                return true;
            }
        }
        return false;
    }

    private static bool Matches(string? value, IReadOnlyCollection<string> candidates) =>
        !string.IsNullOrWhiteSpace(value)
        && candidates.Contains(value.Trim(), StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Has an administrator ever taken the trainer role away from this person?
    /// </summary>
    /// <remarks>
    /// Read from the audit trail rather than a flag on the user, because the
    /// trail is the one record `BR-0806` makes immutable — a flag can be
    /// cleared by the next feature that touches the row, and the day it is
    /// cleared an administrator's decision silently reverses.
    /// </remarks>
    private static async Task<bool> WasRevokedByAnAdministratorAsync(
        ExpertHubDbContext db, Guid userId, CancellationToken ct)
    {
        var revocations = await db.AuditEntries.AsNoTracking()
            .Where(entry =>
                entry.Action == "role-revoked"
                && entry.EntityType == "USER_ROLE"
                && entry.EntityId == userId)
            .Select(entry => entry.AfterState)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        // Matched in memory: the role lives inside the entry's JSON, and a
        // string search translated into SQL would match the word anywhere in
        // the payload — including inside somebody's name.
        var trainer = RoleCodes.ToWire(RoleCode.Trainer);
        foreach (var state in revocations)
        {
            if (string.IsNullOrWhiteSpace(state))
            {
                continue;
            }
            try
            {
                var payload = JsonSerializer.Deserialize<RevokedRole>(state, Json);
                if (string.Equals(payload?.RoleCode, trainer, StringComparison.Ordinal))
                {
                    return true;
                }
            }
            catch (JsonException)
            {
                // An entry we cannot read is not evidence of a revocation.
            }
        }
        return false;
    }

    private sealed record RevokedRole(string? RoleCode);
}
