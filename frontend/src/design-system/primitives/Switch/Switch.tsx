import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Icon } from '../Icon/Icon';
import styles from './Switch.module.css';

/**
 * Switch (FADS primitive — DGA CMP-18).
 *
 * Verified live against the official Platforms Code Figma Switch component set
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:69895` — 20 variants: `rtl` ×
 * `state`[Default/Hovered/Pressed/Focused/Disabled] × `on`) and the **Switch
 * Label** composed example (node `30150:69998` — label + optional helper text
 * + optional error row, plus a `trailSwitch` layout axis) via the Figma MCP —
 * see `docs/FIGMA_SWITCH_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Switch/VISUAL_COMPLIANCE_SWITCH.md`.
 *
 * Built on a real `<button role="switch">` (not a hidden native input +
 * decorative box like `Checkbox`/`Radio`) — there is no native HTML input
 * type for a switch, so a button carrying `role="switch"`/`aria-checked` is
 * the WAI-ARIA APG-recommended pattern; native `<button>` semantics already
 * give Space/Enter activation for free. A separate `<input type="hidden">`
 * mirrors state for native form submission, since the button itself isn't a
 * form-associated element.
 *
 * `Switch Label`'s official `trailSwitch` axis (switch rendered after the
 * label instead of before it) is exposed as the `trailing` prop — an
 * independent axis from `rtl`, both live-verified as distinct combinations.
 * No official `Read-only` state exists for Switch (unlike `Checkbox`/`Radio`)
 * — not implemented, per "never invent variants."
 */
export interface SwitchProps {
  readonly label: ReactNode;
  /** Optional supporting description below the label. */
  readonly description?: ReactNode;
  readonly errorText?: ReactNode;
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly name?: string;
  /** Maps to the official `trailSwitch` property — renders the switch after the label. */
  readonly trailing?: boolean;
}

export function Switch({
  label,
  description,
  errorText,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className,
  name,
  trailing = false,
}: SwitchProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descId = `${id}-desc`;
  const errorId = `${id}-error`;
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const isOn = isControlled ? checked : internal;
  const invalid = errorText != null && errorText !== false;

  const describedBy =
    [description != null ? descId : null, invalid ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  const toggle = () => {
    if (disabled) return;
    const next = !isOn;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  };

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      data-checked={isOn || undefined}
      className={styles.track}
      onClick={toggle}
    >
      <span className={styles.thumb} aria-hidden="true" />
    </button>
  );

  return (
    <span className={cn(styles.root, className)} data-disabled={disabled || undefined}>
      {!trailing && control}
      <span className={styles.text}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {description != null && (
          <span id={descId} className={styles.description}>
            {description}
          </span>
        )}
        {invalid && (
          <p id={errorId} className={styles.error} role="alert">
            <Icon
              name="alert-circle"
              size="sm"
              tone="error"
              decorative
              className={styles.errorIcon}
            />
            {errorText}
          </p>
        )}
      </span>
      {trailing && control}
      {name != null && <input type="hidden" name={name} value={isOn ? 'on' : 'off'} />}
    </span>
  );
}
