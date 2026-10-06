import { useId } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Icon } from '../Icon/Icon';
import styles from './SearchBox.module.css';

/**
 * SearchBox (FADS primitive — DGA CMP registry "Search Box").
 *
 * Verified live against the official Platforms Code Figma Search Box
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:90990` — `rtl` ×
 * `state`[Default/Hovered/Pressed/Focused/Read-only/Disabled] × `filled` ×
 * `size`[Medium/Large] × `style`[Default/Filled darker/Filled lighter], the
 * exact same governing axes already sourced for the already-Approved
 * `TextInput`) via the Figma MCP — see
 * `docs/FIGMA_SEARCH_BOX_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/SearchBox/VISUAL_COMPLIANCE_SEARCH_BOX.md`.
 *
 * `get_variable_defs` confirmed the field chrome (background, border, radius,
 * label/helper colors, icon size/gap) is **byte-identical** to `TextInput`'s
 * own already-verified `--fads-sys-textinput-*` tokens — this component
 * reuses every one of them directly, adding **zero new color/typography
 * tokens**. It is **not** a literal composition of `<TextInput>`, though:
 * live verification found the trailing slot sits *inside* the same
 * un-badged content row as the leading icon and the input (confirmed as an
 * instance of the already-Approved `TrailingIcon`, node IDs matched
 * directly), whereas `TextInput`'s own `suffix` prop renders a separately
 * *backgrounded badge* (`Form/field-affix-*` tokens) — composing `<TextInput
 * suffix={...}>` here would have wrapped the trailing icon in the wrong
 * chrome. Same category of decision as `FloatingButton` not composing
 * `<Button>` and `DropdownListItem`'s decorative checkbox not composing
 * `<Checkbox>`.
 *
 * The live node's helper-text row also always pairs a `help-circle` icon
 * with the text — a structure `TextInput`'s own helper row has never had.
 * Built as its own small flex row here rather than added to `TextInput`
 * (out of scope for this component's own session; `TextInput` is unchanged).
 *
 * The native `<input>` gets an explicit `role="searchbox"` for correct
 * assistive-technology semantics, while deliberately keeping
 * `type="text"` (not `type="search"`) — native `type="search"` inputs
 * inject their own browser-drawn clear ("×") affordance in several browsers,
 * which would visually double up with this component's own explicit
 * `trailingIcon` slot; Figma's static export has no way to represent that
 * native behavior either way, so this is a disclosed, deliberate choice, not
 * an oversight.
 */
export type SearchBoxSize = 'md' | 'lg';
export type SearchBoxSurface = 'default' | 'filledDarker' | 'filledLighter';

export interface SearchBoxProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'aria-invalid' | 'size' | 'type'
> {
  readonly label: ReactNode;
  readonly helperText?: ReactNode;
  readonly errorText?: ReactNode;
  /** Marks the field required (visual indicator + aria-required). */
  readonly requiredField?: boolean;
  /** Width of the wrapping field. */
  readonly fieldClassName?: string;
  /** Maps to the official `Size` property. */
  readonly size?: SearchBoxSize;
  /** Maps to the official `Style` property (background surface treatment). */
  readonly surface?: SearchBoxSurface;
  /** Shows/hides the leading search icon. Maps to the official `icon` property. */
  readonly icon?: boolean;
  /** Trailing action slot — e.g. a `<TrailingIcon>` for clear/voice-search. */
  readonly trailingIcon?: ReactNode;
}

export function SearchBox({
  label,
  helperText,
  errorText,
  requiredField = false,
  fieldClassName,
  size = 'lg',
  surface = 'default',
  icon = true,
  trailingIcon,
  className,
  id: idProp,
  disabled,
  readOnly,
  ref,
  ...rest
}: SearchBoxProps) {
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
        <div className={styles.content}>
          {icon && (
            <span className={styles.icon} aria-hidden="true">
              <Icon name="search-01" decorative />
            </span>
          )}
          <input
            ref={ref}
            id={id}
            type="text"
            role="searchbox"
            className={styles.input}
            disabled={disabled}
            readOnly={readOnly}
            dir="auto"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-required={requiredField || undefined}
            {...rest}
          />
          {trailingIcon}
        </div>
      </div>
      {helperText != null && (
        <p id={helperId} className={styles.helper}>
          <Icon name="help-circle" decorative className={styles.helperIcon} />
          <span>{helperText}</span>
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
