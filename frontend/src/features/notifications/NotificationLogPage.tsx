import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, EmptyState, Loading, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Icon, Select, Tag, TextInput, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { getNotificationService } from './notificationService';
import { getNotificationsContent } from './notifications.content';
import { NotificationsAreaNav } from './NotificationsAreaNav';
import {
  DEFAULT_LOG_QUERY,
  NOTIFICATION_CHANNELS,
  type NotificationChannel,
  type NotificationLogDto,
  type NotificationLogQuery,
} from './notification.types';
import {
  ActiveFilterChips,
  type ActiveFilterChip,
} from '../../shared/components/ActiveFilterChips';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './NotificationsPage.module.css';
import { dateFormatter } from '../../shared/formatting';

/**
 * EH-INT-12 — the notification log (**CAP-07 / `F-0705`**), at
 * `/expert-hub/internal/notifications/log`.
 *
 * `US-0705`: "a log of every notification sent and its status (success/failure),
 * so I can follow up on the stuck ones and handle them."
 *
 * **Read-only, and the missing resend is stated rather than hidden.** §8.7 never
 * defines what a resend does — which template version it uses, whether it writes
 * a second entry, how the recipient's language is re-resolved — and those are
 * business answers, not engineering ones. A button that guessed them would bake
 * one in silently. So the screen surfaces every failure with its reason and says
 * plainly that resending is not available in this release. → `Q32`.
 *
 * Two rules are visible in the data rather than announced:
 *
 * - **`BR-0702`** — one event produces **two** entries, email and in-platform,
 *   because they are sent together. One can succeed while the other fails, and
 *   that is exactly the case `US-0705` exists for.
 * - **`BR-0707`** — each entry carries **one** language, resolved from the
 *   recipient's primary-language field. There is no bilingual send.
 */

type Phase = 'loading' | 'error' | 'ready';

