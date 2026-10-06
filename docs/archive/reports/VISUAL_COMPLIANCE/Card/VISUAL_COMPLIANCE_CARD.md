# Visual Compliance — Card (CMP-07)

Compares the official Platforms Code Card component (see `docs/FIGMA_CARD_SPECIFICATION.md`) against the current implementation:

- `frontend/src/design-system/composite/Card/Card.tsx`
- `frontend/src/design-system/composite/Card/Card.module.css`
- `frontend/src/design-system/composite/Card/Card.stories.tsx`
- `frontend/src/design-system/composite/Card/Card.test.tsx`

**No implementation changes have been made yet.** This is a comparison report only, per `docs/VISUAL_COMPLIANCE_WORKFLOW.md` Step 4.

---

## 0. Context — this component's tokens are NOT "dead" (correction of a Button-session assumption)

During the Button pass, 9 CSS custom properties were assumed to be entirely undefined ("dead") because they were absent from `tokens/generated/tokens.css`. Re-checking for Card revealed that assumption was **incomplete**: those same token names (`--fads-sys-border-width-thin`, `--fads-sys-opacity-disabled`, etc.) are actually defined in the second, hand-written placeholder layer, `frontend/src/design-system/tokens/tokens.css`, which `global.css` also imports. `npm run tokens:check-coverage` confirms **0 missing references repo-wide** — Card's `--fads-sys-border-width-thin`, `--fads-sys-elevation-1`, `--fads-sys-opacity-disabled`, `--fads-sys-radius-md`, etc. all resolve today, just to **non-DGA placeholder values**, not real Figma ones. This report corrects the record: Card has no dead-token bug. The task here is replacing placeholder values with Figma-verified ones, not fixing broken CSS.

All of `--fads-sys-elevation-1`, `--fads-sys-opacity-disabled`, `--fads-sys-border-width-thin`, and `--fads-sys-radius-md` are consumed by **20 other components** (`DatePicker`, `FileUploader`, `Table`, `Toast`, `Steps`, `Pagination`, `NavDrawer`, `Tabs`, `Notification`, `Alert`, `Accordion`, `Header`, `Footer`, `Tag`, `Switch`, `Radio`, `Field`, `Checkbox`, etc.) — confirmed via grep before making any change. Per the workflow's "fix only the component in scope" rule, **none of these shared tokens may be edited or repointed**. All Card-specific fixes below use new, additive `--fads-sys-card-*` tokens instead, mirroring the `--fads-sys-button-*` precedent.

---

## 1. Missing Variants

Our `Card` has a single implicit content structure plus an `actionable`/`disabled` boolean pair. The official component exposes:

| Official axis | Current equivalent | Status |
|---|---|---|
| `Effect` = With Shadow / No Shadow / Stroke | — (always renders one hard-coded look) | **Missing** — flagged in `docs/COMPONENT_INVENTORY.md` CMP-07 as "shadow/no-shadow" since before this pass, never implemented until now |
| `Type` = Default (static) | `actionable=false` | Present, being corrected this pass |
| `Type` = Selectable (checkbox multi-select, persistent corner checkbox) | — | **Missing** — no equivalent concept in our API at all |
| `Type` = Expandable (accordion expand/collapse) | — | **Missing** — a fundamentally different interaction model (expand/collapse), not attempted this pass |
| Optional `Image` slot | — | **Missing** |
| Optional `Featured icon` slot | — | **Missing** |
| Optional `Tags` row | — | **Missing** (our generic `footer` slot is not a like-for-like replacement) |
| Optional `Rating` | — | **Missing** |
| Dual `Actions` (secondary + primary `Button`) | Our generic `footer` ReactNode slot can hold anything, including Buttons, but isn't a structured two-button "Actions" row | Partially covered via `footer`, not a dedicated API |

**Scope decision for this pass:** implement the `Effect` variant (shadow/none/stroke) — it's simple, purely visual, already expected per our own pre-existing `COMPONENT_INVENTORY.md`, and doesn't change Card's interaction model. Do **not** implement Image/Featured-icon/Tags/Rating/dual-Actions/Selectable/Expandable — these would substantially expand Card's API and interaction surface beyond "fix Card's visual compliance," and were not requested. They are documented here as **Missing** for a future, separately-scoped task.

