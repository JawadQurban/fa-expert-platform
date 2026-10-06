import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  fireEvent,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  userEvent,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { createHttpProfileProvider, setProfileServiceForTesting } from './profileService';
import type { ExpertHubApiClient } from '../../shared/services/apiClient';
import { createMockProfileProvider, MOCK_PROFILE } from './mockProfileProvider';
import type { MockProfileProviderOptions } from './mockProfileProvider';
import { getProfileContent } from './profile.content';
import { APPLICATION_FORM_SCHEMA } from '../applications/applicationSchema';
import { fieldLabel, sectionTitle } from '../applications/applicationValidation';

const content = getProfileContent('ar');
const NAME = MOCK_PROFILE.displayName;

function injectProvider(options: MockProfileProviderOptions = {}) {
  setProfileServiceForTesting(createMockProfileProvider({ latencyMs: 0, ...options }));
}

/** Render the authenticated profile route and await the H1 (the trainer name). */
async function renderProfile() {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.profile);
  await screen.findByRole('heading', { level: 1, name: NAME });
  return result;
}

function pdf(name: string, sizeBytes = 1024): File {
  const file = new File(['x'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (input == null) {
    throw new Error('no file input');
  }
  return input;
}

describe('EH-TP-04 — My Profile', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setProfileServiceForTesting(null);
  });

  it('renders the profile header (name H1, classification, overall rating) + subtitle', async () => {
    await renderProfile();
    expect(screen.getByText(content.subtitle)).toBeInTheDocument();
    // Classification appears in the header (and again in the locked FAST group).
    expect(screen.getAllByText(content.classifications.expert).length).toBeGreaterThan(0);
    // The calculated overall rating renders as a read-only star display.
    expect(screen.getByRole('img', { name: content.header.ratingAria(4.5) })).toBeInTheDocument();
  });

  /* ── J-14 Trainer Self-Service Profile Update ──────────────────────────── */

  it('J-14/F1/AC-1: edits through the APPLICATION FORM schema — same sections, same fields, no separate form', async () => {
    await renderProfile();
    // The six J-01 sections are the form's own groups, not a profile-specific set.
    for (const section of APPLICATION_FORM_SCHEMA.sections) {
      expect(screen.getByRole('group', { name: sectionTitle(section, 'ar') })).toBeInTheDocument();
    }
    // A field carries the SAME label as on the application form, because it is
    // the same schema entry — not a re-authored profile copy. (`responsibilities`
    // is one of the supplied `DM-GAP-01` map's own rows.)
    const responsibilities = APPLICATION_FORM_SCHEMA.fields.find(
      (f) => f.id === 'responsibilities'
    );
    expect(responsibilities).toBeDefined();
    expect(
      screen.getByLabelText(fieldLabel(responsibilities!, 'ar'), { exact: false })
    ).toBeInTheDocument();
  });

  it('J-14/F1/AC-4: saves an editable field and reflects it immediately', async () => {
    const { user } = await renderProfile();
    // `certificateName` became a dropdown on 2026-09-21; «الجهة المانحة» is
    // the free-text row of the same section and tests the same save path.
    const certificate = APPLICATION_FORM_SCHEMA.fields.find((f) => f.id === 'issuingInstitution');
    const input = screen.getByLabelText(fieldLabel(certificate!, 'ar'), { exact: false });
    await user.clear(input);
    await user.type(input, 'FRM');
    await user.click(screen.getByRole('button', { name: content.fields.save }));
    expect(await screen.findByText(content.fields.saved)).toBeInTheDocument();
    expect(screen.getByDisplayValue('FRM')).toBeInTheDocument();
  });

  it('BR-0404: an SSO/FAST-owned field is request-change only, and the pending change never replaces the current value', async () => {
    const { user } = await renderProfile();
    // The supplied map marks the FAST-mapped identity rows `sso-profile`
    // (the workbook maps them to dbo.AspNetUsers) — read-only here, with a
    // request action (`BR-0404`).
    const firstName = APPLICATION_FORM_SCHEMA.fields.find((f) => f.id === 'firstNameAr');
    expect(firstName?.ownership).toBe('sso-profile');
    expect(screen.getAllByText('خبير').length).toBeGreaterThan(0);
    // It is NOT rendered as an editable input anywhere on the form.
    expect(
      screen.queryByLabelText(fieldLabel(firstName!, 'ar'), { exact: false })
    ).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: content.fields.requestChange })[0]);
    const dialogInput = await screen.findByLabelText(
      content.requestModal.inputLabel(fieldLabel(firstName!, 'ar'))
    );
    await user.type(dialogInput, 'خالد');
    await user.click(screen.getByRole('button', { name: content.requestModal.submit }));

    expect(await screen.findByText(content.requestModal.submitted)).toBeInTheDocument();
    expect(screen.getByText(content.fields.pendingChange('خالد'))).toBeInTheDocument();
    // `03` J5 — the confirmed value is still the one displayed.
    expect(screen.getAllByText('خبير').length).toBeGreaterThan(0);
  });

  it('J-14/F2: the three Locked Fields rows are VISIBLE and non-editable — including the agreement status', async () => {
    await renderProfile();
    const locked = screen.getByRole('region', { name: content.lockedFacts.heading });
    expect(within(locked).getByText(content.lockedFacts.classificationLabel)).toBeInTheDocument();
    expect(within(locked).getByText(content.lockedFacts.evaluationLabel)).toBeInTheDocument();
    // The agreement status was previously not shown anywhere on this page.
    expect(within(locked).getByText(content.lockedFacts.agreementLabel)).toBeInTheDocument();
    expect(
      within(locked).getByText(content.lockedFacts.agreementStatuses.active)
    ).toBeInTheDocument();
    // Visible, but with no edit affordance anywhere in the section.
    expect(within(locked).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(locked).queryByRole('button')).not.toBeInTheDocument();
  });

  it('BR-0106: rejects a wrong-format certificate and accepts a valid pdf', async () => {
    const { container } = await renderProfile();
    const permissive = userEvent.setup({ applyAccept: false });
    await permissive.upload(fileInput(container), new File(['x'], 'bad.exe'));
    // The served `professional-certificate` rule, not a page-local guess.
    expect(
      await screen.findByText(content.certificates.formatError('pdf, doc, docx'))
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.upload(fileInput(container), pdf('new-cert.pdf'));
    expect(await screen.findByText('new-cert.pdf')).toBeInTheDocument();
    expect(screen.getByText(content.certificates.uploaded)).toBeInTheDocument();
    // Antivirus is `G27`: nothing on the page may call the file checked.
    expect(screen.queryByText(/فحص|آمن|scanned|safe/i)).not.toBeInTheDocument();
  });

  it('J-14/F1/AC-2: a server refusal is shown on the file in Arabic, and nothing is added', async () => {
    injectProvider({ uploadFailWith: { status: 422, message: 'The file is larger than 1 MB.' } });
    const { container } = await renderProfile();
    const user = userEvent.setup();
    await user.upload(fileInput(container), pdf('refused.pdf'));
    expect(await screen.findByText(content.certificates.refused)).toBeInTheDocument();
    expect(screen.queryByText(content.certificates.uploaded)).not.toBeInTheDocument();
  });

  it('J-14/F1/AC-2: a missing certificate rule (409) is named, not reported as a retry', async () => {
    injectProvider({
      uploadFailWith: { status: 409, message: 'certificate-rule-unavailable' },
    });
    const { container } = await renderProfile();
    const user = userEvent.setup();
    await user.upload(fileInput(container), pdf('cert.pdf'));
    expect(await screen.findByText(content.certificates.ruleUnavailable)).toBeInTheDocument();
  });

  it('J-14/F1/AC-2: the HTTP provider uploads the certificate as multipart', async () => {
    const posts: { path: string; body: unknown }[] = [];
    const client: ExpertHubApiClient = {
      get: () => Promise.resolve({ ok: false, error: { status: 500, message: 'unused' } }),
      post: <T,>(path: string, body?: unknown) => {
        posts.push({ path, body });
        return Promise.resolve({ ok: true as const, value: {} as T });
      },
    };
    await createHttpProfileProvider(client).uploadCertificate(pdf('cert.pdf'));
    expect(posts[0].path).toBe('v1/me/profile/certificates');
    expect(posts[0].body).toBeInstanceOf(FormData);
    expect((posts[0].body as FormData).get('file')).toBeInstanceOf(File);
  });

  it('BR-1007: toggling visibility consent requires confirmation, then hides the profile', async () => {
    const { user } = await renderProfile();
    await user.click(screen.getByRole('tab', { name: content.tabs.visibility }));
    const toggle = screen.getByRole('switch', { name: content.visibility.toggleLabel });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    // Confirm dialog names the immediate public effect.
    expect(await screen.findByText(content.consentModal.disableBody)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.consentModal.confirm }));
    expect(await screen.findByText(content.consentModal.disabled)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: content.visibility.toggleLabel })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('shows the calculated ratings (overall + per-program) on the Ratings tab', async () => {
    const { user } = await renderProfile();
    await user.click(screen.getByRole('tab', { name: content.tabs.ratings }));
    expect(
      await screen.findByRole('heading', { name: content.ratings.perProgramHeading })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /من 5/ }).length).toBeGreaterThan(0);
  });

  it('shows the approved scope and program history on their tabs', async () => {
    const { user } = await renderProfile();
    await user.click(screen.getByRole('tab', { name: content.tabs.services }));
    expect(
      await screen.findByRole('heading', { name: content.scope.servicesHeading })
    ).toBeInTheDocument();
    expect(screen.getByText(content.services.trainer)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: content.tabs.programs }));
    expect(await screen.findByText('برنامج القيادة التنفيذية')).toBeInTheDocument();
  });

  it('shows an error state with retry on load failure, and recovers', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['trainer']);
    const { user } = { user: userEvent.setup() };
    renderExpertHubAt(expertHubPaths.profile);
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectProvider();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(await screen.findByRole('heading', { level: 1, name: NAME })).toBeInTheDocument();
  });

  it('maps 401 to the session-expired copy', async () => {
    injectProvider({ failWith: { status: 401, message: '' } });
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.profile);
    expect(await screen.findByText(content.errors.sessionTitle)).toBeInTheDocument();
  });

  it('switches language across the profile', async () => {
    const { user } = await renderProfile();
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('tab', { name: getProfileContent('en').tabs.overview })
    ).toBeInTheDocument();
  });

  it('renders RTL by default', async () => {
    await renderProfile();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = await renderProfile();
    await expectNoA11yViolations(container);
  });

  /* ── Repeatable sections (`dm-gap-01.2026-09-21`) ─────────────────────────
   * `education` (≥1), `certifications` (≥0) and `experience` (≥1) are groups of
   * ENTRIES. The page read `fieldValues` as one value per field, so a trainer
   * who had submitted three qualifications saw one. Entry 0 IS the flat
   * `fieldValues` map (the historical shape, and what `saveProfileFields`
   * writes); every further entry is read-only, because the save endpoint takes
   * a flat `Record<fieldId, value>` and cannot address a second one.
   * ------------------------------------------------------------------------ */

  /** Distinctive ids on purpose: the tests below assert none of them is shown. */
  const EDUCATION_ENTRIES = [
    {
      entryId: 'edu-entry-alpha',
      // Entry 0 mirrors `MOCK_PROFILE.fieldValues` — that is the contract.
      values: {
        qualificationType: 'master',
        generalSpecialization: 'finance',
        specializationDetail: 'spec-004',
        universityName: 'uni-001',
        qualificationDate: '2010-06-01',
      },
    },
    {
      entryId: 'edu-entry-beta',
      values: {
        qualificationType: 'doctorate',
        generalSpecialization: 'محاسبة',
        specializationDetail: 'spec-004',
        universityName: 'uni-001',
        qualificationDate: '2018-06-01',
      },
    },
    {
      entryId: 'edu-entry-gamma',
      values: {
        qualificationType: 'bachelor',
        generalSpecialization: 'اقتصاد',
        specializationDetail: 'spec-004',
        universityName: 'uni-002',
        qualificationDate: '2005-06-01',
      },
    },
  ];

  it('dm-gap-01: a trainer with THREE qualifications sees three, not one', async () => {
    injectProvider({ seed: { ...MOCK_PROFILE, entries: { education: EDUCATION_ENTRIES } } });
    await renderProfile();
    for (const ordinal of [1, 2, 3]) {
      expect(screen.getByRole('group', { name: `المؤهل ${ordinal}` })).toBeInTheDocument();
    }
    expect(screen.queryByRole('group', { name: 'المؤهل 4' })).not.toBeInTheDocument();
  });

  it('dm-gap-01: a profile saved BEFORE entries existed renders exactly one qualification', async () => {
    // `MOCK_PROFILE` carries no `entries` — the historical shape, which means
    // one entry built from the flat `fieldValues`. Not zero, not duplicated.
    await renderProfile();
    expect(screen.getAllByRole('group', { name: /^المؤهل \d+$/ })).toHaveLength(1);
    expect(screen.getByRole('group', { name: 'المؤهل 1' })).toBeInTheDocument();
    // …and it is still the editable form, so AC-4 saving is untouched.
    const university = APPLICATION_FORM_SCHEMA.fields.find((f) => f.id === 'universityName');
    expect(
      screen.getByLabelText(fieldLabel(university!, 'ar'), { exact: false })
    ).toBeInTheDocument();
  });

  it('dm-gap-01: a stored option code is shown as its LABEL, never as the code', async () => {
    injectProvider({ seed: { ...MOCK_PROFILE, entries: { education: EDUCATION_ENTRIES } } });
    await renderProfile();
    const second = screen.getByRole('group', { name: 'المؤهل 2' });
    // «دكتوراه», not `doctorate`; «جامعة الملك سعود», not `uni-001`.
    expect(within(second).getByText('دكتوراه')).toBeInTheDocument();
    expect(within(second).getByText('جامعة الملك سعود')).toBeInTheDocument();
    expect(within(second).getByText('التمويل والاستثمار')).toBeInTheDocument();
    // Each row is named by the field's own display label.
    expect(within(second).getByText('تاريخ الحصول على المؤهل')).toBeInTheDocument();
  });

  it('dm-gap-01: no entry id, entry index or field code reaches the page', async () => {
    injectProvider({ seed: { ...MOCK_PROFILE, entries: { education: EDUCATION_ENTRIES } } });
    const { container } = await renderProfile();
    const text = container.textContent ?? '';
    for (const internal of [
      'edu-entry-alpha',
      'edu-entry-beta',
      'edu-entry-gamma',
      'entryId',
      'entryIndex',
      'qualificationType',
      'universityName',
      'doctorate',
      'uni-001',
      'spec-004',
    ]) {
      expect(text).not.toContain(internal);
    }
  });

  it('dm-gap-01: a repeatable entry is an accessible, named group', async () => {
    injectProvider({ seed: { ...MOCK_PROFILE, entries: { education: EDUCATION_ENTRIES } } });
    await renderProfile();
    await expectNoA11yViolations(screen.getByRole('group', { name: 'المؤهل 3' }));
  });

  it('dm-gap-01: practical experience travels the SAME path — every role is shown', async () => {
    injectProvider({
      seed: {
        ...MOCK_PROFILE,
        entries: {
          experience: [
            {
              entryId: 'exp-entry-alpha',
              values: {
                jobTitle: 'مستشار مالي أول',
                organization: 'شركة تجريبية',
                currentlyEmployed: true,
                experienceStartDate: '2016-01-01',
                responsibilities: 'تقديم الاستشارات المالية.',
              },
            },
            {
              entryId: 'exp-entry-beta',
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
          ],
        },
      },
    });
    await renderProfile();
    const second = screen.getByRole('group', { name: 'الخبرة 2' });
    expect(within(second).getByText('محلل مالي')).toBeInTheDocument();
    expect(within(second).getByText('بنك تجريبي')).toBeInTheDocument();
    // The option label again, not the bucket code.
    expect(within(second).getByText('من 5 إلى 10 سنوات')).toBeInTheDocument();
    expect(second.textContent ?? '').not.toContain('5-10');
  });

  /* ── J-09/F6 Bank data ────────────────────────────────────────────────────
   * Opens on the profile only after preliminary approval (AC-2); all eight
   * fields are mandatory (AC-3); saving unblocks agreement preparation (AC-4).
   * ------------------------------------------------------------------------ */

  it('does not show the bank-data section before it has been requested (AC-2)', async () => {
    injectProvider({
      seed: {
        ...MOCK_PROFILE,
        bankData: { state: 'not-requested', fields: null, requestedAt: null, completedAt: null },
      },
    });
    await renderProfile();
    expect(screen.queryByText(content.bankData.requestedTitle)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: content.bankData.save })).not.toBeInTheDocument();
  });

  it('shows the preliminary-approval prompt once requested (AC-1)', async () => {
    await renderProfile();
    expect(await screen.findByText(content.bankData.requestedTitle)).toBeInTheDocument();
    expect(screen.getByText(content.bankData.requestedBody)).toBeInTheDocument();
  });

  it('opens filled with what the Academy already holds, and says so (`P-229`)', async () => {
    // The Academy has all eight fields on file. Making somebody retype an IBAN
    // it already holds is both a poor journey and the likeliest way a payment
    // instruction acquires a typo.
    injectProvider({
      seed: {
        ...MOCK_PROFILE,
        bankData: {
          ...MOCK_PROFILE.bankData,
          suggested: { iban: 'SA1234567890', bankName: 'الاهلي', accountHolderName: 'جواد قربان' },
        },
      },
    });
    await renderProfile();

    const iban = await screen.findByLabelText(content.bankData.fields.iban, { exact: false });
    expect((iban as HTMLInputElement).value).toBe('SA1234567890');

    // Said out loud: silence would present the Academy's record as the
    // trainer's own entry, and it is theirs to correct.
    expect(screen.getByText(content.bankData.prefilledTitle)).toBeInTheDocument();

    // ⚠️ Still not submitted. `AC-4` acts on the button, not on the prefill,
    // so the section stays in its requested state until they confirm.
    expect(screen.getByRole('button', { name: content.bankData.save })).toBeInTheDocument();
    expect(screen.queryByText(content.bankData.completeTitle)).not.toBeInTheDocument();
  });

  it('does not claim a prefill when the Academy holds nothing', async () => {
    await renderProfile();
    expect(screen.queryByText(content.bankData.prefilledTitle)).not.toBeInTheDocument();
  });

  it('requires every one of the eight fields, listing all that are missing (AC-3)', async () => {
    const { user } = await renderProfile();
    await user.click(await screen.findByRole('button', { name: content.bankData.save }));

    // The summary region (each field also flags itself inline).
    const errors = await screen.findByRole('alert', { name: content.bankData.errorsHeading });
    // All eight are named at once, not revealed one at a time.
    expect(within(errors).getByText(content.bankData.fields.iban)).toBeInTheDocument();
    expect(within(errors).getByText(content.bankData.fields.swiftCode)).toBeInTheDocument();
    expect(within(errors).getByText(content.bankData.fields.accountNumber)).toBeInTheDocument();
    expect(within(errors).getAllByRole('listitem')).toHaveLength(8);
  });

  it('blocks an IBAN, SWIFT code or account number that breaks its format rule (J-09, AC-5)', async () => {
    const { user } = await renderProfile();

    const values: Record<string, string> = {
      [content.bankData.fields.bankCountry]: 'السعودية',
      [content.bankData.fields.bankCity]: 'الرياض',
      [content.bankData.fields.bankName]: 'البنك الأهلي',
      [content.bankData.fields.branchName]: 'فرع العليا',
      [content.bankData.fields.iban]: 'SA03800000006080101675',
      [content.bankData.fields.swiftCode]: 'NCBKSAJ',
      [content.bankData.fields.accountHolderName]: 'سارة العتيبي',
      [content.bankData.fields.accountNumber]: '6080-1016',
    };
    // Scoped to the bank section and set with `fireEvent.change`: eight
    // whole-page label lookups plus key-by-key typing sat on the 5 s timeout
    // once the profile carried the larger form (the P-143 lesson).
    const bank = within(
      document.getElementById('eh-bank-data-heading')?.closest('section') as HTMLElement
    );
    for (const [label, value] of Object.entries(values)) {
      fireEvent.change(bank.getByLabelText(label, { exact: false }), { target: { value } });
    }
    await user.click(screen.getByRole('button', { name: content.bankData.save }));

    const errors = await screen.findByRole('alert', { name: content.bankData.errorsHeading });
    expect(within(errors).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText(content.bankData.formatErrors.iban)).toBeInTheDocument();
    expect(screen.getByText(content.bankData.formatErrors.swiftCode)).toBeInTheDocument();
    expect(screen.getByText(content.bankData.formatErrors.accountNumber)).toBeInTheDocument();
    // Nothing was saved.
    expect(screen.queryByText(content.bankData.completeTitle)).not.toBeInTheDocument();
  });

  it('saves a complete set and reports that the team was notified (AC-4)', async () => {
    const { user } = await renderProfile();

    const values: Record<string, string> = {
      [content.bankData.fields.bankCountry]: 'السعودية',
      [content.bankData.fields.bankCity]: 'الرياض',
      [content.bankData.fields.bankName]: 'البنك الأهلي',
      [content.bankData.fields.branchName]: 'فرع العليا',
      [content.bankData.fields.iban]: 'SA0380000000608010167519',
      [content.bankData.fields.swiftCode]: 'NCBKSAJE',
      [content.bankData.fields.accountHolderName]: 'سارة العتيبي',
      [content.bankData.fields.accountNumber]: '608010167519',
    };
    // Scoped to the bank section and set with `fireEvent.change`: eight
    // whole-page label lookups plus key-by-key typing sat on the 5 s timeout
    // once the profile carried the larger form (the P-143 lesson).
    const bank = within(
      document.getElementById('eh-bank-data-heading')?.closest('section') as HTMLElement
    );
    for (const [label, value] of Object.entries(values)) {
      fireEvent.change(bank.getByLabelText(label, { exact: false }), { target: { value } });
    }

    await user.click(screen.getByRole('button', { name: content.bankData.save }));

    expect(await screen.findByText(content.bankData.completeTitle)).toBeInTheDocument();
    expect(screen.getByText(content.bankData.completeBody)).toBeInTheDocument();
    // The form is replaced by the saved summary.
    expect(screen.queryByRole('button', { name: content.bankData.save })).not.toBeInTheDocument();
  });
  /**
   * J-13/AC-10 (`BR-0408`) — the calculated Trainer Profile Status is visible to
   * internal Trainer Management staff only, "never displayed to the trainer
   * themselves". The guarantee is structural — `MyProfileDto` has no status
   * field — and this is the regression guard: if one is ever added and rendered,
   * this fails instead of the disclosure shipping quietly.
   */
  it('J-13/AC-10: never shows the trainer their calculated profile status', async () => {
    await renderProfile();
    // The status vocabulary from the Trainer Profile Status matrix, in both
    // languages. `Idle` in particular carries no consequence for the trainer
    // ("monitoring purposes only"), so showing it would mislead.
    const statusWords = [
      /حالة الملف/,
      /خامل/,
      /موقوف/,
      /منتهي الصلاحية/,
      /\bIdle\b/,
      /\bSuspended\b/,
      /\bExpired\b/,
      /Profile status/i,
    ];
    for (const word of statusWords) {
      expect(screen.queryByText(word)).not.toBeInTheDocument();
    }
    // And the contract itself carries no status field to render.
    expect(Object.keys(MOCK_PROFILE)).not.toContain('status');
    expect(Object.keys(MOCK_PROFILE)).not.toContain('profileStatus');
  });
});
