import { useEffect, useMemo, useState } from 'react';
import { Card, EmptyState, ErrorState, Loading } from '@ds/composite';
import { Icon, Tag, Typography } from '@ds/primitives';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { formatDate } from '../../shared/formatting';
import { getNotificationService } from './notificationService';
import { getNotificationsContent } from './notifications.content';
import { countUnread, markSeen, readLastSeen } from './notificationInbox';
import type { MyNotificationDto } from './notification.types';
import styles from './MyNotificationsPage.module.css';

/**
 * J-25 — «إشعاراتي»: the recipient's own in-platform notifications, for every
 * signed-in role (the header bell links here). `BR-0702` makes each one a
 * `NOTIFICATION_LOG` row, so the subject and body are exactly what was sent —
 * template wording, placeholders filled. Opening the page marks the list seen
 * for the bell; there is no per-item read state to write (`DM-GAP-08`).
 */
export default function MyNotificationsPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getNotificationsContent(locale), [locale]);
  const copy = content.inbox;

  const [items, setItems] = useState<readonly MyNotificationDto[] | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  // What was new when the page opened — captured before marking it seen.
  const [newCount, setNewCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void getNotificationService()
      .listMyNotifications()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setNewCount(countUnread(result.value, readLastSeen()));
        markSeen(result.value);
        setItems(result.value);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const body = () => {
    if (error != null) {
      const failure = describeLoadFailure(error, locale, {
        title: content.errors.loadTitle,
        body: content.errors.loadBody,
      });
      return (
        <ErrorState
          title={failure.title}
          description={failure.body}
          onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
          retryLabel={content.errors.retry}
        />
      );
    }
    if (items == null) {
      return <Loading variant="skeleton" lines={4} label={copy.title} />;
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon={<Icon name="notification-01" size="featured" tone="primary" decorative />}
          title={copy.empty}
          description={copy.emptyBody}
        />
      );
    }
    return (
      <ul className={styles.list} aria-label={copy.listLabel}>
        {items.map((item, index) => (
          <li key={item.logId}>
            <Card effect="stroke" className={styles.item}>
              <div className={styles.itemHead}>
                <Typography as="h2" variant="text-md" weight="bold">
                  <bdi>{item.subject ?? item.eventCode}</bdi>
                </Typography>
                {index < newCount && (
                  <Tag variant="information" size="sm">
                    {copy.newLabel}
                  </Tag>
                )}
              </div>
              {item.body != null && (
                <Typography as="p" variant="text-md">
                  <bdi>{item.body}</bdi>
                </Typography>
              )}
              <Typography as="p" variant="text-xs" color="muted">
                <time dateTime={item.sentAt}>
                  {formatDate(item.sentAt, locale, { dateStyle: 'medium', timeStyle: 'short' })}
                </time>
              </Typography>
            </Card>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Section aria-labelledby="eh-my-notifications-title">
      <Container size="prose">
        <div className={styles.head}>
          <Typography as="h1" id="eh-my-notifications-title" variant="display-md" tabIndex={-1}>
            {copy.title}
          </Typography>
          <Typography as="p" variant="text-md" color="muted">
            {copy.intro}
          </Typography>
        </div>
        {body()}
      </Container>
    </Section>
  );
}