---

## 2. Incorrect Spacing

- **Top-level section gap**: official is **24px** (`Card/card-lg-gap`, a genuine Card-specific Figma variable). Current CSS uses `--fads-sys-space-stack-sm` (**8px**) for the gap between `title`/`description`/`content`/`footer` — **3x too small**, and also structurally wrong: Title and Description should be grouped at 8px *inside* a "Content" block, which is then separated from other sections by 24px. Currently all 4 elements (title, description, content, footer) sit as flat siblings sharing one 8px gap.
- **Padding**: already correct — `--fads-sys-space-inset-md` (16px) exactly matches the official `Global/spacing-xl` (16px). No change needed.
- **Title↔Description internal gap**: official is 8px (`Global/spacing-md`), which happens to equal our existing `--fads-sys-space-stack-sm` — already the right *value*, just not applied with the right *grouping* (see above).

---

## 3. Incorrect Typography

| Element | Current | Official | Status |
|---|---|---|---|
| Title font size | `--fads-sys-typography-text-lg` (18px) | 18px (`text-lg`) | ✅ Already correct |
| Title font weight | `--fads-ref-font-weight-semibold` (600) | **Bold (700)** | ❌ Incorrect |
| Title line-height | not set (browser default) | **28px** (`line-heights-text-lg`) | ❌ Missing — no `--fads-sys-typography-line-height-lg` token exists yet (xs/sm/md were added during the Button pass; lg was not) |
| Title color | not set (inherits ambient color) | `#1F2A37` (`Text/text-display`) | ❌ Missing — not explicitly set |
| Description font size | not set (browser default) | 16px (`text-md`) | ❌ Missing |
| Description font weight | not set (default) | Regular (400) | ⚠️ Coincidentally correct by browser default, not explicit |
| Description line-height | not set (browser default) | 24px (`line-heights-text-md`, already generated from the Button pass) | ❌ Missing |
| Description color | `--fads-sys-color-text-muted` (a lighter/muted gray) | **`#1F2A37` — same as Title**, not muted | ❌ Incorrect — official Description is not a lighter shade, only smaller/lighter-weight than Title |

---

## 4. Incorrect Radius

`--fads-sys-radius-md` (8px) is used; official is **`radius-lg` (16px)**, uniform across every sampled Type/State/Effect. `--fads-sys-radius-lg` already exists and already resolves correctly (16px) — this is a simple repoint, not a new token.

---

## 5. Incorrect Token Usage (Colors / Border / Shadow)

- **Background**: `--fads-sys-color-background-default` resolves to `--fads-ref-neutral-25` (an off-white, `#fcfcfd`-family value), not the official `Background/background-card` = **pure white `#FFFFFF`**. `--fads-sys-color-background-default` is a shared token consumed by many other components (page/surface backgrounds) — must not be repointed; needs its own additive Card token.
- **Border**: current CSS applies `border: 1px solid var(--fads-sys-color-border-default)` **unconditionally on every Card**. Official has **no border at all** for the default (With Shadow / No Shadow) effects — a border only appears for the `Stroke` effect (`#D2D6DB`, a different value than `--fads-sys-color-border-default` resolves to anyway) or the Focused state (`2px solid #161616`, a third, distinct value). The current unconditional 1px border is simply wrong for the default look.
- **Shadow**: `--fads-sys-elevation-1` (a generic placeholder shadow shared by ~20 components) is used. Official Card shadow is a distinct, named effect style (`Shadows/shadow-md`): `0 2px 4px -2px rgba(16,24,40,.06)` + `0 4px 8px -2px rgba(16,24,40,.1)` — different numbers from the shared placeholder. Needs its own additive Card token, not a change to the shared one.
- **Disabled state**: `opacity: var(--fads-sys-opacity-disabled)` (0.5, a real but placeholder, non-Figma value — see §0) is used. Official Disabled is **solid**: background `#E5E7EB`, text `#9DA4AE`, **shadow removed entirely** — the same "solid, not opacity" pattern already corrected for Button.

