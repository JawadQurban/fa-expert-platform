import { Alert, Rating } from '@ds/composite';
import { Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ProfileContent } from '../profile.content';
import type { ProfileRatingsDto } from '../profile.types';
import styles from './RatingsSection.module.css';
import { formatDate as formatLocaleDate, formatNumber } from '../../../shared/formatting';

/**
 * P-06 Ratings — the **calculated** performance indicator (`02D`): a prominent
 * overall tile plus a per-program breakdown. Never the raw MTM value, never
 * editable. Handles the three documented states (`§11`): `calculated`, `pending`
 * (being computed), and `unavailable`.
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

export function RatingsSection({
  ratings,
  content,
  locale,
}: {
  readonly ratings: ProfileRatingsDto;
  readonly content: ProfileContent;
  readonly locale: Locale;
}) {
  if (ratings.state === 'pending') {
    return (
      <Alert tone="info" role="status">
        {content.ratings.pending}
      </Alert>
    );
  }
  if (ratings.state === 'unavailable' || ratings.overall == null) {
    return (
      <Typography as="p" variant="text-md" color="muted">
        {content.ratings.unavailable}
      </Typography>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.overall}>
        <span className={styles.overallScore}>{formatScore(ratings.overall, locale)}</span>
        <Rating
          value={ratings.overall}
          size="lg"
          brand
          label={content.ratings.ratingAria(content.ratings.overallHeading, ratings.overall)}
        />
        <span className={styles.overallLabel}>{content.ratings.overallHeading}</span>
      </div>

      {ratings.programs.length > 0 && (
        <div className={styles.breakdown}>
          <Typography as="h3" variant="text-md" weight="bold">
            {content.ratings.perProgramHeading}
          </Typography>
          <ul className={styles.list}>
            {ratings.programs.map((row) => (
              <li key={row.program} className={styles.row}>
                <span className={styles.program}>{row.program}</span>
                <span className={styles.rowRating}>
                  <Rating
                    value={row.score}
                    size="sm"
                    brand
                    label={content.ratings.ratingAria(row.program, row.score)}
                  />
                  <span className={styles.rowScore}>{formatScore(row.score, locale)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ratings.lastRefreshedAt != null && (
        <Typography as="p" variant="text-xs" color="muted">
          {content.ratings.lastRefreshed(formatDate(ratings.lastRefreshedAt, locale))}
        </Typography>
      )}
    </div>
  );
}
