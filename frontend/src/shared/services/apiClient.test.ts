import { describe, expect, it } from 'vitest';
import { apiUrl } from './apiClient';

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
