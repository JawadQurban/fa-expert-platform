import type { Preview } from '@storybook/react';
import '../src/design-system/tokens/global.css';
import { DirectionProvider, ThemeProvider } from '../src/design-system/providers';
import { LocaleProvider } from '../src/i18n/LocaleProvider';
import type { Locale } from '../src/types';

/**
 * Global Storybook setup. Every story renders inside the FADS providers so
 * components are always previewed Arabic-first / RTL by default, with a toolbar
 * toggle to check English / LTR.
 */
const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
  },
  globalTypes: {
    locale: {
      description: 'Locale / direction',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'ar', title: 'العربية (RTL)' },
          { value: 'en', title: 'English (LTR)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { locale: 'ar' },
  decorators: [
    (Story, context) => {
      const locale = (context.globals.locale as Locale) ?? 'ar';
      return (
        <ThemeProvider>
          <DirectionProvider key={locale}>
            <LocaleProvider defaultLocale={locale}>
              <Story />
            </LocaleProvider>
          </DirectionProvider>
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
