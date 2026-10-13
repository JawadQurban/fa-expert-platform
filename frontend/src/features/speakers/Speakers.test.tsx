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
import { formatNumber } from '../../shared/formatting';
import type { ExpertHubApiClient } from '../../shared/services/apiClient';
import { createHttpSpeakerProvider, setSpeakerServiceForTesting } from './speakerService';
import { createMockSpeakerProvider } from './mockSpeakerProvider';
import type { MockSpeakerProviderOptions } from './mockSpeakerProvider';
import { getSpeakersContent } from './speakers.content';
import { SPEAKER_TITLE_MAX_LENGTH, parseSpeakerProblem } from './speaker.types';

const content = getSpeakersContent('ar');
const form = content.form;

function injectProvider(options: MockSpeakerProviderOptions = {}) {
  setSpeakerServiceForTesting(createMockSpeakerProvider({ latencyMs: 0, ...options }));
}

async function renderList() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalSpeakers);
  await screen.findByRole('heading', { level: 1, name: content.list.title });
  return result;
}

async function renderCreate() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalSpeakerNew);
  await screen.findByRole('heading', { level: 1, name: form.createTitle });
  return result;
}

function field(label: string): HTMLElement {
  return screen.getByLabelText(label, { exact: false });
}

/**
 * ⚠️ Seeded speakers (see `mockSpeakerProvider`), newest first:
 *   spk-003  ماجد سعد محمد الدوسري   no title
 *   spk-002  هيفاء الزهراني          رئيسة تنفيذية سابقة
 *   spk-001  فيصل عبدالله الحربي     خبير في التقنية المالية
 */
const FAISAL = 'فيصل عبدالله الحربي';
const HAIFA = 'هيفاء الزهراني';
const MAJED = 'ماجد سعد محمد الدوسري';

