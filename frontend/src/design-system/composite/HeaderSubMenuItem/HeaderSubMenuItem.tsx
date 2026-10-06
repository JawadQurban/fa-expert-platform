import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { ItemIcon } from '../ItemIcon/ItemIcon';
import styles from './HeaderSubMenuItem.module.css';

/**
 * HeaderSubMenuItem (FADS composite — DGA registry "Header Sub-menu Item").
 *
 * Verified live against the official Header Figma file (`Sv0oWOS1SjWnwhQwdzRJIE`,
 * node `30150:148183` — `rtl` × `onColor` × `state`[Default/Hovered/Pressed/
 * Focused] × `icon` × `helperText` × `tag`) via the Figma MCP — see
 * `docs/FIGMA_HEADER_SUB_MENU_ITEM_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/HeaderSubMenuItem/VISUAL_COMPLIANCE_HEADER_SUB_MENU_ITEM.md`.
 * Deferred out of scope in the original Header visual-compliance pass —
 * built now as part of the "Complete All Remaining Registry Components"
 * cycle.
 *
 * `icon` composes the already-Approved `ItemIcon` (a genuinely distinct
 * standalone component, node `30150:148742` — an earlier pass in this same
 * session incorrectly dismissed it as a generic slot before this
 * correction). `tag` is a generic slot — pass an already-Approved
 * `<Tag variant="success">` to match the live node's own "New" badge
 * exactly. `onColor` renders the on-brand variant for use on colored header
 * backgrounds (white text, translucent hover/press fills). Hovered/Pressed/
 * Focused are real CSS pseudo-classes.
 *
 * `boxedIcon` maps directly to `ItemIcon`'s own live-verified `contained`
 * prop (the "Boxed icon" `linkStyle` sampled from the parent
 * `NavHeaderSubMenu` panel, node `30150:149150`).
 *
 * A real border (visible in every non-focused state, including Default) was
 * missed by the initial text-extraction-only pass and caught only by a
 * follow-up `get_screenshot`-vs-rendered-Storybook visual comparison — see
 * spec §2a. Every component in this batch now gets that visual check before
 * being marked Approved.
 */
export interface HeaderSubMenuItemProps extends Omit<ComponentPropsWithRef<'button'>, 'type'> {
  readonly icon?: ReactNode;
  readonly label: ReactNode;
  readonly helperText?: ReactNode;
  /** Pass a composed `<Tag variant="success">` to match the live "New" badge. */
  readonly tag?: ReactNode;
  /** The live-verified on-color variant, for use on colored header backgrounds. */
  readonly onColor?: boolean;
  /** The live-verified "Boxed icon" `linkStyle` — maps to `ItemIcon`'s own `contained` prop. */
  readonly boxedIcon?: boolean;
}

export function HeaderSubMenuItem({
  icon,
  label,
  helperText,
  tag,
  onColor = false,
  boxedIcon = false,
  className,
  ref,
  ...rest
}: HeaderSubMenuItemProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(styles.item, className)}
      data-oncolor={onColor || undefined}
      {...rest}
    >
      {icon != null && <ItemIcon icon={icon} contained={boxedIcon} onColor={onColor} />}
      <span className={styles.content}>
        <span className={styles.row}>
          <span className={styles.label}>{label}</span>
          {tag}
        </span>
        {helperText != null && <span className={styles.helper}>{helperText}</span>}
      </span>
    </button>
  );
}
