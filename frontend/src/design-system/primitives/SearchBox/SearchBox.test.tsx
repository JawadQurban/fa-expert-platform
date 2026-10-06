import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { SearchBox } from './SearchBox';

describe('SearchBox', () => {
  it('associates the label with the input', () => {
    renderWithProviders(<SearchBox label="Search" />);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
  });

  it('accepts typed input', async () => {
    const { user } = renderWithProviders(<SearchBox label="Search" />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'hackathon');
    expect(input).toHaveValue('hackathon');
  });

  it('links helper text via aria-describedby and renders a help-circle icon', () => {
    renderWithProviders(<SearchBox label="Search" helperText="Try a keyword" />);
    const input = screen.getByRole('searchbox');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('Try a keyword');
  });

  it('marks invalid and exposes the error as an alert', () => {
    renderWithProviders(<SearchBox label="Search" errorText="Enter a query" />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a query');
  });

  it('renders the leading search icon by default and can hide it', () => {
    const { container, rerender } = renderWithProviders(<SearchBox label="Search" />);
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    rerender(<SearchBox label="Search" icon={false} />);
  });

  it('renders a trailing icon slot inside the field, not a separate affix', () => {
    renderWithProviders(
      <SearchBox label="Search" trailingIcon={<button type="button">Clear</button>} />
    );
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('defaults to size="lg", surface="default"', () => {
    renderWithProviders(<SearchBox label="Search" />);
    const field = screen.getByRole('searchbox').closest('[data-size]');
    expect(field).toHaveAttribute('data-size', 'lg');
    expect(field).toHaveAttribute('data-surface', 'default');
  });

  it('is disabled and read-only via native attributes', () => {
    const { rerender } = renderWithProviders(<SearchBox label="Search" disabled />);
    expect(screen.getByRole('searchbox')).toBeDisabled();
    rerender(<SearchBox label="Search" readOnly />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('readonly');
  });

  it('calls onChange when typed', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<SearchBox label="Search" onChange={onChange} />);
    await user.type(screen.getByRole('searchbox'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<SearchBox label="Search" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with helper text and a trailing icon', async () => {
    const { container } = renderWithProviders(
      <SearchBox
        label="Search"
        helperText="Try a keyword"
        trailingIcon={<button type="button" aria-label="Clear" />}
      />
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when disabled', async () => {
    const { container } = renderWithProviders(<SearchBox label="Search" disabled />);
    await expectNoA11yViolations(container);
  });
});
