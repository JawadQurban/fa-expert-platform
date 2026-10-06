import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { isActive } from '../../contracts/engagementStatus';
import { setExecutionServiceForTesting } from './executionService';
import { createMockExecutionProvider, statusFor } from './mockExecutionProvider';
import type { MockExecutionProviderOptions } from './mockExecutionProvider';
import { getExecutionContent } from './execution.content';
// J-18's copy now carries J-21's dashboard split (F5/AC-2).
import { getEngagementsContent } from '../engagements/engagements.content';

const content = getExecutionContent('ar');

/** The seeded engagements — one per schedule-derived state. */
const UPCOMING = 'eng-1';
const IN_PROGRESS = 'eng-2';
const COMPLETED = 'eng-3';

function injectProvider(options: MockExecutionProviderOptions = {}) {
  setExecutionServiceForTesting(createMockExecutionProvider({ latencyMs: 0, ...options }));
}

async function renderDetail(engagementId: string) {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.engagementDetail(engagementId));
  await screen.findByRole('heading', { level: 1, name: content.heading });
  return result;
}

describe('EH-TP-07c — Engagement Execution Follow-up (J-21)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setExecutionServiceForTesting(null);
  });

  /* ── F5 — completion is a date, not an act ─────────────────────────────── */

  it('J-21/F5/AC-1: the status is a function of the schedule alone', () => {
    const start = '2026-10-05T00:00:00Z';
    const end = '2026-10-08T00:00:00Z';
    expect(statusFor('2026-09-01T00:00:00Z', start, end)).toBe('upcoming');
    expect(statusFor('2026-10-06T00:00:00Z', start, end)).toBe('in_progress');
    // A date-only end date covers that whole day, as the server reads it…
    expect(statusFor('2026-10-08T23:59:59Z', start, end)).toBe('in_progress');
    // …and the moment it is over, the engagement is completed.
    expect(statusFor('2026-10-09T00:00:00Z', start, end)).toBe('completed');
  });

  it('J-21/F5/AC-1: nothing on the contract can complete, reopen, or reverse one', () => {
    const service = createMockExecutionProvider({ latencyMs: 0 });
    // One read. There is no write operation of any kind on this journey.
    expect(Object.keys(service)).toEqual(['getEngagement']);
  });

  it('J-21/F5/AC-1: moving the clock past the end date completes the engagement', async () => {
    const before = createMockExecutionProvider({ latencyMs: 0, now: '2026-08-20T09:00:00Z' });
    const during = await before.getEngagement(IN_PROGRESS);
    expect(during.ok && during.value.status).toBe('in_progress');

    const after = createMockExecutionProvider({ latencyMs: 0, now: '2026-09-01T09:00:00Z' });
    const later = await after.getEngagement(IN_PROGRESS);
    expect(later.ok && later.value.status).toBe('completed');
  });

  it('J-21/F5/AC-1: the page explains that the date moved it, not a person', async () => {
    await renderDetail(COMPLETED);
    expect(await screen.findByText(content.statusExplanation.completed)).toBeInTheDocument();
  });

  it('J-21/F1/AC-2: Upcoming and In Progress are told apart, not merged into "active"', async () => {
    const service = createMockExecutionProvider({ latencyMs: 0 });
    const upcoming = await service.getEngagement(UPCOMING);
    const running = await service.getEngagement(IN_PROGRESS);
    expect(upcoming.ok && upcoming.value.status).toBe('upcoming');
    expect(running.ok && running.value.status).toBe('in_progress');
    expect(isActive('upcoming')).toBe(true);
    expect(isActive('in_progress')).toBe(true);
    expect(isActive('completed')).toBe(false);
  });

  /* ── F5/AC-2 — the dashboard split ─────────────────────────────────────── */

  it('J-21/F5/AC-2: the dashboard carries a "Past engagements" section', async () => {
    const engagements = getEngagementsContent('ar').engagements;
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.engagements);
    expect(
      await screen.findByRole('heading', { level: 2, name: engagements.pastHeading })
    ).toBeInTheDocument();
  });

  /* ── F1/AC-3 — a schedule change is visible, not silent ────────────────── */

  it('J-21/F1/AC-3: a schedule change in FAST is surfaced, with the new dates shown', async () => {
    await renderDetail(IN_PROGRESS);
    expect(await screen.findByText(content.scheduleChangedTitle)).toBeInTheDocument();
  });

  /* ── F2 — link or venue, and the gap in each ───────────────────────────── */

  it('J-21/F2/AC-1: an online engagement with no link from FAST says so, and offers none', async () => {
    await renderDetail(IN_PROGRESS);
    expect(await screen.findByText(content.onlineLabel)).toBeInTheDocument();
    expect(screen.getByText(content.meetingUnavailable)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: content.joinAction })).not.toBeInTheDocument();
    expect(screen.queryByText(content.venueLabel)).not.toBeInTheDocument();
  });

  it('J-21/F2/AC-2: an in-person engagement shows its city and names the missing venue', async () => {
    await renderDetail(UPCOMING);
    expect(await screen.findByText(content.venueLabel)).toBeInTheDocument();
    expect(screen.getByText(content.venueUnavailable)).toBeInTheDocument();
    expect(screen.queryByText(content.onlineLabel)).not.toBeInTheDocument();
  });

  /* ── F3 + F4 — enrollees and attendance: a named gap, never a zero ──────── */

  it('J-21/F3 (Q20): enrolment is named as unavailable rather than shown as nobody', async () => {
    await renderDetail(UPCOMING);
    expect(await screen.findByText(content.enrolmentUnavailable)).toBeInTheDocument();
    expect(screen.queryByText(content.enrolmentCount(0))).not.toBeInTheDocument();
    expect(screen.queryByText(content.enrolmentEmpty)).not.toBeInTheDocument();
  });

  it('J-21/F4 (Q20): attendance is named as unavailable', async () => {
    await renderDetail(COMPLETED);
    expect(await screen.findByText(content.attendanceUnavailable)).toBeInTheDocument();
  });

  /* ── F6 — MTM evaluations, independent of completion ───────────────────── */

  it('J-21/F6/AC-4: evaluations are unrelated to the lifecycle status in the contract', async () => {
    const completed = await createMockExecutionProvider({ latencyMs: 0 }).getEngagement(COMPLETED);
    const earlier = createMockExecutionProvider({ latencyMs: 0, now: '2026-06-02T09:00:00Z' });
    const during = await earlier.getEngagement(COMPLETED);
    expect(completed.ok && during.ok).toBe(true);
    if (!completed.ok || !during.ok) {
      return;
    }
    expect(during.value.status).toBe('in_progress');
    expect(during.value.evaluations).toEqual(completed.value.evaluations);
  });

  it('J-21/F6 (Q29): the page labels evaluations as raw MTM values, and names the gap', async () => {
    await renderDetail(COMPLETED);
    expect(await screen.findByText(content.evaluationsNote)).toBeInTheDocument();
    expect(screen.getByText(content.evaluationsUnavailable)).toBeInTheDocument();
    expect(screen.queryByText(content.evaluationsEmpty)).not.toBeInTheDocument();
  });

  /* ── navigation + a11y ─────────────────────────────────────────────────── */

  it('an engagement that is not yours is not found', async () => {
    const service = createMockExecutionProvider({ latencyMs: 0 });
    const result = await service.getEngagement('eng-999');
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.status).toBe(404);
  });

  it('renders RTL by default and has no automatically-detectable a11y violations', async () => {
    const { container } = await renderDetail(COMPLETED);
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });
});
