using ExpertHub.Infrastructure.Documents;
using Microsoft.Extensions.Configuration;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The document store the owner ruled for on 2026-09-03 — files on the
/// server's disk until the CDN is configured.
/// </summary>
public sealed class DocumentStoreTests : IDisposable
{
    private readonly string _root = Path.Combine(
        Path.GetTempPath(), "expert-hub-docs-" + Guid.NewGuid().ToString("N"));

    public void Dispose()
    {
        if (Directory.Exists(_root))
        {
            Directory.Delete(_root, recursive: true);
        }
    }

    [Fact]
    public async Task A_file_round_trips_through_the_server_disk()
    {
        var store = Build(_root);
        Assert.True(store.IsConfigured);

        var bytes = "the technical evaluation form"u8.ToArray();
        var reference = await store.PutAsync(
            bytes, "نموذج التقييم الفني V0.2.pdf", "application/pdf", CancellationToken.None);

        // The scheme is what makes changing stores a config change later.
        Assert.StartsWith("file:", reference, StringComparison.Ordinal);
        var content = await store.GetAsync(reference, CancellationToken.None);
        Assert.NotNull(content);
        Assert.Equal(bytes, content!.Bytes);
    }

    [Fact]
    public async Task The_uploaded_name_never_becomes_the_path()
    {
        var store = Build(_root);

        // An Arabic name with spaces — the case that failed on the server —
        // and a traversal attempt, which is what a filename is capable of.
        foreach (var name in new[]
        {
            "نموذج التقييم الفني لمنافسة ___4639__V0.2.pdf",
            "../../etc/passwd",
            "cv.pdf.exe",
        })
        {
            var reference = await store.PutAsync(
                [1, 2, 3], name, "application/pdf", CancellationToken.None);
            var relative = reference[5..];
            Assert.DoesNotContain("..", relative, StringComparison.Ordinal);
            // The stored name is a fresh id, so nothing a person types can
            // decide where the bytes land.
            Assert.DoesNotContain(" ", relative, StringComparison.Ordinal);
            Assert.NotNull(await store.GetAsync(reference, CancellationToken.None));
        }
    }

    [Fact]
    public async Task A_ref_that_points_outside_the_root_reads_nothing()
    {
        var store = Build(_root);
        // Refs come back out of the database, and data does not get to escape.
        Assert.Null(await store.GetAsync("file:../../../etc/passwd", CancellationToken.None));
        // Another store's ref is not this store's business.
        Assert.Null(await store.GetAsync("db:" + Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public void With_no_root_configured_the_disk_store_stands_aside()
    {
        // Which is what keeps the database default working out of the box.
        Assert.False(Build(string.Empty).IsConfigured);
    }

    private static FileSystemDocumentStore Build(string root) =>
        new(new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Documents:RootPath"] = root })
            .Build());
}
