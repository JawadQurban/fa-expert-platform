using System.Security.Cryptography;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Api.Auth;

/// <summary>
/// Keeps the session ticket in the database and leaves only its key in the
/// cookie.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>Why this exists.</b> Cookie authentication serialises the WHOLE
/// ticket — every claim, plus the tokens `SaveTokens` keeps — encrypts it and
/// puts it in the cookie, chunking across <c>…C1</c>, <c>…C2</c> when it
/// outgrows one. The browser then sends all of it on every request, and
/// nginx's <c>large_client_header_buffers</c> refuses the request with
/// <b>400 «Request Header Or Cookie Too Large»</b>. Raising the buffer treats
/// the symptom; the cookie is still carrying a session's worth of data on
/// every image and every poll.
/// </para>
/// <para>
/// With a ticket store the cookie holds a GUID. The ticket lives here, which
/// also makes two things true that were not before: a logout can <b>destroy</b>
/// a session rather than ask the browser to forget it, and
/// <c>Oidc:SessionMinutes</c> becomes something the server enforces rather
/// than something the cookie claims.
/// </para>
/// <para>
/// The cost is that expired rows must be swept — see
/// <see cref="ExpiredTicketSweeper"/>. A store without eviction is a table
/// that only grows.
/// </para>
/// </remarks>
public sealed class DatabaseTicketStore : ITicketStore
{
    private readonly IServiceScopeFactory _scopes;

    /*
     * ⚠️ The payload is ENCRYPTED before it is stored, and nothing about moving
     * the ticket out of the cookie did that on its own.
     *
     * `TicketSerializer` only serialises: in the cookie the handler's own
     * `TicketDataFormat` is what encrypts, and a session store sits BEHIND that.
     * So the rows carried every claim — and the id token `SaveTokens` keeps — as
     * readable bytes in a table that database administrators, a backup file and
     * a restored copy all reach. Data protection restores the property the
     * cookie had.
     *
     * Two consequences, both accepted: the keys must outlive the container (they
     * are on a volume, see `deploy/docker-compose.yml`), and rows
     * written before this change no longer deserialize — those sessions are
     * treated as expired and their owners sign in again once.
     */
    private readonly IDataProtector _protector;

    public DatabaseTicketStore(IServiceScopeFactory scopes, IDataProtectionProvider protection)
    {
        ArgumentNullException.ThrowIfNull(protection);
        _scopes = scopes;
        _protector = protection.CreateProtector("ExpertHub.SessionTicket.v1");
    }

