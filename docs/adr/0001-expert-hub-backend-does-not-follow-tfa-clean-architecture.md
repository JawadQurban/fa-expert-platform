# ADR-0001: The Expert Hub backend keeps its own layering, and the TFA .NET standard scopes to new projects

**Status:** Proposed
**Date:** 2026-10-01
**Requirement(s) affected:** none directly — this is about how the code is organised, not what it does

## Decision

The Expert Hub API keeps its current three-project layering (`ExpertHub.Core`,
`ExpertHub.Infrastructure`, `ExpertHub.Api`) with minimal-API endpoint modules that
use `ExpertHubDbContext` directly. The TFA .NET standard now loaded from
`context/code-standards.md` applies to **new** .NET projects in this organisation, not
retroactively to this backend. The four rules it states that this backend does not
follow are listed below so no future session treats them as defects to fix.

## Why

The standard prescribes Clean Architecture: a Domain layer referencing nothing, a
separate Application layer holding services, controllers that touch only those
services, DTO-only returns, and `AsNoTracking()` on read queries. This backend was
built differently, on purpose:

| TFA standard | Expert Hub | Why it stays |
|---|---|---|
| Domain / Application / Infrastructure / Api | Core / Infrastructure / Api — no Application layer | Business rules live in static classes that take a `DbContext` (`OfferService`, `AgreementExpiryReminders`, `ApplicationFormLogic`). They are directly testable and the suite drives them that way. An Application layer would add a hop without adding a seam. |
| Controllers call application services only | Minimal-API handlers use `DbContext` directly | The endpoint modules *are* the composition layer, one per capability (CAP-01…CAP-12), traceable to the BRD. Routing them through services would duplicate every handler. |
| Services return DTOs; entities never leave Application | Handlers map entities to `…Wire` records inline | The wire records are the DTO boundary, and they match the frontend's TypeScript contracts one to one. |
| Read queries use `AsNoTracking()` | Rarely used | A genuine gap, but one to close per query, not by changing the global default — a global `NoTracking` default would silently turn every existing tracked update into a no-op. |

Alternatives rejected:

- **Restructure the backend to match the standard.** A four-project refactor of ~30k
  lines, touching every endpoint, on a branch that is in UAT. The cost is a rewrite and
  the benefit is conformance to a document written for greenfield work.
- **Delete the standard from `context/code-standards.md`.** It is useful for the next
  .NET service, and the Academy means to standardise on it. Removing it loses that.
- **Leave the contradiction unrecorded.** The worst option: it is loaded into every
  session, so each new session re-derives the same conclusion, or worse, starts
  "fixing" a working architecture.

## Consequences

- `context/code-standards.md` must say, at the `## .NET standard` heading, that the
  section governs new projects and that this ADR records the Expert Hub exception.
  Without that line the file still reads as binding on this backend.
- The `AsNoTracking()` rule is accepted as a real finding, tracked as ordinary work:
  add it per read query where a measurement justifies it, never as a global default.
- A new .NET service in this repository follows the standard in full, and any further
  exception is a new ADR, not an edit to this one.
- This ADR is **Proposed**, not Accepted: it records a reviewer's reading of the code
  and needs the backend owner's sign-off before it becomes the repository's position.
