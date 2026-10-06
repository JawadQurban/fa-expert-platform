# DGA Implementation Order — Rationale

Why `docs/DGA_COMPONENT_IMPLEMENTATION_QUEUE.md` is ordered the way it is. Four factors were
weighed for every batch, in this priority: **reuse**, **risk**, **refactoring cost**, **token/
primitive sharing**.

## 1. Maximum component reuse

Every batch is ordered so nothing gets built twice, and so foundational pieces exist before
anything that composes them:

- **Label (Batch 01) before any form input work (Batch 01's own Text Input, and Batch 03).**
  Seven discovered Figma components — Text Input, Checkbox Label, Radio Label, Switch Label,
  Textarea, Number Input, Input Prefix-Suffix — all depend on `Label`. FADS currently buries this
  inside the internal `Field` helper; extracting it once, first, means nothing downstream ever
  re-derives label/error/helper wiring per input. **Corrected 2026-07-12:** Label was originally
  scheduled in Batch 02, one batch *after* Text Input (Batch 01) — a forward-dependency violation
  caught by this hardening pass's dependency check (`reports/PLANNING_HARDENING_REPORT.md §3`).
  Since Label is a low-risk extraction of code that already ships (not new UI), moving it into
  Batch 01 was strictly better than delaying Text Input's verification to Batch 02.
- **Button-Close (Batch 02) before Modal/Toast/Notification visual-compliance (Batch 07).**
  All three already implement their own inline dismiss button today. Batch 02 extracts the
  shared primitive once; Batch 07 then only needs to re-point three components at it instead of
  fixing three separate dismiss-button implementations against the Figma spec independently.
- **Menu + Menu list item, then Button-menu — all in Batch 05, in that order.**
  `Button-menu`'s own description ("toggle to reveal a menu") makes it a strict consumer of
  `Menu`. **Corrected 2026-07-12:** Button-menu was originally scheduled in Batch 02, three
  batches before Menu (Batch 05) — another forward-dependency violation. Pulling `Menu` forward
  to Batch 02 instead was considered and rejected: Menu has its own dependency chain (Menu list
  item → Item Icon/Trailing Icon/Tag) that would just relocate the same problem one level down.
  Moving `Button-menu` back to join `Menu` in Batch 05 was the smaller, cleaner change.
- **Header/NavDrawer/Menu grouped into one batch (05)**, not spread across three, because they
  share the same popover/overlay/focus-trap mechanics FADS already has in
  `hooks/useFocusTrap` (built for `Modal`/`DatePicker`/`NavDrawer`). Doing them together means
  one round of "does the shared overlay hook handle this new case" instead of three.
- **Patterns last (Batch 09), always.** A pattern is by definition a composition of already-built
  components (`docs/COMPONENT_INVENTORY.md §5`); building one before its ingredients exist
  guarantees a rebuild the moment the ingredient's real API lands.

## 2. Lowest implementation risk

- **Batch 01 (visual-compliance verification only, zero new components) goes first.** These are
  the safest possible next steps: the React code already exists, is tested, and is shipped on
  the live Hackathon landing page. The only risk is a token/spacing/color correction — the same
  low-risk, well-understood process that already succeeded five times (Button, Card, Header,
  Footer, Divider). No new architecture, no new a11y pattern, no new state machine.
- **Two `NeedsConfirmation` duplicate pairs (Header Menu / Header Menu Item search hits sharing
  component keys with already-Approved sub-parts) are resolved at the *start* of Batch 05, before
  any building in that batch**, not discovered mid-implementation. Confirming first prevents the
  worst risk in this catalog: building a second "Header Menu" component that turns out to be the
  one already shipped.
- **Q5/Q10/Q-blocked items (Digital Stamp, Extension, Search Box) are pushed to the end of their
  natural batch** (08, 03) with an explicit skip-and-requeue-to-09 instruction, so an unresolved
  client question never stalls an entire batch the way it would if it sat earlier in the queue.
- **Table's two riskiest sub-parts (Sort/Filter header cells) are isolated in Batch 06** rather
  than bundled with the already-Partially-Implemented base `Table` — `Table` itself keeps
  shipping in its current (working, tested) form while the two genuinely new pieces are added
  incrementally, avoiding a risky full-Table rewrite in one step.

## 3. Lowest refactoring

- **Vertical Tab/Tab List (Batch 04) is scoped as "extend `Tabs` with `orientation="vertical"`,"**
  not a new component — the existing roving-tabindex/RTL-aware Arrow-key logic
  (`docs/PROJECT_STATUS.md`'s Phase 5B note) is orientation-agnostic by construction, so this is
  additive, not a rewrite.
- **File Upload / Single vs. Multiple stays one component (`FileUploader(multiple)`)** unless
  Batch 03's visual-compliance pass finds the two Figma variants are pixel-distinct beyond the
  file-list rendering — deferring the split decision avoids a forced refactor now for a
  distinction that may not visually exist.
- **Dropdown Input / Select is scheduled for visual-compliance in Batch 03, not a rebuild.** The
  native-`<select>` implementation is deliberately kept as the working baseline; Dropdown List
  Item/Trailing Icon are additive sub-parts for a *custom* popover variant, only justified if the
  live Figma comparison shows the native rendering is visually non-compliant (same evidence-first
  posture as Button's `secondary`/`tertiary` correction, which recolored in place rather than
  introducing new component variants speculatively).
- **Notification vs. Alert/Banner split resolution comes before, not after, doing visual work on
  either (Batch 07).** If the live node shows one Figma component with an inline/banner variant
  axis, FADS's existing two-component split may need consolidating — better to know that before
  spending effort matching colors/spacing on two components independently.

## 4. Shared token and primitive reuse

- **Batch order roughly tracks the existing token layers already proven out:** Button
  (`--fads-sys-button-*`), Card (`--fads-sys-card-*`), Header (`--fads-sys-header-*`), Footer
  (`--fads-sys-footer-*`), Divider (`--fads-sys-divider-*`) each added a scoped, additive token
  layer with zero cross-component repointing (verified by the existing
  `no-cross-component-repointing` lint check). Every subsequent batch is expected to follow the
  same additive-token pattern — Batch 01's `Label` will need its own
  `--fads-sys-label-*` layer that Text Input (same batch) and Batch 03's six other dependents
  then consume, rather than each input inventing its own label styling.
- **Icon-dependent components (Item Icon, Help Icon, List item, Trailing Icon) are deliberately
  spread across Batches 05–07, not grouped,** because they share one real constraint instead of
  each other: all consume the existing `Icon` primitive and its 237-icon (and growing) registry
  (`docs/ICON_LIBRARY.md`) — there's no benefit to batching them together, and doing so would
  create an artificial "icon batch" that doesn't match how they're actually used (each belongs
  conceptually with its parent component).
- **Typography verification sits in Batch 01** specifically because `Metric` (Batch 06) and
  every text-heavy component after it implicitly depends on the type scale being confirmed
  first — cheaper to verify once, early, than to silently inherit an unverified scale into six
  later batches and have to redo them if Typography turns out to need correction.

## Net effect

Batch 01 touches almost no new visual surface (verification + one low-risk primitive
extraction, Label) and is the cheapest, safest place to spend the next session. Batch 02 adds
two small, independent, genuinely-missing Actions components. Batches 03–06 are where the bulk
of the 34 newly-discovered components land, ordered so each only ever depends on something
already finished in an earlier batch (verified mechanically — see
`reports/PLANNING_HARDENING_REPORT.md §3` for the dependency-check method and its two fixes,
Label and Button-menu). Batches 07–08 close out the remaining independent overlays/trust
components. Batch 09 is patterns, which by construction cannot start earlier without guaranteed
rework.
