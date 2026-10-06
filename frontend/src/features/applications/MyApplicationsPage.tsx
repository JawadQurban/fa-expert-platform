import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, EmptyState, ErrorState, ItemIcon, Loading, Pagination } from '@ds/composite';
import { Button, Icon, Typography } from '@ds/primitives';
import type { IconName } from '@ds/primitives';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import {
  DEFAULT_APPLICATIONS_FILTERS,
  hasActiveFilters,
  type ApplicationsFilters,
  type MyApplicationsListDto,
} from './application.types';
import { getApplicationsService } from './applicationsService';
import { getMyApplicationsContent, type MyApplicationsContent } from './myApplications.content';
import { ApplicationsFilterBar } from './components/ApplicationsFilterBar';
import { ApplicationsList } from './components/ApplicationsList';
import styles from './MyApplicationsPage.module.css';
import { formatNumber } from '../../shared/formatting';

/**
 * EH-TP-02 — My Applications (`/expert-hub/applications`, trainer render).
 * The first authenticated Trainer Portal page: track every join application and
 * its live aggregated status (`P-05` 11-value vocabulary, `BR-0108`), resume
 * drafts, open details, and start a compliant new application (`BR-0101`).
 *
 * Renders inside the Expert Hub authenticated shell (never the Hackathon
 * shell) and consumes **only** `applicationsService` (`CAP-API-01`) — the
 * versioned mock today, the Expert Hub ASP.NET Core API later, with no UI
 * change. No FAST / MTM / ERP / SSO calls; FAST-sync state is never shown on
 * this page (`04` EH-TP-02 §11).
 *
 * Regions (per `05` EH-TP-02 §6 + product-owner additions): page title +
 * description → primary action bar (New Application, `BR-0101`-gated with an
 * accessible inline explanation) → summary cards (derived counts) → Filter Bar
 * (P-11) → application list (P-01) → pagination → empty/loading/error states.
 * No breadcrumb: `05` §0.3 omits breadcrumbs on top-level list routes.
 */

/** Fixed page size (`05` §0.15 — "a fixed default per page"). */
const PAGE_SIZE = 8;

interface SummaryCardModel {
  readonly id: string;
  readonly icon: IconName;
  readonly value: number;
  readonly label: string;
}

/**
 * Summary-card figures — presentation groupings **derived** from the documented
 * `P-05` status vocabulary (no invented business metrics): totals and per-group
 * counts computed by the service from the same list data. Grouping definitions:
 * in-progress = submitted…approval-in-progress; approved = approved + active;
 * requires action = draft + agreement-pending (the two states where the trainer
 * must act). Backed by mock data until the real API ships.
 */
function buildSummaryCards(
  result: MyApplicationsListDto,
  content: MyApplicationsContent
): readonly SummaryCardModel[] {
  const counts = result.statusCounts;
  const total = result.totalApplications;
  const inProgress =
    counts.submitted +
    counts['under-review'] +
    counts['interview-scheduled'] +
    counts['interview-completed'] +
    counts['approval-in-progress'];
  return [
    { id: 'total', icon: 'note-01', value: total, label: content.summary.total },
    { id: 'draft', icon: 'note-edit', value: counts.draft, label: content.summary.draft },
    {
      id: 'in-progress',
      icon: 'search-list-01',
      value: inProgress,
      label: content.summary.underReview,
    },
    {
      id: 'approved',
      icon: 'task-done-01',
      value: counts.approved + counts.active,
      label: content.summary.approved,
    },
    {
      id: 'requires-action',
      icon: 'alert-circle',
      value: counts.draft + counts['agreement-pending'],
      label: content.summary.requiresAction,
    },
  ];
}

function formatCount(value: number, locale: Locale): string {
  return formatNumber(value, locale);
}

function errorCopy(error: ExpertHubApiError, content: MyApplicationsContent) {
  if (error.status === 401) {
    return { title: content.errors.sessionExpiredTitle, body: content.errors.sessionExpiredBody };
  }
  if (error.status === 403) {
    return { title: content.errors.unauthorizedTitle, body: content.errors.unauthorizedBody };
  }
  return { title: content.errors.loadFailedTitle, body: content.errors.loadFailedBody };
}

