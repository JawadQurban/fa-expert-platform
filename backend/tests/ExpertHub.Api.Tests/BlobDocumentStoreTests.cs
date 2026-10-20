using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using ExpertHub.Infrastructure.Documents;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace ExpertHub.Api.Tests;

/// <summary>
/// `P-370` — uploaded documents in a PRIVATE Azure Blob container, behind the
/// same <see cref="IDocumentStore"/> seam. No Azure account is needed: the
/// SDK's container and blob clients are substituted with in-memory fakes.
/// </summary>
public sealed class BlobDocumentStoreTests
    : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime, IDisposable
{
    /// <summary>The public Azurite shortcut — a well-known, keyless dev value.</summary>
    private const string KeylessConnectionString = "UseDevelopmentStorage=true";

    private readonly WebApplicationFactory<Program> _factory;
    private readonly LocalDbFixture _database = new();
    private readonly TestOidc.FakeTokenEndpoint _tokenEndpoint = new();
    private readonly string _root = Path.Combine(Path.GetTempPath(), "eh-blob-" + Guid.NewGuid().ToString("N"));

    public BlobDocumentStoreTests(WebApplicationFactory<Program> factory) => _factory = factory;

    public Task InitializeAsync() => _database.InitializeAsync();

    public Task DisposeAsync() => _database.DisposeAsync();

    public void Dispose()
    {
        _tokenEndpoint.Dispose();
        if (Directory.Exists(_root))
        {
            Directory.Delete(_root, recursive: true);
        }
    }

    /* ── the store itself ──────────────────────────────────────────────────── */

    [Fact]
    public async Task A_file_round_trips_under_a_generated_name()
    {
        var container = new FakeContainer();
        var store = Store(container);

        var bytes = "%PDF-1.4 a CV"u8.ToArray();
        var reference = await store.PutAsync(bytes, "../../السيرة الذاتية.pdf", "text/html", CancellationToken.None);

        Assert.StartsWith("blob:", reference, StringComparison.Ordinal);
        var name = Assert.Single(container.Blobs.Keys);
        Assert.Equal("blob:" + name, reference);
        Assert.Matches(@"^\d{4}/\d{2}/[0-9a-f]{32}\.pdf$", name);
        Assert.Equal(bytes, (await store.GetAsync(reference, CancellationToken.None))!.Bytes);
    }

    [Fact]
    public async Task A_ref_that_is_not_a_generated_name_or_not_a_blob_reads_nothing()
    {
        var container = new FakeContainer();
        var store = Store(container);

        Assert.Null(await store.GetAsync("blob:../other-container/x.pdf", CancellationToken.None));
        Assert.Null(await store.GetAsync("file:2026/10/" + Guid.NewGuid().ToString("N") + ".pdf", CancellationToken.None));
        Assert.Null(await store.GetAsync("db:" + Guid.NewGuid(), CancellationToken.None));
        Assert.Equal(0, container.Downloads);
        // A well-formed ref whose blob is gone is a 404 for the caller, not an outage.
        Assert.Null(await store.GetAsync("blob:2026/10/" + Guid.NewGuid().ToString("N") + ".pdf", CancellationToken.None));
    }

    [Fact]
    public async Task An_outage_is_a_storage_unavailable_error_that_carries_no_url()
    {
        var store = Store(new FakeContainer { Fail = true });

        var put = await Assert.ThrowsAsync<DocumentStoreUnavailableException>(
            () => store.PutAsync([1, 2, 3], "a.pdf", "application/pdf", CancellationToken.None));
        var get = await Assert.ThrowsAsync<DocumentStoreUnavailableException>(
            () => store.GetAsync("blob:2026/10/" + Guid.NewGuid().ToString("N") + ".pdf", CancellationToken.None));

        foreach (var message in new[] { put.Message, get.Message })
        {
            Assert.DoesNotContain("http", message, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("blob.core", message, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public async Task Readiness_refuses_a_public_container()
    {
        Assert.Null(await Store(new FakeContainer()).ProbeAsync(CancellationToken.None));
        Assert.Contains("public", await Store(new FakeContainer { Access = PublicAccessType.Blob })
            .ProbeAsync(CancellationToken.None), StringComparison.Ordinal);
        Assert.Equal("Blob storage did not answer.",
            await Store(new FakeContainer { Fail = true }).ProbeAsync(CancellationToken.None));
    }

    /* ── startup ───────────────────────────────────────────────────────────── */

    [Theory]
    [InlineData("AzureBlob", "", "rakeeza-container", "Storage__AzureBlob__ConnectionString is empty")]
    [InlineData("AzureBlob", KeylessConnectionString, "", "Storage__AzureBlob__ContainerName is empty")]
    [InlineData("AzureBlob", "not a connection string", "c", "not a valid Azure Storage connection string")]
    [InlineData("S3", "", "", "must be 'Local' or 'AzureBlob'")]
    public void A_misconfigured_blob_provider_stops_startup(
        string provider, string connectionString, string container, string expected)
    {
        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Storage:Provider", provider);
            builder.UseSetting("Storage:AzureBlob:ConnectionString", connectionString);
            builder.UseSetting("Storage:AzureBlob:ContainerName", container);
        });

        var thrown = Assert.ThrowsAny<Exception>(() => factory.CreateClient());
        var messages = string.Join(" | ", Chain(thrown).Select(e => e.Message));
        Assert.Contains(expected, messages, StringComparison.Ordinal);
        // The startup error names the variable, never its value.
        Assert.DoesNotContain("not a connection string", messages, StringComparison.Ordinal);
    }

    /* ── through the API ───────────────────────────────────────────────────── */

    [Fact]
    public async Task After_the_switch_new_uploads_go_to_blobs_and_volume_files_stay_readable()
    {
        // Before the switch: Local, on the volume.
        string onVolumeId;
        var oldBytes = "%PDF-1.4 uploaded before the switch"u8.ToArray();
        using (var local = TestOidc.Configure(_factory, _tokenEndpoint,
            ("ConnectionStrings:ExpertHub", _database.ConnectionString),
            ("Documents:RootPath", _root)))
        {
            using var client = TestOidc.CreateClient(local);
            await TestOidc.SignInAsync(client, _tokenEndpoint, "unmapped", subject: "blob-applicant");
            Assert.Equal(HttpStatusCode.OK,
                (await client.PostAsync("/api/v1/me/applications/draft/start", null)).StatusCode);
            onVolumeId = await UploadAsync(client, oldBytes);
        }
        Assert.StartsWith("file:", await StorageRefAsync(onVolumeId), StringComparison.Ordinal);

        // After: AzureBlob, the same volume still mounted.
        var container = new FakeContainer();
        using var blob = Blob(container, ("Documents:RootPath", _root));
        using var after = TestOidc.CreateClient(blob);
        await TestOidc.SignInAsync(after, _tokenEndpoint, "unmapped", subject: "blob-applicant");

        var newBytes = "%PDF-1.4 uploaded after the switch"u8.ToArray();
        var inBlobId = await UploadAsync(after, newBytes);
        Assert.StartsWith("blob:", await StorageRefAsync(inBlobId), StringComparison.Ordinal);
        Assert.Single(container.Blobs);

        foreach (var (id, bytes) in new[] { (onVolumeId, oldBytes), (inBlobId, newBytes) })
        {
            var download = await after.GetAsync($"/api/v1/attachments/{id}");
            Assert.Equal(HttpStatusCode.OK, download.StatusCode);
            // BUG-001's rules hold whatever the store: type from the row, inline, nosniff.
            Assert.Equal("application/pdf", download.Content.Headers.ContentType?.MediaType);
            Assert.Equal("inline", download.Content.Headers.ContentDisposition?.DispositionType);
            Assert.Equal("nosniff", download.Headers.GetValues("X-Content-Type-Options").Single());
            Assert.Equal(bytes, await download.Content.ReadAsByteArrayAsync());
        }
    }

    [Fact]
    public async Task A_storage_outage_answers_503_without_details()
    {
        var container = new FakeContainer();
        using var blob = Blob(container);
        using var client = TestOidc.CreateClient(blob);
        await TestOidc.SignInAsync(client, _tokenEndpoint, "unmapped", subject: "blob-outage");
        Assert.Equal(HttpStatusCode.OK,
            (await client.PostAsync("/api/v1/me/applications/draft/start", null)).StatusCode);
        var id = await UploadAsync(client, "%PDF-1.4 x"u8.ToArray());

        container.Fail = true;
        var download = await client.GetAsync($"/api/v1/attachments/{id}");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, download.StatusCode);
        var body = await download.Content.ReadAsStringAsync();
        Assert.Contains("storage-unavailable", body, StringComparison.Ordinal);
        Assert.DoesNotContain("RequestFailed", body, StringComparison.Ordinal);
        Assert.DoesNotContain("blob.core", body, StringComparison.OrdinalIgnoreCase);

        using var form = PdfForm("%PDF-1.4 y"u8.ToArray());
        Assert.Equal(HttpStatusCode.ServiceUnavailable,
            (await client.PostAsync("/api/v1/me/applications/draft/attachments", form)).StatusCode);
    }

    /* ── helpers ───────────────────────────────────────────────────────────── */

    private WebApplicationFactory<Program> Blob(FakeContainer container, params (string Key, string Value)[] extra) =>
        TestOidc.Configure(_factory, _tokenEndpoint,
            [
                ("ConnectionStrings:ExpertHub", _database.ConnectionString),
                ("Storage:Provider", "AzureBlob"),
                ("Storage:AzureBlob:ConnectionString", KeylessConnectionString),
                ("Storage:AzureBlob:ContainerName", "test-container"),
                .. extra,
            ])
            .WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
                services.AddSingleton(Store(container))));

    private static AzureBlobDocumentStore Store(FakeContainer container) =>
        new(container, NullLogger<AzureBlobDocumentStore>.Instance);

    private static MultipartFormDataContent PdfForm(byte[] bytes)
    {
        var form = new MultipartFormDataContent();
        // Up to 20 files, so one draft takes several uploads.
        form.Add(new StringContent("client-referrals"), "ruleId");
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        form.Add(file, "file", "cv.pdf");
        return form;
    }

    private static async Task<string> UploadAsync(HttpClient client, byte[] bytes)
    {
        using var form = PdfForm(bytes);
        var uploaded = await client.PostAsync("/api/v1/me/applications/draft/attachments", form);
        Assert.True(uploaded.StatusCode == HttpStatusCode.OK, await uploaded.Content.ReadAsStringAsync());
        return (await uploaded.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    private async Task<string> StorageRefAsync(string attachmentId)
    {
        await using var db = _database.CreateContext();
        return (await db.Attachments.SingleAsync(a => a.AttachmentId == Guid.Parse(attachmentId))).StorageRef;
    }

    private static IEnumerable<Exception> Chain(Exception exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            yield return current;
            if (current is AggregateException aggregate)
            {
                foreach (var inner in aggregate.InnerExceptions.SelectMany(Chain))
                {
                    yield return inner;
                }
            }
        }
    }

    /// <summary>An in-memory container: what the SDK would do, minus the network.</summary>
    private sealed class FakeContainer : BlobContainerClient
    {
        public Dictionary<string, byte[]> Blobs { get; } = [];

        public bool Fail { get; set; }

        public PublicAccessType Access { get; init; } = PublicAccessType.None;

        public int Downloads { get; set; }

        public override BlobClient GetBlobClient(string blobName) => new FakeBlob(this, blobName);

        public override Task<Response<BlobContainerProperties>> GetPropertiesAsync(
            BlobRequestConditions? conditions = null, CancellationToken cancellationToken = default)
        {
            ThrowIfFailing();
            return Task.FromResult(Response.FromValue(
                BlobsModelFactory.BlobContainerProperties(DateTimeOffset.UtcNow, new ETag("e"), publicAccess: Access),
                null!));
        }

        public void ThrowIfFailing()
        {
            if (Fail)
            {
                throw new RequestFailedException(500, "https://account.blob.core.windows.net/c?sig=secret failed");
            }
        }
    }

    private sealed class FakeBlob(FakeContainer container, string name) : BlobClient
    {
        public override string Name => name;

        public override Task<Response<BlobContentInfo>> UploadAsync(
            BinaryData content, bool overwrite = false, CancellationToken cancellationToken = default)
        {
            container.ThrowIfFailing();
            if (!overwrite && container.Blobs.ContainsKey(name))
            {
                throw new RequestFailedException(409, "BlobAlreadyExists");
            }
            container.Blobs[name] = content.ToArray();
            return Task.FromResult(Response.FromValue<BlobContentInfo>(null!, null!));
        }

        public override Task<Response<BlobDownloadResult>> DownloadContentAsync(CancellationToken cancellationToken = default)
        {
            container.ThrowIfFailing();
            container.Downloads++;
            return container.Blobs.TryGetValue(name, out var bytes)
                ? Task.FromResult(Response.FromValue(
                    BlobsModelFactory.BlobDownloadResult(new BinaryData(bytes)), null!))
                : throw new RequestFailedException(404, "BlobNotFound");
        }
    }
}
