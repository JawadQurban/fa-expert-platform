import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Direction } from '@/types';

/**
 * DirectionProvider — the low-level owner of document direction (RTL/LTR).
 *
 * RTL is the default (docs DC-10 / DESIGN_SYSTEM_PLAN §3). The LocaleProvider
 * sits inside this provider and drives direction from the active locale, so in
 * the app you rarely set direction directly. It is also usable standalone
 * (e.g. Storybook) to preview a component in either direction.
 */

interface DirectionContextValue {
  readonly direction: Direction;
  readonly setDirection: (dir: Direction) => void;
}

const DirectionContext = createContext<DirectionContextValue | null>(null);

interface DirectionProviderProps {
  readonly children: ReactNode;
  /** Initial direction (uncontrolled). Defaults to RTL. */
  readonly defaultDirection?: Direction;
  /** When set, applies `dir` to `<html>` instead of a wrapper element. */
  readonly applyToDocument?: boolean;
}

export function DirectionProvider({
  children,
  defaultDirection = 'rtl',
  applyToDocument = true,
}: DirectionProviderProps) {
  const [direction, setDirection] = useState<Direction>(defaultDirection);

  useEffect(() => {
    if (applyToDocument && typeof document !== 'undefined') {
      document.documentElement.dir = direction;
    }
  }, [direction, applyToDocument]);

  const value = useMemo<DirectionContextValue>(() => ({ direction, setDirection }), [direction]);

  return (
    <DirectionContext.Provider value={value}>
      {applyToDocument ? children : <div dir={direction}>{children}</div>}
    </DirectionContext.Provider>
  );
}

export function useDirection(): DirectionContextValue {
  const ctx = useContext(DirectionContext);
  if (!ctx) {
    throw new Error('useDirection must be used within a <DirectionProvider>.');
  }
  return ctx;
}

/** Convenience hook: true when the document is right-to-left. */
export function useIsRtl(): boolean {
  const { direction } = useDirection();
  return direction === 'rtl';
}

export { DirectionContext };
export type { DirectionContextValue };
