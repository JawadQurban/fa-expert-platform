import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders its text label (meaning is not color-only)', () => {
    renderWithProviders(<Tag variant="success">مقبول</Tag>);
    expect(screen.getByText('مقبول')).toBeInTheDocument();
  });

  it('reflects the variant for styling hooks', () => {
    renderWithProviders(<Tag variant="information">مُرسل</Tag>);
    expect(screen.getByText('مُرسل').closest('span')?.parentElement).toHaveAttribute(
      'data-variant',
      'information'
    );
  });

  it('defaults to variant="neutral", size="md"', () => {
    renderWithProviders(<Tag>Default</Tag>);
    const tag = screen.getByText('Default').closest('[data-variant]');
    expect(tag).toHaveAttribute('data-variant', 'neutral');
    expect(tag).toHaveAttribute('data-size', 'md');
    expect(tag).not.toHaveAttribute('data-outline');
    expect(tag).not.toHaveAttribute('data-rounded');
  });

  it.each(['xs', 'sm', 'md'] as const)('accepts size="%s"', (size) => {
    renderWithProviders(<Tag size={size}>{size}</Tag>);
    expect(screen.getByText(size).closest('[data-variant]')).toHaveAttribute('data-size', size);
  });

  it('marks data-outline="true" when outline is set', () => {
    renderWithProviders(<Tag outline>Outline</Tag>);
    expect(screen.getByText('Outline').closest('[data-variant]')).toHaveAttribute(
      'data-outline',
      'true'
    );
  });

  it('marks data-rounded="true" when rounded is set', () => {
    renderWithProviders(<Tag rounded>Rounded</Tag>);
    expect(screen.getByText('Rounded').closest('[data-variant]')).toHaveAttribute(
      'data-rounded',
      'true'
    );
  });

  it('marks data-icon-only="true" when rendered with only an icon', () => {
    renderWithProviders(<Tag aria-label="تنبيه" iconStart={<span aria-hidden="true">!</span>} />);
    expect(screen.getByLabelText('تنبيه')).toHaveAttribute('data-icon-only', 'true');
  });

  it('renders an optional trailing icon', () => {
    renderWithProviders(
      <Tag iconEnd={<span aria-hidden="true" data-testid="trail-icon" />}>مقبول</Tag>
    );
    expect(screen.getByTestId('trail-icon')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<Tag variant="neutral">تشغيل</Tag>);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when icon-only with an accessible name', async () => {
    const { container } = renderWithProviders(
      <Tag aria-label="تنبيه" iconStart={<span aria-hidden="true">!</span>} />
    );
    await expectNoA11yViolations(container);
  });
});
