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
import type { ExpertHubApiClient } from '../../shared/services/apiClient';
import {
  createHttpNominationProvider,
  setNominationServiceForTesting,
} from './applicationsService';
import { getNewApplicationContent } from './newApplication.content';

const copy = getNewApplicationContent('ar').nomination;
const NOURA_ID = '7b1c0f6e-0000-4000-8000-000000000101';

describe('EH-INT-12 — internal nomination (J-02)', () => {
  beforeEach(() => {
    clearExpertHubSession();
    setNominationServiceForTesting(null);
  });

  afterEach(() => {
    setNominationServiceForTesting(null);
  });

  it('finds a user and links the form to their user id; a blocked user cannot be picked', async () => {
    seedExpertHubSession(['internal']);
    const { container } = renderExpertHubAt(expertHubPaths.internalNominations);
    await screen.findByRole('heading', { level: 1, name: copy.search.title });

    await userEvent.type(screen.getByLabelText(copy.search.label, { exact: false }), 'example');
    const table = await screen.findByRole('table', { name: copy.search.resultsLabel });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);

    const noura = rows.find((row) => within(row).queryByText('نورة السبيعي') != null)!;
    expect(within(noura).getByRole('link', { name: copy.search.select })).toHaveAttribute(
      'href',
      expertHubPaths.internalNomination(NOURA_ID)
    );
    const khalid = rows.find((row) => within(row).queryByText('خالد المطيري') != null)!;
    expect(within(khalid).queryByRole('link')).toBeNull();
    expect(within(khalid).getByText(copy.search.blocked['approved-trainer'])).toBeInTheDocument();

    await expectNoA11yViolations(container);
  });

  it('opens the application form on the nominee’s behalf, naming them', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalNomination(NOURA_ID));
    await screen.findByRole('heading', { level: 1, name: copy.title });
    expect(screen.getByText(copy.onBehalf('نورة السبيعي'))).toBeInTheDocument();
  });

  it('says so when the user id matches nobody', async () => {
    seedExpertHubSession(['internal']);
    renderExpertHubAt(expertHubPaths.internalNomination('no-such-user'));
    await screen.findByRole('heading', { name: copy.search.notFoundTitle });
    expect(screen.getByRole('link', { name: copy.backToSearch })).toHaveAttribute(
      'href',
      expertHubPaths.internalNominations
    );
  });

  it('sends every form call to the nominee’s routes, never to /me', async () => {
    const calls: string[] = [];
    const record = (path: string) => {
      calls.push(path);
      return Promise.resolve({ ok: true as const, value: null });
    };
    const client = { get: record, post: record } as unknown as ExpertHubApiClient;
    const form = createHttpNominationProvider(client).formFor('u-42');

    await form.startOrResumeDraft();
    await form.getApplicationPrefill();
    await form.saveDraft({ services: [], values: {} });
    await form.submitApplication({ services: [], values: {} });

    expect(calls).toEqual([
      'v1/internal/nominations/u-42/draft/start',
      'v1/internal/nominations/u-42/prefill',
      'v1/internal/nominations/u-42/draft',
      'v1/internal/nominations/u-42/submit',
    ]);
  });
});
