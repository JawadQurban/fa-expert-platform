using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ExpertHub.Api.Tests;

/// <summary>
/// M29 … M33 against a database that already holds records written BEFORE them
/// — the state a deployed server is in. Records are inserted at M28 exactly as
/// the older code wrote them (raw SQL, only the columns that existed then), the
/// remaining migrations are applied, and nothing may be rewritten or lost:
/// filename-only documents, a staff de-link stored as `cancelled`, a signing
/// chain with its signature, notification rows without rendered text.
/// </summary>
public sealed class RemediationMigrationTests : IAsyncLifetime
{
    private const string BeforeRemediation = "M28ApplicationFormWording";

    private readonly LocalDbFixture _database = new();

    public Task InitializeAsync() => Task.CompletedTask;

    public Task DisposeAsync() => _database.DisposeAsync();

    [Fact]
    public async Task Records_written_before_M29_survive_M29_to_M33_and_a_rollback_unchanged()
    {
        await using var db = _database.CreateContext();
        var migrator = db.GetService<IMigrator>();
        await migrator.MigrateAsync(BeforeRemediation);

        var agreementId = Guid.NewGuid();
        var sequenceId = Guid.NewGuid();
        var signatoryId = Guid.NewGuid();
        var signatureId = Guid.NewGuid();
        var serviceRequestId = Guid.NewGuid();
        var addendumId = Guid.NewGuid();
        var offerId = Guid.NewGuid();
        var terminationId = Guid.NewGuid();
        var logId = Guid.NewGuid();

        await InsertAsync(db, "AGREEMENT", new()
        {
            ["agreement_id"] = agreementId,
            ["status"] = "sent-to-applicant",
            ["field_values"] = "{\"startDate\":\"2026-01-01\"}",
            ["reference"] = "AGR-2026-9001",
        });
        await InsertAsync(db, "SIGNING_SEQUENCE", new()
        {
            ["sequence_id"] = sequenceId,
            ["agreement_id"] = agreementId,
            ["status"] = "complete",
            ["is_complete"] = true,
        });
        await InsertAsync(db, "SIGNATORY", new()
        {
            ["signatory_id"] = signatoryId,
            ["sequence_id"] = sequenceId,
            ["order_index"] = 1,
            ["obligation"] = "mandatory",
            ["is_signer"] = true,
            ["decision"] = "sign",
        });
        await InsertAsync(db, "E_SIGNATURE", new()
        {
            ["signature_id"] = signatureId,
            ["signatory_id"] = signatoryId,
            ["signature_name"] = "أ. الموقّع",
        });
        await InsertAsync(db, "SERVICE_REQUEST", new()
        {
            ["service_request_id"] = serviceRequestId,
            ["status"] = "approved",
            ["decision"] = "approve",
            ["addendum_file_name"] = "legacy-addendum.pdf",
            ["reference"] = "SR-2026-9001",
        });
        await InsertAsync(db, "ADDENDUM", new()
        {
            ["addendum_id"] = addendumId,
            ["agreement_id"] = agreementId,
            ["service_request_id"] = serviceRequestId,
            ["document_file_name"] = "legacy-addendum.pdf",
        });
        await InsertAsync(db, "ASSIGNMENT_OFFER", new()
        {
            ["offer_id"] = offerId,
            ["status"] = "expired",
            ["currency"] = "SAR",
        });
        await InsertAsync(db, "ENGAGEMENT_TERMINATION", new()
        {
            ["termination_id"] = terminationId,
            ["kind"] = "cancelled",
            ["actor"] = "staff",
            ["reason"] = "operational-need-change",
        });
        await InsertAsync(db, "NOTIFICATION_LOG", new()
        {
            ["log_id"] = logId,
            ["event_code"] = "EV-0101",
            ["channel"] = "in-platform",
            ["send_status"] = "success",
        });

        await migrator.MigrateAsync();
        await AssertLegacyRecordsIntactAsync(db);

        // The rollback path is valid on this data, and a re-apply changes nothing.
        await migrator.MigrateAsync(BeforeRemediation);
        await migrator.MigrateAsync();
        await AssertLegacyRecordsIntactAsync(db);
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());

