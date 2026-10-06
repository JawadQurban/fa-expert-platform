import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Field.module.css';

/**
 * Field — the shared label/helper/error wrapper for form controls
 * (used by TextInput, Textarea, and future inputs).
 *
 * ⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**.
 *
 * Wires accessibility for the control it wraps (WCAG 3.3.1/3.3.2, 1.4.1):
 * associates `<label>`, exposes `aria-describedby` (helper + error),
 * `aria-invalid`, and `aria-required` via a render prop. Error text uses
 * `role="alert"` and consistent placement below the control (DC-33).
 */
export interface FieldAria {
  readonly id: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: true;
  readonly 'aria-required'?: true;
}

export interface FieldProps {
  readonly label: ReactNode;
  readonly children: (aria: FieldAria) => ReactNode;
  readonly helperText?: ReactNode;
  /** When present, the field is invalid and this message is announced. */
  readonly errorText?: ReactNode;
  readonly required?: boolean;
  /** Symbol/label marking a required field (default "*"). */
  readonly requiredIndicator?: ReactNode;
  readonly className?: string;
}

export function Field({
  label,
  children,
  helperText,
  errorText,
  required = false,
  requiredIndicator = '*',
  className,
}: FieldProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const invalid = errorText != null && errorText !== false;

  const describedBy =
    [helperText != null ? helperId : null, invalid ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  const aria: FieldAria = {
    id,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(invalid ? { 'aria-invalid': true } : {}),
    ...(required ? { 'aria-required': true } : {}),
  };

  return (
    <div className={cn(styles.field, className)} data-invalid={invalid || undefined}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {requiredIndicator}
          </span>
        )}
      </label>
      {children(aria)}
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
