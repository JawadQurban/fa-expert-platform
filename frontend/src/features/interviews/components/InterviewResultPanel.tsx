import { Alert } from '@ds/composite';
import { Tag, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { InterviewsContent } from '../interviews.content';
import type { CommitteeMemberResponseDto, ServiceInterviewResultDto } from '../interview.types';
import { pendingMembers } from '../interview.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './InterviewResultPanel.module.css';
import { formatNumber as formatLocaleNumber } from '../../../shared/formatting';

/**
 * J-07/F2 — the consolidated interview result.
 *
 * `result === null` is the contract's way of saying "not every member has
 * responded yet" (`BR-0220`, AC-1). This component renders that as a named
 * pending state listing the outstanding members — it never shows a partial
 * average, because the contract never produces one.
 *
 * When the result does exist, each service is shown separately (AC-2) alongside
 * how many evaluations fed the average and how many non-attendance entries were
 * excluded — the exclusion is stated, not silently applied.
 */
function formatNumber(value: number, locale: Locale): string {
  return formatLocaleNumber(value, locale, {
    maximumFractionDigits: 2,
  });
}

export function InterviewResultPanel({
  result,
  committee,
  content,
  locale,
}: {
  readonly result: readonly ServiceInterviewResultDto[] | null;
  readonly committee: readonly CommitteeMemberResponseDto[];
  readonly content: InterviewsContent;
  readonly locale: Locale;
}) {
  const copy = content.result;

  if (result == null) {
    const outstanding = pendingMembers(committee)
      .map((member) => member.name)
      .join(locale === 'ar' ? '، ' : ', ');
    return (
      <Panel title={copy.heading} titleId="eh-interview-result" icon="presentation-bar-chart-01">
        <Alert tone="info" surface="tinted" title={copy.pendingTitle} role="status">
          {copy.pendingBody(outstanding)}
        </Alert>
      </Panel>
    );
  }

  return (
    <Panel title={copy.heading} titleId="eh-interview-result" icon="presentation-bar-chart-01">
      <Typography as="p" variant="text-sm" color="muted">
        {copy.description}
      </Typography>

      <div className={styles.grid}>
        {result.map((entry) => {
          const passed = entry.passed;
          return (
            <div key={entry.service} className={styles.result}>
              <Typography as="h3" variant="text-sm" weight="bold">
                {copy.averageOf(content.services[entry.service])}
              </Typography>
              <p className={styles.score}>
                <span className={styles.scoreValue}>{formatNumber(entry.average, locale)}</span>
                <Typography as="span" variant="text-sm" color="muted">
                  {copy.outOf(
                    formatNumber(entry.average, locale),
                    formatNumber(entry.maxScore, locale)
                  )}
                </Typography>
              </p>
              {passed != null && entry.passThreshold != null && (
                <Tag variant={passed ? 'success' : 'warning'} size="sm">
                  {passed
                    ? copy.thresholdMet(formatNumber(entry.passThreshold, locale))
                    : copy.thresholdNotMet(formatNumber(entry.passThreshold, locale))}
                </Tag>
              )}
              <Typography as="p" variant="text-xs" color="muted">
                {copy.counted(entry.countedEvaluations)}
                {entry.excludedNonAttendance > 0 &&
                  ` · ${copy.excluded(entry.excludedNonAttendance)}`}
              </Typography>
            </div>
          );
        })}
      </div>

      <Typography as="p" variant="text-xs" color="muted">
        {copy.excludedNote}
      </Typography>
      {result.some((entry) => entry.passThreshold != null) && (
        <Typography as="p" variant="text-xs" color="muted">
          {copy.thresholdNote}
        </Typography>
      )}
    </Panel>
  );
}
