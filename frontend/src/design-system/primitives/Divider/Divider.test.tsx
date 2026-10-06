import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Divider } from './Divider';

describe('Divider visual compliance (docs/FIGMA_DIVIDER_SPECIFICATION.md, reports/VISUAL_COMPLIANCE/Divider/VISUAL_COMPLIANCE_DIVIDER.md)', () => {
  const cssPath = path.resolve(process.cwd(), 'src/design-system/tokens/generated/tokens.css');
  const css = readFileSync(cssPath, 'utf8');
  const dividerCssPath = path.resolve(
    process.cwd(),
    'src/design-system/primitives/Divider/Divider.module.css'
  );
  const dividerCss = readFileSync(dividerCssPath, 'utf8');

  it('generates the official Divider color/thickness tokens from Light.tokens.json / live Figma MCP verification', () => {
    expect(css).toContain('--fads-sys-divider-color-neutral: #d2d6db;');
    expect(css).toContain('--fads-sys-divider-color-primary: #1b8354;');
    expect(css).toContain('--fads-sys-divider-color-white: #ffffff;');
    expect(css).toContain('--fads-sys-divider-color-alpha-white: rgba(255, 255, 255, 0.3);');
    expect(css).toContain('--fads-sys-divider-thickness: 1px;');
  });

  it('does not hardcode colors, borders, spacing, or thickness', () => {
    expect(dividerCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(dividerCss).not.toMatch(/\brgba?\s*\(/);
    // The only literal border declaration allowed is "border: none" (removing the
    // native default) — no hardcoded border width/color (e.g. "1px solid ...").
    expect(dividerCss).not.toMatch(/border:\s*\d/);
    expect(dividerCss).toContain('border: none;');
  });

  it('does not repoint shared or other components’ tokens', () => {
    expect(dividerCss).not.toContain('--fads-sys-color-border-default');
    expect(dividerCss).not.toContain('--fads-sys-button-');
    expect(dividerCss).not.toContain('--fads-sys-card-');
  });

  it('uses only logical CSS properties (RTL-safe)', () => {
    expect(dividerCss).not.toMatch(/\b(left|right|margin-left|margin-right)\s*:/);
  });
});

describe('Divider', () => {
  it('renders a horizontal separator by default', () => {
    renderWithProviders(<Divider />);
    const el = screen.getByRole('separator');
    expect(el).toHaveAttribute('data-orientation', 'horizontal');
    expect(el).not.toHaveAttribute('aria-orientation');
  });

  it('renders a vertical separator with aria-orientation', () => {
    renderWithProviders(<Divider orientation="vertical" />);
    const el = screen.getByRole('separator');
    expect(el).toHaveAttribute('data-orientation', 'vertical');
    expect(el).toHaveAttribute('aria-orientation', 'vertical');
  });

  it.each(['neutral', 'primary', 'white', 'alphaWhite'] as const)(
    'applies the %s color variant',
    (color) => {
      renderWithProviders(<Divider color={color} />);
      expect(screen.getByRole('separator')).toHaveAttribute('data-color', color);
    }
  );

  it('applies data-inset when inset is set', () => {
    renderWithProviders(<Divider inset />);
    expect(screen.getByRole('separator')).toHaveAttribute('data-inset', 'true');
  });

  it('defaults to full width (data-full-width)', () => {
    renderWithProviders(<Divider />);
    expect(screen.getByRole('separator')).toHaveAttribute('data-full-width', 'true');
  });

  it('omits data-full-width when fullWidth is false', () => {
    renderWithProviders(<Divider fullWidth={false} />);
    expect(screen.getByRole('separator')).not.toHaveAttribute('data-full-width');
  });

  it('strips separator semantics and hides from assistive tech when decorative', () => {
    renderWithProviders(<Divider decorative />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    const el = document.querySelector('[data-orientation]');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders correctly under an RTL document direction', () => {
    renderWithProviders(
      <div dir="rtl">
        <Divider inset />
      </div>
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('has no accessibility violations (horizontal)', async () => {
    const { container } = renderWithProviders(<Divider />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations (vertical)', async () => {
    const { container } = renderWithProviders(<Divider orientation="vertical" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations (decorative)', async () => {
    const { container } = renderWithProviders(<Divider decorative />);
    await expectNoA11yViolations(container);
  });
});
