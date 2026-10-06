import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Card, Loading } from '@ds/composite';
import { Button, Icon, Link, Tag, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import {
  canTerminate,
  ENGAGEMENT_STATUS_TAG,
  engagementStatusLabel,
} from '../../contracts/engagementStatus';
import { getEngagementsContent } from '../engagements/engagements.content';
import { PlanDetailsList } from '../engagements/components/PlanDetailsList';
import { getWithdrawalService } from '../withdrawal/withdrawalService';
import { getWithdrawalContent, terminationErrorText } from '../withdrawal/withdrawal.content';
import { TerminationPanel } from '../withdrawal/components/TerminationPanel';
import { TerminationSummary } from '../withdrawal/components/TerminationSummary';
import {
  TRAINER_WITHDRAWAL_REASONS,
  type WithdrawFromEngagementInput,
} from '../withdrawal/withdrawal.types';
import { getExecutionService } from './executionService';
import { getExecutionContent } from './execution.content';
import type { EngagementDetailDto } from './engagementDetail.types';
import styles from './EngagementDetailPage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { dateFormatter, numberFormatter } from '../../shared/formatting';

/**
 * EH-TP-07c — one engagement, followed through execution (**journey J-21**), at
 * `/expert-hub/engagements/:engagementId`.
 *
 * The page reads; the only action on it is J-22's withdrawal. What it is careful
 * about:
 *
 * - **The status explains itself.** F5/AC-1 completes an engagement by date
 *   alone, "regardless of any later administrative action", so a trainer whose
 *   engagement moved is told what moved it.
 * - **A missing source is named, never zeroed.** Enrolment and attendance
 *   (`Q20`) and evaluations (`Q29`) arrive as `available: false`; the venue and
 *   the meeting link do not reach the API at all. Each says so.
 * - **Names only**, and the page says why (F3/AC-2).
 * - **Evaluations render regardless of status** (F6/AC-4).
 *
 * **J-22/F1** hangs here too, because that is where its user flow puts it: the
 * trainer opens the engagement from "My Engagements", *then* withdraws. The
 * action is offered only while the engagement is upcoming — the server refuses
 * anything else — and once an engagement has ended, this page shows **why**
 * instead (F3/AC-6).
 */

type Phase = 'loading' | 'error' | 'not-found' | 'ready';

export default function EngagementDetailPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getExecutionContent(locale), [locale]);
  // F1/AC-1 — the request block is the same renderer J-18's offer used, over
  // the same payload, so what was accepted and what is delivered cannot drift.
  const sharedContent = useMemo(() => getEngagementsContent(locale), [locale]);
  const { engagementId } = useParams();
  const service = getExecutionService();
  const withdrawalService = getWithdrawalService();
  const withdrawalCopy = useMemo(() => getWithdrawalContent(locale), [locale]);

  const [phase, setPhase] = useState<Phase>('loading');
  const [engagement, setEngagement] = useState<EngagementDetailDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  /**
   * Set on the first `ready` render. Two duties, both keyed to the same moment:
   * the title takes focus once, and from then on a reload keeps the view
   * standing instead of replacing it with a skeleton.
   */
  const loadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    /*
      Withdrawing bumps `reloadKey`, so this effect also runs on an action.
      Showing the skeleton then blanked the page the moment the trainer
      confirmed, and tore down the `role="status"` confirmation before it had
      reliably been announced — only to rebuild it a tick later. A first
      arrival has nothing to preserve; a reload behind an action does.
    */
    if (!loadedOnce.current) {
      setPhase('loading');
    }
    if (engagementId == null) {
      setPhase('not-found');
      return;
    }
    void service.getEngagement(engagementId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setEngagement(result.value);
        setPhase('ready');
      } else if (result.error.status === 404) {
        setPhase('not-found');
      } else {
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId, reloadKey]);

  const reference = engagement?.details?.reference ?? engagement?.requestId ?? '';

  useEffect(() => {
    if (reference !== '') {
      document.title = content.documentTitle(reference);
    }
  }, [reference, content]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-engagement-detail-title')?.focus();
    }
  }, [phase]);

  /**
   * J-22/F1 — end this engagement, and only this one (AC-3). The slot goes back
   * to re-matching (AC-5), which the confirmation says so the trainer knows the
   * seat is not being held for them.
   */
  const withdraw = (reason: string, note: string) => {
    if (engagementId == null) {
      return;
    }
    const input =
      reason === 'other'
        ? ({ reason: 'other', note } as WithdrawFromEngagementInput)
        : ({ reason } as WithdrawFromEngagementInput);
    setWithdrawBusy(true);
    setWithdrawError(null);
    void withdrawalService.withdrawFromEngagement(engagementId, input).then((result) => {
      setWithdrawBusy(false);
      if (result.ok) {
        setWithdrawing(false);
        setWithdrawn(true);
        setReloadKey((key) => key + 1);
        return;
      }
      setWithdrawError(terminationErrorText(withdrawalCopy, 'withdraw', result.error));
      if (result.error.status === 409) {
        // The engagement moved on (started, ended, or past its notice period):
        // re-read it, so the page stops offering what the server refused.
        setWithdrawing(false);
        setReloadKey((key) => key + 1);
      }
    });
  };

  if (phase === 'loading') {
    return (
      <Section aria-label={content.heading}>
        <Container>
          <Loading variant="skeleton" lines={6} label={content.heading} />
        </Container>
      </Section>
    );
  }

  if (phase !== 'ready' || engagement == null) {
    const messages =
      phase === 'not-found'
        ? { title: content.errors.notFoundTitle, body: content.errors.notFoundBody }
        : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={messages.title}
        body={messages.body}
        onRetry={phase === 'error' ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.engagements}>
            {content.errors.back}
          </Button>
        }
      />
    );
  }

  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
  });
  const decimals = numberFormatter(locale, {
    maximumFractionDigits: 1,
  });
  const { details, enrolment, attendance, evaluations } = engagement;
  const remote =
    details?.deliveryMechanism === 'online' || details?.deliveryMechanism === 'live-stream';

  return (
    <Section aria-labelledby="eh-engagement-detail-title">
      <Container>
        <Breadcrumbs
          items={[
            { label: content.breadcrumbEngagements, href: expertHubPaths.engagements },
            { label: reference },
          ]}
          label={content.breadcrumbLabel}
        />

        <Card effect="shadow" className={styles.summary}>
          <div className={styles.header}>
            <Typography as="h1" id="eh-engagement-detail-title" variant="display-md" tabIndex={-1}>
              {content.heading}
            </Typography>
            <Typography as="p" variant="text-md" color="muted">
              {/* Single-language data from the request — rendered as given. */}
              <bdi>
                {details?.programName == null ? reference : `${reference} — ${details.programName}`}
              </bdi>
            </Typography>
            <div className={styles.headerTags}>
              <Tag variant={ENGAGEMENT_STATUS_TAG[engagement.status]} size="md">
                {engagementStatusLabel(engagement.status, locale)}
              </Tag>
              <Typography as="span" variant="text-sm" color="muted">
                {content.confirmedAt(dates.format(new Date(engagement.confirmedAt)))}
              </Typography>
            </div>
            {/* F5/AC-1 — say what moved it, so nobody assumes someone did. */}
            <Typography as="p" variant="text-sm" color="muted">
              {content.statusExplanation[engagement.status]}
            </Typography>
          </div>
        </Card>

        {/* J-22/F3/AC-6 — an engagement that ended early carries its reason
            here, where the trainer will look, rather than only in a notice. */}
        {engagement.termination != null && (
          <TerminationSummary
            termination={engagement.termination}
            content={withdrawalCopy}
            locale={locale}
          />
        )}
        {withdrawn && engagement.termination == null && (
          <Alert tone="info" role="status" title={withdrawalCopy.withdraw.doneTitle}>
            {withdrawalCopy.withdraw.doneBody}
          </Alert>
        )}
        {withdrawError != null && (
          <Alert tone="error" role="alert">
            {withdrawError}
          </Alert>
        )}

        {/* F1/AC-3 — FAST moved the dates; the new ones are what is shown. */}
        {engagement.scheduleChangedAt != null && (
          <Alert tone="warning" role="status" title={content.scheduleChangedTitle}>
            {content.scheduleChangedBody(dates.format(new Date(engagement.scheduleChangedAt)))}
          </Alert>
        )}

        {/* ── F1/AC-1 — the request detail, unchanged ──────────────────── */}
        <Card effect="stroke" className={styles.card}>
          <Typography as="h2" variant="text-lg" weight="bold">
            {content.detailsHeading}
          </Typography>
          <PlanDetailsList details={details} content={sharedContent} locale={locale} />
        </Card>

        {/* ── F2 — the link, or the venue ──────────────────────────────── */}
        <Card effect="stroke" className={styles.card}>
          <Typography as="h2" variant="text-lg" weight="bold">
            {content.locationHeading}
          </Typography>
          {remote ? (
            <>
              <Typography as="p" variant="text-md" weight="bold">
                {content.onlineLabel}
              </Typography>
              {details?.meetingUrl == null ? (
                <Typography as="p" variant="text-sm" color="muted">
                  {content.meetingUnavailable}
                </Typography>
              ) : (
                <Link href={details.meetingUrl}>{content.joinAction}</Link>
              )}
            </>
          ) : (
            <>
              <Typography as="p" variant="text-md" weight="bold">
                {content.venueLabel}
              </Typography>
              {details?.city != null && (
                <Typography as="p" variant="text-md">
                  <bdi>{details.city}</bdi>
                </Typography>
              )}
              <Typography as="p" variant="text-sm" color="muted">
                {content.venueUnavailable}
              </Typography>
            </>
          )}
        </Card>

        {/* ── F3 + F4 — the enrollees, and the attendance ──────────────── */}
        <Card effect="stroke" className={styles.card}>
          <Typography as="h2" variant="text-lg" weight="bold">
            {content.enrolmentHeading}
          </Typography>
          {enrolment.available ? (
            <>
              <Typography as="p" variant="text-md" weight="bold">
                {content.enrolmentCount(enrolment.takers.length)}
              </Typography>
              {/* F3/AC-2 — the restriction is deliberate, and says so. */}
              <Typography as="p" variant="text-sm" color="muted">
                {content.namesOnlyNote}
              </Typography>
              <Typography as="p" variant="text-xs" color="muted">
                {content.sourceNote}
              </Typography>
              {enrolment.takers.length === 0 ? (
                <Typography as="p" variant="text-sm" color="muted">
                  {content.enrolmentEmpty}
                </Typography>
              ) : (
                <ul className={styles.enrollees}>
                  {enrolment.takers.map((taker, index) => (
                    // F3/AC-2 — keyed positionally: there is no identifier on
                    // this type, and adding one just to key a list would be
                    // adding data about a person the journey says we may not hold.
                    <li key={`${String(index)}-${taker.nameAr}`} className={styles.enrollee}>
                      <Typography as="span" variant="text-md">
                        <bdi>{locale === 'en' ? taker.nameEn : taker.nameAr}</bdi>
                      </Typography>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <Typography as="p" variant="text-sm" color="muted">
              {content.enrolmentUnavailable}
            </Typography>
          )}

          <Typography as="h3" variant="text-md" weight="bold">
            {content.attendanceHeading}
          </Typography>
          {!attendance.available && (
            <Typography as="p" variant="text-sm" color="muted">
              {content.attendanceUnavailable}
            </Typography>
          )}
        </Card>

        {/* ── F6 — MTM evaluations, whatever the status ────────────────── */}
        <Card effect="stroke" className={styles.card}>
          <Typography as="h2" variant="text-lg" weight="bold">
            {content.evaluationsHeading}
          </Typography>
          {/* `02D` — raw MTM values, never presented as the calculated rating. */}
          <Typography as="p" variant="text-sm" color="muted">
            {content.evaluationsNote}
          </Typography>
          {!evaluations.available ? (
            <Typography as="p" variant="text-sm" color="muted">
              {content.evaluationsUnavailable}
            </Typography>
          ) : evaluations.items.length === 0 ? (
            <Typography as="p" variant="text-sm" color="muted">
              {content.evaluationsEmpty}
            </Typography>
          ) : (
            <ul className={styles.evaluations}>
              {evaluations.items.map((evaluation) => (
                <li key={evaluation.evaluationId} className={styles.evaluation}>
                  <Typography as="span" variant="text-md" weight="bold">
                    {content.evaluationValue(
                      decimals.format(evaluation.rawValue),
                      decimals.format(evaluation.scaleLow),
                      decimals.format(evaluation.scaleHigh)
                    )}
                  </Typography>
                  {/* F6/AC-3 — the programme is on the record, not inferred. */}
                  <Typography as="span" variant="text-sm" color="muted">
                    <bdi>{content.evaluationProgram(evaluation.programName)}</bdi>
                  </Typography>
                  <Typography as="span" variant="text-xs" color="muted">
                    {content.evaluationReceived(dates.format(new Date(evaluation.receivedAt)))}
                  </Typography>
                  {evaluation.comment != null && (
                    <Typography as="p" variant="text-sm">
                      <bdi>{evaluation.comment}</bdi>
                    </Typography>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ── J-22/F1 — withdrawing, while there is still time ─────────── */}
        {canTerminate(engagement.status) &&
          (withdrawing ? (
            <TerminationPanel
              heading={withdrawalCopy.withdraw.heading}
              intro={withdrawalCopy.withdraw.intro}
              reasonLegend={withdrawalCopy.withdraw.reasonLegend}
              reasons={TRAINER_WITHDRAWAL_REASONS.map((reason) => ({
                value: reason,
                label: withdrawalCopy.withdraw.reasons[reason],
              }))}
              otherValue="other"
              noteLabel={withdrawalCopy.withdraw.noteLabel}
              noteHint={withdrawalCopy.withdraw.noteHint}
              warning={withdrawalCopy.withdraw.warning}
              confirmLabel={withdrawalCopy.withdraw.confirm}
              cancelLabel={withdrawalCopy.withdraw.cancel}
              errors={{
                'reason-required': withdrawalCopy.errors.reasonRequired,
                'note-required': withdrawalCopy.errors.noteRequired,
              }}
              busy={withdrawBusy}
              onConfirm={withdraw}
              onCancel={() => setWithdrawing(false)}
            />
          ) : (
            <div className={styles.actions}>
              <Button variant="secondary" size="md" onClick={() => setWithdrawing(true)}>
                {withdrawalCopy.withdraw.action}
              </Button>
            </div>
          ))}

        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="md"
            href={expertHubPaths.engagements}
            iconStart={<Icon name="sidebar-right" size="sm" decorative />}
          >
            {content.errors.back}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
