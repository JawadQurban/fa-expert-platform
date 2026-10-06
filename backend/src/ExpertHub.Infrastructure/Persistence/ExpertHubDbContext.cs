using ExpertHub.Core.Domain;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// The platform's database (`10_DATABASE_DESIGN`). Migration 01 covers §3.1–3.2:
/// attachments, reference lists, and the CAP-08 identity/access/audit model.
/// </summary>
/// <remarks>
/// <para>
/// Two rules are structural here, not conventions:
/// </para>
/// <para>
/// <b>The audit log is append-only</b> (`NFR-07`, `BR-0806`). There is no
/// public <c>DbSet</c> for it — reads go through <see cref="AuditEntries"/>
/// (no-tracking, so an entry cannot be mutated and saved) and writes through
/// <see cref="AppendAudit"/>. If code reaches around that and marks an entry
/// modified or deleted anyway, <see cref="SaveChanges()"/> throws. The database
/// enforces the same rule with grants
/// (<c>scripts/sql/audit-log-append-only.sql</c>), because "cannot be edited by
/// anyone" is only true if it holds against tools that never load this class.
/// </para>
/// <para>
/// <b>A reference value deactivates, never deletes</b> (`10` §3.1): history
/// must still resolve a retired value to its label, so deleting one throws and
/// <see cref="ReferenceValue.IsActive"/> is the only retirement path.
/// </para>
/// </remarks>
public sealed class ExpertHubDbContext : DbContext
{
    public ExpertHubDbContext(DbContextOptions<ExpertHubDbContext> options)
        : base(options)
    {
    }

    public DbSet<Attachment> Attachments => Set<Attachment>();

    public DbSet<ReferenceList> ReferenceLists => Set<ReferenceList>();

    public DbSet<ReferenceValue> ReferenceValues => Set<ReferenceValue>();

    public DbSet<AppUser> Users => Set<AppUser>();

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<Permission> Permissions => Set<Permission>();

    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    public DbSet<UserRole> UserRoles => Set<UserRole>();

    /* ── CAP-01 — applications and the form schema (`10` §3.3, migration 05) ── */

    public DbSet<FormSchema> FormSchemas => Set<FormSchema>();

    public DbSet<FormSection> FormSections => Set<FormSection>();

    public DbSet<FormField> FormFields => Set<FormField>();

    public DbSet<AttachmentRule> AttachmentRules => Set<AttachmentRule>();

    public DbSet<Application> Applications => Set<Application>();

    public DbSet<ApplicationServiceEntry> ApplicationServices => Set<ApplicationServiceEntry>();

    public DbSet<ApplicationFieldValue> ApplicationFieldValues => Set<ApplicationFieldValue>();

    public DbSet<ApplicationAttachment> ApplicationAttachments => Set<ApplicationAttachment>();

    public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();

    /* ── CAP-05 — assignment through engagement (`10` §3.7, migration 10) ── */

    public DbSet<AssignmentRequest> AssignmentRequests => Set<AssignmentRequest>();

    public DbSet<AssignmentSlot> AssignmentSlots => Set<AssignmentSlot>();

    public DbSet<MatchingModel> MatchingModels => Set<MatchingModel>();

    public DbSet<MatchingRun> MatchingRuns => Set<MatchingRun>();

    public DbSet<MatchCandidate> MatchCandidates => Set<MatchCandidate>();

    public DbSet<MatchExclusion> MatchExclusions => Set<MatchExclusion>();

    public DbSet<CandidatePool> CandidatePools => Set<CandidatePool>();

    public DbSet<PoolMember> PoolMembers => Set<PoolMember>();

    public DbSet<SlotCycle> SlotCycles => Set<SlotCycle>();

    public DbSet<AgreementDocumentVersion> AgreementDocumentVersions => Set<AgreementDocumentVersion>();

    public DbSet<AgreementTemplateVersion> AgreementTemplateVersions => Set<AgreementTemplateVersion>();

    public DbSet<AssignmentOffer> AssignmentOffers => Set<AssignmentOffer>();

    public DbSet<Engagement> Engagements => Set<Engagement>();

    public DbSet<EngagementTermination> EngagementTerminations => Set<EngagementTermination>();

