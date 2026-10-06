import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ButtonClose, Icon } from '@ds/primitives';
import type { IconName } from '@ds/primitives';
import styles from './Toast.module.css';

/**
 * Toast (FADS composite — DGA CMP-22, official Figma name "Notification Toast", part of the
 * `PAT-06` notification family alongside the already-Approved `Alert`). Internal building block —
 * most consumers should use `ToastProvider`/`useToast` rather than rendering this directly.
 *
 * Visually rebuilt to match the live Figma component — see
 * `docs/FIGMA_NOTIFICATION_TOAST_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Toast/VISUAL_COMPLIANCE_TOAST.md`. Same rich structure as `Alert`
 * (40px tone-colored featured icon, up to two actions, a `ButtonClose` dismiss control, an
 * always-present tone-colored accent stripe) — no longer composes the shared `_shared/NoticeBody`
 * (self-contained primitive, same architecture precedent as `Alert` vs. `TextInput`/`Select`).
 *
 * The mobile layout (icon+close row, full-width text row, stacked full-width actions, top-edge
 * stripe) applies via a CSS media query rather than an explicit boolean prop — unlike `Alert`
 * (authored per-instance inline in a page), `Toast` is rendered from a global `ToastProvider`
 * queue with no reliable queue-time viewport signal. The live-verified mobile action-button style
 * (`variant="secondarySolid"`/`size="lg"` vs. desktop's `variant="tertiary"`/`size="md"`) is
 * **not** automatically applied to consumer-supplied `action`/`secondaryAction` slots — a
 * disclosed scope limitation, see the spec's Needs Confirmation section.
 *
 * Transient, auto-dismissing notice (`INTERACTION_SPECIFICATION.md` §11):
 * `role="status"`/`aria-live="polite"`, auto-dismiss on a timer that
 * **pauses on hover or focus** and resumes on leave/blur, plus a manual
 * close button. Pass `duration={null}` to disable auto-dismiss entirely.
 */
export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

const TONE_ICON: Record<Exclude<ToastTone, 'success'>, IconName> = {
  neutral: 'information-circle',
  info: 'information-circle',
  warning: 'alert-diamond',
  error: 'alert-02',
};

/**
 * No dedicated checkmark icon exists in the Icon registry (same disclosed gap already found for
 * `Alert`) — reuses `Alert`'s own exact checkmark path rather than inventing a new glyph.
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

export interface ToastProps {
  readonly title?: ReactNode;
  readonly tone?: ToastTone;
  /** Decorative featured icon. Defaults to a tone-appropriate icon; always `aria-hidden`. */
  readonly icon?: ReactNode;
  /** Primary action (e.g. a `Button`), rendered in the official "Actions" row. */
  readonly action?: ReactNode;
  /** Secondary action, rendered alongside `action`. */
  readonly secondaryAction?: ReactNode;
  /** Auto-dismiss delay in ms. `null` disables auto-dismiss. */
  readonly duration?: number | null;
  readonly onDismiss: () => void;
  /** Accessible label for the close button. Defaults to English; pass a localized string. */
  readonly dismissLabel?: string;
  readonly children: ReactNode;
}

export function Toast({
  title,
  tone = 'info',
  icon,
  action,
  secondaryAction,
  duration = 5000,
  onDismiss,
  dismissLabel = 'Dismiss',
  children,
}: ToastProps) {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(duration ?? 0);
  const startedAtRef = useRef(0);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (duration == null || paused) {
      return;
    }
    startedAtRef.current = Date.now();
    const timer = setTimeout(() => onDismissRef.current(), remainingRef.current);
    return () => {
      clearTimeout(timer);
      remainingRef.current = Math.max(
        0,
        remainingRef.current - (Date.now() - startedAtRef.current)
      );
    };
  }, [duration, paused]);

  const resolvedIcon =
    icon ??
    (tone === 'success' ? <SuccessGlyph /> : <Icon name={TONE_ICON[tone]} size="sm" decorative />);

  const hasActions = action != null || secondaryAction != null;

  return (
    <div
      className={styles.toast}
      role="status"
      aria-live="polite"
      data-tone={tone}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={styles.stripe} aria-hidden="true" />
      <div className={styles.header}>
        <span className={styles.iconCircle} data-tone={tone} aria-hidden="true">
          {resolvedIcon}
        </span>
        <div className={styles.textBlock}>
          {title != null && <p className={styles.title}>{title}</p>}
          {children != null && <div className={styles.description}>{children}</div>}
        </div>
        <ButtonClose size="md" label={dismissLabel} onClick={onDismiss} className={styles.close} />
      </div>
      {hasActions && (
        <div className={styles.actions}>
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
