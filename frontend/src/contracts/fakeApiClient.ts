import type { Result } from '@/types';
import type { ExpertHubApiClient, ExpertHubApiError } from '../shared/services/apiClient';

/**
 * **Test helper** for contract tests: an `ExpertHubApiClient` that answers each
 * path with a recorded backend response from `contracts/fixtures/`, so a page
 * runs through its REAL HTTP provider instead of the mock.
 *
 * `errors` answers a path the way the API refuses it — the `detail` of a
 * ProblemDetails, which is all the real client keeps. Every POST is recorded so
 * a test can assert the path and body the page sent.
 */
export function fakeApiClient(
  routes: Readonly<Record<string, unknown>>,
  errors: Readonly<Record<string, ExpertHubApiError>> = {}
) {
  const posts: { readonly path: string; readonly body?: unknown }[] = [];
  const answer = <T>(path: string): Promise<Result<T, ExpertHubApiError>> =>
    Promise.resolve(
      path in errors
        ? { ok: false, error: errors[path] }
        : path in routes
          ? { ok: true, value: routes[path] as T }
          : { ok: false, error: { status: 404, message: `No fixture for ${path}` } }
    );
  const client: ExpertHubApiClient = {
    get: (path) => answer(path),
    post: (path, body) => {
      posts.push({ path, body });
      return answer(path);
    },
  };
  return { client, posts };
}

/**
 * Every key path in a JSON value (`.details.programName`, `.history[].price.amount`),
 * sorted — so a test can assert that a mock serves exactly the fixture's shape.
 * An array contributes its first element's paths; an empty one contributes none.
 */
export function keyPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.length === 0 ? [] : keyPaths(value[0], `${prefix}[]`);
  }
  if (value === null || typeof value !== 'object') {
    return [];
  }
  return Object.entries(value)
    .flatMap(([key, child]) => [`${prefix}.${key}`, ...keyPaths(child, `${prefix}.${key}`)])
    .sort();
}