    public DbSet<MaterialSubmission> MaterialSubmissions => Set<MaterialSubmission>();

    public DbSet<SubmissionRound> SubmissionRounds => Set<SubmissionRound>();

    /* ── CAP-04 — the trainer profile (`10` §3.6, migration 09) ───────────── */

    public DbSet<TrainerProfile> TrainerProfiles => Set<TrainerProfile>();

    public DbSet<TrainerBio> TrainerBios => Set<TrainerBio>();

    public DbSet<TrainerServiceRow> TrainerServices => Set<TrainerServiceRow>();

    public DbSet<TrainerFieldValue> TrainerFieldValues => Set<TrainerFieldValue>();

    public DbSet<ProfileChangeRequest> ProfileChangeRequests => Set<ProfileChangeRequest>();

    public DbSet<TrainerRecord> TrainerRecords => Set<TrainerRecord>();

    public DbSet<RatingSourceRecord> RatingSourceRecords => Set<RatingSourceRecord>();

    public DbSet<TrainerRating> TrainerRatings => Set<TrainerRating>();

    /* ── CAP-03 — agreements (`10` §3.5, migration 07) ─────────────────────── */

    public DbSet<Agreement> Agreements => Set<Agreement>();

    public DbSet<AgreementServiceRow> AgreementServices => Set<AgreementServiceRow>();

    public DbSet<AddendumRecord> Addenda => Set<AddendumRecord>();

    public DbSet<AgreementTemplateRecord> AgreementTemplates => Set<AgreementTemplateRecord>();

    public DbSet<SigningSequenceRecord> SigningSequences => Set<SigningSequenceRecord>();

    public DbSet<SignatoryRecord> Signatories => Set<SignatoryRecord>();

    public DbSet<ESignatureRecord> ESignatures => Set<ESignatureRecord>();

    public DbSet<AgreementEvent> AgreementEvents => Set<AgreementEvent>();

    public DbSet<BankDataRecord> BankData => Set<BankDataRecord>();

    /* ── CAP-02 — screening, interview, committee (`10` §3.4, migration 06) ── */

    public DbSet<EvaluationModel> EvaluationModels => Set<EvaluationModel>();

    public DbSet<EvaluationCriterion> EvaluationCriteria => Set<EvaluationCriterion>();

    public DbSet<ScreeningResult> ScreeningResults => Set<ScreeningResult>();

    public DbSet<ScreeningCriterionScore> ScreeningCriterionScores => Set<ScreeningCriterionScore>();

    public DbSet<AiAnalysis> AiAnalyses => Set<AiAnalysis>();

    public DbSet<Interview> Interviews => Set<Interview>();

    public DbSet<InterviewSlot> InterviewSlots => Set<InterviewSlot>();

    public DbSet<InterviewModel> InterviewModels => Set<InterviewModel>();

    public DbSet<InterviewAxis> InterviewAxes => Set<InterviewAxis>();

    public DbSet<InterviewEvaluation> InterviewEvaluations => Set<InterviewEvaluation>();

    public DbSet<InterviewAxisScore> InterviewAxisScores => Set<InterviewAxisScore>();

    public DbSet<CommitteeTemplate> CommitteeTemplates => Set<CommitteeTemplate>();

    public DbSet<CommitteeSequence> CommitteeSequences => Set<CommitteeSequence>();

    public DbSet<CommitteeStep> CommitteeSteps => Set<CommitteeStep>();

    public DbSet<AccreditationDecision> AccreditationDecisions => Set<AccreditationDecision>();

    /* ── CAP-07 — notifications and deadlines (`10` §3.9, migration 04) ────── */

    public DbSet<NotificationEvent> NotificationEvents => Set<NotificationEvent>();

    public DbSet<NotificationTemplate> NotificationTemplates => Set<NotificationTemplate>();

    public DbSet<NotificationMatrixRow> NotificationMatrixRows => Set<NotificationMatrixRow>();

    public DbSet<SlaMatrixRow> SlaMatrix => Set<SlaMatrixRow>();

    public DbSet<SlaInstance> SlaInstances => Set<SlaInstance>();

