import { Tag } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import type { ApplicationPresentationStatus } from '../application.types';

/**
 * P-02 Status Badge — maps the aggregated trainer presentation status (`P-05`
 * 11-value vocabulary + the neutral `updating` partial state) onto the approved
 * `Tag` component. Status is always conveyed by **text + Tag shape/variant,
 * never color alone** (`04` EH-TP-02 §13); the localized label comes from the
 * page content, keeping this component copy-free. Business status only — FAST
 * sync state is never rendered on the trainer list (`04` §11).
 */
const STATUS_VARIANT: Readonly<Record<ApplicationPresentationStatus, TagVariant>> = {
  draft: 'neutral',
  submitted: 'information',
  'under-review': 'information',
  'interview-scheduled': 'information',
  'interview-completed': 'information',
  'approval-in-progress': 'information',
  approved: 'success',
  'agreement-pending': 'warning',
  active: 'success',
  rejected: 'error',
  closed: 'neutral',
  updating: 'neutral',
};

export function ApplicationStatusBadge({
  status,
  label,
}: {
  readonly status: ApplicationPresentationStatus;
  readonly label: string;
}) {
  return (
    <Tag variant={STATUS_VARIANT[status]} size="sm">
      {label}
    </Tag>
  );
}