        async Task AssertLegacyRecordsIntactAsync(ExpertHubDbContext context)
        {
            // M32 — the chain and its signature are untouched; the existing
            // signature reads as the internal acceptance it always was; the
            // agreement simply has no frozen version (served as a legacy view).
            Assert.Equal("complete", await ScalarAsync(context,
                "SELECT status AS [Value] FROM SIGNING_SEQUENCE WHERE sequence_id = {0}", sequenceId));
            Assert.Null(await ScalarAsync(context,
                "SELECT CONVERT(nvarchar(50), voided_at) AS [Value] FROM SIGNING_SEQUENCE WHERE sequence_id = {0}", sequenceId));
            Assert.Equal("أ. الموقّع", await ScalarAsync(context,
                "SELECT signature_name AS [Value] FROM E_SIGNATURE WHERE signature_id = {0}", signatureId));
            Assert.Equal("internal-acceptance", await ScalarAsync(context,
                "SELECT method AS [Value] FROM E_SIGNATURE WHERE signature_id = {0}", signatureId));
            Assert.Equal("sign", await ScalarAsync(context,
                "SELECT decision AS [Value] FROM SIGNATORY WHERE signatory_id = {0}", signatoryId));
            Assert.Equal("0", await ScalarAsync(context,
                "SELECT CONVERT(nvarchar(10), COUNT(*)) AS [Value] FROM AGREEMENT_DOCUMENT_VERSION WHERE agreement_id = {0}", agreementId));

            // M33 — filename-only documents keep their names; no id is invented.
            Assert.Equal("legacy-addendum.pdf", await ScalarAsync(context,
                "SELECT addendum_file_name AS [Value] FROM SERVICE_REQUEST WHERE service_request_id = {0}", serviceRequestId));
            Assert.Null(await ScalarAsync(context,
                "SELECT CONVERT(nvarchar(50), addendum_attachment_id) AS [Value] FROM SERVICE_REQUEST WHERE service_request_id = {0}", serviceRequestId));
            Assert.Equal("legacy-addendum.pdf", await ScalarAsync(context,
                "SELECT document_file_name AS [Value] FROM ADDENDUM WHERE addendum_id = {0}", addendumId));

            // M29 — an offer expired before the sweep existed has no invented expiry time.
            Assert.Equal("expired", await ScalarAsync(context,
                "SELECT status AS [Value] FROM ASSIGNMENT_OFFER WHERE offer_id = {0}", offerId));
            Assert.Null(await ScalarAsync(context,
                "SELECT CONVERT(nvarchar(50), expired_at) AS [Value] FROM ASSIGNMENT_OFFER WHERE offer_id = {0}", offerId));

            // P-280 — a staff de-link stored as `cancelled` before the fix is kept as written.
            Assert.Equal("cancelled", await ScalarAsync(context,
                "SELECT kind AS [Value] FROM ENGAGEMENT_TERMINATION WHERE termination_id = {0}", terminationId));

            // M30 — an older send has no rendered text and no occurrence, and keeps its outcome.
            Assert.Null(await ScalarAsync(context,
                "SELECT subject AS [Value] FROM NOTIFICATION_LOG WHERE log_id = {0}", logId));
            Assert.Equal("success", await ScalarAsync(context,
                "SELECT send_status AS [Value] FROM NOTIFICATION_LOG WHERE log_id = {0}", logId));
        }
    }

    [Fact]
    public async Task M29_to_M33_apply_to_an_empty_database_and_leave_no_model_changes_pending()
    {
        await using var db = _database.CreateContext();
        await db.GetService<IMigrator>().MigrateAsync();
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        var applied = (await db.Database.GetAppliedMigrationsAsync()).ToList();
        foreach (var name in new[]
        {
            "M29OfferExpiry", "M30NotificationOccurrences", "M31AssignmentCentres",
            "M32AgreementDocumentVersions", "M33StoredDocumentReferences",
        })
        {
            Assert.Contains(applied, migration => migration.EndsWith(name, StringComparison.Ordinal));
        }
        Assert.False(db.Database.HasPendingModelChanges());
    }

    /// <summary>
    /// Inserts one row as older code would: the named columns, and a neutral
    /// value for every other NOT NULL column without a default. Constraints are
    /// switched off for the table — only this row's own columns are under test.
    /// </summary>
    private static async Task InsertAsync(
        ExpertHubDbContext db, string table, Dictionary<string, object> values)
    {
        var required = await db.Database.SqlQueryRaw<ColumnInfo>(
                "SELECT COLUMN_NAME AS Name, DATA_TYPE AS DataType FROM INFORMATION_SCHEMA.COLUMNS "
                + "WHERE TABLE_NAME = {0} AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL", table)
            .ToListAsync();
        var row = new Dictionary<string, object>(values, StringComparer.OrdinalIgnoreCase);
        foreach (var column in required.Where(c => !row.ContainsKey(c.Name)))
        {
            row[column.Name] = column.DataType switch
            {
                "uniqueidentifier" => Guid.NewGuid(),
                "int" or "bigint" or "smallint" or "tinyint" or "decimal" or "numeric" => 0,
                "bit" => false,
                "datetime2" or "datetime" or "date" => DateTime.UtcNow,
                _ => "x",
            };
        }
        var columns = string.Join(", ", row.Keys.Select(name => $"[{name}]"));
        var placeholders = string.Join(", ", row.Keys.Select((_, index) => $"{{{index}}}"));
#pragma warning disable EF1002 // table/column names come from this test, values stay parameterised
        await db.Database.ExecuteSqlRawAsync(
            $"ALTER TABLE [{table}] NOCHECK CONSTRAINT ALL; INSERT INTO [{table}] ({columns}) VALUES ({placeholders});",
            [.. row.Values]);
#pragma warning restore EF1002
    }

    private static async Task<string?> ScalarAsync(ExpertHubDbContext db, string sql, object parameter) =>
        await db.Database.SqlQueryRaw<string?>(sql, parameter).SingleAsync();

    private sealed record ColumnInfo(string Name, string DataType);
}
