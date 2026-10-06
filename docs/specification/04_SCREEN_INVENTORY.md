# 04 — Screen Inventory

**Status:** ⬜ Not started · **Depends on:** [03_USER_FLOWS](03_USER_FLOWS.md)
**Source of truth:** `BRD-TRN-001 v1.0`

> Purpose: enumerate every screen per interface, its owning capability, the role(s) that access it, and its states (empty / loading / error / populated). Derived from user stories (US-xxxx) and flows.

---

## Inventory table (to complete)

| Screen ID | Interface | Capability | Screen name | Roles | Source US | States |
|-----------|-----------|------------|-------------|-------|-----------|--------|
| _TBD_ | Trainer Portal | CAP-01 | Submit Application | Applicant | US-0101/0102/0103/0104 | draft, validating, submitted |
| _TBD_ | Internal | CAP-01 | Internal Nomination | TM Employee | US-0105 | … |
| _TBD_ | Internal | CAP-02 | Initial Screening | Screening Mgr | US-0201/0203/0204 | … |
| _TBD_ | Internal | CAP-02 | Committee Decision | Committee | US-0208/0209/0210 | … |
| _TBD_ | Trainer Portal | CAP-02 | Interview Slot / Sign Agreement | Applicant | US-0205/0215 | … |
| … | … | … | … | … | … | … |

## Method
- [ ] Walk each capability's User Stories (BRD §8.x.5) and derive screens
- [ ] Tag each screen: interface, capability, roles (CAP-08), read/write
- [ ] Note shared/reused screens across capabilities
- [ ] Define standard state set per screen type (list, form, detail, dashboard)

## Coverage checklist (capabilities with UI)
- [ ] CAP-01 · [ ] CAP-02 · [ ] CAP-03 · [ ] CAP-04 · [ ] CAP-05 · [ ] CAP-06 · [ ] CAP-07 · [ ] CAP-08 · [ ] CAP-09 · [ ] CAP-10