    /// <summary>
    /// The send record, read-only — the log records what happened, and no
    /// operation edits or deletes an entry (`notificationService.ts`'s own
    /// list of what it cannot do). Same arrangement as the audit trail.
    /// </summary>
    public IQueryable<NotificationLogEntry> NotificationLog =>
        Set<NotificationLogEntry>().AsNoTracking();

    /// <summary>Stages one send record — the only write the log accepts.</summary>
    public void AppendNotificationLog(NotificationLogEntry entry) =>
        Set<NotificationLogEntry>().Add(entry);

    /// <summary>Every raised event, routed or not — read-only, like the log.</summary>
    public IQueryable<NotificationOccurrence> NotificationOccurrences =>
        Set<NotificationOccurrence>().AsNoTracking();

    /// <summary>Occurrences staged in this unit of work and not yet saved.</summary>
    public IEnumerable<NotificationOccurrence> StagedNotificationOccurrences =>
        Set<NotificationOccurrence>().Local;

    /// <summary>Stages one occurrence — the only write the record accepts.</summary>
    public void AppendNotificationOccurrence(NotificationOccurrence occurrence) =>
        Set<NotificationOccurrence>().Add(occurrence);

    /// <summary>
    /// The INT-05 base-profile replica. ⚠️ FAST masters it; the only writer is
    /// the sign-in importer.
    /// </summary>
    public DbSet<FastProfileReplica> FastProfiles => Set<FastProfileReplica>();

    /// <summary>
    /// Server-side session tickets. ⚠️ The cookie middleware reads these
    /// through <c>DatabaseTicketStore</c>; no capability should touch them —
    /// the rows hold encrypted credentials, not business data.
    /// </summary>
    public DbSet<SessionTicket> SessionTickets => Set<SessionTicket>();

    /// <summary>
    /// The bytes behind attachments, while the database is the document store
    /// (`G26`). Written only through <c>IDocumentStore</c>.
    /// </summary>
    internal DbSet<DocumentBlob> DocumentBlobs => Set<DocumentBlob>();

    /* ── CAP-09 — analytics definitions (`10` §3.10, migration 12) ────────── */

    /// <summary>
    /// The three definition tables, <b>read-only</b> — §8.9.1: the capability
    /// «owns no source data», and the definitions themselves are seeded from
    /// the BRD rather than authored at runtime, so CAP-09 has no write path
    /// to anything, including its own tables. A metric is added by a
    /// migration, which is what a BRD amendment deserves.
    /// </summary>
    public IQueryable<MetricDefinition> MetricDefinitions =>
        Set<MetricDefinition>().AsNoTracking();

    /// <inheritdoc cref="MetricDefinitions"/>
    public IQueryable<DashboardDefinition> Dashboards =>
        Set<DashboardDefinition>().AsNoTracking();

    /// <inheritdoc cref="MetricDefinitions"/>
    public IQueryable<DashboardMetricPlacement> DashboardMetrics =>
        Set<DashboardMetricPlacement>().AsNoTracking();

    /* ── CAP-06 — entitlements (`10` §3.8, migration 11) ──────────────────── */

    /// <summary>
    /// The ERP mirror and the projection, <b>read-only</b> — `BR-0601`/`P-127`
    /// as the absence of a door. Nothing may be entered or edited by hand
    /// «بأي حال», so the surface the API assembly can reach offers no way to
    /// stage a change: the writable sets below are <c>internal</c>, and the
    /// only type that touches them is
    /// <see cref="Entitlements.ErpEntitlementImporter"/>, on the far side of
    /// the INT-03 boundary where ERP — not a person — is the author.
    /// </summary>
    public IQueryable<ErpPurchaseOrder> ErpPurchaseOrders =>
        Set<ErpPurchaseOrder>().AsNoTracking();

    /// <inheritdoc cref="ErpPurchaseOrders"/>
    public IQueryable<Entitlement> Entitlements => Set<Entitlement>().AsNoTracking();

    /// <summary>The importer's half of <see cref="ErpPurchaseOrders"/>.</summary>
    internal DbSet<ErpPurchaseOrder> ErpPurchaseOrderWrites => Set<ErpPurchaseOrder>();

