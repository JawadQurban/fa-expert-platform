namespace ExpertHub.Core.Domain;

/// <summary>
/// One shared data element and the system that masters it — `DATA_ELEMENT`,
/// `10` §3.12. This table IS the source-of-truth matrix: `BR-1201` ("one
/// source system per data element") and the mastership register of `08` §1.1.1
/// held as data, not code (`P-129`).
/// </summary>
/// <remarks>
/// The hub consults this row before any crossing. An element that is not
/// registered cannot cross at all, and an outbound write to an element another
/// system masters is rejected with a reason — never accepted and silently lost
/// at the next replication, which `08` §1.1 calls the single most likely way
/// the design fails in practice.
/// </remarks>
public sealed class DataElement
{
    public Guid ElementId { get; set; }

    /// <summary>The system this element crosses to or from.</summary>
    public required string SystemCode { get; set; }

    public required string ElementName { get; set; }

    /// <summary>A value of <see cref="OwningSystems"/> — who masters it (`BR-1201`).</summary>
    public required string OwningSystem { get; set; }

    /// <summary>The entity the element belongs to, in the master's vocabulary.</summary>
    public required string EntityName { get; set; }

    /// <summary>From Expert Hub's viewpoint — a value of <see cref="IntegrationDirections"/>.</summary>
    public required string Direction { get; set; }
}
