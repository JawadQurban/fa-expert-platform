# Responsive Strategy

> DGA requires designs that **adapt to different screen sizes/orientations** and **auto-rearrange columns/components** across **Mobile, Tablet, Desktop**, and be **fully usable on mobile** (touch, viewport, reachable navigation) `[S3: F13, F14]`. Motion must never hide key elements `[S3: E10]`; touch gestures (swipe/long-press/scroll) supported `[S3: E11]`.

---

## 1. Breakpoint model

DGA names three tiers — **Mobile, Tablet, Desktop** `[S3: F13]` — but the **exact pixel thresholds are not machine-verifiable** from `[S1]` (SPA). → **Q3**.

**Working assumption (to confirm, not a DGA claim):**
| Tier | Working range | Grid intent |
|---|---|---|
| Mobile | < 768px | 1 column, stacked |
| Tablet | 768–1023px | 2 columns, condensed nav |
| Desktop | ≥ 1024px | full multi-column grid |

> These placeholders **must be replaced** with the official Platforms Code grid/breakpoint values from the Figma before implementation. Flagged in `QUESTIONS.md` (Q3).

## 2. Reflow rules `[S3: F13]`

| Region | Desktop | Tablet | Mobile |
|---|---|---|---|
| Nav Header | Full horizontal nav + CTA | Condensed | **Nav Drawer** (CMP-02) |
| Hero | Side-by-side text/media | Stacked or reduced | Stacked, single CTA emphasis |
| Criteria (6 cards) | 3-col | 2-col | 1-col |
| Goals | multi-col list | 2-col | 1-col |
| Submit form | comfortable width, inline labels | narrower | single column, labels above |
| Steps indicator | horizontal | horizontal/scroll | vertical or compact |
| Manage table | full table | horizontal scroll or condensed | **card list** fallback |
| Footer | multi-column groups | 2-col | stacked accordion-style |

Tables that cannot fit convert to stacked cards or scroll within a bounded container (never break page layout).

## 3. Touch & interaction `[S3: F14, E11]`
- Minimum touch target **≥44×44px** (aligns with WCAG 2.5.8) — see `ACCESSIBILITY_CHECKLIST.md`.
- Support swipe, long-press, scroll naturally where relevant (e.g., carousels, drawers).
- Hover-only affordances have tap/focus equivalents (tooltips, menus).
- File Uploader drag has a tap/click + keyboard alternative `[S3: C10]` (WCAG 2.5.7).

## 4. Responsive typography `[S3: F7]`
- Use responsive typography measures from the DGA type tokens (Display/Text variants) `[S3: F6]`.
- Text resizes to 200% without loss (WCAG 1.4.4); headings keep hierarchy across tiers.
- ⚠ Exact responsive type scale values → **Q3**.

## 5. Viewport & layout hygiene
- `<meta viewport>` with device-width, no disabled zoom.
- Content reflows at **320px** with no horizontal page scroll (WCAG 1.4.10) — wide content scrolls in its own container.
- Use CSS **logical properties** so RTL/LTR and responsive both work from one ruleset `[S3: F17]`.

## 6. Images & media
- Fluid media (`max-width:100%`); appropriate `srcset` where used; approved icon sizes only (Featured icon >24px) `[S3: F10]`.

## 7. Testing matrix (feeds `TESTING_STRATEGY.md`)
Verify each page at: 320, 375, 768, 1024, 1440px; portrait + landscape; real touch device; RTL and LTR. Confirm no key element hidden behind motion `[S3: E10]`.

## 8. Open items
Q3 (breakpoints, grid, type scale). Until resolved, layouts are built mobile-first with the working ranges above and swapped to official values on confirmation.
