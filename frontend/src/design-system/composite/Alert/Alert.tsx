import type { AriaRole, ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Icon } from '@ds/primitives';
import type { IconName } from '@ds/primitives';
import styles from './Alert.module.css';

/**
 * Alert (FADS composite — DGA CMP-23, official Figma name "Inline Alert").
 *
 * Verified live against the official Platforms Code Figma **Inline Alert** component
 * set (file `J0xq7JG3JKshRDzrgAM7E0`, node `1730:46048` — 40 variants: `rtl` ×
 * `type` [Neutral/Info/Destructive/Warning/Success] × `backgroundColor` [White/Color]
 * × `mobile`) via the Figma MCP, after the node was manually registered — see
 * `docs/FIGMA_ALERT_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Alert/VISUAL_COMPLIANCE_ALERT.md`.
 *
 * Confirmed a genuinely separate official component from `Notification` (page
 * banner) and `Toast`/"Notification Toast" (transient overlay) — three distinct
 * component sets exist in the official library.
 *
 * The live structure is substantially richer than a plain title/message/dismiss
 * box: a 40px circular **featured icon** (tone-colored), a title + optional
 * description, up to **two actions**, a dismiss button, and a tone-colored
 * **accent stripe** along the leading edge (always present, not optional). A real
 * official responsive variant (`Mobile`) restructures the layout (icon + dismiss
 * in one row, text below full-width, actions stacked full-width, the accent
 * stripe moves to the top edge) — this replaces the *previous, unverified*
 * `compact` prop (deleted; no Figma evidence ever supported it) with the real
 * `mobile` property. `surface` maps to the official `backgroundColor` axis
 * (`White` | `Color` — a tinted surface where the title text itself also
 * recolors to the tone, while the description stays neutral either way).
 *
 * This is a self-contained primitive (does not compose the shared `_shared/
 * NoticeBody`) — its official structure diverges too far from the simple shape
 * `Toast`/`Notification` still share (same architecture precedent as `TextInput`/
 * `Textarea` vs. `Select`). `Toast`/`Notification` are untouched.
 *
 * `role` is never blindly hardcoded to `"alert"` — it defaults to a tone-based
 * choice (`error`/`warning` → assertive `"alert"`, `info`/`success`/`neutral` →
 * polite `"status"`) and can be overridden per instance via the `role` prop.
 */
export type AlertTone = 'info' | 'success' | 'warning' | 'error' | 'neutral';
export type AlertSurface = 'white' | 'tinted';

const TONE_ICON: Record<AlertTone, IconName> = {
  neutral: 'help-circle',
  info: 'information-circle',
  warning: 'alert-diamond',
  error: 'alert-circle',
  success: 'information-circle',
};

/**
 * No dedicated checkmark/success icon exists in the Icon registry yet (confirmed
 * absent via a full-registry search — same gap already documented for other
 * components). Reuses the exact checkmark path already established by `Checkbox`
 * rather than inventing a new glyph.
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

export interface AlertProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  readonly title?: ReactNode;
  readonly tone?: AlertTone;
  /** Maps to the official `backgroundColor` property (`White` | `Color`). */
  readonly surface?: AlertSurface;
  /** Decorative featured icon. Defaults to a tone-appropriate icon; always `aria-hidden`. */
  readonly icon?: ReactNode;
  /** Primary action (e.g. a `Button`), rendered in the official "Actions" row. */
  readonly action?: ReactNode;
  /** Secondary action, rendered alongside `action`. */
  readonly secondaryAction?: ReactNode;
  /** Maps to the official `Mobile` property — stacked layout, full-width actions, top accent stripe. */
  readonly mobile?: boolean;
  readonly dismissible?: boolean;
  readonly onDismiss?: () => void;
  /** Accessible label for the dismiss button. Defaults to English; pass a localized string. */
  readonly dismissLabel?: string;
  /** Overrides the tone-based default `role` ("alert" for error/warning, "status" otherwise). */
  readonly role?: AriaRole;
}

export function Alert({
  title,
  tone = 'info',
  surface = 'white',
  icon,
  action,
  secondaryAction,
  mobile = false,
  dismissible = false,
  onDismiss,
  dismissLabel = 'Dismiss',
  role,
  className,
  children,
  ...rest
}: AlertProps) {
  const resolvedRole = role ?? (tone === 'error' || tone === 'warning' ? 'alert' : 'status');
  const iconTone = tone === 'info' ? 'information' : tone;
  const resolvedIcon =
    icon ??
    (tone === 'success' ? (
      <SuccessGlyph />
    ) : (
      <Icon name={TONE_ICON[tone]} size="md" tone={iconTone} decorative />
    ));

  const dismissButton = dismissible && (
    <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label={dismissLabel}>
      <Icon name="cancel-01" size="sm" decorative />
    </button>
  );

  const textBlock = (
    <div className={styles.textBlock}>
      {title != null && <p className={styles.title}>{title}</p>}
      {children != null && <div className={styles.description}>{children}</div>}
    </div>
  );

  const hasActions = action != null || secondaryAction != null;
  const actionsRow = hasActions && (
    <div className={styles.actions}>
      {action}
      {secondaryAction}
    </div>
  );

  return (
    <div
      className={cn(styles.alert, className)}
      data-tone={tone}
      data-surface={surface}
      data-mobile={mobile || undefined}
      role={resolvedRole}
      {...rest}
    >
      <span className={styles.stripe} aria-hidden="true" />
      {mobile ? (
        <>
          <div className={styles.topRow}>
            <span className={styles.iconCircle} data-tone={tone} aria-hidden="true">
              {resolvedIcon}
            </span>
            {dismissButton}
          </div>
          {textBlock}
          {actionsRow}
        </>
      ) : (
        <>
          <div className={styles.header}>
            <span className={styles.iconCircle} data-tone={tone} aria-hidden="true">
              {resolvedIcon}
            </span>
            {textBlock}
            {dismissButton}
          </div>
          {actionsRow}
        </>
      )}
    </div>
  );
}
