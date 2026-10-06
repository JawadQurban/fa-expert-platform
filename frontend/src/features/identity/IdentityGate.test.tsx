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
import { setApplicationsServiceForTesting } from '../applications/applicationsService';
import { createMockApplicationsProvider } from '../applications/mockApplicationsProvider';
import { getNewApplicationContent } from '../applications/newApplication.content';
import {
  IDENTITY_PROVIDER_NOT_CONFIGURED,
  createFailClosedIdentityProvider,
  getIdentityService,
  identityProviderKind,
  setIdentityServiceForTesting,
} from './identityService';
import { createMockIdentityProvider } from './mockIdentityProvider';
import type { MockIdentityProviderOptions } from './mockIdentityProvider';
import { getIdentityContent } from './identity.content';

const content = getIdentityContent('ar');
const formContent = getNewApplicationContent('ar');

function injectIdentity(options: MockIdentityProviderOptions = {}) {
  setIdentityServiceForTesting(createMockIdentityProvider({ latencyMs: 0, ...options }));
}

/** Open the application route as a **guest** — J-01's guest path. */
function renderAsGuest() {
  clearExpertHubSession();
  return renderExpertHubAt(expertHubPaths.applicationsNew);
}

/**
 * ⚠️ MOCK national IDs — the last digit selects the edge case (see
 * `mockIdentityProvider`). These are not real identity numbers.
 */
const ID_YAQEEN_FAILS = '1000000000';
const ID_ACTIVE_TRAINER = '1000000001';
const ID_OPEN_APPLICATION = '1000000002';
const ID_MATCHED_ELIGIBLE = '1000000003';
const ID_NO_MATCH = '1000000004';

/** Walk the Yaqeen path with a given id. */
async function verifyWithYaqeen(user: ReturnType<typeof renderAsGuest>['user'], id: string) {
  await user.click(screen.getByRole('radio', { name: content.idTypes['citizen-resident'] }));
  await user.type(screen.getByLabelText(content.yaqeen.nationalIdLabel, { exact: false }), id);
  await user.type(screen.getByLabelText(content.yaqeen.dobLabel, { exact: false }), '1990-01-01');
  await user.click(screen.getByRole('button', { name: content.yaqeen.submit }));
}

