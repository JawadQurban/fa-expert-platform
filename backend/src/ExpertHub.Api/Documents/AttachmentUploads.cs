using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Documents;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Documents;

internal sealed record UploadedAttachmentWire(
    string AttachmentId, string FileName, long SizeBytes, string DownloadUrl, string? ScanStatus);

/// <summary>
/// One way to store an uploaded document — the SAME store, scanner and
/// `ATTACHMENT` record the application form already uses. No second storage
/// subsystem exists or is added.
/// </summary>
/// <remarks>
/// ⚠️ `G27` — the scanner records <c>not-scanned</c>, and that is what is kept:
/// an unchecked file is never labelled clean.
/// </remarks>
internal static class AttachmentUploads
{
    /// <summary>
    /// J-01's APPROVED document rule (PDF/DOC/DOCX, 1 MB). The matrices name the
    /// J-16 brochure and the J-03 addendum as «ارفاق ملف» without formats or
    /// sizes, so — exactly as the application form's own documents do — the
    /// approved rule is reused rather than a new one invented.
    /// </summary>
    internal static readonly string[] DocumentFormats = ["pdf", "doc", "docx"];

    internal const int DocumentMaxSizeMb = 1;

    /// <summary>What an internal upload is for — each gated by its own feature.</summary>
    internal static readonly IReadOnlyDictionary<string, string> PurposeFeatures = new Dictionary<string, string>
    {
        ["assignment-brochure"] = "F-0501",
        ["service-addendum"] = "F-0305",
        // `P-333` — the trainer's own agreement file, uploaded at J-10 preparation.
        ["agreement-document"] = "F-0301",
        // J-04 — the speaker's personal photo (matrix row 1).
        [SpeakerPhotoPurpose] = "F-0105",
    };

    internal const string SpeakerPhotoPurpose = "speaker-photo";

    /// <summary>J-01's approved photo rule (`photo`: JPG/JPEG/PNG, 1 MB), reused
    /// for the speaker's photo rather than a new rule invented.</summary>
    internal static readonly string[] PhotoFormats = ["jpg", "jpeg", "png"];

    internal static string DownloadUrl(Guid attachmentId) =>
        $"/{ExpertHub.Core.ApiVersions.V1}/attachments/{attachmentId:D}";

