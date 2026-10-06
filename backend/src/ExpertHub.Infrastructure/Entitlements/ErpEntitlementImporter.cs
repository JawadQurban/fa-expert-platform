using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Infrastructure.Entitlements;

/// <summary>
/// One purchase order as ERP supplies it (INT-03, `10` §3.8).
/// </summary>
/// <remarks>
/// ⚠️ The transport is an open ask — «the entitlement endpoint: how Expert Hub
/// receives PO number, amount, status, date and trainer» (`15` §4). The
/// <em>fields</em> are settled by §8.6 and `10` §3.8, so they are built; the
/// wire that carries them is not, so none is guessed. This record is the
/// shape an INT-03 adapter will fill, and it is the only way into the two
/// ERP-mastered tables.
/// </remarks>
/// <param name="PurchaseOrderNumber">ERP's key, and the identity of the record.</param>
/// <param name="TrainerRef">ERP's reference to the person — see
/// <see cref="ErpEntitlementImporter.ApplyAsync"/> for how it is resolved.</param>
/// <param name="StatusCode">Opaque (`Q27`, `P-128`).</param>
/// <param name="StatusLabelAr">ERP's own Arabic label; the code stands in when
/// ERP sends none, because a label invented here would be the platform
/// authoring a business vocabulary it was told it does not own.</param>
/// <param name="StatusLabelEn">As <paramref name="StatusLabelAr"/>.</param>
/// <param name="EngagementId">⚠️ `Q39` — `BR-0602`'s third hop. The ERP payload
/// as specified carries no programme reference at all, so this is null in
/// practice and every record stays incomplete, which by `BR-0603` means no
/// trainer sees anything. Named rather than guessed: a heuristic that picked
/// "the trainer's only recent engagement" would attach real money to a
/// programme nobody confirmed.</param>
public sealed record ErpPurchaseOrderMessage(
    string PurchaseOrderNumber,
    string TrainerRef,
    decimal Amount,
    string Currency,
    string StatusCode,
    string? StatusLabelAr,
    string? StatusLabelEn,
    DateTime? DisbursementDate,
    Guid? EngagementId = null);

/// <summary>
/// The <b>only</b> writer of `EXT_ERP_PURCHASE_ORDER` and `ENTITLEMENT`, and
/// deliberately on the integration side of the boundary rather than inside
/// CAP-06.
/// </summary>
/// <remarks>
/// <para>
/// `BR-0601`: «لا يُدخل أي مستحق أو يُعدَّل يدويًا بأي حال». The capability
/// therefore has no write operation — see
/// <c>ExpertHub.Api.Entitlements.EntitlementEndpoints</c>, which is two reads
/// — and the writable DbSets are <c>internal</c> to this assembly, so the API
/// project cannot compile a change to an entitlement even by accident. What
/// arrives here is not a person entering a record; it is ERP replicating one.
/// </para>
/// <para>
/// `F-0603` — «the automatic link» — is this method's second half, and it is
/// the whole feature: there is no screen and no route for linking, because
/// nobody performs it.
/// </para>
/// </remarks>
public sealed class ErpEntitlementImporter(ExpertHubDbContext db, IntegrationHub hub)
{
    private readonly ExpertHubDbContext _db = db;
    private readonly IntegrationHub _hub = hub;

