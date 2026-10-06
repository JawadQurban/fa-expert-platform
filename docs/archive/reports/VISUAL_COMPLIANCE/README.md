# Visual Compliance Reports

This folder holds the **per-component** evidence trail for the Platforms Code
visual-compliance workflow defined in `docs/VISUAL_COMPLIANCE_WORKFLOW.md`. The
current approval status of every component tracked so far is in
`docs/COMPONENT_APPROVAL_MATRIX.md`.

## Convention

Each component that goes through the workflow gets its own folder here, named after
the component:

```
reports/VISUAL_COMPLIANCE/
├── README.md                          (this file)
├── Button/
│   └── VISUAL_COMPLIANCE_BUTTON.md
├── Card/
│   └── VISUAL_COMPLIANCE_CARD.md
├── Header/
│   └── VISUAL_COMPLIANCE_HEADER.md
├── Footer/
│   └── VISUAL_COMPLIANCE_FOOTER.md
└── ...
```

A component's folder is created the first time it enters the workflow (Step 4 of
`docs/VISUAL_COMPLIANCE_WORKFLOW.md`) and holds:

- `VISUAL_COMPLIANCE_<COMPONENT>.md` — the compliance report itself: missing variants,
  incorrect spacing/typography/radius/token usage/interaction, missing accessibility,
  missing RTL behavior, and the required-code-changes checklist, compared against the
  Figma specification in `docs/FIGMA_<COMPONENT>_SPECIFICATION.md`.
- Any superseding passes are appended to the same file (see Button's report for the
  pattern — new findings at the top, prior passes kept at the bottom under a collapsible
  "superseded" section) rather than creating a second report file, so a component's
  full compliance history stays in one place.

The paired Figma specification document (`docs/FIGMA_<COMPONENT>_SPECIFICATION.md`,
produced in Step 2 of the workflow) stays in `docs/`, alongside the rest of the
design-system documentation — only the *compliance report* (the comparison + fix
record) lives under this folder.

## Button

Button (CMP-05) was the first component through the workflow and is `✅ Approved`
(`docs/COMPONENT_APPROVAL_MATRIX.md`). Its report lives at
[`Button/VISUAL_COMPLIANCE_BUTTON.md`](Button/VISUAL_COMPLIANCE_BUTTON.md).

The report previously lived directly at `reports/VISUAL_COMPLIANCE_BUTTON.md` (before
this per-component folder convention existed). That path now contains a short redirect
stub instead of being deleted, because `Button.tsx`/`Button.module.css`/`Button.test.tsx`
contain code comments citing the old path, and per the task that established this
convention, Button's React component files were not modified.

## Pending components

`Card`, `Header`, `Footer`, `Typography`, `Input` (`TextInput`), `Container`, and
`Section` are queued in `docs/COMPONENT_APPROVAL_MATRIX.md` as `⏳ Pending` — none of
them have a folder here yet. A folder is created for each one only when it actually
enters Step 2 of the workflow (Figma specification created), not before.
