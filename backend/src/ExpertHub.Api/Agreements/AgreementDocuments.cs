using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ExpertHub.Api.Applications;
using ExpertHub.Api.ServiceRequests;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Agreements;

internal sealed record DocumentFieldWire(string Id, LocalizedTextWire Label, string Value);

/// <summary>
/// The complete agreement a signer or the applicant reads before acting —
/// J-10/F3/AC-2, J-11/F1/AC-2: «all agreement data without exception».
/// </summary>
/// <remarks>
/// <c>Snapshot</c> is false only for an agreement prepared before versions were
/// recorded: its content is then rendered from the live rows and labelled so,
/// never presented as a frozen record it is not. There is no PDF: nothing
/// generates one, and none is pretended (<c>SignatureMethod</c> says how
/// acceptance is captured — internal, not a qualified e-signature).
/// </remarks>
internal sealed record AgreementDocumentWire(
    string? DocumentVersionId,
    int VersionNumber,
    string TemplateName,
    string TemplateVersion,
    string BodyText,
    IReadOnlyList<DocumentFieldWire> Fields,
    IReadOnlyList<MergedGroupWire> MergedData,
    string? ContentHash,
    string? CreatedAt,
    bool Snapshot,
    string SignatureMethod);

/// <summary>Agreement content versions, the active signing chain, and the
/// document wire — one place, so every endpoint reads them the same way.</summary>
internal static class AgreementDocuments
{
    private static readonly JsonSerializerOptions WireJson = new(JsonSerializerDefaults.Web);

    /// <summary>The chain currently running — voided chains are history.</summary>
    internal static Task<SigningSequenceRecord?> ActiveSequenceAsync(
        ExpertHubDbContext db, Guid agreementId, CancellationToken ct) =>
        db.SigningSequences
            .Where(s => s.AgreementId == agreementId && s.VoidedAt == null)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync(ct);

    /// <summary>Voids the running chain, keeping every approval and signature.</summary>
    internal static async Task VoidActiveSequenceAsync(
        ExpertHubDbContext db, Guid agreementId, DateTime now, CancellationToken ct)
    {
        var active = await ActiveSequenceAsync(db, agreementId, ct);
        if (active is not null)
        {
            active.Status = "voided";
            active.VoidedAt = now;
        }
    }

    internal static Task<AgreementDocumentVersion?> LatestAsync(
        ExpertHubDbContext db, Guid agreementId, CancellationToken ct) =>
        db.AgreementDocumentVersions
            .Where(v => v.AgreementId == agreementId)
            .OrderByDescending(v => v.VersionNumber)
            .FirstOrDefaultAsync(ct);

    /// <summary>
    /// Freezes the agreement's current content as a new version — unless it is
    /// identical to the latest one, which is returned instead (idempotent).
    /// Call after the agreement and its services are SAVED: the merged data is
    /// read from the database.
    /// </summary>
    internal static async Task<AgreementDocumentVersion> SnapshotAsync(
        ExpertHubDbContext db, Agreement agreement, Guid actorUserId, DateTime now, CancellationToken ct)
    {
        var template = agreement.TemplateId is { } templateId
            ? await db.AgreementTemplates.SingleAsync(t => t.TemplateId == templateId, ct)
            : await db.AgreementTemplates.SingleAsync(t => t.IsActive, ct);
        var fields = FieldsOf(template.FieldMap, agreement.FieldValues);
        var merged = await AgreementEndpoints.BuildMergedDataAsync(db, agreement, ct);
        var fieldsJson = JsonSerializer.Serialize(fields, WireJson);
        var mergedJson = JsonSerializer.Serialize(merged, WireJson);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
            string.Join("", template.Version, template.BodyText, fieldsJson, mergedJson))));

        var latest = await LatestAsync(db, agreement.AgreementId, ct);
        if (latest is not null && latest.ContentHash == hash)
        {
            return latest;
        }
        var version = new AgreementDocumentVersion
        {
            DocumentVersionId = Guid.NewGuid(),
            AgreementId = agreement.AgreementId,
            VersionNumber = (latest?.VersionNumber ?? 0) + 1,
            TemplateId = template.TemplateId,
            TemplateName = template.Name,
            TemplateVersion = template.Version,
            BodyText = template.BodyText,
            Fields = fieldsJson,
            MergedData = mergedJson,
            ContentHash = hash,
            CreatedBy = actorUserId,
            CreatedAt = now,
        };
        db.AgreementDocumentVersions.Add(version);
        return version;
    }

    /// <summary>The document as a reader sees it — the latest version, or a
    /// labelled live rendering for an agreement that predates versions.</summary>
    internal static async Task<AgreementDocumentWire> WireAsync(
        ExpertHubDbContext db, Agreement agreement, CancellationToken ct)
    {
        var latest = await LatestAsync(db, agreement.AgreementId, ct);
        if (latest is not null)
        {
            return new AgreementDocumentWire(
                latest.DocumentVersionId.ToString(),
                latest.VersionNumber,
                latest.TemplateName,
                latest.TemplateVersion,
                latest.BodyText,
                JsonSerializer.Deserialize<List<DocumentFieldWire>>(latest.Fields, WireJson) ?? [],
                JsonSerializer.Deserialize<List<MergedGroupWire>>(latest.MergedData, WireJson) ?? [],
                latest.ContentHash,
                ApplicationEndpoints.Iso(latest.CreatedAt),
                Snapshot: true,
                SignatureMethods.InternalAcceptance);
        }
        var template = agreement.TemplateId is { } templateId
            ? await db.AgreementTemplates.SingleAsync(t => t.TemplateId == templateId, ct)
            : await db.AgreementTemplates.SingleAsync(t => t.IsActive, ct);
        return new AgreementDocumentWire(
            null,
            0,
            template.Name,
            template.Version,
            template.BodyText,
            FieldsOf(template.FieldMap, agreement.FieldValues),
            await AgreementEndpoints.BuildMergedDataAsync(db, agreement, ct),
            null,
            null,
            Snapshot: false,
            SignatureMethods.InternalAcceptance);
    }

    private static List<DocumentFieldWire> FieldsOf(string fieldMap, string fieldValues)
    {
        var values = JsonSerializer.Deserialize<Dictionary<string, string>>(fieldValues) ?? [];
        return [.. AgreementEndpoints.ParseFields(fieldMap).Select(field => new DocumentFieldWire(
            field.Id,
            field.Label,
            values.GetValueOrDefault(field.Id, string.Empty)))];
    }
}
