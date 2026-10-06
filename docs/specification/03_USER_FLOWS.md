# 03 — User Flows

**Status:** ⬜ Not started · **Depends on:** [02_INFORMATION_ARCHITECTURE](02_INFORMATION_ARCHITECTURE.md)
**Source of truth:** `BRD-TRN-001 v1.0`

> Purpose: expand each end-to-end journey into a step-by-step flow (actors, states, decisions, system reactions). **No UI** — flow logic only. Journeys are defined at a high level in §7 of the Discovery.

---

## Flows to detail

| ID | Flow | Primary actors | Discovery ref |
|----|------|----------------|---------------|
| J1 | Join & Accreditation | Applicant, Screening Mgr, Committee, Internal approvers | §7 J1 |
| J2 | Add a Service (accredited trainer) | Trainer, Manager | §7 J2 |
| J3 | Agreement Lifecycle | System, Manager, Trainer | §7 J3 |
| J4 | Assignment & Execution | Center Coordinator, Trainer Mgmt, Trainer | §7 J4 |
| J5 | Entitlements | System (ERP), Trainer, Trainer Mgmt | §7 J5 |
| J6 | Public Discovery & Visibility | Visitor, Trainer | §7 J6 |
| J7 | Speaker (internal-only) | Trainer Mgmt | §7 J7 |
| J8 | Administration & Governance | Admin, Senior Mgmt | §7 J8 |

## Per-flow template (to complete for each)
- [ ] Trigger / entry point
- [ ] Step sequence with actor + system reaction
- [ ] Decision branches (accept/reject, timeout/SLA)
- [ ] State transitions (reference lifecycle in Discovery §5)
- [ ] Notifications emitted (CAP-07 events)
- [ ] SLA/deadline touchpoints (ref BRD §8.2.7 SLA table)
- [ ] Failure / edge cases

## Key lifecycle references (from BRD)
- **Application:** Draft → Submitted
- **Accreditation (CAP-02):** Received → Initial screening → [accept/reject] → Awaiting interview confirmation → Interview → Interview evaluation → [direct reject / committee] → [approved/rejected] → Agreement prep → Internal approval → Sent → Signed → Approved
- **Agreement (CAP-03):** Active → [pre-expiry alert] → [renew] Renewed / [no renew] Expired
- **Engagement (CAP-05):** Created → Nomination → Shortlist (3) → Center selects/rejects → Offer → [reject → next] / [accept] → (training: upload→approve) / (others: direct) → Confirmed → Documented → Executed
