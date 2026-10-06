import { useId, useState } from 'react';
import type { ComponentPropsWithRef, KeyboardEvent, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './TrailingIcon.module.css';

/**
 * TrailingIcon (FADS primitive — DGA CMP registry "Trailing Icon").
 *
 * Verified live against the official Platforms Code Figma Trailing Icon
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `30150:92875` — only 2
 * variants: `Open`[False/True]) via the Figma MCP — see
 * `docs/FIGMA_TRAILING_ICON_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/TrailingIcon/VISUAL_COMPLIANCE_TRAILING_ICON.md`.
 *
 * Per the component's own Figma description: "positioned at the end, often
 * used for actions like clearing input or searching by voice" (docs link to
 * the Search Box guidelines) — a small icon-only trigger a consumer (e.g. the
 * upcoming `SearchBox`, this same batch's component 14) places at the end of
 * a field, with a small helper-text panel that appears above it on hover/
 * focus (the live node's `Open=True` variant — a "Search by voice" example).
 *
 * The panel's own visual (`tooltip-background-light` white fill, dark
 * semibold heading text, a downward-pointing beak, `Shadows/shadow-lg`) is
 * **not** reused from this project's existing `Tooltip` primitive: `Tooltip`
 * itself is a separate, not-yet-visually-verified registry component
 * (`visualComplianceStatus: "pending"`, scheduled batch 7) whose current
 * placeholder CSS (dark-inverse fill) doesn't match what was live-verified
 * here. Building this panel's own small, accurate implementation now avoids
 * shipping the wrong visual while `Tooltip` awaits its own pass — the same
 * "not yet built/verified dependency" situation as `DatePicker`'s
 * year-dropdown and the not-yet-built "Dropdown List Item". The show/hide-on-
 * hover-focus-Escape interaction, though, mirrors `Tooltip`'s own established
 * pattern (not reinvented).
 *
 * No Hovered/Pressed/Focused/Disabled variant exists in the live 2-variant
 * set — the focus-visible outline below uses already-shared generic tokens
 * rather than an invented Figma-specific one, added because WCAG 2.2 requires
 * visible focus regardless of Figma sample completeness.
 */
export interface TrailingIconProps extends ComponentPropsWithRef<'button'> {
  /** Decorative; the accessible name and panel text come from `label`. */
  readonly icon: ReactNode;
  /** Accessible name (`aria-label`) and the helper text shown in the panel on hover/focus. */
  readonly label: string;
}

export function TrailingIcon({
  icon,
  label,
  className,
  disabled,
  ref,
  ...rest
}: TrailingIconProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') hide();
  };

  return (
    <span className={styles.wrapper}>
      <button
        ref={ref}
        type="button"
        className={cn(styles.button, className)}
        disabled={disabled}
        aria-label={label}
        aria-describedby={open ? panelId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={onKeyDown}
        {...rest}
      >
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      </button>
      <span role="tooltip" id={panelId} data-open={open || undefined} className={styles.panel}>
        <span className={styles.beak} aria-hidden="true" />
        <span className={styles.panelText} dir="auto">
          {label}
        </span>
      </span>
    </span>
  );
}
