using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Applications;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Assignments;

/// <summary>
/// Offers are CREATED, never sent. J-18/F1/AC-1: «the system sends the offer
/// to the top-ranked candidate» — so there is no send-offer endpoint anywhere
/// in the product, and this is the only place an offer comes into being: when
/// a slot has an approved candidate whose turn has arrived.
/// </summary>
public static partial class OfferService
{
    /// <summary>
    /// Opens the next offer on each slot that has none live. The top-ranked
    /// APPROVED candidate not already tried on that slot gets it; a slot with
    /// nobody left is marked exhausted, which is J-19's trigger (F2/AC-5).
    /// </summary>
    public static async Task OpenNextOffersAsync(
        ExpertHubDbContext db,
        AssignmentRequest request,
        IReadOnlyList<AssignmentSlot> slots,
        IReadOnlyList<PoolMember> approvedInPreferenceOrder,
        DateTime now,
        CancellationToken ct)
    {
        var dueAt = await ResponseDueAsync(db, now, ct);
        // `DEF-02` — who this call has already offered. The change tracker is
        // not a dependable source here (an offer added moments ago may not be
        // visible the way a saved row is), and the invariant is too important
        // to leave to it: one live offer per person per REQUEST.
        var offeredInThisRun = new List<Guid>();
        foreach (var slot in slots)
        {
            if (slot.ConfirmedEngagementId is not null)
            {
                continue;
            }
            /*
             * ⚠️ Read the slot's offers through the change tracker AS WELL as
             * the database. The caller has usually just staged the refusal or
             * expiry that brought us here, and an unsaved change is invisible
             * to a query — so a database-only read would still see the old
             * offer as live and refuse to pass the slot on. (Caught three
             * times across BE-06/BE-08/BE-10: whenever a rule reads state the
             * current transaction is still writing, the local set counts as
             * much as the stored rows.)
             */
            var slotOffers = await OffersOfAsync(db, slot.SlotId, ct);
            if (slotOffers.Any(o => o.Status == OfferStatuses.AwaitingResponse))
            {
                // F1/AC-2 — ONE live offer per slot at a time. A backup is
                // «untouched until their turn comes», so nothing is sent now.
                continue;
            }
            /*
             * «Tried» is counted within the CURRENT approved set only. J-19/F1/
             * AC-5: «no restriction against candidates previously rejected/
             * expired for this same slot; they can be re-included if still a
             * valid match» — so a re-routed pool that approves an earlier
             * refuser offers to them again, while the same set never offers to
             * the same person twice (a refusal, a lapse or a withdrawal all
             * count).
             */
            var setDecidedAt = approvedInPreferenceOrder
                .Select(m => m.DecidedAt)
                .Where(at => at is not null)
                .DefaultIfEmpty(null)
                .Max();
            var tried = slotOffers
                .Where(o => setDecidedAt is null || o.SentAt >= setDecidedAt)
                .Select(o => o.TrainerId)
                .ToList();
            // Also skip anyone already engaged on ANOTHER slot of this request:
            // one person cannot fill two slots of the same need.
            var engagedHere = await (
                from engagement in db.Engagements
                join s in db.AssignmentSlots on engagement.SlotId equals s.SlotId
                where s.RequestId == request.RequestId
                    && engagement.Status != EngagementStatuses.Withdrawn
                    && engagement.Status != EngagementStatuses.Cancelled
                select engagement.TrainerId).ToListAsync(ct);

            /*
             * `DEF-02` — …and anyone already HOLDING a live offer on another
             * slot of this request.
             *
             * The engagement rule above was the whole cross-slot guard, but an
             * offer awaiting an answer is not an engagement. With headcount 2
             * each slot independently picked the top-ranked candidate, so one
             * person received two simultaneous offers for the same need while
             * the backups received none — and nothing stopped them accepting
             * both. The invariant is one live offer per person per REQUEST.
             *
             * A refused, expired or withdrawn offer is not live, so re-routing
             * is untouched: `J-19/F1/AC-5` still lets an earlier refuser be
             * re-included.
             *
             * The local set counts as much as the stored rows, for the same
             * reason the slot read above does: offers opened earlier in THIS
             * loop are not saved yet.
             */
            var liveElsewhere = await (
                from offer in db.AssignmentOffers
                join s in db.AssignmentSlots on offer.SlotId equals s.SlotId
                where s.RequestId == request.RequestId
                    && s.SlotId != slot.SlotId
                    && offer.Status == OfferStatuses.AwaitingResponse
                select offer.TrainerId).ToListAsync(ct);
            liveElsewhere.AddRange(offeredInThisRun);

            var next = approvedInPreferenceOrder.FirstOrDefault(
                m => !tried.Contains(m.TrainerId)
                    && !engagedHere.Contains(m.TrainerId)
                    && !liveElsewhere.Contains(m.TrainerId));
            if (next is null)
            {
                // F2/AC-5 — every approved candidate refused or lapsed.
                slot.Exhausted = true;
                await OpenCycleAsync(db, slot, now, ct);
                continue;
            }
            slot.Exhausted = false;
            offeredInThisRun.Add(next.TrainerId);
            db.AssignmentOffers.Add(new AssignmentOffer
            {
                OfferId = Guid.NewGuid(),
                SlotId = slot.SlotId,
                TrainerId = next.TrainerId,
                Status = OfferStatuses.AwaitingResponse,
                Price = next.PriceInClass ?? next.PriceOnline,
                Currency = next.Currency,
                SentAt = now,
                ResponseDueAt = dueAt,
            });
        }
    }

