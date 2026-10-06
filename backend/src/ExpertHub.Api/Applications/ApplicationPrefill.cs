using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Applications;

/// <summary>
/// What the Academy already knows about the signed-in person, keyed by the
/// application form's own field codes.
/// </summary>
/// <remarks>
/// <para>
/// Owner ruling, 2026-09-09: «when applying to become a trainer, the main data
/// if he is logged in it should appear directly, no need to write it again».
/// The profile is read at sign-in (`P-227`) and sits in `FAST_USER_PROFILE`;
/// this hands the relevant parts of it to the form.
/// </para>
/// <para>
/// ⚠️ <b>A suggestion, exactly as the bank prefill is (`P-229`).</b> Nothing
/// here is submitted, nothing is written to `APPLICATION_FIELD_VALUE`, and the
/// applicant can change every one of these before they send anything. What it
/// removes is the retyping, not the responsibility.
/// </para>
/// <para>
/// ⚠️ <b>The mapping itself lives in <see cref="FastFieldMap"/></b>, which the
/// profile reads too — owner ruling, 2026-09-10: «all this information on the
/// API, also for the approved one». One mapping, so the form a person fills in
/// and the profile they read afterwards cannot disagree about what the Academy
/// holds.
/// </para>
/// <para>
/// ⚠️ <b>A correction worth keeping.</b> This file used to claim FAST «sends one
/// `fullNameAr` and one `fullNameEn`» and left all eight name fields blank on
/// that basis. It sends `firstNameAr` and `firstNameEn` as their own fields and
/// always has — nobody read past the full names. `gender` remains the one
/// genuinely absent field: `Users/Info` has no such property at all.
/// </para>
internal static class ApplicationPrefill
{
    /// <summary>
    /// The suggestions for this person, or an empty map when the Academy holds
    /// nothing — which is the case for anybody who has not signed in since the
    /// profile import shipped.
    /// </summary>
    internal static async Task<IReadOnlyDictionary<string, string>> ForUserAsync(
        ExpertHubDbContext db, Guid userId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(db);

        var replica = await db.FastProfiles.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct)
            .ConfigureAwait(false);
        if (replica is null)
        {
            return new Dictionary<string, string>(StringComparer.Ordinal);
        }

        // The full names live on the user record, not the replica — that is
        // where `D-15` put them, and the name split needs both.
        var user = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId, ct)
            .ConfigureAwait(false);

        var suggestions = new Dictionary<string, string>(StringComparer.Ordinal);
        FastFieldMap.Add(replica, user?.FullNameAr, user?.FullNameEn, suggestions);
        return suggestions;
    }
}
