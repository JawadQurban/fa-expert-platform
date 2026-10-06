# Iconography Specification — Financial Academy Innovation Hackathon

> Icon usage rules. DGA is strict: **use only the official icon library, without changing size or color**; icons **>24px must use the Featured icon** variant; icons serve two modes — **status** (status colors) and **general/classification** (neutral/primary); if a needed icon is missing, design per guidelines and **submit for approval** `[S3: F9, F10, F11, F12]`. Reinforced by `DESIGN_CONSTRAINTS.md DC-09` and `COMPONENT_MAPPING.md §3`.
>
> ⚠ The **official icon inventory (specific icon names)** is not machine-verifiable from `[S1]` — see **Q8**. This spec defines *how* icons are used; the concrete icon per slot is chosen from the official library at implementation.

---

## 1. Golden rules `[S3]`
1. **Official DGA icon library only** — no third-party or custom icons except via the approval process (DC-09, F12).
2. **No resize or recolor** of library icons; size/color come from tokens applied per the library's rules.
3. **>24px ⇒ Featured icon** variant (do not scale a 24px icon up).
4. **Status colors only for status** icons; general/classification icons use **neutral or primary** (gray/green) (DC-05).
5. **External links** always carry the **external-link (Link Square)** icon (DC-28 / `[S3: C4, C20]`).

## 2. Sizes `[S3: F10]`
| Token (name) | Nominal | Use |
|---|---|---|
| `sys.icon.size.sm` | ≤ ~16px | inline with small text, dense UI |
| `sys.icon.size.md` | ~24px (max standard) | default UI icons (buttons, inputs, nav) |
| `sys.icon.size.featured` | > 24px | **Featured icon** component only |
- Never exceed the 24px standard icon by scaling; switch to the Featured icon variant instead.
- Exact px values follow DGA tokens (⚠Q3); names are stable.

## 3. Placement (RTL)
- **Icon + label pairs:** icon at the **logical start** of the label (right in RTL); mirrors in LTR (DC-25).
- **Directional icons** (chevrons, arrows, next/prev, breadcrumb separators, back): **mirror with direction** — a "next" arrow points logical-forward (left in RTL).
- **Buttons:** leading icon at logical start; trailing icon (e.g., dropdown caret, external-link) at logical end.
- **Inputs:** affordance icons (search, calendar) at a consistent logical position per component.
- **Status/alert icons:** at the logical start of the message.
- Consistent placement per context across the app (DC-26).

## 4. Meaning & consistency
- One icon = one meaning across the whole app; don't reuse an icon for unrelated concepts (`[S3: E15]` terminology consistency extends to icons).
- Icons **support**, not replace, text labels for primary actions (accessibility + clarity).
- Icon-only controls (e.g., close ✕, menu ☰) must have an accessible name (§8).

## 5. Decorative vs functional icons
| Type | Definition | Handling |
|---|---|---|
| **Decorative** | Adds no information beyond adjacent text (e.g., icon beside a visible label) | `aria-hidden="true"`, empty/no alt; not focusable |
| **Functional** | Conveys meaning or is the only label (icon-only button, status icon, external-link) | accessible name required (`aria-label`/visually-hidden text); status icons paired with text |
Rule: if removing the icon loses information, it's functional and needs a name.

## 6. Status icons `[S3: F11]`
- Colors: success / error / warning / information — **status only**.
- Always **paired with text** (never color/icon-only) so meaning survives for color-blind/SR users (WCAG 1.4.1, 1.3.3).
- Used in: Inline Alerts, Toasts, Notification banners, form validation, upload status.
- Not used for decoration, categories, or general emphasis (DC-05).

## 7. Category / general icons `[S3: F11]`
- Colors: **neutral (gray) or primary (green)** — never status colors.
- Used in: evaluation-criteria cards, goals, section headers, navigation, empty states (Featured), timeline phases.
- Category icons on cards are decorative if the card has a visible text title (§5).
- Choose from the official library that best matches meaning; if none fits → F12 approval process (⚠Q8).

## 8. Accessibility
- **Decorative:** `aria-hidden="true"`; no role.
- **Functional/icon-only:** provide an accessible name (`aria-label` in Arabic) reflecting the action, matching the visible tooltip (2.5.3 label-in-name where a visible label exists).
- **Status icons:** accompanied by text; not the sole indicator.
- **Contrast:** functional icons meet non-text contrast ≥3:1 (WCAG 1.4.11); verify against final tokens (⚠Q3).
- **Touch:** icon-only targets ≥44px hit area even if the glyph is 24px (`RESPONSIVE_STRATEGY.md §3`).
- **Tooltips** on icon buttons follow tooltip a11y (dismissable/hoverable/persistent, 1.4.13).
- **RTL:** directional icons mirror; verify next/prev/back/breadcrumb direction (WCAG 1.3.2).

## 9. Icon usage map (this project)
| Slot | Mode | Color | Size | Notes |
|---|---|---|---|---|
| Header nav / menu | general | neutral/primary | md | Selected state on active |
| Hamburger (mobile) | functional | neutral | md | `aria-label="القائمة"` |
| Search | functional | neutral | md | in Search (⚠Q10) |
| Language toggle | functional | neutral | md/sm | labelled |
| External links | functional | inherits link | sm/md | mandatory (DC-28) |
| Breadcrumb separator | decorative directional | neutral | sm | mirror in RTL |
| Evaluation-criteria cards | decorative/general | neutral/primary | md | title carries meaning |
| Goals items | decorative/general | neutral/primary | md | |
| Steps indicator | general | primary/neutral | md | current step emphasized (not status color) |
| File uploader | functional | neutral | md | upload/remove; status = status icon+text |
| Form validation | status | status | sm/md | paired with text |
| Toast/Alert/Banner | status | status | md | paired with text |
| Rating | functional | primary | md | keyboard-operable |
| Empty state / 404 | general | neutral/primary | **featured** | >24px ⇒ Featured icon |
| Tags (status) | status | status | sm | status Tags only |
| Tags (category) | general | neutral/primary | sm | category Tags |

## 10. Definition of Done (iconography)
- [ ] All icons from official DGA library (or F12-approved) (DC-09)
- [ ] No resized/recolored library icons
- [ ] >24px uses Featured icon
- [ ] Status colors only on status icons (DC-05)
- [ ] Every external link has external-link icon (DC-28)
- [ ] Decorative → `aria-hidden`; functional → accessible name
- [ ] Directional icons mirror in RTL
- [ ] Non-text contrast ≥3:1 (post-Q3)

## 11. Open items
Q3 (icon size/color token values, contrast), Q8 (official icon inventory names), Q10 (search icons). See `QUESTIONS.md`.