    /// <summary>
    /// J-19 — an exhausted slot opens a re-routing cycle: counted, never capped
    /// (F2/AC-3). Idempotent: a slot whose latest cycle is still open (exhausted
    /// or awaiting approval) gets no second one.
    /// </summary>
    private static async Task OpenCycleAsync(
        ExpertHubDbContext db, AssignmentSlot slot, DateTime now, CancellationToken ct)
    {
        var latest = await LatestCycleAsync(db, slot.SlotId, ct);
        if (latest is not null && latest.Status != SlotCycleStatuses.Decided)
        {
            return;
        }
        db.SlotCycles.Add(new SlotCycle
        {
            CycleId = Guid.NewGuid(),
            SlotId = slot.SlotId,
            CycleNumber = (latest?.CycleNumber ?? 0) + 1,
            Status = SlotCycleStatuses.Exhausted,
            CreatedAt = now,
        });
    }

    /// <summary>The slot's latest cycle, staged or stored.</summary>
    public static async Task<SlotCycle?> LatestCycleAsync(
        ExpertHubDbContext db, Guid slotId, CancellationToken ct)
    {
        var stored = await db.SlotCycles.Where(c => c.SlotId == slotId).ToListAsync(ct);
        return db.SlotCycles.Local
            .Where(c => c.SlotId == slotId)
            .Concat(stored)
            .DistinctBy(c => c.CycleId)
            .OrderByDescending(c => c.CycleNumber)
            .FirstOrDefault();
    }

    /// <summary>
    /// One slot's offers, staged AND stored — the tracked instance wins, so a
    /// status changed in this request is the status this sees.
    /// </summary>
    private static async Task<List<AssignmentOffer>> OffersOfAsync(
        ExpertHubDbContext db, Guid slotId, CancellationToken ct)
    {
        var stored = await db.AssignmentOffers
            .Where(o => o.SlotId == slotId)
            .ToListAsync(ct);
        return [.. db.AssignmentOffers.Local
            .Where(o => o.SlotId == slotId)
            .Concat(stored)
            .DistinctBy(o => o.OfferId)];
    }

    /// <summary>
    /// The response window — `SLA-0501` from the CENTRAL matrix (`BR-0705`),
    /// never a constant here: changing the deadline on the console has to
    /// change what this issues.
    /// </summary>
    public static async Task<DateTime?> ResponseDueAsync(
        ExpertHubDbContext db, DateTime now, CancellationToken ct)
    {
        var row = await db.SlaMatrix.FirstOrDefaultAsync(r => r.SlaId == "SLA-0501", ct);
        if (row is null || row.Status != SlaStatuses.Fixed || row.Duration is not { } duration)
        {
            return null;
        }
        return row.Unit == SlaUnits.BusinessDays
            ? BusinessCalendar.AddBusinessDays(now, duration)
            : now.AddDays(duration);
    }

