# Visual Compliance — Avatar

Compares the official Platforms Code Avatar component
(`docs/FIGMA_AVATAR_SPECIFICATION.md`, node `5699:53529`) against the pre-existing FADS
`Avatar` primitive (`frontend/src/design-system/primitives/Avatar/`) as it stood before this pass.

## 1. Prior Implementation Summary

`role="img"`/`aria-label` (or `aria-hidden` when decorative) wrapper with `src` → `icon` →
initials priority and image-load-failure fallback. Only 3 of 7 official sizes (`sm`/`md`/`lg` =
32/40/48px, pixel-correct), no `square` or `border` prop, a flat font-weight for all sizes, and a
generic `--fads-sys-color-background-subtle` (`#f9fafb`) background instead of the live-verified
official value.

## 2. Differences Found (and Fixed)

| # | Area | Official (live-verified) | Prior implementation | Fixed this pass |
|---|---|---|---|---|
| 1 | Sizes | 7 sizes (24/32/40/48/64/80/120px) | 3 sizes (32/40/48px) | ✅ `AvatarSize` extended additively to `'xs'\|'sm'\|'md'\|'lg'\|'xl'\|'2xl'\|'3xl'`; existing `sm`/`md`/`lg` names/pixels unchanged |
| 2 | Shape | Rounded (default) and Square, with size-dependent corner radius (4px ≤64px, 8px for 80/120px) | Always pill/rounded | ✅ New `square` prop; radius verified against existing `--fads-sys-radius-sm`/`-md` tokens (exact match, no new radius token needed) |
| 3 | Border | Optional white framing ring | Not implemented | ✅ New `border` prop, rendered as an outer `box-shadow` ring (doesn't affect box size or get clipped by `overflow: hidden`) |
| 4 | Background color | `#f3f4f6` (`Background/background-neutral-100`) | `#f9fafb` (`--fads-sys-color-background-subtle`, `neutral-50`) — wrong shade | ✅ New `--fads-sys-avatar-background-fallback` token, live-verified value |
| 5 | Typography | Font-size/weight/line-height all vary per size (Bold 10px → Regular 36px) | One flat `font-weight: semibold` for every size | ✅ 21 new per-size `--fads-sys-avatar-font-size/-weight/-line-height-*` tokens, all live-verified |
| 6 | Icon color | `Icon/icon-default` `#161616` | Inherited generic text color | ✅ New `--fads-sys-avatar-icon-color` token |
| 7 | Icon-type default glyph | Figma's default "user" silhouette (node `13758:241876`) | `icon` is a consumer-supplied slot | ⚠ Disclosed as an intentional scope boundary, not a defect — see spec §7. The icon is not in this codebase's Icon registry; importing it would be a separate, documented pipeline (`docs/ICON_LIBRARY.md`), out of scope for this pass. `icon` remains a composition slot. |

## 3. Accessibility

- Preserved unchanged: functional avatars get `role="img"` + `aria-label={name}` on the wrapper
  with a decorative (`alt=""`) inner `<img>`; decorative avatars get `aria-hidden="true"` and are
  fully hidden from assistive tech.
- No color-only state changes were introduced (`square`/`border` are purely visual, non-semantic).

## 4. RTL

No layout bug — the avatar is a centered circle/square with no inline-direction-dependent
content (confirmed by inspection and a dedicated RTL story/test); `inline-size`/`block-size`
(logical properties) were already used throughout, unchanged.

## 5. Scope

- Only `Avatar.tsx`, `Avatar.module.css`, `Avatar.stories.tsx`, `Avatar.test.tsx`, and
  `scripts/generate-tokens.mjs` (additive tokens only) were touched.
- `primitives/index.ts` already exported `Avatar`/`AvatarProps`/`AvatarSize` by name — the widened
  `AvatarSize` union flows through automatically, no export changes needed.
- All new props (`square`, `border`) default to `false`, and the existing `sm`/`md`/`lg` size
  names keep their exact prior pixel values — any existing caller renders visually unchanged.

## 6. Validation

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` (eslint + `lint:css`) | ✅ Pass (DC-04 no hardcoded colors, DC-23 no physical-direction props) |
| `npm run format:check` (Avatar + touched files) | ✅ Pass |
| `npm test` (Avatar only) | ✅ 16/16 passing (up from 3) |
| `npm run tokens:validate` | ✅ 753 defined, 660 referenced, 0 missing |
| `npm run build` | ✅ Pass |
| `npm run build-storybook` | ✅ Pass |

Full-suite `npm test` run: 704/710 passing; the 6 pre-existing failures are in
`HomePage.test.tsx`/`hackathonFlow.test.tsx`/`ApplicationFormPage.test.tsx` (a combobox-selection
timing issue in the application form feature) — confirmed via `grep` that neither file references
`Avatar` or any token this pass touched, so these are unrelated pre-existing failures, not a
regression from this change.

## 7. Approval

Live node, all 7 sizes, both shapes, the border ring, and per-size typography verified before
Avatar is marked Approved. Needs-Confirmation items (non-blocking, spec §9): the approximated
border stroke width (raster export, no vector data); and the disclosed Icon-type default-glyph
scope boundary (§2 row 7) is a deliberate design decision, not an open defect.
