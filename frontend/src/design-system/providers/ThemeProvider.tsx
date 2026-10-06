import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ThemeName } from '@/types';

/**
 * ThemeProvider — applies the active FADS theme by stamping `data-theme` on
 * `<html>`, which selects the matching token block in tokens.css.
 *
 * Only the DGA light theme exists today (dark mode is out of scope — Q22).
 * The provider is structured so additional themes can be added later without
 * touching component code.
 */

interface ThemeContextValue {
  readonly theme: ThemeName;
  readonly setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  readonly children: ReactNode;
  readonly defaultTheme?: ThemeName;
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeName>(defaultTheme);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return ctx;
}

export { ThemeContext };
export type { ThemeContextValue };