export default function NotificationLogPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getNotificationsContent(locale), [locale]);
  const copy = content.log;
  const service = getNotificationService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [entries, setEntries] = useState<readonly NotificationLogDto[]>([]);
  const [query, setQuery] = useState<NotificationLogQuery>(DEFAULT_LOG_QUERY);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  /*
    What the log is currently narrowed BY. The log is the screen someone opens
    to answer "was this notification sent?", and an unnoticed channel filter is
    exactly how that question gets answered wrongly — the chip row makes the
    narrowing visible, and removable one filter at a time.

    ⚠️ `sendStatus` and `channel` use `null` (not an `'all'` sentinel) for "every
    value", so the tests here are `!= null` rather than `!== 'all'`.
  */
  const activeChips: ActiveFilterChip[] = [
    ...(query.search.trim() !== ''
      ? [{ id: 'search', label: copy.searchLabel, value: query.search.trim() }]
      : []),
    ...(query.sendStatus != null
      ? [
          {
            id: 'sendStatus',
            label: copy.statusLabel,
            value: copy.statuses[query.sendStatus],
          },
        ]
      : []),
    ...(query.channel != null
      ? [
          {
            id: 'channel',
            label: copy.channelLabel,
            value: content.channels[query.channel],
          },
        ]
      : []),
  ];

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    if (!loadedOnce.current) {
      setPhase('loading');
    }
    void service.listLog(query).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setLoadError(result.error);
        setPhase('error');
        return;
      }
      setEntries(result.value);
      setPhase('ready');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, reloadKey]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-log-title')?.focus();
    }
  }, [phase]);

  if (phase === 'loading') {
    return (
      <WorkspacePage label={copy.title}>
        <Loading variant="skeleton" lines={5} label={copy.title} />
      </WorkspacePage>
    );
  }

  // A denial is not a load failure: `P-190`'s gate answers 403 with the
  // feature it wanted, and telling someone their system broke sends them
  // to the wrong person for help.
  const failure = describeLoadFailure(loadError, locale, {
    title: content.errors.loadTitle,
    body: content.errors.loadBody,
  });

  if (phase === 'error') {
    return (
      <PageLoadError
        title={failure.title}
        body={failure.body}
        onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
      />
    );
  }

  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const columns: TableColumn<NotificationLogDto>[] = [
    {
      key: 'event',
      header: copy.columns.event,
      render: (row: NotificationLogDto) => row.eventCode,
    },
    {
      key: 'recipient',
      header: copy.columns.recipient,
      render: (row: NotificationLogDto) => <bdi>{row.recipientName}</bdi>,
    },
    {
      key: 'channel',
      header: copy.columns.channel,
      render: (row: NotificationLogDto) => content.channels[row.channel],
    },
    {
      key: 'language',
      header: copy.columns.language,
      render: (row: NotificationLogDto) => content.languages[row.language],
    },
    {
      key: 'template',
      header: copy.columns.template,
      render: (row: NotificationLogDto) => (
        <bdi>{copy.templateVersion(row.templateCode, row.templateVersion)}</bdi>
      ),
    },
    {
      key: 'status',
      header: copy.columns.status,
      render: (row: NotificationLogDto) => (
        // The union carries the reason only on a failure, so a "successful
        // failure reason" cannot be rendered because it cannot exist.
        <div className={styles.failureRow}>
          <Tag variant={row.sendStatus === 'success' ? 'success' : 'error'} size="sm">
            {copy.statuses[row.sendStatus]}
          </Tag>
          {row.sendStatus === 'failure' && (
            <Typography as="span" variant="text-xs" color="muted">
              <bdi>
                {copy.failureLabel}: {row.failureReason}
              </bdi>
            </Typography>
          )}
        </div>
      ),
    },
    {
      key: 'sentAt',
      header: copy.columns.sentAt,
      render: (row: NotificationLogDto) => dates.format(new Date(row.sentAt)),
    },
  ];

  return (
    <WorkspacePage labelledBy="eh-log-title">
      <NotificationsAreaNav content={content} current="log" />

      <PageHead titleId="eh-log-title" title={copy.title} lead={copy.intro} />

      {/* `US-0705` wants failures handled, and §8.7 does not define a resend.
          Saying so beats a screen that quietly offers nothing. */}
      <Alert tone="info" surface="tinted" role="note">
        {copy.noResendNote}
      </Alert>

      <Panel
        flush={entries.length > 0}
        toolbar={
          <>
            <Typography as="p" variant="text-xs" color="muted">
              {copy.bothChannelsNote}
            </Typography>
            <Typography as="p" variant="text-xs" color="muted">
              {copy.languageNote}
            </Typography>
            <div className={styles.filters}>
              <TextInput
                label={copy.searchLabel}
                type="search"
                placeholder={copy.searchPlaceholder}
                value={query.search}
                onChange={(event) => setQuery({ ...query, search: event.target.value })}
              />
              <Select
                label={copy.statusLabel}
                value={query.sendStatus ?? ''}
                onValueChange={(value) =>
                  setQuery({
                    ...query,
                    sendStatus: value === '' ? null : (value as NotificationLogDto['sendStatus']),
                  })
                }
                options={[
                  { value: '', label: copy.allStatuses },
                  { value: 'success', label: copy.statuses.success },
                  { value: 'failure', label: copy.statuses.failure },
                ]}
              />
              <Select
                label={copy.channelLabel}
                value={query.channel ?? ''}
                onValueChange={(value) =>
                  setQuery({
                    ...query,
                    channel: value === '' ? null : (value as NotificationChannel),
                  })
                }
                options={[
                  { value: '', label: copy.allChannels },
                  ...NOTIFICATION_CHANNELS.map((channel) => ({
                    value: channel,
                    label: content.channels[channel],
                  })),
                ]}
              />

              {/* What the log is narrowed BY — each filter removable on its own. */}
              <div className={styles.activeChips}>
                <ActiveFilterChips
                  chips={activeChips}
                  heading={copy.activeHeading}
                  removeLabel={(chip) => copy.removeFilter(chip.label, chip.value)}
                  onRemove={(id) =>
                    setQuery(
                      id === 'search'
                        ? { ...query, search: '' }
                        : id === 'sendStatus'
                          ? { ...query, sendStatus: null }
                          : { ...query, channel: null }
                    )
                  }
                />
              </div>
            </div>
          </>
        }
      >
        {entries.length === 0 ? (
          <EmptyState
            icon={<Icon name="search-remove" size="featured" tone="neutral" />}
            title={copy.empty}
          />
        ) : (
          <Table
            caption={copy.resultsLabel}
            captionHidden
            columns={columns}
            rows={[...entries]}
            getRowId={(row) => row.logId}
            density="compact"
            alternatingRows
          />
        )}
      </Panel>
    </WorkspacePage>
  );
}
