import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, Loading, Pagination, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Avatar, Button, Icon, Link, TextInput, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import { apiUrl } from '../../shared/services/apiClient';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { formatDate as formatLocaleDate } from '../../shared/formatting';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import { speakerDisplayName, type SpeakerListDto, type SpeakerSummaryDto } from './speaker.types';
import { getSpeakerService } from './speakerService';
import { getSpeakersContent } from './speakers.content';
import styles from './SpeakersPage.module.css';

/**
 * EH-INT-11 — Speaker records (`/expert-hub/internal/speakers`, staff).
 * **Journey J-04/F2.**
 *
 * One search box over name and title — the owner ruled that specialization
 * filters come after the matrix is approved, so none is offered here. The
 * search is the *server's* job (the mock simulates it), so the real endpoint
 * drops in with no UI change.
 *
 * Internal only (`BR-0113`): there is no portal route and no portal link.
 * Nothing on this page classifies, evaluates, contracts or pays (`BR-0413`).
 */

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function SpeakersPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getSpeakersContent(locale), [locale]);
  const copy = content.list;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SpeakerListDto | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    document.getElementById('eh-speakers-title')?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void getSpeakerService()
      .listSpeakers({ search, page })
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (response.ok) {
          setResult(response.value);
        } else {
          setError(response.error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [search, page, reloadKey]);

  const rows = [...(result?.items ?? [])];
  const hasRows = error == null && result != null && rows.length > 0;
  const searching = search.trim() !== '';

  const updateSearch = (value: string) => {
    setSearch(value);
    // A new search starts from its first page, never from the old one's.
    setPage(1);
  };

  const columns: Array<TableColumn<SpeakerSummaryDto>> = [
    {
      key: 'name',
      header: copy.columns.name,
      // The person, not just the name — the same scan aid as the trainer database.
      render: (row) => {
        const name = speakerDisplayName(row, locale);
        return (
          <span className={styles.nameCell}>
            <Avatar
              name={name}
              src={row.photoUrl == null ? undefined : apiUrl(row.photoUrl)}
              size="sm"
              decorative
            />
            <Link href={expertHubPaths.internalSpeaker(row.speakerId)}>{name}</Link>
          </span>
        );
      },
    },
    {
      key: 'title',
      header: copy.columns.title,
      render: (row) =>
        row.title == null ? (
          <Typography as="span" variant="text-sm" color="muted">
            {copy.noTitle}
          </Typography>
        ) : (
          <bdi>{row.title}</bdi>
        ),
    },
    {
      key: 'created',
      header: copy.columns.created,
      render: (row) => formatDate(row.createdAt, locale),
    },
  ];

  // A denial is not a load failure: `P-190`'s gate answers 403 with the
  // feature it wanted (`F-0413`), and the page says so rather than "broken".
  const failure = describeLoadFailure(error, locale, {
    title: content.errors.loadTitle,
    body: content.errors.loadBody,
  });

  const addButton = (variant: 'primary' | 'secondary') => (
    <Button
      variant={variant}
      size="md"
      href={expertHubPaths.internalSpeakerNew}
      iconStart={<Icon name="add-circle" size="sm" decorative />}
    >
      {copy.add}
    </Button>
  );

  return (
    <WorkspacePage labelledBy="eh-speakers-title">
      <PageHead
        titleId="eh-speakers-title"
        title={copy.title}
        lead={copy.description}
        summary={hasRows && result != null ? copy.resultsCount(result.totalCount) : undefined}
        actions={addButton('primary')}
      />

      <Panel
        flush={hasRows}
        toolbar={
          /* Owner ruling — name and title only, one box. */
          <div className={styles.search} role="search" aria-label={copy.search.regionLabel}>
            <TextInput
              label={copy.search.label}
              placeholder={copy.search.placeholder}
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
            />
          </div>
        }
        footer={
          hasRows && result != null && result.pageCount > 1 ? (
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              onPageChange={setPage}
              label={copy.pagination.label}
              previousLabel={copy.pagination.previous}
              nextLabel={copy.pagination.next}
            />
          ) : undefined
        }
      >
        {error != null ? (
          <ErrorState
            title={failure.title}
            description={failure.body}
            onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
            retryLabel={content.errors.retry}
          />
        ) : result == null ? (
          <Loading variant="skeleton" lines={5} label={copy.resultsLabel} />
        ) : rows.length === 0 && searching ? (
          /* A search that matched nobody is not an empty record. */
          <EmptyState
            icon={<Icon name="search-remove" size="featured" tone="primary" decorative />}
            title={copy.noResults.title}
            description={copy.noResults.body(search.trim())}
            action={
              <Button variant="secondary" size="md" onClick={() => updateSearch('')}>
                {copy.search.clear}
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="presentation-podium" size="featured" tone="primary" decorative />}
            title={copy.empty.title}
            description={copy.empty.body}
            action={addButton('secondary')}
          />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            getRowId={(row) => row.speakerId}
            caption={copy.resultsLabel}
            captionHidden
            density="compact"
            alternatingRows
          />
        )}
      </Panel>
    </WorkspacePage>
  );
}
