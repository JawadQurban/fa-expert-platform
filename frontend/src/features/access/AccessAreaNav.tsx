import { Link } from '@ds/primitives';
import { expertHubPaths } from '../../app/router/paths';
import type { AccessContent } from './access.content';
import styles from './AccessPage.module.css';

/**
 * The two CAP-08 screens are one administrative area — §8.8 governs roles,
 * permissions and their assignment together — so the header carries the area
 * once and the screens carry each other.
 *
 * The current screen stays a link rather than becoming inert text: `aria-current`
 * is what announces "you are here", and removing the link would move focus order
 * between the two pages for no gain.
 */
export function AccessAreaNav({
  content,
  current,
}: {
  readonly content: AccessContent;
  readonly current: 'permissions' | 'users';
}) {
  return (
    <nav aria-label={content.nav.label} className={styles.areaNav}>
      <Link
        href={expertHubPaths.internalAccessPermissions}
        aria-current={current === 'permissions' ? 'page' : undefined}
      >
        {content.nav.permissions}
      </Link>
      <Link
        href={expertHubPaths.internalAccessUsers}
        aria-current={current === 'users' ? 'page' : undefined}
      >
        {content.nav.users}
      </Link>
    </nav>
  );
}
