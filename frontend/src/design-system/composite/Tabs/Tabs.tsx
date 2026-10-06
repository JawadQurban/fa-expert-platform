import { useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { useIsRtl } from '@ds/providers';
import styles from './Tabs.module.css';

/**
 * Tabs (FADS composite — DGA CMP-09, Horizontal Tab / Horizontal Tab List;
 * CMP-09b Vertical Tab via `orientation="vertical"`).
 *
 * Visually rebuilt to match the live Figma components — see
 * `docs/FIGMA_HORIZONTAL_TAB_SPECIFICATION.md` /
 * `reports/VISUAL_COMPLIANCE/HorizontalTab/VISUAL_COMPLIANCE_HORIZONTAL_TAB.md`
 * and `docs/FIGMA_VERTICAL_TAB_SPECIFICATION.md` /
 * `reports/VISUAL_COMPLIANCE/VerticalTab/VISUAL_COMPLIANCE_VERTICAL_TAB.md`.
 * Vertical Tab is the same official Figma `Tab/*` variable family as
 * Horizontal Tab (colors/hover/pressed/focus mechanics are byte-identical) —
 * `orientation` only changes layout direction, per-size padding/indicator
 * geometry, selected/unselected typography, and arrow-key mapping.
 *
 * `tablist`/`tab`/`tabpanel` with roving tabindex. In `orientation="horizontal"`
 * (default), Arrow keys move both selection and focus and are **RTL-aware**:
 * in a right-to-left document, `ArrowRight` moves to the previous tab and
 * `ArrowLeft` to the next one, so the key always matches the visual direction
 * of travel (INTERACTION_SPECIFICATION.md). In `orientation="vertical"`,
 * `ArrowDown`/`ArrowUp` move next/previous instead (not RTL-sensitive — up/down
 * don't mirror), per the WAI-ARIA APG vertical-tablist pattern, and the
 * `tablist` carries `aria-orientation="vertical"`. `Home`/`End` jump to the
 * first/last enabled tab in both orientations; disabled tabs are skipped.
 *
 * `divider`/`flush` and the `moreTab`-style `overflowTrigger` shell are
 * verified only for `orientation="horizontal"` — Vertical Tab's own live data
 * has no baseline-divider or overflow-trigger equivalent (see the Vertical
 * Tab spec §5); `divider` renders nothing under `orientation="vertical"`.
 */
export type TabSize = 'sm' | 'md' | 'lg';
export type TabOrientation = 'horizontal' | 'vertical';

export interface TabItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly content: ReactNode;
  readonly disabled?: boolean;
  /** Live-verified 16×16 leading icon slot (Figma `icon`/`swapIcon`). */
  readonly icon?: ReactNode;
}

export interface TabsOverflowTrigger {
  /** Accessible name — the trigger renders no visible text (icon-only, per Figma). */
  readonly label: string;
  readonly expanded?: boolean;
  readonly onClick?: () => void;
}

export interface TabsProps {
  readonly items: TabItem[];
  readonly defaultActiveId?: string;
  readonly label?: string;
  /** Default `'md'`. */
  readonly size?: TabSize;
  /** Default `'horizontal'`. Vertical Tab (CMP-09b) — see the Vertical Tab spec for scope. */
  readonly orientation?: TabOrientation;
  /** Shifts the tab row flush with the container's start edge. Horizontal only. Default `false`. */
  readonly flush?: boolean;
  /** Full-width baseline under the tab row. Horizontal only — no-op when vertical. Default `true`. */
  readonly divider?: boolean;
  /** Visual-only overflow trigger shell (⋯) trailing the tab row — horizontal only, see spec §5. */
  readonly overflowTrigger?: TabsOverflowTrigger;
  readonly className?: string;
}

export function Tabs({
  items,
  defaultActiveId,
  label = 'Content tabs',
  size = 'md',
  orientation = 'horizontal',
  flush = false,
  divider = true,
  overflowTrigger,
  className,
}: TabsProps) {
  const generatedId = useId();
  const isRtl = useIsRtl();
  const initialId =
    defaultActiveId ??
    items.find((item) => !item.disabled)?.id ??
    items[0]?.id ??
    `${generatedId}-tab`;
  const [activeId, setActiveId] = useState(initialId);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? items[0],
    [activeId, items]
  );

  const activate = (itemId: string) => {
    setActiveId(itemId);
    tabRefs.current[itemId]?.focus();
  };

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, direction: -1 | 1) => {
    if (items.length === 0) {
      return;
    }
    event.preventDefault();
    const currentIndex = items.findIndex((item) => item.id === activeId);
    let nextIndex = currentIndex;
    for (let step = 0; step < items.length; step += 1) {
      nextIndex = (nextIndex + direction + items.length) % items.length;
      if (!items[nextIndex]?.disabled) {
        break;
      }
    }
    const nextItem = items[nextIndex];
    if (nextItem) {
      activate(nextItem.id);
    }
  };

  const jumpTo = (event: KeyboardEvent<HTMLButtonElement>, edge: 'start' | 'end') => {
    event.preventDefault();
    const ordered = edge === 'start' ? items : [...items].reverse();
    const target = ordered.find((item) => !item.disabled);
    if (target) {
      activate(target.id);
    }
  };

  const isVertical = orientation === 'vertical';
  const nextKey = isVertical ? 'ArrowDown' : isRtl ? 'ArrowLeft' : 'ArrowRight';
  const previousKey = isVertical ? 'ArrowUp' : isRtl ? 'ArrowRight' : 'ArrowLeft';

  return (
    <div className={cn(styles.tabs, className)}>
      <div
        className={styles.list}
        data-flush={flush || undefined}
        data-size={size}
        data-orientation={orientation}
      >
        {divider && !isVertical && <div className={styles.listDivider} aria-hidden="true" />}
        <div className={styles.listRow}>
          <div
            className={styles.tablistGroup}
            role="tablist"
            aria-label={label}
            aria-orientation={isVertical ? 'vertical' : undefined}
          >
            {items.map((item) => {
              const isActive = item.id === activeId;
              const tabId = `${item.id}-tab`;
              const panelId = `${item.id}-panel`;

              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabRefs.current[item.id] = node;
                  }}
                  id={tabId}
                  type="button"
                  className={styles.tab}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={panelId}
                  tabIndex={isActive ? 0 : -1}
                  data-selected={isActive}
                  data-size={size}
                  data-orientation={orientation}
                  onClick={() => activate(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === nextKey) {
                      moveFocus(event, 1);
                    } else if (event.key === previousKey) {
                      moveFocus(event, -1);
                    } else if (event.key === 'Home') {
                      jumpTo(event, 'start');
                    } else if (event.key === 'End') {
                      jumpTo(event, 'end');
                    }
                  }}
                  disabled={item.disabled}
                >
                  {item.icon && (
                    <span className={styles.tabIcon} aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className={styles.tabLabel}>{item.label}</span>
                  <span className={styles.indicator} aria-hidden="true" />
                </button>
              );
            })}
          </div>
          {overflowTrigger && (
            <button
              type="button"
              className={styles.moreTrigger}
              aria-label={overflowTrigger.label}
              aria-haspopup="true"
              aria-expanded={overflowTrigger.expanded}
              onClick={overflowTrigger.onClick}
            >
              <span className={styles.moreIcon} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {activeItem && (
        <div id={`${activeItem.id}-panel`} role="tabpanel" aria-labelledby={`${activeItem.id}-tab`}>
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
