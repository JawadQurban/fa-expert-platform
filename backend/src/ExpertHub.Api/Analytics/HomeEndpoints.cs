using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Api.Profiles;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Analytics;

/*
 * EH-TP-01 — Portal Home (`F-0906` المؤشرات الشخصية), behind `homeService.ts`:
 *
 *   GET v1/me/home
 *
 * `BR-0902` — own data only. Every figure below is keyed by the caller's own
 * user or trainer id and there is no parameter to widen, which is the same
 * ownership guarantee the rest of `/me/*` holds (`P-190`).
 *
 * `BR-0904` — no stored source. Nothing here is a persisted metric: the
 * application counts are read from CAP-01, the programme count from CAP-04's
 * record, the consent flag from the profile. The ONE persisted number is the
 * calculated rating, and it is persisted because MTM calculated it (`02D`,
 * `P-06`) — the platform still does not compute it.
 *
 * ⚠️ This is deliberately NOT the deferred management KPI set (`G9`/`G13`,
 * `DM-GAP-09`). It is the personal overview the journey describes, and it
 * stops there.
 */

internal sealed record HomeApplicationsWire(
    int Total, int InProgress, int Approved, int RequiresAction);

internal sealed record HomeNotificationWire(
    string Id, string Kind, string Title, string At, bool Read);

internal sealed record PortalHomeWire(
    string DisplayName,
    // Null for anyone who is not a trainer — a classification is a fact about
    // a trainer, and `null` is the honest answer for everybody else.
    string? Classification,
    HomeApplicationsWire Applications,
    int ProgramsCount,
    decimal? OverallRating,
    string RatingState,
    string? RatingLastRefreshedAt,
    bool VisibilityConsent,
    IReadOnlyList<HomeNotificationWire> Notifications,
    bool HasActivity);

/// <summary>The trainer's own overview — `F-0906`, own scope.</summary>
public static class HomeEndpoints
{
    /// <summary>
    /// «الحالات التي يجب أن يتصرف فيها المدرب» — draft and agreement-pending,
    /// the two states where the ball is in the trainer's court.
    /// </summary>
    private static readonly string[] RequiresActionStatuses =
    [
        ApplicationStatuses.Draft,
        ApplicationStatuses.AgreementPending,
    ];

    /// <summary>Still moving, from the applicant's side.</summary>
    private static readonly string[] InProgressStatuses =
    [
        ApplicationStatuses.Submitted,
        ApplicationStatuses.UnderReview,
        ApplicationStatuses.InterviewScheduled,
        ApplicationStatuses.InterviewCompleted,
        ApplicationStatuses.ApprovalInProgress,
    ];

    private static readonly string[] ApprovedStatuses =
    [
        ApplicationStatuses.Approved,
        ApplicationStatuses.Active,
    ];

