using System.Text.Json;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Applications;

/// <summary>
/// The bank details the Academy already holds for this person, offered to the
/// bank form as a starting point.
/// </summary>
/// <remarks>
/// <para>
/// `J-09/F6/AC-3` asks for eight fields, and FAST's `Users/Info` already
/// carries all eight (`P-229`). Making somebody retype an IBAN the Academy has
/// on file is both a poor journey and the likeliest way a payment instruction
/// acquires a typo, so the form starts filled and asks them to check it.
/// </para>
/// <para>
/// ⚠️ <b>A suggestion is not a submission.</b> This never touches
/// `BANK_DATA.completed_at` — `AC-4` makes the applicant's own confirmation the
/// thing that unblocks agreement preparation, and a form the platform filled in
/// on their behalf has confirmed nothing. It is served under its own key for
/// the same reason: a screen must be able to tell «what you confirmed» from
/// «what we think we know».
/// </para>
/// </remarks>
internal static class BankPrefill
{
    /// <summary>
    /// The replica's bank fields, or null when there are none — which is the
    /// case for anyone who has not signed in since the profile import shipped,
    /// and for anyone whose Academy record has no bank details.
    /// </summary>
    internal static async Task<IReadOnlyDictionary<string, string>?> ForUserAsync(
        ExpertHubDbContext db, Guid userId, CancellationToken ct)
    {
        var stored = await db.FastProfiles.AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => p.BankFields)
            .FirstOrDefaultAsync(ct);
        if (string.IsNullOrWhiteSpace(stored))
        {
            return null;
        }

        try
        {
            var fields = JsonSerializer.Deserialize<Dictionary<string, string>>(stored);
            return fields is { Count: > 0 } ? fields : null;
        }
        catch (JsonException)
        {
            // A replica in an older shape is stale data, not a reason the
            // application detail fails to load.
            return null;
        }
    }
}
