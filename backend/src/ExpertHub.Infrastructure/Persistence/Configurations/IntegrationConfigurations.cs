using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * CAP-12 — `10` §3.12, same naming discipline as everywhere else: UPPER_SNAKE
 * tables, snake_case columns, so the design document and the schema read as
 * one. `OUTBOX_MESSAGE` is the one table §3.12's ERD does not draw; it is the
 * outbox `08` §4.2 rule 3 mandates, named in the same convention.
 */

/// <summary>`INTEGRATED_SYSTEM` — the crossing register (`08` §4.1).</summary>
public sealed class IntegratedSystemConfiguration : IEntityTypeConfiguration<IntegratedSystem>
{
    public void Configure(EntityTypeBuilder<IntegratedSystem> builder)
    {
        builder.ToTable("INTEGRATED_SYSTEM");

        builder.HasKey(s => s.SystemCode);
        builder.Property(s => s.SystemCode).HasColumnName("system_code").HasMaxLength(20);
        builder.Property(s => s.NameAr).HasColumnName("name_ar").HasMaxLength(200);
        builder.Property(s => s.NameEn).HasColumnName("name_en").HasMaxLength(200);
        builder.Property(s => s.Direction).HasColumnName("direction").HasMaxLength(20);
        builder.Property(s => s.BenefitingCapabilities)
            .HasColumnName("benefiting_capabilities").HasMaxLength(400);
        builder.Property(s => s.Importance).HasColumnName("importance").HasMaxLength(20);
        builder.Property(s => s.IsActive).HasColumnName("is_active");

        builder.HasData(IntegrationSeedData.Systems);
    }
}

/// <summary>`DATA_ELEMENT` — the source-of-truth matrix as data (`BR-1201`, `P-129`).</summary>
public sealed class DataElementConfiguration : IEntityTypeConfiguration<DataElement>
{
    public void Configure(EntityTypeBuilder<DataElement> builder)
    {
        builder.ToTable("DATA_ELEMENT");

        builder.HasKey(e => e.ElementId);
        builder.Property(e => e.ElementId).HasColumnName("element_id");
        builder.Property(e => e.SystemCode).HasColumnName("system_code").HasMaxLength(20);
        builder.Property(e => e.ElementName).HasColumnName("element_name").HasMaxLength(100);
        builder.Property(e => e.OwningSystem).HasColumnName("owning_system").HasMaxLength(40);
        builder.Property(e => e.EntityName).HasColumnName("entity_name").HasMaxLength(100);
        builder.Property(e => e.Direction).HasColumnName("direction").HasMaxLength(20);

        // One registration per element per system — the matrix has one row to
        // consult, or none; two rows would mean two answers.
        builder.HasIndex(e => new { e.SystemCode, e.ElementName }).IsUnique();

        builder.HasOne<IntegratedSystem>()
            .WithMany()
            .HasForeignKey(e => e.SystemCode)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasData(IntegrationSeedData.Elements);
    }
}

