import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Typography } from './Typography';

describe('Typography', () => {
  it('renders a paragraph by default', () => {
    renderWithProviders(<Typography>نص</Typography>);
    expect(screen.getByText('نص').tagName).toBe('P');
  });

  it('renders the chosen semantic element via `as`', () => {
    renderWithProviders(
      <Typography as="h1" variant="display-lg">
        عنوان
      </Typography>
    );
    expect(screen.getByRole('heading', { level: 1, name: 'عنوان' })).toBeInTheDocument();
  });

  it('exposes variant/color styling hooks', () => {
    renderWithProviders(
      <Typography variant="text-sm" color="muted">
        نص
      </Typography>
    );
    const el = screen.getByText('نص');
    expect(el).toHaveAttribute('data-variant', 'text-sm');
    expect(el).toHaveAttribute('data-color', 'muted');
  });
});
