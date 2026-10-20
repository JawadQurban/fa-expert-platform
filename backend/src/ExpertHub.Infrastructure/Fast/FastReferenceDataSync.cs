using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Infrastructure.Fast;

/// <summary>What one synchronization of one list did.</summary>
public sealed record FastReferenceSyncResult(
    string ListCode, bool Succeeded, int Added, int Updated, int Deactivated, string? Error);

/// <summary>
/// Copies FAST's reference lists into `REFERENCE_VALUE`, so a dropdown reads
/// Expert Hub's own table and never waits on FAST.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>Service credential only.</b> The call goes through
/// <see cref="IFastTokenProvider"/> — a service credential when one is
/// configured, nothing otherwise. The user's access token from a sign-in is
/// never used here: a reference list must not depend on who happened to sign
/// in, and a person's credential is not a service's. With no credential the
/// run records <c>WAITING_FOR_FAST_SERVICE_CREDENTIAL</c> and calls nothing.
/// </para>
/// <para>
/// <b>Idempotent, and never destructive.</b> Values are matched on FAST's own
/// id: new ones are added, changed labels are updated, and a value FAST stops
/// sending is DEACTIVATED, never deleted — a historical answer must still
/// resolve. A failed or empty read changes nothing: the last successful copy
/// stays, and the attempt is logged (`BR-1204`).
/// </para>
/// </remarks>
public sealed partial class FastReferenceDataSync
{
    /// <summary>`INTEGRATION_LOG.operation` for a reference-list run.</summary>
    public const string Operation = "reference-sync";

    /// <summary>What a run without a service credential records.</summary>
    public const string WaitingForCredential =
        "WAITING_FOR_FAST_SERVICE_CREDENTIAL — no FAST service credential is configured; nothing was called.";

    private static readonly JsonSerializerOptions AttributeJson = new(JsonSerializerDefaults.Web)
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    private readonly FastApiClient _client;
    private readonly IFastTokenProvider _tokens;
    private readonly ILogger<FastReferenceDataSync> _logger;
    private readonly FastTrainingApi? _training;

    public FastReferenceDataSync(
        FastApiClient client,
        IFastTokenProvider tokens,
        ILogger<FastReferenceDataSync> logger,
        FastTrainingApi? training = null)
    {
        _client = client;
        _tokens = tokens;
        _logger = logger;
        _training = training;
    }

    /// <summary>True when either FAST API is configured.</summary>
    public bool IsConfigured => _client.IsConfigured || _training?.IsConfigured == true;

    /// <summary>One value as it will be stored.</summary>
    private sealed record Row(string Code, string LabelAr, string LabelEn, string? Attributes, bool IsActive);

    /// <summary>Every list this instance can synchronize, countries first.</summary>
    public async Task<IReadOnlyList<FastReferenceSyncResult>> SyncAllAsync(
        ExpertHubDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var results = new List<FastReferenceSyncResult>
        {
            await SyncCountriesAsync(db, nowUtc, ct).ConfigureAwait(false),
        };
        foreach (var (code, _, _) in FastReferenceLists.TrainingLists)
        {
            results.Add(await SyncTrainingListAsync(db, code, nowUtc, ct).ConfigureAwait(false));
        }
        return results;
    }

    /// <summary>
    /// B-15 — one FAST Training API lookup (`LookupItemDto`) into its list.
    /// FAST's own <c>isActive</c> is kept (a retired value stays readable on
    /// old records); its <c>code</c> and <c>parentId</c> ride in the attributes,
    /// so a sub-sector still knows its sector.
    /// </summary>
    public async Task<FastReferenceSyncResult> SyncTrainingListAsync(
        ExpertHubDbContext db, string listCode, DateTime nowUtc, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(db);
        if (_training is null || !_training.IsConfigured)
        {
            return new FastReferenceSyncResult(listCode, false, 0, 0, 0, "The FAST Training API is not configured.");
        }
        if (string.IsNullOrWhiteSpace(await _training.Tokens.GetTokenAsync(ct).ConfigureAwait(false)))
        {
            return await FailAsync(db, listCode, nowUtc, WaitingForCredential, ct).ConfigureAwait(false);
        }
        var response = await _training.LookupAsync(listCode, ct).ConfigureAwait(false);
        if (!response.Ok || response.Value is null)
        {
            return await FailAsync(
                db, listCode, nowUtc, response.Error ?? "FAST returned no payload.", ct).ConfigureAwait(false);
        }
        var rows = response.Value
            .Where(item => !string.IsNullOrWhiteSpace(item.Id))
            .GroupBy(item => item.Id!, StringComparer.Ordinal)
            .Select(group => group.First())
            .Select(item => new Row(
                item.Id!,
                FirstText(item.NameAr, item.NameEn) ?? item.Id!,
                FirstText(item.NameEn, item.NameAr) ?? item.Id!,
                JsonSerializer.Serialize(new { item.Code, item.ParentId }, AttributeJson),
                item.IsActive))
            .ToList();
        return await ApplyAsync(db, listCode, rows, nowUtc, ct).ConfigureAwait(false);
    }

