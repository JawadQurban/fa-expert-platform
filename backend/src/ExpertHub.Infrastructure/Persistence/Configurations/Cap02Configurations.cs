using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExpertHub.Infrastructure.Persistence.Configurations;

/*
 * CAP-02 — `10` §3.4, migration 06. Two structural facts live in the shapes:
 * AI_ANALYSIS is a SIBLING of SCREENING_RESULT (BR-0201/BR-0202 — never a
 * column on it), and INTERVIEW is application-scoped with the per-service
 * grain inside the axis scores (the wire contracts' shape; deviation from the
 * ERD recorded on `10` §3.4).
 */

/// <summary>`EVALUATION_MODEL` — config-as-data (`BR-0203`), draft-seeded.</summary>
public sealed class EvaluationModelConfiguration : IEntityTypeConfiguration<EvaluationModel>
{
    public void Configure(EntityTypeBuilder<EvaluationModel> builder)
    {
        builder.ToTable("EVALUATION_MODEL");
        builder.HasKey(m => m.ModelId);
        builder.Property(m => m.ModelId).HasColumnName("model_id");
        builder.Property(m => m.Service).HasColumnName("service").HasMaxLength(30);
        builder.Property(m => m.Version).HasColumnName("version").HasMaxLength(50);
        builder.Property(m => m.PassThreshold).HasColumnName("pass_threshold").HasPrecision(5, 1);
        builder.Property(m => m.IsActive).HasColumnName("is_active");
        builder.HasIndex(m => new { m.Service, m.Version }).IsUnique();
        builder.HasData(Cap02SeedData.EvaluationModels);
        builder.HasData(EvaluationMatrixSeedData.Models);
    }
}

