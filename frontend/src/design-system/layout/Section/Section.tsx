import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Section.module.css';

/**
 * Section (FADS layout).
 *
 * ⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**.
 *
 * A vertical-rhythm band applying the section gap and an optional background
 * (docs/LAYOUT_SPECIFICATION.md §4). Compose a `Container` inside to constrain
 * content width. Renders `<section>` by default; pass `aria-label`/`aria-labelledby`
 * so the region is nameable for assistive tech.
 */
export type SectionBackground = 'default' | 'subtle' | 'inverse';

interface SectionOwnProps {
  readonly background?: SectionBackground;
  readonly as?: ElementType;
  readonly children?: ReactNode;
}

export type SectionProps = SectionOwnProps &
  Omit<ComponentPropsWithoutRef<'section'>, keyof SectionOwnProps>;

export function Section({
  background = 'default',
  as,
  className,
  children,
  ...rest
}: SectionProps) {
  const Component = as ?? 'section';
  return (
    <Component className={cn(styles.section, className)} data-background={background} {...rest}>
      {children}
    </Component>
  );
}
