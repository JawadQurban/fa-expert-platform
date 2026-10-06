import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, Loading, Pagination } from '@ds/composite';
import { Button, Icon, Typography } from '@ds/primitives';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import {
  DEFAULT_DIRECTORY_FILTERS,
  hasActiveDirectoryFilters,
  type DirectoryFilters,
  type DirectoryListDto,
} from './directory.types';
import { getDirectoryService } from './directoryService';
import { getDirectoryContent } from './directory.content';
import { DirectoryFilterBar } from './components/DirectoryFilterBar';
import { TrainerCard } from './components/TrainerCard';
import styles from './TrainerDirectoryPage.module.css';
import { formatNumber } from '../../shared/formatting';

/**
 * EH-PUB-02 — Trainer Directory (`/expert-hub/directory`, public). Browse the
 * accredited experts who consented to appear (J-24/F1/AC-1, `BR-1002`) and search
 * them by name, over the exhaustive public projection only (`BR-1004` corrected)
 * — no rating, no classification, no bio.
 *
 * ⚠️ F1/AC-2's specialization filter is not offered: no taxonomy maps a trainer
 * onto a specialty (`Q16`), so the chip rail answered «nobody» and the API now
 * refuses `specialty` with 400.
 *
 * Public: no auth, no state creation, no audit (`04` EH-PUB-02 §7/§10). Consumes
 * **only** `directoryService` (mock now, the public Expert Hub API later); the
 * consent gate + filtering + paging are the *server's* job — the mock simulates
 * them so the real endpoint drops in with no UI change.
 *
 * Composition (CLAUDE.md Creative Composition Rule — no new DS parts, tokens, or
 * colors): a branded **pattern hero** with derived highlight stats → P-11 Filter
 * Bar → responsive results grid → pagination, with Loading / Empty / Error states.
 */

/** Fixed page size (`05` §0.15 — a fixed default per page). */
const PAGE_SIZE = 9;

function formatCount(value: number, locale: Locale): string {
  return formatNumber(value, locale);
}

export default function TrainerDirectoryPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getDirectoryContent(locale), [locale]);

  const [filters, setFilters] = useState<DirectoryFilters>(DEFAULT_DIRECTORY_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<DirectoryListDto | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  // Focus lands on the page heading on load (`04` EH-PUB-02 §13 / `05` §0.18).
  useEffect(() => {
    document.getElementById('eh-directory-title')?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getDirectoryService()
      .listDirectory({
        page,
        pageSize: PAGE_SIZE,
        search: filters.search,
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

  const handleFiltersChange = (next: DirectoryFilters) => {
    setFilters(next);
    setPage(1);
  };

  const retry = () => setReloadKey((key) => key + 1);

  const stats =
    result == null
      ? null
      : [
          { id: 'experts', value: result.totalConsented, label: content.stats.experts },
          {
            id: 'specialties',
            value: result.specialtiesRepresented,
            label: content.stats.specialties,
          },
          {
            id: 'programs',
            value: result.programsDelivered,
            label: content.stats.programs,
          },
        ];

  const resultsRegion = () => {
    if (error != null) {
      // Public page — no 401/403 surface (unauthenticated by design); every
      // failure maps to the one generic, retryable load error.
      return (
        <ErrorState
          title={content.errors.loadTitle}
          description={content.errors.loadBody}
          onRetry={retry}
          retryLabel={content.errors.retry}
        />
      );
    }
    if (result == null) {
      return <Loading variant="skeleton" lines={6} label={content.resultsLabel} />;
    }
    if (result.items.length === 0) {
      return (
        <EmptyState
          icon={<Icon name="search-remove" size="featured" tone="primary" decorative />}
          title={content.empty.title}
          description={content.empty.body}
          action={
            hasActiveDirectoryFilters(filters) ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleFiltersChange(DEFAULT_DIRECTORY_FILTERS)}
              >
                {content.filters.clear}
              </Button>
            ) : undefined
          }
        />
      );
    }
    return (
      <div aria-busy={loading || undefined}>
        <ul className={styles.grid} aria-label={content.resultsLabel}>
          {result.items.map((trainer) => (
            <li key={trainer.id} className={styles.gridItem}>
              <TrainerCard trainer={trainer} content={content} locale={locale} />
            </li>
          ))}
        </ul>
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
    <Section aria-labelledby="eh-directory-title">
      <Container>
        {/* Branded pattern hero — marketing composition over the token tint. */}
        {/*
          Editorial masthead (FADS Expert Hub kit, EH-PUB-02): a flat tint, an
          oversized heading, and the directory's own counts set beside it
          rather than beneath. The pattern is gone — at `display-xl` the
          heading is the page's texture, and a second one behind it competes.
        */}
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <span className={styles.eyebrow}>{content.eyebrow}</span>
              <Typography as="h1" id="eh-directory-title" variant="display-xl" tabIndex={-1}>
                {content.title}
              </Typography>
              <Typography as="p" variant="text-lg" color="muted" className={styles.heroLead}>
                {content.description}
              </Typography>
            </div>
            {stats != null && (
              <dl className={styles.stats}>
                {stats.map((stat) => (
                  <div key={stat.id} className={styles.stat}>
                    {/* The number reads first and the label second, but the
                        definition list keeps `dt` before `dd` in the DOM —
                        `order` moves them visually without lying to a screen
                        reader about which is the term. */}
                    <dt className={styles.statLabel}>{stat.label}</dt>
                    <dd className={styles.statValue}>{formatCount(stat.value, locale)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        <div className={styles.filters}>
          <DirectoryFilterBar
            content={content}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {result != null && (
          <Typography as="p" variant="text-sm" color="muted" className={styles.count} role="status">
            {content.resultsCount(result.items.length, result.totalCount)}
          </Typography>
        )}

        <div className={styles.resultsRegion}>{resultsRegion()}</div>
      </Container>
    </Section>
  );
}
