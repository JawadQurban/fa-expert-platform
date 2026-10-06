import { useMediaQuery } from './useMediaQuery';

/**
 * True when the user requested reduced motion. Components use this to skip
 * non-essential animation (docs/MICROINTERACTIONS.md §9, DC-14).
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
