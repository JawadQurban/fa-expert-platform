import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as axe from 'axe-core';
import { DirectionProvider, ThemeProvider } from '@ds/providers';
import { LocaleProvider } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';

/**
 * Testing utilities. `renderWithProviders` mounts a component inside the same
 * cross-cutting providers the app uses (theme, direction, locale) so tests
 * exercise realistic conditions, including RTL and Arabic-first defaults.
 */
interface ProvidersProps {
  readonly children: ReactNode;
  readonly locale?: Locale;
}

function AllProviders({ children, locale = 'ar' }: ProvidersProps) {
  return (
    <ThemeProvider>
      <DirectionProvider>
        <LocaleProvider defaultLocale={locale}>{children}</LocaleProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  readonly locale?: Locale;
}

export function renderWithProviders(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { locale, ...rest } = options;
  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => <AllProviders locale={locale}>{children}</AllProviders>,
      ...rest,
    }),
  };
}

/**
 * Runs axe-core against a container and fails the test on violations
 * (docs/TESTING_STRATEGY.md §3).
 *
 * `color-contrast` is disabled here: jsdom has no layout/canvas engine, so it
 * cannot compute contrast, and — per project stance — contrast is verified in a
 * real browser only after the official DGA token values land (Q3). Structural
 * a11y (roles, names, labels, ARIA) is fully checked.
 */
export async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => `${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      .join('\n');
    throw new Error(`Accessibility violations found:\n${summary}`);
  }
}

export * from '@testing-library/react';
export { userEvent };
