# Decision Record — GOV-SA Repository is a Legacy Reference, Not a Token Source

> **Status:** ACCEPTED · **Date:** 2026-07-08 · **Decision owner:** Client directive + Principal Frontend Architect
> **Type:** Architecture Decision Record (supersedes any implication in the earlier task that the repo could close token gaps)

---

## Context

The repository **https://github.com/GOV-SA/design-system-gov.sa** was added to the project as an authoritative reference ("higher priority than community examples"). A full analysis (`DGA_REPOSITORY_ANALYSIS.md`) established that it is the **legacy "GOV.SA Design System" (v0.0.1, last pushed Dec 2022)**: Bootstrap 4 + jQuery + SCSS/BEM, using **TheSans/Noto Naskh** fonts, with **no** token JSON, Style Dictionary, CSS-variable token layer, Tailwind, Storybook, React, or Figma tokens.

This project targets the **DGA Platforms Code v1.0 (كود المنصات)** — the newer, token-based system mandated by the official compliance checklist `references/DGA_Standards.xlsx` `[S3]`, which requires **IBM Plex Sans Arabic** and approved Design Tokens. The two are **different generations**.

## Decision

1. **Treat the GOV-SA repository as a *legacy reference only*** — not as the authoritative DGA Platforms Code v1.0 token source.
2. **Do NOT import its tokens** (colors, spacing, radius, type) **as final DGA tokens.**
3. **Do NOT copy its SCSS values into FADS** unless each value is independently **verified against official Platforms Code v1.0** references.
4. **Do NOT treat the repository as closing Q3 or Q20.** Those remain **OPEN** until official Platforms Code v1.0 token values are obtained from the **official Figma, official website, or an official token package** (`TOKEN_SOURCE_STRATEGY.md`).
5. **Permitted uses only:** historical component-structure reference, Sass/CSS implementation patterns, component-behavior comparison, and gap identification vs Platforms Code v1.0.
6. **FADS continues on placeholder tokens** — no hard-coded visual values, **no pixel-perfect DGA compliance claim.**

## Source hierarchy (reaffirmed)

```
★★★★★  Platforms Code website [S1]  ·  Figma [S2]  ·  Standards Excel [S3]   ← AUTHORITATIVE (v1.0)
★★★★☆  Presentation [S4]
★★★☆☆  DGA UI example [S5]
──────  GOV-SA legacy repo [LEGACY]  ← reference above community examples, BELOW Platforms Code, NOT a v1.0 token source
★★☆☆☆  LinkedIn / community [S6]
```

## Rationale

- **Font conflict:** legacy uses TheSans/Noto; Platforms Code mandates IBM Plex Sans Arabic (`[S3: F5]`, `DESIGN_CONSTRAINTS.md DC-07`). Adopting legacy would regress compliance.
- **Architecture conflict:** legacy is Bootstrap/jQuery/SCSS-BEM; FADS is React/TS with a CSS-variable token layer. Not interoperable.
- **Generation/age:** last pushed Dec 2022, `v0.0.1`, predates Platforms Code v1.0.
- **No authoritative tokens:** no JSON/Style-Dictionary/Figma tokens; only GOV.SA-era SCSS `$vars` whose values are **unverified** against Platforms Code.
- **"Do not invent values"** + **"official approach wins"** → the only correct action is to keep placeholders and escalate to the official token source.

## Consequences

- ✅ Compliance integrity preserved (no wrong-generation values injected).
- ✅ Placeholder-token policy and Q3/Q20 status **unchanged**.
- ✅ Phase 5 component work continues unblocked on placeholders.
- ⚠ Final visual fidelity still depends on obtaining official Platforms Code v1.0 tokens.
- ➕ We gain a legacy reference for structure/pattern/gap analysis.

## Related
`DGA_REPOSITORY_ANALYSIS.md` · `TOKEN_SOURCE_STRATEGY.md` · `COMPONENT_GAP_ANALYSIS.md` · `QUESTIONS.md` (Q3, Q20, Q8, Q34) · `DESIGN_TOKENS.md` · `DESIGN_SYSTEM_SPECIFICATION.md`.
