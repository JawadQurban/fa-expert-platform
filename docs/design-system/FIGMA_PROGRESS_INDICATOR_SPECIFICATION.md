# Figma Progress Indicator (Stepper) — Official Specification

**Source of truth:** Figma file `J0xq7JG3JKshRDzrgAM7E0` ("Components Library - Platforms Code
(Community)"), component set **Progress Indicator** (node `30150:68350`), category "Progress &
Structure". **Registry:** `nodeId`/`figmaUrl` were already populated (`nodeResolutionStatus:
"pending"` — a workflow-progress marker; the registry's own pre-existing note already recorded
"Maps to FADS 'Steps' component"). Live-verified this pass via
`get_metadata`/`get_design_context`/`get_variable_defs`; flipped to `"resolved"` on success.
**Design documentation:** https://design.dga.gov.sa/guidelines/components/forms-and-inputs/steps
**Figma description:** "The Steps UI element facilitates step-by-step navigation through a
process or sequence... provides clear visual cues, indicating the current step, to help users
understand their progress."

Extracted via read-only Figma MCP tools. 48 variants (`rtl` × `alignment` [Horizontal/Vertical] ×
`state` [Completed/Current/Upcomming] × `hover` × `focused`); 3 sampled directly via
`get_design_context` (Horizontal/Current, Horizontal/Completed, Vertical/Completed), plus
`get_variable_defs` on the component-set root.

---

## 1. This Is a Stepper, Not a Progress Bar

Confirmed by both the visual structure (discrete numbered/checkmarked circles connected by lines,
one per named step) and the Figma description ("step-by-step navigation through a process").
**No measurable numeric progress is represented** (no percentage, no continuous fill) — per this
task's explicit instruction, `role="progressbar"` is never used. Semantics stay exactly what the
pre-existing `Steps` implementation already used: a real `<ol>` with `aria-current="step"` on the
current item — confirmed correct, not changed.

## 2. Structure (live-verified via `get_design_context`)

Each step is: a **marker** (32px circle) + a **connector line** to the next step, stacked above a
**text block** (step name + optional description). `alignment` controls whether the marker+line
row sits *above* the text (Horizontal) or *beside* it as a column (Vertical) — confirmed by
directly comparing the Horizontal-Completed and Vertical-Completed samples.

- **Completed**: filled circle (`stepper-button-completed` `#1b8354`) containing a white
  checkmark icon (`tick-02`, node `13758:242504`). Connector line after it: `stepper-line-completed`
  `#1b8354` (green).
- **Current**: outlined circle (`border-2`, `stepper-button-current` `#1b8354`) containing the
  step number, bold step-name text (`stepper-text-primary` `#1f2a37`). Connector line after it:
  `stepper-line-current` `#d2d6db` — the **same muted gray as Upcoming's own line**, not green
  (live-verified, not assumed — the "current" segment leads to an unreached step).
- **Upcoming** ("Upcomming" in Figma, a spelling artifact of the source file, not reproduced in
  this repo's API): outlined circle (`stepper-button-upcomming` `#d2d6db`) containing the step
  number, muted step-name text (`stepper-text-secondary` `#384250`).

`showStepName`/`showDescription` are real boolean content properties on the Figma component
(confirmed in the extracted props, not assumed) — the description slot IS official, unlike some
other components' invented extensions.

## 3. Interaction States (Hover/Focused)

Both are sampled for Completed/Current/Upcoming, confirming Steps are meant to be genuinely
interactive (not purely decorative), consistent with the pre-existing implementation's
completed-step-as-button pattern (`INTERACTION_SPECIFICATION.md` §4: navigation via step buttons
only, never free-jump). Hover tokens: `stepper-button-completed-hovered` `#166a45`,
`stepper-line-completed-hovered` `#166a45`, `stepper-line-upcomming-hovered` `#9da4ae` — all
live-verified and wired to the clickable (completed) step's `:hover`.

## 4. No Disabled or Error State Exists — Extensions, Disclosed

The task requires supporting `disabled`/`error`/`optional` per step. None of the 3 official states
(Completed/Current/Upcoming) include Disabled or Error, and `get_variable_defs` on the whole
component-set root returned no `stepper-*-disabled`/`stepper-*-error` token at all — confirmed
absent, not merely unsampled. Per the source-of-truth priority (live Figma unavailable for this
specific need → fall back to existing approved conventions), `disabled`/`error` are implemented
using this design system's **already-verified, cross-cutting** tokens (`Global.text-default-
disabled`, `Border.border-error`) rather than inventing new Stepper-specific colors. `optional` is
a plain text-content addition (an "(Optional)" suffix using the already-verified
`stepper-text-tertiary` token) with no new color at all. All three are flagged Needs Confirmation
in the sense that their *visual treatment* isn't itself pixel-verified for the Stepper
specifically — but nothing about them is fabricated from nothing.

## 5. Accessibility

- Real `<ol>` + `aria-current="step"` (unchanged from the pre-existing, already-correct
  implementation) — never `role="progressbar"`.
- **Bug found and fixed this pass**: the marker circle is `aria-hidden` (it's decorative — a
  number or checkmark glyph), and the visible step-name text was moved to a separate block for
  correct Horizontal/Vertical layout fidelity (§2) — this accidentally left clickable step
  `<button>`s with **no accessible name** at all (caught by this pass's own axe scan, not assumed
  fine). Fixed via `aria-labelledby` pointing at the step-name text's `id` (an instance-scoped
  `useId()`-derived id, safe for multiple `<Steps>` instances on one page).
- Disabled steps get `aria-disabled="true"` and are never rendered as a `<button>` even when
  `onStepClick` is given and the step is otherwise completed.

## 6. Needs Confirmation

1. `disabled`/`error`/`optional` visual treatment (§4) — functionally correct and using only
   already-approved tokens, but not independently pixel-verified for this component.
2. Exact hover/focus visual treatment beyond the color tokens themselves (e.g. whether a focus
   ring should also appear on non-interactive current/upcoming steps) — implemented conservatively
   (focus ring only on the real interactive `<button>` elements).
