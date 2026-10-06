# Visual Compliance Report — Vertical Tab / Vertical Tab List (CMP-09b)

Comparison of `docs/FIGMA_VERTICAL_TAB_SPECIFICATION.md` against the (nonexistent) pre-existing
implementation, per `docs/VISUAL_COMPLIANCE_WORKFLOW.md` Step 4. Registry status was `Missing` —
**no prior code, spec, or compliance report existed** for this row, unlike `Horizontal Tab`
(which had a pre-workflow placeholder to compare against). This report instead documents the
findings that shaped the implementation and its relationship to the already-Approved
`Horizontal Tab`.

## Design decision: extend `Tabs`, don't create a new component

The registry's own original notes on this row (`docs/COMPONENT_APPROVAL_MATRIX.md`, pre-dating
this pass) read: *"our `Tabs` has no `orientation="vertical"` mode."* Live verification confirms
this is the correct architecture, not just a naming convenience — Vertical Tab is officially the
same Figma component family as Horizontal Tab (CMP-09b, "a new axis of CMP-09"), sharing the
identical `Tab/*` Figma variable group (colors, hover/pressed/focus mechanics, radius) byte-for-
byte. Building a separate `VerticalTab` component would duplicate all of that shared logic for no
compliance benefit. `Tabs` gained a new `orientation?: 'horizontal' | 'vertical'` prop (default
`'horizontal'`, fully backward compatible — no existing consumer passes `orientation` today).

## What is new vs. reused (see spec §1 for the full comparison table)

**Reused directly from the already-Approved Horizontal Tab token set** (confirmed byte-identical
via `get_variable_defs`, not assumed): `--fads-sys-tabs-text-color-selected/-unselected/-disabled`,
`--fads-sys-tabs-indicator-color/-disabled/-preview`, `--fads-sys-tabs-background-hover/-pressed`,
`--fads-sys-tabs-focus-ring-*` (all 5), `--fads-sys-radius-sm`, `--fads-sys-tabs-gap`,
`--fads-sys-typography-text-sm/-line-height-sm`, `--fads-sys-typography-text-md/-line-height-md`,
`--fads-ref-font-weight-regular/-medium/-semibold`.

**New, additive `--fads-sys-tabs-vertical-*` tokens** (values with no exact match in the
horizontal token set): per-size padding (Small/Medium/Large each have distinct inline/block
values not shared with Horizontal Tab's own scale), and per-size indicator vertical inset
(4px Small, 8px Medium+Large).

**New behavior, not present on Horizontal Tab:**
- Column layout instead of row.
- Indicator renders as a full-height inline-start-edge bar (`inline-size` + `inset-block` in CSS)
  instead of a full-width bottom-edge bar.
- Selected uses Semibold(600)/text-md-for-Large instead of Bold(700)/text-sm-uniform.
- `ArrowUp`/`ArrowDown` move focus instead of the RTL-aware `ArrowLeft`/`ArrowRight` (not
  direction-sensitive, since vertical movement doesn't mirror under RTL).
- `aria-orientation="vertical"` on the `tablist` (WAI-ARIA APG requirement for a vertical tablist
  — not something Figma has an opinion on, verified independently).

**Not implemented (confirmed absent from the live 68-variant set):** a `moreTab`-equivalent
overflow trigger. `overflow-y: auto` is used instead for a vertical list that exceeds its
container, matching the same non-invented interpretation already used for Horizontal Tab's own
`overflow-x: auto`.

**Live-sampled quirk, reproduced faithfully, not corrected:** Disabled+Selected renders in
Medium(500) weight — matching neither the enabled-Selected (Semibold) nor enabled-Unselected
(Regular) weight. Implemented exactly as sampled per the Visual Compliance Rule.

## Accessibility notes

- Axe scan required on: vertical orientation default, with icon, disabled, focus-visible, RTL.
- `role="tablist"` + `aria-orientation="vertical"`; individual `role="tab"` semantics, roving
  `tabindex`, and `aria-selected`/`aria-controls` are unchanged from the horizontal implementation
  (same underlying logic, just a different arrow-key mapping).

## Required code changes (Step 5 checklist)

1. `scripts/generate-tokens.mjs` — add 8 new additive `--fads-sys-tabs-vertical-*` tokens (3
   sizes × padding-inline/-block = 6, + 2 indicator-inset values), run `npm run tokens:generate`.
2. `Tabs.tsx` — add `orientation` prop; swap `ArrowRight`/`ArrowLeft` for `ArrowDown`/`ArrowUp`
   when vertical; add `aria-orientation`.
3. `Tabs.module.css` — add `[data-orientation='vertical']` rules for layout direction, per-size
   padding, indicator geometry/positioning, and the Semibold/Regular/text-md-Large typography
   differences; reproduce the Disabled+Selected weight quirk exactly.
4. `Tabs.stories.tsx` — add vertical-orientation stories (default, sizes, icons, RTL).
5. `Tabs.test.tsx` — add `ArrowDown`/`ArrowUp` navigation tests and `aria-orientation` assertion
   for the vertical mode; keep all existing horizontal-mode tests passing unmodified.

## Needs Confirmation (non-blocking — see spec §5)

1. Disabled+Unselected weight — extended by analogy, not independently sampled.
2. No overflow-trigger equivalent exists for vertical; `overflow-y: auto` used instead.

## §6 Addendum — Vertical Tab List re-verification (node `418:100259`)

Live-verified in a follow-up pass once Vertical Tab reached Approved (unblocking this dependent
row). Sampled Medium/`tabIcons=True`, Small/`tabIcons=False`, and the RTL/Medium/`tabIcons=True`
composition (see spec §6 for the full structural findings).

**Finding: no code changes were required.** Unlike Horizontal Tab List (which needed a real
`divider` element and a `flush` prop added on top of the individual Horizontal Tab), Vertical Tab
List's live structure — a plain `flex flex-col` column, no inter-tab gap, **no divider element at
all** (not a toggleable prop defaulting off; genuinely absent from the component), no
`flush`-equivalent prop, and full-width tabs — is already exactly what the existing
`orientation="vertical"` implementation produces:

- Column layout: already `flex-direction: column` under `[data-orientation='vertical']`.
- No divider: `divider` already renders nothing when `orientation === 'vertical'` (a decision made
  during the original Vertical Tab pass, before this row's own list-level data was available —
  confirmed correct in hindsight, not adjusted).
- No inter-tab gap: `.listRow` already has no `gap` declaration.
- Full-width tabs: `.list[data-orientation='vertical'] .listRow { align-items: stretch }` already
  present.
- `tabIcons`: a per-list Figma convenience already achievable via this codebase's existing
  per-item `TabItem.icon` prop — no new API surface needed.
- RTL: the indicator's logical `inset-inline-start` already flips to the visual right edge
  automatically; no DOM reordering needed (same finding already established for every other
  Tabs axis).

No new tokens, no `Tabs.tsx`/`Tabs.module.css` changes. This pass added: spec §6 (this
component's own structural documentation), this addendum, and Storybook coverage
(`VerticalMultiTabList`, `VerticalNoIcons`) demonstrating the composed list matches the live
Figma reference exactly.

3. Vertical Tab List's own list-level chrome — **resolved this pass, no longer open** (see above).
