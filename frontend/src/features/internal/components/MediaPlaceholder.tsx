import { Icon } from '@ds/primitives';
import { ItemIcon } from '@ds/composite';
import type { IconName } from '@ds/primitives';
import brandPattern from '@/assets/icons/background pattern.svg';
import styles from './MediaPlaceholder.module.css';

/**
 * A section media slot with a **built-in placeholder** (CLAUDE.md "Section
 * Imagery & Placeholders"). When a real asset exists, pass `imageUrl` and it
 * renders a normal responsive `<img>`; otherwise it renders an intentional,
 * premium-looking placeholder panel (brand pattern over the token tint + a
 * representative `Icon` + caption) that reads as "image goes here", never as
 * broken/empty. Modelled as data (`imageUrl` → swap seam) so real art drops in
 * with no layout change.
 */
export function MediaPlaceholder({
  icon,
  caption,
  imageUrl,
}: {
  readonly icon: IconName;
  readonly caption: string;
  /** Real asset URL. `null`/absent → the placeholder panel. */
  readonly imageUrl?: string | null;
}) {
  if (imageUrl != null) {
    return <img src={imageUrl} alt={caption} className={styles.image} />;
  }
  return (
    <div
      className={styles.placeholder}
      style={{ backgroundImage: `url("${brandPattern}")` }}
      role="img"
      aria-label={caption}
    >
      <ItemIcon contained icon={<Icon name={icon} size="featured" tone="primary" decorative />} />
      <span className={styles.caption}>{caption}</span>
    </div>
  );
}
