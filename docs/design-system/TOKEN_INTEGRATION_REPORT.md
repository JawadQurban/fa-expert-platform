# Token Integration Report

## Summary

The frontend token layer now consumes values sourced from the official Figma foundations export under [references/figma/foundations/Values.tokens.json](../../references/figma/foundations/Values.tokens.json). The semantic token API remains unchanged, so components continue to reference `--fads-sys-*` variables while the primitive layer is generated into [frontend/src/design-system/tokens/generated/tokens.css](../../frontend/src/design-system/tokens/generated/tokens.css).

## Source mapping

- Neutral scale → Figma Neutral palette values
- Primary scale → Figma Green palette values
- Status colors → Figma Red/Yellow/Blue palette values
- Spacing scale → Figma spacing tokens
- Radius scale → Figma radius tokens
- Typography family/scale → Figma typography tokens

## Integration notes

- The token contract in [frontend/src/design-system/tokens/tokens.ts](../../frontend/src/design-system/tokens/tokens.ts) remains stable.
- The implementation keeps the existing theme provider behavior intact; the theme attribute still switches the token context without changing component usage.
- Generated artifacts now live in [frontend/src/design-system/tokens/generated](../frontend/src/design-system/tokens/generated) and are produced from the official Figma foundations export under [references/figma/foundations/Values.tokens.json](../../references/figma/foundations/Values.tokens.json).
- This phase covers the token integration layer only; it does not claim final DGA approval for every visual state.
