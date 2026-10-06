import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, ItemIcon, Loading } from '@ds/composite';
import { Icon, Typography } from '@ds/primitives';
import type { IconName } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { useExpertHubAuth } from '../../app/auth/AuthProvider';
import { expertHubPaths } from '../../app/router/paths';
import { getInternalService } from './internalService';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { getInternalContent } from './internal.content';
import type { InternalContent } from './internal.content';
import type { DashboardDto, DashboardMetricDto, DashboardMetricId } from './internal.types';
import { MetricTile } from './components/MetricTile';
import { SlaHealthMeter } from './components/SlaHealthMeter';
import { StageDistribution } from './components/StageDistribution';
import { DashboardWorkQueue } from './components/DashboardWorkQueue';
import styles from './InternalDashboardPage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { formatNumber } from '../../shared/formatting';

/**
 * EH-INT-01 — Internal Dashboard (`/expert-hub/internal`, staff). The operational
 * entry point: a role-scoped overview of the applications pipeline (derived
 * counts, `BR-0902/0904`) plus quick routes to the work queues. Read-only, no
 * state created (`§7`). Consumes **only** `internalService` (mock now, Expert Hub
 * API later).
 *
 * Composition ("Operational" layout, CLAUDE.md): a compact page head (the
 * shared three-level header is the shell, not a second banner), P-22 metric
 * tiles that drill into the inbox, then a two-column
 * working area — a filterable work queue (the staff inbox peek, getInbox) leads,
 * with deadline performance and stage distribution beside it as pipeline health.
 * Metrics are derived counts; the management KPI set stays deferred
 * (`DM-GAP-09`/`G13`), charting too (`G9`).
 *
 * ⚠️ The head no longer offers «ترشيح متقدم» (J-02 internal nomination): with no
 * backend behind it, it opened the self-service form, which files under the
 * signed-in staff member's OWN identity. See `ApplicationInboxPage`.
 */

const METRIC_ICON: Record<DashboardMetricId, IconName> = {
  'awaiting-screening': 'note-add',
  'in-screening': 'search-list-01',
  interviews: 'co-present',
  'awaiting-decision': 'dashboard-circle',
  'materials-awaiting-approval': 'note-done',
};

/**
 * The week-on-week change, worded — or nothing at all.
 *
 * ⚠️ `null` means there is no earlier week to compare against, and it returns
 * `undefined` so the tile shows no line. Rendering «لا تغيّر» there would claim
 * a comparison that was never made.
 */
function deltaLabel(
  delta: number | null,
  dashboard: InternalContent['dashboard'],
  locale: Locale
): string | undefined {
  if (delta == null) {
    return undefined;
  }
  if (delta === 0) {
    return dashboard.delta.flat;
  }
  const count = formatCount(Math.abs(delta), locale);
  return delta > 0 ? dashboard.delta.up(count) : dashboard.delta.down(count);
}

function formatCount(value: number, locale: Locale): string {
  return formatNumber(value, locale);
}

