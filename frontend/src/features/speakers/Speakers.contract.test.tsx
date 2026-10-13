import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import detail from '../../contracts/fixtures/internal.speaker-detail.json';
import list from '../../contracts/fixtures/internal.speakers.json';
import {
  clearExpertHubSession,
  renderExpertHubAt,
  screen,
  seedExpertHubSession,
} from '../../test/renderExpertHub';
import { expertHubPaths } from '../../app/router/paths';
import { fakeApiClient, keyPaths } from '../../contracts/fakeApiClient';
import { DEFAULT_SPEAKER_PAGE_SIZE } from './speaker.types';
import { createMockSpeakerProvider } from './mockSpeakerProvider';
import { getSpeakersContent } from './speakers.content';
import { createHttpSpeakerProvider, setSpeakerServiceForTesting } from './speakerService';

/**
 * J-04 **contract** tests. The list and the record run on the REAL HTTP
 * provider over a fake client that answers with what the API actually returned
 * in `SpeakerTests` (`internal.speakers.json`, `internal.speaker-detail.json`),
 * so the pages are proven against the server's shape, not the mock's idea of it.
 */

const content = getSpeakersContent('ar');
const LIST = `v1/internal/speakers?page=1&pageSize=${DEFAULT_SPEAKER_PAGE_SIZE}`;
const DETAIL = `v1/internal/speakers/${detail.speakerId}`;

describe('J-04 contract — speaker records against the real API responses', () => {
  beforeEach(() => {
    clearExpertHubSession();
    const { client } = fakeApiClient({ [LIST]: list, [DETAIL]: detail });
    setSpeakerServiceForTesting(createHttpSpeakerProvider(client));
    seedExpertHubSession(['internal']);
  });

  afterEach(() => {
    setSpeakerServiceForTesting(null);
  });

  it('the mock serves exactly the fixtures’ keys', async () => {
    const mock = createMockSpeakerProvider({ latencyMs: 0 });
    const served = await mock.listSpeakers({ search: '', page: 1 });
    expect(served.ok).toBe(true);
    if (!served.ok) return;
    expect(keyPaths(served.value)).toEqual(keyPaths(list));
    const record = await mock.getSpeaker(served.value.items[0].speakerId);
    expect(record.ok).toBe(true);
    if (!record.ok) return;
    expect(keyPaths(record.value)).toEqual(keyPaths(detail));
  });

  it('lists the served speaker and links to their record', async () => {
    renderExpertHubAt(expertHubPaths.internalSpeakers);
    const link = await screen.findByRole('link', { name: list.items[0].nameAr });
    expect(link).toHaveAttribute('href', expertHubPaths.internalSpeaker(list.items[0].speakerId));
  });

  it('opens the served record with the FAST email note and the pending history', async () => {
    renderExpertHubAt(expertHubPaths.internalSpeaker(detail.speakerId));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: `${detail.firstNameAr} ${detail.lastNameAr}`,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(content.detail.emailPendingFast)).toBeInTheDocument();
    expect(screen.getByText(content.detail.historyPendingTitle)).toBeInTheDocument();
    // An unavailable history is never presented as an empty one.
    expect(screen.queryByText(content.detail.historyEmpty)).not.toBeInTheDocument();
  });
});