    /// <summary>The importer's half of <see cref="Entitlements"/>.</summary>
    internal DbSet<Entitlement> EntitlementWrites => Set<Entitlement>();

    /* ── CAP-12 — integration governance (`10` §3.12, migration 03) ────────── */

    public DbSet<IntegratedSystem> IntegratedSystems => Set<IntegratedSystem>();

    public DbSet<DataElement> DataElements => Set<DataElement>();

    public DbSet<ReplicationState> ReplicationStates => Set<ReplicationState>();

    public DbSet<ReferenceCounter> ReferenceCounters => Set<ReferenceCounter>();

    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    /// <summary>
    /// The crossing trace, read-only — `BR-1204` is only worth anything if a
    /// failed crossing cannot be edited into a successful one, so the log
    /// gets exactly the audit trail's arrangement: no-tracking reads, an
    /// append method, and a guard that throws on any other write.
    /// </summary>
    public IQueryable<IntegrationLogEntry> IntegrationLog =>
        Set<IntegrationLogEntry>().AsNoTracking();

    /// <summary>
    /// Stages a crossing record — the only write `INTEGRATION_LOG` accepts.
    /// Call inside the same transaction as the state it records.
    /// </summary>
    public void AppendIntegrationLog(IntegrationLogEntry entry) =>
        Set<IntegrationLogEntry>().Add(entry);

    /// <summary>
    /// The audit trail, read-only. No-tracking on purpose: a tracked entry
    /// could be mutated and saved, and this type must offer no such path.
    /// </summary>
    public IQueryable<AuditLogEntry> AuditEntries => Set<AuditLogEntry>().AsNoTracking();

    /// <summary>
    /// Stages an audit entry for insertion — the only write the trail accepts.
    /// Call inside the same transaction as the change it records (`BR-0806`):
    /// an audit written afterwards can be lost precisely when it matters.
    /// </summary>
    public void AppendAudit(AuditLogEntry entry) => Set<AuditLogEntry>().Add(entry);

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        GuardStructuralRules();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        GuardStructuralRules();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ExpertHubDbContext).Assembly);
    }

    private void GuardStructuralRules()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            var forbidden = entry.Entity switch
            {
                AuditLogEntry when entry.State is EntityState.Modified or EntityState.Deleted =>
                    "AUDIT_LOG is append-only (NFR-07, BR-0806): entries are never updated or deleted, by anyone.",
                NotificationLogEntry when entry.State is EntityState.Modified or EntityState.Deleted =>
                    "NOTIFICATION_LOG is append-only: the log records what was sent; a failure is followed up (US-0705), never edited away.",
                NotificationOccurrence when entry.State is EntityState.Modified or EntityState.Deleted =>
                    "NOTIFICATION_OCCURRENCE is append-only: an event was raised or it was not.",
                AgreementDocumentVersion when entry.State is EntityState.Modified or EntityState.Deleted =>
                    "AGREEMENT_DOCUMENT_VERSION is immutable: what somebody agreed to is never edited; a change is a new version.",
                AgreementTemplateVersion when entry.State is EntityState.Modified or EntityState.Deleted =>
                    "AGREEMENT_TEMPLATE_VERSION is append-only: a template's earlier text is kept as it was.",
                SigningSequenceRecord when entry.State is EntityState.Deleted =>
                    "SIGNING_SEQUENCE is never deleted: a restarted run voids the chain and keeps its approvals and signatures.",
                SignatoryRecord when entry.State is EntityState.Deleted =>
                    "SIGNATORY is never deleted: an approval or signature is evidence.",
                ESignatureRecord when entry.State is EntityState.Deleted =>
                    "E_SIGNATURE is never deleted: a signature is evidence.",
                IntegrationLogEntry when entry.State is EntityState.Modified or EntityState.Deleted =>
                    "INTEGRATION_LOG is append-only (BR-1204): a crossing happened or it did not; the record is never rewritten.",
                ReferenceValue when entry.State is EntityState.Deleted =>
                    "REFERENCE_VALUE deactivates, never deletes: history must still resolve a retired value to its label. Set IsActive = false instead.",
                _ => null,
            };

            if (forbidden is not null)
            {
                throw new InvalidOperationException(forbidden);
            }
        }
    }
}
