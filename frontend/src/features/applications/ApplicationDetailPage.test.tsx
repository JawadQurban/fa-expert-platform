import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  userEvent,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { setApplicationsServiceForTesting } from './applicationsService';
import { createMockApplicationsProvider } from './mockApplicationsProvider';
import type { MockApplicationsProviderOptions } from './mockApplicationsProvider';
import { getApplicationDetailContent } from './applicationDetail.content';
import { APPLICATION_FORM_SCHEMA } from './applicationSchema';
import { getAgreementsContent } from '../agreements/agreements.content';
import { MOCK_AGREEMENT_BODY_TEXT } from '../agreements/mockAgreementTemplate';

const content = getApplicationDetailContent('ar');
const documentCopy = getAgreementsContent('ar').document;

function injectProvider(options: MockApplicationsProviderOptions = {}) {
  setApplicationsServiceForTesting(createMockApplicationsProvider({ latencyMs: 0, ...options }));
}

/** Render the detail route for an id and await the H1. */
async function renderDetail(id: string) {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.applicationDetail(id));
  await screen.findByRole('heading', { level: 1, name: content.summary.heading });
  return result;
}

/** Open one of the three J-11 decision dialogs and return the driver. */
async function openDecision(buttonLabel: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: buttonLabel }));
  return user;
}

