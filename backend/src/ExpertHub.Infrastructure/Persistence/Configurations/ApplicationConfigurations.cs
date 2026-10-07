using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * CAP-01 — `10` §3.3, migration 05. The schema tables carry the owner's
 * DM-GAP-01 workbook as data (`BR-0103`, P-172); the application tables hold
 * the per-service grain (`BR-0403`) and the structural `BR-0107` (a draft has
 * no reference — nullable, unique when present).
 */

/// <summary>`FORM_SCHEMA` — versioned; seeded with the DM-GAP-01 delivery.</summary>
public sealed class FormSchemaConfiguration : IEntityTypeConfiguration<FormSchema>
{
    public void Configure(EntityTypeBuilder<FormSchema> builder)
    {
        builder.ToTable("FORM_SCHEMA");

        builder.HasKey(s => s.SchemaVersion);
        builder.Property(s => s.SchemaVersion).HasColumnName("schema_version").HasMaxLength(50);
        builder.Property(s => s.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(s => s.SelectableServices).HasColumnName("selectable_services").HasMaxLength(200);
        builder.Property(s => s.PublishedAt).HasColumnName("published_at");

        builder.HasData([.. ApplicationSeedData.Schemas, ApplicationSchemadmgap0120260921.Schema, ApplicationSchemadmgap0120260928.Schema, ApplicationSchemadmgap0120260929.Schema, ApplicationSchemadmgap0120261007.Schema]);
    }
}

/// <summary>`FORM_SECTION`.</summary>
public sealed class FormSectionConfiguration : IEntityTypeConfiguration<FormSection>
{
    public void Configure(EntityTypeBuilder<FormSection> builder)
    {
        builder.ToTable("FORM_SECTION");

        builder.HasKey(s => s.SectionId);
        builder.Property(s => s.SectionId).HasColumnName("section_id");
        builder.Property(s => s.SchemaVersion).HasColumnName("schema_version").HasMaxLength(50);
        builder.Property(s => s.SectionCode).HasColumnName("section_code").HasMaxLength(50);
        builder.Property(s => s.TitleAr).HasColumnName("title_ar").HasMaxLength(200);
        builder.Property(s => s.TitleEn).HasColumnName("title_en").HasMaxLength(200);
        builder.Property(s => s.OrderIndex).HasColumnName("order_index");

        builder.HasIndex(s => new { s.SchemaVersion, s.SectionCode }).IsUnique();
        builder.HasOne<FormSchema>().WithMany().HasForeignKey(s => s.SchemaVersion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(s => s.Repeatable).HasColumnName("repeatable");
        builder.HasData([
            .. ApplicationSeedData.Sections,
            .. ApplicationSeedData.MatrixSections,
            .. ApplicationSeedData.CurrentSections,
            .. ApplicationSchemadmgap0120260921.Sections,
            .. ApplicationSchemadmgap0120260928.Sections,
            .. ApplicationSchemadmgap0120260929.Sections,
            .. ApplicationSchemadmgap0120261007.Sections]);
    }
}

/// <summary>`FORM_FIELD` — the wire field object verbatim in `definition`.</summary>
public sealed class FormFieldConfiguration : IEntityTypeConfiguration<FormField>
{
    public void Configure(EntityTypeBuilder<FormField> builder)
    {
        builder.ToTable("FORM_FIELD");

        builder.HasKey(f => f.FieldId);
        builder.Property(f => f.FieldId).HasColumnName("field_id");
        builder.Property(f => f.SchemaVersion).HasColumnName("schema_version").HasMaxLength(50);
        builder.Property(f => f.FieldCode).HasColumnName("field_code").HasMaxLength(80);
        builder.Property(f => f.SectionCode).HasColumnName("section_code").HasMaxLength(50);
        builder.Property(f => f.LabelAr).HasColumnName("label_ar").HasMaxLength(300);
        builder.Property(f => f.LabelEn).HasColumnName("label_en").HasMaxLength(300);
        builder.Property(f => f.InputType).HasColumnName("input_type").HasMaxLength(20);
        builder.Property(f => f.OrderIndex).HasColumnName("order_index");
        builder.Property(f => f.Definition).HasColumnName("definition");

        builder.HasIndex(f => new { f.SchemaVersion, f.FieldCode }).IsUnique();
        builder.HasOne<FormSchema>().WithMany().HasForeignKey(f => f.SchemaVersion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasData([
            .. ApplicationSeedData.Fields,
            .. ApplicationSeedData.MatrixFields,
            .. ApplicationSeedData.CurrentFields,
            .. ApplicationSchemadmgap0120260921.Fields,
            .. ApplicationSchemadmgap0120260928.Fields,
            .. ApplicationSchemadmgap0120260929.Fields,
            .. ApplicationSchemadmgap0120261007.Fields]);
    }
}

/// <summary>`ATTACHMENT_RULE` (`BR-0106`).</summary>
public sealed class AttachmentRuleConfiguration : IEntityTypeConfiguration<AttachmentRule>
{
    public void Configure(EntityTypeBuilder<AttachmentRule> builder)
    {
        builder.ToTable("ATTACHMENT_RULE");

        builder.HasKey(r => r.RuleId);
        builder.Property(r => r.RuleId).HasColumnName("rule_id");
        builder.Property(r => r.SchemaVersion).HasColumnName("schema_version").HasMaxLength(50);
        builder.Property(r => r.RuleCode).HasColumnName("rule_code").HasMaxLength(80);
        builder.Property(r => r.LabelAr).HasColumnName("label_ar").HasMaxLength(300);
        builder.Property(r => r.LabelEn).HasColumnName("label_en").HasMaxLength(300);
        builder.Property(r => r.AcceptedFormats).HasColumnName("accepted_formats").HasMaxLength(200);
        builder.Property(r => r.MaxSizeMb).HasColumnName("max_size_mb");
        builder.Property(r => r.MaxCount).HasColumnName("max_count");
        builder.Property(r => r.RequiredFor).HasColumnName("required_for_services").HasMaxLength(200);

        builder.HasIndex(r => new { r.SchemaVersion, r.RuleCode }).IsUnique();
        builder.HasOne<FormSchema>().WithMany().HasForeignKey(r => r.SchemaVersion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(r => r.PerEntryOf).HasColumnName("per_entry_of").HasMaxLength(50);
        builder.HasData([
            .. ApplicationSeedData.AttachmentRules,
            .. ApplicationSeedData.MatrixAttachmentRules,
            .. ApplicationSeedData.CurrentAttachmentRules,
            .. ApplicationSchemadmgap0120260921.Attachments,
            .. ApplicationSchemadmgap0120260928.Attachments,
            .. ApplicationSchemadmgap0120260929.Attachments,
            .. ApplicationSchemadmgap0120261007.Attachments]);
    }
}

/// <summary>`APPLICATION`.</summary>
public sealed class ApplicationConfiguration : IEntityTypeConfiguration<Application>
{
    public void Configure(EntityTypeBuilder<Application> builder)
    {
        builder.ToTable("APPLICATION");

        builder.HasKey(a => a.ApplicationId);
        builder.Property(a => a.ApplicationId).HasColumnName("application_id");
        builder.Property(a => a.ApplicantUserId).HasColumnName("applicant_user_id");
        builder.Property(a => a.SchemaVersion).HasColumnName("schema_version").HasMaxLength(50);
        builder.Property(a => a.Reference).HasColumnName("reference").HasMaxLength(20);
        builder.Property(a => a.Status).HasColumnName("status").HasMaxLength(30);
        builder.Property(a => a.Origin).HasColumnName("origin").HasMaxLength(30);
        builder.Property(a => a.NominatedBy).HasColumnName("nominated_by");
        builder.Property(a => a.ActivationToken).HasColumnName("activation_token").HasMaxLength(100);
        builder.Property(a => a.RejectionReason).HasColumnName("rejection_reason");
        builder.Property(a => a.CreatedAt).HasColumnName("created_at");
        builder.Property(a => a.SubmittedAt).HasColumnName("submitted_at");
        builder.Property(a => a.UpdatedAt).HasColumnName("updated_at");

        // BR-0107 — one reference per submitted application, none on drafts.
        builder.HasIndex(a => a.Reference).IsUnique().HasFilter("[reference] IS NOT NULL");
        builder.HasIndex(a => a.ApplicantUserId);
        /*
         * ⚠️ ONE DRAFT PER APPLICANT — `BR-0101`'s first half, in the database.
         *
         * `/draft/start` reads the person's applications, finds no draft, and
         * inserts one. Two requests (a double-click is the normal way this
         * happens) both read "no draft" and both inserted, and once one was
         * submitted the other could be submitted too — two live applications
         * for one person, which BR-0101 forbids. Only drafts are constrained:
         * a person accumulates as many decided applications over the years as
         * they apply.
         */
        // ⚠️ NAMED on purpose. `HasIndex` on a property set that is already
        // indexed RECONFIGURES that index — an unnamed call here would have
        // turned the plain lookup index above into this filtered one and taken
        // the "my applications" query's index away with it.
        builder.HasIndex(a => a.ApplicantUserId, "UX_APPLICATION_applicant_draft")
            .IsUnique()
            .HasFilter("[status] = 'draft'");

        builder.HasOne<AppUser>().WithMany().HasForeignKey(a => a.ApplicantUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<FormSchema>().WithMany().HasForeignKey(a => a.SchemaVersion)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`APPLICATION_SERVICE` — the per-service grain (`BR-0403`).</summary>
public sealed class ApplicationServiceEntryConfiguration : IEntityTypeConfiguration<ApplicationServiceEntry>
{
    public void Configure(EntityTypeBuilder<ApplicationServiceEntry> builder)
    {
        builder.ToTable("APPLICATION_SERVICE");

        builder.HasKey(s => s.ApplicationServiceId);
        builder.Property(s => s.ApplicationServiceId).HasColumnName("application_service_id");
        builder.Property(s => s.ApplicationId).HasColumnName("application_id");
        builder.Property(s => s.Service).HasColumnName("service").HasMaxLength(30);
        builder.Property(s => s.Outcome).HasColumnName("outcome").HasMaxLength(20);
        builder.Property(s => s.DecidedAt).HasColumnName("decided_at");

        builder.HasIndex(s => new { s.ApplicationId, s.Service }).IsUnique();
        builder.HasOne<Application>().WithMany().HasForeignKey(s => s.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`APPLICATION_FIELD_VALUE`.</summary>
public sealed class ApplicationFieldValueConfiguration : IEntityTypeConfiguration<ApplicationFieldValue>
{
    public void Configure(EntityTypeBuilder<ApplicationFieldValue> builder)
    {
        builder.ToTable("APPLICATION_FIELD_VALUE");

        builder.HasKey(v => v.ValueId);
        builder.Property(v => v.ValueId).HasColumnName("value_id");
        builder.Property(v => v.ApplicationId).HasColumnName("application_id");
        builder.Property(v => v.FieldCode).HasColumnName("field_code").HasMaxLength(80);
        builder.Property(v => v.Value).HasColumnName("value");
        builder.Property(v => v.EntryId).HasColumnName("entry_id").HasMaxLength(80);
        builder.Property(v => v.EntryIndex).HasColumnName("entry_index").HasDefaultValue(0);

        // One value per field PER ENTRY. A non-repeatable field keeps entry 0,
        // so this stays exactly the old constraint for every existing row.
        builder.HasIndex(v => new { v.ApplicationId, v.FieldCode, v.EntryIndex }).IsUnique();
        builder.HasOne<Application>().WithMany().HasForeignKey(v => v.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`APPLICATION_ATTACHMENT` — metadata until `G26`/`G27` close.</summary>
public sealed class ApplicationAttachmentConfiguration : IEntityTypeConfiguration<ApplicationAttachment>
{
    public void Configure(EntityTypeBuilder<ApplicationAttachment> builder)
    {
        builder.ToTable("APPLICATION_ATTACHMENT");

        builder.HasKey(a => a.ApplicationAttachmentId);
        builder.Property(a => a.ApplicationAttachmentId).HasColumnName("application_attachment_id");
        builder.Property(a => a.ApplicationId).HasColumnName("application_id");
        builder.Property(a => a.RuleCode).HasColumnName("rule_code").HasMaxLength(80);
        builder.Property(a => a.FileName).HasColumnName("file_name").HasMaxLength(255);
        builder.Property(a => a.SizeBytes).HasColumnName("size_bytes");
        builder.Property(a => a.AttachmentId).HasColumnName("attachment_id");

        builder.HasIndex(a => a.ApplicationId);
        builder.HasOne<Application>().WithMany().HasForeignKey(a => a.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Attachment>().WithMany().HasForeignKey(a => a.AttachmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`SERVICE_REQUEST` (J-03, `BR-0110`→`BR-0112`).</summary>
public sealed class ServiceRequestConfiguration : IEntityTypeConfiguration<ServiceRequest>
{
    public void Configure(EntityTypeBuilder<ServiceRequest> builder)
    {
        builder.ToTable("SERVICE_REQUEST");

        builder.HasKey(r => r.ServiceRequestId);
        builder.Property(r => r.ServiceRequestId).HasColumnName("service_request_id");
        builder.Property(r => r.ApplicationId).HasColumnName("application_id");
        builder.Property(r => r.TrainerUserId).HasColumnName("trainer_user_id");
        builder.Property(r => r.Reference).HasColumnName("reference").HasMaxLength(24);
        builder.Property(r => r.RequestedService).HasColumnName("requested_service").HasMaxLength(30);
        builder.Property(r => r.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(r => r.DeltaValues).HasColumnName("delta_field_values");
        builder.Property(r => r.DeltaAttachments).HasColumnName("delta_attachments");
        builder.Property(r => r.DecisionKind).HasColumnName("decision").HasMaxLength(20);
        builder.Property(r => r.RejectionReasonId).HasColumnName("rejection_reason_id").HasMaxLength(60);
        builder.Property(r => r.RejectionReasonText).HasColumnName("rejection_reason_text");
        builder.Property(r => r.AddendumFileName).HasColumnName("addendum_file_name").HasMaxLength(255);
        builder.Property(r => r.AddendumAttachmentId).HasColumnName("addendum_attachment_id");
        builder.Property(r => r.DecisionNote).HasColumnName("decision_note");
        builder.Property(r => r.DecidedBy).HasColumnName("decided_by");
        builder.Property(r => r.DecidedAt).HasColumnName("decided_at");
        builder.Property(r => r.SubmittedAt).HasColumnName("submitted_at");

        builder.HasIndex(r => r.Reference).IsUnique();
        builder.HasIndex(r => r.TrainerUserId);

        builder.HasOne<Application>().WithMany().HasForeignKey(r => r.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(r => r.TrainerUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(r => r.DecidedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
