import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('links the tooltip to the trigger on focus and removes it on Escape', async () => {
    const { user } = renderWithProviders(
      <Tooltip content="نص التلميح">
        <button type="button">زر</button>
      </Tooltip>
    );
    const trigger = screen.getByRole('button', { name: 'زر' });
    const tip = screen.getByRole('tooltip');

    expect(trigger).not.toHaveAttribute('aria-describedby');

    await user.tab();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-describedby', tip.id);

    await user.keyboard('{Escape}');
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('renders the tooltip content and placement', () => {
    renderWithProviders(
      <Tooltip content="نص" placement="inline-end">
        <button type="button">زر</button>
      </Tooltip>
    );
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('نص');
    expect(tip).toHaveAttribute('data-placement', 'inline-end');
  });

  it.each(['top', 'bottom', 'inline-start', 'inline-end'] as const)(
    'accepts placement=%s',
    (placement) => {
      renderWithProviders(
        <Tooltip content="نص" placement={placement}>
          <button type="button">زر</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip')).toHaveAttribute('data-placement', placement);
    }
  );

  it('renders a leading help-circle icon by default', () => {
    renderWithProviders(
      <Tooltip content="نص">
        <button type="button">زر</button>
      </Tooltip>
    );
    const tip = screen.getByRole('tooltip');
    expect(tip.querySelector('[data-size="sm"]')).toBeInTheDocument();
  });

  it('omits the icon when icon={false}', () => {
    renderWithProviders(
      <Tooltip content="نص" icon={false}>
        <button type="button">زر</button>
      </Tooltip>
    );
    const tip = screen.getByRole('tooltip');
    expect(tip.querySelector('[data-size="sm"]')).not.toBeInTheDocument();
  });

  it('renders an optional title above the content', () => {
    renderWithProviders(
      <Tooltip content="نص" title="عنوان">
        <button type="button">زر</button>
      </Tooltip>
    );
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('عنوان');
    expect(tip).toHaveTextContent('نص');
  });

  it('is light (not inverted) by default', () => {
    renderWithProviders(
      <Tooltip content="نص">
        <button type="button">زر</button>
      </Tooltip>
    );
    expect(screen.getByRole('tooltip')).not.toHaveAttribute('data-inverted');
  });

  it('applies data-inverted when inverted', () => {
    renderWithProviders(
      <Tooltip content="نص" inverted>
        <button type="button">زر</button>
      </Tooltip>
    );
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-inverted', 'true');
  });

  it('renders correctly under RTL', async () => {
    const { user } = renderWithProviders(
      <div dir="rtl">
        <Tooltip content="نص التلميح" title="عنوان" placement="inline-start">
          <button type="button">زر</button>
        </Tooltip>
      </div>
    );
    const trigger = screen.getByRole('button', { name: 'زر' });
    await user.tab();
    const tip = screen.getByRole('tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tip.id);
    expect(tip).toHaveTextContent('نص التلميح');
  });
});
