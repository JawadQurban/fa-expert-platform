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
import { setCommitteeServiceForTesting } from './committeeService';
import { createMockCommitteeProvider } from './mockCommitteeProvider';
import type { MockCommitteeProviderOptions } from './mockCommitteeProvider';
import { getCommitteeContent } from './committee.content';

/**
 * EH-INT-05 — Approval Committee Decision (J-09). The tests target the journey's
 * acceptance criteria: template reuse copies rather than links, an all-optional
 * sequence is refused, approval advances, a **mandatory** rejection halts while
 * an **optional** one only logs a note, a modification pauses and resumes from
 * the same member, and the J-10 gate needs both approval and bank data.
 */

const content = getCommitteeContent('ar');
const APPLICATION_ID = 'app-3001';

function injectProvider(options: MockCommitteeProviderOptions = {}) {
  setCommitteeServiceForTesting(createMockCommitteeProvider({ latencyMs: 0, ...options }));
}

async function renderCommittee() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalApplicationCommittee(APPLICATION_ID));
  await screen.findByRole('heading', { level: 1 });
  return result;
}

describe('EH-INT-05 — Approval Committee Decision', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setCommitteeServiceForTesting(null);
  });

  it('shows screening + consolidated interview results, not individual evaluations (F3/AC-2)', async () => {
    await renderCommittee();
    expect(await screen.findByText(content.context.heading)).toBeInTheDocument();
    expect(screen.getAllByText(content.context.screeningLabel).length).toBeGreaterThan(0);
    expect(screen.getAllByText(content.context.interviewLabel).length).toBeGreaterThan(0);
  });

  it('states that the committee decides on the application as a whole (BR-0209)', async () => {
    await renderCommittee();
    expect(await screen.findByText(content.context.wholeApplicationNote)).toBeInTheDocument();
  });

  it('offers formation to the creator when no sequence exists (F2)', async () => {
    await renderCommittee();
    expect(
      await screen.findByRole('heading', { name: content.formation.heading })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.formation.submit })).toBeInTheDocument();
  });

  it('refuses an empty sequence and an all-optional sequence (F2 read against F4/AC-4)', async () => {
    const { user } = await renderCommittee();

    await user.click(await screen.findByRole('button', { name: content.formation.submit }));
    expect(await screen.findByText(content.formation.errors['no-members'])).toBeInTheDocument();

    // Add one member, mark them optional → still refused, with the reason stated.
    await user.click(screen.getByRole('combobox', { name: content.formation.addHeading }));
    await user.click(await screen.findByRole('option', { name: /د. أحمد الزهراني/ }));
    await user.click(screen.getByRole('button', { name: content.formation.add }));
    await user.click(
      await screen.findByRole('radio', { name: content.formation.obligations.optional })
    );
    await user.click(screen.getByRole('button', { name: content.formation.submit }));

    expect(
      await screen.findByText(content.formation.errors['no-mandatory-member'])
    ).toBeInTheDocument();
  });

  it('copies a saved template into the draft and says edits do not change it (F2/AC-5)', async () => {
    const { user } = await renderCommittee();
    await user.click(
      await screen.findByRole('combobox', { name: content.formation.templateLabel })
    );
    await user.click(await screen.findByRole('option', { name: 'لجنة الاعتماد المعتادة' }));

    // The template's three members are now in the draft, editable for this
    // application only — the copy note is part of the field, not a tooltip.
    expect(screen.getByText(content.formation.templateCopyNote)).toBeInTheDocument();
    expect(screen.getByText(content.formation.positionLabel(3))).toBeInTheDocument();
  });

  it('names the rule when the API refuses formation to anyone but the application creator (F1/AC-2, BR-0215)', async () => {
    // The API answers 403 `only-application-creator` for a non-decider.
    setCommitteeServiceForTesting({
      ...createMockCommitteeProvider({ latencyMs: 0 }),
      formCommittee: () =>
        Promise.resolve({
          ok: false,
          error: { status: 403, message: 'only-application-creator' },
        }),
    });
    const { user } = await renderCommittee();

    await user.click(await screen.findByRole('combobox', { name: content.formation.addHeading }));
    await user.click(await screen.findByRole('option', { name: /د. أحمد الزهراني/ }));
    await user.click(screen.getByRole('button', { name: content.formation.add }));
    await user.click(screen.getByRole('button', { name: content.formation.submit }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(content.errors.onlyApplicationCreator)).toBeInTheDocument();
    expect(within(alert).queryByText(content.errors.submitBody)).not.toBeInTheDocument();
  });

  it('starts the sequence with the first member on their turn (F2/AC-6)', async () => {
    injectProvider({
      seedSequence: [
        { approverId: 'stf-01', obligation: 'mandatory' },
        { approverId: 'stf-02', obligation: 'mandatory' },
      ],
    });
    await renderCommittee();
    const list = await screen.findByRole('list', { name: content.sequence.heading });
    expect(within(list).getByText(content.sequence.states.current)).toBeInTheDocument();
    expect(within(list).getByText(content.sequence.states.waiting)).toBeInTheDocument();
  });

  it('advances to the next member on approval (F4/AC-2)', async () => {
    injectProvider({
      seedSequence: [
        { approverId: 'stf-01', obligation: 'mandatory' },
        { approverId: 'stf-02', obligation: 'mandatory' },
      ],
    });
    const { user } = await renderCommittee();

    await user.click(await screen.findByRole('button', { name: content.decision.approve }));
    const dialog = await screen.findByRole('dialog', { name: content.approveDialog.title });
    // Not the last mandatory member — the dialog says it advances.
    expect(within(dialog).getByText(content.approveDialog.bodyAdvances)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: content.approveDialog.confirm }));

    const list = await screen.findByRole('list', { name: content.sequence.heading });
    expect(within(list).getByText(content.sequence.states.approved)).toBeInTheDocument();
  });

  it('finalizes and triggers the bank-data request when the last mandatory member approves (F4/AC-5, F6)', async () => {
    injectProvider({ seedSequence: [{ approverId: 'stf-01', obligation: 'mandatory' }] });
    const { user } = await renderCommittee();

    await user.click(await screen.findByRole('button', { name: content.decision.approve }));
    const dialog = await screen.findByRole('dialog', { name: content.approveDialog.title });
    // The last mandatory approver is told this finalizes it and asks for bank data.
    expect(within(dialog).getByText(content.approveDialog.bodyFinal)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: content.approveDialog.confirm }));

    expect(await screen.findByText(content.outcome.approvedTitle)).toBeInTheDocument();
    expect(screen.getByText(content.bankData.states.requested)).toBeInTheDocument();
  });

  it('warns a MANDATORY member that rejection halts the application, and halts it (F4/AC-3)', async () => {
    injectProvider({
      seedSequence: [
        { approverId: 'stf-01', obligation: 'mandatory' },
        { approverId: 'stf-02', obligation: 'mandatory' },
      ],
    });
    const { user } = await renderCommittee();

    await user.click(await screen.findByRole('button', { name: content.decision.reject }));
    const dialog = await screen.findByRole('dialog', { name: content.rejectDialog.title });
    expect(within(dialog).getByText(content.rejectDialog.mandatoryWarning)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('combobox', { name: /سبب الرفض/ }));
    await user.click(
      await screen.findByRole('option', {
        name: content.rejectionReasons['insufficient-experience'],
      })
    );
    await user.click(within(dialog).getByRole('button', { name: content.rejectDialog.confirm }));

    expect(await screen.findByText(content.outcome.rejectedTitle)).toBeInTheDocument();
  });

  it('tells an OPTIONAL member their rejection is a note only, and keeps going (F4/AC-4)', async () => {
    injectProvider({
      seedSequence: [
        { approverId: 'stf-01', obligation: 'optional' },
        { approverId: 'stf-02', obligation: 'mandatory' },
      ],
    });
    const { user } = await renderCommittee();

    await user.click(await screen.findByRole('button', { name: content.decision.reject }));
    const dialog = await screen.findByRole('dialog', { name: content.rejectDialog.title });
    // The warning is obligation-specific — this is `BR-0211` at the point of use.
    expect(within(dialog).getByText(content.rejectDialog.optionalWarning)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('combobox', { name: /سبب الرفض/ }));
    await user.click(
      await screen.findByRole('option', {
        name: content.rejectionReasons['insufficient-experience'],
      })
    );
    await user.click(within(dialog).getByRole('button', { name: content.rejectDialog.confirm }));

    // Not halted: the objection is logged and the sequence carries on.
    expect(await screen.findByText(content.outcome.optionalRejectionsHeading)).toBeInTheDocument();
    expect(screen.getByText(content.outcome.optionalRejectionsNote)).toBeInTheDocument();
    expect(screen.queryByText(content.outcome.rejectedTitle)).not.toBeInTheDocument();
  });

  it('requires a note on a modification request and resumes from the same member (F7)', async () => {
    injectProvider({
      seedSequence: [
        { approverId: 'stf-01', obligation: 'mandatory' },
        { approverId: 'stf-02', obligation: 'mandatory' },
      ],
    });
    const { user } = await renderCommittee();

    await user.click(
      await screen.findByRole('button', { name: content.decision.requestModification })
    );
    const dialog = await screen.findByRole('dialog', { name: content.modificationDialog.title });

    // `BR-0217` — no note, no request.
    await user.click(
      within(dialog).getByRole('button', { name: content.modificationDialog.confirm })
    );
    expect(await screen.findByText(content.modificationDialog.noteRequired)).toBeInTheDocument();

    await user.type(
      within(dialog).getByLabelText(content.modificationDialog.noteLabel, { exact: false }),
      'يرجى تصحيح بيانات الخبرة'
    );
    await user.click(
      within(dialog).getByRole('button', { name: content.modificationDialog.confirm })
    );

    expect(await screen.findByText(content.modificationBanner.title)).toBeInTheDocument();
    expect(
      screen.getByText(content.modificationBanner.resumeNote, { exact: false })
    ).toBeInTheDocument();

    // Re-submitting hands the turn back to the member who asked (F7/AC-4).
    await user.click(screen.getByRole('button', { name: content.modificationBanner.resubmit }));
    const list = await screen.findByRole('list', { name: content.sequence.heading });
    expect(within(list).getByText(content.sequence.states.current)).toBeInTheDocument();
  });

  it('blocks the J-10 gate until approval AND bank data are both complete (F5/AC-3)', async () => {
    injectProvider({ seedSequence: [{ approverId: 'stf-01', obligation: 'mandatory' }] });
    await renderCommittee();
    expect(await screen.findByText(content.bankData.gateBlocked)).toBeInTheDocument();
  });

  it('opens the gate once both conditions are met', async () => {
    injectProvider({
      seedSequence: [{ approverId: 'stf-01', obligation: 'mandatory' }],
      bankDataComplete: true,
    });
    const { user } = await renderCommittee();

    await user.click(await screen.findByRole('button', { name: content.decision.approve }));
    const dialog = await screen.findByRole('dialog', { name: content.approveDialog.title });
    await user.click(within(dialog).getByRole('button', { name: content.approveDialog.confirm }));

    expect(await screen.findByText(content.bankData.gateReady)).toBeInTheDocument();
  });

  it('shows a non-deciding member a "not your turn" notice instead of controls (P-J9)', async () => {
    injectProvider({
      seedSequence: [{ approverId: 'stf-01', obligation: 'mandatory' }],
      viewer: { canDecide: false, approverId: 'stf-04' },
    });
    await renderCommittee();
    expect(await screen.findByText(content.decision.notYourTurnTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.decision.approve })
    ).not.toBeInTheDocument();
  });

  it('renders a not-found state for an unknown application', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalApplicationCommittee('app-does-not-exist'));
    expect(await screen.findByText(content.errors.notFoundTitle)).toBeInTheDocument();
  });

  it('surfaces a load failure with a retry affordance', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalApplicationCommittee(APPLICATION_ID));
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.errors.retry })).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    injectProvider({
      seedSequence: [
        { approverId: 'stf-01', obligation: 'mandatory' },
        { approverId: 'stf-02', obligation: 'optional' },
      ],
    });
    const { container } = await renderCommittee();
    await expectNoA11yViolations(container);
  });
});