export default function InternalDashboardPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getInternalContent(locale), [locale]);
  const dashboard = content.dashboard;
  const { session } = useExpertHubAuth();
  const staffName = session?.displayName ?? '';

  const [data, setData] = useState<DashboardDto | null>(null);
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = dashboard.documentTitle;
  }, [dashboard.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setData(null);
    void getInternalService()
      .getDashboard()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.ok) {
          setData(result.value);
        } else {
          setLoadError(result.error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (data != null && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-dashboard-title')?.focus();
    }
  }, [data]);

  const inboxWithStatus = (status: string) =>
    `${expertHubPaths.internalApplications}?status=${status}`;

  /** Each tile drills where its own target says — never where its id implies. */
  const metricHref = (metric: DashboardMetricDto) =>
    metric.target.queue === 'submissions'
      ? expertHubPaths.internalSubmissions
      : inboxWithStatus(metric.target.status);

  if (loadError != null) {
    // A denial is not a load failure: `P-190`'s gate answers 403 with the
    // feature it wanted, and telling someone their system broke sends them
    // to the wrong person for help.
    const failure = describeLoadFailure(loadError, locale, {
      title: dashboard.errors.loadTitle,
      body: dashboard.errors.loadBody,
    });
    return (
      <PageLoadError
        title={failure.title}
        body={failure.body}
        onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={dashboard.errors.retry}
        size="prose"
      />
    );
  }

  return (
    <WorkspacePage labelledBy="eh-dashboard-title">
      {/* Compact page head — greeting and context.
            The three-level government header (brand + role-scoped nav) is the
            shared shell every persona renders (ExpertHubShell), so the page
            itself opens straight into the work rather than a second banner. */}
      <div className={styles.pagehead}>
        <div className={styles.headMain}>
          <span className={styles.eyebrow}>{dashboard.eyebrow}</span>
          <Typography
            as="h1"
            id="eh-dashboard-title"
            variant="display-md"
            tabIndex={-1}
            className={styles.title}
          >
            {dashboard.greeting(staffName)}
          </Typography>
          <Typography as="p" variant="text-md" color="muted" className={styles.headLead}>
            {dashboard.subtitle}
          </Typography>
          {data != null && (
            <Typography as="p" variant="text-md" className={styles.openSummary}>
              {dashboard.openSummary(data.totalOpen)}
            </Typography>
          )}
        </div>
      </div>

      {data == null ? (
        <Loading variant="skeleton" lines={8} label={dashboard.documentTitle} />
      ) : (
        <>
          {/* P-22 metric tiles — drill into the inbox. */}
          <ul className={styles.metrics} aria-label={dashboard.metricsLabel}>
            {data.metrics.map((metric) => (
              <li key={metric.id} className={styles.metricItem}>
                <MetricTile
                  icon={METRIC_ICON[metric.id]}
                  value={formatCount(metric.value, locale)}
                  label={dashboard.metrics[metric.id]}
                  href={metricHref(metric)}
                  // ⚠️ Only the intake tile carries it. The delta measures
                  // applications ARRIVING; hanging it off «قيد الفرز» would
                  // read as a change in that queue, which it is not.
                  delta={
                    metric.id === 'awaiting-screening'
                      ? deltaLabel(data.submissionDelta, dashboard, locale)
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>

          {/*
              The work leads, its health sits beside it. The newest applications
              to act on take the primary column; deadline performance and stage
              distribution sit alongside as the "is the pipeline healthy?"
              context (FADS Expert Hub kit, EH-INT-01). Read order for an
              operator: what needs doing, then whether the pipeline is on track.
            */}
          <div className={styles.working}>
            {/* Work queue — a filterable peek into the staff inbox (getInbox),
                  with the same rows + per-row "open" action as EH-INT-02, so the
                  operator lands straight on the work that needs doing. */}
            <DashboardWorkQueue content={content} locale={locale} />

            {/* Pipeline health — deadline performance + stage distribution. */}
            <div className={styles.secondary}>
              <Card className={styles.panelCard}>
                <div className={styles.sectionHead}>
                  <ItemIcon
                    contained
                    icon={<Icon name="dashboard-speed-01" size="md" tone="primary" decorative />}
                  />
                  <Typography as="h2" variant="text-lg" weight="bold">
                    {dashboard.sla.heading}
                  </Typography>
                </div>
                <SlaHealthMeter rows={data.sla} content={content} locale={locale} />
              </Card>

              <Card className={styles.panelCard}>
                <div className={styles.sectionHead}>
                  <ItemIcon
                    contained
                    icon={<Icon name="co-present" size="md" tone="primary" decorative />}
                  />
                  <Typography as="h2" variant="text-lg" weight="bold">
                    {dashboard.distribution.heading}
                  </Typography>
                </div>
                <StageDistribution rows={data.distribution} content={content} locale={locale} />
              </Card>
            </div>
          </div>
        </>
      )}
    </WorkspacePage>
  );
}
