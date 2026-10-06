using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * CAP-08 — identity, roles, permissions, audit (`10` §3.2).
 *
 * What is deliberately ABSENT here is the point (`BR-0801`, P-137): there is
 * no user→permission table, so a direct grant to a person cannot be
 * represented — the rule would have to be invented before it could be broken.
 *
 * The closed unions (six role codes, three data scopes) are enforced twice:
 * as C# enums with explicit string mappings, and as CHECK constraints so a
 * hand-written INSERT obeys the same rule the code does.
 */

/// <summary>`APP_USER` — `10` §3.2. Holds no credential of any kind (`BR-0808`).</summary>
public sealed class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.ToTable("APP_USER");

        builder.HasKey(u => u.UserId);
        builder.Property(u => u.UserId).HasColumnName("user_id");
        builder.Property(u => u.ExternalIdentityId).HasColumnName("external_identity_id").HasMaxLength(200);
        builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(320);
        builder.Property(u => u.Phone).HasColumnName("phone").HasMaxLength(30);
        builder.Property(u => u.FullNameAr).HasColumnName("full_name_ar").HasMaxLength(200);
        builder.Property(u => u.FullNameEn).HasColumnName("full_name_en").HasMaxLength(200);
        builder.Property(u => u.PreferredCommunicationLanguage)
            .HasColumnName("preferred_communication_language")
            .HasMaxLength(5);
        builder.Property(u => u.PreferredUiLanguage).HasColumnName("preferred_ui_language").HasMaxLength(5);
        builder.Property(u => u.IsActive).HasColumnName("is_active");
        builder.Property(u => u.IsEmployee).HasColumnName("is_employee");
        builder.Property(u => u.LastLoginAt).HasColumnName("last_login_at");
        builder.Property(u => u.CreatedAt).HasColumnName("created_at");

        // One platform user per asserted identity — INT-01 maps a subject to
        // exactly one row.
        builder.HasIndex(u => u.ExternalIdentityId).IsUnique();
    }
}

/// <summary>`ROLE` — `10` §3.2. Six rows, fixed by BRD §8.8.5 and seeded.</summary>
/// <remarks>
/// ⚠️ The sixth code is <c>system_administrator</c> — the frontend contract's
/// spelling (`ROLE_CODES`), which outranks `10_DATABASE_DESIGN`'s original
/// <c>sysadmin</c> (playbook source map, rank 1; the document is corrected).
/// </remarks>
public sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable(
            "ROLE",
            t => t.HasCheckConstraint(
                "CK_ROLE_code",
                "[code] IN ('trainer', 'staff', 'manager', 'centre_coordinator', 'system_administrator', 'executive', 'individual')"));

        builder.HasKey(r => r.RoleId);
        builder.Property(r => r.RoleId).HasColumnName("role_id");
        builder.Property(r => r.Code)
            .HasColumnName("code")
            .HasMaxLength(30)
            .HasConversion(
                code => RoleCodes.ToWire(code),
                value => RoleCodes.Strings.Single(pair => pair.Value == value).Key);
        builder.Property(r => r.NameAr).HasColumnName("name_ar").HasMaxLength(200);
        builder.Property(r => r.NameEn).HasColumnName("name_en").HasMaxLength(200);
        builder.Property(r => r.DescriptionAr).HasColumnName("description_ar").HasMaxLength(500);
        builder.Property(r => r.DescriptionEn).HasColumnName("description_en").HasMaxLength(500);
        builder.Property(r => r.IsSystem).HasColumnName("is_system");

        builder.HasIndex(r => r.Code).IsUnique();

        // §8.8.5 — the six are BRD facts, not configuration. Seeded by
        // migration; there is still no create-role path anywhere.
        builder.HasData(AccessSeedData.Roles);
    }
}

