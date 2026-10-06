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
import { setScreeningServiceForTesting } from './screeningService';
import { createMockScreeningProvider } from './mockScreeningProvider';
import type { MockScreeningProviderOptions } from './mockScreeningProvider';
import { getScreeningContent } from './screening.content';

/**
 * EH-INT-03 — Screening Detail (J-05 Screening & Initial Decision, J-08
 * Interview Exemption). The tests target the journey's **acceptance criteria**,
 * not incidental markup: per-service scoring, the advisory separation of the AI
 * panel, the "slots + committee together, or an exemption" gate, auto-rejection
 * disclosure, and reason-gated whole-application rejection.
 */

const content = getScreeningContent('ar');

/** A multi-service application (trainer + consultant) still awaiting screening. */
const MULTI_SERVICE_ID = 'app-3001';

function injectProvider(options: MockScreeningProviderOptions = {}) {
  setScreeningServiceForTesting(createMockScreeningProvider({ latencyMs: 0, ...options }));
}

async function renderScreening(id: string = MULTI_SERVICE_ID) {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalApplicationDetail(id));
  await screen.findByRole('heading', { level: 1 });
  return result;
}

describe('EH-INT-03 — Screening & Initial Decision', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setScreeningServiceForTesting(null);
  });

  it('shows a separate objective score per requested service (F2/AC-3)', async () => {
    await renderScreening();
    expect(
      await screen.findByRole('heading', {
        name: content.scores.scoreOf(content.services.trainer),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: content.scores.scoreOf(content.services.consultant) })
    ).toBeInTheDocument();
  });

  it('keeps the AI analysis advisory and separate from the score (BR-0202, F4/AC-2)', async () => {
    await renderScreening();
    expect(await screen.findByText(content.insight.advisoryTitle)).toBeInTheDocument();
    expect(screen.getByText(content.insight.advisoryBody)).toBeInTheDocument();
  });

  it('renders the application form section by section (F2/AC-2)', async () => {
    const { user } = await renderScreening();
    // The review material is tabbed (the page ran past 3,300px unsplit), so the
    // form lives behind its own tab; the decision stays outside the tabs.
    await user.click(await screen.findByRole('tab', { name: content.form.heading }));
    const sectionButton = await screen.findByRole('button', { name: /الخبرة العملية/ });
    await user.click(sectionButton);
    expect(await screen.findByText('سنوات الخبرة')).toBeInTheDocument();
  });

  it('lists the attachments for review (F2/AC-8)', async () => {
    const { user } = await renderScreening();
    await user.click(await screen.findByRole('tab', { name: content.attachments.heading }));
    const list = await screen.findByRole('list', { name: content.attachments.heading });
    expect(within(list).getByText('السيرة الذاتية')).toBeInTheDocument();
  });

  it('blocks acceptance until slots AND committee are both provided (F5/AC-4)', async () => {
    const { user } = await renderScreening();

    await user.click(await screen.findByRole('checkbox', { name: content.services.trainer }));
    await user.click(screen.getByRole('button', { name: content.decision.accept }));

    // Both halves of the interview path are reported — not one at a time.
    const errors = await screen.findByRole('alert');
    expect(
      within(errors).getByText(content.decision.errors['slots-missing'](content.services.trainer))
    ).toBeInTheDocument();
    expect(
      within(errors).getByText(
        content.decision.errors['committee-missing'](content.services.trainer)
      )
    ).toBeInTheDocument();
    // The confirmation dialog never opened.
    expect(
      screen.queryByRole('dialog', { name: content.acceptDialog.title })
    ).not.toBeInTheDocument();
  });

  it('requires at least one service before accepting (F5/AC-1)', async () => {
    const { user } = await renderScreening();
    await user.click(await screen.findByRole('button', { name: content.decision.accept }));
    const errors = await screen.findByRole('alert');
    expect(
      within(errors).getByText(content.decision.errors['no-service-selected'](''))
    ).toBeInTheDocument();
  });

  it('discloses the services that will be auto-rejected (F5/AC-2)', async () => {
    const { user } = await renderScreening();
    await user.click(await screen.findByRole('checkbox', { name: content.services.trainer }));
    expect(
      await screen.findByText(content.decision.autoRejectWarning(content.services.consultant))
    ).toBeInTheDocument();
  });

  it('accepts an exemption path with a reason and routes it to the committee (J-08/F1, F2)', async () => {
    const { user } = await renderScreening();

    await user.click(await screen.findByRole('checkbox', { name: content.services.trainer }));
    await user.click(screen.getByRole('radio', { name: content.decision.pathExemption }));

    await user.click(screen.getByRole('combobox', { name: /سبب الاستثناء/ }));
    await user.click(
      await screen.findByRole('option', { name: content.exemptionReasons['prior-collaboration'] })
    );

    await user.click(screen.getByRole('button', { name: content.decision.accept }));

    const dialog = await screen.findByRole('dialog', { name: content.acceptDialog.title });
    expect(
      within(dialog).getByText(content.acceptDialog.exempted(content.services.trainer))
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: content.acceptDialog.confirm }));

    // Recorded outcome replaces the decision panel; auto-rejection is explicit.
    expect(await screen.findByText(content.recorded.acceptTitle)).toBeInTheDocument();
    expect(screen.getByText(content.recorded.exemptedLabel)).toBeInTheDocument();
    expect(screen.getByText(content.recorded.autoRejectedLabel)).toBeInTheDocument();

    // The inbox opens this page for an application at ANY stage, so a decided
    // one must hand the reader on. Reported from the testing server: bank data
    // was complete and nothing led to agreement preparation — the chain ended
    // at "back to the inbox" and the next step needed a typed URL.
    const onward = await screen.findByRole('link', { name: content.goToCommittee });
    expect(onward.getAttribute('href')).toContain('/committee');
  });

  it('warns that rejection covers the whole application and requires a reason (F5/AC-7, AC-8)', async () => {
    const { user } = await renderScreening();

    await user.click(await screen.findByRole('button', { name: content.decision.reject }));
    const dialog = await screen.findByRole('dialog', { name: content.rejectDialog.title });
    expect(within(dialog).getByText(content.rejectDialog.warning)).toBeInTheDocument();

    // Confirming without a reason is refused (`BR-0219`).
    await user.click(within(dialog).getByRole('button', { name: content.rejectDialog.confirm }));
    expect(await screen.findByText(content.decision.rejectReasonRequired)).toBeInTheDocument();
    expect(screen.queryByText(content.recorded.rejectTitle)).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('combobox', { name: /سبب الرفض/ }));
    await user.click(
      await screen.findByRole('option', { name: content.rejectionReasons['incomplete-documents'] })
    );
    await user.click(within(dialog).getByRole('button', { name: content.rejectDialog.confirm }));

    expect(await screen.findByText(content.recorded.rejectTitle)).toBeInTheDocument();
  });

  it('renders a not-found state for an unknown application', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalApplicationDetail('app-does-not-exist'));
    expect(await screen.findByText(content.errors.notFoundTitle)).toBeInTheDocument();
  });

  it('surfaces a load failure with a retry affordance', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalApplicationDetail(MULTI_SERVICE_ID));
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.errors.retry })).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = await renderScreening();
    await expectNoA11yViolations(container);
  });
});
