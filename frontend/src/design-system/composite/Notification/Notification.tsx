import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { ButtonClose, Icon } from '@ds/primitives';
import type { IconName } from '@ds/primitives';
import styles from './Notification.module.css';

/**
 * Notification (FADS composite — DGA CMP-24, official Figma name "Notification", page-level
 * banner, part of the `PAT-06` notification family alongside the already-Approved `Alert` and
 * `Toast`).
 *
 * Visually rebuilt to match the live Figma component — see
 * `docs/FIGMA_NOTIFICATION_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Notification/VISUAL_COMPLIANCE_NOTIFICATION.md`. Confirms this is a
 * genuinely distinct shape from `Alert`/`Toast` (both boxed cards) — a slim, full-width,
 * single-row banner: a 24px solid tone-colored feedback icon, an optional bold tone-colored
 * `leadText` prefix, a tone-colored message (unlike `Alert`/`Toast`, whose message stays neutral
 * gray regardless of tone), inline `link`/`action` slots in the *same* row as the text, a
 * `ButtonClose` dismiss control, and a thin tone-colored accent line along the **bottom** edge
 * (not the leading edge like `Alert`, not the top edge like `Toast`'s mobile variant).
 *
 * `error` uses `role="alert"` (assertive); other tones use `role="status"` (polite). All copy is
 * passed in via props.
 */
export type NotificationTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

const TONE_ICON: Record<Exclude<NotificationTone, 'success'>, IconName> = {
  neutral: 'information-circle',
  info: 'information-circle',
  warning: 'alert-diamond',
  error: 'alert-02',
};

/**
 * No dedicated checkmark icon exists in the Icon registry (same disclosed gap already found for
 * `Alert`/`Toast`) — reuses the exact same checkmark path.
 */
function SuccessGlyph() {
  return (
    <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
      <path
        d="M3 8.5L6.5 12L13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface NotificationProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Optional bold prefix before the message (Figma's `leadText`, e.g. "Important:"). */
  readonly title?: ReactNode;
  readonly tone?: NotificationTone;
  /** Decorative feedback icon. Defaults to a tone-appropriate icon; always `aria-hidden`. */
  readonly icon?: ReactNode;
  /** Inline text link, rendered alongside the message. */
  readonly link?: ReactNode;
  /** Inline action (e.g. a `Button`), rendered after `link`. */
  readonly action?: ReactNode;
  readonly dismissible?: boolean;
  readonly onDismiss?: () => void;
  /** Accessible label for the close button. Defaults to English; pass a localized string. */
  readonly dismissLabel?: string;
}

export function Notification({
  title,
  tone = 'info',
  icon,
  link,
  action,
  dismissible = false,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
  children,
  ...rest
}: NotificationProps) {
  const role = tone === 'error' ? 'alert' : 'status';
  const resolvedIcon =
    icon ??
    (tone === 'success' ? <SuccessGlyph /> : <Icon name={TONE_ICON[tone]} size="sm" decorative />);
  const hasActions = link != null || action != null;

  return (
    <div className={cn(styles.notification, className)} data-tone={tone} role={role} {...rest}>
      <div className={styles.row} data-dismissible={dismissible || undefined}>
        <div className={styles.content}>
          <span className={styles.iconCircle} data-tone={tone} aria-hidden="true">
            {resolvedIcon}
          </span>
          {title != null && <p className={styles.title}>{title}</p>}
          {children != null && <div className={styles.message}>{children}</div>}
          {hasActions && (
            <div className={styles.actions}>
              {link}
              {action}
            </div>
          )}
        </div>
        {dismissible && (
          <ButtonClose
            size="md"
            label={dismissLabel}
            onClick={onDismiss}
            className={styles.close}
          />
        )}
      </div>
      <span className={styles.accent} aria-hidden="true" />
    </div>
  );
}
