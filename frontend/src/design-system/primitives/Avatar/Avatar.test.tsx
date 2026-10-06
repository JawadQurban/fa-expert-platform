import { describe, expect, it } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/test-utils';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders initials from the name with an accessible label', () => {
    renderWithProviders(<Avatar name="قربان جواد" />);
    const el = screen.getByRole('img', { name: 'قربان جواد' });
    expect(el).toHaveTextContent('قج');
  });

  it('renders an image when src is provided', () => {
    renderWithProviders(<Avatar name="قربان" src="https://example.com/a.png" />);
    expect(screen.getByRole('img', { name: 'قربان' })).toBeInTheDocument();
  });

  it('can be decorative (hidden from assistive tech)', () => {
    const { container } = renderWithProviders(<Avatar name="قربان" decorative />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('falls back to initials when the image fails to load', () => {
    renderWithProviders(<Avatar name="قربان جواد" src="https://invalid.example/broken.png" />);
    const image = screen.getByRole('img', { name: 'قربان جواد' }).querySelector('img');
    expect(image).toBeInTheDocument();
    fireEvent.error(image as HTMLImageElement);
    const el = screen.getByRole('img', { name: 'قربان جواد' });
    expect(el).toHaveTextContent('قج');
    expect(el.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders an icon slot when provided and no image is present', () => {
    renderWithProviders(
      <Avatar
        name="قربان"
        icon={
          <svg data-testid="user-icon" aria-hidden="true">
            <circle cx="1" cy="1" r="1" />
          </svg>
        }
      />
    );
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it.each(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const)('accepts size=%s', (size) => {
    renderWithProviders(<Avatar name="قربان" size={size} />);
    expect(screen.getByRole('img', { name: 'قربان' })).toHaveAttribute('data-size', size);
  });

  it('applies the square shape via data-square', () => {
    renderWithProviders(<Avatar name="قربان" square />);
    expect(screen.getByRole('img', { name: 'قربان' })).toHaveAttribute('data-square', 'true');
  });

  it('omits data-square when not square', () => {
    renderWithProviders(<Avatar name="قربان" />);
    expect(screen.getByRole('img', { name: 'قربان' })).not.toHaveAttribute('data-square');
  });

  it('applies the border via data-border', () => {
    renderWithProviders(<Avatar name="قربان" border />);
    expect(screen.getByRole('img', { name: 'قربان' })).toHaveAttribute('data-border', 'true');
  });

  it('renders correctly under RTL', () => {
    renderWithProviders(
      <div dir="rtl">
        <Avatar name="قربان جواد" />
      </div>
    );
    const el = screen.getByRole('img', { name: 'قربان جواد' });
    expect(el).toHaveTextContent('قج');
  });
});
