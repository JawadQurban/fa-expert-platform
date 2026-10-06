import { Link } from '@ds/primitives';
import { expertHubPaths } from '../../app/router/paths';
import type { NotificationsContent } from './notifications.content';
import styles from './NotificationsPage.module.css';

/**
 * §8.7 puts four screens in one pair of hands, so the header carries the area
 * once and the screens carry each other — the same shape as CAP-08's pair.
 *
 * The current screen stays a link rather than becoming inert text: `aria-current`
 * is what announces "you are here", and removing the link would change focus
 * order between the four pages for no gain.
 */
export function NotificationsAreaNav({
  content,
  current,
}: {
  readonly content: NotificationsContent;
  readonly current: 'matrix' | 'templates' | 'sla' | 'log';
}) {
  const links = [
    { key: 'matrix', href: expertHubPaths.internalNotificationMatrix, label: content.nav.matrix },
    {
      key: 'templates',
      href: expertHubPaths.internalNotificationTemplates,
      label: content.nav.templates,
    },
    { key: 'sla', href: expertHubPaths.internalSlaConsole, label: content.nav.sla },
    { key: 'log', href: expertHubPaths.internalNotificationLog, label: content.nav.log },
  ] as const;

  return (
    <nav aria-label={content.nav.label} className={styles.areaNav}>
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          aria-current={current === link.key ? 'page' : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
