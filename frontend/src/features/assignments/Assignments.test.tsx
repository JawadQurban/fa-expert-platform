import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UserEvent } from '@testing-library/user-event';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { createHttpAssignmentProvider, setAssignmentServiceForTesting } from './assignmentService';
import type { ExpertHubApiClient } from '../../shared/services/apiClient';
import type { CreateCentreRequestInput } from './centreRequestForm.types';
import { createMockAssignmentProvider } from './mockAssignmentProvider';
import type { MockAssignmentProviderOptions } from './mockAssignmentProvider';
import { getAssignmentsContent } from './assignments.content';
import {
  CENTRE_REQUEST_TYPES,
  headcountOf,
  nomineesOf,
  serviceTypeFor,
  validateCentreRequest,
} from './centreRequestForm.types';

const content = getAssignmentsContent('ar');
const form = content.form;

function injectProvider(options: MockAssignmentProviderOptions = {}) {
  setAssignmentServiceForTesting(createMockAssignmentProvider({ latencyMs: 0, ...options }));
}

async function renderList() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalAssignments);
  await screen.findByRole('heading', { level: 1, name: content.listTitle });
  return result;
}

async function renderForm() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalAssignmentNew);
  await screen.findByRole('heading', { level: 1, name: form.title });
  return result;
}

async function pickOption(
  user: UserEvent,
  comboboxName: string | RegExp,
  optionName: string | RegExp
) {
  await user.click(screen.getByRole('combobox', { name: comboboxName }));
  await user.click(await screen.findByRole('option', { name: optionName }));
}

/** Fill the main options: centre + the given request type + responsible. */
async function fillMainOptions(user: UserEvent, requestTypeLabel: string) {
  await pickOption(user, form.centreLabel, 'البنوك والتمويل');
  await pickOption(user, form.requestTypeLabel, requestTypeLabel);
  await pickOption(user, new RegExp(form.responsibleLabel), 'منسّق البرامج');
}

