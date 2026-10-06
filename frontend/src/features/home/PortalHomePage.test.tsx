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
import { setHomeServiceForTesting } from './homeService';
import { setProfileServiceForTesting } from '../profile/profileService';
import { createMockProfileProvider, MOCK_PROFILE } from '../profile/mockProfileProvider';
import { createMockHomeProvider, MOCK_HOME, MOCK_HOME_EMPTY } from './mockHomeProvider';
import type { MockHomeProviderOptions } from './mockHomeProvider';
import { getHomeContent } from './home.content';
import type { PortalHomeDto } from './home.types';

const content = getHomeContent('ar');
const NAME = MOCK_HOME.displayName;

function injectProvider(options: MockHomeProviderOptions = {}) {
  setHomeServiceForTesting(createMockHomeProvider({ latencyMs: 0, ...options }));
}

async function renderHome(name: string = NAME) {
  seedExpertHubSession(['trainer']);
  const result = renderExpertHubAt(expertHubPaths.home);
  await screen.findByRole('heading', { level: 1, name: content.greeting(name) });
  return result;
}

describe('EH-TP-01 — Portal Home', () => {
  beforeEach(() => {
    clearExpertHubSession();
    injectProvider();
  });

  afterEach(() => {
    setHomeServiceForTesting(null);
  });

  it('never calls somebody an accredited trainer on no evidence', async () => {
    /*
     * Reported from the testing server: somebody who had never applied was
     * greeted as «مدرب معتمد», because the API answered `certified` for anyone
     * with no trainer file — the absence of evidence read as the evidence.
     * Only a trainer carries a classification now.
     */
    injectProvider({ seed: MOCK_HOME_EMPTY });
    await renderHome(MOCK_HOME_EMPTY.displayName);

    expect(screen.queryByText(content.classifications.certified)).not.toBeInTheDocument();
    expect(screen.queryByText(content.classifications.expert)).not.toBeInTheDocument();
    // Named by the role they actually hold, instead.
    expect(screen.getByText(content.individualStanding)).toBeInTheDocument();
  });

  it('greets the trainer, shows classification + the personal metric tiles', async () => {
    await renderHome();
    expect(screen.getByText(content.classifications.expert)).toBeInTheDocument();
    for (const label of Object.values(content.metrics)) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
  });

  it('shows the calculated overall rating (P-06)', async () => {
    await renderHome();
    expect(
      await screen.findByRole('img', { name: content.rating.ariaLabel(4.5) })
    ).toBeInTheDocument();
  });

  it('surfaces a pending rating as a polite message, not a raw error', async () => {
    const seed: PortalHomeDto = { ...MOCK_HOME, ratingState: 'pending', overallRating: null };
    injectProvider({ seed });
    await renderHome();
    expect(await screen.findByText(content.rating.pending)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /من 5/ })).not.toBeInTheDocument();
  });

  it('previews recent notifications with an accessible unread marker', async () => {
    await renderHome();
    expect(await screen.findByText(content.notifications.heading)).toBeInTheDocument();
    // Unread items expose the text label (not colour-only).
    expect(screen.getAllByText(new RegExp(content.notifications.unread)).length).toBeGreaterThan(0);
  });

  it('offers quick links to the trainer sub-areas', async () => {
    await renderHome();
    const region = await screen.findByRole('region', { name: content.shortcuts.heading });
    expect(
      within(region).getByRole('link', { name: new RegExp(content.shortcuts.newApplicationTitle) })
    ).toHaveAttribute('href', expertHubPaths.applicationsNew);
    expect(
      within(region).getByRole('link', { name: new RegExp(content.shortcuts.profileTitle) })
    ).toHaveAttribute('href', expertHubPaths.profile);
  });

  it('shows the "no activity yet" empty state for a brand-new trainer', async () => {
    injectProvider({ seed: MOCK_HOME_EMPTY });
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.home);
    await screen.findByRole('heading', {
      level: 1,
      name: content.greeting(MOCK_HOME_EMPTY.displayName),
    });
    expect(screen.getByText(content.empty.title)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: content.empty.cta })).toHaveAttribute(
      'href',
      expertHubPaths.applicationsNew
    );
    // No metric tiles in the empty state.
    expect(screen.queryByText(content.metrics.total)).not.toBeInTheDocument();
  });

  it('shows an error state with retry on load failure, and recovers', async () => {
    injectProvider({ failWith: { status: 500, message: 'boom' } });
    seedExpertHubSession(['trainer']);
    const { user } = { user: userEvent.setup() };
    renderExpertHubAt(expertHubPaths.home);
    expect(await screen.findByText(content.errors.loadTitle)).toBeInTheDocument();
    injectProvider();
    await user.click(screen.getByRole('button', { name: content.errors.retry }));
    expect(
      await screen.findByRole('heading', { level: 1, name: content.greeting(NAME) })
    ).toBeInTheDocument();
  });

  it('switches language across the home page', async () => {
    const { user } = await renderHome();
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: getHomeContent('en').greeting(NAME) })
    ).toBeInTheDocument();
  });

  it('renders RTL by default', async () => {
    await renderHome();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container } = await renderHome();
    await screen.findByText(content.metrics.total);
    await expectNoA11yViolations(container);
  });
});

describe('J-14 — the completion prompt, only for a trainer who came from FAST', () => {
  // ⚠️ The prompt remembers a dismissal in `sessionStorage`, which survives
  // between tests in one file. Without this, «never appears» could pass
  // because an earlier test dismissed it — a green test proving nothing.
  beforeEach(() => sessionStorage.clear());
  afterEach(() => {
    setProfileServiceForTesting(null);
    sessionStorage.clear();
  });

  it('asks somebody with no Expert Hub file to complete their data', async () => {
    /*
     * Owner ruling, 2026-09-10: «it should pop up to complete the data when it
     * logs in, this only for the trainer come from the FAST».
     */
    injectProvider();
    setProfileServiceForTesting(
      createMockProfileProvider({
        latencyMs: 0,
        seed: { ...MOCK_PROFILE, establishedInExpertHub: false },
      })
    );

    await renderHome();

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(content.completeProfile.title)).toBeInTheDocument();

    // ⚠️ It says what is ALREADY filled, so the ask reads as «finish this»
    // rather than «start again» — they have given the Academy this data once.
    expect(within(dialog).getByText(content.completeProfile.fromAcademy)).toBeInTheDocument();
  });

  it('never appears for an accredited trainer', async () => {
    // ⚠️ The whole point of the flag. An accredited trainer has a file and
    // being told to complete it would be simply false.
    injectProvider();
    setProfileServiceForTesting(
      createMockProfileProvider({
        latencyMs: 0,
        seed: { ...MOCK_PROFILE, establishedInExpertHub: true },
      })
    );

    await renderHome();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays dismissed for the rest of the session', async () => {
    // A prompt that returns on every navigation stops being a prompt.
    injectProvider();
    setProfileServiceForTesting(
      createMockProfileProvider({
        latencyMs: 0,
        seed: { ...MOCK_PROFILE, establishedInExpertHub: false },
      })
    );

    const first = await renderHome();
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: content.completeProfile.later })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    first.unmount();

    await renderHome();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
