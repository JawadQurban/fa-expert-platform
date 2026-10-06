import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './ItemIcon.module.css';

/**
 * ItemIcon (FADS composite — DGA registry "Item Icon").
 *
 * Verified live against the official Platforms Code Figma Item Icon
 * component (file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:148742` —
 * `contained` × `onColor`, 4 variants) via the Figma MCP — see
 * `docs/FIGMA_ITEM_ICON_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/ItemIcon/VISUAL_COMPLIANCE_ITEM_ICON.md`.
 *
 * A genuinely distinct, standalone component — not merely a generic slot
 * (an earlier pass in this same session incorrectly treated it as
 * NotApplicable/"just a generic icon" before this correction). Wraps a
 * swappable `icon` glyph (Figma's own `swapIcon` prop — the live demo
 * content is a `checkmark-square-02` icon, not a fixed default; this
 * codebase's Icon registry has no matching glyph, so `icon` stays a
 * required consumer-supplied slot, same disclosed gap already accepted for
 * `Alert`/`Toast`/`Notification`'s own missing checkmark). `contained`
 * renders the live-verified tinted rounded box (`background-primary-50`
 * `#f3fcf6` light, `alpha-white-10` `rgba(255,255,255,0.1)` on-color).
 * `HeaderSubMenuItem` composes this component for its own icon slot rather
 * than duplicating the box logic.
 */
export interface ItemIconProps extends ComponentPropsWithRef<'span'> {
  readonly icon: ReactNode;
  /** The live-verified tinted rounded-box treatment (Figma's own `contained` prop). */
  readonly contained?: boolean;
  readonly onColor?: boolean;
}

export function ItemIcon({
  icon,
  contained = false,
  onColor = false,
  className,
  ref,
  ...rest
}: ItemIconProps) {
  return (
    <span
      ref={ref}
      className={cn(styles.icon, className)}
      data-contained={contained || undefined}
      data-oncolor={onColor || undefined}
      aria-hidden="true"
      {...rest}
    >
      {icon}
    </span>
  );
}
