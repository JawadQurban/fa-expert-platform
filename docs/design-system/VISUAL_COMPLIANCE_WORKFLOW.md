# Visual Compliance Workflow

This document defines the **official, mandatory process** for bringing any FADS
component into visual compliance with the official Platforms Code Figma component
library. It formalizes the process actually followed for `Button` (CMP-05) — the
first component to complete it — as the repeatable template for every component
after it. Tracking lives in `docs/COMPONENT_APPROVAL_MATRIX.md`; evidence lives in
`reports/VISUAL_COMPLIANCE/<Component>/`.

This workflow implements `CLAUDE.md`'s **Visual Compliance Rule** ("Do not redesign
components. Do not approximate components. Do not invent variants... Fix one
component at a time") and **Figma MCP Policy** (read-only tools only).

## Governing rules (non-negotiable)

- **One component at a time.** Never start Step 1 for a new component before the
  previous one has reached **Approved** in `docs/COMPONENT_APPROVAL_MATRIX.md`.
- **Read-only Figma access only.** Only `search_design_system`, `get_metadata`,
  `get_design_context`, `get_screenshot`, and `get_variable_defs` may be used. Never
  `use_figma`, `create_new_file`, `generate_figma_design`, `upload_assets`,
  `send_code_connect_mappings`, or `add_code_connect_map` — the Figma file is a
  read-only source of truth and must never be modified by this process.
- **Never invent.** Any value, variant, or behavior that cannot be verified live
  against the actual Figma component must be marked **Needs Confirmation** — not
  guessed, not approximated from a similar component, not filled in from a static
  token export alone if a live check is possible.
- **Fix only the component in scope.** No other component's `.tsx`/`.module.css`,
  no shared/global token may change in a way that alters another component's
  rendered output. New tokens are additive (a new `--fads-sys-<component>-*`
  custom property), never a rewrite of a token another component already consumes.
- **No landing page / product page changes.** This workflow only touches
  `frontend/src/design-system/`, never `frontend/src/pages/`.

## The 10 steps

### 1. Select the component

Pick the next `⏳ Pending` row, top-to-bottom, from `docs/COMPONENT_APPROVAL_MATRIX.md`.
Do not skip ahead to a component further down the list while an earlier one is
still in progress.

### 2. Inspect the official Figma component (read-only MCP)

1. `search_design_system` — locate the component in the official Platforms Code
   library and get its `componentKey`/description/documentation link.
2. `get_metadata` — resolve the componentKey to a concrete file + node (a
   component-set node typically contains every variant as a child), and only if
   additional hierarchy detail is needed beyond a single `get_design_context` call.
3. `get_design_context` — pull real geometry (auto-layout, padding, gap, radius,
   borders), color/typography token names + fallback hex/px values, and code
   context for the Default variant and every state/size/style axis that can be
   reasonably sampled (see Button's spec for the sampling pattern — one
   representative node per size, per state, per style, plus any modifier axes
   like destructive/on-color/icon-only).
4. `get_variable_defs` — confirm the token names/values referenced in the sampled
   nodes.
5. `get_screenshot` — capture a visual reference for at least the Default state.

If the Figma file only exposes a "how to install this library" onboarding file
rather than the real component nodes (as happened on the first attempt for
Button), stop and get the correct node-specific Figma URL before proceeding —
never guess a node ID.

### 3. Generate the Figma specification

Produce `docs/FIGMA_<COMPONENT>_SPECIFICATION.md` covering, at minimum: component
hierarchy, all variants/properties, sizes, states, auto-layout configuration,
padding, internal spacing, typography, border radius, borders, shadows, icons,
every token used (name + value + source), accessibility notes, RTL behavior,
motion/interaction notes, and responsive behavior. Mark anything not directly
verified as **Needs Confirmation**, per `docs/FIGMA_BUTTON_SPECIFICATION.md`.

### 4. Compare against the current React implementation

Create `reports/VISUAL_COMPLIANCE/<Component>/VISUAL_COMPLIANCE_<COMPONENT>.md`
comparing the Figma specification against
`frontend/src/design-system/**/<Component>/`. Cover: missing variants, incorrect
spacing, incorrect typography, incorrect radius, incorrect token usage, incorrect
interaction, missing accessibility, missing RTL behavior, and a concrete
required-code-changes checklist. **No code changes at this stage** — this is a
comparison report only.

### 5. Fix only that component

Implement the required-code-changes checklist from Step 4:

- Remove any dead/undefined CSS custom-property references found along the way
  (check with `npm run tokens:check-coverage`).
- If a required official value exists in Figma but has no generated token yet,
  extend `scripts/generate-tokens.mjs` additively (new tokens only, sourced from
  `references/figma/foundations/*.tokens.json` where possible, or documented as
  "live Figma MCP verified" with the node ID cited when no local JSON variable
  exists — see Button's `--fads-sys-button-*` tokens for the pattern) and run
  `npm run tokens:generate`.
- Update the component's own `.tsx`/`.module.css` only. Do not touch any other
  component, shared token a sibling component depends on, or any page.

### 6. Update Storybook

Add/update the component's `.stories.tsx` to cover every corrected and newly
added variant/state, so the fix is visible and reviewable in Storybook.

### 7. Update tests

Update the component's `.test.tsx`: replace any assertions on now-corrected
(previously wrong/fabricated) values, and add coverage for every new
variant/prop/behavior introduced in Step 5.

### 8. Run full validation

All of the following must be green before proceeding:

```
npm run tokens:validate   # regenerate + token test + coverage gate (0 missing)
npm run typecheck
npm run lint              # includes lint:css (DC-04/DC-23 checks)
npm run format:check
npm run test               # full suite — confirms no other component regressed
npm run build
npm run build-storybook
```

If any other component's tests fail as a result of a Step 5 change, that change
was out of scope — revert it and re-scope to the component in question.

### 9. Mark approval status

Update the component's row in `docs/COMPONENT_APPROVAL_MATRIX.md`: fill in every
column with real evidence (links to the spec, the report, the source files, the
stories, the tests) and set **Approved** only once every column is satisfied and
Step 8 is fully green. Partial progress stays `⏳ Pending` with the completed
columns checked — never mark a component `✅ Approved` with an open "Needs
Confirmation" item that blocks correctness (cosmetic/unsampled edge cases noted
as Needs Confirmation, per Button's report, do not block approval; incorrect or
unverified core variants/tokens do).

### 10. Move to the next component only after approval

Once `docs/COMPONENT_APPROVAL_MATRIX.md` shows the component as `✅ Approved`,
update `CHANGELOG.md` and `docs/PROJECT_STATUS.md`, then return to Step 1 for the
next `⏳ Pending` component.

## Definition of "Approved"

A component is **Approved** only when all of the following are true:

| Requirement | Evidence |
|---|---|
| Figma spec exists and is live-MCP-verified | `docs/FIGMA_<COMPONENT>_SPECIFICATION.md` |
| Compliance report exists | `reports/VISUAL_COMPLIANCE/<Component>/VISUAL_COMPLIANCE_<COMPONENT>.md` |
| Implementation matches the spec (or documents a deliberate, scoped exception) | Component source diff |
| Storybook covers every variant/state | `<Component>.stories.tsx` |
| Tests cover every corrected/new behavior | `<Component>.test.tsx` |
| Accessibility verified (axe + keyboard + focus-visible) | Test suite + manual note in the report |
| Full validation green | Step 8 output |
| Matrix + governance docs updated | `docs/COMPONENT_APPROVAL_MATRIX.md`, `CHANGELOG.md`, `docs/PROJECT_STATUS.md` |
