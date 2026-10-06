import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, Loading, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Button, Icon, Link, Tag } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import { localized } from '../../shared/types/localizedText';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import {
  isMultiHeadcount,
  type AssignmentRequestStatus,
  type AssignmentRequestSummaryDto,
} from './assignment.types';
import { getAssignmentService } from './assignmentService';
import { getAssignmentsContent } from './assignments.content';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './AssignmentRequestsPage.module.css';
import { formatDate as formatLocaleDate } from '../../shared/formatting';

/**
 * EH-INT-09 — Assignment Requests (`/expert-hub/internal/assignments`, staff).
 *
 * ⚠️ **Scope note.** J-16 ends at submission and does not itself ask for a list.
 * This page exists because a create-only screen leaves a submitted request
 * nowhere to be seen, and because **J-17 needs exactly this shell** to hang
 * matching and nomination from. It shows what J-16 produces and nothing more —
 * no matching, no shortlist, no nomination, all of which are J-17's.
 *
 * **F4/AC-2 is surfaced here**: a request for more than one person is marked as
 * such, because it changes what J-17 may do against it.
 */

const STATUS_VARIANT: Readonly<Record<AssignmentRequestStatus, TagVariant>> = {
  matching: 'warning',
  nominated: 'success',
  closed: 'neutral',
};

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AssignmentRequestsPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getAssignmentsContent(locale), [locale]);

  const [requests, setRequests] = useState<readonly AssignmentRequestSummaryDto[] | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    document.getElementById('eh-assignments-title')?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void getAssignmentService()
      .listRequests()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.ok) {
          setRequests(result.value);
        } else {
          setError(result.error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const rows = [...(requests ?? [])];

  const columns: Array<TableColumn<AssignmentRequestSummaryDto>> = [
    {
      key: 'reference',
      header: content.columns.reference,
      // The reference is the discernible link into J-17's matching workspace.
      render: (row) => (
        <Link href={expertHubPaths.internalAssignmentMatching(row.requestId)}>
          <bdi>{row.reference}</bdi>
        </Link>
      ),
    },
    {
      key: 'service',
      header: content.columns.service,
      render: (row) => content.form.services[row.serviceType],
    },
    {
      key: 'program',
      header: content.columns.program,
      render: (row) => (row.programName == null ? '—' : localized(row.programName, locale)),
    },
    {
      key: 'headcount',
      header: content.columns.headcount,
      // F4/AC-2 — a multi-person request is marked, because J-17 treats it
      // differently: several nominations may be made against one request.
      render: (row) => (
        <span className={styles.headcount}>
          {content.headcountValue(row.requiredHeadcount)}
          {isMultiHeadcount(row) && (
            <Tag variant="information" size="xs">
              {content.multiHeadcountNote}
            </Tag>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: content.columns.status,
      render: (row) => (
        <Tag variant={STATUS_VARIANT[row.status]} size="sm">
          {content.statuses[row.status]}
        </Tag>
      ),
    },
    {
      key: 'created',
      header: content.columns.created,
      render: (row) => formatDate(row.createdAt, locale),
    },
  ];

  // A denial is not a load failure: `P-190`'s gate answers 403 with the
  // feature it wanted, and telling someone their system broke sends them
  // to the wrong person for help.
  const failure = describeLoadFailure(error, locale, {
    title: content.errors.loadTitle,
    body: content.errors.loadBody,
  });

  const hasRows = error == null && requests != null && rows.length > 0;

  return (
    <WorkspacePage labelledBy="eh-assignments-title">
      <PageHead
        titleId="eh-assignments-title"
        title={content.listTitle}
        lead={content.listDescription}
        actions={
          <Button
            variant="primary"
            size="md"
            href={expertHubPaths.internalAssignmentNew}
            iconStart={<Icon name="add-circle" size="sm" decorative />}
          >
            {content.create}
          </Button>
        }
      />

      <Panel flush={hasRows}>
        {error != null ? (
          <ErrorState
            title={failure.title}
            description={failure.body}
            onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
            retryLabel={content.errors.retry}
          />
        ) : requests == null ? (
          <Loading variant="skeleton" lines={4} label={content.resultsLabel} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="add-circle" size="featured" tone="primary" decorative />}
            title={content.empty.title}
            description={content.empty.body}
            action={
              <Button variant="primary" size="md" href={expertHubPaths.internalAssignmentNew}>
                {content.create}
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            getRowId={(row) => row.requestId}
            caption={content.resultsLabel}
            captionHidden
            density="compact"
            alternatingRows
          />
        )}
      </Panel>
    </WorkspacePage>
  );
}
