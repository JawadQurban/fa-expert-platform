import { Tag } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import type { SlaState } from '../types/sla';

/**
 * **P-J4 SLA indicator**, shared by every journey that attaches a deadline to a
 * hand-off (see `types/sla.ts`).
 *
 * State is conveyed by **text + Tag variant, never colour alone** (WCAG 1.4.1);
 * the localized label is injected, keeping this component copy-free so each
 * journey speaks in its own terms — internal staff read "3 days to decide", the
 * applicant reads "3 days to choose your interview time".
 */
const SLA_VARIANT: Readonly<Record<SlaState, TagVariant>> = {
  within: 'success',
  approaching: 'warning',
  breached: 'error',
};

export function SlaBadge({ state, label }: { readonly state: SlaState; readonly label: string }) {
  return (
    <Tag variant={SLA_VARIANT[state]} size="sm">
      {label}
    </Tag>
  );
}
