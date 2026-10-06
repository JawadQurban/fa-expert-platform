using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Profiles;

/// <summary>
/// The reads every CAP-04 surface shares, in one place — so the trainer's own
/// view, the internal view and the public projection cannot disagree about
/// the same trainer, and so each surface's OMISSIONS are visible side by side.
/// </summary>
public static class TrainerProfileService
{
    private static readonly JsonSerializerOptions WireJson = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// Creates the trainer record from an approved application — J-13: it
    /// exists after signature, not before. The base profile's values are
    /// copied from what the applicant already answered (`BR-0404`: the same
    /// fields), and the accredited services become the accreditation layer
    /// Expert Hub masters (`P-134`).
    /// </summary>
    /// <returns>The new profile, or the existing one — activation is not
    /// re-entrant, and neither is this.</returns>
    /// <summary>
    /// The trainer file's status, derived from the agreement that governs it.
    /// </summary>
    /// <remarks>
    /// <para>
    /// ⚠️ <b>`TRAINER_PROFILE.file_status` is written once, at accreditation,
    /// and nothing ever updated it.</b> QA suspended `AGR-2026-0001` and the
    /// trainer stayed «نشط» in the trainer base — visible for nomination and
    /// assignment while suspended (`D-24`). A stored copy of a fact another
    /// entity owns is a copy that goes stale the first time that fact changes.
    /// </para>
    /// <para>
    /// So it is derived at read time, exactly as `P-188` already derives
    /// `expired` for the agreement itself: the calendar and the agreement are
    /// the authority, and the file reports what they say.
    /// </para>
    /// <para>
    /// ⚠️ <b>One honest gap.</b> `TrainerFileStatuses` has no term for a
    /// deliberately ENDED agreement — its `expired` is documented as «a lapse,
    /// distinct from a deliberate ending». An ended agreement therefore maps to
    /// `expired`, which is the least-wrong of four wrong options and is still
    /// far better than the reported harm of showing them active. The
    /// distinction survives on the agreement, which the file links to; naming
    /// a fifth status is a contract change and belongs to whoever owns the
    /// union.
    /// </para>
    /// </remarks>
    public static string FileStatus(
        TrainerProfile profile, Agreement? agreement, DateTime nowUtc, DateTime? lastCompletedEngagementEnd)
    {
        ArgumentNullException.ThrowIfNull(profile);
        if (agreement is null)
        {
            // No agreement governs this file — report what was stored rather
            // than inventing a status from nothing.
            return profile.FileStatus;
        }
        return agreement.Status switch
        {
            AgreementStatuses.Suspended => TrainerFileStatuses.Suspended,
            AgreementStatuses.Ended => TrainerFileStatuses.Expired,
            AgreementStatuses.Active when agreement.EndsAt is { } ends && ends < nowUtc =>
                TrainerFileStatuses.Expired,
            // J-13 «Trainer Profile Status & Conditions»: an agreement in effect
            // is `active` with at least one engagement executed in the last 6
            // months, and `idle` without one.
            AgreementStatuses.Active => HasRecentEngagement(lastCompletedEngagementEnd, nowUtc)
                ? TrainerFileStatuses.Active
                : TrainerFileStatuses.Idle,
            // Anything before activation (preparation, sent, declined) governs
            // no file: the profile only exists once an agreement activated it.
            _ => profile.FileStatus,
        };
    }

    /// <summary>J-13's activity window for `active` versus `idle`.</summary>
    public const int ActivityWindowMonths = 6;

    /// <summary>True when the latest completed engagement ended within the last
    /// <see cref="ActivityWindowMonths"/> months (the window's first day included).</summary>
    public static bool HasRecentEngagement(DateTime? lastCompletedEngagementEnd, DateTime nowUtc) =>
        lastCompletedEngagementEnd is { } end && end >= nowUtc.AddMonths(-ActivityWindowMonths);

    /// <summary>
    /// Each trainer's most recent COMPLETED engagement end — the plan's end date
    /// once it has passed, exactly as J-21/F5 derives `completed`
    /// (<c>OfferService.Lifecycle</c>). Withdrawn and cancelled engagements
    /// were never executed and do not count.
    /// </summary>
    public static async Task<Dictionary<Guid, DateTime>> LastCompletedEngagementsAsync(
        ExpertHubDbContext db, IReadOnlyCollection<Guid> trainerIds, DateTime nowUtc, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(db);
        var rows = await (
            from engagement in db.Engagements.AsNoTracking()
            join slot in db.AssignmentSlots.AsNoTracking() on engagement.SlotId equals slot.SlotId
            join request in db.AssignmentRequests.AsNoTracking() on slot.RequestId equals request.RequestId
            where trainerIds.Contains(engagement.TrainerId)
                && engagement.Status != EngagementStatuses.Withdrawn
                && engagement.Status != EngagementStatuses.Cancelled
            select new { engagement.TrainerId, request }).ToListAsync(ct).ConfigureAwait(false);
        return rows
            .Select(r => (r.TrainerId, End: Assignments.AssignmentEndpoints.ContextFor(r.request).EndsAt))
            .Where(r => r.End is { } end && end < nowUtc)
            .GroupBy(r => r.TrainerId)
            .ToDictionary(g => g.Key, g => g.Max(r => r.End!.Value));
    }