    /// <summary>
    /// Mirrors one purchase order and re-resolves `BR-0602`'s chain for it.
    /// Idempotent per PO number: a re-send updates the mirror and the
    /// projection in place, because ERP is the master and the last thing it
    /// said is the state (`BR-1203`).
    /// </summary>
    /// <returns>
    /// The projection, or <c>null</c> when <see
    /// cref="ErpPurchaseOrderMessage.TrainerRef"/> matches nobody. The mirror
    /// row is still written in that case — losing what ERP sent because the
    /// platform could not attribute it would be the one outcome that helps
    /// nobody — but an entitlement with no trainer cannot be displayed on
    /// either screen, so none is projected. This is <em>unattributed</em>, not
    /// <em>incompletely linked</em>: `BR-0603` names three hops and the
    /// trainer is not one of them.
    /// </returns>
    /// <remarks>
    /// Stages only; the caller commits, so the mirror, the projection, the
    /// replication state and the crossing log land in one transaction or none
    /// of them do.
    /// </remarks>
    public async Task<Entitlement?> ApplyAsync(
        ErpPurchaseOrderMessage message,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        var now = DateTime.UtcNow;

        var order = await _db.ErpPurchaseOrderWrites
            .FirstOrDefaultAsync(p => p.PurchaseOrderNumber == message.PurchaseOrderNumber,
                cancellationToken)
            .ConfigureAwait(false);
        if (order is null)
        {
            order = new ErpPurchaseOrder
            {
                PurchaseOrderNumber = message.PurchaseOrderNumber,
                TrainerRef = message.TrainerRef,
                Currency = message.Currency,
                DisbursementStatus = message.StatusCode,
            };
            _db.ErpPurchaseOrderWrites.Add(order);
        }
        order.TrainerRef = message.TrainerRef;
        order.Amount = message.Amount;
        order.Currency = message.Currency;
        order.DisbursementStatus = message.StatusCode;
        order.DisbursementDate = message.DisbursementDate;
        order.ReceivedAt = now;

        var trainer = await ResolveTrainerAsync(message.TrainerRef, cancellationToken)
            .ConfigureAwait(false);
        if (trainer is null)
        {
            return null;
        }

        var entitlement = await _db.EntitlementWrites
            .FirstOrDefaultAsync(e => e.PurchaseOrderNumber == message.PurchaseOrderNumber,
                cancellationToken)
            .ConfigureAwait(false);
        if (entitlement is null)
        {
            entitlement = new Entitlement
            {
                EntitlementId = Guid.NewGuid(),
                PurchaseOrderNumber = message.PurchaseOrderNumber,
                DisbursementStatusCode = message.StatusCode,
                DisbursementStatusLabelAr = message.StatusLabelAr ?? message.StatusCode,
                DisbursementStatusLabelEn = message.StatusLabelEn ?? message.StatusCode,
                Currency = message.Currency,
                SyncStatus = DriftStatuses.InSync,
            };
            _db.EntitlementWrites.Add(entitlement);
        }
        entitlement.TrainerId = trainer.TrainerId;
        entitlement.DisbursementStatusCode = message.StatusCode;
        entitlement.DisbursementStatusLabelAr = message.StatusLabelAr ?? message.StatusCode;
        entitlement.DisbursementStatusLabelEn = message.StatusLabelEn ?? message.StatusCode;
        entitlement.Amount = message.Amount;
        entitlement.Currency = message.Currency;
        entitlement.DisbursementDate = message.DisbursementDate;
        entitlement.LastSyncedAt = now;
        entitlement.SyncStatus = DriftStatuses.InSync;

        // `F-0603` — the automatic link, re-resolved on every sync rather than
        // fixed at creation: an agreement signed after ERP sent the order
        // completes the chain at the next crossing, with nobody doing anything.
        entitlement.AgreementId = await ActiveAgreementIdAsync(trainer.UserId, cancellationToken)
            .ConfigureAwait(false);
        entitlement.EngagementId = await ValidEngagementIdAsync(
            trainer.TrainerId, message.EngagementId, cancellationToken).ConfigureAwait(false);

        // `BR-1203`/`BR-1204` — the replication state and the crossing, staged
        // in the same transaction as the row they describe.
        await _hub.RecordInboundAsync(
            IntegrationSystems.Erp,
            "entitlement",
            "ENTITLEMENT",
            entitlement.EntitlementId,
            message.PurchaseOrderNumber,
            remoteVersion: null,
            cancellationToken).ConfigureAwait(false);

        return entitlement;
    }

    /// <summary>
    /// ⚠️ `Q39` also covers this: the INT-03 ask does not say <em>which</em>
    /// key ERP quotes. Three unique, unambiguous keys are tried — the
    /// platform's own trainer id, the SSO subject, and the email — and
    /// nothing fuzzier, because a near-match on a name would attribute a
    /// payment to the wrong person.
    /// </summary>
    private async Task<TrainerProfile?> ResolveTrainerAsync(
        string trainerRef, CancellationToken cancellationToken)
    {
        if (Guid.TryParse(trainerRef, out var trainerId))
        {
            var byId = await _db.TrainerProfiles
                .FirstOrDefaultAsync(p => p.TrainerId == trainerId, cancellationToken)
                .ConfigureAwait(false);
            if (byId is not null)
            {
                return byId;
            }
        }

        return await (
            from profile in _db.TrainerProfiles
            join user in _db.Users on profile.UserId equals user.UserId
            where user.ExternalIdentityId == trainerRef || user.Email == trainerRef
            select profile).FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// `BR-0602` hop 2 — «through the purchase order, the ACTIVE agreement».
    /// Deterministic rather than chosen: the trainer has at most one.
    /// </summary>
    private Task<Guid?> ActiveAgreementIdAsync(Guid trainerUserId, CancellationToken cancellationToken) =>
        _db.Agreements
            .Where(a => a.TrainerUserId == trainerUserId && a.Status == AgreementStatuses.Active)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => (Guid?)a.AgreementId)
            .FirstOrDefaultAsync(cancellationToken);

    /// <summary>
    /// `BR-0602` hop 3 — accepted only when ERP named an engagement that is
    /// really this trainer's. An id that resolves to somebody else's
    /// engagement is dropped rather than trusted: the mirror is ERP's, but
    /// the chain is the platform's to verify.
    /// </summary>
    private async Task<Guid?> ValidEngagementIdAsync(
        Guid trainerId, Guid? engagementId, CancellationToken cancellationToken)
    {
        if (engagementId is not { } id)
        {
            return null;
        }
        var owned = await _db.Engagements
            .AnyAsync(e => e.EngagementId == id && e.TrainerId == trainerId, cancellationToken)
            .ConfigureAwait(false);
        return owned ? id : null;
    }
}
