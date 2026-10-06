import { useId } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './TextInput.module.css';

/**
 * TextInput (FADS primitive — DGA CMP-13).
 *
 * Verified live against the official Platforms Code Figma Text Input component set
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:130250` — 288 variants: `rtl` ×
 * `state` × `filled` × `error` × `size` × `style`) via the Figma MCP — see
 * `docs/FIGMA_TEXT_INPUT_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/TextInput/VISUAL_COMPLIANCE_TEXT_INPUT.md`.
 *
 * A labelled text field with optional leading icon, prefix/suffix badges, and
 * helper/error support. DGA states — Default, Hovered, Pressed, Focused,
 * Read-only, Disabled — are expressed via native `:hover`/`:active`/`:focus-within`
 * and the `disabled`/`readOnly` attributes, not a `state` prop (matches `Button`/
 * `Link`/`Tag`'s established pattern). The official `Filled` axis (entered text vs.
 * placeholder) is not a prop either — it is exactly what a real `<input>`'s `value`
 * vs. its native `::placeholder` rendering already expresses.
 *
 * This is a self-contained primitive — it does **not** compose the shared
 * `Field`/`control.module.css` base that `Textarea`/`Select` still use, since the
 * official Text Input's structure (prefix/suffix, leading icon, size/surface axes)
 * has diverged enough from that shared shape that reusing it would mean distorting
 * it for one component's needs. `Field`/`control.module.css`/`Textarea`/`Select`
 * are unchanged by this pass.
 */
export type TextInputSize = 'md' | 'lg';
export type TextInputSurface = 'default' | 'filledDarker' | 'filledLighter';

export interface TextInputProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'aria-invalid' | 'size' | 'prefix'
> {
  readonly label: ReactNode;
  readonly helperText?: ReactNode;
  readonly errorText?: ReactNode;
  /** Marks the field required (visual indicator + aria-required). */
  readonly requiredField?: boolean;
  /** Width of the wrapping field. */
  readonly fieldClassName?: string;
  /** Maps to the official `Size` property. */
  readonly size?: TextInputSize;
  /** Maps to the official `Style` property (background surface treatment). */
  readonly surface?: TextInputSurface;
  /** Leading icon slot (maps to the official `icon`/`swapIcon`). */
  readonly iconStart?: ReactNode;
  /** Text badge before the field content (maps to the official `prefix`). */
  readonly prefix?: ReactNode;
  /** Text badge after the field content (maps to the official `suffix`). */
  readonly suffix?: ReactNode;
}

export function TextInput({
  label,
  helperText,
  errorText,
  requiredField = false,
  fieldClassName,
  size = 'lg',
  surface = 'default',
  iconStart,
  prefix,
  suffix,
  className,
  id: idProp,
  disabled,
  readOnly,
  ref,
  ...rest
}: TextInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const invalid = errorText != null && errorText !== false;

  const describedBy =
    [helperText != null ? helperId : null, invalid ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

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
        className={cn(styles.inputField, className)}
        data-size={size}
        data-surface={surface}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
      >
        {prefix != null && (
          <span className={styles.affix} dir="auto">
            {prefix}
          </span>
        )}
        <div className={styles.content}>
          {iconStart && (
            <span className={styles.icon} aria-hidden="true">
              {iconStart}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            type="text"
            className={styles.input}
            disabled={disabled}
            readOnly={readOnly}
            dir="auto"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-required={requiredField || undefined}
            {...rest}
          />
        </div>
        {suffix != null && (
          <span className={styles.affix} dir="auto">
            {suffix}
          </span>
        )}
      </div>
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
