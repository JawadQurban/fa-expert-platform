import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './List.module.css';

/**
 * List (FADS composite — DGA registry "List").
 *
 * Verified live against the official Platforms Code Figma List component
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `7850:3506` — `rtl` × `type`[Ordered
 * List/Unordered/With Icon] × `style`[Primary/Neutral/On-color]) via the
 * Figma MCP — see `docs/FIGMA_LIST_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/List/VISUAL_COMPLIANCE_LIST.md`. Figma's own
 * description: "Lists are used to organize a set of items into a single,
 * cohesive unit, typically displayed as a series of options or links. List
 * items begin with either a number or a bullet."
 *
 * A thin semantic wrapper — the live node is literally a demo composition of
 * 4 already-Approved `ListItem`s (one Level 1 item followed by 3 Level 2
 * items), stacked with **zero** inter-item gap (Level 1's own `gap: 8px` is
 * an internal marker↔text gap, not an inter-item one — confirmed by direct
 * inspection). Renders a real `<ol>` for `type="ordered"` and `<ul>`
 * otherwise, per `CLAUDE.md`'s "use semantic HTML" rule; `list-style: none`
 * suppresses the native marker glyph since `ListItem` already renders its
 * own custom marker/icon, which would otherwise double up with the
 * browser's own bullet/number.
 *
 * Figma's own `style` (tone) axis applies once at the list level, but since
 * the already-Approved `ListItem` already owns its own independent `tone`
 * prop, `List` does not duplicate that logic — tone stays a per-`ListItem`
 * concern, set on each child individually. A disclosed, deliberate
 * simplification, not a gap.
 */
export type ListType = 'ordered' | 'unordered' | 'icon';

export interface ListProps extends ComponentPropsWithRef<'ul'> {
  readonly type?: ListType;
  /** One or more composed `<ListItem>`s. */
  readonly children: ReactNode;
}

export function List({ type = 'unordered', children, className, ref, ...rest }: ListProps) {
  const Tag = type === 'ordered' ? 'ol' : 'ul';
  return (
    <Tag ref={ref as never} className={cn(styles.list, className)} data-type={type} {...rest}>
      {children}
    </Tag>
  );
}
