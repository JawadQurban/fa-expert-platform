import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Expert Hub — the production build, the dev server and the test runner.
 *
 * `base` (the asset URL prefix) comes from `VITE_EXPERT_HUB_BASE_PATH` and MUST
 * match the router's `EXPERT_HUB_BASE_PATH`; both read the same value:
 *   - `/expert-hub` (default — the current deployment behind the server Nginx),
 *   - `''`          (a deployment at the domain root).
 * It is also `define`d into `import.meta.env`, so the router prefix and the
 * built asset URLs cannot drift apart.
 *
 * Keep `alias` in sync with `tsconfig.app.json`.
 */
const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  '@ds': fileURLToPath(new URL('./src/design-system', import.meta.url)),
  '@i18n': fileURLToPath(new URL('./src/i18n', import.meta.url)),
  '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
  '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
};

const rawBasePath = process.env.VITE_EXPERT_HUB_BASE_PATH ?? '/expert-hub';
// Vite `base` must be `/` or `/segment/`. `''`/`/` ⇒ root.
const base =
  rawBasePath === '' || rawBasePath === '/' ? '/' : `${rawBasePath.replace(/\/+$/, '')}/`;

export default defineConfig({
  plugins: [react()],
  base,
  resolve: { alias },
  // `public/` holds the runtime `config.js` (regenerated from env when the
  // container starts). The favicon is bundled from `src/assets/branding/`.
  define: {
    'import.meta.env.VITE_EXPERT_HUB_BASE_PATH': JSON.stringify(rawBasePath),
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    // No source maps in the production image unless explicitly approved.
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // `react-dom/client` is its own module id: naming only `react-dom` left the
          // renderer (~540 KB) in the entry chunk, where every app deploy busts its cache.
          react: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
    clearMocks: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // The suite shares session storage between files.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: ['**/*.stories.tsx', '**/*.d.ts', 'src/test/**', 'src/**/index.ts', '.storybook/**'],
    },
  },
});
