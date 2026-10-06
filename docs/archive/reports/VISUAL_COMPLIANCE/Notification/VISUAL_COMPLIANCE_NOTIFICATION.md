# Visual Compliance Report — Notification (CMP-24)

Comparison of `docs/FIGMA_NOTIFICATION_SPECIFICATION.md` against the pre-existing
`frontend/src/design-system/composite/Notification/` implementation (`Notification.tsx`, built
pre-workflow, composing the shared `_shared/NoticeBody`), per
`docs/VISUAL_COMPLIANCE_WORKFLOW.md` Step 4.

Near-total mismatch, same severity category as `Alert`/`Toast`/`Avatar` before their own passes.
Registry status was `NeedsConfirmation` (label only) — its own prior notes already confirmed
2026-07-13 that the Alert/Notification/Toast three-way naming ambiguity was resolved (three
distinct official components; this row correctly maps to the page-level banner), so this pass
treats it as an ordinary actionable row, not a blocked one.

## Discrepancies found

| # | Area | Figma (live-verified) | Pre-existing implementation | Fix required |
|---|---|---|---|---|
| 1 | Shape | Slim, full-width, single-row banner, `radius-xs` (2px), no shadow | A boxed card with `radius-md` and a visible border, structurally identical to the pre-existing `Alert`/`Toast` before their own rebuilds | Rebuild as the correct slim banner shape |
| 2 | Background | Tone-tinted (`background-{tone}-50`) | Neutral `--fads-sys-color-background-raised`, tone only in the border color | Fix to live-verified tinted backgrounds |
| 3 | Feedback icon | 24px solid tone-colored circle + white glyph, leading the content row | Not implemented at all | Add, with the tone-specific solid-circle treatment (see spec §2) |
| 4 | Lead text | Optional bold tone-colored prefix (e.g. "Important:") before the message | Not implemented — only a single `title` slot exists | Add a `leadText` slot alongside `title`/message |
| 5 | Message color | Tone-colored (matches the lead text/icon color) | Generic `--fads-sys-color-text-muted`, never tone-colored | Fix — message must recolor per tone, unlike `Alert`/`Toast` |
| 6 | Close button | A literal `Button-Close` instance, absolutely positioned | An ad-hoc `<button>×</button>` inherited from `NoticeBody` | Compose `<ButtonClose>` |
| 7 | Actions | Inline `Link` + solid `Button` in the *same* row as the text | Not implemented at all | Add `link`/`action` slots |
| 8 | Accent line | Horizontal, bottom edge, 2px, tone-colored, opacity 0.7 (0.6 for Neutral) | None — tone expressed only via a 1px border color | Add the accent line |
| 9 | Padding | 24px inline applied twice (container + inner row) — reproduced exactly, not "fixed" | Generic `--fads-sys-space-inset-md` | Fix to live-verified values |

## What is kept unchanged (already correct)

- `role="alert"` for the error tone, `role="status"` for every other tone — a reasonable,
  independently-justified default (Figma has no ARIA data); unchanged from the pre-existing
  implementation.
- All copy passed in via props — no hardcoded strings, matches the existing (correct) API shape.

## Composition guidance (new finding, not a required code change)

Live token comparison confirms the official **Action Button** (`#0d121c` solid fill) is
byte-identical to this repo's already-Approved `Button` `variant="neutral"` (same finding already
made for `Modal`'s own Primary Action), and the official **Link** color (`#384250`) is
byte-identical to this repo's already-Approved `Link` `mood="neutral"` — reused directly via the
already-shared `--fads-sys-link-neutral` token rather than minting a duplicate.

## Accessibility notes

- Axe scan required on: every tone, with/without icon/lead-text/link/action/dismiss.
- The composed `<ButtonClose>` already carries its own required `label`/`aria-label` contract.

## Required code changes (Step 5 checklist)

1. `scripts/generate-tokens.mjs` — add new additive `--fads-sys-notification-*` tokens (container,
   per-tone tint/text/solid colors, spacing), run `npm run tokens:generate`.
2. `Notification.tsx` — rebuild as a self-contained primitive (stop composing `_shared/
   NoticeBody`, same architecture precedent as `Alert`/`Toast`); add `tone="neutral"` (a 5th tone
   the pre-existing implementation lacked no — it already had `info`/`success`/`warning`/`error`,
   `neutral` is the addition), `icon`, `leadText`, `link`, `action` props; compose `<ButtonClose>`.
3. `Notification.module.css` — full rebuild: tinted background, icon circle, tone-colored message,
   inline actions cluster, bottom accent line, double inline padding.
4. `Notification.stories.tsx` — cover every tone, with/without icon/lead-text/link/action.
5. `Notification.test.tsx` — extend for the new props; keep the existing `role`-per-tone behavior
   passing unmodified (only the dismiss control's underlying markup changes, not its contract).

## Needs Confirmation (non-blocking — see spec §5)

1. The double 24px inline padding (container + inner row) — reproduced exactly, not collapsed.
2. The feedback-icon circle's exact background — approximated from the tone's own solid
   `background-{tone}` token (raster asset, no extractable exact fill).
3. Warning/Success/Info tone colors sourced from `get_variable_defs` only.
4. RTL positioning extended by analogy from every other component processed this session.
