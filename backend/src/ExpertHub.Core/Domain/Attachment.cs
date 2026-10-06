namespace ExpertHub.Core.Domain;

/// <summary>
/// Every document in the product is one <c>ATTACHMENT</c> (`10` §3.1).
/// </summary>
/// <remarks>
/// Two columns are shaped but not final: <see cref="StorageRef"/> waits on the
/// storage mechanism decision (`G26`) and <see cref="ScanStatus"/> on the
/// antivirus decision (`G27`) — which is why neither carries a value list here.
/// </remarks>
public sealed class Attachment
{
    public Guid AttachmentId { get; set; }

    public required string FileName { get; set; }

    public required string MimeType { get; set; }

    public long SizeBytes { get; set; }

    /// <summary>Where the bytes live. `G26` — the mechanism is unresolved; this is its handle.</summary>
    public required string StorageRef { get; set; }

    public string? Checksum { get; set; }

    /// <summary>`G27` — antivirus is unresolved, so no value list is invented for this.</summary>
    public string? ScanStatus { get; set; }

    public Guid UploadedBy { get; set; }

    public DateTime UploadedAt { get; set; }
}

/// <summary>
/// `ATTACHMENT.scan_status` — `G27`'s states. <c>not-scanned</c> is not a
/// synonym for <c>clean</c>: no scanner is configured yet, and a file nobody
/// checked must say so.
/// </summary>
public static class AttachmentScanStatuses
{
    public const string NotScanned = "not-scanned";
    public const string Clean = "clean";
    public const string Infected = "infected";
}

/// <summary>
/// The bytes behind an attachment, when the database is the document store.
/// </summary>
/// <remarks>
/// Separate from <see cref="Attachment"/> on purpose: the metadata is read on
/// every list and detail screen, and the content is read only when somebody
/// opens the file. Keeping them apart stops a megabyte riding along with
/// every inbox query. ⚠️ This table exists because `G26` is unanswered — see
/// <c>IDocumentStore</c>; a ref that starts with another scheme belongs to a
/// store that replaced it.
/// </remarks>
public sealed class DocumentBlob
{
    public Guid BlobId { get; set; }

    public required byte[] Content { get; set; }

    public required string MimeType { get; set; }

    public required string FileName { get; set; }

    public DateTime StoredAt { get; set; }
}
