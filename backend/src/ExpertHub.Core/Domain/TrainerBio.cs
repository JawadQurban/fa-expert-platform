namespace ExpertHub.Core.Domain;

/// <summary>
/// The trainer's short bio — `TRAINER_BIO`, one row per trainer (`P-331`, UI-15).
/// </summary>
/// <remarks>
/// <para>
/// <b>Two texts, on purpose.</b> <see cref="Draft"/> is the trainer's working
/// copy, and <see cref="Published"/> is the last text staff approved — the only
/// one any other surface reads. When an approved trainer edits their bio, it
/// goes back to review, and the public directory keeps showing the approved
/// text until the edit is approved too. A single column would either hide the
/// bio during every re-review or publish text nobody approved.
/// </para>
/// <para>
/// The AI only ever writes <see cref="Draft"/>, and only while the row is
/// <see cref="TrainerBioStatuses.Drafting"/>. It never publishes; the trainer
/// confirms and staff approve.
/// </para>
/// </remarks>
public sealed class TrainerBio
{
    public Guid TrainerId { get; set; }

    /// <summary>A value of <see cref="TrainerBioStatuses"/>.</summary>
    public required string Status { get; set; }

    public string? Draft { get; set; }

    /// <summary>A value of <see cref="TrainerBioSources"/>, for <see cref="Draft"/>.</summary>
    public string? DraftSource { get; set; }

    /// <summary>
    /// Bumped by every change: a draft asked for, a draft written, a submission,
    /// a decision. Every action sends back the revision it saw, so the
    /// reviewer approves exactly the text they read. It is also the outbox
    /// message version, so a late AI answer to an older request changes nothing.
    /// </summary>
    public int Revision { get; set; }

    /// <summary>Why staff sent it back — required when they do.</summary>
    public string? ReviewNote { get; set; }

    public DateTime? SubmittedAt { get; set; }

    /// <summary>The approved text. Null until the first approval.</summary>
    public string? Published { get; set; }

    public DateTime? PublishedAt { get; set; }

    public Guid? ReviewedBy { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

/// <summary>`TRAINER_BIO.status`.</summary>
public static class TrainerBioStatuses
{
    /// <summary>An AI draft has been asked for and has not come back.</summary>
    public const string Drafting = "drafting";

    /// <summary>The AI answered; the trainer has not confirmed it yet.</summary>
    public const string AiDraft = "ai_draft";

    /// <summary>The AI could not produce one; the trainer writes it instead.</summary>
    public const string AiUnavailable = "ai_unavailable";

    public const string PendingReview = "pending_review";

    public const string Returned = "returned";

    public const string Approved = "approved";
}

/// <summary>`TRAINER_BIO.draft_source`.</summary>
public static class TrainerBioSources
{
    public const string Ai = "ai";

    public const string Trainer = "trainer";
}
