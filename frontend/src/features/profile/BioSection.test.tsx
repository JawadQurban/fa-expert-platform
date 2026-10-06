import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
  userEvent,
  within,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { setProfileServiceForTesting } from './profileService';
import type { ProfileService } from './profileService';
import { createMockProfileProvider, MOCK_PROFILE } from './mockProfileProvider';
import { getProfileContent } from './profile.content';
import type { MyProfileDto, TrainerBioDto } from './profile.types';

const content = getProfileContent('ar');

function withBio(bio: Partial<TrainerBioDto>): MyProfileDto {
  return { ...MOCK_PROFILE, bio: { ...MOCK_PROFILE.bio!, ...bio } };
}

async function renderBio(service: ProfileService) {
  setProfileServiceForTesting(service);
  seedExpertHubSession(['trainer']);
  renderExpertHubAt(expertHubPaths.profile);
  await screen.findByRole('heading', { level: 1, name: MOCK_PROFILE.displayName });
  return screen.getByRole('region', { name: content.bio.heading });
}

describe('P-331 — the short bio on My Profile', () => {
  beforeEach(() => clearExpertHubSession());
  afterEach(() => setProfileServiceForTesting(null));

  it('suggests a draft from the CV, and submitting sends it to review rather than publishing it', async () => {
    const section = await renderBio(createMockProfileProvider({ latencyMs: 0 }));
    expect(within(section).getByText(content.bio.status.none)).toBeInTheDocument();

    await userEvent.click(within(section).getByRole('button', { name: content.bio.draftFromCv }));
    expect(await within(section).findByText(content.bio.aiDraftBody)).toBeInTheDocument();
    const field = within(section).getByRole('textbox', { name: content.bio.label });
    expect((field as HTMLTextAreaElement).value).toMatch(/الامتثال المالي/);

    await userEvent.click(within(section).getByRole('button', { name: content.bio.submit }));
    expect(await within(section).findByText(content.bio.status.pending_review)).toBeInTheDocument();
    expect(screen.getByText(content.bio.submitted)).toBeInTheDocument();
    // Under review there is nothing to re-draft: the reviewer decides first.
    expect(
      within(section).queryByRole('button', { name: content.bio.draftFromCv })
    ).not.toBeInTheDocument();
  });

  it('says plainly when the AI is not switched on, so the trainer writes it instead', async () => {
    const mock = createMockProfileProvider({ latencyMs: 0 });
    const section = await renderBio({
      ...mock,
      requestBioDraft: () =>
        Promise.resolve({ ok: false, error: { status: 409, message: 'ai-unavailable' } }),
    });

    await userEvent.click(within(section).getByRole('button', { name: content.bio.draftFromCv }));
    expect(await within(section).findByText(content.bio.aiOff)).toBeInTheDocument();
  });

  it('shows why it was returned, and keeps the approved text visible while an edit waits', async () => {
    const section = await renderBio(
      createMockProfileProvider({
        latencyMs: 0,
        seed: withBio({
          status: 'returned',
          draft: 'نص معدَّل.',
          published: 'النبذة المعتمدة سابقًا.',
          reviewNote: 'يرجى ذكر المؤهل.',
          revision: 5,
        }),
      })
    );

    expect(within(section).getByText(content.bio.returnedTitle)).toBeInTheDocument();
    expect(within(section).getByText('يرجى ذكر المؤهل.')).toBeInTheDocument();
    expect(within(section).getByText('النبذة المعتمدة سابقًا.')).toBeInTheDocument();
    expect(within(section).getByText(content.bio.publishedWhileReview)).toBeInTheDocument();
  });

  it('offers no CV suggestion when there is no CV to read', async () => {
    const section = await renderBio(
      createMockProfileProvider({ latencyMs: 0, seed: withBio({ hasCv: false }) })
    );
    expect(
      within(section).queryByRole('button', { name: content.bio.draftFromCv })
    ).not.toBeInTheDocument();
    expect(within(section).getByRole('button', { name: content.bio.submit })).toBeDisabled();
  });
});
