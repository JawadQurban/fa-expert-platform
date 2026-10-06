import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Toast } from './Toast';
import { ToastContext } from './useToast';
import type { ToastContextValue, ToastOptions } from './useToast';
import styles from './Toast.module.css';

/**
 * ToastProvider (FADS composite — DGA CMP-22, `PAT-06`). Pair with `useToast`.
 *
 * ⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**.
 *
 * Owns the toast queue and renders it via a `document.body` portal
 * (marked `data-fads-portal` so other FADS overlays, e.g. `Modal`, never
 * treat it as background content to isolate) so stacked toasts always sit
 * above app content (`--fads-sys-z-toast`), regardless of where
 * `useToast()` is called from. Mount once near the root of an application
 * (it is a design-system provider, not app wiring — the consuming product
 * decides where).
 *
 * Nesting a `ToastProvider` inside another is not supported — an inner
 * instance detects the ancestor via context and renders only its
 * `children`, deferring entirely to the outer provider's queue/viewport, so
 * a duplicate empty `role="region"` landmark is never mounted.
 */
interface ToastRecord extends Required<Pick<ToastOptions, 'id' | 'tone'>> {
  readonly title?: ReactNode;
  readonly description: ReactNode;
  readonly icon?: ReactNode;
  readonly action?: ReactNode;
  readonly secondaryAction?: ReactNode;
  readonly duration: number | null;
  readonly dismissLabel?: string;
}

export interface ToastProviderProps {
  readonly children: ReactNode;
  /** Accessible label for the toast viewport region. Defaults to English. */
  readonly label?: string;
}

export function ToastProvider({ children, label = 'Notifications' }: ToastProviderProps) {
  const parentContext = useContext(ToastContext);
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idCounter = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    idCounter.current += 1;
    const id = options.id ?? `toast-${idCounter.current}`;
    const record: ToastRecord = {
      id,
      title: options.title,
      description: options.description,
      icon: options.icon,
      action: options.action,
      secondaryAction: options.secondaryAction,
      tone: options.tone ?? 'info',
      duration: options.duration === undefined ? 5000 : options.duration,
      dismissLabel: options.dismissLabel,
    };
    setToasts((current) => [...current, record]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast]
  );

  if (parentContext) {
    if (import.meta.env.DEV) {
      console.error(
        'ToastProvider was mounted inside another ToastProvider. Nesting is not ' +
          'supported — this inner instance renders no viewport of its own and ' +
          'useToast() calls beneath it resolve to the outer provider.'
      );
    }
    return <>{children}</>;
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className={styles.viewport} role="region" aria-label={label} data-fads-portal="true">
            {toasts.map((toast) => (
              <Toast
                key={toast.id}
                title={toast.title}
                tone={toast.tone}
                icon={toast.icon}
                action={toast.action}
                secondaryAction={toast.secondaryAction}
                duration={toast.duration}
                dismissLabel={toast.dismissLabel}
                onDismiss={() => dismissToast(toast.id)}
              >
                {toast.description}
              </Toast>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
