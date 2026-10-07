using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Applications;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// BE-06 — CAP-01 held to its structural rules on a real database: the
/// DM-GAP-01 schema served verbatim, a reference at submission only
/// (`BR-0107`), one un-decided application (`BR-0101`), completeness against
/// the same schema rows the form renders (`BR-0105`), and add-service that
/// bypasses screening into a single decision (`BR-0110`/`BR-0112`) — with
/// submission and decisions raising CAP-07 events in the same transaction.
/// </summary>
public sealed class ApplicationTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;
    private HttpClient _client = null!;

    public ApplicationTests(WebApplicationFactory<Program> factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        await _database.InitializeAsync();
        _configured = TestOidc.Configure(
            _factory,
            _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString));
        _client = TestOidc.CreateClient(_configured);
    }

    public async Task DisposeAsync()
    {
        _configured?.Dispose();
        await _database.DisposeAsync();
    }

    public void Dispose() => _tokenEndpoint.Dispose();

    /// <summary>An applicant: authenticated, no mapped role — J-01's reality.</summary>
    private Task<JsonElement> SignInApplicantAsync() =>
        TestOidc.SignInAsync(_client, _tokenEndpoint, "unmapped");

    /* ── the schema, served verbatim ───────────────────────────────────────── */

    [Fact]
    public async Task A_historical_version_still_offers_every_legacy_domain()
    {
        /*
         * §10 — the 13 master-data values are hidden from NEW applications and
         * kept everywhere else. Each schema version carries its own frozen copy
         * of the options, so an application submitted on an earlier version
         * still renders the value its applicant actually chose. Nothing is
         * deleted, renamed or merged in the master list.
         */
        var historical = await (await _client.GetAsync(
                "/api/v1/applications/schema?version=dm-gap-01.2026-09-21"))
            .Content.ReadFromJsonAsync<JsonElement>();
        var options = historical.GetProperty("fields").EnumerateArray()
            .Single(f => f.GetProperty("id").GetString() == "domain")
            .GetProperty("options").EnumerateArray()
            .Select(o => o.GetProperty("value").GetString())
            .ToArray();

        Assert.Equal(147, options.Length);
        // The catch-all and the two tools a new applicant can no longer pick.
        Assert.Contains("dom-122", options);
        Assert.Contains("dom-032", options);
        Assert.Contains("dom-076", options);

        var current = await (await _client.GetAsync("/api/v1/applications/schema"))
            .Content.ReadFromJsonAsync<JsonElement>();
        var offered = current.GetProperty("fields").EnumerateArray()
            .Single(f => f.GetProperty("id").GetString() == "domain")
            .GetProperty("options").EnumerateArray()
            .Select(o => o.GetProperty("value").GetString())
            .ToArray();

        // The 134 ruled domains plus «أخرى», which criterion #3 pays 0 for.
        Assert.Equal(135, offered.Length);
        Assert.Equal("other", offered[^1]);
        Assert.DoesNotContain("dom-122", offered);
        Assert.DoesNotContain("dom-032", offered);
        Assert.DoesNotContain("dom-076", offered);
        // …and every value a new applicant CAN pick is one the business ruled on.
        Assert.All(offered[..^1], value => Assert.StartsWith("dom-", value!));
    }

    [Theory]
    [InlineData("trainer", true)]
    [InlineData("consultant", false)]
    [InlineData("content-developer", false)]
    [InlineData("question-writer", false)]
    public async Task preferredDeliveryMode_is_required_by_exactly_the_services_that_see_it(
        string service, bool expected)
    {
        /*
         * Business decision 2026-09-29: the field is Trainer-only. It used to
         * declare `requiredFor` = all four while `visibleFor` = trainer, which
         * both validators rendered harmless (a hidden field is skipped) but
         * which no reader could take at face value. The two lists now agree, so
         * «required» and «visible» answer the same question for every service.
         */
        var schema = await (await _client.GetAsync("/api/v1/applications/schema"))
            .Content.ReadFromJsonAsync<JsonElement>();
        var field = schema.GetProperty("fields").EnumerateArray()
            .Single(f => f.GetProperty("id").GetString() == "preferredDeliveryMode");

        var requiredFor = field.GetProperty("requiredFor").EnumerateArray()
            .Select(s => s.GetString()!).ToArray();
        var visibleFor = field.GetProperty("visibleFor").EnumerateArray()
            .Select(s => s.GetString()!).ToArray();

        Assert.Equal(expected, requiredFor.Contains(service));
        Assert.Equal(expected, visibleFor.Contains(service));
        // The declarations agree — that IS the correction, not a side effect.
        Assert.Equal(visibleFor, requiredFor);
        // The meaning and the options are untouched.
        Assert.Equal(
            ["online", "onsite", "blended"],
            field.GetProperty("options").EnumerateArray()
                .Select(o => o.GetProperty("value").GetString()!).ToArray());
    }

    [Fact]
    public async Task The_superseded_version_keeps_the_declaration_it_published_with()
    {
        // `dm-gap-01.2026-09-28` said all four services, and it still does: a
        // published version is history. The correction ships as 2026-09-29.
        var historical = await (await _client.GetAsync(
                "/api/v1/applications/schema?version=dm-gap-01.2026-09-28"))
            .Content.ReadFromJsonAsync<JsonElement>();
        var requiredFor = historical.GetProperty("fields").EnumerateArray()
            .Single(f => f.GetProperty("id").GetString() == "preferredDeliveryMode")
            .GetProperty("requiredFor").EnumerateArray()
            .Select(s => s.GetString()!).ToArray();

        Assert.Equal(
            ["trainer", "consultant", "content-developer", "question-writer"],
            requiredFor);
    }


    [Fact]
    public async Task The_owner_schema_is_served_publicly_and_verbatim()
    {
        // Anonymous on purpose — J-01 §3B lets a guest read the form first.
        var response = await _client.GetAsync("/api/v1/applications/schema");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var schema = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("dm-gap-01.2026-10-07", schema.GetProperty("version").GetString());
        Assert.Equal(6, schema.GetProperty("sections").GetArrayLength());
        // 57: «القطاع» and «المجال (أخرى)» joined on 2026-10-07 (`P-342`).
        Assert.Equal(57, schema.GetProperty("fields").GetArrayLength());
        Assert.Equal(5, schema.GetProperty("attachments").GetArrayLength());
        // Speaker is never self-service selectable (BR-0113).
        var selectable = schema.GetProperty("selectableServices").EnumerateArray()
            .Select(s => s.GetString()).ToArray();
        Assert.Equal(4, selectable.Length);
        Assert.DoesNotContain("speaker", selectable);

        // The stored definitions round-tripped whole: the domain
        // list, the URL patterns, and the SSO-owned read-only fields all
        // survive verbatim.
        var fields = schema.GetProperty("fields").EnumerateArray().ToArray();
        var domain = fields.Single(f => f.GetProperty("id").GetString() == "domain");
        // 134, not 147: the business classified 13 of the master list as
        // master-data problems on 2026-09-28, and a NEW application is no
        // longer offered them. Plus «أخرى» (2026-10-07, `P-342`).
        Assert.Equal(135, domain.GetProperty("options").GetArrayLength());
        Assert.Contains(fields, f =>
            f.TryGetProperty("validation", out var v) && v.TryGetProperty("pattern", out _));
        Assert.Contains(fields, f =>
            f.GetProperty("ownership").GetString() == "sso-profile");
    }

    [Fact]
    public async Task A_superseded_schema_version_is_still_served_by_name_and_unchanged()
    {
        var initial = await GetJsonAsync("/api/v1/applications/schema?version=dm-gap-01.2026-08-30");
        Assert.Equal("dm-gap-01.2026-08-30", initial.GetProperty("version").GetString());
        Assert.Equal(39, initial.GetProperty("fields").GetArrayLength());
        Assert.Equal(4, initial.GetProperty("attachments").GetArrayLength());
        var delivery = initial.GetProperty("fields").EnumerateArray()
            .Single(f => f.GetProperty("id").GetString() == "preferredDeliveryMode");
        Assert.Contains(delivery.GetProperty("options").EnumerateArray(),
            o => o.GetProperty("value").GetString() == "hybrid");

        var matrix = await GetJsonAsync("/api/v1/applications/schema?version=dm-gap-01.2026-09-14");
        Assert.Equal(47, matrix.GetProperty("fields").GetArrayLength());
        var specialization = matrix.GetProperty("fields").EnumerateArray()
            .Single(f => f.GetProperty("id").GetString() == "generalSpecialization");
        Assert.Equal("select", specialization.GetProperty("type").GetString());

        var unknown = await _client.GetAsync("/api/v1/applications/schema?version=no-such-version");
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
    }

    [Fact]
    public async Task The_decision_fields_of_2026_09_16_follow_their_rules_on_the_server()
    {
        var schema = await GetJsonAsync("/api/v1/applications/schema");
        var definitions = schema.GetProperty("fields").EnumerateArray()
            .Select(f => ApplicationFormLogic.Parse(f.GetRawText()))
            .ToDictionary(f => f.Id);
        string[] services = ["trainer"];
        static Dictionary<string, JsonElement> With(string json) =>
            JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json)!;
        IReadOnlyList<FieldDefinition> all = [.. definitions.Values];

        // General specialization is free text; the qualification label is «المؤهل».
        Assert.Equal("text", definitions["generalSpecialization"].Type);
        Assert.Contains(schema.GetProperty("fields").EnumerateArray(), f =>
            f.GetProperty("id").GetString() == "qualificationType"
            && f.GetProperty("labelAr").GetString() == "المؤهل");

        // Hours per day: a whole number from 1 to 24, optional.
        Assert.DoesNotContain("dailyTrainingHours",
            ApplicationFormLogic.MissingOrInvalidFields(all, services, With("{}")));
        foreach (var valid in new[] { "1", "8", "24" })
        {
            Assert.DoesNotContain("dailyTrainingHours", ApplicationFormLogic.MissingOrInvalidFields(
                all, services, With($"{{\"dailyTrainingHours\":\"{valid}\"}}")));
        }
        foreach (var invalid in new[] { "0", "25", "7.5", "-3", "ثمانية" })
        {
            Assert.Contains("dailyTrainingHours", ApplicationFormLogic.MissingOrInvalidFields(
                all, services, With($"{{\"dailyTrainingHours\":\"{invalid}\"}}")));
        }

        // The details open only for «نعم».
        var details = definitions["trainedBeforeDetails"];
        Assert.False(ApplicationFormLogic.IsVisible(details, services, With("{}")));
        Assert.False(ApplicationFormLogic.IsVisible(details, services, With("{\"hasTrainedBefore\":\"no\"}")));
        Assert.True(ApplicationFormLogic.IsVisible(details, services, With("{\"hasTrainedBefore\":\"yes\"}")));

        // Weekday availability accepts the seven days only.
        Assert.Contains("weekdayAvailability", ApplicationFormLogic.MissingOrInvalidFields(
            all, services, With("{\"weekdayAvailability\":[\"someday\"]}")));
        Assert.DoesNotContain("weekdayAvailability", ApplicationFormLogic.MissingOrInvalidFields(
            all, services, With("{\"weekdayAvailability\":[\"sunday\",\"thursday\"]}")));
    }

    [Fact]
    public async Task A_draft_keeps_the_version_it_started_on_and_new_drafts_take_the_current_one()
    {
        await SignInApplicantAsync();
        var started = await PostJsonAsync("/api/v1/me/applications/draft/start", null);
        var draftId = Guid.Parse(started.GetProperty("draft").GetProperty("id").GetString()!);
        Assert.Equal(FormSchemaVersions.Current,
            started.GetProperty("draft").GetProperty("schemaVersion").GetString());

        // A draft started before this version was published.
        await using (var db = _database.CreateContext())
        {
            var draft = await db.Applications.SingleAsync(a => a.ApplicationId == draftId);
            draft.SchemaVersion = FormSchemaVersions.Initial;
            await db.SaveChangesAsync();
        }

        var resumed = await PostJsonAsync("/api/v1/me/applications/draft/start", null);
        Assert.Equal(FormSchemaVersions.Initial,
            resumed.GetProperty("draft").GetProperty("schemaVersion").GetString());

        // Its own version's fields save; a field only the newer version has is refused.
        var saved = await PostJsonAsync("/api/v1/me/applications/draft", new
        {
            services = new[] { "trainer" },
            values = new Dictionary<string, object> { ["preferredDeliveryMode"] = "hybrid" },
        });
        Assert.Equal("hybrid", saved.GetProperty("values").GetProperty("preferredDeliveryMode").GetString());
        var newerField = await _client.PostAsJsonAsync("/api/v1/me/applications/draft", new
        {
            services = new[] { "trainer" },
            values = new Dictionary<string, object> { ["trainingLanguages"] = "ar" },
        });
        Assert.Equal(HttpStatusCode.BadRequest, newerField.StatusCode);
    }

    [Fact]
    public async Task End_date_shows_only_while_the_applicant_does_not_currently_work_there()
    {
        var schema = await GetJsonAsync("/api/v1/applications/schema");
        var definitions = schema.GetProperty("fields").EnumerateArray()
            .Select(f => ApplicationFormLogic.Parse(f.GetRawText()))
            .ToList();
        var endDate = definitions.Single(f => f.Id == "experienceEndDate");
        string[] services = ["trainer"];
        static Dictionary<string, JsonElement> With(string json) =>
            JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json)!;

        // Never touched or switched off → shown; switched on → hidden.
        Assert.True(ApplicationFormLogic.IsVisible(endDate, services, With("{}")));
        Assert.True(ApplicationFormLogic.IsVisible(endDate, services, With("{\"currentlyEmployed\":false}")));
        Assert.False(ApplicationFormLogic.IsVisible(endDate, services, With("{\"currentlyEmployed\":true}")));

        // Optional — the matrix has no mandatory flag: absent while shown still passes.
        Assert.DoesNotContain("experienceEndDate",
            ApplicationFormLogic.MissingOrInvalidFields(definitions, services, With("{}")));
    }

    /* ── the upload — `BR-0106`, and where the bytes actually go ─────────── */

    [Fact]
    public async Task An_uploaded_file_is_stored_and_can_be_read_back()
    {
        await SignInApplicantAsync();
        await PostJsonAsync("/api/v1/me/applications/draft/start", null);

        // ⚠️ The rule id the browser sends is the one the SCHEMA served, which
        // is the rule CODE. A test that passes the internal GUID proves the
        // endpoint works for a caller that does not exist.
        var schema = await GetJsonAsync("/api/v1/applications/schema");
        var ruleCode = schema.GetProperty("attachments").EnumerateArray()
            .First(r => r.GetProperty("acceptedFormats").EnumerateArray()
                .Any(f => f.GetString() == "pdf"))
            .GetProperty("id").GetString()!;

        var bytes = "%PDF-1.4 a real enough file"u8.ToArray();
        var uploaded = await UploadAsync(ruleCode, "cv.pdf", "application/pdf", bytes);
        Assert.Equal(HttpStatusCode.OK, uploaded.StatusCode);
        var wire = JsonSerializer.Deserialize<JsonElement>(
            await uploaded.Content.ReadAsStringAsync());
        var attachmentId = wire.GetProperty("id").GetString()!;
        Assert.Equal("cv.pdf", wire.GetProperty("fileName").GetString());
        Assert.Equal(bytes.Length, wire.GetProperty("sizeBytes").GetInt64());

        // The bytes are somewhere, and the somewhere is recorded on the row.
        await using (var db = _database.CreateContext())
        {
            var attachment = await db.Attachments.SingleAsync(
                a => a.AttachmentId == Guid.Parse(attachmentId));
            Assert.StartsWith("db:", attachment.StorageRef, StringComparison.Ordinal);
            Assert.NotNull(attachment.Checksum);
            // ⚠️ `G27` — no scanner is configured, and the row says exactly that
            // rather than claiming the file passed a check nobody ran.
            Assert.Equal(AttachmentScanStatuses.NotScanned, attachment.ScanStatus);
            Assert.True(await db.ApplicationAttachments.AnyAsync(
                a => a.AttachmentId == attachment.AttachmentId && a.RuleCode == ruleCode));
        }

        // And it comes back — an uploaded CV nobody can open is not an upload.
        var download = await _client.GetAsync($"/api/v1/attachments/{attachmentId}");
        Assert.Equal(HttpStatusCode.OK, download.StatusCode);
        Assert.Equal(bytes, await download.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task The_rule_is_enforced_on_the_server_not_trusted_from_the_browser()
    {
        await SignInApplicantAsync();
        await PostJsonAsync("/api/v1/me/applications/draft/start", null);

        var schema = await GetJsonAsync("/api/v1/applications/schema");
        var ruleCode = schema.GetProperty("attachments").EnumerateArray()
            .First(r => r.GetProperty("acceptedFormats").EnumerateArray()
                .Any(f => f.GetString() == "pdf"))
            .GetProperty("id").GetString()!;

        // A client that ignored the input's `accept` attribute gets the same
        // answer as one that honoured it.
        var wrongFormat = await UploadAsync(ruleCode, "notes.exe", "application/octet-stream", [1, 2, 3]);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, wrongFormat.StatusCode);
        Assert.Contains("not an accepted format",
            await wrongFormat.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        // Nothing was stored for a refused upload.
        await using (var db = _database.CreateContext())
        {
            Assert.False(await db.Attachments.AnyAsync(a => a.FileName == "notes.exe"));
        }
    }

    private async Task<HttpResponseMessage> UploadAsync(
        string ruleId, string fileName, string mimeType, byte[] content)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(ruleId), "ruleId");
        var file = new ByteArrayContent(content);
        file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(mimeType);
        form.Add(file, "file", fileName);
        return await _client.PostAsync("/api/v1/me/applications/draft/attachments", form);
    }

    /* ── the draft — BR-0107: no reference until submission ────────────────── */

    [Fact]
    public async Task A_draft_starts_saves_and_resumes_without_ever_holding_a_reference()
    {
        await SignInApplicantAsync();

        var started = await PostJsonAsync("/api/v1/me/applications/draft/start", null);
        Assert.False(started.GetProperty("resumed").GetBoolean());
        Assert.Equal(JsonValueKind.Null, started.GetProperty("blockReason").ValueKind);
        var draftId = started.GetProperty("draft").GetProperty("id").GetString()!;

        var saved = await PostJsonAsync("/api/v1/me/applications/draft", new
        {
            services = new[] { "trainer" },
            values = new Dictionary<string, object> { ["firstNameAr"] = "سارة" },
        });
        Assert.Equal("سارة", saved.GetProperty("values").GetProperty("firstNameAr").GetString());

        var resumed = await PostJsonAsync("/api/v1/me/applications/draft/start", null);
        Assert.True(resumed.GetProperty("resumed").GetBoolean());
        Assert.Equal(draftId, resumed.GetProperty("draft").GetProperty("id").GetString());

        // The list shows the draft with a NULL reference — BR-0107.
        var list = await GetJsonAsync("/api/v1/me/applications/?page=1&pageSize=10");
        var row = list.GetProperty("items").EnumerateArray().Single();
        Assert.Equal(JsonValueKind.Null, row.GetProperty("reference").ValueKind);
        Assert.False(list.GetProperty("canCreateNew").GetBoolean());
    }

    [Fact]
    public async Task An_accredited_trainer_is_routed_to_add_service_not_a_second_application()
    {
        var session = await SignInApplicantAsync();
        _ = session;
        await using (var db = _database.CreateContext())
        {
            var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == TestOidc.Subject);
            var trainerRole = await db.Roles.SingleAsync(r => r.Code == RoleCode.Trainer);
            db.UserRoles.Add(new UserRole
            {
                UserRoleId = Guid.NewGuid(),
                UserId = user.UserId,
                RoleId = trainerRole.RoleId,
                AssignedBy = user.UserId,
                AssignedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var blocked = await PostJsonAsync("/api/v1/me/applications/draft/start", null);
        Assert.Equal("approved-trainer", blocked.GetProperty("blockReason").GetString());
        Assert.Equal(JsonValueKind.Null, blocked.GetProperty("draft").ValueKind);
    }

    /* ── submission — BR-0105, BR-0107, and the CAP-07 raise ───────────────── */

    [Fact]
    public async Task Submission_enforces_completeness_issues_the_reference_and_raises_EV_0101()
    {
        await SignInApplicantAsync();
        await PostJsonAsync("/api/v1/me/applications/draft/start", null);

        // Route EV-0101 so the raise has somewhere to land — BE-05 and BE-06
        // proving each other: submission → dispatcher → log + outbox.
        await SeedRoutedEventAsync("EV-0101");

        // Incomplete on purpose: the completeness gate answers, with codes.
        var incomplete = await _client.PostAsJsonAsync("/api/v1/me/applications/submit", new
        {
            services = new[] { "trainer" },
            values = new Dictionary<string, object> { ["firstNameAr"] = "سارة" },
        });
        Assert.Equal(HttpStatusCode.BadRequest, incomplete.StatusCode);
        var problem = await incomplete.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(problem.GetProperty("fieldErrors").GetArrayLength() > 0);

        // Fill every required field FROM THE SERVED SCHEMA (no second list to
        // drift), seed the required attachments directly (G26 keeps uploads
        // closed), and submit.
        var values = await CompleteValuesForAsync("trainer");
        await SeedAllAttachmentsAsync();
        var submitted = await PostJsonAsync("/api/v1/me/applications/submit", new
        {
            services = new[] { "trainer" },
            values,
        });
        var reference = submitted.GetProperty("reference").GetString()!;
        Assert.Matches(@"^EH-\d{4}-00001$", reference);

        await using (var db = _database.CreateContext())
        {
            var application = await db.Applications.SingleAsync(a => a.Reference == reference);
            Assert.Equal("submitted", application.Status);
            Assert.NotNull(application.SubmittedAt);
            Assert.Equal("pending",
                (await db.ApplicationServices.SingleAsync(
                    s => s.ApplicationId == application.ApplicationId)).Outcome);

            // The submission confirmation went through CAP-07 in the same
            // transaction: in-platform row landed, the email queued on INT-04.
            var logged = await db.NotificationLog.SingleAsync(
                l => l.EventCode == "EV-0101" && l.Channel == "in-platform");
            Assert.Equal("success", logged.SendStatus);
            var queued = await db.OutboxMessages.SingleAsync(
                m => m.SystemCode == IntegrationSystems.EmailGateway);
            Assert.Contains(reference, queued.Payload, StringComparison.Ordinal);
        }

        // BR-0101 now blocks a second application, pointing at the open one.
        var again = await PostJsonAsync("/api/v1/me/applications/draft/start", null);
        Assert.Equal("open-application", again.GetProperty("blockReason").GetString());

        // And with the draft gone, submit has nothing to act on.
        var empty = await _client.PostAsJsonAsync("/api/v1/me/applications/submit", new
        {
            services = new[] { "trainer" },
            values = new Dictionary<string, object>(),
        });
        Assert.Equal(HttpStatusCode.Conflict, empty.StatusCode);
    }

    [Fact]
    public async Task The_stage_gated_actions_conflict_for_everything_this_stage_can_produce()
    {
        await SignInApplicantAsync();
        var applicationId = await SeedSubmittedApplicationAsync();

        foreach (var action in new[] { "interview-slot", "interview-reschedule", "agreement-decision" })
        {
            var response = await _client.PostAsJsonAsync(
                $"/api/v1/me/applications/{applicationId}/{action}", new { });
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        }

        var foreign = await _client.PostAsJsonAsync(
            $"/api/v1/me/applications/{Guid.NewGuid()}/interview-slot", new { });
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);

        // The detail itself serves the stage's truth: no interview, no
        // agreement, sync none, timeline current at "submitted".
        var detail = await GetJsonAsync($"/api/v1/me/applications/{applicationId}");
        Assert.Equal(JsonValueKind.Null, detail.GetProperty("interview").ValueKind);
        Assert.Equal("not-ready", detail.GetProperty("agreementState").GetString());
        Assert.Equal("none", detail.GetProperty("sync").GetString());
        var first = detail.GetProperty("timeline").EnumerateArray().First();
        Assert.Equal("current", first.GetProperty("state").GetString());
    }

    /* ── add-service — BR-0110/BR-0111/BR-0112, and J-03's decision ────────── */

    [Fact]
    public async Task Add_service_bypasses_screening_into_one_decision_with_the_addendum_required()
    {
        await SignInApplicantAsync();
        var applicationId = await SeedApprovedApplicationAsync("trainer");

        var context = await GetJsonAsync($"/api/v1/me/applications/{applicationId}/services/context");
        Assert.True(context.GetProperty("eligible").GetBoolean());
        Assert.True(context.GetProperty("fastAvailable").GetBoolean());
        Assert.Equal("trainer",
            context.GetProperty("currentServices").EnumerateArray().Single().GetString());

        // BR-0110 — the held service cannot be requested again.
        var duplicate = await _client.PostAsJsonAsync(
            $"/api/v1/me/applications/{applicationId}/services",
            new { service = "trainer", values = new Dictionary<string, object>() });
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);

        var created = await PostJsonAsync($"/api/v1/me/applications/{applicationId}/services", new
        {
            service = "consultant",
            values = new Dictionary<string, object> { ["consulting-areas"] = "إدارة المخاطر" },
            attachments = Array.Empty<object>(),
        });
        var requestId = created.GetProperty("requestId").GetString()!;

        // The internal half: queue → detail → decision.
        using var staff = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(staff, _tokenEndpoint, "fa-staff");
        // F-0305 إلحاق خدمة جديدة — Staff's, in the default matrix (P-190).
        await GrantAsync(TestOidc.Subject, RoleCode.Staff);

        var queue = await (await staff.GetAsync("/api/v1/internal/service-requests/"))
            .Content.ReadFromJsonAsync<JsonElement>();
        var row = queue.GetProperty("items").EnumerateArray().Single();
        Assert.Matches(@"^EH-ASR-\d{4}-0001$", row.GetProperty("reference").GetString());
        Assert.Equal(1, queue.GetProperty("pendingCount").GetInt32());

        // F3/AC-4 — no addendum, no finalized approval.
        var bare = await staff.PostAsJsonAsync(
            $"/api/v1/internal/service-requests/{requestId}/decision",
            new { kind = "approve", note = "" });
        Assert.Equal(HttpStatusCode.BadRequest, bare.StatusCode);
        // …and a file NAME is not an addendum: the document itself is required.
        var nameOnly = await staff.PostAsJsonAsync(
            $"/api/v1/internal/service-requests/{requestId}/decision",
            new { kind = "approve", addendum = new { fileName = "addendum.pdf", sizeBytes = 1 }, note = "" });
        Assert.Equal(HttpStatusCode.BadRequest, nameOnly.StatusCode);

        var approved = await staff.PostAsJsonAsync(
            $"/api/v1/internal/service-requests/{requestId}/decision",
            new
            {
                kind = "approve",
                addendum = new { fileName = "addendum-consultant.pdf", sizeBytes = 120_000, attachmentId = (await TestDocuments.UploadInternalAsync(staff, "service-addendum", "addendum-consultant.pdf")).GetProperty("attachmentId").GetString() },
                note = "اكتمل الملحق",
            });
        Assert.Equal(HttpStatusCode.OK, approved.StatusCode);
        var detail = await approved.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("approved", detail.GetProperty("status").GetString());
        Assert.False(detail.GetProperty("viewer").GetProperty("canDecide").GetBoolean());

        // The trainer's approved scope widened — our own accreditation record.
        var after = await GetJsonAsync($"/api/v1/me/applications/{applicationId}/services/context");
        Assert.Equal(2, after.GetProperty("currentServices").GetArrayLength());

        // And a second decision finds it already decided.
        var again = await staff.PostAsJsonAsync(
            $"/api/v1/internal/service-requests/{requestId}/decision",
            new { kind = "reject", reasonId = "other", reasonText = "x" });
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
    }

    [Fact]
    public async Task A_rejection_keeps_its_reason_internal_and_notifies_without_it()
    {
        await SignInApplicantAsync();
        var applicationId = await SeedApprovedApplicationAsync("trainer");
        await SeedRoutedEventAsync("EV-0104");
        var created = await PostJsonAsync($"/api/v1/me/applications/{applicationId}/services", new
        {
            service = "question-writer",
            values = new Dictionary<string, object>(),
            attachments = Array.Empty<object>(),
        });
        var requestId = created.GetProperty("requestId").GetString()!;

        using var staff = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(staff, _tokenEndpoint, "fa-staff");
        await GrantAsync(TestOidc.Subject, RoleCode.Staff);

        // F3/AC-3 — "other" requires its free text.
        var missingText = await staff.PostAsJsonAsync(
            $"/api/v1/internal/service-requests/{requestId}/decision",
            new { kind = "reject", reasonId = "other", reasonText = "" });
        Assert.Equal(HttpStatusCode.BadRequest, missingText.StatusCode);

        const string secretReason = "سبب داخلي لا يصل للمدرب";
        var rejected = await staff.PostAsJsonAsync(
            $"/api/v1/internal/service-requests/{requestId}/decision",
            new { kind = "reject", reasonId = "other", reasonText = secretReason });
        var detail = await rejected.Content.ReadFromJsonAsync<JsonElement>();

        // Internal detail records the reason (F3/AC-3)…
        Assert.Equal(secretReason,
            detail.GetProperty("decision").GetProperty("reasonText").GetString());

        // …and the notification carries none of it (F3/AC-7): the queued
        // email's rendered payload never saw the reason.
        await using var db = _database.CreateContext();
        var queued = await db.OutboxMessages
            .Where(m => m.SystemCode == IntegrationSystems.EmailGateway)
            .ToListAsync();
        Assert.NotEmpty(queued);
        Assert.All(queued, m =>
            Assert.DoesNotContain(secretReason, m.Payload, StringComparison.Ordinal));
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    /// <summary>Builds a complete value set for one service FROM the served
    /// schema — the same rows the validator reads, so the fixture cannot
    /// drift from the form.</summary>
    private async Task<Dictionary<string, object?>> CompleteValuesForAsync(string service)
    {
        var schema = await GetJsonAsync("/api/v1/applications/schema");
        var values = new Dictionary<string, object?>();
        foreach (var field in schema.GetProperty("fields").EnumerateArray())
        {
            if (field.TryGetProperty("visibleFor", out var visibleFor)
                && !visibleFor.EnumerateArray().Any(s => s.GetString() == service))
            {
                continue;
            }
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
        return values;
    }

    /// <summary>`G26` keeps the upload endpoint closed, so the required files
    /// are seeded as the stored rows a future upload will create.</summary>
    private async Task SeedAllAttachmentsAsync()
    {
        await using var db = _database.CreateContext();
        var draft = await db.Applications.SingleAsync(a => a.Status == "draft");
        foreach (var rule in await db.AttachmentRules.Where(r => r.SchemaVersion == FormSchemaVersions.Current).ToListAsync())
        {
            db.ApplicationAttachments.Add(new ApplicationAttachment
            {
                ApplicationAttachmentId = Guid.NewGuid(),
                ApplicationId = draft.ApplicationId,
                RuleCode = rule.RuleCode,
                FileName = $"{rule.RuleCode}.pdf",
                SizeBytes = 100_000,
            });
        }
        await db.SaveChangesAsync();
    }

    private async Task<Guid> SeedSubmittedApplicationAsync()
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == TestOidc.Subject);
        var application = new Application
        {
            ApplicationId = Guid.NewGuid(),
            ApplicantUserId = user.UserId,
            SchemaVersion = FormSchemaVersions.Current,
            Reference = "EH-2026-00042",
            Status = "submitted",
            Origin = "self_service",
            CreatedAt = DateTime.UtcNow,
            SubmittedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Applications.Add(application);
        db.ApplicationServices.Add(new ApplicationServiceEntry
        {
            ApplicationServiceId = Guid.NewGuid(),
            ApplicationId = application.ApplicationId,
            Service = "trainer",
            Outcome = "pending",
        });
        await db.SaveChangesAsync();
        return application.ApplicationId;
    }

    private async Task<Guid> SeedApprovedApplicationAsync(string acceptedService)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == TestOidc.Subject);
        var application = new Application
        {
            ApplicationId = Guid.NewGuid(),
            ApplicantUserId = user.UserId,
            SchemaVersion = FormSchemaVersions.Current,
            Reference = "EH-2026-00007",
            Status = "approved",
            Origin = "self_service",
            CreatedAt = DateTime.UtcNow,
            SubmittedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Applications.Add(application);
        db.ApplicationServices.Add(new ApplicationServiceEntry
        {
            ApplicationServiceId = Guid.NewGuid(),
            ApplicationId = application.ApplicationId,
            Service = acceptedService,
            Outcome = "accepted",
            DecidedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
        return application.ApplicationId;
    }

    /// <summary>Routes one event to its record subject with an approved
    /// template, so a raise lands in the log and the outbox.</summary>
    private async Task SeedRoutedEventAsync(string eventCode)
    {
        await using var db = _database.CreateContext();
        var author = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = $"seed-admin-{Guid.NewGuid():N}",
            Email = "seed-admin@fa.test",
            FullNameAr = "مشرف",
            FullNameEn = "Admin",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            IsActive = true,
            IsEmployee = true,
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(author);
        var template = new NotificationTemplate
        {
            TemplateId = Guid.NewGuid(),
            Code = $"TPL-{eventCode}",
            SubjectAr = "إشعار: {{referenceNumber}}",
            SubjectEn = "Notice: {{referenceNumber}}",
            BodyAr = "مرحبًا {{recipientName}}، تم تحديث طلبك {{referenceNumber}}.",
            BodyEn = "Hello {{recipientName}}, your application {{referenceNumber}} was updated.",
            Placeholders = """["recipientName","referenceNumber"]""",
            Version = 1,
            Status = TemplateStatuses.Approved,
            UpdatedAt = DateTime.UtcNow,
            UpdatedBy = author.UserId,
        };
        db.NotificationTemplates.Add(template);
        db.NotificationMatrixRows.Add(new NotificationMatrixRow
        {
            RowId = Guid.NewGuid(),
            EventCode = eventCode,
            TemplateId = template.TemplateId,
            Audience = """["record_subject"]""",
            IsActive = true,
        });
        await db.SaveChangesAsync();
    }


    /// <summary>
    /// Grants a platform role, the way the CAP-08 screen does. Feature
    /// permissions are read from `USER_ROLE` per request (not from the
    /// session snapshot), so granting after sign-in is enough — and it is
    /// how a real administrator hands out access mid-session.
    /// </summary>
    private async Task GrantAsync(string externalId, RoleCode role)
    {
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == externalId);
        var roleRow = await db.Roles.SingleAsync(r => r.Code == role);
        if (await db.UserRoles.AnyAsync(ur => ur.UserId == user.UserId && ur.RoleId == roleRow.RoleId))
        {
            return;
        }
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

    private async Task<JsonElement> GetJsonAsync(string path)
    {
        var response = await _client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    private async Task<JsonElement> PostJsonAsync(string path, object? body)
    {
        var response = body is null
            ? await _client.PostAsync(path, null)
            : await _client.PostAsJsonAsync(path, body);
        var payload = await response.Content.ReadAsStringAsync();
        Assert.True(
            response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 from {path}, got {(int)response.StatusCode}: {payload}");
        return JsonSerializer.Deserialize<JsonElement>(payload);
    }
}
