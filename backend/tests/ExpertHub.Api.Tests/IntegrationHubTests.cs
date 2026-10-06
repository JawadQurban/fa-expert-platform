using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Integration;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Tests;

/// <summary>
/// BE-04 — CAP-12's mechanism, held to `08` §4.2's sequence on a real
/// database: ownership check → idempotency key → outbox in the same
/// transaction as the business change → publish from the outbox → record the
/// crossing → reconcile drift.
/// </summary>
[Collection(LocalDbCollection.Name)]
public sealed class IntegrationHubTests
{
    private readonly LocalDbFixture _fixture;

    public IntegrationHubTests(LocalDbFixture fixture) => _fixture = fixture;

    /* ── the registry — mastership is data, not code (P-129) ──────────────── */

    [Fact]
    public async Task The_crossing_register_is_seeded_with_the_six_systems_and_the_mastership_matrix()
    {
        await using var db = _fixture.CreateContext();

        var systems = await db.IntegratedSystems.OrderBy(s => s.SystemCode).ToListAsync();
        Assert.Equal(
            ["INT-01", "INT-02", "INT-03", "INT-04", "INT-05", "INT-06"],
            systems.Select(s => s.SystemCode).ToArray());
        Assert.Equal(
            IntegrationDirections.Bidirectional,
            systems.Single(s => s.SystemCode == IntegrationSystems.Fast).Direction);

        // The register of `08` §1.1.1, spot-checked from both sides of the
        // mastership line.
        var elements = await db.DataElements.ToListAsync();
        Assert.Equal(
            OwningSystems.ExpertHub,
            elements.Single(e => e.ElementName == "engagement").OwningSystem);
        Assert.Equal(
            OwningSystems.Fast,
            elements.Single(e => e.ElementName == "programme_plan").OwningSystem);
        // "Not shared" entities have no row on purpose — no registration, no
        // crossing.
        Assert.DoesNotContain(elements, e => e.EntityName == "AGREEMENT");
    }

    /* ── the outbound half (`08` §4.2) ─────────────────────────────────────── */

    [Fact]
    public async Task An_outbound_write_commits_with_the_business_change_and_shows_pending()
    {
        var entityId = Guid.NewGuid();
        await using (var db = _fixture.CreateContext())
        {
            // The "business change" — any committed row does; what matters is
            // that it and the outbox message ride ONE SaveChanges.
            db.ReferenceValues.Add(NewCentre("centre-outbox"));
            var hub = new IntegrationHub(db);
            var message = await hub.EnqueueOutboundAsync(
                IntegrationSystems.Fast, "engagement", "ENGAGEMENT",
                entityId, 1, "upsert", """{"slot":"confirmed"}""");
            Assert.Equal($"ENGAGEMENT:{entityId:D}:v1", message.IdempotencyKey);
            await db.SaveChangesAsync();
        }

        await using (var db = _fixture.CreateContext())
        {
            var stored = await db.OutboxMessages.SingleAsync(m => m.EntityId == entityId);
            Assert.Equal(OutboxStatuses.Pending, stored.Status);
            Assert.Equal(0, stored.AttemptCount);

            // P-135: queued and shown as pending — never applied and hoped for.
            var state = await db.ReplicationStates.SingleAsync(r => r.LocalEntityId == entityId);
            Assert.Equal(MasterSides.ExpertHub, state.MasterSide);
            Assert.Equal(DriftStatuses.Pending, state.DriftStatus);
            Assert.Null(state.LastSyncedAt);
        }
    }

    [Fact]
    public async Task A_write_to_an_element_another_system_masters_is_rejected_with_a_reason()
    {
        await using var db = _fixture.CreateContext();
        var hub = new IntegrationHub(db);

        // FAST masters the plan; an outbound write would be silently lost at
        // the next replication — so it is refused here, with the reason.
        var rejected = await Assert.ThrowsAsync<MastershipViolationException>(() =>
            hub.EnqueueOutboundAsync(
                IntegrationSystems.Fast, "programme_plan", "PLAN",
                Guid.NewGuid(), 1, "upsert", "{}"));
        Assert.Contains("'fast'", rejected.Message, StringComparison.Ordinal);

        // An unregistered element does not cross at all (BR-1201).
        await Assert.ThrowsAsync<MastershipViolationException>(() =>
            hub.EnqueueOutboundAsync(
                IntegrationSystems.Fast, "no_such_element", "X",
                Guid.NewGuid(), 1, "upsert", "{}"));

        Assert.Empty(db.ChangeTracker.Entries<OutboxMessage>());
    }

