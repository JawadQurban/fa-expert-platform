import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { SecondNavHeader, SecondNavHeaderItem } from './SecondNavHeader';

describe('SecondNavHeader', () => {
  it('renders composed items', () => {
    renderWithProviders(
      <SecondNavHeader>
        <SecondNavHeaderItem icon={<svg aria-hidden="true" />}>Cloudy</SecondNavHeaderItem>
        <SecondNavHeaderItem icon={<svg aria-hidden="true" />}>Al-Riyadh</SecondNavHeaderItem>
      </SecondNavHeader>
    );
    expect(screen.getByText('Cloudy')).toBeInTheDocument();
    expect(screen.getByText('Al-Riyadh')).toBeInTheDocument();
  });

  it('renders composed actions', () => {
    renderWithProviders(
      <SecondNavHeader actions={<button type="button">Zoom in</button>}>
        <SecondNavHeaderItem icon={<svg aria-hidden="true" />}>Cloudy</SecondNavHeaderItem>
      </SecondNavHeader>
    );
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
  });

  it('defaults to the gray variant', () => {
    const { container } = renderWithProviders(<SecondNavHeader />);
    expect(container.querySelector('[data-variant="gray"]')).toBeInTheDocument();
  });

  it('applies the primary variant', () => {
    const { container } = renderWithProviders(<SecondNavHeader variant="primary" />);
    expect(container.querySelector('[data-variant="primary"]')).toBeInTheDocument();
  });

  it('shows the divider by default and can hide it', () => {
    const { container: withDivider } = renderWithProviders(<SecondNavHeader />);
    expect(withDivider.querySelector('[data-divider]')).toBeInTheDocument();

    const { container: withoutDivider } = renderWithProviders(<SecondNavHeader divider={false} />);
    expect(withoutDivider.querySelector('[data-divider]')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <SecondNavHeader actions={<button type="button">Zoom in</button>}>
        <SecondNavHeaderItem icon={<svg aria-hidden="true" />}>Cloudy</SecondNavHeaderItem>
        <SecondNavHeaderItem icon={<svg aria-hidden="true" />}>Al-Riyadh</SecondNavHeaderItem>
      </SecondNavHeader>
    );
    await expectNoA11yViolations(container);
  });
});
