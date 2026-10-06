using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * CAP-04 — `10` §3.6, migration 09. Recorded deviations: the FAST-mastered
 * sub-entities (EDUCATION, PROFESSIONAL_CERTIFICATION, …) are not built —
 * the contract renders a flat `fieldValues` map over the shared application
 * schema, and the replica tables arrive with the INT-05a feed that would
 * populate them (INT-05a); and `BANK_DATA` already exists from BE-08,
 * keyed by user rather than trainer, because J-09/F6 collects it BEFORE the
 * trainer profile is created.
 */

/// <summary>`TRAINER_PROFILE`.</summary>
public sealed class TrainerProfileConfiguration : IEntityTypeConfiguration<TrainerProfile>
{
    public void Configure(EntityTypeBuilder<TrainerProfile> builder)
    {
        builder.ToTable("TRAINER_PROFILE");
        builder.HasKey(p => p.TrainerId);
        builder.Property(p => p.TrainerId).HasColumnName("trainer_id");
        builder.Property(p => p.UserId).HasColumnName("user_id");
        builder.Property(p => p.ApplicationId).HasColumnName("application_id");
        builder.Property(p => p.FastUserProfileId).HasColumnName("fast_user_profile_id").HasMaxLength(100);
        builder.Property(p => p.FileStatus).HasColumnName("file_status").HasMaxLength(20);
        builder.Property(p => p.VisibilityConsent).HasColumnName("visibility_consent");
        builder.Property(p => p.PhotoAttachmentId).HasColumnName("photo_attachment_id");
        builder.Property(p => p.CreatedAt).HasColumnName("created_at");

        // One trainer record per person, and per application.
        builder.HasIndex(p => p.UserId).IsUnique();
        builder.HasIndex(p => p.ApplicationId).IsUnique();
        builder.HasOne<AppUser>().WithMany().HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Application>().WithMany().HasForeignKey(p => p.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`TRAINER_SERVICE` — the accreditation layer (`BR-0403`).</summary>
public sealed class TrainerServiceRowConfiguration : IEntityTypeConfiguration<TrainerServiceRow>
{
    public void Configure(EntityTypeBuilder<TrainerServiceRow> builder)
    {
        builder.ToTable("TRAINER_SERVICE");
        builder.HasKey(s => s.TrainerServiceId);
        builder.Property(s => s.TrainerServiceId).HasColumnName("trainer_service_id");
        builder.Property(s => s.TrainerId).HasColumnName("trainer_id");
        builder.Property(s => s.Service).HasColumnName("service").HasMaxLength(30);
        builder.Property(s => s.Classification).HasColumnName("classification").HasMaxLength(20);
        builder.Property(s => s.AccreditedAt).HasColumnName("accredited_at");
        builder.Property(s => s.Status).HasColumnName("status").HasMaxLength(20);
        builder.HasIndex(s => new { s.TrainerId, s.Service }).IsUnique();
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(s => s.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`TRAINER_FIELD_VALUE` — the shared schema's values (`BR-0404`).</summary>
public sealed class TrainerFieldValueConfiguration : IEntityTypeConfiguration<TrainerFieldValue>
{
    public void Configure(EntityTypeBuilder<TrainerFieldValue> builder)
    {
        builder.ToTable("TRAINER_FIELD_VALUE");
        builder.HasKey(v => v.ValueId);
        builder.Property(v => v.ValueId).HasColumnName("value_id");
        builder.Property(v => v.TrainerId).HasColumnName("trainer_id");
        builder.Property(v => v.FieldCode).HasColumnName("field_code").HasMaxLength(80);
        builder.Property(v => v.Value).HasColumnName("value");
        builder.Property(v => v.EntryId).HasColumnName("entry_id").HasMaxLength(80);
        builder.Property(v => v.EntryIndex).HasColumnName("entry_index").HasDefaultValue(0);
        // One value per field PER ENTRY — the old constraint for every
        // single-entry section, which keeps entry 0.
        builder.HasIndex(v => new { v.TrainerId, v.FieldCode, v.EntryIndex }).IsUnique();
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(v => v.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`PROFILE_CHANGE_REQUEST` — write-through's pending half (`P-135`).</summary>
public sealed class ProfileChangeRequestConfiguration : IEntityTypeConfiguration<ProfileChangeRequest>
{
    public void Configure(EntityTypeBuilder<ProfileChangeRequest> builder)
    {
        builder.ToTable("PROFILE_CHANGE_REQUEST");
        builder.HasKey(r => r.ChangeRequestId);
        builder.Property(r => r.ChangeRequestId).HasColumnName("change_request_id");
        builder.Property(r => r.TrainerId).HasColumnName("trainer_id");
        builder.Property(r => r.FieldCode).HasColumnName("field_code").HasMaxLength(80);
        builder.Property(r => r.ProposedValue).HasColumnName("proposed_value");
        builder.Property(r => r.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(r => r.RequestedAt).HasColumnName("requested_at");
        builder.Property(r => r.ResolvedAt).HasColumnName("resolved_at");
        builder.HasIndex(r => new { r.TrainerId, r.FieldCode, r.Status });
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(r => r.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`TRAINER_RECORD` — the Academy record.</summary>
public sealed class TrainerRecordConfiguration : IEntityTypeConfiguration<TrainerRecord>
{
    public void Configure(EntityTypeBuilder<TrainerRecord> builder)
    {
        builder.ToTable("TRAINER_RECORD");
        builder.HasKey(r => r.RecordId);
        builder.Property(r => r.RecordId).HasColumnName("record_id");
        builder.Property(r => r.TrainerId).HasColumnName("trainer_id");
        builder.Property(r => r.ProgramNameAr).HasColumnName("program_name_ar").HasMaxLength(300);
        builder.Property(r => r.ProgramNameEn).HasColumnName("program_name_en").HasMaxLength(300);
        builder.Property(r => r.Role).HasColumnName("role").HasMaxLength(100);
        builder.Property(r => r.DeliveredFrom).HasColumnName("delivered_from");
        builder.Property(r => r.DeliveredTo).HasColumnName("delivered_to");
        builder.HasIndex(r => r.TrainerId);
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(r => r.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`RATING_SOURCE_RECORD` — MTM's immutable original (`02D`).</summary>
public sealed class RatingSourceRecordConfiguration : IEntityTypeConfiguration<RatingSourceRecord>
{
    public void Configure(EntityTypeBuilder<RatingSourceRecord> builder)
    {
        builder.ToTable("RATING_SOURCE_RECORD");
        builder.HasKey(r => r.RecordId);
        builder.Property(r => r.RecordId).HasColumnName("record_id");
        builder.Property(r => r.TrainerId).HasColumnName("trainer_id");
        builder.Property(r => r.MtmRecordId).HasColumnName("mtm_record_id").HasMaxLength(100);
        builder.Property(r => r.RawValue).HasColumnName("raw_value").HasPrecision(5, 2);
        builder.Property(r => r.ScaleLow).HasColumnName("scale_low");
        builder.Property(r => r.ScaleHigh).HasColumnName("scale_high");
        builder.Property(r => r.ResponseCount).HasColumnName("response_count");
        builder.Property(r => r.SourceDate).HasColumnName("source_date");
        builder.Property(r => r.ReceivedAt).HasColumnName("received_at");
        builder.HasIndex(r => new { r.TrainerId, r.MtmRecordId }).IsUnique();
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(r => r.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`TRAINER_RATING` — Expert Hub's calculated figures (`02D`).</summary>
public sealed class TrainerRatingConfiguration : IEntityTypeConfiguration<TrainerRating>
{
    public void Configure(EntityTypeBuilder<TrainerRating> builder)
    {
        builder.ToTable("TRAINER_RATING");
        builder.HasKey(r => r.RatingId);
        builder.Property(r => r.RatingId).HasColumnName("rating_id");
        builder.Property(r => r.TrainerId).HasColumnName("trainer_id");
        builder.Property(r => r.Scope).HasColumnName("scope").HasMaxLength(20);
        builder.Property(r => r.RecordId).HasColumnName("record_id");
        builder.Property(r => r.CalculatedValue).HasColumnName("calculated_value").HasPrecision(4, 2);
        builder.Property(r => r.CalculationVersion).HasColumnName("calculation_version").HasMaxLength(50);
        builder.Property(r => r.CalculatedAt).HasColumnName("calculated_at");
        builder.HasIndex(r => new { r.TrainerId, r.Scope });
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(r => r.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<TrainerRecord>().WithMany().HasForeignKey(r => r.RecordId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`TRAINER_BIO` — the short bio, one row per trainer (`P-331`).</summary>
public sealed class TrainerBioConfiguration : IEntityTypeConfiguration<TrainerBio>
{
    /// <summary>The longest bio accepted — a short bio, not a CV.</summary>
    public const int MaxLength = 600;

    public void Configure(EntityTypeBuilder<TrainerBio> builder)
    {
        builder.ToTable("TRAINER_BIO");
        builder.HasKey(b => b.TrainerId);
        builder.Property(b => b.TrainerId).HasColumnName("trainer_id");
        builder.Property(b => b.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(b => b.Draft).HasColumnName("draft").HasMaxLength(MaxLength);
        builder.Property(b => b.DraftSource).HasColumnName("draft_source").HasMaxLength(10);
        builder.Property(b => b.Revision).HasColumnName("revision");
        builder.Property(b => b.ReviewNote).HasColumnName("review_note").HasMaxLength(1000);
        builder.Property(b => b.SubmittedAt).HasColumnName("submitted_at");
        builder.Property(b => b.Published).HasColumnName("published").HasMaxLength(MaxLength);
        builder.Property(b => b.PublishedAt).HasColumnName("published_at");
        builder.Property(b => b.ReviewedBy).HasColumnName("reviewed_by");
        builder.Property(b => b.ReviewedAt).HasColumnName("reviewed_at");
        builder.Property(b => b.UpdatedAt).HasColumnName("updated_at");

        // The review queue reads by status.
        builder.HasIndex(b => b.Status);
        builder.HasOne<TrainerProfile>().WithOne().HasForeignKey<TrainerBio>(b => b.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(b => b.ReviewedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
