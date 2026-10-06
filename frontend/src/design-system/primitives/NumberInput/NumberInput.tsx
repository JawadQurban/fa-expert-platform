import { useEffect, useState } from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { InputPrefixSuffix } from '../InputPrefixSuffix/InputPrefixSuffix';
import { TextInput } from '../TextInput/TextInput';
import type { TextInputProps } from '../TextInput/TextInput';

/**
 * NumberInput (FADS primitive — DGA CMP-38).
 *
 * Verified live against the official Platforms Code Figma Number Input
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:61013` — 288
 * variants: `rtl` × `state` × `filled` × `error` × `size` × `style`, the
 * same governing axes as `TextInput`) via the Figma MCP — see
 * `docs/FIGMA_NUMBER_INPUT_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/NumberInput/VISUAL_COMPLIANCE_NUMBER_INPUT.md`.
 *
 * Composes the already-Approved `TextInput` rather than reimplementing a
 * second input primitive — every color/spacing/typography/state token is
 * inherited from it unchanged. The increment/decrement controls are the
 * separately-registered `InputPrefixSuffix` primitive (confirmed via live
 * Figma node IDs to be the exact icon-badge sub-component these buttons
 * instantiate), dropped into `TextInput`'s existing `prefix`/`suffix` slots
 * exactly as the live Figma component does: `prefix` = increment (`+`),
 * `suffix` = decrement (`−`) — that order (plus-on-leading-edge) is what the
 * live node shows, not a "more conventional" minus-left/plus-right layout;
 * implemented as sampled, not silently reordered.
 *
 * The value text itself is a real `<input>` (via `TextInput`) with
 * `role="spinbutton"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax` — the
 * WAI-ARIA APG Spinbutton pattern, which explicitly describes exactly this
 * widget shape: a text box that accepts direct typing *and* has separate
 * increment/decrement controls. ArrowUp/ArrowDown on the text box also step
 * the value, per the same pattern's baseline keyboard expectation.
 *
 * Clamping to `min`/`max` happens on blur, not on every keystroke — so typing
 * a multi-digit value isn't fought mid-entry (a value briefly outside the
 * range while typing is allowed; it's clamped once the field loses focus).
 * The stepper buttons and ArrowUp/ArrowDown always clamp immediately, since
 * there's no partial-entry concern for a single step.
 */
export interface NumberInputProps extends Omit<
  TextInputProps,
  'prefix' | 'suffix' | 'value' | 'defaultValue' | 'onChange' | 'type' | 'inputMode' | 'role'
> {
  readonly value?: number;
  readonly defaultValue?: number;
  readonly onValueChange?: (value: number | undefined) => void;
  /** Raw native change event, alongside the parsed `onValueChange`. */
  readonly onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** Accessible name for the increment button (it's icon-only). */
  readonly incrementLabel?: string;
  /** Accessible name for the decrement button (it's icon-only). */
  readonly decrementLabel?: string;
}

export function NumberInput({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  incrementLabel = 'Increment',
  decrementLabel = 'Decrement',
  disabled,
  readOnly,
  size = 'lg',
  onChange,
  onBlur,
  onKeyDown,
  ref,
  ...rest
}: NumberInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const current = isControlled ? value : internalValue;
  const [rawText, setRawText] = useState(() => (current != null ? String(current) : ''));

  // Only re-sync from an externally-controlled `value` — typing and stepper
  // clicks already keep rawText in lockstep themselves (see below), so this
  // must not fire on every `current` change or it would clobber in-progress
  // typing (e.g. a trailing "." or "-") back to its parsed round-trip form.
  useEffect(() => {
    if (isControlled) setRawText(value != null ? String(value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const clamp = (n: number) => {
    let result = n;
    if (min != null) result = Math.max(min, result);
    if (max != null) result = Math.min(max, result);
    return result;
  };

  const commit = (next: number | undefined) => {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const stepBy = (delta: number) => {
    if (disabled || readOnly) return;
    const next = clamp((current ?? 0) + delta);
    setRawText(String(next));
    commit(next);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setRawText(text);
    if (text.trim() === '') {
      commit(undefined);
    } else {
      const parsed = Number(text);
      if (!Number.isNaN(parsed)) commit(parsed);
    }
    onChange?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (rawText.trim() !== '') {
      const parsed = Number(rawText);
      if (!Number.isNaN(parsed)) {
        const clamped = clamp(parsed);
        if (clamped !== parsed) setRawText(String(clamped));
        commit(clamped);
      }
    }
    onBlur?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && !readOnly) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        stepBy(step);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        stepBy(-step);
      }
    }
    onKeyDown?.(event);
  };

  return (
    <TextInput
      ref={ref}
      value={rawText}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      readOnly={readOnly}
      inputMode="decimal"
      role="spinbutton"
      aria-valuenow={current}
      aria-valuemin={min}
      aria-valuemax={max}
      min={min}
      max={max}
      step={step}
      size={size}
      prefix={
        <InputPrefixSuffix
          icon="plus"
          size={size}
          onClick={() => stepBy(step)}
          disabled={disabled || readOnly}
          label={incrementLabel}
        />
      }
      suffix={
        <InputPrefixSuffix
          icon="minus"
          size={size}
          onClick={() => stepBy(-step)}
          disabled={disabled || readOnly}
          label={decrementLabel}
        />
      }
      {...rest}
    />
  );
}
