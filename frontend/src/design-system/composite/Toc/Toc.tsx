import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Toc.module.css';

/**
 * Toc (FADS composite — DGA registry "TOC").
 *
 * Verified live against the official Platforms Code Figma TOC component
 * (file `J0xq7JG3JKshRDzrgAM7E0`, node `2962:38090` — `rtl`) via the Figma
 * MCP — see `docs/FIGMA_TOC_SPECIFICATION.md` and
 * `reports/VISUAL_COMPLIANCE/Toc/VISUAL_COMPLIANCE_TOC.md`. Figma's own
 * documentation: "The Table of Contents is used to provide a navigable
 * outline or summary of content, allowing users to quickly understand and
 * jump to specific sections"
 * (https://design.dga.gov.sa/guidelines/components/ui-shell/table-of-content).
 *
 * A thin heading (`eyebrow` + `title`) above a stack of `TocItem`s, composed
 * by the consumer as `children` rather than a configured `items` array — the
 * live node's own list is just a flat sequence of `TocItem` instances with
 * no additional wrapper semantics, so this composite adds nothing beyond the
 * heading and a `<nav>` landmark.
 */
export interface TocProps extends Omit<ComponentPropsWithRef<'nav'>, 'title'> {
  /** Small label above the title (Figma's own demo content: "On this page"). */
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  /** One or more `<TocItem>` instances. */
  readonly children: ReactNode;
}

export function Toc({ eyebrow, title, children, className, ref, ...rest }: TocProps) {
  return (
    <nav ref={ref} className={cn(styles.toc, className)} {...rest}>
      <div className={styles.heading}>
        {eyebrow != null && <p className={styles.eyebrow}>{eyebrow}</p>}
        <p className={styles.title}>{title}</p>
      </div>
      <div className={styles.items}>{children}</div>
    </nav>
  );
}
