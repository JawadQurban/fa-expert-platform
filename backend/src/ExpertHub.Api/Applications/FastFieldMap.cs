using System.Globalization;
using ExpertHub.Core.Domain;

namespace ExpertHub.Api.Applications;

/// <summary>
/// Everything the Academy holds about a person, expressed in the application
/// form's own field codes — the single mapping every surface reads.
/// </summary>
/// <remarks>
/// <para>
/// Owner ruling, 2026-09-10: «work on all the data from FAST, and if it comes
/// from FAST it should be already approved — all this information on the API,
/// also for the approved one».
/// </para>
/// <para>
/// ⚠️ <b>Which fields FAST owns is not a judgement made here.</b> The seeded
/// schema already declares it: twelve fields carry `"ownership":"sso-profile"`
/// — the eight name parts, `idNumber`, `dateOfBirth`, `nationality`, `gender`
/// — and everything else is Expert Hub's own. `FastOwnedFields` mirrors that
/// list so a caller can ask «did this come from the Academy?» without
/// re-deriving it, and `AddAsync` fills exactly what the record supports.
/// </para>
/// <para>
/// ⚠️ <b>Nothing here is invented.</b> A value FAST does not send is left out
/// so the field renders empty and reads as missing — `gender` is the standing
/// example: `Users/Info` has no gender field at all, so that box stays blank
/// for everybody and no default is picked.
/// </para>
/// </remarks>
/// <summary>
/// What the mapping filled, and which Academy records are now on screen.
/// </summary>
internal readonly record struct FastMapResult(
    IReadOnlySet<string> Filled, FastRecordsUsed Used);

internal static class FastFieldMap
{
    /// <summary>
    /// The field codes the schema marks `sso-profile` — the Academy's, not
    /// this platform's.
    /// </summary>
    /// <remarks>
    /// ⚠️ Kept in sync with `ApplicationSeedData` by a test, because the two
    /// lists drifting apart would silently mislabel where a value came from.
    /// </remarks>
    internal static readonly IReadOnlySet<string> FastOwnedFields =
        new HashSet<string>(StringComparer.Ordinal)
        {
            "firstNameAr", "middleNameAr", "thirdNameAr", "lastNameAr",
            "firstNameEn", "middleNameEn", "thirdNameEn", "lastNameEn",
            "idNumber", "dateOfBirth", "nationality", "gender",
        };

    /// <summary>
    /// Adds what the Academy holds to <paramref name="into"/>, and reports
    /// which codes it filled.
    /// </summary>
    /// <param name="replica">The record read at the person's last sign-in.</param>
    /// <param name="fullNameAr">The Arabic full name, from the user record.</param>
    /// <param name="fullNameEn">The English full name, from the user record.</param>
    /// <param name="into">The map to fill. Existing entries are never replaced.</param>
    /// <returns>The codes this call put a value into.</returns>
    /// <remarks>
    /// ⚠️ <b>Never overwrites.</b> Anything already in the map was answered by
    /// the person themselves on an application the Academy accredited; the
    /// replica is a copy of what FAST held at their last sign-in. Where both
    /// have a field, the answer stands.
    /// </remarks>
    internal static FastMapResult Add(
        FastProfileReplica? replica,
        string? fullNameAr,
        string? fullNameEn,
        Dictionary<string, string> into)
    {
        ArgumentNullException.ThrowIfNull(into);
        var filled = new HashSet<string>(StringComparer.Ordinal);
        if (replica is null)
        {
            return new FastMapResult(filled, default);
        }

        // ── the identity FAST verified ────────────────────────────────────
        var arabic = FastNameSplit.Split(fullNameAr, replica.FirstNameAr);
        Add("firstNameAr", arabic.Parts.First);
        if (arabic.Confident)
        {
            Add("middleNameAr", arabic.Parts.Middle);
            Add("thirdNameAr", arabic.Parts.Third);
            Add("lastNameAr", arabic.Parts.Family);
        }

        var english = FastNameSplit.Split(fullNameEn, replica.FirstNameEn);
        Add("firstNameEn", english.Parts.First);
        if (english.Confident)
        {
            Add("middleNameEn", english.Parts.Middle);
            Add("thirdNameEn", english.Parts.Third);
            Add("lastNameEn", english.Parts.Family);
        }

        Add("idNumber", replica.IdNumber);
        // `yyyy-MM-dd`, which is what a date field reads. The form renders it
        // in the reader's own calendar; the wire stays unambiguous.
        Add("dateOfBirth", replica.DateOfBirth?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
        // Resolved through FAST's own country lookup at sign-in; null when the
        // lookup has not run or did not recognise the id.
        Add("nationality", replica.NationalityCode);

        /*
         * ⚠️ `gender` is deliberately absent and will stay absent until FAST
         * sends it. `Users/Info` has no gender field — not an empty one, none
         * — and it cannot be derived from a name or an ID number. The box
         * renders empty and reads as missing, which is exactly true.
         */

        // ── the working life Expert Hub asks about ────────────────────────
        Add("jobTitle", replica.JobTitle);
        Add("organization", replica.Organization);

        /*
         * ⚠️ `socialMediaUrl` is ONE field and the form has two — `linkedin`
         * and `personalWebsite`. Which one FAST means is a coin toss, so it
         * fills the one it can be checked against: a linkedin.com address is
         * a LinkedIn account and anything else is a personal site.
         */
        if (!string.IsNullOrWhiteSpace(replica.SocialMediaUrl))
        {
            var url = replica.SocialMediaUrl.Trim();
            Add(
                url.Contains("linkedin.", StringComparison.OrdinalIgnoreCase)
                    ? "linkedin"
                    : "personalWebsite",
                url);
        }

        // ── qualifications and certifications ─────────────────────────────
        var before = new HashSet<string>(into.Keys, StringComparer.Ordinal);
        var used = FastQualificationFields.Add(replica, into);
        foreach (var code in into.Keys.Where(code => !before.Contains(code)))
        {
            filled.Add(code);
        }

        return new FastMapResult(filled, used);

        void Add(string field, string? value)
        {
            // ⚠️ An empty string is not an answer. A form pre-filled with
            // blanks it presents as known is worse than an empty one.
            if (!string.IsNullOrWhiteSpace(value) && !into.ContainsKey(field))
            {
                into[field] = value.Trim();
                filled.Add(field);
            }
        }
    }
}
