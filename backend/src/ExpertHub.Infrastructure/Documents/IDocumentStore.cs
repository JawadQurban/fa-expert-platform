using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Infrastructure.Documents;

/// <summary>One stored file's bytes and how to serve them.</summary>
public sealed record DocumentContent(byte[] Bytes, string MimeType, string FileName);

/// <summary>
/// Where an uploaded file lives — `G26`'s seam.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>`G26` asks where documents are stored and how they are served, and it
/// is unanswered.</b> The platform still has to be usable, so this is a PORT
/// with a working default rather than a blocked feature: the answer, when it
/// arrives, is a second implementation and a configuration line.
/// </para>
/// <para>
/// The reversibility is in <see cref="Attachment.StorageRef"/>. Every ref
/// carries its store's prefix — <c>db:</c> today — so a later SharePoint or
/// object-store implementation issues <c>sp:</c> or <c>s3:</c> refs and the
/// files already uploaded keep resolving through this one. Nothing has to be
/// migrated on the day the decision lands, and no ref is ambiguous.
/// </para>
/// </remarks>
public interface IDocumentStore
{
    /// <summary>The prefix this store's refs carry.</summary>
    string Scheme { get; }

    /// <summary>Stores the bytes and returns the ref to put on the attachment.</summary>
    Task<string> PutAsync(
        byte[] content, string fileName, string mimeType, CancellationToken cancellationToken);

    /// <summary>Reads one back. Null when the ref belongs to another store or
    /// the blob is gone — a caller serves 404 rather than an empty file.</summary>
    Task<DocumentContent?> GetAsync(string storageRef, CancellationToken cancellationToken);
}

/// <summary>
/// The default store: the platform's own database.
/// </summary>
/// <remarks>
/// Chosen because it is the only option that needs no infrastructure decision,
/// backs up with the data it belongs to, and cannot leak a file to a location
/// nobody approved. Uploads are capped at a few megabytes by the attachment
/// rules, so the row sizes are ordinary. It is <b>not</b> the answer to `G26`
/// — it is what the product does until `G26` is answered.
/// </remarks>
public sealed class DatabaseDocumentStore : IDocumentStore
{
    private readonly ExpertHubDbContext _db;

    public DatabaseDocumentStore(ExpertHubDbContext db) => _db = db;

    public string Scheme => "db";

    public Task<string> PutAsync(
        byte[] content, string fileName, string mimeType, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(content);
        var blob = new DocumentBlob
        {
            BlobId = Guid.NewGuid(),
            Content = content,
            MimeType = mimeType,
            FileName = fileName,
            StoredAt = DateTime.UtcNow,
        };
        // Staged, not saved: the caller commits the attachment row and its
        // bytes in ONE transaction, so a file never exists without its record
        // and a record never points at bytes that were rolled back.
        _db.DocumentBlobs.Add(blob);
        return Task.FromResult($"db:{blob.BlobId:D}");
    }

    public async Task<DocumentContent?> GetAsync(
        string storageRef, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(storageRef);
        if (!storageRef.StartsWith("db:", StringComparison.Ordinal)
            || !Guid.TryParse(storageRef[3..], out var blobId))
        {
            return null;
        }
        var blob = await _db.DocumentBlobs.AsNoTracking()
            .FirstOrDefaultAsync(b => b.BlobId == blobId, cancellationToken)
            .ConfigureAwait(false);
        return blob is null
            ? null
            : new DocumentContent(blob.Content, blob.MimeType, blob.FileName);
    }
}

/// <summary>
/// Antivirus scanning — `G27`'s seam.
/// </summary>
/// <remarks>
/// ⚠️ <b>No scanner is configured</b> (`G27`), and this deliberately does not
/// pretend otherwise. The default returns
/// <see cref="AttachmentScanStatuses.NotScanned"/>, which is stored on the
/// attachment and is a different thing from <c>clean</c>. A file that was
/// never checked must never be recorded as one that passed.
/// </remarks>
public interface IUploadScanner
{
    Task<string> ScanAsync(byte[] content, CancellationToken cancellationToken);
}

/// <summary>The stand-in until `G27` supplies a scanner.</summary>
public sealed class UnscannedUploadScanner : IUploadScanner
{
    public Task<string> ScanAsync(byte[] content, CancellationToken cancellationToken) =>
        Task.FromResult(AttachmentScanStatuses.NotScanned);
}
