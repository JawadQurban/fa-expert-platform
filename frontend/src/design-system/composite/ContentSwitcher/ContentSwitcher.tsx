import { useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { useIsRtl } from '@ds/providers';
import styles from './ContentSwitcher.module.css';

/**
 * ContentSwitcher (FADS composite — DGA CMP-10).
 *
 * Verified live against the official Platforms Code Figma Content Switcher
 * component set (file `J0xq7JG3JKshRDzrgAM7E0`, node `8421:71014` —
 * `size`[Small/Medium/Large] × `onColor` × `rtl`, plus the `_Content
 * Switcher Item` sub-component node `8421:70930` sampled across `itemType`
 * [First/Mid/Last] × `state`[Normal/Selected] × `onColor` × `size` × `rtl`)
 * via the Figma MCP — see `docs/FIGMA_CONTENT_SWITCHER_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/ContentSwitcher/VISUAL_COMPLIANCE_CONTENT_SWITCHER.md`.
 *
 * A `role="tablist"` of segmented, pill-cornered items — visually and
 * structurally distinct from this project's existing `Tabs` composite
 * (which uses a `radius-pill` outer container and an owned content panel);
 * both are separate official DGA catalog entries (CMP-09 vs CMP-10), not a
 * duplicate. Unlike `Tabs`, this component renders **only the switcher
 * control** — no owned `tabpanel` — since the live Figma data shows no
 * panel structure at all; the consumer wires the selected `value` to
 * whatever content it swaps elsewhere. Keyboard interaction (roving
 * tabindex, RTL-aware `ArrowLeft`/`ArrowRight` swap via `useIsRtl`,
 * `Home`/`End`) mirrors `Tabs`'s own already-established pattern for
 * consistency across the two components.
 *
 * `get_variable_defs` confirmed every color is sourced from the same
 * `Button/*` Figma variable family already used by the already-Approved
 * `Button` (and, earlier in this project, `FloatingButton`) — reused
 * directly (zero new color tokens for the neutral/black/primary
 * backgrounds or label colors). Only geometry (this component's own
 * height scale, distinct from `Button`'s; the `76px` minimum item width;
 * one `20px`/`30px` Large-size typography pair with no existing generic
 * match) and the `onColor` translucent-white background/border needed new
 * tokens.
 *
 * The live node's corner-radius/divider assignment is per-segment
 * (`itemType`: `First` gets the leading rounded corner pair, `Last` the
 * trailing one, `Mid` none) — implemented with CSS **logical**
 * `border-*-*-radius` properties (per this codebase's own DC-23 rule), so
 * it mirrors correctly under RTL automatically; no manual DOM reordering
 * was needed despite the extracted Figma markup's own conditional
 * DOM-reversal-for-RTL (an authoring artifact of Figma having no logical-
 * property concept, not evidence a real implementation needs it — same
 * finding as `Button`/`FloatingButton`/`DropdownListItem` earlier).
 *
 * Only `Normal`/`Selected` states exist in the live 2-state set — no
 * Hovered/Pressed variant was sampled. A `:focus-visible` outline was
 * still added (non-Figma-sampled, using already-shared generic tokens) for
 * WCAG 2.2 compliance; no hover-only background was invented.
 */
export type ContentSwitcherSize = 'sm' | 'md' | 'lg';

export interface ContentSwitcherOption {
  readonly value: string;
  readonly label: ReactNode;
}

export interface ContentSwitcherProps {
  /** Accessible name for the `tablist` (`aria-label`). */
  readonly label: string;
  readonly options: readonly ContentSwitcherOption[];
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  /** Maps to the official `Size` property. */
  readonly size?: ContentSwitcherSize;
  /** Maps to the official `On color` property — use on a dark/colored surface. */
  readonly onColor?: boolean;
  readonly className?: string;
}

export function ContentSwitcher({
  label,
  options,
  value,
  onValueChange,
  size = 'sm',
  onColor = false,
  className,
}: ContentSwitcherProps) {
  const isRtl = useIsRtl();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activate = (optionValue: string) => {
    onValueChange(optionValue);
    tabRefs.current[optionValue]?.focus();
  };

  const moveFocus = (direction: -1 | 1) => {
    if (options.length === 0) return;
    const currentIndex = options.findIndex((option) => option.value === value);
    const nextIndex = (currentIndex + direction + options.length) % options.length;
    const next = options[nextIndex];
    if (next) activate(next.value);
  };

  const jumpTo = (edge: 'start' | 'end') => {
    const target = edge === 'start' ? options[0] : options[options.length - 1];
    if (target) activate(target.value);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(styles.root, className)}
      data-size={size}
      data-on-color={onColor || undefined}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const position =
          options.length === 1
            ? 'only'
            : index === 0
              ? 'first'
              : index === options.length - 1
                ? 'last'
                : 'mid';
        const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
        const previousKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

        const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
          if (event.key === nextKey) {
            event.preventDefault();
            moveFocus(1);
          } else if (event.key === previousKey) {
            event.preventDefault();
            moveFocus(-1);
          } else if (event.key === 'Home') {
            event.preventDefault();
            jumpTo('start');
          } else if (event.key === 'End') {
            event.preventDefault();
            jumpTo('end');
          }
        };

        return (
          <button
            key={option.value}
            ref={(node) => {
              tabRefs.current[option.value] = node;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={styles.tab}
            data-position={position}
            data-selected={selected || undefined}
            onClick={() => activate(option.value)}
            onKeyDown={onKeyDown}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
