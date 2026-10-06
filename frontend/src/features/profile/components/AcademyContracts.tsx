import { Alert } from '@ds/composite';
import { Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ProfileContent } from '../profile.content';
import type { AcademyContractDto } from '../profile.types';
import styles from './AcademyContracts.module.css';
import { formatDate as formatLocaleDate } from '../../../shared/formatting';

/**
 * The trainer contracts the Financial Academy holds.
 *
 * ⚠️ **These are NOT the Expert Hub agreement, and the component says so
 * before it lists anything.** Whether a FAST «trainer contract» is the same
 * artefact as an Expert Hub agreement is an open question with `BR-1201`
 * behind it — so this is read-only, sourced, and offers no action. FAST
 * exposes approve, refuse and download; Expert Hub calls none of them, and a
 * button here would imply otherwise.
 */
export function AcademyContracts({
  contracts,
  content,
  locale,
}: {
  readonly contracts: readonly AcademyContractDto[];
  readonly content: ProfileContent;
  readonly locale: Locale;
}) {
  const copy = content.academyRecords;

  // The Academy holds none — which is a fact about them, not a gap here.
  if (contracts.length === 0) {
    return null;
  }

  return (
    <div className={styles.stack}>
      <Typography as="p" variant="text-sm" weight="bold">
        {copy.contractsHeading}
      </Typography>

      {/* Said once, at the top, before any contract is read — so nobody
          mistakes one of these for their Expert Hub agreement. */}
      <Alert tone="info" surface="tinted" role="note">
        {copy.contractsNote}
      </Alert>

      <ul className={styles.list}>
        {contracts.map((contract, index) => (
          <li key={contract.reference ?? `contract-${index}`} className={styles.item}>
            <Typography as="span" variant="text-sm" weight="bold">
              <bdi>{contract.reference ?? copy.contractUnnamed}</bdi>
            </Typography>

            {contract.status != null && (
              <Tag variant="neutral" size="xs">
                <bdi>{contract.status}</bdi>
              </Tag>
            )}

            {/* ⚠️ Each date in its own element. A range interpolated into one
                string reorders into nonsense in Arabic — `D-21`, which
                produced «سبتمبر ٣١٢٠٢٦ م» the last time it was missed. */}
            {contract.startsAt != null && contract.endsAt != null && (
              <span className={styles.period}>
                <time dateTime={contract.startsAt}>{formatDate(contract.startsAt, locale)}</time>
                <span aria-hidden="true"> — </span>
                <time dateTime={contract.endsAt}>{formatDate(contract.endsAt, locale)}</time>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The reader's own calendar — Hijri in Arabic, as everywhere else here. */
function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    dateStyle: 'medium',
  });
}
