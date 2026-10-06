import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Typography.module.css';

/**
 * Typography (FADS primitive).
 *
 * ⚠ Visual fidelity **Pending final DGA token values (Q3/Q20)**.
 *
 * Renders text with a token-driven type variant (Display / Text families,
 * docs/DESIGN_TOKENS.md §4.2). Polymorphic via `as` so semantics (h1–h6, p,
 * span) are chosen independently of visual size — preserving a correct heading
 * outline (WCAG 1.3.1). RTL is inherited from the document direction.
 */
export type TypographyVariant =
  'display-xl' | 'display-lg' | 'display-md' | 'text-lg' | 'text-md' | 'text-sm' | 'text-xs';

export type TypographyWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TypographyColor = 'default' | 'muted' | 'inverse' | 'link' | 'primary';
export type TypographyAlign = 'start' | 'center' | 'end';

interface TypographyOwnProps {
  readonly variant?: TypographyVariant;
  readonly weight?: TypographyWeight;
  readonly color?: TypographyColor;
  readonly align?: TypographyAlign;
  readonly as?: ElementType;
  readonly children?: ReactNode;
}

export type TypographyProps = TypographyOwnProps &
  Omit<ComponentPropsWithoutRef<'p'>, keyof TypographyOwnProps>;

export function Typography({
  variant = 'text-md',
  weight,
  color = 'default',
  align,
  as,
  className,
  children,
  ...rest
}: TypographyProps) {
  const Component = as ?? 'p';
  return (
    <Component
      className={cn(styles.typography, className)}
      data-variant={variant}
      data-weight={weight}
      data-color={color}
      data-align={align}
      {...rest}
    >
      {children}
    </Component>
  );
}
