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
import { setInternalServiceForTesting } from './internalService';
import { createMockInternalProvider } from './mockInternalProvider';
import type { MockInternalProviderOptions } from './mockInternalProvider';
import { getInternalContent } from './internal.content';

const content = getInternalContent('ar').dashboard;
const STAFF = 'Test User';

function injectProvider(options: MockInternalProviderOptions = {}) {
  setInternalServiceForTesting(createMockInternalProvider({ latencyMs: 0, ...options }));
}

async function renderDashboard() {
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internal);
  await screen.findByRole('heading', { level: 1, name: content.greeting(STAFF) });
  return result;
}

describe('EH-INT-01 — Internal Dashboard', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setInternalServiceForTesting(null);
  });

  it('greets the staff member and renders the derived metric tiles', async () => {
    await renderDashboard();
    expect(screen.getByText(content.subtitle)).toBeInTheDocument();
    for (const label of Object.values(content.metrics)) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
  });

  it('a metric tile drills into the inbox filtered by its status', async () => {
    await renderDashboard();
    const tile = await screen.findByRole('link', {
      name: new RegExp(content.metrics['awaiting-screening']),
    });
    expect(tile.getAttribute('href')).toContain(`${expertHubPaths.internalApplications}?status=`);
    expect(tile.getAttribute('href')).toContain('status=submitted');
  });

  it('the material tile drills into the submission queue, not the inbox', async () => {
    // CAP-09/F-0902's third tile counts material submissions, which have no
    // application status — so it must not land on a filtered inbox URL.
    await renderDashboard();
    const tile = await screen.findByRole('link', {
      name: new RegExp(content.metrics['materials-awaiting-approval']),
    });
    expect(tile.getAttribute('href')).toBe(expertHubPaths.internalSubmissions);
    expect(tile.getAttribute('href')).not.toContain('status=');
  });

  it('previews recent submissions and links to the full inbox', async () => {
    await renderDashboard();
    // Newest submission in the mock pipeline.
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: content.recent.viewAll })).toHaveAttribute(
      'href',
      expertHubPaths.internalApplications
    );
  });

  it('J-02: offers NO nominate action — it opened the self-service form under the staff member’s own identity', async () => {
    await renderDashboard();
    // Loaded, so the whole page — not just its head — is what is checked.
    expect(await screen.findByText('د. سارة العتيبي')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ترشيح/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ترشيح/ })).not.toBeInTheDocument();
    expect(
      screen
        .queryAllByRole('link')
        .some((link) => link.getAttribute('href') === expertHubPaths.applicationsNew)
    ).toBe(false);
  });

  it('shows an error state with retry on load failure, and recovers', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['internal']);
    const { user } = { user: userEvent.setup() };
    renderExpertHubAt(expertHubPaths.internal);
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectProvider();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(
      await screen.findByRole('heading', { level: 1, name: content.greeting(STAFF) })
    ).toBeInTheDocument();
  });

  it('a permission denial says so, instead of looking like a broken page', async () => {
    // The feature gate answers 403 (`P-190`). Rendering that as "failed to
    // load" tells a working system it is broken, and sends the person to the
    // wrong place for help — it caused a false bug report once already.
    injectProvider({ failWith: { status: 403, message: 'Forbidden' } });
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internal);

    expect(await screen.findByText('لا تملك صلاحية الوصول')).toBeInTheDocument();
    expect(screen.queryByText(content.errors.loadTitle)).not.toBeInTheDocument();
    // And no retry button: retrying a 403 produces the same 403.
    expect(screen.queryByRole('button', { name: content.errors.retry })).not.toBeInTheDocument();
  });

  it('switches language across the dashboard', async () => {
    const { user } = await renderDashboard();
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: getInternalContent('en').dashboard.greeting(STAFF),
      })
    ).toBeInTheDocument();
  });

  it('renders RTL by default', async () => {
    await renderDashboard();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = await renderDashboard();
    await screen.findByText('د. سارة العتيبي');
    await expectNoA11yViolations(container);
  });

  /* ── The pipeline's health, and the figures it must not invent ─────────── */

  it('shows deadline performance against the SLA matrix', async () => {
    injectProvider();
    await renderDashboard();

    expect(await screen.findByText(content.sla.heading)).toBeInTheDocument();
    // The row that configures the figure, so a disputed number can be traced.
    expect(screen.getByText('SLA-0201')).toBeInTheDocument();
    // A real breach count, from a deadline that actually passed. The health
    // meter labels each stage's breaches, so the label appears once per row.
    expect(screen.getAllByText(content.sla.breaches).length).toBeGreaterThan(0);
  });

  it('never renders an absent target or an unmeasured stage as zero', async () => {
    /*
      ⚠️ The rule the whole table turns on. `targetDays: null` means the BRD
      states no duration (`DM-GAP-10`), and `actualDays: null` means the
      platform records only one end of the stage. Rendering either as «٠ يوم»
      tells somebody the stage is instantaneous, and staffing is planned on it.
    */
    injectProvider();
    await renderDashboard();

    await screen.findByText(content.sla.heading);
    expect(screen.getByText(content.sla.targetUndefined)).toBeInTheDocument();
    expect(screen.getByText(content.sla.notMeasured)).toBeInTheDocument();
  });

  it('states the distribution as counts, not only as bar lengths', async () => {
    // A bar cannot be read by a screen reader, and a percentage alone hides
    // that «٥٠٪» can mean one application out of two.
    injectProvider();
    await renderDashboard();

    const bars = await screen.findByRole('list', {
      name: content.distribution.label,
    });
    expect(within(bars).getByText('4')).toBeInTheDocument();
  });

  it('shows no week-on-week figure when there is no earlier week', async () => {
    // ⚠️ `submissionDelta: null` is «no comparison exists», not «no change».
    // A first week of operation must not report a triumphant +12, and must
    // not report «لا تغيّر» either.
    injectProvider();
    await renderDashboard();

    await screen.findByText(content.sla.heading);
    expect(screen.queryByText(content.delta.flat)).not.toBeInTheDocument();
  });
});
