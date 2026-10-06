import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { createFailClosedIdentityProvider, setIdentityServiceForTesting } from './identityService';
import { createMockIdentityProvider } from './mockIdentityProvider';
import type { MockIdentityProviderOptions } from './mockIdentityProvider';
import { getActivationContent } from './activation.content';
import { getIdentityContent } from './identity.content';

const content = getActivationContent('ar');
const identityContent = getIdentityContent('ar');

function injectIdentity(options: MockIdentityProviderOptions = {}) {
  setIdentityServiceForTesting(createMockIdentityProvider({ latencyMs: 0, ...options }));
}

/**
 * ⚠️ MOCK tokens — the **suffix** selects the route (see
 * `mockIdentityProvider`). These are not real activation tokens.
 */
const TOKEN_YAQEEN = 'nom-2026-0001-yaqeen';
const TOKEN_EMAIL = 'nom-2026-0002-email';
const TOKEN_ACCOUNT = 'nom-2026-0003-account';
const TOKEN_EXPIRED = 'nom-2026-0004-expired';
const TOKEN_USED = 'nom-2026-0005-used';
const TOKEN_INVALID = 'not-a-real-token';

/** The nominee has no account — that is the whole point of this flow. */
function renderActivation(token: string) {
  clearExpertHubSession();
  return renderExpertHubAt(expertHubPaths.activate(token));
}

/** ⚠️ MOCK national IDs — the last digit selects the Yaqeen outcome. */
const ID_OK = '1000000004';
const ID_YAQEEN_FAILS = '1000000000';

