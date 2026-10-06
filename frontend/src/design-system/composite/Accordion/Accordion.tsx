import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Accordion.module.css';

/**
 * Accordion (FADS composite — DGA CMP-08).
 *
 * ⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**.
 *
 * Single-expand disclosure list. Each header is a native `<button>` inside an
 * `<h3>` (Enter/Space toggles, `Tab` moves between headers) wired to a
 * `role="region"` panel via `aria-controls`/`aria-labelledby`/`aria-expanded`.
 */
export interface AccordionItem {
  readonly id?: string;
  readonly title: ReactNode;
  readonly content: ReactNode;
  readonly disabled?: boolean;
}

export interface AccordionProps {
  readonly items: AccordionItem[];
  readonly defaultExpandedId?: string;
  readonly className?: string;
  readonly label?: string;
}

export function Accordion({
  items,
  defaultExpandedId,
  className,
  label = 'Accordion',
}: AccordionProps) {
  const generatedId = useId();
  const [expandedId, setExpandedId] = useState(
    defaultExpandedId ?? items[0]?.id ?? `${generatedId}-item`
  );

  return (
    <div className={cn(styles.accordion, className)} aria-label={label}>
      {items.map((item, index) => {
        const itemId = item.id ?? `${generatedId}-${index}`;
        const isExpanded = expandedId === itemId;

        return (
          <div key={itemId} className={styles.item}>
            <h3 className={styles.heading}>
              <button
                className={styles.trigger}
                type="button"
                aria-expanded={isExpanded}
                aria-controls={`${itemId}-panel`}
                id={`${itemId}-trigger`}
                onClick={() => setExpandedId(isExpanded ? '' : itemId)}
                disabled={item.disabled}
              >
                <span className={styles.title}>{item.title}</span>
                <span className={styles.icon} aria-hidden="true">
                  {isExpanded ? '−' : '+'}
                </span>
              </button>
            </h3>
            {isExpanded && (
              <div
                className={styles.panel}
                role="region"
                id={`${itemId}-panel`}
                aria-labelledby={`${itemId}-trigger`}
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
