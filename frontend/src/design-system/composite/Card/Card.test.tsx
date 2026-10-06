import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Card } from './Card';

describe('Card visual compliance (docs/FIGMA_CARD_SPECIFICATION.md, reports/VISUAL_COMPLIANCE/Card/VISUAL_COMPLIANCE_CARD.md)', () => {
  const cssPath = path.resolve(process.cwd(), 'src/design-system/tokens/generated/tokens.css');
  const css = readFileSync(cssPath, 'utf8');
  const cardCssPath = path.resolve(
    process.cwd(),
    'src/design-system/composite/Card/Card.module.css'
  );
  const cardCss = readFileSync(cardCssPath, 'utf8');

  it('generates the official Card color/shadow/gap tokens from Light.tokens.json / live Figma MCP verification', () => {
    expect(css).toContain('--fads-sys-card-bg: #ffffff;');
    expect(css).toContain('--fads-sys-card-bg-hover: #f9fafb;');
    expect(css).toContain('--fads-sys-card-bg-focused: #f9fafb;');
    expect(css).toContain('--fads-sys-card-bg-disabled: #e5e7eb;');
    expect(css).toContain('--fads-sys-card-text: #1f2a37;');
    expect(css).toContain('--fads-sys-card-text-disabled: #9da4ae;');
    expect(css).toContain('--fads-sys-card-border-stroke: #d2d6db;');
    expect(css).toContain('--fads-sys-card-border-focus: #161616;');
    expect(css).toContain('--fads-sys-card-gap: 24px;');
    expect(css).toMatch(
      /--fads-sys-card-shadow:\s*0 2px 4px -2px rgba\(16, 24, 40, 0\.06\), 0 4px 8px -2px rgba\(16, 24, 40, 0\.1\);/
    );
    expect(css).toContain('--fads-sys-typography-line-height-lg: 28px;');
  });

  it('uses radius-lg (16px), not radius-md (8px)', () => {
    expect(cardCss).toContain('border-radius: var(--fads-sys-radius-lg);');
    expect(cardCss).not.toContain('--fads-sys-radius-md');
  });

  it('does not repoint shared tokens consumed by other components', () => {
    // --fads-sys-elevation-1, --fads-sys-opacity-disabled, --fads-sys-color-background-default,
    // and --fads-sys-radius-md are consumed by ~20 other components and must stay untouched.
    expect(cardCss).not.toContain('--fads-sys-elevation-1');
    expect(cardCss).not.toContain('--fads-sys-opacity-disabled');
    expect(cardCss).not.toContain('--fads-sys-color-background-default');
  });

  it('gives Title Bold (700) weight and the official 28px line-height, not Semibold', () => {
    expect(cardCss).toMatch(/\.title\s*\{[\s\S]*font-weight:\s*var\(--fads-ref-font-weight-bold\)/);
    expect(cardCss).toMatch(
      /\.title\s*\{[\s\S]*line-height:\s*var\(--fads-sys-typography-line-height-lg\)/
    );
  });

  it('gives Description the same text color as Title, not a muted shade', () => {
    expect(cardCss).toMatch(/\.description\s*\{[^}]*color:\s*var\(--fads-sys-card-text\)[^}]*\}/);
    expect(cardCss).not.toMatch(/\.description\s*\{[^}]*--fads-sys-color-text-muted[^}]*\}/);
  });

  it('applies no border by default, and a border only for the stroke effect or Focused state', () => {
    expect(cardCss).toMatch(/^\.card\s*\{[\s\S]*?border:\s*none;/m);
    expect(cardCss).toMatch(
      /\[data-effect='stroke'\][\s\S]*border:\s*1px solid var\(--fads-sys-card-border-stroke\)/
    );
  });

  it('implements Disabled as solid variant-agnostic colors with no shadow, not opacity', () => {
    expect(cardCss).toMatch(/\[data-disabled='true'\][\s\S]{0,200}--fads-sys-card-bg-disabled/);
    expect(cardCss).toMatch(/\[data-disabled='true'\][\s\S]{0,200}box-shadow:\s*none/);
    expect(cardCss).not.toMatch(/\[data-disabled='true'\][\s\S]{0,200}opacity/);
  });
});

describe('Card', () => {
  it('renders as a static article by default', () => {
    renderWithProviders(
      <Card title="عنوان البطاقة" description="وصف البطاقة">
        محتوى إضافي
      </Card>
    );
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(screen.getByText('عنوان البطاقة')).toBeInTheDocument();
    expect(screen.getByText('وصف البطاقة')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('becomes a single focusable button-role target when actionable', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Card title="بطاقة قابلة للنقر" actionable onClick={onClick}>
        محتوى
      </Card>
    );
    const card = screen.getByRole('button', { name: /بطاقة قابلة للنقر/ });
    expect(card).toHaveAttribute('tabIndex', '0');
    await user.click(card);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('activates on Enter and Space when actionable', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Card title="بطاقة" actionable onClick={onClick}>
        محتوى
      </Card>
    );
    const card = screen.getByRole('button', { name: /بطاقة/ });
    card.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('blocks both pointer and keyboard activation when disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Card title="بطاقة معطلة" actionable disabled onClick={onClick}>
        محتوى
      </Card>
    );
    const card = screen.getByRole('button', { name: /بطاقة معطلة/ });
    expect(card).toHaveAttribute('aria-disabled', 'true');
    expect(card).not.toHaveAttribute('tabIndex');
    await user.click(card);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to the shadow effect (no data-effect attribute)', () => {
    renderWithProviders(<Card title="بطاقة" />);
    expect(screen.getByRole('article')).not.toHaveAttribute('data-effect');
  });

  it.each(['none', 'stroke'] as const)('applies data-effect="%s" when set', (effect) => {
    renderWithProviders(<Card title="بطاقة" effect={effect} />);
    expect(screen.getByRole('article')).toHaveAttribute('data-effect', effect);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Card title="بطاقة" description="وصف" actionable onClick={vi.fn()}>
        محتوى
      </Card>
    );
    await expectNoA11yViolations(container);
  });
});
