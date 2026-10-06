namespace ExpertHub.Core.Domain;

/// <summary>
/// One signed-in session, held server-side so the cookie can be a key rather
/// than a payload.
/// </summary>
/// <remarks>
/// ⚠️ The row carries the encrypted authentication ticket — claims and the
/// provider tokens the logout flow needs. It is a credential store in every
/// practical sense: it is never exposed on any API surface, and no capability
/// reads it. Only the cookie middleware does, through
/// <c>DatabaseTicketStore</c>.
/// </remarks>
public sealed class SessionTicket
{
    /// <summary>The value the cookie carries — and the whole of the cookie.</summary>
    public Guid SessionId { get; set; }

    /// <summary>The serialized <c>AuthenticationTicket</c>.</summary>
    public required byte[] Payload { get; set; }

    /// <summary>Whose session, for support and for ending every session of one
    /// person at once. Null when the provider sent no subject.</summary>
    public string? Subject { get; set; }

    /// <summary>When it stops being honoured. Null tickets are swept on age.</summary>
    public DateTime? ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
