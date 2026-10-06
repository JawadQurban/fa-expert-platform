using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * CAP-03 — `10` §3.5, migration 07. Recorded deviations: the party is
 * `APP_USER` (no TRAINER_PROFILE until BE-09); `AGREEMENT_DOCUMENT` is not
 * built (`G26` — nothing can store a document; file names stand in); the
 * applicant's J-11 decision lives on `AGREEMENT` (the applicant is not an
 * internal signatory row); `expired` is derived from `ends_at`, never stored.
 */

/// <summary>`AGREEMENT`.</summary>
public sealed class AgreementConfiguration : IEntityTypeConfiguration<Agreement>
{
    public void Configure(EntityTypeBuilder<Agreement> builder)
    {
        builder.ToTable("AGREEMENT");
        builder.HasKey(a => a.AgreementId);
        builder.Property(a => a.AgreementId).HasColumnName("agreement_id");
        builder.Property(a => a.TrainerUserId).HasColumnName("trainer_user_id");
        builder.Property(a => a.ApplicationId).HasColumnName("application_id");
        builder.Property(a => a.TemplateId).HasColumnName("template_id");
        builder.Property(a => a.Reference).HasColumnName("reference").HasMaxLength(20);
        builder.Property(a => a.Status).HasColumnName("status").HasMaxLength(30);
        builder.Property(a => a.StartsAt).HasColumnName("starts_at");
        builder.Property(a => a.EndsAt).HasColumnName("ends_at");
        builder.Property(a => a.TermYears).HasColumnName("term_years");
        builder.Property(a => a.RenewalCount).HasColumnName("renewal_count");
        builder.Property(a => a.FieldValues).HasColumnName("field_values");
        builder.Property(a => a.SentToApplicantAt).HasColumnName("sent_to_applicant_at");
        builder.Property(a => a.ApplicantDecisionKind).HasColumnName("applicant_decision").HasMaxLength(30);
        builder.Property(a => a.ApplicantDecisionNote).HasColumnName("applicant_decision_note");
        builder.Property(a => a.ApplicantSignatureName).HasColumnName("applicant_signature_name").HasMaxLength(200);
        builder.Property(a => a.ApplicantDecidedAt).HasColumnName("applicant_decided_at");
        builder.Property(a => a.CreatedBy).HasColumnName("created_by");
        builder.Property(a => a.CreatedAt).HasColumnName("created_at");
        builder.Property(a => a.ApplicantDocumentVersionId).HasColumnName("applicant_document_version_id");
        builder.Property(a => a.ApplicantSignatureMethod).HasColumnName("applicant_signature_method").HasMaxLength(30);
        builder.HasIndex(a => a.Reference).IsUnique();
        builder.HasIndex(a => a.ApplicationId).IsUnique();
        builder.HasIndex(a => a.TrainerUserId);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(a => a.TrainerUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Application>().WithMany().HasForeignKey(a => a.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<AgreementTemplateRecord>().WithMany().HasForeignKey(a => a.TemplateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`AGREEMENT_SERVICE`.</summary>
public sealed class AgreementServiceRowConfiguration : IEntityTypeConfiguration<AgreementServiceRow>
{
    public void Configure(EntityTypeBuilder<AgreementServiceRow> builder)
    {
        builder.ToTable("AGREEMENT_SERVICE");
        builder.HasKey(s => s.AgreementServiceId);
        builder.Property(s => s.AgreementServiceId).HasColumnName("agreement_service_id");
        builder.Property(s => s.AgreementId).HasColumnName("agreement_id");
        builder.Property(s => s.Service).HasColumnName("service").HasMaxLength(30);
        builder.HasIndex(s => new { s.AgreementId, s.Service }).IsUnique();
        builder.HasOne<Agreement>().WithMany().HasForeignKey(s => s.AgreementId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`ADDENDUM` (`BR-0305`).</summary>
public sealed class AddendumRecordConfiguration : IEntityTypeConfiguration<AddendumRecord>
{
    public void Configure(EntityTypeBuilder<AddendumRecord> builder)
    {
        builder.ToTable("ADDENDUM");
        builder.HasKey(a => a.AddendumId);
        builder.Property(a => a.AddendumId).HasColumnName("addendum_id");
        builder.Property(a => a.AgreementId).HasColumnName("agreement_id");
        builder.Property(a => a.Service).HasColumnName("service").HasMaxLength(30);
        builder.Property(a => a.DocumentFileName).HasColumnName("document_file_name").HasMaxLength(255);
        builder.Property(a => a.AttachmentId).HasColumnName("attachment_id");
        builder.Property(a => a.ServiceRequestId).HasColumnName("service_request_id");
        builder.Property(a => a.ApprovedBy).HasColumnName("approved_by");
        builder.Property(a => a.ApprovedAt).HasColumnName("approved_at");
        builder.HasOne<Agreement>().WithMany().HasForeignKey(a => a.AgreementId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<ServiceRequest>().WithMany().HasForeignKey(a => a.ServiceRequestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`AGREEMENT_TEMPLATE` — seeded with the DM-GAP-16 draft.</summary>
public sealed class AgreementTemplateRecordConfiguration : IEntityTypeConfiguration<AgreementTemplateRecord>
{
    public void Configure(EntityTypeBuilder<AgreementTemplateRecord> builder)
    {
        builder.ToTable("AGREEMENT_TEMPLATE");
        builder.HasKey(t => t.TemplateId);
        builder.Property(t => t.TemplateId).HasColumnName("template_id");
        builder.Property(t => t.Name).HasColumnName("name").HasMaxLength(200);
        builder.Property(t => t.Version).HasColumnName("version").HasMaxLength(50);
        builder.Property(t => t.BodyText).HasColumnName("body_text");
        builder.Property(t => t.FieldMap).HasColumnName("field_map");
        builder.Property(t => t.Services).HasColumnName("services").HasMaxLength(200);
        builder.Property(t => t.IsActive).HasColumnName("is_active");
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at");
        builder.Property(t => t.UpdatedBy).HasColumnName("updated_by");
        builder.HasData(AgreementSeedData.Templates);
    }
}

/// <summary>`SIGNING_SEQUENCE` — distinct from the committee's (J-10/F2/AC-3).</summary>
public sealed class SigningSequenceRecordConfiguration : IEntityTypeConfiguration<SigningSequenceRecord>
{
    public void Configure(EntityTypeBuilder<SigningSequenceRecord> builder)
    {
        builder.ToTable("SIGNING_SEQUENCE");
        builder.HasKey(s => s.SequenceId);
        builder.Property(s => s.SequenceId).HasColumnName("sequence_id");
        builder.Property(s => s.AgreementId).HasColumnName("agreement_id");
        builder.Property(s => s.Status).HasColumnName("status").HasMaxLength(30);
        builder.Property(s => s.CurrentStepIndex).HasColumnName("current_step_index");
        builder.Property(s => s.IsComplete).HasColumnName("is_complete");
        builder.Property(s => s.CreatedBy).HasColumnName("created_by");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at");
        builder.Property(s => s.VoidedAt).HasColumnName("voided_at");
        // Not unique any more: a restarted run voids the previous chain and
        // keeps it, rather than deleting it with its signatures.
        builder.HasIndex(s => s.AgreementId);
        /*
         * ⚠️ …but at most ONE UN-VOIDED chain, which is what dropping the plain
         * unique index lost. Forming a sequence twice left two `in-progress`
         * chains on one agreement; voiding walks the newest, so the older one
         * became "the active chain" and could be completed and sent to the
         * applicant while the agreement was still in formation.
         *
         * Filtered on `voided_at IS NULL`, so it keeps every superseded chain
         * with its approvals and signatures — exactly the reason the comment
         * above gives for the unique index having gone.
         */
        // Named, so the plain `agreement_id` lookup index above survives.
        builder.HasIndex(s => s.AgreementId, "UX_SIGNING_SEQUENCE_agreement_live")
            .IsUnique()
            .HasFilter("[voided_at] IS NULL");
        builder.HasOne<Agreement>().WithMany().HasForeignKey(s => s.AgreementId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`SIGNATORY`.</summary>
public sealed class SignatoryRecordConfiguration : IEntityTypeConfiguration<SignatoryRecord>
{
    public void Configure(EntityTypeBuilder<SignatoryRecord> builder)
    {
        builder.ToTable("SIGNATORY");
        builder.HasKey(s => s.SignatoryId);
        builder.Property(s => s.SignatoryId).HasColumnName("signatory_id");
        builder.Property(s => s.SequenceId).HasColumnName("sequence_id");
        builder.Property(s => s.UserId).HasColumnName("user_id");
        builder.Property(s => s.OrderIndex).HasColumnName("order_index");
        builder.Property(s => s.Obligation).HasColumnName("obligation").HasMaxLength(20);
        builder.Property(s => s.IsSigner).HasColumnName("is_signer");
        builder.Property(s => s.Decision).HasColumnName("decision").HasMaxLength(30);
        builder.Property(s => s.Note).HasColumnName("note");
        builder.Property(s => s.ActedAt).HasColumnName("acted_at");
        builder.Property(s => s.DocumentVersionId).HasColumnName("document_version_id");
        builder.HasIndex(s => new { s.SequenceId, s.OrderIndex }).IsUnique();
        builder.HasOne<SigningSequenceRecord>().WithMany().HasForeignKey(s => s.SequenceId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`AGREEMENT_DOCUMENT_VERSION` — immutable content versions.</summary>
public sealed class AgreementDocumentVersionConfiguration : IEntityTypeConfiguration<AgreementDocumentVersion>
{
    public void Configure(EntityTypeBuilder<AgreementDocumentVersion> builder)
    {
        builder.ToTable("AGREEMENT_DOCUMENT_VERSION");
        builder.HasKey(v => v.DocumentVersionId);
        builder.Property(v => v.DocumentVersionId).HasColumnName("document_version_id");
        builder.Property(v => v.AgreementId).HasColumnName("agreement_id");
        builder.Property(v => v.VersionNumber).HasColumnName("version_number");
        builder.Property(v => v.TemplateId).HasColumnName("template_id");
        builder.Property(v => v.TemplateName).HasColumnName("template_name").HasMaxLength(200);
        builder.Property(v => v.TemplateVersion).HasColumnName("template_version").HasMaxLength(100);
        builder.Property(v => v.BodyText).HasColumnName("body_text");
        builder.Property(v => v.Fields).HasColumnName("fields");
        builder.Property(v => v.MergedData).HasColumnName("merged_data");
        builder.Property(v => v.ContentHash).HasColumnName("content_hash").HasMaxLength(64);
        builder.Property(v => v.CreatedBy).HasColumnName("created_by");
        builder.Property(v => v.CreatedAt).HasColumnName("created_at");
        builder.HasIndex(v => new { v.AgreementId, v.VersionNumber }).IsUnique();
        builder.HasOne<Agreement>().WithMany().HasForeignKey(v => v.AgreementId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`AGREEMENT_TEMPLATE_VERSION` — what each template save replaced.</summary>
public sealed class AgreementTemplateVersionConfiguration : IEntityTypeConfiguration<AgreementTemplateVersion>
{
    public void Configure(EntityTypeBuilder<AgreementTemplateVersion> builder)
    {
        builder.ToTable("AGREEMENT_TEMPLATE_VERSION");
        builder.HasKey(v => v.TemplateVersionId);
        builder.Property(v => v.TemplateVersionId).HasColumnName("template_version_id");
        builder.Property(v => v.TemplateId).HasColumnName("template_id");
        builder.Property(v => v.Version).HasColumnName("version").HasMaxLength(100);
        builder.Property(v => v.BodyText).HasColumnName("body_text");
        builder.Property(v => v.FieldMap).HasColumnName("field_map");
        builder.Property(v => v.RecordedAt).HasColumnName("recorded_at");
        builder.Property(v => v.RecordedBy).HasColumnName("recorded_by");
        builder.HasIndex(v => new { v.TemplateId, v.RecordedAt });
        builder.HasOne<AgreementTemplateRecord>().WithMany().HasForeignKey(v => v.TemplateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`E_SIGNATURE` — the typed-name stand-in (`G26`).</summary>
public sealed class ESignatureRecordConfiguration : IEntityTypeConfiguration<ESignatureRecord>
{
    public void Configure(EntityTypeBuilder<ESignatureRecord> builder)
    {
        builder.ToTable("E_SIGNATURE");
        builder.HasKey(s => s.SignatureId);
        builder.Property(s => s.SignatureId).HasColumnName("signature_id");
        builder.Property(s => s.SignatoryId).HasColumnName("signatory_id");
        builder.Property(s => s.SignatureName).HasColumnName("signature_name").HasMaxLength(200);
        builder.Property(s => s.IpAddress).HasColumnName("ip_address").HasMaxLength(50);
        builder.Property(s => s.SignedAt).HasColumnName("signed_at");
        builder.Property(s => s.Method).HasColumnName("method").HasMaxLength(30)
            .HasDefaultValue(SignatureMethods.InternalAcceptance);
        builder.HasIndex(s => s.SignatoryId).IsUnique();
        builder.HasOne<SignatoryRecord>().WithMany().HasForeignKey(s => s.SignatoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`AGREEMENT_EVENT` — the lifecycle history.</summary>
public sealed class AgreementEventConfiguration : IEntityTypeConfiguration<AgreementEvent>
{
    public void Configure(EntityTypeBuilder<AgreementEvent> builder)
    {
        builder.ToTable("AGREEMENT_EVENT");
        builder.HasKey(e => e.EventId);
        builder.Property(e => e.EventId).HasColumnName("event_id");
        builder.Property(e => e.AgreementId).HasColumnName("agreement_id");
        builder.Property(e => e.Kind).HasColumnName("kind").HasMaxLength(30);
        builder.Property(e => e.TermYears).HasColumnName("term_years");
        builder.Property(e => e.Note).HasColumnName("note");
        builder.Property(e => e.ActorUserId).HasColumnName("actor_user_id");
        builder.Property(e => e.OccurredAt).HasColumnName("occurred_at");
        builder.HasIndex(e => new { e.AgreementId, e.OccurredAt });
        builder.HasOne<Agreement>().WithMany().HasForeignKey(e => e.AgreementId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(e => e.ActorUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`BANK_DATA` — J-09/F6, one row per user.</summary>
public sealed class BankDataRecordConfiguration : IEntityTypeConfiguration<BankDataRecord>
{
    public void Configure(EntityTypeBuilder<BankDataRecord> builder)
    {
        builder.ToTable("BANK_DATA");
        builder.HasKey(b => b.UserId);
        builder.Property(b => b.UserId).HasColumnName("user_id");
        builder.Property(b => b.Fields).HasColumnName("fields");
        builder.Property(b => b.RequestedAt).HasColumnName("requested_at");
        builder.Property(b => b.CompletedAt).HasColumnName("completed_at");
        builder.HasOne<AppUser>().WithOne().HasForeignKey<BankDataRecord>(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
