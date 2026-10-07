import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UserEvent } from '@testing-library/user-event';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  fireEvent,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  userEvent,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import type { ApplicationSummaryDto } from './application.types';
import { setApplicationsServiceForTesting } from './applicationsService';
import {
  createMockApplicationsProvider,
  MOCK_APPLICATIONS,
  MOCK_DRAFT,
} from './mockApplicationsProvider';
import type { MockApplicationsProviderOptions } from './mockApplicationsProvider';
import { getNewApplicationContent } from './newApplication.content';

const content = getNewApplicationContent('ar');

/** Decided-only history: no draft, no un-decided → fresh draft allowed (BR-0101). */
const DECIDED_ONLY: readonly ApplicationSummaryDto[] = MOCK_APPLICATIONS.filter((item) =>
  ['approved', 'active', 'rejected', 'closed'].includes(item.status)
);

function injectProvider(options: MockApplicationsProviderOptions = {}) {
  setApplicationsServiceForTesting(createMockApplicationsProvider({ latencyMs: 0, ...options }));
}

async function renderPage() {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.applicationsNew);
  await screen.findByRole('heading', { level: 1, name: content.title });
  return result;
}

/** Fresh-draft render (no existing draft, creation allowed). */
async function renderFresh() {
  injectProvider({ seed: DECIDED_ONLY, draftSeed: null });
  return renderPage();
}

/** `key` is a rule id, or `ruleId::entryId` for a per-entry attachment. */
function fileInputFor(container: HTMLElement, key: string): HTMLInputElement {
  // Attribute selector, not `#id`: a per-entry id contains `::`.
  const input = container
    .querySelector(`[id="eh-field-attachment-${key}"]`)
    ?.querySelector<HTMLInputElement>('input[type="file"]');
  if (input == null) {
    throw new Error(`no file input for ${key}`);
  }
  return input;
}

function pdf(name: string, sizeBytes = 1024): File {
  const file = new File(['x'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

async function selectService(user: UserEvent, label: string) {
  await user.click(screen.getByRole('checkbox', { name: label }));
}

async function pickOption(user: UserEvent, comboboxName: RegExp, optionName: string) {
  await user.click(screen.getByRole('combobox', { name: comboboxName }));
  await user.click(await screen.findByRole('option', { name: optionName }));
}

/** DS DatePicker: the trigger carries the label; "today" completes the pick. */
async function pickToday(user: UserEvent, triggerName: RegExp) {
  await user.click(screen.getByRole('button', { name: triggerName }));
  await user.click(await screen.findByRole('button', { name: /^اليوم/ }));
}

/**
 * `fireEvent.change` for text on purpose: keystroke-by-keystroke typing across
 * ~20 inputs re-renders the step each key, which jsdom pays for in seconds
 * (the P-143 lesson). The assertions are about values, not typing.
 */
function setText(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

const next = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: content.actions.next }));
const back = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: content.actions.back }));

/** The step's own H2 — the stepper repeats the same words as plain text. */
const stepHeading = (name: string | RegExp) => screen.findByRole('heading', { level: 2, name });

/** Toggle a checkbox ON without un-ticking one a resumed draft already set. */
async function ensureChecked(user: UserEvent, name: string) {
  const box = screen.getByRole('checkbox', { name });
  if (!(box as HTMLInputElement).checked) {
    await user.click(box);
  }
}

/**
 * Since `dm-gap-01.2026-09-21` every schema section is its own step, so the
 * walk is one filler per step. Each filler fills only what the selected
 * services actually show — the per-service split of Section 5 means a
 * consultant and a trainer see different questions.
 */
async function fillPersonal(user: UserEvent) {
  setText(/الاسم الأول \(بالعربية\)/, 'خالد');
  setText(/الاسم الثاني \(بالعربية\)/, 'بن');
  setText(/الاسم الثالث \(بالعربية\)/, 'سعد');
  setText(/الاسم الأخير \(بالعربية\)/, 'العتيبي');
  setText(/الاسم الأول \(بالإنجليزية\)/, 'Khalid');
  setText(/الاسم الثاني \(بالإنجليزية\)/, 'Bin');
  setText(/الاسم الثالث \(بالإنجليزية\)/, 'Saad');
  setText(/الاسم الأخير \(بالإنجليزية\)/, 'AlOtaibi');
  setText(/رقم الهوية الوطنية/, '1000000001');
  await pickToday(user, /تاريخ الميلاد/);
  await pickOption(user, /الجنسية/, 'السعودية');
  await pickOption(user, /^الجنس(\s\*)?$/, 'ذكر');
  await pickOption(user, /^القطاع(\s\*)?$/, 'التمويل');
  await pickOption(user, /^المجال(\s\*)?$/, 'التحليل المالي والتمويل');
}

