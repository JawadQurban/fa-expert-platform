/*
 * AUDIT_LOG — append-only, enforced by the DATABASE, not by application
 * discipline (NFR-07, BR-0806).
 *
 * BR-0806 says the trail cannot be edited by anyone, including an
 * administrator. The application's DbContext already refuses updates and
 * deletes, but that only binds code that loads the DbContext — SSMS, a
 * migration script, or any other client is not bound by it. This script makes
 * the rule true at the layer every client shares.
 *
 * Run it once per environment, AFTER migrations, as a privileged principal
 * (dbo / db_owner), against the Expert Hub database. It is written for sqlcmd:
 *
 *   sqlcmd -S <server> -d <database> -v AppPrincipal="expert_hub_app" `
 *          -i audit-log-append-only.sql
 *
 * `AppPrincipal` is the database principal the API connects as. ⚠️ That
 * principal must NOT be db_owner or db_datawriter — a role that grants blanket
 * write would silently re-open what this script closes. Membership in
 * db_datareader is fine for the rest of the schema; write access is granted
 * table by table as capabilities are built.
 *
 * Development note: under LocalDB the developer usually connects as the
 * database owner, which these grants cannot restrict. The grants are the
 * production posture; the DbContext guard is what protects development.
 */

-- The application may add to the trail and read it…
GRANT INSERT, SELECT ON dbo.AUDIT_LOG TO [$(AppPrincipal)];

-- …and nothing else. DENY beats any GRANT the principal might pick up later
-- through a role, which is the point: additive role changes cannot quietly
-- make the audit trail editable.
DENY UPDATE, DELETE ON dbo.AUDIT_LOG TO [$(AppPrincipal)];

-- REFERENCE_VALUE retires by is_active, never by DELETE (`10` §3.1): the same
-- belt-and-braces at the database layer.
DENY DELETE ON dbo.REFERENCE_VALUE TO [$(AppPrincipal)];
