# Visual Compliance Report — TOC

**Status:** ✅ Approved (2026-07-20) · **Registry:** was `Missing`, zero prior
code · **Node:** `2962:38090` (`J0xq7JG3JKshRDzrgAM7E0`) · **Depends on:**
`TocItem` (Approved, same session)

## Summary

New build — no pre-existing implementation to diff against.

## Verification method

Figma MCP `get_design_context` (`disableCodeConnect: true`) on node
`2962:38090`, which returned both the `Toc` wrapper and its nested `TocItem`
demo composition in one response (the child `TocItem` component was already
independently verified in this same session's prior pass — no double
sampling needed).

## What was built

`Toc.tsx` / `Toc.module.css` — a `<nav>` landmark wrapping an `eyebrow`+
`title` heading block and a `children` slot for consumer-composed
`<TocItem>`s. No `items` config array — the live node's own structure is a
flat, fixed list, so `children` composition matches it exactly without
inventing a parameterized API the design doesn't have.

## Findings

- The container itself carries no border/background/shadow — it is purely
  layout (an 8px-gap column) around the heading and item stack.
- No `count`/`items` variant axis exists — `rtl` is the only sampled
  property on the wrapper itself.

## Tokens

6 new additive `--fads-sys-toc-*` tokens — see
`docs/FIGMA_TOC_SPECIFICATION.md` §5.

## Tests / Stories

`Toc.test.tsx` (5 tests): nav landmark + title, eyebrow present/absent,
composed children render, axe. `Toc.stories.tsx`: Default, WithoutEyebrow,
**OfficialFigmaReference** (mixed level 1/2/3 list matching the live demo),
RTL.

## Needs Confirmation

See spec §6 — the `eyebrow`/`title`/`children` prop shape is a disclosed,
reasonable generalization of the live node's own fixed demo content, since
TOC has no other Figma-defined variant properties to map against.
