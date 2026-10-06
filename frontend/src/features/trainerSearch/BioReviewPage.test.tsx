import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  expectNoA11yViolations,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  userEvent,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { setTrainerSearchServiceForTesting } from './trainerSearchService';
import type { TrainerSearchService } from './trainerSearchService';
import { createMockTrainerSearchProvider } from './mockTrainerSearchProvider';
import { getBioReviewContent } from './bioReview.content';

const content = getBioReviewContent('ar');

async function renderReview(service: TrainerSearchService) {
  setTrainerSearchServiceForTesting(service);
  seedExpertHubSession(['internal']);
  const result = renderExpertHubAt(expertHubPaths.internalTrainerBios);
  await screen.findByRole('heading', { level: 2, name: 'نورة القحطاني' });
  return result;
}

describe('P-331 — staff review of short bios', () => {
  beforeEach(() => clearExpertHubSession());
  afterEach(() => setTrainerSearchServiceForTesting(null));

  it('approves the text exactly as shown, and the queue empties', async () => {
    const { container } = await renderReview(createMockTrainerSearchProvider({ latencyMs: 0 }));
    expect(screen.getByText(content.sourceAi)).toBeInTheDocument();
    await expectNoA11yViolations(container);

    await userEvent.click(screen.getByRole('button', { name: content.approve }));
    expect(await screen.findByText(content.approved('نورة القحطاني'))).toBeInTheDocument();
    expect(screen.getByText(content.empty.title)).toBeInTheDocument();
  });

  it('will not return a bio without saying why', async () => {
    await renderReview(createMockTrainerSearchProvider({ latencyMs: 0 }));

    await userEvent.click(screen.getByRole('button', { name: content.returnAction }));
    await userEvent.click(screen.getByRole('button', { name: content.confirmReturn }));
    expect(screen.getByText(content.noteRequired)).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('textbox', { name: new RegExp(content.noteLabel) }),
      'يرجى ذكر المؤهل.'
    );
    await userEvent.click(screen.getByRole('button', { name: content.confirmReturn }));
    expect(await screen.findByText(content.returned('نورة القحطاني'))).toBeInTheDocument();
  });

  it('refuses a decision on a bio the trainer edited since, and reloads it', async () => {
    const mock = createMockTrainerSearchProvider({ latencyMs: 0 });
    await renderReview({
      ...mock,
      decideBio: () =>
        Promise.resolve({ ok: false, error: { status: 409, message: 'Already changed.' } }),
    });

    await userEvent.click(screen.getByRole('button', { name: content.approve }));
    expect(await screen.findByText(content.conflict)).toBeInTheDocument();
    // Reloaded, still waiting — nothing was approved.
    expect(
      await screen.findByRole('heading', { level: 2, name: 'نورة القحطاني' })
    ).toBeInTheDocument();
  });
});