/** One qualification entry, certificate included (the file is per entry now). */
async function fillQualification(
  user: UserEvent,
  container: HTMLElement,
  entryId = 'education-1',
  fileName = 'degree.pdf'
) {
  const inEntry = (id: string) =>
    container.querySelector(`[id="eh-field-${entryId}::${id}"]`) as HTMLElement;
  await user.click(inEntry('qualificationType').querySelector('button')!);
  await user.click(await screen.findByRole('option', { name: 'بكالوريوس' }));
  fireEvent.change(inEntry('generalSpecialization').querySelector('input')!, {
    target: { value: 'المالية' },
  });
  await user.click(inEntry('specializationDetail').querySelector('button')!);
  await user.click(await screen.findByRole('option', { name: 'المحاسبة' }));
  await user.click(inEntry('universityName').querySelector('button')!);
  await user.click(await screen.findByRole('option', { name: 'جامعة الملك سعود' }));
  await user.click(inEntry('qualificationDate').querySelector('button')!);
  await user.click(await screen.findByRole('button', { name: /^اليوم/ }));
  await user.upload(
    fileInputFor(container, `qualification-certificate::${entryId}`),
    pdf(fileName)
  );
  expect(await screen.findByText(fileName)).toBeInTheDocument();
}

async function fillEducation(user: UserEvent, container: HTMLElement) {
  await fillQualification(user, container);
}

/** «الشهادات المهنية» is optional end to end — zero entries is a valid answer. */
async function fillCertifications() {
  /* nothing to fill */
}

async function fillExperience(user: UserEvent) {
  setText(/المسمى الوظيفي/, 'مستشار مالي');
  setText(/جهة العمل/, 'الأكاديمية المالية');
  await pickToday(user, /تاريخ البدء/);
  setText(/المسؤوليات/, 'تقديم الاستشارات المالية');
}

async function fillTraining(user: UserEvent) {
  await ensureChecked(user, 'ورش عمل متخصصة');
  await ensureChecked(user, 'القيادات التنفيذية والعليا');
  const perService: readonly [RegExp, string][] = [
    // Mandatory for the Trainer since 2026-10-07 (`P-342`).
    [/هل سبق لك التدريب أو التحدث في فعاليات/, 'لا'],
    [/هل لديك مواد أو حقائب تدريبية جاهزة/, 'نعم'],
    [/نمط التقديم/, 'حضوري'],
    [/سنوات الخبرة التدريبية/, 'أقل من سنتين'],
    [/سنوات خبرة استشارات/, 'أقل من سنتين'],
    [/هل لديك مواد أو استشارات جاهزة/, 'نعم'],
    [/الخبرة في تطوير المحتوى أو كتابة الأسئلة/, 'أقل من سنتين'],
  ];
  for (const [name, option] of perService) {
    if (screen.queryByRole('combobox', { name }) != null) {
      await pickOption(user, name, option);
    }
  }
}

async function fillAvailability(user: UserEvent) {
  await pickOption(user, /نمط التعامل/, 'تفرغ جزئي');
  await pickOption(user, /مدى التوفر/, 'طوال العام');
  await pickOption(user, /عدد المشاركات الممكنة سنويًا/, '1–3 مشاركات');
  setText(/المدن المتاح/, 'الرياض، جدة');
  await ensureChecked(user, 'ورش عمل مكثفة');
}

/** The section steps, in the order the schema puts them. */
const SECTION_STEPS: readonly [string, (u: UserEvent, c: HTMLElement) => Promise<void>][] = [
  ['المعلومات الأساسية', (u) => fillPersonal(u)],
  ['المؤهلات العلمية', (u, c) => fillEducation(u, c)],
  ['الشهادات المهنية', () => fillCertifications()],
  ['الخبرة العملية', (u) => fillExperience(u)],
  ['الخبرة التدريبية والمحتوى', (u) => fillTraining(u)],
  ['الجاهزية والإتاحة', (u) => fillAvailability(u)],
];

