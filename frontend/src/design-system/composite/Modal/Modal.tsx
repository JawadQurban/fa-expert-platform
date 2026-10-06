import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@utils/cn';
import { useFocusTrap } from '@hooks/useFocusTrap';
import { ButtonClose } from '@ds/primitives';
import styles from './Modal.module.css';

/**
 * Modal (FADS composite — DGA CMP-25).
 *
 * Visually verified against the live Figma component — see
 * `docs/FIGMA_MODAL_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Modal/VISUAL_COMPLIANCE_MODAL.md`.
 *
 * Confirmation/feedback/alert dialog only — **never for large data entry**
 * (`INTERACTION_SPECIFICATION.md` §10, DC-13). Focus moves in and is trapped
 * (`useFocusTrap`, which also restores focus to the trigger on close). `Esc`
 * always closes (cancel semantics). Scrim click closes only when
 * `dismissOnScrimClick` (default `true`) — set it to `false` for destructive
 * confirmations that require an explicit button choice. `aria-modal` +
 * `aria-labelledby` (required `title`). Rendered via a `document.body`
 * portal above `--fads-sys-z-modal`.
 *
 * The footer stays a generic `footer: ReactNode` slot rather than structured
 * `primaryAction`/`secondaryAction`/`tertiaryAction` props — Figma's own
 * `_Modal Actions` sub-component maps `Primary Action` to this design
 * system's already-Approved `Button` `variant="neutral"` (byte-identical
 * `#0d121c` fill, confirmed via token comparison) and `Secondary`/`Tertiary
 * Action` to `variant="secondary"` (bordered), which real consumers should
 * compose directly — see the compliance report for the full guidance and the
 * `OfficialFigmaReference` story for a worked example.
 *
 * While open, every other direct child of `document.body` is marked `inert`
 * (WCAG 4.1.2 — background content must be unreachable by keyboard/assistive
 * tech while a dialog is open), restored on close. Other FADS `document.body`
 * portals (this Modal's own scrim, another nested Modal, `ToastProvider`'s
 * viewport) are recognized via a shared `data-fads-portal` marker and are
 * never inerted by this logic, so toasts can still announce and a nested
 * Modal is never accidentally disabled by its parent.
 */
export interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
  readonly children?: ReactNode;
  /** Live-verified 40×40 featured-icon slot, leading the title row. No default glyph — fully optional. */
  readonly icon?: ReactNode;
  /** Primary/cancel action slot, rendered at the dialog's logical end. */
  readonly footer?: ReactNode;
  readonly dismissOnScrimClick?: boolean;
  /** Accessible label for the close button. Defaults to English. */
  readonly dismissLabel?: string;
  readonly className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  icon,
  footer,
  dismissOnScrimClick = true,
  dismissLabel = 'Dismiss',
  className,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useFocusTrap<HTMLDivElement>(open);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const dialog = dialogRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    dialog?.addEventListener('keydown', handleKeyDown);
    return () => dialog?.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, dialogRef]);

  useEffect(() => {
    if (!open || !dismissOnScrimClick) {
      return;
    }
    const scrim = scrimRef.current;
    const handleClick = (event: MouseEvent) => {
      if (event.target === scrim) {
        onClose();
      }
    };
    scrim?.addEventListener('click', handleClick);
    return () => scrim?.removeEventListener('click', handleClick);
  }, [open, dismissOnScrimClick, onClose]);

  // Isolate background content from assistive tech while open (WCAG 4.1.2).
  // Skips any element carrying `data-fads-portal` (this Modal's own scrim,
  // a nested Modal, the ToastProvider viewport) so other FADS overlays are
  // never disabled by this one.
  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }
    const scrim = scrimRef.current;
    const inerted: HTMLElement[] = [];
    Array.from(document.body.children).forEach((child) => {
      if (
        !(child instanceof HTMLElement) ||
        child === scrim ||
        child.hasAttribute('data-fads-portal') ||
        child.inert
      ) {
        return;
      }
      child.inert = true;
      inerted.push(child);
    });
    return () => {
      inerted.forEach((element) => {
        element.inert = false;
      });
    };
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div ref={scrimRef} className={styles.scrim} data-fads-portal="true">
      <div
        ref={dialogRef}
        className={cn(styles.dialog, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <div className={styles.titleRow}>
            {icon && (
              <span className={styles.iconBadge} aria-hidden="true">
                {icon}
              </span>
            )}
            <ButtonClose
              size="md"
              label={dismissLabel}
              onClick={onClose}
              className={styles.close}
            />
          </div>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        </div>
        <div className={styles.body}>{children}</div>
        {footer != null && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
