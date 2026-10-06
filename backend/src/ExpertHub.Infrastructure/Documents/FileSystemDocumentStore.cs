using System.Globalization;
using Microsoft.Extensions.Configuration;

namespace ExpertHub.Infrastructure.Documents;

/// <summary>
/// Documents on the server's own disk — the owner's ruling of 2026-09-03:
/// «we can save document now on the server till we finalize the CDN
/// configuration».
/// </summary>
/// <remarks>
/// <para>
/// Selected by configuration: set <c>Documents:RootPath</c> and this store
/// takes over from <see cref="DatabaseDocumentStore"/>. Both stay registered,
/// because refs already issued keep their scheme — a <c>db:</c> ref written
/// before the switch still resolves after it, and a <c>file:</c> ref will
/// still resolve once the CDN store exists. Nothing is migrated on a switch.
/// </para>
/// <para>
/// ⚠️ <b>The path is never built from the uploaded name.</b> A file arrives
/// from outside the Academy and its name is attacker-controlled: it can carry
/// <c>..</c>, an absolute root, a device name, or 300 characters of Arabic
/// that a filesystem will truncate differently from the database. So the
/// stored name is a fresh GUID plus the validated extension, sharded by date;
/// the name a person typed lives in <c>ATTACHMENT.file_name</c>, which is
/// what the download serves it back as.
/// </para>
/// <para>
/// ⚠️ <b>The root must be a mounted volume in a container.</b> Written into
/// the image's own filesystem, every uploaded document disappears on the next
/// deployment — see <c>deploy/docker-compose.yml</c>.
/// </para>
/// </remarks>
public sealed class FileSystemDocumentStore : IDocumentStore
{
    private readonly string _root;

    public FileSystemDocumentStore(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _root = configuration["Documents:RootPath"] ?? string.Empty;
    }

    public string Scheme => "file";

    /// <summary>Whether a root is configured at all — the switch itself.</summary>
    public bool IsConfigured => !string.IsNullOrWhiteSpace(_root);

    public async Task<string> PutAsync(
        byte[] content, string fileName, string mimeType, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(content);
        // `yyyy/MM` keeps a directory from growing to a million entries, which
        // is where filesystems get slow and backups get awkward.
        var folder = DateTime.UtcNow.ToString("yyyy'/'MM", CultureInfo.InvariantCulture);
        var extension = SafeExtension(fileName);
        var relative = string.Create(
            CultureInfo.InvariantCulture, $"{folder}/{Guid.NewGuid():N}{extension}");

        var absolute = Path.Combine(_root, relative.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(absolute)!);
        await File.WriteAllBytesAsync(absolute, content, cancellationToken).ConfigureAwait(false);
        return $"file:{relative}";
    }

    public async Task<DocumentContent?> GetAsync(
        string storageRef, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(storageRef);
        if (!storageRef.StartsWith("file:", StringComparison.Ordinal))
        {
            return null;
        }
        var relative = storageRef[5..];
        var absolute = Path.GetFullPath(
            Path.Combine(_root, relative.Replace('/', Path.DirectorySeparatorChar)));

        // Belt and braces: even though this store writes every ref itself, a
        // ref read back from the database is data, and data does not get to
        // point outside the root.
        var rootFull = Path.GetFullPath(_root);
        if (!absolute.StartsWith(rootFull, StringComparison.Ordinal) || !File.Exists(absolute))
        {
            return null;
        }
        var bytes = await File.ReadAllBytesAsync(absolute, cancellationToken).ConfigureAwait(false);
        // The mime type and the display name live on the ATTACHMENT row; the
        // disk holds bytes and nothing else.
        return new DocumentContent(bytes, "application/octet-stream", Path.GetFileName(absolute));
    }

    /// <summary>
    /// The extension, only if it is plainly safe. Anything else stores with
    /// none — the bytes are still served under the recorded display name, and
    /// a filename is not a place to take chances.
    /// </summary>
    private static string SafeExtension(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        if (extension.Length is < 2 or > 12)
        {
            return string.Empty;
        }
        return extension[1..].All(char.IsAsciiLetterOrDigit)
            ? extension.ToLowerInvariant()
            : string.Empty;
    }
}

/// <summary>
/// Picks the store a deployment is configured for, and reads through every
/// store so a ref written by an earlier one still resolves.
/// </summary>
/// <remarks>
/// This is what makes changing stores a configuration change rather than a
/// migration: writes go to the configured store, reads try each store until
/// one recognises the ref's scheme.
/// </remarks>
public sealed class DocumentStoreRouter : IDocumentStore
{
    private readonly FileSystemDocumentStore _files;
    private readonly DatabaseDocumentStore _database;

    public DocumentStoreRouter(FileSystemDocumentStore files, DatabaseDocumentStore database)
    {
        _files = files;
        _database = database;
    }

    private IDocumentStore Write => _files.IsConfigured ? _files : (IDocumentStore)_database;

    public string Scheme => Write.Scheme;

    public Task<string> PutAsync(
        byte[] content, string fileName, string mimeType, CancellationToken cancellationToken) =>
        Write.PutAsync(content, fileName, mimeType, cancellationToken);

    public async Task<DocumentContent?> GetAsync(
        string storageRef, CancellationToken cancellationToken) =>
        await _files.GetAsync(storageRef, cancellationToken).ConfigureAwait(false)
        ?? await _database.GetAsync(storageRef, cancellationToken).ConfigureAwait(false);
}
