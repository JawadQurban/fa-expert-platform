import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { setInterviewServiceForTesting } from './interviewService';
import { createMockInterviewProvider } from './mockInterviewProvider';
import type { MockInterviewProviderOptions } from './mockInterviewProvider';
import { getInterviewsContent } from './interviews.content';
import { MOCK_INTERVIEW_MODEL } from './mockInterviewModel';
import { arNumber, numberFormatter } from '../../shared/formatting';

/**
 * EH-INT-04 — Interview Evaluation & Post-Interview Decision (J-07) and the
 * staff-side reschedule (J-06/F4). The tests target the journey's acceptance
 * criteria: per-service independent scoring, non-attendance exclusion, the
 * "all members must respond" gate (`BR-0220`), reason-gated direct rejection,
 * and ticket retention across a reschedule.
 */

const content = getInterviewsContent('ar');

/** A multi-service application (trainer + consultant) with an interview. */
const APPLICATION_ID = 'app-3001';

function injectProvider(options: MockInterviewProviderOptions = {}) {
  setInterviewServiceForTesting(createMockInterviewProvider({ latencyMs: 0, ...options }));
}

async function renderInterview() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalApplicationInterview(APPLICATION_ID));
  await screen.findByRole('heading', { level: 1 });
  return result;
}

