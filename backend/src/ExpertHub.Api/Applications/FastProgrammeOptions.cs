using System.Text.RegularExpressions;
using ExpertHub.Infrastructure.Fast;

namespace ExpertHub.Api.Applications;

/// <summary>One option the application form fetches at runtime.</summary>
internal sealed record FormOptionWire(string Value, string LabelAr, string LabelEn);

/// <summary>
/// A runtime option list. <c>Available</c> false — FAST is not configured
/// here, or has not answered yet — and the field keeps its static options
/// («أخرى») and its free text: the form never waits on FAST.
/// </summary>
internal sealed record FormOptionsWire(bool Available, IReadOnlyList<FormOptionWire> Items);

/// <summary>
/// BUG-004 (`P-386`) — the Academy's PUBLISHED programmes, for the
/// application form's «أبرز البرامج التدريبية أو الورش أو الفعاليات …».
/// </summary>
/// <remarks>
/// <para>
/// Published means FAST's <c>status = active</c>. This is deliberately NOT
/// the staff picker's list (`P-373`), which includes unpublished programmes:
/// an applicant is shown what the Academy's site shows.
/// </para>
/// <para>
/// The whole catalogue is read, page by page (<see cref="PageSize"/> — FAST's
/// maximum — up to <see cref="MaxPages"/> pages), so the 200-result ceiling
/// `P-373` notes for the staff picker does not cut this list short.
/// </para>
/// <para>
/// A SINGLETON with its own cache: the catalogue is the same for every
/// applicant, so it is read at most once an hour, and at most every few
/// minutes while FAST is failing. A failed read keeps serving the last good
/// list; with none, the field falls back to «أخرى».
/// </para>
/// </remarks>
public sealed partial class FastProgrammeOptions : IDisposable
{
    /// <summary>FAST's largest page.</summary>
    internal const int PageSize = 200;

    /// <summary>A ceiling, so a FAST that never stops paging cannot hold a request.</summary>
    internal const int MaxPages = 25;

    /// <summary>The form's stored code for a programme: <c>fast:&lt;FAST programme id&gt;</c>.</summary>
    internal const string ValuePrefix = "fast:";

    private static readonly TimeSpan Fresh = TimeSpan.FromHours(1);
    private static readonly TimeSpan RetryAfterFailure = TimeSpan.FromMinutes(2);

    private readonly FastTrainingApi _fast;
    private readonly ILogger<FastProgrammeOptions> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);

    /// <summary>The cache, swapped whole so a reader never sees half of an update.</summary>
    private sealed record CacheState(
        IReadOnlyList<FormOptionWire>? Items, DateTimeOffset LoadedAt, DateTimeOffset? FailedAt);

    private volatile CacheState _state = new(null, default, null);

    public FastProgrammeOptions(FastTrainingApi fast, ILogger<FastProgrammeOptions> logger)
    {
        _fast = fast ?? throw new ArgumentNullException(nameof(fast));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public void Dispose() => _gate.Dispose();

    internal async Task<FormOptionsWire> GetAsync(CancellationToken cancellationToken)
    {
        if (!_fast.IsConfigured)
        {
            return new FormOptionsWire(false, []);
        }
        if (Current() is { } fresh)
        {
            return fresh;
        }
        await _gate.WaitAsync(cancellationToken);
        try
        {
            // Another request may have read it while this one waited.
            if (Current() is { } justRead)
            {
                return justRead;
            }
            var read = await ReadAllAsync(cancellationToken);
            var now = DateTimeOffset.UtcNow;
            if (read is null)
            {
                _state = _state with { FailedAt = now };
                LogUnavailable(_logger, _state.Items?.Count ?? 0);
                return Last(_state);
            }
            _state = new CacheState(read, now, null);
            return new FormOptionsWire(true, read);
        }
        finally
        {
            _gate.Release();
        }
    }

    /// <summary>The cached answer while it may still be served without asking FAST.</summary>
    private FormOptionsWire? Current()
    {
        var state = _state;
        var now = DateTimeOffset.UtcNow;
        if (state.Items is not null && now - state.LoadedAt < Fresh)
        {
            return new FormOptionsWire(true, state.Items);
        }
        return state.FailedAt is { } failed && now - failed < RetryAfterFailure ? Last(state) : null;
    }

    private static FormOptionsWire Last(CacheState state) =>
        state.Items is null ? new FormOptionsWire(false, []) : new FormOptionsWire(true, state.Items);

    /// <summary>Every published programme, in FAST's order — or null when any page failed.</summary>
    private async Task<IReadOnlyList<FormOptionWire>?> ReadAllAsync(CancellationToken cancellationToken)
    {
        var options = new List<FormOptionWire>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        for (var page = 1; page <= MaxPages; page += 1)
        {
            var result = await _fast.SearchProgramsAsync(
                new FastProgramSearch(page, PageSize, SearchText: null, Status: "active", HasUpcomingPlans: false),
                cancellationToken);
            if (!result.Ok || result.Value is null)
            {
                return null;
            }
            foreach (var programme in result.Value.Items)
            {
                if (ToOption(programme) is { } option && seen.Add(option.Value))
                {
                    options.Add(option);
                }
            }
            if (result.Value.Items.Count < PageSize || page * PageSize >= result.Value.TotalItems)
            {
                break;
            }
        }
        return options;
    }

    /// <summary>
    /// A programme as the form offers it — only a published one (FAST was
    /// asked for <c>active</c>; a row that says otherwise is left out anyway),
    /// with an id the stored snapshot can carry.
    /// </summary>
    private static FormOptionWire? ToOption(FastProgramListItem programme)
    {
        if (string.IsNullOrWhiteSpace(programme.ProgramId)
            || !ProgrammeId().IsMatch(programme.ProgramId)
            || (programme.Status is { Length: > 0 } status
                && !string.Equals(status, "active", StringComparison.OrdinalIgnoreCase)))
        {
            return null;
        }
        var nameAr = Clean(programme.NameAr) ?? Clean(programme.NameEn);
        var nameEn = Clean(programme.NameEn) ?? nameAr;
        return nameAr is null
            ? null
            : new FormOptionWire(ValuePrefix + programme.ProgramId, nameAr, nameEn!);
    }

    /// <summary>A name with the snapshot separator replaced, trimmed to the
    /// length the stored answer allows; null when there is no name.</summary>
    private static string? Clean(string? name)
    {
        var text = name?.Replace('|', '/').Trim();
        return string.IsNullOrEmpty(text) ? null : text.Length > 300 ? text[..300] : text;
    }

    [GeneratedRegex("^[A-Za-z0-9-]{1,64}$")]
    private static partial Regex ProgrammeId();

    [LoggerMessage(EventId = 5320, Level = LogLevel.Warning,
        Message = "The published-programme list could not be read from FAST; serving {CachedCount} cached programmes.")]
    private static partial void LogUnavailable(ILogger logger, int cachedCount);
}
