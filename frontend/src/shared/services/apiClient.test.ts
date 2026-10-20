import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl, createExpertHubApiClient } from './apiClient';

describe('apiUrl — links the API serves', () => {
  it('opens an API path against the API base, as every fetch is', () => {
    expect(apiUrl('/v1/attachments/abc', 'https://experts.fa.gov.sa/api')).toBe(
      'https://experts.fa.gov.sa/api/v1/attachments/abc'
    );
    expect(apiUrl('/v1/attachments/abc', 'https://experts.fa.gov.sa/api/')).toBe(
      'https://experts.fa.gov.sa/api/v1/attachments/abc'
    );
  });

  it('leaves an absolute URL, and a path with no API configured, as they are', () => {
    expect(apiUrl('https://cdn.example.com/photo.png', 'https://experts.fa.gov.sa/api')).toBe(
      'https://cdn.example.com/photo.png'
    );
    expect(apiUrl('/v1/attachments/abc', '')).toBe('/v1/attachments/abc');
  });
});

describe('request — what a response becomes', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads an empty success body as null, not as a failure (RUN-020)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 200 })));
    const result = await createExpertHubApiClient('https://api.test').post('/v1/x', {});
    expect(result).toEqual({ ok: true, value: null });
  });

  it("carries a problem's `reason` so a screen can say it in Arabic", async () => {
    const problem = JSON.stringify({ detail: 'This document accepts 1 file(s).', reason: 'count' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(problem, { status: 422, statusText: 'x' }))
    );
    const result = await createExpertHubApiClient('https://api.test').post('/v1/x', {});
    expect(result).toEqual({
      ok: false,
      error: { status: 422, message: 'This document accepts 1 file(s).', reason: 'count' },
    });
  });
});