export default function MyApplicationsPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getMyApplicationsContent(locale), [locale]);

  const [filters, setFilters] = useState<ApplicationsFilters>(DEFAULT_APPLICATIONS_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<MyApplicationsListDto | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  // Focus lands on the page heading on load (`04` EH-TP-02 §13 / `05` §0.18).
  useEffect(() => {
    document.getElementById('eh-my-applications-title')?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getApplicationsService()
      .listMyApplications({
        page,
        pageSize: PAGE_SIZE,
        search: filters.search,
        status: filters.status,
        service: filters.service,
      })
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (response.ok) {
          setResult(response.value);
        } else {
          setError(response.error);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, filters, reloadKey]);

  const handleFiltersChange = (next: ApplicationsFilters) => {
    setFilters(next);
    setPage(1);
  };

  const retry = () => setReloadKey((key) => key + 1);

  const blocked = result != null && !result.canCreateNew;
  const summaryCards = result == null ? null : buildSummaryCards(result, content);

  const listRegion = () => {
    if (error != null) {
      const copy = errorCopy(error, content);
      return (
        <ErrorState
          title={copy.title}
          description={copy.body}
          onRetry={retry}
          retryLabel={content.actions.retry}
        />
      );
    }
    if (result == null) {
      // First load — the action bar above renders immediately (`05` §12).
      return <Loading variant="skeleton" lines={6} label={content.list.caption} />;
    }
    if (result.items.length === 0) {
      return hasActiveFilters(filters) ? (
        <EmptyState
          icon={<Icon name="search-remove" size="featured" tone="primary" decorative />}
          title={content.empty.noResultsTitle}
          description={content.empty.noResultsBody}
          action={
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleFiltersChange(DEFAULT_APPLICATIONS_FILTERS)}
            >
              {content.actions.clearFilters}
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<Icon name="note-add" size="featured" tone="primary" decorative />}
          title={content.empty.noApplicationsTitle}
          description={content.empty.noApplicationsBody}
          action={
            <Button variant="primary" size="md" href={expertHubPaths.applicationsNew}>
              {content.actions.applyNow}
            </Button>
          }
        />
      );
    }
    return (
      <div aria-busy={loading || undefined}>
        <ApplicationsList items={result.items} content={content} locale={locale} />
        {result.pageCount > 1 && (
          <div className={styles.pagination}>
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              onPageChange={setPage}
              label={content.pagination.label}
              previousLabel={content.pagination.previous}
              nextLabel={content.pagination.next}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Section aria-labelledby="eh-my-applications-title">
      <Container>
        {/* Page title + primary action bar (`05` §0.4). */}
        <div className={styles.titleRow}>
          <div className={styles.titleBlock}>
            <Typography as="h1" id="eh-my-applications-title" variant="display-md" tabIndex={-1}>
              {content.title}
            </Typography>
            <Typography as="p" variant="text-md" color="muted">
              {content.description}
            </Typography>
          </div>
          <Button
            variant="primary"
            size="md"
            href={blocked ? undefined : expertHubPaths.applicationsNew}
            disabled={blocked}
            aria-describedby={blocked ? 'eh-new-application-blocked' : undefined}
            iconStart={<Icon name="add-circle" size="md" decorative />}
          >
            {content.actions.newApplication}
          </Button>
        </div>

        {/* BR-0101 block: inline explanation + link, not a modal (`05` §15). */}
        {blocked && (
          <Alert
            id="eh-new-application-blocked"
            tone="info"
            className={styles.blockedAlert}
            action={
              result?.activeApplicationId != null ? (
                <Button
                  variant="tertiary"
                  size="sm"
                  href={expertHubPaths.applicationDetail(result.activeApplicationId)}
                >
                  {content.actions.blockedLinkLabel}
                </Button>
              ) : undefined
            }
          >
            {content.actions.blockedExplanation}
          </Alert>
        )}

        {/* Summary cards — derived counts (see buildSummaryCards). */}
        {summaryCards != null && (
          <ul className={styles.summaryGrid} aria-label={content.summary.sectionLabel}>
            {summaryCards.map((cardModel) => (
              <li key={cardModel.id}>
                <Card effect="stroke" className={styles.summaryCard}>
                  <ItemIcon
                    contained
                    icon={<Icon name={cardModel.icon} size="md" tone="primary" decorative />}
                  />
                  <Typography
                    as="p"
                    variant="display-md"
                    weight="bold"
                    className={styles.summaryValue}
                  >
                    {formatCount(cardModel.value, locale)}
                  </Typography>
                  <Typography as="p" variant="text-sm" color="muted">
                    {cardModel.label}
                  </Typography>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {/* P-11 Filter Bar. */}
        <div className={styles.filters}>
          <ApplicationsFilterBar
            content={content}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        <div className={styles.listRegion}>{listRegion()}</div>
      </Container>
    </Section>
  );
}
