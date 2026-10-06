import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Loading } from '@ds/composite';
import { Button, Checkbox, Icon, Link, Select, Tag, TextInput, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { localized } from '../../shared/types/localizedText';
import type { AssignmentRequestDetailDto } from './assignment.types';
import {
  candidatesGoingForward,
  isFullRejection,
  poolSizeFor,
  validatePool,
  validatePoolDecision,
  type CandidateDecision,
  type CandidatePoolDto,
  type MatchCandidateDto,
  type MatchingRunDto,
  type MatchingViewerDto,
  type PoolValidationCode,
} from './matching.types';
import { SlotTrackingPanel } from '../engagements/components/SlotTrackingPanel';
import { getAssignmentService } from './assignmentService';
import { getAssignmentsContent } from './assignments.content';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './AssignmentMatchingPage.module.css';
import { formatNumber } from '../../shared/formatting';

/**
 * EH-INT-09 matching workspace — **journey J-17**.
 *
 * The page has two halves because J-17 has two actors, and which half you see is
 * **server-decided** (`viewer`, P-J9): Trainer Management staff build the pool
 * (F1–F3), the requesting party decides on it (F4). J-26 has no document, so
 * nothing here reads a role.
 *
 * The journey's rules that shape this page rather than merely sit behind it:
 *
 * - **F1/AC-2 — an exclusion is not a low rank.** Excluded candidates render in
 *   a separate list *with their reasons*, never mixed into the ranking. Staff
 *   need to see why someone they expected is absent; hiding them entirely would
 *   look like the engine missed them.
 * - **F1/AC-3 — the weighted breakdown is shown.** A ranked list with no visible
 *   reason for the order is a black box, and the weights are unapproved
 *   (`DM-GAP-05`) — so the page names the model version too.
 * - **F2/AC-2 — exactly three per slot.** The send action stays disabled until
 *   the selection is that size, and the count is always visible.
 * - **F3/AC-1 — one batch.** There is one send action for the whole pool and no
 *   per-candidate send anywhere.
 * - **F4/AC-1 — a decision per candidate**, never one verdict on the pool. There
 *   is deliberately no "approve all" control.
 *
 * Laid out as the approved Option B workspace: the head states the pool
 * arithmetic and carries the page's two actions (run the engine, send the
 * batch); the candidates lead, with the selection and the manual path beside.
 */

type Phase = 'loading' | 'error' | 'not-found' | 'ready';

export default function AssignmentMatchingPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getAssignmentsContent(locale), [locale]);
  const copy = content.matching;
  const { requestId } = useParams();
  const service = getAssignmentService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [request, setRequest] = useState<AssignmentRequestDetailDto | null>(null);
  const [pool, setPool] = useState<CandidatePoolDto | null>(null);
  const [viewer, setViewer] = useState<MatchingViewerDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /** Has a load ever succeeded? Gates the skeleton — see the load effect. */
  const loadedOnce = useRef(false);
  /** Has the title taken focus on arrival yet? */
  const titleFocused = useRef(false);
  /** Did the last reload follow a decision, rather than an arrival? */
  const justDecided = useRef(false);

  const [run, setRun] = useState<MatchingRunDto | null>(null);
  const [running, setRunning] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<readonly MatchCandidateDto[]>([]);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [decisions, setDecisions] = useState<Record<string, CandidateDecision>>({});
  const [ranks, setRanks] = useState<Record<string, string>>({});
  const [issues, setIssues] = useState<readonly PoolValidationCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    /*
      Deciding bumps `reloadKey`, so this effect also runs on an action — not
      only on arrival. Showing the skeleton then tore down the whole workspace
      the reader was standing in and rebuilt it, which blanked the page right
      after they nominated and threw their focus to `<body>`. Only a first
      arrival has nothing to preserve, so only a first arrival shows it.
    */
    if (!loadedOnce.current) {
      setPhase('loading');
    }
    if (requestId == null) {
      setPhase('not-found');
      return;
    }
    void Promise.all([service.getRequest(requestId), service.getMatching(requestId)]).then(
      ([requestResult, matchingResult]) => {
        if (cancelled) {
          return;
        }
        if (!requestResult.ok || !matchingResult.ok) {
          setLoadError(
            !requestResult.ok
              ? requestResult.error
              : !matchingResult.ok
                ? matchingResult.error
                : null
          );
          setPhase(requestResult.ok ? 'error' : 'not-found');
          return;
        }
        setRequest(requestResult.value);
        setPool(matchingResult.value.pool);
        setViewer(matchingResult.value.viewer);
        loadedOnce.current = true;
        setPhase('ready');
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, reloadKey]);

  useEffect(() => {
    if (request != null) {
      document.title = copy.documentTitle(request.reference);
    }
  }, [request, copy]);

  /*
    The title takes focus **once, on arrival**. After a decision, focus goes to
    the outcome that decision produced — not back up to the page title, which
    is a move the reader never asked for and, from the bottom of a ~1340px
    page, one a keyboard user then has to undo by hand.

    Keyed on the outcome *appearing* (`pool.status`) rather than on a phase
    bounce: the skeleton no longer runs on an action-triggered reload, so
    `phase` may never leave `ready` for focus to hang off.
  */
  useEffect(() => {
    if (phase !== 'ready') {
      return;
    }
    if (justDecided.current && pool?.status === 'decided') {
      justDecided.current = false;
      document.getElementById('eh-decided-heading')?.focus();
    } else if (!titleFocused.current) {
      titleFocused.current = true;
      document.getElementById('eh-matching-title')?.focus();
    }
  }, [phase, pool?.status]);

  const runEngine = () => {
    if (requestId == null) {
      return;
    }
    setRunning(true);
    void service.runMatching(requestId).then((result) => {
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
    void service.searchCandidates(requestId, query).then((result) => {
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
    if (requestId == null || request == null) {
      return;
    }
    const found = validatePool(selected, request.requiredHeadcount);
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    setBusy(true);
    setActionFailed(false);
    void service.sendPool(requestId, { trainerIds: selected }).then((result) => {
      setBusy(false);
      if (result.ok) {
        setPool(result.value);
        setSelected([]);
      } else {
        setActionFailed(true);
      }
    });
  };

  const submitDecision = () => {
    if (requestId == null || pool == null) {
      return;
    }
    const entries = pool.members.map((member) => ({
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
    // F4/AC-2 — the preference order, read from the per-candidate rank inputs.
    const preferenceOrder = [...approvedIds].sort(
      (a, b) => Number(ranks[a] ?? '99') - Number(ranks[b] ?? '99')
    );

    const input = { decisions: decided, preferenceOrder };
    const found = validatePoolDecision(input, pool.members);
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    setBusy(true);
    setActionFailed(false);
    void service.decidePool(requestId, input).then((result) => {
      setBusy(false);
      if (result.ok) {
        setPool(result.value);
        setDecisions({});
        setRanks({});
        justDecided.current = true;
        setReloadKey((key) => key + 1);
      } else {
        setActionFailed(true);
      }
    });
  };

  // A denial is not a load failure: `P-190`'s gate answers 403 with the
  // feature it wanted, and telling someone their system broke sends them
  // to the wrong person for help.
  const failure = describeLoadFailure(loadError, locale, {
    title: content.errors.loadTitle,
    body: content.errors.loadBody,
  });

  if (phase === 'loading') {
    return (
      <WorkspacePage label={copy.heading}>
        <Loading variant="skeleton" lines={6} label={copy.heading} />
      </WorkspacePage>
    );
  }

  if (phase !== 'ready' || request == null || pool == null || viewer == null) {
    /*
      ⚠️ This branch used to ignore `failure` and print the generic load wording
      with a retry button — so a 403 told the reader their system had broken and
      offered to try again, which produces the same 403. `describeLoadFailure`
      was already computed above and simply went unused.
    */
    return (
      <PageLoadError
        title={failure.title}
        body={failure.body}
        onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.internalAssignments}>
            {content.form.backToList}
          </Button>
        }
      />
    );
  }

  const requiredPool = poolSizeFor(request.requiredHeadcount);
  const deliveryMode = request.pulled?.plan.deliveryMode ?? 'in-class';
  const building = pool.status === 'not-built' && viewer.canMatch;

  /** F3/AC-2 — the price for the mode this plan actually needs. */
  const priceFor = (candidate: { price: MatchCandidateDto['price'] }) => {
    const value = deliveryMode === 'online' ? candidate.price.online : candidate.price.inClass;
    return value == null
      ? copy.priceUnavailable
      : `${formatNumber(value, locale)} ${candidate.price.currency}`;
  };

  const selectable = run == null ? manualResults : [...run.ranked, ...manualResults];
  const deduped = selectable.filter(
    (candidate, index, all) =>
      all.findIndex((other) => other.trainerId === candidate.trainerId) === index
  );

  return (
    <WorkspacePage labelledBy="eh-matching-title">
      <PageHead
        titleId="eh-matching-title"
        title={copy.heading}
        lead={
          <>
            <bdi>{request.reference}</bdi>
            {request.programName != null && ` — ${localized(request.programName, locale)}`}
          </>
        }
        /* F2/AC-2 — the arithmetic, stated before anyone selects anything. */
        summary={copy.poolSizeNote(request.requiredHeadcount, requiredPool)}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: content.form.breadcrumbList, href: expertHubPaths.internalAssignments },
              { label: request.reference },
            ]}
            label={content.form.breadcrumbLabel}
          />
        }
        actions={
          building ? (
            <>
              <Button variant="secondary" size="md" disabled={running} onClick={runEngine}>
                {running ? copy.running : copy.runEngine}
              </Button>
              {/* F3/AC-1 — one action, for the whole pool. */}
              <Button
                variant="primary"
                size="md"
                disabled={busy || selected.length !== requiredPool}
                onClick={send}
              >
                {copy.sendPool}
              </Button>
            </>
          ) : undefined
        }
      />

      {actionFailed && (
        <Alert tone="error" surface="tinted" role="alert">
          {content.errors.submitFailed}
        </Alert>
      )}
      {issues.length > 0 && (
        <Alert tone="error" surface="tinted" role="alert">
          {copy.errors[issues[0]]}
        </Alert>
      )}

      {/* ── F1–F3: building the pool ─────────────────────────────────── */}
      {pool.status === 'not-built' &&
        (viewer.canMatch ? (
          <div className={styles.workspace}>
            <div className={styles.column}>
              <Panel
                title={copy.rankedHeading}
                titleId="eh-matching-ranked"
                /* `DM-GAP-05` — name the model, since its weights are not approved. */
                meta={run != null ? copy.modelVersion(run.model.version) : undefined}
              >
                {run != null && run.model.tieBreakNote != null && (
                  <Typography as="p" variant="text-xs" color="muted">
                    {localized(run.model.tieBreakNote, locale)}
                  </Typography>
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
                            {`${copy.scoreLabel}: ${candidate.totalScore.toFixed(2)}`}
                          </Tag>
                          {/* F1/AC-3 — the breakdown behind the rank. */}
                          {candidate.scores.map((score) => (
                            <Tag key={score.criterion} variant="neutral" size="xs">
                              {`${copy.criteria[score.criterion]} ${score.weighted.toFixed(2)}`}
                            </Tag>
                          ))}
                        </div>
                        <div className={styles.candidateMeta}>
                          <Typography as="span" variant="text-sm">
                            {`${copy.priceLabel}: ${priceFor(candidate)}`}
                          </Typography>
                          <Typography as="span" variant="text-xs" color="muted">
                            {copy.priceSource(candidate.price.agreementReference)}
                          </Typography>
                          {/* F3/AC-2 — the identity card travels with the candidate. */}
                          <Link href={expertHubPaths.internalTrainer(candidate.trainerId)}>
                            {copy.identityCardLink}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {/* F1/AC-2 — exclusions, with reasons, never mixed into the ranking. */}
              {run != null && run.excluded.length > 0 && (
                <Panel title={copy.excludedHeading} titleId="eh-matching-excluded">
                  <Typography as="p" variant="text-xs" color="muted">
                    {copy.excludedNote}
                  </Typography>
                  <ul className={styles.excluded}>
                    {run.excluded.map((candidate) => (
                      <li key={candidate.trainerId} className={styles.excludedRow}>
                        <Typography as="span" variant="text-sm">
                          {candidate.name}
                        </Typography>
                        <span className={styles.candidateMeta}>
                          {candidate.reasons.map((reason) => (
                            <Tag key={reason} variant="error" size="xs">
                              {copy.exclusionReasons[reason]}
                            </Tag>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>

            <div className={styles.column}>
              {/* F2/AC-2 — how far the selection is from a sendable pool. */}
              <Panel>
                <Typography as="p" variant="text-sm" weight="bold">
                  {copy.selectedCount(selected.length, requiredPool)}
                </Typography>
                <Typography as="p" variant="text-xs" color="muted">
                  {copy.sendNote}
                </Typography>
              </Panel>

              {/* F2/AC-1 — the manual path. */}
              <Panel title={copy.manualHeading} titleId="eh-matching-manual">
                <Typography as="p" variant="text-xs" color="muted">
                  {copy.manualDescription}
                </Typography>
                <TextInput
                  label={copy.manualSearchLabel}
                  type="search"
                  value={manualQuery}
                  onChange={(event) => searchManual(event.target.value)}
                />
              </Panel>
            </div>
          </div>
        ) : (
          <Alert tone="info" surface="tinted" role="status">
            {copy.notAuthorized}
          </Alert>
        ))}

      {/* ── F4: the requesting party decides ─────────────────────────── */}
      {pool.status === 'sent' && (
        <Panel
          shape="inline"
          title={viewer.canApprove ? copy.decisionHeading : undefined}
          titleId="eh-matching-decision"
          /* F4/AC-1 — per candidate, never one verdict on the pool. */
          description={viewer.canApprove ? copy.decisionDescription : undefined}
        >
          <Alert tone="success" surface="tinted" role="status" title={copy.poolSentTitle}>
            {copy.poolSentBody}
          </Alert>
          {viewer.canApprove ? (
            <>
              <ul className={styles.candidates}>
                {pool.members.map((member) => {
                  const decision = decisions[member.trainerId] ?? 'pending';
                  return (
                    <li key={member.trainerId} className={styles.candidate}>
                      <Typography as="span" variant="text-sm" weight="bold">
                        {member.name}
                      </Typography>
                      <Typography as="span" variant="text-sm">
                        {`${copy.priceLabel}: ${priceFor(member)}`}
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
                          {copy.approve}
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
                          {copy.reject}
                        </Button>
                      </div>
                      {/* F4/AC-2 — rank only what has been approved. */}
                      {decision === 'approved' && (
                        <Select
                          label={copy.rankLabel(member.name)}
                          value={ranks[member.trainerId] ?? ''}
                          onValueChange={(value) =>
                            setRanks((current) => ({ ...current, [member.trainerId]: value }))
                          }
                          options={pool.members.map((_, index) => ({
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
                {copy.rankHint}
              </Typography>
              <div className={styles.actions}>
                <Button variant="primary" size="md" disabled={busy} onClick={submitDecision}>
                  {copy.submitDecision}
                </Button>
              </div>
            </>
          ) : (
            <Alert tone="info" surface="tinted" role="status">
              {copy.notAuthorized}
            </Alert>
          )}
        </Panel>
      )}

      {/* ── the outcome ──────────────────────────────────────────────── */}
      {pool.status === 'decided' && (
        <Panel
          shape="inline"
          title={copy.decidedHeading}
          titleId="eh-decided-heading"
          focusableTitle
        >
          {/* F4/AC-3 — zero approvals restarts the cycle (J-19). */}
          {isFullRejection(pool.members) ? (
            <Alert tone="warning" surface="tinted" role="status" title={copy.fullRejectionTitle}>
              {copy.fullRejectionBody}
            </Alert>
          ) : (
            <ul className={styles.candidates}>
              {pool.members
                .filter((member) => member.decision === 'approved')
                .sort((a, b) => (a.preferenceRank ?? 0) - (b.preferenceRank ?? 0))
                .map((member) => {
                  // F4/AC-4 — the top-ranked per slot go forward; the rest are
                  // ranked backups, which is a real state and is named.
                  const forward = candidatesGoingForward(pool.members, pool.requiredHeadcount).some(
                    (candidate) => candidate.trainerId === member.trainerId
                  );
                  return (
                    <li key={member.trainerId} className={styles.candidate}>
                      <Typography as="span" variant="text-sm" weight="bold">
                        {`${member.preferenceRank ?? '—'}. ${member.name}`}
                      </Typography>
                      <Tag variant={forward ? 'success' : 'neutral'} size="sm">
                        {forward ? copy.goingForward : copy.backups}
                      </Tag>
                    </li>
                  );
                })}
            </ul>
          )}
        </Panel>
      )}

      {/* ── J-18 — what the approval set in motion ───────────────────── */}
      {pool.status === 'decided' && !isFullRejection(pool.members) && requestId != null && (
        <SlotTrackingPanel requestId={requestId} />
      )}

      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="md"
          href={expertHubPaths.internalAssignments}
          iconStart={<Icon name="sidebar-right" size="sm" decorative />}
        >
          {content.form.backToList}
        </Button>
      </div>
    </WorkspacePage>
  );
}
