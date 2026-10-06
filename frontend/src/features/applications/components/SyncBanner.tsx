import { Alert } from '@ds/composite';
import type { ApplicationDetailContent } from '../applicationDetail.content';
import type { SyncState } from '../applicationDetail.types';

/**
 * P-08 Synchronization Banner — a **separate** element from the business Status
 * Badge (`§0.9`). Shown only post-signature; carries the neutral trainer-facing
 * FAST-sync state (Processing / Synchronized). A stalled/failed sync never
 * reaches here as a raw failure — the service caps it at `processing`, and a
 * sync problem never reverts the Approved business status (`04` §J5).
 */
export function SyncBanner({
  sync,
  content,
}: {
  readonly sync: SyncState;
  readonly content: ApplicationDetailContent;
}) {
  if (sync === 'none') {
    return null;
  }
  return (
    <Alert
      tone={sync === 'synchronized' ? 'success' : 'info'}
      title={`${content.sync.heading} — ${content.sync.labels[sync]}`}
      role="status"
    >
      {sync === 'synchronized' ? content.sync.synchronizedBody : content.sync.processingBody}
    </Alert>
  );
}
