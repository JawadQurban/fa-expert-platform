using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core.Domain;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// BE-08 — CAP-03 held to its rules on the full stack: the J-09→J-10 gate,
/// the signing sequence that cannot complete without its signature, the
/// applicant's three-way decision, and the lifecycle whose term nobody can
/// type. Each test walks a real application there through the real endpoints.
/// </summary>
public sealed class Cap03Tests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;

    public Cap03Tests(WebApplicationFactory<Program> factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        _configured = TestOidc.Configure(
            _factory,
            _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString));
    }

    public async Task DisposeAsync()
    {
        _configured?.Dispose();
        await _database.DisposeAsync();
    }

    public void Dispose() => _tokenEndpoint.Dispose();

    /* ── J-10 → J-11 → J-12, end to end ───────────────────────────────────── */

    [Fact]
    public async Task From_the_committee_gate_to_an_active_agreement_and_its_renewal()
    {
        var world = await ApprovedApplicationAsync("agr-1");

        // F1/AC-1 — the gate is BOTH halves. The committee approved, but the
        // bank data has only been REQUESTED, so preparation is refused.
        var beforeBank = await GetAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement");
        Assert.True(beforeBank.GetProperty("gate").GetProperty("committeeApproved").GetBoolean());
        Assert.False(beforeBank.GetProperty("gate").GetProperty("bankDataComplete").GetBoolean());
        Assert.Equal("blocked", beforeBank.GetProperty("stage").GetString());

        var early = await world.Creator.PostAsJsonAsync(
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/preparation",
            new { values = new Dictionary<string, string>() });
        Assert.Equal(HttpStatusCode.Conflict, early.StatusCode);

        // J-09/F6/AC-1+AC-2 — the applicant must be TOLD. Reported from the
        // testing server: final approval was recorded, the staff gate said
        // "waiting for bank data", and the applicant's own screen said "no
        // action required from you" with nowhere to enter an IBAN.
        var bankPrompt = await GetAsync(world.Applicant,
            $"/api/v1/me/applications/{world.ApplicationId}");
        Assert.Equal("provide-bank-data", bankPrompt.GetProperty("action").GetString());
        Assert.Equal("requested",
            bankPrompt.GetProperty("bankData").GetProperty("state").GetString());
        // Nothing is on file yet, so the form opens empty rather than showing
        // fields that were never entered.
        Assert.Equal(JsonValueKind.Null,
            bankPrompt.GetProperty("bankData").GetProperty("fields").ValueKind);

        // J-09/F6/AC-3 — all eight bank fields are mandatory.
        var partial = await world.Applicant.PostAsJsonAsync("/api/v1/me/profile/bank-data", new
        {
            bankCountry = "السعودية", bankCity = "الرياض", bankName = "البنك الأهلي",
            branchName = "", iban = "", swiftCode = "", accountHolderName = "", accountNumber = "",
        });
        Assert.Equal(HttpStatusCode.BadRequest, partial.StatusCode);
        var problem = await partial.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(5, problem.GetProperty("missingFields").GetArrayLength());

        // J-09 «Bank Data Field Validation Rules» — IBAN "SA" + 22 digits,
        // SWIFT 8 or 11 in BIC shape, account number numeric.
        foreach (var (iban, swift, account, expectedInvalid) in new[]
        {
            ("SA03800000006080101675", "NCBKSAJE", "608010167519", new[] { "iban" }),        // 20 digits
            ("AE0380000000608010167519", "NCBKSAJE", "608010167519", new[] { "iban" }),      // wrong prefix
            ("SA0380000000608010167519", "NCBKSAJ", "608010167519", new[] { "swiftCode" }),   // 7
            ("SA0380000000608010167519", "NCBKSAJE0012", "608010167519", new[] { "swiftCode" }), // 12
            ("SA0380000000608010167519", "1CBKSAJE", "608010167519", new[] { "swiftCode" }),  // digit in bank code
            ("SA0380000000608010167519", "NCBKSAJE", "6080-1016", new[] { "accountNumber" }),
            ("SA03800000006080101675", "NCBK", "ABC", new[] { "iban", "swiftCode", "accountNumber" }),
        })
        {
            var rejected = await world.Applicant.PostAsJsonAsync("/api/v1/me/profile/bank-data", new
            {
                bankCountry = "السعودية", bankCity = "الرياض", bankName = "البنك الأهلي",
                branchName = "العليا", iban, swiftCode = swift, accountHolderName = "سارة", accountNumber = account,
            });
            Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);
            var invalid = await rejected.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("bank-fields-invalid", invalid.GetProperty("detail").GetString());
            Assert.Equal(expectedInvalid,
                invalid.GetProperty("invalidFields").EnumerateArray().Select(f => f.GetString()!));
        }

        // The 11-character form (with a branch code) is valid too.
        await PostAsync(world.Applicant, "/api/v1/me/profile/bank-data", new
        {
            bankCountry = "السعودية", bankCity = "الرياض", bankName = "البنك الأهلي",
            branchName = "العليا", iban = "SA0380000000608010167519", swiftCode = "NCBKSAJE001",
            accountHolderName = "سارة", accountNumber = "608010167519",
        });

        await CompleteBankDataAsync(world.Applicant);

        // Preparation: the required template fields are enforced…
        var missingFields = await world.Creator.PostAsJsonAsync(
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/preparation",
            new { values = new Dictionary<string, string> { ["startDate"] = "2026-09-01" } });
        Assert.Equal(HttpStatusCode.BadRequest, missingFields.StatusCode);

        var prepared = await PostAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/preparation",
            new
            {
                values = new Dictionary<string, string>
                {
                    ["startDate"] = "2026-09-01",
                    ["endDate"] = "2027-09-01",
                },
            });
        Assert.Equal("formation", prepared.GetProperty("stage").GetString());
        // F1/AC-3 — the covered services are server-derived.
        Assert.Equal("trainer",
            prepared.GetProperty("approvedServices").EnumerateArray().Single().GetString());
        // F1/AC-2 / BR-0212 — the merged blocks are read-only and include the
        // bank data the creator never typed.
        var groups = prepared.GetProperty("mergedData").EnumerateArray()
            .Select(g => g.GetProperty("id").GetString()).ToArray();
        Assert.Contains("bank", groups);

        // P-36 — a signing sequence with no designated e-signer could never
        // complete, so it is refused at formation.
        var noSigner = await world.Creator.PostAsJsonAsync(
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/signing-sequence",
            new
            {
                members = new[] { new { approverId = world.ReviewerId, obligation = "mandatory", isSigner = false } },
                saveAsTemplateName = "",
            });
        Assert.Equal(HttpStatusCode.BadRequest, noSigner.StatusCode);

        var formed = await PostAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/signing-sequence",
            new
            {
                members = new[]
                {
                    new { approverId = world.ReviewerId, obligation = "mandatory", isSigner = false },
                    new { approverId = world.SignerId, obligation = "mandatory", isSigner = true },
                },
                saveAsTemplateName = "تسلسل التوقيع القياسي",
            });
        Assert.Equal("in-progress", formed.GetProperty("stage").GetString());
        Assert.False(formed.GetProperty("sequenceComplete").GetBoolean());
        Assert.False(formed.GetProperty("signaturesAttached").GetBoolean());

        // The reviewer approves (no signature — they are not a signer).
        await PostAsync(world.Reviewer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "approve", note = "مراجَعة" });

        // F3/AC-4 — the designated signer must SIGN: a bare approval from them
        // would complete the chain without its signature.
        var bareApproval = await world.Signer.PostAsJsonAsync(
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "approve", note = "" });
        Assert.Equal(HttpStatusCode.BadRequest, bareApproval.StatusCode);

        var signed = await PostAsync(world.Signer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "sign-and-approve", note = "", signatureName = "أ. مدير الإدارة" });
        // BR-0213 / F3/AC-5 — both halves hold, so it went to the applicant.
        Assert.True(signed.GetProperty("sequenceComplete").GetBoolean());
        Assert.True(signed.GetProperty("signaturesAttached").GetBoolean());
        Assert.Equal("sent-to-applicant", signed.GetProperty("stage").GetString());
        Assert.NotEqual(JsonValueKind.Null, signed.GetProperty("sentToApplicantAt").ValueKind);

        // J-11/F1/AC-1+AC-2 — the applicant now has the agreement, in full.
        var applicantView = await GetAsync(world.Applicant,
            $"/api/v1/me/applications/{world.ApplicationId}");
        Assert.Equal("decide-agreement", applicantView.GetProperty("action").GetString());
        Assert.Equal("awaiting-decision", applicantView.GetProperty("agreementState").GetString());
        Assert.True(applicantView.GetProperty("agreement")
            .GetProperty("dataGroups").GetArrayLength() >= 2);
        // G26 — no fabricated download link.
        Assert.Equal(JsonValueKind.Null,
            applicantView.GetProperty("agreement").GetProperty("documentUrl").ValueKind);

        // AC-3 — signing needs an actual signature…
        var unsigned = await world.Applicant.PostAsJsonAsync(
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "sign", signatureName = "" });
        Assert.Equal(HttpStatusCode.BadRequest, unsigned.StatusCode);

        var active = await PostAsync(world.Applicant,
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "sign", signatureName = "سارة العتيبي" });
        Assert.Equal("active", active.GetProperty("status").GetString());
        Assert.Equal("signed", active.GetProperty("agreementState").GetString());
        Assert.Equal("processing", active.GetProperty("sync").GetString());

        // BR-0302 — a FIRST accreditation gets one year, decided by the server.
        Guid agreementId;
        await using (var db = _database.CreateContext())
        {
            var row = await db.Agreements.SingleAsync();
            agreementId = row.AgreementId;
            Assert.Equal(1, row.TermYears);
            Assert.Equal(row.StartsAt!.Value.AddYears(1), row.EndsAt);
            Assert.Equal(0, row.RenewalCount);
        }

        // J-12 — the agreement now appears in the lifecycle list.
        var list = await GetAsync(world.Creator, "/api/v1/internal/agreements/");
        var row2 = list.GetProperty("items").EnumerateArray().Single();
        Assert.Matches(@"^AGR-\d{4}-0001$", row2.GetProperty("reference").GetString());
        Assert.Equal("active", row2.GetProperty("status").GetString());
        // BR-0705 — the offsets are SERVED from the central SLA-0301 row.
        Assert.Equal(
            new[] { 90, 30, 5 },
            list.GetProperty("reminderOffsets").EnumerateArray().Select(o => o.GetInt32()).ToArray());

        var detail = await GetAsync(world.Creator, $"/api/v1/internal/agreements/{agreementId}");
        // BR-0302 — the next term arrives DECIDED; no input carries a duration.
        Assert.Equal(3, detail.GetProperty("nextTermYears").GetInt32());
        Assert.True(detail.GetProperty("viewer").GetProperty("canRenew").GetBoolean());

        var renewed = await PostAsync(world.Creator,
            $"/api/v1/internal/agreements/{agreementId}/lifecycle",
            new { kind = "renew", note = "تجديد سنوي" });
        Assert.Equal(1, renewed.GetProperty("renewalCount").GetInt32());
        await using (var db = _database.CreateContext())
        {
            var row = await db.Agreements.SingleAsync();
            Assert.Equal(3, row.TermYears); // BR-0302 — three years on renewal.
            Assert.True(await db.AgreementEvents.AnyAsync(
                e => e.Kind == "renewed" && e.TermYears == 3));
        }

        // Two renewals at once. A renewal may be applied twice on purpose
        // (owner ruling, 2026-10-05), so both MAY succeed when they do not
        // overlap — what must never happen is the lost update: two requests
        // reading one end date and each logging a renewal the row shows once.
        // Whatever the interleaving, every success is counted exactly once.
        DateTime endsBefore;
        await using (var db = _database.CreateContext())
        {
            endsBefore = (await db.Agreements.SingleAsync()).EndsAt!.Value;
        }
        var raced = await Task.WhenAll(Enumerable.Range(0, 2).Select(_ =>
            world.Creator.PostAsJsonAsync(
                $"/api/v1/internal/agreements/{agreementId}/lifecycle",
                new { kind = "renew", note = "" })));
        Assert.All(raced, r => Assert.Contains(r.StatusCode, new[] { HttpStatusCode.OK, HttpStatusCode.Conflict }));
        var wins = raced.Count(r => r.StatusCode == HttpStatusCode.OK);
        Assert.InRange(wins, 1, 2);
        await using (var db = _database.CreateContext())
        {
            var row = await db.Agreements.SingleAsync();
            Assert.Equal(1 + wins, row.RenewalCount);
            Assert.Equal(endsBefore.AddYears(3 * wins), row.EndsAt);
            Assert.Equal(1 + wins, await db.AgreementEvents.CountAsync(e => e.Kind == "renewed"));
        }

        // F3 — the state machine: suspend → reactivate → end, and nothing
        // follows a deliberate ending.
        await PostAsync(world.Creator, $"/api/v1/internal/agreements/{agreementId}/lifecycle",
            new { kind = "suspend", note = "إيقاف مؤقت" });
        var badRenew = await world.Creator.PostAsJsonAsync(
            $"/api/v1/internal/agreements/{agreementId}/lifecycle",
            new { kind = "renew", note = "" });
        Assert.Equal(HttpStatusCode.Conflict, badRenew.StatusCode);

        await PostAsync(world.Creator, $"/api/v1/internal/agreements/{agreementId}/lifecycle",
            new { kind = "reactivate", note = "" });
        var ended = await PostAsync(world.Creator,
            $"/api/v1/internal/agreements/{agreementId}/lifecycle",
            new { kind = "end", note = "إنهاء" });
        Assert.Equal("ended", ended.GetProperty("status").GetString());
        Assert.Equal(5 + wins, ended.GetProperty("history").GetArrayLength());
        var terminal = await world.Creator.PostAsJsonAsync(
            $"/api/v1/internal/agreements/{agreementId}/lifecycle",
            new { kind = "reactivate", note = "" });
        Assert.Equal(HttpStatusCode.Conflict, terminal.StatusCode);
    }

    /* ── J-11/F1/AC-4 — rejection is permanent ────────────────────────────── */

    [Fact]
    public async Task An_applicant_rejection_permanently_closes_the_application()
    {
        var world = await SentToApplicantAsync("agr-2");

        var closed = await PostAsync(world.Applicant,
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "reject", note = "ظروف شخصية" });
        Assert.Equal("closed", closed.GetProperty("status").GetString());
        Assert.Equal("declined", closed.GetProperty("agreementState").GetString());

        // No return path: the decision cannot be taken twice, and the
        // agreement never reaches the lifecycle list.
        var again = await world.Applicant.PostAsJsonAsync(
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "sign", signatureName = "سارة" });
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);

        var list = await GetAsync(world.Creator, "/api/v1/internal/agreements/");
        Assert.Empty(list.GetProperty("items").EnumerateArray());
    }

    /* ── J-11/F1/AC-5 — a modification request returns it to the preparer ── */

    [Fact]
    public async Task An_applicant_modification_request_returns_the_agreement_to_the_preparer()
    {
        var world = await SentToApplicantAsync("agr-3");

        // AC-5 — the note is mandatory: it is what the preparer acts on.
        var noteless = await world.Applicant.PostAsJsonAsync(
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "request-modification", note = "" });
        Assert.Equal(HttpStatusCode.BadRequest, noteless.StatusCode);

        var returned = await PostAsync(world.Applicant,
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "request-modification", note = "الرجاء تعديل تاريخ البداية." });
        Assert.Equal("modification-requested", returned.GetProperty("agreementState").GetString());

        // The creator sees it back at formation — the old internal chain is
        // void, so re-preparation starts a fresh, correctly-signed run.
        var creatorView = await GetAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement");
        Assert.Equal("formation", creatorView.GetProperty("stage").GetString());
        Assert.Empty(creatorView.GetProperty("sequence").EnumerateArray());
        Assert.False(creatorView.GetProperty("sequenceComplete").GetBoolean());
    }

    /* ── J-10/F4 — the internal modification pause ────────────────────────── */

    [Fact]
    public async Task An_internal_modification_request_pauses_and_the_creator_resumes_it()
    {
        var world = await ApprovedApplicationAsync("agr-4");
        await CompleteBankDataAsync(world.Applicant);
        await PrepareAndFormAsync(world);

        var paused = await PostAsync(world.Reviewer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "request-modification", note = "المدة غير صحيحة." });
        Assert.Equal("modification-requested", paused.GetProperty("stage").GetString());

        var wrongPerson = await world.Reviewer.PostAsync(
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/resubmit", null);
        Assert.Equal(HttpStatusCode.Forbidden, wrongPerson.StatusCode);

        var resumed = await PostAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/resubmit", null);
        Assert.Equal("in-progress", resumed.GetProperty("stage").GetString());
        // Resumed FROM the requester — their own step is current again.
        var members = resumed.GetProperty("sequence").EnumerateArray().ToArray();
        Assert.Equal("current", members[0].GetProperty("state").GetString());
    }

    /* ── J-12/F4 — the template is the System Administrator's ─────────────── */

    [Fact]
    public async Task The_agreement_template_is_served_as_configuration_and_gated()
    {
        using var staff = await SignInAsync("plain-staff", "fa-staff", "موظف", RoleCode.Staff);
        var template = await GetAsync(staff, "/api/v1/internal/agreements/template");
        Assert.Equal("mock-dm-gap-16-draft.1",
            (await TemplateVersionAsync()));
        // DM-GAP-16 — only start and end date are confirmed (required).
        var fields = template.GetProperty("fields").EnumerateArray().ToArray();
        Assert.Equal(3, fields.Length);
        Assert.Equal(2, fields.Count(f => f.GetProperty("required").GetBoolean()));
        Assert.Equal(4, template.GetProperty("services").GetArrayLength());

        var refused = await staff.PostAsJsonAsync("/api/v1/internal/agreements/template",
            new { bodyText = "نص", fields = Array.Empty<object>() });
        Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);

        using var admin = await SignInAsync(
            "tpl-admin", "fa-staff", "مشرف النظام", RoleCode.SystemAdministrator);

        var empty = await admin.PostAsJsonAsync("/api/v1/internal/agreements/template",
            new { bodyText = "  ", fields = Array.Empty<object>() });
        Assert.Equal(HttpStatusCode.BadRequest, empty.StatusCode);

        var saved = await PostAsync(admin, "/api/v1/internal/agreements/template", new
        {
            bodyText = "النص القانوني المعتمد.",
            fields = new[]
            {
                new { id = "startDate", label = new { ar = "تاريخ البداية", en = "Start date" }, type = "date", required = true },
            },
        });
        Assert.Equal("النص القانوني المعتمد.", saved.GetProperty("bodyText").GetString());
        Assert.Equal("مشرف النظام", saved.GetProperty("updatedByName").GetString());
    }

    /* ── RB-05 / RB-06 — what somebody agreed to is kept, exactly ─────────── */

    [Fact]
    public async Task A_re_preparation_voids_the_signed_chain_and_keeps_every_signature_and_its_version()
    {
        var world = await SentToApplicantAsync("agr-safe-1");
        Guid firstVersion;
        await using (var db = _database.CreateContext())
        {
            firstVersion = (await db.AgreementDocumentVersions.SingleAsync()).DocumentVersionId;
            // Every act names the exact content it was taken on.
            Assert.All(await db.Signatories.ToListAsync(), s => Assert.Equal(firstVersion, s.DocumentVersionId));
            Assert.Equal(SignatureMethods.InternalAcceptance, (await db.ESignatures.SingleAsync()).Method);
        }

        await PostAsync(world.Applicant,
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "request-modification", note = "الرجاء تعديل تاريخ البداية." });
        await using (var db = _database.CreateContext())
        {
            // J-11/F1/AC-7 — a brand-new run, but the signed chain is VOIDED,
            // never deleted: both approvals and the signature are still there.
            var sequence = await db.SigningSequences.SingleAsync();
            Assert.Equal("voided", sequence.Status);
            Assert.NotNull(sequence.VoidedAt);
            Assert.Equal(2, await db.Signatories.CountAsync());
            Assert.Equal(1, await db.ESignatures.CountAsync());
        }

        // The creator corrects the start date — a NEW version, the first kept.
        await PostAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/preparation",
            new { values = new Dictionary<string, string> { ["startDate"] = "2026-10-01", ["endDate"] = "2027-10-01" } });
        await PostAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/signing-sequence",
            new
            {
                members = new[]
                {
                    new { approverId = world.ReviewerId, obligation = "mandatory", isSigner = false },
                    new { approverId = world.SignerId, obligation = "mandatory", isSigner = true },
                },
                saveAsTemplateName = "",
            });
        await PostAsync(world.Reviewer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "approve", note = "" });
        await PostAsync(world.Signer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "sign-and-approve", note = "", signatureName = "أ. الموقّع" });

        // The applicant reads the COMPLETE agreement — the legal text and the
        // terms the creator entered — before accepting.
        var detail = await GetAsync(world.Applicant, $"/api/v1/me/applications/{world.ApplicationId}");
        ContractFixtures.Verify("me.application-agreement", detail.GetProperty("agreement"));
        var document = detail.GetProperty("agreement").GetProperty("document");
        Assert.True(document.GetProperty("snapshot").GetBoolean());
        Assert.Equal(2, document.GetProperty("versionNumber").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(document.GetProperty("bodyText").GetString()));
        Assert.Contains(document.GetProperty("fields").EnumerateArray(),
            f => f.GetProperty("id").GetString() == "startDate" && f.GetProperty("value").GetString() == "2026-10-01");
        Assert.Equal(SignatureMethods.InternalAcceptance, document.GetProperty("signatureMethod").GetString());

        await PostAsync(world.Applicant,
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "sign", signatureName = "سارة العتيبي" });

        await using var check = _database.CreateContext();
        var versions = await check.AgreementDocumentVersions.OrderBy(v => v.VersionNumber).ToListAsync();
        Assert.Equal([1, 2], versions.Select(v => v.VersionNumber));
        Assert.NotEqual(versions[0].ContentHash, versions[1].ContentHash);
        var agreement = await check.Agreements.SingleAsync();
        Assert.Equal(versions[1].DocumentVersionId, agreement.ApplicantDocumentVersionId);
        Assert.Equal(SignatureMethods.InternalAcceptance, agreement.ApplicantSignatureMethod);
        // Two chains, two signatures — the first chain's evidence intact.
        Assert.Equal(2, await check.SigningSequences.CountAsync());
        Assert.Equal(2, await check.ESignatures.CountAsync());
        Assert.Equal(2, await check.Signatories.CountAsync(s => s.DocumentVersionId == firstVersion));
    }

    [Fact]
    public async Task Every_internal_reader_sees_the_whole_agreement_and_a_template_edit_never_changes_it()
    {
        var world = await ApprovedApplicationAsync("agr-safe-2");
        await CompleteBankDataAsync(world.Applicant);
        await PrepareAndFormAsync(world);

        // …but only the creator prepares it (J-10/F1, BR-0215).
        var notCreator = await world.Reviewer.PostAsJsonAsync(
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/preparation",
            new { values = new Dictionary<string, string> { ["startDate"] = "2026-09-01", ["endDate"] = "2027-09-01" } });
        Assert.Equal(HttpStatusCode.Forbidden, notCreator.StatusCode);

        // Not only its creator: the reviewer reads the complete agreement.
        var before = await GetAsync(world.Reviewer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/document");
        ContractFixtures.Verify("internal.agreement-document", before);
        var originalBody = before.GetProperty("bodyText").GetString();
        Assert.False(string.IsNullOrWhiteSpace(originalBody));
        Assert.Equal(1, before.GetProperty("versionNumber").GetInt32());
        Assert.Contains(before.GetProperty("fields").EnumerateArray(),
            f => f.GetProperty("value").GetString() == "2026-09-01");
        var reviewerDetail = await GetAsync(world.Reviewer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement");
        Assert.NotEqual(JsonValueKind.Null, reviewerDetail.GetProperty("document").ValueKind);
        ContractFixtures.Verify("internal.agreement-detail", reviewerDetail);

        using var admin = await SignInAsync("agr-safe-admin", "fa-staff", "مشرف النظام", RoleCode.SystemAdministrator);
        var originalVersion = await TemplateVersionAsync();
        await PostAsync(admin, "/api/v1/internal/agreements/template", new
        {
            bodyText = "نص قانوني مُعدَّل.",
            fields = new[]
            {
                new { id = "startDate", label = new { ar = "تاريخ البداية", en = "Start date" }, type = "date", required = true },
            },
        });

        // J-12 — a new template version; the replaced text is kept…
        Assert.Equal($"{originalVersion}+r1", await TemplateVersionAsync());
        await using (var db = _database.CreateContext())
        {
            var history = await db.AgreementTemplateVersions.SingleAsync();
            Assert.Equal(originalVersion, history.Version);
            Assert.Equal(originalBody, history.BodyText);
        }
        // …and the agreement already prepared still reads what it was prepared with.
        var after = await GetAsync(world.Reviewer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/document");
        Assert.Equal(originalBody, after.GetProperty("bodyText").GetString());
        Assert.Equal(1, after.GetProperty("versionNumber").GetInt32());
    }

    [Fact]
    public async Task The_creator_corrects_an_internal_modification_request_and_earlier_approvals_keep_their_version()
    {
        var world = await ApprovedApplicationAsync("agr-safe-3");
        await CompleteBankDataAsync(world.Applicant);
        await PrepareAndFormAsync(world);
        await PostAsync(world.Reviewer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "approve", note = "" });
        await PostAsync(world.Signer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "request-modification", note = "تاريخ النهاية غير صحيح." });

        // J-10/F4/AC-2 — the creator can now correct the content (was 409)…
        await PostAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/preparation",
            new { values = new Dictionary<string, string> { ["startDate"] = "2026-09-01", ["endDate"] = "2027-08-31" } });
        // …and the chain RESUMES from the requester (AC-3), not from scratch.
        var resumed = await PostAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/resubmit", null);
        Assert.Equal("in-progress", resumed.GetProperty("stage").GetString());
        await PostAsync(world.Signer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "sign-and-approve", note = "", signatureName = "أ. الموقّع" });

        await using var db = _database.CreateContext();
        var versions = await db.AgreementDocumentVersions.OrderBy(v => v.VersionNumber).ToListAsync();
        Assert.Equal(2, versions.Count);
        Assert.Equal(1, await db.SigningSequences.CountAsync());
        var steps = await db.Signatories.OrderBy(s => s.OrderIndex).ToListAsync();
        // The reviewer approved version 1; the signer signed version 2.
        Assert.Equal(versions[0].DocumentVersionId, steps[0].DocumentVersionId);
        Assert.Equal(versions[1].DocumentVersionId, steps[1].DocumentVersionId);
    }

    /* ── J-03 → BR-0305: the annex attaches to the EXISTING agreement ─────── */

    [Fact]
    public async Task An_approved_add_service_becomes_an_addendum_never_a_second_agreement()
    {
        var world = await SentToApplicantAsync("agr-5");
        await PostAsync(world.Applicant,
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "sign", signatureName = "سارة العتيبي" });

        var request = await PostAsync(world.Applicant,
            $"/api/v1/me/applications/{world.ApplicationId}/services",
            new
            {
                service = "consultant",
                values = new Dictionary<string, object>(),
                attachments = Array.Empty<object>(),
            });
        var requestId = request.GetProperty("requestId").GetString()!;

        await PostAsync(world.Creator,
            $"/api/v1/internal/service-requests/{requestId}/decision",
            new
            {
                kind = "approve",
                addendum = new { fileName = "addendum-consultant.pdf", sizeBytes = 90_000, attachmentId = (await TestDocuments.UploadInternalAsync(world.Creator, "service-addendum", "addendum-consultant.pdf")).GetProperty("attachmentId").GetString() },
                note = "",
            });

        await using var db = _database.CreateContext();
        // BR-0305 / D-05 — ONE agreement, now covering two services, with an
        // addendum row: no second agreement was created.
        Assert.Equal(1, await db.Agreements.CountAsync());
        var agreement = await db.Agreements.SingleAsync();
        Assert.Equal(2, await db.AgreementServices.CountAsync(
            s => s.AgreementId == agreement.AgreementId));
        var addendum = await db.Addenda.SingleAsync();
        Assert.Equal("consultant", addendum.Service);
        Assert.Equal("addendum-consultant.pdf", addendum.DocumentFileName);
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    private sealed record World(
        string ApplicationId,
        HttpClient Applicant,
        HttpClient Creator,
        HttpClient Reviewer,
        HttpClient Signer,
        string ReviewerId,
        string SignerId) : IDisposable
    {
        public void Dispose()
        {
            Applicant.Dispose();
            Creator.Dispose();
            Reviewer.Dispose();
            Signer.Dispose();
        }
    }

    /// <summary>Walks CAP-01 + CAP-02 for real, ending at a committee-approved
    /// application with bank data REQUESTED (J-09/F4/AC-5) but not completed.</summary>
    /// <summary>
    /// `DEF-06` — activation grants the trainer role, and the CURRENT session
    /// must reflect it.
    ///
    /// <para>
    /// Roles live in the session cookie and were only ever recomputed at
    /// sign-in, so the applicant who had just signed their agreement was still
    /// carrying an applicant's session: `RequireTrainer` sent them back to the
    /// home page and every trainer surface refused them until they signed out
    /// and in again. The role was granted; the session simply had not been
    /// told.
    /// </para>
    /// <para>
    /// Fixed inside the existing authentication architecture — the same cookie
    /// scheme, re-issued with the same claim `ResolvePlatformRolesAsync` would
    /// have added at the next sign-in. No second source of authorization, and
    /// no check relaxed.
    /// </para>
    /// </summary>
    [Fact]
    public async Task Signing_the_agreement_makes_the_trainer_role_usable_in_the_same_session()
    {
        var world = await SentToApplicantAsync("def06");

        // BEFORE: an applicant, and nothing more. The role must not appear
        // early — it is earned by signing, not by being offered an agreement.
        var before = await GetAsync(world.Applicant, "/api/auth/session");
        Assert.DoesNotContain(
            "trainer",
            before.GetProperty("roles").EnumerateArray().Select(r => r.GetString()));

        // A failed attempt changes nothing: no signature, no role.
        var unsigned = await world.Applicant.PostAsJsonAsync(
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "sign", signatureName = "" });
        Assert.Equal(HttpStatusCode.BadRequest, unsigned.StatusCode);
        var afterFailure = await GetAsync(world.Applicant, "/api/auth/session");
        Assert.DoesNotContain(
            "trainer",
            afterFailure.GetProperty("roles").EnumerateArray().Select(r => r.GetString()));

        await PostAsync(world.Applicant,
            $"/api/v1/me/applications/{world.ApplicationId}/agreement-decision",
            new { kind = "sign", signatureName = "سارة العتيبي" });

        // AFTER, on the SAME cookie jar — no sign-out, no sign-in.
        var after = await GetAsync(world.Applicant, "/api/auth/session");
        Assert.Contains(
            "trainer",
            after.GetProperty("roles").EnumerateArray().Select(r => r.GetString()));

        // …and the session is usable, which is the part a claim alone would
        // not prove: the trainer's own profile answers rather than refusing.
        var profile = await world.Applicant.GetAsync("/api/v1/me/profile");
        Assert.Equal(HttpStatusCode.OK, profile.StatusCode);
    }

    private async Task<World> ApprovedApplicationAsync(string prefix)
    {
        var applicant = await SignInAsync($"{prefix}-applicant", "unmapped", "سارة العتيبي");
        var creator = await SignInAsync(
            $"{prefix}-creator", "fa-staff", "معدّ الاتفاقية", RoleCode.Manager);
        var reviewer = await SignInAsync(
            $"{prefix}-reviewer", "fa-staff", "المراجع", RoleCode.Staff);
        var signer = await SignInAsync(
            $"{prefix}-signer", "fa-staff", "الموقّع", RoleCode.Staff);
        var creatorId = await UserIdOfAsync($"{prefix}-creator");
        var reviewerId = await UserIdOfAsync($"{prefix}-reviewer");
        var signerId = await UserIdOfAsync($"{prefix}-signer");

        var applicationId = await SubmitCompleteApplicationAsync(applicant);

        // Screening: exempt straight to the committee (J-08) — CAP-02 already
        // proves the interview path, and this keeps the fixture on CAP-03.
        await PostAsync(creator, $"/api/v1/internal/applications/{applicationId}/screening/decision",
            new
            {
                kind = "accept",
                services = new[]
                {
                    new
                    {
                        service = "trainer",
                        path = "exemption",
                        slots = Array.Empty<string>(),
                        committeeMemberIds = Array.Empty<string>(),
                        exemptionReason = (string?)"expert",
                        exemptionReasonOther = "",
                    },
                },
            });
        await PostAsync(creator, $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new
            {
                members = new[] { new { approverId = creatorId, obligation = "mandatory" } },
                saveAsTemplateName = "",
            });
        var approved = await PostAsync(creator,
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "approve", note = "" });
        // J-09/F4/AC-5 + F6 — the request fires in parallel with the result.
        Assert.Equal("requested",
            approved.GetProperty("bankData").GetProperty("state").GetString());

        return new World(applicationId, applicant, creator, reviewer, signer, reviewerId, signerId);
    }

    /// <summary>…and on through J-10 to an agreement sitting with the applicant.</summary>
    private async Task<World> SentToApplicantAsync(string prefix)
    {
        var world = await ApprovedApplicationAsync(prefix);
        await CompleteBankDataAsync(world.Applicant);
        await PrepareAndFormAsync(world);
        await PostAsync(world.Reviewer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "approve", note = "" });
        await PostAsync(world.Signer,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/decisions",
            new { kind = "sign-and-approve", note = "", signatureName = "أ. الموقّع" });
        return world;
    }

    private static async Task PrepareAndFormAsync(World world)
    {
        await PostAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/preparation",
            new
            {
                values = new Dictionary<string, string>
                {
                    ["startDate"] = "2026-09-01",
                    ["endDate"] = "2027-09-01",
                },
            });
        await PostAsync(world.Creator,
            $"/api/v1/internal/applications/{world.ApplicationId}/agreement/signing-sequence",
            new
            {
                members = new[]
                {
                    new { approverId = world.ReviewerId, obligation = "mandatory", isSigner = false },
                    new { approverId = world.SignerId, obligation = "mandatory", isSigner = true },
                },
                saveAsTemplateName = "",
            });
    }

    private static async Task CompleteBankDataAsync(HttpClient applicant) =>
        await PostAsync(applicant, "/api/v1/me/profile/bank-data", new
        {
            bankCountry = "السعودية",
            bankCity = "الرياض",
            bankName = "البنك الأهلي",
            branchName = "فرع العليا",
            iban = "SA0380000000608010167519",
            swiftCode = "NCBKSAJE",
            accountHolderName = "سارة العتيبي",
            accountNumber = "608010167519",
        });

    private async Task<string> TemplateVersionAsync()
    {
        await using var db = _database.CreateContext();
        return (await db.AgreementTemplates.SingleAsync(t => t.IsActive)).Version;
    }

    private async Task GrantRoleAsync(string externalId, RoleCode role)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == externalId);
        var roleRow = await db.Roles.SingleAsync(r => r.Code == role);
        db.UserRoles.Add(new UserRole
        {
            UserRoleId = Guid.NewGuid(),
            UserId = user.UserId,
            RoleId = roleRow.RoleId,
            AssignedBy = user.UserId,
            AssignedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Signs a person in and gives them the platform role their part of the
    /// journey needs — feature permissions (P-190) are read from
    /// `USER_ROLE`, so internal-by-claim alone now opens nothing.
    /// </summary>
    private async Task<HttpClient> SignInAsync(
        string subject, string role, string name, RoleCode? platformRole = null)
    {
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(client, _tokenEndpoint, role, subject: subject, displayName: name);
        if (platformRole is { } granted)
        {
            await using var db = _database.CreateContext();
            var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
            var roleRow = await db.Roles.SingleAsync(r => r.Code == granted);
            db.UserRoles.Add(new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = user.UserId,
                RoleId = roleRow.RoleId,
                AssignedBy = user.UserId,
                AssignedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }
        return client;
    }

    private async Task<string> UserIdOfAsync(string externalId)
    {
        await using var db = _database.CreateContext();
        return (await db.Users.SingleAsync(u => u.ExternalIdentityId == externalId))
            .UserId.ToString();
    }

    private async Task<string> SubmitCompleteApplicationAsync(HttpClient applicant)
    {
        var started = await PostAsync(applicant, "/api/v1/me/applications/draft/start", null);
        var draftId = started.GetProperty("draft").GetProperty("id").GetString()!;

        var schema = await GetAsync(applicant, "/api/v1/applications/schema");
        var values = new Dictionary<string, object?>();
        foreach (var field in schema.GetProperty("fields").EnumerateArray())
        {
            var id = field.GetProperty("id").GetString()!;
            var type = field.GetProperty("type").GetString();
            var hasPattern = field.TryGetProperty("validation", out var validation)
                && validation.TryGetProperty("pattern", out _);
            values[id] = type switch
            {
                "checkbox" => true,
                "date" => "2020-01-15",
                "number" => "8",
                "select" => field.GetProperty("options")[0].GetProperty("value").GetString(),
                "multi-select" => new[]
                {
                    field.GetProperty("options")[0].GetProperty("value").GetString(),
                },
                // A patterned field needs a value that satisfies ITS pattern —
                // the identity field's rule (`D-01`) is not the social link's.
                _ when hasPattern => id == "idNumber"
                    ? "1012345678"
                    : "https://example.com/profile",
                _ => "قيمة تجريبية",
            };
        }
        await using (var db = _database.CreateContext())
        {
            foreach (var rule in await db.AttachmentRules.Where(r => r.SchemaVersion == FormSchemaVersions.Current).ToListAsync())
            {
                db.ApplicationAttachments.Add(new ApplicationAttachment
                {
                    ApplicationAttachmentId = Guid.NewGuid(),
                    ApplicationId = Guid.Parse(draftId),
                    RuleCode = rule.RuleCode,
                    FileName = $"{rule.RuleCode}.pdf",
                    SizeBytes = 100_000,
                });
            }
            await db.SaveChangesAsync();
        }
        var submitted = await PostAsync(applicant, "/api/v1/me/applications/submit", new
        {
            services = new[] { "trainer" },
            values,
        });
        return submitted.GetProperty("applicationId").GetString()!;
    }

    private static async Task<JsonElement> GetAsync(HttpClient client, string path)
    {
        var response = await client.GetAsync(path);
        var payload = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 from {path}, got {(int)response.StatusCode}: {payload}");
        return JsonSerializer.Deserialize<JsonElement>(payload);
    }

    private static async Task<JsonElement> PostAsync(HttpClient client, string path, object? body)
    {
        var response = body is null
            ? await client.PostAsync(path, null)
            : await client.PostAsJsonAsync(path, body);
        var payload = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 from {path}, got {(int)response.StatusCode}: {payload}");
        return JsonSerializer.Deserialize<JsonElement>(payload);
    }
}