    /// <summary>Validates and stores one file; the attachment is STAGED on the context.</summary>
    internal static async Task<(Attachment? Attachment, IResult? Problem)> StoreAsync(
        IFormFile? file,
        IReadOnlyCollection<string> acceptedFormats,
        int maxSizeMb,
        Guid uploadedBy,
        ExpertHubDbContext db,
        IDocumentStore store,
        IUploadScanner scanner,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            return (null, Results.Problem(statusCode: 400, detail: "file-required"));
        }
        var extension = Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant();
        if (!acceptedFormats.Contains(extension))
        {
            return (null, Results.Problem(
                statusCode: 422,
                detail: $"'{extension}' is not an accepted format for this document.",
                extensions: new Dictionary<string, object?> { ["reason"] = "format" }));
        }
        if (file.Length > (long)maxSizeMb * 1024 * 1024)
        {
            return (null, Results.Problem(
                statusCode: 422,
                detail: $"The file is larger than {maxSizeMb} MB.",
                extensions: new Dictionary<string, object?> { ["reason"] = "size" }));
        }
        byte[] content;
        using (var buffer = new MemoryStream())
        {
            await file.CopyToAsync(buffer, ct);
            content = buffer.ToArray();
        }
        if (!ContentMatches(extension, content))
        {
            // A renamed executable is not a PDF because its name says so.
            return (null, Results.Problem(
                statusCode: 422,
                detail: $"The file's content is not a valid '{extension}' file.",
                extensions: new Dictionary<string, object?> { ["reason"] = "format" }));
        }
        var attachment = new Attachment
        {
            AttachmentId = Guid.NewGuid(),
            FileName = Path.GetFileName(file.FileName),
            MimeType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            SizeBytes = file.Length,
            StorageRef = await store.PutAsync(content, file.FileName, file.ContentType, ct),
            Checksum = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(content)),
            ScanStatus = await scanner.ScanAsync(content, ct),
            UploadedBy = uploadedBy,
            UploadedAt = DateTime.UtcNow,
        };
        db.Attachments.Add(attachment);
        return (attachment, null);
    }

    /// <summary>
    /// The file's own signature agrees with its extension — the bytes, not the
    /// name, decide what a file is. Formats without a fixed signature pass.
    /// </summary>
    internal static bool ContentMatches(string extension, ReadOnlySpan<byte> content) => extension switch
    {
        "pdf" => content.StartsWith("%PDF-"u8),
        "png" => content.StartsWith((ReadOnlySpan<byte>)[0x89, 0x50, 0x4E, 0x47]),
        "jpg" or "jpeg" => content.StartsWith((ReadOnlySpan<byte>)[0xFF, 0xD8, 0xFF]),
        // DOCX is a ZIP package; DOC is an OLE compound file.
        "docx" => content.StartsWith((ReadOnlySpan<byte>)[0x50, 0x4B, 0x03, 0x04]),
        "doc" => content.StartsWith((ReadOnlySpan<byte>)[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]),
        _ => true,
    };

    internal static RouteGroupBuilder MapAttachmentUploadEndpoints(this RouteGroupBuilder v1)
    {
        // J-16 brochure / J-03 addendum — uploaded first, then referenced by id
        // on the request or the decision, so the record holds the document
        // itself rather than a file name.
        v1.MapPost("/internal/attachments", async (
            HttpRequest request,
            HttpContext http,
            ExpertHubDbContext db,
            IDocumentStore store,
            IUploadScanner scanner,
            CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
            {
                return Results.Problem(statusCode: 415, detail: "Expected a multipart upload.");
            }
            var form = await request.ReadFormAsync(ct);
            var purpose = form["purpose"].ToString();
            if (!PurposeFeatures.TryGetValue(purpose, out var feature))
            {
                return Results.Problem(statusCode: 400, detail: "purpose-invalid");
            }
            var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
            if (!await FeatureAuthorization.HasFeatureAsync(db, actor.UserId, feature, ct))
            {
                return Results.Problem(statusCode: 403, detail: "Not permitted.");
            }
            var (attachment, problem) = await StoreAsync(
                form.Files.GetFile("file"),
                purpose == SpeakerPhotoPurpose ? PhotoFormats : DocumentFormats,
                DocumentMaxSizeMb, actor.UserId, db, store, scanner, ct);
            if (problem is not null)
            {
                return problem;
            }
            await db.SaveChangesAsync(ct);
            return Results.Ok(new UploadedAttachmentWire(
                attachment!.AttachmentId.ToString(),
                attachment.FileName,
                attachment.SizeBytes,
                DownloadUrl(attachment.AttachmentId),
                attachment.ScanStatus));
        })
            .RequireAuthorization(AuthenticationSetup.InternalPolicy)
            .DisableAntiforgery()
            .WithName("UploadInternalAttachment");
        return v1;
    }

    /// <summary>The types a browser can show in a tab — everything else downloads.</summary>
    private static readonly Dictionary<string, string> PreviewableTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["pdf"] = "application/pdf",
        ["png"] = "image/png",
        ["jpg"] = "image/jpeg",
        ["jpeg"] = "image/jpeg",
    };

    /// <summary>
    /// Serves a stored file so a browser can PREVIEW it — BUG-001.
    /// </summary>
    /// <remarks>
    /// <para>
    /// ⚠️ The type comes from the validated extension on the ATTACHMENT row,
    /// never from the store and never from the uploader. The disk store keeps
    /// bytes only and answered <c>application/octet-stream</c>, and every file
    /// was also sent as <c>attachment</c> — so on the server, where the disk
    /// store is configured, no CV, screening document or agreement file could
    /// be previewed; each one became an anonymous download. The uploader's own
    /// content type is not trusted either: a «.pdf» declared <c>text/html</c>
    /// would otherwise render as a page on the API's origin.
    /// </para>
    /// <para>
    /// PDF and images open inline; Word files download. <c>nosniff</c> and a
    /// sandbox CSP keep an inline file from ever running as a document.
    /// </para>
    /// </remarks>
    internal static IResult Serve(HttpContext http, Attachment attachment, DocumentContent content)
    {
        var extension = Path.GetExtension(attachment.FileName).TrimStart('.');
        var headers = http.Response.Headers;
        headers.XContentTypeOptions = "nosniff";
        headers.ContentSecurityPolicy = "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'";
        if (PreviewableTypes.TryGetValue(extension, out var previewType))
        {
            var disposition = new Microsoft.Net.Http.Headers.ContentDispositionHeaderValue("inline");
            // `filename*` too: an Arabic name survives as itself.
            disposition.SetHttpFileName(attachment.FileName);
            headers.ContentDisposition = disposition.ToString();
            return Results.File(content.Bytes, previewType);
        }
        return Results.File(content.Bytes, "application/octet-stream", attachment.FileName);
    }

    /// <summary>An uploaded attachment by id, or null.</summary>
    internal static async Task<Attachment?> FindAsync(ExpertHubDbContext db, string? attachmentId, CancellationToken ct) =>
        Guid.TryParse(attachmentId, out var id)
            ? await db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == id, ct)
            : null;
}
