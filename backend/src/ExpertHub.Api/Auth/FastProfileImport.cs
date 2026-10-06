using System.Security.Claims;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Api.Configuration;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ExpertHub.Api.Auth;

/// <summary>
/// Reads the signed-in person's FAST profile and reflects it into Expert Hub.
/// </summary>
/// <remarks>
/// <para>
/// <b>Why at sign-in.</b> Every FAST endpoint is scoped to «the currently
/// authenticated user», and Expert Hub deliberately does not keep the access
/// token (`P-215`). The handshake is therefore the one moment the profile can
/// be read at all — so it is read then, and the token is still discarded.
/// </para>
/// <para>
/// <b>What this fixes.</b> The token carries only `sub` and `email`, so the
/// inbox showed applicants as `JawadQurban` and `1000499630`, the public
/// directory showed identifiers, and search by name returned nothing
/// (`D-15`). `Users/Info` carries the real names in both languages, so the
/// display-name claim we were asking FAST for (`Q37`) turns out not to be
/// needed.
/// </para>
/// <para>
/// ⚠️ <b>Best effort, always.</b> A failure here must never block a sign-in:
/// FAST being unreachable is not a reason a person cannot use the platform.
/// The replica simply stays at its previous value, dated.
/// </para>
/// </remarks>
internal static partial class FastProfileImport
{
    /*
     * ⚠️ Every outcome is logged, including the boring ones.
     *
     * This runs inside a sign-in and swallows its own failures on purpose — a
     * person must be able to use the platform when the Academy's API is down.
     * Swallowed and SILENT, though, is a different thing: the symptom of every
     * failure here is identical to the symptom of the client being switched
     * off, which is a screen that looks exactly like it did last week. Whoever
     * deploys this needs `docker logs expert-hub-api` to tell them which of the
     * two they are looking at, without adding a diagnostic endpoint that
     * exposes what the platform knows about a person.
     */

    [LoggerMessage(Level = LogLevel.Debug,
        Message = "FAST profile import skipped: the client is not configured (Fast__BaseUrl is empty).")]
    private static partial void LogNotConfigured(ILogger logger);

    [LoggerMessage(Level = LogLevel.Information,
        Message = "FAST profile imported for {Subject}.")]
    private static partial void LogImported(ILogger logger, string subject);

    [LoggerMessage(Level = LogLevel.Warning,
        Message = "FAST profile not imported for {Subject}: {Reason}")]
    private static partial void LogRefused(ILogger logger, string subject, string reason);

    [LoggerMessage(Level = LogLevel.Warning,
        Message = "FAST profile import failed for {Subject}.")]
    private static partial void LogFailed(ILogger logger, string subject, Exception exception);

    [LoggerMessage(Level = LogLevel.Information,
        Message = "Trainer role granted to {Subject} from their Academy record.")]
    private static partial void LogTrainerGranted(ILogger logger, string subject);