    [Fact]
    public async Task A_retry_of_the_same_entity_version_does_not_create_a_second_message()
    {
        var entityId = Guid.NewGuid();
        await using (var db = _fixture.CreateContext())
        {
            var hub = new IntegrationHub(db);
            await hub.EnqueueOutboundAsync(
                IntegrationSystems.Fast, "engagement", "ENGAGEMENT",
                entityId, 7, "upsert", "{}");
            await db.SaveChangesAsync();
        }

        // The retry after an ambiguous timeout — a fresh context, same
        // (entity, entity_id, version). The hub hands back the existing
        // message instead of staging a duplicate.
        await using (var db = _fixture.CreateContext())
        {
            var hub = new IntegrationHub(db);
            await hub.EnqueueOutboundAsync(
                IntegrationSystems.Fast, "engagement", "ENGAGEMENT",
                entityId, 7, "upsert", "{}");
            await db.SaveChangesAsync();

            Assert.Equal(1, await db.OutboxMessages.CountAsync(m => m.EntityId == entityId));
        }

        // And if application code reaches around the hub, the database's
        // unique index holds the same line — rolling back the whole
        // transaction, business change included: FAST is never told about a
        // change the platform failed to commit.
        await using (var db = _fixture.CreateContext())
        {
            db.ReferenceValues.Add(NewCentre("centre-rollback"));
            db.OutboxMessages.Add(new OutboxMessage
            {
                OutboxMessageId = Guid.NewGuid(),
                SystemCode = IntegrationSystems.Fast,
                ElementName = "engagement",
                EntityType = "ENGAGEMENT",
                EntityId = entityId,
                EntityVersion = 7,
                Operation = "upsert",
                Payload = "{}",
                IdempotencyKey = IntegrationHub.OutboundKey("ENGAGEMENT", entityId, 7),
                Status = OutboxStatuses.Pending,
                NextAttemptAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
            });
            await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        }

        await using (var check = _fixture.CreateContext())
        {
            Assert.False(await check.ReferenceValues.AnyAsync(v => v.Code == "centre-rollback"));
        }
    }

    /* ── publishing — every attempt logged (BR-1204), state survives (BR-1203) ── */

    [Fact]
    public async Task Every_publish_attempt_is_logged_and_the_message_survives_failure()
    {
        var entityId = Guid.NewGuid();
        var start = DateTime.UtcNow;
        await using var db = _fixture.CreateContext();
        var hub = new IntegrationHub(db);
        var message = await hub.EnqueueOutboundAsync(
            IntegrationSystems.Fast, "trainer_accreditation", "TRAINER",
            entityId, 2, "upsert", """{"status":"accredited"}""");
        await db.SaveChangesAsync();

        // FAST is down for three attempts, then reachable.
        var channel = new FakeChannel(
            IntegrationAttemptResult.Failure("FAST unreachable"),
            IntegrationAttemptResult.Failure("FAST unreachable"),
            IntegrationAttemptResult.Failure("FAST unreachable"),
            IntegrationAttemptResult.Success());

        for (var attempt = 1; attempt <= 3; attempt++)
        {
            // Each pass runs after the previous backoff has elapsed.
            var published = await OutboxPublisher.PublishDueAsync(
                db, channel, start.AddMinutes(attempt * 5), CancellationToken.None);
            Assert.Equal(0, published);
        }

        // BR-1203: the outage changed nothing but bookkeeping — the message
        // is still queued, the last error visible, the backoff scheduled…
        Assert.Equal(OutboxStatuses.Pending, message.Status);
        Assert.Equal(3, message.AttemptCount);
        Assert.Equal("FAST unreachable", message.LastError);

        // …and after enough failures the drift is VISIBLE, found by the
        // platform rather than by a user.
        var state = await db.ReplicationStates.SingleAsync(r => r.LocalEntityId == entityId);
        Assert.Equal(DriftStatuses.Drifted, state.DriftStatus);

        // The recovery pass.
        var recovered = await OutboxPublisher.PublishDueAsync(
            db, channel, start.AddMinutes(30), CancellationToken.None);
        Assert.Equal(1, recovered);
        Assert.Equal(OutboxStatuses.Published, message.Status);
        Assert.NotNull(message.PublishedAt);
        Assert.Equal(DriftStatuses.InSync, state.DriftStatus);
        Assert.NotNull(state.LastSyncedAt);

        // BR-1204: all four attempts are in the log, replayable — outcome,
        // error, attempt number, the idempotency key that ties them together.
        var trail = await db.IntegrationLog
            .Where(l => l.IdempotencyKey == message.IdempotencyKey)
            .OrderBy(l => l.AttemptNumber)
            .ToListAsync();
        Assert.Equal(4, trail.Count);
        Assert.Equal(
            [IntegrationOutcomes.Failure, IntegrationOutcomes.Failure, IntegrationOutcomes.Failure, IntegrationOutcomes.Success],
            trail.Select(l => l.Outcome).ToArray());
        Assert.Equal("FAST unreachable", trail[0].ErrorDetail);
    }

