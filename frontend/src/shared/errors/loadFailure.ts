import type { Locale } from '@/types';
import type { ExpertHubApiError } from '../services/apiClient';

/**
 * What a page shows when a load fails — and, specifically, the difference
 * between "something went wrong" and "this is not yours to see".
 *
 * A feature gate answers **403** with the feature code it wanted (`P-190`).
 * Rendering that as a generic load error tells a person their system is
 * broken when in fact it is working exactly as configured, and it sends them
 * to the wrong place for help: an administrator can grant a permission, and
 * nobody can fix a failure that did not happen.
 *
 * The detail pages (screening, the committee, the interview, an agreement, an
 * application) already carry their own `unauthorized` copy, worded for the one
 * record they open. This is for the **list and console pages**, where the
 * message is the same everywhere and worth saying once.
 */
export interface LoadFailureCopy {
  readonly title: string;
  readonly body: string;
  /** False for a denial: retrying a 403 produces the same 403. */
  readonly canRetry: boolean;
}

const FORBIDDEN: Readonly<Record<Locale, { readonly title: string; readonly body: string }>> = {
  ar: {
    title: 'لا تملك صلاحية الوصول',
    body: 'ليست لديك الصلاحية اللازمة لعرض هذه الصفحة. تواصل مع مشرف النظام إذا كان عملك يتطلّبها.',
  },
  en: {
    title: 'You do not have access',
    body: 'You do not have permission to view this page. Contact a system administrator if your work requires it.',
  },
};

/**
 * Picks the message for a failed load. A 403 gets the permission wording and
 * loses its retry button; everything else keeps the page's own copy, which is
 * where a page says what it was trying to load.
 */
export function describeLoadFailure(
  error: ExpertHubApiError | null | undefined,
  locale: Locale,
  fallback: { readonly title: string; readonly body: string }
): LoadFailureCopy {
  if (error?.status === 403) {
    return { ...FORBIDDEN[locale], canRetry: false };
  }
  return { title: fallback.title, body: fallback.body, canRetry: true };
}
