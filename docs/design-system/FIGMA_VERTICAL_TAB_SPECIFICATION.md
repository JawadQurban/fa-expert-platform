# Figma Vertical Tab / Vertical Tab List — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), category "Selection & Wayfinding":
- **Vertical Tab** (node `418:99793`) — CMP-09b, the vertical axis of the same official "Tabs"
  family as the already-Approved **Horizontal Tab** / **Horizontal Tab List** (CMP-09).
- **Vertical Tab List** (node `418:100259`) — the list-level wrapper, live-verified in a follow-up
  pass once Vertical Tab itself was Approved (see §6).

**Registry:** both rows' `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus:
"pending"` — a workflow-progress marker; per `CLAUDE.md`'s node resolution policy the stored
nodes were used directly). Both registry statuses were `Missing` — **zero prior implementation
existed** for either (unlike `Horizontal Tab`, which had a pre-workflow placeholder). Live-verified
via `get_metadata` + `get_design_context` (`disableCodeConnect: true`) + `get_variable_defs`;
flipped to `"resolved"` on success.

**Design documentation:** https://design.dga.gov.sa/guidelines/components/navigational/tabs
(same page as Horizontal Tab — one shared "Tabs" doc for both orientations).

Vertical Tab: 68 variants (`rtl` × `state`[Default/Hovered/Pressed/Focused/Disabled] ×
`size`[Small/Medium/Large] × `selected`) — no `icon`/`moreTab` boolean axis distinct from
Horizontal Tab's own (same `icon`/`swapIcon` props); no separate overflow-trigger sub-variant
exists. Vertical Tab List: 12 variants (`rtl` × `size` × `tabIcons`).

**Scope:** the individual **Vertical Tab** button and the **Vertical Tab List** wrapper — both
implemented as a new `orientation="vertical"` mode on the existing `Tabs` composite (matching the
registry's own original scope note: "our `Tabs` has no `orientation="vertical"` mode"), not a
separate component.

---

## 1. Structure differences from Horizontal Tab (same component family, CMP-09)

| Aspect | Horizontal Tab (Approved) | Vertical Tab (this pass) |
|---|---|---|
| Selection indicator | 3px-tall bar along the tab's **bottom** edge, inset horizontally | 3px-**wide** bar along the tab's **inline-start** edge (`left:0` in LTR), inset **vertically** (`padding-block`) |
| Selected font weight | **Bold** (700) | **Semibold** (600) |
| Unselected font weight | **Medium** (500) | **Regular** (400) |
| Padding (Medium) | inline 16px / block 12px | inline 12px / block 6px |
| Padding (Small) | inline 12px / block 8px | inline 6px / block 2px |
| Padding (Large) | 16px uniform | inline 12px / block 8px (**not** uniform — reuses the Medium inline value) |
| Font size (Large) | text-sm (14px) — same as every other size | **text-md (16px/24px line-height)** — the only size that changes text scale |
| Layout direction | row (tabs side-by-side) | column (tabs stacked) |
| `moreTab` overflow trigger | Yes (icon-only ⋯ shell) | **Not present** in the live variant set — not implemented |

Everything else — colors (`text-default`/`text-primary-paragraph`/disabled/hover/pressed/focus
tokens), the Hover/Pressed/Focused/Disabled state *mechanism* (neutral-hover background + black
preview indicator on unselected hover, neutral-pressed on press, the `Button`-style double-ring
focus treatment, solid disabled colors), the icon slot, and `radius-sm` — are **byte-identical**
to Horizontal Tab's own live-verified values (confirmed via direct `get_variable_defs`
comparison, not assumed). These reuse the already-shipped `--fads-sys-tabs-*` tokens directly
rather than minting a duplicate parallel set, since this is the same Figma `Tab/*` variable
family, not an independent component.

## 2. Sizing (all live-verified via `get_design_context` + `get_variable_defs`)

| Size | Padding | Font | Indicator vertical inset |
|---|---|---|---|
| Small (`sm`) | inline 6px / block 2px | text-sm 14px/20 | 4px (`spacing-xs`) |
| Medium (`md`) | inline 12px / block 6px | text-sm 14px/20 | 8px (`spacing-md`) |
| Large (`lg`) | inline 12px / block 8px | **text-md 16px/24** | 8px (`spacing-md`, same as Medium) |

## 3. Live-sampled quirk: Disabled + Selected uses a different weight than enabled-Selected

Live data (`node 418:99834`, Disabled/Selected/Medium) shows the label rendering in
**Medium (500)** weight — not Semibold (600), which every enabled-Selected sample uses. This
doesn't match either the enabled-Selected (Semibold) or enabled-Unselected (Regular) weight; it
is reproduced **exactly as sampled**, not "corrected" toward either, per the Visual Compliance
Rule ("do not invent, do not approximate"). Disabled+Unselected was not independently sampled —
extended by analogy from Horizontal Tab's own confirmed pattern (disabled preserves the
unselected weight), flagged Needs Confirmation.

## 4. Keyboard / ARIA (not a Figma concern — verified against WAI-ARIA APG independently)

Figma has no keyboard-interaction data. Per the WAI-ARIA APG "Tabs" pattern for a
`aria-orientation="vertical"` tablist, `ArrowDown`/`ArrowUp` (not `ArrowLeft`/`ArrowRight`) move
focus to the next/previous tab; `Home`/`End` are unchanged. Vertical arrow-key semantics are not
RTL-sensitive (up/down don't mirror), unlike Horizontal Tab's RTL-aware left/right swap.

## 5. Needs Confirmation

1. Disabled+Unselected weight — extended by analogy (Regular, matching enabled-Unselected),
   not independently sampled (see §3).
2. No `moreTab`-equivalent overflow affordance exists in the live 68-variant set — a vertical tab
   list that overflows its container is expected to scroll vertically (`overflow-y: auto`), same
   non-invented interpretation already used for Horizontal Tab's `overflow-x: auto`.

## 6. Vertical Tab List (node `418:100259`, 12 variants: `rtl` × `size` × `tabIcons`)

Live-verified structure, sampled across Medium/`tabIcons=True`, Small/`tabIcons=False`, and
RTL/Medium/`tabIcons=True`:

- **Container**: `flex flex-col items-start` — plain column, no fixed width in the component
  itself (the 150px seen in every sampled instance is this particular demo's own sizing, driven
  by its sample text, not a prescribed component width).
- **No inter-tab gap** — tabs sit directly adjacent, spacing comes only from each tab's own
  `padding-block`. Same "no invented gap" finding already confirmed for Horizontal Tab List.
- **No baseline divider** — confirmed absent in every sampled size/`tabIcons` combination. Unlike
  Horizontal Tab List (which has a live-verified `divider` boolean prop with a real 3px baseline
  element), Vertical Tab List has **no divider concept at all** — not a prop that defaults to
  off, genuinely not part of the component.
- **No `flush`-equivalent prop** — the extracted `VerticalTabListProps` type only exposes `rtl`/
  `size`/`tabIcons`, confirming `flush` is a Horizontal Tab List-only concept.
- Each tab renders **full-width** (`w-full`) inside the column, matching the already-implemented
  `orientation="vertical"` behavior (`align-items: stretch` on the tab row).
- `tabIcons` is a per-list convenience toggling every child tab's icon at once in the Figma demo —
  already achievable with this codebase's existing per-item `TabItem.icon` API (no new prop
  needed, consumer sets `icon` on every item or none).
- RTL sample: indicator flips from `inset-inline-start` to the visual right edge automatically via
  the already-implemented logical CSS properties (no DOM reordering needed, same finding as every
  other Tabs orientation/axis); title text right-aligns via `dir="auto"` (already the consumer's
  responsibility via the `label` slot, unchanged).

**Conclusion: the existing `orientation="vertical"` implementation (built for Vertical Tab, see
§§1–5) already satisfies Vertical Tab List's full live-verified structure — no additional code
changes were required.** This is a re-verification pass, not a rebuild, per
`reports/VISUAL_COMPLIANCE/VerticalTab/VISUAL_COMPLIANCE_VERTICAL_TAB.md`'s §6 addendum.