    [Fact]
    public async Task An_unconfigured_channel_leaves_the_queue_untouched()
    {
        var entityId = Guid.NewGuid();
        await using var db = _fixture.CreateContext();
        var hub = new IntegrationHub(db);
        var message = await hub.EnqueueOutboundAsync(
            IntegrationSystems.EmailGateway, "notification_message", "NOTIFICATION",
            entityId, 1, "send", "{}");
        await db.SaveChangesAsync();

        var published = await OutboxPublisher.PublishDueAsync(
            db, new NullIntegrationChannel(), DateTime.UtcNow.AddDays(1), CancellationToken.None);

        // No channel is not a failed delivery — it is a delivery not yet
        // attempted: no burnt attempts, no log noise, the queue intact.
        Assert.Equal(0, published);
        Assert.Equal(0, message.AttemptCount);
        Assert.Equal(OutboxStatuses.Pending, message.Status);
        Assert.False(await db.IntegrationLog.AnyAsync(l => l.EntityId == entityId));
    }

    /* ── the inbound half (`08` §4.3) ──────────────────────────────────────── */

    [Fact]
    public async Task An_inbound_apply_records_the_crossing_and_the_last_known_state()
    {
        var planId = Guid.NewGuid();
        await using (var db = _fixture.CreateContext())
        {
            var hub = new IntegrationHub(db);
            await hub.RecordInboundAsync(
                IntegrationSystems.Fast, "programme_plan", "PLAN",
                planId, "FAST-PLAN-77", 3);
            await db.SaveChangesAsync();
        }

        await using (var db = _fixture.CreateContext())
        {
            var state = await db.ReplicationStates.SingleAsync(r => r.LocalEntityId == planId);
            Assert.Equal(MasterSides.Remote, state.MasterSide);
            Assert.Equal("FAST-PLAN-77", state.RemoteEntityId);
            Assert.Equal(3, state.RemoteVersion);
            Assert.Equal(DriftStatuses.InSync, state.DriftStatus);
            Assert.NotNull(state.LastSyncedAt);

            var logged = await db.IntegrationLog.SingleAsync(l => l.EntityId == planId);
            Assert.Equal("consume", logged.Operation);
            Assert.Equal(IntegrationOutcomes.Success, logged.Outcome);
        }
    }

    [Fact]
    public async Task An_inbound_apply_to_a_platform_mastered_element_is_refused()
    {
        await using var db = _fixture.CreateContext();
        var hub = new IntegrationHub(db);

        // `08` §1.1's warning, enforced in the inbound direction: a remote
        // edit to a platform-mastered entity is refused, not silently
        // absorbed and replicated over.
        await Assert.ThrowsAsync<MastershipViolationException>(() =>
            hub.RecordInboundAsync(
                IntegrationSystems.Fast, "engagement", "ENGAGEMENT",
                Guid.NewGuid(), "FAST-REL-1", 1));
    }

    /* ── the trace is append-only (BR-1204) ────────────────────────────────── */

    [Fact]
    public async Task The_integration_log_is_append_only()
    {
        var entry = new IntegrationLogEntry
        {
            LogId = Guid.NewGuid(),
            SystemCode = IntegrationSystems.Erp,
            Operation = "consume",
            EntityType = "ENTITLEMENT",
            IdempotencyKey = $"ENTITLEMENT:{Guid.NewGuid():D}:r1",
            Outcome = IntegrationOutcomes.Failure,
            ErrorDetail = "timeout",
            AttemptNumber = 1,
            OccurredAt = DateTime.UtcNow,
        };
        await using (var db = _fixture.CreateContext())
        {
            db.AppendIntegrationLog(entry);
            await db.SaveChangesAsync();
        }

        // A failed crossing cannot be edited into a successful one.
        await using (var db = _fixture.CreateContext())
        {
            db.Attach(entry);
            entry.Outcome = IntegrationOutcomes.Success;
            var refused = await Assert.ThrowsAsync<InvalidOperationException>(
                () => db.SaveChangesAsync());
            Assert.Contains("append-only", refused.Message, StringComparison.Ordinal);
        }
    }

    private static ReferenceValue NewCentre(string code) => new()
    {
        ValueId = Guid.NewGuid(),
        ListCode = "centre",
        Code = code,
        LabelAr = "مركز تجريبي",
        LabelEn = "Test centre",
        SortOrder = 999,
        IsActive = true,
    };

    /// <summary>Scripted channel: hands out the queued results in order.</summary>
    private sealed class FakeChannel : IIntegrationChannel
    {
        private readonly Queue<IntegrationAttemptResult> _results;

        public FakeChannel(params IntegrationAttemptResult[] results) => _results = new(results);

        public bool IsConfigured => true;

        public Task<IntegrationAttemptResult> SendAsync(
            OutboxMessage message,
            CancellationToken cancellationToken) => Task.FromResult(_results.Dequeue());
    }
}
