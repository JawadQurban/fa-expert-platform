import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, within, expectNoA11yViolations } from '@/test/test-utils';
import { Header } from './Header';

const nav = [
  { id: 'home', label: 'الرئيسية', href: '/', selected: true },
  { id: 'requests', label: 'الطلبات', href: '/requests' },
  { id: 'external', label: 'الدعم', href: 'https://example.com', external: true },
  { id: 'disabled', label: 'قريباً', href: '/soon', disabled: true },
];

/** Force the compact (< 960px) breakpoint by stubbing matchMedia. */
function stubCompact(compact: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: compact && query.includes('max-width'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Header', () => {
  it('renders a caller-supplied logo and platform-name label', () => {
    renderWithProviders(
      <Header logo={<img src="/logo.svg" alt="شعار المنصة" />} logoLabel="اسم المنصة" />
    );
    expect(screen.getByRole('img', { name: 'شعار المنصة' })).toBeInTheDocument();
    expect(screen.getByText('اسم المنصة')).toBeInTheDocument();
  });

  it('wraps the brand in a link when logoHref is set', () => {
    renderWithProviders(
      <Header logoLabel="اسم المنصة" logoHref="/" logoLinkLabel="الصفحة الرئيسية" />
    );
    const link = screen.getByRole('link', { name: 'الصفحة الرئيسية' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('ships no default branding (product-agnostic)', () => {
    renderWithProviders(<Header nav={nav} navLabel="التنقل" />);
    // No brand text/img rendered unless the caller supplies it.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/الأكاديمية|Financial Academy/i)).not.toBeInTheDocument();
  });

  it('renders nav items with aria-current on the selected one', () => {
    renderWithProviders(<Header nav={nav} navLabel="التنقل الرئيسي" />);
    const navEl = screen.getByRole('navigation', { name: 'التنقل الرئيسي' });
    expect(navEl).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'الرئيسية' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'الطلبات' })).not.toHaveAttribute('aria-current');
  });

  it('marks external nav items with target/rel', () => {
    renderWithProviders(<Header nav={nav} />);
    const external = screen.getByRole('link', { name: 'الدعم' });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('makes disabled nav items non-navigable', () => {
    renderWithProviders(<Header nav={nav} />);
    // A disabled item is an inert span, not a link.
    const disabled = screen.getByText('قريباً').closest('[aria-disabled="true"]');
    expect(disabled).toBeInTheDocument();
    expect(disabled?.tagName).toBe('SPAN');
    expect(screen.queryByRole('link', { name: 'قريباً' })).not.toBeInTheDocument();
  });

  it('renders an actions slot', () => {
    renderWithProviders(<Header actions={<button type="button">دخول</button>} />);
    expect(screen.getByRole('button', { name: 'دخول' })).toBeInTheDocument();
  });

  it('collapses the nav behind a toggle below 960px and reveals it on click', async () => {
    stubCompact(true);
    const { user } = renderWithProviders(
      <Header nav={nav} navLabel="التنقل" menuLabel="القائمة" />
    );

    const toggle = screen.getByRole('button', { name: 'القائمة' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // Collapsed panel is hidden → its links are not exposed.
    expect(screen.queryByRole('link', { name: 'الرئيسية' })).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('navigation', { name: 'التنقل' });
    expect(within(panel).getByRole('link', { name: 'الرئيسية' })).toBeInTheDocument();
  });

  it('does not render the toggle on desktop', () => {
    stubCompact(false);
    renderWithProviders(<Header nav={nav} menuLabel="القائمة" />);
    expect(screen.queryByRole('button', { name: 'القائمة' })).not.toBeInTheDocument();
    // Inline nav is present instead.
    expect(screen.getByRole('link', { name: 'الرئيسية' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Header
        logo={<img src="/logo.svg" alt="شعار" />}
        logoLabel="اسم المنصة"
        nav={nav}
        navLabel="التنقل الرئيسي"
        actions={<button type="button">دخول</button>}
      />
    );
    await expectNoA11yViolations(container);
  });
});

describe('Header visual compliance (docs/FIGMA_HEADER_SPECIFICATION.md)', () => {
  const cssPath = path.resolve(process.cwd(), 'src/design-system/tokens/generated/tokens.css');
  const css = readFileSync(cssPath, 'utf8');
  const headerCssPath = path.resolve(
    process.cwd(),
    'src/design-system/shell/Header/Header.module.css'
  );
  const headerCss = readFileSync(headerCssPath, 'utf8');

  it('generates the official Nav Header tokens from Light.tokens.json / live Figma MCP verification', () => {
    expect(css).toContain('--fads-sys-header-bg: #ffffff;');
    expect(css).toContain('--fads-sys-header-item-text: #161616;');
    expect(css).toContain('--fads-sys-header-item-bg-hover: #f3f4f6;');
    expect(css).toContain('--fads-sys-header-item-bg-pressed: #e5e7eb;');
    expect(css).toContain('--fads-sys-header-item-border-focus: #161616;');
    expect(css).toContain('--fads-sys-header-selected-bg: #1b8354;');
    expect(css).toContain('--fads-sys-header-selected-text: #ffffff;');
    expect(css).toContain('--fads-sys-header-indicator: #54c08a;');
    expect(css).toContain('--fads-sys-header-logo-label-text: #6c737f;');
    expect(css).toContain('--fads-sys-header-height: 72px;');
    expect(css).toContain('--fads-sys-header-padding-inline: 32px;');
  });

  it('does not repoint shared tokens or borrow Button tokens (fix only the component in scope)', () => {
    expect(headerCss).not.toContain('--fads-sys-button-');
    expect(headerCss).not.toContain('--fads-sys-color-background-default');
  });

  it('uses logical properties only (DC-23) — no physical left/right', () => {
    expect(headerCss).not.toMatch(/(padding|margin|border|inset)-(left|right)\b/);
    expect(headerCss).not.toMatch(/\b(left|right):/);
  });
});
