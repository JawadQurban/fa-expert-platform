import { Icon, Typography } from '@ds/primitives';
import { ItemIcon } from '@ds/composite';
import type { IconName, IconTone } from '@ds/primitives';
import type { Locale } from '@/types';
import type { HomeContent } from '../home.content';
import type { HomeNotificationDto, HomeNotificationKind } from '../home.types';
import styles from './NotificationsPreview.module.css';
import { formatDate as formatLocaleDate } from '../../../shared/formatting';

/**
 * P-09 Notification preview — the latest few personal notifications, read-only.
 * Kind is conveyed by a labelled icon (not colour-only); unread state carries an
 * accessible text label, not just the dot. ⚠️ Content is representative mock —
 * the notification matrix is undefined (`DM-GAP-08`).
 */
const KIND_ICON: Record<HomeNotificationKind, IconName> = {
  info: 'information-circle',
  success: 'task-done-01',
  action: 'alert-circle',
};

const KIND_TONE: Record<HomeNotificationKind, IconTone> = {
  info: 'information',
  success: 'success',
  action: 'warning',
};

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    dateStyle: 'medium',
  });
}

export function NotificationsPreview({
  notifications,
  content,
  locale,
}: {
  readonly notifications: readonly HomeNotificationDto[];
  readonly content: HomeContent;
  readonly locale: Locale;
}) {
  if (notifications.length === 0) {
    return (
      <Typography as="p" variant="text-md" color="muted">
        {content.notifications.empty}
      </Typography>
    );
  }

  return (
    <ul className={styles.list}>
      {notifications.map((note) => (
        <li key={note.id} className={styles.item}>
          <ItemIcon
            contained
            icon={
              <Icon name={KIND_ICON[note.kind]} size="sm" tone={KIND_TONE[note.kind]} decorative />
            }
          />
          <div className={styles.body}>
            <Typography as="p" variant="text-md" weight={note.read ? 'regular' : 'medium'}>
              {!note.read && (
                <span className={styles.srOnly}>{content.notifications.unread}: </span>
              )}
              {note.title}
            </Typography>
            <Typography as="p" variant="text-xs" color="muted">
              {content.notifications.at(formatDate(note.at, locale))}
            </Typography>
          </div>
          {!note.read && <span className={styles.unread} aria-hidden="true" />}
        </li>
      ))}
    </ul>
  );
}
