/*
 * M37 PRE-FLIGHT — run this BEFORE deploying migration M37LiveRowUniqueness
 * against a database that already holds real data.
 *
 * M37 adds four FILTERED UNIQUE indexes. Creating a unique index fails if the
 * data already violates it, and the migration runs at API startup
 * (`Database__AutoMigrate`), where a failure is logged and the process keeps
 * serving — so a violation would show up as "the index is silently not there",
 * which is the one outcome worse than a loud failure.
 *
 * Every query below must return ZERO rows. A row means two "live" records that
 * the product's own rules say cannot both exist, created by a race before the
 * index existed. Each needs a business decision — which one survives — not a
 * blind DELETE: an offer somebody accepted, an engagement somebody delivered and
 * a signing chain somebody signed are all evidence.
 *
 *   sqlcmd -S <server> -d <database> -i m37-live-row-uniqueness-preflight.sql
 *
 * A fresh database and the test databases pass trivially.
 */

SET NOCOUNT ON;

/* 1 — more than one offer awaiting a response on the same slot (J-18 offers a
 *     slot to one candidate at a time). */
SELECT 'ASSIGNMENT_OFFER' AS [table], slot_id AS [key], COUNT(*) AS live_rows
FROM ASSIGNMENT_OFFER
WHERE status = 'awaiting_response'
GROUP BY slot_id
HAVING COUNT(*) > 1;

/* 2 — more than one engagement on the same slot that is neither withdrawn nor
 *     cancelled (one person delivers a slot). */
SELECT 'ENGAGEMENT' AS [table], slot_id AS [key], COUNT(*) AS live_rows
FROM ENGAGEMENT
WHERE status <> 'withdrawn' AND status <> 'cancelled'
GROUP BY slot_id
HAVING COUNT(*) > 1;

/* 3 — more than one un-voided signing chain on the same agreement (a restarted
 *     run voids the previous chain; it does not leave two current ones). */
SELECT 'SIGNING_SEQUENCE' AS [table], agreement_id AS [key], COUNT(*) AS live_rows
FROM SIGNING_SEQUENCE
WHERE voided_at IS NULL
GROUP BY agreement_id
HAVING COUNT(*) > 1;

/* 4 — more than one draft application for the same applicant (`BR-0101`). Of
 *     the four, this is the one a double-click could plausibly have produced in
 *     ordinary use. */
SELECT 'APPLICATION' AS [table], applicant_user_id AS [key], COUNT(*) AS live_rows
FROM APPLICATION
WHERE status = 'draft'
GROUP BY applicant_user_id
HAVING COUNT(*) > 1;

/*
 * AFTER the deployment, confirm all four indexes exist and are filtered — an
 * index EF believes in but the database does not have enforces nothing:
 */
SELECT t.name AS [table], i.name AS [index], i.is_unique, i.filter_definition
FROM sys.indexes i
JOIN sys.tables t ON t.object_id = i.object_id
WHERE i.name IN (
    'UX_ASSIGNMENT_OFFER_slot_id_live',
    'UX_ENGAGEMENT_slot_id_live',
    'UX_SIGNING_SEQUENCE_agreement_live',
    'UX_APPLICATION_applicant_draft')
ORDER BY t.name;
/* Expect four rows, is_unique = 1, each with a filter_definition. */
