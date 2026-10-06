using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * CAP-07 — `10` §3.9, migration 04. Same naming discipline as everywhere:
 * UPPER_SNAKE tables, snake_case columns. What each table does NOT have is as
 * deliberate as what it has: no channel on the matrix row (P-147), no
 * duration on a `DM-GAP-10` row, no seeded template and no seeded routing.
 */

/// <summary>`NOTIFICATION_EVENT` — the catalogue, seeded (`P-146`).</summary>
public sealed class NotificationEventConfiguration : IEntityTypeConfiguration<NotificationEvent>
{
    public void Configure(EntityTypeBuilder<NotificationEvent> builder)
    {
        builder.ToTable("NOTIFICATION_EVENT");

        builder.HasKey(e => e.EventCode);
        builder.Property(e => e.EventCode).HasColumnName("event_code").HasMaxLength(20);
        builder.Property(e => e.CapabilityCode).HasColumnName("capability_code").HasMaxLength(20);
        builder.Property(e => e.NameAr).HasColumnName("name_ar").HasMaxLength(300);
        builder.Property(e => e.NameEn).HasColumnName("name_en").HasMaxLength(300);
        builder.Property(e => e.Source).HasColumnName("source").HasMaxLength(200);
        builder.Property(e => e.JourneyAudienceAr).HasColumnName("journey_audience_ar").HasMaxLength(500);
        builder.Property(e => e.JourneyAudienceEn).HasColumnName("journey_audience_en").HasMaxLength(500);

        builder.HasData(NotificationSeedData.Events);
    }
}

