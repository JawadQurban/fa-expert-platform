# ADR-0002: Uploaded documents in a private Azure Blob container

**Status:** Accepted
**Date:** 2026-10-20
**Requirement(s) affected:** `G26` (where documents are stored), `P-208`, `P-370`

## Decision

Uploaded documents can be stored in a **private** Azure Blob Storage container,
selected by `Storage:Provider=AzureBlob`. They go behind the existing
`IDocumentStore` seam as a third store (`blob:` refs), next to the volume
(`file:`) and the database (`db:`). The browser never receives a blob URL or
SAS token. Every download still goes through the API.

## Why

- The owner ruled on 2026-10-20 to move files to Azure (he called it "CDN").
  `P-208` had kept them on the server volume until then.
- The files are personal documents (CVs, IDs, certificates, agreements), so
  "CDN" in the public sense is not acceptable. Serving through the API keeps
  the permission checks, checksums, content-type rules and `nosniff`/CSP
  headers that already exist. A direct or SAS link would bypass all of them.
- The seam already existed, with scheme-prefixed refs. Adding a store meant
  one class and one configuration switch, with no migration.
- **Existing files: read by scheme, no copy.** A `file:` ref keeps resolving
  from the volume. A one-off copy script would also need to rewrite
  `ATTACHMENT.storage_ref`, and it is not needed to switch safely.
  Alternatives rejected: a copy script now (more moving parts on the day of the
  switch), and "try blob, then the volume" (refs already say where the file is).

## Consequences

- The `expert-hub-api-documents` volume **must stay mounted** after the switch,
  for as long as any `file:` ref exists. Retiring it later needs a copy that
  uploads each file and rewrites its ref.
- A new secret, the storage connection string, lives only in
  `deploy/env/api.secrets.env`. A test fails the build if an account key or SAS
  signature appears in a tracked file.
- `/health/ready` gains a `storage` check. With AzureBlob it probes the
  container and fails if the container allows public access.
- A storage outage returns 503 on uploads and downloads. It is not a 500.
- Backups: blob data is no longer covered by the volume backup. It needs the
  storage account's own protection (soft delete or versioning). _Needs
  Confirmation_ from infrastructure.
