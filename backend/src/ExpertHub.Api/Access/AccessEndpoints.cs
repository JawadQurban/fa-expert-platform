using System.Text.Json;
using System.Text.Json.Serialization;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Access;

/*
 * CAP-08 — roles & permissions administration (BRD §8.8), behind the contract
 * `accessService.ts` already calls:
 *
 *   GET  v1/internal/access/matrix
 *   POST v1/internal/access/matrix/grants
 *   GET  v1/internal/access/users?q=
 *   POST v1/internal/access/users/{id}/roles
 *   POST v1/internal/access/users/{id}/roles/{role}/revoke
 *   GET  v1/internal/access/audit
 *   GET  v1/internal/centres
 *
 * What is deliberately ABSENT is the point, here as everywhere in CAP-08:
 * no endpoint names a user and a permission together (`BR-0801`, P-137), no
 * endpoint creates or deletes a role (§8.8.5), no endpoint edits or removes
 * an audit entry (`BR-0806`), and nothing here reads, stores or validates a
 * credential (`BR-0808` — identity arrives from INT-01's session cookie).
 *
 * ⚠️ `DM-GAP-07`: the matrix CONTENTS are not seeded. The 58 permissions and
 * six roles are BRD facts (migration seeds); every grant starts absent and
 * `modelStatus` stays `unapproved` until the approved model exists.
 */

/// <summary>The wire types — `access.types.ts`, exactly.</summary>
internal sealed record RoleWire(
    string RoleCode, string NameAr, string NameEn,
    string DescriptionAr, string DescriptionEn, bool IsSystem);

internal sealed record PermissionWire(
    string PermissionId, string CapabilityCode, string FeatureCode,
    string NameAr, string NameEn, bool LabelNeedsVerification);

internal sealed record GrantWire(
    string RoleCode, string PermissionId, bool Granted, string? DataScope);

internal sealed record MatrixWire(
    IReadOnlyList<RoleWire> Roles,
    IReadOnlyList<PermissionWire> Permissions,
    IReadOnlyList<GrantWire> Grants,
    string ModelStatus,
    int UnverifiedLabelCount);

/// <summary>
/// One held role. The frontend type is a discriminated union — `scopeRef` and
/// `scopeName` exist only on the centre-coordinator member — so the two keys
/// are omitted (not nulled) for every other role.
/// </summary>
internal sealed record AssignedRoleWire(
    string RoleCode,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? ScopeRef,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? ScopeName,
    string AssignedByName,
    DateTime AssignedAt);

internal sealed record UserWire(
    string UserId, string DisplayName, string Email,
    IReadOnlyList<AssignedRoleWire> Roles, bool IsActive,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    FastProfileWire? FastProfile);

/// <summary>
/// Who this person is <b>in FAST</b>, shown beside the roles Expert Hub grants.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>Informative, never authoritative.</b> `P-181` fixes that permissions
/// come from Expert Hub's own `USER_ROLE` rows; nothing here grants anything.
/// It is here because an administrator deciding what to grant is better off
/// seeing that FAST already calls this person a training centre coordinator
/// than guessing from an email address.
/// </para>
/// <para>
/// Omitted entirely — not nulled — for anyone with no replica, which is every
/// user who has not signed in since the import shipped. An empty panel would
/// read as «FAST knows nothing about them», which is a different claim from
/// «we have not asked FAST yet» (`P-227`: the replica is only as fresh as the
/// last sign-in, so it is always shown with its date).
/// </para>
/// </remarks>
internal sealed record FastProfileWire(
    string? IdNumber,
    string? Organization,
    string? JobTitle,
    bool IsEmployee,
    IReadOnlyList<string> FastRoles,
    IReadOnlyList<string> ExpertPowers,
    DateTime LastSyncedAt);

internal sealed record CentreWire(string CentreId, string NameAr, string NameEn);

internal sealed record AuditWire(
    string EntryId, string Kind, string ActorName,
    string SummaryAr, string SummaryEn, DateTime OccurredAt);

internal sealed record SetGrantRequest(
    string RoleCode, string PermissionId, bool Granted, string? DataScope);

