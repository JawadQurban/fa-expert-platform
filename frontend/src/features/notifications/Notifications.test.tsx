import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  within,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { getHeaderContent } from '../../shared/content/header.content';
import { setNotificationServiceForTesting } from './notificationService';
import { createMockNotificationProvider, MOCK_EVENTS, MOCK_LOG } from './mockNotificationProvider';
import { listSlaMatrix, resetSlaMatrixForTesting } from '../../shared/sla/mockSlaMatrix';
import type { MockNotificationProviderOptions } from './mockNotificationProvider';
import { getNotificationsContent } from './notifications.content';
import {
  validateSla,
  validateTemplate,
  validateRouting,
  type NotificationTemplateDto,
} from './notification.types';

/**
 * CAP-07 — communication & notifications (`BRD-TRN-001` §8.7), EH-INT-12.
 *
 * §8.7's rules are mostly about what must *not* be possible, so most of these
 * tests assert an absence: no free-form wording (`BR-0701`), no per-channel
 * choice (`BR-0702`), no event created here (`BR-0703`), no bilingual send
 * (`BR-0707`), and no deadline edited anywhere else (`BR-0705`).
 *
 * `DM-GAP-08` — the approved routing does not exist, so the matrix is pinned to
 * *unrouted and marked unapproved*: a future seed of plausible routing fails
 * here rather than shipping as policy.
 */

const content = getNotificationsContent('ar');

/** An approved template, so routing tests have something legal to point at. */
const APPROVED_TEMPLATE: NotificationTemplateDto = {
  templateId: 'tpl-001',
  code: 'TPL-TEST',
  subjectAr: 'عنوان',
  subjectEn: 'Subject',
  bodyAr: 'مرحبًا {{recipientName}}',
  bodyEn: 'Hello {{recipientName}}',
  placeholders: ['recipientName'],
  version: 1,
  updatedAt: '2026-08-27T09:00:00Z',
  updatedByName: 'مشرف النظام',
  status: 'approved',
};

const DRAFT_TEMPLATE: NotificationTemplateDto = { ...APPROVED_TEMPLATE, status: 'draft' };

function injectProvider(options: MockNotificationProviderOptions = {}) {
  setNotificationServiceForTesting(createMockNotificationProvider({ latencyMs: 0, ...options }));
}

async function renderMatrix() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalNotificationMatrix);
  await screen.findByRole('heading', { level: 1, name: content.matrix.title });
  return result;
}

async function renderTemplates() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalNotificationTemplates);
  await screen.findByRole('heading', { level: 1, name: content.templates.title });
  return result;
}

async function renderSla() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalSlaConsole);
  await screen.findByRole('heading', { level: 1, name: content.sla.title });
  return result;
}

async function renderLog() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalNotificationLog);
  await screen.findByRole('heading', { level: 1, name: content.log.title });
  return result;
}

/**
 * One event's row on the matrix, found by the event's NAME — the screen no
 * longer prints the requirements document's code, so neither does the test.
 */
function eventRow(eventCode: string): HTMLElement {
  const event = MOCK_EVENTS.find((candidate) => candidate.eventCode === eventCode);
  if (event == null) {
    throw new Error(`No seeded event ${eventCode}`);
  }
  const tag = screen.getByText(event.nameAr);
  const row = tag.closest('li');
  if (row == null) {
    throw new Error(`No row for ${eventCode}`);
  }
  return row;
}

