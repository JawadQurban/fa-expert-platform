using System.Text.Json;
using System.Text.RegularExpressions;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Api.Profiles;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Agreements;

/*
 * The applicant's half of CAP-03 — J-11/F1 (the three-way decision) and
 * J-09/F6 (bank data), behind contracts the frontend already calls:
 *
 *   POST v1/me/applications/{id}/agreement-decision   (applicationsService.ts)
 *   POST v1/me/profile/bank-data                      (profileService.ts)
 *
 * J-11/F1 gives the applicant THREE mutually exclusive answers to one
 * question, so they are one endpoint:
 * - **sign** (AC-3) — in-platform, the same P-J10 mechanism J-10 uses;
 *   activation follows immediately, with the term `BR-0302` decides.
 * - **reject** (AC-4) — PERMANENTLY closes the application: no return path,
 *   no automatic re-submission. The note is optional; the journey requires
 *   no reason, and requiring one would invent a rule.
 * - **request-modification** (AC-5) — the note is MANDATORY, because it goes
 *   back to the J-10 preparer, who otherwise cannot tell what to change.
 */

internal sealed record ApplicantDecisionInputWire(
    string? Kind, string? Note, string? SignatureName);

/// <summary>«دولة البنك» as FAST's list knows it: whether it is on the list,
/// and its ISO 3166 alpha-2 code when FAST gives one.</summary>
internal sealed record BankCountry(bool Listed, string? Iso);

internal sealed record BankDataInputWire(
    string? BankCountry, string? BankCity, string? BankName, string? BranchName,
    string? Iban, string? SwiftCode, string? AccountHolderName, string? AccountNumber);

/// <summary>The applicant-facing CAP-03 surface.</summary>
public static partial class ApplicantAgreementEndpoints
{
    /// <summary>
    /// J-09 «Bank Data Field Validation Rules». Checked on SAVE only — data
    /// saved before these rules existed is never re-validated or rewritten.
    /// Letters are matched case-insensitively and the value is stored as typed.
    /// </summary>
    /// <param name="fields">The eight trimmed bank fields.</param>
    /// <param name="country">«دولة البنك» against FAST's country list — see
    /// <see cref="BankCountryAsync"/>.</param>
    internal static List<string> InvalidBankFields(Dictionary<string, string> fields, BankCountry country)
    {
        var invalid = new List<string>();
        // RUN-026 — a dropdown over FAST's country list: a name outside it is refused.
        if (!country.Listed)
        {
            invalid.Add("bankCountry");
        }
        if (!IbanIsValid(fields["iban"], country.Iso))
        {
            invalid.Add("iban");
        }
        // SWIFT/BIC — 8 or 11: 4-letter bank + 2-letter country + 2-character
        // location, optionally + a 3-character branch.
        if (!SwiftPattern().IsMatch(fields["swiftCode"]))
        {
            invalid.Add("swiftCode");
        }
        // Account number — numeric. No bank-specific length rule exists, so
        // any length is accepted as entered.
        if (!AccountNumberPattern().IsMatch(fields["accountNumber"]))
        {
            invalid.Add("accountNumber");
        }
        return invalid;
    }

    /// <summary>
    /// RUN-026 — the IBAN follows «دولة البنك». Saudi Arabia keeps the Saudi
    /// rule ("SA" + 22 digits, 24 characters); any other country is ISO 13616:
    /// its own country code first, 15–34 characters, and the mod-97 check
    /// digits. With no ISO code for the country (FAST's copy is empty, or its
    /// `countryCode` is not alpha-2), the IBAN's own prefix picks the rule.
    /// </summary>
    internal static bool IbanIsValid(string iban, string? countryIso)
    {
        var value = iban.ToUpperInvariant();
        if (countryIso == "SA" || (countryIso is null && value.StartsWith("SA", StringComparison.Ordinal)))
        {
            return SaudiIbanPattern().IsMatch(value);
        }
        // ponytail: one length range for every country — a per-country length
        // table (the SWIFT IBAN registry) belongs here once one is supplied.
        return IbanPattern().IsMatch(value)
            && (countryIso is null || value.StartsWith(countryIso, StringComparison.Ordinal))
            && Mod97(value) == 1;
    }

