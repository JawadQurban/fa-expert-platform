import type { ComponentPropsWithRef } from 'react';
import { cn } from '@utils/cn';
import { Icon } from '../Icon/Icon';
import styles from './InputPrefixSuffix.module.css';

/**
 * InputPrefixSuffix (FADS primitive — DGA CMP registry "Input Prefix-Suffix").
 *
 * Verified live against the official Platforms Code Figma Input Prefix-Suffix
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:60916` — 48
 * variants: `type`[Plus/Minus] × `state`[Default/Hovered/Pressed/Selected/
 * Focused/Disabled] × `style`[Solid/Subtle] × `size`[Large/Medium]) via the
 * Figma MCP — see `docs/FIGMA_INPUT_PREFIX_SUFFIX_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/InputPrefixSuffix/VISUAL_COMPLIANCE_INPUT_PREFIX_SUFFIX.md`.
 *
 * This is the exact icon-badge sub-component `NumberInput`'s own increment/
 * decrement buttons instantiate (confirmed by matching Figma node IDs) —
 * previously built ad-hoc inline inside `NumberInput`; extracted here into
 * its own reusable primitive per the registry's own separate "Input
 * Prefix-Suffix" entry, and `NumberInput` now composes it instead of
 * duplicating the button markup/styling.
 *
 * A plain `<button>` sized to fill its parent affix slot (e.g. `TextInput`'s
 * `prefix`/`suffix` — same size/padding already comes from there); this
 * component supplies only its own background/border per state and the
 * centered icon. `size` only affects the icon's own dimension (24px Large /
 * 20px Medium) — the surrounding box is already sized by the parent affix,
 * confirmed token-identical to this component's own Large/Medium geometry.
 */
export type InputPrefixSuffixIcon = 'plus' | 'minus';
export type InputPrefixSuffixSize = 'lg' | 'md';
export type InputPrefixSuffixVariant = 'solid' | 'subtle';

const ICON_NAME: Record<InputPrefixSuffixIcon, 'add-01' | 'remove-01'> = {
  plus: 'add-01',
  minus: 'remove-01',
};

export interface InputPrefixSuffixProps extends Omit<ComponentPropsWithRef<'button'>, 'type'> {
  readonly icon: InputPrefixSuffixIcon;
  /** Maps to the official `Size` property. */
  readonly size?: InputPrefixSuffixSize;
  /** Maps to the official `Style` property. */
  readonly variant?: InputPrefixSuffixVariant;
  readonly selected?: boolean;
  /** Accessible name — required, since this is an icon-only control. */
  readonly label: string;
}

export function InputPrefixSuffix({
  icon,
  size = 'lg',
  variant = 'solid',
  selected = false,
  label,
  className,
  disabled,
  ref,
  ...rest
}: InputPrefixSuffixProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(styles.button, className)}
      data-size={size}
      data-variant={variant}
      data-selected={selected || undefined}
      disabled={disabled}
      aria-label={label}
      aria-pressed={selected || undefined}
      {...rest}
    >
      <Icon
        name={ICON_NAME[icon]}
        decorative
        className={styles.icon}
        style={size === 'md' ? { inlineSize: '1.25rem', blockSize: '1.25rem' } : undefined}
      />
    </button>
  );
}
