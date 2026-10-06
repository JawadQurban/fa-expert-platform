using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Middleware;

/// <summary>
/// Turns a unique-index violation into <b>409 Conflict</b> instead of 500.
/// </summary>
/// <remarks>
/// <para>
/// Every filtered unique index in this schema exists to refuse a second row that
/// must not exist — a second live offer on a slot, a second draft application, a
/// second un-voided signing chain. The index does its job either way, but
/// without this the loser of the race got <b>500 Internal Server Error</b>: the
/// one answer that says "this is our fault, try again later" when the truth is
/// "somebody already did this, and your copy of the state is stale".
/// </para>
/// <para>
/// Owner ruling (2026-10-01, `P-328`): a double-submitted decision answers
/// <b>409</b>; it does not replay the first result as though this request had
/// performed it. A screen that believes it decided something it did not is worse
/// than one told to re-read.
/// </para>
/// <para>
/// ⚠️ This is the <b>backstop</b>, not the mechanism. A transition that can be
/// submitted twice claims its row conditionally
/// (<c>ExecuteUpdateAsync … WHERE status = @expected</c>) and answers 409 itself,
/// with a message about the actual business state. Reaching this handler means
/// no such claim was in the path — which is correct behaviour, not a good
/// experience.
/// </para>
/// </remarks>
internal sealed partial class UniqueViolationExceptionHandler(
    IProblemDetailsService problemDetails,
    ILogger<UniqueViolationExceptionHandler> logger) : IExceptionHandler
{
    /// <summary>SQL Server: a duplicate key in a unique <i>index</i>.</summary>
    private const int DuplicateKeyRow = 2601;

    /// <summary>SQL Server: a duplicate key violating a unique <i>constraint</i>.</summary>
    private const int UniqueConstraintViolation = 2627;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (!IsUniqueViolation(exception))
        {
            // Not ours — the default handler still answers, and still logs.
            return false;
        }

        // Logged before the response: returning true suppresses the diagnostics
        // middleware for this exception, so this is the only record of WHICH
        // index refused the write. The client is told none of it.
        LogRefused(logger, httpContext.Request.Path, exception);

        httpContext.Response.StatusCode = StatusCodes.Status409Conflict;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Already done.",
                // No index name, no SQL: the schema is not the caller's business.
                Detail = "This has already been done, or somebody did it while "
                    + "this page was open. Reload and look at the current state "
                    + "before trying again.",
                Instance = httpContext.Request.Path,
            },
        }).ConfigureAwait(false);
    }

    /// <summary>
    /// True for a unique violation, however deep it is wrapped. EF surfaces it as
    /// a <see cref="DbUpdateException"/> around a <see cref="SqlException"/>;
    /// <c>ExecuteUpdate</c>/<c>ExecuteDelete</c> and raw SQL throw the
    /// <see cref="SqlException"/> on its own.
    /// </summary>
    internal static bool IsUniqueViolation(Exception? exception)
    {
        for (var current = exception; current is not null; current = current.InnerException)
        {
            if (current is SqlException { Number: DuplicateKeyRow or UniqueConstraintViolation })
            {
                return true;
            }
        }
        return false;
    }

    [LoggerMessage(
        EventId = 5401,
        Level = LogLevel.Warning,
        Message = "A unique index refused a duplicate write on {Path}; answered 409. If this is a path a person can double-submit, it needs a conditional claim of its own.")]
    private static partial void LogRefused(ILogger logger, string path, Exception exception);
}
