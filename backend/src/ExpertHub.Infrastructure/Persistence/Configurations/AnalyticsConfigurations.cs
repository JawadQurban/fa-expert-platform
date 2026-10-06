using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * CAP-09 — `10` §3.10, migration 12. Three tables of definitions, and no
 * fourth: `REPORT_DEFINITION`/`REPORT_RUN` are recorded as unbuilt in
 * `Analytics.cs`. Nothing here holds an operational fact, which is §8.9.1
 * («owns no source data») expressed as a schema rather than as a promise.
 */

/// <summary>`METRIC_DEFINITION`.</summary>
public sealed class MetricDefinitionConfiguration : IEntityTypeConfiguration<MetricDefinition>
{
    public void Configure(EntityTypeBuilder<MetricDefinition> builder)
    {
        builder.ToTable("METRIC_DEFINITION");
        builder.HasKey(m => m.MetricId);
        builder.Property(m => m.MetricId).HasColumnName("metric_id");
        builder.Property(m => m.Code).HasColumnName("code").HasMaxLength(64);
        builder.Property(m => m.NameAr).HasColumnName("name_ar").HasMaxLength(200);
        builder.Property(m => m.NameEn).HasColumnName("name_en").HasMaxLength(200);
        builder.Property(m => m.SourceCapability)
            .HasColumnName("source_capability").HasMaxLength(10);
        builder.Property(m => m.Formula).HasColumnName("formula");
        builder.Property(m => m.AggregationLevel)
            .HasColumnName("aggregation_level").HasMaxLength(32);
        builder.HasIndex(m => m.Code).IsUnique();
        builder.HasData(Cap09SeedData.Metrics);
    }
}

/// <summary>`DASHBOARD` — one per role, and the unique index says so.</summary>
public sealed class DashboardDefinitionConfiguration
    : IEntityTypeConfiguration<DashboardDefinition>
{
    public void Configure(EntityTypeBuilder<DashboardDefinition> builder)
    {
        builder.ToTable("DASHBOARD");
        builder.HasKey(d => d.DashboardId);
        builder.Property(d => d.DashboardId).HasColumnName("dashboard_id");
        builder.Property(d => d.RoleId).HasColumnName("role_id");
        builder.Property(d => d.FeatureCode).HasColumnName("feature_code").HasMaxLength(16);
        builder.Property(d => d.NameAr).HasColumnName("name_ar").HasMaxLength(200);
        builder.Property(d => d.NameEn).HasColumnName("name_en").HasMaxLength(200);
        // «لوحة لكل دور» — one dashboard per role, held by the database so a
        // second one cannot be inserted and silently win a FirstOrDefault.
        builder.HasIndex(d => d.RoleId).IsUnique();
        builder.HasOne<Role>().WithMany().HasForeignKey(d => d.RoleId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasData(Cap09SeedData.Dashboards);
    }
}

/// <summary>`DASHBOARD_METRIC` — the placement, ordered.</summary>
public sealed class DashboardMetricPlacementConfiguration
    : IEntityTypeConfiguration<DashboardMetricPlacement>
{
    public void Configure(EntityTypeBuilder<DashboardMetricPlacement> builder)
    {
        builder.ToTable("DASHBOARD_METRIC");
        builder.HasKey(p => new { p.DashboardId, p.MetricId });
        builder.Property(p => p.DashboardId).HasColumnName("dashboard_id");
        builder.Property(p => p.MetricId).HasColumnName("metric_id");
        builder.Property(p => p.OrderIndex).HasColumnName("order_index");
        builder.HasOne<DashboardDefinition>().WithMany()
            .HasForeignKey(p => p.DashboardId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<MetricDefinition>().WithMany()
            .HasForeignKey(p => p.MetricId).OnDelete(DeleteBehavior.Cascade);
        builder.HasData(Cap09SeedData.Placements);
    }
}