    [LoggerMessage(Level = LogLevel.Information,
        Message = "FAST qualifications read for {Subject}: {Count} items across four collections.")]
    private static partial void LogQualifications(ILogger logger, string subject, int count);

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    internal static async Task ImportAsync(
        HttpContext http, ClaimsPrincipal? principal, string accessToken)
    {
        var subject = principal?.FindFirst(ExpertHubClaims.Subject)?.Value;
        if (string.IsNullOrWhiteSpace(subject))
        {
            return;
        }

        var logger = http.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(typeof(FastProfileImport));

        var reader = http.RequestServices.GetService<FastUserReader>();
        if (reader is null || !reader.IsConfigured)
        {
            LogNotConfigured(logger);
            return;
        }

        try
        {
            var result = await reader
                .GetInfoAsync(accessToken, "ar", http.RequestAborted)
                .ConfigureAwait(false);
            if (!result.Ok || result.Value is null)
            {
                // The most likely reason on a first deployment, and the one
                // worth reading in full: FAST answering 401 means the access
                // token from sign-in is not accepted by its API, which is a
                // scope or audience question for the FAST team (`19` §4), not
                // a bug to hunt here.
                LogRefused(logger, subject, result.Error ?? "no payload returned");
                return;
            }
            var db = http.RequestServices.GetRequiredService<ExpertHubDbContext>();
            var user = await ApplyAsync(db, subject, result.Value, http.RequestAborted)
                .ConfigureAwait(false);

            /*
             * The qualifications, in the same breath as the profile (owner
             * ruling, 2026-09-09). They are user-scoped like everything else
             * FAST exposes, so this is the only moment they can be read.
             *
             * ⚠️ Best effort of its own: a failure here must not lose the
             * profile import that already succeeded. Somebody's real name
             * appearing is worth more than their certificate count.
             */
            if (user is not null)
            {
                /*
                 * The nationality, which is a number until FAST's own country
                 * lookup turns it into a country (`P-262`).
                 *
                 * ⚠️ Best effort, and quiet about it: the profile import has
                 * already succeeded by this point, and one unresolved form
                 * field is not worth losing somebody's real name over. The raw
                 * id stays on the replica either way, so the next sign-in can
                 * resolve what this one could not.
                 */
                var countries = http.RequestServices.GetService<FastCountryReader>();
                if (countries is { IsConfigured: true })
                {
                    try
                    {
                        var replicaRow = db.FastProfiles.Local
                            .FirstOrDefault(p => p.UserId == user.UserId);
                        if (replicaRow?.NationalityCountryId is not null)
                        {
                            var country = await countries
                                .ByIdAsync(
                                    replicaRow.NationalityCountryId,
                                    accessToken,
                                    http.RequestAborted)
                                .ConfigureAwait(false);
                            replicaRow.NationalityCode =
                                Applications.FastNationality.Resolve(country);
                            await db.SaveChangesAsync(http.RequestAborted).ConfigureAwait(false);
                        }
                    }
                    catch (Exception exception) when (exception is not OperationCanceledException
                        || !http.RequestAborted.IsCancellationRequested)
                    {
                        LogFailed(logger, subject, exception);
                    }
                }

                /*
                 * The Academy's own trainer contracts (`P-266`).
                 *
                 * ⚠️ READ ONLY. `Approve` and `Refuse` exist on the same FAST
                 * controller and are deliberately not called: whether a FAST
                 * «trainer contract» is the same artefact as an Expert Hub
                 * agreement is unanswered, and calling them would commit this
                 * platform to FAST mastering it before anybody decided that.
                 */
                var contracts = http.RequestServices.GetService<FastContractsReader>();
                if (contracts is { IsConfigured: true })
                {
                    try
                    {
                        var raw = await contracts
                            .ReadAsync(accessToken, "ar", http.RequestAborted)
                            .ConfigureAwait(false);
                        // ⚠️ A failed read is NOT «this person has no
                        // contracts» — leave the last good copy and its date
                        // alone rather than recording an outage as an answer.
                        if (raw is not null)
                        {
                            var row = db.FastProfiles.Local
                                .FirstOrDefault(p => p.UserId == user.UserId)
                                ?? await db.FastProfiles.FirstOrDefaultAsync(
                                    p => p.UserId == user.UserId, http.RequestAborted)
                                    .ConfigureAwait(false);
                            if (row is not null)
                            {
                                row.Contracts = raw;
                                row.ContractsSyncedAt = DateTime.UtcNow;
                                await db.SaveChangesAsync(http.RequestAborted)
                                    .ConfigureAwait(false);
                            }
                        }
                    }
                    catch (Exception exception) when (exception is not OperationCanceledException
                        || !http.RequestAborted.IsCancellationRequested)
                    {
                        LogFailed(logger, subject, exception);
                    }
                }

                var qualifications = http.RequestServices
                    .GetService<FastQualificationsReader>();
                if (qualifications is { IsConfigured: true })
                {
                    try
                    {
                        var set = await qualifications
                            .ReadAsync(accessToken, "ar", http.RequestAborted)
                            .ConfigureAwait(false);
                        await ApplyQualificationsAsync(db, user.UserId, set, http.RequestAborted)
                            .ConfigureAwait(false);
                        LogQualifications(logger, subject, set.Counts().Total);
                    }
                    catch (Exception exception) when (exception is not OperationCanceledException
                        || !http.RequestAborted.IsCancellationRequested)
                    {
                        LogFailed(logger, subject, exception);
                    }
                }
            }

            /*
             * Owner ruling (2026-09-08): somebody the Academy already registers
             * as a trainer gets the trainer role here, rather than waiting for
             * an administrator to retype what the Academy knows.
             *
             * ⚠️ It has to happen HERE, not in `OnTokenValidated` where roles
             * are otherwise resolved: that event fires BEFORE this one, so on a
             * first sign-in the profile does not exist yet and the grant would
             * always lag by one visit — the person signs in, sees nothing,
             * signs in again, and it works. That is the kind of bug that gets
             * reported as "sometimes".
             */
            var granted = false;
            if (user is not null)
            {
                var access = http.RequestServices
                    .GetRequiredService<IOptions<AccessOptions>>().Value;
                granted = await FastTrainerGrant.ApplyAsync(
                        db,
                        user,
                        result.Value,
                        access.TrainerFastRoles.Split(
                            ',',
                            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
                        http.RequestAborted)
                    .ConfigureAwait(false);
            }

            await db.SaveChangesAsync(http.RequestAborted).ConfigureAwait(false);
            LogImported(logger, subject);

            // The role the person just received must reach THIS session's
            // cookie. `OnTokenValidated` has already run, so without this the
            // grant is real in the database and invisible until they sign in
            // again — which reads as the platform ignoring it.
            if (granted && principal?.Identity is ClaimsIdentity identity
                && !identity.HasClaim(ExpertHubClaims.Role, ExpertHubClaims.TrainerRole))
            {
                identity.AddClaim(
                    new Claim(ExpertHubClaims.Role, ExpertHubClaims.TrainerRole));
                LogTrainerGranted(logger, subject);
            }
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !http.RequestAborted.IsCancellationRequested)
        {
            // Swallowed on purpose — see the remarks. A sign-in that works
            // with a stale name beats one that fails with a fresh one.
            LogFailed(logger, subject, exception);
        }
    }

    /// <summary>
    /// Writes the replica and reflects the few fields `APP_USER` owns a copy
    /// of. Separated so a test can drive it without an HTTP handshake.
    /// </summary>
    internal static async Task<AppUser?> ApplyAsync(
        ExpertHubDbContext db, string subject, FastUserProfile profile, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(profile);

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.ExternalIdentityId == subject, ct)
            .ConfigureAwait(false);
        if (user is null)
        {
            return null;
        }

        /*
         * ⚠️ Only fields FAST masters, and only when FAST actually sent one.
         * An empty string from a partially-filled remote profile must not
         * erase a name we already display — `08` §1.1's rule read in the
         * inbound direction.
         */
        if (!string.IsNullOrWhiteSpace(profile.FullNameAr))
        {
            user.FullNameAr = profile.FullNameAr;
        }
        if (!string.IsNullOrWhiteSpace(profile.FullNameEn))
        {
            user.FullNameEn = profile.FullNameEn;
        }
        if (!string.IsNullOrWhiteSpace(profile.PhoneNumber))
        {
            user.Phone = profile.PhoneNumber;
        }
        if (!string.IsNullOrWhiteSpace(profile.PreferredUiLanguage))
        {
            user.PreferredUiLanguage = profile.PreferredUiLanguage;
        }
        if (!string.IsNullOrWhiteSpace(profile.PreferredCommunicationLanguage))
        {
            user.PreferredCommunicationLanguage = profile.PreferredCommunicationLanguage;
        }
        // FAST knows who works for the Academy better than a role-claim
        // mapping that is still unconfigured (`Q37`). This decides who is
        // selectable for a committee, not what they may do — permissions
        // remain Expert Hub's own (`P-181`).
        if (profile.IsEmployee)
        {
            user.IsEmployee = true;
        }

        var replica = await db.FastProfiles
            .FirstOrDefaultAsync(p => p.UserId == user.UserId, ct)
            .ConfigureAwait(false);
        if (replica is null)
        {
            replica = new FastProfileReplica { UserId = user.UserId };
            db.FastProfiles.Add(replica);
        }

        replica.FastUserId = profile.Id;
        replica.IdNumber = profile.IdNumber;
        replica.PassportNumber = profile.PassportNumber;
        replica.ResidencyNumber = profile.ResidencyNumber;
        replica.DateOfBirth = profile.DateOfBirth;
        replica.FirstNameAr = profile.FirstNameAr;
        replica.FirstNameEn = profile.FirstNameEn;
        replica.NationalityCountryId = profile.NationalityCountryId;
        replica.JobTitle = profile.JobTitle;
        replica.Organization = profile.UserOrganization;
        replica.SocialMediaUrl = profile.SocialMediaUrl;
        replica.CanChangeProfile = profile.CanChangeProfile;
        replica.IsOrganizationAdmin = profile.IsOrganizationAdmin;
        replica.IsOrganizationCoordinator = profile.IsOrganizationCoordinator;
        replica.FastRoles = JsonSerializer.Serialize(profile.Roles, Json);
        replica.ExpertCorrector = profile.UserProfile?.ExpertCorrector ?? false;
        replica.ExpertReviewer = profile.UserProfile?.ExpertReviewer ?? false;
        replica.ExpertQuestionAuthor = profile.UserProfile?.ExpertQuestionAuthor ?? false;

        // The eight J-09/F6 fields, kept so the bank form can PREFILL rather
        // than ask a person to retype what the Academy already holds. Storing
        // them is not submitting them: `BANK_DATA.completed_at` is still only
        // set when the applicant confirms.
        var bank = profile.BankFields();
        replica.BankFields = bank.Count > 0 ? JsonSerializer.Serialize(bank, Json) : null;

        replica.LastSyncedAt = DateTime.UtcNow;

        return user;
    }

