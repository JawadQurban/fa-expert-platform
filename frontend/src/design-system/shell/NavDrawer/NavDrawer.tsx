import { useEffect, useId } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { useFocusTrap } from '@hooks/useFocusTrap';
import styles from './NavDrawer.module.css';

/**
 * NavDrawer (FADS shell — DGA CMP-02, Secondary).
 *
 * ⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**.
 *
 * Off-canvas mobile navigation. Fully controlled via `open` +
 * `onOpenChange` — there is no internal open state. While open: focus moves
 * into the drawer, `Tab`/`Shift+Tab` cycle within it (`useFocusTrap`), `Esc`
 * closes it and returns focus to the toggle button, and the drawer is marked
 * `inert` while closed so its (off-screen) contents are unreachable by
 * keyboard or assistive tech (INTERACTION_SPECIFICATION.md §Nav Drawer).
 */
export interface NavDrawerProps extends Omit<ComponentPropsWithoutRef<'aside'>, 'title'> {
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly title?: ReactNode;
  readonly children?: ReactNode;
  /** Accessible name for the toggle button and the drawer's nav landmark. */
  readonly toggleLabel?: string;
}

export function NavDrawer({
  open = false,
  onOpenChange,
  title,
  children,
  toggleLabel = 'Toggle navigation',
  className,
  ...rest
}: NavDrawerProps) {
  const drawerId = useId();
  const headingId = useId();
  const drawerRef = useFocusTrap<HTMLElement>(open);

  // Native listener (not a JSX handler) — `<aside>` is a landmark, not an
  // interactive widget, and jsx-a11y correctly flags keyboard handlers
  // attached directly to non-interactive elements in markup.
  useEffect(() => {
    if (!open) {
      return;
    }
    const node = drawerRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange?.(false);
      }
    };
    node?.addEventListener('keydown', handleKeyDown);
    return () => node?.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, drawerRef]);

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={drawerId}
        onClick={() => onOpenChange?.(!open)}
      >
        {toggleLabel}
      </button>
      <aside
        ref={drawerRef}
        id={drawerId}
        className={cn(styles.drawer, className)}
        data-open={open || undefined}
        inert={!open || undefined}
        aria-label={title != null ? undefined : toggleLabel}
        aria-labelledby={title != null ? headingId : undefined}
        {...rest}
      >
        {title != null && (
          <div className={styles.header}>
            <h2 id={headingId} className={styles.title}>
              {title}
            </h2>
          </div>
        )}
        <nav aria-label={toggleLabel}>{children}</nav>
      </aside>
    </>
  );
}