describe('J-02/F4 — Nominee Account Activation & Portal Access', () => {
  beforeEach(() => {
    injectIdentity();
  });

  afterEach(() => {
    setIdentityServiceForTesting(null);
  });

  it('is reachable with no account at all', async () => {
    renderActivation(TOKEN_EMAIL);
    expect(
      await screen.findByRole('heading', { level: 1, name: content.heading })
    ).toBeInTheDocument();
  });

  it('says an application was submitted on the nominee’s behalf, before asking anything', async () => {
    renderActivation(TOKEN_EMAIL);
    await screen.findByRole('heading', { level: 1, name: content.heading });
    expect(screen.getByText(content.intro('عبدالله بن محمد العتيبي'))).toBeInTheDocument();
    expect(screen.getByText('EH-2026-00214')).toBeInTheDocument();
  });

  /* ── AC-4 — access does not depend on the screening stage ──────────────── */

  it('J-02/F4/AC-4: activates an application already deep in screening, and says access does not wait', async () => {
    const { user } = renderActivation(TOKEN_EMAIL);
    await screen.findByRole('heading', { level: 1, name: content.heading });
    // The seeded application is at `approval-in-progress`, not freshly submitted.
    expect(screen.getByText(content.statuses['approval-in-progress'])).toBeInTheDocument();
    expect(screen.getByText(content.accessNote)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: content.email.submit }));
    expect(await screen.findByText(content.success.title)).toBeInTheDocument();
    // Full portal access — both destinations are offered.
    expect(screen.getByRole('link', { name: content.success.openApplication })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: content.success.openPortal })).toHaveAttribute(
      'href',
      expertHubPaths.home
    );
  });

  /* ── AC-1 · AC-3 — the three routes ────────────────────────────────────── */

  it('J-02/F4/AC-1: a citizen/resident with no matched account verifies through Yaqeen', async () => {
    const { user } = renderActivation(TOKEN_YAQEEN);
    await screen.findByRole('heading', { level: 1, name: content.heading });
    expect(screen.getByText(content.yaqeen.heading)).toBeInTheDocument();

    await user.type(screen.getByLabelText(content.yaqeen.nationalIdLabel, { exact: false }), ID_OK);
    await user.type(screen.getByLabelText(content.yaqeen.dobLabel, { exact: false }), '1990-01-01');
    await user.click(screen.getByRole('button', { name: content.yaqeen.submit }));

    expect(await screen.findByText(content.success.title)).toBeInTheDocument();
  });

  it('J-02/F4/AC-2: a Yaqeen failure blocks activation with J-01’s handling', async () => {
    const { user } = renderActivation(TOKEN_YAQEEN);
    await screen.findByRole('heading', { level: 1, name: content.heading });
    await user.type(
      screen.getByLabelText(content.yaqeen.nationalIdLabel, { exact: false }),
      ID_YAQEEN_FAILS
    );
    await user.type(screen.getByLabelText(content.yaqeen.dobLabel, { exact: false }), '1990-01-01');
    await user.click(screen.getByRole('button', { name: content.yaqeen.submit }));

    expect(await screen.findByText(content.yaqeen.failedTitle)).toBeInTheDocument();
    // Blocked — no activation happened.
    expect(screen.queryByText(content.success.title)).not.toBeInTheDocument();
  });

  it('J-02/F4/AC-2: the field validation is J-01’s, message for message', async () => {
    const { user } = renderActivation(TOKEN_YAQEEN);
    await screen.findByRole('heading', { level: 1, name: content.heading });
    await user.type(screen.getByLabelText(content.yaqeen.nationalIdLabel, { exact: false }), '123');
    await user.click(screen.getByRole('button', { name: content.yaqeen.submit }));
    // The exact strings the J-01 gate shows — one rule, one wording.
    expect(
      await screen.findByText(identityContent.errors['national-id-format'])
    ).toBeInTheDocument();
    expect(screen.getByText(identityContent.errors['dob-required'])).toBeInTheDocument();
  });

  it('J-02/F4/AC-1: a foreigner/GCC nominee is not asked to verify again — the link was the proof', async () => {
    renderActivation(TOKEN_EMAIL);
    await screen.findByRole('heading', { level: 1, name: content.heading });
    expect(screen.getByText(content.email.description)).toBeInTheDocument();
    // No Yaqeen step, and no document form either.
    expect(screen.queryByRole('button', { name: content.yaqeen.submit })).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(content.yaqeen.nationalIdLabel, { exact: false })
    ).not.toBeInTheDocument();
  });

  it('J-02/F4/AC-3: a matched account signs in instead of re-verifying', async () => {
    renderActivation(TOKEN_ACCOUNT);
    await screen.findByRole('heading', { level: 1, name: content.heading });
    expect(screen.getByText(content.existingAccount.description)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: content.yaqeen.submit })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: content.existingAccount.submit })
    ).toBeInTheDocument();
  });

  /* ── token problems ────────────────────────────────────────────────────── */

  it('distinguishes an expired link from an invalid one', async () => {
    renderActivation(TOKEN_EXPIRED);
    expect(await screen.findByText(content.problems.expired.title)).toBeInTheDocument();

    setIdentityServiceForTesting(null);
    injectIdentity();
    renderActivation(TOKEN_INVALID);
    expect(await screen.findByText(content.problems.invalid.title)).toBeInTheDocument();
  });

  it('an already-used link offers the obvious next step: sign in', async () => {
    renderActivation(TOKEN_USED);
    const title = await screen.findByText(content.problems['already-used'].title);
    // Scoped to the page body: the site header also carries a sign-in link.
    const main = title.closest('section') as HTMLElement;
    expect(
      within(main).getByRole('link', { name: content.existingAccount.submit })
    ).toHaveAttribute('href', expertHubPaths.login);
  });

  it('RB-01: with no identity provider, the link is not resolved and nothing is activated', async () => {
    setIdentityServiceForTesting(createFailClosedIdentityProvider());
    renderActivation(TOKEN_YAQEEN);
    const title = await screen.findByRole('heading', { level: 1, name: content.unavailable.title });
    expect(screen.getByText(content.unavailable.body)).toBeInTheDocument();
    // No nominee context, no verification form, no retry that cannot succeed.
    expect(screen.queryByText(content.yaqeen.heading)).not.toBeInTheDocument();
    expect(screen.queryByText(content.success.title)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: content.errors.retry })).not.toBeInTheDocument();
    const main = title.closest('section') as HTMLElement;
    expect(
      within(main).getByRole('link', { name: content.existingAccount.submit })
    ).toHaveAttribute('href', expertHubPaths.login);
  });

  it('renders RTL by default and has no automatically-detectable a11y violations', async () => {
    const { container } = renderActivation(TOKEN_YAQEEN);
    await screen.findByRole('heading', { level: 1, name: content.heading });
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    await expectNoA11yViolations(container);
  });

  it('switches language on the activation page', async () => {
    const { user } = renderActivation(TOKEN_EMAIL);
    await screen.findByRole('heading', { level: 1, name: content.heading });
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: getActivationContent('en').heading,
      })
    ).toBeInTheDocument();
  });
});
