using System.Text.RegularExpressions;
using Azure;
using Azure.Core;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ExpertHub.Infrastructure.Documents;

/// <summary>Where uploaded documents are written — <c>Storage:*</c> (`P-370`).</summary>
public sealed class StorageOptions
{
    public const string Section = "Storage";
    public const string LocalProvider = "Local";
    public const string AzureBlobProvider = "AzureBlob";

    /// <summary><c>Local</c> (the volume or the database, as before) or <c>AzureBlob</c>.</summary>
    public string Provider { get; set; } = LocalProvider;

    public AzureBlobStorageOptions AzureBlob { get; set; } = new();

    public bool UsesAzureBlob =>
        string.Equals(Provider, AzureBlobProvider, StringComparison.OrdinalIgnoreCase);

    public bool IsKnownProvider =>
        UsesAzureBlob || string.Equals(Provider, LocalProvider, StringComparison.OrdinalIgnoreCase);
}

/// <summary>The Azure Blob container. ⚠️ <see cref="ConnectionString"/> is a secret:
/// <c>Storage__AzureBlob__ConnectionString</c> from <c>env/api.secrets.env</c> only.</summary>
public sealed class AzureBlobStorageOptions
{
    public string ConnectionString { get; set; } = string.Empty;

    public string ContainerName { get; set; } = string.Empty;

    /// <summary>Per attempt; the SDK retries <see cref="MaxRetries"/> times on top.</summary>
    public int TimeoutSeconds { get; set; } = 30;

    public int MaxRetries { get; set; } = 3;

    /// <summary>Whether the connection string parses — checked at startup so a
    /// typo fails the deployment, not the first upload. The value is never echoed.</summary>
    public bool ConnectionStringParses()
    {
        try
        {
            _ = new BlobServiceClient(ConnectionString);
            return true;
        }
        catch (Exception exception) when (exception is FormatException or ArgumentException or InvalidOperationException)
        {
            return false;
        }
    }
}

/// <summary>The document store could not be reached. Answered as 503; the message
/// is safe to show and to store in <c>INTEGRATION_LOG</c> — it carries no URL.</summary>
public sealed class DocumentStoreUnavailableException : Exception
{
    public DocumentStoreUnavailableException()
        : base("Document storage is unavailable.")
    {
    }

    public DocumentStoreUnavailableException(string message)
        : base(message)
    {
    }

    public DocumentStoreUnavailableException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

/// <summary>
/// Documents in a PRIVATE Azure Blob container — the owner's «CDN» ruling of
/// 2026-10-20 (`P-370`).
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>Private, always.</b> These are personal documents. No SAS and no blob
/// URL ever leaves this class: every download still goes through the API's
/// attachment routes, with their permission checks, content type and
/// <c>nosniff</c>. Readiness fails if the container allows public access.
/// </para>
/// <para>
/// Refs are <c>blob:yyyy/MM/{guid}.ext</c> — the same generated name the volume
/// uses, never the uploaded one. The store can READ whenever a connection
/// string is present, so switching writes back to <c>Local</c> leaves blob
/// refs readable.
/// </para>
/// </remarks>
public sealed partial class AzureBlobDocumentStore : IDocumentStore
{
    private readonly BlobContainerClient? _container;
    private readonly ILogger<AzureBlobDocumentStore> _logger;

    public AzureBlobDocumentStore(IOptions<StorageOptions> options, ILogger<AzureBlobDocumentStore> logger)
    {
        ArgumentNullException.ThrowIfNull(options);
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        var blob = options.Value.AzureBlob;
        if (!string.IsNullOrWhiteSpace(blob.ConnectionString) && !string.IsNullOrWhiteSpace(blob.ContainerName))
        {
            _container = new BlobContainerClient(blob.ConnectionString, blob.ContainerName, ClientOptions(blob));
        }
    }

    /// <summary>Over a given container — the test seam.</summary>
    internal AzureBlobDocumentStore(BlobContainerClient container, ILogger<AzureBlobDocumentStore> logger)
    {
        _container = container;
        _logger = logger;
    }

    public string Scheme => "blob";

    public bool IsConfigured => _container is not null;

