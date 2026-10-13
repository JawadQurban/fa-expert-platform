using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core.Domain;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// J-04 — speaker records: created and edited from the internal dashboard
/// only, by the trainer-management team, never by a trainer (`BR-0113`,
/// `BR-0412`), searchable by name and title, and carrying neither an email nor
/// a participation history Expert Hub does not actually have.
/// </summary>
public sealed class SpeakerTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;

    public SpeakerTests(WebApplicationFactory<Program> factory) => _factory = factory;

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

    [Fact]
    public async Task Staff_create_edit_and_find_a_speaker_and_every_write_is_audited()
    {
        using var staff = await SignInAsync("speaker-staff", RoleCode.Staff);

        var created = await staff.PostAsJsonAsync("/api/v1/internal/speakers/", new
        {
            title = "  خبير أسواق المال ",
            firstNameAr = "سارة",
            lastNameAr = "العتيبي",
            firstNameEn = "Sarah",
            lastNameEn = "Alotaibi",
            middleNameEn = "   ",
            bio = "متحدثة في ملتقيات الأسواق المالية.",
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var speaker = await created.Content.ReadFromJsonAsync<JsonElement>();
        var id = speaker.GetProperty("speakerId").GetString()!;
        // Trimmed, and a blank part is stored as nothing, not as spaces.
        Assert.Equal("خبير أسواق المال", speaker.GetProperty("title").GetString());
        Assert.Equal(JsonValueKind.Null, speaker.GetProperty("middleNameEn").ValueKind);

        // The email is the FAST profile's and FAST serves no one else's profile
        // yet — so it is absent WITH its reason, never typed in or invented.
        Assert.Equal(JsonValueKind.Null, speaker.GetProperty("email").ValueKind);
        Assert.Equal("fast-profile-unavailable",
            speaker.GetProperty("emailUnavailableReason").GetString());
        // F3 — no speaker-to-event link exists in FAST: unavailable, not empty.
        var history = speaker.GetProperty("history");
        Assert.False(history.GetProperty("available").GetBoolean());
        Assert.Equal("fast-speaker-history-unavailable", history.GetProperty("reason").GetString());

        // F1/AC-5 — every field stays editable.
        var updated = await staff.PostAsJsonAsync($"/api/v1/internal/speakers/{id}", new
        {
            title = "خبيرة أسواق المال",
            firstNameAr = "سارة",
            lastNameAr = "العتيبي",
            firstNameEn = "Sarah",
            lastNameEn = "Alotaibi",
            bio = "نبذة محدثة.",
        });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var detail = await GetAsync(staff, $"/api/v1/internal/speakers/{id}");
        Assert.Equal("نبذة محدثة.", detail.GetProperty("bio").GetString());

        // F2/AC-3 — found by either language's name and by title.
        foreach (var term in new[] { "العتيبي", "Sarah", "خبيرة" })
        {
            var found = await GetAsync(staff, $"/api/v1/internal/speakers/?search={Uri.EscapeDataString(term)}");
            Assert.Equal(1, found.GetProperty("totalCount").GetInt32());
            Assert.Equal("سارة العتيبي",
                found.GetProperty("items")[0].GetProperty("nameAr").GetString());
        }
        var none = await GetAsync(staff, "/api/v1/internal/speakers/?search=nobody");
        Assert.Equal(0, none.GetProperty("totalCount").GetInt32());

        // The shapes the frontend renders (`frontend/src/contracts/fixtures/`).
        ContractFixtures.Verify("internal.speaker-detail", detail);
        ContractFixtures.Verify("internal.speakers",
            await GetAsync(staff, "/api/v1/internal/speakers/"));

        // F2/AC-1 — the speaker is in the trainer base search, as a speaker…
        var all = await GetAsync(staff, "/api/v1/internal/trainers/?search=Sarah");
        Assert.Equal(id, all.GetProperty("speakers").EnumerateArray().Single()
            .GetProperty("speakerId").GetString());
        var onlySpeakers = await GetAsync(staff, "/api/v1/internal/trainers/?service=speaker");
        Assert.Single(onlySpeakers.GetProperty("speakers").EnumerateArray());
        // …and not under a filter only a trainer can meet.
        var activeFiles = await GetAsync(staff, "/api/v1/internal/trainers/?fileStatus=active");
        Assert.Empty(activeFiles.GetProperty("speakers").EnumerateArray());
        var trainersOnly = await GetAsync(staff, "/api/v1/internal/trainers/?service=trainer");
        Assert.Empty(trainersOnly.GetProperty("speakers").EnumerateArray());

        // The trail names what changed, never the values — no personal data.
        await using var db = _database.CreateContext();
        var trail = await db.AuditEntries
            .Where(a => a.EntityType == "speaker_record" && a.EntityId == Guid.Parse(id))
            .OrderBy(a => a.OccurredAt)
            .ToListAsync();
        Assert.Equal(["speaker-created", "speaker-updated"], trail.Select(a => a.Action));
        Assert.Contains("title", trail[1].AfterState!, StringComparison.Ordinal);
        Assert.DoesNotContain("نبذة", trail[1].AfterState!, StringComparison.Ordinal);
    }

    [Fact]
    public async Task The_Arabic_first_and_last_name_are_required_and_lengths_are_enforced()
    {
        using var staff = await SignInAsync("speaker-validate", RoleCode.Staff);

        var noLastName = await staff.PostAsJsonAsync("/api/v1/internal/speakers/", new
        {
            firstNameAr = "سارة",
            lastNameAr = "  ",
        });
        Assert.Equal(HttpStatusCode.BadRequest, noLastName.StatusCode);
        Assert.Contains("lastNameAr-required", await noLastName.Content.ReadAsStringAsync(), StringComparison.Ordinal);

        var tooLong = await staff.PostAsJsonAsync("/api/v1/internal/speakers/", new
        {
            firstNameAr = "سارة",
            lastNameAr = "العتيبي",
            bio = new string('x', 2001),
        });
        Assert.Equal(HttpStatusCode.BadRequest, tooLong.StatusCode);
        Assert.Contains("bio-too-long", await tooLong.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task The_photo_is_an_uploaded_image_and_a_document_is_refused()
    {
        using var staff = await SignInAsync("speaker-photo", RoleCode.Staff);

        // A PDF is not a photo: the upload itself refuses the format.
        var pdf = await UploadAsync(staff, "cv.pdf", "application/pdf");
        Assert.Equal(HttpStatusCode.UnprocessableEntity, pdf.StatusCode);

        var png = await UploadAsync(staff, "photo.png", "image/png");
        Assert.Equal(HttpStatusCode.OK, png.StatusCode);
        var photoId = (await png.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("attachmentId").GetString();

        var created = await staff.PostAsJsonAsync("/api/v1/internal/speakers/", new
        {
            firstNameAr = "سارة",
            lastNameAr = "العتيبي",
            photoAttachmentId = photoId,
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var speaker = await created.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal($"/v1/attachments/{photoId}", speaker.GetProperty("photoUrl").GetString());

        // An id that is not an uploaded image is refused, not stored as a
        // broken photo.
        var unknown = await staff.PostAsJsonAsync("/api/v1/internal/speakers/", new
        {
            firstNameAr = "سارة",
            lastNameAr = "العتيبي",
            photoAttachmentId = Guid.NewGuid().ToString(),
        });
        Assert.Equal(HttpStatusCode.BadRequest, unknown.StatusCode);
    }

    [Fact]
    public async Task A_trainer_can_neither_create_nor_read_speakers()
    {
        // BR-0113 — no path from the trainer portal. F-0105 used to be seeded
        // to the Trainer role under a different label; it is staff-only now.
        using var trainer = await SignInAsync("speaker-trainer", RoleCode.Trainer);

        var create = await trainer.PostAsJsonAsync("/api/v1/internal/speakers/", new
        {
            firstNameAr = "سارة",
            lastNameAr = "العتيبي",
        });
        Assert.True(create.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.Unauthorized,
            $"Expected 401/403, got {(int)create.StatusCode}");
        var list = await trainer.GetAsync("/api/v1/internal/speakers/");
        Assert.True(list.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.Unauthorized,
            $"Expected 401/403, got {(int)list.StatusCode}");

        await using var db = _database.CreateContext();
        Assert.Empty(await db.SpeakerRecords.ToListAsync());
    }

    private async Task<HttpClient> SignInAsync(string subject, RoleCode role)
    {
        var client = TestOidc.CreateClient(_configured!);
        await TestOidc.SignInAsync(
            client, _tokenEndpoint,
            role == RoleCode.Trainer ? "unmapped" : "fa-staff",
            subject: subject, displayName: "مستخدم تجريبي");
        await using var db = _database.CreateContext();
        var user = await db.Users.SingleAsync(u => u.ExternalIdentityId == subject);
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
        return client;
    }

    private static async Task<HttpResponseMessage> UploadAsync(
        HttpClient client, string fileName, string mimeType)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent("speaker-photo"), "purpose");
        var file = new ByteArrayContent([0x89, 0x50, 0x4E, 0x47, 1, 2, 3, 4]);
        file.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
        form.Add(file, "file", fileName);
        return await client.PostAsync("/api/v1/internal/attachments", form);
    }

    private static async Task<JsonElement> GetAsync(HttpClient client, string path)
    {
        var response = await client.GetAsync(path);
        var payload = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 from {path}, got {(int)response.StatusCode}: {payload}");
        return JsonSerializer.Deserialize<JsonElement>(payload);
    }
}
