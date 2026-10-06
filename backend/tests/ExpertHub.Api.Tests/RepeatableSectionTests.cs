using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ExpertHub.Core.Domain;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The repeatable sections of `dm-gap-01.2026-09-21` — an applicant may enter
/// several qualifications, certificates and past roles (PM-confirmed
/// 2026-09-18), and every one of them must survive the draft, the submission
/// and the approval into the trainer's profile.
/// </summary>
/// <remarks>
/// The rule that matters most here is the one that is easiest to break
/// silently: an application written BEFORE entries existed carries no entry id
/// at all, and must keep reading as exactly ONE entry forever. Nothing
/// backfills it, and no historical row is rewritten.
/// </remarks>
public sealed class RepeatableSectionTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();

    private WebApplicationFactory<Program>? _configured;
    private HttpClient _client = null!;
    private Guid _draftId;

    public RepeatableSectionTests(WebApplicationFactory<Program> factory) => _factory = factory;

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

    /* ── the schema declares them ──────────────────────────────────────────── */

    [Fact]
    public async Task The_schema_says_which_sections_repeat_and_which_files_belong_to_an_entry()
    {
        var schema = await (await _client.GetAsync("/api/v1/applications/schema"))
            .Content.ReadFromJsonAsync<JsonElement>();

        var repeatable = schema.GetProperty("sections").EnumerateArray()
            .Where(s => s.TryGetProperty("repeatable", out _))
            .ToDictionary(s => s.GetProperty("id").GetString()!, s => s.GetProperty("repeatable"));
        Assert.Equal(["certifications", "education", "experience"], repeatable.Keys.Order());

        // At least one qualification and one past role; zero certificates is a
        // valid answer — «the entire section is Optional for all 4 services».
        Assert.Equal(1, repeatable["education"].GetProperty("minEntries").GetInt32());
        Assert.Equal(1, repeatable["experience"].GetProperty("minEntries").GetInt32());
        Assert.Equal(0, repeatable["certifications"].GetProperty("minEntries").GetInt32());
        // No maximum is declared anywhere — none is approved.
        Assert.All(repeatable.Values, r => Assert.False(r.TryGetProperty("maxEntries", out _)));

        // A qualification certificate belongs to ITS qualification.
        var perEntry = schema.GetProperty("attachments").EnumerateArray()
            .Where(a => a.TryGetProperty("perEntryOf", out _))
            .ToDictionary(
                a => a.GetProperty("id").GetString()!,
                a => a.GetProperty("perEntryOf").GetString());
        Assert.Equal("education", perEntry["qualification-certificate"]);
        Assert.Equal("certifications", perEntry["professional-certificate"]);

        // Criterion #5 counts the FILES on this one, so it must accept several.
        var referrals = schema.GetProperty("attachments").EnumerateArray()
            .Single(a => a.GetProperty("id").GetString() == "client-referrals");
        Assert.True(referrals.GetProperty("maxCount").GetInt32() >= 8);
    }

    /* ── add, reload, edit, remove ─────────────────────────────────────────── */

    [Fact]
    public async Task Several_qualifications_survive_a_save_and_a_reload()
    {
        await SignInAsync();
        await StartDraftAsync();

        var saved = await SaveDraftAsync(Education(
            ("edu-1", "bachelor", "جامعة الملك سعود"),
            ("edu-2", "master", "جامعة الملك عبدالعزيز"),
            ("edu-3", "doctorate", "جامعة الملك فهد")));

        var entries = saved.GetProperty("entries").GetProperty("education").EnumerateArray().ToArray();
        Assert.Equal(3, entries.Length);
        Assert.Equal(
            ["edu-1", "edu-2", "edu-3"],
            entries.Select(e => e.GetProperty("entryId").GetString()));
        Assert.Equal(
            ["bachelor", "master", "doctorate"],
            entries.Select(e => e.GetProperty("values").GetProperty("qualificationType").GetString()));

        // Reloading the draft is the same read the page performs on return.
        var resumed = await StartDraftAsync();
        Assert.True(resumed.GetProperty("resumed").GetBoolean());
        Assert.Equal(3, resumed.GetProperty("draft").GetProperty("entries")
            .GetProperty("education").GetArrayLength());
    }

    [Fact]
    public async Task Editing_one_qualification_leaves_the_others_alone()
    {
        await SignInAsync();
        await StartDraftAsync();
        await SaveDraftAsync(Education(
            ("edu-1", "bachelor", "جامعة الملك سعود"),
            ("edu-2", "master", "جامعة الملك عبدالعزيز")));

        var edited = await SaveDraftAsync(Education(
            ("edu-1", "bachelor", "جامعة الملك سعود"),
            ("edu-2", "doctorate", "جامعة الملك عبدالعزيز")));

        var entries = edited.GetProperty("entries").GetProperty("education").EnumerateArray().ToArray();
        Assert.Equal(2, entries.Length);
        Assert.Equal("bachelor", entries[0].GetProperty("values").GetProperty("qualificationType").GetString());
        Assert.Equal("doctorate", entries[1].GetProperty("values").GetProperty("qualificationType").GetString());
    }

    [Fact]
    public async Task Removing_the_middle_qualification_keeps_the_survivors_and_their_ids()
    {
        await SignInAsync();
        await StartDraftAsync();
        await SaveDraftAsync(Education(
            ("edu-1", "bachelor", "جامعة الملك سعود"),
            ("edu-2", "master", "جامعة الملك عبدالعزيز"),
            ("edu-3", "doctorate", "جامعة الملك فهد")));

        var afterRemoval = await SaveDraftAsync(Education(
            ("edu-1", "bachelor", "جامعة الملك سعود"),
            ("edu-3", "doctorate", "جامعة الملك فهد")));

        var entries = afterRemoval.GetProperty("entries").GetProperty("education").EnumerateArray().ToArray();
        Assert.Equal(2, entries.Length);
        // The ids follow the entries, not the positions — `edu-3` is still
        // `edu-3` even though it moved from index 2 to index 1.
        Assert.Equal(["edu-1", "edu-3"], entries.Select(e => e.GetProperty("entryId").GetString()));
        Assert.Equal(
            ["bachelor", "doctorate"],
            entries.Select(e => e.GetProperty("values").GetProperty("qualificationType").GetString()));
    }

    [Fact]
    public async Task A_section_the_schema_does_not_repeat_refuses_entries()
    {
        await SignInAsync();
        await StartDraftAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/me/applications/draft", new
        {
            services = new[] { "trainer" },
            values = new Dictionary<string, object?>(),
            entries = new Dictionary<string, object?>
            {
                // Basic information holds one person, not a list of them.
                ["personal"] = new[]
                {
                    new { entryId = "p-1", values = new Dictionary<string, object?> { ["firstNameAr"] = "سارة" } },
                },
            },
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /* ── history ───────────────────────────────────────────────────────────── */

    [Fact]
    public async Task An_application_written_before_entries_reads_as_exactly_one()
    {
        await SignInAsync();
        var draftId = (await StartDraftAsync()).GetProperty("draft").GetProperty("id").GetString()!;

        // The historical shape, written straight to the table: a value row with
        // NO entry id, exactly as every row saved before this version.
        await using (var db = _database.CreateContext())
        {
            db.ApplicationFieldValues.Add(new ApplicationFieldValue
            {
                ValueId = Guid.NewGuid(),
                ApplicationId = Guid.Parse(draftId),
                FieldCode = "qualificationType",
                Value = "\"master\"",
            });
            await db.SaveChangesAsync();
        }

        var resumed = (await StartDraftAsync()).GetProperty("draft");

        // It reads as ONE entry, and the flat map still answers for it, so a
        // page that never learned about entries keeps working.
        var education = resumed.GetProperty("entries").GetProperty("education").EnumerateArray().ToArray();
        Assert.Single(education);
        Assert.Equal(JsonValueKind.Null, education[0].GetProperty("entryId").ValueKind);
        Assert.Equal("master", education[0].GetProperty("values").GetProperty("qualificationType").GetString());
        Assert.Equal("master", resumed.GetProperty("values").GetProperty("qualificationType").GetString());

        // And nothing backfilled the row.
        await using (var db = _database.CreateContext())
        {
            var row = await db.ApplicationFieldValues.AsNoTracking()
                .SingleAsync(v => v.ApplicationId == Guid.Parse(draftId)
                    && v.FieldCode == "qualificationType");
            Assert.Null(row.EntryId);
            Assert.Equal(0, row.EntryIndex);
        }
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    private static Dictionary<string, object?> Education(params (string Id, string Type, string University)[] entries) =>
        new Dictionary<string, object?>
        {
            ["education"] = entries.Select(e => new
            {
                entryId = e.Id,
                values = new Dictionary<string, object?>
                {
                    ["qualificationType"] = e.Type,
                    ["universityName"] = e.University,
                },
            }).ToArray(),
        };

    private Task<JsonElement> SignInAsync() =>
        TestOidc.SignInAsync(_client, _tokenEndpoint, "unmapped");

    private async Task<JsonElement> StartDraftAsync()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/v1/me/applications/draft/start", new { });
        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        if (payload.TryGetProperty("draft", out var draft) && draft.ValueKind == JsonValueKind.Object)
        {
            _draftId = Guid.Parse(draft.GetProperty("id").GetString()!);
        }
        return payload;
    }

    /// <summary>
    /// Every field of the published schema, answered with its first option,
    /// plus one file per attachment rule — the same shape `Cap02Tests` uses.
    /// `BR-0105` refuses an incomplete submission, so without this the test
    /// after it never runs.
    /// </summary>
    private async Task<Dictionary<string, object?>> EveryFieldAnsweredAsync()
    {
        var schema = await (await _client.GetAsync("/api/v1/applications/schema"))
            .Content.ReadFromJsonAsync<JsonElement>();
        var values = new Dictionary<string, object?>();
        foreach (var field in schema.GetProperty("fields").EnumerateArray())
        {
            var id = field.GetProperty("id").GetString()!;
            var type = field.GetProperty("type").GetString();
            var patterned = field.TryGetProperty("validation", out var validation)
                && validation.TryGetProperty("pattern", out _);
            values[id] = type switch
            {
                "checkbox" => true,
                "date" => "2020-01-15",
                "number" => "8",
                "select" => field.GetProperty("options")[0].GetProperty("value").GetString(),
                "multi-select" => new[] { field.GetProperty("options")[0].GetProperty("value").GetString() },
                _ when patterned => id == "idNumber" ? "1012345678" : "https://example.com/a",
                _ => "قيمة تجريبية",
            };
        }
        await using var db = _database.CreateContext();
        foreach (var rule in await db.AttachmentRules
            .Where(r => r.SchemaVersion == FormSchemaVersions.Current)
            .ToListAsync())
        {
            db.ApplicationAttachments.Add(new ApplicationAttachment
            {
                ApplicationAttachmentId = Guid.NewGuid(),
                ApplicationId = _draftId,
                RuleCode = rule.RuleCode,
                FileName = $"{rule.RuleCode}.pdf",
                SizeBytes = 100_000,
            });
        }
        await db.SaveChangesAsync();
        return values;
    }

    private async Task<JsonElement> SaveDraftAsync(object entries)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/me/applications/draft", new
        {
            services = new[] { "trainer" },
            values = new Dictionary<string, object?>(),
            entries,
        });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }
}