/** Walk forward from the services step, filling each section, up to `target`. */
async function walkTo(user: UserEvent, container: HTMLElement, target?: string) {
  for (const [heading, fill] of SECTION_STEPS) {
    await stepHeading(heading);
    if (heading === target) {
      return;
    }
    await fill(user, container);
    await next(user);
  }
}

/** Walk a valid trainer application up to the review step. */
async function completeToReview(user: UserEvent, container: HTMLElement) {
  await selectService(user, 'مدرب');
  await next(user);
  await walkTo(user, container);

  // Attachments: the CV is the one application-level file still required; the
  // certificates moved inside their entries, the photo stays Optional.
  await screen.findByText(content.attachmentsStep.intro);
  await user.upload(fileInputFor(container, 'cv'), pdf('cv.pdf'));
  expect(await screen.findByText('cv.pdf')).toBeInTheDocument();
  await next(user);
  await screen.findByText(content.review.intro);
}

describe('EH-TP-05 — New Application', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setApplicationsServiceForTesting(null);
  });

  it('offers exactly the 4 contractual services — Speaker is excluded (BR-0113) with a note', async () => {
    await renderFresh();
    for (const label of ['مدرب', 'مستشار', 'مطوّر محتوى', 'كاتب أسئلة']) {
      expect(screen.getByRole('checkbox', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole('checkbox', { name: 'متحدث' })).not.toBeInTheDocument();
    expect(screen.getByText(content.serviceStep.speakerNote)).toBeInTheDocument();
  });

  it('a fresh draft renders the supplied DM-GAP-01 fields, with nothing fabricated as prefill', async () => {
    const { user } = await renderFresh();
    expect(screen.queryByText(content.draft.resumedNotice)).not.toBeInTheDocument();
    await selectService(user, 'مدرب');
    await next(user);
    await stepHeading('المعلومات الأساسية');
    // The workbook's four-part Arabic name — empty: the session's single
    // display name is never split into fabricated parts.
    expect(await screen.findByLabelText(/الاسم الأول \(بالعربية\)/)).toHaveValue('');
    // The retired mock's SSO email row is gone — the matrix carries no email.
    expect(screen.queryByLabelText(/البريد الإلكتروني/)).not.toBeInTheDocument();
    // No reference number exists pre-submission (BR-0107).
    expect(screen.queryByText(content.success.referenceLabel)).not.toBeInTheDocument();
  });

  it('resumes the existing draft with saved services and values restored', async () => {
    // `MOCK_DRAFT` is a **historical** draft: flat values, no `entries`.
    const { user, container } = await renderPage();
    expect(await screen.findByText(content.draft.resumedNotice)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'مطوّر محتوى' })).toBeChecked();
    await next(user);
    // Text comes back on the personal step…
    expect(await screen.findByLabelText(/الاسم الأول \(بالعربية\)/)).toHaveValue('خبير');
    // …the textarea on the (repeatable) experience step…
    await walkTo(user, container, 'الخبرة العملية');
    expect(screen.getByLabelText(/المسؤوليات/)).toHaveValue('مسؤولية محفوظة في المسودة.');
    await fillExperience(user);
    await next(user);
    // …and the multi-select on the training step.
    await stepHeading('الخبرة التدريبية والمحتوى');
    expect(screen.getByRole('checkbox', { name: 'ورش عمل متخصصة' })).toBeChecked();
  }, 30000);

  it('a draft started on an older form version keeps rendering that version', async () => {
    const provider = createMockApplicationsProvider({
      latencyMs: 0,
      draftSeed: { ...MOCK_DRAFT, schemaVersion: 'older-version' },
    });
    const requested: (string | undefined)[] = [];
    setApplicationsServiceForTesting({
      ...provider,
      async getApplicationFormSchema(version) {
        requested.push(version);
        const result = await provider.getApplicationFormSchema();
        return version === 'older-version' && result.ok
          ? {
              ok: true,
              value: {
                ...result.value,
                version,
                fields: result.value.fields.filter((f) => f.id !== 'experienceEndDate'),
              },
            }
          : result;
      },
    });
    const { user, container } = await renderPage();
    await next(user);
    expect(await screen.findByLabelText(/الاسم الأول \(بالعربية\)/)).toHaveValue('خبير');
    expect(requested).toEqual([undefined, 'older-version']);
    // The retired field is gone from the step that would have carried it.
    await walkTo(user, container, 'الخبرة العملية');
    expect(screen.queryByRole('button', { name: /تاريخ الانتهاء/ })).not.toBeInTheDocument();
  }, 30000);

  it('End date shows until «I currently work in this position» is ticked', async () => {
    // Also proves a `dependsOn` resolves INSIDE its own repeatable entry.
    const { user, container } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);
    await walkTo(user, container, 'الخبرة العملية');
    expect(screen.getByRole('button', { name: /تاريخ الانتهاء/ })).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /أنا أعمل حاليًا في هذا المنصب/ }));
    expect(screen.queryByRole('button', { name: /تاريخ الانتهاء/ })).not.toBeInTheDocument();
  }, 30000);

  it('hours per day is a 1–24 number, and «نعم» opens the training details', async () => {
    const { user, container } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);

    await walkTo(user, container, 'الخبرة التدريبية والمحتوى');
    expect(
      screen.queryByLabelText(/تفاصيل الخبرات السابقة في التدريب أو التحدث في الفعاليات/)
    ).not.toBeInTheDocument();
    await pickOption(user, /هل سبق لك التدريب أو التحدث في فعاليات/, 'نعم');
    expect(
      screen.getByLabelText(/تفاصيل الخبرات السابقة في التدريب أو التحدث في الفعاليات/)
    ).toBeInTheDocument();

    await fillTraining(user);
    await next(user);
    await stepHeading('الجاهزية والإتاحة');
    const hours = screen.getByRole('spinbutton', { name: /متاح لعدد من ساعات التدريب/ });
    await user.type(hours, '30');
    await user.tab();
    // The DS NumberInput holds the schema's own bounds.
    expect(hours).toHaveValue('24');
    expect(screen.getByRole('checkbox', { name: 'الخميس' })).toBeInTheDocument();
  }, 30000);

  it('a multi-select stores toggled options and clears them on a second click', async () => {
    const { user, container } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);
    await walkTo(user, container, 'الخبرة التدريبية والمحتوى');
    const option = screen.getByRole('checkbox', { name: 'محاضرات أكاديمية' });
    expect(option).not.toBeChecked();
    await user.click(option);
    expect(screen.getByRole('checkbox', { name: 'محاضرات أكاديمية' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'محاضرات أكاديمية' }));
    expect(screen.getByRole('checkbox', { name: 'محاضرات أكاديمية' })).not.toBeChecked();
  }, 30000);

  it('validates ONE step at a time, summarizes it, and focuses the first invalid field', async () => {
    const { user } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);
    await stepHeading('المعلومات الأساسية');
    await next(user);
    // Summary appears; focus lands on the first invalid field (the workbook's
    // first starred row — the Arabic first name).
    expect(await screen.findByText(content.validation.summaryTitle)).toBeInTheDocument();
    const firstName = document.getElementById('eh-field-firstNameAr');
    expect(firstName?.contains(document.activeElement)).toBe(true);
    // Still on this step, and the summary names THIS step's fields only — a
    // later step's «اسم الجامعة» must not be listed from here.
    expect(
      screen.getByRole('heading', { level: 2, name: 'المعلومات الأساسية' })
    ).toBeInTheDocument();
    const summary = document.getElementById('eh-application-error-summary')!;
    expect(summary.textContent).toContain('الاسم الأول (بالعربية)');
    expect(summary.textContent).not.toContain('اسم الجامعة');
  });

  it('saves an explicit draft and shows the last-saved status (no reference issued)', async () => {
    const { user } = await renderFresh();
    await selectService(user, 'مستشار');
    await user.click(screen.getByRole('button', { name: content.actions.saveDraft }));
    expect(await screen.findByText(new RegExp(content.draft.savedPrefix))).toBeInTheDocument();
    expect(screen.queryByText(/EH-2026-9/)).not.toBeInTheDocument();
  });

  it('BR-0106: rejects a wrong-format file and an oversized file immediately', async () => {
    const { user, container } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);
    await walkTo(user, container);
    await screen.findByText(content.attachmentsStep.intro);

    // A permissive userEvent instance bypasses the input's `accept` filter —
    // the page must still validate the format defensively (`BR-0106`).
    const permissiveUser = userEvent.setup({ applyAccept: false });
    const wrongFormat = new File(['x'], 'virus.exe', { type: 'application/octet-stream' });
    await permissiveUser.upload(fileInputFor(container, 'cv'), wrongFormat);
    // Appears both inline on the file entry AND in the aria-live announcement.
    expect((await screen.findAllByText(/صيغة الملف غير مقبولة/)).length).toBeGreaterThanOrEqual(1);

    // J-01's approved attachment table caps every document at 1 MB, so a 2 MB
    // file must be refused — the workbook's own size row is still undefined.
    await user.upload(fileInputFor(container, 'cv'), pdf('big.pdf', 2 * 1024 * 1024));
    expect(
      (await screen.findAllByText(/حجم الملف يتجاوز الحد الأقصى/)).length
    ).toBeGreaterThanOrEqual(1);
  }, 40000);

  it('J-01/F3/AC-4: an accredited trainer is sent to add a service, not to re-apply', async () => {
    injectProvider({ hasApprovedTrainerRole: true });
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.applicationsNew);

    expect(
      await screen.findByRole('heading', { level: 1, name: content.blockedTrainer.title })
    ).toBeInTheDocument();
    expect(screen.getByText(content.blockedTrainer.body)).toBeInTheDocument();

    // The exit is the add-service path (J-03) — not "track your open application".
    const addService = screen.getByRole('link', { name: content.blockedTrainer.addService });
    expect(addService).toHaveAttribute('href', expertHubPaths.profile);
    expect(
      screen.queryByRole('link', { name: content.blocked.viewCurrent })
    ).not.toBeInTheDocument();
  });

  it('derives one step per schema section — nine steps, in schema order', async () => {
    const { user } = await renderFresh();
    await selectService(user, 'مدرب');
    // The stepper is the derived list, not a hardcoded one.
    const steps = screen.getByRole('list', { name: content.stepperLabel }).querySelectorAll('li');
    // `<marker><label><description>`; a section step takes its name from the
    // schema and carries no description of its own.
    expect([...steps].map((item) => item.textContent)).toEqual([
      `1${content.steps.services}${content.stepDescriptions.services}`,
      '2المعلومات الأساسية',
      '3المؤهلات العلمية',
      '4الشهادات المهنية',
      '5الخبرة العملية',
      '6الخبرة التدريبية والمحتوى',
      '7الجاهزية والإتاحة',
      `8${content.steps.attachments}${content.stepDescriptions.attachments}`,
      `9${content.steps.review}${content.stepDescriptions.review}`,
    ]);
    // …and each one is its own panel: section 2's fields are not on step 2.
    await next(user);
    await stepHeading('المعلومات الأساسية');
    expect(screen.queryByRole('group', { name: 'المؤهل 1' })).not.toBeInTheDocument();
  });

  it('blocks the attachments step while a required attachment is missing', async () => {
    const { user, container } = await renderFresh();
    await selectService(user, 'كاتب أسئلة');
    await next(user);
    await walkTo(user, container);
    await screen.findByText(content.attachmentsStep.intro);
    await next(user);
    expect(
      await screen.findByText(content.validation.missingAttachment('السيرة الذاتية'))
    ).toBeInTheDocument();
    // Still on the attachments step.
    expect(screen.getByText(content.attachmentsStep.intro)).toBeInTheDocument();
  }, 40000);

  it('review shows grouped data; Edit returns to the section; incomplete review blocks submit', async () => {
    const { user, container } = await renderFresh();
    await completeToReview(user, container);
    // Grouped review content.
    expect(screen.getByText(content.review.servicesTitle)).toBeInTheDocument();
    expect(screen.getByText('cv.pdf')).toBeInTheDocument();
    expect(screen.getByText('1000000001')).toBeInTheDocument();
    // A multi-select renders its chosen option labels, not raw codes.
    expect(screen.getByText('ورش عمل متخصصة')).toBeInTheDocument();

    // Edit → the step for THAT section opens, not a 36-field panel.
    await user.click(
      screen.getByRole('button', { name: `${content.review.editSection} — المعلومات الأساسية` })
    );
    await stepHeading('المعلومات الأساسية');
    const firstName = await screen.findByLabelText(/الاسم الأول \(بالعربية\)/);
    await user.clear(firstName);

    // Jump forward to the (visited) review step from the stepper.
    await user.click(screen.getByRole('button', { name: /المراجعة والتقديم/ }));
    await screen.findByText(content.review.intro);
    // BR-0105: missing panel + disabled submit.
    expect(screen.getByText(content.review.missingTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.actions.submit })).toBeDisabled();
  }, 40000);

  it('submits after confirmation; the service issues the reference (BR-0107) with navigation links', async () => {
    const { user, container } = await renderFresh();
    await completeToReview(user, container);
    await user.click(screen.getByRole('button', { name: content.actions.submit }));
    // Explicit confirmation dialog (§0.5).
    expect(await screen.findByText(content.confirm.body)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.confirm.confirmLabel }));

    expect(
      await screen.findByRole('heading', { level: 1, name: content.success.title })
    ).toBeInTheDocument();
    // Reference generated by the provider, shown with the success state.
    expect(screen.getByText(/EH-2026-9\d{4}/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: content.actions.goToApplications })).toHaveAttribute(
      'href',
      expertHubPaths.applications
    );
    expect(
      screen.getByRole('link', { name: content.actions.viewDetails }).getAttribute('href')
    ).toMatch(/^\/expert-hub\/applications\//);
  }, 40000);

  it('warns about unsaved changes before the page is left, and stands down after saving', async () => {
    // Shell links are plain anchors (full-page navigations), so the unsaved
    // guard is the `beforeunload` protection; the in-router `useBlocker` modal
    // covers future router-link navigations with the same dirty flag.
    const { user } = await renderFresh();
    await selectService(user, 'مدرب'); // dirty
    const dirtyEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);

    // Saving the draft clears the dirty flag — leaving no longer warns.
    await user.click(screen.getByRole('button', { name: content.actions.saveDraft }));
    await screen.findByText(new RegExp(content.draft.savedPrefix));
    const cleanEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);
  });

  it('shows the approved loading placeholder, then the form', async () => {
    injectProvider({ seed: DECIDED_ONLY, draftSeed: null, latencyMs: 150 });
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.applicationsNew);
    expect(await screen.findByRole('status', { name: content.title })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 1, name: content.title })
    ).toBeInTheDocument();
  });

  it('maps API failures to the error state with retry, and 401 to session-expired copy', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['trainer']);
    const first = renderExpertHubAt(expertHubPaths.applicationsNew);
    expect(await screen.findByText(content.errors.loadFailedTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.actions.retry })).toBeInTheDocument();
    first.unmount();

    injectProvider({ failWith: { status: 401, message: '' } });
    renderExpertHubAt(expertHubPaths.applicationsNew);
    expect(await screen.findByText('انتهت الجلسة')).toBeInTheDocument();
  });

  it('switches language across the schema-driven form', async () => {
    const { user } = await renderFresh();
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: getNewApplicationContent('en').title,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Trainer' })).toBeInTheDocument();
  });

  it('renders RTL by default (Arabic-first)', async () => {
    await renderFresh();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = await renderFresh();
    await expectNoA11yViolations(container);
  });

  /* ── The Academy's own record, offered to the form ─────────────────────── */

  it('fills what the Academy already knows, and says it did', async () => {
    /*
      Owner ruling, 2026-09-09: «the main data if he is logged in it should
      appear directly, no need to write it again».
    */
    injectProvider({
      seed: DECIDED_ONLY,
      draftSeed: null,
      prefill: { idNumber: '1105419996' },
    });
    const { user } = await renderPage();

    await selectService(user, 'مدرب');
    await next(user);

    expect(await screen.findByDisplayValue('1105419996')).toBeInTheDocument();
    // Said out loud: silence would present the Academy's record as the
    // applicant's own entry, on fields they are about to put their name to.
    expect(screen.getByText(content.prefill.title)).toBeInTheDocument();
  });

  /* ── the step-per-section wizard (dm-gap-01.2026-09-21) ───────────────── */

  it('moves forward and back through the section steps, keeping what was typed', async () => {
    const { user } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);
    await stepHeading('المعلومات الأساسية');
    await fillPersonal(user);
    await next(user);
    await stepHeading('المؤهلات العلمية');

    // Back never gates — only Continue does.
    await back(user);
    await stepHeading('المعلومات الأساسية');
    expect(screen.getByLabelText(/الاسم الأول \(بالعربية\)/)).toHaveValue('خالد');
    await back(user);
    expect(await stepHeading(content.steps.services)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'مدرب' })).toBeChecked();
  }, 30000);

  it('offers Back / Continue / Save draft on a section step', async () => {
    const { user } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);
    await stepHeading('المعلومات الأساسية');
    for (const label of [content.actions.back, content.actions.next, content.actions.saveDraft]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('gates a repeatable step on its own entries, naming the entry that is short', async () => {
    const { user, container } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);
    await walkTo(user, container, 'المؤهلات العلمية');
    await next(user);
    expect(await screen.findByText(content.validation.summaryTitle)).toBeInTheDocument();
    const summary = document.getElementById('eh-application-error-summary')!;
    // «المؤهل 1 — المؤهل: هذا الحقل مطلوب» — the entry, then the field.
    expect(summary.textContent).toContain('المؤهل 1');
    expect(summary.textContent).toContain(content.validation.required);
    // The per-entry certificate is part of the same gate.
    expect(summary.textContent).toContain(
      content.validation.missingAttachment('شهادة التأهيل العلمي')
    );
    expect(screen.getByRole('heading', { level: 2, name: 'المؤهلات العلمية' })).toBeInTheDocument();
  }, 30000);

  /* ── repeatable entries ───────────────────────────────────────────────── */

  it('adds, edits and removes a qualification in place', async () => {
    const { user, container } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);
    await walkTo(user, container, 'المؤهلات العلمية');

    // `minEntries: 1` — the floor is not removable.
    expect(screen.getByRole('group', { name: 'المؤهل 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'إزالة المؤهل 1' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ إضافة مؤهل' }));
    expect(screen.getByRole('group', { name: 'المؤهل 2' })).toBeInTheDocument();
    // Focus lands in the new entry's first field, and the change is announced.
    expect(
      document.getElementById('eh-entry-fields-education-n1')?.contains(document.activeElement)
    ).toBe(true);
    expect(screen.getByText(content.repeatable.added('المؤهل 2'))).toBeInTheDocument();

    // Edited in place, and entries do not share values.
    fireEvent.change(
      container.querySelector('[id="eh-field-education-n1::generalSpecialization"] input')!,
      { target: { value: 'الاقتصاد' } }
    );
    expect(
      container.querySelector('[id="eh-field-education-1::generalSpecialization"] input')
    ).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'إزالة المؤهل 2' }));
    expect(screen.queryByRole('group', { name: 'المؤهل 2' })).not.toBeInTheDocument();
    expect(screen.getByText(content.repeatable.removed('المؤهل 2'))).toBeInTheDocument();
    // Focus goes somewhere sensible — the control that put it there.
    expect(document.getElementById('eh-add-education')?.contains(document.activeElement)).toBe(
      true
    );
  }, 30000);

  it('carries several qualifications to the review, each listed in full, and submits', async () => {
    const { user, container } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);
    await walkTo(user, container, 'المؤهلات العلمية');
    await fillQualification(user, container, 'education-1', 'degree-1.pdf');
    await user.click(screen.getByRole('button', { name: '+ إضافة مؤهل' }));
    await fillQualification(user, container, 'education-n1', 'degree-2.pdf');
    await next(user);

    await stepHeading('الشهادات المهنية');
    await next(user); // zero certificates is a valid answer (PM, 2026-09-18)
    await stepHeading('الخبرة العملية');
    await fillExperience(user);
    await next(user);
    await stepHeading('الخبرة التدريبية والمحتوى');
    await fillTraining(user);
    await next(user);
    await stepHeading('الجاهزية والإتاحة');
    await fillAvailability(user);
    await next(user);

    await screen.findByText(content.attachmentsStep.intro);
    // The certificates are no longer offered here — they live in their entries.
    expect(screen.queryByText('شهادة التأهيل العلمي')).not.toBeInTheDocument();
    await user.upload(fileInputFor(container, 'cv'), pdf('cv.pdf'));
    expect(await screen.findByText('cv.pdf')).toBeInTheDocument();
    await next(user);

    await screen.findByText(content.review.intro);
    // EVERY entry, in full — not "1 qualification".
    expect(screen.getByText('المؤهل 1')).toBeInTheDocument();
    expect(screen.getByText('المؤهل 2')).toBeInTheDocument();
    expect(screen.getByText('degree-1.pdf')).toBeInTheDocument();
    expect(screen.getByText('degree-2.pdf')).toBeInTheDocument();
    // The empty optional section says so rather than vanishing.
    expect(screen.getByText(content.repeatable.empty)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: content.actions.submit }));
    await user.click(await screen.findByRole('button', { name: content.confirm.confirmLabel }));
    expect(
      await screen.findByRole('heading', { level: 1, name: content.success.title })
    ).toBeInTheDocument();
  }, 60000);

  it('a historical draft with no entries opens as exactly ONE qualification', async () => {
    /*
      The shape every draft saved before `dm-gap-01.2026-09-21` has: flat
      values, no `entries`. It must open as one entry, with its answers intact
      — losing them, or showing two, would both be data loss.
    */
    injectProvider({
      draftSeed: {
        ...MOCK_DRAFT,
        services: ['trainer'],
        values: {
          ...MOCK_DRAFT.values,
          qualificationType: 'master',
          generalSpecialization: 'المالية',
          specializationDetail: 'spec-002',
          universityName: 'uni-001',
          qualificationDate: '2020-05-01',
        },
      },
    });
    const { user, container } = await renderPage();
    await next(user);
    await walkTo(user, container, 'المؤهلات العلمية');

    expect(screen.getByRole('group', { name: 'المؤهل 1' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'المؤهل 2' })).not.toBeInTheDocument();
    // The saved answers came across, dropdowns included.
    expect(
      container.querySelector('[id="eh-field-education-1::generalSpecialization"] input')
    ).toHaveValue('المالية');
    expect(screen.getByRole('combobox', { name: /^المؤهل/ })).toHaveTextContent('ماجستير');
    expect(screen.getByRole('combobox', { name: /اسم الجامعة/ })).toHaveTextContent(
      'جامعة الملك سعود'
    );
  }, 30000);

  it('saves a draft mid-wizard and brings the entries back on reload', async () => {
    // One provider instance across both renders — it is the "server" here.
    setApplicationsServiceForTesting(
      createMockApplicationsProvider({ latencyMs: 0, seed: DECIDED_ONLY, draftSeed: null })
    );
    const first = await renderPage();
    await selectService(first.user, 'مدرب');
    await next(first.user);
    await walkTo(first.user, first.container, 'الشهادات المهنية');
    await first.user.click(screen.getByRole('button', { name: content.actions.saveDraft }));
    await screen.findByText(new RegExp(content.draft.savedPrefix));
    first.unmount();

    const second = await renderPage();
    expect(await screen.findByText(content.draft.resumedNotice)).toBeInTheDocument();
    await next(second.user);
    await stepHeading('المعلومات الأساسية');
    expect(screen.getByLabelText(/الاسم الأول \(بالعربية\)/)).toHaveValue('خالد');
    await next(second.user);
    await stepHeading('المؤهلات العلمية');
    expect(screen.getByRole('group', { name: 'المؤهل 1' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^المؤهل/ })).toHaveTextContent('بكالوريوس');
    // The entry's own certificate came back inside the entry.
    expect(screen.getByText('degree.pdf')).toBeInTheDocument();
  }, 40000);

  it('has no accessibility violations on a repeatable step with two entries', async () => {
    const { user, container } = await renderFresh();
    await selectService(user, 'مدرب');
    await next(user);
    await walkTo(user, container, 'المؤهلات العلمية');
    await user.click(screen.getByRole('button', { name: '+ إضافة مؤهل' }));
    await expectNoA11yViolations(container);
  }, 40000);

  it('never overwrites what the applicant already saved', async () => {
    /*
      ⚠️ The rule the whole design turns on. `MOCK_DRAFT` saved «خبير» as the
      first name; a suggestion must not replace it. The draft is their work,
      the prefill is only our guess at what would have saved them typing.
    */
    injectProvider({ prefill: { firstNameAr: 'من سجل الأكاديمية' } });
    const { user } = await renderPage(); // carries the resumable MOCK_DRAFT

    await next(user);
    await screen.findByLabelText(/الاسم الأول \(بالعربية\)/);

    expect(screen.getByDisplayValue('خبير')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('من سجل الأكاديمية')).not.toBeInTheDocument();
    // Nothing was filled, so the form does not claim it filled anything.
    expect(screen.queryByText(content.prefill.title)).not.toBeInTheDocument();
  });
});