    /// <summary>The agreements that govern each of these trainers' files.</summary>
    public static async Task<Dictionary<Guid, Agreement>> GoverningAgreementsAsync(
        ExpertHubDbContext db, IReadOnlyCollection<Guid> applicationIds, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(db);
        var agreements = await db.Agreements.AsNoTracking()
            .Where(a => applicationIds.Contains(a.ApplicationId)
                && (a.Status == AgreementStatuses.Active
                    || a.Status == AgreementStatuses.Suspended
                    || a.Status == AgreementStatuses.Ended))
            .ToListAsync(ct)
            .ConfigureAwait(false);
        // Newest first, so a renewal governs rather than the one it replaced.
        return agreements
            .GroupBy(a => a.ApplicationId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(a => a.StartsAt).First());
    }

    public static async Task<TrainerProfile> EnsureForActivatedApplicationAsync(
        ExpertHubDbContext db,
        Application application,
        DateTime now,
        CancellationToken ct)
    {
        var existing = await db.TrainerProfiles.FirstOrDefaultAsync(
            p => p.UserId == application.ApplicantUserId, ct);
        if (existing is not null)
        {
            return existing;
        }

        var profile = new TrainerProfile
        {
            TrainerId = Guid.NewGuid(),
            UserId = application.ApplicantUserId,
            ApplicationId = application.ApplicationId,
            // J-13/AC-9's matrix: an active agreement makes an active file.
            FileStatus = TrainerFileStatuses.Active,
            // BR-1002/BR-1007 — off until the trainer says otherwise.
            VisibilityConsent = false,
            CreatedAt = now,
        };
        db.TrainerProfiles.Add(profile);

        /*
         * `D-21` — the trainer role, granted by the act of accrediting them.
         *
         * QA found an accredited trainer with an active agreement holding «لا
         * أدوار مُسنَدة — لا صلاحية وصول»: they could not sign in to their own
         * file, request an added service, or see their entitlements, until
         * somebody assigned the role by hand. Accreditation IS the decision to
         * let them in; making a person perform it a second time in a different
         * screen is how that gets forgotten.
         *
         * ⚠️ This is the platform's own route to the role. `P-234`'s route —
         * the Academy's record at sign-in — covers people the Academy already
         * calls trainers; this covers everybody who earns it here. Both write
         * the same real `USER_ROLE` row with the same audit entry, and neither
         * can grant a permission (`BR-0801`).
         */
        var trainerRole = await db.Roles
            .SingleAsync(role => role.Code == RoleCode.Trainer, ct)
            .ConfigureAwait(false);
        var holdsTrainer = await db.UserRoles.AnyAsync(
            ur => ur.UserId == application.ApplicantUserId && ur.RoleId == trainerRole.RoleId, ct)
            .ConfigureAwait(false);
        if (!holdsTrainer)
        {
            db.UserRoles.Add(new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = application.ApplicantUserId,
                RoleId = trainerRole.RoleId,
                ScopeRef = null,
                // Self, as the other automatic grants do: no person performed
                // this, and naming one who did not would be a false trail.
                AssignedBy = application.ApplicantUserId,
                AssignedAt = now,
            });
            db.AppendAudit(new AuditLogEntry
            {
                AuditId = Guid.NewGuid(),
                UserId = application.ApplicantUserId,
                Action = "role-assigned",
                EntityType = "USER_ROLE",
                EntityId = application.ApplicantUserId,
                AfterState = System.Text.Json.JsonSerializer.Serialize(new
                {
                    roleCode = RoleCodes.ToWire(RoleCode.Trainer),
                    // What the trail needs that the summary cannot show: this
                    // came from accreditation, not an administrator's screen.
                    fromAccreditation = true,
                }),
                OccurredAt = now,
            });
        }

        var values = await db.ApplicationFieldValues
            .Where(v => v.ApplicationId == application.ApplicationId)
            .ToListAsync(ct);
        foreach (var value in values)
        {
            db.TrainerFieldValues.Add(new TrainerFieldValue
            {
                ValueId = Guid.NewGuid(),
                TrainerId = profile.TrainerId,
                FieldCode = value.FieldCode,
                Value = value.Value,
                // §22 — every qualification, certificate and past role the
                // applicant entered becomes the trainer's, not just the first.
                EntryId = value.EntryId,
                EntryIndex = value.EntryIndex,
            });
        }

