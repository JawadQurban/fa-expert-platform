import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UserEvent } from '@testing-library/user-event';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import type { ExpertHubApiClient } from '../../shared/services/apiClient';
import { createHttpAssignmentProvider, setAssignmentServiceForTesting } from './assignmentService';
import { getAssignmentsContent } from './assignments.content';
import { validateCentreRequest, type CreateCentreRequestInput } from './centreRequestForm.types';
import {
  MOCK_FAST_CLOSED_PLAN,
  MOCK_FAST_OPEN_PLAN,
  createMockAssignmentProvider,
} from './mockAssignmentProvider';

const form = getAssignmentsContent('ar').form;
const fast = form.fast;

async function pickOption(user: UserEvent, combobox: string | RegExp, option: string | RegExp) {
  await user.click(screen.getByRole('combobox', { name: combobox }));
  await user.click(await screen.findByRole('option', { name: option }));
}

async function openGeneralProgram() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalAssignmentNew);
  await screen.findByRole('heading', { level: 1, name: form.title });
  await pickOption(result.user, form.centreLabel, 'البنوك والتمويل');
  await pickOption(result.user, form.requestTypeLabel, form.requestTypes['general-program']);
  await pickOption(result.user, new RegExp(form.responsibleLabel), 'منسّق البرامج');
  return result;
}

const openPlanLabel = fast.planOption('PL-2026-01', '2026-12-06', '2026-12-08', 'الرياض');
/** The plan's programme name, filled in and locked once the plan is linked. */
const linkedName = async () =>
  expect(await screen.findByDisplayValue('برنامج القيادة المالية')).toHaveAttribute('readonly');

const closedPlanLabel = fast.planOption('PL-2025-09', '2026-12-13', '2026-12-14', 'جدة');

