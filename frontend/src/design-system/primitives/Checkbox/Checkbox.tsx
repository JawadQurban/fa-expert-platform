import { useEffect, useId, useRef } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { mergeRefs } from '@utils/mergeRefs';
import styles from './Checkbox.module.css';

/**
 * Checkbox (FADS primitive — DGA CMP-17).
 *
 * Verified live against the official Platforms Code Figma Checkbox component set
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `30186:53826` — 108 variants:
 * `checked+indeterminate` × `state` × `size` × `style`) via the Figma MCP — see
 * `docs/FIGMA_CHECKBOX_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Checkbox/VISUAL_COMPLIANCE_CHECKBOX.md`.
 *
 * A real native `<input type="checkbox">` (visually hidden but fully interactive
 * and focusable) drives every state; a decorative sibling `<span>` renders the
 * DGA-specified box/checkmark/dash visuals via `:checked`/`:indeterminate`/`:hover`/
 * `:active`/`:focus-visible`/`:disabled`. `indeterminate` is a DOM property, applied
 * via a merged ref (no `indeterminate` HTML attribute exists).
 *
 * `readOnly`: the native `readonly` attribute has **no enforced effect** on
 * `<input type="checkbox">` in any browser (excluded by the HTML spec) — this is
 * implemented with a `preventDefault` guard on click/Space plus `aria-readonly` for
 * correct assistive-technology announcement, since the attribute alone cannot
 * deliver the Figma-specified read-only behavior.
 *
 * No official `Invalid` variant exists on this Figma component (spec §2) — `errorText`
 * is still supported (wired to `aria-invalid`/`aria-describedby`/`role="alert"`, the
 * same contract every other FADS form primitive uses) as a functional accessibility
 * requirement independent of Figma's visual variant set; it does not change the
 * checkbox's own colors.
 */
export type CheckboxSize = 'md' | 'sm' | 'xs';
export type CheckboxMood = 'primary' | 'neutral';

export interface CheckboxProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'id' | 'size'
> {
  readonly label: ReactNode;
  /** Optional supporting description below the label. */
  readonly description?: ReactNode;
  readonly indeterminate?: boolean;
  /** Maps to the official `Size` property. */
  readonly size?: CheckboxSize;
  /** Maps to the official `Style` property. */
  readonly mood?: CheckboxMood;
  readonly errorText?: ReactNode;
}

export function Checkbox({
  label,
  description,
  errorText,
  indeterminate = false,
  size = 'md',
  mood = 'primary',
  className,
  disabled = false,
  readOnly = false,
  onClick,
  onKeyDown,
  ref,
  ...rest
}: CheckboxProps) {
  const id = useId();
  const descId = `${id}-desc`;
  const errorId = `${id}-error`;
  const invalid = errorText != null && errorText !== false;
  const innerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const describedBy =
    [description != null ? descId : null, invalid ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div className={cn(styles.root, className)} data-disabled={disabled || undefined}>
      <span className={styles.box} data-size={size} data-mood={mood}>
        <input
          ref={mergeRefs(innerRef, ref)}
          id={id}
          type="checkbox"
          className={styles.input}
          disabled={disabled}
          readOnly={readOnly}
          data-readonly={readOnly || undefined}
          aria-readonly={readOnly || undefined}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onClick={(event) => {
            if (readOnly) event.preventDefault();
            onClick?.(event);
          }}
          onKeyDown={(event) => {
            if (readOnly && event.key === ' ') event.preventDefault();
            onKeyDown?.(event);
          }}
          {...rest}
        />
        <span className={styles.visual} aria-hidden="true">
          <svg className={styles.check} viewBox="0 0 16 16" focusable="false">
            <path
              d="M3 8.5L6.5 12L13 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg className={styles.dash} viewBox="0 0 16 16" focusable="false">
            <path
              d="M4 8H12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </span>
      <span className={styles.text}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {description != null && (
          <span id={descId} className={styles.description}>
            {description}
          </span>
        )}
        {invalid && (
          <p id={errorId} className={styles.error} role="alert">
            {errorText}
          </p>
        )}
      </span>
    </div>
  );
}
