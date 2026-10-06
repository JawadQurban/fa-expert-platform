using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Auth;

/// <summary>
/// Feature-level authorization — the owner's ruling of 2026-08-31:
/// permissions are checked per FEATURE (`F-0201`, `F-0301`, …), not per
/// capability or per role.
/// </summary>
/// <remarks>
/// <para>
/// `BR-0801` fixes the only path from a person to a permission:
/// <c>USER_ROLE → ROLE_PERMISSION → PERMISSION</c>. There is no
/// user→permission table, so a direct grant cannot be represented, and this
/// query is therefore the whole of the authorization model.
/// </para>
/// <para>
/// <b>Fail closed.</b> No matching grant means 403 — including for a user
/// with no roles at all, which is what a JIT-provisioned newcomer is.
/// </para>
/// <para>
/// ⚠️ <b>The trainer's own surface is deliberately NOT feature-gated.</b>
/// `/me/*` is guarded by ownership: you may read and change your own
/// application and nobody else's. That is a stronger guarantee than a
/// permission check, and it is the only workable one — J-01 lets a person
/// with no role at all submit an application, so gating `/me/applications`
/// on `F-0101` would lock out every new applicant, which is precisely the
/// group the journey exists for.
/// </para>
/// </remarks>
internal static class FeatureAuthorization
{
    /// <summary>Does this user hold this feature through any of their roles?</summary>
    internal static Task<bool> HasFeatureAsync(
        ExpertHubDbContext db,
        Guid userId,
        string featureCode,
        CancellationToken ct) =>
        (from userRole in db.UserRoles
         join grant in db.RolePermissions on userRole.RoleId equals grant.RoleId
         join permission in db.Permissions on grant.PermissionId equals permission.PermissionId
         where userRole.UserId == userId && permission.FeatureCode == featureCode
         select grant.PermissionId)
        .AnyAsync(ct);

    /// <summary>
    /// Every user who holds this feature through any of their roles.
    /// `DEF-05` — the set form of <see cref="HasFeatureAsync"/>, for the
    /// pools a sequence is formed from. Same join, same fail-closed rule: a
    /// user with no qualifying grant is simply absent.
    /// </summary>
    internal static async Task<IReadOnlyList<Guid>> HoldersOfAsync(
        ExpertHubDbContext db,
        string featureCode,
        CancellationToken ct) =>
        await (from userRole in db.UserRoles
               join grant in db.RolePermissions on userRole.RoleId equals grant.RoleId
               join permission in db.Permissions on grant.PermissionId equals permission.PermissionId
               where permission.FeatureCode == featureCode
               select userRole.UserId)
            .Distinct()
            .ToListAsync(ct);

    /// <summary>
    /// The user's widest scope for a feature (`DM-GAP-07`'s third column):
    /// `all` &gt; `centre` &gt; `own`. Null when they do not hold it at all.
    /// Read by handlers that must narrow a query — the scope is applied at
    /// the query layer, never by a guard a handler could forget.
    /// </summary>
    internal static async Task<Core.Domain.DataScope?> WidestScopeAsync(
        ExpertHubDbContext db,
        Guid userId,
        string featureCode,
        CancellationToken ct)
    {
        var scopes = await (
            from userRole in db.UserRoles
            join grant in db.RolePermissions on userRole.RoleId equals grant.RoleId
            join permission in db.Permissions on grant.PermissionId equals permission.PermissionId
            where userRole.UserId == userId && permission.FeatureCode == featureCode
            select grant.Scope).ToListAsync(ct);
        if (scopes.Count == 0)
        {
            return null;
        }
        // The enum's own order is narrowest-last (All, Own, Centre), so the
        // widest is named rather than min/maxed on an accidental ordering.
        if (scopes.Contains(Core.Domain.DataScope.All))
        {
            return Core.Domain.DataScope.All;
        }
        return scopes.Contains(Core.Domain.DataScope.Centre)
            ? Core.Domain.DataScope.Centre
            : Core.Domain.DataScope.Own;
    }
}

/// <summary>
/// The endpoint filter that applies <see cref="FeatureAuthorization"/>, so a
/// route declares the feature it needs beside the route itself and no
/// handler has to remember to check.
/// </summary>
internal sealed class FeaturePermissionFilter : IEndpointFilter
{
    private readonly string[] _featureCodes;

    /// <summary>Holding ANY of these opens the route. One code is the usual
    /// case; several are for a read two actors legitimately share — J-17's
    /// request list belongs to the centre coordinator who raised it AND the
    /// staff who match it, and neither holds the other's feature.</summary>
    public FeaturePermissionFilter(params string[] featureCodes) => _featureCodes = featureCodes;

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var http = context.HttpContext;
        var db = http.RequestServices.GetRequiredService<ExpertHubDbContext>();
        var ct = http.RequestAborted;

        // The same JIT actor the handlers resolve — the scoped DbContext
        // hands both the identical instance, so this costs nothing twice.
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct).ConfigureAwait(false);
        foreach (var featureCode in _featureCodes)
        {
            if (await FeatureAuthorization.HasFeatureAsync(db, actor.UserId, featureCode, ct)
                .ConfigureAwait(false))
            {
                return await next(context).ConfigureAwait(false);
            }
        }
        {
            var required = string.Join("' or '", _featureCodes);
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Forbidden",
                detail: $"This action requires the '{required}' permission.",
                extensions: new Dictionary<string, object?> { ["featureCode"] = _featureCodes[0] });
        }
    }
}

/// <summary>Declares the feature a route or group requires.</summary>
internal static class FeatureAuthorizationExtensions
{
    internal static RouteHandlerBuilder RequireFeature(
        this RouteHandlerBuilder builder, string featureCode) =>
        builder.AddEndpointFilter(new FeaturePermissionFilter(featureCode));

    /// <summary>Holding any ONE of these opens the route.</summary>
    internal static RouteHandlerBuilder RequireAnyFeature(
        this RouteHandlerBuilder builder, params string[] featureCodes) =>
        builder.AddEndpointFilter(new FeaturePermissionFilter(featureCodes));

    internal static RouteGroupBuilder RequireFeature(
        this RouteGroupBuilder builder, string featureCode) =>
        builder.AddEndpointFilter(new FeaturePermissionFilter(featureCode));
}
