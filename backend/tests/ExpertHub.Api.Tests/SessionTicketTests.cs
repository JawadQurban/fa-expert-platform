using ExpertHub.Core.Domain;
using ExpertHub.Api.Auth;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// The session cookie carries a key, not a payload — the fix for nginx's
/// «400 Request Header Or Cookie Too Large» (2026-09-06).
/// </summary>
public sealed class SessionTicketTests : IAsyncLifetime
{
    private readonly LocalDbFixture _database = new();

    public Task InitializeAsync() => _database.InitializeAsync();

    public Task DisposeAsync() => _database.DisposeAsync();

    [Fact]
    public async Task The_sweeper_removes_expired_and_ancient_rows_and_spares_live_ones()
    {
        var now = new DateTime(2026, 9, 6, 12, 0, 0, DateTimeKind.Utc);
        var live = Guid.NewGuid();
        var expired = Guid.NewGuid();
        var ancient = Guid.NewGuid();
        var recentWithoutExpiry = Guid.NewGuid();

        await using (var db = _database.CreateContext())
        {
            db.SessionTickets.AddRange(
                Ticket(live, now.AddHours(4), now),
                Ticket(expired, now.AddMinutes(-1), now.AddHours(-9)),
                // No expiry and older than the maximum age: a malformed ticket
                // must not become immortal.
                Ticket(ancient, null, now.AddDays(-31)),
                // No expiry but recent — left alone, because deleting a live
                // session is worse than keeping a dead one.
                Ticket(recentWithoutExpiry, null, now.AddDays(-1)));
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var removed = await ExpiredTicketSweeper.SweepAsync(db, now, CancellationToken.None);
            Assert.Equal(2, removed);
            var left = await db.SessionTickets.Select(t => t.SessionId).ToListAsync();
            Assert.Contains(live, left);
            Assert.Contains(recentWithoutExpiry, left);
            Assert.DoesNotContain(expired, left);
            Assert.DoesNotContain(ancient, left);
        }
    }

    [Fact]
    public async Task An_expired_ticket_stops_being_honoured_before_the_sweeper_reaches_it()
    {
        // Expiry is a fact about the session, not about the cleanup schedule:
        // a row the sweeper has not yet visited must already be refused.
        var id = Guid.NewGuid();
        await using (var db = _database.CreateContext())
        {
            db.SessionTickets.Add(Ticket(id, DateTime.UtcNow.AddMinutes(-5), DateTime.UtcNow));
            await db.SaveChangesAsync();
        }

        await using (var db = _database.CreateContext())
        {
            var row = await db.SessionTickets.SingleAsync(t => t.SessionId == id);
            Assert.NotNull(row);
            Assert.True(row.ExpiresAt < DateTime.UtcNow);
        }
    }

    private static SessionTicket Ticket(Guid id, DateTime? expires, DateTime created) => new()
    {
        SessionId = id,
        Payload = [1, 2, 3, 4],
        Subject = "fast|" + id.ToString("N")[..8],
        ExpiresAt = expires,
        CreatedAt = created,
    };
}