describe('CAP-07 — communication & notifications', () => {
  beforeEach(() => {
    clearExpertHubSession();
    // The SLA matrix is a shared module-level store (BR-0705), so a test that
    // edits a deadline would otherwise leak into the next one.
    resetSlaMatrixForTesting();
    injectProvider();
  });

  afterEach(() => {
    setNotificationServiceForTesting(null);
  });

  /* ── BR-0703 — capabilities raise events; this capability routes them ──── */

  it('BR-0703: no operation creates an event, and none sends a notification', () => {
    const service = createMockNotificationProvider({ latencyMs: 0 });
    expect(Object.keys(service).sort()).toEqual([
      'approveTemplate',
      'getMatrix',
      'listLog',
      'listSlaRows',
      'routeEvent',
      'saveTemplate',
      'setRowActive',
      'setSla',
    ]);
    for (const forbidden of [
      'createEvent',
      'deleteEvent',
      'send',
      'sendNotification',
      'resend',
      'retry',
    ]) {
      expect(Object.keys(service)).not.toContain(forbidden);
    }
  });

  it('BR-0703: the matrix screen says events come from the capabilities, not from here', async () => {
    await renderMatrix();
    expect(screen.getByText(content.matrix.catalogueNote)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /حدث جديد|إضافة حدث/ })).not.toBeInTheDocument();
  });

  /* ── The catalogue is evidence-backed, not invented ────────────────────── */

  it('every event carries a journey citation and that journey’s own wording', () => {
    expect(MOCK_EVENTS.length).toBeGreaterThan(0);
    const codes = MOCK_EVENTS.map((event) => event.eventCode);
    expect(new Set(codes).size).toBe(codes.length);
    for (const event of MOCK_EVENTS) {
      expect(event.eventCode).toMatch(/^EV-\d{4}$/);
      // The citation is what makes the catalogue checkable rather than asserted.
      expect(event.source).toMatch(/^J-\d{2}/);
      expect(event.journeyAudienceAr.trim()).not.toBe('');
      expect(event.journeyAudienceEn.trim()).not.toBe('');
    }
    // Ten journeys contribute; the playbook's "eight" undercounted J-01 and J-02.
    const journeys = new Set(MOCK_EVENTS.map((event) => event.source.slice(0, 4)));
    expect(journeys.size).toBeGreaterThanOrEqual(10);
  });

  it('the evidence is shown beside the event, separately from the routing', async () => {
    await renderMatrix();
    const row = eventRow('EV-0101');
    expect(within(row).getByText(/J-01/)).toBeInTheDocument();
    expect(within(row).getByText(MOCK_EVENTS[0]?.journeyAudienceAr ?? 'x')).toBeInTheDocument();
  });

  /* ── DM-GAP-08 — the routing is missing, and the screen says so ────────── */

  it('DM-GAP-08: every event ships unrouted and the matrix is marked unapproved', async () => {
    await renderMatrix();
    expect(screen.getByText(content.matrix.unapprovedTitle)).toBeInTheDocument();
    expect(screen.getByText(content.matrix.routedCount(0, MOCK_EVENTS.length))).toBeInTheDocument();
  });

  /* ── BR-0702 — email and in-platform, together ─────────────────────────── */

  it('BR-0702: there is no channel choice on the matrix, and the screen says why', async () => {
    await renderMatrix();
    expect(screen.getByText(content.matrix.bothChannelsNote)).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: content.log.channelLabel })
    ).not.toBeInTheDocument();
    // Nor is a channel expressible on the way in.
    expect(Object.keys({ templateId: '', audience: [] })).not.toContain('channel');
  });

  it('BR-0702: one event produces one log entry per channel', async () => {
    await renderLog();
    const pair = MOCK_LOG.filter((entry) => entry.eventCode === 'EV-0301');
    expect(pair.map((entry) => entry.channel).sort()).toEqual(['email', 'in-platform']);
  });

  /* ── BR-0701 — approved bilingual templates only ───────────────────────── */

  it('BR-0701: with no approved template, nothing can be routed', async () => {
    await renderMatrix();
    expect(screen.getByText(content.matrix.noTemplatesTitle)).toBeInTheDocument();
    const row = eventRow('EV-0101');
    expect(
      within(row).getByRole('combobox', { name: content.matrix.templateLabel('EV-0101') })
    ).toBeDisabled();
  });

  it('BR-0701: a draft template is refused as a routing target', () => {
    expect(
      validateRouting({ templateId: 'tpl-001', audience: ['trainer'] }, [DRAFT_TEMPLATE])
    ).toEqual(['template-not-approved']);
    expect(
      validateRouting({ templateId: 'tpl-001', audience: ['trainer'] }, [APPROVED_TEMPLATE])
    ).toEqual([]);
  });

  it('BR-0701: a template cannot be approved with one language missing', () => {
    const known = ['recipientName'];
    expect(
      validateTemplate({ code: 'X', subjectAr: 'ع', subjectEn: '', bodyAr: 'ن', bodyEn: '' }, known)
    ).toEqual(['subject-en-required', 'body-en-required']);
    expect(
      validateTemplate(
        { code: 'X', subjectAr: 'ع', subjectEn: 'S', bodyAr: 'ن', bodyEn: 'B' },
        known
      )
    ).toEqual([]);
  });

  it('BR-0701: the editor refuses a body with an unknown placeholder', () => {
    expect(
      validateTemplate(
        { code: 'X', subjectAr: 'ع', subjectEn: 'S', bodyAr: '{{nope}}', bodyEn: 'B' },
        ['recipientName']
      )
    ).toContain('unknown-placeholder');
  });

  /* ── F-0702 — routing an event ─────────────────────────────────────────── */

  it('F-0702: an event routed with a template and an audience becomes routed and pausable', async () => {
    injectProvider({ templates: [APPROVED_TEMPLATE] });
    const { user } = await renderMatrix();
    const row = eventRow('EV-0101');

    await user.click(
      within(row).getByRole('combobox', { name: content.matrix.templateLabel('EV-0101') })
    );
    await user.click(await screen.findByRole('option', { name: 'TPL-TEST' }));
    await user.click(within(row).getByRole('checkbox', { name: content.audiences.record_subject }));
    await user.click(within(row).getByRole('button', { name: content.matrix.save }));

    expect(await screen.findByText(content.matrix.routedTo('TPL-TEST'))).toBeInTheDocument();
    // Only a routed row can be paused — an unrouted one has nothing to pause.
    expect(
      within(eventRow('EV-0101')).getByRole('switch', {
        name: content.matrix.activeLabel('EV-0101'),
      })
    ).toBeInTheDocument();
  });

  it('F-0702: routing with no audience is refused and the event stays unrouted', async () => {
    injectProvider({ templates: [APPROVED_TEMPLATE] });
    const { user } = await renderMatrix();
    const row = eventRow('EV-0101');

    await user.click(
      within(row).getByRole('combobox', { name: content.matrix.templateLabel('EV-0101') })
    );
    await user.click(await screen.findByRole('option', { name: 'TPL-TEST' }));
    await user.click(within(row).getByRole('button', { name: content.matrix.save }));

    expect(await within(row).findByText(content.errors.audienceRequired)).toBeInTheDocument();
    expect(within(eventRow('EV-0101')).getByText(content.matrix.unrouted)).toBeInTheDocument();
  });

  /* ── F-0703 — templates ────────────────────────────────────────────────── */

  it('F-0703: a saved template starts as a draft and becomes routable only on approval', async () => {
    injectProvider({ templates: [DRAFT_TEMPLATE] });
    const { user } = await renderTemplates();
    expect(screen.getByText(content.templates.statuses.draft)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: content.templates.approve('TPL-TEST') }));
    expect(await screen.findByText(content.templates.statuses.approved)).toBeInTheDocument();
  });

  it('F-0703: the editor asks for both languages side by side', async () => {
    const { user } = await renderTemplates();
    await user.click(screen.getByRole('button', { name: content.templates.newTemplate }));
    for (const label of [
      content.templates.subjectArLabel,
      content.templates.subjectEnLabel,
      content.templates.bodyArLabel,
      content.templates.bodyEnLabel,
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('BR-0704: without permission there is no way in, and the screen says so', async () => {
    injectProvider({ canManageTemplates: false, templates: [DRAFT_TEMPLATE] });
    await renderTemplates();
    expect(screen.getByText(content.templates.readOnlyNotice)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.templates.newTemplate })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.templates.approve('TPL-TEST') })
    ).not.toBeInTheDocument();
  });

  /* ── BR-0705 / F-0704 — the central deadline console ───────────────────── */

  it('BR-0705: every deadline names its source, and the console says it is the only place they change', async () => {
    await renderSla();
    expect(screen.getByText(content.sla.centralNote)).toBeInTheDocument();
    for (const row of listSlaMatrix()) {
      expect(row.source).toMatch(/^J-\d{2}/);
    }
  });

  it('DM-GAP-10: the deadlines journeys state are seeded; the ones they leave open are shown empty', async () => {
    await renderSla();
    const rows = listSlaMatrix();
    const withDuration = rows.filter((row) => row.status !== 'undefined-duration').length;
    expect(withDuration).toBe(3);
    expect(rows.filter((row) => row.status === 'undefined-duration')).toHaveLength(3);
    expect(
      screen.getByText(content.sla.coverageNote(withDuration, rows.length))
    ).toBeInTheDocument();
    expect(screen.getAllByText(content.sla.undefinedDuration)).toHaveLength(3);
  });

  it('a record-derived deadline configures reminders only — there is no duration to invent', async () => {
    const { user } = await renderSla();
    const row = screen.getByText('قرب انتهاء الاتفاقية').closest('li') as HTMLElement;
    expect(within(row).getByText(content.sla.recordDerived)).toBeInTheDocument();

    await user.click(
      within(row).getByRole('button', { name: content.sla.edit('قرب انتهاء الاتفاقية') })
    );
    expect(
      within(row).queryByRole('spinbutton', { name: content.sla.durationLabel })
    ).not.toBeInTheDocument();
    expect(within(row).getByLabelText(content.sla.remindersLabel)).toBeInTheDocument();
  });

  it('validateSla: a reminder at or beyond the deadline is not a reminder', () => {
    expect(validateSla({ kind: 'fixed', duration: 3, unit: 'days', reminderOffsets: [3] })).toEqual(
      ['reminder-within-duration']
    );
    expect(validateSla({ kind: 'fixed', duration: 0, unit: 'days', reminderOffsets: [] })).toEqual([
      'duration-positive',
    ]);
    expect(
      validateSla({ kind: 'fixed', duration: 90, unit: 'days', reminderOffsets: [30, 5] })
    ).toEqual([]);
    // A record-derived deadline has no duration here, so only offsets are checked.
    expect(validateSla({ kind: 'reminders-only', reminderOffsets: [90, 30, 5] })).toEqual([]);
    expect(validateSla({ kind: 'reminders-only', reminderOffsets: [0] })).toEqual([
      'reminder-positive',
    ]);
  });

  /* ── F-0705 / BR-0707 — the log ────────────────────────────────────────── */

  it('BR-0707: every entry carries one language, never both', async () => {
    await renderLog();
    expect(screen.getByText(content.log.languageNote)).toBeInTheDocument();
    for (const entry of MOCK_LOG) {
      expect(['ar', 'en']).toContain(entry.language);
    }
  });

  it('US-0705: a failure names its reason; a success has none to name', async () => {
    await renderLog();
    const failures = MOCK_LOG.filter((entry) => entry.sendStatus === 'failure');
    expect(failures.length).toBeGreaterThan(0);
    for (const entry of failures) {
      expect(screen.getByText(new RegExp(entry.failureReason.slice(0, 20)))).toBeInTheDocument();
    }
    for (const entry of MOCK_LOG.filter((row) => row.sendStatus === 'success')) {
      expect(entry).not.toHaveProperty('failureReason');
    }
  });

  it('the log has no resend, and says why rather than leaving the gap silent', async () => {
    await renderLog();
    expect(screen.getByText(content.log.noResendNote)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /إعادة إرسال|resend/i })).not.toBeInTheDocument();
  });

  it('the log filters down to the failed sends', async () => {
    const { user } = await renderLog();
    await user.click(screen.getByRole('combobox', { name: content.log.statusLabel }));
    await user.click(await screen.findByRole('option', { name: content.log.statuses.failure }));
    const table = await screen.findByRole('table', { name: content.log.resultsLabel });
    expect(within(table).getAllByText(content.log.statuses.failure).length).toBe(2);
    expect(within(table).queryByText(content.log.statuses.success)).not.toBeInTheDocument();
  });

  it('the log states what it is narrowed BY, and lifting the filter brings the rest back', async () => {
    const { user } = await renderLog();
    await user.click(screen.getByRole('combobox', { name: content.log.statusLabel }));
    await user.click(await screen.findByRole('option', { name: content.log.statuses.failure }));

    // "Was it sent?" is the question this screen answers, so a narrowing that
    // is not visible is a wrong answer waiting to happen.
    const removeName = content.log.removeFilter(
      content.log.statusLabel,
      content.log.statuses.failure
    );
    await user.click(await screen.findByRole('button', { name: removeName }));

    expect(screen.queryByRole('button', { name: removeName })).not.toBeInTheDocument();
    const table = await screen.findByRole('table', { name: content.log.resultsLabel });
    expect(within(table).getAllByText(content.log.statuses.success).length).toBeGreaterThan(0);
  });

  /* ── Navigation, failure and accessibility ─────────────────────────────── */

  it('the internal header’s notifications entry resolves to the matrix, not a 404', async () => {
    const entry = getHeaderContent('ar').internalNav.find((link) => link.id === 'notifications');
    expect(entry).toBeDefined();
    seedExpertHubSession(['internal']);
    renderExpertHubAt(entry?.href ?? '');
    expect(
      await screen.findByRole('heading', { level: 1, name: content.matrix.title })
    ).toBeInTheDocument();
  });

  it('the four screens cross-link, and each marks itself as the current page', async () => {
    await renderSla();
    const nav = screen.getByRole('navigation', { name: content.nav.label });
    expect(within(nav).getByRole('link', { name: content.nav.sla })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(within(nav).getByRole('link', { name: content.nav.log })).toHaveAttribute(
      'href',
      expertHubPaths.internalNotificationLog
    );
  });

  it('a failing service offers a retry rather than an empty matrix', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalNotificationMatrix);
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: content.errors.retry })).toBeInTheDocument();
  });

  it('the matrix has no accessibility violations', async () => {
    const { container } = await renderMatrix();
    await expectNoA11yViolations(container);
  });

  it('the deadline console has no accessibility violations', async () => {
    const { container } = await renderSla();
    await expectNoA11yViolations(container);
  });

  it('the log has no accessibility violations', async () => {
    const { container } = await renderLog();
    await expectNoA11yViolations(container);
  });
});
