# Visual Compliance Report — Modal (CMP-25)

Comparison of `docs/FIGMA_MODAL_SPECIFICATION.md` against the pre-existing
`frontend/src/design-system/composite/Modal/` implementation (`Modal.tsx` / `Modal.module.css`,
built pre-workflow, Phase 5C, hardened Phase 5.6). **No code changes in this file** — comparison
only, per `docs/VISUAL_COMPLIANCE_WORKFLOW.md` Step 4.

Unlike `Alert`/`Avatar`/`Tabs` before their own passes, the pre-existing Modal's **behavioral**
architecture (portal, focus trap + restore, `Esc`-closes, scrim-click dismiss, `inert`
background-isolation, `aria-modal`/`aria-labelledby`) is already correct and Figma has no opinion
on any of it — this is a **visual/structural** compliance pass, not a behavioral rebuild.

## Discrepancies found

| # | Area | Figma (live-verified) | Pre-existing implementation | Fix required |
|---|---|---|---|---|
| 1 | Close button | A literal `Button-Close` component instance (32×32, `size="md"`), absolutely positioned `-10px` from the header's own top/inline-end edge | A hand-drawn `<button>×</button>` with a literal "×" character, no shared styling with the already-Approved `ButtonClose` primitive | Compose `<ButtonClose>` instead |
| 2 | Featured icon | 40×40 circle (`background-neutral-50`) with a 20px icon, leading the title row | Not implemented at all | Add an optional `icon` slot |
| 3 | Title color | `Text/text-display` (`#1f2a37`) | No explicit color set on `.title` — inherits ambient/default text color | Set the live-verified color |
| 4 | Body text color | `Text/text-primary-paragraph` (`#384250`) | `var(--fads-sys-color-text-default)` (a darker, generic token) | Fix to the live-verified color |
| 5 | Spacing model | Asymmetric: 8px header-to-body gap, but 24px body-to-actions gap (8px flex gap + a separate 16px `padding-block-end` on the body) | A single flat `gap: var(--fads-sys-space-stack-md)` applied uniformly between all three sections | Replicate the asymmetric spacing |
| 6 | Container radius | `Radius/radius-md` (8px) | `var(--fads-sys-radius-lg)` (a larger, generic radius) | Fix to 8px |
| 7 | Container padding | `Model/modal-padding` (24px) | `var(--fads-sys-space-inset-lg)` (generic, unverified value) | Fix to the live-verified 24px token |
| 8 | Container shadow | `Shadows/shadow-3xl` — `0px 32px 64px -12px rgba(16,24,40,0.14)` | `var(--fads-sys-elevation-2)` (a generic, unverified shadow) | Fix to the live-verified shadow |
| 9 | Container width | 600px desktop / 320px mobile | `min(30rem, 100%)` (480px) — neither live-verified width | Fix to 600px, add a mobile-width/stacking treatment |
| 10 | Actions row gap | `Button/buttons-group-gap` (8px) | `var(--fads-sys-space-inline-sm)` (generic, unverified value) | Fix to the live-verified 8px token |
| 11 | Mobile action stacking | Actions stack `flex-col`, full width, gap 8px, at the `mobile=True` variant | No responsive behavior for the footer at all | Add a small-viewport stacked/full-width treatment |
| 12 | Close-button positioning under RTL | Logical: flips from `inset-inline-end` to `inset-inline-start` automatically | N/A — button wasn't positioned via CSS offsets at all (inline in the header's flex row) | Position via logical properties so it flips correctly |

## What is kept unchanged (already correct)

- Portal to `document.body`, focus trap + focus-restore-to-trigger (`useFocusTrap`), `Esc`-key
  close, scrim-click dismiss gated by `dismissOnScrimClick`, background `inert` isolation
  (WCAG 4.1.2) with the `data-fads-portal` exemption for sibling FADS overlays, `aria-modal="true"`
  + `aria-labelledby`. None of this has a Figma-side equivalent to compare against — verified
  independently against WAI-ARIA APG / WCAG, not against Figma, same reasoning already applied to
  `Tabs`'s own keyboard logic.
- The generic `footer: ReactNode` slot (not replaced with structured `primaryAction`/
  `secondaryAction`/`tertiaryAction` props) — a real, already-shipped consumer
  (`ConfirmActionModal.tsx`) depends on `footer` accepting arbitrary `Button` compositions
  (including a `destructive` primary variant that has no equivalent axis in Figma's own generic
  Modal demo at all). Forcing a structured-slot API would be a breaking change for no compliance
  benefit — Figma's `_Modal Actions` sub-component's exact Primary/Secondary/Tertiary
  variant-mapping is instead documented here and demonstrated in a new `OfficialFigmaReference`
  story, as **composition guidance**, not a new required prop shape.

## Composition guidance for `footer` (new finding, not a code change)

Live token comparison confirms: **Primary Action** (`#0d121c` solid fill) is byte-identical to
this repo's already-Approved `Button` `variant="neutral"` (`--fads-sys-button-neutral-bg-default`
is the same `#0d121c`) — **not** `variant="primary"` (brand green). **Secondary**/**Tertiary
Action** (`border-neutral-primary` outline, transparent fill) matches `Button`
`variant="secondary"` — **not** `variant="tertiary"` (borderless on this repo's `Button`). This is
disclosed guidance for consumers building a non-destructive Modal footer; it does not affect
`ConfirmActionModal`'s own deliberate `destructive` choice.

## Accessibility notes

- Axe scan required on: default (no icon), with icon, with `footer`, RTL.
- The composed `<ButtonClose>` already carries its own required `label`/`aria-label` contract
  (Approved primitive) — `Modal`'s existing `dismissLabel` prop passes straight through.

## Required code changes (Step 5 checklist)

1. `scripts/generate-tokens.mjs` — add new additive `--fads-sys-modal-*` tokens (container
   padding/radius/shadow/width, header gap, body bottom-padding, actions gap, title/body colors),
   run `npm run tokens:generate`.
2. `Modal.tsx` — add optional `icon` prop; replace the ad-hoc `×` button with `<ButtonClose>`.
3. `Modal.module.css` — fix radius/padding/shadow/width, title/body colors, asymmetric spacing,
   logical close-button positioning, mobile action stacking.
4. `Modal.stories.tsx` — add `WithIcon` and `OfficialFigmaReference` (demonstrating the
   `neutral`/`secondary` `Button` variant composition guidance) stories.
5. `Modal.test.tsx` — extend for the composed `ButtonClose` (still closes on activation) and the
   new `icon` slot; keep all existing behavioral tests passing unmodified.

## Needs Confirmation (non-blocking — see spec §3)

1. Featured-icon default glyph — no fixed default, `icon` stays a fully optional consumer slot.
2. Mobile breakpoint value — Figma's `mobile` axis has no tied numeric viewport width; a
   conventional small-viewport media query is used instead.
3. Action-button icons — generic Figma demo content, not a required per-action icon rule.
