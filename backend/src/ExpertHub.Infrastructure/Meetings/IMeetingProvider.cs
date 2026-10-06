namespace ExpertHub.Infrastructure.Meetings;

/// <summary>
/// One interview to put in a calendar.
/// </summary>
/// <param name="Subject">What the invitation is called, in the reader's language.</param>
/// <param name="StartsAtUtc">The confirmed slot.</param>
/// <param name="Duration">How long to book. The slot stores only a start.</param>
/// <param name="AttendeeEmails">
/// Everybody invited. ⚠️ The applicant is <b>external to the Academy</b>, which
/// is the whole reason this is a calendar event rather than a bare meeting
/// link: an app-created <c>onlineMeeting</c> cannot carry a guest.
/// </param>
/// <param name="LanguageTag">`ar` or `en` — the invitation is written in it.</param>
public sealed record MeetingRequest(
    string Subject,
    DateTime StartsAtUtc,
    TimeSpan Duration,
    IReadOnlyList<string> AttendeeEmails,
    string LanguageTag);

/// <summary>What was booked: the join link, and the provider's own id for it.</summary>
/// <param name="JoinUrl">The link the applicant and the committee open.</param>
/// <param name="ExternalId">
/// The event's id at the provider, kept so a reschedule can move THIS meeting
/// rather than leaving an orphan in the organiser's calendar and a dead link in
/// somebody's inbox.
/// </param>
public sealed record MeetingBooking(string JoinUrl, string ExternalId);

/// <summary>
/// Books the online meeting for a scheduled interview.
/// </summary>
/// <remarks>
/// <para>
/// A port with a null default, like <c>IEmailGateway</c>, <c>IDocumentStore</c>
/// and the FAST client: unconfigured, the product behaves exactly as it does
/// today — the meeting link stays null and the panel offers nothing, which is
/// what it has always done (`J-06` open item 1).
/// </para>
/// <para>
/// ⚠️ <b>A failure here must never cost somebody their interview.</b> The
/// applicant has chosen a time and the committee is expecting them; whether a
/// calendar system answered is a separate matter, and staff can always paste a
/// link. So every implementation returns null rather than throwing, and the
/// caller carries on.
/// </para>
/// </remarks>
public interface IMeetingProvider
{
    /// <summary>True when a deployment has actually configured a provider.</summary>
    bool IsConfigured { get; }

    /// <summary>The booking, or null when none could be made — never throws.</summary>
    Task<MeetingBooking?> BookAsync(MeetingRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Moves an existing booking. Returns null when it could not be moved, at
    /// which point the caller keeps the link it already has rather than
    /// silently dropping a meeting people may already be holding.
    /// </summary>
    Task<MeetingBooking?> RescheduleAsync(
        string externalId, MeetingRequest request, CancellationToken cancellationToken);
}

/// <summary>The stand-in while no meeting system is configured.</summary>
public sealed class NoMeetingProvider : IMeetingProvider
{
    public bool IsConfigured => false;

    public Task<MeetingBooking?> BookAsync(
        MeetingRequest request, CancellationToken cancellationToken) =>
        Task.FromResult<MeetingBooking?>(null);

    public Task<MeetingBooking?> RescheduleAsync(
        string externalId, MeetingRequest request, CancellationToken cancellationToken) =>
        Task.FromResult<MeetingBooking?>(null);
}
