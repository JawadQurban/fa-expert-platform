using System.Text.Json;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The owner's ruling of 2026-09-08 — «give access direct to the users that it
/// come from the fast they have roles "Trainer"» — and the boundary that keeps
/// it compatible with `BR-0801` and with an administrator's authority.
/// </summary>
public sealed class FastTrainerGrantTests : IAsyncLifetime
{
    private readonly LocalDbFixture _database = new();
    private static readonly string[] TrainerValues = ["Trainer"];

    public Task InitializeAsync() => _database.InitializeAsync();

    public Task DisposeAsync() => _database.DisposeAsync();

    private static FastUserProfile Profile(string roleSystemName, string label = "زائر")
    {
        var json = "{ \"fullNameAr\": \"مدرب معتمد\","
            + " \"roles\": [{ \"displayName\": \"مدرب\", \"code\": 7, \"systemName\": \""
            + roleSystemName + "\" }],"
            + " \"userRoles\": [\"" + label + "\"] }";
        return FastUserReader.Parse(json).Value!;
    }

    private async Task<Guid> SeedUserAsync()
    {
        await using var db = _database.CreateContext();
        var user = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = "fast-" + Guid.NewGuid().ToString("N"),
            Email = "trainer@fa.org.sa",
            FullNameAr = "مدرب معتمد",
            FullNameEn = "Certified Trainer",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user.UserId;
    }

    private async Task<bool> ApplyAsync(
        Guid userId, FastUserProfile profile, params string[] values)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.UserId == userId);
        var granted = await FastTrainerGrant.ApplyAsync(
            db, user, profile, values, CancellationToken.None);
        await db.SaveChangesAsync();
        return granted;
    }

    private async Task<bool> HoldsTrainerAsync(Guid userId)
    {
        await using var db = _database.CreateContext();
        var role = await db.Roles.SingleAsync(r => r.Code == RoleCode.Trainer);
        return await db.UserRoles.AnyAsync(ur =>
            ur.UserId == userId && ur.RoleId == role.RoleId);
    }

    [Fact]
    public async Task Someone_the_Academy_calls_a_trainer_is_granted_the_trainer_role()
    {
        var userId = await SeedUserAsync();

        Assert.True(await ApplyAsync(userId, Profile("Trainer"), TrainerValues));
        Assert.True(await HoldsTrainerAsync(userId));

        // `BR-0806` — a real assignment, in the trail, shown by the access
        // screen like any other. Not a special case only the code knows about.
        await using var db = _database.CreateContext();
        var entry = await db.AuditEntries.SingleAsync(a =>
            a.Action == "role-assigned" && a.EntityId == userId);
        using var payload = JsonDocument.Parse(entry.AfterState!);
        Assert.Equal("trainer", payload.RootElement.GetProperty("roleCode").GetString());
        // Whoever reads the trail can tell this from an administrator's act.
        Assert.True(payload.RootElement.GetProperty("fromAcademyRecord").GetBoolean());
    }

    [Fact]
    public async Task The_Academys_own_Arabic_label_counts_too()
    {
        // Which field carries "trainer" is FAST's choice, not ours, and
        // matching only `systemName` would fail silently.
        var userId = await SeedUserAsync();
        Assert.True(await ApplyAsync(userId, Profile("Individual"), "مدرب"));
        Assert.True(await HoldsTrainerAsync(userId));
    }

    [Fact]
    public async Task Nothing_is_granted_while_the_mapping_is_unconfigured()
    {
        // Empty configuration grants nothing. Guessing which of the Academy's
        // labels implies platform access would hand out access nobody decided
        // to give.
        var userId = await SeedUserAsync();
        Assert.False(await ApplyAsync(userId, Profile("Trainer")));
        Assert.False(await HoldsTrainerAsync(userId));
    }

    [Fact]
    public async Task Someone_the_Academy_does_not_call_a_trainer_gets_nothing()
    {
        var userId = await SeedUserAsync();
        Assert.False(await ApplyAsync(userId, Profile("Individual"), TrainerValues));
        Assert.False(await HoldsTrainerAsync(userId));
    }

    [Fact]
    public async Task An_administrators_revocation_is_never_undone_by_a_later_sign_in()
    {
        /*
         * ⚠️ The test this whole design turns on. Without it the revoke button
         * is a lie: the administrator presses it, watches the role disappear,
         * and the platform restores it the next time that person signs in.
         */
        var userId = await SeedUserAsync();
        Assert.True(await ApplyAsync(userId, Profile("Trainer"), TrainerValues));

        // An administrator takes it away — exactly what the endpoint writes.
        await using (var db = _database.CreateContext())
        {
            var role = await db.Roles.SingleAsync(r => r.Code == RoleCode.Trainer);
            db.UserRoles.RemoveRange(
                await db.UserRoles
                    .Where(ur => ur.UserId == userId && ur.RoleId == role.RoleId)
                    .ToListAsync());
            db.AppendAudit(new AuditLogEntry
            {
                AuditId = Guid.NewGuid(),
                UserId = userId,
                Action = "role-revoked",
                EntityType = "USER_ROLE",
                EntityId = userId,
                AfterState = JsonSerializer.Serialize(new { roleCode = "trainer" }),
                OccurredAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        // They sign in again. The Academy still calls them a trainer.
        Assert.False(await ApplyAsync(userId, Profile("Trainer"), TrainerValues));
        Assert.False(await HoldsTrainerAsync(userId));
    }

    [Fact]
    public async Task A_different_roles_revocation_does_not_block_the_trainer_grant()
    {
        // The trail is read for the trainer role specifically — a revoked
        // manager role says nothing about whether they train.
        var userId = await SeedUserAsync();
        await using (var db = _database.CreateContext())
        {
            db.AppendAudit(new AuditLogEntry
            {
                AuditId = Guid.NewGuid(),
                UserId = userId,
                Action = "role-revoked",
                EntityType = "USER_ROLE",
                EntityId = userId,
                AfterState = JsonSerializer.Serialize(new { roleCode = "manager" }),
                OccurredAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        Assert.True(await ApplyAsync(userId, Profile("Trainer"), TrainerValues));
    }

    [Fact]
    public async Task Signing_in_twice_grants_once()
    {
        var userId = await SeedUserAsync();
        Assert.True(await ApplyAsync(userId, Profile("Trainer"), TrainerValues));
        Assert.True(await ApplyAsync(userId, Profile("Trainer"), TrainerValues));

        await using var db = _database.CreateContext();
        var role = await db.Roles.SingleAsync(r => r.Code == RoleCode.Trainer);
        Assert.Equal(1, await db.UserRoles.CountAsync(ur =>
            ur.UserId == userId && ur.RoleId == role.RoleId));
        // And no second audit entry claiming a grant that never happened.
        Assert.Equal(1, await db.AuditEntries.CountAsync(a =>
            a.Action == "role-assigned" && a.EntityId == userId));
    }

    [Fact]
    public async Task The_grant_gives_the_trainer_role_and_no_more()
    {
        // `BR-0801` — permissions come from the role's own grants in the
        // matrix. This adds a role; it cannot add a permission, because there
        // is no path from here to `ROLE_PERMISSION`.
        var userId = await SeedUserAsync();
        await ApplyAsync(userId, Profile("Trainer"), TrainerValues);

        await using var db = _database.CreateContext();
        var held = await (
            from userRole in db.UserRoles
            join role in db.Roles on userRole.RoleId equals role.RoleId
            where userRole.UserId == userId
            select role.Code).ToListAsync();
        Assert.Equal([RoleCode.Trainer], held);
    }
}
