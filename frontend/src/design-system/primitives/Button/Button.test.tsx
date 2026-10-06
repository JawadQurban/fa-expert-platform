import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Button } from './Button';

describe('Button visual compliance (docs/FIGMA_BUTTON_SPECIFICATION.md, reports/VISUAL_COMPLIANCE_BUTTON.md)', () => {
  const cssPath = path.resolve(process.cwd(), 'src/design-system/tokens/generated/tokens.css');
  const css = readFileSync(cssPath, 'utf8');
  const buttonCssPath = path.resolve(
    process.cwd(),
    'src/design-system/primitives/Button/Button.module.css'
  );
  const buttonCss = readFileSync(buttonCssPath, 'utf8');

  it('generates the primary variant background from the official Figma Button component', () => {
    expect(css).toContain('--fads-sys-button-primary-bg-default: #1b8354;');
    expect(css).toContain('--fads-sys-button-primary-bg-hover: #166a45;');
    expect(css).toContain('--fads-sys-button-primary-bg-pressed: #104631;');
    expect(css).toContain('--fads-sys-button-primary-bg-focused: #1b8354;');
  });

  it('generates the neutral, secondarySolid, danger, and oncolor color sets from Light.tokens.json', () => {
    expect(css).toContain('--fads-sys-button-neutral-bg-default: #0d121c;');
    expect(css).toContain('--fads-sys-button-neutral-bg-hover: #1f2a37;');
    expect(css).toContain('--fads-sys-button-neutral-bg-pressed: #4d5761;');
    expect(css).toContain('--fads-sys-button-secondary-solid-bg-default: #f3f4f6;');
    expect(css).toContain('--fads-sys-button-secondary-solid-bg-pressed: #e5e7eb;');
    expect(css).toContain('--fads-sys-button-danger-bg-default: #d92d20;');
    expect(css).toContain('--fads-sys-button-danger-bg-pressed: #7a271a;');
    expect(css).toContain('--fads-sys-button-oncolor-bg-default: #ffffff;');
    expect(css).toContain('--fads-sys-button-oncolor-bg-pressed: rgba(255, 255, 255, 0.6);');
  });

  it('generates the label/border/focus/disabled scalars from Light.tokens.json', () => {
    expect(css).toContain('--fads-sys-button-label-oncolor: #ffffff;');
    expect(css).toContain('--fads-sys-button-label-default: #161616;');
    expect(css).toContain('--fads-sys-button-border-neutral: #d2d6db;');
    expect(css).toContain('--fads-sys-button-focus-ring-inner: #161616;');
    expect(css).toContain('--fads-sys-button-focus-ring-outer: #ffffff;');
    expect(css).toContain('--fads-sys-button-disabled-bg: #e5e7eb;');
    expect(css).toContain('--fads-sys-button-disabled-label: #9da4ae;');
  });

  it('generates real per-size height/padding/gap/icon tokens (no undefined --fads-sys-control-* references remain)', () => {
    expect(css).toContain('--fads-sys-button-height-sm: 24px;');
    expect(css).toContain('--fads-sys-button-height-md: 32px;');
    expect(css).toContain('--fads-sys-button-height-lg: 40px;');
    expect(css).toContain('--fads-sys-button-padding-inline-sm: 8px;');
    expect(css).toContain('--fads-sys-button-padding-inline-md: 12px;');
    expect(css).toContain('--fads-sys-button-padding-inline-lg: 16px;');
    expect(css).toContain('--fads-sys-typography-line-height-xs: 18px;');
    expect(css).toContain('--fads-sys-typography-line-height-sm: 20px;');
    expect(css).toContain('--fads-sys-typography-line-height-md: 24px;');
    expect(buttonCss).not.toMatch(/--fads-sys-control-/);
    expect(buttonCss).not.toMatch(/--fads-sys-border-width-/);
    expect(buttonCss).not.toMatch(/--fads-sys-opacity-disabled/);
    expect(buttonCss).not.toMatch(/--fads-sys-color-background-hover/);
    expect(buttonCss).not.toMatch(/--fads-sys-color-background-pressed/);
    expect(buttonCss).not.toMatch(/--fads-sys-color-text-on-primary/);
  });

  it('maps sm/md/lg to the official Small/Medium/Large typography scale (one rung down from before)', () => {
    expect(buttonCss).toMatch(/\[data-size='sm'\]\s*\{[\s\S]{0,300}?--fads-sys-typography-text-xs/);
    expect(buttonCss).toContain('font-size: var(--fads-sys-typography-text-sm);');
    expect(buttonCss).toMatch(/\[data-size='lg'\]\s*\{[\s\S]{0,300}?--fads-sys-typography-text-md/);
  });

  it('reuses the Pressed color for Selected instead of a fabricated separate shade', () => {
    // The official "Selected" variant reuses Pressed's background exactly — verified
    // live via Figma MCP get_design_context (see docs/FIGMA_BUTTON_SPECIFICATION.md §8).
    const pressedRule =
      /\[data-variant='primary'\]:active:not\(:disabled\),\s*\.button\[data-variant='primary'\]\[data-selected='true'\]\s*\{\s*background-color:\s*var\(--fads-sys-button-primary-bg-pressed\);/;
    expect(buttonCss).toMatch(pressedRule);
    // The distinct `--fads-sys-button-primary-bg-selected` token still exists in the
    // generated pipeline (real Figma data) but must never be *consumed* here.
    expect(buttonCss).not.toContain('var(--fads-sys-button-primary-bg-selected)');
  });

  it('does not use a brand-primary color for secondary/tertiary (matches official neutral styles)', () => {
    expect(buttonCss).not.toMatch(
      /\[data-variant='secondary'\][\s\S]{0,200}--fads-sys-color-primary/
    );
    expect(buttonCss).not.toMatch(
      /\[data-variant='tertiary'\][\s\S]{0,200}--fads-sys-color-primary/
    );
  });

  it('implements disabled as solid variant-agnostic colors, not opacity', () => {
    expect(buttonCss).toMatch(/:disabled\s*\{[\s\S]*--fads-sys-button-disabled-bg/);
    expect(buttonCss).toMatch(/:disabled\s*\{[\s\S]*--fads-sys-button-disabled-label/);
    expect(buttonCss).not.toMatch(/:disabled\s*\{[\s\S]*opacity/);
  });

  it('implements a double-ring focus treatment using the official focus-ring tokens', () => {
    expect(buttonCss).toMatch(/:focus-visible\s*\{[\s\S]*--fads-sys-button-focus-ring-inner/);
    expect(buttonCss).toMatch(/:focus-visible\s*\{[\s\S]*--fads-sys-button-focus-ring-outer/);
  });
});

describe('Button', () => {
  it('renders an accessible button with its label', () => {
    renderWithProviders(<Button>إرسال</Button>);
    expect(screen.getByRole('button', { name: 'إرسال' })).toBeInTheDocument();
  });

  it('defaults to type="button" to avoid accidental form submits', () => {
    renderWithProviders(<Button>إرسال</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('calls onClick when activated', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Button onClick={onClick}>إرسال</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Button disabled onClick={onClick}>
        إرسال
      </Button>
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('exposes a busy state and is disabled while loading', () => {
    renderWithProviders(<Button loading>إرسال</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('reflects the selected (toggle) state via aria-pressed', () => {
    renderWithProviders(<Button selected>تصفية</Button>);
    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
  });

  it('is keyboard operable', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Button onClick={onClick}>إرسال</Button>);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Button>إرسال</Button>);
    await expectNoA11yViolations(container);
  });

  it.each(['primary', 'secondary', 'tertiary', 'neutral', 'secondarySolid', 'subtle'] as const)(
    'renders the %s variant with its data-variant attribute',
    (variant) => {
      renderWithProviders(<Button variant={variant}>إرسال</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant);
    }
  );

  it('applies data-destructive when destructive is set', () => {
    renderWithProviders(<Button destructive>حذف</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-destructive', 'true');
  });

  it('applies data-on-color when onColor is set', () => {
    renderWithProviders(<Button onColor>إجراء</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-on-color', 'true');
  });

  describe('icon-only', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('marks a childless, icon-bearing button as data-icon-only', () => {
      renderWithProviders(<Button aria-label="إغلاق" iconStart={<svg aria-hidden="true" />} />);
      expect(screen.getByRole('button')).toHaveAttribute('data-icon-only', 'true');
    });

    it('does not mark a button with a label as icon-only', () => {
      renderWithProviders(<Button iconStart={<svg aria-hidden="true" />}>إرسال</Button>);
      expect(screen.getByRole('button')).not.toHaveAttribute('data-icon-only');
    });

    it('warns in dev when icon-only and missing an accessible name', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      renderWithProviders(<Button iconStart={<svg aria-hidden="true" />} />);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('accessible name'));
    });

    it('does not warn when icon-only has an aria-label', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      renderWithProviders(<Button aria-label="إغلاق" iconStart={<svg aria-hidden="true" />} />);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('link mode (reports/LANDING_PAGE_REBUILD_REPORT.md)', () => {
    it('renders a real anchor when href is set, not a button', () => {
      renderWithProviders(<Button href="/submit">قدم ابتكارك</Button>);
      const link = screen.getByRole('link', { name: 'قدم ابتكارك' });
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/submit');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('applies the same variant/size data attributes as button mode', () => {
      renderWithProviders(
        <Button href="/submit" variant="secondary" size="lg">
          قدم ابتكارك
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('data-variant', 'secondary');
      expect(link).toHaveAttribute('data-size', 'lg');
    });

    it('forwards target/rel for external link CTAs', () => {
      renderWithProviders(
        <Button href="https://example.com" target="_blank" rel="noopener noreferrer">
          رابط خارجي
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('is keyboard operable as a link', async () => {
      const { user } = renderWithProviders(<Button href="/submit">قدم ابتكارك</Button>);
      const link = screen.getByRole('link', { name: 'قدم ابتكارك' });
      await user.tab();
      expect(link).toHaveFocus();
    });

    it('has no accessibility violations in link mode', async () => {
      const { container } = renderWithProviders(<Button href="/submit">قدم ابتكارك</Button>);
      await expectNoA11yViolations(container);
    });
  });
});
