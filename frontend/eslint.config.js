// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import storybook from 'eslint-plugin-storybook';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'storybook-static',
      'node_modules',
      // Storybook main/preview are type-checked by `tsc -b` (they are in
      // tsconfig.app), but are not story files, so we skip ESLint on them.
      '.storybook',
    ],
  },

  // Base + TypeScript (type-aware) + React ecosystem
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // No `any`, ever (DESIGN_CONSTRAINTS.md DC-15).
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Architecture boundary: the design system must not import from app/product code
  // (DESIGN_SYSTEM_SPECIFICATION.md §2, DESIGN_CONSTRAINTS.md DC-20/DC-21).
  {
    files: ['src/design-system/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/features/*'],
              message:
                'design-system must not import from the application (one-way dependency: app → design-system).',
            },
          ],
        },
      ],
    },
  },

  // Expert Hub infrastructure modules that co-locate a provider/router/guards
  // (and the test-render helper) with hooks/constants — fast-refresh
  // granularity does not apply.
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Infrastructure modules that intentionally co-locate a provider/component
  // with its hooks/context/constants. Fast-refresh granularity does not apply.
  {
    files: [
      'src/design-system/providers/**/*.{ts,tsx}',
      'src/i18n/**/*.{ts,tsx}',
      'src/app/router/**/*.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Test files: relax type-aware rules that fight testing ergonomics.
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Config / node files
  {
    files: ['*.{js,ts}', '.storybook/**/*.{js,ts}'],
    languageOptions: { globals: { ...globals.node } },
  },

  ...storybook.configs['flat/recommended'],

  // Prettier last — turn off stylistic rules it owns.
  prettier
);
