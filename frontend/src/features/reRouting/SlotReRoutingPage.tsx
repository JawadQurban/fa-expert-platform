import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Loading } from '@ds/composite';
import { Button, Checkbox, Icon, Select, Tag, TextInput, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import { formatDate } from '../../shared/formatting';
import type { Result } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { localized } from '../../shared/types/localizedText';
import {
  isFullRejection,
  poolSizeFor,
  validatePool,
  validatePoolDecision,
  type CandidateDecision,
  type MatchCandidateDto,
  type MatchingRunDto,
  type PoolValidationCode,
} from '../assignments/matching.types';
import { getReRoutingService } from './reRoutingService';
import { getReRoutingContent, type ReRoutingContent } from './reRouting.content';
import {
  RE_MATCH_HEADCOUNT,
  SLOT_CYCLE_STATUS,
  type PreviousOfferOutcome,
  type SlotActionErrorCode,
  type SlotCycleDto,
} from './reRouting.types';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { RecordHead } from '../../shared/workspace/RecordHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './SlotReRoutingPage.module.css';
import { formatNumber } from '../../shared/formatting';

/**
 * EH-INT-09d — slot re-routing (**journey J-19**), at
 * `/expert-hub/internal/assignments/:requestId/slots/:slotNumber`.
 *
 * J-19 is J-17 run again, narrowed to one slot, and the narrowing is what the
 * page is about:
 *
 * - **F2/AC-1** — every action on this page names the slot. There is no
 *   request-wide re-match here, because the contract has none.
 * - **F2/AC-2** — the request's other slots are shown, *stated as unaffected*,
 *   and carry no controls. A confirmed slot with a button beside it would invite
 *   exactly the reopening the AC forbids.
 * - **F2/AC-3** — the candidates who already refused are listed **with a note
 *   that they are not excluded**. Staff who see a familiar name come back in the
 *   ranking would otherwise report it as a bug.
 * - **F3/AC-3** — the page says the cycle repeats without limit, so a slot that
 *   exhausts twice does not read as a dead end. There is no escalation to offer.
 *
 * The approval half is J-17's own — same types, same validators, same
 * one-batch/one-decision-per-candidate rules (P-82).
 */

type Phase = 'loading' | 'error' | 'no-cycle' | 'ready';

const OUTCOME_TAG = {
  'awaiting-response': 'information',
  accepted: 'success',
  rejected: 'neutral',
  expired: 'warning',
} as const satisfies Record<PreviousOfferOutcome, string>;

/** A `409` means the slot moved on; a `400` names its rule; anything else is generic. */
function actionErrorText(error: ExpertHubApiError, content: ReRoutingContent): string {
  if (error.status === 409) {
    return content.errors.staleState;
  }
  const byCode: Readonly<Partial<Record<string, string>>> = content.errors.server;
  return byCode[error.message as SlotActionErrorCode] ?? content.errors.actionFailed;
}

export default function SlotReRoutingPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getReRoutingContent(locale), [locale]);
  const { requestId, slotNumber } = useParams();
  const slot = Number(slotNumber);
  const service = getReRoutingService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [cycle, setCycle] = useState<SlotCycleDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [run, setRun] = useState<MatchingRunDto | null>(null);
  const [running, setRunning] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<readonly MatchCandidateDto[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [decisions, setDecisions] = useState<Record<string, CandidateDecision>>({});
  const [ranks, setRanks] = useState<Record<string, string>>({});
  const [issues, setIssues] = useState<readonly PoolValidationCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<ExpertHubApiError | null>(null);

  const applyCycle = (result: Result<SlotCycleDto, ExpertHubApiError>) => {
    if (!result.ok) {
      setPhase(result.error.status === 404 ? 'no-cycle' : 'error');
      return;
    }
    setCycle(result.value);
    // F2/AC-2 — a slot that never ran out has no re-routing cycle to open.
    setPhase(result.value.status == null && !result.value.exhausted ? 'no-cycle' : 'ready');
  };

  /** The pool actions answer with the pool, so the cycle is always re-read. */
  const refreshCycle = (id: string) => service.getSlotCycle(id, slot).then(applyCycle);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    if (requestId == null || !Number.isInteger(slot)) {
      setPhase('no-cycle');
      return;
    }
    void service.getSlotCycle(requestId, slot).then((result) => {
      if (!cancelled) {
        applyCycle(result);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, slotNumber, reloadKey]);

  useEffect(() => {
    if (cycle != null) {
      document.title = content.documentTitle(cycle.reference, cycle.slotNumber);
    }
  }, [cycle, content]);

  useEffect(() => {
    if (phase === 'ready') {
      document.getElementById('eh-rerouting-title')?.focus();
    }
  }, [phase]);

  const runEngine = () => {
    if (requestId == null) {
      return;
    }
    setRunning(true);
    void service.runSlotMatching(requestId, slot).then((result) => {
      setRunning(false);
      if (result.ok) {
        setRun(result.value);
      }
    });
  };

  const searchManual = (query: string) => {
    setManualQuery(query);
    if (requestId == null) {
      return;
    }
    void service.searchSlotCandidates(requestId, slot, query).then((result) => {
      if (result.ok) {
        setManualResults(result.value);
      }
    });
  };

  const toggle = (trainerId: string) => {
    setIssues([]);
    setSelected((current) =>
      current.includes(trainerId)
        ? current.filter((id) => id !== trainerId)
        : [...current, trainerId]
    );
  };

  const send = () => {
    if (requestId == null) {
      return;
    }
    const found = validatePool(selected, RE_MATCH_HEADCOUNT);
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    setBusy(true);
    setActionError(null);
    void service
      .sendSlotPool(requestId, slot, { trainerIds: selected })
      .then(async (result) => {
        if (result.ok) {
          setSelected([]);
          setRun(null);
        } else {
          setActionError(result.error);
        }
        if (result.ok || result.error.status === 409) {
          await refreshCycle(requestId);
        }
      })
      .finally(() => setBusy(false));
  };

  const submitDecision = () => {
    if (requestId == null || cycle == null) {
      return;
    }
    const entries = cycle.pool.members.map((member) => ({
      trainerId: member.trainerId,
      decision: decisions[member.trainerId] ?? 'pending',
    }));
    const decided = entries.filter(
      (entry): entry is { trainerId: string; decision: 'approved' | 'rejected' } =>
        entry.decision !== 'pending'
    );
    const approvedIds = decided
      .filter((entry) => entry.decision === 'approved')
      .map((entry) => entry.trainerId);
    const preferenceOrder = [...approvedIds].sort(
      (a, b) => Number(ranks[a] ?? '99') - Number(ranks[b] ?? '99')
    );

    const input = { decisions: decided, preferenceOrder };
    const found = validatePoolDecision(input, cycle.pool.members);
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    setBusy(true);
    setActionError(null);
    void service
      .decideSlotPool(requestId, slot, input)
      .then(async (result) => {
        if (result.ok) {
          setDecisions({});
          setRanks({});
        } else {
          setActionError(result.error);
        }
        if (result.ok || result.error.status === 409) {
          await refreshCycle(requestId);
        }
      })
      .finally(() => setBusy(false));
  };

  if (phase === 'loading') {
    return (
      <WorkspacePage label={content.heading}>
        <Loading variant="skeleton" lines={6} label={content.heading} />
      </WorkspacePage>
    );
  }

  if (phase !== 'ready' || cycle == null || requestId == null) {
    const copy =
      phase === 'no-cycle'
        ? { title: content.errors.noCycleTitle, body: content.errors.noCycleBody }
        : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={phase === 'error' ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button
            variant="secondary"
            size="md"
            href={
              requestId == null
                ? expertHubPaths.internalAssignments
                : expertHubPaths.internalAssignmentMatching(requestId)
            }
          >
            {content.errors.backToRequest}
          </Button>
        }
      />
    );
  }

  // A slot exhausted before cycles were recorded has no status yet, and is
  // exactly as exhausted as one that has.
  const status = cycle.status ?? SLOT_CYCLE_STATUS.exhausted;
  const needsCandidates = status === SLOT_CYCLE_STATUS.exhausted;
  const dateOf = (iso: string) => formatDate(iso, locale);
  const requiredPool = poolSizeFor(RE_MATCH_HEADCOUNT);
  const refusedIds = new Set(cycle.previouslyOffered.map((entry) => entry.trainerId));
  const selectable = run == null ? manualResults : [...run.ranked, ...manualResults];
  const deduped = selectable.filter(
    (candidate, index, all) =>
      all.findIndex((other) => other.trainerId === candidate.trainerId) === index
  );

  const priceFor = (candidate: MatchCandidateDto) => {
    const value = candidate.price.inClass ?? candidate.price.online;
    return value == null
      ? content.priceUnavailable
      : `${formatNumber(value, locale)} ${candidate.price.currency}`;
  };

  return (
    <WorkspacePage labelledBy="eh-rerouting-title">
      <Breadcrumbs
        items={[
          { label: content.breadcrumbList, href: expertHubPaths.internalAssignments },
          {
            label: content.breadcrumbRequest,
            href: expertHubPaths.internalAssignmentMatching(requestId),
          },
          { label: content.slotLabel(cycle.slotNumber) },
        ]}
        label={content.breadcrumbLabel}
      />

      <RecordHead
        titleId="eh-rerouting-title"
        title={content.heading}
        icon="git-compare"
        meta={[<bdi>{`${cycle.reference} — ${content.slotLabel(cycle.slotNumber)}`}</bdi>]}
        tags={
          <>
            <Tag variant={status === SLOT_CYCLE_STATUS.decided ? 'success' : 'warning'} size="sm">
              {content.statuses[status]}
            </Tag>
            {cycle.cycleNumber > 0 && (
              <Tag variant="neutral" size="sm">
                {content.cycleLabel(cycle.cycleNumber)}
              </Tag>
            )}
            {cycle.confirmed && (
              <Tag variant="success" size="sm">
                {content.siblingStates.confirmed}
              </Tag>
            )}
          </>
        }
      />

      {actionError != null && (
        <Alert tone="error" surface="tinted" role="alert">
          {actionErrorText(actionError, content)}
        </Alert>
      )}
      {issues.length > 0 && (
        <Alert tone="error" surface="tinted" role="alert">
          {issues[0] === 'pool-size-wrong'
            ? content.errors.poolSizeWrong
            : issues[0] === 'decisions-incomplete'
              ? content.errors.decisionsIncomplete
              : content.errors.rankingMismatch}
        </Alert>
      )}

      {/* ── F1 — why this page exists, and F3/AC-3's no-limit rule ────── */}
      {needsCandidates && (
        <Alert tone="warning" surface="tinted" role="status" title={content.exhaustedTitle}>
          {content.exhaustedBody}
        </Alert>
      )}

      {/* ── F2/AC-1 — the slot-scoped run, the action, first ──────────── */}
      {needsCandidates &&
        (cycle.viewer.canMatch ? (
          <>
            <Panel
              title={content.matchHeading}
              titleId="eh-rerouting-match"
              actions={
                <Button variant="primary" size="md" disabled={running} onClick={runEngine}>
                  {running ? content.running : content.runEngine}
                </Button>
              }
            >
              <Typography as="p" variant="text-xs" color="muted">
                {content.matchNote}
              </Typography>
              <Alert tone="info" surface="tinted" role="note">
                {content.poolSizeNote(requiredPool)}
              </Alert>
              {run != null && (
                <>
                  {/* `DM-GAP-05` — the weights are unapproved; name the model. */}
                  <Typography as="p" variant="text-xs" color="muted">
                    {content.modelVersion(run.model.version)}
                  </Typography>
                  {run.model.tieBreakNote != null && (
                    <Typography as="p" variant="text-xs" color="muted">
                      {localized(run.model.tieBreakNote, locale)}
                    </Typography>
                  )}
                </>
              )}

              {deduped.length > 0 && (
                <ul className={styles.candidates}>
                  {deduped.map((candidate) => (
                    <li key={candidate.trainerId} className={styles.candidate}>
                      <Checkbox
                        label={candidate.name}
                        checked={selected.includes(candidate.trainerId)}
                        onChange={() => toggle(candidate.trainerId)}
                      />
                      <div className={styles.candidateMeta}>
                        <Tag variant="information" size="xs">
                          {`${content.scoreLabel}: ${candidate.totalScore.toFixed(2)}`}
                        </Tag>
                        {candidate.scores.map((score) => (
                          <Tag key={score.criterion} variant="neutral" size="xs">
                            {`${content.criteria[score.criterion]} ${score.weighted.toFixed(2)}`}
                          </Tag>
                        ))}
                        {/* F2/AC-3 — flagged, never filtered. */}
                        {refusedIds.has(candidate.trainerId) && (
                          <Tag variant="warning" size="xs">
                            {content.returningCandidate}
                          </Tag>
                        )}
                      </div>
                      <Typography as="span" variant="text-sm">
                        {`${content.priceLabel}: ${priceFor(candidate)}`}
                      </Typography>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {run != null && run.excluded.length > 0 && (
              <Panel title={content.excludedHeading} titleId="eh-rerouting-excluded">
                <Typography as="p" variant="text-xs" color="muted">
                  {content.excludedNote}
                </Typography>
                <ul className={styles.plainList}>
                  {run.excluded.map((candidate) => (
                    <li key={candidate.trainerId} className={styles.rowBetween}>
                      <Typography as="span" variant="text-sm">
                        {candidate.name}
                      </Typography>
                      <span className={styles.candidateMeta}>
                        {candidate.reasons.map((reason) => (
                          <Tag key={reason} variant="error" size="xs">
                            {content.exclusionReasons[reason]}
                          </Tag>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel>
              <TextInput
                label={content.manualSearchLabel}
                type="search"
                value={manualQuery}
                onChange={(event) => searchManual(event.target.value)}
              />
              <Typography as="p" variant="text-sm" weight="bold">
                {content.selectedCount(selected.length, requiredPool)}
              </Typography>
              <div className={styles.actions}>
                <Button
                  variant="primary"
                  size="md"
                  disabled={busy || selected.length !== requiredPool}
                  onClick={send}
                >
                  {content.sendPool}
                </Button>
              </div>
            </Panel>
          </>
        ) : (
          <Alert tone="info" surface="tinted" role="status">
            {content.notAuthorized}
          </Alert>
        ))}

      {/* ── F3/AC-1 — the fresh approval cycle, exactly as J-17/F4 ────── */}
      {status === SLOT_CYCLE_STATUS.awaitingApproval && cycle.pool.status === 'sent' && (
        <Panel
          shape="inline"
          title={cycle.viewer.canApprove ? content.decisionHeading : undefined}
          titleId="eh-rerouting-decision"
          description={cycle.viewer.canApprove ? content.decisionNote : undefined}
        >
          {cycle.viewer.canApprove ? (
            <>
              <ul className={styles.candidates}>
                {cycle.pool.members.map((member) => {
                  const decision = decisions[member.trainerId] ?? 'pending';
                  return (
                    <li key={member.trainerId} className={styles.candidate}>
                      <Typography as="span" variant="text-sm" weight="bold">
                        {member.name}
                      </Typography>
                      <div className={styles.actions}>
                        <Button
                          variant={decision === 'approved' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() =>
                            setDecisions((current) => ({
                              ...current,
                              [member.trainerId]: 'approved',
                            }))
                          }
                        >
                          {content.approve}
                        </Button>
                        <Button
                          variant={decision === 'rejected' ? 'primary' : 'tertiary'}
                          size="sm"
                          onClick={() =>
                            setDecisions((current) => ({
                              ...current,
                              [member.trainerId]: 'rejected',
                            }))
                          }
                        >
                          {content.reject}
                        </Button>
                      </div>
                      {decision === 'approved' && (
                        <Select
                          label={content.rankLabel(member.name)}
                          value={ranks[member.trainerId] ?? ''}
                          onValueChange={(value) =>
                            setRanks((current) => ({ ...current, [member.trainerId]: value }))
                          }
                          options={cycle.pool.members.map((_, index) => ({
                            value: String(index + 1),
                            label: String(index + 1),
                          }))}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
              <Typography as="p" variant="text-xs" color="muted">
                {content.rankHint}
              </Typography>
              <div className={styles.actions}>
                <Button variant="primary" size="md" disabled={busy} onClick={submitDecision}>
                  {content.submitDecision}
                </Button>
              </div>
            </>
          ) : (
            <Alert tone="info" surface="tinted" role="status">
              {content.notAuthorized}
            </Alert>
          )}
        </Panel>
      )}

      {/* ── F3/AC-2 — approved, so J-18 restarts for this slot ────────── */}
      {status === SLOT_CYCLE_STATUS.decided && (
        <Alert tone="success" surface="tinted" role="status" title={content.decidedTitle}>
          {content.decidedBody}
        </Alert>
      )}

      {/* ── F3/AC-3 — exhausted again is not a dead end ───────────────── */}
      {needsCandidates &&
        cycle.pool.status === 'decided' &&
        isFullRejection(cycle.pool.members) && (
          <Alert tone="info" surface="tinted" role="status" title={content.fullRejectionTitle}>
            {content.fullRejectionBody}
          </Alert>
        )}

      {/* ── F3/AC-3 — every pass through the cycle, counted not capped ── */}
      {cycle.cycles.length > 0 && (
        <Panel title={content.cyclesHeading} titleId="eh-rerouting-cycles">
          <ul className={styles.plainList}>
            {cycle.cycles.map((entry) => (
              <li key={entry.cycleNumber} className={styles.rowBetween}>
                <Typography as="span" variant="text-sm">
                  {content.cycleRow(entry.cycleNumber, dateOf(entry.openedAt))}
                </Typography>
                <Tag
                  variant={entry.status === SLOT_CYCLE_STATUS.decided ? 'success' : 'neutral'}
                  size="sm"
                >
                  {content.statuses[entry.status]}
                </Tag>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ── F2/AC-2 — the other slots, visible and untouchable ────────── */}
      {cycle.siblings.length > 0 && (
        <Panel title={content.siblingsHeading} titleId="eh-rerouting-siblings">
          <Typography as="p" variant="text-xs" color="muted">
            {content.siblingsNote}
          </Typography>
          <ul className={styles.plainList}>
            {cycle.siblings.map((sibling) => (
              <li key={sibling.slotNumber} className={styles.rowBetween}>
                <Typography as="span" variant="text-sm">
                  {content.siblingRow(sibling.slotNumber)}
                </Typography>
                <Tag variant={sibling.state === 'confirmed' ? 'success' : 'neutral'} size="sm">
                  {content.siblingStates[sibling.state]}
                </Tag>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ── F2/AC-3 — who was already offered this slot, and may return ─ */}
      {cycle.previouslyOffered.length > 0 && (
        <Panel title={content.historyHeading} titleId="eh-rerouting-history">
          <Typography as="p" variant="text-xs" color="muted">
            {content.historyNote}
          </Typography>
          <ul className={styles.plainList}>
            {cycle.previouslyOffered.map((entry) => (
              <li key={entry.offerId} className={styles.rowBetween}>
                <Typography as="span" variant="text-sm">
                  <bdi>{content.historyRow(entry.trainerName, dateOf(entry.sentAt))}</bdi>
                </Typography>
                <Tag variant={OUTCOME_TAG[entry.outcome]} size="sm">
                  {content.historyOutcomes[entry.outcome]}
                </Tag>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Typography as="p" variant="text-xs" color="muted">
        {content.noLimitNote}
      </Typography>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="md"
          href={expertHubPaths.internalAssignmentMatching(requestId)}
          iconStart={<Icon name="sidebar-right" size="sm" decorative />}
        >
          {content.errors.backToRequest}
        </Button>
      </div>
    </WorkspacePage>
  );
}
