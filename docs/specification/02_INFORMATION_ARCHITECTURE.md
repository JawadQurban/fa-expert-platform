# 02 — Information Architecture

**Status:** ⬜ Not started · **Depends on:** [01_PRODUCT_DISCOVERY](01_PRODUCT_DISCOVERY.md)
**Source of truth:** `BRD-TRN-001 v1.0`

> Purpose: define the navigation model, content hierarchy, and entity map across the three interfaces. **No UI design** — structure only.

---

## 1. Interface Map (3 interfaces, 1 core)

| Interface | Audience | Owning capabilities |
|-----------|----------|---------------------|
| **Trainer Portal** | Applicants, Trainers, approved collaborators | CAP-01, CAP-03, CAP-04, CAP-05, CAP-06, CAP-10 (consent) |
| **Internal Dashboard** | Trainer Mgmt, Committee, Center Coordinators, Admin, Senior Mgmt | CAP-01→CAP-09 (operational) |
| **Public Interface** | Unauthenticated visitors | CAP-10 |

## 2. Navigation Model (to complete)
- [ ] Trainer Portal top-level sections (e.g., Applications, Profile, Assignments, Entitlements, Metrics, Visibility)
- [ ] Internal Dashboard top-level sections (Applications, Screening, Committee, Agreements, Profiles, Assignments, Entitlements, Notifications, Deadlines, Access, Analytics, Integrations)
- [ ] Public Interface sections (Landing, Trainer Directory)
- [ ] Role-based visibility rules per section (ref CAP-08)

## 3. Entity → Interface mapping (to complete)
- [ ] Map each owned entity (from §5 of Discovery) to the interfaces that display/manage it

## 4. Content hierarchy & taxonomy (to complete)
- [ ] Service taxonomy (5 services) and specialty taxonomy (feeds directory filter + matching)
- [ ] Status vocabularies per lifecycle (application, agreement, engagement)

## 5. Cross-references
- Personas → §4 of Discovery · Capabilities → §5 · Journeys → §7
