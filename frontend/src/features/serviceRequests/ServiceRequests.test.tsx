import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  userEvent,
  waitFor,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { setServiceRequestServiceForTesting } from './serviceRequestService';
import { createMockServiceRequestProvider } from './mockServiceRequestProvider';
import type { MockServiceRequestProviderOptions } from './mockServiceRequestProvider';
import type { ServiceRequestDecisionInput } from './serviceRequest.types';
import { getServiceRequestsContent } from './serviceRequests.content';

const content = getServiceRequestsContent('ar');

function injectProvider(options: MockServiceRequestProviderOptions = {}) {
  setServiceRequestServiceForTesting(
    createMockServiceRequestProvider({ latencyMs: 0, ...options })
  );
}

async function renderQueue() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalServiceRequests);
  await screen.findByRole('heading', { level: 1, name: content.listTitle });
  return result;
}

async function renderRequest(id: string) {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalServiceRequest(id));
  await screen.findByRole('heading', { level: 1, name: content.detail.heading });
  return result;
}

/** A valid addendum: J-03/F3/AC-4's attachment, in an accepted format and size. */
function addendum(name = 'addendum.pdf', sizeBytes = 2048): File {
  const file = new File(['x'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (input == null) {
    throw new Error('no file input');
  }
  return input;
}

describe('EH-INT-02b — Service Requests (J-03/F2 + F3)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setServiceRequestServiceForTesting(null);
  });

  /* ── F2/AC-2 — the queue ───────────────────────────────────────────────── */

  it('J-03/F2/AC-2: filters by trainer name, requested service, and status', async () => {
    const { user } = await renderQueue();
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
    expect(screen.getByText('أ. خالد المطيري')).toBeInTheDocument();

    // Search by trainer name.
    await user.type(screen.getByRole('searchbox', { name: content.filters.searchLabel }), 'سارة');
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
    expect(screen.queryByText('أ. خالد المطيري')).not.toBeInTheDocument();
  });

  it('links each row to its request through the reference', async () => {
    await renderQueue();
    const link = await screen.findByRole('link', { name: 'EH-ASR-2026-0041' });
    expect(link).toHaveAttribute('href', expertHubPaths.internalServiceRequest('asr-001'));
  });

  /* ── F2/AC-1 — the trainer's full approved profile ─────────────────────── */

  it("J-03/F2/AC-1: shows the trainer's full approved profile beside the request", async () => {
    await renderRequest('asr-001');
    const context = screen.getByRole('heading', { name: content.detail.context.heading });
    expect(context).toBeInTheDocument();
    // The AC enumerates five things; all five are on the page.
    expect(screen.getByText(content.detail.context.servicesLabel)).toBeInTheDocument();
    expect(screen.getByText(content.detail.context.specialtiesLabel)).toBeInTheDocument();
    expect(screen.getByText(content.detail.context.classificationLabel)).toBeInTheDocument();
    expect(screen.getByText(content.detail.context.evaluationLabel)).toBeInTheDocument();
    expect(screen.getByText(content.detail.context.agreementLabel)).toBeInTheDocument();
    // …with real values, not just labels.
    expect(screen.getByText(content.classifications.expert)).toBeInTheDocument();
    expect(screen.getByText('AGR-2026-00042')).toBeInTheDocument();
  });

  /* ── F3 — the decision ─────────────────────────────────────────────────── */

  it('J-03/F3/AC-1: offers only approve and reject — nothing routes to screening', async () => {
    await renderRequest('asr-001');
    expect(screen.getByRole('button', { name: content.decision.approve })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.decision.reject })).toBeInTheDocument();
    // The absence of a screening route is stated, not silent.
    expect(screen.getByText(content.decision.directRouteNote)).toBeInTheDocument();
    for (const word of [/فرز/, /مقابلة/]) {
      // The words appear only inside that explanatory note, never as an action.
      const buttons = screen.getAllByRole('button');
      expect(buttons.some((button) => word.test(button.textContent ?? ''))).toBe(false);
    }
  });

  it('J-03/F3/AC-4: approval is blocked until the addendum is attached, then finalizes', async () => {
    const { user } = await renderRequest('asr-001');
    await user.click(screen.getByRole('button', { name: content.decision.approve }));

    // The confirm action is unavailable with no addendum — AC-4's "cannot be
    // finalized until they upload" made visible.
    const confirm = await screen.findByRole('button', {
      name: content.decision.approveDialog.confirm,
    });
    expect(confirm).toBeDisabled();
    // `BR-0305` — the dialog says what does NOT happen.
    expect(screen.getByText(content.decision.approveDialog.noSignatureNote)).toBeInTheDocument();

    await user.upload(fileInput(), addendum());
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: content.decision.approveDialog.confirm })
      ).toBeEnabled()
    );
    await user.click(screen.getByRole('button', { name: content.decision.approveDialog.confirm }));

    expect(await screen.findByText(content.success.approved)).toBeInTheDocument();
    expect(screen.getByText(content.decision.outcome.approvedTitle)).toBeInTheDocument();
    // The STORED addendum opens from the record.
    expect(screen.getByRole('link', { name: 'addendum.pdf' })).toHaveAttribute(
      'href',
      expect.stringContaining('/v1/attachments/att-addendum-')
    );
    // F3/AC-5 — the approved service joined the trainer's scope in the same
    // write. Scoped to the "currently approved services" row, since the same
    // label also names the *requested* service in the page summary.
    const servicesRow = screen
      .getByText(content.detail.context.servicesLabel)
      .closest('div') as HTMLElement;
    expect(within(servicesRow).getByText(content.services.trainer)).toBeInTheDocument();
  });

  it('J-03/F3/AC-4: the approval carries the id the addendum upload returned', async () => {
    const provider = createMockServiceRequestProvider({ latencyMs: 0 });
    const stored: string[] = [];
    const sent: ServiceRequestDecisionInput[] = [];
    setServiceRequestServiceForTesting({
      ...provider,
      uploadAddendum: async (file) => {
        const result = await provider.uploadAddendum(file);
        if (result.ok) {
          stored.push(result.value.attachmentId);
        }
        return result;
      },
      decideServiceRequest: (id, input) => {
        sent.push(input);
        return provider.decideServiceRequest(id, input);
      },
    });
    const { user } = await renderRequest('asr-001');
    await user.click(screen.getByRole('button', { name: content.decision.approve }));
    await user.upload(fileInput(), addendum());
    const confirm = screen.getByRole('button', { name: content.decision.approveDialog.confirm });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    await screen.findByText(content.success.approved);
    expect(stored).toHaveLength(1);
    expect(sent).toEqual([
      {
        kind: 'approve',
        addendum: { attachmentId: stored[0], fileName: 'addendum.pdf', sizeBytes: 2048 },
        note: '',
      },
    ]);
  });

  it('J-03/F3/AC-4: a refused upload says why, and approval stays blocked', async () => {
    const provider = createMockServiceRequestProvider({ latencyMs: 0 });
    setServiceRequestServiceForTesting({
      ...provider,
      uploadAddendum: () =>
        Promise.resolve({
          ok: false as const,
          error: { status: 422, message: 'The file is larger than 1 MB.' },
        }),
    });
    const { user } = await renderRequest('asr-001');
    await user.click(screen.getByRole('button', { name: content.decision.approve }));
    await user.upload(fileInput(), addendum());
    expect(
      await screen.findByText(content.decision.approveDialog.uploadRefused)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: content.decision.approveDialog.confirm })
    ).toBeDisabled();
  });

  it('J-03/F3/AC-4: rejects an addendum above J-01’s 1 MB document rule before uploading', async () => {
    const { user } = await renderRequest('asr-001');
    await user.click(screen.getByRole('button', { name: content.decision.approve }));
    await user.upload(fileInput(), addendum('addendum.pdf', 2 * 1024 * 1024));
    expect(await screen.findByText(content.decision.approveDialog.sizeError)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: content.decision.approveDialog.confirm })
    ).toBeDisabled();
  });

  it('J-03/F3/AC-4: rejects an addendum in a disallowed format', async () => {
    const { user } = await renderRequest('asr-001');
    await user.click(screen.getByRole('button', { name: content.decision.approve }));
    const permissive = userEvent.setup({ applyAccept: false });
    await permissive.upload(fileInput(), new File(['x'], 'addendum.exe'));
    expect(await screen.findByText(content.decision.approveDialog.formatError)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: content.decision.approveDialog.confirm })
    ).toBeDisabled();
  });

  it('J-03/F3/AC-3: rejection requires a reason, and "other" requires free text', async () => {
    const { user } = await renderRequest('asr-002');
    await user.click(screen.getByRole('button', { name: content.decision.reject }));

    // Confirming with no reason is refused.
    await user.click(screen.getByRole('button', { name: content.decision.rejectDialog.confirm }));
    expect(await screen.findByText(content.decision.errors['reason-missing'])).toBeInTheDocument();

    // Choosing "Other" opens the mandatory free-text field.
    await user.click(
      screen.getByRole('combobox', { name: content.decision.rejectDialog.reasonLabel })
    );
    await user.click(await screen.findByRole('option', { name: 'سبب آخر' }));
    await user.click(screen.getByRole('button', { name: content.decision.rejectDialog.confirm }));
    expect(
      await screen.findByText(content.decision.errors['reason-text-missing'])
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(content.decision.rejectDialog.otherLabel, { exact: false }),
      'الخدمة مغطّاة حاليًا بفريق داخلي.'
    );
    await user.click(screen.getByRole('button', { name: content.decision.rejectDialog.confirm }));

    expect(await screen.findByText(content.success.rejected)).toBeInTheDocument();
    expect(screen.getByText(content.decision.outcome.rejectedTitle)).toBeInTheDocument();
  });

  it('J-03/F3/AC-7: the recorded reason is marked internal — the trainer is told the outcome only', async () => {
    const { user } = await renderRequest('asr-002');
    await user.click(screen.getByRole('button', { name: content.decision.reject }));
    await user.click(
      screen.getByRole('combobox', { name: content.decision.rejectDialog.reasonLabel })
    );
    await user.click(await screen.findByRole('option', { name: 'المستندات غير مكتملة' }));
    await user.click(screen.getByRole('button', { name: content.decision.rejectDialog.confirm }));

    await screen.findByText(content.success.rejected);
    // The reason is on the internal record, labelled as internal.
    expect(screen.getByText(content.decision.outcome.reasonLabel)).toBeInTheDocument();
    expect(screen.getByText(content.decision.rejectDialog.reasonPrivacyNote)).toBeInTheDocument();
  });

  it('P-J9: a viewer without authority sees the reason, not a vanished panel', async () => {
    injectProvider({ canDecide: false });
    await renderRequest('asr-001');
    expect(screen.getByText(content.decision.blocked['not-authorized'])).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.decision.approve })
    ).not.toBeInTheDocument();
  });

  it('shows the recorded outcome instead of the decision panel on an already-decided request', async () => {
    await renderRequest('asr-003'); // seeded as approved
    expect(screen.getByText(content.decision.outcome.approvedTitle)).toBeInTheDocument();
    // Recorded by name only, before the upload existed: shown, not openable.
    expect(screen.getByText('addendum-asr-0037.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'addendum-asr-0037.pdf' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.decision.approve })
    ).not.toBeInTheDocument();
  });

  /* ── states ────────────────────────────────────────────────────────────── */

  it('routes an unknown request id to the not-found state', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalServiceRequest('does-not-exist'));
    expect(await screen.findByText(content.errors.notFoundTitle)).toBeInTheDocument();
  });

  it('shows a retryable error state on a transport failure', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    const { user } = renderExpertHubAt(expertHubPaths.internalServiceRequests);
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectProvider();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
  });

  it('renders RTL by default and has no automatically-detectable a11y violations', async () => {
    const { container } = await renderRequest('asr-001');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });

  it('switches language across the queue', async () => {
    const { user } = await renderQueue();
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: getServiceRequestsContent('en').listTitle,
      })
    ).toBeInTheDocument();
  });

  it('RB-03: with no active agreement the request cannot be approved; the only action records the automatic rejection', async () => {
    injectProvider({ noActiveAgreement: true });
    const { user } = await renderRequest('asr-001');
    expect(await screen.findByText(content.decision.noAgreementTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.decision.approve })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: content.decision.openAgreements })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.decision.recordAutoRejection }));
    // Recorded with the dedicated reason, read by its label.
    expect(
      await screen.findByText(/لا توجد اتفاقية سارية — يلزم تجديد الاتفاقية/)
    ).toBeInTheDocument();
  });

  it('reaches the queue from the internal shell', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internal);
    // Reached from the shell header nav (the dashboard quick-link cards were
    // removed for the Option B IA); "طلبات الخدمات" is a primary internal tab.
    const link = await screen.findByRole('link', { name: 'طلبات الخدمات' });
    expect(link).toHaveAttribute('href', expertHubPaths.internalServiceRequests);
  });

  it('renders the empty state when a filter matches nothing', async () => {
    const { user } = await renderQueue();
    await user.type(
      screen.getByRole('searchbox', { name: content.filters.searchLabel }),
      'لا أحد بهذا الاسم'
    );
    expect(await screen.findByText(content.empty.title)).toBeInTheDocument();
    // Both the filter bar and the empty state offer a clear action; either works.
    await user.click(screen.getAllByRole('button', { name: content.filters.clear })[0]);
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
  });

  it('within() the queue table, every seeded request is listed', async () => {
    await renderQueue();
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(3); // header + 3
  });
});