describe('EH-TP-03 — Application Details', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setApplicationsServiceForTesting(null);
  });

  it('renders the summary (reference, services, status badge) + breadcrumb for an owned application', async () => {
    await renderDetail('app-010'); // approval-in-progress, read-only
    // Reference shows in both the summary and the breadcrumb.
    expect(screen.getAllByText('EH-2026-00147').length).toBeGreaterThanOrEqual(2);
    expect(
      within(screen.getByRole('navigation', { name: content.breadcrumbLabel })).getByText(
        'EH-2026-00147'
      )
    ).toBeInTheDocument();
    // Business status badge shows the P-05 label.
    expect(screen.getByText(content.statuses['approval-in-progress'])).toBeInTheDocument();
  });

  it('renders the status timeline stages', async () => {
    await renderDetail('app-010');
    const timeline = screen.getByRole('list', { name: content.timeline.label });
    for (const stage of [
      content.stages.submitted,
      content.stages.approval,
      content.stages.active,
    ]) {
      expect(within(timeline).getByText(stage)).toBeInTheDocument();
    }
  });

  it('shows a read-only action message when no action is due', async () => {
    await renderDetail('app-010');
    expect(screen.getByText(content.action.readOnly)).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('routes a foreign/unknown id to the not-found state (owner-scoped)', async () => {
    injectProvider();
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.applicationDetail('does-not-exist'));
    expect(await screen.findByText(content.errors.notFoundTitle)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: content.errors.homeLabel })).toHaveAttribute(
      'href',
      expertHubPaths.applications
    );
  });

  it('does not show a synchronization banner before signing (business vs sync separation)', async () => {
    await renderDetail('app-010');
    expect(screen.queryByText(content.sync.processingBody)).not.toBeInTheDocument();
    expect(screen.queryByText(content.sync.synchronizedBody)).not.toBeInTheDocument();
  });

  it('shows the post-sign synchronization banner (Synchronized) on an active application', async () => {
    await renderDetail('app-004'); // active → sync synchronized
    expect(screen.getByText(content.sync.synchronizedBody)).toBeInTheDocument();
  });

  /* ── J-06 Interview Scheduling & Confirmation (applicant half) ─────────── */

  it('J-06/F1: selecting a slot requires confirmation, then updates the status', async () => {
    await renderDetail('app-008'); // action = manage-interview
    const group = screen.getByRole('group', { name: content.interview.slotLegend });
    const firstSlot = within(group).getAllByRole('radio')[0];
    await userEvent.setup().click(firstSlot);
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: content.interview.selectSlot }));
    // Confirmation dialog (§0.5).
    expect(await screen.findByText(content.confirmSlot.title)).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: content.confirmSlot.confirm }));
    // Success + status transitions to Interview Scheduled.
    expect(await screen.findByText(content.success.slot)).toBeInTheDocument();
    expect(screen.getByText(content.statuses['interview-scheduled'])).toBeInTheDocument();
    // F1/AC-5 — the confirmed time is shown back, and the slot picker is gone.
    expect(
      screen.getByRole('heading', { name: content.interview.confirmedHeading })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: content.interview.slotLegend })
    ).not.toBeInTheDocument();
  });

  it('J-06/F1/AC-4: shows the selection deadline as text, not colour alone', async () => {
    await renderDetail('app-008');
    // P-J4 — the SLA badge label AND a sentence saying how long is left.
    expect(screen.getByText(content.interview.sla.labels.approaching)).toBeInTheDocument();
    expect(screen.getByText(content.interview.sla.remaining(1))).toBeInTheDocument();
  });

  it('J-06/F4/AC-1: an applicant whom no proposed slot suits can ask for other times', async () => {
    await renderDetail('app-008');
    // The reschedule request is offered ALONGSIDE selecting, not after failing.
    expect(screen.getByRole('group', { name: content.interview.slotLegend })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: content.interview.reschedule.action }));

    await user.type(
      screen.getByLabelText(content.interview.reschedule.noteLabel, { exact: false }),
      'الصباح أنسب لي'
    );
    await user.click(screen.getByRole('button', { name: content.interview.reschedule.confirm }));

    expect(await screen.findByText(content.success.rescheduleRequested)).toBeInTheDocument();
    // F4/AC-4 — waiting for new slots: the stale proposals are gone, not dead.
    expect(screen.getByText(content.interview.reschedule.pendingTitle)).toBeInTheDocument();
    expect(screen.getByText('الصباح أنسب لي')).toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: content.interview.slotLegend })
    ).not.toBeInTheDocument();
    // Only one request at a time.
    expect(
      screen.queryByRole('button', { name: content.interview.reschedule.action })
    ).not.toBeInTheDocument();
  });

  it('J-06/F4/AC-2 + AC-6: reschedule stays available after confirming, and the ticket number never changes', async () => {
    await renderDetail('app-008');
    const ticket = screen.getByText('INT-2026-0417');
    expect(ticket).toBeInTheDocument();

    // Confirm a slot first.
    const user = userEvent.setup();
    await user.click(
      within(screen.getByRole('group', { name: content.interview.slotLegend })).getAllByRole(
        'radio'
      )[0]
    );
    await user.click(screen.getByRole('button', { name: content.interview.selectSlot }));
    await user.click(screen.getByRole('button', { name: content.confirmSlot.confirm }));
    await screen.findByText(content.success.slot);

    // AC-2 — still able to ask for a different time.
    expect(
      screen.getByRole('button', { name: content.interview.reschedule.action })
    ).toBeInTheDocument();
    expect(screen.getByText(content.interview.reschedule.afterConfirming)).toBeInTheDocument();

    // AC-6 — a reschedule never issues a new interview number.
    await user.click(screen.getByRole('button', { name: content.interview.reschedule.action }));
    await user.click(screen.getByRole('button', { name: content.interview.reschedule.confirm }));
    expect(await screen.findByText(content.success.rescheduleRequested)).toBeInTheDocument();
    expect(screen.getByText('INT-2026-0417')).toBeInTheDocument();
  });

  /* ── J-11 Applicant Signing & Activation ───────────────────────────────── */

  it('J-11/F1/AC-2: shows the whole agreement document, and says no PDF download exists', async () => {
    await renderDetail('app-011'); // agreement-pending → decide
    expect(
      screen.getByRole('heading', { name: content.agreementPreview.heading })
    ).toBeInTheDocument();
    // The complete document in-page — legal text, the creator's terms, merged data.
    expect(screen.getByRole('heading', { name: documentCopy.bodyHeading })).toBeInTheDocument();
    expect(screen.getByText(MOCK_AGREEMENT_BODY_TEXT)).toBeInTheDocument();
    expect(screen.getByText('تاريخ بداية الاتفاقية')).toBeInTheDocument();
    expect(screen.getByText('رقم الآيبان')).toBeInTheDocument();
    // How acceptance is recorded — an internal acceptance, not a certified e-signature.
    expect(
      screen.getByText(documentCopy.signatureMethods['internal-acceptance'])
    ).toBeInTheDocument();
    // No fabricated download link while document storage is unresolved.
    expect(screen.getByText(content.agreementPreview.downloadUnavailable)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: content.agreementPreview.download })
    ).not.toBeInTheDocument();
  });

  it('J-11/F1: offers exactly the three decisions, and no PDF upload', async () => {
    await renderDetail('app-011');
    for (const label of [
      content.agreementDecision.sign,
      content.agreementDecision.reject,
      content.agreementDecision.requestModification,
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    // AC-3 — the signature is captured in-platform, so nothing is uploaded here.
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it('J-11/F1/AC-3: e-signing in-platform needs a signature, then → Approved + Processing sync', async () => {
    await renderDetail('app-011');
    const user = await openDecision(content.agreementDecision.sign);

    // The signature is mandatory — confirming empty is refused, not submitted.
    await user.click(
      screen.getByRole('button', { name: content.agreementDecision.signDialog.confirm })
    );
    expect(
      await screen.findByText(content.agreementDecision.errors['signature-missing'])
    ).toBeInTheDocument();
    expect(screen.queryByText(content.success.signed)).not.toBeInTheDocument();

    await user.type(
      screen.getByLabelText(content.agreementDecision.signDialog.signatureLabel, { exact: false }),
      'المستخدم التجريبي'
    );
    await user.click(
      screen.getByRole('button', { name: content.agreementDecision.signDialog.confirm })
    );

    // `BR-0214`: Approved business status + a SEPARATE post-sign sync banner.
    expect(await screen.findByText(content.success.signed)).toBeInTheDocument();
    expect(screen.getByText(content.statuses.approved)).toBeInTheDocument();
    expect(screen.getByText(content.sync.processingBody)).toBeInTheDocument();
    // No signed PDF is generated, so none is fabricated in the attachments.
    expect(screen.queryByText('agreement-signed.pdf')).not.toBeInTheDocument();
  });

  it('J-11/F1/AC-4: rejecting warns of permanence, requires an acknowledgement, then closes the application', async () => {
    await renderDetail('app-011');
    const user = await openDecision(content.agreementDecision.reject);

    // The permanence is stated BEFORE the act, and confirm is gated on it.
    expect(
      await screen.findByText(content.agreementDecision.rejectDialog.warning)
    ).toBeInTheDocument();
    const confirm = screen.getByRole('button', {
      name: content.agreementDecision.rejectDialog.confirm,
    });
    expect(confirm).toBeDisabled();

    await user.click(
      screen.getByLabelText(content.agreementDecision.rejectDialog.acknowledgeLabel, {
        exact: false,
      })
    );
    await user.click(confirm);

    expect(await screen.findByText(content.success.rejected)).toBeInTheDocument();
    expect(screen.getByText(content.statuses.closed)).toBeInTheDocument();
    expect(screen.getByText(content.agreementDecision.declinedNotice)).toBeInTheDocument();
    // No return path: the decision buttons are gone, not merely disabled.
    expect(
      screen.queryByRole('button', { name: content.agreementDecision.sign })
    ).not.toBeInTheDocument();
  });

  it('J-11/F1/AC-5: a modification request needs a note and returns to the preparer', async () => {
    await renderDetail('app-011');
    const user = await openDecision(content.agreementDecision.requestModification);

    // The note is mandatory — the preparer must know what to change.
    await user.click(
      screen.getByRole('button', { name: content.agreementDecision.modificationDialog.confirm })
    );
    expect(
      await screen.findByText(content.agreementDecision.errors['note-missing'])
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(content.agreementDecision.modificationDialog.noteLabel, {
        exact: false,
      }),
      'يرجى تعديل تاريخ بداية الاتفاقية'
    );
    await user.click(
      screen.getByRole('button', { name: content.agreementDecision.modificationDialog.confirm })
    );

    expect(await screen.findByText(content.success.modificationRequested)).toBeInTheDocument();
    expect(screen.getByText(content.agreementDecision.modificationNotice)).toBeInTheDocument();
    expect(screen.getByText('يرجى تعديل تاريخ بداية الاتفاقية')).toBeInTheDocument();
    // The application is NOT closed — it waits for the revised agreement (AC-7).
    expect(screen.getByText(content.statuses['agreement-pending'])).toBeInTheDocument();
  });

  it('J-08/F2/AC-3: an exempted interview reads as passed, and the exemption is never disclosed', async () => {
    // `app-010` skipped the interview stages entirely (screening exempted it, J-08).
    // The timeline is derived from the business status, and `TimelineStageDto`
    // has no exemption field — so the trainer sees a passed step and nothing else.
    await renderDetail('app-010'); // approval-in-progress
    const timeline = screen.getByRole('list', { name: content.timeline.label });
    const interviewStep = within(timeline).getByText(content.stages.interview).closest('li');
    expect(interviewStep).not.toBeNull();
    // Not the current step, and not an error — it is behind us.
    expect(interviewStep).not.toHaveAttribute('aria-current');
    for (const word of ['إعفاء', 'معفى', 'exempt', 'Exempt']) {
      expect(screen.queryByText(new RegExp(word))).not.toBeInTheDocument();
    }
  });

  it('shows the reviewer-authored rejection reason for a rejected application (never a bare status)', async () => {
    const { container } = await renderDetail('app-002'); // rejected
    const note = screen.getByRole('note');
    // The reason is labelled and carries substantive authored text.
    expect(within(note).getByText(content.rejection.heading)).toBeInTheDocument();
    expect(note.textContent?.length ?? 0).toBeGreaterThan(content.rejection.heading.length + 20);
    // The business status badge still reads Rejected — the reason supplements it.
    expect(screen.getByText(content.statuses.rejected)).toBeInTheDocument();
    // Persistent state, not a live alert; and no a11y violations in this state.
    await expectNoA11yViolations(container);
  });

  it('shows no rejection reason for a non-rejected application', async () => {
    await renderDetail('app-010'); // approval-in-progress
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(screen.queryByText(content.rejection.heading)).not.toBeInTheDocument();
  });

  it('renders per-service outcomes', async () => {
    await renderDetail('app-004'); // active → accepted
    const heading = screen.getByRole('heading', { name: content.perService.heading });
    expect(heading).toBeInTheDocument();
    expect(screen.getAllByText(content.perService.outcomes.accepted).length).toBeGreaterThan(0);
  });

  it('lists attachments without a fabricated download (G26 storage pending)', async () => {
    await renderDetail('app-004');
    expect(screen.getByRole('heading', { name: content.attachments.heading })).toBeInTheDocument();
    expect(screen.getByText('cv.pdf')).toBeInTheDocument();
  });

  it('shows an error state with retry on API failure, and recovers', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['trainer']);
    const { user } = { user: userEvent.setup() };
    renderExpertHubAt(expertHubPaths.applicationDetail('app-010'));
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectProvider();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(
      await screen.findByRole('heading', { level: 1, name: content.summary.heading })
    ).toBeInTheDocument();
  });

  it('maps 401/403 to session-expired / unauthorized copy', async () => {
    injectProvider({ failWith: { status: 401, message: '' } });
    seedExpertHubSession(['trainer']);
    const first = renderExpertHubAt(expertHubPaths.applicationDetail('app-010'));
    expect(await screen.findByText(content.errors.sessionTitle)).toBeInTheDocument();
    first.unmount();

    injectProvider({ failWith: { status: 403, message: '' } });
    renderExpertHubAt(expertHubPaths.applicationDetail('app-010'));
    expect(await screen.findByText(content.errors.unauthorizedTitle)).toBeInTheDocument();
  });

  it('switches language across the detail', async () => {
    const { user } = await renderDetail('app-010');
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: getApplicationDetailContent('en').summary.heading,
      })
    ).toBeInTheDocument();
  });

  it('renders RTL by default', async () => {
    await renderDetail('app-010');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = await renderDetail('app-011'); // J-11 decision stage: richest UI
    await expectNoA11yViolations(container);
  });

  /* ── The submitted answers (`dm-gap-01.2026-09-21`) ───────────────────────
   * `education`, `certifications` and `experience` are repeatable groups, so a
   * submitted application holds as many qualifications, certificates and past
   * roles as the applicant entered — and the detail page must show all of them.
   *
   * ⚠️ `GET v1/applications/{id}` does NOT serve the answers today:
   * `ApplicationDetailWire` has no `FormSchema`, no `Values` and no `Entries`,
   * which is why `submittedForm` in the page is the one seam and why these
   * tests hand the page the payload directly. The shape is the draft wire's
   * own (`values` + optional `entries`), not an invented one.
   * ------------------------------------------------------------------------ */

  /** Serve `app-010` with the submitted answers attached, as the seam expects. */
  async function renderDetailWithAnswers(answers: {
    readonly values: Record<string, unknown>;
    readonly entries?: Record<
      string,
      readonly { entryId: string; values: Record<string, unknown> }[]
    >;
  }) {
    const base = createMockApplicationsProvider({ latencyMs: 0 });
    const loaded = await base.getApplication('app-010');
    if (!loaded.ok) {
      throw new Error('fixture application missing');
    }
    setApplicationsServiceForTesting({
      ...base,
      getApplication: () =>
        Promise.resolve({
          ok: true,
          value: { ...loaded.value, formSchema: APPLICATION_FORM_SCHEMA, ...answers },
        }),
    } as unknown as ReturnType<typeof createMockApplicationsProvider>);
    return renderDetail('app-010');
  }

  const SUBMITTED_EDUCATION = [
    {
      entryId: 'app-edu-alpha',
      values: {
        qualificationType: 'bachelor',
        generalSpecialization: 'محاسبة',
        specializationDetail: 'spec-004',
        universityName: 'uni-001',
        qualificationDate: '2005-06-01',
      },
    },
    {
      entryId: 'app-edu-beta',
      values: {
        qualificationType: 'master',
        generalSpecialization: 'تمويل',
        specializationDetail: 'spec-004',
        universityName: 'uni-002',
        qualificationDate: '2010-06-01',
      },
    },
    {
      entryId: 'app-edu-gamma',
      values: {
        qualificationType: 'doctorate',
        generalSpecialization: 'اقتصاد',
        specializationDetail: 'spec-004',
        universityName: 'uni-001',
        qualificationDate: '2018-06-01',
      },
    },
  ];

  it('dm-gap-01: shows every submitted qualification, not a flattened one', async () => {
    await renderDetailWithAnswers({
      values: SUBMITTED_EDUCATION[0].values,
      entries: { education: SUBMITTED_EDUCATION },
    });
    for (const ordinal of [1, 2, 3]) {
      expect(screen.getByRole('group', { name: `المؤهل ${ordinal}` })).toBeInTheDocument();
    }
    expect(screen.queryByRole('group', { name: 'المؤهل 4' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'المؤهلات العلمية' })).toBeInTheDocument();
  });

  it('dm-gap-01: an application submitted before entries existed shows exactly one', async () => {
    // No `entries` key at all — the historical wire. One entry, built from the
    // flat `values`; not zero, and not the same entry twice.
    await renderDetailWithAnswers({ values: SUBMITTED_EDUCATION[0].values });
    expect(screen.getAllByRole('group', { name: /^المؤهل \d+$/ })).toHaveLength(1);
    expect(
      within(screen.getByRole('group', { name: 'المؤهل 1' })).getByText('بكالوريوس')
    ).toBeInTheDocument();
  });

  it('dm-gap-01: option codes render as labels, and no internal id is shown', async () => {
    const { container } = await renderDetailWithAnswers({
      values: SUBMITTED_EDUCATION[0].values,
      entries: { education: SUBMITTED_EDUCATION },
    });
    const third = screen.getByRole('group', { name: 'المؤهل 3' });
    expect(within(third).getByText('دكتوراه')).toBeInTheDocument();
    expect(within(third).getByText('جامعة الملك سعود')).toBeInTheDocument();
    const text = container.textContent ?? '';
    for (const internal of [
      'app-edu-alpha',
      'app-edu-beta',
      'app-edu-gamma',
      'entryId',
      'entryIndex',
      'qualificationType',
      'doctorate',
      'uni-001',
      'spec-004',
    ]) {
      expect(text).not.toContain(internal);
    }
  });

  it('dm-gap-01: the same path shows every practical-experience entry, accessibly', async () => {
    await renderDetailWithAnswers({
      values: { jobTitle: 'محلل مالي', organization: 'بنك تجريبي' },
      entries: {
        experience: [
          {
            entryId: 'app-exp-alpha',
            values: {
              jobTitle: 'محلل مالي',
              organization: 'بنك تجريبي',
              currentlyEmployed: false,
              experienceStartDate: '2010-01-01',
              experienceEndDate: '2015-12-31',
              responsibilities: 'إعداد التحليلات المالية.',
              yearsOfExperience: '5-10',
            },
          },
          {
            entryId: 'app-exp-beta',
            values: {
              jobTitle: 'مستشار مالي أول',
              organization: 'شركة تجريبية',
              currentlyEmployed: true,
              experienceStartDate: '2016-01-01',
              responsibilities: 'تقديم الاستشارات المالية.',
            },
          },
        ],
      },
    });
    const first = screen.getByRole('group', { name: 'الخبرة 1' });
    expect(within(first).getByText('محلل مالي')).toBeInTheDocument();
    expect(within(first).getByText('من 5 إلى 10 سنوات')).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'الخبرة 2' })).getByText('مستشار مالي أول')
    ).toBeInTheDocument();
    await expectNoA11yViolations(screen.getByRole('group', { name: 'الخبرة 2' }));
  });

  it('shows the submitted answers, and nothing at all when none are served', async () => {
    /*
     * This assertion is the inverse of the one it replaces, because the fact
     * changed rather than the rule. The detail wire used to carry no schema
     * and no values — the page had never shown a single submitted answer — so
     * the guard was «render nothing rather than an empty or invented block».
     * `ApplicationDetailWire` now carries `formSchema` / `values` / `entries`,
     * so the answers section renders for real; the guard survives as the
     * second half, for a payload that genuinely has no form.
     */
    // Served: the section renders the applicant's own answers.
    await renderDetail('app-010');
    expect(await screen.findByRole('heading', { name: 'المؤهلات العلمية' })).toBeInTheDocument();
  });

  it('renders no answers section for a payload that carries no form', async () => {
    // The surviving half of the guard above: a provider that sends no schema
    // must produce no section at all, never an empty or invented block.
    const base = createMockApplicationsProvider({ latencyMs: 0 });
    const loaded = await base.getApplication('app-010');
    if (!loaded.ok) {
      throw new Error('fixture application missing');
    }
    const {
      formSchema: _schema,
      values: _values,
      entries: _entries,
      ...withoutForm
    } = loaded.value;
    setApplicationsServiceForTesting({
      ...base,
      getApplication: () => Promise.resolve({ ok: true, value: withoutForm }),
    } as unknown as ReturnType<typeof createMockApplicationsProvider>);

    await renderDetail('app-010');
    expect(screen.queryByRole('heading', { name: 'المؤهلات العلمية' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /^المؤهل \d+$/ })).not.toBeInTheDocument();
  });
});
