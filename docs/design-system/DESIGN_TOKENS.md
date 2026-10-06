# Design Tokens (FADS L1)

> **Token taxonomy, naming convention, and integration policy** for the Financial Academy Design System.
> **DS version:** `0.1.0` (pre-token). The frontend token layer now consumes values from the official Figma foundations export in `references/figma/foundations/Values.tokens.json`; this document continues to define the naming and governance rules while the integration report captures the mapping. **No DGA value is invented** `[S3]` `[PROJ]`.
>
> **Visual Compliance Correction (Button, this session):** `references/figma/foundations/Light.tokens.json` also carries a `Button` group of **official per-component semantic color tokens** (states: Default/Hovered/Pressed/Selected/Focused, variants: black/primary/neutral/danger-primary/danger-secondary/oncolor/transparent) that the token generator had never ingested — only the generic primitive scale was. `Button`'s `primary` variant now consumes 5 new tokens generated from this source (`--fads-sys-button-primary-bg-{default,hover,pressed,selected,focused}`), additive only — no other component's tokens changed. Full findings: `reports/VISUAL_COMPLIANCE_BUTTON.md`.

---

## 1. Golden rules `[S3]`

1. Tokens are the **only** way to express color, type, spacing, radius, elevation, and motion. **No hard-coded values** in components (`DESIGN_CONSTRAINTS.md`).
2. FADS tokens **mirror DGA Design Tokens without modification** `[S3: F2, F6, F8]`. FADS does not invent scales.
3. Any token whose value is not yet integrated carries a `TODO(Q3)` marker and **must not ship as final** `[DESIGN_SYSTEM_PLAN.md §1]`.
4. Status colors (success/error/warning/information) are **reserved for status only** `[S3: F3, F11]`.
5. Elements on colored/image backgrounds resolve through **On-Color** token variants `[S3: F4]`.

---

## 2. Token tiers

FADS uses a three-tier token model so the DGA scale stays untouched while products reference meaning, not raw values.

| Tier | Role | Example (name only) | Value owner |
|---|---|---|---|
| **T1 Reference (primitive)** | Raw DGA scale values | `ref.color.green.600`, `ref.space.4` | DGA (Q3) |
| **T2 System (semantic)** | Purpose-based aliases → T1 | `sys.color.background.default`, `sys.space.section-gap` | FADS (maps to DGA) |
| **T3 Component** | Component-scoped → T2 | `cmp.button.primary.background` | FADS |

Products and patterns reference **T2/T3 only**, never T1. This lets a single DGA value change propagate everywhere.

> ⚠ Whether DGA already ships a 3-tier structure or a flat token set affects how directly we map — **Q20**.

---

## 3. Naming convention

Dot-notation, lower-kebab segments, direction-neutral:

```
<tier>.<category>.<role>[.<variant>][.<state>]
```

- **Direction-neutral:** use logical terms (`inline-start`, `block-end`) never `left/right` — RTL requirement `[S3: F17]`.
- **State suffixes** align to DGA state names: `default | hover | pressed | focus | disabled | read-only | selected | visited` and contextual (`expanded`, `on`, `checked`, `indeterminate`, `half`, `today`).
- CSS custom-property materialization and the typed TS map are produced in implementation (naming only here — no CSS emitted this phase).

Examples (names, not values):
`sys.color.text.default` · `sys.color.status.success` · `sys.color.on-color.text` · `cmp.card.border.radius` · `sys.space.stack.md` · `sys.typography.display.lg` · `sys.breakpoint.tablet`.

---

## 4. Token categories

### 4.1 Color `[S3: color-system]`
| Group | Semantic roles (T2 names) | Notes |
|---|---|---|
| Brand/Primary | `sys.color.primary.*` | DGA primary (green family) — value ⚠Q3 |
| Neutral | `sys.color.neutral.*` | grays for general/classification use `[S3: F11]` |
| Background | `sys.color.background.{default,subtle,raised,inverse}` | |
| Text | `sys.color.text.{default,muted,inverse,link}` | |
| Border | `sys.color.border.{default,strong,focus}` | focus ring supports 2.4.7 |
| **Status** | `sys.color.status.{success,error,warning,information}` | **reserved — status only** `[S3: F3]` |
| **On-Color** | `sys.color.on-color.{text,icon,border}` | for colored/image backgrounds `[S3: F4]` |

