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
import { setApplicationsServiceForTesting } from './applicationsService';
import { createMockApplicationsProvider } from './mockApplicationsProvider';
import type { MockApplicationsProviderOptions } from './mockApplicationsProvider';
import { getAddServiceContent } from './addService.content';
import type { UserEvent } from '@testing-library/user-event';

const content = getAddServiceContent('ar');

/** The delta form's controls are the same approved DS Selects as EH-TP-05. */
async function pickOption(user: UserEvent, comboboxName: RegExp, optionName: string) {
  await user.click(screen.getByRole('combobox', { name: comboboxName }));
  await user.click(await screen.findByRole('option', { name: optionName }));
}

/** The Training-only questions a consultant has never been asked. */
async function fillTrainerDelta(user: UserEvent) {
  await pickOption(user, /هل لديك مواد أو حقائب تدريبية جاهزة/, 'نعم');
  await pickOption(user, /نمط التقديم/, 'حضوري');
  await pickOption(user, /سنوات الخبرة التدريبية/, 'أقل من سنتين');
}

function injectProvider(options: MockApplicationsProviderOptions = {}) {
  setApplicationsServiceForTesting(createMockApplicationsProvider({ latencyMs: 0, ...options }));
}

/** app-003 is approved with a single service (consultant) — the eligible case. */
async function renderAddService(id = 'app-003') {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.applicationAddService(id));
  await screen.findByRole('heading', { level: 1, name: content.title });
  return result;
}

describe('EH-TP-06 — Add Service', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setApplicationsServiceForTesting(null);
  });

  it('shows current approved services and the new-service selection', async () => {
    await renderAddService();
    expect(await screen.findByText(content.current.heading)).toBeInTheDocument();
    // The approved service is shown (consultant).
    expect(screen.getByText(content.services.consultant)).toBeInTheDocument();
    expect(screen.getByText(content.selection.heading)).toBeInTheDocument();
  });

  it('J-03/F1/AC-1: an already-approved service is EXCLUDED from the list, not disabled', async () => {
    await renderAddService();
    const group = await screen.findByRole('group', { name: content.selection.legend });
    // Consultant is already approved — it is not an option at all.
    expect(
      within(group).queryByRole('radio', { name: content.services.consultant })
    ).not.toBeInTheDocument();
    // …yet the trainer still sees they hold it, in the read-only section above.
    expect(screen.getByText(content.services.consultant)).toBeInTheDocument();
    // A non-approved service is offered, and enabled.
    expect(within(group).getByRole('radio', { name: content.services.trainer })).toBeEnabled();
  });

  it('BR-0111: asks ONLY the Training-specific questions, never held data', async () => {
    // Since `dm-gap-01.2026-09-21` Section 5 is split per service, so an
    // approved consultant adding Trainer is asked the three Training questions
    // — and nothing they have already answered.
    const { user } = await renderAddService();
    await user.click(screen.getByRole('radio', { name: content.services.trainer }));
    expect(await screen.findByText(content.delta.heading)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /سنوات الخبرة التدريبية/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /نمط التقديم/ })).toBeInTheDocument();
    // Held data is never re-requested (`BR-0111`).
    expect(screen.queryByLabelText(/الاسم الأول \(بالعربية\)/)).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /سنوات خبرة استشارات/ })).not.toBeInTheDocument();
  });

  it('submits to the admin path once the delta is complete (BR-0111/BR-0112)', async () => {
    const { user } = await renderAddService();
    await user.click(screen.getByRole('radio', { name: content.services.trainer }));
    await screen.findByText(content.delta.heading);
    await fillTrainerDelta(user);
    await user.click(screen.getByRole('button', { name: content.submit }));
    // Confirmation dialog (§0.5), then submit.
    expect(await screen.findByText(content.confirm.title)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.confirm.confirm }));
    // Success — routed to admin, request reference issued.
    expect(
      await screen.findByRole('heading', { level: 1, name: content.success.title })
    ).toBeInTheDocument();
    expect(screen.getByText(/EH-ASR-2026-/)).toBeInTheDocument();
    expect(screen.getByText(content.success.note)).toBeInTheDocument();
  });

  it('blocks with a reason when FAST cannot verify current services (P-17)', async () => {
    injectProvider({ addServiceFastUnavailable: true });
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.applicationAddService('app-003'));
    expect(await screen.findByText(content.errors.fastUnavailableTitle)).toBeInTheDocument();
  });

  it('is unavailable for an application that is not approved/active', async () => {
    // app-010 is approval-in-progress → not eligible.
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.applicationAddService('app-010'));
    expect(await screen.findByText(content.errors.notEligibleTitle)).toBeInTheDocument();
  });

  it('switches language across the page', async () => {
    const { user } = await renderAddService();
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: getAddServiceContent('en').title })
    ).toBeInTheDocument();
  });

  it('renders RTL by default', async () => {
    await renderAddService();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container, user } = await renderAddService();
    await user.click(screen.getByRole('radio', { name: content.services.trainer }));
    await screen.findByText(content.delta.heading);
    await expectNoA11yViolations(container);
  });
});
