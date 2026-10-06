import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './DropdownListItem.module.css';

/**
 * DropdownListItem (FADS primitive — DGA CMP registry "Dropdown List Item").
 *
 * Verified live against the official Platforms Code Figma Dropdown List Item
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `3262:27949` — `type`
 * [Single Select/Multi Select/Group label] × `state`[Default/Hovered/Pressed/
 * Focused/Disabled] × `selected` × `divider` × `rtl`) via the Figma MCP — see
 * `docs/FIGMA_DROPDOWN_LIST_ITEM_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/DropdownListItem/VISUAL_COMPLIANCE_DROPDOWN_LIST_ITEM.md`.
 *
 * This node (`3262:27949`) is the **exact same sub-component** `Select`'s own
 * spec (`docs/FIGMA_SELECT_SPECIFICATION.md`) already names "Dropdown List
 * Item × N" for its option rows — confirmed by the identical node ID, the
 * same relationship as `InputPrefixSuffix`/`NumberInput` earlier in this
 * batch. `Select` has been refactored to compose this primitive instead of
 * its own ad-hoc `<li>` markup (see `Select.tsx`), which also fixed two real,
 * independently-verified fidelity bugs: the option-row hover background was
 * `#f9fafb` (should be `#f3f4f6`) and the row padding/gap was `4px` (should be
 * `8px`).
 *
 * `state` isn't a runtime prop — Hovered/Pressed are real `:hover`/`:active`
 * pseudo-classes. The live-verified `Focused` state, however, is **not**
 * native DOM focus: per the WAI-ARIA APG "Select-Only Combobox" pattern
 * `Select` already implements, real focus stays on the trigger button the
 * whole time, and a row is "active" via `aria-activedescendant` — so
 * `Focused`'s real 2px border is exposed as the `active` prop, driven by the
 * consumer's own roving-highlight logic, not `:focus-visible`.
 *
 * `multiSelectOption`'s checkbox is a **decorative** visual reusing
 * `Checkbox`'s own already-verified `xs`/`neutral`/`checked` tokens directly
 * (confirmed byte-identical via `get_variable_defs`) rather than composing
 * the real `<Checkbox>` component: `Checkbox`'s own label always renders at
 * its own 16px type scale, which would be wrong for this component's
 * live-verified 14px list-item text, and it has no prop to override just the
 * label's font size. The outer `<li role="option">` owns the real selection
 * semantics (`aria-selected`) — the checkbox visual is `aria-hidden`.
 */
export type DropdownListItemType = 'option' | 'multiSelectOption' | 'groupLabel';

export interface DropdownListItemProps extends Omit<ComponentPropsWithRef<'li'>, 'children'> {
  /** Maps to the official `Type` property (`Single Select`/`Multi Select`/`Group label`). */
  readonly type?: DropdownListItemType;
  readonly selected?: boolean;
  readonly disabled?: boolean;
  /**
   * The live-verified `Focused` state — a real 2px border. Not native DOM
   * focus; driven by the consumer's own roving/keyboard-highlight logic
   * (e.g. `aria-activedescendant`). Ignored for `type="groupLabel"`.
   */
  readonly active?: boolean;
  /** Renders the live-verified bottom divider line. Ignored for `type="groupLabel"`. */
  readonly divider?: boolean;
  readonly children: ReactNode;
}

export function DropdownListItem({
  type = 'option',
  selected = false,
  disabled = false,
  active = false,
  divider = false,
  children,
  className,
  ref,
  ...rest
}: DropdownListItemProps) {
  if (type === 'groupLabel') {
    return (
      <li ref={ref} role="presentation" className={cn(styles.groupLabel, className)} {...rest}>
        {children}
      </li>
    );
  }

  return (
    <li
      ref={ref}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      className={cn(styles.item, className)}
      data-active={active || undefined}
      data-disabled={disabled || undefined}
      data-divider={divider || undefined}
      {...rest}
    >
      {type === 'multiSelectOption' && (
        <span className={styles.checkbox} data-checked={selected || undefined} aria-hidden="true">
          {selected && (
            <svg className={styles.checkboxIcon} viewBox="0 0 16 16" focusable="false">
              <path
                d="M3 8.5L6.5 12L13 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      )}
      <span className={styles.text} dir="auto">
        {children}
      </span>
      {type === 'option' && selected && (
        <span className={styles.check} aria-hidden="true">
          ✓
        </span>
      )}
    </li>
  );
}
