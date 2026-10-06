import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Section } from './Section';

describe('Section', () => {
  it('renders a nameable region', () => {
    renderWithProviders(<Section aria-label="الأهداف">محتوى</Section>);
    expect(screen.getByRole('region', { name: 'الأهداف' })).toBeInTheDocument();
  });

  it('reflects the background variant', () => {
    renderWithProviders(
      <Section aria-label="x" background="subtle">
        محتوى
      </Section>
    );
    expect(screen.getByRole('region', { name: 'x' })).toHaveAttribute('data-background', 'subtle');
  });
});
