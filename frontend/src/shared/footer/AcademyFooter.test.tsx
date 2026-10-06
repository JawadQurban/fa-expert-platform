import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { AcademyFooter } from './AcademyFooter';
import type { FooterContent } from './footerContent.types';

/**
 * `AcademyFooter` is **product-neutral shared infrastructure** — it renders
 * whatever `FooterContent` a product feeds it, with no hardcoded product wording
 * of its own. These tests drive it with a synthetic, obviously-non-real content
 * object to prove the structure is entirely config-driven (the Hackathon binding
 * is regression-tested separately in `components/AppFooter.test.tsx`, and the
 * Expert Hub binding in the Expert Hub suite).
 */
const fakeIcon = '<svg viewBox="0 0 24 24"><rect width="24" height="24" /></svg>';

const content: FooterContent = {
  groupsLabel: 'Footer navigation',
  summaryLabel: 'Summary',
  summaryLinks: [
    { id: 's1', label: 'Overview', href: 'https://example.test/overview', external: true },
  ],
  importantLinksLabel: 'Important links',
  importantLinks: [
    { id: 'i1', label: 'Guide', href: 'https://example.test/guide', external: true },
  ],
  contactHeading: 'Contact',
  contactItems: [
    { label: 'Phone', value: '+000 000', href: 'tel:+000000' },
    { label: 'Location', value: 'Somewhere' },
  ],
  socialHeading: 'Follow',
  socialLinks: [
    { id: 'x', label: 'ExampleSocial', icon: fakeIcon, href: 'https://example.test/social' },
  ],
  policyLinksLabel: 'Legal',
  policyLinks: [
    { id: 'p1', label: 'Privacy', href: 'https://example.test/privacy', external: true },
  ],
  copyright: 'Synthetic product © test',
  logos: [{ src: '/fake-logo.svg', alt: 'Synthetic logo' }],
};

describe('AcademyFooter (product-neutral shared footer)', () => {
  it('renders exactly one contentinfo landmark from the supplied content', () => {
    renderWithProviders(<AcademyFooter content={content} />);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
  });

  it('names its two footer-navigation landmarks from content (distinct accessible names)', () => {
    renderWithProviders(<AcademyFooter content={content} />);
    expect(screen.getByRole('navigation', { name: content.groupsLabel })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: content.policyLinksLabel })).toBeInTheDocument();
  });

  it('renders every supplied group/legal link with its href', () => {
    renderWithProviders(<AcademyFooter content={content} />);
    for (const link of [
      ...content.summaryLinks,
      ...content.importantLinks,
      ...content.policyLinks,
    ]) {
      expect(screen.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    }
  });

  it('renders an actionable contact item as a link and an href-less one as inert text', () => {
    renderWithProviders(<AcademyFooter content={content} />);
    expect(screen.getByRole('link', { name: '+000 000' })).toHaveAttribute('href', 'tel:+000000');
    const inert = screen.getByText('Somewhere');
    expect(inert.closest('a')).toBeNull();
  });

  it('renders each social link with its accessible name, opening in a new tab', () => {
    renderWithProviders(<AcademyFooter content={content} />);
    const link = screen.getByRole('link', { name: 'ExampleSocial' });
    expect(link).toHaveAttribute('href', 'https://example.test/social');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the supplied copyright and logos', () => {
    renderWithProviders(<AcademyFooter content={content} />);
    expect(screen.getByText(content.copyright)).toBeInTheDocument();
    const img = screen.getByRole('img', { name: 'Synthetic logo' });
    expect(img).toHaveAttribute('src', '/fake-logo.svg');
  });

  it('honours the background prop (defaults to dark-green)', () => {
    const { container, unmount } = renderWithProviders(<AcademyFooter content={content} />);
    expect(container.querySelector('footer')).toHaveAttribute('data-background', 'dark-green');
    unmount();
    const { container: plain } = renderWithProviders(
      <AcademyFooter content={content} background="default" />
    );
    expect(plain.querySelector('footer')).not.toHaveAttribute('data-background', 'dark-green');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = renderWithProviders(<AcademyFooter content={content} />);
    await expectNoA11yViolations(container);
  });
});
