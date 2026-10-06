import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Link } from './Link';

describe('Link', () => {
  it('renders an accessible link with its href', () => {
    renderWithProviders(<Link href="/faq">الأسئلة الشائعة</Link>);
    const link = screen.getByRole('link', { name: 'الأسئلة الشائعة' });
    expect(link).toHaveAttribute('href', '/faq');
  });

  it('adds target/rel for external links', () => {
    renderWithProviders(
      <Link href="https://dga.gov.sa" external>
        الموقع الرسمي
      </Link>
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('data-external', 'true');
  });

  it('is non-navigable and marked when disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Link href="/x" disabled onClick={onClick}>
        معطّل
      </Link>
    );
    const link = screen.getByText('معطّل').closest('a');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).not.toHaveAttribute('href');
    if (link) await user.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to mood="primary", size="md", inline=false', () => {
    renderWithProviders(<Link href="/x">Default</Link>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-mood', 'primary');
    expect(link).toHaveAttribute('data-size', 'md');
    expect(link).not.toHaveAttribute('data-inline');
  });

  it.each(['primary', 'neutral', 'onColor'] as const)('accepts mood="%s"', (mood) => {
    renderWithProviders(
      <Link href="/x" mood={mood}>
        {mood}
      </Link>
    );
    expect(screen.getByRole('link')).toHaveAttribute('data-mood', mood);
  });

  it.each(['sm', 'md'] as const)('accepts size="%s"', (size) => {
    renderWithProviders(
      <Link href="/x" size={size}>
        {size}
      </Link>
    );
    expect(screen.getByRole('link')).toHaveAttribute('data-size', size);
  });

  it('marks data-inline="true" when inline is set', () => {
    renderWithProviders(
      <Link href="/x" inline>
        Inline
      </Link>
    );
    expect(screen.getByRole('link')).toHaveAttribute('data-inline', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Link href="/about">عن الهاكاثون</Link>);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(
      <Link href="/about" disabled>
        عن الهاكاثون
      </Link>
    );
    await expectNoA11yViolations(container);
  });
});
