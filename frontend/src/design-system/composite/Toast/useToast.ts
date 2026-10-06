import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ToastTone } from './Toast';

export interface ToastOptions {
  readonly id?: string;
  readonly title?: ReactNode;
  readonly description: ReactNode;
  readonly tone?: ToastTone;
  /** Decorative featured icon. Defaults to a tone-appropriate icon. */
  readonly icon?: ReactNode;
  /** Primary action (e.g. a `Button`), rendered in the official "Actions" row. */
  readonly action?: ReactNode;
  /** Secondary action, rendered alongside `action`. */
  readonly secondaryAction?: ReactNode;
  /** Auto-dismiss delay in ms. `null` disables auto-dismiss. Defaults to 5000ms. */
  readonly duration?: number | null;
  /** Accessible label for this toast's close button. Defaults to English. */
  readonly dismissLabel?: string;
}

export interface ToastContextValue {
  readonly showToast: (options: ToastOptions) => string;
  readonly dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Requires a `<ToastProvider>` ancestor. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>.');
  }
  return ctx;
}