describe('RUN-030 / BUG-004 — linking a centre request to a FAST plan', () => {
  const sent: CreateCentreRequestInput[] = [];

  beforeEach(() => {
    clearExpertHubSession();
    sent.length = 0;
    const provider = createMockAssignmentProvider({ latencyMs: 0, fastAvailable: true });
    setAssignmentServiceForTesting({
      ...provider,
      createRequest: (input) => {
        sent.push(input);
        return provider.createRequest(input);
      },
    });
  });

  afterEach(() => {
    setAssignmentServiceForTesting(null);
  });

  it('a picked open plan fills the form from FAST and locks what FAST supplied', async () => {
    const { user } = await openGeneralProgram();
    expect(screen.getByRole('heading', { name: fast.heading })).toBeInTheDocument();

    await pickOption(user, fast.programmeLabel, 'PRG-001 — برنامج القيادة المالية');
    await pickOption(user, fast.planLabel, openPlanLabel);

    await linkedName();
    const name = screen.getByLabelText(new RegExp(form.fields.programName));
    expect(name).toHaveValue('برنامج القيادة المالية');
    expect(name).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: new RegExp(form.fields.city) })).toHaveValue(
      'الرياض'
    );

    // FAST had no matching trainee level: that one is still the centre's.
    await pickOption(user, form.fields.traineeLevel, form.options.traineeLevels.advanced);
    const file = new File(['x'], 'brochure.pdf', { type: 'application/pdf' });
    await user.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement,
      file
    );
    await pickOption(user, form.fields.specializationDomain, 'التحليل المالي والتمويل');
    await user.click(screen.getByRole('button', { name: form.submit }));

    expect(await screen.findByText(form.successTitle)).toBeInTheDocument();
    expect(sent[0].fastPlanId).toBe(MOCK_FAST_OPEN_PLAN);
    expect(sent[0].dateFrom).toBe('2026-12-06');
    expect(sent[0].programName).toBe('برنامج القيادة المالية');
  }, 30000);

  it('a linked plan with a FAST prospectus needs no uploaded brochure', async () => {
    const { user } = await openGeneralProgram();
    await pickOption(user, fast.programmeLabel, 'PRG-001 — برنامج القيادة المالية');
    await pickOption(user, fast.planLabel, openPlanLabel);
    await linkedName();

    await pickOption(user, form.fields.traineeLevel, form.options.traineeLevels.advanced);
    await pickOption(user, form.fields.specializationDomain, 'التحليل المالي والتمويل');
    await user.click(screen.getByRole('button', { name: form.submit }));

    expect(await screen.findByText(form.successTitle)).toBeInTheDocument();
    expect(sent[0].attachmentId).toBeNull();
    expect(sent[0].fastPlanId).toBe(MOCK_FAST_OPEN_PLAN);
  }, 30000);

  it('a closed plan is refused and links nothing', async () => {
    const { user } = await openGeneralProgram();
    await pickOption(user, fast.programmeLabel, 'PRG-001 — برنامج القيادة المالية');
    await pickOption(user, fast.planLabel, closedPlanLabel);

    expect(await screen.findByText(fast.closed)).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(form.fields.programName))).not.toHaveAttribute(
      'readonly'
    );
  }, 20000);

  it('unlinking returns the form to manual entry', async () => {
    const { user } = await openGeneralProgram();
    await pickOption(user, fast.programmeLabel, 'PRG-001 — برنامج القيادة المالية');
    await pickOption(user, fast.planLabel, openPlanLabel);
    await linkedName();

    await user.click(screen.getByRole('button', { name: fast.clear }));
    expect(screen.getByLabelText(new RegExp(form.fields.programName))).not.toHaveAttribute(
      'readonly'
    );
  }, 20000);

  it('passes axe with the picker open', async () => {
    const { user, container } = await openGeneralProgram();
    await pickOption(user, fast.programmeLabel, 'PRG-001 — برنامج القيادة المالية');
    await expectNoA11yViolations(container);
  }, 20000);

  it('without FAST the picker is hidden and the form stays manual', async () => {
    setAssignmentServiceForTesting(createMockAssignmentProvider({ latencyMs: 0 }));
    await openGeneralProgram();
    expect(await screen.findByLabelText(new RegExp(form.fields.programName))).not.toHaveAttribute(
      'readonly'
    );
    expect(screen.queryByRole('heading', { name: fast.heading })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: fast.programmeLabel })).not.toBeInTheDocument();
  }, 20000);

  it('the server’s refusal of a plan closed meanwhile is shown', async () => {
    const provider = createMockAssignmentProvider({ latencyMs: 0, fastAvailable: true });
    setAssignmentServiceForTesting({
      ...provider,
      createRequest: () =>
        Promise.resolve({
          ok: false as const,
          error: { status: 400, message: 'fast-plan-closed' },
        }),
    });
    const { user } = await openGeneralProgram();
    await pickOption(user, fast.programmeLabel, 'PRG-001 — برنامج القيادة المالية');
    await pickOption(user, fast.planLabel, openPlanLabel);
    await linkedName();
    await pickOption(user, form.fields.traineeLevel, form.options.traineeLevels.advanced);
    await user.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement,
      new File(['x'], 'brochure.pdf', { type: 'application/pdf' })
    );
    await pickOption(user, form.fields.specializationDomain, 'التحليل المالي والتمويل');
    await user.click(screen.getByRole('button', { name: form.submit }));
    expect(await screen.findByText(fast.closed)).toBeInTheDocument();
  }, 30000);

  it('the HTTP provider reads the three FAST lookups under the request routes', async () => {
    const gets: string[] = [];
    const client: ExpertHubApiClient = {
      get: <T,>(path: string) => {
        gets.push(path);
        return Promise.resolve({ ok: true as const, value: {} as T });
      },
      post: () => Promise.resolve({ ok: false, error: { status: 500, message: 'unused' } }),
    };
    const provider = createHttpAssignmentProvider(client);
    await provider.listFastProgrammes(' قيادة ');
    await provider.listFastPlans('prg 1');
    await provider.getFastPlan(MOCK_FAST_CLOSED_PLAN);
    await provider.listFastProgrammes('', false);
    await provider.getFastProgramme('prg 1');
    expect(gets).toEqual([
      `v1/internal/assignment-requests/lookups/fast-programmes?q=${encodeURIComponent('قيادة')}`,
      'v1/internal/assignment-requests/lookups/fast-programmes/prg%201/plans',
      `v1/internal/assignment-requests/lookups/fast-plans/${MOCK_FAST_CLOSED_PLAN}`,
      'v1/internal/assignment-requests/lookups/fast-programmes?upcomingPlansOnly=false',
      'v1/internal/assignment-requests/lookups/fast-programmes/prg%201',
    ]);
  });

  /* ── P-362 — with FAST configured, forms 1–2 must link a plan ─────────── */

  it('P-362: with FAST configured, a general programme cannot be submitted without a plan', async () => {
    const { user } = await openGeneralProgram();
    await user.click(screen.getByRole('button', { name: form.submit }));

    expect(await screen.findAllByText(form.errors['fast-plan-required'])).not.toHaveLength(0);
    expect(sent).toHaveLength(0);
  }, 20000);

  it('P-362: the plan is required on forms 1–2 only, and only while FAST is configured', () => {
    expect(validateCentreRequest({ requestType: 'general-program' })).not.toContain(
      'fast-plan-required'
    );
    expect(
      validateCentreRequest({ requestType: 'general-program' }, { fastPlanRequired: true })
    ).toContain('fast-plan-required');
    expect(
      validateCentreRequest({ requestType: 'seminar' }, { fastPlanRequired: true })
    ).not.toContain('fast-plan-required');
  });

  /* ── P-363 — form 4 picks a programme, no plan ─────────────────────────── */

  it('P-363: a content-development request links a FAST programme without a plan', async () => {
    seedExpertHubSession(['internal']);
    const { user } = renderExpertHubAt(expertHubPaths.internalAssignmentNew);
    await screen.findByRole('heading', { level: 1, name: form.title });
    await pickOption(user, form.centreLabel, 'البنوك والتمويل');
    await pickOption(user, form.requestTypeLabel, form.requestTypes['content-development-request']);
    await pickOption(user, new RegExp(form.responsibleLabel), 'منسّق البرامج');

    expect(screen.getByRole('heading', { name: fast.programmeHeading })).toBeInTheDocument();
    await pickOption(user, fast.programmeLabel, 'PRG-001 — برنامج القيادة المالية');
    await linkedName();
    expect(screen.queryByRole('combobox', { name: fast.planLabel })).not.toBeInTheDocument();
    const name = screen.getByLabelText(new RegExp(form.fields.contentTitle));
    expect(name).toHaveValue('برنامج القيادة المالية');
    expect(name).toHaveAttribute('readonly');

    // The rest is the centre's: no plan supplies it.
    await pickOption(user, form.fields.daysCount, '3');
    for (const trigger of [form.fields.requiredDateFrom, form.fields.requiredDateTo]) {
      await user.click(
        screen.getByRole('button', { name: new RegExp(trigger.replace(/[()]/g, '\\$&')) })
      );
      await user.click(await screen.findByRole('button', { name: /^اليوم/ }));
    }
    await pickOption(user, form.fields.period, form.options.periods.morning);
    await pickOption(user, form.fields.deliveryMechanism, form.options.deliveryModes.onsite);
    await user.type(screen.getByRole('textbox', { name: new RegExp(form.fields.city) }), 'الرياض');
    await pickOption(user, form.fields.contentLanguage, form.options.languages.ar);
    await pickOption(user, form.fields.traineeLevel, form.options.traineeLevels.advanced);
    await pickOption(user, form.fields.specializationDomain, 'التحليل المالي والتمويل');
    await user.click(screen.getByRole('button', { name: form.submit }));

    expect(await screen.findByText(form.successTitle)).toBeInTheDocument();
    expect(sent[0].fastProgramId).toBe('fast-prg-001');
    expect(sent[0].fastPlanId).toBeNull();
  }, 40000);
});
