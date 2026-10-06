using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core.Domain;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// BE-09 — CAP-04 held to the split mastership: the trainer record is born at
/// signature, the base profile's fields are FAST's (changed by request, never
/// applied locally), the accreditation layer is ours, the public projection
/// carries neither rating nor classification nor file status, and
/// `file_status` never reaches the trainer at all.
/// </summary>
public sealed class Cap04Tests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;

    public Cap04Tests(WebApplicationFactory<Program> factory) => _factory = factory;

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

    /* ── J-13 — a trainer exists after signature, not before ───────────────── */

    [Fact]
    public async Task No_profile_exists_before_signature_and_one_exists_after()
    {
        using var applicant = await SignInAsync("cap04-a", "المدرب الأول", null);

        /*
         * Before anything: they are an applicant, and applicants have no
         * trainer record — `J-13` creates it at signature.
         *
         * ⚠️ The page still LOADS, and that changed on 2026-09-10. It used to
         * answer 404, and the screen said «تعذّر تحميل الملف» — a lie, because
         * nothing had failed: the person simply has no trainer file yet, and
         * the Academy holds most of what the page is for. It now renders with
         * `establishedInExpertHub: false` and every Expert Hub section empty,
         * so the page can show what exists and mark what does not.
         */
        var early = await GetAsync(applicant, "/api/v1/me/profile/");
        Assert.False(early.GetProperty("establishedInExpertHub").GetBoolean());
        Assert.Empty(early.GetProperty("services").EnumerateArray());
        Assert.Empty(early.GetProperty("programs").EnumerateArray());
        // ⚠️ No classification invented for somebody who has not been
        // accredited here — the `P-236` defect, in a new place.
        Assert.NotEqual("certified", early.GetProperty("classification").GetString());

        /*
         * ⚠️ **Every field has a state, and the list is never empty.** Reported
         * from the server with a screenshot: «المؤهلات العلمية» and «الشهادات
         * المهنية» rendered as headings with NOTHING underneath.
         * `ProfileFieldsForm` drops any field it has no state for, so shipping
         * `fieldStates: []` emptied every section on the page — worse than the
         * 404 this path replaced, because an empty section looks like an
         * answer. Same count as the schema, or the page silently loses fields.
         */
        var earlyStates = early.GetProperty("fieldStates").EnumerateArray().ToList();
        Assert.Equal(
            early.GetProperty("formSchema").GetProperty("fields").GetArrayLength(),
            earlyStates.Count);

        // Locked, not editable: there is no TRAINER_PROFILE row to write to,
        // and an input with a save button that cannot save is a promise the
        // endpoint would break. Locked still renders the label and the value.
        Assert.All(earlyStates, state =>
        {
            Assert.Equal("locked", state.GetProperty("editability").GetString());
            Assert.Equal("not-accredited", state.GetProperty("lockReason").GetString());
        });

        var (trainerId, _) = await ActivatedTrainerAsync(applicant, "cap04-a");
        Assert.NotEqual(Guid.Empty, trainerId);

        var profile = await GetAsync(applicant, "/api/v1/me/profile/");
        // BR-0404 / J-14/F1/AC-1 — the SAME application-form schema.
        Assert.Equal(FormSchemaVersions.Current,
            profile.GetProperty("formSchema").GetProperty("version").GetString());
        Assert.Equal(55, profile.GetProperty("formSchema").GetProperty("fields").GetArrayLength());
        // The values came across from what they already answered.
        Assert.Equal("قيمة تجريبية",
            profile.GetProperty("fieldValues").GetProperty("responsibilities").GetString());
        // The accreditation layer Expert Hub masters.
        Assert.Equal("trainer",
            profile.GetProperty("services").EnumerateArray().Single().GetString());
        // BR-1002/1007 — consent is OFF until the trainer turns it on.
        Assert.False(profile.GetProperty("visibilityConsent").GetBoolean());

        /*
         * §13 — every qualification reaches the profile, not just the first.
         * The applicant submitted one; two more are written here the way the
         * approval copy writes them (same entry columns), and the profile must
         * serve all three. `FieldValuesAsync` used to collapse them with
         * `GroupBy(FieldCode).First()`, so the second and third existed in
         * `TRAINER_FIELD_VALUE` and were dropped on the wire.
         */
        await using (var db = _database.CreateContext())
        {
            foreach (var (index, qualification, university) in new[]
            {
                (1, "master", "جامعة الملك عبدالعزيز"),
                (2, "doctorate", "جامعة الملك فهد"),
            })
            {
                db.TrainerFieldValues.Add(new TrainerFieldValue
                {
                    ValueId = Guid.NewGuid(),
                    TrainerId = trainerId,
                    FieldCode = "qualificationType",
                    Value = JsonSerializer.Serialize(qualification),
                    EntryId = $"edu-{index + 1}",
                    EntryIndex = index,
                });
                db.TrainerFieldValues.Add(new TrainerFieldValue
                {
                    ValueId = Guid.NewGuid(),
                    TrainerId = trainerId,
                    FieldCode = "universityName",
                    Value = JsonSerializer.Serialize(university),
                    EntryId = $"edu-{index + 1}",
                    EntryIndex = index,
                });
            }
            await db.SaveChangesAsync();
        }

        var withEntries = await GetAsync(applicant, "/api/v1/me/profile/");
        var education = withEntries.GetProperty("entries").GetProperty("education")
            .EnumerateArray().ToArray();
        Assert.Equal(3, education.Length);
        Assert.Equal(
            ["master", "doctorate"],
            education.Skip(1)
                .Select(e => e.GetProperty("values").GetProperty("qualificationType").GetString()));
        // The flat map stays entry 0, so a reader that never learned about
        // entries still sees a coherent single answer.
        Assert.Equal(
            education[0].GetProperty("values").GetProperty("qualificationType").GetString(),
            withEntries.GetProperty("fieldValues").GetProperty("qualificationType").GetString());

        // A trainer who applied on an earlier form version keeps seeing that
        // version — the one their answers and field states belong to.
        await using (var db = _database.CreateContext())
        {
            var trainerProfile = await db.TrainerProfiles.SingleAsync(p => p.TrainerId == trainerId);
            var application = await db.Applications.SingleAsync(
                a => a.ApplicationId == trainerProfile.ApplicationId);
            application.SchemaVersion = FormSchemaVersions.Initial;
            await db.SaveChangesAsync();
        }
        var older = await GetAsync(applicant, "/api/v1/me/profile/");
        Assert.Equal(FormSchemaVersions.Initial,
            older.GetProperty("formSchema").GetProperty("version").GetString());
        Assert.Equal(39, older.GetProperty("formSchema").GetProperty("fields").GetArrayLength());
        Assert.Equal(39, older.GetProperty("fieldStates").GetArrayLength());
    }

    /* ── BR-0408 / P-48 — file status never reaches the trainer ────────────── */

    [Fact]
    public async Task The_trainer_never_sees_their_file_status_but_staff_do()
    {
        using var applicant = await SignInAsync("cap04-b", "المدرب الثاني", null);
        var (trainerId, _) = await ActivatedTrainerAsync(applicant, "cap04-b");

        var raw = await (await applicant.GetAsync("/api/v1/me/profile/")).Content.ReadAsStringAsync();
        // Asserted on the RAW payload: no field can carry it if the word is
        // not there. J-13/AC-10 — «never displayed to the trainer».
        Assert.DoesNotContain("fileStatus", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("idle", raw, StringComparison.OrdinalIgnoreCase);

        // …and the internal surface, which BR-0408 does allow, carries it.
        // J-13: an agreement in effect with no engagement executed yet is idle.
        using var staff = await SignInAsync("cap04-staff", "موظف", RoleCode.Staff);
        var internalProfile = await GetAsync(staff, $"/api/v1/internal/trainers/{trainerId}");
        Assert.Equal("idle", internalProfile.GetProperty("fileStatus").GetString());

        // One engagement completed inside the 6-month window makes it active —
        // in the file and in the trainer base alike.
        await SeedCompletedEngagementAsync(trainerId, endedAt: DateTime.UtcNow.AddMonths(-5));
        var nowActive = await GetAsync(staff, $"/api/v1/internal/trainers/{trainerId}");
        Assert.Equal("active", nowActive.GetProperty("fileStatus").GetString());
        var listed = await GetAsync(staff, "/api/v1/internal/trainers/");
        Assert.Equal("active", listed.GetProperty("items").EnumerateArray()
            .Single(r => r.GetProperty("trainerId").GetString() == trainerId.ToString())
            .GetProperty("fileStatus").GetString());
    }

    [Fact]
    public async Task An_engagement_completed_before_the_six_month_window_leaves_the_file_idle()
    {
        using var applicant = await SignInAsync("cap04-idle", "مدرب خامل", null);
        var (trainerId, _) = await ActivatedTrainerAsync(applicant, "cap04-idle");
        using var staff = await SignInAsync("cap04-idle-staff", "موظف", RoleCode.Staff);

        await SeedCompletedEngagementAsync(trainerId, endedAt: DateTime.UtcNow.AddMonths(-7));
        // A withdrawn engagement was never executed, however recent.
        await SeedCompletedEngagementAsync(
            trainerId, endedAt: DateTime.UtcNow.AddDays(-3), status: EngagementStatuses.Withdrawn);

        var file = await GetAsync(staff, $"/api/v1/internal/trainers/{trainerId}");
        Assert.Equal("idle", file.GetProperty("fileStatus").GetString());
    }

    [Fact]
    public async Task Accreditation_itself_grants_the_trainer_role()
    {
        /*
         * `D-21` — QA found an accredited trainer with an active agreement and
         * «لا أدوار مُسنَدة — لا صلاحية وصول»: locked out of their own file,
         * of requesting an added service, and of their entitlements, until
         * somebody assigned the role by hand.
         *
         * Accreditation is the decision to let them in. Requiring a person to
         * perform it a second time in a different screen is how it gets
         * forgotten.
         */
        using var applicant = await SignInAsync("cap04-role", "مدرب معتمد", null);
        await ActivatedTrainerAsync(applicant, "cap04-role");

        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == "cap04-role");
        var trainerRole = await db.Roles.SingleAsync(r => r.Code == RoleCode.Trainer);
        Assert.True(await db.UserRoles.AnyAsync(
            ur => ur.UserId == user.UserId && ur.RoleId == trainerRole.RoleId));

        // `BR-0806` — and it is in the trail, marked as what it was.
        var entries = await db.AuditEntries
            .Where(a => a.Action == "role-assigned" && a.EntityId == user.UserId)
            .ToListAsync();
        Assert.Contains(entries, e =>
            e.AfterState != null
            && e.AfterState.Contains("fromAccreditation", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_suspended_agreement_suspends_the_trainer_file()
    {
        /*
         * `D-24` — QA suspended an agreement and the trainer stayed «نشط» in
         * the trainer base: visible for nomination and assignment while
         * suspended. `TRAINER_PROFILE.file_status` was written once at
         * accreditation and nothing ever updated it — a stored copy of a fact
         * the agreement owns, going stale the first time that fact changed.
         *
         * It is derived now, the same way `P-188` already derives the
         * agreement's own `expired` from the calendar.
         */
        using var applicant = await SignInAsync("cap04-susp", "مدرب موقوف", null);
        var (trainerId, _) = await ActivatedTrainerAsync(applicant, "cap04-susp");
        using var staff = await SignInAsync("cap04-susp-staff", "موظف", RoleCode.Staff);

        // In effect, no engagement yet — idle (J-13), not suspended.
        var inEffect = await GetAsync(staff, $"/api/v1/internal/trainers/{trainerId}");
        Assert.Equal("idle", inEffect.GetProperty("fileStatus").GetString());

        // What the lifecycle does when somebody suspends an agreement.
        await using (var db = _database.CreateContext())
        {
            var agreement = await db.Agreements.FirstAsync(a =>
                a.Status == AgreementStatuses.Active);
            agreement.Status = AgreementStatuses.Suspended;
            await db.SaveChangesAsync();
        }

        var suspended = await GetAsync(staff, $"/api/v1/internal/trainers/{trainerId}");
        Assert.Equal("suspended", suspended.GetProperty("fileStatus").GetString());

        // ⚠️ And the trainer base agrees — the list and the file are the same
        // derivation, so a search cannot show somebody as available while
        // their own file says otherwise.
        var search = await GetAsync(staff, "/api/v1/internal/trainers?page=1&pageSize=10");
        var row = search.GetProperty("items").EnumerateArray()
            .Single(r => r.GetProperty("trainerId").GetString() == trainerId.ToString());
        Assert.Equal("suspended", row.GetProperty("fileStatus").GetString());
    }

    /* ── J-14 — editability is per field, and re-checked on write ──────────── */

    [Fact]
    public async Task An_expert_hub_field_saves_directly_and_a_fast_field_only_by_request()
    {
        using var applicant = await SignInAsync("cap04-c", "المدرب الثالث", null);
        await ActivatedTrainerAsync(applicant, "cap04-c");

        var profile = await GetAsync(applicant, "/api/v1/me/profile/");
        var states = profile.GetProperty("fieldStates").EnumerateArray().ToArray();
        // `firstNameAr` is `sso-profile`-owned in the DM-GAP-01 schema, so
        // FAST masters it: change by request. `responsibilities` is ours.
        var fastField = states.Single(s => s.GetProperty("fieldId").GetString() == "firstNameAr");
        var ownField = states.Single(s => s.GetProperty("fieldId").GetString() == "responsibilities");
        Assert.Equal("request-change", fastField.GetProperty("editability").GetString());
        Assert.Equal("editable", ownField.GetProperty("editability").GetString());

        // Our own field saves directly.
        var saved = await PostAsync(applicant, "/api/v1/me/profile/fields", new
        {
            values = new Dictionary<string, object> { ["responsibilities"] = "مسؤوليات محدثة" },
        });
        Assert.Equal("مسؤوليات محدثة",
            saved.GetProperty("fieldValues").GetProperty("responsibilities").GetString());

        // A FAST-owned field is REFUSED on the direct path — re-checked
        // server-side, because a client that skipped the UI must not write it.
        var refused = await applicant.PostAsJsonAsync("/api/v1/me/profile/fields", new
        {
            values = new Dictionary<string, object> { ["firstNameAr"] = "اسم مزيف" },
        });
        Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);

        // P-135 write-through: the request is recorded, the DISPLAYED value
        // does not move, and the pending value is shown beside it.
        var requested = await PostAsync(applicant, "/api/v1/me/profile/change-request", new
        {
            fieldId = "firstNameAr",
            newValue = "الاسم الجديد",
        });
        var pendingState = requested.GetProperty("fieldStates").EnumerateArray()
            .Single(s => s.GetProperty("fieldId").GetString() == "firstNameAr");
        Assert.Equal("الاسم الجديد", pendingState.GetProperty("pendingValue").GetString());
        Assert.Equal("قيمة تجريبية",
            requested.GetProperty("fieldValues").GetProperty("firstNameAr").GetString());

        // One at a time — a second request while one is pending is refused.
        var second = await applicant.PostAsJsonAsync("/api/v1/me/profile/change-request", new
        {
            fieldId = "firstNameAr",
            newValue = "اسم آخر",
        });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    /* ── J-24 — the public directory is consent-gated and carries little ───── */

    [Fact]
    public async Task The_public_directory_shows_only_consenting_trainers_and_no_private_field()
    {
        using var applicant = await SignInAsync("cap04-d", "سارة العتيبي", null);
        var (trainerId, _) = await ActivatedTrainerAsync(applicant, "cap04-d");
        await SeedDeliveredProgramAsync(trainerId);

        // Anonymous — these are public pages.
        using var anonymous = TestOidc.CreateClient(_configured!);

        // Consent is off, so they are not in the directory and their profile
        // is NOT FOUND rather than forbidden: saying "forbidden" would itself
        // disclose that the person exists (`P-41`).
        var empty = await GetAsync(anonymous, "/api/v1/directory?page=1&pageSize=10");
        Assert.Empty(empty.GetProperty("items").EnumerateArray());
        Assert.Equal(0, empty.GetProperty("totalConsented").GetInt32());
        Assert.Equal(HttpStatusCode.NotFound,
            (await anonymous.GetAsync($"/api/v1/directory/{trainerId}")).StatusCode);

        // BR-1007 — consent takes effect immediately.
        await PostAsync(applicant, "/api/v1/me/profile/visibility", new { consent = true });

        var listed = await GetAsync(anonymous, "/api/v1/directory?page=1&pageSize=10");
        var card = listed.GetProperty("items").EnumerateArray().Single();
        Assert.Equal("سارة العتيبي", card.GetProperty("name").GetString());
        Assert.Equal(1, listed.GetProperty("programsDelivered").GetInt32());

        /*
         * What the public payloads may carry — an ALLOW-LIST of property names,
         * so a field added later fails here instead of slipping through a
         * substring scan that only knew five names (UI-27).
         *
         * `P-335` (2026-10-06) fixes the list: name, field (specialties),
         * approved short bio, programmes delivered, personal photo and
         * classification. City is no longer published, and the delivered
         * programmes carry no internal `TRAINER_RECORD` id.
         */
        static string[] Names(JsonElement e) =>
            [.. e.EnumerateObject().Select(p => p.Name).Order(StringComparer.Ordinal)];
        Assert.Equal(
            ["items", "page", "pageCount", "pageSize", "programsDelivered", "specialtiesRepresented",
                "totalConsented", "totalCount"],
            Names(listed));
        Assert.Equal(
            ["classification", "id", "name", "photoUrl", "programsDelivered", "specialties"],
            Names(card));
        var publicProfile = await GetAsync(anonymous, $"/api/v1/directory/{trainerId}");
        Assert.Equal(
            ["bio", "classification", "deliveredPrograms", "id", "name", "photoUrl", "specialties"],
            Names(publicProfile));
        var program = publicProfile.GetProperty("deliveredPrograms").EnumerateArray().Single();
        Assert.Equal(["name", "year"], Names(program));
        Assert.Equal("برنامج القيادة", program.GetProperty("name").GetString());

        // No stored photo yet → no photo URL, and the photo route is the same
        // 404 as an unknown trainer.
        Assert.Equal(JsonValueKind.Null, card.GetProperty("photoUrl").ValueKind);
        Assert.Equal(HttpStatusCode.NotFound,
            (await anonymous.GetAsync($"/api/v1/directory/{trainerId}/photo")).StatusCode);

        // The photo uploaded with the application is published — the image and
        // nothing else, through the directory's own route, never an attachment id.
        var pixel = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        await SeedPhotoAsync(trainerId, pixel, "image/png");
        var withPhoto = (await GetAsync(anonymous, "/api/v1/directory?page=1&pageSize=10"))
            .GetProperty("items").EnumerateArray().Single();
        Assert.Equal($"/v1/directory/{trainerId:D}/photo", withPhoto.GetProperty("photoUrl").GetString());
        using var photo = await anonymous.GetAsync($"/api/v1/directory/{trainerId}/photo");
        Assert.Equal(HttpStatusCode.OK, photo.StatusCode);
        Assert.Equal("image/png", photo.Content.Headers.ContentType?.MediaType);
        Assert.Equal(pixel, await photo.Content.ReadAsByteArrayAsync());

        // Turning consent off removes them again — the directory reads the
        // column, so there is no cached copy to go stale.
        await PostAsync(applicant, "/api/v1/me/profile/visibility", new { consent = false });
        var afterOptOut = await GetAsync(anonymous, "/api/v1/directory?page=1&pageSize=10");
        Assert.Empty(afterOptOut.GetProperty("items").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound,
            (await anonymous.GetAsync($"/api/v1/directory/{trainerId}/photo")).StatusCode);
    }

    [Fact]
    public async Task The_public_photo_route_serves_only_an_image()
    {
        using var applicant = await SignInAsync("cap04-photo-type", "مدرب", null);
        var (trainerId, _) = await ActivatedTrainerAsync(applicant, "cap04-photo-type");
        await PostAsync(applicant, "/api/v1/me/profile/visibility", new { consent = true });
        // A `photo` slot holding a PDF is treated as no photo, not handed to a browser.
        await SeedPhotoAsync(trainerId, "%PDF-1.4"u8.ToArray(), "application/pdf");
        using var anonymous = TestOidc.CreateClient(_configured!);
        Assert.Equal(HttpStatusCode.NotFound,
            (await anonymous.GetAsync($"/api/v1/directory/{trainerId}/photo")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await anonymous.GetAsync("/api/v1/directory/not-a-guid/photo")).StatusCode);
    }

    private async Task SeedPhotoAsync(Guid trainerId, byte[] bytes, string mimeType)
    {
        await using var db = _database.CreateContext();
        var profile = await db.TrainerProfiles.SingleAsync(p => p.TrainerId == trainerId);
        var blob = new DocumentBlob
        {
            BlobId = Guid.NewGuid(), Content = bytes, MimeType = mimeType,
            FileName = "me", StoredAt = DateTime.UtcNow,
        };
        db.DocumentBlobs.Add(blob);
        var file = new Attachment
        {
            AttachmentId = Guid.NewGuid(), FileName = "me", MimeType = mimeType,
            SizeBytes = bytes.Length, StorageRef = $"db:{blob.BlobId:D}",
            UploadedBy = profile.UserId, UploadedAt = DateTime.UtcNow,
        };
        db.Attachments.Add(file);
        var row = await db.ApplicationAttachments.SingleAsync(
            a => a.ApplicationId == profile.ApplicationId && a.RuleCode == "photo");
        row.AttachmentId = file.AttachmentId;
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task A_suspended_trainer_disappears_from_the_public_directory_whatever_their_consent()
    {
        using var applicant = await SignInAsync("cap04-pub-susp", "مدرب", null);
        var (trainerId, _) = await ActivatedTrainerAsync(applicant, "cap04-pub-susp");
        await using (var db = _database.CreateContext())
        {
            var profile = await db.TrainerProfiles.SingleAsync(p => p.TrainerId == trainerId);
            profile.VisibilityConsent = true;
            profile.VisibilityConsentDecidedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
        using var visitor = TestOidc.CreateClient(_configured!);

        // Idle (no engagement yet) is monitoring-only and stays public.
        var listed = await GetAsync(visitor, "/api/v1/directory?page=1&pageSize=10");
        Assert.Contains(listed.GetProperty("items").EnumerateArray(),
            t => t.GetProperty("id").GetString() == trainerId.ToString());
        Assert.Equal(HttpStatusCode.OK, (await visitor.GetAsync($"/api/v1/directory/{trainerId}")).StatusCode);

        await using (var db = _database.CreateContext())
        {
            var agreement = await db.Agreements.FirstAsync(a => a.Status == AgreementStatuses.Active);
            agreement.Status = AgreementStatuses.Suspended;
            await db.SaveChangesAsync();
        }

        var afterSuspension = await GetAsync(visitor, "/api/v1/directory?page=1&pageSize=10");
        Assert.DoesNotContain(afterSuspension.GetProperty("items").EnumerateArray(),
            t => t.GetProperty("id").GetString() == trainerId.ToString());
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync($"/api/v1/directory/{trainerId}")).StatusCode);
        // A specialty filter has nothing behind it — refused, not «nobody».
        Assert.Equal(HttpStatusCode.BadRequest,
            (await visitor.GetAsync("/api/v1/directory?page=1&pageSize=10&specialty=finance")).StatusCode);
    }

    [Fact]
    public async Task A_trainer_adds_a_certificate_as_a_stored_document_under_the_application_rule()
    {
        using var applicant = await SignInAsync("cap04-cert", "مدرب", null);
        await ActivatedTrainerAsync(applicant, "cap04-cert");

        using (var wrong = new MultipartFormDataContent())
        {
            wrong.Add(new ByteArrayContent("plain"u8.ToArray()), "file", "certificate.txt");
            var refused = await applicant.PostAsync("/api/v1/me/profile/certificates", wrong);
            Assert.Equal((HttpStatusCode)422, refused.StatusCode);
        }

        using var content = new MultipartFormDataContent();
        var file = new ByteArrayContent("%PDF-1.4 certificate"u8.ToArray());
        file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(file, "file", "cfa-level-1.pdf");
        var response = await applicant.PostAsync("/api/v1/me/profile/certificates", content);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var profile = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());
        Assert.Contains(profile.GetProperty("certificates").EnumerateArray(),
            c => c.GetProperty("name").GetString() == "cfa-level-1.pdf");

        await using var db = _database.CreateContext();
        var stored = await db.Attachments.SingleAsync(a => a.FileName == "cfa-level-1.pdf");
        // G27 — never labelled clean without a scanner.
        Assert.Equal(AttachmentScanStatuses.NotScanned, stored.ScanStatus);
        var download = await applicant.GetAsync($"/api/v1/attachments/{stored.AttachmentId}");
        Assert.Equal(HttpStatusCode.OK, download.StatusCode);
    }

    [Fact]
    public async Task Consent_is_dated_so_silence_is_never_mistaken_for_agreement()
    {
        /*
         * `D-44` — QA raised a privacy finding against a government platform
         * publishing personal data: the directory was correctly gated and
         * correctly defaulted to hidden, but nothing recorded that anybody had
         * been ASKED. «We defaulted you to hidden» and «you decided to stay
         * hidden» are different facts, and only the second is a consent record.
         */
        using var applicant = await SignInAsync("cap04-consent", "نورة القحطاني", null);
        await ActivatedTrainerAsync(applicant, "cap04-consent");

        var before = await GetAsync(applicant, "/api/v1/me/profile");
        Assert.False(before.GetProperty("visibilityConsent").GetBoolean());
        // Never asked — and the profile can tell.
        Assert.Equal(
            JsonValueKind.Null,
            before.GetProperty("visibilityConsentDecidedAt").ValueKind);

        // Declining is a decision too, and it is dated like any other, so a
        // trainer who says no is not asked again on every visit.
        var declined = await PostAsync(
            applicant, "/api/v1/me/profile/visibility", new { consent = false });
        Assert.False(declined.GetProperty("visibilityConsent").GetBoolean());
        Assert.NotEqual(
            JsonValueKind.Null,
            declined.GetProperty("visibilityConsentDecidedAt").ValueKind);

        var agreed = await PostAsync(
            applicant, "/api/v1/me/profile/visibility", new { consent = true });
        Assert.True(agreed.GetProperty("visibilityConsent").GetBoolean());
        Assert.NotEqual(
            JsonValueKind.Null,
            agreed.GetProperty("visibilityConsentDecidedAt").ValueKind);
    }

    /* ── J-15 — the internal base, and what it honestly does not know ─────── */

    [Fact]
    public async Task The_internal_trainer_base_searches_and_states_its_gaps()
    {
        using var applicant = await SignInAsync("cap04-e", "خالد الشمري", null);
        var (trainerId, _) = await ActivatedTrainerAsync(applicant, "cap04-e");
        using var staff = await SignInAsync("cap04-staff2", "موظف", RoleCode.Staff);

        var results = await GetAsync(staff, "/api/v1/internal/trainers/");
        var row = results.GetProperty("items").EnumerateArray().Single();
        Assert.Equal(trainerId.ToString(), row.GetProperty("trainerId").GetString());
        // J-13 — an agreement in effect with no executed engagement is idle.
        Assert.Equal("idle", row.GetProperty("fileStatus").GetString());
        // No rating calculated yet (`02D`/`DM-GAP-14`) — null, not zero.
        Assert.Equal(JsonValueKind.Null, row.GetProperty("evaluationOverall").ValueKind);
        // `Q16` — the domain taxonomy does not exist, so none is offered.
        Assert.Empty(results.GetProperty("availableDomains").EnumerateArray());

        var filteredOut = await GetAsync(staff, "/api/v1/internal/trainers/?search=nobody");
        Assert.Empty(filteredOut.GetProperty("items").EnumerateArray());
        var byStatus = await GetAsync(staff, "/api/v1/internal/trainers/?fileStatus=suspended");
        // No numeric years source exists: the years column is unknown, and the
        // minimum-years filter is refused rather than silently matching nobody.
        Assert.Equal(JsonValueKind.Null, row.GetProperty("yearsExperience").ValueKind);
        var byYears = await staff.GetAsync("/api/v1/internal/trainers/?minYearsExperience=1");
        Assert.Equal(HttpStatusCode.BadRequest, byYears.StatusCode);
        Assert.Contains("min-years-experience-unavailable",
            await byYears.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        // The same for every filter with nothing behind it (J-15): refused,
        // never a filter that predictably answers «nobody».
        foreach (var (query, refusal) in new[]
        {
            ("specialty=finance", "specialty-filter-unavailable"),
            ("domain=dom-003", "domain-filter-unavailable"),
            ("minEvaluation=3", "min-evaluation-unavailable"),
        })
        {
            var refused = await staff.GetAsync($"/api/v1/internal/trainers/?{query}");
            Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
            Assert.Contains(refusal, await refused.Content.ReadAsStringAsync(), StringComparison.Ordinal);
        }
        Assert.Empty(byStatus.GetProperty("items").EnumerateArray());

        var detail = await GetAsync(staff, $"/api/v1/internal/trainers/{trainerId}");
        var card = detail.GetProperty("identityCard");
        // J-15 «Identity Card Template Fields» — every row from the profile.
        // The application answered every select with its first option.
        // Academic qualifications: the option's LABEL, never the stored value.
        Assert.Equal("دبلوم", card.GetProperty("academicQualifications").GetString());
        Assert.Equal("دبلوم", detail.GetProperty("academicQualification").GetString());
        // Related fields ← the field/domain answer (dom-001's label).
        Assert.Equal(["تقنية معلومات وادارة وقيادة"],
            card.GetProperty("relatedFields").EnumerateArray().Select(e => e.GetString()));
        // Certifications ← the certificate the profile names, not file names.
        // A code now, not free text: `certificateName` became the classified
        // master-list dropdown the Evaluation Matrix scores criteria #7/#8 on.
        Assert.Equal(["CERT-0001"],
            card.GetProperty("certifications").EnumerateArray().Select(e => e.GetString()));
        // Social media accounts ← LinkedIn + personal website.
        Assert.Equal(["https://example.com/profile", "https://example.com/profile"],
            card.GetProperty("socialAccounts").EnumerateArray().Select(e => e.GetString()));
        // `G26` — no generated document, so no fabricated link.
        Assert.Equal(JsonValueKind.Null, card.GetProperty("pdfUrl").ValueKind);
        // Experience ← the structured «عدد سنوات الخبرة» range this form version
        // asked (first option), shown as its label — never turned into a number.
        // The years-of-experience buckets were realigned to the Evaluation
        // Matrix on 2026-09-19 («1 to 5 / 5 to 10 / 11 to 15 / 16+»), so the
        // fixture's first option is no longer «أقل من سنتين».
        Assert.Equal("من 1 إلى 5 سنوات", card.GetProperty("experience").GetString());
        Assert.Equal(JsonValueKind.Null, detail.GetProperty("yearsExperience").ValueKind);
        // No stored photo file → no photo link; the card falls back to initials.
        Assert.Equal(JsonValueKind.Null, card.GetProperty("photoUrl").ValueKind);

        // The profile picture uploaded with the application is reused as-is.
        Guid photoId;
        await using (var db = _database.CreateContext())
        {
            var profile = await db.TrainerProfiles.SingleAsync(p => p.TrainerId == trainerId);
            var photo = new Attachment
            {
                AttachmentId = Guid.NewGuid(),
                FileName = "me.png",
                MimeType = "image/png",
                SizeBytes = 1_000,
                StorageRef = "db:test",
                UploadedBy = profile.UserId,
                UploadedAt = DateTime.UtcNow,
            };
            db.Attachments.Add(photo);
            var photoRow = await db.ApplicationAttachments.SingleAsync(
                a => a.ApplicationId == profile.ApplicationId && a.RuleCode == "photo");
            photoRow.AttachmentId = photo.AttachmentId;
            await db.SaveChangesAsync();
            photoId = photo.AttachmentId;
        }
        var withPhoto = await GetAsync(staff, $"/api/v1/internal/trainers/{trainerId}");
        Assert.Equal($"/v1/attachments/{photoId:D}",
            withPhoto.GetProperty("identityCard").GetProperty("photoUrl").GetString());
        Assert.Equal($"/v1/attachments/{photoId:D}", withPhoto.GetProperty("avatarUrl").GetString());
    }

    /* ── J-03 — an approved add-service widens the accreditation layer ─────── */

    [Fact]
    public async Task An_approved_add_service_appears_on_the_trainer_record()
    {
        using var applicant = await SignInAsync("cap04-f", "منى القحطاني", null);
        var (trainerId, applicationId) = await ActivatedTrainerAsync(applicant, "cap04-f");
        using var staff = await SignInAsync("cap04-staff3", "موظف", RoleCode.Staff);

        var created = await PostAsync(applicant,
            $"/api/v1/me/applications/{applicationId}/services",
            new
            {
                service = "consultant",
                values = new Dictionary<string, object>(),
                attachments = Array.Empty<object>(),
            });
        await PostAsync(staff,
            $"/api/v1/internal/service-requests/{created.GetProperty("requestId").GetString()}/decision",
            new
            {
                kind = "approve",
                addendum = new { fileName = "addendum.pdf", sizeBytes = 90_000, attachmentId = (await TestDocuments.UploadInternalAsync(staff, "service-addendum", "addendum.pdf")).GetProperty("attachmentId").GetString() },
                note = "",
            });

        // P-134 — the accreditation layer is ours, and it is what the
        // trainer's own profile reports.
        var profile = await GetAsync(applicant, "/api/v1/me/profile/");
        var services = profile.GetProperty("services").EnumerateArray()
            .Select(s => s.GetString()).ToArray();
        Assert.Equal(2, services.Length);
        Assert.Contains("consultant", services);

        await using var db = _database.CreateContext();
        Assert.Equal(2, await db.TrainerServices.CountAsync(s => s.TrainerId == trainerId));
    }

    /* ── P-331 — the short bio ─────────────────────────────────────────────── */

    [Fact]
    public async Task A_bio_goes_public_only_when_approved_and_an_edit_waits_for_review()
    {
        using var trainer = await SignInAsync("cap04-bio", "نورة القحطاني", null);
        var (trainerId, _) = await ActivatedTrainerAsync(trainer, "cap04-bio");
        await PostAsync(trainer, "/api/v1/me/profile/visibility", new { consent = true });
        using var staff = await SignInAsync("cap04-bio-staff", "الموظف", RoleCode.Staff);
        using var anonymous = TestOidc.CreateClient(_configured!);
        const string first = "مدربة معتمدة في الامتثال المالي.";

        var none = (await GetAsync(trainer, "/api/v1/me/profile/")).GetProperty("bio");
        Assert.Equal("none", none.GetProperty("status").GetString());

        var submitted = (await PostAsync(trainer, "/api/v1/me/profile/bio",
            new { text = first, revision = 0 })).GetProperty("bio");
        Assert.Equal("pending_review", submitted.GetProperty("status").GetString());
        Assert.Equal("trainer", submitted.GetProperty("draftSource").GetString());

        // Submitted is not approved: nobody else sees it yet.
        Assert.Equal(JsonValueKind.Null,
            (await GetAsync(anonymous, $"/api/v1/directory/{trainerId}")).GetProperty("bio").ValueKind);

        var queued = (await GetAsync(staff, "/api/v1/internal/trainer-bios")).EnumerateArray().Single();
        Assert.Equal(first, queued.GetProperty("draft").GetString());
        var seen = queued.GetProperty("revision").GetInt32();
        await PostAsync(staff, $"/api/v1/internal/trainers/{trainerId}/bio/decision",
            new { decision = "approve", note = "", revision = seen });

        Assert.Equal(first,
            (await GetAsync(anonymous, $"/api/v1/directory/{trainerId}")).GetProperty("bio").GetString());
        Assert.Equal(first,
            (await GetAsync(staff, $"/api/v1/internal/trainers/{trainerId}")).GetProperty("bio").GetString());
        Assert.Empty((await GetAsync(staff, "/api/v1/internal/trainer-bios")).EnumerateArray());

        // An edit after approval goes back to review, and the public page keeps
        // the approved text meanwhile — never the unapproved edit.
        var approved = (await GetAsync(trainer, "/api/v1/me/profile/")).GetProperty("bio");
        await PostAsync(trainer, "/api/v1/me/profile/bio",
            new { text = "نص معدَّل لم يُعتمد بعد.", revision = approved.GetProperty("revision").GetInt32() });
        Assert.Equal(first,
            (await GetAsync(anonymous, $"/api/v1/directory/{trainerId}")).GetProperty("bio").GetString());

        // A reviewer acting on the revision they read before the edit is
        // refused: they would be approving text they never saw.
        var stale = await staff.PostAsJsonAsync($"/api/v1/internal/trainers/{trainerId}/bio/decision",
            new { decision = "approve", note = "", revision = seen });
        Assert.Equal(HttpStatusCode.Conflict, stale.StatusCode);

        var current = (await GetAsync(staff, "/api/v1/internal/trainer-bios")).EnumerateArray().Single()
            .GetProperty("revision").GetInt32();
        await PostAsync(staff, $"/api/v1/internal/trainers/{trainerId}/bio/decision",
            new { decision = "return", note = "يرجى ذكر المؤهل.", revision = current });
        var returned = (await GetAsync(trainer, "/api/v1/me/profile/")).GetProperty("bio");
        Assert.Equal("returned", returned.GetProperty("status").GetString());
        Assert.Equal("يرجى ذكر المؤهل.", returned.GetProperty("reviewNote").GetString());
        Assert.Equal(first, returned.GetProperty("published").GetString());

        await using var db = _database.CreateContext();
        Assert.Equal(1, await db.AuditEntries.CountAsync(a => a.Action == "bio-approved" && a.EntityId == trainerId));
        Assert.Equal(1, await db.AuditEntries.CountAsync(a => a.Action == "bio-returned" && a.EntityId == trainerId));
    }

    [Fact]
    public async Task The_bio_endpoints_refuse_what_the_rules_forbid()
    {
        using var trainer = await SignInAsync("cap04-bio-r", "المدرب", null);
        var (trainerId, _) = await ActivatedTrainerAsync(trainer, "cap04-bio-r");
        using var staff = await SignInAsync("cap04-bio-r-staff", "الموظف", RoleCode.Staff);

        // The AI is off until `Q28`, and the page is told so.
        var draft = await trainer.PostAsJsonAsync("/api/v1/me/profile/bio/draft-from-cv", new { revision = 0 });
        Assert.Equal(HttpStatusCode.Conflict, draft.StatusCode);
        Assert.Contains("ai-unavailable", await draft.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        var tooLong = await trainer.PostAsJsonAsync("/api/v1/me/profile/bio",
            new { text = new string('ن', 601), revision = 0 });
        Assert.Equal(HttpStatusCode.BadRequest, tooLong.StatusCode);

        // The trainer is not a reviewer — not even of their own bio.
        Assert.Equal(HttpStatusCode.Forbidden,
            (await trainer.GetAsync("/api/v1/internal/trainer-bios")).StatusCode);

        var bio = (await PostAsync(trainer, "/api/v1/me/profile/bio", new { text = "نبذة.", revision = 0 }))
            .GetProperty("bio");
        var noNote = await staff.PostAsJsonAsync($"/api/v1/internal/trainers/{trainerId}/bio/decision",
            new { decision = "return", note = " ", revision = bio.GetProperty("revision").GetInt32() });
        Assert.Equal(HttpStatusCode.BadRequest, noNote.StatusCode);
    }

    [Fact]
    public async Task An_ai_draft_is_written_only_for_the_request_the_trainer_is_still_waiting_on()
    {
        using var trainer = await SignInAsync("cap04-bio-ai", "المدرب", null);
        var (trainerId, _) = await ActivatedTrainerAsync(trainer, "cap04-bio-ai");
        await using (var seed = _database.CreateContext())
        {
            seed.TrainerBios.Add(new TrainerBio
            {
                TrainerId = trainerId,
                Status = TrainerBioStatuses.Drafting,
                Revision = 3,
                UpdatedAt = DateTime.UtcNow,
            });
            await seed.SaveChangesAsync();
        }
        var request = new Infrastructure.Profiles.TrainerBioDraftRequest(trainerId, 3, Guid.NewGuid(), "ar");

        await using var db = _database.CreateContext();
        Assert.Equal(1, await Infrastructure.Profiles.TrainerBioDrafting.WriteAsync(
            db, request, "مسودة من السيرة.", DateTime.UtcNow, default));
        // The same answer delivered twice — the outbox retries — changes nothing.
        Assert.Equal(0, await Infrastructure.Profiles.TrainerBioDrafting.WriteAsync(
            db, request, "مسودة أخرى.", DateTime.UtcNow, default));

        var row = await db.TrainerBios.AsNoTracking().SingleAsync(b => b.TrainerId == trainerId);
        Assert.Equal(TrainerBioStatuses.AiDraft, row.Status);
        Assert.Equal("مسودة من السيرة.", row.Draft);
        Assert.Equal(TrainerBioSources.Ai, row.DraftSource);
        // An AI draft is never published by itself.
        Assert.Null(row.Published);

        // Keeping the AI's words unchanged keeps the credit; the trainer still
        // has to submit, and staff still have to approve.
        var submitted = (await PostAsync(trainer, "/api/v1/me/profile/bio",
            new { text = "مسودة من السيرة.", revision = row.Revision })).GetProperty("bio");
        Assert.Equal("ai", submitted.GetProperty("draftSource").GetString());
        Assert.Equal("pending_review", submitted.GetProperty("status").GetString());
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    /// <summary>Walks a real application all the way to an active agreement,
    /// which is what creates the trainer record (J-13).</summary>
    private async Task<(Guid TrainerId, string ApplicationId)> ActivatedTrainerAsync(
        HttpClient applicant, string subject)
    {
        using var manager = await SignInAsync($"{subject}-mgr", "المدير", RoleCode.Manager);
        var managerId = await UserIdOfAsync($"{subject}-mgr");
        var applicationId = await SubmitCompleteApplicationAsync(applicant);

        await PostAsync(manager,
            $"/api/v1/internal/applications/{applicationId}/screening/decision",
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
        await PostAsync(manager,
            $"/api/v1/internal/applications/{applicationId}/committee/formation",
            new
            {
                members = new[] { new { approverId = managerId, obligation = "mandatory" } },
                saveAsTemplateName = "",
            });
        await PostAsync(manager,
            $"/api/v1/internal/applications/{applicationId}/committee/decisions",
            new { kind = "approve", note = "" });

        await PostAsync(applicant, "/api/v1/me/profile/bank-data", new
        {
            bankCountry = "السعودية", bankCity = "الرياض", bankName = "البنك الأهلي",
            branchName = "العليا", iban = "SA0380000000608010167519", swiftCode = "NCBKSAJE",
            accountHolderName = "المدرب", accountNumber = "608010167519",
        });
        await PostAsync(manager,
            $"/api/v1/internal/applications/{applicationId}/agreement/preparation",
            new
            {
                documentAttachmentId = await TestDocuments.AgreementFileAsync(manager),
                values = new Dictionary<string, string>
                {
                    ["startDate"] = "2026-09-01",
                    ["endDate"] = "2027-09-01",
                },
            });
        await PostAsync(manager,
            $"/api/v1/internal/applications/{applicationId}/agreement/signing-sequence",
            new
            {
                members = new[]
                {
                    new { approverId = managerId, obligation = "mandatory", isSigner = true },
                },
                saveAsTemplateName = "",
            });
        await PostAsync(manager,
            $"/api/v1/internal/applications/{applicationId}/agreement/decisions",
            new { kind = "sign-and-approve", note = "", signatureName = "المدير" });
        await PostAsync(applicant,
            $"/api/v1/me/applications/{applicationId}/agreement-decision",
            new { kind = "sign", signatureName = "المدرب" });

        await using var db = _database.CreateContext();
        var profile = await db.TrainerProfiles.SingleAsync(
            p => p.ApplicationId == Guid.Parse(applicationId));
        return (profile.TrainerId, applicationId);
    }

    /// <summary>One engagement whose plan ended at <paramref name="endedAt"/> —
    /// `completed` once that date has passed (J-21/F5).</summary>
    private async Task SeedCompletedEngagementAsync(
        Guid trainerId, DateTime endedAt, string status = EngagementStatuses.Upcoming)
    {
        await using var db = _database.CreateContext();
        var anyUser = await db.TrainerProfiles
            .Where(p => p.TrainerId == trainerId).Select(p => p.UserId).SingleAsync();
        var request = new AssignmentRequest
        {
            RequestId = Guid.NewGuid(),
            CreatedBy = anyUser,
            Reference = $"ASR-2026-{Random.Shared.Next(1000, 9999)}",
            ServiceType = ApplicationServices.Trainer,
            RequestType = "general-program",
            CentreId = "centre",
            ResponsibleEmployee = "موظف",
            RequiredHeadcount = 1,
            Status = "closed",
            FormValues = JsonSerializer.Serialize(new
            {
                dateFrom = endedAt.AddDays(-2).ToString("O"),
                dateTo = endedAt.ToString("O"),
            }),
            CreatedAt = endedAt.AddMonths(-1),
        };
        var slot = new AssignmentSlot
        {
            SlotId = Guid.NewGuid(),
            RequestId = request.RequestId,
            SlotNumber = 1,
            FastSyncState = "none",
        };
        var offer = new AssignmentOffer
        {
            OfferId = Guid.NewGuid(),
            SlotId = slot.SlotId,
            TrainerId = trainerId,
            Status = OfferStatuses.Accepted,
            Currency = "SAR",
            SentAt = endedAt.AddMonths(-1),
        };
        db.AssignmentRequests.Add(request);
        db.AssignmentSlots.Add(slot);
        db.AssignmentOffers.Add(offer);
        db.Engagements.Add(new Engagement
        {
            EngagementId = Guid.NewGuid(),
            OfferId = offer.OfferId,
            TrainerId = trainerId,
            SlotId = slot.SlotId,
            Status = status,
            ConfirmedAt = endedAt.AddMonths(-1),
        });
        await db.SaveChangesAsync();
    }

    private async Task SeedDeliveredProgramAsync(Guid trainerId)
    {
        await using var db = _database.CreateContext();
        db.TrainerRecords.Add(new TrainerRecord
        {
            RecordId = Guid.NewGuid(),
            TrainerId = trainerId,
            ProgramNameAr = "برنامج القيادة",
            ProgramNameEn = "Leadership programme",
            Role = "مدرب",
            DeliveredFrom = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            DeliveredTo = new DateTime(2026, 3, 5, 0, 0, 0, DateTimeKind.Utc),
        });
        await db.SaveChangesAsync();
    }

    private async Task<HttpClient> SignInAsync(string subject, string name, RoleCode? platformRole)
    {
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(
            client, _tokenEndpoint,
            platformRole is null ? "unmapped" : "fa-staff",
            subject: subject, displayName: name);
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