    public async Task<string> StoreAsync(AuthenticationTicket ticket)
    {
        var key = Guid.NewGuid();
        await using var scope = _scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
        db.SessionTickets.Add(new SessionTicket
        {
            SessionId = key,
            Payload = Serialize(ticket),
            Subject = SubjectOf(ticket),
            ExpiresAt = ExpiryOf(ticket),
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync().ConfigureAwait(false);
        return key.ToString("D");
    }

    public async Task RenewAsync(string key, AuthenticationTicket ticket)
    {
        if (!Guid.TryParse(key, out var sessionId))
        {
            return;
        }
        await using var scope = _scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
        var row = await db.SessionTickets.FirstOrDefaultAsync(t => t.SessionId == sessionId)
            .ConfigureAwait(false);
        if (row is null)
        {
            return;
        }
        row.Payload = Serialize(ticket);
        row.ExpiresAt = ExpiryOf(ticket);
        await db.SaveChangesAsync().ConfigureAwait(false);
    }

    public async Task<AuthenticationTicket?> RetrieveAsync(string key)
    {
        if (!Guid.TryParse(key, out var sessionId))
        {
            return null;
        }
        await using var scope = _scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
        var row = await db.SessionTickets.AsNoTracking()
            .FirstOrDefaultAsync(t => t.SessionId == sessionId).ConfigureAwait(false);
        // An expired row is treated as absent even before the sweeper reaches
        // it: expiry is a fact about the session, not about the cleanup job.
        if (row is null || (row.ExpiresAt is { } expiry && expiry <= DateTime.UtcNow))
        {
            return null;
        }
        try
        {
            return TicketSerializer.Default.Deserialize(_protector.Unprotect(row.Payload));
        }
        catch (CryptographicException)
        {
            // A row this instance cannot decrypt — written before the payload
            // was protected, or under keys that are gone — is not a session.
            // Treated as absent, which costs one sign-in and never throws at
            // the middleware.
            return null;
        }
    }

    public async Task RemoveAsync(string key)
    {
        if (!Guid.TryParse(key, out var sessionId))
        {
            return;
        }
        await using var scope = _scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
        await db.SessionTickets.Where(t => t.SessionId == sessionId)
            .ExecuteDeleteAsync().ConfigureAwait(false);
    }

    private byte[] Serialize(AuthenticationTicket ticket) =>
        _protector.Protect(TicketSerializer.Default.Serialize(ticket));

    private static DateTime? ExpiryOf(AuthenticationTicket ticket) =>
        ticket.Properties.ExpiresUtc?.UtcDateTime;

    /// <summary>Stored so an administrator can see WHOSE session a row is
    /// without decrypting it — and so every session of one person can be
    /// ended at once if that is ever needed.</summary>
    private static string? SubjectOf(AuthenticationTicket ticket) =>
        ticket.Principal.FindFirst("sub")?.Value
        ?? ticket.Principal.Identity?.Name;
}

/// <summary>
/// Deletes expired session rows — the eviction a server-side ticket store
/// makes necessary.
/// </summary>
/// <remarks>
/// Sessions end in three ways: the person logs out (the row is removed then
/// and there), the ticket expires (it stops being honoured immediately, and
/// this removes the row), or the browser is simply closed and never comes
/// back — which is the case that would otherwise leave the table growing for
/// ever. Rows with no expiry are swept on age, so a malformed ticket cannot
/// become immortal.
/// </remarks>
public sealed partial class ExpiredTicketSweeper : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    /// <summary>How long a row with no expiry may live. Generous, because
    /// deleting a live session is worse than keeping a dead one.</summary>
    private static readonly TimeSpan MaxAge = TimeSpan.FromDays(30);

    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<ExpiredTicketSweeper> _logger;
    private readonly bool _databaseConfigured;

    public ExpiredTicketSweeper(
        IServiceScopeFactory scopes,
        Microsoft.Extensions.Configuration.IConfiguration configuration,
        ILogger<ExpiredTicketSweeper> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _scopes = scopes;
        _logger = logger;
        _databaseConfigured =
            !string.IsNullOrWhiteSpace(configuration.GetConnectionString("ExpertHub"));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_databaseConfigured)
        {
            return;
        }
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                await using var scope = _scopes.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
                var removed = await SweepAsync(db, DateTime.UtcNow, stoppingToken)
                    .ConfigureAwait(false);
                if (removed > 0)
                {
                    LogSwept(_logger, removed);
                }
            }
            catch (Exception exception) when (exception is not OperationCanceledException
                || !stoppingToken.IsCancellationRequested)
            {
                LogSweepFailed(_logger, exception);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false));
    }

    [LoggerMessage(EventId = 5101, Level = LogLevel.Information,
        Message = "Swept {Count} expired session tickets.")]
    private static partial void LogSwept(ILogger logger, int count);

    [LoggerMessage(EventId = 5102, Level = LogLevel.Warning,
        Message = "The session-ticket sweep failed; retrying next cycle.")]
    private static partial void LogSweepFailed(ILogger logger, Exception exception);

    /// <summary>One sweep — separated so a test can drive it directly.</summary>
    public static Task<int> SweepAsync(
        ExpertHubDbContext db, DateTime nowUtc, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(db);
        var ageCutoff = nowUtc - MaxAge;
        return db.SessionTickets
            .Where(t => (t.ExpiresAt != null && t.ExpiresAt <= nowUtc)
                || (t.ExpiresAt == null && t.CreatedAt <= ageCutoff))
            .ExecuteDeleteAsync(cancellationToken);
    }
}
