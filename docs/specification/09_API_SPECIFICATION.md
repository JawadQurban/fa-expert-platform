# 09 — API Specification

**Status:** ⬜ Not started · **Depends on:** [08_BACKEND_ARCHITECTURE](08_BACKEND_ARCHITECTURE.md)
**Source of truth:** `BRD-TRN-001 v1.0`

> Purpose: define API contracts per capability plus the external integration interfaces (INT-01..05). Group endpoints by capability/bounded context.

---

## Internal API groups (per capability)
- [ ] **CAP-01** Applications — create/draft/submit, add-service, speaker records
- [ ] **CAP-02** Screening — score, schedule interview, evaluate, committee decision, agreement prep/approve/sign
- [ ] **CAP-03** Agreements — activate, renew, suspend/terminate, annex, status history
- [ ] **CAP-04** Profiles — read, self-update, matching feed, speaker management
- [ ] **CAP-05** Assignments — create request, nominate (auto/manual), shortlist, offer, respond, material upload/approve, apology/cancel
- [ ] **CAP-06** Entitlements — read entitlements (portal/internal)
- [ ] **CAP-07** Communication — matrix, templates, deadlines, notification log
- [ ] **CAP-08** Access — roles, permissions matrix, user-role assignment, audit
- [ ] **CAP-09** Analytics — dashboards, reports, export
- [ ] **CAP-10** Public — directory, public profile, consent

## External integration interfaces (INT)
| Ref | System | Direction | Notes |
|-----|--------|-----------|-------|
| INT-01 | Academy Site / SSO | Bidirectional | Identity in, entry-point routing; auth authority |
| INT-02 | Trainee Evaluation | Inbound | Evaluation results → CAP-04 |
| INT-03 | ERP | Inbound | Disbursement per PO → CAP-06 |
| INT-04 | Email Gateway | Outbound | Send + status → CAP-07 |
| INT-05 | FAST | Bidirectional | Trainers out; program/registrants in → CAP-04/05 |

## Contract conventions (to define)
- [ ] Auth: bearer/session from Academy SSO; role scopes
- [ ] Error model + last-known-state semantics for integration reads
- [ ] Pagination/filtering (directory, profile search)
- [ ] Idempotency for integration sync
- [ ] Bilingual payload/formatting rules

> Field-level schemas are blocked on `DM-GAP-01/02/03/05/06/08/09` — see [TODO.md](../archive/expert-hub/TODO.md).