    /// <summary>`INTEGRATION_LOG.entity_type` for one list.</summary>
    public static string EntityTypeFor(string listCode) => $"REFERENCE_LIST:{listCode}";

    /// <summary>
    /// `Lookup/GetCountries` → the <see cref="FastReferenceLists.Countries"/>
    /// list. One call carries both languages (`nameAr`/`nameEn`), so there is
    /// nothing to merge.
    /// </summary>
    public async Task<FastReferenceSyncResult> SyncCountriesAsync(
        ExpertHubDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(db);
        const string list = FastReferenceLists.Countries;
        if (!_client.IsConfigured)
        {
            // Nothing crossed, so nothing is logged — the product is simply off.
            return new FastReferenceSyncResult(list, false, 0, 0, 0, "The FAST API is not configured.");
        }
        if (string.IsNullOrWhiteSpace(await _tokens.GetTokenAsync(ct).ConfigureAwait(false)))
        {
            return await FailAsync(db, list, nowUtc, WaitingForCredential, ct).ConfigureAwait(false);
        }

        var response = await _client
            .GetAsync<List<FastCountryItem>>(FastLookups.Countries, "ar", ct)
            .ConfigureAwait(false);
        if (!response.Ok || response.Value is null)
        {
            return await FailAsync(
                db, list, nowUtc, response.Error ?? "FAST returned no payload.", ct).ConfigureAwait(false);
        }

        var rows = response.Value
            .Where(country => country.Id is not null)
            .GroupBy(country => country.Id!.Value)
            .Select(group => group.First())
            .Select(country =>
            {
                var code = country.Id!.Value.ToString(CultureInfo.InvariantCulture);
                return new Row(
                    code,
                    FirstText(country.NameAr, country.NameEn) ?? code,
                    FirstText(country.NameEn, country.NameAr) ?? code,
                    JsonSerializer.Serialize(
                        new
                        {
                            country.NationalityAr,
                            country.NationalityEn,
                            country.CountryCode,
                            country.NafathMappingCode,
                            // ⚠️ Carried, not acted on: what the Academy does with a
                            // restricted country is not documented anywhere.
                            country.IsRestricted,
                        },
                        AttributeJson),
                    IsActive: true);
            })
            .ToList();
        return await ApplyAsync(db, list, rows, nowUtc, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// The idempotent, never-destructive upsert every list shares: matched on
    /// FAST's id, labels and attributes updated, a value FAST stopped sending
    /// deactivated (never deleted), and an empty answer refused outright.
    /// </summary>
    private async Task<FastReferenceSyncResult> ApplyAsync(
        ExpertHubDbContext db, string list, IReadOnlyList<Row> rows, DateTime nowUtc, CancellationToken ct)
    {
        if (rows.Count == 0)
        {
            // An empty list is far likelier an outage than the list really
            // being empty — never a reason to deactivate everything.
            return await FailAsync(
                db, list, nowUtc,
                "FAST returned an empty list; the last successful copy is kept.", ct).ConfigureAwait(false);
        }

        var existing = await db.ReferenceValues
            .Where(v => v.ListCode == list)
            .ToListAsync(ct)
            .ConfigureAwait(false);
        var byCode = existing.ToDictionary(v => v.Code, StringComparer.Ordinal);
        int added = 0, updated = 0, deactivated = 0;
        var present = new HashSet<string>(StringComparer.Ordinal);

        for (var index = 0; index < rows.Count; index++)
        {
            var value = rows[index];
            present.Add(value.Code);
            if (byCode.TryGetValue(value.Code, out var row))
            {
                if (row.LabelAr != value.LabelAr || row.LabelEn != value.LabelEn
                    || row.Attributes != value.Attributes || row.IsActive != value.IsActive)
                {
                    updated++;
                }
                row.LabelAr = value.LabelAr;
                row.LabelEn = value.LabelEn;
                row.Attributes = value.Attributes;
                row.SortOrder = index;
                row.IsActive = value.IsActive;
                row.Source = IntegrationSystems.Fast;
                row.SyncedAt = nowUtc;
            }
            else
            {
                db.ReferenceValues.Add(new ReferenceValue
                {
                    ValueId = Guid.NewGuid(),
                    ListCode = list,
                    Code = value.Code,
                    LabelAr = value.LabelAr,
                    LabelEn = value.LabelEn,
                    SortOrder = index,
                    IsActive = value.IsActive,
                    Source = IntegrationSystems.Fast,
                    Attributes = value.Attributes,
                    SyncedAt = nowUtc,
                });
                added++;
            }
        }

        foreach (var row in existing.Where(v => v.IsActive && !present.Contains(v.Code)))
        {
            row.IsActive = false;
            deactivated++;
        }

        db.AppendIntegrationLog(LogEntry(list, IntegrationOutcomes.Success, null, nowUtc));
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
        LogSynced(_logger, list, added, updated, deactivated);
        return new FastReferenceSyncResult(list, true, added, updated, deactivated, null);
    }

    private async Task<FastReferenceSyncResult> FailAsync(
        ExpertHubDbContext db, string list, DateTime nowUtc, string error, CancellationToken ct)
    {
        db.AppendIntegrationLog(LogEntry(list, IntegrationOutcomes.Failure, error, nowUtc));
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
        LogFailed(_logger, list, error);
        return new FastReferenceSyncResult(list, false, 0, 0, 0, error);
    }

    private static IntegrationLogEntry LogEntry(
        string list, string outcome, string? error, DateTime nowUtc) =>
        new()
        {
            LogId = Guid.NewGuid(),
            SystemCode = IntegrationSystems.Fast,
            Operation = Operation,
            EntityType = EntityTypeFor(list),
            IdempotencyKey = $"{Operation}:{list}:{nowUtc.ToString("yyyyMMddHHmmssfffffff", CultureInfo.InvariantCulture)}",
            Outcome = outcome,
            ErrorDetail = error,
            AttemptNumber = 1,
            OccurredAt = nowUtc,
        };

    private static string? FirstText(string? first, string? second) =>
        !string.IsNullOrWhiteSpace(first) ? first.Trim()
            : !string.IsNullOrWhiteSpace(second) ? second.Trim()
            : null;

    [LoggerMessage(EventId = 5220, Level = LogLevel.Information,
        Message = "FAST reference list {List} synchronized: {Added} added, {Updated} updated, {Deactivated} deactivated.")]
    private static partial void LogSynced(ILogger logger, string list, int added, int updated, int deactivated);

    [LoggerMessage(EventId = 5221, Level = LogLevel.Warning,
        Message = "FAST reference list {List} not synchronized: {Reason}. The last successful copy is kept.")]
    private static partial void LogFailed(ILogger logger, string list, string reason);
}

/// <summary>
/// Runs <see cref="FastReferenceDataSync"/> at start-up and then every
/// <c>Fast:ReferenceSyncIntervalHours</c> (default 24) — the same shape as the
/// outbox publisher. Idle when no database or no FAST base URL is configured.
/// </summary>
public sealed partial class FastReferenceDataWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly FastReferenceDataSync _sync;
    private readonly ILogger<FastReferenceDataWorker> _logger;
    private readonly bool _databaseConfigured;
    private readonly TimeSpan _interval;

    public FastReferenceDataWorker(
        IServiceScopeFactory scopes,
        FastReferenceDataSync sync,
        IConfiguration configuration,
        ILogger<FastReferenceDataWorker> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _scopes = scopes;
        _sync = sync;
        _logger = logger;
        _databaseConfigured =
            !string.IsNullOrWhiteSpace(configuration.GetConnectionString("ExpertHub"));
        _interval = TimeSpan.FromHours(
            Math.Max(1, configuration.GetValue("Fast:ReferenceSyncIntervalHours", 24)));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_databaseConfigured || !_sync.IsConfigured)
        {
            LogIdle(_logger);
            return;
        }

        using var timer = new PeriodicTimer(_interval);
        do
        {
            try
            {
                using var scope = _scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
                await _sync.SyncAllAsync(db, DateTime.UtcNow, stoppingToken).ConfigureAwait(false);
                // B-14 — once a day too: the programmes each trainer delivered.
                await scope.ServiceProvider.GetRequiredService<FastDeliveredPlansSync>()
                    .SyncAsync(db, stoppingToken).ConfigureAwait(false);
            }
            catch (Exception exception) when (exception is not OperationCanceledException
                || !stoppingToken.IsCancellationRequested)
            {
                // A failed cycle must never take the host down; the next one retries.
                LogCycleFailed(_logger, exception);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false));
    }

    [LoggerMessage(EventId = 5222, Level = LogLevel.Debug,
        Message = "FAST reference synchronization idle: no database or no Fast__BaseUrl.")]
    private static partial void LogIdle(ILogger logger);

    [LoggerMessage(EventId = 5223, Level = LogLevel.Warning,
        Message = "FAST reference synchronization cycle failed.")]
    private static partial void LogCycleFailed(ILogger logger, Exception exception);
}
