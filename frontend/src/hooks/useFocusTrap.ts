import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps `Tab`/`Shift+Tab` focus cycling within the returned element while
 * `active` is true, moves initial focus to its first focusable child, and
 * restores focus to whatever was focused before activation once `active`
 * becomes false again. Used by overlay-like composites (`NavDrawer`, `Modal`,
 * `DatePicker`) that must satisfy WCAG 2.4.3 (focus order) and the
 * "on close, restore focus to the trigger" rule (INTERACTION_SPECIFICATION.md §3).
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active || !ref.current) {
      return;
    }
    const container = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusables[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (items.length === 0) {
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return ref;
}
