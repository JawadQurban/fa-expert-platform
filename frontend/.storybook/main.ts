import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook is configured now so component authoring in the next phase has a
 * ready workshop (docs/DESIGN_SYSTEM_PLAN.md §7). It reuses vite.config.ts, so
 * path aliases and the token CSS resolve automatically.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: { disableTelemetry: true },
  docs: { defaultName: 'Docs' },
};

export default config;
