import { createContext, useContext, useId } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Icon } from '../Icon/Icon';
import styles from './Radio.module.css';

/**
 * Radio + RadioGroup (FADS primitive — DGA CMP-16).
 *
 * Verified live against the official Platforms Code Figma Radio component set
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `30195:23385` — 24 variants: `state`
 * (Default/Hovered/Pressed/Focused/Read-only/Disabled) × `style`
 * (Primary/Neutral) × `selected`) and the **Radio Label** sub-component (node
 * `30195:23490` — label + optional helper text + optional error row with a
 * `FeedbackIcon`) via the Figma MCP — see `docs/FIGMA_RADIO_SPECIFICATION.md`
 * and `reports/VISUAL_COMPLIANCE/Radio/VISUAL_COMPLIANCE_RADIO.md`.
 *
 * A real native `<input type="radio">` (visually hidden but fully interactive
 * and focusable, same technique as `Checkbox`) drives every state; a
 * decorative sibling `<span>` renders the DGA-specified ring/dot visuals via
 * `:checked`/`:hover`/`:active`/`:focus-visible`/`:disabled`. Native `name`
 * grouping already gives arrow-key roving navigation within a `RadioGroup` —
 * no custom keydown handling is needed.
 *
 * `readOnly`: the native `readonly` attribute has **no enforced effect** on
 * `<input type="radio">` (excluded by the HTML spec, same as `checkbox`) —
 * guarded on click/Space (`preventDefault`, same technique as `Checkbox`)
 * **and** authoritatively inside `onChange` (a grouped radio's browser
 * activation behavior — unchecking every sibling — isn't reliably cancellable
 * via `preventDefault` on the clicked element alone in every environment,
 * unlike a standalone checkbox's simple toggle; gating the state-changing
 * callback itself is correct regardless). Set at the `RadioGroup` level
 * (Figma has no per-option read-only variant — a group either is or isn't
 * answerable). **`readOnly` groups should be used in controlled mode**
 * (`value`, not `defaultValue`): read-only is naturally "showing a fixed
 * answer," and only a controlled `value` guarantees the checked option can
 * never drift, since React re-pins `checked` on every render — an
 * uncontrolled `defaultValue` has no such backstop against a stray native
 * DOM toggle. Unlike
 * `Checkbox`, no `aria-readonly` is set: the WAI-ARIA `radio` role does not
 * support that property at all (`role="checkbox"` does) — `eslint-plugin-jsx-a11y`
 * catches this, correctly, as a spec violation. `data-readonly` still drives
 * the visual state via CSS.
 *
 * "Radio Label" (node `30195:23490`) is not a separate exported component —
 * its label/description/error slots are bundled directly into `Radio` itself,
 * the same pattern already used by `Checkbox` (`label`/`description`/
 * `errorText`) rather than `TextInput`'s standalone `Label`. Its `alertMessage`
 * slot is implemented as a **group-level** `errorText` (on `RadioGroup`, not
 * per-`Radio`) — a per-option error has no precedent elsewhere in this design
 * system and no sensible "choose one of these" semantics; this is a
 * deliberate, disclosed interpretation, not an omission.
 */
export type RadioMood = 'primary' | 'neutral';

interface RadioGroupContextValue {
  readonly name: string;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly mood?: RadioMood;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
  readonly legend: ReactNode;
  readonly name?: string;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly disabled?: boolean;
  /** Native `readonly` has no effect on radios — guarded in JS, see module doc. */
  readonly readOnly?: boolean;
  /** Maps to the official `Style` property. Applies to every `Radio` in the group. */
  readonly mood?: RadioMood;
  readonly errorText?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

export function RadioGroup({
  legend,
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  readOnly,
  mood,
  errorText,
  children,
  className,
}: RadioGroupProps) {
  const generated = useId();
  const groupName = name ?? generated;
  const invalid = errorText != null && errorText !== false;
  const errorId = `${generated}-error`;

  return (
    <fieldset
      className={cn(styles.group, className)}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      disabled={disabled}
    >
      <legend className={styles.legend}>{legend}</legend>
      <RadioGroupContext.Provider
        value={{ name: groupName, value, defaultValue, onValueChange, disabled, readOnly, mood }}
      >
        {children}
      </RadioGroupContext.Provider>
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
    </fieldset>
  );
}

export interface RadioProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'id' | 'name' | 'value' | 'readOnly'
> {
  readonly label: ReactNode;
  readonly value: string;
  /** Optional supporting description below the label. */
  readonly description?: ReactNode;
  /** Maps to the official `Style` property. Defaults to the group's `mood`, then `'primary'`. */
  readonly mood?: RadioMood;
}

export function Radio({
  label,
  value,
  description,
  mood,
  className,
  onChange,
  onClick,
  onKeyDown,
  ref,
  ...rest
}: RadioProps) {
  const id = useId();
  const descId = `${id}-desc`;
  const group = useContext(RadioGroupContext);
  const resolvedMood = mood ?? group?.mood ?? 'primary';
  const readOnly = group?.readOnly ?? false;

  const checked = group?.value !== undefined ? group.value === value : undefined;
  const defaultChecked =
    group?.value === undefined && group?.defaultValue !== undefined
      ? group.defaultValue === value
      : rest.defaultChecked;

  return (
    <div className={cn(styles.root, className)}>
      <span className={styles.box} data-mood={resolvedMood}>
        <input
          ref={ref}
          id={id}
          type="radio"
          className={styles.input}
          name={group?.name}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          aria-describedby={description != null ? descId : undefined}
          data-readonly={readOnly || undefined}
          onChange={(event) => {
            if (readOnly) return;
            group?.onValueChange?.(value);
            onChange?.(event);
          }}
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
          <span className={styles.dot} />
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
      </span>
    </div>
  );
}

export { RadioGroupContext };
