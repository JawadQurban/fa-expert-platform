import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure the DOM is reset between tests.
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia; provide a minimal stub so hooks that
// depend on it (useMediaQuery, usePrefersReducedMotion) run in tests.
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
}));