    /// <summary>
    /// Stores the four qualification collections as received.
    /// </summary>
    /// <remarks>
    /// ⚠️ A collection that failed to read is left ALONE rather than nulled.
    /// One endpoint being down should not erase what a previous sign-in
    /// successfully stored — the replica is a record of the best answer we
    /// have had, not of the last attempt.
    /// </remarks>
    internal static async Task ApplyQualificationsAsync(
        ExpertHubDbContext db, Guid userId, FastQualificationSet set, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(set);

        /*
         * ⚠️ `Local` FIRST, then the database.
         *
         * On a FIRST sign-in `ApplyAsync` has just added this replica and
         * nothing has been saved yet, so a database query finds nothing and
         * every qualification would be dropped for exactly the people who have
         * none stored — silently, and only on the one visit that matters.
         *
         * This is the fourth time staged-vs-stored has bitten in this codebase.
         * The rule: within one `SaveChanges`, a read that might see a row this
         * unit of work created must check the change tracker too.
         */
        var replica = db.FastProfiles.Local.FirstOrDefault(p => p.UserId == userId)
            ?? await db.FastProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId, ct)
                .ConfigureAwait(false);
        if (replica is null)
        {
            return;
        }

        replica.QualificationsEducation = set.Education ?? replica.QualificationsEducation;
        replica.QualificationsPracticalExperience =
            set.PracticalExperience ?? replica.QualificationsPracticalExperience;
        replica.QualificationsProfessional =
            set.Professional ?? replica.QualificationsProfessional;
        replica.QualificationsTrainingCourses =
            set.TrainingCourses ?? replica.QualificationsTrainingCourses;
        replica.QualificationsSyncedAt = DateTime.UtcNow;
    }
}
