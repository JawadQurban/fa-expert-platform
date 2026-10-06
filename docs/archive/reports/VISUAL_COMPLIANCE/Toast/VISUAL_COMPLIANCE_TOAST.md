# Visual Compliance Report — Notification Toast (CMP-22)

Comparison of `docs/FIGMA_NOTIFICATION_TOAST_SPECIFICATION.md` against the pre-existing
`frontend/src/design-system/composite/Toast/` implementation (`Toast.tsx`, built pre-workflow,
composing the shared `_shared/NoticeBody`), per `docs/VISUAL_COMPLIANCE_WORKFLOW.md` Step 4.

Near-total mismatch, same severity category as `Alert`/`Avatar` before their own passes — not a
minor-corrections case.

## Discrepancies found

| # | Area | Figma (live-verified) | Pre-existing implementation | Fix required |
|---|---|---|---|---|
| 1 | Featured icon | 40px tone-colored circular icon leading the row | Not implemented at all | Add, tone-mapped (reuse `Alert`'s `TONE_ICON`/`SuccessGlyph` pattern) |
| 2 | Close button | A literal `Button-Close` component instance | An ad-hoc `<button>×</button>` inherited from the shared `NoticeBody` | Compose `<ButtonClose>` directly |
| 3 | Actions | Up to two actions in a dedicated row, transparent/plain-text style (desktop) or solid-fill full-width (mobile) | Not implemented at all — no action slot existed | Add `action`/`secondaryAction` generic slots (matching `Alert`'s API) |
| 4 | Accent stripe | Always-present, tone-colored, 8px, left edge (desktop) / top edge (mobile) | Tone expressed only as a 1px border color — no stripe | Add the stripe element |
| 5 | Tone colors | 5 tones (Neutral/Info/Success/Warning/Error), each with a distinct icon-circle bg/fg + stripe color, live-verified | 4 tones (`info`/`success`/`warning`/`error`, no `neutral`), border-color-only differentiation | Rebuild tone system to match live data; add `neutral` |
| 6 | Title/message color | Generic `--fads-sys-color-text-muted`/inherited | Live-verified `text-display` (title) / `text-primary-paragraph` (message) | Fix to live-verified tokens |
| 7 | Container | Generic `--fads-sys-color-surface-raised`/`--fads-sys-elevation-2`/`--fads-sys-radius-md` (coincidentally correct radius, unverified shadow/bg) | Live-verified `background-notification-white` (`#ffffff`)/exact `shadow-3xl`/`radius-md` | Fix to live-verified, independently-sourced tokens |
| 8 | Width | `min(24rem, 90vw)` (384px cap) on the whole viewport, no distinct component width | 484px desktop / 343px mobile, live-verified | Fix width, add mobile treatment |
| 9 | Mobile layout | Icon+close row, then full-width text row, then stacked full-width solid-fill actions, top-edge stripe | No responsive treatment at all | Add via CSS media query (see spec §5 for the disclosed action-button-variant limitation) |
| 10 | `role="alert"`/`"status"` | N/A — Figma has no ARIA data | Already `role="status"`/`aria-live="polite"` unconditionally | Kept unchanged — reasonable default per `INTERACTION_SPECIFICATION.md` §11, no tone-based override needed for a transient auto-dismissing notice (unlike `Alert`, which is not auto-dismissing and does need one) |

## What is kept unchanged (already correct)

- The auto-dismiss timer (pauses on hover/focus, resumes on leave/blur, `duration={null}`
  disables it) — behavioral logic Figma has no opinion on, already correct.
- `role="status"`/`aria-live="polite"` — appropriate for a transient, non-blocking notice.
- `ToastProvider`'s portal-to-`document.body`, `data-fads-portal` marker, single-instance guard,
  and `useToast()` queue API — unchanged, no Figma-side equivalent to compare against.

## Accessibility notes

- Axe scan required on: every tone, with/without helper text, with/without actions, mobile layout.
- The composed `<ButtonClose>` already carries its own required `label`/`aria-label` contract.

## Required code changes (Step 5 checklist)

1. `scripts/generate-tokens.mjs` — add new additive `--fads-sys-toast-*` tokens (container,
   typography, per-tone icon/stripe colors, spacing), run `npm run tokens:generate`.
2. `Toast.tsx` — rebuild as a self-contained primitive (stop composing `_shared/NoticeBody`, same
   architecture precedent as `Alert`); add `tone="neutral"`, `icon`, `action`, `secondaryAction`;
   compose `<ButtonClose>`; keep the existing timer/pause logic.
3. `Toast.module.css` — full rebuild: icon circle, text block, actions row, accent stripe, mobile
   media-query layout.
4. `ToastProvider.tsx`/`useToast.ts` — extend `ToastOptions` with `action`/`secondaryAction`/`icon`
   passthrough; widen the viewport's `max-inline-size` to the live-verified desktop width.
5. `Toast.stories.tsx` — cover every tone, with/without helper text/actions, mobile layout.
6. `Toast.test.tsx` — extend for the new props; keep all existing timer/pause/dismiss tests
   passing (adjusted only where the dismiss control's accessible-name markup changed).

## Needs Confirmation (non-blocking — see spec §5)

1. Info/Warning tone colors sourced from `get_variable_defs`, not independently re-sampled via
   `get_design_context`.
2. The mobile action-button variant switch (`tertiary`/32px → `secondarySolid`/40px) is not
   automatic for generic `ReactNode` action slots — a disclosed scope limitation.
3. The actions-row's 40px inset doesn't align exactly under the text block; reproduced as sampled.
4. The mobile close-button's exact fractional offset is approximated as a flush corner-anchor.
