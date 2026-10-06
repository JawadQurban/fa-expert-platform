using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// Boots migration 01 against a real SQL Server (LocalDB) and holds the
/// foundation to its structural claims.
/// </summary>
/// <remarks>
/// A real server on purpose: the in-memory provider enforces none of the
/// constraints this migration exists to create — CHECK constraints, NOT NULL
/// on the bilingual pairs, unique indexes — so a passing in-memory suite would
/// prove nothing about them. LocalDB stands in until infrastructure supplies
/// an instance (`17_STACK_DECISION.md` §4).
/// </remarks>
[Collection(LocalDbCollection.Name)]
public sealed class PersistenceFoundationTests
{
    private readonly LocalDbFixture _fixture;

    public PersistenceFoundationTests(LocalDbFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Migration_01_creates_the_nine_foundation_tables()
    {
        await using var context = _fixture.CreateContext();

        var tables = await context.Database
            .SqlQueryRaw<string>("SELECT name AS [Value] FROM sys.tables")
            .ToListAsync();

        // `10_DATABASE_DESIGN` §3.1–3.2, by name.
        string[] expected =
        [
            "ATTACHMENT", "REFERENCE_LIST", "REFERENCE_VALUE",
            "APP_USER", "ROLE", "PERMISSION", "ROLE_PERMISSION", "USER_ROLE", "AUDIT_LOG",
        ];
        foreach (var table in expected)
        {
            Assert.Contains(table, tables);
        }
    }

    [Fact]
    public async Task Audit_entries_can_be_appended_and_read_but_never_updated_or_deleted()
    {
        // NFR-07 / BR-0806 — the EF-level half of append-only. The
        // database-level half is the grant script, which LocalDB cannot
        // demonstrate because the developer connects as the owner.
        await using var context = _fixture.CreateContext();
        var user = await SaveUserAsync(context);

        context.AppendAudit(new AuditLogEntry
        {
            AuditId = Guid.NewGuid(),
            UserId = user.UserId,
            Action = "role.granted",
            EntityType = "USER_ROLE",
            EntityId = Guid.NewGuid(),
            OccurredAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        // A fresh unit of work, the way later code would come back to tamper.
        await using var tamperer = _fixture.CreateContext();
        var entry = await tamperer.AuditEntries.SingleAsync(a => a.UserId == user.UserId);

        tamperer.Entry(entry).State = EntityState.Modified;
        var updateAttempt = await Assert.ThrowsAsync<InvalidOperationException>(
            () => tamperer.SaveChangesAsync());
        Assert.Contains("append-only", updateAttempt.Message, StringComparison.Ordinal);

        tamperer.Entry(entry).State = EntityState.Deleted;
        var deleteAttempt = await Assert.ThrowsAsync<InvalidOperationException>(
            () => tamperer.SaveChangesAsync());
        Assert.Contains("append-only", deleteAttempt.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Reference_values_deactivate_but_never_delete()
    {
        // `10` §3.1 — a historical record whose reason was retired must still
        // resolve to its label, so retirement is is_active, not DELETE.
        await using var context = _fixture.CreateContext();

        context.ReferenceLists.Add(new ReferenceList
        {
            ListCode = "rejection_reason",
            NameAr = "أسباب الرفض",
            NameEn = "Rejection reasons",
            IsEditable = true,
        });
        var value = new ReferenceValue
        {
            ValueId = Guid.NewGuid(),
            ListCode = "rejection_reason",
            Code = "incomplete_file",
            LabelAr = "ملف غير مكتمل",
            LabelEn = "Incomplete file",
            SortOrder = 1,
        };
        context.ReferenceValues.Add(value);
        await context.SaveChangesAsync();

        context.ReferenceValues.Remove(value);
        var deleteAttempt = await Assert.ThrowsAsync<InvalidOperationException>(
            () => context.SaveChangesAsync());
        Assert.Contains("deactivates", deleteAttempt.Message, StringComparison.Ordinal);

        context.Entry(value).State = EntityState.Unchanged;
        value.IsActive = false;
        await context.SaveChangesAsync();

        var reloaded = await context.ReferenceValues.SingleAsync(v => v.ValueId == value.ValueId);
        Assert.False(reloaded.IsActive);
    }

    [Fact]
    public async Task The_role_union_is_closed_in_the_database_itself()
    {
        // BRD §8.8.5 — six roles, and a seventh is a BRD amendment, not an
        // INSERT. Raw SQL on purpose: this must hold for clients that never
        // load the enum.
        await using var context = _fixture.CreateContext();

        var attempt = await Assert.ThrowsAsync<SqlException>(() =>
            context.Database.ExecuteSqlRawAsync(
                "INSERT INTO ROLE (code, name_ar, name_en, is_system) " +
                "VALUES ('superadmin', N'دور مخترع', N'Invented role', 0)"));

        Assert.Contains("CK_ROLE_code", attempt.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task The_data_scope_union_is_closed_in_the_database_itself()
    {
        // BRD §8.8.3 — all / own / centre. Anything else is not a scope.
        await using var context = _fixture.CreateContext();

        // The six roles are seeded by migration (§8.8.5) — use one, don't
        // mint one: the unique code index forbids a second `staff` anyway.
        var role = await context.Roles.SingleAsync(r => r.Code == RoleCode.Staff);
        var permission = new Permission
        {
            CapabilityCode = "CAP-08",
            FeatureCode = "F-TEST-SCOPE",
            NameAr = "صلاحية اختبار",
            NameEn = "Test permission",
        };
        context.Permissions.Add(permission);
        await context.SaveChangesAsync();

        var attempt = await Assert.ThrowsAsync<SqlException>(() =>
            context.Database.ExecuteSqlRawAsync(
                "INSERT INTO ROLE_PERMISSION (role_id, permission_id, data_scope) " +
                $"VALUES ({role.RoleId}, {permission.PermissionId}, 'everything')"));

        Assert.Contains("CK_ROLE_PERMISSION_data_scope", attempt.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Bilingual_pairs_are_both_required()
    {
        // BRD §10.4 — neither language is a translation of the other at read
        // time, so neither column is optional. NOT NULL is the enforcement.
        await using var context = _fixture.CreateContext();

        context.ReferenceLists.Add(new ReferenceList
        {
            ListCode = "withdrawal_reason",
            NameAr = "أسباب الانسحاب",
            NameEn = "Withdrawal reasons",
            IsEditable = true,
        });
        await context.SaveChangesAsync();

        var attempt = await Assert.ThrowsAsync<SqlException>(() =>
            context.Database.ExecuteSqlRawAsync(
                "INSERT INTO REFERENCE_VALUE (value_id, list_code, code, label_ar, label_en, sort_order, is_active) " +
                "VALUES (NEWID(), 'withdrawal_reason', 'personal', N'ظروف شخصية', NULL, 1, 1)"));

        Assert.Contains("label_en", attempt.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task The_same_role_assignment_cannot_be_granted_twice()
    {
        // An unscoped duplicate specifically: five of the six roles carry no
        // centre (P-140), so if the unique index exempted NULL scopes — EF's
        // default filter, removed deliberately — it would exempt almost every
        // row it exists to police.
        await using var context = _fixture.CreateContext();
        var user = await SaveUserAsync(context);
        var admin = await SaveUserAsync(context);

        var role = await context.Roles.SingleAsync(r => r.Code == RoleCode.Trainer);

        context.UserRoles.Add(new UserRole
        {
            UserRoleId = Guid.NewGuid(),
            UserId = user.UserId,
            RoleId = role.RoleId,
            ScopeRef = null,
            AssignedBy = admin.UserId,
            AssignedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        context.UserRoles.Add(new UserRole
        {
            UserRoleId = Guid.NewGuid(),
            UserId = user.UserId,
            RoleId = role.RoleId,
            ScopeRef = null,
            AssignedBy = admin.UserId,
            AssignedAt = DateTime.UtcNow,
        });
        await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
    }

    private static async Task<AppUser> SaveUserAsync(ExpertHubDbContext context)
    {
        var user = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = $"sub-{Guid.NewGuid():N}",
            Email = $"{Guid.NewGuid():N}@example.test",
            FullNameAr = "مستخدم اختبار",
            FullNameEn = "Test user",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            IsEmployee = true,
            CreatedAt = DateTime.UtcNow,
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user;
    }
}