    public static RouteGroupBuilder MapHomeEndpoints(this RouteGroupBuilder v1)
    {
        // Ownership, not a feature gate — the `/me/*` rule (`P-190`). A person
        // who has applied but holds no role yet still has a portal home, and
        // it is the first screen they see.
        v1.MapGet("/me/home", async (
            HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var profile = await db.TrainerProfiles
                .FirstOrDefaultAsync(p => p.UserId == actor.UserId, ct);

            var applications = await db.Applications
                .Where(a => a.ApplicantUserId == actor.UserId)
                .Select(a => a.Status)
                .ToListAsync(ct);
            var summary = new HomeApplicationsWire(
                applications.Count,
                applications.Count(s => InProgressStatuses.Contains(s)),
                applications.Count(s => ApprovedStatuses.Contains(s)),
                applications.Count(s => RequiresActionStatuses.Contains(s)));

            var (ratingState, overall, refreshedAt, _) = profile is null
                ? ("unavailable", (decimal?)null, (DateTime?)null,
                    (IReadOnlyList<(string Program, decimal Score)>)[])
                : await TrainerProfileService.RatingsAsync(db, profile.TrainerId, ct);

            var programsCount = profile is null
                ? 0
                : await db.TrainerRecords.CountAsync(r => r.TrainerId == profile.TrainerId, ct);

            /*
             * ⚠️ The classification follows the ROLE, on the owner's ruling of
             * 2026-09-08: the trainer role is granted from the Academy's own
             * record, and «the trainer is already [an] approved trainer».
             *
             * So a trainer sees their real classification when a trainer file
             * exists to derive one from, and `certified` when it does not —
             * because the Academy has already vouched for them. Somebody who
             * holds only the baseline role sees NO classification, which is
             * the defect this replaced: the page used to read «no trainer
             * file» as «certified» and greet people who had never applied as
             * «مدرب معتمد».
             */
            var isTrainer = await db.UserRoles.AnyAsync(
                ur => ur.UserId == actor.UserId
                    && db.Roles.Any(r => r.RoleId == ur.RoleId && r.Code == RoleCode.Trainer),
                ct);

            var classification = !isTrainer
                ? null
                : profile is null
                    ? TrainerClassifications.Certified
                    : TrainerProfileService.Classification(
                        await db.TrainerServices
                            .Where(s => s.TrainerId == profile.TrainerId).ToListAsync(ct));

            var notifications = await RecentNotificationsAsync(db, actor.UserId, ct);

            return Results.Ok(new PortalHomeWire(
                actor.FullNameAr,
                classification,
                summary,
                programsCount,
                overall,
                ratingState,
                refreshedAt is { } at ? ApplicationEndpoints.Iso(at) : null,
                profile?.VisibilityConsent ?? false,
                notifications,
                // «مدرب جديد بلا أي نشاط» — the empty state is a fact about
                // the person, decided here so the page never guesses.
                HasActivity: applications.Count > 0
                    || programsCount > 0
                    || notifications.Count > 0));
        }).RequireAuthorization().WithName("PortalHome");

        return v1;
    }

    /// <summary>
    /// The newest in-platform notifications, with their titles taken from the
    /// template that was actually sent — `BR-0701` allows nothing else to
    /// have been sent, and the log stores the code and version, so the
    /// subject is recoverable rather than re-composed.
    /// </summary>
    /// <remarks>
    /// ⚠️ Two honest gaps, both `DM-GAP-08`. <b>`read` is always false</b>:
    /// `NOTIFICATION_LOG` records what was SENT, and the product has no
    /// read-state table — the log is append-only by design (`BR-1204`'s
    /// sibling rule), so marking one read is not a write it can accept.
    /// <b>`kind` is always `info`</b>: the event catalogue carries no tone,
    /// and assigning `success`/`action` per event would be inventing meaning
    /// for twenty events the Academy has not written yet. Exactly `P-128`'s
    /// reasoning for the ERP status — render as given, tone identically, and
    /// let the answer arrive rather than guessing it.
    /// </remarks>
    private static async Task<List<HomeNotificationWire>> RecentNotificationsAsync(
        ExpertHubDbContext db, Guid userId, CancellationToken ct)
    {
        var entries = await db.NotificationLog
            .Where(l => l.RecipientUserId == userId
                && l.Channel == NotificationChannels.InPlatform)
            .OrderByDescending(l => l.SentAt)
            .Take(5)
            .ToListAsync(ct);
        if (entries.Count == 0)
        {
            return [];
        }

        var codes = entries.Select(e => e.TemplateCode).Distinct().ToList();
        var subjects = await db.NotificationTemplates
            .Where(t => codes.Contains(t.Code))
            .Select(t => new { t.Code, t.Version, t.SubjectAr })
            .ToListAsync(ct);
        var events = await db.NotificationEvents
            .Select(e => new { e.EventCode, e.NameAr })
            .ToListAsync(ct);

        return [.. entries.Select(entry => new HomeNotificationWire(
            entry.LogId.ToString(),
            "info",
            subjects.FirstOrDefault(
                    s => s.Code == entry.TemplateCode && s.Version == entry.TemplateVersion)
                ?.SubjectAr
                // No template row (it was edited into a new version, or the
                // matrix has not been written yet): the event's catalogued
                // name is what the platform can truthfully say it was about.
                ?? events.FirstOrDefault(e => e.EventCode == entry.EventCode)?.NameAr
                ?? entry.EventCode,
            ApplicationEndpoints.Iso(entry.SentAt),
            Read: false))];
    }
}
