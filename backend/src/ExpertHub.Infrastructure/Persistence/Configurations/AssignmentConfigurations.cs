using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * CAP-05 — `10` §3.7, migration 10. Recorded deviations: the `EXT_FAST_*`
 * mirrors (PROGRAM, PLAN, SCHEDULE_DAY, PLAN_TAKER, PLAN_TRAINER) are NOT
 * built — there is no FAST plan read yet (INT-05a, and `Q20` for
 * PlanTaker), so the request carries the centre's OWN entered form
 * (`DM-GAP-06`) and `pulled` serves null rather than a fabricated plan.
 */

/// <summary>`ASSIGNMENT_REQUEST`.</summary>
public sealed class AssignmentRequestConfiguration : IEntityTypeConfiguration<AssignmentRequest>
{
    public void Configure(EntityTypeBuilder<AssignmentRequest> builder)
    {
        builder.ToTable("ASSIGNMENT_REQUEST");
        builder.HasKey(r => r.RequestId);
        builder.Property(r => r.RequestId).HasColumnName("request_id");
        builder.Property(r => r.Reference).HasColumnName("reference").HasMaxLength(24);
        builder.Property(r => r.ServiceType).HasColumnName("service_type").HasMaxLength(30);
        builder.Property(r => r.RequestType).HasColumnName("request_type").HasMaxLength(40);
        builder.Property(r => r.CentreId).HasColumnName("requesting_centre_id").HasMaxLength(64);
        builder.Property(r => r.ResponsibleEmployee).HasColumnName("responsible_employee").HasMaxLength(200);
        builder.Property(r => r.RequiredHeadcount).HasColumnName("required_headcount");
        builder.Property(r => r.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(r => r.FormValues).HasColumnName("form_values");
        builder.Property(r => r.CreatedBy).HasColumnName("created_by");
        builder.Property(r => r.CreatedAt).HasColumnName("created_at");
        builder.HasIndex(r => r.Reference).IsUnique();
        builder.HasOne<AppUser>().WithMany().HasForeignKey(r => r.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`ASSIGNMENT_SLOT` — everything downstream is slot-scoped (`P-95`).</summary>
public sealed class AssignmentSlotConfiguration : IEntityTypeConfiguration<AssignmentSlot>
{
    public void Configure(EntityTypeBuilder<AssignmentSlot> builder)
    {
        builder.ToTable("ASSIGNMENT_SLOT");
        builder.HasKey(s => s.SlotId);
        builder.Property(s => s.SlotId).HasColumnName("slot_id");
        builder.Property(s => s.RequestId).HasColumnName("request_id");
        builder.Property(s => s.SlotNumber).HasColumnName("slot_number");
        builder.Property(s => s.ConfirmedEngagementId).HasColumnName("confirmed_engagement_id");
        builder.Property(s => s.FastSyncState).HasColumnName("fast_sync_state").HasMaxLength(20);
        builder.Property(s => s.Exhausted).HasColumnName("exhausted");
        builder.HasIndex(s => new { s.RequestId, s.SlotNumber }).IsUnique();
        builder.HasOne<AssignmentRequest>().WithMany().HasForeignKey(s => s.RequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`MATCHING_MODEL` — served config (`DM-GAP-05`), draft-seeded.</summary>
public sealed class MatchingModelConfiguration : IEntityTypeConfiguration<MatchingModel>
{
    public void Configure(EntityTypeBuilder<MatchingModel> builder)
    {
        builder.ToTable("MATCHING_MODEL");
        builder.HasKey(m => m.MatchingModelId);
        builder.Property(m => m.MatchingModelId).HasColumnName("matching_model_id");
        builder.Property(m => m.Version).HasColumnName("version").HasMaxLength(50);
        builder.Property(m => m.Weights).HasColumnName("weights").HasMaxLength(500);
        builder.Property(m => m.TieBreakNoteAr).HasColumnName("tie_break_note_ar").HasMaxLength(500);
        builder.Property(m => m.TieBreakNoteEn).HasColumnName("tie_break_note_en").HasMaxLength(500);
        builder.Property(m => m.IsActive).HasColumnName("is_active");
        builder.HasIndex(m => m.Version).IsUnique();
        builder.HasData(Cap05SeedData.MatchingModels);
    }
}

/// <summary>`MATCHING_RUN`.</summary>
public sealed class MatchingRunConfiguration : IEntityTypeConfiguration<MatchingRun>
{
    public void Configure(EntityTypeBuilder<MatchingRun> builder)
    {
        builder.ToTable("MATCHING_RUN");
        builder.HasKey(r => r.RunId);
        builder.Property(r => r.RunId).HasColumnName("run_id");
        builder.Property(r => r.RequestId).HasColumnName("request_id");
        builder.Property(r => r.SlotId).HasColumnName("slot_id");
        builder.Property(r => r.MatchingModelId).HasColumnName("matching_model_id");
        builder.Property(r => r.RequiredPoolSize).HasColumnName("required_pool_size");
        builder.Property(r => r.RunBy).HasColumnName("run_by");
        builder.Property(r => r.RunAt).HasColumnName("run_at");
        builder.HasIndex(r => new { r.RequestId, r.RunAt });
        builder.HasOne<AssignmentRequest>().WithMany().HasForeignKey(r => r.RequestId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AssignmentSlot>().WithMany().HasForeignKey(r => r.SlotId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<MatchingModel>().WithMany().HasForeignKey(r => r.MatchingModelId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(r => r.RunBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`MATCH_CANDIDATE`.</summary>
public sealed class MatchCandidateConfiguration : IEntityTypeConfiguration<MatchCandidate>
{
    public void Configure(EntityTypeBuilder<MatchCandidate> builder)
    {
        builder.ToTable("MATCH_CANDIDATE");
        builder.HasKey(c => c.MatchCandidateId);
        builder.Property(c => c.MatchCandidateId).HasColumnName("match_candidate_id");
        builder.Property(c => c.RunId).HasColumnName("run_id");
        builder.Property(c => c.TrainerId).HasColumnName("trainer_id");
        builder.Property(c => c.WeightedScores).HasColumnName("weighted_scores").HasMaxLength(2000);
        builder.Property(c => c.TotalScore).HasColumnName("total_score").HasPrecision(6, 3);
        builder.Property(c => c.Rank).HasColumnName("rank");
        builder.HasIndex(c => new { c.RunId, c.TrainerId }).IsUnique();
        builder.HasOne<MatchingRun>().WithMany().HasForeignKey(c => c.RunId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(c => c.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`MATCH_EXCLUSION` — separate from the ranked list, on purpose.</summary>
public sealed class MatchExclusionConfiguration : IEntityTypeConfiguration<MatchExclusion>
{
    public void Configure(EntityTypeBuilder<MatchExclusion> builder)
    {
        builder.ToTable("MATCH_EXCLUSION");
        builder.HasKey(e => e.ExclusionId);
        builder.Property(e => e.ExclusionId).HasColumnName("exclusion_id");
        builder.Property(e => e.RunId).HasColumnName("run_id");
        builder.Property(e => e.TrainerId).HasColumnName("trainer_id");
        builder.Property(e => e.Reasons).HasColumnName("reasons").HasMaxLength(300);
        builder.HasIndex(e => new { e.RunId, e.TrainerId }).IsUnique();
        builder.HasOne<MatchingRun>().WithMany().HasForeignKey(e => e.RunId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(e => e.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`CANDIDATE_POOL`.</summary>
public sealed class CandidatePoolConfiguration : IEntityTypeConfiguration<CandidatePool>
{
    public void Configure(EntityTypeBuilder<CandidatePool> builder)
    {
        builder.ToTable("CANDIDATE_POOL");
        builder.HasKey(p => p.PoolId);
        builder.Property(p => p.PoolId).HasColumnName("pool_id");
        builder.Property(p => p.RequestId).HasColumnName("request_id");
        builder.Property(p => p.SlotId).HasColumnName("slot_id");
        builder.Property(p => p.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(p => p.Path).HasColumnName("path").HasMaxLength(20);
        builder.Property(p => p.SentAt).HasColumnName("sent_at");
        builder.HasIndex(p => p.RequestId);
        builder.HasOne<AssignmentRequest>().WithMany().HasForeignKey(p => p.RequestId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AssignmentSlot>().WithMany().HasForeignKey(p => p.SlotId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`POOL_MEMBER` — one decision each, never a group verdict.</summary>
public sealed class PoolMemberConfiguration : IEntityTypeConfiguration<PoolMember>
{
    public void Configure(EntityTypeBuilder<PoolMember> builder)
    {
        builder.ToTable("POOL_MEMBER");
        builder.HasKey(m => m.PoolMemberId);
        builder.Property(m => m.PoolMemberId).HasColumnName("pool_member_id");
        builder.Property(m => m.PoolId).HasColumnName("pool_id");
        builder.Property(m => m.TrainerId).HasColumnName("trainer_id");
        builder.Property(m => m.PriceInClass).HasColumnName("price_in_class").HasPrecision(10, 2);
        builder.Property(m => m.PriceOnline).HasColumnName("price_online").HasPrecision(10, 2);
        builder.Property(m => m.Currency).HasColumnName("currency").HasMaxLength(10);
        builder.Property(m => m.Decision).HasColumnName("decision").HasMaxLength(20);
        builder.Property(m => m.PreferenceRank).HasColumnName("preference_rank");
        builder.Property(m => m.DecidedAt).HasColumnName("decided_at");
        builder.HasIndex(m => new { m.PoolId, m.TrainerId }).IsUnique();
        builder.HasOne<CandidatePool>().WithMany().HasForeignKey(m => m.PoolId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(m => m.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`SLOT_CYCLE` — counted, never capped (J-19/F3/AC-3).</summary>
public sealed class SlotCycleConfiguration : IEntityTypeConfiguration<SlotCycle>
{
    public void Configure(EntityTypeBuilder<SlotCycle> builder)
    {
        builder.ToTable("SLOT_CYCLE");
        builder.HasKey(c => c.CycleId);
        builder.Property(c => c.CycleId).HasColumnName("cycle_id");
        builder.Property(c => c.SlotId).HasColumnName("slot_id");
        builder.Property(c => c.CycleNumber).HasColumnName("cycle_number");
        builder.Property(c => c.Status).HasColumnName("status").HasMaxLength(30);
        builder.Property(c => c.PoolId).HasColumnName("pool_id");
        builder.Property(c => c.CreatedAt).HasColumnName("created_at");
        builder.HasIndex(c => new { c.SlotId, c.CycleNumber }).IsUnique();
        builder.HasOne<AssignmentSlot>().WithMany().HasForeignKey(c => c.SlotId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<CandidatePool>().WithMany().HasForeignKey(c => c.PoolId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`ASSIGNMENT_OFFER` — one live per slot, system-created.</summary>
public sealed class AssignmentOfferConfiguration : IEntityTypeConfiguration<AssignmentOffer>
{
    public void Configure(EntityTypeBuilder<AssignmentOffer> builder)
    {
        builder.ToTable("ASSIGNMENT_OFFER");
        builder.HasKey(o => o.OfferId);
        builder.Property(o => o.OfferId).HasColumnName("offer_id");
        builder.Property(o => o.SlotId).HasColumnName("slot_id");
        builder.Property(o => o.TrainerId).HasColumnName("trainer_id");
        builder.Property(o => o.Status).HasColumnName("status").HasMaxLength(30);
        builder.Property(o => o.Price).HasColumnName("price").HasPrecision(10, 2);
        builder.Property(o => o.Currency).HasColumnName("currency").HasMaxLength(10);
        builder.Property(o => o.SentAt).HasColumnName("sent_at");
        builder.Property(o => o.ResponseDueAt).HasColumnName("response_due_at");
        builder.Property(o => o.RespondedAt).HasColumnName("responded_at");
        builder.Property(o => o.ExpiredAt).HasColumnName("expired_at");
        builder.HasIndex(o => new { o.SlotId, o.SentAt });
        // The expiry sweep's lookup: live offers whose window has closed.
        builder.HasIndex(o => new { o.Status, o.ResponseDueAt });
        /*
         * ⚠️ ONE LIVE OFFER PER SLOT, enforced by the database.
         *
         * J-18 offers a slot to one candidate at a time: the next one's turn
         * comes when this offer is refused, lapses or is withdrawn. Nothing in
         * the code was stopping a second live offer from being opened — two
         * requests that both read the pool as `sent` each opened one, and the
         * slot could then be filled twice by two people who had each been
         * promised it.
         *
         * Filtered, so the refused, expired and accepted offers a slot
         * accumulates are untouched; only a second AWAITING one is refused.
         */
        builder.HasIndex(o => o.SlotId)
            .IsUnique()
            .HasFilter("[status] = 'awaiting_response'")
            .HasDatabaseName("UX_ASSIGNMENT_OFFER_slot_id_live");
        builder.HasOne<AssignmentSlot>().WithMany().HasForeignKey(o => o.SlotId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(o => o.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`ENGAGEMENT`.</summary>
public sealed class EngagementConfiguration : IEntityTypeConfiguration<Engagement>
{
    public void Configure(EntityTypeBuilder<Engagement> builder)
    {
        builder.ToTable("ENGAGEMENT");
        builder.HasKey(e => e.EngagementId);
        builder.Property(e => e.EngagementId).HasColumnName("engagement_id");
        builder.Property(e => e.OfferId).HasColumnName("offer_id");
        builder.Property(e => e.TrainerId).HasColumnName("trainer_id");
        builder.Property(e => e.SlotId).HasColumnName("slot_id");
        builder.Property(e => e.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
        builder.Property(e => e.ScheduleChangedAt).HasColumnName("schedule_changed_at");
        builder.HasIndex(e => e.OfferId).IsUnique();
        builder.HasIndex(e => e.TrainerId);
        /*
         * ⚠️ ONE LIVE ENGAGEMENT PER SLOT. The unique index on `offer_id` above
         * stops the same offer being accepted twice, but not two DIFFERENT
         * offers on one slot each producing an engagement — which is exactly
         * what a slot offered twice led to. Withdrawn and cancelled engagements
         * are kept and excluded here: a slot that was vacated is re-offered,
         * and J-22's record of why must survive that.
         */
        // The plain lookup, stated explicitly: EF creates one per foreign key by
        // convention, but stops once another index "covers" the column — and the
        // filtered index below cannot serve `WHERE slot_id = @id`.
        builder.HasIndex(e => e.SlotId);
        // Named, so it is a SECOND index rather than a reconfiguration of the
        // plain `slot_id` lookup (see the note in ApplicationConfigurations).
        builder.HasIndex(e => e.SlotId, "UX_ENGAGEMENT_slot_id_live")
            .IsUnique()
            // ⚠️ `NOT IN (…)` is rejected: a filtered index predicate allows
            // only simple comparisons joined by AND — no IN, no OR, no NOT.
            .HasFilter("[status] <> 'withdrawn' AND [status] <> 'cancelled'");
        builder.HasOne<AssignmentOffer>().WithMany().HasForeignKey(e => e.OfferId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<TrainerProfile>().WithMany().HasForeignKey(e => e.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<AssignmentSlot>().WithMany().HasForeignKey(e => e.SlotId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`ENGAGEMENT_TERMINATION` — three end states (`P-113`).</summary>
public sealed class EngagementTerminationConfiguration : IEntityTypeConfiguration<EngagementTermination>
{
    public void Configure(EntityTypeBuilder<EngagementTermination> builder)
    {
        builder.ToTable("ENGAGEMENT_TERMINATION");
        builder.HasKey(t => t.TerminationId);
        builder.Property(t => t.TerminationId).HasColumnName("termination_id");
        builder.Property(t => t.EngagementId).HasColumnName("engagement_id");
        builder.Property(t => t.Kind).HasColumnName("kind").HasMaxLength(20);
        builder.Property(t => t.Actor).HasColumnName("actor").HasMaxLength(20);
        builder.Property(t => t.Reason).HasColumnName("reason").HasMaxLength(60);
        builder.Property(t => t.Note).HasColumnName("note");
        builder.Property(t => t.FastCancelReasonCode).HasColumnName("fast_cancel_reason_code").HasMaxLength(60);
        builder.Property(t => t.ActedBy).HasColumnName("acted_by");
        builder.Property(t => t.OccurredAt).HasColumnName("occurred_at");
        builder.HasIndex(t => t.EngagementId).IsUnique();
        builder.HasOne<Engagement>().WithMany().HasForeignKey(t => t.EngagementId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(t => t.ActedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`MATERIAL_SUBMISSION`.</summary>
public sealed class MaterialSubmissionConfiguration : IEntityTypeConfiguration<MaterialSubmission>
{
    public void Configure(EntityTypeBuilder<MaterialSubmission> builder)
    {
        builder.ToTable("MATERIAL_SUBMISSION");
        builder.HasKey(s => s.SubmissionId);
        builder.Property(s => s.SubmissionId).HasColumnName("submission_id");
        builder.Property(s => s.EngagementId).HasColumnName("engagement_id");
        builder.Property(s => s.Kind).HasColumnName("kind").HasMaxLength(30);
        builder.Property(s => s.Status).HasColumnName("status").HasMaxLength(30);
        builder.Property(s => s.FastSyncState).HasColumnName("fast_sync_state").HasMaxLength(20);
        builder.Property(s => s.OpenedAt).HasColumnName("opened_at");
        builder.HasIndex(s => s.EngagementId);
        builder.HasOne<Engagement>().WithMany().HasForeignKey(s => s.EngagementId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`SUBMISSION_ROUND` — approve or request changes; no rejection.</summary>
public sealed class SubmissionRoundConfiguration : IEntityTypeConfiguration<SubmissionRound>
{
    public void Configure(EntityTypeBuilder<SubmissionRound> builder)
    {
        builder.ToTable("SUBMISSION_ROUND");
        builder.HasKey(r => r.RoundId);
        builder.Property(r => r.RoundId).HasColumnName("round_id");
        builder.Property(r => r.SubmissionId).HasColumnName("submission_id");
        builder.Property(r => r.RoundNumber).HasColumnName("round_number");
        builder.Property(r => r.FileName).HasColumnName("file_name").HasMaxLength(255);
        builder.Property(r => r.Decision).HasColumnName("decision").HasMaxLength(30);
        builder.Property(r => r.Note).HasColumnName("note");
        builder.Property(r => r.DecidedBy).HasColumnName("decided_by");
        builder.Property(r => r.DecidedAt).HasColumnName("decided_at");
        builder.Property(r => r.UploadedAt).HasColumnName("uploaded_at");
        builder.HasIndex(r => new { r.SubmissionId, r.RoundNumber }).IsUnique();
        builder.HasOne<MaterialSubmission>().WithMany().HasForeignKey(r => r.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(r => r.DecidedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
