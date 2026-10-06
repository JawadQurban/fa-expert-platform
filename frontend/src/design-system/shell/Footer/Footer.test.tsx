import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, within, expectNoA11yViolations } from '@/test/test-utils';
import { Footer } from './Footer';

const groups = [
  {
    id: 'about',
    label: 'عن المنصة',
    links: [
      { label: 'من نحن', href: '/about' },
      { label: 'الأخبار', href: 'https://example.com', external: true },
    ],
  },
  {
    id: 'services',
    label: 'الخدمات',
    links: [{ label: 'الدعم', href: '/support' }],
  },
];

const links = [
  { label: 'سياسة الخصوصية', href: '/privacy' },
  { label: 'الشروط والأحكام', href: '/terms' },
];

describe('Footer', () => {
  it('renders grouped nav-links with a labelled landmark', () => {
    renderWithProviders(<Footer groups={groups} groupsLabel="روابط التذييل" />);
    const nav = screen.getByRole('navigation', { name: 'روابط التذييل' });
    expect(within(nav).getByText('عن المنصة')).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'من نحن' })).toHaveAttribute('href', '/about');
    expect(within(nav).getByText('الخدمات')).toBeInTheDocument();
  });

  it('marks external group links with target/rel', () => {
    renderWithProviders(<Footer groups={groups} />);
    const external = screen.getByRole('link', { name: 'الأخبار' });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the bottom legal links navigation (backward-compatible `links`)', () => {
    renderWithProviders(<Footer links={links} navLabel="روابط إضافية" />);
    const nav = screen.getByRole('navigation', { name: 'روابط إضافية' });
    expect(within(nav).getByRole('link', { name: 'سياسة الخصوصية' })).toHaveAttribute(
      'href',
      '/privacy'
    );
    expect(within(nav).getByRole('link', { name: 'الشروط والأحكام' })).toHaveAttribute(
      'href',
      '/terms'
    );
  });

  it('renders the copyright caption and secondary links', () => {
    renderWithProviders(
      <Footer
        copyright="جميع الحقوق محفوظة © 2026"
        secondaryLinks={[{ label: 'الشروط والأحكام', href: '/terms' }]}
      />
    );
    expect(screen.getByText('جميع الحقوق محفوظة © 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'الشروط والأحكام' })).toHaveAttribute('href', '/terms');
  });

  it('renders free-form children content', () => {
    renderWithProviders(<Footer>الأكاديمية المالية © 2026</Footer>);
    expect(screen.getByText('الأكاديمية المالية © 2026')).toBeInTheDocument();
  });

  it('renders a caller-supplied logo slot and ships no default branding', () => {
    renderWithProviders(<Footer logos={<img src="/logo.svg" alt="شعار المنصة" />} />);
    expect(screen.getByRole('img', { name: 'شعار المنصة' })).toBeInTheDocument();
  });

  it('ships no default branding when nothing is supplied', () => {
    renderWithProviders(<Footer links={links} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/الأكاديمية|Financial Academy/i)).not.toBeInTheDocument();
  });

  it('applies the dark-green background variant', () => {
    const { container } = renderWithProviders(<Footer links={links} background="darkGreen" />);
    expect(container.querySelector('footer')).toHaveAttribute('data-background', 'dark-green');
  });

  it('renders a link without an href as inert text, not a link', () => {
    renderWithProviders(<Footer secondaryLinks={[{ label: 'قريباً' }]} />);
    const inert = screen.getByText('قريباً');
    expect(inert.tagName).toBe('SPAN');
    expect(screen.queryByRole('link', { name: 'قريباً' })).not.toBeInTheDocument();
  });

  it('omits both regions entirely when nothing is given', () => {
    renderWithProviders(<Footer />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('has no accessibility violations (full footer)', async () => {
    const { container } = renderWithProviders(
      <Footer
        groups={groups}
        groupsLabel="روابط التذييل"
        links={links}
        navLabel="روابط إضافية"
        copyright="جميع الحقوق محفوظة © 2026"
        secondaryLinks={[{ label: 'الشروط', href: '/terms' }]}
        logos={<img src="/logo.svg" alt="شعار" />}
      />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations (dark-green)', async () => {
    const { container } = renderWithProviders(
      <Footer groups={groups} groupsLabel="روابط" links={links} background="darkGreen" />
    );
    await expectNoA11yViolations(container);
  });
});

describe('Footer visual compliance (docs/FIGMA_FOOTER_SPECIFICATION.md)', () => {
  const cssPath = path.resolve(process.cwd(), 'src/design-system/tokens/generated/tokens.css');
  const css = readFileSync(cssPath, 'utf8');
  const footerCssPath = path.resolve(
    process.cwd(),
    'src/design-system/shell/Footer/Footer.module.css'
  );
  const footerCss = readFileSync(footerCssPath, 'utf8');

  it('generates the official Footer tokens from Light.tokens.json / live Figma MCP verification', () => {
    expect(css).toContain('--fads-sys-footer-bg: #f3f4f6;');
    expect(css).toContain('--fads-sys-footer-group-label-text: #161616;');
    expect(css).toContain('--fads-sys-footer-group-label-border: #d2d6db;');
    expect(css).toContain('--fads-sys-footer-link-text: #384250;');
    expect(css).toContain('--fads-sys-footer-bg-oncolor: #074d31;');
    expect(css).toContain('--fads-sys-footer-text-oncolor: #ffffff;');
    expect(css).toContain('--fads-sys-footer-border-oncolor: rgba(255, 255, 255, 0.3);');
    expect(css).toContain('--fads-sys-footer-max-width: 1280px;');
  });

  it('does not borrow another component (Button/Card/Header) token', () => {
    expect(footerCss).not.toContain('--fads-sys-button-');
    expect(footerCss).not.toContain('--fads-sys-card-');
    expect(footerCss).not.toContain('--fads-sys-header-');
  });

  it('uses logical properties only (DC-23) — no physical left/right', () => {
    expect(footerCss).not.toMatch(/(padding|margin|border|inset)-(left|right)\b/);
    expect(footerCss).not.toMatch(/\b(left|right):/);
  });
});