Contrast: every text/background pair must pass **WCAG 2.2 AA** (≥4.5:1, ≥3:1 large) — verifiable only once values land (Q3) `[ACCESSIBILITY_CHECKLIST.md]`.

### 4.2 Typography `[S3: typography]`
- Font family: **IBM Plex Sans Arabic** (single approved family) `[S3: F5]`.
- Two token families: **Display** variants and **Text** variants `[S3: F6]`.
- Each variant token bundles: font-size, line-height, font-weight, letter-spacing, and a **responsive** step `[S3: F7]`.
- Names (values ⚠Q3): `sys.typography.display.{xl,lg,md,sm}`, `sys.typography.text.{lg,md,sm,xs}`, weight tokens `sys.font.weight.{regular,medium,semibold,bold}`.
- ⚠ Exact sizes/weights/line-heights → **Q3**. ⚠ Font delivery (self-host vs approved source) → **Q7**.

### 4.3 Spacing `[S3: layout-and-spacing]`
- **Global spacing tokens only**; no element-custom spacing `[S3: F8]`.
- Base steps are multiples such as 4/8/16px `[S3]`; full scale ⚠Q3.
- Semantic spacing: `sys.space.stack.*` (vertical), `sys.space.inline.*` (horizontal, logical), `sys.space.section-gap`, `sys.space.inset.*` (padding).

### 4.4 Radius, border, elevation
- `sys.radius.{sm,md,lg,pill}`, `sys.border.width.*`, `sys.elevation.{0,1,2,3}` (shadow tokens for card shadow/no-shadow variants `[S3: Card]`). Values ⚠Q3.

### 4.5 Breakpoints & grid `[S3: responsive]`
- Tiers: `sys.breakpoint.{mobile,tablet,desktop}` `[S3: F13]`.
- Grid tokens: columns, margin, gutter per tier.
- ⚠ Exact px thresholds & grid metrics → **Q3** (working assumptions live in `RESPONSIVE_STRATEGY.md §1`, clearly marked non-authoritative).

### 4.6 Motion
- `sys.motion.duration.*`, `sys.motion.easing.*`.
- **Constraint:** motion must never hide key elements `[S3: E10]`; respect `prefers-reduced-motion`.
- ⚠ DGA motion values → **Q3** (falls under Motion in `[S1]` foundations).

### 4.7 Z-index & layering
- `sys.z.{base,dropdown,sticky-header,drawer,modal,toast,tooltip}` — a single ordered scale prevents stacking bugs (FADS-defined ordering; not a DGA value).

### 4.8 Iconography tokens
- Icon size tokens: `sys.icon.size.{sm=≤24,md,featured}` — **>24px must use the Featured icon variant** `[S3: F10]`.
- Icon color follows color tokens; **no recolor/resize of library icons** `[S3: F9]`.

---

## 5. RTL & direction in tokens `[S3: F17]`
- No `left`/`right` in token names or usage — logical only (`inline-start`/`inline-end`).
- Directional assets (chevrons, arrows) are handled at the component layer via mirroring, not via separate tokens.

## 6. Theming
- Base theme: **DGA light** (single theme).
- **On-Color** is a token-level mechanism, not a separate theme `[S3: F4]`.
- Dark mode is **not** a DGA requirement — out unless requested (⚠Q22).
- Multi-product brand variation within DGA limits — ⚠Q26.

> **⚠ Non-source note (2026-07-08):** The GOV-SA legacy repo (`GOV-SA/design-system-gov.sa`) is **NOT** an acceptable source for these token values — it is the older GOV.SA generation (Bootstrap/SCSS, TheSans font). Do not populate tokens from it. Acceptable sources and the full rationale are in `TOKEN_SOURCE_STRATEGY.md` / `LEGACY_REFERENCE_DECISION.md`.

