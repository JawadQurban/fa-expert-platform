# 07 — Frontend Architecture

**Status:** ⬜ Not started · **Depends on:** [06_UI_SPECIFICATIONS](06_UI_SPECIFICATIONS.md)
**Source of truth:** `BRD-TRN-001 v1.0`

> Purpose: define app structure, routing, state management, i18n/RTL, and integration with the auth/identity layer. Should align with existing repo frontend docs (`docs/REACT_ARCHITECTURE.md`, `docs/STATE_MANAGEMENT.md`, `docs/RESPONSIVE_STRATEGY.md`).

---

## Key constraints (from BRD)
- **Three interfaces, one core** — decide: single app with role-based shells vs. separate apps (Trainer Portal / Internal Dashboard / Public).
- **Auth delegated** to Academy SSO (INT-01); no credential handling in-platform (`NFR-06`). Session/identity consumed, roles resolved via CAP-08.
- **Bilingual AR/EN + RTL** first-class (`NFR-26/27/28`); persist language preference.
- **DGA design system** as component library (`NFR-34`).
- **Near-real-time** dashboard data (`NFR-02`).

## To define
- [ ] App topology (mono-app vs. multi-app) + rationale → log in [DECISIONS.md](../DECISIONS.md)
- [ ] Routing map per interface (from [02_INFORMATION_ARCHITECTURE](02_INFORMATION_ARCHITECTURE.md))
- [ ] State management strategy (server cache vs. client state)
- [ ] i18n/RTL implementation approach
- [ ] Auth/session integration flow with Academy SSO
- [ ] Role-based rendering & route guards (CAP-08)
- [ ] Real-time/near-real-time data strategy for dashboards
- [ ] Reuse of existing repo frontend scaffolding
