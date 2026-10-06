using System.Text.Json;
using ExpertHub.Core.Domain;

namespace ExpertHub.Api.Tests;

/// <summary>Stored documents for tests — through the real upload endpoint, or
/// seeded directly when a test only needs one to reference.</summary>
internal static class TestDocuments
{
    /// <summary>A stored attachment with a known id, owned by a seeded user.</summary>
    internal static async Task<string> SeedAsync(LocalDbFixture database, string fileName = "brochure.pdf")
    {
        await using var db = database.CreateContext();
        var owner = new AppUser
        {
            UserId = Guid.NewGuid(),
            ExternalIdentityId = $"seed-documents-{Guid.NewGuid():N}",
            Email = "documents@example.test",
            FullNameAr = "مستند",
            FullNameEn = "Document",
            PreferredCommunicationLanguage = "ar",
            PreferredUiLanguage = "ar",
            IsEmployee = true,
        };
        db.Users.Add(owner);
        var attachment = new Attachment
        {
            AttachmentId = Guid.NewGuid(),
            FileName = fileName,
            MimeType = "application/pdf",
            SizeBytes = 1024,
            StorageRef = "db:seed",
            ScanStatus = AttachmentScanStatuses.NotScanned,
            UploadedBy = owner.UserId,
            UploadedAt = DateTime.UtcNow,
        };
        db.Attachments.Add(attachment);
        await db.SaveChangesAsync();
        return attachment.AttachmentId.ToString();
    }

    /// <summary>`P-333` — an agreement file uploaded by the J-10 creator; returns its id.</summary>
    internal static async Task<string> AgreementFileAsync(HttpClient creator, byte[]? bytes = null) =>
        (await UploadInternalAsync(creator, "agreement-document", "agreement.pdf", bytes))
            .GetProperty("attachmentId").GetString()!;

    /// <summary>Uploads through <c>POST v1/internal/attachments</c>.</summary>
    internal static async Task<JsonElement> UploadInternalAsync(
        HttpClient client, string purpose, string fileName = "document.pdf", byte[]? bytes = null)
    {
        using var content = new MultipartFormDataContent();
        content.Add(new StringContent(purpose), "purpose");
        var file = new ByteArrayContent(bytes ?? "%PDF-1.4 expert hub test"u8.ToArray());
        file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(file, "file", fileName);
        var response = await client.PostAsync("/api/v1/internal/attachments", content);
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, $"Upload failed ({(int)response.StatusCode}): {body}");
        return JsonSerializer.Deserialize<JsonElement>(body);
    }
}