describe('EH-INT-04 — Interview Evaluation & Post-Interview Decision', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setInterviewServiceForTesting(null);
  });

  it('shows the interview ticket with its number and the accepted services (J-06/F2)', async () => {
    await renderInterview();
    expect(await screen.findByText(/INT-/)).toBeInTheDocument();
    // The ticket lists the accepted services as one joined value.
    expect(
      screen.getByText(`${content.services.trainer}، ${content.services.consultant}`)
    ).toBeInTheDocument();
  });

  it('shows staff the applicant’s request for other times, with its note (J-06/F1/AC-3)', async () => {
    const base = createMockInterviewProvider({ latencyMs: 0 });
    setInterviewServiceForTesting({
      ...base,
      getInterviewDetail: async (applicationId) => {
        const result = await base.getInterviewDetail(applicationId);
        return result.ok
          ? {
              ok: true,
              value: {
                ...result.value,
                rescheduleRequest: { requestedAt: '2026-07-27T09:00:00Z', note: 'مساءً فقط' },
              },
            }
          : result;
      },
    });
    await renderInterview();
    expect(await screen.findByText(content.ticket.rescheduleRequestedTitle)).toBeInTheDocument();
    expect(
      screen.getByText(content.ticket.rescheduleRequestedBody('مساءً فقط'))
    ).toBeInTheDocument();
  });

  it('does not fabricate a Teams link while the integration is undefined (J-06 open item)', async () => {
    await renderInterview();
    expect(await screen.findByText(content.ticket.meetingPending)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: content.ticket.join })).not.toBeInTheDocument();
  });

  it('lists committee responses and names who is still outstanding (BR-0220)', async () => {
    await renderInterview();
    const list = await screen.findByRole('list', { name: content.committee.heading });
    expect(within(list).getByText(content.committee.states.submitted)).toBeInTheDocument();
    // The seeded committee has one member who did not attend and one pending.
    expect(within(list).getByText(content.committee.states['did-not-attend'])).toBeInTheDocument();
    expect(within(list).getByText(content.committee.states.pending)).toBeInTheDocument();
  });

  it('withholds the result entirely until every member has responded (F2/AC-1)', async () => {
    await renderInterview();
    expect(await screen.findByText(content.result.pendingTitle)).toBeInTheDocument();
    // No average is rendered — not even a partial one.
    expect(screen.queryByText(content.result.description)).not.toBeInTheDocument();
  });

  it('blocks the post-interview decision while the result is pending (BR-0220)', async () => {
    await renderInterview();
    expect(await screen.findByText(content.decision.blockedTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.decision.forward })).toBeDisabled();
    expect(screen.getByRole('button', { name: content.decision.reject })).toBeDisabled();
  });

  it('requires every axis before submitting, but not a recommendation (F1/AC-1, AC-2)', async () => {
    const { user } = await renderInterview();
    await user.click(await screen.findByRole('button', { name: content.evaluation.submit }));

    const errors = await screen.findByRole('alert');
    const firstAxis = MOCK_INTERVIEW_MODEL.axes[0];
    expect(
      within(errors).getAllByText(
        content.evaluation.errors['axis-score-missing'](firstAxis.label.ar)
      )
    ).not.toHaveLength(0);
    expect(within(errors).queryByText(/التوصية/)).not.toBeInTheDocument();
  });

  it('offers the approved named 1–5 levels for every criterion (J-07 rating scale)', async () => {
    const { user } = await renderInterview();
    const trainerBlock = await screen.findByRole('region', {
      name: content.evaluation.serviceHeading(content.services.trainer),
    });
    const firstAxis = MOCK_INTERVIEW_MODEL.axes[0];
    await user.click(
      within(trainerBlock).getByRole('combobox', {
        name: new RegExp(content.evaluation.axisScoreLabel(firstAxis.label.ar)),
      })
    );
    const digits = numberFormatter('ar');
    for (const level of MOCK_INTERVIEW_MODEL.ratingScale ?? []) {
      expect(
        await screen.findByRole('option', {
          name: content.evaluation.ratingOption(digits.format(level.score), level.label.ar),
        })
      ).toBeInTheDocument();
    }
  });

  it('marks each service Passed at the 70% pass mark, and forwarding stays available', async () => {
    injectProvider({ allResponded: true, viewer: { canEvaluate: false } });
    await renderInterview();
    const threshold = arNumber(70);
    // trainer (84 + 80) / 2 = 82 and consultant (76 + 64) / 2 = 70 — both pass.
    expect(await screen.findAllByText(content.result.thresholdMet(threshold))).toHaveLength(2);
    expect(screen.getByText(content.result.thresholdNote)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.decision.forward })).toBeEnabled();
  });

  it('blocks forwarding when no service passed, leaving direct rejection', async () => {
    // trainer (84 + 40) / 2 = 62 and consultant (76 + 50) / 2 = 63 — neither passes.
    injectProvider({
      allResponded: true,
      lastScores: { trainer: 40, consultant: 50 },
      viewer: { canEvaluate: false },
    });
    await renderInterview();
    const threshold = arNumber(70);
    expect(await screen.findAllByText(content.result.thresholdNotMet(threshold))).toHaveLength(2);
    expect(screen.getByText(content.decision.noPassTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.decision.forward })).toBeDisabled();
    expect(screen.getByRole('button', { name: content.decision.reject })).toBeEnabled();
  });

  it('names the services that will not be forwarded when only some passed', async () => {
    // trainer (84 + 80) / 2 = 82 passes; consultant (76 + 50) / 2 = 63 does not.
    injectProvider({
      allResponded: true,
      lastScores: { trainer: 80, consultant: 50 },
      viewer: { canEvaluate: false },
    });
    const { user } = await renderInterview();
    await user.click(await screen.findByRole('button', { name: content.decision.forward }));
    const dialog = await screen.findByRole('dialog', { name: content.forwardDialog.title });
    expect(
      within(dialog).getByText(content.forwardDialog.notPassedNote(content.services.consultant))
    ).toBeInTheDocument();
  });

  it('scores each accepted service in its own block (F1/AC-2)', async () => {
    await renderInterview();
    expect(
      await screen.findByRole('heading', {
        name: content.evaluation.serviceHeading(content.services.trainer),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: content.evaluation.serviceHeading(content.services.consultant),
      })
    ).toBeInTheDocument();
  });

  it('records non-attendance as an exclusion, not a zero (F1/AC-3, F2/AC-2)', async () => {
    const { user } = await renderInterview();

    await user.click(await screen.findByRole('button', { name: content.evaluation.didNotAttend }));
    const dialog = await screen.findByRole('dialog', { name: content.didNotAttendDialog.title });
    expect(within(dialog).getByText(content.didNotAttendDialog.body)).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole('button', { name: content.didNotAttendDialog.confirm })
    );

    expect(
      await screen.findByText(content.evaluation.nonAttendanceRecordedTitle)
    ).toBeInTheDocument();
    // That was the last outstanding member, so the result now exists and states
    // the exclusion explicitly rather than hiding it.
    expect(await screen.findByText(content.result.excludedNote)).toBeInTheDocument();
  });

  it('enables the decision and forwards to the approval committee once complete (F3/AC-1)', async () => {
    injectProvider({ allResponded: true, viewer: { canEvaluate: false } });
    const { user } = await renderInterview();

    const forward = await screen.findByRole('button', { name: content.decision.forward });
    expect(forward).toBeEnabled();
    await user.click(forward);

    const dialog = await screen.findByRole('dialog', { name: content.forwardDialog.title });
    await user.click(within(dialog).getByRole('button', { name: content.forwardDialog.confirm }));

    expect(await screen.findByText(content.recorded.forwardTitle)).toBeInTheDocument();
  });

  it('requires a reason for a direct rejection (F3/AC-2, BR-0219)', async () => {
    injectProvider({ allResponded: true, viewer: { canEvaluate: false } });
    const { user } = await renderInterview();

    await user.click(await screen.findByRole('button', { name: content.decision.reject }));
    const dialog = await screen.findByRole('dialog', { name: content.rejectDialog.title });
    expect(within(dialog).getByText(content.rejectDialog.warning)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: content.rejectDialog.confirm }));
    expect(await screen.findByText(content.rejectDialog.reasonRequired)).toBeInTheDocument();
    expect(screen.queryByText(content.recorded.rejectTitle)).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('combobox', { name: /سبب الرفض/ }));
    await user.click(
      await screen.findByRole('option', {
        name: content.rejectionReasons['insufficient-experience'],
      })
    );
    await user.click(within(dialog).getByRole('button', { name: content.rejectDialog.confirm }));

    expect(await screen.findByText(content.recorded.rejectTitle)).toBeInTheDocument();
  });

  it('hides the decision panel from a member who is not the decision-maker (BR-0208)', async () => {
    injectProvider({ allResponded: true, viewer: { canDecide: false, canEvaluate: false } });
    await renderInterview();
    await screen.findByRole('heading', { level: 1 });
    expect(
      screen.queryByRole('button', { name: content.decision.forward })
    ).not.toBeInTheDocument();
  });

  it('J-07/F3/AC-3: a full committee no-show says so, and offers reschedule and rejection', async () => {
    injectProvider({
      allResponded: true,
      viewer: { canDecide: true, canReject: true, canReschedule: true, fullNoShow: true },
    });
    await renderInterview();
    expect(await screen.findByText(content.decision.noShowTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.ticket.reschedule })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.decision.reject })).toBeEnabled();
  });

  it('J-07/F3/AC-4: before the rescheduled interview, rejection stays available and forwarding does not', async () => {
    injectProvider({ viewer: { canDecide: false, canReject: true, canEvaluate: false } });
    await renderInterview();
    expect(await screen.findByText(content.decision.rejectOnlyTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.decision.forward })).toBeDisabled();
    expect(screen.getByRole('button', { name: content.decision.reject })).toBeEnabled();
  });

  it('keeps the same interview number after a staff reschedule (J-06/F4/AC-6)', async () => {
    const { user } = await renderInterview();
    const ticketNumber = (await screen.findByText(/INT-/)).textContent;

    await user.click(screen.getByRole('button', { name: content.ticket.reschedule }));
    const dialog = await screen.findByRole('dialog', { name: content.rescheduleDialog.title });
    expect(within(dialog).getByText(content.rescheduleDialog.ticketRetained)).toBeInTheDocument();

    // Confirming with no slot is refused.
    await user.click(
      within(dialog).getByRole('button', { name: content.rescheduleDialog.confirm })
    );
    expect(await screen.findByText(content.rescheduleDialog.slotRequired)).toBeInTheDocument();

    await user.type(
      within(dialog).getByLabelText(content.rescheduleDialog.slotLabel(1)),
      '2026-08-05T09:00'
    );
    await user.click(
      within(dialog).getByRole('button', { name: content.rescheduleDialog.confirm })
    );

    expect(await screen.findByText(content.ticket.rescheduledCount(1))).toBeInTheDocument();
    expect(screen.getByText(/INT-/).textContent).toBe(ticketNumber);
  });

  it('tells a non-member they cannot evaluate rather than showing an inert form', async () => {
    injectProvider({ viewer: { canEvaluate: false, memberId: null } });
    await renderInterview();
    expect(await screen.findByText(content.evaluation.notAMemberTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.evaluation.submit })
    ).not.toBeInTheDocument();
  });

  it('renders a not-found state for an application with no interview', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalApplicationInterview('app-does-not-exist'));
    expect(await screen.findByText(content.errors.notFoundTitle)).toBeInTheDocument();
  });

  it('surfaces a load failure with a retry affordance', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalApplicationInterview(APPLICATION_ID));
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.errors.retry })).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = await renderInterview();
    await expectNoA11yViolations(container);
  });
});
