import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@utils/cn';
import { mergeRefs } from '@utils/mergeRefs';
import { Button } from '../../primitives/Button/Button';
import type { ButtonProps } from '../../primitives/Button/Button';
import styles from './ButtonMenu.module.css';

/**
 * ButtonMenu (FADS composite — DGA registry "Button-menu").
 *
 * Verified live against the official Platforms Code Figma Button-menu
 * component (file `J0xq7JG3JKshRDzrgAM7E0`, node `411:4377` — `rtl` ×
 * `size`[Small/Medium/Large] × `state`[Default/Hovered/Pressed/Focused/
 * Disabled/Selected] × `style`[Primary/Neutral/Secondary-Solid/
 * Secondary-Outline/Subtle/Transparent] × `iconOnly`, 432 variants) via the
 * Figma MCP — see `docs/FIGMA_BUTTON_MENU_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/ButtonMenu/VISUAL_COMPLIANCE_BUTTON_MENU.md`.
 * Figma's own description: "Menu button functions as a toggle to reveal a
 * menu presenting various options."
 *
 * Live data confirms the live node is literally a `Button` instance (same
 * `407:510376` node reference, identical style/size/state matrix) plus an
 * always-present trailing `arrow-down-01` chevron — so this composes the
 * already-Approved `Button` directly (`variant`/`size`/`icon` pass through
 * to `iconStart`, the chevron to `iconEnd`) rather than rebuilding button
 * chrome. Five of the six `style` values already mapped 1:1 onto `Button`'s
 * own `ButtonVariant` (`primary`/`neutral`/`secondarySolid`/`secondary`/
 * `tertiary`); the sixth, `Subtle`, did not exist yet — live-verified across
 * all 6 states and added as a new additive `Button` variant (`subtle`) in
 * this same pass, see `docs/FIGMA_BUTTON_SPECIFICATION.md`'s own updated
 * notes, rather than duplicated locally.
 *
 * The chevron is CSS-drawn (a rotated-border triangle), the same disclosed
 * substitute technique already used by `Select`'s own dropdown indicator —
 * `arrow-down-01` isn't in the Icon registry. It rotates 180° when open,
 * matching `Select`'s own chevron behavior (not independently verified
 * against Figma, which has no open/closed chevron-rotation variant of its
 * own — a reasonable, disclosed UX convention).
 *
 * `menu` renders the already-Approved `Menu` panel, portaled to
 * `document.body` and positioned via the trigger's own
 * `getBoundingClientRect()` — the exact same position/outside-click/Escape
 * architecture already established by `Select`/`DatePicker`. Menu items
 * (`MenuListItem`) are independently Tab-focusable buttons, not a
 * roving-tabindex `role="menu"` (an already-disclosed, deliberate
 * simplification from `MenuListItem`'s own build) — so this trigger uses
 * `aria-expanded`/`aria-controls` (a disclosure-button contract) rather than
 * `aria-haspopup="menu"`, which would overclaim a stricter ARIA menu pattern
 * the composed panel doesn't actually implement.
 */
export interface ButtonMenuProps extends Omit<ButtonProps, 'children' | 'iconStart' | 'iconEnd'> {
  /** Label text. Omit for icon-only mode (matches `Button`'s own icon-only contract — `aria-label` required). */
  readonly children?: ReactNode;
  /** Leading icon slot (Figma's own `swapLeadIcon`). */
  readonly icon?: ReactNode;
  /** The disclosed panel content — compose an already-Approved `<Menu>`. */
  readonly menu: ReactNode;
}

export function ButtonMenu({
  children,
  icon,
  menu,
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  ref,
  ...rest
}: ButtonMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
  };
  const closeMenu = () => setOpen(false);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closeMenu();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !position) return;
    const first = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();
  }, [open, position]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openMenu();
    }
  };

  const menuId = rest.id != null ? `${rest.id}-menu` : undefined;

  return (
    <span ref={rootRef} className={cn(styles.root, className)}>
      <Button
        ref={mergeRefs(triggerRef, ref)}
        variant={variant}
        size={size}
        iconStart={icon}
        iconEnd={<span className={styles.chevron} data-open={open || undefined} />}
        selected={open}
        disabled={disabled}
        aria-pressed={undefined}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        {...rest}
      >
        {children}
      </Button>
      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            id={menuId}
            data-testid="button-menu-panel"
            className={styles.panel}
            style={{ top: position.top, left: position.left }}
          >
            {menu}
          </div>,
          document.body
        )}
    </span>
  );
}
