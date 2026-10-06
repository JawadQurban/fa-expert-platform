import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './Avatar.module.css';

/**
 * Avatar (FADS primitive — DGA CMP-12).
 *
 * DGA: exactly three contexts — **image**, **initials**, or **icon**. Priority:
 * `src` (image) → `icon` → initials derived from `name`. If `src` fails to load
 * it falls back to initials/icon. Functional avatars expose `name` as the
 * accessible label; purely decorative ones are hidden.
 *
 * `icon` is a consumer-supplied slot (composition), not a baked-in glyph — the
 * official component's default "user" icon (Figma node 13758:241876) is not
 * imported into the Icon registry; see docs/FIGMA_AVATAR_SPECIFICATION.md §6.
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface AvatarProps {
  /** Used for initials and as the accessible name / image alt. */
  readonly name?: string;
  readonly src?: string;
  readonly icon?: ReactNode;
  readonly size?: AvatarSize;
  /** Square corners instead of the default rounded/pill shape. */
  readonly square?: boolean;
  /** White framing border, for avatars placed over colored or image backgrounds. */
  readonly border?: boolean;
  readonly className?: string;
  /** Decorative avatars (name conveyed elsewhere) are hidden from AT. */
  readonly decorative?: boolean;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => [...p][0] ?? '').join('');
}

export function Avatar({
  name,
  src,
  icon,
  size = 'md',
  square = false,
  border = false,
  className,
  decorative = false,
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = src != null && !imageFailed;

  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': name };

  return (
    <span
      className={cn(styles.avatar, className)}
      data-size={size}
      data-square={square || undefined}
      data-border={border || undefined}
      {...a11y}
    >
      {showImage ? (
        // The wrapper carries the accessible name; the img is decorative here.
        <img src={src} alt="" className={styles.image} onError={() => setImageFailed(true)} />
      ) : icon != null ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : (
        <span className={styles.initials} aria-hidden="true">
          {name ? initialsFrom(name) : ''}
        </span>
      )}
    </span>
  );
}
