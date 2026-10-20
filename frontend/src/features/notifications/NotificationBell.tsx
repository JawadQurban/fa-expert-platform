import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Icon, Tag } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { formatNumber } from '../../shared/formatting';
import { getNotificationService } from './notificationService';
import { getNotificationsContent } from './notifications.content';
import { countUnread, readLastSeen } from './notificationInbox';

/**
 * RUN-001 — the header bell, for every signed-in role. It sits in the design
 * system `Header`'s own `actions` slot (composed by `ExpertHubMainHeader`), so
 * no design-system component is changed. It links to «إشعاراتي» and shows how
 * many in-platform notifications arrived since that page was last opened.
 *
 * Re-read on every navigation: opening «إشعاراتي» marks the list seen, and the
 * count has to drop as soon as the person leaves it.
 */
export function NotificationBell({ href }: { readonly href: string }) {
  const { locale } = useLocale();
  const copy = getNotificationsContent(locale).inbox;
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void getNotificationService()
      .listMyNotifications()
      .then((result) => {
        // A failed read leaves the bell plain rather than inventing a count.
        if (!cancelled && result.ok) {
          setUnread(countUnread(result.value, readLastSeen()));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <Button
      variant="tertiary"
      size="sm"
      href={href}
      aria-label={copy.bellLabel(unread)}
      iconStart={<Icon name="notification-01" size="md" decorative />}
    >
      {unread > 0 && (
        <Tag variant="error" size="xs" rounded aria-hidden="true">
          {formatNumber(unread, locale)}
        </Tag>
      )}
    </Button>
  );
}
