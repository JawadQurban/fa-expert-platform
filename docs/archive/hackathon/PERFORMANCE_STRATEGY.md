# Performance Strategy (FADS)

> Performance budgets, techniques, and measurement for the Financial Academy Design System and its products. **Planning only — no code this phase** `[PROJ]`. Performance is also an accessibility and UX concern: DGA requires responsive, usable-on-mobile experiences with immediate feedback `[S3: F13, F14, E9]`.

---

## 1. Targets (Core Web Vitals + budgets)

| Metric | Target | Rationale |
|---|---|---|
| **LCP** | ≤ 2.5s (mobile, mid-tier) | fast hero/content `[S3: F14]` |
| **INP** | ≤ 200ms | immediate interaction feedback `[S3: E9]` |
| **CLS** | ≤ 0.1 | stable layout; no shifting CTAs (DC-14) |
| **TTI** | ≤ 3.5s (mobile) | usable quickly |
| **Initial JS (gzip)** | budget ≤ ~170KB (route-split) | ⚠ tune after stack finalized |
| **Web font payload** | Arabic+Latin subset, ≤ ~2 files/weight | see §3 |
| **Lighthouse (Perf/A11y/Best-Practices)** | ≥ 90 each | quality gate |

> Budgets are working targets; finalized once the toolchain and DGA assets are integrated (Q3/Q20). Enforced in CI (`TESTING_STRATEGY.md`).

## 2. Rendering & delivery
- **SPA** with route-level **code splitting** (lazy pages) — pay only for the current route.
- **Tree-shakeable** component library; per-component imports so unused components don't ship.
- Defer non-critical work (below-the-fold sections, secondary components CMP-27/28/31) via lazy/idle loading.
- Consider prerender/SSG for the largely-static landing later (⚠Q30) — not required now.

## 3. Font strategy (largest single risk) `[S3: F5]`
- **IBM Plex Sans Arabic**, subset to needed Arabic + Latin glyph ranges.
- `woff2`, `font-display: swap`, **preload** the primary weight to cut LCP.
- Ship **only the weights the type tokens use** (Display/Text variants) — no unused weights.
- Self-host recommended for control/offline demo — ⚠**Q7** (delivery method).

## 4. Images, icons, media
- Official DGA icons via an **SVG sprite / component set**; inline critical icons, lazy the rest; **no resize/recolor** (DC-09).
- Featured icons only where >24px is needed (DC-09).
- Responsive images (`srcset`/`sizes`), modern formats, explicit dimensions to protect CLS.
- Hero media (image/color/object `[S3: T2]`) optimized and preloaded when it is the LCP element.

## 5. CSS & styling cost
- Token-driven styles; logical properties (one ruleset for RTL/LTR — no doubled CSS) (DC-23).
- Prefer zero-runtime styling to avoid CSS-in-JS runtime cost — ⚠Q28.
- Avoid large global stylesheets; scope per component; purge unused.

## 6. RTL & i18n performance `[S3: F16, F17]`
- Logical properties avoid separate RTL/LTR stylesheets.
- **Lazy-load non-active locale** catalogs; load `ar` by default, fetch `en` on toggle.
- Keep translation bundles per-product to limit payload.

## 7. Runtime performance
- Memoize expensive lists (Manage Requests table PAT-02); virtualize long lists/tables if needed (⚠ only if data volume warrants).
- Debounce search/filter inputs (`[S3: E17]`, CMP-33).
- Avoid unnecessary re-renders: stable callbacks, correct keys, provider granularity (`STATE_MANAGEMENT.md §4`).
- Keep INP low: no long tasks on interaction; offload heavy work.

## 8. Caching & network
- Cache static assets (hashed filenames, long max-age).
- Server-state caching via the query layer (`STATE_MANAGEMENT.md §2`) reduces refetching.
- Mock adapter simulates realistic latency so loading states (CMP-31) are validated pre-backend (Q2).

## 9. Accessibility ↔ performance
- `prefers-reduced-motion` respected (DC-14) — lighter animation path.
- Fast, stable layout aids low-vision/cognitive users (`USER_PERSONAS.md` A3/A5).
- No content hidden behind heavy animation `[S3: E10]`.

## 10. Measurement & governance
- **CI:** Lighthouse CI + bundle-size budget check on each build.
- **Field:** Core Web Vitals monitoring in production (⚠ tooling Q31).
- **Regression gate:** budget breach fails CI (`TESTING_STRATEGY.md §8`).
- Track per-route bundle sizes; review on each component addition.

## 11. Definition of Done (performance)
- [ ] Route-level code splitting in place
- [ ] Font subset + preload + swap; only used weights
- [ ] Icons/images optimized; CLS-safe dimensions
- [ ] Non-active locale lazy-loaded
- [ ] CWV targets met on mid-tier mobile
- [ ] Lighthouse ≥ 90 (Perf/A11y/Best-Practices)
- [ ] Bundle budgets enforced in CI

## 12. Open items
Q3/Q20 (asset sizes depend on real tokens/fonts), Q7 (font delivery), Q28 (styling tech), Q30 (SSG/prerender), Q31 (RUM tooling). See `QUESTIONS.md`.
