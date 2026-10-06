# Visual Compliance — Alert (Inline Alert)

Compares the official Platforms Code **Inline Alert** component (node `1730:46048`, now resolved —
see `docs/FIGMA_ALERT_SPECIFICATION.md`) against the provisional implementation built during the
prior pass (while the node was still unresolvable).

## 1. Node Resolution

- **Registry node ID:** `1730:46048`
- **Figma URL:** `https://www.figma.com/design/J0xq7JG3JKshRDzrgAM7E0/Components-Library---Platforms-Code--Community-?node-id=1730-46048`
- **Component set:** Inline Alert (`J0xq7JG3JKshRDzrgAM7E0`)
- **Variants inspected:** 40 total (`rtl` × `type`[5] × `backgroundColor`[2] × `mobile`[2]); 6
  sampled directly (Neutral/White, Destructive/White, Destructive/Color, Neutral/Color,
  Neutral/White/Mobile), plus `get_variable_defs` on the component-set root.

## 2. Differences Found

### Visual
| # | Area | Official (live-verified) | Prior (provisional) implementation | Fixed |
|---|---|---|---|---|
| 1 | Overall structure | Featured-icon circle + title/description + up to 2 actions + dismiss + accent stripe | Plain title/message/dismiss box, no icon circle, no stripe | ✅ Full rebuild matching the live structure |
| 2 | Featured icon | 40px circle, tone-tinted bg, centered glyph | A bare inline icon with no circular badge | ✅ New `.iconCircle` (40px, tone bg) |
| 3 | Accent stripe | Tone-colored 8px stripe, always present, leading edge (or top edge in Mobile) | Not implemented at all | ✅ Added, always rendered |
| 4 | Dismiss button | 32px button, `radius-sm`, real "X" icon | Literal `×` text character, no defined button box | ✅ 32px button with the `cancel-01` icon |
| 5 | Actions | Up to 2 buttons in a dedicated, indented row | A single generic `action` slot | ✅ `action` + new `secondaryAction` |
| 6 | Tinted surface | `backgroundColor=Color` recolors box bg/border and the *title* text per tone | Not implemented | ✅ New `surface` prop (`white`/`tinted`) |
| 7 | Responsive/dense variant | Real `Mobile` layout: stacked, full-width actions, top stripe | Fabricated `compact` prop (reduced padding only) — **no Figma evidence ever supported it** | ✅ `compact` deleted; real `mobile` prop added, full layout restructure |