describe('J-01 — Identity Linking (the prerequisite layer)', () => {
  beforeEach(() => {
    injectIdentity();
    setApplicationsServiceForTesting(createMockApplicationsProvider({ latencyMs: 0 }));
  });

  afterEach(() => {
    setIdentityServiceForTesting(null);
    setApplicationsServiceForTesting(null);
  });

  it('renders the identity gate instead of the form for a guest', async () => {
    renderAsGuest();
    expect(
      await screen.findByRole('heading', { level: 2, name: content.heading })
    ).toBeInTheDocument();
    // The page keeps its H1; the form itself has not begun — the layer is a
    // prerequisite, not a sidebar.
    expect(screen.getByRole('heading', { level: 1, name: formContent.title })).toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: formContent.serviceStep.legend })
    ).not.toBeInTheDocument();
  });

  it('§3B row 1: an authenticated applicant skips the gate entirely', async () => {
    seedExpertHubSession(['trainer']);
    renderExpertHubAt(expertHubPaths.applicationsNew);
    // Straight into the form; no identity step at all.
    expect(
      await screen.findByRole('heading', { level: 1, name: formContent.title })
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: content.heading })).not.toBeInTheDocument();
  });

  it('§3A: the ID type decides the path — foreigners/GCC get no Yaqeen step', async () => {
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });

    await user.click(screen.getByRole('radio', { name: content.idTypes['citizen-resident'] }));
    expect(screen.getByRole('button', { name: content.yaqeen.submit })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: content.idTypes['foreigner-gcc'] }));
    expect(screen.queryByRole('button', { name: content.yaqeen.submit })).not.toBeInTheDocument();
    // The absence of Yaqeen is explained, not left looking broken.
    expect(screen.getByText(content.manual.description)).toBeInTheDocument();
  });

  it('validates the ID shape before calling Yaqeen', async () => {
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await user.click(screen.getByRole('radio', { name: content.idTypes['citizen-resident'] }));
    await user.type(screen.getByLabelText(content.yaqeen.nationalIdLabel, { exact: false }), '123');
    await user.click(screen.getByRole('button', { name: content.yaqeen.submit }));
    expect(await screen.findByText(content.errors['national-id-format'])).toBeInTheDocument();
    expect(await screen.findByText(content.errors['dob-required'])).toBeInTheDocument();
  });

  /* ── J-01 §5 — the five decision-table rows ────────────────────────────── */

  it('§5: Yaqeen failure blocks progress with a clear error', async () => {
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await verifyWithYaqeen(user, ID_YAQEEN_FAILS);
    expect(await screen.findByText(content.yaqeen.failedTitle)).toBeInTheDocument();
    expect(screen.getByText(content.yaqeen.failedBody)).toBeInTheDocument();
    // No way onward from a failed verification.
    expect(
      screen.queryByRole('button', { name: content.outcomes.continueToForm })
    ).not.toBeInTheDocument();
  });

  it('§5: an active Trainer role is blocked and sent to add a service (J-03, not a new J-01)', async () => {
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await verifyWithYaqeen(user, ID_ACTIVE_TRAINER);
    expect(await screen.findByText(content.outcomes.blockedTrainerTitle)).toBeInTheDocument();
    // Blocked — but with the exit the journey names.
    expect(
      screen.getByRole('link', { name: content.outcomes.blockedTrainerAction })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: content.outcomes.continueToForm })
    ).not.toBeInTheDocument();
  });

  it('§5: an open application is blocked and linked for tracking', async () => {
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await verifyWithYaqeen(user, ID_OPEN_APPLICATION);
    expect(await screen.findByText(content.outcomes.blockedOpenTitle)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: content.outcomes.blockedOpenAction })).toHaveAttribute(
      'href',
      expertHubPaths.applicationDetail('app-011')
    );
  });

  it('§5: a matched account with a closed previous application may apply again', async () => {
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await verifyWithYaqeen(user, ID_MATCHED_ELIGIBLE);
    expect(await screen.findByText(content.outcomes.matchedTitle)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.outcomes.continueToForm }));
    // Into the form — and, being account-linked, with no guest banner.
    expect(
      await screen.findByRole('heading', { level: 1, name: formContent.title })
    ).toBeInTheDocument();
    expect(screen.queryByText(content.guest.bannerTitle)).not.toBeInTheDocument();
  });

  it('§5: no match → the applicant fills the form as a guest', async () => {
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await verifyWithYaqeen(user, ID_NO_MATCH);
    expect(await screen.findByText(content.outcomes.noMatchTitle)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.outcomes.continueToForm }));
    expect(await screen.findByText(content.guest.bannerTitle)).toBeInTheDocument();
  });

  /* ── governing rule 2 — a guest fills, but cannot save ─────────────────── */

  it('rule 2: a guest may fill the form but is redirected to sign in when saving a draft', async () => {
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await verifyWithYaqeen(user, ID_NO_MATCH);
    await user.click(screen.getByRole('button', { name: content.outcomes.continueToForm }));
    await screen.findByText(content.guest.bannerTitle);

    await user.click(screen.getByRole('button', { name: formContent.actions.saveDraft }));
    const blocked = await screen.findByRole('alert');
    expect(within(blocked).getByText(content.guest.saveDraftBlockedTitle)).toBeInTheDocument();
    // Scoped: the page header also carries a sign-in link.
    expect(within(blocked).getByRole('link', { name: content.guest.signInAction })).toHaveAttribute(
      'href',
      expertHubPaths.login
    );
  });

  /* ── the manual path ───────────────────────────────────────────────────── */

  it('§3B: the foreigner/GCC path defers matching to submission', async () => {
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await user.click(screen.getByRole('radio', { name: content.idTypes['foreigner-gcc'] }));
    await user.type(
      screen.getByLabelText(content.manual.documentNumberLabel, { exact: false }),
      'P1234567'
    );
    await user.type(screen.getByLabelText(content.manual.dobLabel, { exact: false }), '1988-05-05');
    await user.type(
      screen.getByLabelText(content.manual.fullNameLabel, { exact: false }),
      'John Smith'
    );
    await user.click(screen.getByRole('button', { name: content.manual.submit }));

    // Verified-title with the deferred explanation: no live match was attempted.
    expect(await screen.findByText(content.manual.deferredNote)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: content.outcomes.continueToForm }));
    // Still a guest — no account was linked, so no draft saving.
    expect(await screen.findByText(content.guest.bannerTitle)).toBeInTheDocument();
  });

  /* ── RB-01 — mock identity only in an explicit demo build ──────────────── */

  it('RB-01: mock identity is chosen only when the app is explicitly on demo data', () => {
    // A deployment with real modules whose identity backend is not live.
    expect(
      identityProviderKind({
        identityLive: false,
        apiBaseUrl: 'https://experts.example/api',
        dataMode: 'api',
      })
    ).toBe('fail-closed');
    expect(
      identityProviderKind({
        identityLive: true,
        apiBaseUrl: 'https://experts.example/api',
        dataMode: 'api',
      })
    ).toBe('http');
    // Explicit demo: no backend at all, or `EXPERT_HUB_DATA_MODE=mock`.
    expect(identityProviderKind({ identityLive: false, apiBaseUrl: '', dataMode: 'api' })).toBe(
      'mock'
    );
    expect(
      identityProviderKind({
        identityLive: false,
        apiBaseUrl: 'https://experts.example/api',
        dataMode: 'mock',
      })
    ).toBe('mock');
  });

  it('RB-01: the fail-closed provider verifies nothing, and says why', async () => {
    const service = createFailClosedIdentityProvider();
    const verified = await service.verifyWithYaqeen({
      nationalId: ID_NO_MATCH,
      dateOfBirth: '1990-01-01',
    });
    expect(verified).toEqual({
      ok: false,
      error: { status: 503, message: IDENTITY_PROVIDER_NOT_CONFIGURED },
    });
  });

  it('RB-01: with no identity provider, the guest is told to sign in — never shown a result', async () => {
    setIdentityServiceForTesting(createFailClosedIdentityProvider());
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await verifyWithYaqeen(user, ID_NO_MATCH);

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(content.unavailable.title)).toBeInTheDocument();
    // Scoped to the page body: the site header also carries a sign-in link.
    const main = alert.closest('section') as HTMLElement;
    expect(within(main).getByRole('link', { name: content.guest.signInAction })).toHaveAttribute(
      'href',
      expertHubPaths.login
    );
    // No fabricated verification, no Yaqeen "mismatch", no way into the form.
    for (const text of [
      content.outcomes.noMatchTitle,
      content.outcomes.matchedTitle,
      content.outcomes.verifiedTitle,
      content.yaqeen.failedTitle,
    ]) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(
      screen.queryByRole('button', { name: content.outcomes.continueToForm })
    ).not.toBeInTheDocument();
  });

  it('RB-01: the manual path fails closed the same way', async () => {
    setIdentityServiceForTesting(createFailClosedIdentityProvider());
    const { user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await user.click(screen.getByRole('radio', { name: content.idTypes['foreigner-gcc'] }));
    await user.type(
      screen.getByLabelText(content.manual.documentNumberLabel, { exact: false }),
      'P1234567'
    );
    await user.type(screen.getByLabelText(content.manual.dobLabel, { exact: false }), '1988-05-05');
    await user.type(
      screen.getByLabelText(content.manual.fullNameLabel, { exact: false }),
      'John Smith'
    );
    await user.click(screen.getByRole('button', { name: content.manual.submit }));
    expect(await screen.findByText(content.unavailable.title)).toBeInTheDocument();
    expect(screen.queryByText(content.manual.deferredNote)).not.toBeInTheDocument();
  });

  it('RB-01: in this explicit demo build (no API configured) the default service is still the mock', async () => {
    setIdentityServiceForTesting(null);
    const verified = await getIdentityService().verifyWithYaqeen({
      nationalId: ID_NO_MATCH,
      dateOfBirth: '1990-01-01',
    });
    expect(verified.ok).toBe(true);
  });

  it('states that verification is not eligibility (governing rule 3)', async () => {
    renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    expect(screen.getByText(content.verificationNote)).toBeInTheDocument();
  });

  it('has no automatically-detectable accessibility violations', async () => {
    const { container, user } = renderAsGuest();
    await screen.findByRole('heading', { level: 2, name: content.heading });
    await user.click(screen.getByRole('radio', { name: content.idTypes['citizen-resident'] }));
    await expectNoA11yViolations(container);
  });
});