/// <summary>`INTEGRATION_LOG` — every crossing, both directions (`BR-1204`).</summary>
public sealed class IntegrationLogEntryConfiguration : IEntityTypeConfiguration<IntegrationLogEntry>
{
    public void Configure(EntityTypeBuilder<IntegrationLogEntry> builder)
    {
        builder.ToTable("INTEGRATION_LOG");

        builder.HasKey(l => l.LogId);
        builder.Property(l => l.LogId).HasColumnName("log_id");
        builder.Property(l => l.SystemCode).HasColumnName("system_code").HasMaxLength(20);
        builder.Property(l => l.Operation).HasColumnName("operation").HasMaxLength(40);
        builder.Property(l => l.EntityType).HasColumnName("entity_type").HasMaxLength(100);
        builder.Property(l => l.EntityId).HasColumnName("entity_id");
        builder.Property(l => l.IdempotencyKey).HasColumnName("idempotency_key").HasMaxLength(200);
        builder.Property(l => l.Outcome).HasColumnName("outcome").HasMaxLength(20);
        builder.Property(l => l.ErrorDetail).HasColumnName("error_detail");
        builder.Property(l => l.AttemptNumber).HasColumnName("attempt_number");
        builder.Property(l => l.OccurredAt).HasColumnName("occurred_at");

        // The reconciliation and observability read: "what crossed to this
        // system, newest first".
        builder.HasIndex(l => new { l.SystemCode, l.OccurredAt });

        builder.HasOne<IntegratedSystem>()
            .WithMany()
            .HasForeignKey(l => l.SystemCode)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`REPLICATION_STATE` — mastership made operable (`10` §3.12, `P-129`).</summary>
public sealed class ReplicationStateConfiguration : IEntityTypeConfiguration<ReplicationState>
{
    public void Configure(EntityTypeBuilder<ReplicationState> builder)
    {
        builder.ToTable("REPLICATION_STATE");

        builder.HasKey(r => r.StateId);
        builder.Property(r => r.StateId).HasColumnName("state_id");
        builder.Property(r => r.EntityType).HasColumnName("entity_type").HasMaxLength(100);
        builder.Property(r => r.LocalEntityId).HasColumnName("local_entity_id");
        builder.Property(r => r.RemoteEntityId).HasColumnName("remote_entity_id").HasMaxLength(100);
        builder.Property(r => r.SystemCode).HasColumnName("system_code").HasMaxLength(20);
        builder.Property(r => r.MasterSide).HasColumnName("master_side").HasMaxLength(20);
        builder.Property(r => r.LocalVersion).HasColumnName("local_version");
        builder.Property(r => r.RemoteVersion).HasColumnName("remote_version");
        builder.Property(r => r.LastSyncedAt).HasColumnName("last_synced_at");
        builder.Property(r => r.DriftStatus).HasColumnName("drift_status").HasMaxLength(20);

        // One row per shared entity instance per system (`10` §3.12).
        builder.HasIndex(r => new { r.EntityType, r.LocalEntityId, r.SystemCode }).IsUnique();

        builder.HasOne<IntegratedSystem>()
            .WithMany()
            .HasForeignKey(r => r.SystemCode)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`OUTBOX_MESSAGE` — the transactional outbox (`08` §4.2 rule 3).</summary>
public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("OUTBOX_MESSAGE");

        builder.HasKey(m => m.OutboxMessageId);
        builder.Property(m => m.OutboxMessageId).HasColumnName("outbox_message_id");
        builder.Property(m => m.SystemCode).HasColumnName("system_code").HasMaxLength(20);
        builder.Property(m => m.ElementName).HasColumnName("element_name").HasMaxLength(100);
        builder.Property(m => m.EntityType).HasColumnName("entity_type").HasMaxLength(100);
        builder.Property(m => m.EntityId).HasColumnName("entity_id");
        builder.Property(m => m.EntityVersion).HasColumnName("entity_version");
        builder.Property(m => m.Operation).HasColumnName("operation").HasMaxLength(40);
        builder.Property(m => m.Payload).HasColumnName("payload");
        builder.Property(m => m.IdempotencyKey).HasColumnName("idempotency_key").HasMaxLength(200);
        builder.Property(m => m.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(m => m.AttemptCount).HasColumnName("attempt_count");
        builder.Property(m => m.NextAttemptAt).HasColumnName("next_attempt_at");
        builder.Property(m => m.LastError).HasColumnName("last_error");
        builder.Property(m => m.CreatedAt).HasColumnName("created_at");
        builder.Property(m => m.PublishedAt).HasColumnName("published_at");

        // Rule 2: `(entity, entity_id, version)` at most once — a retry after
        // an ambiguous timeout must not create a second PlanTrainer row. The
        // database holds the line even if application code forgets to check.
        builder.HasIndex(m => m.IdempotencyKey).IsUnique();

        // The publisher's read: due pending messages, oldest first.
        builder.HasIndex(m => new { m.Status, m.NextAttemptAt });

        builder.HasOne<IntegratedSystem>()
            .WithMany()
            .HasForeignKey(m => m.SystemCode)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