internal sealed record AssignRoleRequest(string RoleCode, string? ScopeRef);

/// <summary>
/// What an access audit row stores in `after_state` — enough to compose the
/// bilingual summaries at read time without re-querying the changed entity
/// (whose current state may differ from what the entry witnessed).
/// </summary>
internal sealed record AccessAuditPayload(
    string? FeatureCode, string RoleCode, bool? Granted, string? UserName);

public static class AccessEndpoints
{
    private const string GrantChanged = "grant-changed";
    private const string RoleAssigned = "role-assigned";
    private const string RoleRevoked = "role-revoked";
    private static readonly string[] AccessEntityTypes = ["ROLE_PERMISSION", "USER_ROLE"];

    /// <summary>Matches how `FastProfileImport` wrote the replica's JSON.</summary>
    private static readonly JsonSerializerOptions WireJson = new(JsonSerializerDefaults.Web);

    public static RouteGroupBuilder MapAccessEndpoints(this RouteGroupBuilder v1)
    {
        ArgumentNullException.ThrowIfNull(v1);

        // Everything internal requires a session that carries the `internal`
        // role — the same gate the screens sit behind. Fail closed: while the
        // Q37 claim mapping is unconfigured, nobody holds it, and these
        // endpoints deny rather than expose the permission model of a
        // government platform to whoever asks.
        var internalGroup = v1.MapGroup("/internal")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        var access = internalGroup.MapGroup("/access");

        // F-0801 مصفوفة الصلاحيات · F-0802 إدارة المستخدمين · F-0805 سجل
        // التدقيق — CAP-08's three features, per route. `/centres` is a
        // lookup every internal screen reads, not a feature, so it is not
        // gated: gating a reference list would break screens that merely
        // render a name.
        access.MapGet("/matrix", async (ExpertHubDbContext db, CancellationToken ct) =>
            Results.Ok(await LoadMatrixAsync(db, ct)))
            .RequireFeature("F-0801");

        access.MapPost("/matrix/grants", async (
            SetGrantRequest request,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            if (!RoleCodes.TryParse(request.RoleCode, out var roleCode))
            {
                return Results.Problem(statusCode: 400, title: "Unknown role.");
            }
            var role = await db.Roles.SingleAsync(r => r.Code == roleCode, ct);
            var permission = await db.Permissions
                .SingleOrDefaultAsync(p => p.FeatureCode == request.PermissionId, ct);
            if (permission is null)
            {
                return Results.Problem(statusCode: 404, title: "Unknown permission.");
            }

            DataScope scope = DataScope.All;
            if (request.Granted
                && request.DataScope is not null
                && !DataScopes.TryParse(request.DataScope, out scope))
            {
                return Results.Problem(statusCode: 400, title: "Unknown data scope.");
            }

            var actor = await ResolveActorAsync(http, db, ct);

            var existing = await db.RolePermissions.SingleOrDefaultAsync(
                rp => rp.RoleId == role.RoleId && rp.PermissionId == permission.PermissionId, ct);
            if (request.Granted)
            {
                // §8.8.3 — a grant carries its scope; regranting re-scopes.
                if (existing is null)
                {
                    db.RolePermissions.Add(new RolePermission
                    {
                        RoleId = role.RoleId,
                        PermissionId = permission.PermissionId,
                        Scope = scope,
                    });
                }
                else
                {
                    existing.Scope = scope;
                }
            }
            else if (existing is not null)
            {
                // An ungranted permission has no scope to carry — the row goes,
                // and only the audit trail remembers it existed.
                db.RolePermissions.Remove(existing);
            }

            AppendAudit(db, actor, GrantChanged, "ROLE_PERMISSION", entityId: null,
                new AccessAuditPayload(permission.FeatureCode, RoleCodes.ToWire(roleCode), request.Granted, null));

            // One SaveChanges: the change and its audit entry share a
            // transaction (`BR-0806`) — an audit written afterwards can be
            // lost precisely when it matters.
            await db.SaveChangesAsync(ct);

            return Results.Ok(await LoadMatrixAsync(db, ct));
        })
            .RequireFeature("F-0801");

        access.MapGet("/users", async (string? q, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var term = (q ?? string.Empty).Trim();
            var query = db.Users.AsNoTracking();
            if (term.Length > 0)
            {
                query = query.Where(u =>
                    u.FullNameAr.Contains(term) || u.FullNameEn.Contains(term) || u.Email.Contains(term));
            }
            var users = await query.OrderBy(u => u.CreatedAt).ToListAsync(ct);
            return Results.Ok(await ToUserWiresAsync(db, users, ct));
        })
            .RequireFeature("F-0802");

        access.MapPost("/users/{userId}/roles", async (
            string userId,
            AssignRoleRequest request,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(userId, out var targetId))
            {
                return Results.Problem(statusCode: 404, title: "User not found.");
            }
            var target = await db.Users.SingleOrDefaultAsync(u => u.UserId == targetId, ct);
            if (target is null)
            {
                return Results.Problem(statusCode: 404, title: "User not found.");
            }
            if (!RoleCodes.TryParse(request.RoleCode, out var roleCode))
            {
                return Results.Problem(statusCode: 400, title: "Unknown role.");
            }

            // The same rules `validateAssignRole` applies client-side, applied
            // again where they are actually enforced.
            Guid? scopeRef = null;
            if (roleCode == RoleCode.CentreCoordinator)
            {
                // P-140 — the coordinator's centre is required...
                if (string.IsNullOrWhiteSpace(request.ScopeRef)
                    || !Guid.TryParse(request.ScopeRef, out var parsedScope))
                {
                    return Results.Problem(statusCode: 400, title: "scope-required");
                }
                scopeRef = parsedScope;
            }
            else if (!string.IsNullOrWhiteSpace(request.ScopeRef))
            {
                // ...and no other role may carry one. The frontend type makes
                // this unrepresentable; the API refuses what the type forbids.
                return Results.Problem(statusCode: 400, title: "Only the centre coordinator carries a scope.");
            }

            var role = await db.Roles.SingleAsync(r => r.Code == roleCode, ct);
            var alreadyHeld = await db.UserRoles.AnyAsync(
                ur => ur.UserId == targetId && ur.RoleId == role.RoleId, ct);
            if (alreadyHeld)
            {
                return Results.Problem(statusCode: 400, title: "already-assigned");
            }

            var actor = await ResolveActorAsync(http, db, ct);

            db.UserRoles.Add(new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = targetId,
                RoleId = role.RoleId,
                ScopeRef = scopeRef,
                AssignedBy = actor.UserId,
                AssignedAt = DateTime.UtcNow,
            });
            AppendAudit(db, actor, RoleAssigned, "USER_ROLE", targetId,
                new AccessAuditPayload(null, RoleCodes.ToWire(roleCode), null, target.FullNameAr));
            await db.SaveChangesAsync(ct);

            var wires = await ToUserWiresAsync(db, [target], ct);
            return Results.Ok(wires[0]);
        })
            .RequireFeature("F-0802");

        access.MapPost("/users/{userId}/roles/{role}/revoke", async (
            string userId,
            string role,
            HttpContext http,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(userId, out var targetId))
            {
                return Results.Problem(statusCode: 404, title: "User not found.");
            }
            var target = await db.Users.SingleOrDefaultAsync(u => u.UserId == targetId, ct);
            if (target is null)
            {
                return Results.Problem(statusCode: 404, title: "User not found.");
            }
            if (!RoleCodes.TryParse(role, out var roleCode))
            {
                return Results.Problem(statusCode: 400, title: "Unknown role.");
            }

            var roleRow = await db.Roles.SingleAsync(r => r.Code == roleCode, ct);
            var held = await db.UserRoles
                .Where(ur => ur.UserId == targetId && ur.RoleId == roleRow.RoleId)
                .ToListAsync(ct);

            /*
             * ⚠️ The platform must never be left with nobody who can administer
             * it. Revoking the LAST system administrator is unrecoverable from
             * inside the product: no remaining account can grant the role back,
             * and the bootstrap list only re-grants on a fresh sign-in of an
             * account named in configuration nobody can then edit from here.
             *
             * Refused rather than warned. A confirmation dialog puts the
             * decision on whoever is in the most hurry, and this is the one
             * mistake with no way back. Found by QA (`D-35`), who correctly
             * declined to press the button.
             */
            if (held.Count > 0 && roleCode == RoleCode.SystemAdministrator)
            {
                var remaining = await db.UserRoles
                    .CountAsync(ur => ur.RoleId == roleRow.RoleId && ur.UserId != targetId, ct);
                if (remaining == 0)
                {
                    return Results.Problem(
                        statusCode: 409,
                        title: "Conflict",
                        detail: "This is the only System Administrator. Assign the role to "
                            + "someone else before revoking it, or the platform is left with "
                            + "nobody who can administer it.",
                        extensions: new Dictionary<string, object?>
                        {
                            ["reason"] = "last-system-administrator",
                        });
                }
            }

            db.UserRoles.RemoveRange(held);

            var actor = await ResolveActorAsync(http, db, ct);
            AppendAudit(db, actor, RoleRevoked, "USER_ROLE", targetId,
                new AccessAuditPayload(null, RoleCodes.ToWire(roleCode), null, target.FullNameAr));
            await db.SaveChangesAsync(ct);

            var wires = await ToUserWiresAsync(db, [target], ct);
            return Results.Ok(wires[0]);
        })
            .RequireFeature("F-0802");

        access.MapGet("/audit", async (ExpertHubDbContext db, CancellationToken ct) =>
        {
            var entries = await db.AuditEntries
                .Where(a => AccessEntityTypes.Contains(a.EntityType))
                .OrderByDescending(a => a.OccurredAt)
                .Take(500)
                .ToListAsync(ct);

            var actorIds = entries.Select(a => a.UserId).Distinct().ToArray();
            var actors = await db.Users.AsNoTracking()
                .Where(u => actorIds.Contains(u.UserId))
                .ToDictionaryAsync(u => u.UserId, u => u.FullNameAr, ct);

            return Results.Ok(entries.Select(entry => ToAuditWire(entry, actors)).ToArray());
        })
            .RequireFeature("F-0805");

        // Centres are reference data, not part of the access model — which is
        // why the route is not under `/access` (P-144). The list ships with no
        // rows: real centres are organizational data nobody has supplied.
        internalGroup.MapGet("/centres", async (ExpertHubDbContext db, CancellationToken ct) =>
        {
            var rows = await db.ReferenceValues.AsNoTracking()
                .Where(v => v.ListCode == "centre" && v.IsActive)
                .OrderBy(v => v.SortOrder)
                .ToListAsync(ct);
            // Mapped in memory: a Guid.ToString() translated into SQL comes
            // back UPPERCASE, and ids on this wire are lowercase everywhere.
            return Results.Ok(rows
                .Select(v => new CentreWire(v.ValueId.ToString(), v.LabelAr, v.LabelEn))
                .ToArray());
        });

        return v1;
    }

    /* ────────────────────────── assembly ─────────────────────────── */

    private static async Task<MatrixWire> LoadMatrixAsync(ExpertHubDbContext db, CancellationToken ct)
    {
        var roles = await db.Roles.AsNoTracking().OrderBy(r => r.RoleId).ToListAsync(ct);
        var permissions = await db.Permissions.AsNoTracking().OrderBy(p => p.FeatureCode).ToListAsync(ct);
        var grants = await db.RolePermissions.AsNoTracking().ToListAsync(ct);

        var roleById = roles.ToDictionary(r => r.RoleId);
        var permById = permissions.ToDictionary(p => p.PermissionId);

        return new MatrixWire(
            Roles: roles.Select(r => new RoleWire(
                RoleCodes.ToWire(r.Code), r.NameAr, r.NameEn, r.DescriptionAr, r.DescriptionEn, r.IsSystem)).ToArray(),
            Permissions: permissions.Select(p => new PermissionWire(
                p.FeatureCode, p.CapabilityCode, p.FeatureCode, p.NameAr, p.NameEn, p.LabelNeedsVerification)).ToArray(),
            Grants: grants.Select(g => new GrantWire(
                RoleCodes.ToWire(roleById[g.RoleId].Code),
                permById[g.PermissionId].FeatureCode,
                Granted: true,
                DataScopes.ToWire(g.Scope))).ToArray(),
            // ⚠️ `DM-GAP-07` — until the approved model exists and is entered,
            // whatever the grid holds is a working draft, and it says so.
            ModelStatus: "unapproved",
            UnverifiedLabelCount: permissions.Count(p => p.LabelNeedsVerification));
    }

    private static async Task<IReadOnlyList<UserWire>> ToUserWiresAsync(
        ExpertHubDbContext db,
        IReadOnlyList<AppUser> users,
        CancellationToken ct)
    {
        var userIds = users.Select(u => u.UserId).ToArray();
        var held = await db.UserRoles.AsNoTracking()
            .Where(ur => userIds.Contains(ur.UserId))
            .OrderBy(ur => ur.AssignedAt)
            .ToListAsync(ct);

        var roleById = await db.Roles.AsNoTracking().ToDictionaryAsync(r => r.RoleId, ct);

        var assignerIds = held.Select(h => h.AssignedBy).Distinct().ToArray();
        var assigners = await db.Users.AsNoTracking()
            .Where(u => assignerIds.Contains(u.UserId))
            .ToDictionaryAsync(u => u.UserId, u => u.FullNameAr, ct);

        // FAST's own view of these people (`P-227`), by user. `AsNoTracking`
        // because this is a read the caller never writes back.
        var fastProfiles = await db.FastProfiles.AsNoTracking()
            .Where(p => userIds.Contains(p.UserId))
            .ToDictionaryAsync(p => p.UserId, ct);

        var scopeIds = held.Where(h => h.ScopeRef.HasValue).Select(h => h.ScopeRef!.Value).Distinct().ToArray();
        var centreNames = await db.ReferenceValues.AsNoTracking()
            .Where(v => v.ListCode == "centre" && scopeIds.Contains(v.ValueId))
            .ToDictionaryAsync(v => v.ValueId, v => v.LabelAr, ct);

        return users.Select(user => new UserWire(
            UserId: user.UserId.ToString(),
            DisplayName: user.FullNameAr,
            Email: user.Email,
            Roles: held.Where(h => h.UserId == user.UserId).Select(h => new AssignedRoleWire(
                RoleCode: RoleCodes.ToWire(roleById[h.RoleId].Code),
                ScopeRef: h.ScopeRef?.ToString(),
                // Mirrors the mock: an unknown centre falls back to its id
                // rather than blanking the scope the assignment carries.
                ScopeName: h.ScopeRef is { } scope
                    ? centreNames.GetValueOrDefault(scope, scope.ToString())
                    : null,
                AssignedByName: assigners.GetValueOrDefault(h.AssignedBy, string.Empty),
                AssignedAt: h.AssignedAt)).ToArray(),
            IsActive: user.IsActive,
            FastProfile: fastProfiles.TryGetValue(user.UserId, out var fast)
                ? ToFastWire(fast, user)
                : null)).ToArray();
    }

    /// <summary>
    /// The replica as the access screen shows it — names, not codes, and only
    /// the powers FAST actually flags.
    /// </summary>
    private static FastProfileWire ToFastWire(FastProfileReplica replica, AppUser user)
    {
        var roles = new List<string>();
        if (!string.IsNullOrWhiteSpace(replica.FastRoles))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<FastRole[]>(replica.FastRoles, WireJson);
                foreach (var role in parsed ?? [])
                {
                    // FAST's own Arabic label first — this is an Arabic-first
                    // product, and `systemName` is an English identifier.
                    var label = role.DisplayName ?? role.SystemName;
                    if (!string.IsNullOrWhiteSpace(label))
                    {
                        roles.Add(label);
                    }
                }
            }
            catch (JsonException)
            {
                // A replica written by an older shape is stale data, not a
                // reason the access screen fails to load.
            }
        }

        /*
         * FAST's three "Expert" flags (`Q22`). They are sent as CODES, not
         * labels: they do not line up with Expert Hub's four services — only
         * «question author» has an obvious counterpart — so the screen names
         * them in the reader's language rather than the API deciding wording
         * for a mapping nobody has ruled on yet.
         */
        var powers = new List<string>();
        if (replica.ExpertCorrector) { powers.Add("corrector"); }
        if (replica.ExpertReviewer) { powers.Add("reviewer"); }
        if (replica.ExpertQuestionAuthor) { powers.Add("question_author"); }

        return new FastProfileWire(
            IdNumber: replica.IdNumber,
            Organization: replica.Organization,
            JobTitle: replica.JobTitle,
            IsEmployee: user.IsEmployee,
            FastRoles: roles,
            ExpertPowers: powers,
            LastSyncedAt: replica.LastSyncedAt);
    }

    /* ────────────────────────── audit ─────────────────────────── */

    private static void AppendAudit(
        ExpertHubDbContext db,
        AppUser actor,
        string kind,
        string entityType,
        Guid? entityId,
        AccessAuditPayload payload)
    {
        db.AppendAudit(new AuditLogEntry
        {
            AuditId = Guid.NewGuid(),
            UserId = actor.UserId,
            Action = kind,
            EntityType = entityType,
            EntityId = entityId,
            AfterState = JsonSerializer.Serialize(payload),
            OccurredAt = DateTime.UtcNow,
        });
    }

    /// <summary>
    /// Composes the wire summaries from what the entry witnessed. The wording
    /// mirrors the mock provider verbatim — the contract's own phrasing.
    /// </summary>
    private static AuditWire ToAuditWire(AuditLogEntry entry, IReadOnlyDictionary<Guid, string> actors)
    {
        var payload = entry.AfterState is null
            ? new AccessAuditPayload(null, string.Empty, null, null)
            : JsonSerializer.Deserialize<AccessAuditPayload>(entry.AfterState)
                ?? new AccessAuditPayload(null, string.Empty, null, null);

        var (summaryAr, summaryEn) = entry.Action switch
        {
            GrantChanged => (
                $"{(payload.Granted == true ? "مُنحت" : "سُحبت")} صلاحية {payload.FeatureCode} للدور {payload.RoleCode}",
                $"{(payload.Granted == true ? "Granted" : "Revoked")} {payload.FeatureCode} for {payload.RoleCode}"),
            RoleAssigned => (
                $"أُسند الدور {payload.RoleCode} إلى {payload.UserName}",
                $"Assigned {payload.RoleCode} to {payload.UserName}"),
            RoleRevoked => (
                $"سُحب الدور {payload.RoleCode} من {payload.UserName}",
                $"Revoked {payload.RoleCode} from {payload.UserName}"),
            _ => (entry.Action, entry.Action),
        };

        return new AuditWire(
            EntryId: entry.AuditId.ToString(),
            Kind: entry.Action,
            ActorName: actors.GetValueOrDefault(entry.UserId, string.Empty),
            SummaryAr: summaryAr,
            SummaryEn: summaryEn,
            OccurredAt: entry.OccurredAt);
    }

    /* ────────────────────────── the actor ─────────────────────────── */

    /// <summary>
    /// Resolves the acting user's <c>APP_USER</c> row from the session,
    /// creating it on first touch — identity arrives from INT-01 and the
    /// platform holds a reference, never a credential (`BR-1205`).
    /// </summary>
    /// <remarks>
    /// The session carries one display name; both bilingual name columns get
    /// it until the profile supplies better (whether the token has an Arabic
    /// form is part of `Q37`). Not saved here: the row rides the mutation's
    /// own SaveChanges, inside the same transaction as its audit entry.
    /// </remarks>
    private static Task<AppUser> ResolveActorAsync(
        HttpContext http,
        ExpertHubDbContext db,
        CancellationToken ct) => ActorResolution.ResolveActorAsync(http, db, ct);
}