    /// <summary>
    /// Confirms a slot: the offer becomes an engagement, and the engagement
    /// is queued to FAST as `PlanTrainer` — **per slot**, «with no waiting
    /// for the remaining slots» (J-18/F4/AC-1), which is exactly what BE-04's
    /// per-entity outbox message gives.
    /// </summary>
    public static async Task<Engagement> ConfirmAsync(
        ExpertHubDbContext db,
        IntegrationHub hub,
        NotificationDispatcher dispatcher,
        AssignmentOffer offer,
        AssignmentSlot slot,
        Guid trainerUserId,
        DateTime now,
        CancellationToken ct)
    {
        offer.Status = OfferStatuses.Accepted;
        offer.RespondedAt = now;

        var engagement = new Engagement
        {
            EngagementId = Guid.NewGuid(),
            OfferId = offer.OfferId,
            TrainerId = offer.TrainerId,
            SlotId = slot.SlotId,
            Status = EngagementStatuses.Upcoming,
            ConfirmedAt = now,
        };
        db.Engagements.Add(engagement);
        slot.ConfirmedEngagementId = engagement.EngagementId;
        slot.Exhausted = false;
        slot.FastSyncState = "processing";

        // The outbound crossing Expert Hub masters (`08` §4.2 rule 1: the
        // engagement is on the small explicit list). Queued in the SAME
        // transaction as the confirmation, so FAST is never told about an
        // engagement the platform failed to commit.
        await hub.EnqueueOutboundAsync(
            IntegrationSystems.Fast,
            "engagement",
            "ENGAGEMENT",
            engagement.EngagementId,
            entityVersion: 1,
            operation: "upsert",
            System.Text.Json.JsonSerializer.Serialize(new
            {
                engagementId = engagement.EngagementId,
                trainerId = engagement.TrainerId,
                slotNumber = slot.SlotNumber,
            }, AssignmentEndpoints.WireJson),
            ct);

        // J-20/F4 — material submission opens on confirmation when the plan
        // has none. ⚠️ Without a FAST plan read there is no way to know, so
        // the submission opens `awaiting_upload` and the trainer may upload;
        // when the plan feed exists this becomes conditional on it.
        db.MaterialSubmissions.Add(new MaterialSubmission
        {
            SubmissionId = Guid.NewGuid(),
            EngagementId = engagement.EngagementId,
            Kind = "training-material",
            Status = SubmissionStatuses.AwaitingUpload,
            FastSyncState = "none",
            OpenedAt = now,
        });

        _ = dispatcher; // J-18 catalogues no confirmation event of its own.
        _ = trainerUserId;
        return engagement;
    }

    /// <summary>
    /// The lifecycle J-21/F5 derives from the schedule — never stored for the
    /// first three: `upcoming` before it starts, `in_progress` during,
    /// `completed` after. A terminated engagement keeps its stored end state,
    /// because that one IS an act rather than a date.
    /// </summary>
    /// <remarks>
    /// The request's «to» is a DATE (`2026-11-03T00:00:00Z`), so the engagement
    /// runs through that whole day. Comparing against midnight called an
    /// engagement «completed» while its last day was still being delivered.
    /// </remarks>
    public static string Lifecycle(Engagement engagement, DateTime? from, DateTime? to, DateTime now)
    {
        if (engagement.Status is EngagementStatuses.Withdrawn or EngagementStatuses.Cancelled)
        {
            return engagement.Status;
        }
        if (from is null || to is null)
        {
            return EngagementStatuses.Upcoming;
        }
        if (now < from)
        {
            return EngagementStatuses.Upcoming;
        }
        var end = to.Value.TimeOfDay == TimeSpan.Zero ? to.Value.AddDays(1) : to.Value;
        return now >= end ? EngagementStatuses.Completed : EngagementStatuses.InProgress;
    }

    /* ── J-18/F2 — refusal, expiry, and the next turn ──────────────────────── */

    /// <summary>
    /// Expires one offer whose window has closed, and passes the slot on.
    /// Returns false when the offer was no longer awaiting a response — it was
    /// answered or already expired — in which case nothing changes.
    /// </summary>
    /// <remarks>
    /// ⚠️ The CLAIM is a conditional update, not a read-then-write: the sweep
    /// and a trainer's late answer can reach the same offer at the same moment,
    /// and only one of them may expire it and advance the slot. Call inside a
    /// transaction that also saves the advance.
    /// </remarks>
    public static async Task<bool> ExpireAsync(
        ExpertHubDbContext db,
        NotificationDispatcher dispatcher,
        Guid offerId,
        DateTime now,
        CancellationToken ct)
    {
        var claimed = await db.AssignmentOffers
            .Where(o => o.OfferId == offerId
                && o.Status == OfferStatuses.AwaitingResponse
                && o.ResponseDueAt != null
                && o.ResponseDueAt <= now)
            .ExecuteUpdateAsync(set => set
                .SetProperty(o => o.Status, OfferStatuses.Expired)
                .SetProperty(o => o.ExpiredAt, now), ct);
        if (claimed == 0)
        {
            return false;
        }
        // The update bypassed the change tracker, so a tracked copy still says
        // «awaiting» — and the next-offer rule reads tracked offers first.
        var offer = db.AssignmentOffers.Local.FirstOrDefault(o => o.OfferId == offerId)
            ?? await db.AssignmentOffers.SingleAsync(o => o.OfferId == offerId, ct);
        offer.Status = OfferStatuses.Expired;
        offer.ExpiredAt = now;

        var slot = await db.AssignmentSlots.SingleAsync(s => s.SlotId == offer.SlotId, ct);
        // J-18/F2/AC-4 — «a distinct notification from explicit rejection».
        await RaiseAsync(dispatcher, db, "EV-0503", slot, ct);
        await AdvanceAsync(db, dispatcher, slot, now, ct);
        return true;
    }

