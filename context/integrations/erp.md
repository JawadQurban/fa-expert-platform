# ERP — INT-03, financial entitlements

**Function:** How the Academy's ERP data reaches CAP-06, and why nothing here
writes.

## Setup / connection

- `ErpEntitlementImporter`
  (`backend/src/ExpertHub.Infrastructure/Entitlements/`) is the only
  type that may write the entitlement tables. It mirrors purchase orders and
  projects them into `ENTITLEMENT`.
- No live ERP connection exists yet; the importer is the seam that one will plug
  into.

## Conventions

- **CAP-06 is read-only in both directions** (`BR-0601`, `P-127`): no person may
  enter or edit an entitlement «بأي حال». That is structural, not a check — the
  writable `DbSet`s (`ErpPurchaseOrderWrites`, `EntitlementWrites`) are
  `internal`, so the API assembly cannot reach them at all. The public surface is
  `IQueryable` and already `AsNoTracking()`.
- Two read routes only: the trainer's own entitlements, and the staff view of
  anyone's behind `F-0602`. There is no third, and no write path anywhere.
- ERP is the master; `REPLICATION_STATE` records drift rather than letting Expert
  Hub "correct" a figure.

## Gotchas

- A staff role granted `F-0602` at **centre** scope currently reads as "all":
  the scope narrowing is not implemented for this route. Keep that in mind before
  granting it at centre scope.
- Money is reported, never computed here. If a figure looks wrong, the answer is
  in ERP or in the import, never a local adjustment.
