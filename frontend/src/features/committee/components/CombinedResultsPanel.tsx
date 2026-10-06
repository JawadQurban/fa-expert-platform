import { Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { localized } from '../../../shared/types/localizedText';
import type { CommitteeContent } from '../committee.content';
import type { ServiceOutcomeContextDto } from '../committee.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './CombinedResultsPanel.module.css';
import { formatNumber as formatLocaleNumber } from '../../../shared/formatting';

/**
 * J-09/F3/AC-2 — the context a committee member needs to decide: the initial
 * screening result together with the **consolidated final** interview result, or
 * the exemption status and reason where J-08 applied.
 *
 * Individual member evaluations are deliberately absent — the journey says the
 * committee sees the consolidated figure, not the raw per-member scores, and the
 * contract carries no field for them.
 *
 * Per-service figures are shown because that is how they were produced, but the
 * panel closes by restating that the committee's own decision is on the
 * application **as a whole** (`BR-0209`), so the breakdown is not mistaken for a
 * set of per-service votes.
 */
function formatNumber(value: number, locale: Locale): string {
  return formatLocaleNumber(value, locale, {
    maximumFractionDigits: 2,
  });
}

export function CombinedResultsPanel({
  context,
  content,
  locale,
}: {
  readonly context: readonly ServiceOutcomeContextDto[];
  readonly content: CommitteeContent;
  readonly locale: Locale;
}) {
  const copy = content.context;

  return (
    <Panel title={copy.heading} titleId="eh-committee-context" icon="presentation-bar-chart-01">
      <Typography as="p" variant="text-sm" color="muted">
        {copy.description}
      </Typography>

      <div className={styles.grid}>
        {context.map((entry) => (
          <div key={entry.service} className={styles.service}>
            <div className={styles.serviceHead}>
              <Typography as="h3" variant="text-sm" weight="bold">
                {content.services[entry.service]}
              </Typography>
              {entry.exempted && (
                <Tag variant="information" size="sm">
                  {copy.exemptedLabel}
                </Tag>
              )}
            </div>

            <dl className={styles.figures}>
              <div className={styles.figure}>
                <dt>
                  <Typography as="span" variant="text-xs" color="muted">
                    {copy.screeningLabel}
                  </Typography>
                </dt>
                <dd>
                  <Typography as="span" variant="text-md" weight="bold">
                    {copy.outOf(formatNumber(entry.screeningScore, locale), '100')}
                  </Typography>
                </dd>
              </div>

              <div className={styles.figure}>
                <dt>
                  <Typography as="span" variant="text-xs" color="muted">
                    {entry.exempted ? copy.exemptionReasonLabel : copy.interviewLabel}
                  </Typography>
                </dt>
                <dd>
                  {entry.exempted ? (
                    <Typography as="span" variant="text-sm" weight="semibold">
                      {entry.exemptionReason == null
                        ? '—'
                        : localized(entry.exemptionReason, locale)}
                    </Typography>
                  ) : (
                    <Typography as="span" variant="text-md" weight="bold">
                      {copy.outOf(
                        formatNumber(entry.interviewAverage ?? 0, locale),
                        formatNumber(entry.interviewMaxScore, locale)
                      )}
                    </Typography>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* `BR-0209` — the breakdown informs one decision on the whole application. */}
      <Typography as="p" variant="text-xs" color="muted">
        {copy.wholeApplicationNote}
      </Typography>
    </Panel>
  );
}