    public async Task<string> PutAsync(
        byte[] content, string fileName, string mimeType, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(content);
        var container = _container ?? throw new DocumentStoreUnavailableException();
        var name = FileSystemDocumentStore.NewObjectName(fileName);
        try
        {
            // overwrite: false — a generated name that already exists is a
            // failure, never a silent replacement of someone's document.
            await container.GetBlobClient(name)
                .UploadAsync(new BinaryData(content), overwrite: false, cancellationToken)
                .ConfigureAwait(false);
            return $"blob:{name}";
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !cancellationToken.IsCancellationRequested)
        {
            throw Unavailable("put", exception);
        }
    }

    public async Task<DocumentContent?> GetAsync(string storageRef, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(storageRef);
        if (!storageRef.StartsWith("blob:", StringComparison.Ordinal))
        {
            return null;
        }
        var name = storageRef[5..];
        // A ref is data read back from the database; it does not get to walk
        // out of the container (`../other-container/...`).
        if (!ObjectName().IsMatch(name))
        {
            return null;
        }
        var container = _container ?? throw new DocumentStoreUnavailableException();
        try
        {
            var result = await container.GetBlobClient(name)
                .DownloadContentAsync(cancellationToken).ConfigureAwait(false);
            // The type and display name live on the ATTACHMENT row, as for the volume.
            return new DocumentContent(
                result.Value.Content.ToArray(), "application/octet-stream", Path.GetFileName(name));
        }
        catch (RequestFailedException exception) when (exception.Status == 404)
        {
            LogBlobMissing(_logger, name);
            return null;
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !cancellationToken.IsCancellationRequested)
        {
            throw Unavailable("get", exception);
        }
    }

    /// <summary>Null when the container answers and is private; otherwise why not.</summary>
    public async Task<string?> ProbeAsync(CancellationToken cancellationToken)
    {
        if (_container is null)
        {
            return "Blob storage is not configured.";
        }
        try
        {
            var properties = await _container.GetPropertiesAsync(cancellationToken: cancellationToken)
                .ConfigureAwait(false);
            return properties.Value.PublicAccess is null or PublicAccessType.None
                ? null
                : "The blob container allows public access; personal documents must stay private.";
        }
        catch (Exception exception) when (exception is not OperationCanceledException
            || !cancellationToken.IsCancellationRequested)
        {
            LogFailed(_logger, "probe", exception.GetType().Name, (exception as RequestFailedException)?.Status ?? 0,
                (exception as RequestFailedException)?.ErrorCode);
            return "Blob storage did not answer.";
        }
    }

    private DocumentStoreUnavailableException Unavailable(string operation, Exception exception)
    {
        // Type, status and error code only: an exception message can carry a
        // request URI, and a URI is not something this log gets.
        LogFailed(_logger, operation, exception.GetType().Name,
            (exception as RequestFailedException)?.Status ?? 0, (exception as RequestFailedException)?.ErrorCode);
        return new DocumentStoreUnavailableException();
    }

    private static BlobClientOptions ClientOptions(AzureBlobStorageOptions blob)
    {
        var options = new BlobClientOptions();
        options.Retry.Mode = RetryMode.Exponential;
        options.Retry.MaxRetries = blob.MaxRetries;
        options.Retry.Delay = TimeSpan.FromMilliseconds(500);
        options.Retry.MaxDelay = TimeSpan.FromSeconds(5);
        options.Retry.NetworkTimeout = TimeSpan.FromSeconds(blob.TimeoutSeconds);
        return options;
    }

    [GeneratedRegex(@"^\d{4}/\d{2}/[0-9a-f]{32}(\.[a-z0-9]{1,11})?$", RegexOptions.CultureInvariant)]
    private static partial Regex ObjectName();

    [LoggerMessage(EventId = 5250, Level = LogLevel.Error,
        Message = "Blob storage {Operation} failed ({ExceptionType}, status {Status}, code {ErrorCode}).")]
    private static partial void LogFailed(
        ILogger logger, string operation, string exceptionType, int status, string? errorCode);

    [LoggerMessage(EventId = 5251, Level = LogLevel.Warning,
        Message = "A blob referenced by an attachment is missing: {BlobName}.")]
    private static partial void LogBlobMissing(ILogger logger, string blobName);
}
