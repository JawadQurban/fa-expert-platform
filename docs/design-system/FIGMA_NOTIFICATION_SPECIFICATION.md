# Figma Notification — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set **Notification** (node `30150:56889`), category "Feedback &
Overlays". CMP-24, the page-level banner in the `PAT-06` notification family, distinct from the
already-Approved **Alert** (in-context, CMP-23) and **Notification Toast** (transient overlay,
CMP-22) — confirmed as three genuinely separate official component sets (this row's own
`NeedsConfirmation` label was already resolved 2026-07-13 per its prior notes, re-confirmed live
this pass).

**Registry:** `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus: "pending"` — a
workflow-progress marker; per `CLAUDE.md`'s node resolution policy the stored node was used
directly). Live-verified via `get_metadata` + `get_design_context` (`disableCodeConnect: true`) +
`get_variable_defs`; flipped to `"resolved"` on success.

**Design documentation:** https://design.dga.gov.sa/guidelines/components/feedback/notification

10 variants (`rtl` × `style`[Critical/Warning/Success/Info/Neutral]) — no `mobile` axis, unlike
`Alert`/`Toast`. Sampled directly: Critical/Error, Neutral (LTR). Warning/Success/Info colors
extended from the shared `get_variable_defs` output (see §4).

---

## 1. Structure — a genuinely distinct shape from Alert/Toast, not a variant of either

Confirms the registry's own naming-ambiguity resolution: this is a **slim, full-width, single-row
banner** (1280px wide, 56px tall in the sampled instance), not a boxed card like `Alert`/`Toast`.

- **Container:** tone-tinted background (`background-{tone}-50`), `radius-xs` (**2px** — notably
  smaller than `Alert`'s/`Toast`'s `radius-sm`/`radius-md`), padding-inline **24px** applied
  **twice** (once on the container itself via `Notification/notification-h-padding`, once again on
  the inner content row via `Global/spacing-3xl` — both resolve to the same 24px value; reproduced
  exactly as sampled, not "corrected" — see §5), padding-block 8px, **no shadow** (a flat banner,
  not a floating/elevated surface).
- **Content row:** `flex`, `items-center`, `flex-wrap` (wraps if content overflows), gap 12px,
  containing in order: an optional 24px **feedback icon**, an optional bold tone-colored **lead
  text** prefix (e.g. "Important:"), the **message** (flex-1, also tone-colored — unlike
  `Alert`/`Toast`, where the message stays neutral gray regardless of tone), then an inline
  **actions cluster** (optional `Link` + optional solid `Button`) in the *same* row as the text,
  not a separate row below.
- **Close button:** a literal `Button-Close` instance, absolutely positioned
  `inset-inline-end: -8px; inset-block-start: 4px` (slightly overlapping the container's own edge).
- **Accent line:** a **horizontal bar at the bottom edge** (not the leading edge like `Alert`, not
  the top edge like `Toast`'s mobile variant) — 2px tall (thinner than `Alert`'s/`Toast`'s 8px),
  full width, tone-colored, `opacity: 0.7` (0.6 for Neutral specifically — live-verified, not a
  typo).

## 2. Feedback icon — a different visual treatment from Alert's

`Alert`'s featured icon is a 40px circle with a **light tone-tinted** background and a
**colored** icon glyph. `Notification`'s feedback icon is smaller (24px) and — per the live
screenshot — a **solid, saturated tone-colored** circle with a **white** icon glyph (the opposite
contrast direction). The icon is a pre-rendered raster asset (no extractable vector fill), so the
exact circle-background hex is **approximated** by reusing the tone's own live-verified solid
`background-{tone}` token (the same value already used for the accent line) rather than guessed —
disclosed, non-blocking (see §5).

## 3. Composition guidance (new finding, not a code change)

- **Action button**: solid black fill (`button-background-black-default` `#0d121c`) — byte-
  identical to this repo's already-Approved `Button` `variant="neutral"` (same finding already
  made for `Modal`'s own Primary Action).
- **Link**: color `link-neutral` `#384250` — byte-identical to this repo's already-Approved
  `Link` `mood="neutral"` token (`--fads-sys-link-neutral`), reused directly (same component
  family, not independently re-sourced).

## 4. Tone tokens (live-verified via `get_variable_defs`; Warning/Success/Info from the shared
   dump, not independently re-sampled via `get_design_context`)

| Tone | Tint background | Text/icon-glyph color | Solid (icon-circle + accent line) |
|---|---|---|---|
| Error (`Critical`) | `#fef3f2` | `#b42318` | `#d92d20` |
| Warning | `#fffaeb` | `#b54708` | `#dc6803` |
| Success | `#ecfdf3` | `#067647` | `#079455` |
| Info | `#eff8ff` | `#175cd3` | `#1570ef` |
| Neutral | `#f9fafb` | `#384250` (reuses `text-primary-paragraph`, no dedicated `text-neutral` token exists for this component) | `#161616` (`background-black` — the only neutral "solid dark" token available; accent-line opacity is live-verified as `0.6` here, vs. `0.7` for every colored tone) |

## 5. Needs Confirmation

1. **Double 24px inline padding** (container + inner row) — reproduced exactly as sampled, not
   collapsed into a single inset, since Figma's own structure genuinely nests both.
2. **Feedback-icon circle background** — approximated from the tone's own solid
   `background-{tone}` token (raster asset, no extractable exact fill).
3. **Warning/Success/Info tone colors** — sourced from `get_variable_defs` only, not independently
   re-sampled via `get_design_context` (same category of disclosure as `Toast`'s own Info/Warning).
4. **RTL positioning** — extended by analogy from every other `Tabs`/`Modal`/`Toast` component's
   own confirmed logical-property mirroring, not independently re-sampled this pass (consistent
   pattern across the whole session, no counter-evidence found anywhere).
