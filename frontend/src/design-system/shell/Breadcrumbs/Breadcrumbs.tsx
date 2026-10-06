import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Link } from '@ds/primitives';
import styles from './Breadcrumbs.module.css';

/**
 * Breadcrumbs (FADS shell — DGA CMP-04).
 *
 * Verified live against the official Platforms Code Figma Breadcrumb component set
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `5698:2597` — 10 variants: `rtl` × `levels`)
 * via the Figma MCP — see `docs/FIGMA_BREADCRUMB_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Breadcrumb/VISUAL_COMPLIANCE_BREADCRUMB.md`.
 *
 * Ancestor items compose the official, already-Approved `Link` primitive
 * (`mood="neutral"`, `size="sm"`) rather than a bare `<a>`. The current page is
 * rendered as non-interactive text with `aria-current="page"`
 * (`COMPONENT_MAPPING.md` §3), not a disabled link. The separator is a bidi-mirroring
 * `›`/`‹` glyph leading each non-first item (matching the official leading-arrow
 * position) — a visual approximation of the official arrow icon, which isn't in this
 * project's Icon registry yet (spec §9 item 1).
 *
 * More than 5 items collapse to `[first, "…", last two]`, matching the official
 * `Levels=">5"` variant; the `"…"` control expands the full trail in place on click
 * (spec §5 — Figma shows only the collapsed state, so the exact expand interaction is
 * a disclosed, non-blocking judgment call).
 */
export interface BreadcrumbItem {
  readonly label: ReactNode;
  readonly href?: string;
}

export interface BreadcrumbsProps {
  readonly items: BreadcrumbItem[];
  readonly className?: string;
  /** Accessible label for the `<nav>` landmark. Defaults to English; pass a localized string. */
  readonly label?: string;
  /**
   * Accessible label for the collapse-expand ("…") control shown when there are more
   * than 5 items. Defaults to English; pass a localized string.
   */
  readonly expandLabel?: string;
}

const COLLAPSE_THRESHOLD = 5;

type RenderEntry =
  | { readonly type: 'item'; readonly item: BreadcrumbItem; readonly isCurrent: boolean }
  | { readonly type: 'ellipsis' };

function buildRenderList(items: BreadcrumbItem[], expanded: boolean): RenderEntry[] {
  if (expanded || items.length <= COLLAPSE_THRESHOLD) {
    return items.map((item, index) => ({
      type: 'item',
      item,
      isCurrent: index === items.length - 1,
    }));
  }

  const [first, ...rest] = items;
  const lastTwo = rest.slice(-2);
  return [
    { type: 'item', item: first, isCurrent: false },
    { type: 'ellipsis' },
    ...lastTwo.map((item, index): RenderEntry => ({
      type: 'item',
      item,
      isCurrent: index === lastTwo.length - 1,
    })),
  ];
}

function Separator() {
  return (
    <span className={styles.separator} aria-hidden="true">
      ›
    </span>
  );
}

export function Breadcrumbs({
  items,
  className,
  label = 'Breadcrumb',
  expandLabel = 'Show hidden breadcrumb levels',
}: BreadcrumbsProps) {
  const [expanded, setExpanded] = useState(false);
  const entries = buildRenderList(items, expanded);

  return (
    <nav aria-label={label} className={cn(styles.breadcrumbs, className)}>
      <ol className={styles.list}>
        {entries.map((entry, index) => (
          <li key={`crumb-${index}`} className={styles.item}>
            {index > 0 && <Separator />}
            {entry.type === 'ellipsis' ? (
              <button
                type="button"
                className={styles.ellipsis}
                aria-expanded={expanded}
                aria-label={expandLabel}
                onClick={() => setExpanded(true)}
              >
                …
              </button>
            ) : entry.isCurrent ? (
              <span className={styles.current} aria-current="page">
                {entry.item.label}
              </span>
            ) : (
              <Link mood="neutral" size="sm" href={entry.item.href}>
                {entry.item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