/// <summary>`EVALUATION_CRITERION`.</summary>
public sealed class EvaluationCriterionConfiguration : IEntityTypeConfiguration<EvaluationCriterion>
{
    public void Configure(EntityTypeBuilder<EvaluationCriterion> builder)
    {
        builder.ToTable("EVALUATION_CRITERION");
        builder.HasKey(c => c.CriterionId);
        builder.Property(c => c.CriterionId).HasColumnName("criterion_id");
        builder.Property(c => c.ModelId).HasColumnName("model_id");
        builder.Property(c => c.LabelAr).HasColumnName("label_ar").HasMaxLength(200);
        builder.Property(c => c.LabelEn).HasColumnName("label_en").HasMaxLength(200);
        builder.Property(c => c.SourceSectionCode).HasColumnName("source_section_code").HasMaxLength(50);
        builder.Property(c => c.Weight).HasColumnName("weight").HasPrecision(5, 1);
        builder.Property(c => c.OrderIndex).HasColumnName("order_index");
        builder.Property(c => c.SourceFieldCode).HasColumnName("source_field_code").HasMaxLength(80);
        builder.Property(c => c.ScoreRule).HasColumnName("score_rule");
        builder.Property(c => c.Aggregation).HasColumnName("aggregation").HasMaxLength(20);
        builder.HasOne<EvaluationModel>().WithMany().HasForeignKey(c => c.ModelId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasData(Cap02SeedData.EvaluationCriteria);
        builder.HasData(EvaluationMatrixSeedData.Criteria);
    }
}

/// <summary>`SCREENING_RESULT` — one per application service.</summary>
public sealed class ScreeningResultConfiguration : IEntityTypeConfiguration<ScreeningResult>
{
    public void Configure(EntityTypeBuilder<ScreeningResult> builder)
    {
        builder.ToTable("SCREENING_RESULT");
        builder.HasKey(r => r.ScreeningResultId);
        builder.Property(r => r.ScreeningResultId).HasColumnName("screening_result_id");
        builder.Property(r => r.ApplicationServiceId).HasColumnName("application_service_id");
        builder.Property(r => r.ModelId).HasColumnName("model_id");
        builder.Property(r => r.ObjectiveScore).HasColumnName("objective_score").HasPrecision(6, 2);
        builder.Property(r => r.Decision).HasColumnName("decision").HasMaxLength(30);
        builder.Property(r => r.RejectionReasonId).HasColumnName("rejection_reason").HasMaxLength(60);
        builder.Property(r => r.RejectionReasonText).HasColumnName("rejection_reason_text");
        builder.Property(r => r.ExemptionReasonId).HasColumnName("exemption_reason").HasMaxLength(60);
        builder.Property(r => r.ExemptionReasonText).HasColumnName("exemption_reason_text");
        builder.Property(r => r.DecidedBy).HasColumnName("decided_by");
        builder.Property(r => r.DecidedAt).HasColumnName("decided_at");
        builder.HasIndex(r => r.ApplicationServiceId).IsUnique();
        builder.HasOne<ApplicationServiceEntry>().WithMany()
            .HasForeignKey(r => r.ApplicationServiceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<EvaluationModel>().WithMany().HasForeignKey(r => r.ModelId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(r => r.DecidedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`SCREENING_CRITERION_SCORE` — the decision-time snapshot.</summary>
public sealed class ScreeningCriterionScoreConfiguration : IEntityTypeConfiguration<ScreeningCriterionScore>
{
    public void Configure(EntityTypeBuilder<ScreeningCriterionScore> builder)
    {
        builder.ToTable("SCREENING_CRITERION_SCORE");
        builder.HasKey(s => s.ScoreId);
        builder.Property(s => s.ScoreId).HasColumnName("score_id");
        builder.Property(s => s.ScreeningResultId).HasColumnName("screening_result_id");
        builder.Property(s => s.CriterionId).HasColumnName("criterion_id");
        builder.Property(s => s.RawScore).HasColumnName("raw_score").HasPrecision(6, 2);
        builder.Property(s => s.WeightedScore).HasColumnName("weighted_score").HasPrecision(6, 2);
        builder.HasOne<ScreeningResult>().WithMany().HasForeignKey(s => s.ScreeningResultId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<EvaluationCriterion>().WithMany().HasForeignKey(s => s.CriterionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`AI_ANALYSIS` — the advisory sibling (`BR-0202`).</summary>
public sealed class AiAnalysisConfiguration : IEntityTypeConfiguration<AiAnalysis>
{
    public void Configure(EntityTypeBuilder<AiAnalysis> builder)
    {
        builder.ToTable("AI_ANALYSIS");
        builder.HasKey(a => a.AnalysisId);
        builder.Property(a => a.AnalysisId).HasColumnName("analysis_id");
        builder.Property(a => a.ApplicationId).HasColumnName("application_id");
        builder.Property(a => a.SummaryAr).HasColumnName("summary_ar");
        builder.Property(a => a.SummaryEn).HasColumnName("summary_en");
        builder.Property(a => a.Detail).HasColumnName("detail");
        builder.Property(a => a.AdvisoryScore).HasColumnName("advisory_score").HasPrecision(5, 1);
        builder.Property(a => a.AnalyzedFieldCodes).HasColumnName("analyzed_field_codes").HasMaxLength(2000);
        builder.Property(a => a.Provider).HasColumnName("provider").HasMaxLength(50);
        builder.Property(a => a.ModelVersion).HasColumnName("model_version").HasMaxLength(100);
        builder.Property(a => a.PromptVersion).HasColumnName("prompt_version").HasMaxLength(50);
        builder.Property(a => a.Status).HasColumnName("status").HasMaxLength(20);
        builder.Property(a => a.ProducedAt).HasColumnName("produced_at");
        builder.HasIndex(a => a.ApplicationId).IsUnique();
        builder.HasOne<Application>().WithMany().HasForeignKey(a => a.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`INTERVIEW` — application-scoped (see the file header).</summary>
public sealed class InterviewConfiguration : IEntityTypeConfiguration<Interview>
{
    public void Configure(EntityTypeBuilder<Interview> builder)
    {
        builder.ToTable("INTERVIEW");
        builder.HasKey(i => i.InterviewId);
        builder.Property(i => i.InterviewId).HasColumnName("interview_id");
        builder.Property(i => i.ApplicationId).HasColumnName("application_id");
        builder.Property(i => i.TicketNumber).HasColumnName("ticket_number").HasMaxLength(20);
        builder.Property(i => i.Status).HasColumnName("status").HasMaxLength(30);
        builder.Property(i => i.ConfirmedSlotId).HasColumnName("confirmed_slot_id");
        builder.Property(i => i.RescheduleRequestedAt).HasColumnName("reschedule_requested_at");
        builder.Property(i => i.RescheduleNote).HasColumnName("reschedule_note");
        builder.Property(i => i.RescheduleCount).HasColumnName("reschedule_count");
        builder.Property(i => i.MeetingUrl).HasColumnName("meeting_url").HasMaxLength(500);
        builder.Property(i => i.MeetingExternalId)
            .HasColumnName("meeting_external_id").HasMaxLength(200);
        builder.Property(i => i.SelectionDueAt).HasColumnName("sla_due_at");
        builder.Property(i => i.ModelVersion).HasColumnName("model_version").HasMaxLength(50);
        builder.Property(i => i.DecisionKind).HasColumnName("decision").HasMaxLength(20);
        builder.Property(i => i.DecisionReasonId).HasColumnName("decision_reason_id").HasMaxLength(60);
        builder.Property(i => i.DecisionReasonText).HasColumnName("decision_reason_text");
        builder.Property(i => i.DecidedBy).HasColumnName("decided_by");
        builder.Property(i => i.DecidedAt).HasColumnName("decided_at");
        builder.Property(i => i.CreatedAt).HasColumnName("created_at");
        builder.HasIndex(i => i.ApplicationId).IsUnique();
        builder.HasIndex(i => i.TicketNumber).IsUnique().HasFilter("[ticket_number] IS NOT NULL");
        builder.HasOne<Application>().WithMany().HasForeignKey(i => i.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`INTERVIEW_SLOT` — superseded slots kept for the history.</summary>
public sealed class InterviewSlotConfiguration : IEntityTypeConfiguration<InterviewSlot>
{
    public void Configure(EntityTypeBuilder<InterviewSlot> builder)
    {
        builder.ToTable("INTERVIEW_SLOT");
        builder.HasKey(s => s.SlotId);
        builder.Property(s => s.SlotId).HasColumnName("slot_id");
        builder.Property(s => s.InterviewId).HasColumnName("interview_id");
        builder.Property(s => s.StartsAt).HasColumnName("starts_at");
        builder.Property(s => s.IsSuperseded).HasColumnName("is_superseded");
        builder.HasOne<Interview>().WithMany().HasForeignKey(s => s.InterviewId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

/// <summary>`INTERVIEW_MODEL` — config-as-data, one row per (service, version).</summary>
public sealed class InterviewModelConfiguration : IEntityTypeConfiguration<InterviewModel>
{
    public void Configure(EntityTypeBuilder<InterviewModel> builder)
    {
        builder.ToTable("INTERVIEW_MODEL");
        builder.HasKey(m => m.InterviewModelId);
        builder.Property(m => m.InterviewModelId).HasColumnName("interview_model_id");
        builder.Property(m => m.Service).HasColumnName("service").HasMaxLength(30);
        builder.Property(m => m.Version).HasColumnName("version").HasMaxLength(50);
        builder.Property(m => m.IsActive).HasColumnName("is_active");
        builder.Property(m => m.ResultMaxScore).HasColumnName("result_max_score").HasPrecision(5, 1);
        builder.Property(m => m.PassThreshold).HasColumnName("pass_threshold").HasPrecision(5, 1);
        builder.Property(m => m.RatingScale).HasColumnName("rating_scale");
        builder.HasIndex(m => new { m.Service, m.Version }).IsUnique();
        builder.HasData(Cap02SeedData.InterviewModels);
    }
}

/// <summary>`INTERVIEW_AXIS`.</summary>
public sealed class InterviewAxisConfiguration : IEntityTypeConfiguration<InterviewAxis>
{
    public void Configure(EntityTypeBuilder<InterviewAxis> builder)
    {
        builder.ToTable("INTERVIEW_AXIS");
        builder.HasKey(a => a.AxisId);
        builder.Property(a => a.AxisId).HasColumnName("axis_id");
        builder.Property(a => a.InterviewModelId).HasColumnName("interview_model_id");
        builder.Property(a => a.AxisCode).HasColumnName("axis_code").HasMaxLength(50);
        builder.Property(a => a.LabelAr).HasColumnName("label_ar").HasMaxLength(200);
        builder.Property(a => a.LabelEn).HasColumnName("label_en").HasMaxLength(200);
        builder.Property(a => a.DescriptionAr).HasColumnName("description_ar").HasMaxLength(500);
        builder.Property(a => a.DescriptionEn).HasColumnName("description_en").HasMaxLength(500);
        builder.Property(a => a.Weight).HasColumnName("weight").HasPrecision(5, 1);
        builder.Property(a => a.MaxScore).HasColumnName("max_score").HasPrecision(4, 1);
        builder.Property(a => a.OrderIndex).HasColumnName("order_index");
        builder.HasOne<InterviewModel>().WithMany().HasForeignKey(a => a.InterviewModelId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasData(Cap02SeedData.InterviewAxes);
    }
}

/// <summary>`INTERVIEW_EVALUATION` — the assignment IS the pending row (`BR-0220`).</summary>
public sealed class InterviewEvaluationConfiguration : IEntityTypeConfiguration<InterviewEvaluation>
{
    public void Configure(EntityTypeBuilder<InterviewEvaluation> builder)
    {
        builder.ToTable("INTERVIEW_EVALUATION");
        builder.HasKey(e => e.InterviewEvaluationId);
        builder.Property(e => e.InterviewEvaluationId).HasColumnName("interview_evaluation_id");
        builder.Property(e => e.InterviewId).HasColumnName("interview_id");
        builder.Property(e => e.EvaluatorUserId).HasColumnName("evaluator_user_id");
        builder.Property(e => e.DidNotAttend).HasColumnName("did_not_attend");
        builder.Property(e => e.Recommendations).HasColumnName("recommendations").HasMaxLength(500);
        builder.Property(e => e.Note).HasColumnName("note");
        builder.Property(e => e.SubmittedAt).HasColumnName("submitted_at");
        builder.HasIndex(e => new { e.InterviewId, e.EvaluatorUserId }).IsUnique();
        builder.HasOne<Interview>().WithMany().HasForeignKey(e => e.InterviewId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(e => e.EvaluatorUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`INTERVIEW_AXIS_SCORE` — per service (F1/AC-2).</summary>
public sealed class InterviewAxisScoreConfiguration : IEntityTypeConfiguration<InterviewAxisScore>
{
    public void Configure(EntityTypeBuilder<InterviewAxisScore> builder)
    {
        builder.ToTable("INTERVIEW_AXIS_SCORE");
        builder.HasKey(s => s.AxisScoreId);
        builder.Property(s => s.AxisScoreId).HasColumnName("axis_score_id");
        builder.Property(s => s.InterviewEvaluationId).HasColumnName("interview_evaluation_id");
        builder.Property(s => s.AxisId).HasColumnName("axis_id");
        builder.Property(s => s.Service).HasColumnName("service").HasMaxLength(30);
        builder.Property(s => s.Score).HasColumnName("score").HasPrecision(4, 1);
        builder.HasIndex(s => new { s.InterviewEvaluationId, s.AxisId, s.Service }).IsUnique();
        builder.HasOne<InterviewEvaluation>().WithMany()
            .HasForeignKey(s => s.InterviewEvaluationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<InterviewAxis>().WithMany().HasForeignKey(s => s.AxisId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`COMMITTEE_TEMPLATE` — copied on reuse, never referenced.</summary>
public sealed class CommitteeTemplateConfiguration : IEntityTypeConfiguration<CommitteeTemplate>
{
    public void Configure(EntityTypeBuilder<CommitteeTemplate> builder)
    {
        builder.ToTable("COMMITTEE_TEMPLATE");
        builder.HasKey(t => t.TemplateId);
        builder.Property(t => t.TemplateId).HasColumnName("template_id");
        builder.Property(t => t.Name).HasColumnName("name").HasMaxLength(200);
        builder.Property(t => t.Members).HasColumnName("members").HasMaxLength(4000);
        builder.Property(t => t.Kind).HasColumnName("kind").HasMaxLength(20);
        builder.Property(t => t.CreatedBy).HasColumnName("created_by");
        builder.Property(t => t.CreatedAt).HasColumnName("created_at");
        builder.HasOne<AppUser>().WithMany().HasForeignKey(t => t.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`COMMITTEE_SEQUENCE`.</summary>
public sealed class CommitteeSequenceConfiguration : IEntityTypeConfiguration<CommitteeSequence>
{
    public void Configure(EntityTypeBuilder<CommitteeSequence> builder)
    {
        builder.ToTable("COMMITTEE_SEQUENCE");
        builder.HasKey(s => s.SequenceId);
        builder.Property(s => s.SequenceId).HasColumnName("sequence_id");
        builder.Property(s => s.ApplicationId).HasColumnName("application_id");
        builder.Property(s => s.CreatedFromTemplateId).HasColumnName("created_from_template_id");
        builder.Property(s => s.Status).HasColumnName("status").HasMaxLength(30);
        builder.Property(s => s.CurrentStepIndex).HasColumnName("current_step_index");
        builder.Property(s => s.CreatedBy).HasColumnName("created_by");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at");
        builder.Property(s => s.DecidedAt).HasColumnName("decided_at");
        builder.HasIndex(s => s.ApplicationId).IsUnique();
        builder.HasOne<Application>().WithMany().HasForeignKey(s => s.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(s => s.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`COMMITTEE_STEP` — per-member state (`BR-0218`).</summary>
public sealed class CommitteeStepConfiguration : IEntityTypeConfiguration<CommitteeStep>
{
    public void Configure(EntityTypeBuilder<CommitteeStep> builder)
    {
        builder.ToTable("COMMITTEE_STEP");
        builder.HasKey(s => s.StepId);
        builder.Property(s => s.StepId).HasColumnName("step_id");
        builder.Property(s => s.SequenceId).HasColumnName("sequence_id");
        builder.Property(s => s.MemberUserId).HasColumnName("member_user_id");
        builder.Property(s => s.OrderIndex).HasColumnName("order_index");
        builder.Property(s => s.IsMandatory).HasColumnName("is_mandatory");
        builder.Property(s => s.Decision).HasColumnName("decision").HasMaxLength(30);
        builder.Property(s => s.RejectionReasonId).HasColumnName("rejection_reason_id").HasMaxLength(60);
        builder.Property(s => s.RejectionReasonText).HasColumnName("rejection_reason_text");
        builder.Property(s => s.Note).HasColumnName("note");
        builder.Property(s => s.ActedAt).HasColumnName("acted_at");
        builder.HasIndex(s => new { s.SequenceId, s.OrderIndex }).IsUnique();
        builder.HasOne<CommitteeSequence>().WithMany().HasForeignKey(s => s.SequenceId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(s => s.MemberUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

/// <summary>`ACCREDITATION_DECISION`.</summary>
public sealed class AccreditationDecisionConfiguration : IEntityTypeConfiguration<AccreditationDecision>
{
    public void Configure(EntityTypeBuilder<AccreditationDecision> builder)
    {
        builder.ToTable("ACCREDITATION_DECISION");
        builder.HasKey(d => d.DecisionId);
        builder.Property(d => d.DecisionId).HasColumnName("decision_id");
        builder.Property(d => d.ApplicationServiceId).HasColumnName("application_service_id");
        builder.Property(d => d.Outcome).HasColumnName("outcome").HasMaxLength(20);
        builder.Property(d => d.Classification).HasColumnName("classification").HasMaxLength(30);
        builder.Property(d => d.DecidedBy).HasColumnName("decided_by");
        builder.Property(d => d.DecidedAt).HasColumnName("decided_at");
        builder.HasIndex(d => d.ApplicationServiceId).IsUnique();
        builder.HasOne<ApplicationServiceEntry>().WithMany()
            .HasForeignKey(d => d.ApplicationServiceId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<AppUser>().WithMany().HasForeignKey(d => d.DecidedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
