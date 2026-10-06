using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * CAP-06 — `10` §3.8, migration 11. Two tables and no third: the diagram's
 * `linkage_complete` is annotated DERIVED and is therefore NOT a column (see
 * `Entitlement`'s remarks). Both tables are ERP-mastered, and the only writer
 * in the codebase is `ErpEntitlementImporter` — `BR-0601` is enforced by the
 * absence of a writable DbSet on the public surface, not by a guard.
 */

/// <summary>`EXT_ERP_PURCHASE_ORDER` — the INT-03 mirror.</summary>
public sealed class ErpPurchaseOrderConfiguration : IEntityTypeConfiguration<ErpPurchaseOrder>
{
    public void Configure(EntityTypeBuilder<ErpPurchaseOrder> builder)
    {
        builder.ToTable("EXT_ERP_PURCHASE_ORDER");
        builder.HasKey(p => p.PurchaseOrderNumber);
        builder.Property(p => p.PurchaseOrderNumber)
            .HasColumnName("po_number").HasMaxLength(64);
        builder.Property(p => p.TrainerRef).HasColumnName("trainer_ref").HasMaxLength(128);
        builder.Property(p => p.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(p => p.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(p => p.DisbursementStatus)
            .HasColumnName("disbursement_status").HasMaxLength(64);
        builder.Property(p => p.DisbursementDate).HasColumnName("disbursement_date");
        builder.Property(p => p.ReceivedAt).HasColumnName("received_at");
        builder.HasIndex(p => p.TrainerRef);
    }
}

/// <summary>`ENTITLEMENT` — the projection `BR-0602`'s chain hangs from.</summary>
public sealed class EntitlementConfiguration : IEntityTypeConfiguration<Entitlement>
{
    public void Configure(EntityTypeBuilder<Entitlement> builder)
    {
        builder.ToTable("ENTITLEMENT");
        builder.HasKey(e => e.EntitlementId);
        builder.Property(e => e.EntitlementId).HasColumnName("entitlement_id");
        builder.Property(e => e.TrainerId).HasColumnName("trainer_id");
        builder.Property(e => e.PurchaseOrderNumber)
            .HasColumnName("purchase_order_number").HasMaxLength(64);
        builder.Property(e => e.AgreementId).HasColumnName("agreement_id");
        builder.Property(e => e.EngagementId).HasColumnName("engagement_id");
        builder.Property(e => e.DisbursementStatusCode)
            .HasColumnName("disbursement_status_code").HasMaxLength(64);
        builder.Property(e => e.DisbursementStatusLabelAr)
            .HasColumnName("disbursement_status_label_ar").HasMaxLength(200);
        builder.Property(e => e.DisbursementStatusLabelEn)
            .HasColumnName("disbursement_status_label_en").HasMaxLength(200);
        builder.Property(e => e.Amount).HasColumnName("amount").HasPrecision(18, 2);
        builder.Property(e => e.Currency).HasColumnName("currency").HasMaxLength(3);
        builder.Property(e => e.DisbursementDate).HasColumnName("disbursement_date");
        builder.Property(e => e.LastSyncedAt).HasColumnName("last_synced_at");
        builder.Property(e => e.SyncStatus).HasColumnName("sync_status").HasMaxLength(20);

        // «سجل واحد لكل أمر شراء» — one entitlement per purchase order, held
        // by the database rather than by the importer remembering to check.
        builder.HasIndex(e => e.PurchaseOrderNumber).IsUnique();
        builder.HasIndex(e => e.TrainerId);

        builder.HasOne<ErpPurchaseOrder>().WithMany()
            .HasForeignKey(e => e.PurchaseOrderNumber)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<TrainerProfile>().WithMany()
            .HasForeignKey(e => e.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Agreement>().WithMany()
            .HasForeignKey(e => e.AgreementId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Engagement>().WithMany()
            .HasForeignKey(e => e.EngagementId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
