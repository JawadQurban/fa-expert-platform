import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, Loading, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Avatar, Button, Icon, Tag, TextInput, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import type { NominationCandidateDto } from './applicationForm.types';
import { getNominationService } from './applicationsService';
import { getNewApplicationContent } from './newApplication.content';
import styles from './NominationsPage.module.css';

/**
 * **EH-INT-12 — J-02 internal nomination**, step 1: find the existing user the
 * application is for, by user id, name or email (owner ruling, 2026-10-13:
 * «the internal staff should be able to link it with user id»). Step 2 is the
 * application form itself, on `NominationFormPage`.
 */
export default function NominationsPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getNewApplicationContent(locale), [locale]);
  const copy = content.nomination;
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<readonly NominationCandidateDto[] | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const term = search.trim();

  useEffect(() => {
    document.title = copy.search.documentTitle;
  }, [copy.search.documentTitle]);

  useEffect(() => {
    if (term.length < 2) {
      setResult(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    void getNominationService()
      .searchCandidates(term)
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
  }, [term, reloadKey]);

  const name = (row: NominationCandidateDto) =>
    locale === 'en' && row.fullNameEn !== '' ? row.fullNameEn : row.fullNameAr;

  const columns: Array<TableColumn<NominationCandidateDto>> = [
    {
      key: 'name',
      header: copy.search.columns.name,
      render: (row) => (
        <span className={styles.nameCell}>
          <Avatar name={name(row)} size="sm" decorative />
          <bdi>{name(row)}</bdi>
        </span>
      ),
    },
    {
      key: 'email',
      header: copy.search.columns.email,
      render: (row) => <bdi>{row.email}</bdi>,
    },
    {
      key: 'userId',
      header: copy.search.columns.userId,
      render: (row) => (
        <Typography as="span" variant="text-sm" color="muted">
          <bdi>{row.userId}</bdi>
        </Typography>
      ),
    },
    {
      key: 'action',
      header: copy.search.columns.action,
      render: (row) =>
        row.blocked == null ? (
          <Button variant="primary" size="sm" href={expertHubPaths.internalNomination(row.userId)}>
            {copy.search.select}
          </Button>
        ) : (
          <Tag variant={row.blocked === 'self' ? 'neutral' : 'warning'} size="sm">
            {copy.search.blocked[row.blocked]}
          </Tag>
        ),
    },
  ];

  const failure = describeLoadFailure(error, locale, {
    title: content.errors.loadFailedTitle,
    body: content.errors.loadFailedBody,
  });

  return (
    <WorkspacePage labelledBy="eh-nominations-title">
      <PageHead
        titleId="eh-nominations-title"
        title={copy.search.title}
        lead={copy.search.lead}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: copy.breadcrumbRoot, href: expertHubPaths.internalApplications },
              { label: copy.breadcrumbList },
            ]}
            label={content.breadcrumbLabel}
          />
        }
      />

      <Panel
        flush={result != null && result.length > 0}
        toolbar={
          <div className={styles.search} role="search" aria-label={copy.search.regionLabel}>
            <TextInput
              label={copy.search.label}
              placeholder={copy.search.placeholder}
              helperText={copy.search.hint}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        }
      >
        {error != null ? (
          <ErrorState
            title={failure.title}
            description={failure.body}
            onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
            retryLabel={content.actions.retry}
          />
        ) : term.length < 2 ? (
          <EmptyState
            icon={<Icon name="search-01" size="featured" tone="primary" decorative />}
            title={copy.search.regionLabel}
            description={copy.search.hint}
          />
        ) : result == null ? (
          <Loading variant="skeleton" lines={4} label={copy.search.resultsLabel} />
        ) : result.length === 0 ? (
          <EmptyState
            icon={<Icon name="search-remove" size="featured" tone="primary" decorative />}
            title={copy.search.noResultsTitle}
            description={copy.search.noResultsBody(term)}
          />
        ) : (
          <Table
            columns={columns}
            rows={[...result]}
            getRowId={(row) => row.userId}
            caption={copy.search.resultsLabel}
            captionHidden
            density="compact"
            alternatingRows
          />
        )}
      </Panel>
    </WorkspacePage>
  );
}