/** Fill a complete, valid «برنامج تدريبي عام» (Notion Assignment Matrix, form 1). */
async function fillGeneralProgram(user: UserEvent) {
  await fillMainOptions(user, form.requestTypes['general-program']);
  await user.type(screen.getByLabelText(new RegExp(form.fields.programName)), 'برنامج الحوكمة');
  await pickOption(user, form.fields.daysCount, '3');
  // The two DatePickers: open by label, pick "today".
  for (const trigger of [form.fields.dateFrom, form.fields.dateTo]) {
    await user.click(screen.getByRole('button', { name: new RegExp(escapeRegex(trigger)) }));
    await user.click(await screen.findByRole('button', { name: /^اليوم/ }));
  }
  await pickOption(user, form.fields.period, form.options.periods.morning);
  await pickOption(user, form.fields.deliveryMechanism, form.options.deliveryModes.onsite);
  await user.type(
    screen.getByRole('textbox', { name: new RegExp(escapeRegex(form.fields.city)) }),
    'الرياض'
  );
  await pickOption(user, form.fields.trainingLanguage, form.options.languages.ar);
  await pickOption(user, form.fields.traineeLevel, form.options.traineeLevels.intermediate);
  await user.upload(fileInput(), pdf('brochure.pdf'));
  await pickOption(user, form.fields.specializationDomain, 'التحليل المالي والتمويل');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Open one more «الخبير المحدد n» picker and choose someone in it. */
async function addExpert(user: UserEvent, position: number, name: string) {
  await user.click(screen.getByRole('button', { name: form.addNominee }));
  await pickOption(user, form.nomineeSlot(position), name);
}

/** Every «الخبير المحدد n» card currently on the form. */
function expertCards(): HTMLElement[] {
  return screen.queryAllByRole('group').filter((group) => {
    const label = group.getAttribute('aria-label');
    return label != null && /^الخبير المحدد/.test(label);
  });
}

function headcountField(): HTMLElement {
  return screen.getByRole('spinbutton', {
    name: new RegExp(escapeRegex(form.fields.requiredHeadcount)),
  });
}

async function setHeadcount(user: UserEvent, value: number) {
  const field = headcountField();
  await user.clear(field);
  await user.type(field, String(value));
  await user.tab();
}

function pdf(name: string): File {
  return new File(['x'], name, { type: 'application/pdf' });
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (input == null) {
    throw new Error('no file input');
  }
  return input;
}

describe('EH-INT-09 — the centre request form (طلب تقديم البرنامج, DM-GAP-06)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setAssignmentServiceForTesting(null);
  });

  /* ── الخيارات الرئيسية first ───────────────────────────────────────────── */

  it('the main options come first, and no field set shows until a request type is chosen', async () => {
    await renderForm();
    expect(screen.getByText(form.mainHeading)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: form.centreLabel })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: form.requestTypeLabel })).toBeInTheDocument();
    // No details card, no submit, until the type decides the field set.
    expect(screen.queryByText(form.detailsHeading)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: form.submit })).not.toBeInTheDocument();
  });

  it('offers exactly the matrix’s ten request types, in its order', async () => {
    const { user } = await renderForm();
    await user.click(screen.getByRole('combobox', { name: form.requestTypeLabel }));
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'برنامج تدريبي عام',
      'برنامج تدريبي خاص',
      'ورشة عمل',
      'لقاء',
      'ندوة',
      'تطوير محتوى',
      'كتابة الأسئلة',
      'عروض فنية / محاور البرامج',
      'استشارات',
      'أخرى',
    ]);
  });

  /* ── the request type decides the field set ────────────────────────────── */

  it('form 1 shows the program fields and NO client-name column', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['general-program']);
    expect(await screen.findByText(form.detailsHeading)).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(form.fields.programName))).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: form.fields.trainingLanguage })
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(new RegExp(escapeRegex(form.fields.clientName)))
    ).not.toBeInTheDocument();
  });

  it('form 2 adds the client name, required', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['private-program']);
    const client = await screen.findByLabelText(new RegExp(escapeRegex(form.fields.clientName)));
    expect(client).toBeRequired();
  });

  it('days are 1–8 or «أخرى», and the execution modes are حضوري / عن بُعد', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['general-program']);
    await user.click(await screen.findByRole('combobox', { name: form.fields.daysCount }));
    const days = await screen.findAllByRole('option');
    expect(days.map((option) => option.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      form.options.daysOther,
    ]);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('combobox', { name: form.fields.deliveryMechanism }));
    const modes = await screen.findAllByRole('option');
    expect(modes.map((option) => option.textContent)).toEqual([
      form.options.deliveryModes.onsite,
      form.options.deliveryModes.online,
    ]);
  });

  it('form 3 names the event, adds «بث مباشر», and makes the client name optional', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes.seminar);
    expect(await screen.findByLabelText(new RegExp(form.fields.eventName))).toBeInTheDocument();
    const client = screen.getByLabelText(new RegExp(escapeRegex(form.fields.clientName)));
    expect(client).not.toBeRequired();
    await user.click(screen.getByRole('combobox', { name: form.fields.deliveryMechanism }));
    expect(
      await screen.findByRole('option', { name: form.options.deliveryModes['live-stream'] })
    ).toBeInTheDocument();
  });

  it('forms 4 and 5 use «لغة المحتوى», and name the content or the test', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['technical-presentations']);
    expect(
      await screen.findByLabelText(new RegExp(escapeRegex(form.fields.contentTitle)))
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: form.fields.contentLanguage })).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: form.fields.trainingLanguage })
    ).not.toBeInTheDocument();

    await pickOption(user, form.requestTypeLabel, form.requestTypes['question-writing']);
    expect(await screen.findByLabelText(new RegExp(form.fields.testName))).toBeInTheDocument();
  });

  it('form 6 shows its own field set: subject, optional hours and beneficiary, the approved consultation types', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes.consultations);
    expect(
      await screen.findByLabelText(new RegExp(form.fields.consultationTopic))
    ).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(form.fields.expectedHours))).not.toBeRequired();
    expect(screen.getByLabelText(new RegExp(form.fields.beneficiary))).not.toBeRequired();
    expect(screen.queryByLabelText(new RegExp(form.fields.programName))).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: form.fields.consultationType }));
    const types = await screen.findAllByRole('option');
    expect(types.map((option) => option.textContent)).toEqual([
      'استشارة فردية',
      'استشارة مؤسسية',
      'دراسة حالة',
      'تقييم / تدقيق',
      'أخرى',
    ]);
  });

  it('«مجال التخصص» serves the owner-supplied domains list', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['general-program']);
    await user.click(screen.getByRole('combobox', { name: form.fields.specializationDomain }));
    // Two entries straight from the workbook's Lists sheet.
    expect(
      await screen.findByRole('option', { name: 'التحليل المالي والتمويل' })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'التقنية المالية' })).toBeInTheDocument();
  });

  /* ── what survives J-16 ────────────────────────────────────────────────── */

  it('F2/AC-3 still holds: the request creates nothing in FAST, and the page says so', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['general-program']);
    expect(await screen.findByText(form.noCreateNote)).toBeInTheDocument();
  });

  /* ── validation + submission ───────────────────────────────────────────── */

  it('an empty submit surfaces the per-type required errors and creates nothing', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['general-program']);
    await user.click(await screen.findByRole('button', { name: form.submit }));
    expect(await screen.findByText(form.errors['centre-required'])).toBeInTheDocument();
    expect(screen.getByText(form.errors['program-name-required'])).toBeInTheDocument();
    expect(screen.queryByText(form.successTitle)).not.toBeInTheDocument();
  });

  it('a complete general programme submits and receives a server-issued reference', async () => {
    const { user } = await renderForm();
    await fillGeneralProgram(user);
    await user.click(screen.getByRole('button', { name: form.submit }));
    expect(await screen.findByText(form.successTitle)).toBeInTheDocument();
    expect(screen.getByText(/EH-ASG-2026-/)).toBeInTheDocument();
    expect(screen.getByText(form.successNext)).toBeInTheDocument();
  }, 20000);

  /* ── «النشرة التعريفية» — uploaded first, then referenced by id ────────── */

  it('J-16: the brochure is stored first, and the request carries the id the upload returned', async () => {
    const provider = createMockAssignmentProvider({ latencyMs: 0 });
    const uploaded: string[] = [];
    const sent: CreateCentreRequestInput[] = [];
    setAssignmentServiceForTesting({
      ...provider,
      uploadBrochure: async (file) => {
        const result = await provider.uploadBrochure(file);
        if (result.ok) {
          uploaded.push(result.value.attachmentId);
        }
        return result;
      },
      createRequest: (input) => {
        sent.push(input);
        return provider.createRequest(input);
      },
    });
    const { user } = await renderForm();
    await fillGeneralProgram(user);
    await user.click(screen.getByRole('button', { name: form.submit }));
    expect(await screen.findByText(form.successTitle)).toBeInTheDocument();
    expect(uploaded).toHaveLength(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].attachmentId).toBe(uploaded[0]);
    expect(sent[0].attachmentName).toBe('brochure.pdf');
  }, 20000);

  it('J-16: a refused upload says why in Arabic, and the request cannot go without a stored brochure', async () => {
    const provider = createMockAssignmentProvider({ latencyMs: 0 });
    let created = 0;
    setAssignmentServiceForTesting({
      ...provider,
      uploadBrochure: () =>
        Promise.resolve({
          ok: false as const,
          error: { status: 422, message: 'The file is larger than 1 MB.' },
        }),
      createRequest: (input) => {
        created += 1;
        return provider.createRequest(input);
      },
    });
    const { user } = await renderForm();
    await fillGeneralProgram(user);
    expect(await screen.findByText(form.upload.refused)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: form.submit }));
    expect(await screen.findByText(form.errors['attachment-required'])).toBeInTheDocument();
    expect(created).toBe(0);
  }, 20000);

  it('J-16: a file outside J-01’s document rule is refused before any upload', async () => {
    const provider = createMockAssignmentProvider({ latencyMs: 0 });
    let uploads = 0;
    setAssignmentServiceForTesting({
      ...provider,
      uploadBrochure: (file) => {
        uploads += 1;
        return provider.uploadBrochure(file);
      },
    });
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['general-program']);
    await screen.findByText(form.detailsHeading);
    const big = pdf('big.pdf');
    Object.defineProperty(big, 'size', { value: 2 * 1024 * 1024 });
    await user.upload(fileInput(), big);
    expect(await screen.findByText(form.upload.sizeError)).toBeInTheDocument();
    expect(uploads).toBe(0);
  });

  it('J-16: the HTTP provider uploads multipart with the brochure purpose', async () => {
    const posts: { path: string; body: unknown }[] = [];
    const client: ExpertHubApiClient = {
      get: () => Promise.resolve({ ok: false, error: { status: 500, message: 'unused' } }),
      post: <T,>(path: string, body?: unknown) => {
        posts.push({ path, body });
        return Promise.resolve({ ok: true as const, value: {} as T });
      },
    };
    const file = pdf('brochure.pdf');
    await createHttpAssignmentProvider(client).uploadBrochure(file);
    expect(posts[0].path).toBe('v1/internal/attachments');
    const body = posts[0].body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('purpose')).toBe('assignment-brochure');
    expect(body.get('file')).toBeInstanceOf(File);
  });

  it('J-16/F5: the named person list follows the request’s service, and a refused nominee is named', async () => {
    const provider = createMockAssignmentProvider({ latencyMs: 0 });
    const asked: (string | undefined)[] = [];
    setAssignmentServiceForTesting({
      ...provider,
      listNomineeOptions: (service) => {
        asked.push(service);
        return provider.listNomineeOptions(service);
      },
      createRequest: () =>
        Promise.resolve({
          ok: false as const,
          error: { status: 400, message: 'nominee-not-eligible' },
        }),
    });
    const { user } = await renderForm();
    await fillGeneralProgram(user);
    expect(asked).toEqual(['trainer']);
    expect(screen.getByText(new RegExp(escapeRegex(form.nomineeHint)))).toBeInTheDocument();

    await addExpert(user, 1, 'أحمد الغامدي');
    await user.click(screen.getByRole('button', { name: form.submit }));
    expect(await screen.findByText(form.nomineeNotEligible)).toBeInTheDocument();
    expect(screen.queryByText(form.successTitle)).not.toBeInTheDocument();
  }, 20000);

  /* ── J-16/F4 — a real headcount, and up to N named experts ─────────────── */

  it('names one expert: a card carries the name and the lookup’s identifier, and the request sends the list', async () => {
    const provider = createMockAssignmentProvider({ latencyMs: 0 });
    const sent: CreateCentreRequestInput[] = [];
    setAssignmentServiceForTesting({
      ...provider,
      createRequest: (input) => {
        sent.push(input);
        return provider.createRequest(input);
      },
    });
    const { user } = await renderForm();
    await fillGeneralProgram(user);
    await addExpert(user, 1, 'أحمد الغامدي');

    const cards = expertCards();
    expect(cards).toHaveLength(1);
    expect(within(cards[0]).getByRole('heading', { name: 'أحمد الغامدي' })).toBeInTheDocument();
    expect(within(cards[0]).getByText(form.nomineeReference('trn-101'))).toBeInTheDocument();
    expect(screen.getByText(form.nomineeCount(1, 1))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: form.submit }));
    expect(await screen.findByText(form.successTitle)).toBeInTheDocument();
    expect(sent[0].requiredHeadcount).toBe(1);
    expect(sent[0].specificNominees).toEqual(['trn-101']);
  }, 20000);

  it('names several experts against a headcount above one, and removes one again', async () => {
    const provider = createMockAssignmentProvider({ latencyMs: 0 });
    const sent: CreateCentreRequestInput[] = [];
    setAssignmentServiceForTesting({
      ...provider,
      createRequest: (input) => {
        sent.push(input);
        return provider.createRequest(input);
      },
    });
    const { user } = await renderForm();
    await fillGeneralProgram(user);
    await setHeadcount(user, 3);

    await addExpert(user, 1, 'أحمد الغامدي');
    await addExpert(user, 2, 'نورة القحطاني');
    expect(expertCards()).toHaveLength(2);
    expect(screen.getByText(form.nomineeCount(2, 3))).toBeInTheDocument();

    // Removing the first card leaves the second, renumbered onto slot 1.
    await user.click(screen.getByRole('button', { name: form.nomineeRemove(1) }));
    expect(expertCards()).toHaveLength(1);
    expect(screen.getByText(form.nomineeCount(1, 3))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'نورة القحطاني' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'أحمد الغامدي' })).not.toBeInTheDocument();
    // Focus is not dropped on the page body when a card goes.
    expect(document.body).not.toHaveFocus();

    await user.click(screen.getByRole('button', { name: form.submit }));
    expect(await screen.findByText(form.successTitle)).toBeInTheDocument();
    expect(sent[0].requiredHeadcount).toBe(3);
    expect(sent[0].specificNominees).toEqual(['trn-102']);
  }, 30000);

  it('an expert already named is not offered again in the remaining pickers', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['general-program']);
    await screen.findByText(form.detailsHeading);
    await setHeadcount(user, 2);
    await addExpert(user, 1, 'أحمد الغامدي');

    await user.click(screen.getByRole('button', { name: form.addNominee }));
    await user.click(screen.getByRole('combobox', { name: form.nomineeSlot(2) }));
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['نورة القحطاني']);
  }, 20000);

  it('the headcount caps how many experts may be named, and says so', async () => {
    const { user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['general-program']);
    await screen.findByText(form.detailsHeading);

    // Headcount 1 (the default): one card, then no more.
    await addExpert(user, 1, 'أحمد الغامدي');
    expect(screen.getByRole('button', { name: form.addNominee })).toBeDisabled();
    expect(screen.getByText(form.nomineeLimit(1))).toBeInTheDocument();

    // Raising it re-opens the control.
    await setHeadcount(user, 2);
    expect(screen.getByRole('button', { name: form.addNominee })).toBeEnabled();
    await addExpert(user, 2, 'نورة القحطاني');
    expect(expertCards()).toHaveLength(2);
    expect(screen.getByRole('button', { name: form.addNominee })).toBeDisabled();
  }, 20000);

  it('the server’s own refusal of the named experts is surfaced, not swallowed', async () => {
    const provider = createMockAssignmentProvider({ latencyMs: 0 });
    setAssignmentServiceForTesting({
      ...provider,
      createRequest: () =>
        Promise.resolve({
          ok: false as const,
          error: { status: 400, message: 'nominees-exceed-headcount' },
        }),
    });
    const { user } = await renderForm();
    await fillGeneralProgram(user);
    await addExpert(user, 1, 'أحمد الغامدي');
    await user.click(screen.getByRole('button', { name: form.submit }));
    expect(await screen.findByText(form.errors['nominees-exceed-headcount'])).toBeInTheDocument();
    expect(screen.queryByText(form.successTitle)).not.toBeInTheDocument();
  }, 20000);

  it('naming nobody is still valid: the request submits and goes to matching', async () => {
    const provider = createMockAssignmentProvider({ latencyMs: 0 });
    const sent: CreateCentreRequestInput[] = [];
    setAssignmentServiceForTesting({
      ...provider,
      createRequest: (input) => {
        sent.push(input);
        return provider.createRequest(input);
      },
    });
    const { user, unmount } = await renderForm();
    await fillGeneralProgram(user);
    expect(expertCards()).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: form.submit }));
    expect(await screen.findByText(form.successTitle)).toBeInTheDocument();
    expect(sent[0].specificNominees).toEqual([]);
    expect(sent[0].requiredHeadcount).toBe(1);
    unmount();

    await renderList();
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    expect(within(table).getAllByText(content.statuses.matching).length).toBeGreaterThan(0);
  }, 20000);

  it('a legacy single-value payload still reads as one named expert', () => {
    const legacy = { specificNominee: 'trn-101' };
    expect(nomineesOf(legacy)).toEqual(['trn-101']);
    // …and the page renders one card per named expert (asserted above), so the
    // old payload lands as exactly one card.
    expect(nomineesOf({})).toEqual([]);
    expect(nomineesOf({ specificNominees: ['trn-101', ''] })).toEqual(['trn-101']);
    // The new list wins when both are present.
    expect(nomineesOf({ specificNominees: ['trn-102'], specificNominee: 'trn-101' })).toEqual([
      'trn-102',
    ]);
    expect(headcountOf({})).toBe(1);
    expect(headcountOf({ requiredHeadcount: 4 })).toBe(4);
  });

  it('validateCentreRequest enforces the headcount and the named experts', () => {
    const base = {
      centreId: 'ac000000-0000-0000-0000-000000000001',
      responsibleEmployee: 'emp-001',
      requestType: 'general-program' as const,
    };
    expect(validateCentreRequest({ ...base, requiredHeadcount: 0 })).toContain('headcount-invalid');
    expect(validateCentreRequest({ ...base, requiredHeadcount: 1.5 })).toContain(
      'headcount-invalid'
    );
    expect(validateCentreRequest({ ...base, requiredHeadcount: 7 })).not.toContain(
      'headcount-invalid'
    );
    // No approved maximum — a large headcount is not an error.
    expect(validateCentreRequest({ ...base, requiredHeadcount: 99 })).not.toContain(
      'headcount-invalid'
    );
    expect(
      validateCentreRequest({ ...base, requiredHeadcount: 2, specificNominees: ['a', 'a'] })
    ).toContain('duplicate-nominee');
    expect(
      validateCentreRequest({ ...base, requiredHeadcount: 1, specificNominees: ['a', 'b'] })
    ).toContain('nominees-exceed-headcount');
    expect(
      validateCentreRequest({ ...base, requiredHeadcount: 2, specificNominees: ['a', 'b'] })
    ).not.toContain('nominees-exceed-headcount');
    // Naming nobody, and the legacy single value, both stay valid.
    expect(validateCentreRequest(base)).not.toContain('nominees-exceed-headcount');
    expect(validateCentreRequest({ ...base, specificNominee: 'a' })).not.toContain(
      'nominees-exceed-headcount'
    );
  });

  it('validateCentreRequest enforces the matrix’s per-form required fields and values', () => {
    const base = {
      centreId: 'ac000000-0000-0000-0000-000000000001',
      responsibleEmployee: 'emp-001',
    };
    // Form 6: its own columns; expected hours and beneficiary are optional.
    const consultation = validateCentreRequest({ ...base, requestType: 'consultations' });
    expect(consultation).toContain('topic-required');
    expect(consultation).toContain('consultation-type-required');
    expect(consultation).toContain('attachment-required');
    // A file NAME is not an attachment — only an uploaded document's id is.
    expect(
      validateCentreRequest({ ...base, requestType: 'consultations', attachmentName: 'a.pdf' })
    ).toContain('attachment-required');
    expect(
      validateCentreRequest({ ...base, requestType: 'consultations', attachmentId: 'att-1' })
    ).not.toContain('attachment-required');
    expect(consultation).not.toContain('hours-invalid');
    expect(consultation).not.toContain('program-name-required');
    // The client name is mandatory on form 2 only.
    expect(validateCentreRequest({ ...base, requestType: 'general-program' })).not.toContain(
      'client-required'
    );
    expect(validateCentreRequest({ ...base, requestType: 'private-program' })).toContain(
      'client-required'
    );
    expect(validateCentreRequest({ ...base, requestType: 'seminar' })).not.toContain(
      'client-required'
    );
    // Dates: the end may be the same day, never before the start.
    const dated = { ...base, requestType: 'general-program' as const };
    expect(
      validateCentreRequest({ ...dated, dateFrom: '2026-11-03', dateTo: '2026-11-02' })
    ).toContain('dates-order');
    expect(
      validateCentreRequest({ ...dated, dateFrom: '2026-11-03', dateTo: '2026-11-03' })
    ).not.toContain('dates-order');
    // Days: 1–8, or «أخرى».
    expect(
      validateCentreRequest({ ...base, requestType: 'general-program', daysCount: 9 })
    ).toContain('days-invalid');
    expect(
      validateCentreRequest({ ...base, requestType: 'general-program', daysCountOther: true })
    ).not.toContain('days-invalid');
    // «بث مباشر» belongs to form 3 only; «مدمج» is not approved anywhere.
    expect(
      validateCentreRequest({
        ...base,
        requestType: 'general-program',
        deliveryMechanism: 'live-stream',
      })
    ).toContain('mechanism-required');
    expect(
      validateCentreRequest({ ...base, requestType: 'meeting', deliveryMechanism: 'live-stream' })
    ).not.toContain('mechanism-required');
    expect(
      validateCentreRequest({ ...base, requestType: 'meeting', deliveryMechanism: 'hybrid' })
    ).toContain('mechanism-required');
  });

  it('routes each request type to the matrix’s service (form 3 keeps trainer pending the Speaker decision)', () => {
    expect(CENTRE_REQUEST_TYPES.map((type) => [type, serviceTypeFor(type)])).toEqual([
      ['general-program', 'trainer'],
      ['private-program', 'trainer'],
      ['training-workshop', 'trainer'],
      ['meeting', 'trainer'],
      ['seminar', 'trainer'],
      ['content-development-request', 'content-developer'],
      ['question-writing', 'question-writer'],
      ['technical-presentations', 'content-developer'],
      ['consultations', 'consultant'],
      ['other', 'consultant'],
    ]);
  });

  /* ── the list ──────────────────────────────────────────────────────────── */

  it('J-16/F4/AC-2: a multi-person request is marked as such on the list', async () => {
    await renderList();
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    expect(within(table).getByText(content.multiHeadcountNote)).toBeInTheDocument();
  });

  it('a submitted request appears on the list', async () => {
    const { user, unmount } = await renderForm();
    await fillGeneralProgram(user);
    await user.click(screen.getByRole('button', { name: form.submit }));
    await screen.findByText(form.successTitle);
    // The success screen links back; the link is asserted rather than clicked,
    // since an anchor href does not navigate under jsdom.
    expect(screen.getByRole('link', { name: form.backToList })).toHaveAttribute(
      'href',
      expertHubPaths.internalAssignments
    );
    unmount();

    // The same injected provider holds the new request, so the list shows it.
    await renderList();
    const table = await screen.findByRole('table', { name: content.resultsLabel });
    expect(within(table).getByText('برنامج الحوكمة')).toBeInTheDocument();
  }, 20000);

  it('shows a retryable error state on a transport failure', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    const { user } = renderExpertHubAt(expertHubPaths.internalAssignments);
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectProvider();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(await screen.findByText(/EH-ASG-2026-/)).toBeInTheDocument();
  });

  it('reaches the queue from the internal dashboard', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internal);
    const link = await screen.findByRole('link', { name: /طلبات الإسناد/ });
    expect(link).toHaveAttribute('href', expertHubPaths.internalAssignments);
  });

  it('renders RTL by default and has no automatically-detectable a11y violations', async () => {
    const { container, user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['general-program']);
    await screen.findByText(form.detailsHeading);
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });

  it('the named-expert cards are labelled groups with named controls, and pass axe', async () => {
    const { container, user } = await renderForm();
    await pickOption(user, form.requestTypeLabel, form.requestTypes['general-program']);
    await screen.findByText(form.detailsHeading);
    await setHeadcount(user, 2);
    await addExpert(user, 1, 'أحمد الغامدي');
    await addExpert(user, 2, 'نورة القحطاني');

    const cards = expertCards();
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual([
      form.nomineeSlot(1),
      form.nomineeSlot(2),
    ]);
    // Add and remove both carry an accessible name, and the count is polite.
    expect(screen.getByRole('button', { name: form.nomineeRemove(2) })).toBeInTheDocument();
    expect(screen.getByText(form.nomineeCount(2, 2))).toHaveAttribute('role', 'status');
    await expectNoA11yViolations(container);
  }, 20000);
});