        var accepted = await db.ApplicationServices
            .Where(s => s.ApplicationId == application.ApplicationId
                && s.Outcome == ServiceOutcomes.Accepted)
            .ToListAsync(ct);
        foreach (var service in accepted)
        {
            db.TrainerServices.Add(new TrainerServiceRow
            {
                TrainerServiceId = Guid.NewGuid(),
                TrainerId = profile.TrainerId,
                Service = service.Service,
                // ⟨gap⟩ — no classification rules supplied (`BR-0403`).
                Classification = null,
                AccreditedAt = service.DecidedAt ?? now,
                Status = "active",
            });
        }
        return profile;
    }

    /// <summary>Adds a newly approved service to the accreditation layer
    /// (J-03's add-service, once the addendum is attached).</summary>
    public static async Task AddAccreditedServiceAsync(
        ExpertHubDbContext db,
        Guid trainerUserId,
        string service,
        DateTime now,
        CancellationToken ct)
    {
        var profile = await db.TrainerProfiles.FirstOrDefaultAsync(p => p.UserId == trainerUserId, ct);
        if (profile is null)
        {
            return;
        }
        if (await db.TrainerServices.AnyAsync(
            s => s.TrainerId == profile.TrainerId && s.Service == service, ct))
        {
            return;
        }
        db.TrainerServices.Add(new TrainerServiceRow
        {
            TrainerServiceId = Guid.NewGuid(),
            TrainerId = profile.TrainerId,
            Service = service,
            Classification = null,
            AccreditedAt = now,
            Status = "active",
        });
    }

    /// <summary>The trainer's field values, as the wire's flat map.</summary>
    public static async Task<Dictionary<string, JsonElement>> FieldValuesAsync(
        ExpertHubDbContext db, Guid trainerId, CancellationToken ct)
    {
        var rows = await db.TrainerFieldValues
            .Where(v => v.TrainerId == trainerId)
            .ToListAsync(ct);
        // The flat map is entry 0 — the whole answer for a single-entry
        // section, and the FIRST entry of a repeatable one. It must not throw
        // on the duplicate field codes a repeatable section now produces.
        return rows
            .GroupBy(r => r.FieldCode, StringComparer.Ordinal)
            .ToDictionary(
                g => g.Key,
                g => JsonSerializer.Deserialize<JsonElement>(
                    g.OrderBy(r => r.EntryIndex).First().Value),
                StringComparer.Ordinal);
    }

    /// <summary>
    /// The single classification the wire unions carry. `BR-0403` makes it
    /// per SERVICE, so a trainer can hold several; the wire has one field, so
    /// the HIGHEST held tier is served — and while no classification rules
    /// exist at all (⟨gap⟩), every service is null and this is the entry tier.
    /// </summary>
    public static string Classification(IEnumerable<TrainerServiceRow> services)
    {
        var held = services.Select(s => s.Classification).ToList();
        if (held.Contains(TrainerClassifications.Expert))
        {
            return TrainerClassifications.Expert;
        }
        return held.Contains(TrainerClassifications.Senior)
            ? TrainerClassifications.Senior
            : TrainerClassifications.PendingRulesPlaceholder;
    }

    /// <summary>
    /// The trainer's specialties, for the directory's filter and cards.
    /// ⚠️ `G12`/`Q16` — the taxonomy that would map a trainer's declared
    /// domain onto `DIRECTORY_SPECIALTIES` does not exist, so nothing is
    /// inferred: an empty list is served rather than a guessed mapping, and
    /// the directory's specialty filter therefore matches nothing until the
    /// taxonomy lands. Visible emptiness beats invented data.
    /// </summary>
    public static IReadOnlyList<string> Specialties() => [];

    /// <summary>
    /// The calculated ratings (`02D`) — never the raw MTM value. `pending`
    /// while source records exist but no calculation has run (`DM-GAP-14`
    /// leaves the formula unapproved), `unavailable` when there is nothing
    /// at all.
    /// </summary>
    public static async Task<(string State, decimal? Overall, DateTime? LastRefreshedAt,
        IReadOnlyList<(string Program, decimal Score)> Programs)>
        RatingsAsync(ExpertHubDbContext db, Guid trainerId, CancellationToken ct)
    {
        var ratings = await db.TrainerRatings
            .Where(r => r.TrainerId == trainerId)
            .ToListAsync(ct);
        var overall = ratings.FirstOrDefault(r => r.Scope == "overall");
        if (overall is not null)
        {
            var records = await db.TrainerRecords
                .Where(r => r.TrainerId == trainerId)
                .ToListAsync(ct);
            var perProgram = ratings
                .Where(r => r.Scope == "per_program" && r.RecordId is not null)
                .Select(r => (
                    Program: records.FirstOrDefault(x => x.RecordId == r.RecordId)?.ProgramNameAr
                        ?? string.Empty,
                    Score: r.CalculatedValue))
                .ToList();
            return ("calculated", overall.CalculatedValue, overall.CalculatedAt, perProgram);
        }
        var hasSource = await db.RatingSourceRecords.AnyAsync(r => r.TrainerId == trainerId, ct);
        return (hasSource ? "pending" : "unavailable", null, null, []);
    }

    /// <summary>The trainer's Academy record — programmes delivered.</summary>
    public static async Task<List<TrainerRecord>> RecordsAsync(
        ExpertHubDbContext db, Guid trainerId, CancellationToken ct) =>
        await db.TrainerRecords
            .Where(r => r.TrainerId == trainerId)
            .OrderByDescending(r => r.DeliveredFrom)
            .ToListAsync(ct);

    public static string Serialize<T>(T value) => JsonSerializer.Serialize(value, WireJson);
}
