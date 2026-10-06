using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Meetings;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Interviews;

/// <summary>
/// Assembles the interview booking — who is invited, for how long, in whose
/// language.
/// </summary>
/// <remarks>
/// Separated from the endpoint because the same booking has to be made again
/// on a reschedule, and because the guest list is the part worth reading:
/// <b>the applicant is invited by name and by their own email</b>, which is the
/// whole reason this is a calendar event and not a bare meeting link
/// (owner ruling, 2026-09-09).
/// </remarks>
internal static class InterviewMeeting
{
    /// <summary>J-06/F2's default. Configurable, because thirty minutes is a
    /// business decision and not a fact about software.</summary>
    private const int DefaultMinutes = 30;

    internal static async Task<Infrastructure.Meetings.MeetingBooking?> ForAsync(
        ExpertHubDbContext db,
        IMeetingProvider meetings,
        IConfiguration configuration,
        Application application,
        Interview interview,
        InterviewSlot slot,
        CancellationToken ct)
    {
        var request = await RequestAsync(db, configuration, application, slot, ct)
            .ConfigureAwait(false);

        // A reschedule moves the meeting people already hold rather than
        // stranding them at a link that no longer has anybody behind it.
        return interview.MeetingExternalId is { Length: > 0 } existing
            ? await meetings.RescheduleAsync(existing, request, ct).ConfigureAwait(false)
            : await meetings.BookAsync(request, ct).ConfigureAwait(false);
    }

    private static async Task<MeetingRequest> RequestAsync(
        ExpertHubDbContext db,
        IConfiguration configuration,
        Application application,
        InterviewSlot slot,
        CancellationToken ct)
    {
        var applicant = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == application.ApplicantUserId, ct)
            .ConfigureAwait(false);

        /*
         * The committee that will actually sit in the room: the INTERVIEW panel
         * assigned at the screening decision (J-05/F5/AC-3, J-06/F2/AC-2 «the
         * applicant and all committee members assigned in J-05»). ⚠️ Not the
         * approval committee — that is formed later, in J-09, and reading it
         * here invited nobody but the applicant.
         */
        var committeeEmails = await (
            from evaluation in db.InterviewEvaluations
            join interview in db.Interviews on evaluation.InterviewId equals interview.InterviewId
            join user in db.Users on evaluation.EvaluatorUserId equals user.UserId
            where interview.ApplicationId == application.ApplicationId
            select user.Email).Distinct().ToListAsync(ct).ConfigureAwait(false);

        var attendees = new List<string>(committeeEmails.Count + 1);
        // ⚠️ The applicant first: they are the reason the meeting exists, and
        // an invitation that reaches the committee but not them is the failure
        // that matters.
        if (!string.IsNullOrWhiteSpace(applicant?.Email))
        {
            attendees.Add(applicant.Email);
        }
        attendees.AddRange(committeeEmails.Where(e => !string.IsNullOrWhiteSpace(e)));

        var minutes = configuration.GetValue("Teams:InterviewMinutes", DefaultMinutes);
        var language = applicant?.PreferredCommunicationLanguage == "en" ? "en" : "ar";

        return new MeetingRequest(
            Subject: language == "en"
                ? $"Financial Academy — interview {application.Reference}"
                : $"الأكاديمية المالية — مقابلة {application.Reference}",
            StartsAtUtc: DateTime.SpecifyKind(slot.StartsAt, DateTimeKind.Utc),
            Duration: TimeSpan.FromMinutes(minutes <= 0 ? DefaultMinutes : minutes),
            AttendeeEmails: attendees,
            LanguageTag: language);
    }
}