/// <summary>`NOTIFICATION_TEMPLATE` — approved bilingual only routes (`BR-0701`).</summary>
public sealed class NotificationTemplateConfiguration : IEntityTypeConfiguration<NotificationTemplate>
{
    public void Configure(EntityTypeBuilder<NotificationTemplate> builder)
    {
        builder.ToTable("NOTIFICATION_TEMPLATE");

        builder.HasKey(t => t.TemplateId);
        builder.Property(t => t.TemplateId).HasColumnName("template_id");
        builder.Property(t => t.Code).HasColumnName("code").HasMaxLength(100);
        builder.Property(t => t.SubjectAr).HasColumnName("subject_ar").HasMaxLength(500);
        builder.Property(t => t.SubjectEn).HasColumnName("subject_en").HasMaxLength(500);
        builder.Property(t => t.BodyAr).HasColumnName("body_ar");
        builder.Property(t => t.BodyEn).HasColumnName("body_en");
        builder.Property(t => t.Placeholders).HasColumnName("placeholders").HasMaxLength(1000);
        builder.Property(t => t.Version).HasColumnName("version");
        builder.Property(t => t.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at");
        builder.Property(t => t.UpdatedBy).HasColumnName("updated_by");

        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(t => t.UpdatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`NOTIFICATION_MATRIX_ROW` — presence is the routing (`DM-GAP-08` empty).</summary>
public sealed class NotificationMatrixRowConfiguration : IEntityTypeConfiguration<NotificationMatrixRow>
{
    public void Configure(EntityTypeBuilder<NotificationMatrixRow> builder)
    {
        builder.ToTable("NOTIFICATION_MATRIX_ROW");

        builder.HasKey(r => r.RowId);
        builder.Property(r => r.RowId).HasColumnName("row_id");
        builder.Property(r => r.EventCode).HasColumnName("event_code").HasMaxLength(20);
        builder.Property(r => r.TemplateId).HasColumnName("template_id");
        builder.Property(r => r.Audience).HasColumnName("audience").HasMaxLength(500);
        builder.Property(r => r.IsActive).HasColumnName("is_active");

        // One routing per event — the matrix has one answer, or none.
        builder.HasIndex(r => r.EventCode).IsUnique();

        builder.HasOne<NotificationEvent>()
            .WithMany()
            .HasForeignKey(r => r.EventCode)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<NotificationTemplate>()
            .WithMany()
            .HasForeignKey(r => r.TemplateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`NOTIFICATION_LOG` — one row per channel per send; append-only.</summary>
/// <summary>`NOTIFICATION_OCCURRENCE` — every raise, routed or not; append-only.</summary>
public sealed class NotificationOccurrenceConfiguration : IEntityTypeConfiguration<NotificationOccurrence>
{
    public void Configure(EntityTypeBuilder<NotificationOccurrence> builder)
    {
        builder.ToTable("NOTIFICATION_OCCURRENCE");
        builder.HasKey(o => o.OccurrenceId);
        builder.Property(o => o.OccurrenceId).HasColumnName("occurrence_id");
        builder.Property(o => o.EventCode).HasColumnName("event_code").HasMaxLength(20);
        builder.Property(o => o.SourceEntityId).HasColumnName("source_entity_id");
        builder.Property(o => o.RecordSubjectUserId).HasColumnName("record_subject_user_id");
        builder.Property(o => o.ActingStaffUserId).HasColumnName("acting_staff_user_id");
        builder.Property(o => o.Placeholders).HasColumnName("placeholders");
        builder.Property(o => o.RoutingStatus).HasColumnName("routing_status").HasMaxLength(20);
        builder.Property(o => o.RecipientCount).HasColumnName("recipient_count");
        builder.Property(o => o.DedupeKey).HasColumnName("dedupe_key").HasMaxLength(200);
        builder.Property(o => o.RaisedAt).HasColumnName("raised_at");
        builder.HasIndex(o => o.RaisedAt);
        builder.HasIndex(o => new { o.EventCode, o.SourceEntityId });
        builder.HasIndex(o => o.DedupeKey).IsUnique().HasFilter("[dedupe_key] IS NOT NULL");
        builder.HasOne<NotificationEvent>()
            .WithMany()
            .HasForeignKey(o => o.EventCode)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class NotificationLogEntryConfiguration : IEntityTypeConfiguration<NotificationLogEntry>
{
    public void Configure(EntityTypeBuilder<NotificationLogEntry> builder)
    {
        builder.ToTable("NOTIFICATION_LOG");

        builder.HasKey(l => l.LogId);
        builder.Property(l => l.LogId).HasColumnName("log_id");
        builder.Property(l => l.EventCode).HasColumnName("event_code").HasMaxLength(20);
        builder.Property(l => l.RecipientUserId).HasColumnName("recipient_user_id");
        builder.Property(l => l.Channel).HasColumnName("channel").HasMaxLength(20);
        builder.Property(l => l.Language).HasColumnName("language").HasMaxLength(5);
        builder.Property(l => l.TemplateCode).HasColumnName("template_code").HasMaxLength(100);
        builder.Property(l => l.TemplateVersion).HasColumnName("template_version");
        builder.Property(l => l.SendStatus).HasColumnName("send_status").HasMaxLength(20);
        builder.Property(l => l.FailureReason).HasColumnName("failure_reason");
        builder.Property(l => l.SourceEntityId).HasColumnName("source_entity_id");
        builder.Property(l => l.SentAt).HasColumnName("sent_at");
        builder.Property(l => l.OccurrenceId).HasColumnName("occurrence_id");
        builder.Property(l => l.Subject).HasColumnName("subject").HasMaxLength(500);
        builder.Property(l => l.Body).HasColumnName("body");

        // The log screen's read: newest first, filterable by outcome.
        builder.HasIndex(l => l.SentAt);
        // A recipient's inbox.
        builder.HasIndex(l => new { l.RecipientUserId, l.Channel, l.SentAt });

        builder.HasOne<NotificationEvent>()
            .WithMany()
            .HasForeignKey(l => l.EventCode)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(l => l.RecipientUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`SLA_MATRIX_ROW` — every deadline, one table (`BR-0705`), seeded.</summary>
public sealed class SlaMatrixRowConfiguration : IEntityTypeConfiguration<SlaMatrixRow>
{
    public void Configure(EntityTypeBuilder<SlaMatrixRow> builder)
    {
        builder.ToTable("SLA_MATRIX_ROW");

        builder.HasKey(r => r.SlaId);
        builder.Property(r => r.SlaId).HasColumnName("sla_id").HasMaxLength(20);
        builder.Property(r => r.CapabilityCode).HasColumnName("capability_code").HasMaxLength(20);
        builder.Property(r => r.ActionCode).HasColumnName("action_code").HasMaxLength(100);
        builder.Property(r => r.NameAr).HasColumnName("name_ar").HasMaxLength(300);
        builder.Property(r => r.NameEn).HasColumnName("name_en").HasMaxLength(300);
        builder.Property(r => r.Source).HasColumnName("source").HasMaxLength(300);
        builder.Property(r => r.OnBreachAr).HasColumnName("on_breach_ar").HasMaxLength(500);
        builder.Property(r => r.OnBreachEn).HasColumnName("on_breach_en").HasMaxLength(500);
        builder.Property(r => r.Status).HasColumnName("status").HasMaxLength(30);
        builder.Property(r => r.Duration).HasColumnName("duration");
        builder.Property(r => r.Unit).HasColumnName("unit").HasMaxLength(20);
        builder.Property(r => r.ReminderOffsets).HasColumnName("reminder_offsets").HasMaxLength(200);
        builder.Property(r => r.SortOrder).HasColumnName("sort_order");

        builder.HasData(NotificationSeedData.SlaRows);
    }
}

/// <summary>`SLA_INSTANCE` — one live countdown per record; no rows until BE-06.</summary>
public sealed class SlaInstanceConfiguration : IEntityTypeConfiguration<SlaInstance>
{
    public void Configure(EntityTypeBuilder<SlaInstance> builder)
    {
        builder.ToTable("SLA_INSTANCE");

        builder.HasKey(i => i.InstanceId);
        builder.Property(i => i.InstanceId).HasColumnName("instance_id");
        builder.Property(i => i.SlaId).HasColumnName("sla_id").HasMaxLength(20);
        builder.Property(i => i.EntityType).HasColumnName("entity_type").HasMaxLength(100);
        builder.Property(i => i.EntityId).HasColumnName("entity_id");
        builder.Property(i => i.StartedAt).HasColumnName("started_at");
        builder.Property(i => i.DueAt).HasColumnName("due_at");
        builder.Property(i => i.State).HasColumnName("state").HasMaxLength(20);
        builder.Property(i => i.ResolvedAt).HasColumnName("resolved_at");

        builder.HasIndex(i => new { i.EntityType, i.EntityId });

        builder.HasOne<SlaMatrixRow>()
            .WithMany()
            .HasForeignKey(i => i.SlaId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
