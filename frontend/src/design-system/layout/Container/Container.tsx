import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Container.module.css';

/**
 * Container (FADS layout).
 *
 * ⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**.
 *
 * Constrains content width and centres it, with responsive side padding from
 * tokens (docs/LAYOUT_SPECIFICATION.md §3). Sizes: `page` (default content),
 * `prose` (Arabic reading measure), `form`, `full` (edge-to-edge).
 */
export type ContainerSize = 'page' | 'prose' | 'form' | 'full';

interface ContainerOwnProps {
  readonly size?: ContainerSize;
  readonly as?: ElementType;
  readonly children?: ReactNode;
}

export type ContainerProps = ContainerOwnProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof ContainerOwnProps>;

export function Container({ size = 'page', as, className, children, ...rest }: ContainerProps) {
  const Component = as ?? 'div';
  return (
    <Component className={cn(styles.container, className)} data-size={size} {...rest}>
      {children}
    </Component>
  );
}
