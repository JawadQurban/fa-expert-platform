import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Alert, EmptyState, Loading, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Button, Icon, Tag, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import { apiUrl } from '../../shared/services/apiClient';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { formatDate as formatLocaleDate } from '../../shared/formatting';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { RecordHead } from '../../shared/workspace/RecordHead';
import { Panel } from '../../shared/workspace/Panel';
import {
  SPEAKER_EMAIL_PENDING_FAST,
  speakerNameAr,
  speakerNameEn,
  type SpeakerDetailDto,
  type SpeakerParticipationDto,
} from './speaker.types';
import { getSpeakerService } from './speakerService';
import { getSpeakersContent } from './speakers.content';
import styles from './SpeakerDetailPage.module.css';

/**
 * EH-INT-11 detail — one speaker record (**journey J-04**).
 *
 * Two rows on this page are about what FAST *cannot serve yet*, and both are
 * worded so they never read as a fact about the speaker:
 *
 * - **Email** (owner ruling, 2026-10-13) is read from the speaker's FAST
 *   profile, never typed here. Until FAST serves another person's profile, the
 *   row says "not available yet" and why — not "no email".
 * - **Participation history** (F3) is deferred until FAST links speakers to
 *   events. Until then the section says the history will appear automatically —
 *   never "no participations", which would be a false statement.
 *
 * No classification, evaluation, agreement or payment appears (`BR-0413`).
 */

type Phase = 'loading' | 'error' | 'not-found' | 'ready';

/** What the form passes on arrival after a save, so this page can confirm it. */
export interface SpeakerSavedState {
  readonly speakerSaved: 'created' | 'updated';
}

