import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, expectNoA11yViolations } from '@/test/test-utils';
import { Toc } from './Toc';
import { TocItem } from '../TocItem/TocItem';

describe('Toc', () => {
  it('renders as a nav landmark with the given title', () => {
    renderWithProviders(
      <Toc title="Page Name" aria-label="Table of contents">
        <TocItem>Section</TocItem>
      </Toc>
    );
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument();
    expect(screen.getByText('Page Name')).toBeInTheDocument();
  });

  it('renders the eyebrow when given', () => {
    renderWithProviders(
      <Toc eyebrow="On this page" title="Page Name">
        <TocItem>Section</TocItem>
      </Toc>
    );
    expect(screen.getByText('On this page')).toBeInTheDocument();
  });

  it('renders without an eyebrow when none is given', () => {
    renderWithProviders(
      <Toc title="Page Name">
        <TocItem>Section</TocItem>
      </Toc>
    );
    expect(screen.queryByText('On this page')).not.toBeInTheDocument();
  });

  it('renders every composed TocItem child', () => {
    renderWithProviders(
      <Toc title="Page Name">
        <TocItem selected>First</TocItem>
        <TocItem level={2}>Second</TocItem>
      </Toc>
    );
    expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <Toc eyebrow="On this page" title="Page Name" aria-label="Table of contents">
        <TocItem selected>First</TocItem>
        <TocItem level={2}>Second</TocItem>
      </Toc>
    );
    await expectNoA11yViolations(container);
  });
});
