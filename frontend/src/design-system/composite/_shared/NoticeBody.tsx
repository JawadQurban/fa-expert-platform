import type { ReactNode } from 'react';

/**
 * NoticeBody — internal, unexported building block shared by `Notification`
 * and `Toast`. Those two components independently duplicated an identical
 * title/message/dismiss-button structure (found during the Phase 5D
 * production-readiness review); this extracts exactly that shared,
 * non-varying structure so a future change to it (e.g. the dismiss button's
 * markup) only needs to happen once.
 *
 * `Alert` no longer composes this — its live-verified official structure
 * (a 40px featured icon, up to two actions, a tone-colored accent stripe, a
 * real official `Mobile` stacked layout) diverges too far from this shared
 * shape, so it was rebuilt as a fully self-contained primitive instead (same
 * architecture precedent as `TextInput`/`Textarea` vs. `Select`) — see
 * `docs/FIGMA_ALERT_SPECIFICATION.md`.
 *
 * It intentionally does **not** own tone, role, or CSS values — each caller
 * keeps its own `.module.css` (and thus its own token choices for that
 * surface: page banner vs. floating toast are legitimately different
 * surfaces) and simply passes its own generated class names through via
 * `styles`, so this component renders using the caller's own CSS Module.
 */
// Matches the shape Vite's CSS-module typing (`CSSModuleClasses`) actually
// produces — a plain string-keyed record, not named properties — so any
// caller's `import styles from './X.module.css'` is directly assignable
// without a cast, as long as it defines these four class names.
export interface NoticeBodyStyles {
  readonly [className: string]: string;
}

export interface NoticeBodyProps {
  readonly title?: ReactNode;
  readonly children?: ReactNode;
  readonly dismissible?: boolean;
  readonly onDismiss?: () => void;
  readonly dismissLabel: string;
  readonly styles: NoticeBodyStyles;
}

export function NoticeBody({
  title,
  children,
  dismissible = false,
  onDismiss,
  dismissLabel,
  styles,
}: NoticeBodyProps) {
  return (
    <>
      <div className={styles.content}>
        {title != null && <p className={styles.title}>{title}</p>}
        {children != null && <div className={styles.message}>{children}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          ×
        </button>
      )}
    </>
  );
}
