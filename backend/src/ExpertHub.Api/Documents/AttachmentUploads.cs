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
    };

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
                form.Files.GetFile("file"), DocumentFormats, DocumentMaxSizeMb, actor.UserId, db, store, scanner, ct);
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

    /// <summary>An uploaded attachment by id, or null.</summary>
    internal static async Task<Attachment?> FindAsync(ExpertHubDbContext db, string? attachmentId, CancellationToken ct) =>
        Guid.TryParse(attachmentId, out var id)
            ? await db.Attachments.FirstOrDefaultAsync(a => a.AttachmentId == id, ct)
            : null;
}
