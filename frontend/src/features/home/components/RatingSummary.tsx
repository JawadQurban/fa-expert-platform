import { Alert, Rating } from '@ds/composite';
import { Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { HomeContent } from '../home.content';
import type { PortalHomeDto } from '../home.types';
import styles from './RatingSummary.module.css';
import { formatDate as formatLocaleDate, formatNumber } from '../../../shared/formatting';

/**
 * P-06 Rating Summary (personal home) — the **calculated** overall indicator
 * (`02D`), never raw MTM, never editable. Handles the documented states (`§11`):
 * `calculated`, `pending` (being computed → polite live region), `unavailable`.
 */
function formatScore(value: number, locale: Locale): string {
  return formatNumber(value, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    dateStyle: 'medium',
  });
}

export function RatingSummary({
  home,
  content,
  locale,
}: {
  readonly home: PortalHomeDto;
  readonly content: HomeContent;
  readonly locale: Locale;
}) {
  if (home.ratingState === 'pending') {
    return (
      <Alert tone="info" role="status">
        {content.rating.pending}
      </Alert>
    );
  }
  if (home.ratingState === 'unavailable' || home.overallRating == null) {
    return (
      <Typography as="p" variant="text-md" color="muted">
        {home.hasActivity ? content.rating.unavailable : content.rating.notRated}
      </Typography>
    );
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.score}>{formatScore(home.overallRating, locale)}</span>
      <Rating
        value={home.overallRating}
        size="lg"
        brand
        label={content.rating.ariaLabel(home.overallRating)}
      />
      {home.ratingLastRefreshedAt != null && (
        <Typography as="p" variant="text-xs" color="muted">
          {content.rating.lastRefreshed(formatDate(home.ratingLastRefreshedAt, locale))}
        </Typography>
      )}
    </div>
  );
}