describe('EH-INT-11 — Speaker records (J-04)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setSpeakerServiceForTesting(null);
  });

  /* ── F2 — the list ─────────────────────────────────────────────────────── */

  it('lists the speakers newest first, each linking to its record', async () => {
    const { container } = await renderList();
    const table = await screen.findByRole('table', { name: content.list.resultsLabel });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getByRole('link').textContent)).toEqual([
      MAJED,
      HAIFA,
      FAISAL,
    ]);
    expect(within(table).getByRole('link', { name: FAISAL })).toHaveAttribute(
      'href',
      expertHubPaths.internalSpeaker('spk-001')
    );
    expect(screen.getByRole('link', { name: content.list.add })).toHaveAttribute(
      'href',
      expertHubPaths.internalSpeakerNew
    );
    await expectNoA11yViolations(container);
  });

  it('searches by title as well as name (owner ruling: name and title only)', async () => {
    const { user } = await renderList();
    // One search box, and no other filter.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: content.list.search.label }), 'التقنية');
    const table = await screen.findByRole('table', { name: content.list.resultsLabel });
    await within(table).findByRole('link', { name: FAISAL });
    expect(within(table).queryByRole('link', { name: HAIFA })).not.toBeInTheDocument();
  });

  it('says a search found nothing — distinct from an empty record — and clears it', async () => {
    const { user } = await renderList();
    await user.type(screen.getByRole('searchbox', { name: content.list.search.label }), 'لا أحد');
    expect(await screen.findByText(content.list.noResults.title)).toBeInTheDocument();
    expect(screen.queryByText(content.list.empty.title)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.list.search.clear }));
    expect(await screen.findByRole('link', { name: FAISAL })).toBeInTheDocument();
  });

  it('shows the empty state, with the add action, when there are no speakers', async () => {
    injectProvider({ empty: true });
    await renderList();
    expect(await screen.findByText(content.list.empty.title)).toBeInTheDocument();
    expect(screen.queryByText(content.list.noResults.title)).not.toBeInTheDocument();
    // The page head's action and the empty state's own.
    expect(screen.getAllByRole('link', { name: content.list.add })).toHaveLength(2);
  });

  it('says what failed when the list cannot load, and retries', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    const { user } = await renderList();
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectProvider();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(await screen.findByRole('link', { name: FAISAL })).toBeInTheDocument();
  });

  it('asks the server for the search, the page and the page size', async () => {
    const paths: string[] = [];
    const client: ExpertHubApiClient = {
      get: <T,>(path: string) => {
        paths.push(path);
        return Promise.resolve({ ok: true as const, value: {} as T });
      },
      post: () => Promise.reject(new Error('No POST expected.')),
    };
    await createHttpSpeakerProvider(client).listSpeakers({ search: ' هيفاء ', page: 2 });
    const [route, query] = paths[0].split('?');
    expect(route).toBe('v1/internal/speakers');
    const params = new URLSearchParams(query);
    expect(params.get('search')).toBe('هيفاء');
    expect(params.get('page')).toBe('2');
    expect(params.get('pageSize')).toBe('20');
  });

  /* ── F1 — create ───────────────────────────────────────────────────────── */

  it('J-04/F1: creates a speaker from the Arabic names and lands on the new record', async () => {
    const { user, container } = await renderCreate();
    // AC-4 — the creation email is not sent yet, said once as information.
    expect(screen.getByText(form.emailNotice)).toBeInTheDocument();
    // The email is read from FAST — there is no email field to type it into.
    expect(screen.queryByLabelText(/البريد الإلكتروني/)).not.toBeInTheDocument();
    await expectNoA11yViolations(container);

    await user.type(field(form.fields.firstNameAr), 'سلمان');
    await user.type(field(form.fields.lastNameAr), 'العمري');
    await user.type(field(form.fields.title), 'مستشار اقتصادي');
    await user.click(screen.getByRole('button', { name: form.create }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'سلمان العمري' })
    ).toBeInTheDocument();
    expect(screen.getByText(content.success.created)).toBeInTheDocument();
    expect(screen.getAllByText('مستشار اقتصادي').length).toBeGreaterThan(0);
  });

  it('the form carries the matrix’s eleven fields, in its order', async () => {
    await renderCreate();
    expect(screen.getByText(form.photoLabel)).toBeInTheDocument();
    for (const label of Object.values(form.fields)) {
      expect(field(label)).toBeInTheDocument();
    }
  });

  it('refuses a save with no Arabic first or last name, on the fields themselves', async () => {
    const { user, router } = await renderCreate();
    await user.click(screen.getByRole('button', { name: form.create }));

    const firstMessage = form.errors.required(form.fields.firstNameAr);
    const lastMessage = form.errors.required(form.fields.lastNameAr);
    expect(await screen.findByRole('link', { name: firstMessage })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: lastMessage })).toBeInTheDocument();
    expect(field(form.fields.firstNameAr)).toHaveAttribute('aria-invalid', 'true');
    expect(field(form.fields.lastNameAr)).toHaveAttribute('aria-invalid', 'true');
    // Focus lands on the first invalid field, and nothing was saved.
    expect(field(form.fields.firstNameAr)).toHaveFocus();
    expect(router.state.location.pathname).toBe(expertHubPaths.internalSpeakerNew);
  });

  it('maps a server validation error back to the field it names', async () => {
    injectProvider({ failSaveWith: { status: 400, message: 'title-too-long' } });
    const { user } = await renderCreate();
    await user.type(field(form.fields.firstNameAr), 'سلمان');
    await user.type(field(form.fields.lastNameAr), 'العمري');
    await user.click(screen.getByRole('button', { name: form.create }));

    const message = form.errors.tooLong(
      form.fields.title,
      formatNumber(SPEAKER_TITLE_MAX_LENGTH, 'ar')
    );
    expect(await screen.findByRole('link', { name: message })).toBeInTheDocument();
    expect(field(form.fields.title)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText(form.errors.saveFailed)).not.toBeInTheDocument();
  });

  it('reports a save failure that names no field as a save failure', async () => {
    injectProvider({ failSaveWith: { status: 500, message: 'boom' } });
    const { user } = await renderCreate();
    await user.type(field(form.fields.firstNameAr), 'سلمان');
    await user.type(field(form.fields.lastNameAr), 'العمري');
    await user.click(screen.getByRole('button', { name: form.create }));
    expect(await screen.findByText(form.errors.saveFailed)).toBeInTheDocument();
  });

  it('reads the server’s "<field>-<reason>" detail, and nothing else', () => {
    expect(parseSpeakerProblem('firstNameAr-required')).toEqual({
      field: 'firstNameAr',
      reason: 'required',
    });
    expect(parseSpeakerProblem('photoAttachmentId-invalid')).toEqual({
      field: 'photoAttachmentId',
      reason: 'invalid',
    });
    expect(parseSpeakerProblem('Speaker not found.')).toBeNull();
    expect(parseSpeakerProblem('email-required')).toBeNull();
  });

  it('refuses a photo in the wrong format before uploading it (J-01’s photo rule)', async () => {
    await renderCreate();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (input == null) {
      throw new Error('no file input');
    }
    const permissive = userEvent.setup({ applyAccept: false });
    await permissive.upload(input, new File(['x'], 'photo.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText(form.photo.formatError)).toBeInTheDocument();
  });

  it('saves a speaker with an uploaded photo', async () => {
    const { user } = await renderCreate();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (input == null) {
      throw new Error('no file input');
    }
    await user.upload(input, new File(['x'], 'portrait.png', { type: 'image/png' }));
    expect(await screen.findByText('portrait.png')).toBeInTheDocument();
    await user.type(field(form.fields.firstNameAr), 'سلمان');
    await user.type(field(form.fields.lastNameAr), 'العمري');
    await user.click(screen.getByRole('button', { name: form.create }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'سلمان العمري' })
    ).toBeInTheDocument();
  });

  /* ── the record ────────────────────────────────────────────────────────── */

  it('shows the email as pending FAST, and the history as deferred — never "no participations"', async () => {
    seedExpertHubSession(['internal']);
    const { container } = renderExpertHubAt(expertHubPaths.internalSpeaker('spk-001'));
    await screen.findByRole('heading', { level: 1, name: FAISAL });

    expect(screen.getByText(content.detail.emailPendingFast)).toBeInTheDocument();
    expect(screen.getByText(content.detail.historyHeading)).toBeInTheDocument();
    expect(screen.getByText(content.detail.historyPendingTitle)).toBeInTheDocument();
    expect(screen.queryByText(content.detail.historyEmpty)).not.toBeInTheDocument();
    expect(screen.queryByText(/لا توجد مشاركات/)).not.toBeInTheDocument();

    // Both names, and the record's edit action.
    expect(screen.getAllByText('Faisal Abdullah Alharbi').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: content.detail.edit })).toHaveAttribute(
      'href',
      expertHubPaths.internalSpeakerEdit('spk-001')
    );
    await expectNoA11yViolations(container);
  });

  it('BR-0413: the record shows no classification, evaluation, agreement or payment', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalSpeaker('spk-002'));
    await screen.findByRole('heading', { level: 1, name: HAIFA });
    for (const word of [/التصنيف/, /التقييم/, /الاتفاقية/, /المستحقات/]) {
      expect(screen.queryByText(word)).not.toBeInTheDocument();
    }
  });

  it('routes an unknown speaker to a not-found page with a heading', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalSpeaker('spk-404'));
    expect(
      await screen.findByRole('heading', { level: 1, name: content.errors.notFoundTitle })
    ).toBeInTheDocument();
  });

  it('says what failed when the record cannot load', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalSpeaker('spk-001'));
    expect(
      await screen.findByRole('heading', { level: 1, name: content.errors.detailLoadTitle })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.errors.retry })).toBeInTheDocument();
  });

  /* ── edit ──────────────────────────────────────────────────────────────── */

  it('edits a record: the same form, prefilled, saving back to the record', async () => {
    seedExpertHubSession(['internal']);
    const { user, container } = renderExpertHubAt(expertHubPaths.internalSpeakerEdit('spk-001'));
    await screen.findByRole('heading', { level: 1, name: form.editTitle });

    expect(field(form.fields.firstNameAr)).toHaveValue('فيصل');
    expect(field(form.fields.lastNameEn)).toHaveValue('Alharbi');
    expect(field(form.fields.title)).toHaveValue('خبير في التقنية المالية');
    // The create screen's email notice is not repeated on an edit.
    expect(screen.queryByText(form.emailNotice)).not.toBeInTheDocument();
    await expectNoA11yViolations(container);

    await user.clear(field(form.fields.title));
    await user.type(field(form.fields.title), 'خبير المدفوعات الرقمية');
    await user.click(screen.getByRole('button', { name: form.save }));

    expect(await screen.findByRole('heading', { level: 1, name: FAISAL })).toBeInTheDocument();
    expect(screen.getByText(content.success.updated)).toBeInTheDocument();
    expect(screen.getAllByText('خبير المدفوعات الرقمية').length).toBeGreaterThan(0);
  });

  it('BR-0113: no portal route reaches a speaker record', async () => {
    seedExpertHubSession(['trainer']);
    const { router } = renderExpertHubAt(expertHubPaths.internalSpeakers);
    await waitFor(() => expect(router.state.location.pathname).toBe(expertHubPaths.unauthorized));
    expect(screen.queryByRole('heading', { level: 1, name: content.list.title })).toBeNull();
  });
});
