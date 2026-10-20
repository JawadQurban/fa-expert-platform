# Document storage (local volume / Azure Blob)

**Function:** How Expert Hub stores uploaded files (CVs, certificates,
application documents, agreement files, brochures, photos) and the rules
specific to it. Decision `P-370`, ADR `docs/adr/0002-uploaded-documents-in-private-azure-blob-storage.md`.

## Setup / connection

- One seam: `IDocumentStore` (`backend/src/ExpertHub.Infrastructure/Documents/`).
  `DocumentStoreRouter` writes to the configured store and reads by the ref's
  scheme: `blob:` (Azure Blob), `file:` (the volume at `Documents:RootPath`),
  `db:` (`DOCUMENT_BLOB`, the original default).
- `Storage:Provider` picks where new uploads go: `Local` (default, the volume
  when `Documents:RootPath` is set, else the database) or `AzureBlob`.
- Azure settings: `Storage:AzureBlob:ContainerName` (server value
  `rakeeza-container`), `TimeoutSeconds` (per attempt, default 30),
  `MaxRetries` (exponential, default 3), and `ConnectionString`, which is a
  secret. It comes only from `EXPERT_HUB_STORAGE_CONNECTION_STRING` in
  `deploy/env/api.secrets.env`, mapped by compose to
  `Storage__AzureBlob__ConnectionString`.
- `AzureBlob` with no connection string, no container or a malformed string
  stops startup (`ValidateOnStart`), and the message names the variable, never
  its value.
- Package: `Azure.Storage.Blobs` 12.27.0. Later versions pull
  `Microsoft.Extensions.*` 10.x and break the net9 restore (NU1605).

## Conventions

- **The container is private.** No SAS and no blob URL ever reaches the
  browser. Every download goes through the API's attachment routes, which keep
  the permission checks, the type taken from the ATTACHMENT row, `nosniff`, the
  sandbox CSP and inline-or-attachment behaviour (BUG-001). `/health/ready` is
  unhealthy if the container allows public access.
- Blob names are generated (`yyyy/MM/{guid}.ext`), never the uploaded name.
  A `blob:` ref that does not match that shape reads nothing, so a ref cannot
  reach another container.
- A storage failure throws `DocumentStoreUnavailableException`, which the API
  answers as **503** Problem Details (`storage-unavailable`). A missing blob is
  `null`, which the caller turns into a 404.
- Logs carry the operation, exception type, status and error code. They never
  include an exception message or URL, because either can carry a credential.
- Removing or replacing an attachment removes the **link**
  (`APPLICATION_ATTACHMENT`). The ATTACHMENT row and its bytes are kept on
  purpose, as on the volume. Nothing deletes a blob.
- Readiness: the `storage` check on `/health/ready`, and the `storage` row in
  `/api/v1/internal/readiness` (`NOT_CONFIGURED`/`server-volume` on Local).

## Gotchas

- ⚠️ **Files uploaded before the switch stay on the volume.** Their refs say
  `file:` and are read from there, so the documents volume must stay mounted
  after switching to `AzureBlob`. No copy step exists yet (`ponytail:` in
  `DocumentStoreRouter`).
- The blob store can read whenever a connection string is set, even with
  `Provider=Local`. Switching back to Local leaves `blob:` files readable as
  long as the connection string stays configured.
- A blob uploaded in a request whose database save then fails is left orphaned
  (the volume store behaves the same way). It is harmless, because no ref points
  at it.
