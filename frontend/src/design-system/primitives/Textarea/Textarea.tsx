import { useEffect, useId, useState } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Textarea.module.css';

/**
 * Textarea (FADS primitive — DGA CMP-14).
 *
 * Verified live against the official Platforms Code Figma Textarea component set
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `5462:417368` — 144 variants: `rtl` ×
 * `state` × `filled` × `error` × `style`) via the Figma MCP — see
 * `docs/FIGMA_TEXTAREA_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Textarea/VISUAL_COMPLIANCE_TEXTAREA.md`.
 *
 * A labelled multi-line field, sharing its entire governing `Form/field-*` token
 * family with the already-Approved `TextInput`. DGA states — Default, Hovered,
 * Pressed, Focused, Read-only, Disabled — are expressed via native
 * `:hover`/`:focus-within` and the `disabled`/`readOnly` attributes (both fully
 * enforced by the browser on `<textarea>`, unlike `Checkbox`'s read-only gap), not a
 * `state` prop, matching this design system's established pattern.
 *
 * This is a self-contained primitive — it does **not** compose the shared
 * `Field`/`control.module.css` base that `Select` still uses, since the official
 * Textarea's `Style` surface axis and scrollbar/resize affordances have diverged
 * enough from that shared shape to warrant it (same rationale as `TextInput`'s own
 * rebuild). The official custom scrollbar is approximated via native CSS
 * `scrollbar-width`/`scrollbar-color` rather than a custom-built overlay — per this
 * project's "prefer native browser controls whenever practical" rule, reinventing
 * scroll behavior would be unnecessary complexity for a close visual match already
 * achievable natively. The official resize handle already matches the pre-existing
 * native `resize: vertical` exactly, so it required no change.
 */
export type TextareaSurface = 'default' | 'filledDarker' | 'filledLighter';

export interface TextareaProps extends Omit<ComponentPropsWithRef<'textarea'>, 'aria-invalid'> {
  readonly label: ReactNode;
  readonly helperText?: ReactNode;
  readonly errorText?: ReactNode;
  /** Marks the field required (visual indicator + aria-required). */
  readonly requiredField?: boolean;
  /** Width of the wrapping field. */
  readonly fieldClassName?: string;
  /** Maps to the official `Style` property (background surface treatment). */
  readonly surface?: TextareaSurface;
  /**
   * Shows a live character counter below the field. Only rendered when explicitly
   * requested — this is a functional addition, not a Figma-sourced variant.
   */
  readonly showCharacterCount?: boolean;
}

export function Textarea({
  label,
  helperText,
  errorText,
  requiredField = false,
  fieldClassName,
  surface = 'default',
  showCharacterCount = false,
  className,
  id: idProp,
  disabled,
  readOnly,
  rows = 4,
  maxLength,
  value,
  defaultValue,
  onChange,
  ref,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const invalid = errorText != null && errorText !== false;

  const [length, setLength] = useState(() => String(value ?? defaultValue ?? '').length);
  useEffect(() => {
    if (value !== undefined) setLength(String(value).length);
  }, [value]);

  const describedBy =
    [
      helperText != null ? helperId : null,
      invalid ? errorId : null,
      showCharacterCount ? `${id}-count` : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={cn(styles.field, fieldClassName)} data-disabled={disabled || undefined}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label} data-disabled={disabled || undefined}>
          {requiredField && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
          <span>{label}</span>
        </label>
      </div>
      <div
        className={styles.wrapper}
        data-surface={surface}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
      >
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={cn(styles.textarea, className)}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          dir="auto"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          aria-required={requiredField || undefined}
          onChange={(event) => {
            setLength(event.target.value.length);
            onChange?.(event);
          }}
          {...rest}
        />
      </div>
      {showCharacterCount && (
        <p id={`${id}-count`} className={styles.count} aria-live="polite">
          {maxLength != null ? `${length}/${maxLength}` : length}
        </p>
      )}
      {helperText != null && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
      {invalid && (
        <p id={errorId} className={styles.error} role="alert">
          {errorText}
        </p>
      )}
    </div>
  );
}
