import type { Result } from '@/types';
import { expertHubConfig } from '../../app/config/expertHubConfig';

/**
 * Expert Hub API client abstraction. The frontend communicates **only** with
 * the future Expert Hub ASP.NET Core API — never with FAST / MTM / ERP / SQL
 * Server / SSO directly (`02C_APPLICATION_AND_INTEGRATION_ARCHITECTURE.md`;
 * boundary: React → Expert Hub API → those systems). Every feature service goes
 * through this client, so connecting the real backend later is a single
 * configuration change (`VITE_EXPERT_HUB_API_BASE_URL`).
 *
 * Returns a `Result` (never throws to the UI) so pages render error states
 * rather than crashing. Until the backend base URL is configured, calls resolve
 * to a typed "not connected" error — no page depends on this yet (the landing
 * is static), but feature services built later will.
 */
export interface ExpertHubApiError {
  readonly status: number;
  readonly message: string;
}

export interface ExpertHubApiClient {
  get<T>(path: string, init?: RequestInit): Promise<Result<T, ExpertHubApiError>>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<Result<T, ExpertHubApiError>>;
}

function joinUrl(baseUrl: string, path: string): string {
  if (baseUrl === '') {
    return path;
  }
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/**
 * A link the API serves (e.g. `/v1/attachments/{id}`) as the browser must open
 * it — against the API base, exactly as every fetch is. Used raw, such a path
 * resolved against the SPA's own origin and 404'd. Absolute URLs pass through.
 */
export function apiUrl(path: string, baseUrl: string = expertHubConfig.apiBaseUrl): string {
  return /^[a-z][a-z\d+.-]*:/i.test(path) ? path : joinUrl(baseUrl, path);
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body: unknown,
  init: RequestInit | undefined,
  baseUrl: string
): Promise<Result<T, ExpertHubApiError>> {
  if (baseUrl === '') {
    return {
      ok: false,
      error: {
        status: 0,
        message: 'Expert Hub API base URL is not configured (backend not connected).',
      },
    };
  }
  try {
    // A file goes as multipart and the browser writes the content-type,
    // boundary and all — setting it by hand produces a request no server can
    // parse. Everything else on this API is JSON.
    const isUpload = typeof FormData !== 'undefined' && body instanceof FormData;
    const response = await fetch(joinUrl(baseUrl, path), {
      method,
      headers: isUpload
        ? { ...(init?.headers ?? {}) }
        : { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      body: body == null ? undefined : isUpload ? body : JSON.stringify(body),
      ...init,
    });
    if (!response.ok) {
      // A ProblemDetails `detail` says WHY — "the file is larger than 1 MB"
      // rather than "Unprocessable Content". Keeping only the status text
      // threw that away and left every screen guessing.
      let message = response.statusText;
      try {
        const problem = (await response.json()) as { detail?: string; title?: string };
        message = problem.detail ?? problem.title ?? message;
      } catch {
        // Not JSON — the status text is all there is.
      }
      return { ok: false, error: { status: response.status, message } };
    }
    return { ok: true, value: (await response.json()) as T };
  } catch (cause) {
    return {
      ok: false,
      error: { status: 0, message: cause instanceof Error ? cause.message : 'Network error' },
    };
  }
}

export function createExpertHubApiClient(
  baseUrl: string = expertHubConfig.apiBaseUrl
): ExpertHubApiClient {
  return {
    get: (path, init) => request('GET', path, undefined, init, baseUrl),
    post: (path, body, init) => request('POST', path, body, init, baseUrl),
  };
}
