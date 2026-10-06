namespace ExpertHub.Core.Domain;

/// <summary>
/// `EXT_ERP_PURCHASE_ORDER` (`10` §3.8) — the ERP mirror, held verbatim.
/// ERP masters every column here (INT-03, inbound), so nothing in the
/// platform may author or amend one: `BR-0601` says an entitlement is never
/// entered or edited by hand «بأي حال».
/// </summary>
/// <remarks>
/// ⚠️ `10` §3.8 lists five columns and omits the currency, while the
/// `ENTITLEMENT` block below requires one. An amount without its currency is
/// not a fact, so the mirror carries what ERP sends — currency included —
/// rather than the projection inventing `SAR` downstream. Recorded here so
/// the omission reads as a transcription gap and not as a decision.
/// </remarks>
public sealed class ErpPurchaseOrder
{
    /// <summary>ERP's own key, and the primary key here too — «سجل واحد لكل
    /// أمر شراء» (§8.6).</summary>
    public required string PurchaseOrderNumber { get; set; }

    /// <summary>ERP's reference to the person. Resolving it to a platform
    /// trainer is the importer's job, not this row's.</summary>
    public required string TrainerRef { get; set; }

    public decimal Amount { get; set; }

    public required string Currency { get; set; }

    /// <summary>⚠️ `Q27` — the value set is undefined, so this is opaque.</summary>
    public required string DisbursementStatus { get; set; }

    public DateTime? DisbursementDate { get; set; }

    /// <summary>`BR-1203` — the last known state, visibly dated.</summary>
    public DateTime ReceivedAt { get; set; }
}

/// <summary>
/// `ENTITLEMENT` (`10` §3.8) — the platform's projection of one purchase
/// order onto a trainer, with `BR-0602`'s chain resolved.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>`linkage_complete` is NOT a column.</b> `10` §3.8 annotates it
/// «DERIVED», and stored it would be a summary that can disagree with the
/// three ids it summarises — an agreement cancelled after the row was
/// written would leave a `true` behind and show the trainer a record
/// `BR-0603` hides. It is computed from
/// <see cref="EntitlementLinkage.Resolve"/> at every read instead, so the
/// chain and the flag cannot drift apart because there is only the chain.
/// </para>
/// <para>
/// The two nullable links are the whole of `BR-0603`: a record whose
/// agreement or engagement never resolved is staff-visible and
/// trainer-invisible, and the missing hop is nameable.
/// </para>
/// </remarks>
public sealed class Entitlement
{
    public Guid EntitlementId { get; set; }

    /// <summary>`TRAINER_PROFILE.trainer_id` — resolved from
    /// <see cref="ErpPurchaseOrder.TrainerRef"/> at import.</summary>
    public Guid TrainerId { get; set; }

    public required string PurchaseOrderNumber { get; set; }

    /// <summary>`BR-0602` hop 2 — the trainer's active agreement (CAP-03).
    /// Null when they had none when ERP sent the order.</summary>
    public Guid? AgreementId { get; set; }

    /// <summary>`BR-0602` hop 3 — the specific engagement (CAP-05). Null
    /// while ERP names no programme; see `Q35`.</summary>
    public Guid? EngagementId { get; set; }

    /// <summary>ERP's code, opaque by design (`P-128`, `Q27`).</summary>
    public required string DisbursementStatusCode { get; set; }

    public required string DisbursementStatusLabelAr { get; set; }

    public required string DisbursementStatusLabelEn { get; set; }

    /// <summary>Consumed whole — the platform computes no amount
    /// (`BR-0601`, `P-125`).</summary>
    public decimal Amount { get; set; }

    public required string Currency { get; set; }

    public DateTime? DisbursementDate { get; set; }

    public DateTime LastSyncedAt { get; set; }

    /// <summary>A value of <see cref="DriftStatuses"/> — `BR-1203`.</summary>
    public required string SyncStatus { get; set; }
}

/// <summary>
/// `BR-0602`'s three hops, in the wire spelling `entitlement.types.ts` uses.
/// </summary>
public static class EntitlementLinkSteps
{
    public const string PurchaseOrder = "purchase-order";
    public const string Agreement = "agreement";
    public const string Programme = "programme";
}

/// <summary>
/// `BR-0602` and `BR-0603`, resolved in one place — `F-0603` is «the
/// automatic link», a system behaviour rather than a user action, so it has
/// no route and no operation anywhere: it is this function.
/// </summary>
/// <remarks>
/// The type carries the missing hops rather than a boolean, because
/// `US-0602` is a support call — «why can't I see my payment?» — and the
/// useful answer names the hop, not the verdict. Completeness is derived
/// from the list being empty, so the two can never contradict each other.
/// </remarks>
public readonly record struct EntitlementLinkage
{
    private EntitlementLinkage(IReadOnlyList<string> missingLinks) =>
        MissingLinks = missingLinks;

    /// <summary>Which of `BR-0602`'s hops did not resolve, in chain order.</summary>
    public IReadOnlyList<string> MissingLinks { get; }

    /// <summary>`BR-0603` — the whole chain resolved, so the trainer may see it.</summary>
    public bool IsComplete => MissingLinks is { Count: 0 };

    /// <summary>
    /// Resolves the chain from what actually resolved, never from a stored
    /// flag. Each argument is the *resolved* end of a hop: the mirrored
    /// purchase order, the agreement's reference, the engagement's programme
    /// name. A hop that produced nothing is a hop that is missing.
    /// </summary>
    public static EntitlementLinkage Resolve(
        ErpPurchaseOrder? purchaseOrder,
        string? agreementReference,
        string? programName)
    {
        var missing = new List<string>(3);
        if (purchaseOrder is null)
        {
            missing.Add(EntitlementLinkSteps.PurchaseOrder);
        }
        if (string.IsNullOrWhiteSpace(agreementReference))
        {
            missing.Add(EntitlementLinkSteps.Agreement);
        }
        if (string.IsNullOrWhiteSpace(programName))
        {
            missing.Add(EntitlementLinkSteps.Programme);
        }
        return new EntitlementLinkage(missing);
    }
}