### Tokens
All 20 provisional `--fads-sys-alert-*` tokens (disclosed reuses of `Tag`'s palette) were replaced
with 38 new tokens, each independently live-verified against Alert's own node via
`get_variable_defs`/`get_design_context` — **no token in the final implementation is reused from
another component.** See generator comments in `scripts/generate-tokens.mjs` for the full
citation of each.

### Behavior
- Actions row now supports two independent slots (`action`, `secondaryAction`) instead of one.
- `mobile` fully restructures rendering (conditional JSX branch), not just a CSS density tweak.

### Accessibility
- Dismiss button gained a real accessible icon (`cancel-01`, `decorative`) instead of literal `×`
  text — no accessibility regression (the button's `aria-label` was already present and unchanged).
- The featured-icon wrapper is explicitly `aria-hidden="true"` regardless of whether the default
  tone icon or a caller-supplied override is used (caught by a real test failure during this
  pass — a caller-supplied custom icon wasn't being wrapped as decorative before this fix).
- `role` default logic unchanged (tone-based, overridable) — re-verified correct against the live
  component (Figma defines no live-region/role semantics itself; this remains this repo's own
  considered accessibility decision, consistent with "do not automatically assign role='alert'").

### RTL
No new bug — logical properties throughout (`inset-inline-start`, `padding-inline-start`, etc.).
The accent stripe correctly flips side under `dir="rtl"` since it uses `inset-inline-start`, not a
physical `left`/`right` property.

### Storybook
Rebuilt entirely: `Info`, `Success`, `Warning`, `Error`, `Neutral` (all 5 tones), `TintedSurface`
(replaces nothing — new), `WithAction` (now shows both actions), `Dismissible`, `Mobile` (replaces
`Compact` — the fabricated variant is gone), `WithoutTitle`, `LongContent` (new — wrapping check),
`RTL`, and a new structured **`OfficialFigmaMatrix`** story (grouped by tone, each section showing
a White/Tinted × LTR/RTL 2×2 grid plus one Mobile sample — not one flat 40-cell grid).

### Tests
`Alert.test.tsx` rebuilt: 19 tests (up from 13), covering every official tone, the default
tone-icon, a caller-supplied icon override, dual actions, the tinted surface, the Mobile layout,
dismiss via click and keyboard, long-content wrapping, RTL, and axe scans across
tone × surface combinations plus the Mobile layout on its own.

## 3. Corrections Made (Implementation + Tokens)

- Alert rebuilt as a **fully self-contained primitive** — no longer composes the shared
  `_shared/NoticeBody` (its structure diverges too far from the simple shape `Toast`/`Notification`
  still share; same architecture precedent as `TextInput`/`Textarea` vs. `Select`).
- `NoticeBody`'s `icon`/`action` props (added in the prior pass specifically for Alert) were
  **reverted** — no longer used by anyone (`Toast`/`Notification` never adopted them), so removing
  them keeps the shared component minimal for its actual remaining consumers.
- `AlertTone` unchanged (`info`/`success`/`warning`/`error`/`neutral`) — all 5 confirmed live,
  none removed, none invented.
- `AlertSurface` (new): `'white' | 'tinted'`, maps to the official `backgroundColor` axis.
- `mobile` (new, replaces `compact`, which is **deleted**): maps to the official `Mobile` axis.
- `secondaryAction` (new): the official design supports two actions, not one.
- Default per-tone icon added (previously `icon` was purely optional with no default — live data
  shows the featured icon is always present in every sampled variant).
- Dismiss button rebuilt as a real sized button with a real icon.
- Accent stripe added (new, always rendered).
- 38 new additive `--fads-sys-alert-*` tokens, replacing the 20 provisional ones.

## 4. Scope

- Touched: `Alert.tsx`, `Alert.module.css`, `Alert.stories.tsx`, `Alert.test.tsx`,
  `scripts/generate-tokens.mjs` (tokens replaced, not merely added), and
  `composite/_shared/NoticeBody.tsx` (reverted to its pre-Alert-pass shape).
- `Toast.tsx`, `Notification.tsx` — **unchanged**; their own test suites (7 and 5 tests) re-run
  and confirmed still green after the `NoticeBody` revert.
- `ErrorState.tsx` (composes `Alert` via `tone="error"` + `title` + `children`) — **unchanged**;
  its own 4 tests re-run and confirmed still green; it doesn't use any of the new props
  (`surface`/`mobile`/`secondaryAction`), which remains a valid, unaffected usage.
- `Alert` is not consumed by any product page (`grep`-verified), so zero external-breakage risk
  from the prop changes (including the `compact` removal).

## 5. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass |
| `npm run format:check` | ✅ Pass |
| `npm test` (Alert + Toast + Notification + ErrorState) | ✅ 19 + 7 + 5 + 4 = 35/35 passing |
| `npm run tokens:generate` | ✅ 557 tokens generated |
| `npm run tokens:check-coverage` | ✅ 0 missing references |
| `npm run build-storybook` | ✅ Pass |

## 6. Approval

Live node, all 5 tones, both surfaces, the Mobile layout, dual actions, the accent stripe, and the
dismiss button verified against the real "Inline Alert" design before Alert is marked Approved.
Needs-Confirmation items (non-blocking, spec §8): exact icon-per-tone vector match, dismiss-icon
color, and the Mobile dismiss-button positioning technique (flexbox space-between vs. Figma's
literal absolute coordinates — same visual result).

**Alert: ✅ Approved** (previously Blocked — Approval Withheld; unblocked this pass after the
registry's node was manually registered and live-verified).
