using ExpertHub.Infrastructure.Documents;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ExpertHub.Api.Middleware;

/// <summary>
/// A document storage outage is <b>503</b>, never a 500 with details (`P-370`).
/// </summary>
/// <remarks>
/// The store has already logged the failure (type, status, error code — no URL);
/// the client is told only that storage is unavailable and to try again.
/// </remarks>
internal sealed partial class DocumentStoreUnavailableExceptionHandler(
    IProblemDetailsService problemDetails,
    ILogger<DocumentStoreUnavailableExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not DocumentStoreUnavailableException)
        {
            return false;
        }
        LogUnavailable(logger, httpContext.Request.Path);
        httpContext.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "Document storage is unavailable.",
                Detail = "storage-unavailable",
                Instance = httpContext.Request.Path,
            },
        }).ConfigureAwait(false);
    }

    [LoggerMessage(
        EventId = 5402,
        Level = LogLevel.Warning,
        Message = "Document storage was unavailable on {Path}; answered 503.")]
    private static partial void LogUnavailable(ILogger logger, string path);
}
