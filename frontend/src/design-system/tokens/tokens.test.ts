import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { token } from './tokens';

const cssPath = path.resolve(process.cwd(), 'src/design-system/tokens/generated/tokens.css');
const tsPath = path.resolve(process.cwd(), 'src/design-system/tokens/generated/tokens.ts');
const mapPath = path.resolve(process.cwd(), 'src/design-system/tokens/generated/token-map.json');

describe('token integration layer', () => {
  it('keeps the semantic token API stable while referencing the CSS token layer', () => {
    expect(token.color.primary.default).toBe('var(--fads-sys-color-primary)');
    expect(token.color.text.default).toBe('var(--fads-sys-color-text-default)');
    expect(token.space.inset.md).toBe('var(--fads-sys-space-inset-md)');
    expect(token.radius.md).toBe('var(--fads-sys-radius-md)');
  });

  it('uses Figma-sourced values for the primitive token scale', () => {
    const css = readFileSync(cssPath, 'utf8');

    expect(css).toContain('--fads-ref-neutral-900: #111927;');
    expect(css).toContain('--fads-ref-primary-500: #25935f;');
    expect(css).toContain('--fads-ref-space-1: 0.25rem;');
    expect(css).toContain('--fads-ref-space-2: 0.5rem;');
    expect(css).toContain('--fads-ref-radius-md: 8px;');
    expect(css).toContain('--fads-ref-font-family-base:');
  });

  it('generates the requested token artifacts', () => {
    expect(existsSync(cssPath)).toBe(true);
    expect(existsSync(tsPath)).toBe(true);
    expect(existsSync(mapPath)).toBe(true);

    const ts = readFileSync(tsPath, 'utf8');
    const map = JSON.parse(readFileSync(mapPath, 'utf8')) as {
      tokens?: Record<string, { value?: string }>;
    };

    expect(ts).toContain('export const token');
    expect(map.tokens).toBeDefined();
    expect(map.tokens?.['--fads-ref-primary-500']?.value).toBe('#25935f');
  });
});