/// <summary>`PERMISSION` — `10` §3.2. The BRD's own feature codes (§8.8.4).</summary>
public sealed class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("PERMISSION");

        builder.HasKey(p => p.PermissionId);
        builder.Property(p => p.PermissionId).HasColumnName("permission_id");
        builder.Property(p => p.CapabilityCode).HasColumnName("capability_code").HasMaxLength(10);
        builder.Property(p => p.FeatureCode).HasColumnName("feature_code").HasMaxLength(20);
        builder.Property(p => p.NameAr).HasColumnName("name_ar").HasMaxLength(300);
        builder.Property(p => p.NameEn).HasColumnName("name_en").HasMaxLength(300);
        builder.Property(p => p.LabelNeedsVerification).HasColumnName("label_needs_verification");

        builder.HasIndex(p => p.FeatureCode).IsUnique();

        // §8.8.4 — the permission list IS the BRD's feature list: 58 rows,
        // seeded. What is NOT seeded is any grant (`DM-GAP-07`).
        builder.HasData(AccessSeedData.Permissions);
    }
}

/// <summary>`ROLE_PERMISSION` — `10` §3.2, the only grant path (`BR-0801`).</summary>
public sealed class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable(
            "ROLE_PERMISSION",
            t => t.HasCheckConstraint(
                "CK_ROLE_PERMISSION_data_scope",
                "[data_scope] IN ('all', 'own', 'centre')"));

        builder.HasKey(rp => new { rp.RoleId, rp.PermissionId });
        builder.Property(rp => rp.RoleId).HasColumnName("role_id");
        builder.Property(rp => rp.PermissionId).HasColumnName("permission_id");
        // The DRAFT default matrix (P-190) — enforced, and every row editable
        // in the CAP-08 screen without a deployment (`BR-0203`).
        builder.HasData(AccessGrantSeedData.Grants);

        builder.Property(rp => rp.Scope)
            .HasColumnName("data_scope")
            .HasMaxLength(10)
            .HasConversion(
                scope => DataScopes.ToWire(scope),
                value => DataScopes.Strings.Single(pair => pair.Value == value).Key);

        builder.HasOne<Role>()
            .WithMany()
            .HasForeignKey(rp => rp.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Permission>()
            .WithMany()
            .HasForeignKey(rp => rp.PermissionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`USER_ROLE` — `10` §3.2.</summary>
public sealed class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.ToTable("USER_ROLE");

        builder.HasKey(ur => ur.UserRoleId);
        builder.Property(ur => ur.UserRoleId).HasColumnName("user_role_id");
        builder.Property(ur => ur.UserId).HasColumnName("user_id");
        builder.Property(ur => ur.RoleId).HasColumnName("role_id");
        builder.Property(ur => ur.ScopeRef).HasColumnName("scope_ref");
        builder.Property(ur => ur.AssignedBy).HasColumnName("assigned_by");
        builder.Property(ur => ur.AssignedAt).HasColumnName("assigned_at");

        // The same assignment twice is a data error, not a stronger grant.
        // SQL Server treats NULLs as equal in a unique index, so the unscoped
        // duplicate is caught exactly like the scoped one — but only without
        // EF's default `[scope_ref] IS NOT NULL` filter, which would exempt
        // precisely the rows five of the six roles produce (P-140: only the
        // centre coordinator carries a scope). HasFilter(null) removes it.
        builder.HasIndex(ur => new { ur.UserId, ur.RoleId, ur.ScopeRef })
            .IsUnique()
            .HasFilter(null);

        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Role>()
            .WithMany()
            .HasForeignKey(ur => ur.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(ur => ur.AssignedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`AUDIT_LOG` — `10` §3.2, append-only (`NFR-07`).</summary>
public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLogEntry>
{
    public void Configure(EntityTypeBuilder<AuditLogEntry> builder)
    {
        builder.ToTable("AUDIT_LOG");

        builder.HasKey(a => a.AuditId);
        builder.Property(a => a.AuditId).HasColumnName("audit_id");
        builder.Property(a => a.UserId).HasColumnName("user_id");
        builder.Property(a => a.Action).HasColumnName("action").HasMaxLength(100);
        builder.Property(a => a.EntityType).HasColumnName("entity_type").HasMaxLength(100);
        builder.Property(a => a.EntityId).HasColumnName("entity_id");
        builder.Property(a => a.BeforeState).HasColumnName("before_state");
        builder.Property(a => a.AfterState).HasColumnName("after_state");
        builder.Property(a => a.IpAddress).HasColumnName("ip_address").HasMaxLength(45);
        builder.Property(a => a.OccurredAt).HasColumnName("occurred_at");

        builder.HasIndex(a => a.OccurredAt);
        builder.HasIndex(a => new { a.EntityType, a.EntityId });

        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
