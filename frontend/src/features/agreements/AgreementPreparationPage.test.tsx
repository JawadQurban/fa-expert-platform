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
import { setAgreementServiceForTesting } from './agreementService';
import { createMockAgreementProvider } from './mockAgreementProvider';
import type { MockAgreementProviderOptions } from './mockAgreementProvider';
import { getAgreementsContent } from './agreements.content';
import { MOCK_AGREEMENT_BODY_TEXT } from './mockAgreementTemplate';

/**
 * EH-INT-06a — Agreement Preparation & Internal Approval (J-10). The tests target
 * the journey's acceptance criteria: the two-condition gate, fields-before-merge,
 * e-signer designation, the reviewer/signer split, the absence of rejection, and
 * the send rule that a signature alone must not satisfy.
 */

const content = getAgreementsContent('ar');
const APPLICATION_ID = 'app-3001';

function injectProvider(options: MockAgreementProviderOptions = {}) {
  setAgreementServiceForTesting(createMockAgreementProvider({ latencyMs: 0, ...options }));
}

async function renderAgreement() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalApplicationAgreement(APPLICATION_ID));
  await screen.findByRole('heading', { level: 1 });
  return result;
}

describe('EH-INT-06a — Agreement Preparation & Internal Approval', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setAgreementServiceForTesting(null);
  });

  it('blocks preparation until both J-09 outcomes are in, naming each (F1/AC-1)', async () => {
    injectProvider({ gate: { committeeApproved: true, bankDataComplete: false } });
    await renderAgreement();

    expect(await screen.findByText(content.gate.blockedTitle)).toBeInTheDocument();
    expect(screen.getByText(content.gate.committeeLabel)).toBeInTheDocument();
    expect(screen.getByText(content.gate.bankLabel)).toBeInTheDocument();
    // The preparation form is not offered at all while the gate is closed.
    expect(
      screen.queryByRole('button', { name: content.preparation.save })
    ).not.toBeInTheDocument();
  });

  it('states the agreement covers exactly the approved services (F1/AC-3)', async () => {
    await renderAgreement();
    const services = `${content.services.trainer}، ${content.services.consultant}`;
    expect(await screen.findByText(content.preparation.servicesNote(services))).toBeInTheDocument();
  });

  it('requires the confirmed template fields before saving (F1)', async () => {
    const { user } = await renderAgreement();
    await user.click(await screen.findByRole('button', { name: content.preparation.save }));

    // The summary region (each field also flags itself inline).
    const errors = await screen.findByRole('alert', { name: content.preparation.errorsHeading });
    expect(within(errors).getAllByRole('listitem')).toHaveLength(2);
  });

  it('merges trainer and bank data only AFTER the fields are saved (F1/AC-2)', async () => {
    const { user } = await renderAgreement();

    // Nothing merged — and no document — yet.
    expect(
      screen.queryByRole('heading', { name: content.document.heading })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('SA0380000000608010167519')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/تاريخ بداية/), '2026-08-01');
    await user.type(screen.getByLabelText(/تاريخ نهاية/), '2027-07-31');
    await user.click(screen.getByRole('button', { name: content.preparation.save }));

    // The frozen document version now carries the merged data.
    expect(
      await screen.findByRole('heading', { name: content.document.heading })
    ).toBeInTheDocument();
    // Merged values are shown read-only — never as an editable input.
    expect(screen.getByText('SA0380000000608010167519')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /الآيبان/ })).not.toBeInTheDocument();
  });

  it('refuses a signing sequence with nobody designated to sign (F2/AC-4)', async () => {
    injectProvider({ prepared: true });
    const { user } = await renderAgreement();

    await user.click(await screen.findByRole('combobox', { name: content.formation.addHeading }));
    await user.click(await screen.findByRole('option', { name: /د. أحمد الزهراني/ }));
    await user.click(screen.getByRole('button', { name: content.formation.add }));
    await user.click(screen.getByRole('button', { name: content.formation.submit }));

    expect(
      await screen.findByText(content.formation.errors['no-signer-designated'])
    ).toBeInTheDocument();
  });

  it('starts the sequence with the first person once a signer is designated (F2/AC-5)', async () => {
    injectProvider({ prepared: true });
    const { user } = await renderAgreement();

    await user.click(await screen.findByRole('combobox', { name: content.formation.addHeading }));
    await user.click(await screen.findByRole('option', { name: /د. أحمد الزهراني/ }));
    await user.click(screen.getByRole('button', { name: content.formation.add }));
    await user.click(await screen.findByRole('checkbox', { name: content.formation.signerLabel }));
    await user.click(screen.getByRole('button', { name: content.formation.submit }));

    const list = await screen.findByRole('list', { name: content.sequence.heading });
    expect(within(list).getByText(content.sequence.states.current)).toBeInTheDocument();
    expect(within(list).getByText(content.sequence.signerTag)).toBeInTheDocument();
  });

  it('offers a reviewer approval only — never a signature or a rejection (F3/AC-3, AC-6)', async () => {
    injectProvider({
      prepared: true,
      seedSequence: [
        { approverId: 'stf-02', obligation: 'mandatory' },
        { approverId: 'stf-01', obligation: 'mandatory', isSigner: true },
      ],
    });
    await renderAgreement();

    expect(
      await screen.findByRole('button', { name: content.decision.approve })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.decision.signAndApprove })
    ).not.toBeInTheDocument();
    // The missing reject option is explained rather than silently absent.
    expect(screen.getByText(content.decision.noRejectNote)).toBeInTheDocument();
  });

  it('offers the designated signer an e-signature that requires a name (F3/AC-4)', async () => {
    injectProvider({
      prepared: true,
      seedSequence: [{ approverId: 'stf-01', obligation: 'mandatory', isSigner: true }],
    });
    const { user } = await renderAgreement();

    await user.click(await screen.findByRole('button', { name: content.decision.signAndApprove }));
    const dialog = await screen.findByRole('dialog', { name: content.signDialog.title });

    await user.click(within(dialog).getByRole('button', { name: content.signDialog.confirm }));
    expect(
      await screen.findByText(content.decision.errors['signature-missing'])
    ).toBeInTheDocument();

    await user.type(
      within(dialog).getByLabelText(content.signDialog.signatureLabel, { exact: false }),
      'أحمد الزهراني'
    );
    await user.click(within(dialog).getByRole('button', { name: content.signDialog.confirm }));

    expect(await screen.findByText(content.send.sentTitle)).toBeInTheDocument();
  });

  it('does NOT send on a signature alone while others are outstanding (F3/AC-5, BR-0213)', async () => {
    // The signer is first; a reviewer still follows them.
    injectProvider({
      prepared: true,
      seedSequence: [
        { approverId: 'stf-01', obligation: 'mandatory', isSigner: true },
        { approverId: 'stf-02', obligation: 'mandatory' },
      ],
    });
    const { user } = await renderAgreement();

    await user.click(await screen.findByRole('button', { name: content.decision.signAndApprove }));
    const dialog = await screen.findByRole('dialog', { name: content.signDialog.title });
    await user.type(
      within(dialog).getByLabelText(content.signDialog.signatureLabel, { exact: false }),
      'أحمد الزهراني'
    );
    await user.click(within(dialog).getByRole('button', { name: content.signDialog.confirm }));

    // Signature attached, sequence unfinished → still not sent.
    expect(await screen.findByText(content.send.pendingTitle)).toBeInTheDocument();
    expect(screen.getByText(content.send.bothRequired)).toBeInTheDocument();
    expect(screen.queryByText(content.send.sentTitle)).not.toBeInTheDocument();
  });

  it('requires a note on a modification request and resumes from the same person (F4)', async () => {
    injectProvider({
      prepared: true,
      seedSequence: [
        { approverId: 'stf-02', obligation: 'mandatory' },
        { approverId: 'stf-01', obligation: 'mandatory', isSigner: true },
      ],
    });
    const { user } = await renderAgreement();

    await user.click(
      await screen.findByRole('button', { name: content.decision.requestModification })
    );
    const dialog = await screen.findByRole('dialog', { name: content.modificationDialog.title });

    await user.click(
      within(dialog).getByRole('button', { name: content.modificationDialog.confirm })
    );
    expect(await screen.findByText(content.decision.errors['note-missing'])).toBeInTheDocument();

    await user.type(
      within(dialog).getByLabelText(content.modificationDialog.noteLabel, { exact: false }),
      'يرجى تصحيح تاريخ النهاية'
    );
    await user.click(
      within(dialog).getByRole('button', { name: content.modificationDialog.confirm })
    );

    expect(await screen.findByText(content.modificationBanner.title)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: content.modificationBanner.resubmit }));
    const list = await screen.findByRole('list', { name: content.sequence.heading });
    expect(within(list).getByText(content.sequence.states.current)).toBeInTheDocument();
  });

  it('shows a non-deciding person a "not your turn" notice (P-J9)', async () => {
    injectProvider({
      prepared: true,
      seedSequence: [{ approverId: 'stf-01', obligation: 'mandatory', isSigner: true }],
      viewer: { canDecide: false, approverId: 'stf-04', isCreator: false },
    });
    await renderAgreement();
    expect(await screen.findByText(content.decision.notYourTurnTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.decision.approve })
    ).not.toBeInTheDocument();
    // A non-creator still reads the whole document — never a "storage pending" stub.
    expect(screen.getByRole('heading', { name: content.document.heading })).toBeInTheDocument();
    expect(screen.getByText(MOCK_AGREEMENT_BODY_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(content.document.notPrepared)).not.toBeInTheDocument();
    // …and cannot edit it.
    expect(
      screen.queryByRole('button', { name: content.preparation.edit })
    ).not.toBeInTheDocument();
  });

  it('locks the data while the sequence runs, and lets the creator correct it during a modification request (F4)', async () => {
    injectProvider({
      prepared: true,
      seedSequence: [
        { approverId: 'stf-02', obligation: 'mandatory' },
        { approverId: 'stf-01', obligation: 'mandatory', isSigner: true },
      ],
    });
    const { user } = await renderAgreement();

    // In progress: the server refuses a re-preparation, so no edit is offered.
    await screen.findByRole('button', { name: content.decision.approve });
    expect(
      screen.queryByRole('button', { name: content.preparation.edit })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: content.decision.requestModification }));
    const dialog = await screen.findByRole('dialog', { name: content.modificationDialog.title });
    await user.type(
      within(dialog).getByLabelText(content.modificationDialog.noteLabel, { exact: false }),
      'يرجى تصحيح تاريخ النهاية'
    );
    await user.click(
      within(dialog).getByRole('button', { name: content.modificationDialog.confirm })
    );

    // Modification requested: the creator may correct the data before re-submitting.
    expect(
      await screen.findByText(content.modificationBanner.correctNote, { exact: false })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.preparation.edit }));
    const endDate = screen.getByLabelText(/تاريخ نهاية/);
    await user.clear(endDate);
    await user.type(endDate, '2027-06-30');
    await user.click(screen.getByRole('button', { name: content.preparation.save }));

    // The correction is frozen as a new version, and re-submission is still offered.
    expect(
      await screen.findByText((text) => text.startsWith(content.document.version(2, '')))
    ).toBeInTheDocument();
    expect(screen.getAllByText('2027-06-30').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: content.modificationBanner.resubmit })
    ).toBeInTheDocument();
  });

  it('renders a not-found state for an unknown application', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalApplicationAgreement('app-does-not-exist'));
    expect(await screen.findByText(content.errors.notFoundTitle)).toBeInTheDocument();
  });

  it('surfaces a load failure with a retry affordance', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalApplicationAgreement(APPLICATION_ID));
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.errors.retry })).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    injectProvider({
      prepared: true,
      seedSequence: [
        { approverId: 'stf-02', obligation: 'mandatory' },
        { approverId: 'stf-01', obligation: 'mandatory', isSigner: true },
      ],
    });
    const { container } = await renderAgreement();
    await expectNoA11yViolations(container);
  });
});
