using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Applications;
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
/// ⚠️ <b>Two kinds of value, and they are not equal (`P-392`).</b> The
/// working-life fields are a suggestion, exactly as the bank prefill is
/// (`P-229`): the applicant can change them. The identity fields the schema
/// marks `sso-profile` are NOT: where FAST verified one, that value is what the
/// application stores, whatever the client sends — see
/// <see cref="LockIdentityAsync"/>. A security test (Identity Spoofing) found
/// the draft and submit paths storing a client-supplied name and ID number.
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
/// </remarks>
internal static class ApplicationPrefill
{
    /// <summary>
    /// The suggestions for this person, or an empty map when the Academy holds
    /// nothing — which is the case for anybody who has not signed in since the
    /// profile import shipped.
    /// </summary>
    /// <remarks>
    /// An identity value the published form would refuse is left out, so the
    /// form never locks a field on an answer it cannot submit; the applicant
    /// types that one, as they would with no record at all.
    /// </remarks>
    internal static async Task<IReadOnlyDictionary<string, string>> ForUserAsync(
        ExpertHubDbContext db, Guid userId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(db);

        var suggestions = await FromAcademyAsync(db, userId, ct).ConfigureAwait(false);
        var accepted = await AcceptedIdentityAsync(
            db, suggestions, FormSchemaVersions.Current, ct).ConfigureAwait(false);
        foreach (var code in suggestions.Keys
            .Where(code => FastFieldMap.FastOwnedFields.Contains(code) && !accepted.ContainsKey(code))
            .ToList())
        {
            suggestions.Remove(code);
        }
        return suggestions;
    }

    /// <summary>
    /// <paramref name="input"/> with every identity field FAST verified for the
    /// applicant replaced by FAST's value.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Run by both the draft save and the submission, for the applicant's own
    /// form and a nomination alike, so no path stores an identity the Academy
    /// did not issue. The value is replaced rather than the request refused:
    /// a draft saved before the lock may carry a typed value, and refusing it
    /// would leave its applicant unable to save at all.
    /// </para>
    /// <para>
    /// ⚠️ <b>Only what FAST holds is locked.</b> `gender` is never sent, a name
    /// split FAST's record cannot anchor is left blank, and a person with no
    /// record has nothing — those are still typed by the applicant, because
    /// they are required and nobody else can supply them.
    /// </para>
    /// </remarks>
    internal static async Task<SaveDraftInputWire> LockIdentityAsync(
        ExpertHubDbContext db, Application draft, SaveDraftInputWire input, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(draft);
        ArgumentNullException.ThrowIfNull(input);

        var verified = await AcceptedIdentityAsync(
            db,
            await FromAcademyAsync(db, draft.ApplicantUserId, ct).ConfigureAwait(false),
            draft.SchemaVersion,
            ct).ConfigureAwait(false);
        if (verified.Count == 0)
        {
            return input;
        }

        var values = new Dictionary<string, JsonElement>(
            input.Values ?? new Dictionary<string, JsonElement>(), StringComparer.Ordinal);
        foreach (var (code, value) in verified)
        {
            values[code] = value;
        }
        // An entry is written before the flat values and wins over them, so a
        // locked code smuggled into a repeatable section would land instead.
        var entries = input.Entries?.ToDictionary(
            section => section.Key,
            section => (IReadOnlyList<DraftEntryWire>)[.. section.Value.Select(entry => entry with
            {
                Values = entry.Values?
                    .Where(pair => !verified.ContainsKey(pair.Key))
                    .ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal),
            })],
            StringComparer.Ordinal);
        return input with { Values = values, Entries = entries };
    }

    private static async Task<Dictionary<string, string>> FromAcademyAsync(
        ExpertHubDbContext db, Guid userId, CancellationToken ct)
    {
        var suggestions = new Dictionary<string, string>(StringComparer.Ordinal);
        var replica = await db.FastProfiles.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct)
            .ConfigureAwait(false);
        if (replica is null)
        {
            return suggestions;
        }

        // The full names live on the user record, not the replica — that is
        // where `D-15` put them, and the name split needs both.
        var user = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId, ct)
            .ConfigureAwait(false);

        FastFieldMap.Add(replica, user?.FullNameAr, user?.FullNameEn, suggestions);
        return suggestions;
    }

    /// <summary>
    /// The identity values in <paramref name="fromAcademy"/> that
    /// <paramref name="schemaVersion"/> accepts, as the wire carries them.
    /// </summary>
    private static async Task<Dictionary<string, JsonElement>> AcceptedIdentityAsync(
        ExpertHubDbContext db,
        IReadOnlyDictionary<string, string> fromAcademy,
        string schemaVersion,
        CancellationToken ct)
    {
        var identity = fromAcademy
            .Where(pair => FastFieldMap.FastOwnedFields.Contains(pair.Key))
            .ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal);
        if (identity.Count == 0)
        {
            return new Dictionary<string, JsonElement>(StringComparer.Ordinal);
        }
        var codes = identity.Keys.ToList();
        var definitions = (await db.FormFields.AsNoTracking()
                .Where(f => f.SchemaVersion == schemaVersion && codes.Contains(f.FieldCode))
                .ToListAsync(ct)
                .ConfigureAwait(false))
            .ToDictionary(f => f.FieldCode, f => ApplicationFormLogic.Parse(f.Definition), StringComparer.Ordinal);

        var accepted = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
        foreach (var (code, text) in identity)
        {
            var value = JsonSerializer.SerializeToElement(text);
            if (definitions.TryGetValue(code, out var definition)
                && ApplicationFormLogic.IsShapeValid(definition, value))
            {
                accepted[code] = value;
            }
        }
        return accepted;
    }
}
