import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Container } from './Container';

describe('Container', () => {
  it('renders children and reflects the size', () => {
    renderWithProviders(<Container size="prose">محتوى</Container>);
    const el = screen.getByText('محتوى');
    expect(el).toHaveAttribute('data-size', 'prose');
  });

  it('supports a semantic element via `as`', () => {
    renderWithProviders(
      <Container as="main" size="page">
        رئيسي
      </Container>
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