## 7. Integration workflow (implementation phase)
1. Obtain official DGA token values from an **authoritative source** (Figma variables export, official site, or official package — `TOKEN_SOURCE_STRATEGY.md §2`) — **Q20**.
2. Populate T1 reference tokens with DGA values.
3. Verify T2 semantic mappings against DGA guidance `[S3]`.
4. Run contrast audit on final color pairs `[ACCESSIBILITY_CHECKLIST.md]`.
5. Replace all `TODO(Q3)` markers; bump DS version toward `1.0.0`.

## 8. Definition of Done (token layer)
- [ ] All categories have real DGA values (0 `TODO(Q3)` remaining)
- [ ] Status colors used only for status `[S3: F3]`
- [ ] On-Color variants defined & used on colored backgrounds `[S3: F4]`
- [ ] Contrast AA verified `[G1]`
- [ ] No hard-coded values anywhere `[DESIGN_CONSTRAINTS.md]`
- [ ] Logical (RTL-safe) naming throughout `[S3: F17]`

## 10. Component / interactive placeholder tokens (added in Phase 5)

Building the primitives layer required a few tokens the base taxonomy did not
yet enumerate. Per the phase rule ("if a component needs a value that does not
exist, create a clearly named placeholder token and document it"), these were
added to `frontend/src/design-system/tokens/tokens.css` with **placeholder
values** and are tracked for DGA validation under **Q33**.

| Token (CSS var) | Purpose | Placeholder source |
|---|---|---|
| `--fads-ref-border-width-{thin,thick}` / `--fads-sys-border-width-*` | control & focus borders | 1px / 2px |
| `--fads-ref-shadow-{1,2}` / `--fads-sys-elevation-{0,1,2}` | elevation | soft neutral shadows |
| `--fads-sys-color-primary-{hover,pressed}` | button interaction | ref primary 600/700 |
| `--fads-sys-color-text-on-primary` | text on primary surface | on-color text |
| `--fads-sys-color-background-{hover,pressed}` | ghost/secondary interaction | neutral 100/200 |
| `--fads-sys-color-text-disabled`, `--fads-sys-color-border-disabled` | disabled | neutral 400/200 |
| `--fads-sys-color-link-{hover,visited}` | link states | ref primary 700 |
| `--fads-sys-opacity-disabled` | disabled dimming | 0.5 |
| `--fads-sys-color-field-{background,border,placeholder,border-error}` | form fields | neutral / status-error |
| `--fads-sys-control-height-{sm,md,lg}` | control sizing | 2 / 2.5 / 3rem |
| `--fads-sys-control-padding-inline-{sm,md,lg}` | control inline padding | ref space 3/4/5 |
| `--fads-sys-control-radius`, `--fads-sys-control-gap` | control radius/gap | radius-md / space-2 |

### Phase 5A additions (layout / selection / surfaces)

| Token (CSS var) | Purpose | Placeholder source |
|---|---|---|
| `--fads-sys-container-{page,prose,form}` | layout max-widths | 75 / 42 / 40rem |
| `--fads-ref-icon-size-{sm,md,featured}` / `--fads-sys-icon-size-*` | icon sizing (≤24; >24 = Featured, F10) | 16 / 24 / 40px |
| `--fads-sys-selection-size` | checkbox/radio box size | 1.25rem |
| `--fads-sys-selection-color-checked` | checked control accent | → primary |
| `--fads-sys-switch-track-inline` / `--fads-sys-switch-track-block` / `--fads-sys-switch-thumb-size` | switch geometry | 2.75 / 1.5 / 1.125rem |
| `--fads-ref-overlay` / `--fads-sys-color-overlay` | modal/drawer scrim | rgba neutral 0.5 |
| `--fads-sys-color-surface-{raised,hover}` | menu/card/list surfaces | → background raised/hover |
| `--fads-sys-color-table-{header-background,row-border}` | data table | → subtle / border |

All of these are **NON-DGA placeholders** — component visual fidelity is
**Pending final DGA token values** and must not be treated as approved. Tracked
with **Q33**.

## 9. Open items
Q3 (values), Q7 (font delivery), Q20 (acquisition route), Q22 (dark mode), Q26 (multi-product theming), **Q33 (validate the Phase-5 component/interactive placeholder tokens above)**. See `QUESTIONS.md`.
