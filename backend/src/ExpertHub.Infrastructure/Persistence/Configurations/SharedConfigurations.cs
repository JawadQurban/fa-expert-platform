using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * Table and column names follow `10_DATABASE_DESIGN` §3.1–3.2 verbatim
 * (UPPER_SNAKE tables, snake_case columns) — the document is the design being
 * implemented, and a reader moving between it and the schema should never
 * translate names in their head.
 *
 * Every user-facing string is an AR/EN *pair of required columns* (BRD §10.4):
 * neither language is a translation of the other at read time, so neither is
 * optional.
 */

/// <summary>`ATTACHMENT` — `10` §3.1.</summary>
public sealed class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.ToTable("ATTACHMENT");

        builder.HasKey(a => a.AttachmentId);
        builder.Property(a => a.AttachmentId).HasColumnName("attachment_id");
        builder.Property(a => a.FileName).HasColumnName("file_name").HasMaxLength(255);
        builder.Property(a => a.MimeType).HasColumnName("mime_type").HasMaxLength(255);
        builder.Property(a => a.SizeBytes).HasColumnName("size_bytes");
        builder.Property(a => a.StorageRef).HasColumnName("storage_ref").HasMaxLength(400);
        builder.Property(a => a.Checksum).HasColumnName("checksum").HasMaxLength(128);
        builder.Property(a => a.ScanStatus).HasColumnName("scan_status").HasMaxLength(30);
        builder.Property(a => a.UploadedBy).HasColumnName("uploaded_by");
        builder.Property(a => a.UploadedAt).HasColumnName("uploaded_at");

        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(a => a.UploadedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`REFERENCE_LIST` — `10` §3.1.</summary>
public sealed class ReferenceListConfiguration : IEntityTypeConfiguration<ReferenceList>
{
    public void Configure(EntityTypeBuilder<ReferenceList> builder)
    {
        builder.ToTable("REFERENCE_LIST");

        builder.HasKey(l => l.ListCode);
        builder.Property(l => l.ListCode).HasColumnName("list_code").HasMaxLength(50);
        builder.Property(l => l.NameAr).HasColumnName("name_ar").HasMaxLength(200);
        builder.Property(l => l.NameEn).HasColumnName("name_en").HasMaxLength(200);
        builder.Property(l => l.IsEditable).HasColumnName("is_editable");

        // The centre list exists (CAP-08's coordinator scope and CAP-05 both
        // need one to point at) but ships with NO values: the actual centres
        // are organizational data nobody has supplied — the same rule as
        // `DM-GAP-07`. A System Administrator enters them (`BR-0103`).
        builder.HasData(
            new
            {
                ListCode = "centre",
                NameAr = "المراكز",
                NameEn = "Centres",
                IsEditable = true,
            },
            // The OPERATIONAL centres of the approved Assignment Matrix —
            // separate from `centre` above, which is access scope (`P-276`).
            new
            {
                ListCode = AssignmentCentres.ListCode,
                NameAr = "مراكز طلبات الإسناد",
                NameEn = "Assignment request centres",
                IsEditable = false,
            },
            // FAST's countries and nationalities — filled by synchronization
            // only (`FastReferenceDataSync`), so never editable here.
            new
            {
                ListCode = FastReferenceLists.Countries,
                NameAr = "الدول والجنسيات (FAST)",
                NameEn = "Countries and nationalities (FAST)",
                IsEditable = false,
            });
    }
}

/// <summary>`REFERENCE_VALUE` — `10` §3.1. Deactivates, never deletes.</summary>
public sealed class ReferenceValueConfiguration : IEntityTypeConfiguration<ReferenceValue>
{
    public void Configure(EntityTypeBuilder<ReferenceValue> builder)
    {
        builder.ToTable("REFERENCE_VALUE");

        builder.HasKey(v => v.ValueId);
        builder.Property(v => v.ValueId).HasColumnName("value_id");
        builder.Property(v => v.ListCode).HasColumnName("list_code").HasMaxLength(50);
        builder.Property(v => v.Code).HasColumnName("code").HasMaxLength(64);
        builder.Property(v => v.LabelAr).HasColumnName("label_ar").HasMaxLength(300);
        builder.Property(v => v.LabelEn).HasColumnName("label_en").HasMaxLength(300);
        builder.Property(v => v.SortOrder).HasColumnName("sort_order");
        builder.Property(v => v.IsActive).HasColumnName("is_active");
        builder.Property(v => v.Source).HasColumnName("source").HasMaxLength(20);
        builder.Property(v => v.Attributes).HasColumnName("attributes");
        builder.Property(v => v.SyncedAt).HasColumnName("synced_at");

        // One code per list — the pair is how stored records name a value.
        builder.HasIndex(v => new { v.ListCode, v.Code }).IsUnique();

        builder.HasData(AssignmentCentres.Approved.Select((centre, index) => new ReferenceValue
        {
            ValueId = centre.ValueId,
            ListCode = AssignmentCentres.ListCode,
            Code = centre.Code,
            LabelAr = centre.LabelAr,
            LabelEn = centre.LabelAr,
            SortOrder = index + 1,
            IsActive = true,
        }));

        builder.HasOne<ReferenceList>()
            .WithMany()
            .HasForeignKey(v => v.ListCode)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>
/// `DOCUMENT_BLOB` — the default document store's table (`G26` unanswered).
/// </summary>
public sealed class DocumentBlobConfiguration : IEntityTypeConfiguration<DocumentBlob>
{
    public void Configure(EntityTypeBuilder<DocumentBlob> builder)
    {
        builder.ToTable("DOCUMENT_BLOB");
        builder.HasKey(b => b.BlobId);
        builder.Property(b => b.BlobId).HasColumnName("blob_id");
        builder.Property(b => b.Content).HasColumnName("content");
        builder.Property(b => b.MimeType).HasColumnName("mime_type").HasMaxLength(128);
        builder.Property(b => b.FileName).HasColumnName("file_name").HasMaxLength(260);
        builder.Property(b => b.StoredAt).HasColumnName("stored_at");
    }
}

/// <summary>
/// `SESSION_TICKET` — server-side authentication tickets, so the session
/// cookie carries a key instead of a payload.
/// </summary>
public sealed class SessionTicketConfiguration : IEntityTypeConfiguration<SessionTicket>
{
    public void Configure(EntityTypeBuilder<SessionTicket> builder)
    {
        builder.ToTable("SESSION_TICKET");
        builder.HasKey(t => t.SessionId);
        builder.Property(t => t.SessionId).HasColumnName("session_id");
        builder.Property(t => t.Payload).HasColumnName("payload");
        builder.Property(t => t.Subject).HasColumnName("subject").HasMaxLength(256);
        builder.Property(t => t.ExpiresAt).HasColumnName("expires_at");
        builder.Property(t => t.CreatedAt).HasColumnName("created_at");
        // The sweeper's predicate, and the only query that scans.
        builder.HasIndex(t => t.ExpiresAt);
    }
}

/// <summary>`FAST_USER_PROFILE` — the INT-05 base-profile replica.</summary>
public sealed class FastProfileReplicaConfiguration : IEntityTypeConfiguration<FastProfileReplica>
{
    public void Configure(EntityTypeBuilder<FastProfileReplica> builder)
    {
        builder.ToTable("FAST_USER_PROFILE");
        builder.HasKey(p => p.UserId);
        builder.Property(p => p.UserId).HasColumnName("user_id");
        builder.Property(p => p.FastUserId).HasColumnName("fast_user_id").HasMaxLength(64);
        builder.Property(p => p.IdNumber).HasColumnName("id_number").HasMaxLength(40);
        builder.Property(p => p.PassportNumber).HasColumnName("passport_number").HasMaxLength(40);
        builder.Property(p => p.ResidencyNumber).HasColumnName("residency_number").HasMaxLength(40);
        builder.Property(p => p.DateOfBirth).HasColumnName("date_of_birth");
        builder.Property(p => p.FirstNameAr).HasColumnName("first_name_ar").HasMaxLength(200);
        builder.Property(p => p.FirstNameEn).HasColumnName("first_name_en").HasMaxLength(200);
        builder.Property(p => p.NationalityCountryId).HasColumnName("nationality_country_id");
        // `sa` | `gcc` | `other` — the form's own values, resolved from the id
        // above through FAST's country lookup.
        builder.Property(p => p.NationalityCode).HasColumnName("nationality_code").HasMaxLength(16);
        builder.Property(p => p.JobTitle).HasColumnName("job_title").HasMaxLength(200);
        builder.Property(p => p.Organization).HasColumnName("organization").HasMaxLength(200);
        builder.Property(p => p.SocialMediaUrl).HasColumnName("social_media_url").HasMaxLength(500);
        builder.Property(p => p.CanChangeProfile).HasColumnName("can_change_profile");
        builder.Property(p => p.IsOrganizationAdmin).HasColumnName("is_organization_admin");
        builder.Property(p => p.IsOrganizationCoordinator)
            .HasColumnName("is_organization_coordinator");
        builder.Property(p => p.FastRoles).HasColumnName("fast_roles");
        builder.Property(p => p.ExpertCorrector).HasColumnName("expert_corrector");
        builder.Property(p => p.ExpertReviewer).HasColumnName("expert_reviewer");
        builder.Property(p => p.ExpertQuestionAuthor).HasColumnName("expert_question_author");
        builder.Property(p => p.BankFields).HasColumnName("bank_fields");
        // The four qualification collections, stored as received. No length
        // cap: these are whole collections, and a truncated JSON payload is
        // not a smaller payload, it is an unparseable one.
        builder.Property(p => p.QualificationsEducation)
            .HasColumnName("qualifications_education");
        builder.Property(p => p.QualificationsPracticalExperience)
            .HasColumnName("qualifications_practical_experience");
        builder.Property(p => p.QualificationsProfessional)
            .HasColumnName("qualifications_professional");
        builder.Property(p => p.QualificationsTrainingCourses)
            .HasColumnName("qualifications_training_courses");
        builder.Property(p => p.Contracts).HasColumnName("contracts");
        builder.Property(p => p.ContractsSyncedAt).HasColumnName("contracts_synced_at");
        builder.Property(p => p.QualificationsSyncedAt)
            .HasColumnName("qualifications_synced_at");
        builder.Property(p => p.LastSyncedAt).HasColumnName("last_synced_at");
        builder.HasOne<AppUser>().WithMany().HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`REFERENCE_COUNTER` — one row per reference prefix; see `ReferenceNumbers`.</summary>
public sealed class ReferenceCounterConfiguration : IEntityTypeConfiguration<ReferenceCounter>
{
    public void Configure(EntityTypeBuilder<ReferenceCounter> builder)
    {
        builder.ToTable("REFERENCE_COUNTER");

        builder.HasKey(c => c.Prefix);
        builder.Property(c => c.Prefix).HasColumnName("prefix").HasMaxLength(30);
        builder.Property(c => c.LastValue).HasColumnName("last_value");
    }
}
