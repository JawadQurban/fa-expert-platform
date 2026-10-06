import type { ReactNode } from 'react';
import { Button } from '@ds/primitives';
import { Alert } from '../Alert/Alert';
import styles from './ErrorState.module.css';

/**
 * ErrorState (FADS composite — not a numbered DGA `CMP-*` element; a
 * FADS-authored composition of `Alert` (CMP-23) + `Button`).
 *
 * ⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**.
 *
 * Per `SCREEN_SPECIFICATIONS.md` ("Error state (Inline Alert CMP-23 + retry,
 * data preserved)") and `INTERACTION_SPECIFICATION.md` §9 (failed
 * submission/load → Inline Alert + retry; data preserved; focus → alert) —
 * this does not invent a new alert shape, it composes the existing Inline
 * Alert with an optional retry action so every "list/detail failed to load"
 * surface in the product looks and behaves identically (DC-26).
 */
export interface ErrorStateProps {
  readonly title?: ReactNode;
  readonly description: ReactNode;
  readonly onRetry?: () => void;
  /** Accessible label for the retry button. Defaults to English; pass a localized string. */
  readonly retryLabel?: string;
  readonly className?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <Alert tone="error" title={title} className={className}>
      <div className={styles.content}>
        <p className={styles.description}>{description}</p>
        {onRetry != null && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    </Alert>
  );
}