function isSavedState(state: unknown): state is SpeakerSavedState {
  return (
    typeof state === 'object' &&
    state != null &&
    'speakerSaved' in state &&
    (state.speakerSaved === 'created' || state.speakerSaved === 'updated')
  );
}

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function SpeakerDetailPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getSpeakersContent(locale), [locale]);
  const copy = content.detail;
  const { speakerId } = useParams();
  const location = useLocation();
  const saved: unknown = location.state;

  const [phase, setPhase] = useState<Phase>('loading');
  const [speaker, setSpeaker] = useState<SpeakerDetailDto | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const focusedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    if (speakerId == null) {
      setPhase('not-found');
      return;
    }
    void getSpeakerService()
      .getSpeaker(speakerId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.ok) {
          setSpeaker(result.value);
          setPhase('ready');
        } else if (result.error.status === 404) {
          setPhase('not-found');
        } else {
          setError(result.error);
          setPhase('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [speakerId, reloadKey]);

  const nameAr = speaker == null ? '' : speakerNameAr(speaker);
  const nameEn = speaker == null ? null : speakerNameEn(speaker);
  const displayName = locale === 'en' && nameEn != null ? nameEn : nameAr;

  useEffect(() => {
    if (speaker != null) {
      document.title = copy.documentTitle(displayName);
    }
  }, [speaker, copy, displayName]);

  useEffect(() => {
    if (phase === 'ready' && !focusedOnce.current) {
      focusedOnce.current = true;
      document.getElementById('eh-speaker-title')?.focus();
    }
  }, [phase]);

  if (phase === 'loading') {
    return (
      <WorkspacePage label={content.list.title}>
        <Loading variant="skeleton" lines={6} label={content.list.title} />
      </WorkspacePage>
    );
  }

  if (phase !== 'ready' || speaker == null) {
    // A 403 is a denial (`F-0413`), not a broken system — and not retryable.
    const failure =
      phase === 'not-found'
        ? {
            title: content.errors.notFoundTitle,
            body: content.errors.notFoundBody,
            canRetry: false,
          }
        : describeLoadFailure(error, locale, {
            title: content.errors.detailLoadTitle,
            body: content.errors.detailLoadBody,
          });
    return (
      <PageLoadError
        title={failure.title}
        body={failure.body}
        onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.internalSpeakers}>
            {content.errors.backToList}
          </Button>
        }
      />
    );
  }

  const emailValue =
    speaker.email != null ? (
      <bdi>{speaker.email}</bdi>
    ) : (
      <Typography as="span" variant="text-sm" color="muted">
        {speaker.emailUnavailableReason === SPEAKER_EMAIL_PENDING_FAST
          ? copy.emailPendingFast
          : copy.emailUnavailable}
      </Typography>
    );

  const historyColumns: Array<TableColumn<SpeakerParticipationDto>> = [
    {
      key: 'event',
      header: copy.historyColumns.event,
      render: (row) => <bdi>{row.eventName}</bdi>,
    },
    {
      key: 'date',
      header: copy.historyColumns.date,
      render: (row) => formatDate(row.date, locale),
    },
    {
      key: 'role',
      header: copy.historyColumns.role,
      render: (row) => (row.role == null ? copy.notRecorded : <bdi>{row.role}</bdi>),
    },
  ];

  const facts: ReadonlyArray<readonly [string, string | null]> = [
    [copy.nameArLabel, nameAr],
    [copy.nameEnLabel, nameEn],
    [copy.titleLabel, speaker.title],
  ];

  return (
    <WorkspacePage labelledBy="eh-speaker-title">
      <Breadcrumbs
        items={[
          { label: copy.breadcrumbList, href: expertHubPaths.internalSpeakers },
          { label: displayName },
        ]}
        label={copy.breadcrumbLabel}
      />

      <RecordHead
        titleId="eh-speaker-title"
        title={displayName}
        person={displayName}
        personImage={speaker.photoUrl == null ? undefined : apiUrl(speaker.photoUrl)}
        meta={[
          speaker.title == null ? undefined : <bdi>{speaker.title}</bdi>,
          copy.createdOn(formatDate(speaker.createdAt, locale)),
          speaker.updatedAt !== speaker.createdAt
            ? copy.updatedOn(formatDate(speaker.updatedAt, locale))
            : undefined,
        ]}
        tags={
          <Tag variant="information" size="sm">
            {content.speakerTag}
          </Tag>
        }
        actions={
          <Button
            variant="secondary"
            size="md"
            href={expertHubPaths.internalSpeakerEdit(speaker.speakerId)}
            iconStart={<Icon name="note-edit" size="sm" decorative />}
          >
            {copy.edit}
          </Button>
        }
      />

      {isSavedState(saved) && (
        <Alert tone="success" surface="tinted" role="status">
          {saved.speakerSaved === 'created' ? content.success.created : content.success.updated}
        </Alert>
      )}

      <div className={styles.grid}>
        <div className={styles.column}>
          <Panel title={copy.namesHeading} titleId="eh-speaker-names">
            <dl className={styles.facts}>
              {facts.map(([label, value]) => (
                <div key={label} className={styles.fact}>
                  <dt className={styles.term}>{label}</dt>
                  <dd className={styles.value}>
                    {value == null ? (
                      <Typography as="span" variant="text-sm" color="muted">
                        {copy.notRecorded}
                      </Typography>
                    ) : (
                      <bdi>{value}</bdi>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title={copy.bioHeading} titleId="eh-speaker-bio">
            {speaker.bio == null ? (
              <Typography as="p" variant="text-sm" color="muted">
                {copy.bioEmpty}
              </Typography>
            ) : (
              <Typography as="p" variant="text-md" className={styles.bio}>
                {speaker.bio}
              </Typography>
            )}
          </Panel>
        </div>

        <div className={styles.column}>
          {/* Owner ruling (2026-10-13) — from FAST, never typed here. */}
          <Panel title={copy.contactHeading} titleId="eh-speaker-contact">
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <dt className={styles.term}>{copy.emailLabel}</dt>
                <dd className={styles.value}>{emailValue}</dd>
              </div>
            </dl>
          </Panel>

          {/* F3 — deferred until FAST links speakers to events. */}
          <Panel
            title={copy.historyHeading}
            titleId="eh-speaker-history"
            flush={speaker.history.available && speaker.history.items.length > 0}
          >
            {!speaker.history.available ? (
              <EmptyState
                icon={<Icon name="presentation-online" size="featured" tone="primary" decorative />}
                title={copy.historyPendingTitle}
                description={copy.historyPendingBody}
              />
            ) : speaker.history.items.length === 0 ? (
              <Typography as="p" variant="text-sm" color="muted">
                {copy.historyEmpty}
              </Typography>
            ) : (
              <Table
                columns={historyColumns}
                rows={[...speaker.history.items]}
                getRowId={(row) => `${row.eventName}-${row.date}`}
                caption={copy.historyLabel}
                captionHidden
                density="compact"
              />
            )}
          </Panel>
        </div>
      </div>
    </WorkspacePage>
  );
}