---

## 6. Incorrect Interaction

- **No hover/focus treatment exists at all** for `actionable` Cards. The closest official analog with a full interactive state set (Type=Selectable) shows: Hover → background shifts to `#F9FAFB` (still shadowed); Focused → same `#F9FAFB` background **plus a real 2px solid `#161616` border**. Our `actionable` Card currently only changes `cursor: pointer` on hover and relies on the browser's default focus outline (unstyled/unverified) — no background or border change at all.
- **Disabled** uses opacity (see §5) instead of solid colors, and never removes the shadow (official removes it entirely when disabled).

**Scope note:** our `actionable` Card is a generic single-action clickable/keyboard-operable pattern with no official Type equivalent (Selectable is checkbox-multi-select; Expandable is accordion). The Hover/Focused/Disabled *color* treatment from Selectable is reused here as the best-available, Figma-verified analog — documented explicitly in code comments — since it's the only officially verified interactive-state color data for this component. The Selectable-specific corner checkbox itself is **not** added (see §1).

---

## 7. Missing Accessibility

- No dedicated, token-verified focus-visible treatment for `actionable` Cards (relies on unverified browser default). Official has a real, solid, high-contrast focus border — should be implemented.
- Disabled-via-opacity risks a different contrast relationship than the official solid disabled colors (which were presumably tuned for legibility).

---

## 8. Missing RTL Behavior

- No RTL-specific behavior exists in Card today, and none is being added this pass beyond what's already RTL-safe (logical properties, no left/right in the current CSS — confirmed clean by `scripts/verify-css-rules.mjs`, unaffected by this pass). The Selectable-type checkbox's RTL mirroring (`docs/FIGMA_CARD_SPECIFICATION.md` §12) is **Needs Confirmation** and moot for this pass since the checkbox itself isn't being implemented.

---

## 9. Required Code Changes (not yet applied)

1. Add new, additive `--fads-sys-card-*` tokens to `scripts/generate-tokens.mjs` (sourced from `Light.tokens.json` where possible, matching the Button precedent): background (`#FFFFFF`), background-hover/focused (`#F9FAFB`), background-disabled (`#E5E7EB`), text (`#1F2A37`), text-disabled (`#9DA4AE`), border-stroke (`#D2D6DB`), border-focus (`#161616`), shadow (the two-layer `shadow-md` value).
2. Add a general-purpose `--fads-sys-typography-line-height-lg` (28px) token, consistent with the xs/sm/md tokens added during the Button pass (not Card-specific — reusable by any component using `text-lg`).
3. Restructure `Card.module.css`/`Card.tsx`: group Title+Description into their own "Content" wrapper at 8px gap; separate top-level sections (Content, `children`, `footer`) at the new 24px `--fads-sys-card-gap`.
4. Repoint radius at the existing `--fads-sys-radius-lg` (16px) instead of `--fads-sys-radius-md` (8px).
5. Repoint background at the new `--fads-sys-card-bg` (white) instead of the shared `--fads-sys-color-background-default`.
6. Remove the unconditional border; add it only for a new `effect="stroke"` variant.
7. Add the new `effect?: 'shadow' | 'none' | 'stroke'` prop (default `'shadow'`), driving background/border/shadow per §5.
8. Fix Title to Bold (700) / 28px line-height / `#1F2A37` color (all explicit).
9. Fix Description to explicit Regular (400) / 16px / 24px line-height / `#1F2A37` color (not muted).
10. Add real hover/focused background + focus border for `actionable` Cards, and replace opacity-based Disabled with solid background/text colors and no shadow — all via the new `--fads-sys-card-*` tokens.
11. Update `Card.stories.tsx` to cover the new `effect` variant and the corrected hover/focus/disabled treatment.
12. Update `Card.test.tsx` for the corrected tokens/behavior.

No code, story, or test files have been modified as part of this report — implementation is the next, separate step per the workflow.