    /// <summary>
    /// Every offer whose window has closed, expired one at a time, each in its
    /// own transaction — so one failure never rolls back the others, and a
    /// re-run finds nothing it already did. Returns how many it expired.
    /// </summary>
    public static async Task<int> ExpireDueOffersAsync(
        ExpertHubDbContext db,
        NotificationDispatcher dispatcher,
        DateTime now,
        CancellationToken ct,
        ILogger? logger = null)
    {
        var due = await db.AssignmentOffers
            .Where(o => o.Status == OfferStatuses.AwaitingResponse
                && o.ResponseDueAt != null
                && o.ResponseDueAt <= now)
            .OrderBy(o => o.ResponseDueAt)
            .Select(o => o.OfferId)
            .ToListAsync(ct);
        var expired = 0;
        foreach (var offerId in due)
        {
            /*
             * ⚠️ Per offer, not per sweep. The list is ordered by `ResponseDueAt`,
             * so without this the earliest-due offer is always reached first and
             * a repeatable failure on it — a poisoned notification payload, a
             * constraint it trips — ended every sweep before any later offer was
             * reached. One offer then held up every expiry in the product.
             */
            try
            {
                db.ChangeTracker.Clear();
                await using var transaction = await db.Database.BeginTransactionAsync(ct);
                if (!await ExpireAsync(db, dispatcher, offerId, now, ct))
                {
                    await transaction.RollbackAsync(ct);
                    continue;
                }
                await db.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
                expired++;
            }
            catch (Exception exception) when (exception is not OperationCanceledException
                || !ct.IsCancellationRequested)
            {
                if (logger is not null)
                {
                    LogOfferExpiryFailed(logger, offerId, exception);
                }
            }
        }
        return expired;
    }

    /// <summary>An offer lapsed or was refused: the next approved candidate's
    /// turn comes, or the slot is exhausted and J-19 takes over.</summary>
    public static async Task AdvanceAsync(
        ExpertHubDbContext db,
        NotificationDispatcher dispatcher,
        AssignmentSlot slot,
        DateTime now,
        CancellationToken ct)
    {
        var request = await db.AssignmentRequests.SingleAsync(r => r.RequestId == slot.RequestId, ct);
        var approved = await ApprovedForAsync(db, request, slot, ct);
        var wasExhausted = slot.Exhausted;
        await OpenNextOffersAsync(db, request, [slot], approved, now, ct);
        if (slot.Exhausted && !wasExhausted)
        {
            // J-19/F1/AC-2 — a DISTINCT event from one candidate's refusal.
            await RaiseAsync(dispatcher, db, "EV-0504", slot, ct);
        }
    }

    /// <summary>
    /// The approved candidates the slot's offers are drawn from: the slot's
    /// own re-routed pool when it has one (`P-95` — the LATEST decided cycle),
    /// else the request's.
    /// </summary>
    public static async Task<List<PoolMember>> ApprovedForAsync(
        ExpertHubDbContext db, AssignmentRequest request, AssignmentSlot slot, CancellationToken ct)
    {
        var pool = await db.CandidatePools
                .Where(p => p.RequestId == request.RequestId && p.SlotId == slot.SlotId && p.Status == "decided")
                .OrderByDescending(p => p.SentAt)
                .FirstOrDefaultAsync(ct)
            ?? await db.CandidatePools.FirstOrDefaultAsync(
                p => p.RequestId == request.RequestId && p.SlotId == null, ct);
        if (pool is null)
        {
            return [];
        }
        return await db.PoolMembers
            .Where(m => m.PoolId == pool.PoolId && m.Decision == "approved")
            .OrderBy(m => m.PreferenceRank)
            .ToListAsync(ct);
    }

    public static async Task RaiseAsync(
        NotificationDispatcher dispatcher, ExpertHubDbContext db, string eventCode,
        AssignmentSlot slot, CancellationToken ct)
    {
        var request = await db.AssignmentRequests.SingleAsync(r => r.RequestId == slot.RequestId, ct);
        await dispatcher.RaiseAsync(
            eventCode,
            new NotificationEventContext(
                SourceEntityId: slot.SlotId,
                ActingStaffUserId: request.CreatedBy),
            new Dictionary<string, string>
            {
                ["referenceNumber"] = request.Reference,
                ["slotNumber"] = slot.SlotNumber.ToString(System.Globalization.CultureInfo.InvariantCulture),
            },
            ct);
    }

    [LoggerMessage(
        EventId = 5303,
        Level = LogLevel.Error,
        Message = "Expiring assignment offer {OfferId} failed; the sweep continued with the rest and the next one retries it.")]
    private static partial void LogOfferExpiryFailed(ILogger logger, Guid offerId, Exception exception);
}
