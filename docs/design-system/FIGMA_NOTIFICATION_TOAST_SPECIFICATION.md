# Figma Notification Toast — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set **Notification Toast** (node `8680:37527`), category "Feedback &
Overlays". CMP-22, part of the `PAT-06` notification system alongside the already-Approved
**Alert** ("Inline Alert", CMP-23) and the separate, not-yet-processed **Notification** (page
banner).

**Registry:** `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus: "pending"` — a
workflow-progress marker; per `CLAUDE.md`'s node resolution policy the stored node was used
directly). Live-verified via `get_metadata` + `get_design_context` (`disableCodeConnect: true`) +
`get_variable_defs`; flipped to `"resolved"` on success.

**Design documentation:** https://design.dga.gov.sa/guidelines/components/feedback/notification

20 variants (`rtl` × `type`[Neutral/Info/Critical-Error/Warning/Success] × `mobile`). Sampled
directly: Neutral/Desktop, Success/Desktop, Critical-Error/Desktop, Neutral/Mobile. Info/Warning
extended by analogy from the shared `get_variable_defs` output (see §5).

---

## 1. Structure — substantially richer than the pre-existing implementation

The pre-existing `Toast` (built pre-workflow) was a plain title/message/dismiss box composing the
shared `_shared/NoticeBody` — no featured icon, no actions, no accent stripe, tone expressed only
as a thin border color. The live component matches **Alert's own already-Approved structure**
almost exactly (same `PAT-06` family): a 40px circular **featured icon** (tone-colored), a title +
optional helper text, up to **two actions**, a **`Button-Close`** dismiss control (a literal
component instance, not an ad-hoc "×"), and an **always-present tone-colored accent stripe** along
the leading edge. A real official `mobile` variant restructures the layout — same pattern already
established for `Alert`/`Modal`.

| Region | Desktop | Mobile |
|---|---|---|
| Icon + text + close | one row, `items-start`, gap 12px | icon + close in one row; title/helper text in a **separate** full-width row below |
| Close button | inline in the row (not floating) | absolutely positioned at the row's top/inline-end corner |
| Actions | one row, `justify-start`, inset by 40px (`spacing-5xl`, roughly aligning under the text — not exactly under it, live-verified as sampled not "corrected"), each button 32px tall, **transparent/plain-text** style | stacked full-width column, each button **40px tall with a solid light-gray fill** (`button-background-neutral-default` `#f3f4f6`) |
| Accent stripe | vertical, left edge, 8px wide, full height | horizontal, top edge, 8px tall, full width |
| Container padding-inline | 24px (`notification-toast-desktop-h-padding`) | 16px (`notification-toast-mobile-h-padding`) |

Container: `background-notification-white` (`#ffffff`), `radius-md` (8px), `Shadows/shadow-3xl`
(`0px 32px 64px -12px rgba(16,24,40,0.14)` — same exact value as Modal's, independently sourced
per the no-cross-component-aliasing policy), width 484px desktop / 343px mobile.

## 2. Action button styling — a real, live-verified finding

Desktop action buttons render with **no border and no fill** (`color: text-default #161616`,
Medium/500 weight) — matches this repo's already-Approved `Button` `variant="tertiary"` exactly
(transparent in every state). Mobile action buttons render with a **solid light-gray fill**
(`#f3f4f6`) at 40px height — matches `Button` `variant="secondarySolid"` `size="lg"` exactly
(`--fads-sys-button-secondary-solid-bg-default` is the same `#f3f4f6`, confirmed via direct token
comparison). This desktop/mobile variant *switch* is a real behavior a generic `action: ReactNode`
slot cannot automatically apply — disclosed as a scope limitation (see §5).

## 3. Featured icon per tone (live-verified glyphs + colors)

| Tone | Icon glyph (live component description) | Icon-circle background | Icon-circle foreground |
|---|---|---|---|
| Neutral | `information-circle` (same glyph as Info, neutral-tinted background) | `background-neutral-50` `#f9fafb` | `Icon/icon-default` `#161616` |
| Info | `information-circle` (extended by analogy from Neutral's identical glyph reference — not independently re-sampled) | `Icon/background-info-light` `#eff8ff` | `Icon/icon-info` `#175cd3` |
| Success | hand-authored checkmark (Figma's own `checkmark-circle-02` glyph is not in this repo's Icon registry — same disclosed gap already found for `Alert`, reuses `Alert`'s exact `SuccessGlyph` path) | `Icon/background-success-light` `#ecfdf3` | `Icon/icon-success` `#067647` |
| Warning | `alert-diamond` (extended by analogy from `Alert`'s own live-verified choice — not independently sampled for Toast) | `Icon/background-warning-light` `#fffaeb` | `Icon/icon-warning` `#b54708` |
| Error (`Critical/Error`) | **`alert-02`** (live-verified — genuinely different from `Alert`'s own `alert-circle` choice for the same tone, not an approximation) | `Icon/background-error-light` `#fef3f2` | reused from the shared `--fads-sys-color-status-error` tone token (the raster icon export has no extractable foreground color) |

## 4. Accent stripe colors (live-verified via `get_variable_defs` + direct tone samples)

| Tone | Stripe color |
|---|---|
| Neutral | `Background/background-neutral-200` `#e5e7eb` |
| Info | `Background/background-info` `#1570ef` (from `get_variable_defs`, not independently re-sampled) |
| Success | `Background/background-success` `#079455` (live-sampled) |
| Warning | `Background/background-warning` `#dc6803` (from `get_variable_defs`, not independently re-sampled) |
| Error | `Background/background-error` `#d92d20` (live-sampled) |

All stripes render at `opacity: 0.7` (live-verified, every sample).

## 5. Needs Confirmation

1. **Info and Warning tones** — colors sourced from `get_variable_defs` (a real, live call against
   this component's own node), but not independently re-sampled via `get_design_context` the way
   Neutral/Success/Error were. Extended by analogy; flagged non-blocking per the same category of
   disclosure already used for other components' partial-axis sampling (e.g. `TextInput`'s
   `OfficialFigmaMatrix`).
2. **Mobile action-button variant switch is not automatic.** `action`/`secondaryAction` are
   generic `ReactNode` slots (matching `Alert`'s own established API) — a consumer's
   `<Button variant="tertiary" size="md">` will not automatically become
   `variant="secondarySolid" size="lg"` at the mobile breakpoint. The container layout (icon/close
   row reorg, stripe orientation, padding) responds correctly via CSS; the action button's own
   internal variant does not. Same category of disclosed responsive limitation as `Header`'s own
   tablet-zone approximation.
3. **Actions-row 40px inset** (`spacing-5xl`) does not exactly align under the text block's own
   left edge (icon 40px + gap 12px = 52px) — reproduced exactly as sampled, not "corrected."
4. **Mobile close-button exact offset** — the live absolute-position sample (`left:287px` in a
   343px frame) doesn't cleanly resolve to a round token value; implemented as a flush
   corner-anchor (`inset-block-start: 0; inset-inline-end: 0`) rather than replicating the exact
   fractional pixel offset.