    /// <summary>ISO 7064 mod 97-10 over the IBAN with its first four characters
    /// moved to the end, letters as 10–35.</summary>
    private static int Mod97(string iban)
    {
        var remainder = 0;
        foreach (var c in iban[4..] + iban[..4])
        {
            var digit = c <= '9' ? c - '0' : c - 'A' + 10;
            remainder = ((remainder * (digit < 10 ? 10 : 100)) + digit) % 97;
        }
        return remainder;
    }

    /// <summary>
    /// «دولة البنك» resolved against FAST's country list (`fast-country`, the
    /// documented source for the bank country). The dropdown stores the
    /// country's Arabic name; an English name resolves too. While Expert Hub
    /// holds no copy of the list yet, any name is accepted, unresolved.
    /// </summary>
    internal static async Task<BankCountry> BankCountryAsync(
        ExpertHubDbContext db, string name, CancellationToken ct)
    {
        var countries = db.ReferenceValues.AsNoTracking()
            .Where(v => v.ListCode == FastReferenceLists.Countries && v.IsActive);
        if (!await countries.AnyAsync(ct))
        {
            return new BankCountry(true, null);
        }
        var match = await countries
            .Where(v => v.LabelAr == name || v.LabelEn == name)
            .Select(v => new { v.Attributes })
            .FirstOrDefaultAsync(ct);
        if (match is null)
        {
            return new BankCountry(false, null);
        }
        string? code = null;
        if (match.Attributes is { } json)
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.TryGetProperty("countryCode", out var value)
                && value.ValueKind is JsonValueKind.String)
            {
                code = value.GetString();
            }
        }
        return new BankCountry(
            true,
            code is { Length: 2 } && code.All(char.IsAsciiLetter) ? code.ToUpperInvariant() : null);
    }

    [GeneratedRegex("^SA[0-9]{22}$", RegexOptions.CultureInvariant)]
    private static partial Regex SaudiIbanPattern();

    [GeneratedRegex("^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$", RegexOptions.CultureInvariant)]
    private static partial Regex IbanPattern();

    [GeneratedRegex("^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SwiftPattern();

    [GeneratedRegex("^[0-9]+$", RegexOptions.CultureInvariant)]
    private static partial Regex AccountNumberPattern();

    /// <summary>The eight mandatory field ids, in J-09/F6/AC-3's own order.</summary>
    private static readonly string[] BankFieldOrder =
    [
        "bankCountry", "bankCity", "bankName", "branchName",
        "iban", "swiftCode", "accountHolderName", "accountNumber",
    ];

    public static RouteGroupBuilder MapApplicantAgreementEndpoints(this RouteGroupBuilder v1)
    {
        v1.MapPost("/me/profile/bank-data", async (
            BankDataInputWire input,
            HttpContext http,
            ExpertHubDbContext db,
            NotificationDispatcher dispatcher,
            CancellationToken ct) =>
        {
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            var record = await db.BankData.FirstOrDefaultAsync(b => b.UserId == actor.UserId, ct);
            if (record?.RequestedAt is null)
            {
                // AC-1/AC-2 — the section does not exist until preliminary
                // approval asks for it; nothing to fill in before then.
                return Results.Problem(statusCode: 409, detail: "Bank data has not been requested.");
            }
            var fields = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["bankCountry"] = input.BankCountry?.Trim() ?? string.Empty,
                ["bankCity"] = input.BankCity?.Trim() ?? string.Empty,
                ["bankName"] = input.BankName?.Trim() ?? string.Empty,
                ["branchName"] = input.BranchName?.Trim() ?? string.Empty,
                ["iban"] = input.Iban?.Trim() ?? string.Empty,
                ["swiftCode"] = input.SwiftCode?.Trim() ?? string.Empty,
                ["accountHolderName"] = input.AccountHolderName?.Trim() ?? string.Empty,
                ["accountNumber"] = input.AccountNumber?.Trim() ?? string.Empty,
            };
            var missing = BankFieldOrder.Where(id => fields[id].Length == 0).ToList();
            if (missing.Count > 0)
            {
                // AC-3 — all eight are mandatory; the response names which.
                return Results.Problem(
                    statusCode: 400,
                    detail: "bank-fields-missing",
                    extensions: new Dictionary<string, object?> { ["missingFields"] = missing });
            }
            var invalid = InvalidBankFields(
                fields, await BankCountryAsync(db, fields["bankCountry"], ct));
            if (invalid.Count > 0)
            {
                // AC-5 — a field that breaks its format rule is blocked; the
                // response names which.
                return Results.Problem(
                    statusCode: 400,
                    detail: "bank-fields-invalid",
                    extensions: new Dictionary<string, object?> { ["invalidFields"] = invalid });
            }
            var now = DateTime.UtcNow;
            var firstCompletion = record.CompletedAt is null;
            record.Fields = JsonSerializer.Serialize(fields);
            record.CompletedAt = now;
            if (firstCompletion)
            {
                await RaiseBankCompletedAsync(db, dispatcher, actor.UserId, ct);
            }
            await db.SaveChangesAsync(ct);
            return Results.Ok(new
            {
                state = "complete",
                requestedAt = ApplicationEndpoints.Iso(record.RequestedAt.Value),
                completedAt = ApplicationEndpoints.Iso(now),
            });
        }).RequireAuthorization().WithName("SaveBankData");

        return v1;
    }

    private static Task<DispatchOutcome> RaiseAsync(
        NotificationDispatcher dispatcher, string eventCode, Application application, Agreement row,
        Guid? staffUserId, CancellationToken ct) =>
        dispatcher.RaiseAsync(
            eventCode,
            new NotificationEventContext(
                SourceEntityId: row.AgreementId,
                RecordSubjectUserId: application.ApplicantUserId,
                ActingStaffUserId: staffUserId),
            new Dictionary<string, string>
            {
                ["referenceNumber"] = row.Reference ?? application.Reference ?? string.Empty,
            },
            ct);

    /// <summary>
    /// P-372 E-024 — the bank data is complete; whoever formed the approved
    /// committee sequence may now prepare the agreement.
    /// </summary>
    private static async Task RaiseBankCompletedAsync(
        ExpertHubDbContext db, NotificationDispatcher dispatcher, Guid applicantUserId, CancellationToken ct)
    {
        var approved = await (
            from application in db.Applications
            join sequence in db.CommitteeSequences on application.ApplicationId equals sequence.ApplicationId
            where application.ApplicantUserId == applicantUserId
                && sequence.Status == CommitteeSequenceStatuses.Approved
            orderby sequence.DecidedAt descending
            select new { application.ApplicationId, application.Reference, sequence.CreatedBy })
            .FirstOrDefaultAsync(ct);
        if (approved is null)
        {
            return;
        }
        await dispatcher.RaiseAsync(
            "EV-0215",
            new NotificationEventContext(
                SourceEntityId: approved.ApplicationId,
                RecordSubjectUserId: applicantUserId,
                ActingStaffUserId: approved.CreatedBy),
            new Dictionary<string, string> { ["referenceNumber"] = approved.Reference ?? string.Empty },
            ct);
    }

    /// <summary>
    /// J-11/F1 — the applicant's decision on the fully internally-signed
    /// agreement. Mounted by `ApplicationEndpoints` on the owned-application
    /// group, so ownership is already established when this runs.
    /// </summary>
    internal static async Task<IResult> DecideAsync(
        Application application,
        ApplicantDecisionInputWire input,
        HttpContext http,
        ExpertHubDbContext db,
        NotificationDispatcher dispatcher,
        CancellationToken ct)
    {
        var row = await db.Agreements.FirstOrDefaultAsync(
            a => a.ApplicationId == application.ApplicationId, ct);
        if (row is null || row.Status != AgreementStatuses.SentToApplicant)
        {
            return Results.Problem(
                statusCode: 409, detail: "The application has no agreement awaiting a decision.");
        }
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        var now = DateTime.UtcNow;

        // The claim: one decision per sending. A sign and a request-modification
        // racing each other both read `sent_to_applicant`; the row lock makes the
        // second re-read it, find it decided, and get 409. Any early return below
        // rolls back when the transaction is disposed uncommitted.
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var claimed = await db.Agreements
            .Where(a => a.AgreementId == row.AgreementId
                && a.Status == AgreementStatuses.SentToApplicant)
            .ExecuteUpdateAsync(set => set.SetProperty(a => a.Status, a => a.Status), ct);
        if (claimed == 0)
        {
            return Results.Problem(
                statusCode: 409, detail: "The application has no agreement awaiting a decision.");
        }

        var becameTrainer = false;
        if (string.Equals(input.Kind, "sign", StringComparison.Ordinal))
        {
            if (string.IsNullOrWhiteSpace(input.SignatureName))
            {
                return Results.Problem(statusCode: 400, detail: "signature-missing");
            }
            row.ApplicantDecisionKind = "sign";
            row.ApplicantSignatureName = input.SignatureName.Trim();
            row.ApplicantDecidedAt = now;
            // The exact version accepted, and HOW: an internal acceptance —
            // no e-signature provider exists, so none is claimed.
            row.ApplicantDocumentVersionId = (await AgreementDocuments.LatestAsync(db, row.AgreementId, ct)
                ?? await AgreementDocuments.SnapshotAsync(db, row, actor.UserId, now, ct)).DocumentVersionId;
            row.ApplicantSignatureMethod = SignatureMethods.InternalAcceptance;

            // F2 — signature activates the agreement, over the term the
            // preparer ENTERED (RUN-003): the dates everybody signed. Only an
            // agreement prepared without them falls back to signature day plus
            // the BR-0302 term.
            row.Status = AgreementStatuses.Active;
            (row.StartsAt, row.EndsAt) = TermOf(row, now);
            AgreementEndpoints.LogEvent(db, row.AgreementId, "signed", actor.UserId, now);
            AgreementEndpoints.LogEvent(
                db, row.AgreementId, "activated", actor.UserId, now, termYears: row.TermYears);

            // J-13 — the trainer record is created AFTER signature. This is
            // the moment an applicant becomes a trainer, so it is the moment
            // the profile exists (`P-134`: with the accreditation layer
            // Expert Hub masters, and the base copied from what they already
            // answered — `BR-0404`, the same fields).
            await TrainerProfileService.EnsureForActivatedApplicationAsync(
                db, application, now, ct);

            application.Status = ApplicationStatuses.Active;
            application.UpdatedAt = now;
            // P-372 E-031 + E-038 — signed and activated; the profile exists.
            await RaiseAsync(dispatcher, "EV-0310", application, row, null, ct);
            await RaiseAsync(dispatcher, "EV-0401", application, row, null, ct);
            // `DEF-06` — they are a trainer as of this request, so their
            // session says so as of this request. Without it the person who
            // just signed is bounced off every trainer page until they sign
            // out and in again.
            becameTrainer = true;
        }
        else if (string.Equals(input.Kind, "reject", StringComparison.Ordinal))
        {
            // AC-4 — permanent: no return path, no automatic re-submission.
            row.ApplicantDecisionKind = "reject";
            row.ApplicantDecisionNote = string.IsNullOrWhiteSpace(input.Note) ? null : input.Note;
            row.ApplicantDecidedAt = now;
            row.ApplicantDocumentVersionId = (await AgreementDocuments.LatestAsync(db, row.AgreementId, ct))
                ?.DocumentVersionId;
            row.Status = AgreementStatuses.Declined;
            AgreementEndpoints.LogEvent(
                db, row.AgreementId, "declined", actor.UserId, now, input.Note);

            application.Status = ApplicationStatuses.Closed;
            application.UpdatedAt = now;
            // P-372 E-030 — the preparer learns the agreement was declined.
            await RaiseAsync(dispatcher, "EV-0309", application, row, row.CreatedBy, ct);
        }
        else if (string.Equals(input.Kind, "request-modification", StringComparison.Ordinal))
        {
            if (string.IsNullOrWhiteSpace(input.Note))
            {
                // AC-5 — it returns to the J-10 preparer; a request with
                // nothing to act on would stall the chain.
                return Results.Problem(statusCode: 400, detail: "note-missing");
            }
            row.ApplicantDecisionKind = "request-modification";
            row.ApplicantDecisionNote = input.Note;
            row.ApplicantDecidedAt = now;
            // Back to the preparer: the internal run restarts from preparation.
            row.Status = AgreementStatuses.Formation;
            row.SentToApplicantAt = null;
            // J-11/F1/AC-7 — a brand-new internal run. The signed chain is
            // VOIDED and kept, with the version it signed.
            await AgreementDocuments.VoidActiveSequenceAsync(db, row.AgreementId, now, ct);
            row.ApplicantDocumentVersionId = (await AgreementDocuments.LatestAsync(db, row.AgreementId, ct))
                ?.DocumentVersionId;
            AgreementEndpoints.LogEvent(
                db, row.AgreementId, "modification-requested", actor.UserId, now, input.Note);

            application.Status = ApplicationStatuses.ApprovalInProgress;
            application.UpdatedAt = now;
            // P-372 E-029 — back to the preparer, who acts on the note.
            await RaiseAsync(dispatcher, "EV-0308", application, row, row.CreatedBy, ct);
        }
        else
        {
            return Results.Problem(statusCode: 400, detail: "Unknown decision.");
        }

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        if (becameTrainer)
        {
            // AFTER the write succeeds — a failed activation must never hand
            // out the role.
            await AuthenticationSetup.AddSessionRoleAsync(http, ExpertHubClaims.TrainerRole);
        }
        return Results.Ok(await ApplicationEndpoints.DetailWireForAsync(db, application, ct));
    }

    /// <summary>
    /// The agreement's term from its prepared `startDate` / `endDate` fields
    /// (yyyy-MM-dd, stored as UTC midnight of that day). A missing or
    /// unparseable start falls back to <paramref name="nowUtc"/>, a missing end
    /// to the start plus <see cref="Agreement.TermYears"/>.
    /// </summary>
    internal static (DateTime StartsAt, DateTime EndsAt) TermOf(Agreement row, DateTime nowUtc)
    {
        var values = JsonSerializer.Deserialize<Dictionary<string, string>>(row.FieldValues) ?? [];
        var starts = DateField(values, "startDate") ?? nowUtc;
        var ends = DateField(values, "endDate") ?? starts.AddYears(row.TermYears);
        return (starts, ends);
    }

    internal static DateTime? DateField(IReadOnlyDictionary<string, string> values, string id) =>
        values.TryGetValue(id, out var raw) && DateOnly.TryParseExact(
            raw?.Trim(), "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None, out var date)
            ? date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
            : null;

    /// <summary>
    /// The applicant's view of the agreement (`ApplicantAgreementDto`):
    /// present only once J-10 sent it, so no decision panel can render over
    /// an agreement that does not exist. F1/AC-2 — the WHOLE agreement data,
    /// no field withheld.
    /// </summary>
    internal static async Task<(string State, object? Agreement)> ApplicantViewAsync(
        ExpertHubDbContext db, Application application, CancellationToken ct)
    {
        var row = await db.Agreements.FirstOrDefaultAsync(
            a => a.ApplicationId == application.ApplicationId, ct);
        if (row is null)
        {
            return ("not-ready", null);
        }
        var state = row.Status switch
        {
            AgreementStatuses.SentToApplicant => "awaiting-decision",
            AgreementStatuses.Active or AgreementStatuses.Suspended
                or AgreementStatuses.Ended => "signed",
            AgreementStatuses.Declined => "declined",
            AgreementStatuses.Formation when row.ApplicantDecisionKind == "request-modification"
                => "modification-requested",
            _ => "not-ready",
        };
        if (state == "not-ready")
        {
            return (state, null);
        }
        var document = await AgreementDocuments.WireAsync(db, row, ct);
        object? decision = row.ApplicantDecisionKind is null
            ? null
            : new
            {
                kind = row.ApplicantDecisionKind,
                decidedAt = ApplicationEndpoints.Iso(row.ApplicantDecidedAt!.Value),
                note = row.ApplicantDecisionNote,
            };
        return (state, new
        {
            sentAt = ApplicationEndpoints.Iso(
                row.SentToApplicantAt ?? row.ApplicantDecidedAt ?? row.CreatedAt),
            dataGroups = await AgreementEndpoints.BuildMergedDataAsync(db, row, ct),
            // `P-333` — the uploaded agreement file; null for one prepared
            // before files were uploaded. Never a generated PDF.
            documentUrl = document.DocumentUrl,
            // F1/AC-2 — the WHOLE agreement as the version signed, minus the
            // template version and the hash (`P-334`, staff only).
            document = ApplicantAgreementDocumentWire.From(document),
            decision,
        });
    }
}
